'use client';

import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import Image from 'next/image';
import { useState, useEffect, useRef } from 'react';
import { X, ChevronLeft, ChevronRight, ZoomIn, Shuffle } from 'lucide-react';

// ── Image data ────────────────────────────────────────────
type Category = 'all' | 'crafted' | 'golden' | 'plated' | 'moments';

const FILES = [
  'P64A2808.JPG','P64A2817.JPG','P64A2820.JPG','P64A2823.JPG','P64A2824.JPG','P64A2825.JPG',
  'P64A2835.JPG','P64A2837.JPG','P64A2840.JPG','P64A2848.JPG','P64A2850.JPG','P64A2853.JPG',
  'P64A2858.JPG','P64A2867.JPG','P64A2868.JPG','P64A2869.JPG','P64A2870.JPG','P64A2887.JPG',
  'P64A2890.JPG','P64A2897.JPG','P64A2899.JPG','P64A2900.jpg','P64A2903.JPG','P64A2907.JPG',
  'P64A2910.JPG','P64A2912.jpg','P64A2914.JPG','P64A2916.JPG','P64A2933.jpg','P64A2934.JPG',
  'P64A2938.JPG','P64A2955.JPG','P64A2965.JPG','P64A2977.JPG','P64A2980.JPG','P64A2990.JPG',
  'P64A2992.JPG','P64A2996.JPG','P64A2999.JPG','P64A3002.JPG','P64A3005.JPG','P64A3007.JPG',
  'P64A3011.JPG','P64A3012.JPG','P64A3015.JPG','P64A3018.JPG','P64A3020.JPG','P64A3021.JPG',
  'P64A3025.JPG','P64A3026.jpg','P64A3029.JPG','P64A3032.JPG','P64A3033.JPG','P64A3043.JPG',
  'P64A3045.jpg','P64A3050.JPG','P64A3054.JPG','P64A3059.JPG','P64A3064.JPG','P64A3066.JPG',
  'P64A3074.JPG','P64A3076.JPG','P64A3080.JPG','P64A3083.JPG','P64A3085.JPG','P64A3087.JPG',
  'P64A3097.JPG','P64A3099.JPG','P64A3105.JPG','P64A3107.JPG','P64A3110.JPG','P64A3118.JPG',
  'P64A3119.JPG','P64A3128.JPG','P64A3131.JPG','P64A3136.JPG','P64A3137.JPG','P64A3138.JPG',
  'P64A3141.JPG','P64A3147.JPG','P64A3148.JPG','P64A3153.JPG','P64A3154.JPG','P64A3157.JPG',
  'P64A3165.JPG','P64A3172.JPG','P64A3174.JPG','P64A3176.JPG','P64A3177.JPG','P64A3180.JPG',
  'P64A3181.JPG',
];

interface GImage { src: string; category: Category; }

const ALL_IMAGES: GImage[] = FILES.map((f, i) => ({
  src: `/images/gallery/${f}`,
  category: i < 23 ? 'crafted' : i < 46 ? 'golden' : i < 69 ? 'plated' : 'moments',
}));

const TABS: { id: Category; label: string }[] = [
  { id: 'all',      label: 'All'      },
  { id: 'crafted',  label: 'Crafted'  },
  { id: 'golden',   label: 'Golden'   },
  { id: 'plated',   label: 'Plated'   },
  { id: 'moments',  label: 'Moments'  },
];

const BATCH = 24;

