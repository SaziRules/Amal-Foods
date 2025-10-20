"use client";

import React, { useState } from "react";
import { useCart } from "@/context/CartContext";
import CartDrawer from "./CartDrawer";
import { ShoppingCart } from "lucide-react";

export default function CartButton() {
  const { totalItems } = useCart();
  const [open, setOpen] = useState<boolean>(false);

  // 🧠 Handle checkout click (navigates or opens a form)
  const handleCheckout = () => {
    setOpen(false);
    // You can navigate to your checkout page or modal here:
    window.location.href = "/checkout";
  };

  return (
    <>
      {/* 🛒 Cart Button */}
      <button
        onClick={() => setOpen(true)}
        className="relative flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold transition"
      >
        <ShoppingCart size={18} />
        <span>Cart</span>

        {/* 🔴 Cart Badge */}
        {totalItems > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-600 text-xs px-2 py-1 rounded-full">
            {totalItems}
          </span>
        )}
      </button>

      {/* 🧺 Cart Drawer */}
      <CartDrawer
        open={open}
        onClose={() => setOpen(false)}
        onCheckout={handleCheckout}
      />
    </>
  );
}
