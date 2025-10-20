"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function CustomerLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (!email.trim()) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/customer/dashboard`,
      },
    });

    if (error) setError(error.message);
    else
      setMessage(
        "✅ We’ve sent you a secure magic link. Please check your email to continue."
      );

    setLoading(false);
  };

  return (
    <main
      className="min-h-screen flex items-center justify-center bg-cover bg-center bg-no-repeat text-white px-6 relative"
      style={{ backgroundImage: "url('/images/customer.png')" }}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" />

      {/* Login Card */}
      <div className="relative z-10 w-full max-w-md bg-[#111]/85 border border-white/10 p-10 rounded-2xl text-center shadow-[0_0_25px_rgba(255,0,0,0.2)]">
        <h1 className="text-3xl font-bold text-[#B80013] mb-3 drop-shadow-md">
          Customer Zone
        </h1>
        <p className="text-gray-300 text-sm mb-8">
          Login or signup instantly — we’ll email you a secure link.
        </p>

        <form onSubmit={handleMagicLink} className="space-y-5">
          <input
            type="email"
            placeholder="Enter your email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg bg-black/50 border border-white/20 px-4 py-2.5 text-sm placeholder-gray-400 focus:border-red-600 outline-none transition"
            required
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-red-700 hover:bg-red-800 py-3 font-semibold text-sm tracking-wide transition-all shadow-[0_0_15px_rgba(255,0,0,0.3)] disabled:bg-gray-700 disabled:cursor-not-allowed"
          >
            {loading ? "Sending Link..." : "Send Magic Link"}
          </button>

          {message && (
            <p className="text-green-400 text-sm font-medium mt-3">{message}</p>
          )}
          {error && (
            <p className="text-red-400 text-sm font-medium mt-3">{error}</p>
          )}
        </form>

        <p className="mt-8 text-xs text-gray-400">
          By continuing, you agree to our{" "}
          <span className="text-[#B80013] hover:underline cursor-pointer">
            terms & privacy policy
          </span>
          .
        </p>
      </div>
    </main>
  );
}
