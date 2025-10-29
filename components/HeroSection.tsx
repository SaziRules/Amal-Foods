"use client";

import Image from "next/image";

interface HeroSectionProps {
  title: string;
  highlight: string;
  subtitle: string;
  primaryLabel: string;
  secondaryLabel: string;
  tertiaryLabel?: string;
  onPrimaryClick?: () => void;
  onSecondaryClick?: () => void;
  onTertiaryClick?: () => void;
  activeRegion?: "durban" | "joburg" | "capetown";
}

export default function HeroSection({
  title,
  highlight,
  subtitle,
  primaryLabel,
  secondaryLabel,
  tertiaryLabel,
  onPrimaryClick,
  onSecondaryClick,
  onTertiaryClick,
  activeRegion,
}: HeroSectionProps) {
  const images: string[] = [
    "/images/hero1.jpg",
    "/images/hero2.jpg",
    "/images/hero3.jpg",
  ];

  return (
    <section
      className="relative flex flex-col md:flex-row h-[100dvh] md:h-[650px] overflow-hidden bg-[#1a1a1a] text-white pt-[var(--navbar-offset,96px)]"
    >
      {/* LEFT CONTENT */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 sm:px-10 md:px-16 lg:px-24 py-16 md:py-0 text-center md:text-left">
        <div className="max-w-[600px] w-full flex flex-col items-center md:items-start mt-4 md:mt-0">
          {/* HEADING */}
          <h1
            className="uppercase font-extrabold leading-[1.1]"
            style={{
              fontFamily: "var(--font-roboto-condensed)",
              fontSize: "clamp(2.6rem, 6vw, 5.8rem)",
              lineHeight: "clamp(3rem, 6vw, 5.4rem)",
              letterSpacing: "1px",
            }}
          >
            {title}{" "}
            <span className="text-[#B80013] block">{highlight}</span>
          </h1>

          {/* SUBTITLE */}
          <p
            className="uppercase text-white/90 font-bold text-[0.85rem] sm:text-[0.9rem] text-center md:text-left md:pl-[8px] tracking-[3px]"
            style={{
              fontFamily: "var(--font-roboto)",
              lineHeight: "35px",
              width: "fit-content",
            }}
          >
            {subtitle}
          </p>

          {/* BUTTONS */}
          <div className="flex gap-4 mt-10 flex-wrap justify-center md:justify-start">
            <button
              onClick={onPrimaryClick}
              className={`px-8 py-3 md:px-10 md:py-3.5 rounded-full text-sm md:text-base font-bold uppercase tracking-wide transition-all ${
                activeRegion === "durban"
                  ? "bg-[#B80013] text-white"
                  : "bg-white text-[#1a1a1a] hover:bg-gray-100"
              }`}
            >
              {primaryLabel}
            </button>

            <button
              onClick={onSecondaryClick}
              className={`px-8 py-3 md:px-10 md:py-3.5 rounded-full text-sm md:text-base font-bold uppercase tracking-wide transition-all ${
                activeRegion === "joburg"
                  ? "bg-[#B80013] text-white"
                  : "bg-white text-[#1a1a1a] hover:bg-gray-100"
              }`}
            >
              {secondaryLabel}
            </button>

            {tertiaryLabel && onTertiaryClick && (
              <button
                onClick={onTertiaryClick}
                className={`px-8 py-3 md:px-10 md:py-3.5 rounded-full text-sm md:text-base font-bold uppercase tracking-wide transition-all ${
                  activeRegion === "capetown"
                    ? "bg-[#B80013] text-white"
                    : "bg-white text-[#1a1a1a] hover:bg-gray-100"
                }`}
              >
                {tertiaryLabel}
              </button>
            )}
          </div>

          {/* MOBILE IMAGES */}
          <div className="grid grid-cols-3 gap-[6px] mt-10 w-full md:hidden">
            {images.map((src, i) => (
              <div key={i} className="relative aspect-square rounded-[6px] overflow-hidden">
                <Image
                  src={src}
                  alt={`Hero image ${i + 1}`}
                  fill
                  className="object-cover transition-transform duration-700 ease-out hover:scale-105"
                  priority
                />
                <div className="absolute inset-0 bg-black/10 hover:bg-black/0 transition-all duration-500" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* DESKTOP IMAGE STRIP */}
      <div className="hidden md:grid flex-[1.5] grid-cols-3 gap-[4px] h-full">
        {images.map((src, i) => (
          <div key={i} className="relative overflow-hidden group">
            <Image
              src={src}
              alt={`Hero image ${i + 1}`}
              fill
              className="object-cover transform group-hover:scale-105 transition-transform duration-700 ease-out"
              priority
            />
            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-all duration-500" />
          </div>
        ))}
      </div>
    </section>
  );
}
