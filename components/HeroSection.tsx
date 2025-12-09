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
  className="relative flex flex-col md:flex-row h-[450px] md:h-[450px] overflow-hidden bg-[#1a1a1a] text-white pt-24 md:pt-0"
>

      {/* LEFT CONTENT */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 sm:px-10 md:px-16 lg:px-24 py-16 md:py-0 text-center md:text-left md:pt-[60px]">
        <div className="max-w-[600px] w-full flex flex-col items-center md:items-start mt-4 md:mt-0">
          {/* HEADING */}
          <h1
  className="uppercase font-extrabold text-center md:text-left"
  style={{
    fontFamily: "var(--font-roboto-condensed)",
    fontSize: "clamp(1.8rem, 4vw, 3rem)", // MUCH smaller
    lineHeight: "1.1",
    letterSpacing: "1px",
    whiteSpace: "nowrap", // ⭐ FORCE ONE LINE
  }}
>
  {title} <span className="text-[#B80013]">{highlight}</span>
</h1>


          {/* SUBTITLE */}
          <p
  className="uppercase text-white/80 font-semibold text-[0.7rem] sm:text-[0.8rem] mt-2 tracking-[2px] text-center md:text-left"
  style={{ fontFamily: "var(--font-roboto)" }}
>
  {subtitle}
</p>


          {/* BUTTONS */}
          <div className="flex gap-2 mt-4 pb-5 overflow-x-auto no-scrollbar flex-nowrap justify-center md:justify-start">
  <button
    onClick={onPrimaryClick}
    className={`
      px-3 py-1.5 md:px-4 md:py-2
      rounded-full
      text-[10px] md:text-[12px]
      font-bold uppercase tracking-wide
      whitespace-nowrap
      transition-all
      ${activeRegion === "durban" ? "bg-[#B80013] text-white" : "bg-white text-[#1a1a1a] hover:bg-gray-300"}
    `}
  >
    {primaryLabel}
  </button>

  <button
    onClick={onSecondaryClick}
    className={`
      px-3 py-1.5 md:px-4 md:py-2
      rounded-full
      text-[10px] md:text-[12px]
      font-bold uppercase tracking-wide
      whitespace-nowrap
      transition-all
      ${activeRegion === "joburg" ? "bg-[#B80013] text-white" : "bg-white text-[#1a1a1a] hover:bg-gray-300"}
    `}
  >
    {secondaryLabel}
  </button>

  {tertiaryLabel && (
    <button
      onClick={onTertiaryClick}
      className={`
        px-3 py-1.5 md:px-4 md:py-2
        rounded-full
        text-[10px] md:text-[12px]
        font-bold uppercase tracking-wide
        whitespace-nowrap
        transition-all
        ${activeRegion === "capetown" ? "bg-[#B80013] text-white" : "bg-white text-[#1a1a1a] hover:bg-gray-300"}
      `}
    >
      {tertiaryLabel}
    </button>
  )}
</div>


          {/* MOBILE IMAGES */}
          <div className="grid grid-cols-3 gap-1.5mt-10 w-full md:hidden">
            {images.map((src, i) => (
              <div key={i} className="relative aspect-square rounded-md overflow-hidden">
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
      <div className="hidden md:grid flex-[1.5] grid-cols-3 gap-1 h-full">
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
