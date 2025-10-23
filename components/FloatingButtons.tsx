"use client";

import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { MessageCircle, ShoppingBag } from "lucide-react";

export default function FloatingButtons() {
  const pathname = usePathname();

  // 🧭 Routes where buttons should NOT show
  const hiddenRoutes = ["/admin", "/checkout", "/customer", "/dashboard"];
  const shouldHide = hiddenRoutes.some((route) => pathname.startsWith(route));

  if (shouldHide) return null;

  // Prefilled WhatsApp message
  const whatsappNumber = "27636769316"; // ✅ Replace with your WhatsApp business number (without +)
  const whatsappMessage = encodeURIComponent(
    "Hi! 👋 I’d like to place a Ramadan order from the Amal Foods website."
  );

  return (
    <div className="fixed right-6 bottom-6 flex flex-col gap-3 z-50">
      {/* 🛍 PRE-ORDER NOW */}
      <motion.a
        href="/products?filter=ramadan"
        className="flex items-center gap-2 bg-[#B80013] text-white px-5 py-2.5 rounded-full shadow-lg font-semibold uppercase text-xs tracking-wide hover:bg-[#a20010] transition"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <ShoppingBag size={16} />
        Pre-Order Now
      </motion.a>

      {/* 💬 WHATSAPP */}
      <motion.a
        href={`https://wa.me/${whatsappNumber}?text=${whatsappMessage}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 bg-[#25D366] text-white px-5 py-2.5 rounded-full shadow-lg font-semibold uppercase text-xs tracking-wide hover:bg-[#1eb954] transition"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
      >
        <MessageCircle size={16} />
        WhatsApp
      </motion.a>
    </div>
  );
}
