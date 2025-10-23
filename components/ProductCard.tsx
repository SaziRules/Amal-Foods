"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useCart } from "@/context/CartContext";

interface ProductCardProps {
  product?: {
    _id?: string;
    title?: string;
    pricing?: {
      durban?: number;
      joburg?: number;
    };
    available_in?: string[];
    unit?: string;
    description?: string;
    imageUrl?: string;
  };
  index: number; // used to alternate red/black
}

export default function ProductCard({ product, index }: ProductCardProps) {
  const { addToCart, removeFromCart, updateQuantity, cart, selectedRegion } = useCart();
  const [quantity, setQuantity] = useState(0);
  const [region, setRegion] = useState<"durban" | "joburg">("durban");
  const [added, setAdded] = useState(false); // ✨ visual feedback

  if (!product) return null;

  // 🧭 Get region from storage
  useEffect(() => {
    const storedRegion = localStorage.getItem("selectedRegion");
    if (storedRegion === "joburg" || storedRegion === "durban") {
      setRegion(storedRegion);
    }
  }, []);

  // 🏷️ Extract data
  const title = product.title ?? "PARATHA SAMOOSA";
  const desc =
    product.description ??
    "Discreet protection for moderate incontinence.";
  const imageSrc = product.imageUrl ?? "/placeholder.png";
  const id = product._id ?? title;

  // 💰 Determine price
  const price =
    region === "joburg"
      ? product.pricing?.joburg ?? 0
      : product.pricing?.durban ?? 0;
  const priceText = price ? `R${price}` : "R—";
  const isRed = index % 2 === 0;

  // 🏬 Hide product if not available in this region
  const availableRegions = product.available_in ?? ["durban", "joburg"];
  if (!availableRegions.includes(region)) return null;

  // 🔄 Sync quantity from global cart
  useEffect(() => {
    const existing = cart.find((item: any) => item.id === id);
    setQuantity(existing ? existing.quantity : 0);
  }, [cart, id]);

  // ➕ Add to cart
  const handleAdd = () => {
    const existing = cart.find((item: any) => item.id === id);
    if (!existing) {
      addToCart({
        id,
        title,
        price,
        image: imageSrc,
        quantity: 1,
        region,
      });
      setQuantity(1);
      setAdded(true); // trigger visual glow
      setTimeout(() => setAdded(false), 600); // reset glow
    } else {
      // ✅ Only allow increment if same region
      if (selectedRegion === region) {
        const newQty = quantity + 1;
        setQuantity(newQty);
        updateQuantity(id, newQty);
      }
    }
  };

  // ➖ Remove or decrement
  const handleSubtract = () => {
    const newQty = Math.max(quantity - 1, 0);
    setQuantity(newQty);
    if (newQty === 0) removeFromCart(id);
    else updateQuantity(id, newQty);
  };

  // 💄 Add-to-cart animation class
  const glowClass = added ? "animate-cart-glow" : "";

  return (
    <div className="w-[180px] sm:w-[220px] md:w-[240px] lg:w-[260px] text-center select-none flex flex-col h-full">
      <div
        className={`relative rounded-[100px] md:rounded-[120px] shadow-lg transition-transform duration-300 hover:scale-[1.02] ${
          isRed ? "bg-[#B80013]" : "bg-[#1e1e1e]"
        }`}
      >
        {/* Capsule Content */}
        <div className="pt-8 pb-10 px-4 sm:px-5 md:px-6">
          {/* IMAGE */}
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

            <p className="text-[12px] sm:text-[13px] md:text-[14px] leading-snug mt-2 text-white/95 line-clamp-3 overflow-hidden text-ellipsis">
              {desc}
            </p>

            {/* ✅ CART / QUANTITY BUTTON */}
            {quantity > 0 && selectedRegion === region ? (
              // Show quantity controls only for valid region cart
              <div className="mt-6 mb-3 flex items-center justify-center gap-3">
                <button
                  onClick={handleSubtract}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white text-lg font-bold transition"
                >
                  −
                </button>

                <span className="min-w-[24px] text-white font-bold text-sm select-none">
                  {quantity}
                </span>

                <button
                  onClick={handleAdd}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white text-lg font-bold transition"
                >
                  +
                </button>
              </div>
            ) : (
              // Show Add-to-cart button by default
              <button
                onClick={handleAdd}
                className={`mt-6 mb-3 inline-block cursor-pointer rounded-full px-5 sm:px-6 md:px-7 py-2 sm:py-2.5 md:py-3 font-bold text-[11px] sm:text-[12px] md:text-[14px] uppercase transition ${glowClass} ${
                  isRed
                    ? "bg-[#1e1e1e] text-white hover:scale-105"
                    : "bg-[#B80013] text-white hover:scale-105"
                }`}
              >
                Add to Cart
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
