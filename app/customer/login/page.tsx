"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CheckCircle } from "lucide-react";

export default function CustomerLogin() {
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
        emailRedirectTo: "https://amalfoods.co.za/customer/dashboard",
      },
    });

    if (error) setError(error.message);
    else setMessage("Check your inbox — we've sent you a secure login link.");

    setLoading(false);
  };

  return (
    <main className="min-h-screen flex bg-[#0d0d0d] text-white">
      {/* Left — image */}
      <div className="hidden md:block relative flex-[1.1] overflow-hidden">
        <Image src="/images/customer.png" alt="" fill className="object-cover" priority />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/10" />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent to-black/30" />
        <div className="absolute bottom-0 left-0 p-12">
          <p className="text-[#B80013] text-[10px] uppercase tracking-[0.4em] font-bold mb-4">
            Customer Zone
          </p>
          <h2
            className="text-5xl font-extrabold uppercase leading-[1.0] max-w-xs"
            style={{ fontFamily: "var(--font-roboto-condensed)" }}
          >
            Your Amal<br />Account.
          </h2>
          <p className="text-white/45 text-sm mt-4 max-w-xs leading-relaxed">
            Track your orders, manage your favourites, and stay connected.
          </p>
        </div>
      </div>

      {/* Right — form */}
      <div className="flex-1 flex flex-col px-8 sm:px-14 md:px-16 lg:px-20 py-12 relative">
        <Link href="/" className="mb-auto inline-block pb-16">
          <Image
            src="/images/logo-dark.png"
            alt="Amal Foods"
            width={130}
            height={45}
            className="h-9 w-auto"
          />
        </Link>

        <div className="max-w-sm w-full mb-auto">
          <h1
            className="text-4xl font-extrabold uppercase leading-[1.0] mb-2"
            style={{ fontFamily: "var(--font-roboto-condensed)" }}
          >
            Welcome back.
          </h1>
          <p className="text-white/35 text-sm mb-10 leading-relaxed">
            Enter your email and we'll send a secure magic link — no password needed.
          </p>

          {message ? (
            <div className="space-y-6">
              <div className="flex items-start gap-3">
                <CheckCircle size={18} className="text-[#B80013] shrink-0 mt-0.5" />
                <p className="text-sm text-white/70 leading-relaxed">{message}</p>
              </div>
              <button
                onClick={() => { setMessage(null); setEmail(""); }}
                className="text-white/30 text-xs hover:text-white transition-colors"
              >
                ← Use a different email
              </button>
            </div>
          ) : (
            <form onSubmit={handleMagicLink} className="space-y-8">
              <div className="flex flex-col gap-2">
                <label className="text-[10px] uppercase tracking-[0.3em] text-white/35 font-bold">
                  Email Address
                </label>
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-transparent border-b border-white/12 focus:border-[#B80013] pb-3 text-white text-sm placeholder-white/20 outline-none transition-colors duration-200"
                  required
                />
              </div>

              {error && <p className="text-[#B80013] text-xs leading-relaxed">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 bg-[#B80013] hover:bg-[#a20010] text-white font-bold uppercase text-[11px] tracking-widest py-4 rounded-full transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {loading ? "Sending..." : (
                  <>
                    <span>Send Magic Link</span>
                    <ArrowRight size={13} />
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        <p className="mt-auto pt-12 text-[11px] text-white/20 leading-relaxed">
          By continuing, you agree to our{" "}
          <span className="text-white/35 hover:text-white cursor-pointer transition-colors">
            Terms & Privacy Policy
          </span>
          .
        </p>
      </div>
    </main>
  );
}
