"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useState } from "react";
import HeroSection from "@/components/HeroSection";
import confetti from "canvas-confetti";

/* ------------------ Next Ramadan Date ------------------ */
const NEXT_RAMADAN = new Date("2026-12-15T23:59:59");

export default function ProductsPage() {
  const [timeLeft, setTimeLeft] = useState({
    days: 0, hours: 0, minutes: 0, seconds: 0,
  });

  /* ------------------ Countdown Logic ------------------ */
  useEffect(() => {
    function updateCountdown() {
      const now = new Date().getTime();
      const dist = NEXT_RAMADAN.getTime() - now;

      if (dist <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      setTimeLeft({
        days: Math.floor(dist / (1000 * 60 * 60 * 24)),
        hours: Math.floor((dist / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((dist / (1000 * 60)) % 60),
        seconds: Math.floor((dist / 1000) % 60),
      });
    }

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  /* ------------------ CONFETTI ON PAGE LOAD ------------------ */
  useEffect(() => {
    // Red + White brand confetti burst
    const duration = 2000;
    const end = Date.now() + duration;

    (function frame() {
      confetti({
        particleCount: 8,
        spread: 60,
        origin: { x: 0 },
        colors: ["#B80013", "#FFFFFF"], // ✔ red + white only
        ticks: 180,
      });
      confetti({
        particleCount: 8,
        spread: 60,
        origin: { x: 1 },
        colors: ["#B80013", "#FFFFFF"],
        ticks: 180,
      });

      if (Date.now() < end) requestAnimationFrame(frame);
    })();
  }, []);

  return (
    <>
      {/* OPTIONAL HEADER */}
      <HeroSection
        title="Ramadan Orders"
        highlight="Closed"
        subtitle="Thank you for your incredible support."
        primaryLabel=""
        secondaryLabel=""
        tertiaryLabel=""
        onPrimaryClick={() => {}}
        onSecondaryClick={() => {}}
        onTertiaryClick={() => {}}
        activeRegion="durban"
      />

      {/* ------------------ THANK-YOU + COUNTDOWN SECTION ------------------ */}
      <section className="min-h-screen flex flex-col items-center justify-center bg-[#0b0b0b] text-white px-6 py-20">

        {/* THANK YOU MESSAGE */}
        <div className="text-center max-w-3xl mb-12">
          <h1
            className="text-4xl md:text-5xl font-extrabold text-[#B80013] mb-6 uppercase tracking-wide"
            style={{ fontFamily: "var(--font-roboto-condensed)" }}
          >
            Thank You for Your Support
          </h1>

          <p className="text-lg md:text-xl text-gray-300 leading-relaxed">
            Ramadan pre-orders for this season are now closed.
            We are deeply grateful for the overwhelming trust and support
            from our community. Our kitchens are now fully dedicated to preparing
            every dish with the care, quality, and tradition your family deserves
            during this blessed month.
            <br /><br />
            We look forward to serving you again next Ramadan.
            Until then — may peace, blessings, and goodness fill your home.
          </p>
        </div>

        {/* COUNTDOWN TO NEXT RAMADAN */}
        <div className="flex flex-wrap gap-6 justify-center mt-10">
          {[
            { label: "Days", value: timeLeft.days },
            { label: "Hours", value: timeLeft.hours },
            { label: "Minutes", value: timeLeft.minutes },
            { label: "Seconds", value: timeLeft.seconds },
          ].map((t, i) => (
            <div key={i} className="text-center">
              <div className="text-5xl font-extrabold text-white drop-shadow-md">
                {String(t.value).padStart(2, "0")}
              </div>
              <div className="text-xs uppercase tracking-widest mt-1 text-gray-400">
                {t.label}
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
