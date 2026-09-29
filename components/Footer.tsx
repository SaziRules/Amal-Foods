'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Facebook, Instagram } from 'lucide-react';

const NAV = [
  { href: '/', label: 'Home' },
  { href: '/products', label: 'Products' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
];

const CONTACT = [
  { label: '031 303 7786', href: 'tel:031303786' },
  { label: 'info@amalfoods.co.za', href: 'mailto:info@amalfoods.co.za' },
  { label: '1271 Umgeni Rd, Durban', href: null },
];

export default function Footer() {
  return (
    <footer className="relative bg-[#0a0a0a] text-white overflow-hidden">
      {/* Red top border */}
      <div className="h-px bg-[#B80013]" />

      {/* Ghost brand name */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden">
        <span
          className="font-black uppercase whitespace-nowrap leading-none"
          style={{
            fontFamily: 'var(--font-roboto-condensed)',
            fontSize: 'clamp(80px, 18vw, 220px)',
            color: 'rgba(255,255,255,0.025)',
            letterSpacing: '-2px',
          }}
        >
          AMAL FOODS
        </span>
      </div>

      {/* Main content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-16 lg:px-24 pt-20 pb-10">

        {/* Top row: logo left, tagline right */}
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-10 pb-16 border-b border-white/8">
          <Link href="/" className="shrink-0">
            <Image
              src="/images/logo-dark.png"
              alt="Amal Foods"
              width={160}
              height={55}
              className="h-12 w-auto"
            />
          </Link>

          <p
            className="text-white/40 text-sm md:text-base leading-relaxed max-w-sm md:text-right"
            style={{ fontFamily: 'var(--font-roboto)' }}
          >
            Bringing the warmth of Durban kitchens<br className="hidden md:block" />
            to tables across South Africa.
          </p>
        </div>

        {/* Middle row: nav + contact + socials */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-10 py-14 border-b border-white/8">
          {/* Nav */}
          <div>
            <p className="text-[#B80013] text-[10px] uppercase tracking-[0.35em] font-bold mb-5">
              Navigate
            </p>
            <ul className="space-y-3">
              {NAV.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="text-white/45 text-sm hover:text-white transition-colors duration-200"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <p className="text-[#B80013] text-[10px] uppercase tracking-[0.35em] font-bold mb-5">
              Contact
            </p>
            <ul className="space-y-3">
              {CONTACT.map((c) => (
                <li key={c.label}>
                  {c.href ? (
                    <a
                      href={c.href}
                      className="text-white/45 text-sm hover:text-white transition-colors duration-200"
                    >
                      {c.label}
                    </a>
                  ) : (
                    <span className="text-white/45 text-sm">{c.label}</span>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Socials */}
          <div className="col-span-2 md:col-span-1">
            <p className="text-[#B80013] text-[10px] uppercase tracking-[0.35em] font-bold mb-5">
              Follow Us
            </p>
            <div className="flex gap-3">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 text-white/40 text-xs uppercase tracking-widest hover:border-[#B80013]/60 hover:text-white transition-all duration-200"
              >
                <Facebook size={13} />
                <span>Facebook</span>
              </a>
              <a
                href="https://www.instagram.com/amalfoods_?igsh=ZG50eW9odzJvcWly"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 text-white/40 text-xs uppercase tracking-widest hover:border-[#B80013]/60 hover:text-white transition-all duration-200"
              >
                <Instagram size={13} />
                <span>Instagram</span>
              </a>
            </div>
          </div>
        </div>

        {/* Bottom row: copyright */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-white/25 text-xs">
          <span>© {new Date().getFullYear()} Amal Foods. All rights reserved.</span>
          <span>Built to thrive, by Move Digital.</span>
        </div>
      </div>
    </footer>
  );
}
