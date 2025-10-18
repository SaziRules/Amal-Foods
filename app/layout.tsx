import type { Metadata } from "next";
import { Geist, Geist_Mono, Roboto, Roboto_Condensed } from "next/font/google";
import "./globals.css";

// Base fonts
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// ✅ Add Roboto (Bold) and Roboto Condensed (Extra Bold)
const roboto = Roboto({
  weight: ["700"], // Bold
  subsets: ["latin"],
  variable: "--font-roboto",
});

const robotoCondensed = Roboto_Condensed({
  weight: ["800"], // Extra Bold
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
          antialiased
        `}
      >
        {children}
      </body>
    </html>
  );
}
