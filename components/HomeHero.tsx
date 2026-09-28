'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';

const ORDER_DATE = new Date('2026-10-01T00:00:00');

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
      transition={{ duration, repeat: Infinity, ease: 'easeInOut', delay }}
    >
      {children}
    </motion.div>
  );
}

const TICKER =
  'SAMOOSAS  ·  PARATHAS  ·  SPRING ROLLS  ·  PIES  ·  PASTRIES  ·  MADE FRESH DAILY  ·  DURBAN BORN  ·  ';

export default function HomeHero() {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [launched, setLaunched] = useState(false);

  useEffect(() => {
    function tick() {
      const dist = ORDER_DATE.getTime() - Date.now();
      if (dist <= 0) {
        setLaunched(true);
        return;
      }
      setTimeLeft({
        days:    Math.floor(dist / 86400000),
        hours:   Math.floor((dist / 3600000) % 24),
        minutes: Math.floor((dist / 60000) % 60),
        seconds: Math.floor((dist / 1000) % 60),
      });
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <section className="relative flex flex-col md:flex-row h-auto md:h-screen min-h-dvh overflow-hidden bg-[#0b0b0b] text-white">
      {/* LEFT CONTENT */}
      <div className="flex-1 flex flex-col justify-end md:justify-center pt-32 pb-20 md:py-0 relative z-10">
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1 }}
          className="w-full max-w-[900px] pt-10"
        >
          {launched ? (
            /* ── POST-LAUNCH: original messaging ── */
            <>
              {/* Padded content */}
              <div className="px-6 sm:px-12 lg:px-24 xl:px-32">
                <div className="flex items-center gap-3 mb-6">
                  <span className="w-6 h-px bg-[#B80013]" />
                  <p className="text-[#B80013] text-xs uppercase tracking-[0.4em] font-bold">
                    Durban&apos;s Finest · Since Day One
                  </p>
                </div>
                <h1
                  className="uppercase font-extrabold leading-[1.0] text-[2.6rem] sm:text-[3.5rem] md:text-[3.2rem] lg:text-[4.2rem] xl:text-[4.5rem] 2xl:text-[5rem]"
                  style={{ fontFamily: 'var(--font-roboto-condensed)', letterSpacing: '1px' }}
                >
                  Handcrafted.
                  <span className="block text-[#B80013]">Born in Durban.</span>
                  <span className="block whitespace-nowrap">Ready in Minutes.</span>
                </h1>
                <p className="mt-6 border-l border-[#B80013]/35 pl-4 text-white/55 text-[0.95rem] md:text-[1rem] leading-relaxed max-w-sm">
                  From flaky samoosas to golden parathas — made with real ingredients, family recipes,
                  and a passion for quality.
                </p>
              </div>

              {/* Full-width buttons on mobile, padded + pill on desktop */}
              <div className="mt-8 flex flex-col gap-3 px-6 sm:px-12 lg:px-24 xl:px-32 md:flex-row md:flex-wrap md:gap-4">
                <a href="/products" className="block w-full md:w-auto text-center px-10 py-3.5 bg-[#B80013] text-white rounded-full font-bold uppercase text-sm tracking-wide hover:bg-[#a20010] transition-all duration-200">
                  Explore Range
                </a>
                <a href="/about" className="block w-full md:w-auto text-center px-10 py-3.5 border border-white/25 text-white/90 rounded-full font-bold uppercase text-sm tracking-wide hover:border-white/60 hover:text-white transition-all duration-200">
                  Our Story
                </a>
              </div>
            </>
          ) : (
            /* ── PRE-LAUNCH: countdown messaging ── */
            <>
              {/* Padded content */}
              <div className="px-6 sm:px-12 lg:px-24 xl:px-32">
                <div className="flex items-center gap-3 mb-6">
                  <span className="w-6 h-px bg-[#B80013]" />
                  <p className="text-[#B80013] text-xs uppercase tracking-[0.4em] font-bold">
                    Orders Opening · 1 October 2026
                  </p>
                </div>

                <h1
                  className="uppercase font-extrabold leading-[1.0] text-[2.6rem] sm:text-[3.5rem] md:text-[3.2rem] lg:text-[4.2rem] xl:text-[4.5rem] 2xl:text-[5rem]"
                  style={{ fontFamily: 'var(--font-roboto-condensed)', letterSpacing: '1px' }}
                >
                  The Wait Is
                  <span className="block text-[#B80013]">Almost Over.</span>
                  <span className="block whitespace-nowrap">Orders Open Soon.</span>
                </h1>

                <p className="mt-6 border-l border-[#B80013]/35 pl-4 text-white/55 text-[0.95rem] md:text-[1rem] leading-relaxed max-w-sm">
                  Samoosas, parathas, spring rolls and more — fresh from our Durban kitchen.
                  Pre-orders open 1 October. Be ready.
                </p>

                {/* Countdown */}
                <div className="flex items-end gap-7 mt-10">
                  {[
                    { label: 'Days',    value: timeLeft.days    },
                    { label: 'Hours',   value: timeLeft.hours   },
                    { label: 'Minutes', value: timeLeft.minutes },
                    { label: 'Seconds', value: timeLeft.seconds },
                  ].map((u, i) => (
                    <div key={i}>
                      <div
                        className="text-[2.8rem] sm:text-[3.5rem] font-extrabold text-white leading-none tabular-nums"
                        style={{ fontFamily: 'var(--font-roboto-condensed)' }}
                      >
                        {String(u.value).padStart(2, '0')}
                      </div>
                      <div className="text-white/35 text-[9px] uppercase tracking-[0.3em] mt-1.5">
                        {u.label}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Full-width buttons on mobile, padded + pill on desktop */}
              <div className="mt-8 flex flex-col gap-3 px-6 sm:px-12 lg:px-24 xl:px-32 md:flex-row md:flex-wrap md:gap-4">
                <a href="/products" className="block w-full md:w-auto text-center px-10 py-3.5 bg-[#B80013] text-white rounded-full font-bold uppercase text-sm tracking-wide hover:bg-[#a20010] transition-all duration-200">
                  Explore Range
                </a>
                <a href="/about" className="block w-full md:w-auto text-center px-10 py-3.5 border border-white/25 text-white/90 rounded-full font-bold uppercase text-sm tracking-wide hover:border-white/60 hover:text-white transition-all duration-200">
                  Our Story
                </a>
              </div>
            </>
          )}
        </motion.div>
      </div>

      {/* RIGHT VISUAL COLLAGE */}
      <div
        className="hidden md:flex flex-[1.25] gap-3 h-full p-4 overflow-hidden"
        style={{ perspective: '2000px' }}
      >
        {/* PANEL 1 — angled left */}
        <motion.div
          className="flex-1 flex flex-col gap-3 h-full"
          style={{ transform: 'rotateY(-7deg)', transformOrigin: 'right center' }}
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.9, delay: 0.1 }}
        >
          <div className="relative flex-[3] rounded-2xl overflow-hidden">
            <KenBurns duration={13} dy={-10}>
              <Image src="/images/hero1.jpg" alt="" fill sizes="25vw" className="object-cover" priority />
            </KenBurns>
            <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-transparent z-10" />
          </div>

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

          <div className="relative flex-[3] rounded-2xl overflow-hidden">
            <KenBurns duration={16} dy={10} delay={4}>
              <Image src="/images/dough.jpg" alt="" fill sizes="25vw" className="object-cover" />
            </KenBurns>
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent z-10" />
          </div>
        </motion.div>

        {/* PANEL 2 — angled right, offset down */}
        <motion.div
          className="flex-1 flex flex-col gap-3"
          style={{
            transform: 'rotateY(7deg) translateY(14%)',
            transformOrigin: 'left center',
            height: '100%',
          }}
          initial={{ opacity: 0, x: 60 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.9, delay: 0.25 }}
        >
          <div className="relative flex-[3] rounded-2xl overflow-hidden">
            <KenBurns duration={15} dx={-10} delay={2}>
              <Image src="/images/pie-rolling.jpg" alt="" fill sizes="25vw" className="object-cover" />
            </KenBurns>
            <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-transparent z-10" />
          </div>

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

          <div className="relative flex-[3] rounded-2xl overflow-hidden">
            <KenBurns duration={12} dx={10} delay={6}>
              <Image src="/images/hero2.jpg" alt="" fill sizes="25vw" className="object-cover" />
            </KenBurns>
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent z-10" />
          </div>
        </motion.div>
      </div>

      {/* Mobile background image */}
      <div className="absolute inset-0 md:hidden" style={{ minHeight: '100dvh' }}>
        <Image
          src="/images/hero1.jpg"
          alt=""
          fill
          sizes="100vw"
          className="object-cover object-center"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0b0b0b] via-[#0b0b0b]/75 to-black/50" />
      </div>

      {/* Background glow — sits under the right collage */}
      <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-[#B80013]/20 blur-[220px] rounded-full pointer-events-none translate-x-1/4 translate-y-1/4" />

      {/* Ticker strip */}
      <div className="absolute bottom-0 left-0 right-0 z-20 bg-[#B80013] py-2.5 overflow-hidden">
        <div className="animate-ticker">
          <span className="text-white text-[10px] font-bold uppercase tracking-[0.35em]">
            {TICKER}
          </span>
          <span className="text-white text-[10px] font-bold uppercase tracking-[0.35em]">
            {TICKER}
          </span>
        </div>
      </div>
    </section>
  );
}
