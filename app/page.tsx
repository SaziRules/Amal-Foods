'use client';

import HomeHero from '@/components/HomeHero';
import ProductSlider from '@/components/ProductSlider';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';

const pillars = [
  {
    num: '01',
    title: 'Freshly Made',
    text: 'Every batch is handcrafted with care, from the kneading of our dough to the sealing of each flaky pastry. We prepare daily to lock in freshness and ensure every bite delivers that just-made aroma and crisp golden texture.',
  },
  {
    num: '02',
    title: 'Family Recipes',
    text: 'Our recipes come straight from Durban family kitchens where every meal tells a story. Generations have perfected these blends of spice and comfort, and now we bring that same heart and heritage straight to your home.',
  },
  {
    num: '03',
    title: 'Ready in Minutes',
    text: 'Our heat-and-eat range is designed for convenience without compromise, authentic flavour and warmth on your plate in just a few easy minutes.',
  },
];

export default function HomePage() {
  return (
    <main className="bg-[#0d0d0d] text-white overflow-x-hidden">
      <HomeHero />

      {/* ── EDITORIAL PILLARS ── */}
      <section className="py-4 px-6 md:px-16 lg:px-24 border-t border-white/5">
        <div className="max-w-7xl mx-auto">
          {pillars.map((p, i) => (
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
                {p.num}
              </span>
              <h3
                className="text-xl md:text-3xl font-extrabold uppercase tracking-tight group-hover:text-[#B80013] transition-colors duration-300"
                style={{ fontFamily: 'var(--font-roboto-condensed)' }}
              >
                {p.title}
              </h3>
              <p className="text-white/45 text-sm leading-relaxed">{p.text}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <ProductSlider />

      {/* ── CINEMATIC VIDEO BREAK ── */}
      <section className="relative h-[85vh] overflow-hidden">
        <video
          src="/videos/hero2.mp4"
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/60" />
        <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-6">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-[#B80013] text-xs uppercase tracking-[0.4em] mb-6 font-bold"
          >
            Our Promise
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            viewport={{ once: true }}
            className="text-5xl md:text-7xl lg:text-[88px] font-extrabold uppercase leading-[1.0] max-w-5xl"
            style={{ fontFamily: 'var(--font-roboto-condensed)', letterSpacing: '1px' }}
          >
            Born in Durban.
            <br />
            <span className="text-[#B80013]">Built for Every Table.</span>
          </motion.h2>
          <motion.div
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            viewport={{ once: true }}
            className="mt-8 w-24 h-0.5 bg-[#B80013] origin-left"
          />
        </div>
      </section>

      {/* ── STORY SPLIT ── */}
      <section className="py-28 px-6 md:px-16 lg:px-24">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-16 md:gap-24 items-start">
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
              Taste the tradition behind every bite.
            </h2>
            <div className="mt-8 w-12 h-0.5 bg-[#B80013]" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            viewport={{ once: true }}
            className="flex flex-col justify-between pt-2"
          >
            <p className="text-white/55 leading-relaxed text-[15px] md:text-base mb-5">
              From humble beginnings to homes across South Africa, Amal Foods is the story of taste,
              tradition, and togetherness. What began as a small family venture has grown into a brand
              trusted by families, chefs, and retailers alike.
            </p>
            <p className="text-white/55 leading-relaxed text-[15px] md:text-base mb-10">
              Every product we make carries the same promise we started with, to deliver freshness,
              consistency, and that unmistakable Amal quality in every bite.
            </p>
            <Link
              href="/about"
              className="group/link inline-flex items-center gap-3 text-white font-bold uppercase text-sm tracking-widest w-fit"
            >
              <span className="group-hover/link:text-[#B80013] transition-colors duration-200">
                Read Our Story
              </span>
              <span className="w-8 h-px bg-white group-hover/link:w-16 group-hover/link:bg-[#B80013] transition-all duration-300 inline-block" />
            </Link>
          </motion.div>
        </div>

        {/* 5-col brand image grid */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          viewport={{ once: true }}
          className="mt-20 grid grid-cols-2 md:grid-cols-5 gap-3"
        >
          {[
            '/images/brand/P64A2825.JPG',
            '/images/brand/P64A2912.jpg',
            '/images/brand/P64A2977.JPG',
            '/images/brand/P64A3087.JPG',
            '/images/brand/P64A3148.JPG',
          ].map((src, i) => (
            <div
              key={i}
              className={`relative aspect-[3/4] rounded-xl overflow-hidden${i === 4 ? ' col-span-2 md:col-span-1' : ''}`}
            >
              <Image
                src={src}
                fill
                alt=""
                className="object-cover hover:scale-105 transition-transform duration-700"
                sizes="(max-width: 768px) 50vw, 20vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/25 to-transparent" />
            </div>
          ))}
        </motion.div>
      </section>

      {/* ── RED CTA ── */}
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
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="text-white/60 text-xs uppercase tracking-[0.4em] mb-6 font-bold"
          >
            Made with Love
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            viewport={{ once: true }}
            className="text-5xl md:text-7xl font-extrabold uppercase leading-tight mb-6"
            style={{ fontFamily: 'var(--font-roboto-condensed)' }}
          >
            Made with Love.
            <br />
            Ready in Minutes.
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            viewport={{ once: true }}
            className="text-white/80 max-w-xl mx-auto mb-10 text-[15px] leading-relaxed"
          >
            Bringing the warmth of Durban kitchens to tables everywhere.
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
              Explore Our Range
            </Link>
          </motion.div>
        </div>
      </section>
    </main>
  );
}
