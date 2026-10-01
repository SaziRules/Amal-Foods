import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact Us | Amal Foods – Durban & Johannesburg',
  description:
    'Get in touch with Amal Foods. Visit our Durban or Johannesburg branches, call us directly, or send a message. We\'re here to help with orders and enquiries.',
  alternates: { canonical: 'https://www.amalfoods.co.za/contact' },
  openGraph: {
    title: 'Contact Amal Foods | Durban & Johannesburg',
    description:
      'Two branches ready to serve you. Reach out to Amal Foods in Durban (031 303 7786) or Johannesburg (011 838 3299).',
    url: 'https://www.amalfoods.co.za/contact',
    images: [{ url: 'https://www.amalfoods.co.za/images/brand/contact-hero.JPG', width: 1200, height: 630, alt: 'Amal Foods contact – Durban and Johannesburg branches' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Contact Amal Foods | Durban & Johannesburg',
    description: 'Two branches ready to serve you across South Africa.',
    images: ['https://www.amalfoods.co.za/images/brand/contact-hero.JPG'],
  },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
