import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Our Products | Amal Foods – Samoosas, Spring Rolls, Parathas & More',
  description:
    'Browse the full Amal Foods range — handcrafted samoosas, spring rolls, pies, parathas, frozen meals and more. Order now for Ramadaan or stock up your kitchen.',
  alternates: { canonical: 'https://www.amalfoods.co.za/products' },
  openGraph: {
    title: 'Our Products | Amal Foods',
    description:
      'Samoosas, spring rolls, pies, parathas and more — all handcrafted fresh. Browse the full Amal Foods range and place your Ramadaan order.',
    url: 'https://www.amalfoods.co.za/products',
    images: [{ url: 'https://www.amalfoods.co.za/images/brand/products-hero.JPG', width: 1200, height: 630, alt: 'Amal Foods product range – samoosas, spring rolls and parathas' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Our Products | Amal Foods',
    description: 'Handcrafted samoosas, spring rolls, pies, parathas and more. Order now.',
    images: ['https://www.amalfoods.co.za/images/brand/products-hero.JPG'],
  },
};

export default function ProductsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
