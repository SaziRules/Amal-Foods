"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useState } from "react";
import { sanityClient } from "@/lib/sanityClient";
import { productsByRegionQuery } from "@/lib/queries";
import ProductCard from "@/components/ProductCard";
import HeroSection from "@/components/HeroSection";
import FilterBar from "@/components/FilterBar"; // ✅ imported

export default function ProductsPage() {
  const [region, setRegion] = useState("durban");
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      const query = productsByRegionQuery(region);
      const data = await sanityClient.fetch(query);
      setProducts(Array.isArray(data) ? data.filter(Boolean) : []);
      setLoading(false);
    };
    run();
  }, [region]);

  const columns = 5;
  const rows: any[][] = [];
  for (let i = 0; i < products.length; i += columns) {
    rows.push(products.slice(i, i + columns));
  }

  return (
    <>
      {/* ✅ Hero Section */}
      <HeroSection
        title="Savor the"
        highlight="Crunch"
        subtitle="Love the taste. Shop our range."
        primaryLabel="Shop Durban"
        secondaryLabel="Shop Joburg"
        onPrimaryClick={() => setRegion("durban")}
        onSecondaryClick={() => setRegion("joburg")}
      />

      {/* ✅ Filter Bar replaces heading and region buttons */}
      <FilterBar />

      {/* ✅ Product Section remains the same */}
      <section className="min-h-screen bg-[#f4f4f4] py-20 text-[#1e1e1e]">
        {loading ? (
          <p className="text-center text-gray-400">Loading products...</p>
        ) : (
          rows.map((row, rowIndex) => (
            <div
              key={rowIndex}
              className={`w-full ${
                rowIndex % 2 === 1 ? "bg-[#272727]" : "bg-[#f4f4f4]"
              } flex justify-center`}
            >
              {/* 
                Balanced vertical padding to visually center capsules and overlapped images
              */}
              <div className="max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8 w-full flex justify-center items-center pt-28 pb-20 sm:pt-32 sm:pb-24 md:pt-36 md:pb-28">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-x-6 gap-y-20 sm:gap-y-24 md:gap-y-28 justify-items-center">
                  {row.map((p, i) => (
                    <div
                      className="flex h-full items-stretch justify-center"
                      key={p._id || i}
                    >
                      <ProductCard product={p} index={i + rowIndex * columns} />
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
