'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import ProductSlider from '@/components/ProductSlider';

const NEXT_RAMADAN = new Date('2026-12-15T23:59:59');

export default function ProductsPage() {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    function tick() {
      const dist = NEXT_RAMADAN.getTime() - Date.now();
      if (dist <= 0) return setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      setTimeLeft({
        days: Math.floor(dist / 86400000),
        hours: Math.floor((dist / 3600000) % 24),
        minutes: Math.floor((dist / 60000) % 60),
        seconds: Math.floor((dist / 1000) % 60),
      });
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <main className="bg-[#0d0d0d] text-white overflow-x-hidden">
      {/* ── PAGE HERO ── */}
      <section className="relative h-[60vh] flex items-end overflow-hidden">
        <Image
          src="/images/hero3.jpg"
          fill
          alt=""
          className="object-cover"
          priority
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0d0d0d] via-black/65 to-black/20" />
        <div className="relative z-10 px-6 md:px-16 lg:px-24 max-w-7xl mx-auto w-full pb-20">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-[#B80013] text-xs uppercase tracking-[0.4em] mb-4 font-bold"
          >
            Ramadan Season
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-5xl md:text-7xl lg:text-8xl font-extrabold uppercase leading-[1.0]"
            style={{ fontFamily: 'var(--font-roboto-condensed)' }}
          >
            Ramadan Orders
            <br />
            <span className="text-[#B80013]">Closed.</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-4 text-white/50 text-sm tracking-widest uppercase"
          >
            Thank you for your incredible support this season.
          </motion.p>
        </div>
      </section>

      {/* ── THANK YOU + COUNTDOWN ── */}
      <section className="py-28 px-6 md:px-16 lg:px-24">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-16 md:gap-24 items-start">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <p className="text-[#B80013] text-xs uppercase tracking-[0.4em] mb-5 font-bold">
                A Note of Thanks
              </p>
              <h2
                className="text-4xl md:text-5xl font-extrabold uppercase leading-[1.0]"
                style={{ fontFamily: 'var(--font-roboto-condensed)' }}
              >
                Thank You for Your Support.
              </h2>
              <div className="mt-6 w-12 h-0.5 bg-[#B80013]" />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.15 }}
              viewport={{ once: true }}
              className="pt-2"
            >
              <p className="text-white/55 leading-relaxed text-[15px] md:text-base mb-5">
                Ramadan pre-orders for this season are now closed. We are deeply grateful for the
                overwhelming trust and support from our community.
              </p>
              <p className="text-white/55 leading-relaxed text-[15px] md:text-base mb-10">
                Our kitchens are now fully dedicated to preparing every dish with the care, quality,
                and tradition your family deserves during this blessed month. We look forward to
                serving you again — until then, may peace and goodness fill your home.
              </p>
              <Link
                href="/contact"
                className="group/link inline-flex items-center gap-3 text-white font-bold uppercase text-sm tracking-widest"
              >
                <span className="group-hover/link:text-[#B80013] transition-colors duration-200">
                  Contact Us
                </span>
                <span className="w-8 h-px bg-white group-hover/link:w-16 group-hover/link:bg-[#B80013] transition-all duration-300 inline-block" />
              </Link>
            </motion.div>
          </div>

          {/* Countdown */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
            className="mt-24 pt-16 border-t border-white/8"
          >
            <p className="text-[#B80013] text-xs uppercase tracking-[0.4em] mb-10 font-bold">
              Next Ramadan in
            </p>
            <div className="flex flex-wrap gap-12">
              {[
                { label: 'Days', value: timeLeft.days },
                { label: 'Hours', value: timeLeft.hours },
                { label: 'Minutes', value: timeLeft.minutes },
                { label: 'Seconds', value: timeLeft.seconds },
              ].map((u, i) => (
                <div key={i}>
                  <div
                    className="text-6xl md:text-8xl font-extrabold text-white leading-none"
                    style={{ fontFamily: 'var(--font-roboto-condensed)' }}
                  >
                    {String(u.value).padStart(2, '0')}
                  </div>
                  <div className="text-white/40 text-xs uppercase tracking-[0.3em] mt-2">
                    {u.label}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── PRODUCT SLIDER ── */}
      <ProductSlider />

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
          <Link
            href="/about"
            className="inline-block bg-black text-white font-bold uppercase tracking-widest text-sm px-10 py-4 rounded-full hover:bg-white hover:text-[#B80013] transition-all duration-300"
          >
            Learn Our Story
          </Link>
        </div>
      </section>
    </main>
  );
}
