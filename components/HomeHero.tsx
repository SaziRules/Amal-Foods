'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';

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
  return (
    <section className="relative flex flex-col md:flex-row h-auto md:h-screen min-h-dvh overflow-hidden bg-[#0b0b0b] text-white">
      {/* LEFT CONTENT */}
      <div className="flex-1 flex flex-col justify-end md:justify-center px-6 sm:px-12 lg:px-24 xl:px-32 pt-32 pb-20 md:py-0 relative z-10">
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1 }}
          className="max-w-[900px] pt-10"
        >
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

          <div className="flex flex-wrap gap-4 mt-10">
            <a
              href="/products"
              className="px-10 py-3.5 bg-[#B80013] text-white rounded-full font-bold uppercase text-sm tracking-wide hover:bg-[#a20010] transition-all duration-200"
            >
              Explore Range
            </a>
            <a
              href="/about"
              className="px-10 py-3.5 border border-white/25 text-white/90 rounded-full font-bold uppercase text-sm tracking-wide hover:border-white/60 hover:text-white transition-all duration-200"
            >
              Our Story
            </a>
          </div>
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
              <Image src="/images/hero1.jpg" alt="" fill className="object-cover" priority />
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
              <Image src="/images/dough.jpg" alt="" fill className="object-cover" />
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
              <Image src="/images/pie-rolling.jpg" alt="" fill className="object-cover" />
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
              <Image src="/images/hero2.jpg" alt="" fill className="object-cover" />
            </KenBurns>
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent z-10" />
          </div>
        </motion.div>
      </div>

      {/* Mobile background image */}
      <div className="absolute inset-0 md:hidden">
        <Image
          src="/images/hero1.jpg"
          alt=""
          fill
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
