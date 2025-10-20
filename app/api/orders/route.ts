import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient"; // adjust if your file path differs

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // 🧠 Validate required fields
    const required = ["customer_name", "phone_number", "branch", "items", "total"];
    for (const field of required) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // 🧾 Insert order into Supabase
    const { data, error } = await supabase.from("orders").insert([
      {
        customer_name: body.customer_name,
        phone_number: body.phone_number,
        email: body.email || null,
        branch: body.branch,
        items: body.items, // should be an array of { name, quantity, price }
        total: body.total,
        status: "pending",
      },
    ]);

    if (error) {
      console.error("Supabase insert error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: "Order submitted successfully", data });
  } catch (err: any) {
    console.error("Unexpected error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
