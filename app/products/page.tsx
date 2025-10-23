"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useState } from "react";
import { sanityClient } from "@/lib/sanityClient";
import ProductCard from "@/components/ProductCard";
import HeroSection from "@/components/HeroSection";
import FilterBar from "@/components/FilterBar";

// ✅ Fixed GROQ Query — aligned with new schema
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
    active
  } | order(title asc)
`;

export default function ProductsPage() {
  const [region, setRegion] = useState<"durban" | "joburg">("durban");
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // 🧭 Load saved region preference
  useEffect(() => {
    const stored = localStorage.getItem("selectedRegion");
    if (stored === "joburg" || stored === "durban") setRegion(stored);
  }, []);

  // 💾 Persist region in localStorage
  useEffect(() => {
    localStorage.setItem("selectedRegion", region);
  }, [region]);

  // 🧠 Fetch products based on region
  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        const data = await sanityClient.fetch(productsByRegionQuery, { region });
        console.log("Fetched products for", region, data);
        setProducts(Array.isArray(data) ? data.filter(Boolean) : []);
      } catch (err) {
        console.error("Error fetching products:", err);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [region]);

  // 🧱 Group into rows (same as before)
  const columns = 5;
  const rows: any[][] = [];
  for (let i = 0; i < products.length; i += columns) {
    rows.push(products.slice(i, i + columns));
  }

  return (
    <>
      {/* 🏷️ Hero Section */}
      <HeroSection
        title="Savor the"
        highlight="Crunch"
        subtitle="Love the taste. Shop our range."
        primaryLabel="Shop Durban"
        secondaryLabel="Shop Joburg"
        onPrimaryClick={() => setRegion("durban")}
        onSecondaryClick={() => setRegion("joburg")}
        activeRegion={region}
      />

      {/* 🔍 Filter Bar */}
      <FilterBar />

      {/* 🛍️ Product Grid */}
      <section className="min-h-screen bg-[#f4f4f4] py-2 text-[#1e1e1e]">
        {loading ? (
          <p className="text-center text-gray-400">Loading products...</p>
        ) : products.length === 0 ? (
          <p className="text-center text-gray-400">
            No products available in this region.
          </p>
        ) : (
          rows.map((row, rowIndex) => (
            <div
              key={rowIndex}
              className={`w-full ${
                rowIndex % 2 === 1 ? "bg-[#272727]" : "bg-[#f4f4f4]"
              } flex justify-center`}
            >
              <div className="max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8 w-full flex justify-center items-center pt-28 pb-20 sm:pt-32 sm:pb-24 md:pt-36 md:pb-28">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-x-6 gap-y-20 sm:gap-y-24 md:gap-y-28 justify-items-center">
                  {row.map((p, i) => (
                    <div
                      className="flex h-full items-stretch justify-center"
                      key={p._id || i}
                    >
                      <ProductCard
                        product={p}
                        index={i + rowIndex * columns}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))
        )}
      </section>
    </>
  );
}
