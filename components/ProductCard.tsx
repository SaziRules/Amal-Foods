"use client";

import { useState, useEffect } from "react";
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
    label?: string; // ✅ allow label/tag from Sanity
  };
  index: number;
}

export default function ProductCard({ product, index }: ProductCardProps) {
  const { addToCart, removeFromCart, updateQuantity, cart, selectedRegion } =
    useCart();
  const [quantity, setQuantity] = useState(0);
  const [region, setRegion] = useState<"durban" | "joburg">("durban");
  const [added, setAdded] = useState(false);

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
      setAdded(true);
      setTimeout(() => setAdded(false), 600);
    } else if (selectedRegion === region) {
      const newQty = quantity + 1;
      setQuantity(newQty);
      updateQuantity(id, newQty);
    }
  };

  // ➖ Remove or decrement
  const handleSubtract = () => {
    const newQty = Math.max(quantity - 1, 0);
    setQuantity(newQty);
    if (newQty === 0) removeFromCart(id);
    else updateQuantity(id, newQty);
  };

  const glowClass = added ? "animate-cart-glow" : "";

  return (
    <div className="w-full max-w-[620px] select-none relative">
      {/* 🏷️ Floating center tag badge */}
{product.label && (
  <span
    className={`absolute -top-3 left-1/2 -translate-x-1/2 z-10 text-[10px] font-semibold uppercase px-3 py-[3px] rounded-full ${
      isRed ? "bg-black text-white" : "bg-[#B80013] text-white"
    }`}
  >
    {product.label.replace(/-/g, " ")}
  </span>
)}


      <div
        className={`relative flex justify-between items-center rounded-full px-8 pl-[7%] py-5 shadow-md transition-transform duration-300 hover:scale-[1.02] ${
          isRed ? "bg-[#B80013]" : "bg-[#1E1E1E]"
        }`}
      >
        {/* LEFT: Text block */}
        <div className="flex flex-col items-start text-left">
          <h3 className="text-[15px] md:text-[17px] font-extrabold uppercase tracking-wide text-white">
            {title}
          </h3>

          {/* ✅ Unit (e.g. Pack of 5, 1 Dozen) */}
          <p className="text-[11px] text-gray-300 mt-1">
  Made from the finest ingredients for that homestyle taste{" "}
  {product.unit && <span className="text-white font-semibold">• {product.unit}</span>}
</p>


          {/* Add-to-cart or quantity controls */}
          <div className="mt-2">
            {quantity > 0 && selectedRegion === region ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSubtract}
                  className={`w-7 h-7 md:w-10 md:h-10 flex items-center justify-center rounded-full text-white text-lg font-bold transition ${
                    isRed
                      ? "bg-[#1E1E1E] hover:bg-[#111]"
                      : "bg-[#B80013] hover:bg-[#a40010]"
                  }`}
                >
                  −
                </button>
                <span className="text-white font-bold text-sm select-none">
                  {quantity}
                </span>
                <button
                  onClick={handleAdd}
                  className={`w-7 h-7 md:w-8 md:h-8 flex items-center justify-center rounded-full text-white text-lg font-bold transition ${
                    isRed
                      ? "bg-[#1E1E1E] hover:bg-[#111]"
                      : "bg-[#B80013] hover:bg-[#a40010]"
                  }`}
                >
                  +
                </button>
              </div>
            ) : (
              <button
                onClick={handleAdd}
                className={`text-[11px] md:text-[12px] font-bold uppercase px-5 py-2 rounded-full transition ${glowClass} ${
                  isRed
                    ? "bg-[#1E1E1E] text-white hover:bg-[#111]"
                    : "bg-[#B80013] text-white hover:bg-[#a40010]"
                }`}
              >
                Add to Cart
              </button>
            )}
          </div>
        </div>

        {/* RIGHT: Price circle */}
        <div
          className={`w-14 h-14 md:w-24 md:h-24 rounded-full flex items-center justify-center text-white font-extrabold text-[16px] md:text-[30px] mr-[-15px] ${
            isRed ? "bg-[#1E1E1E]" : "bg-[#B80013]"
          }`}
        >
          {priceText}
        </div>
      </div>
    </div>
  );
}
