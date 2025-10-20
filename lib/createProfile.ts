import { supabase } from "@/lib/supabaseClient";

/**
 * Ensures a Supabase profile exists for a given user.
 * Safe to call multiple times — will skip if one already exists.
 */
export async function createProfileForUser(
  userId: string,
  role: "owner" | "manager" | "customer" = "customer",
  branch: "durban" | "joburg" | null = null
) {
  try {
    // check if already exists
    const { data: existing } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", userId)
      .maybeSingle();

    if (existing) return true;

    // create profile
    const { error } = await supabase.from("profiles").insert([
      {
        id: userId,
        role,
        branch,
      },
    ]);

    if (error) throw error;
    console.log("✅ Profile created for:", userId, role, branch);
    return true;
  } catch (err) {
    console.error("❌ Profile creation error:", err);
    return false;
  }
}
