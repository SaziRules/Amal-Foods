import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Photo Gallery | Amal Foods – Every Bite, Captured',
  description:
    'See the craftsmanship behind every Amal Foods product. 91 photos of handcrafted samoosas, parathas, spring rolls, pies and more — made fresh in Durban.',
  alternates: { canonical: 'https://www.amalfoods.co.za/gallery' },
  openGraph: {
    title: 'Photo Gallery | Amal Foods',
    description:
      '91 photos of handcrafted samoosas, parathas, spring rolls and more. Proudly made fresh in Durban.',
    url: 'https://www.amalfoods.co.za/gallery',
    images: [{ url: 'https://www.amalfoods.co.za/images/gallery/P64A2977.JPG', width: 1200, height: 630, alt: 'Amal Foods gallery – handcrafted samoosas and pastries' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Photo Gallery | Amal Foods',
    description: '91 photos of handcrafted samoosas, parathas, spring rolls and more.',
    images: ['https://www.amalfoods.co.za/images/gallery/P64A2977.JPG'],
  },
};

export default function GalleryLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
