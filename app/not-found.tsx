import Link from 'next/link';

const TICKER = 'SAMOOSAS  ·  PARATHAS  ·  SPRING ROLLS  ·  PIES  ·  PASTRIES  ·  MADE FRESH DAILY  ·  DURBAN BORN  ·  ';

export default function NotFound() {
  return (
    <main className="relative bg-[#0d0d0d] text-white min-h-screen overflow-hidden flex flex-col">

      {/* Ghost 404 background */}
      <div
        className="absolute inset-0 flex items-center justify-center pointer-events-none select-none"
        aria-hidden="true"
      >
        <span
          className="text-[32vw] font-extrabold uppercase leading-none whitespace-nowrap"
          style={{
            fontFamily: 'var(--font-roboto-condensed)',
            letterSpacing: '-2px',
            color: 'rgba(255,255,255,0.025)',
          }}
        >
          404
        </span>
      </div>

      {/* Red glow */}
      <div
        className="absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(184,0,19,0.18) 0%, transparent 70%)',
          transform: 'translate(-30%, 30%)',
        }}
      />

      {/* Centred content */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 text-center pb-16">

        {/* Eyebrow */}
        <div className="animate-fade-up flex items-center gap-3 mb-8">
          <span className="w-8 h-px bg-[#B80013]" />
          <p className="text-[#B80013] text-[10px] uppercase tracking-[0.5em] font-bold">
            Page Not Found
          </p>
          <span className="w-8 h-px bg-[#B80013]" />
        </div>

        {/* Headline */}
        <h1
          className="animate-fade-up-delay text-[clamp(4rem,16vw,11rem)] font-extrabold uppercase leading-[0.9] mb-6"
          style={{ fontFamily: 'var(--font-roboto-condensed)', letterSpacing: '1px' }}
        >
          Wrong
          <span className="block text-[#B80013]">Turn.</span>
        </h1>

        {/* Red divider */}
        <div className="animate-scale-in w-16 h-px bg-white/15 mb-8 origin-center" />

        {/* Subtext */}
        <p className="animate-fade-in-slow text-white/35 text-xs uppercase tracking-[0.35em] mb-12 max-w-xs leading-relaxed">
          This page doesn&apos;t exist or has been moved.
        </p>

        {/* CTAs */}
        <div className="animate-fade-in-ctas flex flex-col sm:flex-row gap-3">
          <Link
            href="/"
            className="px-10 py-3.5 bg-[#B80013] text-white rounded-full font-bold uppercase text-sm tracking-widest hover:bg-[#a20010] transition-all duration-200"
          >
            Back Home
          </Link>
          <Link
            href="/products"
            className="px-10 py-3.5 border border-white/15 text-white/70 rounded-full font-bold uppercase text-sm tracking-widest hover:border-white/40 hover:text-white transition-all duration-200"
          >
            Our Products
          </Link>
          <Link
            href="/contact"
            className="px-10 py-3.5 border border-white/15 text-white/70 rounded-full font-bold uppercase text-sm tracking-widest hover:border-white/40 hover:text-white transition-all duration-200"
          >
            Contact Us
          </Link>
        </div>

        {/* Secondary nav */}
        <div className="animate-fade-in-nav mt-16 flex items-center gap-6 text-white/20 text-[10px] uppercase tracking-[0.4em] font-bold">
          <Link href="/about" className="hover:text-white/60 transition-colors duration-200">About</Link>
          <span className="w-1 h-1 rounded-full bg-white/15" />
          <Link href="/gallery" className="hover:text-white/60 transition-colors duration-200">Gallery</Link>
          <span className="w-1 h-1 rounded-full bg-white/15" />
          <Link href="/contact" className="hover:text-white/60 transition-colors duration-200">Contact</Link>
        </div>
      </div>

      {/* Ticker strip */}
      <div className="absolute bottom-0 left-0 right-0 bg-[#B80013] py-2.5 overflow-hidden">
        <div className="animate-ticker">
          <span className="text-white text-[10px] font-bold uppercase tracking-[0.35em]">{TICKER}</span>
          <span className="text-white text-[10px] font-bold uppercase tracking-[0.35em]">{TICKER}</span>
        </div>
      </div>
    </main>
  );
}
