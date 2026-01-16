import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://premierleaguefixures.com';
  
  // Define all static routes
  const routes = [
    '',
    '/fixtures-results',
    '/standings',
    '/compare',
    '/top-scorers',
  ];

  // Generate sitemap entries
  const sitemapEntries: MetadataRoute.Sitemap = routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === '' ? 'daily' : 'weekly',
    priority: route === '' ? 1.0 : 0.8,
  }));

  return sitemapEntries;
}
