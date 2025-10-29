"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useState } from "react";
import { sanityClient } from "@/lib/sanityClient";
import ProductCard from "@/components/ProductCard";
import HeroSection from "@/components/HeroSection";
import FilterBar from "@/components/FilterBar";

// ✅ GROQ Query unchanged — we'll just match local region key
const productsByRegionQuery = `
  *[
    _type == "product" &&
    active == true &&
    $region in coalesce(available_in, [])
  ]{
    _id,
    title,
    unit,
    description,
    "imageUrl": image.asset->url,
    available_in,
    pricing,
    "category": category,
    label, // ✅ ADD THIS LINE
    active
  } | order(title asc)
`;


export default function ProductsPage() {
  type Region = "durban" | "joburg" | "capetown";

  const [region, setRegion] = useState<Region>("durban");
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNotice, setShowNotice] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // 🧭 Load region preference
  useEffect(() => {
    const stored = localStorage.getItem("selectedRegion");
    if (stored === "joburg" || stored === "durban" || stored === "capetown") {
      setRegion(stored);
    }
  }, []);

  // 💾 Persist region
  useEffect(() => {
    localStorage.setItem("selectedRegion", region);
  }, [region]);

  // 🧠 Fetch products
  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        const data = await sanityClient.fetch(productsByRegionQuery, { region });
        const validProducts = Array.isArray(data) ? data.filter(Boolean) : [];
        setProducts(validProducts);

        // 🪟 Show modal if region has no available products
        setShowModal(validProducts.length === 0);
      } catch (err) {
        console.error("Error fetching products:", err);
        setProducts([]);
        setShowModal(true);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [region]);

  // 🗺️ Local contact messages for unavailable regions
  const contactInfo: Record<Region, string> = {
    joburg:
      "For Gauteng orders please contact Zakiya on 083 457 8662 or Zahara on 083 777 7401 for the relevant order form.",
    durban:
      "For Durban orders please contact Zakiya on 083 457 8662 or Zahara on 083 777 7401 for the relevant order form.",
    capetown:
      "For Cape Town orders please contact Zakiya on 083 457 8662 or Zahara on 083 777 7401 for the relevant order form.",
  };

  // 🧩 Desired category order (from your schema)
  const categoryOrder = [
    { title: "Parathas", value: "parathas" },
    { title: "Samoosas", value: "samoosas" },
    { title: "Spring Rolls", value: "spring-rolls" },
    { title: "Pies", value: "pies" },
    { title: "Rockets & Pillows", value: "rockets-and-pillows" },
    { title: "Ready to Heat", value: "ready-to-heat" },
  ];

  return (
    <>
      {/* 🏷️ Hero Section */}
      <HeroSection
        title="Savor the"
        highlight="Crunch"
        subtitle="Love the taste. Shop our range."
        primaryLabel="Shop Durban"
        secondaryLabel="Shop Joburg"
        tertiaryLabel="Shop CPT"
        onPrimaryClick={() => setRegion("durban")}
        onSecondaryClick={() => setRegion("joburg")}
        onTertiaryClick={() => setRegion("capetown")}
        activeRegion={region}
      />

      {/* 🔍 Filter Bar */}
      <FilterBar />

      {/* 🛍️ Product Grid by Category */}
      <section className="min-h-screen bg-[#f4f4f4] py-12 text-[#1e1e1e]">
        {loading ? (
          <p className="text-center text-gray-400">Loading products...</p>
        ) : (
          (() => {
            const grouped = categoryOrder
              .map((cat) => ({
                ...cat,
                items: products.filter((p) => p.category === cat.value),
              }))
              .filter((g) => g.items.length > 0);

            if (grouped.length === 0) {
              return (
                <p className="text-center text-gray-400">
                  No products available in this region.
                </p>
              );
            }

            return grouped.map((group, idx) => (
              <div
                key={group.value}
                className="max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-8 mb-24"
              >
                <h2 className="text-3xl font-bold text-[#B80013] mb-10 text-center uppercase tracking-wide">
                  {group.title}
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-10 place-items-center">
                  {group.items.map((p, i) => (
                    <ProductCard key={p._id ?? i} product={p} index={i} />
                  ))}
                </div>

                {/* Optional divider between categories */}
                {idx !== grouped.length - 1 && (
                  <hr className="my-16 border-t border-gray-300/40 mx-auto w-2/3" />
                )}
              </div>
            ));
          })()
        )}
      </section>

      {/* 🧷 Sticky Floating Notice */}
      {showNotice && (
        <div
          className="fixed bottom-6 left-6 z-50 flex items-center gap-3 px-6 py-3 
                     bg-[#1E1E1E] text-white rounded-full shadow-lg 
                     animate-slideIn opacity-95 hover:opacity-100 transition"
        >
          <span className="text-[13px] sm:text-[14px] font-medium">
            Minimum Order Quantity Of{" "}
            <strong>10 Items Per Cart To Proceed To Checkout</strong>
          </span>
          <button
            onClick={() => setShowNotice(false)}
            className="ml-2 text-white/70 hover:text-white text-[16px] font-bold transition"
          >
            ✕
          </button>
        </div>
      )}

      {/* 🪟 Region Contact Modal — styled to match CustomerLogin */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-[2px]">
          <div className="relative w-[90%] max-w-md bg-[#111]/85 border border-white/10 p-10 rounded-2xl text-center shadow-[0_0_25px_rgba(255,0,0,0.2)] text-white animate-fadeIn">
            {/* Header */}
            <h2 className="text-3xl font-bold text-[#B80013] mb-3 drop-shadow-md">
              Region Unavailable
            </h2>

            {/* Message */}
            <p className="text-gray-300 text-sm leading-relaxed mb-6">
              {contactInfo[region]}
            </p>

            {/* Close Button */}
            <button
              onClick={() => setShowModal(false)}
              className="w-full rounded-full bg-red-700 hover:bg-red-800 py-3 font-semibold text-sm tracking-wide transition-all shadow-[0_0_15px_rgba(255,0,0,0.3)]"
            >
              Close
            </button>

            {/* Footer */}
            <p className="mt-8 text-xs text-gray-400">
              Need more help?{" "}
              <span className="text-[#B80013] hover:underline cursor-pointer">
                Contact Support
              </span>
            </p>
          </div>
        </div>
      )}
    </>
  );
}
