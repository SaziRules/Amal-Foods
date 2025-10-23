"use client";

import HomeHero from "@/components/HomeHero";
import ProductCard from "@/components/ProductCard";
import Image from "next/image";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { sanityClient } from "@/lib/sanityClient";
import { Leaf, HeartHandshake, Clock } from "lucide-react"; // ✅ Lucide icons

export default function HomePage() {
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    sanityClient
      .fetch(
        `*[_type == "product" && active == true][0..4]{
          _id, title, unit, "imageUrl": image.asset->url, pricing
        }`
      )
      .then(setProducts)
      .catch(console.error);
  }, []);

  return (
    <main className="bg-[#111] text-white overflow-x-hidden">
      <HomeHero />

      {/* 🧁 Highlights */}
<section className="py-24 px-6 md:px-16 lg:px-24 bg-[#F4F4F4] text-[#111]">
  <div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-8 text-center">
    {[
      {
        icon: <Leaf size={42} strokeWidth={1.5} />,
        title: "Freshly Made",
        text: "Every batch is handcrafted with care — from the kneading of our dough to the sealing of each flaky pastry. We prepare daily to lock in freshness and ensure every bite delivers that just-made aroma and crisp golden texture you love.",
      },
      {
        icon: <HeartHandshake size={42} strokeWidth={1.5} />,
        title: "Family Recipes",
        text: "Our recipes come straight from Durban family kitchens where every meal tells a story. Generations have perfected these blends of spice and comfort — and now, we bring that same heart and heritage straight to your home.",
      },
      {
        icon: <Clock size={42} strokeWidth={1.5} />,
        title: "Ready in Minutes",
        text: "Life moves fast — but good food shouldn’t fall behind. Our heat-and-eat range is designed for convenience without compromise, giving you authentic flavour and warmth on your plate in just a few easy minutes.",
      },
    ].map((item, i) => (
      <motion.div
        key={i}
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: i * 0.2 }}
        viewport={{ once: true }}
        className="bg-white rounded-2xl shadow-md p-8 border border-gray-200 hover:shadow-xl transition group"
      >
        <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 rounded-full bg-[#B80013]/10 text-[#B80013] group-hover:bg-[#B80013] group-hover:text-white transition-all duration-300">
          {item.icon}
        </div>
        <h3 className="font-bold text-lg mb-3 text-[#B80013]">{item.title}</h3>
        <p className="text-gray-700 text-sm leading-relaxed">{item.text}</p>
      </motion.div>
    ))}
  </div>
</section>


      {/* ⭐ Featured Favourites */}
      <section className="py-24 px-6 md:px-16 lg:px-24 bg-[#111] text-white border-t border-white/10">
        <div className="max-w-7xl mx-auto text-center mb-[7%]">
          <h2 className="text-3xl md:text-4xl font-bold text-[#B80013]">Featured Favourites</h2>
          <p className="text-gray-300 mt-3">
            A taste of our best-selling range — fresh, flaky, and full of flavour.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-8 justify-items-center">
          {products.map((p, i) => (
            <ProductCard key={p._id} product={p} index={i} />
          ))}
        </div>

        <div className="text-center mt-12">
          <a
            href="/products"
            className="inline-block bg-white text-[#B80013] font-semibold rounded-full px-8 py-3 hover:bg-gray-100 transition"
          >
            View All Products
          </a>
        </div>
      </section>

      {/* 📖 About CTA */}
      <section className="py-24 px-6 md:px-16 lg:px-24 bg-[#F4F4F4] text-[#111]">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <Image
              src="/images/about.png"
              alt="Amal story visual"
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
            <h2 className="text-3xl md:text-4xl font-bold text-[#B80013] mb-4">Our Story</h2>
            <p className="text-gray-800 leading-relaxed text-[15px] md:text-base">
              From humble beginnings to homes across South Africa — Amal Foods is the story of taste,
              tradition, and togetherness.
            </p>
            <a
              href="/about"
              className="mt-6 inline-block bg-[#B80013] text-white font-semibold rounded-full px-8 py-3 hover:bg-[#a20010] transition"
            >
              Learn More
            </a>
          </motion.div>
        </div>
      </section>

      {/* ❤️ Red CTA Footer */}
      <section className="bg-[#B80013] text-white text-center py-20 px-6 md:px-16 lg:px-24">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">Made with Love. Ready in Minutes.</h2>
        <p className="text-white/90 max-w-2xl mx-auto mb-8">
          Bringing the warmth of Durban kitchens to tables everywhere.
        </p>
        <a
          href="/products"
          className="inline-block bg-white text-[#B80013] font-semibold rounded-full px-8 py-3 hover:bg-gray-200 transition"
        >
          Explore Our Range
        </a>
      </section>
    </main>
  );
}