function shuffleArr<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ── Gallery card with skeleton loader ────────────────────
function GalleryCard({ img, i, onClick }: { img: GImage; i: number; onClick: () => void }) {
  const [loaded, setLoaded] = useState(false);
  const optimizedSrc = `/_next/image?url=${encodeURIComponent(img.src)}&w=640&q=75`;

  return (
    <div
      className="break-inside-avoid mb-3 cursor-zoom-in group relative overflow-hidden rounded-xl bg-white/[0.04]"
      style={{ minHeight: loaded ? undefined : 220 }}
      onClick={onClick}
    >
      {/* Shimmer skeleton */}
      <div
        className={`absolute inset-0 z-10 overflow-hidden rounded-xl pointer-events-none transition-opacity duration-500 ${
          loaded ? 'opacity-0' : 'opacity-100'
        }`}
      >
        <div className="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-white/[0.07] to-transparent" />
      </div>

      <img
        src={optimizedSrc}
        alt=""
        loading="lazy"
        decoding="async"
        onLoad={() => setLoaded(true)}
        className={`w-full h-auto block transition-[opacity,transform] duration-500 ease-out group-hover:scale-[1.04] ${
          loaded ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {/* Hover overlay */}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/45 transition-all duration-300 flex items-center justify-center">
        <ZoomIn size={26} className="text-white opacity-0 group-hover:opacity-100 transition-all duration-300 drop-shadow-lg" />
      </div>

      {/* Index badge */}
      <div className="absolute bottom-2.5 right-3 text-[9px] font-bold tracking-[0.3em] text-white/0 group-hover:text-white/45 transition-all duration-300">
        {String(i + 1).padStart(2, '0')}
      </div>

      {/* Red corner — top left */}
      <span className="absolute top-0 left-0 h-[2px] bg-[#B80013] w-0 group-hover:w-7 transition-all duration-300 block" />
      <span className="absolute top-0 left-0 w-[2px] bg-[#B80013] h-0 group-hover:h-7 transition-all duration-300 block" />

      {/* Red corner — bottom right */}
      <span className="absolute bottom-0 right-0 h-[2px] bg-[#B80013] w-0 group-hover:w-7 transition-all duration-300 block" />
      <span className="absolute bottom-0 right-0 w-[2px] bg-[#B80013] h-0 group-hover:h-7 transition-all duration-300 block" />
    </div>
  );
}

// ── Lightbox ──────────────────────────────────────────────
function Lightbox({
  images, index, onClose, onPrev, onNext,
}: {
  images: GImage[]; index: number;
  onClose: () => void; onPrev: () => void; onNext: () => void;
}) {
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      if (e.key === 'Escape')     onClose();
      if (e.key === 'ArrowLeft')  onPrev();
      if (e.key === 'ArrowRight') onNext();
    };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [onClose, onPrev, onNext]);

  const tx = useRef(0);

  return (
    <motion.div
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      onTouchStart={(e) => { tx.current = e.touches[0].clientX; }}
      onTouchEnd={(e) => {
        const dx = e.changedTouches[0].clientX - tx.current;
        if (dx > 50) onPrev(); else if (dx < -50) onNext();
      }}
    >
      <div className="absolute inset-0 overflow-hidden">
        <img src={images[index].src} alt="" className="absolute inset-0 w-full h-full object-cover scale-110"
          style={{ filter: 'blur(48px)', opacity: 0.3 }} />
        <div className="absolute inset-0 bg-black/82" />
      </div>

      <div className="absolute top-5 left-6 z-20 text-white/30 text-[10px] uppercase tracking-[0.35em] font-bold tabular-nums">
        {String(index + 1).padStart(2, '0')} / {String(images.length).padStart(2, '0')}
      </div>

      <button onClick={onClose}
        className="absolute top-4 right-5 z-20 w-10 h-10 rounded-full border border-white/15 flex items-center justify-center text-white/50 hover:text-white hover:border-white/40 transition-all duration-200">
        <X size={17} />
      </button>

      <button onClick={onPrev}
        className="absolute left-4 md:left-6 z-20 w-11 h-11 rounded-full border border-white/15 flex items-center justify-center text-white/50 hover:text-white hover:border-white/40 transition-all duration-200">
        <ChevronLeft size={20} />
      </button>

      <AnimatePresence mode="wait">
        <motion.div key={index}
          initial={{ opacity: 0, scale: 0.96, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: -8 }}
          transition={{ duration: 0.28, ease: 'easeOut' }}
          className="relative z-10"
        >
          <img src={images[index].src} alt=""
            className="block rounded-xl shadow-[0_0_80px_rgba(0,0,0,0.9)]"
            style={{ maxWidth: '88vw', maxHeight: '88vh', objectFit: 'contain' }} />
          <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#B80013] to-transparent rounded-b-xl" />
        </motion.div>
      </AnimatePresence>

      <button onClick={onNext}
        className="absolute right-4 md:right-6 z-20 w-11 h-11 rounded-full border border-white/15 flex items-center justify-center text-white/50 hover:text-white hover:border-white/40 transition-all duration-200">
        <ChevronRight size={20} />
      </button>
    </motion.div>
  );
}

// ── Page ──────────────────────────────────────────────────
export default function GalleryPage() {
  const [active, setActive]           = useState<Category>('all');
  const [images, setImages]           = useState(ALL_IMAGES);
  const [displayed, setDisplayed]     = useState(ALL_IMAGES);
  const [fading, setFading]           = useState(false);
  const [visibleCount, setVisibleCount] = useState(BATCH);
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  const sentinelRef                   = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll();
  const scaleX = useTransform(scrollYProgress, [0, 1], [0, 1]);

  // Infinite scroll — load next batch when sentinel enters viewport
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisibleCount(c => Math.min(c + BATCH, displayed.length));
        }
      },
      { rootMargin: '200px' },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [displayed.length]);

  function handleFilter(cat: Category) {
    if (cat === active) return;
    setFading(true);
    setTimeout(() => {
      setActive(cat);
      const filtered = cat === 'all' ? images : images.filter(i => i.category === cat);
      setDisplayed(filtered);
      setVisibleCount(BATCH);
      setFading(false);
    }, 220);
  }

  function handleShuffle() {
    setFading(true);
    setTimeout(() => {
      const shuffled = shuffleArr(images);
      setImages(shuffled);
      const filtered = active === 'all' ? shuffled : shuffled.filter(i => i.category === active);
      setDisplayed(filtered);
      setVisibleCount(BATCH);
      setFading(false);
    }, 220);
  }

  function countFor(cat: Category) {
    return cat === 'all' ? ALL_IMAGES.length : ALL_IMAGES.filter(i => i.category === cat).length;
  }

  const visibleImages = displayed.slice(0, visibleCount);
  const hasMore       = visibleCount < displayed.length;

  return (
    <main className="bg-[#0d0d0d] text-white overflow-x-hidden">

      <motion.div
        className="fixed top-0 left-0 right-0 h-[2px] bg-[#B80013] z-[100] origin-left"
        style={{ scaleX }}
      />

      {/* ── HERO ── */}
      <section className="relative h-[65vh] flex items-end overflow-hidden">
        <Image
          src="/images/gallery/P64A2977.JPG"
          fill
          alt="Amal Foods gallery – handcrafted samoosas and pastries"
          className="object-cover"
          priority sizes="100vw" quality={90}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0d0d0d] via-black/60 to-black/20" />
        <div className="relative z-10 px-6 md:px-16 lg:px-24 max-w-7xl mx-auto w-full pb-20">
          <motion.p
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
            className="text-[#B80013] text-xs uppercase tracking-[0.4em] mb-4 font-bold"
          >
            Our Photography
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.1 }}
            className="text-5xl md:text-7xl lg:text-8xl font-extrabold uppercase leading-[1.0]"
            style={{ fontFamily: 'var(--font-roboto-condensed)' }}
          >
            Every Bite,<br />
            <span className="text-[#B80013]">Captured.</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-4 text-white/50 text-sm tracking-widest uppercase"
          >
            {ALL_IMAGES.length} images &nbsp;·&nbsp; Behind every product, a story.
          </motion.p>
        </div>
      </section>

      {/* ── FILTER BAR ── */}
      <div className="sticky top-0 z-40 bg-[#0d0d0d]/95 backdrop-blur-md border-b border-white/5">
        <div className="px-6 md:px-16 lg:px-24 max-w-7xl mx-auto flex items-center justify-between gap-4 py-4">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleFilter(tab.id)}
                className={`relative flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-all duration-200 ${
                  active === tab.id
                    ? 'bg-[#B80013] text-white'
                    : 'border border-white/10 text-white/40 hover:border-white/25 hover:text-white/70'
                }`}
              >
                {tab.label}
                <span className={`text-[9px] tabular-nums ${active === tab.id ? 'text-white/70' : 'text-white/20'}`}>
                  {countFor(tab.id)}
                </span>
              </button>
            ))}
          </div>
          <button
            onClick={handleShuffle}
            className="flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 text-white/35 text-xs uppercase tracking-widest font-bold hover:border-[#B80013]/50 hover:text-[#B80013] transition-all duration-200"
          >
            <Shuffle size={12} />
            <span className="hidden sm:inline">Shuffle</span>
          </button>
        </div>
      </div>

      {/* ── MASONRY GRID ── */}
      <section style={{ padding: '48px 50px' }}>
        <div
          key={active}
          className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4"
          style={{ columnGap: '12px', opacity: fading ? 0 : 1, transition: 'opacity 0.22s ease' }}
        >
          {visibleImages.map((img, i) => (
            <GalleryCard
              key={img.src}
              img={img}
              i={i}
              onClick={() => setLightboxIdx(i)}
            />
          ))}
        </div>

        {/* Sentinel — triggers next batch load */}
        {hasMore && (
          <div ref={sentinelRef} className="flex items-center justify-center gap-2 pt-12 pb-4">
            <span className="w-6 h-px bg-white/10" />
            <div className="flex gap-1.5">
              {[0, 1, 2].map(i => (
                <div
                  key={i}
                  className="w-1 h-1 rounded-full bg-[#B80013]/50 animate-pulse"
                  style={{ animationDelay: `${i * 0.18}s` }}
                />
              ))}
            </div>
            <span className="w-6 h-px bg-white/10" />
          </div>
        )}

        {/* All loaded indicator */}
        {!hasMore && displayed.length > 0 && (
          <div className="flex items-center justify-center gap-3 pt-12 pb-4">
            <span className="w-12 h-px bg-white/10" />
            <p className="text-white/20 text-[10px] uppercase tracking-[0.4em] font-bold">
              {displayed.length} photos
            </p>
            <span className="w-12 h-px bg-white/10" />
          </div>
        )}

        {displayed.length === 0 && (
          <div className="text-center py-32 text-white/20 text-sm uppercase tracking-widest">
            No images in this category.
          </div>
        )}
      </section>

      {/* ── CTA ── */}
      <section className="relative py-28 px-6 md:px-16 lg:px-24 bg-[#B80013] overflow-hidden">
        <div className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }} />
        <div className="relative max-w-7xl mx-auto text-center">
          <motion.h2
            initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }} viewport={{ once: true }}
            className="text-5xl md:text-7xl font-extrabold uppercase leading-tight mb-6"
            style={{ fontFamily: 'var(--font-roboto-condensed)' }}
          >
            Like what you see?<br />
            <span className="text-black/25">Taste it.</span>
          </motion.h2>
          <motion.div
            initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }} viewport={{ once: true }}
          >
            <a href="/products"
              className="inline-block bg-black text-white font-bold uppercase tracking-widest text-sm px-10 py-4 rounded-full hover:bg-white hover:text-[#B80013] transition-all duration-300">
              Explore Our Range
            </a>
          </motion.div>
        </div>
      </section>

      {/* ── LIGHTBOX ── */}
      <AnimatePresence>
        {lightboxIdx !== null && (
          <Lightbox
            images={displayed}
            index={lightboxIdx}
            onClose={() => setLightboxIdx(null)}
            onPrev={() => setLightboxIdx(i => (i! > 0 ? i! - 1 : displayed.length - 1))}
            onNext={() => setLightboxIdx(i => (i! < displayed.length - 1 ? i! + 1 : 0))}
          />
        )}
      </AnimatePresence>
    </main>
  );
}
