"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { useEffect, useState, useRef } from "react";
import confetti from "canvas-confetti";

export default function HomeHero() {
  const [activeVideo, setActiveVideo] = useState(0);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);

  const videos = [
    "/videos/hero1.mp4",
    "/videos/hero2.mp4",
    "/videos/hero3.mp4",
  ];

  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  // 🕰️ Countdown (kept for UI but now irrelevant)
  useEffect(() => {
    const target = new Date("2025-12-15T23:59:59").getTime();
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const dist = target - now;
      if (dist <= 0) {
        clearInterval(timer);
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      } else {
        setTimeLeft({
          days: Math.floor(dist / (1000 * 60 * 60 * 24)),
          hours: Math.floor((dist / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((dist / (1000 * 60)) % 60),
          seconds: Math.floor((dist / 1000) % 60),
        });
      }
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // 🎉 Brand Confetti (Red + White Only)
  useEffect(() => {
    const duration = 2000;
    const end = Date.now() + duration;

    (function frame() {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ["#B80013", "#FFFFFF"],
      });
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ["#B80013", "#FFFFFF"],
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    })();
  }, []);

  // 🎞️ Video rotation logic
  useEffect(() => {
    const current = videoRefs.current[activeVideo];
    if (current) {
      current.play();
      const handleEnded = () =>
        setActiveVideo((prev) => (prev + 1) % videos.length);
      current.addEventListener("ended", handleEnded);
      return () => current.removeEventListener("ended", handleEnded);
    }
  }, [activeVideo]);

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
            className="uppercase font-extrabold leading-[1.1]
             text-[2.25rem] sm:text-[3rem] md:text-[2.75rem] lg:text-[4.5rem] xl:text-[3.83rem]"
            style={{
              fontFamily: "var(--font-roboto-condensed)",
              letterSpacing: "1.5px",
            }}
          >
            Ramadan Orders
            <span className="block text-[#B80013]">Closed</span>
          </h1>

          <p className="mt-6 text-white/90 font-medium text-[1rem] md:text-[1.15rem] tracking-wide max-w-2xl">
            Thank you for choosing Amal Foods for your Ramadan preparations. Our kitchens are now in full swing, crafting your favourites with precision and passion. We appreciate your trust in us — your meals are in expert hands.
          </p>

          {/* Countdown */}
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
                <div className="text-xs uppercase tracking-widest mt-1 text-gray-300">
                  {u.label}
                </div>
              </div>
            ))}
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-wrap gap-5 mt-12">
            <a
              href="/customer/login"
              className="px-10 py-3.5 bg-[#B80013] text-white rounded-full font-bold uppercase text-sm md:text-base tracking-wide hover:bg-[#a20010] transition"
            >
              Track Orders
            </a>
            <a
              href="/customer/login"
              className="px-10 py-3.5 bg-white text-[#111] rounded-full font-bold uppercase text-sm md:text-base tracking-wide hover:bg-gray-200 transition"
            >
              Signup
            </a>
          </div>
        </motion.div>
      </div>

      {/* RIGHT VISUAL STRIP */}
      <div className="hidden md:grid flex-[1.1] grid-cols-2 gap-1 h-full">
        {/* 🎞️ VIDEO COLUMN */}
        <motion.div
          key={activeVideo}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
          className="relative h-full overflow-hidden group"
        >
          {videos.map((src, i) => (
            <video
              key={i}
              ref={(el) => {
                videoRefs.current[i] = el;
              }}
              src={src}
              muted
              playsInline
              preload="auto"
              className={`absolute inset-0 object-cover w-full h-full transition-opacity duration-700 ease-out ${
                i === activeVideo ? "opacity-100 z-10" : "opacity-0 z-0"
              }`}
            />
          ))}
          <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-all duration-500" />
        </motion.div>

        {/* 🖼️ SECOND COLUMN STATIC IMAGE */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.15 }}
          className="relative h-full overflow-hidden group"
        >
          <Image
            src="/images/hero2.jpg"
            alt="Ramadan Hero Image 2"
            fill
            className="object-cover transform group-hover:scale-105 transition-transform duration-700 ease-out"
            priority
          />
          <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-all duration-500" />
        </motion.div>
      </div>

      {/* Background glow */}
      <div className="absolute -bottom-20 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-[#B80013]/25 blur-[200px] rounded-full" />
    </section>
  );
}
