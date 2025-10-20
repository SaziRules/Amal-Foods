"use client";

import { motion, useInView } from "framer-motion";
import Image from "next/image";
import HeroSection from "@/components/HeroSection";
import { Heart, Users, CheckCircle } from "lucide-react";
import { useRef } from "react";

export default function AboutPage() {
  const values = [
    {
      icon: <Heart size={30} />,
      title: "Authenticity",
      desc: "We keep it real — no shortcuts, no compromises. Every Amal product carries the flavour and comfort of a homemade meal.",
    },
    {
      icon: <Users size={30} />,
      title: "Community",
      desc: "We’re proudly local — built on family kitchens, community stores, and the joy of sharing food that brings people together.",
    },
    {
      icon: <CheckCircle size={30} />,
      title: "Quality",
      desc: "From our crisp pastry rolls to golden samoosas, quality and freshness come first — every pack, every time.",
    },
  ];

  const timeline = [
    {
      year: "2005",
      title: "A Kitchen Dream",
      text: "What began in a small Durban kitchen with a single batch of samoosas soon became a neighbourhood favourite.",
    },
    {
      year: "2010",
      title: "Bringing Heat & Eat to Homes",
      text: "We launched our first frozen range — ready to heat, crisp, and enjoy — making home entertaining effortless.",
    },
    {
      year: "2015",
      title: "Expanding to Johannesburg",
      text: "Our second branch opened, helping us bring authentic Durban-style flavour to Gauteng and beyond.",
    },
    {
      year: "2020",
      title: "Innovation in Every Bite",
      text: "We modernised our range with premium fillings, new pastry recipes, and eco-friendly packaging.",
    },
    {
      year: "2024",
      title: "The Next Chapter",
      text: "Today, Amal Foods stands for quality, convenience, and taste — made with love, ready in minutes.",
    },
  ];

  const timelineRef = useRef(null);
  const isInView = useInView(timelineRef, { once: true, amount: 0.2 });

  return (
    <main className="bg-[#111] text-white">
      {/* 🧱 HERO */}
      <HeroSection
        title="We're Rooted"
        highlight="In Flavour."
        subtitle="From Durban kitchens to your table — the taste of home in every bite."
        primaryLabel="Our Journey"
        secondaryLabel="Shop Now"
      />

      {/* 📖 OUR STORY */}
      <section className="bg-[#F4F4F4] text-[#111] py-24 px-6 md:px-16 lg:px-24">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <Image
              src="/images/about.png"
              alt="Amal Foods Pastry Preparation"
              width={600}
              height={500}
              className="rounded-2xl shadow-xl object-cover"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-[#B80013] mb-6">
              Our Story
            </h2>
            <p className="text-gray-800 leading-relaxed text-[15px] md:text-base">
              Amal Foods was born in Durban — a small family kitchen serving
              up golden pastry pockets, rich fillings, and recipes passed down
              through generations. What started as a love for flavour turned
              into a movement to make quality home-style food more accessible.
            </p>
            <p className="text-gray-800 leading-relaxed mt-4 text-[15px] md:text-base">
              From our signature samoosas to crisp spring rolls and soft, flaky
              parathas, every product is prepared with care, sealed with pride,
              and packed for your convenience — so you can heat, eat, and share
              moments that taste like home.
            </p>
          </motion.div>
        </div>
      </section>

      {/* 💡 MISSION & VALUES */}
      <section className="py-24 px-6 md:px-16 lg:px-24 bg-[#111] text-white border-t border-white/10">
        <div className="max-w-7xl mx-auto text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-bold text-[#B80013]">
            Our Mission & Values
          </h2>
          <p className="text-gray-300 mt-3 max-w-3xl mx-auto">
            At Amal Foods, we make it easy to enjoy authentic taste — quick,
            simple, and delicious. Because great food should never feel out of
            reach.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {values.map((val, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: i * 0.2 }}
              viewport={{ once: true }}
              className="p-8 rounded-2xl border border-white/10 bg-[#1a1a1a] shadow-lg hover:-translate-y-1 hover:shadow-2xl hover:shadow-[#B80013]/10 transition-all duration-300 text-center"
            >
              <div className="bg-[#B80013] w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4">
                {val.icon}
              </div>
              <h3 className="text-lg font-semibold mb-2">{val.title}</h3>
              <p className="text-gray-300 text-sm">{val.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* 🕰️ TIMELINE SECTION */}
      <section className="py-24 px-6 md:px-16 lg:px-24 bg-[#F4F4F4] text-[#111]" ref={timelineRef}>
        <div className="max-w-6xl mx-auto text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-bold text-[#B80013]">
            Our Journey
          </h2>
          <p className="text-gray-700 mt-3 max-w-3xl mx-auto">
            From a family kitchen to South African homes everywhere — here’s how Amal Foods grew, one flaky, golden milestone at a time.
          </p>
        </div>

        <div className="relative max-w-5xl mx-auto">
          {/* Animated timeline line */}
          <motion.div
            className="absolute left-1/2 top-0 bottom-0 w-[2px] bg-[#B80013]/80 transform -translate-x-1/2 origin-top"
            initial={{ scaleY: 0 }}
            animate={isInView ? { scaleY: 1 } : {}}
            transition={{ duration: 1.2, ease: "easeOut" }}
          />

          <div className="space-y-16 relative z-10">
            {timeline.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: i * 0.15 }}
                viewport={{ once: true }}
                className={`relative flex flex-col md:flex-row items-center gap-6 ${
                  i % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"
                }`}
              >
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 w-full md:w-[45%]">
                  <h3 className="text-xl font-bold text-[#B80013] mb-2">
                    {item.year} — {item.title}
                  </h3>
                  <p className="text-gray-700 text-sm leading-relaxed">{item.text}</p>
                </div>
                <div className="hidden md:block w-6 h-6 bg-[#B80013] rounded-full border-4 border-white shadow-md z-20" />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ❤️ CTA SECTION */}
      <section className="bg-[#B80013] text-white text-center py-20 px-6 md:px-16 lg:px-24">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">
          From our kitchen to yours
        </h2>
        <p className="text-white/90 max-w-2xl mx-auto mb-8">
          Bringing convenience, flavour, and family together — Amal Foods
          delivers heat-and-eat goodness that always tastes homemade.
        </p>
        <a
          href="/products"
          className="inline-block bg-white text-[#B80013] font-semibold rounded-full px-8 py-3 text-sm md:text-base hover:bg-gray-200 transition"
        >
          Explore Our Products
        </a>
      </section>
    </main>
  );
}
