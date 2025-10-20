import type { Metadata } from "next";
import { Geist, Geist_Mono, Roboto, Roboto_Condensed } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/context/CartContext" // ✅ Import your CartProvider
import Navbar from "@/components/Navbar";

// Base fonts
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// ✅ Roboto (Base font for body, UI)
const roboto = Roboto({
  weight: ["400", "500", "700"], // Regular, Medium, Bold
  subsets: ["latin"],
  variable: "--font-roboto",
});

// ✅ Roboto Condensed (Extra Bold for big headings)
const robotoCondensed = Roboto_Condensed({
  weight: ["800"],
  subsets: ["latin"],
  variable: "--font-roboto-condensed",
});

export const metadata: Metadata = {
  title: "Amal Foods",
  description: "Savor the Crunch — Amal Foods",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`
          ${geistSans.variable}
          ${geistMono.variable}
          ${roboto.variable}
          ${robotoCondensed.variable}
          font-sans antialiased
        `}
        style={{
          fontFamily: "var(--font-roboto), system-ui, sans-serif",
        }}
      >
        {/* ✅ Wrap the entire app in the CartProvider */}
        <CartProvider>
          <Navbar />
          {children}
        </CartProvider>
      </body>
    </html>
  );
}
