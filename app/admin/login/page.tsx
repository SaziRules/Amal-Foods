"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function AdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // 🔐 Step 1: Login
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    const user = data?.user;

    // 🔍 Step 2: Fetch user metadata (role check)
    if (user) {
      const { data: userData, error: userError } = await supabase
        .from("user_profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (userError) {
        setError("Unable to verify user role. Please try again.");
        setLoading(false);
        return;
      }

      if (userData?.role === "admin") {
        router.push("/dashboard/owner");
      } else {
        setError("Access denied — managers must use their branch login page.");
        await supabase.auth.signOut();
      }
    }

    setLoading(false);
  };

  return (
    <main
      className="min-h-screen flex items-center justify-center bg-cover bg-center bg-no-repeat text-white px-6 relative"
      style={{ backgroundImage: "url('/images/login.png')" }}
    >
      {/* Overlay for readability */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-[2px]" />

      {/* Login Box */}
      <div className="relative z-10 w-full max-w-md bg-[#111]/80 border border-white/10 p-10 rounded-2xl text-center shadow-[0_0_25px_rgba(255,0,0,0.2)]">
        <h1 className="text-3xl font-bold text-[#B80013] mb-8 drop-shadow-md">
          Admin Login
        </h1>

        <form onSubmit={handleLogin} className="space-y-5">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg bg-black/50 border border-white/20 px-4 py-2.5 text-sm placeholder-gray-400 focus:border-red-600 outline-none transition"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg bg-black/50 border border-white/20 px-4 py-2.5 text-sm placeholder-gray-400 focus:border-red-600 outline-none transition"
            required
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-red-700 hover:bg-red-800 py-3 font-semibold text-sm tracking-wide transition-all shadow-[0_0_15px_rgba(255,0,0,0.3)] disabled:bg-gray-700 disabled:cursor-not-allowed"
          >
            {loading ? "Signing in..." : "Login"}
          </button>

          {error && (
            <p className="text-red-400 text-sm font-medium mt-3">{error}</p>
          )}
        </form>
      </div>
    </main>
  );
}
