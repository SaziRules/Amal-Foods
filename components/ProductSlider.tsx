'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { client } from '@/sanity/lib/client';
import { ChevronLeft, ChevronRight } from 'lucide-react';

type Product = {
  _id: string;
  title: string;
  category: string;
  label: string | null;
  unit: string | null;
};

const CATEGORY_META: Record<string, { label: string; ghost: string; desc: string }> = {
  'rockets-and-pillows': {
    label: 'Rockets & Pillows',
    ghost: 'ROCKETS',
    desc: 'Crumbed and golden-fried parcels packed with bold, indulgent fillings — heat and enjoy.',
  },
  pies: {
    label: 'Pies',
    ghost: 'PIES',
    desc: 'Flaky, buttery pastry shells with rich slow-cooked fillings — comfort food in every bite.',
  },
  'spring-rolls': {
    label: 'Spring Rolls',
    ghost: 'ROLLS',
    desc: 'Thin, crispy wrappers packed with seasoned fillings — perfect for entertaining or a quick snack.',
  },
  samoosas: {
    label: 'Samoosas',
    ghost: 'SAMOOSA',
    desc: 'Crispy golden pastry filled with spiced mince or veg — a Durban classic, freshly sealed.',
  },
  'ready-to-heat': {
    label: 'Ready to Heat',
    ghost: 'HEAT',
    desc: 'Fully prepared, fully flavoured — just heat, serve, and enjoy the taste of a home kitchen.',
  },
  haleem: {
    label: 'Haleem',
    ghost: 'HALEEM',
    desc: 'Slow-cooked, richly spiced lentil and meat stew — a warming Durban favourite.',
  },
  parathas: {
    label: 'Parathas',
    ghost: 'PARATHA',
    desc: 'Soft, layered flatbreads made fresh — serve alongside a curry or enjoy on their own.',
  },
  'biryani-rice': {
    label: 'Biryani & Rice',
    ghost: 'BIRYANI',
    desc: 'Fragrant, spiced rice made with tradition — ready to heat and serve.',
  },
  'chutney-sauces': {
    label: 'Chutney & Sauces',
    ghost: 'CHUTNEY',
    desc: 'Bold, tangy condiments crafted to complement every Amal product perfectly.',
  },
  'bunny-chow': {
    label: 'Bunny Chow',
    ghost: 'BUNNY',
    desc: "Durban's iconic street food — spiced curry in a bread roll, ready to heat.",
  },
  'chicken-strips': {
    label: 'Chicken Strips',
    ghost: 'STRIPS',
    desc: 'Golden crumbed chicken strips — crispy on the outside, tender within.',
  },
};

const LABEL_DISPLAY: Record<string, string> = {
  new: 'New',
  crumbed: 'Crumbed',
  'ready-to-heat': 'Ready to Heat',
  limited: 'Limited',
  seasonal: 'Seasonal',
};

const CARD_W = 290;
const GAP = 20;
const STEP = CARD_W + GAP;
const INTERVAL_MS = 2800;

function Card({ product }: { product: Product }) {
  const meta = CATEGORY_META[product.category] ?? {
    label: product.category,
    ghost: product.category.slice(0, 6).toUpperCase(),
    desc: 'Handcrafted with care — fresh, flavourful, and ready in minutes.',
  };

  return (
    <div
      className="group relative flex-shrink-0 flex flex-col justify-between p-6 rounded-2xl overflow-hidden border border-white/10 hover:border-white/25 hover:scale-[1.02] hover:-translate-y-1 transition-all duration-400 cursor-default"
      style={{
        width: CARD_W,
        height: 300,
        marginRight: GAP,
        background: 'linear-gradient(145deg, #B80013 0%, #960010 55%, #7a000d 100%)',
        boxShadow: '0 8px 32px rgba(184,0,19,0.3)',
      }}
    >
      {/* Hover brightness */}
      <div className="absolute inset-0 bg-white/0 group-hover:bg-white/6 transition-colors duration-400 pointer-events-none" />

      {/* Top shine */}
      <div className="absolute top-0 left-0 right-0 h-px bg-white/20 group-hover:bg-white/40 transition-colors duration-400" />

      {/* Ghost word */}
      <span
        className="absolute -bottom-3 -right-1 font-black uppercase leading-none pointer-events-none select-none"
        style={{ fontFamily: 'var(--font-roboto-condensed)', fontSize: 76, color: 'rgba(0,0,0,0.18)' }}
      >
        {meta.ghost}
      </span>

      {/* Category + label */}
      <div className="flex items-start justify-between relative z-10">
        <p className="text-white/55 text-[10px] uppercase tracking-[0.3em] font-medium">
          {meta.label}
        </p>
        {product.label && (
          <span className="text-[9px] font-bold uppercase tracking-[0.15em] bg-black/20 text-white/80 px-2 py-0.5 rounded-full ml-3 shrink-0">
            {LABEL_DISPLAY[product.label] ?? product.label}
          </span>
        )}
      </div>

      {/* Title + description */}
      <div className="relative z-10">
        <h3
          className="text-white font-extrabold uppercase leading-tight text-xl mb-3"
          style={{ fontFamily: 'var(--font-roboto-condensed)', letterSpacing: '0.5px' }}
        >
          {product.title}
        </h3>
        <p className="text-white/60 text-[12px] leading-relaxed line-clamp-2 group-hover:text-white/80 transition-colors duration-300">
          {meta.desc}
        </p>
      </div>

      {/* Unit + view arrow */}
      <div className="flex items-center justify-between relative z-10">
        {product.unit ? (
          <span className="text-white/40 text-[10px] uppercase tracking-[0.25em]">
            {product.unit}
          </span>
        ) : <span />}
        <div className="flex items-center gap-1.5 text-white opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 transition-all duration-300">
          <span className="text-[10px] font-bold uppercase tracking-[0.2em]">View</span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </div>
  );
}

