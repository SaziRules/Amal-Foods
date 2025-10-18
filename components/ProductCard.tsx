"use client";

import Image from "next/image";

interface ProductCardProps {
  product?: {
    _id?: string;
    title?: string;
    price?: number;
    unit?: string;
    description?: string;
    imageUrl?: string;
  };
  index: number; // used to alternate red/black
}

export default function ProductCard({ product, index }: ProductCardProps) {
  if (!product) return null;

  const title = product.title ?? "PARATHA SAMOOSA";
  const priceText = product.price ? `R${product.price}` : "R—";
  const desc =
    product.description ?? "Discreet protection for moderate incontinence.";
  const imageSrc = product.imageUrl ?? "/placeholder.png";

  // alternate themes: even = red capsule + black badge, odd = black capsule + red badge
  const isRed = index % 2 === 0;

  return (
    <div className="w-[180px] sm:w-[220px] md:w-[240px] lg:w-[260px] text-center select-none flex flex-col h-full">

      <div
        className={`relative rounded-[100px] md:rounded-[120px] shadow-lg transition-transform duration-300 hover:scale-[1.02] ${
          isRed ? "bg-[#B80013]" : "bg-[#1e1e1e]"
        }`}
      >
        {/* Capsule Content */}
        <div className="pt-8 pb-10 px-4 sm:px-5 md:px-6">
          {/* IMAGE (sits on top of capsule) */}
          <div className="relative flex justify-center mt-[-80px] sm:mt-[-90px] md:mt-[-100px]">
            <Image
              src={imageSrc}
              alt={title}
              width={180}
              height={180}
              className="object-contain drop-shadow-md"
              unoptimized
            />

            {/* PRICE CIRCLE */}
            <div className="absolute -bottom-4 left-1/2 -translate-x-1/2">
              <div
                className={`w-16 h-16 sm:w-18 sm:h-18 md:w-20 md:h-20 rounded-full shadow-xl flex items-center justify-center font-extrabold text-[18px] sm:text-[20px] md:text-[22px] leading-none text-white ${
                  isRed ? "bg-[#1e1e1e]" : "bg-[#B80013]"
                }`}
              >
                {priceText}
              </div>
            </div>
          </div>

          {/* TEXT BLOCK */}
          <div className="pt-8">
            <h3 className="text-[14px] sm:text-[16px] md:text-[18px] font-extrabold tracking-wide uppercase text-white">
              {title}
            </h3>

            <p className="text-[12px] sm:text-[13px] md:text-[14px] leading-snug mt-2 text-white/95">
              {desc}
            </p>

            {/* CTA */}
            <button
              className={`mt-6 mb-3 inline-block cursor-pointer rounded-full px-5 sm:px-6 md:px-7 py-2 sm:py-2.5 md:py-3 font-bold text-[11px] sm:text-[12px] md:text-[14px] uppercase transition ${
                isRed
                  ? "bg-[#1e1e1e] text-white hover:scale-105"
                  : "bg-[#B80013] text-white hover:scale-105"
              }`}
            >
              Add to Cart
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
