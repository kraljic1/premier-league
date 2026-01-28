import { MetadataRoute } from 'next';
import { CLUBS } from '@/lib/clubs';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env['NEXT_PUBLIC_SITE_URL'] || 'https://premierleaguematches.com';
  
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

  // Add comparison pages (unique pairs)
  const comparisonPages: MetadataRoute.Sitemap = [];
  const clubsList = Object.values(CLUBS);
  
  for (let i = 0; i < clubsList.length; i++) {
    for (let j = i + 1; j < clubsList.length; j++) {
      const club1 = clubsList[i];
      const club2 = clubsList[j];
      
      // Sort alphabetically to ensure canonical URL
      const [team1, team2] = [club1.id, club2.id].sort();
      
      comparisonPages.push({
        url: `${baseUrl}/compare-season?team1=${team1}&team2=${team2}`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.6,
      });
    }
  }

  return [...sitemapEntries, ...clubPages, ...comparisonPages];
}
