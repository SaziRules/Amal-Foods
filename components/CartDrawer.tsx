"use client";

import React, { useEffect, useState } from "react";
import { X } from "lucide-react";
import { useCart } from "@/context/CartContext";

interface CartDrawerProps {
  open: boolean;
  onClose: () => void;
  onCheckout: () => void;
}

export default function CartDrawer({ open, onClose, onCheckout }: CartDrawerProps) {
  const { cart, totalItems, totalPrice, removeFromCart, updateQuantity } = useCart();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <>
      {/* Overlay backdrop */}
      <div
        className={`fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 z-[90]
          ${open ? "opacity-100 visible" : "opacity-0 invisible"}
        `}
        onClick={onClose}
      />

      {/* Drawer panel */}
      <aside
        className={`fixed top-0 right-0 w-full sm:w-[400px] h-screen bg-[#111] text-white shadow-2xl z-[100]
          transform transition-transform duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]
          ${open ? "translate-x-0" : "translate-x-full"}
          flex flex-col
          pb-[env(safe-area-inset-bottom)]  /* ✅ prevents checkout button from being cut off on iPhones */
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">
          <h2 className="text-xl font-semibold">Your Cart</h2>
          <button
            onClick={onClose}
            aria-label="Close cart"
            className="text-gray-400 hover:text-white transition"
          >
            <X size={22} />
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-col h-[calc(100%-130px)] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
          {cart.length === 0 ? (
            <p className="text-gray-400 text-center mt-16">Your cart is empty</p>
          ) : (
            <ul className="divide-y divide-white/10">
              {cart.map((item: any) => (
                <li key={item.id} className="flex items-center justify-between gap-3 px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div>
                      <h3 className="text-sm font-medium">{item.title}</h3>
                      <p className="text-xs text-gray-400">
                        {item.quantity} × R{item.price.toFixed(2)}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="px-2 text-sm border border-gray-500 rounded hover:bg-gray-800"
                      >
                        −
                      </button>
                      <span className="text-sm">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="px-2 text-sm border border-gray-500 rounded hover:bg-gray-800"
                      >
                        +
                      </button>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="text-xs text-red-500 hover:text-red-400"
                    >
                      Remove
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-white/10 px-6 py-5 flex flex-col gap-3 mb-8">
          <div className="flex items-center justify-between text-sm">
            <span>Total items:</span>
            <span>{totalItems}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span>Subtotal:</span>
            <span>R{totalPrice.toFixed(2)}</span>
          </div>
          <button
            disabled={totalItems < 10}
            onClick={onCheckout}
            className={`mt-3 w-full rounded-full py-2.5 font-semibold text-sm transition-colors ${
              totalItems < 10
                ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                : "bg-red-700 hover:bg-red-800 text-white"
            }`}
          >
            {totalItems < 10
              ? `Add ${10 - totalItems} more to checkout`
              : "Proceed to Checkout"}
          </button>
        </div>
      </aside>
    </>
  );
}
