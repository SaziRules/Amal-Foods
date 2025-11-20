"use client";

import { useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
// @ts-ignore: no declaration file for 'canvas-confetti'
import confetti from "canvas-confetti";

export default function ThankYouPage() {
  useEffect(() => {
    // Fire confetti once on page load
    const end = Date.now() + 800; // 0.8 seconds

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

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    })();
  }, []);

  return (
    <main
      className="relative min-h-screen flex items-center justify-center px-6"
      style={{
        backgroundImage: "url('/images/checkout.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >

      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm"></div>

      {/* Center Card */}
      <div className="relative z-10 w-full max-w-md bg-black/40 border border-white/10 rounded-2xl shadow-2xl px-8 py-10 text-center">

        {/* Logo */}
        <Image
          src="/images/logo-dark.png"
          alt="Amal Foods"
          width={140}
          height={50}
          className="mx-auto mb-6"
        />

        {/* Title */}
        <h1 className="text-2xl font-bold text-[#B80013] mb-4">
          Thank You for Your Order!
        </h1>

        {/* Message */}
        <p className="text-gray-200 text-sm leading-relaxed mb-6">
          Your order has been received successfully.
          <br />
          Create an account or log in to track your orders at any time.
        </p>

        {/* Buttons */}
        <div className="flex flex-col gap-4 mt-6">

          {/* Login/Register */}
          <Link
            href="/customer/login"
            className="bg-[#B80013] hover:bg-[#a20010] text-white font-semibold py-3 rounded-full transition-all shadow-lg"
          >
            Create Account / Login
          </Link>

          {/* Continue Shopping */}
          <Link
            href="/products"
            className="border border-[#B80013] text-[#B80013] hover:bg-[#B80013] hover:text-white font-semibold py-3 rounded-full transition-all"
          >
            Continue Shopping
          </Link>

        </div>

        <p className="text-[11px] text-gray-400 mt-6">
          Thank you for choosing Amal Foods. We appreciate your support!
        </p>
      </div>
    </main>
  );
}
