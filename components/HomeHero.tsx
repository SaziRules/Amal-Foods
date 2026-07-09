"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { useEffect, useState } from "react";
import confetti from "canvas-confetti";

function KenBurns({
  children,
  duration = 14,
  delay = 0,
  dx = 0,
  dy = 0,
}: {
  children: React.ReactNode;
  duration?: number;
  delay?: number;
  dx?: number;
  dy?: number;
}) {
  return (
    <motion.div
      className="absolute inset-0"
      animate={{ scale: [1, 1.08, 1], x: [0, dx, 0], y: [0, dy, 0] }}
      transition={{ duration, repeat: Infinity, ease: "easeInOut", delay }}
    >
      {children}
    </motion.div>
  );
}

export default function HomeHero() {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const target = new Date("2025-12-15T23:59:59").getTime();
    const timer = setInterval(() => {
      const dist = target - Date.now();
      if (dist <= 0) {
        clearInterval(timer);
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      } else {
        setTimeLeft({
          days: Math.floor(dist / 86400000),
          hours: Math.floor((dist / 3600000) % 24),
          minutes: Math.floor((dist / 60000) % 60),
          seconds: Math.floor((dist / 1000) % 60),
        });
      }
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const end = Date.now() + 2000;
    (function frame() {
      confetti({ particleCount: 5, angle: 60, spread: 55, origin: { x: 0 }, colors: ["#B80013", "#FFFFFF"] });
      confetti({ particleCount: 5, angle: 120, spread: 55, origin: { x: 1 }, colors: ["#B80013", "#FFFFFF"] });
      if (Date.now() < end) requestAnimationFrame(frame);
    })();
  }, []);

  return (
    <section className="relative flex flex-col md:flex-row h-auto md:h-screen min-h-dvh overflow-hidden bg-[#0b0b0b] text-white">
      {/* LEFT CONTENT */}
      <div className="flex-1 flex flex-col justify-center px-6 sm:px-12 lg:px-24 xl:px-32 py-20 md:py-0 relative z-10">
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1 }}
          className="max-w-[900px] pt-10"
        >
          <h1
            className="uppercase font-extrabold leading-[1.1] text-[2.25rem] sm:text-[3rem] md:text-[2.75rem] lg:text-[4.5rem] xl:text-[3.83rem]"
            style={{ fontFamily: "var(--font-roboto-condensed)", letterSpacing: "1.5px" }}
          >
            Ramadan Orders
            <span className="block text-[#B80013]">Closed</span>
          </h1>

          <p className="mt-6 text-white/90 font-medium text-[1rem] md:text-[1.15rem] tracking-wide max-w-2xl">
            Thank you for choosing Amal Foods for your Ramadan preparations. Our kitchens are now in full swing, crafting your favourites with precision and passion. We appreciate your trust in us — your meals are in expert hands.
          </p>

          <div className="flex flex-wrap gap-6 mt-10 text-white/90">
            {[
              { label: "Days", value: timeLeft.days },
              { label: "Hours", value: timeLeft.hours },
              { label: "Minutes", value: timeLeft.minutes },
              { label: "Seconds", value: timeLeft.seconds },
            ].map((u, i) => (
              <div key={i} className="text-center">
                <div className="text-5xl font-extrabold text-white drop-shadow-md">
                  {String(u.value).padStart(2, "0")}
                </div>
                <div className="text-xs uppercase tracking-widest mt-1 text-gray-300">{u.label}</div>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-5 mt-12">
            <a href="/customer/login" className="px-10 py-3.5 bg-[#B80013] text-white rounded-full font-bold uppercase text-sm md:text-base tracking-wide hover:bg-[#a20010] transition">
              Track Orders
            </a>
            <a href="/customer/login" className="px-10 py-3.5 bg-white text-[#111] rounded-full font-bold uppercase text-sm md:text-base tracking-wide hover:bg-gray-200 transition">
              Signup
            </a>
          </div>
        </motion.div>
      </div>

      {/* RIGHT VISUAL COLLAGE */}
      <div
        className="hidden md:flex flex-[1.1] gap-3 h-full p-4 overflow-hidden"
        style={{ perspective: "1600px" }}
      >
        {/* PANEL 1 — angled left, top-aligned */}
        <motion.div
          className="flex-1 flex flex-col gap-3 h-full"
          style={{ transform: "rotateY(-7deg)", transformOrigin: "right center" }}
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.9, delay: 0.1 }}
        >
          {/* Image top */}
          <div className="relative flex-[3] rounded-2xl overflow-hidden">
            <KenBurns duration={13} dy={-10}>
              <Image src="/images/hero1.jpg" alt="" fill className="object-cover" priority />
            </KenBurns>
            <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-transparent z-10" />
          </div>

          {/* Video middle — hero1 only */}
          <div className="relative flex-[5] rounded-2xl overflow-hidden">
            <video
              src="/videos/hero1.mp4"
              autoPlay
              muted
              loop
              playsInline
              className="absolute inset-0 object-cover w-full h-full"
            />
            <div className="absolute inset-0 bg-black/10 z-10" />
          </div>

          {/* Image bottom */}
          <div className="relative flex-[3] rounded-2xl overflow-hidden">
            <KenBurns duration={16} dy={10} delay={4}>
              <Image src="/images/dough.jpg" alt="" fill className="object-cover" />
            </KenBurns>
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent z-10" />
          </div>
        </motion.div>

        {/* PANEL 2 — angled right, offset down */}
        <motion.div
          className="flex-1 flex flex-col gap-3"
          style={{
            transform: "rotateY(7deg) translateY(14%)",
            transformOrigin: "left center",
            height: "100%",
          }}
          initial={{ opacity: 0, x: 60 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.9, delay: 0.25 }}
        >
          {/* Image top */}
          <div className="relative flex-[3] rounded-2xl overflow-hidden">
            <KenBurns duration={15} dx={-10} delay={2}>
              <Image src="/images/pie-rolling.jpg" alt="" fill className="object-cover" />
            </KenBurns>
            <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-transparent z-10" />
          </div>

          {/* Video middle — hero3 only */}
          <div className="relative flex-[5] rounded-2xl overflow-hidden">
            <video
              src="/videos/hero3.mp4"
              autoPlay
              muted
              loop
              playsInline
              className="absolute inset-0 object-cover w-full h-full"
            />
            <div className="absolute inset-0 bg-black/10 z-10" />
          </div>

          {/* Image bottom */}
          <div className="relative flex-[3] rounded-2xl overflow-hidden">
            <KenBurns duration={12} dx={10} delay={6}>
              <Image src="/images/hero2.jpg" alt="" fill className="object-cover" />
            </KenBurns>
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent z-10" />
          </div>
        </motion.div>
      </div>

      {/* Background glow */}
      <div className="absolute -bottom-20 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-[#B80013]/25 blur-[200px] rounded-full" />
    </section>
  );
}
