"use client";

import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { MessageCircle } from "lucide-react";

export default function FloatingButtons() {
  const pathname = usePathname();

  // 🧭 Routes where buttons should NOT show
  const hiddenRoutes = ["/admin", "/checkout", "/customer", "/dashboard", "/studio"];
  const shouldHide = hiddenRoutes.some((route) => pathname.startsWith(route));

  if (shouldHide) return null;

  // Prefilled WhatsApp message
  const whatsappNumber = "27710441562";
  const whatsappMessage = encodeURIComponent(
    "Hi! 👋 I’d like to inquire about Amal Foods products."
  );

  return (
    <div className="fixed right-6 bottom-6 flex flex-col gap-3 z-50">
      {/* ❌ Pre-Order button removed */}

      {/* 💬 WHATSAPP — still visible */}
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
