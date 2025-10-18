"use client";
import Image from "next/image";

export default function Hero() {
  return (
    <section className="relative bg-black text-white min-h-[90vh] flex flex-col md:flex-row items-center justify-between px-6 md:px-16 overflow-hidden">
      {/* Left side: Text content */}
      <div className="z-10 max-w-xl md:w-1/2 py-16">
        <h1 className="text-5xl md:text-7xl font-extrabold leading-tight tracking-tight">
          <span className="block">PATHA</span>
          <span className="block text-red-500">SAMOOSA</span>
        </h1>

        <p className="text-gray-300 mt-4 tracking-wide text-lg">
          SAVOR THE CRUNCH. LOVE THE TASTE.
        </p>

        <div className="w-16 border-t border-gray-500 mt-8 mb-6"></div>

        <p className="text-sm text-gray-400 italic leading-relaxed max-w-md">
          “Handcrafted with care, every Amal Foods samoosa is golden-crisp on
          the outside and filled with authentic flavor inside. A timeless snack,
          perfected for your enjoyment.”
        </p>

        <div className="flex gap-4 mt-8">
          <button className="bg-red-600 hover:bg-red-700 transition text-white px-6 py-3 rounded-full font-semibold">
            View Menu
          </button>
          <button className="bg-red-600 hover:bg-red-700 transition text-white px-6 py-3 rounded-full font-semibold">
            Order Now
          </button>
        </div>
      </div>

      {/* Right side: Heart + Product image */}
      <div className="relative md:w-1/2 w-full flex justify-center items-center mt-10 md:mt-0">
        {/* Heart background */}
        <div className="absolute right-[-150px] bottom-[-250px] md:right-[-250px] md:bottom-[-300px] w-[700px] h-[700px] md:w-[900px] md:h-[900px]">
          <div className="absolute inset-0 bg-red-600 rounded-full translate-x-[35%] translate-y-[10%]" />
          <div className="absolute inset-0 bg-red-600 rounded-full -translate-x-[35%] translate-y-[10%]" />
          <div className="absolute inset-0 bg-red-600 rotate-45" />
        </div>


        {/* Product image */}
        <Image
          src="/images/patha-samoosa.png"
          alt="Patha Samoosa"
          width={450}
          height={450}
          className="relative z-10 object-contain drop-shadow-2xl"
          priority
        />
      </div>
    </section>
  );
}
