'use client';

import { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { client } from '@/sanity/lib/client';
import { urlFor } from '@/sanity/lib/image';
import { useCart } from '@/context/CartContext';
import { SlidersHorizontal, X, ChevronDown, ChevronUp } from 'lucide-react';

/* ─────────────────────────── constants ─────────────────────────────────── */

const ORDER_DATE = new Date('2026-10-01T00:00:00');

const CATEGORY_LABELS: Record<string, string> = {
  samoosas:              'Samoosas',
  'spring-rolls':        'Spring Rolls',
  pies:                  'Pies',
  'rockets-and-pillows': 'Rockets & Pillows',
  'ready-to-heat':       'Ready to Heat',
  haleem:                'Haleem',
  'frozen-meals':        'Frozen Meals',
  parathas:              'Parathas',
  vegetarian:            'Vegetarian',
  vegan:                 'Vegan',
};

const LABEL_DISPLAY: Record<string, string> = {
  new:             'New',
  crumbed:         'Crumbed',
  'ready-to-heat': 'Ready to Heat',
  limited:         'Limited',
  seasonal:        'Seasonal',
};

const SORT_OPTIONS = [
  { value: 'default',    label: 'Featured'           },
  { value: 'name-asc',   label: 'Name: A → Z'        },
  { value: 'name-desc',  label: 'Name: Z → A'        },
  { value: 'price-asc',  label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
];

/* ─────────────────────────── types ─────────────────────────────────────── */

type Region = 'durban' | 'joburg' | 'capetown';

type Product = {
  _id: string;
  title: string;
  category: string;
  label: string | null;
  unit: string | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  image: any;
  pricing?: { durban?: number; joburg?: number };
};

/* ─────────────────────────── helpers ───────────────────────────────────── */

function getPrice(p: Product) {
  return p.pricing?.durban ?? p.pricing?.joburg ?? null;
}

/* ─────────────────────────── pure UI components ────────────────────────── */

/** Collapsible accordion — used for Category */
function SidebarSection({
  title, defaultOpen = true, children,
}: {
  title: string; defaultOpen?: boolean; children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-white/[0.06] pb-6 mb-6">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between mb-4 group"
      >
        <span className="text-[10px] tracking-[0.3em] uppercase font-bold text-white/50 group-hover:text-white/75 transition-colors">
          {title}
        </span>
        {open
          ? <ChevronUp size={13} className="text-white/30" />
          : <ChevronDown size={13} className="text-white/30" />}
      </button>
      {open && <div>{children}</div>}
    </div>
  );
}

/** Non-collapsible section */
function StaticSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-white/[0.06] pb-6 mb-6">
      <p className="text-[10px] tracking-[0.3em] uppercase font-bold text-white/50 mb-4">{title}</p>
      {children}
    </div>
  );
}

function PriceRangeSlider({
  min, max, value, onChange,
}: {
  min: number; max: number;
  value: [number, number];
  onChange: (v: [number, number]) => void;
}) {
  const [lo, hi] = value;
  const range = max - min;
  const pct = (v: number) => range > 0 ? ((v - min) / range) * 100 : 0;

  // When lo thumb is within 10% of hi on the track, give lo priority so it
  // can be dragged left even when both are pushed to the right edge.
  const loZIndex = pct(hi) - pct(lo) < 10 ? 5 : 3;

  return (
    <div className="px-1">
      {/* Slider track + thumbs — container height = thumb diameter so hit area is generous */}
      <div className="relative" style={{ height: 28 }}>
        {/* Background track */}
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[3px] rounded-full bg-white/10" />
        {/* Active segment */}
        <div
          className="absolute top-1/2 -translate-y-1/2 h-[3px] rounded-full bg-[#B80013]"
          style={{ left: `${pct(lo)}%`, right: `${100 - pct(hi)}%` }}
        />
        {/* Lo thumb — transparent input, thumb rendered by CSS */}
        <input
          type="range"
          min={min} max={max} step={5}
          value={lo}
          onChange={e => {
            const v = Math.min(+e.target.value, hi - 5);
            onChange([v, hi]);
          }}
          className="price-range-input"
          style={{ zIndex: loZIndex }}
        />
        {/* Hi thumb */}
        <input
          type="range"
          min={min} max={max} step={5}
          value={hi}
          onChange={e => {
            const v = Math.max(+e.target.value, lo + 5);
            onChange([lo, v]);
          }}
          className="price-range-input"
          style={{ zIndex: 4 }}
        />
      </div>

      {/* Value readout */}
      <div className="flex items-center justify-between mt-4">
        <span className="text-[10px] text-white/40 tabular-nums bg-white/[0.06] border border-white/10 rounded px-3 py-1.5">
          R{lo}
        </span>
        <div className="flex-1 mx-3 h-px bg-white/10" />
        <span className="text-[10px] text-white/40 tabular-nums bg-white/[0.06] border border-white/10 rounded px-3 py-1.5">
          R{hi}
        </span>
      </div>
    </div>
  );
}

