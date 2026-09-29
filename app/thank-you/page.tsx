"use client";

import { useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
// @ts-ignore: no declaration file for 'canvas-confetti'
import confetti from "canvas-confetti";

export default function ThankYouPage() {
  useEffect(() => {
    const end = Date.now() + 800;
    (function frame() {
      confetti({
        particleCount: 6,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ["#B80013", "#ffffff", "#333333"],
      });
      confetti({
        particleCount: 6,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ["#B80013", "#ffffff", "#333333"],
      });
      if (Date.now() < end) requestAnimationFrame(frame);
    })();
  }, []);

  return (
    <main
      className="relative min-h-screen flex items-center justify-center px-4 py-12 bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: "url('/images/checkout.png')" }}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/75 pointer-events-none" />

      {/* Card */}
      <div className="relative w-full max-w-sm bg-[#111] rounded-3xl border border-white/[0.07] shadow-[0_0_80px_rgba(0,0,0,0.9)] px-8 py-10 text-center text-white">

        <Image
          src="/images/logo-dark.png"
          alt="Amal Foods"
          width={120}
          height={42}
          className="mx-auto mb-7 h-8 w-auto"
        />

        <p className="text-[10px] uppercase tracking-[0.45em] text-[#B80013] font-bold mb-3">
          Order Confirmed
        </p>

        <h1
          className="text-6xl font-extrabold uppercase leading-[0.9] mb-5"
          style={{ fontFamily: "var(--font-roboto-condensed)" }}
        >
          Thank<br />You.
        </h1>

        <p className="text-white/35 text-sm leading-relaxed mb-8 max-w-[240px] mx-auto">
          Your order has been received. Log in to track and manage your orders.
        </p>

        <div className="flex flex-col gap-3">
          <Link
            href="/customer/login"
            className="w-full flex items-center justify-center gap-2 bg-[#B80013] hover:bg-[#a20010] active:bg-[#a20010] text-white font-bold uppercase text-[11px] tracking-widest py-4 rounded-full transition-all duration-200"
          >
            <span>Create Account / Login</span>
            <ArrowRight size={13} />
          </Link>

          <Link
            href="/products"
            className="w-full flex items-center justify-center text-white/25 text-[11px] uppercase tracking-[0.25em] font-bold py-3 hover:text-white/55 active:text-white/55 transition-colors"
          >
            Continue Shopping
          </Link>
        </div>

        <p className="mt-7 text-[11px] text-white/15 leading-relaxed">
          Thank you for choosing Amal Foods.
        </p>
      </div>
    </main>
  );
}
