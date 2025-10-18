"use client";

import Image from "next/image";
import { useState } from "react";
import { SlidersHorizontal } from "lucide-react";

export default function FilterBar() {
  const [activeItem, setActiveItem] = useState<string | null>(null);

  const filters = [
    { label: "SORT BY PRICE" },
    { label: "SORT BY DATE" },
    { label: "FILTER BY TYPE", icon: SlidersHorizontal },
  ];

  const toggles = ["ON SPECIAL", "DESCENDING", "ASCENDING"];

  return (
    <section className="w-full bg-[#f4f4f4] border-t border-b border-gray-200 font-['Roboto'] mt-1">
      <div className="max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center py-2.5">
        {/* LEFT SIDE */}
        <div className="flex items-center gap-6 md:gap-10 flex-wrap justify-center md:justify-start">
          {/* Grid icon */}
          <button
            aria-label="Grid View"
            className="flex items-center justify-center w-10 h-10 bg-transparent hover:bg-gray-100 transition border border-transparent "
          >
            <Image
              src="/images/grid.svg"
              alt="Grid icon"
              width={18}
              height={18}
              className="opacity-70"
            />
          </button>

          {/* Filter Buttons */}
          {filters.map(({ label, icon: Icon }, i) => (
            <button
              key={i}
              onClick={() => setActiveItem(label)}
              className={`flex items-center gap-2 text-[14px] font-normal tracking-[0.04em] uppercase transition ${
                activeItem === label
                  ? "text-[#B80013]"
                  : "text-[#D9D9D9] hover:text-gray-400"
              }`}
            >
              {Icon && <Icon className="w-[15px] h-[15px]" />}
              {label}
            </button>
          ))}
        </div>

        {/* RIGHT SIDE */}
        <div className="flex items-center gap-6 md:gap-10 flex-wrap justify-center md:justify-end mt-2 md:mt-0">
          {toggles.map((toggle, i) => (
            <button
              key={i}
              onClick={() => setActiveItem(toggle)}
              className={`text-[14px] font-normal tracking-[0.04em] uppercase transition ${
                activeItem === toggle
                  ? "text-[#B80013]"
                  : "text-[#D9D9D9] hover:text-gray-400"
              }`}
            >
              {toggle}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
