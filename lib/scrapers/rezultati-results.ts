/**
 * Scrapes Premier League results from Rezultati.com (FlashScore)
 * URL: https://www.rezultati.com/nogomet/engleska/premier-league/rezultati/
 * 
 * Rezultati.com typically has comprehensive historical results data
 * Note: This site loads content dynamically, so we need Puppeteer
 */

import { Fixture } from '../types';
import { isDerby } from '../clubs';
import { scrapePage } from './browser';

const REZULTATI_BASE_URL = 'https://www.rezultati.com/nogomet/engleska/premier-league/rezultati';

/**
 * Scrapes all finished results from Rezultati.com
 */
export async function scrapeResultsFromRezultati(): Promise<Fixture[]> {
  let page;
  
  try {
    console.log('[Rezultati] Fetching results from Rezultati.com...');
    console.log('[Rezultati] Opening page with Puppeteer (content loads dynamically)...');
    
    page = await scrapePage(REZULTATI_BASE_URL, undefined, 30000);
    
    // Wait for page to fully load
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Set viewport
    await page.setViewport({ width: 1920, height: 1080 });
    
    // Wait for match elements to load
    try {
      await page.waitForSelector('.event__match, tr[data-id], [class*="event"]', { timeout: 10000 });
    } catch (e) {
      console.log('[Rezultati] Match elements may load differently, proceeding anyway...');
    }
    
    // Extract results from the page
    const resultsData = await page.evaluate(() => {
      const results: any[] = [];
      const seenFixtureIds = new Set<string>();

      // Rezultati.com/FlashScore structure - look for match rows
      const matchSelectors = [
        '.event__match',
        'tr[data-id]',
        '[class*="event__match"]',
        'tr.event__match',
      ];

      let matchElements: Element[] = [];

      // Try each selector
      for (const selector of matchSelectors) {
        const elements = Array.from(document.querySelectorAll(selector));
        if (elements.length > 0) {
          matchElements = elements;
          break;
        }
      }

      // If no matches found, try broader search
      if (matchElements.length === 0) {
        const allElements = Array.from(document.querySelectorAll('tr, div[class*="event"], div[class*="match"]'));
        matchElements = allElements.filter(el => {
          const text = el.textContent || '';
          return /vs|v\.|[-–]\s*\d+|\d+\s*[-–]/.test(text) && text.length > 20 && text.length < 500;
        });
      }

      matchElements.forEach((element) => {
        try {
          const elementText = element.textContent || '';
          
          // Extract team names
          let homeTeam = '';
          let awayTeam = '';
          
          // Try FlashScore/Rezultati specific selectors
          const homeTeamEl = element.querySelector('.event__participant--home, [class*="home"]');
          const awayTeamEl = element.querySelector('.event__participant--away, [class*="away"]');
          
          if (homeTeamEl && awayTeamEl) {
            homeTeam = (homeTeamEl.textContent || '').trim();
            awayTeam = (awayTeamEl.textContent || '').trim();
          }

          // Fallback: extract from text
          if (!homeTeam || !awayTeam) {
            const teamPattern = /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*(?:\s+(?:United|City|Albion|Wanderers|Rovers|Athletic|Hotspur|FC))?)\s+vs?\.?\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*(?:\s+(?:United|City|Albion|Wanderers|Rovers|Athletic|Hotspur|FC))?)/i;
            const vsMatch = elementText.match(teamPattern);
            if (vsMatch && vsMatch[1] && vsMatch[2]) {
              homeTeam = vsMatch[1].trim();
              awayTeam = vsMatch[2].trim();
            }
          }

          // Extract scores
          let homeScore: number | null = null;
          let awayScore: number | null = null;

          const homeScoreEl = element.querySelector('.event__score--home, [class*="score--home"]');
          const awayScoreEl = element.querySelector('.event__score--away, [class*="score--away"]');
          
          if (homeScoreEl && awayScoreEl) {
            const homeScoreText = (homeScoreEl.textContent || '').trim();
            const awayScoreText = (awayScoreEl.textContent || '').trim();
            homeScore = parseInt(homeScoreText);
            awayScore = parseInt(awayScoreText);
          }

          // Fallback: extract from text
          if (homeScore === null || awayScore === null) {
            const scoreMatch = elementText.match(/(\d+)\s*[-–]\s*(\d+)/);
            if (scoreMatch) {
              homeScore = parseInt(scoreMatch[1]);
              awayScore = parseInt(scoreMatch[2]);
            }
          }

          // Results must have scores
          if (homeScore === null || awayScore === null) {
            return;
          }

          // Extract date
          let dateStr = '';
          const dateEl = element.querySelector('.event__time, [class*="date"], [class*="time"], time[datetime], [datetime]');
          if (dateEl) {
            dateStr = dateEl.getAttribute('datetime') || (dateEl.textContent || '').trim();
          }

          // Extract matchweek if available
          let matchweek = 1;
          const matchweekMatch = elementText.match(/matchweek\s*(\d+)|mw\s*(\d+)|round\s*(\d+)/i);
          if (matchweekMatch) {
            matchweek = parseInt(matchweekMatch[1] || matchweekMatch[2] || matchweekMatch[3]) || 1;
          }

          // Validate team names
          if (!homeTeam || !awayTeam || homeTeam.length < 3 || awayTeam.length < 3) {
            return;
          }

          // Clean team names
          homeTeam = homeTeam.trim().replace(/\s+/g, ' ');
          awayTeam = awayTeam.trim().replace(/\s+/g, ' ');

          // Create fixture ID
          const date = dateStr ? new Date(dateStr) : new Date();
          const dateOnly = date.toISOString().split('T')[0];
          const fixtureId = `${homeTeam.toLowerCase().replace(/\s+/g, '-')}-${awayTeam.toLowerCase().replace(/\s+/g, '-')}-${dateOnly}-${matchweek}`;

          if (seenFixtureIds.has(fixtureId)) {
            return;
          }
          seenFixtureIds.add(fixtureId);

          results.push({
            homeTeam,
            awayTeam,
            homeScore,
            awayScore,
            dateStr: date.toISOString(),
            matchweek,
          });
        } catch (error) {
          // Skip errors
        }
      });

      return results;
    });

    // Process and format results
    const formattedResults: Fixture[] = [];
    const seenIds = new Set<string>();

    for (const result of resultsData || []) {
      if (!result.homeTeam || !result.awayTeam) continue;
      
      const date = result.dateStr ? new Date(result.dateStr) : new Date();
      const dateOnly = date.toISOString().split('T')[0];
      const fixtureId = `${result.homeTeam.toLowerCase().replace(/\s+/g, '-')}-${result.awayTeam.toLowerCase().replace(/\s+/g, '-')}-${dateOnly}-${result.matchweek}`;
      
      if (seenIds.has(fixtureId)) continue;
      seenIds.add(fixtureId);

      formattedResults.push({
        id: fixtureId,
        date: date.toISOString(),
        homeTeam: result.homeTeam,
        awayTeam: result.awayTeam,
        homeScore: result.homeScore,
        awayScore: result.awayScore,
        matchweek: result.matchweek,
        status: 'finished',
        isDerby: isDerby(result.homeTeam, result.awayTeam),
      });
    }

    console.log(`[Rezultati] Successfully scraped ${formattedResults.length} results`);
    
    return formattedResults.sort((a, b) => {
      if (a.matchweek !== b.matchweek) {
        return a.matchweek - b.matchweek;
      }
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });
  } catch (error) {
    console.error('[Rezultati] Error scraping results:', error);
    throw error;
  } finally {
    if (page) {
      await page.close();
    }
  }
}
