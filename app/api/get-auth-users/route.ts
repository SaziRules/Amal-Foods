import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // must be your Service Role key
);

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 1000, // adjust as needed
    });

    if (error) throw error;

    const formatted = data.users.map((u) => ({
      id: u.id,
      email: u.email,
      created_at: u.created_at,
    }));

    return NextResponse.json({ users: formatted });
  } catch (err: any) {
    console.error("❌ Auth fetch error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to fetch auth users" },
      { status: 500 }
    );
  }
}
