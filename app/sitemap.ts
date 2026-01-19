import { MetadataRoute } from 'next';
import { CLUBS } from '@/lib/clubs';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env['NEXT_PUBLIC_SITE_URL'] || 'https://premieleaguematches.com';
  
  // Define all static routes
  const routes = [
    '',
    '/fixtures-results',
    '/standings',
    '/compare-fixtures',
    '/compare-season',
  ];

  // Generate sitemap entries for static routes
  const sitemapEntries: MetadataRoute.Sitemap = routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === '' ? 'daily' : 'weekly',
    priority: route === '' ? 1.0 : 0.8,
  }));

  // Add dynamic club pages for better SEO coverage
  const clubPages: MetadataRoute.Sitemap = Object.values(CLUBS).map((club) => ({
    url: `${baseUrl}/club/${club.id}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.7,
  }));

  return [...sitemapEntries, ...clubPages];
}