export default function ProductSlider() {
  const [products, setProducts] = useState<Product[]>([]);
  const [index, setIndex] = useState(0);
  const [animated, setAnimated] = useState(true);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lockRef = useRef(false); // prevents double-reset

  useEffect(() => {
    client
      .fetch<Product[]>(
        `*[_type == "product" && active == true]{_id, title, category, label, unit} | order(category asc, title asc)`
      )
      .then((data) => {
        setProducts(data);
        setIndex(data.length); // start at middle copy
      })
      .catch(console.error);
  }, []);

  const startTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setAnimated(true);
      setIndex((i) => i + 1);
    }, INTERVAL_MS);
  }, []);

  // Kick off auto-play once products load
  useEffect(() => {
    if (products.length === 0) return;
    startTimer();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [products.length, startTimer]);

  // Seamless loop reset
  useEffect(() => {
    if (products.length === 0 || lockRef.current) return;

    if (index >= products.length * 2) {
      lockRef.current = true;
      setTimeout(() => {
        setAnimated(false);
        setIndex(products.length);
        setTimeout(() => { lockRef.current = false; }, 50);
      }, 520);
    }
    if (index <= 0) {
      lockRef.current = true;
      setTimeout(() => {
        setAnimated(false);
        setIndex(products.length - 1);
        setTimeout(() => { lockRef.current = false; }, 50);
      }, 520);
    }
  }, [index, products.length]);

  const manualScroll = (dir: 1 | -1) => {
    setAnimated(true);
    setIndex((i) => i + dir);
    startTimer(); // restart timer on manual interaction
  };

  if (products.length === 0) return null;

  const tripled = [...products, ...products, ...products];
  const translateX = -(index * STEP);
  const displayIndex = ((index - 1) % products.length + products.length) % products.length;

  return (
    <section className="py-24 border-t border-white/5 relative overflow-hidden">
      {/* Header */}
      <div className="px-6 md:px-16 lg:px-24 flex items-end justify-between mb-12 relative z-10">
        <div>
          <p className="text-[#B80013] text-xs uppercase tracking-[0.4em] mb-3 font-bold">
            Our Range
          </p>
          <h2
            className="text-4xl md:text-5xl font-extrabold uppercase leading-[1.0]"
            style={{ fontFamily: 'var(--font-roboto-condensed)' }}
          >
            What We Make.
          </h2>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-white/25 text-xs tabular-nums hidden md:block">
            {String(displayIndex + 1).padStart(2, '0')} / {String(products.length).padStart(2, '0')}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => manualScroll(-1)}
              aria-label="Previous"
              className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-white/40 hover:border-[#B80013] hover:text-[#B80013] transition-all duration-200"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={() => manualScroll(1)}
              aria-label="Next"
              className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-white/40 hover:border-[#B80013] hover:text-[#B80013] transition-all duration-200"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Left edge fade */}
      <div
        className="absolute left-0 z-10 pointer-events-none"
        style={{
          top: 140,
          bottom: 0,
          width: 80,
          background: 'linear-gradient(to right, #0d0d0d 20%, transparent)',
        }}
      />
      {/* Right edge fade */}
      <div
        className="absolute right-0 z-10 pointer-events-none"
        style={{
          top: 140,
          bottom: 0,
          width: 80,
          background: 'linear-gradient(to left, #0d0d0d 20%, transparent)',
        }}
      />

      {/* Track */}
      <div className="pl-6 md:pl-16 lg:pl-24 overflow-visible">
        <div
          className="flex"
          style={{
            transform: `translateX(${translateX}px)`,
            transition: animated ? 'transform 0.52s cubic-bezier(0.32, 0.72, 0, 1)' : 'none',
            willChange: 'transform',
          }}
        >
          {tripled.map((p, i) => (
            <Card key={`${p._id}-${i}`} product={p} />
          ))}
        </div>
      </div>
    </section>
  );
}
