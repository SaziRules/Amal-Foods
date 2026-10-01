import type { Metadata } from "next";
import { Geist, Geist_Mono, Roboto, Roboto_Condensed } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/context/CartContext";
import Navbar from "@/components/Navbar";
import FloatingButtons from "@/components/FloatingButtons";
import Footer from "@/components/Footer";

const BASE_URL = "https://www.amalfoods.co.za";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const roboto = Roboto({ weight: ["400", "500", "700"], subsets: ["latin"], variable: "--font-roboto" });
const robotoCondensed = Roboto_Condensed({ weight: ["800"], subsets: ["latin"], variable: "--font-roboto-condensed" });

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "Amal Foods | Handcrafted Samoosas, Parathas & More – Durban",
    template: "%s | Amal Foods",
  },
  description:
    "Order authentic handcrafted samoosas, spring rolls, parathas and frozen meals from Amal Foods. Proudly Durban-born, made fresh daily. Two branches: Durban & Johannesburg.",
  keywords: [
    "samoosas", "parathas", "spring rolls", "pies", "frozen meals",
    "halal food", "Durban food", "Amal Foods", "handcrafted pastries",
    "Ramadan food", "South African food",
  ],
  authors: [{ name: "Amal Foods" }],
  creator: "Amal Foods",
  publisher: "Amal Foods",
  alternates: { canonical: BASE_URL },
  openGraph: {
    type: "website",
    locale: "en_ZA",
    url: BASE_URL,
    siteName: "Amal Foods",
    title: "Amal Foods | Handcrafted Samoosas, Parathas & More",
    description:
      "Authentic handcrafted samoosas, spring rolls, parathas and frozen meals. Proudly Durban-born, made fresh daily.",
    images: [
      {
        url: "/images/brand/one.JPG",
        width: 1200,
        height: 630,
        alt: "Amal Foods – handcrafted samoosas and pastries made fresh in Durban",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Amal Foods | Handcrafted Samoosas, Parathas & More",
    description:
      "Authentic handcrafted samoosas, spring rolls, parathas and frozen meals. Proudly Durban-born.",
    images: ["/images/brand/one.JPG"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": `${BASE_URL}/#website`,
      url: BASE_URL,
      name: "Amal Foods",
      description: "Handcrafted samoosas, parathas, spring rolls and more – Durban-born, made fresh daily.",
      potentialAction: {
        "@type": "SearchAction",
        target: { "@type": "EntryPoint", urlTemplate: `${BASE_URL}/products?q={search_term_string}` },
        "query-input": "required name=search_term_string",
      },
    },
    {
      "@type": "Organization",
      "@id": `${BASE_URL}/#organization`,
      name: "Amal Foods",
      url: BASE_URL,
      logo: {
        "@type": "ImageObject",
        url: `${BASE_URL}/images/brand/logo.png`,
        width: 200,
        height: 200,
      },
      sameAs: [
        "https://www.instagram.com/amalfoods_",
        "https://www.facebook.com",
        "https://www.youtube.com",
      ],
      contactPoint: [
        {
          "@type": "ContactPoint",
          telephone: "+27313037786",
          contactType: "customer service",
          areaServed: "ZA",
          availableLanguage: "English",
          email: "info@amalfoods.co.za",
        },
      ],
    },
    {
      "@type": "FoodEstablishment",
      "@id": `${BASE_URL}/#durban`,
      name: "Amal Foods – Durban",
      url: BASE_URL,
      telephone: "+27313037786",
      email: "info@amalfoods.co.za",
      servesCuisine: ["South African", "Halal", "Indian"],
      priceRange: "$$",
      address: {
        "@type": "PostalAddress",
        streetAddress: "1271 Umgeni Rd, Stamford Hill",
        addressLocality: "Durban",
        postalCode: "4025",
        addressCountry: "ZA",
      },
      geo: {
        "@type": "GeoCoordinates",
        latitude: -29.8412,
        longitude: 31.0218,
      },
      openingHoursSpecification: [
        { "@type": "OpeningHoursSpecification", dayOfWeek: ["Monday","Tuesday","Wednesday","Thursday","Friday"], opens: "08:00", closes: "17:00" },
      ],
    },
    {
      "@type": "FoodEstablishment",
      "@id": `${BASE_URL}/#johannesburg`,
      name: "Amal Foods – Johannesburg",
      url: BASE_URL,
      telephone: "+27118383299",
      email: "jhb@amalfoods.co.za",
      servesCuisine: ["South African", "Halal", "Indian"],
      priceRange: "$$",
      address: {
        "@type": "PostalAddress",
        streetAddress: "123 Van Tonder St, Sunderland Ridge",
        addressLocality: "Centurion",
        postalCode: "0157",
        addressCountry: "ZA",
      },
    },
  ],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${roboto.variable} ${robotoCondensed.variable} font-sans antialiased`}
        style={{ fontFamily: "var(--font-roboto), system-ui, sans-serif" }}
      >
        <CartProvider>
          <Navbar />
          {children}
          <FloatingButtons />
          <Footer />
        </CartProvider>
      </body>
    </html>
  );
}
