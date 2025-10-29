"use client";

import Link from "next/link";
import { Facebook, Instagram, Mail, MapPin, Phone } from "lucide-react";
import Image from "next/image";

export default function Footer() {
  return (
    <footer className="relative text-white pt-20 pb-10 border-t border-white/10 bg-gradient-to-t from-[#0a0a0a] via-[#111] to-[#B80013]/10">
      <div className="max-w-7xl mx-auto px-6 md:px-16 lg:px-24 grid md:grid-cols-4 gap-12">
        {/* 🥖 Brand Section */}
        <div>
          <Link href="/" className="inline-block">
            <Image
              src="/images/logo-dark.png"
              alt="Amal Foods Logo"
              width={140}
              height={60}
              className="mb-4"
            />
          </Link>
          <p className="text-white/70 text-sm leading-relaxed">
            Bringing the warmth of Durban kitchens to tables across South Africa.
            Every product is made with love, sealed with care, and ready in minutes.
            Discover authentic flavour, convenience, and quality — made with passion.
          </p>
        </div>

        {/* 🧭 Navigation */}
        <div>
          <h4 className="text-[#B80013] font-semibold mb-4">Quick Links</h4>
          <ul className="space-y-2 text-sm text-white/80">
            <li>
              <Link href="/products" className="hover:text-[#B80013] transition">
                Products
              </Link>
            </li>
            <li>
              <Link href="/contact" className="hover:text-[#B80013] transition">
                Contact
              </Link>
            </li>
          </ul>
        </div>

        {/* 📞 Contact Info */}
        <div>
          <h4 className="text-[#B80013] font-semibold mb-4">Get in Touch</h4>
          <ul className="space-y-3 text-sm text-white/80">
            <li className="flex items-center gap-2">
              <Phone size={16} /> <span>031 303 7786</span>
            </li>
            <li className="flex items-center gap-2">
              <Mail size={16} /> <span>info@amalfoods.co.za</span>
            </li>
            <li className="flex items-center gap-2">
              <MapPin size={16} /> <span>1271 Umgeni Rd, Stamford Hill, Durban, 4025</span>
            </li>
          </ul>
        </div>

        {/* 🌐 Socials */}
        <div>
          <h4 className="text-[#B80013] font-semibold mb-4">Follow Us</h4>
          <div className="flex gap-4">
            <a
              href="https://facebook.com"
              target="_blank"
              className="bg-[#B80013]/10 hover:bg-[#B80013] text-[#B80013] hover:text-white w-10 h-10 rounded-full flex items-center justify-center transition"
            >
              <Facebook size={18} />
            </a>
            <a
              href="https://www.instagram.com/amalfoods_?igsh=ZG50eW9odzJvcWly"
              target="_blank"
              className="bg-[#B80013]/10 hover:bg-[#B80013] text-[#B80013] hover:text-white w-10 h-10 rounded-full flex items-center justify-center transition"
            >
              <Instagram size={18} />
            </a>
          </div>
        </div>
      </div>

      {/* ⚖️ Divider */}
      <div className="border-t border-white/10 mt-16 pt-6 text-center text-sm text-white/60">
        © {new Date().getFullYear()} Amal Foods. All rights reserved.
        <span className="block sm:inline sm:ml-2">
          Built to thrive | By Move Digital.
        </span>
      </div>
    </footer>
  );
}
