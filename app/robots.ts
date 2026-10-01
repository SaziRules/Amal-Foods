import { MetadataRoute } from 'next';

const BASE_URL = 'https://www.amalfoods.co.za';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/dashboard', '/customer', '/api/', '/studio'],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
