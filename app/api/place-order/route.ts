import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Service role client — server-side only, never exposed to the browser.
// Bypasses RLS so the anon INSERT policy is not needed.
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Per-year seeds so order numbers don't reveal real volume.
// actual count = order_number − YEAR_SEEDS[year]
const YEAR_SEEDS: Record<string, number> = {
  "26": 4829, // 2026 — reset after DB wipe 28 Sep 2026
};

async function generateOrderNumber(): Promise<string> {
  const currentYear = new Date().getFullYear().toString().slice(-2);
  const seed = YEAR_SEEDS[currentYear] ?? 4829;

  try {
    const { data, error } = await supabaseAdmin
      .from("orders")
      .select("order_number")
      .like("order_number", `Amal${currentYear}#%`)
      .order("order_number", { ascending: false })
      .limit(1);

    if (error) throw error;

    let nextSeq = seed;
    if (data && data.length > 0) {
      const match = data[0].order_number?.match(/#(\d+)$/);
      if (match) nextSeq = parseInt(match[1], 10) + 1;
    }

    return `Amal${currentYear}#${String(nextSeq).padStart(4, "0")}`;
  } catch {
    return `Amal${currentYear}#${String(seed).padStart(4, "0")}`;
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const required = ["customer_name", "cell_number", "branch", "region", "payment_method", "items", "total"];
    for (const field of required) {
      if (body[field] === undefined || body[field] === null || body[field] === "") {
        return NextResponse.json({ error: `Missing required field: ${field}` }, { status: 400 });
      }
    }

    const orderNumber = await generateOrderNumber();

    const { data, error } = await supabaseAdmin
      .from("orders")
      .insert([{
        order_number:   orderNumber,
        customer_name:  body.customer_name,
        phone_number:   body.phone_number || body.cell_number,
        cell_number:    body.cell_number,
        email:          body.email || null,
        branch:         body.branch,
        region:         body.region,
        payment_method: body.payment_method,
        items:          body.items,
        total:          body.total,
        status:         "pending",
      }])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ data });
  } catch (err: any) {
    console.error("place-order failed:", err);
    return NextResponse.json({ error: err.message || "Failed to place order" }, { status: 500 });
  }
}
