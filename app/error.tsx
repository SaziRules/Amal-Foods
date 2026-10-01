'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="bg-[#0d0d0d] text-white min-h-screen flex flex-col items-center justify-center px-6 text-center">
      <p className="text-[#B80013] text-xs uppercase tracking-[0.4em] mb-6 font-bold">Something went wrong</p>
      <h1
        className="text-7xl md:text-9xl font-extrabold uppercase leading-none mb-4"
        style={{ fontFamily: 'var(--font-roboto-condensed)' }}
      >
        Error.
      </h1>
      <p className="text-white/40 text-sm tracking-widest uppercase mb-12 max-w-sm">
        An unexpected error occurred. Please try again.
      </p>
      <div className="flex flex-col sm:flex-row gap-4">
        <button
          onClick={reset}
          className="px-10 py-3.5 bg-[#B80013] text-white rounded-full font-bold uppercase text-sm tracking-wide hover:bg-[#a20010] transition-all duration-200"
        >
          Try Again
        </button>
        <Link
          href="/"
          className="px-10 py-3.5 border border-white/20 text-white/80 rounded-full font-bold uppercase text-sm tracking-wide hover:border-white/50 hover:text-white transition-all duration-200"
        >
          Back Home
        </Link>
      </div>
    </main>
  );
}
