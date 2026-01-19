import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/_next/', '/sw.js'],
    },
    sitemap: 'https://premierleaguematches.com/sitemap.xml',
  };
}
