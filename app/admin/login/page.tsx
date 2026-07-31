"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Eye, EyeOff, ArrowRight, ShieldCheck } from "lucide-react";

export default function AdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    const user = data?.user;

    if (user) {
      const { data: userData, error: userError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (userError) {
        setError("Unable to verify user role. Please try again.");
        setLoading(false);
        return;
      }

      if (userData?.role === "owner") {
        router.push("/admin/dashboard");
      } else {
        setError("Access denied — managers must use their branch login page.");
        await supabase.auth.signOut();
      }
    }

    setLoading(false);
  };

  return (
    <main className="min-h-screen flex bg-[#0a0a0a] text-white">
      {/* Left — image */}
      <div className="hidden md:block relative flex-[1.1] overflow-hidden">
        <Image src="/images/login.png" alt="" fill className="object-cover" priority />
        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/60 to-black/20" />
        <div className="absolute inset-0 bg-[#B80013]/8" />

        {/* Top-left badge */}
        <div className="absolute top-10 left-10 flex items-center gap-2">
          <ShieldCheck size={14} className="text-[#B80013]" />
          <span className="text-[10px] uppercase tracking-[0.4em] text-white/40 font-bold">
            Owner Access Only
          </span>
        </div>

        <div className="absolute bottom-0 left-0 p-12">
          <p className="text-[#B80013] text-[10px] uppercase tracking-[0.4em] font-bold mb-4">
            Admin Portal
          </p>
          <h2
            className="text-5xl font-extrabold uppercase leading-[1.0] max-w-xs"
            style={{ fontFamily: "var(--font-roboto-condensed)" }}
          >
            Control<br />Centre.
          </h2>
          <p className="text-white/45 text-sm mt-4 max-w-xs leading-relaxed">
            Full access to orders, users, products, and business reporting.
          </p>
        </div>
      </div>

      {/* Right — form */}
      <div className="flex-1 flex flex-col px-8 sm:px-14 md:px-16 lg:px-20 py-12 relative">
        <Link href="/" className="inline-block mb-auto pb-16">
          <Image
            src="/images/logo-dark.png"
            alt="Amal Foods"
            width={130}
            height={45}
            className="h-9 w-auto"
          />
        </Link>

        <div className="max-w-sm w-full mb-auto">
          {/* Admin indicator */}
          <div className="flex items-center gap-2 mb-5">
            <ShieldCheck size={14} className="text-[#B80013]" />
            <p className="text-[#B80013] text-[10px] uppercase tracking-[0.4em] font-bold">
              Owner Access
            </p>
          </div>

          <h1
            className="text-4xl font-extrabold uppercase leading-[1.0] mb-2"
            style={{ fontFamily: "var(--font-roboto-condensed)" }}
          >
            Admin Login.
          </h1>
          <p className="text-white/35 text-sm mb-10 leading-relaxed">
            This portal is restricted to authorised owners and administrators only.
          </p>

          <form onSubmit={handleLogin} className="space-y-8">
            <div className="flex flex-col gap-2">
              <label className="text-[10px] uppercase tracking-[0.3em] text-white/35 font-bold">
                Email Address
              </label>
              <input
                type="email"
                placeholder="admin@amalfoods.co.za"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-transparent border-b border-white/12 focus:border-[#B80013] pb-3 text-white text-sm placeholder-white/20 outline-none transition-colors duration-200"
                required
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[10px] uppercase tracking-[0.3em] text-white/35 font-bold">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-transparent border-b border-white/12 focus:border-[#B80013] pb-3 text-white text-sm placeholder-white/20 outline-none transition-colors duration-200 pr-8"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-0 bottom-3 text-white/25 hover:text-white transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {error && <p className="text-[#B80013] text-xs leading-relaxed">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 bg-[#B80013] hover:bg-[#a20010] text-white font-bold uppercase text-[11px] tracking-widest py-4 rounded-full transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? "Verifying..." : (
                <>
                  <span>Access Dashboard</span>
                  <ArrowRight size={13} />
                </>
              )}
            </button>
          </form>

          <button
            onClick={() => router.push("/")}
            className="mt-8 text-white/25 text-xs hover:text-white transition-colors"
          >
            ← Back to site
          </button>
        </div>
      </div>
    </main>
  );
}
