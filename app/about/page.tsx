'use client';

import { motion, useInView } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { useRef, useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const values = [
  {
    num: '01',
    title: 'Authenticity',
    text: 'We keep it real. No shortcuts, no compromises. Every Amal product carries the flavour and comfort of a homemade meal.',
  },
  {
    num: '02',
    title: 'Community',
    text: "We're proudly local, built on family kitchens, community stores, and the joy of sharing food that brings people together.",
  },
  {
    num: '03',
    title: 'Quality',
    text: 'From our crisp pastry rolls to golden samoosas, quality and freshness come first, every pack, every time.',
  },
];

const timeline = [
  {
    year: '2005',
    title: 'A Kitchen Dream',
    text: 'What began in a small Durban kitchen with a single batch of samoosas soon became a neighbourhood favourite.',
  },
  {
    year: '2010',
    title: 'Heat & Eat at Home',
    text: 'We launched our first frozen range. Ready to heat, crisp, and enjoy. Making home entertaining effortless.',
  },
  {
    year: '2015',
    title: 'Expanding to Johannesburg',
    text: 'Our second branch opened, bringing authentic Durban-style flavour to Gauteng and beyond.',
  },
  {
    year: '2020',
    title: 'Innovation in Every Bite',
    text: 'We modernised our range with premium fillings, new pastry recipes, and eco-friendly packaging.',
  },
  {
    year: '2024',
    title: 'The Next Chapter',
    text: 'Today, Amal Foods stands for quality, convenience, and taste. Made with love, ready in minutes.',
  },
];

// 12 brand images
const REAL_IMAGES = [
  '/images/brand/one.JPG',
  '/images/brand/two.JPG',
  '/images/brand/three.JPG',
  '/images/brand/four.JPG',
  '/images/brand/P64A2825.JPG',
  '/images/brand/P64A2912.jpg',
  '/images/brand/P64A2916.JPG',
  '/images/brand/P64A2977.JPG',
  '/images/brand/P64A3050.JPG',
  '/images/brand/P64A3087.JPG',
  '/images/brand/P64A3110.JPG',
  '/images/brand/P64A3148.JPG',
];

// Pad to 15 (3 full pages × 5 tiles)
const PADDED = [...REAL_IMAGES, ...REAL_IMAGES.slice(0, 3)];
// Page 0: idx 0-4 | Page 1: idx 5-9 | Page 2: idx 10-14 (wraps to 0,1,2)

// Track: [clone of P2] + [P0] + [P1] + [P2] + [clone of P0]
// Internal pages: 0=clone-P2, 1=P0, 2=P1, 3=P2, 4=clone-P0
// After advancing to 4 → snap instantly to 1 (same images). Backward 0 → snap to 3.
const TRACK = [
  ...PADDED.slice(10),   // clone P2
  ...PADDED,             // P0 + P1 + P2
  ...PADDED.slice(0, 5), // clone P0
];

const PAGE_FIRST = 1;
const PAGE_LAST  = 3;
const GAP = 12;
const TILES = 5;
const AUTO_INTERVAL = 4000;
const TRANSITION_MS = 800;

export default function AboutPage() {
  const timelineRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(timelineRef, { once: true, amount: 0.15 });

  const carouselRef  = useRef<HTMLDivElement>(null);
  const intervalRef  = useRef<ReturnType<typeof setInterval> | null>(null);

  const [containerW, setContainerW] = useState(0);
  const [page, setPage]             = useState(PAGE_FIRST);
  const [animate, setAnimate]       = useState(true);

  // Measure container width
  useEffect(() => {
    function measure() {
      if (carouselRef.current) setContainerW(carouselRef.current.offsetWidth);
    }
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  // Auto-advance — resets whenever startInterval is called
  const startInterval = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => setPage(p => p + 1), AUTO_INTERVAL);
  }, []);

  useEffect(() => {
    startInterval();
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [startInterval]);

  // When we land on a clone page, wait for the transition then snap
  useEffect(() => {
    if (page > PAGE_LAST || page < PAGE_FIRST) {
      const snapTo = page > PAGE_LAST ? PAGE_FIRST : PAGE_LAST;
      const id = setTimeout(() => {
        setAnimate(false);
        setPage(snapTo);
      }, TRANSITION_MS + 20);
      return () => clearTimeout(id);
    }
  }, [page]);

  // Re-enable animation one frame after the no-animation snap
  useEffect(() => {
    if (!animate) {
      const id = requestAnimationFrame(() => requestAnimationFrame(() => setAnimate(true)));
      return () => cancelAnimationFrame(id);
    }
  }, [animate]);

  const tileW  = containerW > 0 ? (containerW - GAP * (TILES - 1)) / TILES : 0;
  const pageW  = containerW + GAP;
  const offset = page * pageW;

  function handlePrev() {
    setPage(p => p - 1);
    startInterval();
  }

  function handleNext() {
    setPage(p => p + 1);
    startInterval();
  }

  return (
    <main className="bg-[#0d0d0d] text-white overflow-x-hidden">
      {/* ── PAGE HERO ── */}
      <section className="relative h-[65vh] flex items-end overflow-hidden">
        <Image
          src="/images/brand/about-hero.JPG"
          fill
          alt="Amal Foods production kitchen – handcrafted pastries being prepared"
          className="object-cover"
          priority
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0d0d0d] via-black/60 to-black/20" />
        <div className="relative z-10 px-6 md:px-16 lg:px-24 max-w-7xl mx-auto w-full pb-20">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-[#B80013] text-xs uppercase tracking-[0.4em] mb-4 font-bold"
          >
            Who We Are
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-5xl md:text-7xl lg:text-8xl font-extrabold uppercase leading-[1.0]"
            style={{ fontFamily: 'var(--font-roboto-condensed)' }}
          >
            We&apos;re Rooted
            <br />
            <span className="text-[#B80013]">In Flavour.</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-4 text-white/50 text-sm tracking-widest uppercase"
          >
            From Durban kitchens to your table. The taste of home in every bite.
          </motion.p>
        </div>
      </section>

      {/* ── OUR STORY ── */}
      <section className="py-28 px-6 md:px-16 lg:px-24">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-16 md:gap-24 items-start">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <p className="text-[#B80013] text-xs uppercase tracking-[0.4em] mb-5 font-bold">
                Our Story
              </p>
              <h2
                className="text-4xl md:text-5xl lg:text-6xl font-extrabold uppercase leading-[1.0]"
                style={{ fontFamily: 'var(--font-roboto-condensed)' }}
              >
                Born in a small
                <br />
                Durban kitchen.
              </h2>
              <div className="mt-8 w-12 h-0.5 bg-[#B80013]" />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.15 }}
              viewport={{ once: true }}
              className="pt-2"
            >
              <p className="text-white/55 leading-relaxed text-[15px] md:text-base mb-5">
                Amal Foods was born in Durban, a small family kitchen serving up golden pastry
                pockets, rich fillings, and recipes passed down through generations. What started as a
                love for flavour turned into a movement to make quality home-style food more accessible.
              </p>
              <p className="text-white/55 leading-relaxed text-[15px] md:text-base">
                From our signature samoosas to crisp spring rolls and soft, flaky parathas, every
                product is prepared with care, sealed with pride, and packed for your convenience, so
                you can heat, eat, and share moments that taste like home.
              </p>
            </motion.div>
          </div>

        </div>

        {/* ── BRAND IMAGE CAROUSEL — same width as home page grid ── */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          viewport={{ once: true }}
          className="mt-20"
        >
          {/* Arrow controls */}
          <div className="flex justify-end gap-2 mb-4">
            <button
              onClick={handlePrev}
              className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center text-white/60 hover:border-white/50 hover:text-white transition-all duration-200"
              aria-label="Previous"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={handleNext}
              className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center text-white/60 hover:border-white/50 hover:text-white transition-all duration-200"
              aria-label="Next"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          {/* Track */}
          <div ref={carouselRef} className="overflow-hidden">
            <div
              className="flex gap-3"
              style={{
                transform: `translateX(-${offset}px)`,
                transition: animate ? `transform ${TRANSITION_MS}ms ease-in-out` : 'none',
                willChange: 'transform',
              }}
            >
              {TRACK.map((src, i) => (
                <div
                  key={i}
                  className="relative flex-shrink-0 rounded-xl overflow-hidden"
                  style={{
                    width: tileW > 0 ? `${tileW}px` : 'calc(20% - 9.6px)',
                    aspectRatio: '3/4',
                  }}
                >
                  <Image
                    src={src}
                    fill
                    alt="Amal Foods handcrafted food photography"
                    className="object-cover"
                    sizes="(max-width: 768px) 40vw, 20vw"
                    quality={90}
                  />
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </section>

      {/* ── MISSION & VALUES ── */}
      <section className="py-4 px-6 md:px-16 lg:px-24 border-t border-white/5">
        <div className="max-w-7xl mx-auto">
          <p className="text-[#B80013] text-xs uppercase tracking-[0.4em] pt-16 pb-2 font-bold">
            Our Values
          </p>
          {values.map((v, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              viewport={{ once: true }}
              className="group grid grid-cols-1 md:grid-cols-[80px_1fr_280px] gap-x-12 gap-y-2 md:gap-y-0 py-12 border-b border-white/8 hover:border-[#B80013]/40 transition-colors duration-300 md:items-center"
            >
              <span
                className="text-[#B80013] font-extrabold text-3xl md:text-4xl leading-none"
                style={{ fontFamily: 'var(--font-roboto-condensed)' }}
              >
                {v.num}
              </span>
              <h3
                className="text-xl md:text-3xl font-extrabold uppercase tracking-tight group-hover:text-[#B80013] transition-colors duration-300"
                style={{ fontFamily: 'var(--font-roboto-condensed)' }}
              >
                {v.title}
              </h3>
              <p className="text-white/45 text-sm leading-relaxed">{v.text}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── TIMELINE ── */}
      <section className="py-28 px-6 md:px-16 lg:px-24" ref={timelineRef}>
        <div className="max-w-7xl mx-auto">
          <p className="text-[#B80013] text-xs uppercase tracking-[0.4em] mb-4 font-bold">
            Our Journey
          </p>
          <h2
            className="text-4xl md:text-5xl font-extrabold uppercase leading-[1.0] mb-20"
            style={{ fontFamily: 'var(--font-roboto-condensed)' }}
          >
            From one kitchen.
            <br />
            <span className="text-[#B80013]">To every table.</span>
          </h2>

          <div className="relative">
            <motion.div
              className="absolute left-[19px] md:left-1/2 top-0 bottom-0 w-px bg-[#B80013]/25 -translate-x-1/2 origin-top"
              initial={{ scaleY: 0 }}
              animate={isInView ? { scaleY: 1 } : {}}
              transition={{ duration: 1.4, ease: 'easeOut' }}
            />

            <div className="relative z-10">
              {timeline.map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: i * 0.1 }}
                  viewport={{ once: true }}
                  className={`relative flex items-start gap-8 md:gap-0 pb-16 ${
                    i % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'
                  } md:flex-row`}
                >
                  <div
                    className={`pl-10 md:pl-0 md:w-[calc(50%-30px)] ${
                      i % 2 === 0 ? 'md:pr-16 md:text-right' : 'md:pl-16 md:ml-auto'
                    }`}
                  >
                    <span
                      className="text-[#B80013] font-extrabold text-2xl block mb-1"
                      style={{ fontFamily: 'var(--font-roboto-condensed)' }}
                    >
                      {item.year}
                    </span>
                    <h3 className="text-white font-bold text-lg mb-2">{item.title}</h3>
                    <p className="text-white/50 text-sm leading-relaxed">{item.text}</p>
                  </div>

                  {/* Center dot */}
                  <div className="absolute left-[19px] md:left-1/2 top-1 -translate-x-1/2 w-3 h-3 bg-[#B80013] rounded-full border-2 border-[#0d0d0d] z-20" />
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="relative py-28 px-6 md:px-16 lg:px-24 bg-[#B80013] overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />
        <div className="relative max-w-7xl mx-auto text-center">
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-5xl md:text-7xl font-extrabold uppercase leading-tight mb-6"
            style={{ fontFamily: 'var(--font-roboto-condensed)' }}
          >
            From our kitchen.
            <br />
            To yours.
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            viewport={{ once: true }}
            className="text-white/80 max-w-xl mx-auto mb-10 text-[15px] leading-relaxed"
          >
            Convenience, flavour, and family together. Heat-and-eat goodness that always tastes
            homemade.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            viewport={{ once: true }}
          >
            <Link
              href="/products"
              className="inline-block bg-black text-white font-bold uppercase tracking-widest text-sm px-10 py-4 rounded-full hover:bg-white hover:text-[#B80013] transition-all duration-300"
            >
              Explore Our Products
            </Link>
          </motion.div>
        </div>
      </section>
    </main>
  );
}