/* ─────────────────────────── SidebarFilters ────────────────────────────── */
// Defined outside ProductsPage so React never unmounts/remounts it on re-render.

interface SidebarProps {
  availableCategories: string[];
  categoryCounts: Record<string, number>;
  selectedCategories: string[];
  toggleCategory: (c: string) => void;
  availableLabels: string[];
  labelCounts: Record<string, number>;
  selectedLabels: string[];
  toggleLabel: (l: string) => void;
  priceInited: boolean;
  priceBounds: [number, number];
  priceRange: [number, number];
  setPriceRange: (v: [number, number]) => void;
  activeFilterCount: number;
  clearAll: () => void;
}

function SidebarFilters({
  availableCategories, categoryCounts, selectedCategories, toggleCategory,
  availableLabels, labelCounts, selectedLabels, toggleLabel,
  priceInited, priceBounds, priceRange, setPriceRange,
  activeFilterCount, clearAll,
}: SidebarProps) {
  return (
    <div>
      {/* Categories — collapsible accordion */}
      {availableCategories.length > 0 && (
        <SidebarSection title="Category">
          <div className="space-y-1">
            {availableCategories.map(cat => {
              const active = selectedCategories.includes(cat);
              return (
                <div
                  key={cat}
                  onClick={() => toggleCategory(cat)}
                  className="flex items-center justify-between cursor-pointer group py-1.5 rounded-lg px-1 -mx-1 hover:bg-white/[0.04] transition-colors select-none"
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 transition-colors ${
                      active ? 'border-[#B80013] bg-[#B80013]' : 'border-white/20 group-hover:border-white/40'
                    }`}>
                      {active && (
                        <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                          <path d="M1 3l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </span>
                    <span className={`text-[11px] tracking-wide transition-colors ${
                      active ? 'text-white font-semibold' : 'text-white/45 group-hover:text-white/70'
                    }`}>
                      {CATEGORY_LABELS[cat]}
                    </span>
                  </div>
                  <span className={`text-[10px] tabular-nums px-1.5 py-0.5 rounded transition-colors ${
                    active ? 'bg-[#B80013]/20 text-[#B80013]' : 'bg-white/5 text-white/25'
                  }`}>
                    {categoryCounts[cat] ?? 0}
                  </span>
                </div>
              );
            })}
          </div>
        </SidebarSection>
      )}

      {/* Labels — always visible */}
      {availableLabels.length > 0 && (
        <StaticSection title="Label">
          <div className="space-y-1">
            {availableLabels.map(lbl => {
              const active = selectedLabels.includes(lbl);
              return (
                <div
                  key={lbl}
                  onClick={() => toggleLabel(lbl)}
                  className="flex items-center justify-between cursor-pointer group py-1.5 rounded-lg px-1 -mx-1 hover:bg-white/[0.04] transition-colors select-none"
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 transition-colors ${
                      active ? 'border-[#B80013] bg-[#B80013]' : 'border-white/20 group-hover:border-white/40'
                    }`}>
                      {active && (
                        <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                          <path d="M1 3l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </span>
                    <span className={`text-[11px] tracking-wide transition-colors ${
                      active ? 'text-white font-semibold' : 'text-white/45 group-hover:text-white/70'
                    }`}>
                      {LABEL_DISPLAY[lbl] ?? lbl}
                    </span>
                  </div>
                  <span className={`text-[10px] tabular-nums px-1.5 py-0.5 rounded transition-colors ${
                    active ? 'bg-[#B80013]/20 text-[#B80013]' : 'bg-white/5 text-white/25'
                  }`}>
                    {labelCounts[lbl] ?? 0}
                  </span>
                </div>
              );
            })}
          </div>
        </StaticSection>
      )}

      {/* Price — always visible, no accordion */}
      {priceInited && priceBounds[1] > 0 && (
        <StaticSection title="Price Range">
          <PriceRangeSlider
            min={priceBounds[0]}
            max={priceBounds[1]}
            value={priceRange}
            onChange={setPriceRange}
          />
        </StaticSection>
      )}

      {/* Clear all */}
      {activeFilterCount > 0 && (
        <button
          onClick={clearAll}
          className="w-full mt-2 py-2.5 rounded-full border border-white/15 text-white/45 text-[10px] uppercase tracking-[0.25em] font-bold hover:border-[#B80013] hover:text-[#B80013] transition-all duration-200"
        >
          Clear All Filters
        </button>
      )}
    </div>
  );
}

/* ─────────────────────────── ProductCard ───────────────────────────────── */

function ProductCard({ product, launched }: { product: Product; launched: boolean }) {
  const { addToCart, removeFromCart, updateQuantity, cart } = useCart();
  const [quantity, setQuantity] = useState(0);

  const imgSrc = product.image
    ? urlFor(product.image).width(600).height(450).fit('crop').url()
    : null;
  const catLabel = CATEGORY_LABELS[product.category] ?? product.category;
  const price = getPrice(product);
  const id = product._id;

  // Keep local quantity in sync with global cart
  useEffect(() => {
    const existing = cart.find(item => item.id === id);
    setQuantity(existing ? existing.quantity : 0);
  }, [cart, id]);

  const handleAdd = () => {
    const existing = cart.find(item => item.id === id);
    if (!existing) {
      addToCart({ id, title: product.title, price: price!, quantity: 1 });
    } else {
      updateQuantity(id, quantity + 1);
    }
  };

  const handleSubtract = () => {
    const newQty = Math.max(quantity - 1, 0);
    if (newQty === 0) removeFromCart(id);
    else updateQuantity(id, newQty);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="group flex flex-col rounded-xl overflow-hidden border border-white/[0.08] hover:border-white/20 transition-colors duration-300 bg-[#141414]"
    >
      <div className="relative aspect-[4/3] overflow-hidden shrink-0">
        {imgSrc ? (
          <Image
            src={imgSrc} fill alt={product.title}
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          />
        ) : (
          <div
            className="absolute inset-0 flex items-end justify-end p-3"
            style={{ background: 'linear-gradient(145deg, #B80013 0%, #960010 55%, #7a000d 100%)' }}
          >
            <span
              className="font-black uppercase leading-none text-black/20 select-none"
              style={{ fontFamily: 'var(--font-roboto-condensed)', fontSize: 64 }}
            >
              {product.title.slice(0, 4).toUpperCase()}
            </span>
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[#141414]/60 to-transparent pointer-events-none" />
        {product.label && (
          <span className="absolute top-3 left-3 text-[9px] font-bold uppercase tracking-[0.15em] bg-[#B80013] text-white px-2.5 py-1 rounded-full">
            {LABEL_DISPLAY[product.label] ?? product.label}
          </span>
        )}
      </div>

      <div className="p-4 flex flex-col flex-1">
        <p className="text-[#B80013] text-[9px] uppercase tracking-[0.35em] font-bold">{catLabel}</p>
        <h3
          className="text-white font-extrabold uppercase text-[1rem] leading-tight mt-1"
          style={{ fontFamily: 'var(--font-roboto-condensed)' }}
        >
          {product.title}
        </h3>
        {product.unit && (
          <p className="text-white/30 text-[10px] uppercase tracking-[0.2em] mt-1">{product.unit}</p>
        )}

        <div className="mt-auto pt-4 border-t border-white/[0.07] space-y-3">
          {/* Price */}
          {price !== null ? (
            <span
              className="text-white text-2xl font-extrabold tabular-nums leading-none"
              style={{ fontFamily: 'var(--font-roboto-condensed)' }}
            >
              R{price}
            </span>
          ) : (
            <span className="text-white/25 text-[10px] uppercase tracking-widest">Price TBC</span>
          )}

          {/* Cart row */}
          <div className="flex items-center justify-between gap-3">
            <span className={`text-[10px] font-bold uppercase tracking-[0.2em] transition-colors ${
              launched && price !== null ? 'text-white/50' : 'text-white/18'
            }`}>
              Add to Cart
            </span>

            {/* Quantity stepper — always visible, inactive pre-launch */}
            <div className={`flex items-center gap-1.5 border rounded-full px-1 py-1 transition-colors ${
              launched && price !== null
                ? 'bg-white/[0.05] border-white/10'
                : 'bg-transparent border-white/[0.06]'
            }`}>
              <button
                onClick={handleSubtract}
                disabled={!launched || price === null || quantity === 0}
                className="w-7 h-7 flex items-center justify-center rounded-full text-base font-bold leading-none transition-colors disabled:cursor-not-allowed disabled:opacity-20 bg-white/[0.08] hover:enabled:bg-[#B80013] text-white"
              >
                −
              </button>
              <span className={`text-[13px] font-bold tabular-nums w-5 text-center leading-none ${
                launched && price !== null ? 'text-white' : 'text-white/20'
              }`}>
                {quantity}
              </span>
              <button
                onClick={handleAdd}
                disabled={!launched || price === null}
                className="w-7 h-7 flex items-center justify-center rounded-full text-base font-bold leading-none transition-colors disabled:cursor-not-allowed disabled:opacity-20 bg-[#B80013] hover:enabled:bg-[#a20010] text-white"
              >
                +
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ─────────────────────────── RegionModal ───────────────────────────────── */

const CITIES: { id: Region; label: string; sub: string }[] = [
  { id: 'durban',   label: 'Durban',    sub: 'Browse & order online' },
  { id: 'joburg',   label: "Jo'burg",   sub: 'Contact us for your order' },
  { id: 'capetown', label: 'Cape Town', sub: 'Contact us for your order' },
];

function RegionModal({ onSelect }: { onSelect: (r: Region) => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(6px)' }}
    >
      <motion.div
        initial={{ opacity: 0, y: 28, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16, scale: 0.97 }}
        transition={{ type: 'spring', damping: 26, stiffness: 300 }}
        className="w-full max-w-md bg-[#111] border border-white/[0.09] rounded-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="px-8 pt-9 pb-6 border-b border-white/[0.06]">
          <p className="text-[#B80013] text-[10px] uppercase tracking-[0.4em] font-bold mb-2">Welcome</p>
          <h2
            className="text-3xl font-extrabold uppercase leading-tight text-white"
            style={{ fontFamily: 'var(--font-roboto-condensed)' }}
          >
            Where are you<br />ordering from?
          </h2>
          <p className="text-white/35 text-[12px] mt-3 leading-relaxed">
            Select your city to continue. Availability and ordering vary by region.
          </p>
        </div>

        {/* City options */}
        <div className="p-4 space-y-2">
          {CITIES.map((city, i) => (
            <motion.button
              key={city.id}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 + i * 0.07 }}
              onClick={() => onSelect(city.id)}
              className="w-full flex items-center justify-between px-5 py-4 rounded-xl border border-white/[0.08] hover:border-[#B80013]/60 hover:bg-[#B80013]/[0.06] transition-all duration-200 group text-left"
            >
              <div>
                <p
                  className="text-white font-extrabold uppercase text-[1.1rem] leading-tight group-hover:text-white transition-colors"
                  style={{ fontFamily: 'var(--font-roboto-condensed)' }}
                >
                  {city.label}
                </p>
                <p className="text-white/35 text-[10px] mt-0.5 tracking-wide">{city.sub}</p>
              </div>
              <svg
                className="text-white/20 group-hover:text-[#B80013] transition-colors shrink-0"
                width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              >
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </motion.button>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ─────────────────────────── ContactPage ───────────────────────────────── */

function ContactPage({ region, onBack }: { region: 'joburg' | 'capetown'; onBack: () => void }) {
  const cityLabel = region === 'joburg' ? "Jo'burg" : 'Cape Town';
  const contacts = [
    { name: 'Zakiya', number: '083 457 8662', tel: '+27834578662' },
    { name: 'Zahra',  number: '083 777 7401', tel: '+27837777401' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-[#0d0d0d] flex flex-col items-center justify-center px-6 overflow-hidden"
    >
      {/* Background texture */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      {/* Back button */}
      <motion.button
        initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
        onClick={onBack}
        className="absolute top-6 left-6 flex items-center gap-2 text-white/35 hover:text-white/70 text-[11px] uppercase tracking-[0.25em] font-bold transition-colors"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 12H5M11 6l-6 6 6 6" />
        </svg>
        Change city
      </motion.button>

      <div className="relative max-w-lg w-full text-center">
        {/* City badge */}
        <motion.p
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="text-[#B80013] text-[10px] uppercase tracking-[0.5em] font-bold mb-4"
        >
          {cityLabel} Orders
        </motion.p>

        {/* Heading */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="text-5xl md:text-7xl font-extrabold uppercase leading-[0.95] text-white mb-6"
          style={{ fontFamily: 'var(--font-roboto-condensed)' }}
        >
          Order via<br /><span className="text-[#B80013]">WhatsApp.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.22 }}
          className="text-white/45 text-[13px] leading-relaxed mb-10 max-w-sm mx-auto"
        >
          We don&apos;t ship online to {cityLabel} yet — but our team will sort you out directly. Reach out to get your order form.
        </motion.p>

        {/* Contact cards */}
        <div className="space-y-3 mb-8">
          {contacts.map((c, i) => (
            <motion.a
              key={c.name}
              href={`https://wa.me/${c.tel.replace('+', '')}`}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28 + i * 0.08 }}
              className="flex items-center justify-between px-6 py-4 rounded-xl bg-white/[0.04] border border-white/[0.08] hover:border-[#B80013]/50 hover:bg-[#B80013]/[0.06] transition-all duration-200 group"
            >
              <div className="text-left">
                <p className="text-white font-bold text-[15px]">{c.name}</p>
                <p className="text-white/40 text-[12px] mt-0.5 tabular-nums">{c.number}</p>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#B80013]/60 group-hover:text-[#B80013] transition-colors flex items-center gap-1.5">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                  <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.556 4.116 1.527 5.845L.057 23.17a.75.75 0 0 0 .904.903l5.376-1.461A11.946 11.946 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.75a9.745 9.745 0 0 1-4.96-1.354l-.356-.212-3.693 1.004 1.017-3.607-.232-.372A9.722 9.722 0 0 1 2.25 12C2.25 6.615 6.615 2.25 12 2.25S21.75 6.615 21.75 12 17.385 21.75 12 21.75z"/>
                </svg>
                WhatsApp
              </span>
            </motion.a>
          ))}
        </div>

        <motion.p
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
          className="text-white/20 text-[11px] uppercase tracking-[0.3em]"
        >
          Tap a card to open WhatsApp
        </motion.p>
      </div>
    </motion.div>
  );
}

/* ─────────────────────────── Page ──────────────────────────────────────── */

export default function ProductsPage() {
  const [region, setRegion]             = useState<Region | null>(null);
  const [timeLeft, setTimeLeft]         = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [launched, setLaunched]         = useState(false);
  const [products, setProducts]         = useState<Product[]>([]);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedLabels, setSelectedLabels]         = useState<string[]>([]);
  const [priceRange, setPriceRange]                 = useState<[number, number]>([0, 0]);
  const [priceInited, setPriceInited]               = useState(false);
  const [sort, setSort]                             = useState('default');

  /* pre-select category from ?category= query param */
  useEffect(() => {
    const cat = new URLSearchParams(window.location.search).get('category');
    if (cat && CATEGORY_LABELS[cat]) {
      setSelectedCategories([cat]);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* countdown */
  useEffect(() => {
    function tick() {
      const dist = ORDER_DATE.getTime() - Date.now();
      if (dist <= 0) { setLaunched(true); return; }
      setTimeLeft({
        days:    Math.floor(dist / 86400000),
        hours:   Math.floor((dist / 3600000) % 24),
        minutes: Math.floor((dist / 60000) % 60),
        seconds: Math.floor((dist / 1000) % 60),
      });
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  /* products */
  useEffect(() => {
    client
      .fetch<Product[]>(
        `*[_type == "product" && active == true && category != "internal-stock"]
          { _id, title, category, label, unit, image, pricing }
          | order(category asc, title asc)`
      )
      .then(data => {
        setProducts(data);
        const prices = data.map(getPrice).filter((p): p is number => p !== null);
        if (prices.length) {
          const maxP = Math.ceil(Math.max(...prices) / 10) * 10;
          setPriceRange([0, maxP]);
          setPriceInited(true);
        }
      })
      .catch(console.error);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* derived: slider bounds */
  const priceBounds = useMemo<[number, number]>(() => {
    const prices = products.map(getPrice).filter((p): p is number => p !== null);
    if (!prices.length) return [0, 500];
    return [0, Math.ceil(Math.max(...prices) / 10) * 10];
  }, [products]);

  /* derived: counts */
  const categoryCounts = useMemo(() => {
    const c: Record<string, number> = {};
    products.forEach(p => { c[p.category] = (c[p.category] ?? 0) + 1; });
    return c;
  }, [products]);

  const labelCounts = useMemo(() => {
    const c: Record<string, number> = {};
    products.forEach(p => { if (p.label) c[p.label] = (c[p.label] ?? 0) + 1; });
    return c;
  }, [products]);

  const availableCategories = useMemo(
    () => Object.keys(categoryCounts)
      .filter(c => CATEGORY_LABELS[c])
      .sort((a, b) => CATEGORY_LABELS[a].localeCompare(CATEGORY_LABELS[b])),
    [categoryCounts]
  );

  const availableLabels = useMemo(() => Object.keys(labelCounts), [labelCounts]);

  /* filtered + sorted */
  const filtered = useMemo(() => {
    let list = [...products];

    if (selectedCategories.length)
      list = list.filter(p => selectedCategories.includes(p.category));

    if (selectedLabels.length)
      list = list.filter(p => p.label !== null && selectedLabels.includes(p.label));

    if (priceInited)
      list = list.filter(p => {
        const price = getPrice(p);
        return price === null || (price >= priceRange[0] && price <= priceRange[1]);
      });

    switch (sort) {
      case 'name-asc':   return [...list].sort((a, b) => a.title.localeCompare(b.title));
      case 'name-desc':  return [...list].sort((a, b) => b.title.localeCompare(a.title));
      case 'price-asc':  return [...list].sort((a, b) => (getPrice(a) ?? 0) - (getPrice(b) ?? 0));
      case 'price-desc': return [...list].sort((a, b) => (getPrice(b) ?? 0) - (getPrice(a) ?? 0));
      default:           return list;
    }
  }, [products, selectedCategories, selectedLabels, priceRange, priceInited, sort]);

  /* active filter count */
  const activeFilterCount =
    selectedCategories.length +
    selectedLabels.length +
    (priceInited && (priceRange[0] > priceBounds[0] || priceRange[1] < priceBounds[1]) ? 1 : 0);

  /* callbacks — stable references prevent child prop churn */
  const toggleCategory = (c: string) =>
    setSelectedCategories(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]);

  const toggleLabel = (l: string) =>
    setSelectedLabels(prev => prev.includes(l) ? prev.filter(x => x !== l) : [...prev, l]);

  const clearAll = () => {
    setSelectedCategories([]);
    setSelectedLabels([]);
    if (priceInited) setPriceRange(priceBounds);
    setSort('default');
  };

  /* sidebar props object */
  const sidebarProps: SidebarProps = {
    availableCategories, categoryCounts, selectedCategories, toggleCategory,
    availableLabels, labelCounts, selectedLabels, toggleLabel,
    priceInited, priceBounds, priceRange, setPriceRange,
    activeFilterCount, clearAll,
  };

  /* sort select inline style (SVG chevron) */
  const sortSelectStyle: React.CSSProperties = {
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M1 1l4 4 4-4' stroke='rgba(255,255,255,0.3)' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 12px center',
  };

  return (
    <>
    <AnimatePresence>
      {region === null && <RegionModal onSelect={setRegion} />}
    </AnimatePresence>
    <AnimatePresence>
      {(region === 'joburg' || region === 'capetown') && (
        <ContactPage region={region} onBack={() => setRegion(null)} />
      )}
    </AnimatePresence>
    <div
      className="transition-all duration-500"
      style={region === null ? { filter: 'blur(8px)', pointerEvents: 'none', userSelect: 'none', opacity: 0.45 } : {}}
    >
    <main className="bg-[#0d0d0d] text-white overflow-x-hidden">

      {/* ── HERO ── */}
      <section className="relative h-[28vh] flex items-end overflow-hidden">
        <Image src="/images/hero3.jpg" fill alt="" className="object-cover" priority sizes="100vw" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0d0d0d] via-black/65 to-black/20" />
        <div className="relative z-10 px-6 md:px-16 lg:px-24 max-w-7xl mx-auto w-full pb-10">
          <motion.p
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
            className="text-[#B80013] text-xs uppercase tracking-[0.4em] mb-2 font-bold"
          >
            {launched ? 'Our Full Range' : 'Orders Opening · 1 October 2026'}
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.1 }}
            className="text-4xl md:text-6xl font-extrabold uppercase leading-[1.0]"
            style={{ fontFamily: 'var(--font-roboto-condensed)' }}
          >
            {launched
              ? <>The Full <span className="text-[#B80013]">Collection.</span></>
              : <>Browse the Range. <span className="text-[#B80013]">Orders Open Soon.</span></>
            }
          </motion.h1>
        </div>
      </section>

      {/* ── COUNTDOWN ── */}
      {!launched && (
        <section className="py-16 px-6 md:px-16 lg:px-24 border-b border-white/[0.06]">
          <div className="max-w-5xl mx-auto">
            <p className="text-[#B80013] text-xs uppercase tracking-[0.4em] mb-8 font-bold">Orders open in</p>
            <div className="flex flex-wrap gap-8 md:gap-14">
              {([
                { label: 'Days',    value: timeLeft.days    },
                { label: 'Hours',   value: timeLeft.hours   },
                { label: 'Minutes', value: timeLeft.minutes },
                { label: 'Seconds', value: timeLeft.seconds },
              ] as const).map((u, i) => (
                <div key={i}>
                  <div
                    className="text-5xl md:text-7xl font-extrabold text-white leading-none tabular-nums"
                    style={{ fontFamily: 'var(--font-roboto-condensed)' }}
                  >
                    {String(u.value).padStart(2, '0')}
                  </div>
                  <div className="text-white/35 text-[10px] uppercase tracking-[0.3em] mt-1.5">{u.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── MAIN: SIDEBAR + GRID ── */}
      <section className="py-14 px-6 md:px-16 lg:px-24">
        <div className="max-w-7xl mx-auto">

          {/* Mobile top bar */}
          <div className="flex items-center justify-between mb-6 lg:hidden">
            <div>
              <p className="text-[#B80013] text-[9px] uppercase tracking-[0.4em] font-bold mb-1">What We Make</p>
              <h2 className="text-2xl font-extrabold uppercase" style={{ fontFamily: 'var(--font-roboto-condensed)' }}>
                The Collection.
              </h2>
            </div>
            <button
              onClick={() => setMobileFiltersOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-full border border-white/15 text-white/60 text-[10px] uppercase tracking-[0.2em] font-bold hover:border-white/35 transition-colors"
            >
              <SlidersHorizontal size={13} />
              Filters
              {activeFilterCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-[#B80013] text-white text-[9px] font-bold flex items-center justify-center ml-0.5">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>

          {/* Desktop heading */}
          <div className="hidden lg:block mb-8">
            <p className="text-[#B80013] text-xs uppercase tracking-[0.4em] font-bold mb-2">What We Make</p>
            <h2 className="text-4xl font-extrabold uppercase" style={{ fontFamily: 'var(--font-roboto-condensed)' }}>
              The Full Collection.
            </h2>
          </div>

          <div className="lg:flex lg:gap-10 lg:items-start">

            {/* Desktop sidebar */}
            <aside className="hidden lg:block w-[260px] shrink-0 sticky top-24">
              <SidebarFilters {...sidebarProps} />
            </aside>

            {/* Product area */}
            <div className="flex-1 min-w-0">

              {/* Sort bar + active chips */}
              <div className="flex flex-wrap items-center gap-2 mb-6">
                <span className="text-white/30 text-[10px] uppercase tracking-widest shrink-0">
                  {filtered.length} {filtered.length === 1 ? 'product' : 'products'}
                </span>

                {selectedCategories.map(c => (
                  <span key={c} className="flex items-center gap-1.5 pl-3 pr-2 py-1 rounded-full bg-white/[0.06] border border-white/10 text-[10px] text-white/60">
                    {CATEGORY_LABELS[c] ?? c}
                    <button onClick={() => toggleCategory(c)} className="text-white/30 hover:text-white/70 transition-colors"><X size={10} /></button>
                  </span>
                ))}
                {selectedLabels.map(l => (
                  <span key={l} className="flex items-center gap-1.5 pl-3 pr-2 py-1 rounded-full bg-white/[0.06] border border-white/10 text-[10px] text-white/60">
                    {LABEL_DISPLAY[l] ?? l}
                    <button onClick={() => toggleLabel(l)} className="text-white/30 hover:text-white/70 transition-colors"><X size={10} /></button>
                  </span>
                ))}
                {priceInited && (priceRange[0] > priceBounds[0] || priceRange[1] < priceBounds[1]) && (
                  <span className="flex items-center gap-1.5 pl-3 pr-2 py-1 rounded-full bg-white/[0.06] border border-white/10 text-[10px] text-white/60">
                    R{priceRange[0]} – R{priceRange[1]}
                    <button onClick={() => setPriceRange(priceBounds)} className="text-white/30 hover:text-white/70 transition-colors"><X size={10} /></button>
                  </span>
                )}
                {activeFilterCount > 0 && (
                  <button onClick={clearAll} className="text-[10px] text-white/30 hover:text-[#B80013] uppercase tracking-widest transition-colors">
                    Clear all
                  </button>
                )}

                {/* Sort dropdown — right-aligned */}
                <div className="ml-auto shrink-0 flex items-center gap-2">
                  <span className="text-white/30 text-[10px] uppercase tracking-[0.25em] font-bold">Sort by:</span>
                  <select
                    value={sort}
                    onChange={e => setSort(e.target.value)}
                    className="bg-[#1a1a1a] border border-white/15 text-white/55 text-[10px] uppercase tracking-[0.15em] rounded-full px-4 py-2 cursor-pointer hover:border-white/30 transition-colors outline-none appearance-none pr-8"
                    style={sortSelectStyle}
                  >
                    {SORT_OPTIONS.map(o => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>

              </div>

              {/* Grid */}
              {products.length === 0 ? (
                <div className="py-24 text-center text-white/20 text-xs uppercase tracking-[0.4em]">Loading products…</div>
              ) : filtered.length === 0 ? (
                <div className="py-24 text-center">
                  <p className="text-white/20 text-xs uppercase tracking-[0.4em] mb-6">No products match your filters.</p>
                  <button onClick={clearAll} className="px-6 py-2.5 rounded-full border border-white/15 text-white/45 text-[10px] uppercase tracking-[0.2em] hover:border-[#B80013] hover:text-[#B80013] transition-all">
                    Clear Filters
                  </button>
                </div>
              ) : (
                <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                  <AnimatePresence mode="popLayout">
                    {filtered.map(product => (
                      <ProductCard key={product._id} product={product} launched={launched} />
                    ))}
                  </AnimatePresence>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── MOBILE FILTER DRAWER ── */}
      <AnimatePresence mode="wait">
        {mobileFiltersOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/70 z-40 lg:hidden"
              onClick={() => setMobileFiltersOpen(false)}
            />
            <motion.aside
              initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              className="fixed inset-y-0 left-0 w-[85vw] max-w-[340px] bg-[#111] z-50 overflow-y-auto lg:hidden"
            >
              <div className="flex items-center justify-between px-6 py-5 border-b border-white/[0.06] sticky top-0 bg-[#111]">
                <span className="text-[10px] uppercase tracking-[0.3em] font-bold text-white/60">
                  Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
                </span>
                <button
                  onClick={() => setMobileFiltersOpen(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-full border border-white/10 text-white/40 hover:text-white/70"
                >
                  <X size={14} />
                </button>
              </div>
              <div className="px-6 py-6">
                <SidebarFilters {...sidebarProps} />
              </div>
              <div className="px-6 pb-8 sticky bottom-0 bg-[#111] pt-4 border-t border-white/[0.06]">
                <button
                  onClick={() => setMobileFiltersOpen(false)}
                  className="w-full py-3.5 rounded-full bg-[#B80013] text-white text-[11px] font-bold uppercase tracking-[0.2em] hover:bg-[#a20010] transition-colors"
                >
                  Show {filtered.length} {filtered.length === 1 ? 'Product' : 'Products'}
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ── CTA ── */}
      <section className="relative py-28 px-6 md:px-16 lg:px-24 bg-[#B80013] overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />
        <div className="relative max-w-7xl mx-auto text-center">
          <motion.h2
            initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }} viewport={{ once: true }}
            className="text-5xl md:text-7xl font-extrabold uppercase leading-tight mb-6"
            style={{ fontFamily: 'var(--font-roboto-condensed)' }}
          >
            Made with Love.<br />Ready in Minutes.
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }} whileInView={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }} viewport={{ once: true }}
            className="text-white/80 max-w-xl mx-auto mb-10 text-[15px] leading-relaxed"
          >
            Bringing the warmth of Durban kitchens to tables everywhere.
          </motion.p>
          <Link
            href="/about"
            className="inline-block bg-black text-white font-bold uppercase tracking-widest text-sm px-10 py-4 rounded-full hover:bg-white hover:text-[#B80013] transition-all duration-300"
          >
            Learn Our Story
          </Link>
        </div>
      </section>
    </main>
    </div>
    </>
  );
}
