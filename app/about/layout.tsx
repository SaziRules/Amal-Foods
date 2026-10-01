import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About Us | Amal Foods – Born in a Durban Kitchen',
  description:
    'Learn the story behind Amal Foods — from a small Durban kitchen to South Africa\'s favourite handcrafted food brand. Family recipes, real ingredients, real flavour.',
  alternates: { canonical: 'https://www.amalfoods.co.za/about' },
  openGraph: {
    title: 'About Us | Amal Foods',
    description:
      'From a small Durban kitchen to tables across South Africa. Discover the heart, heritage, and family recipes behind Amal Foods.',
    url: 'https://www.amalfoods.co.za/about',
    images: [{ url: 'https://www.amalfoods.co.za/images/brand/about-hero.JPG', width: 1200, height: 630, alt: 'Amal Foods kitchen – handcrafted pastries and samoosas' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'About Us | Amal Foods',
    description: 'From a small Durban kitchen to tables across South Africa.',
    images: ['https://www.amalfoods.co.za/images/brand/about-hero.JPG'],
  },
};

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
