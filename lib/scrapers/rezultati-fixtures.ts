/**
 * Scrapes ALL Premier League fixtures (future matches) from Rezultati.com
 * URL: https://www.rezultati.com/nogomet/engleska/premier-league/raspored/
 * 
 * This scraper clicks the "Prikaži još mečeva" (Show more matches) button
 * repeatedly to load all future fixtures from the season.
 */

import { Fixture } from '../types';
import { isDerby } from '../clubs';
import { scrapePage, closeBrowser } from './browser';

const REZULTATI_FIXTURES_URL = 'https://www.rezultati.com/nogomet/engleska/premier-league/raspored';

/**
 * Helper function to parse date string (DD.MM. HH:mm format without year)
 */
function parseDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  
  // Try DD.MM. HH:mm format (common on Rezultati.com - no year)
  const ddmmTime = dateStr.match(/(\d{1,2})\.(\d{1,2})\.\s*(\d{1,2}):(\d{2})/);
  if (ddmmTime) {
    const day = parseInt(ddmmTime[1]);
    const month = parseInt(ddmmTime[2]) - 1;
    const hour = parseInt(ddmmTime[3]);
    const minute = parseInt(ddmmTime[4]);
    
    // Determine year: if month is Aug-Dec (7-11), it's 2025, otherwise 2026
    const currentYear = month >= 7 ? 2025 : 2026;
    const date = new Date(currentYear, month, day, hour, minute);
    if (!isNaN(date.getTime())) {
      return date;
    }
  }
  
  // Try DD.MM.YYYY HH:mm format
  const ddmmyyyyTime = dateStr.match(/(\d{1,2})\.(\d{1,2})\.(\d{4})\s*(\d{1,2}):(\d{2})/);
  if (ddmmyyyyTime) {
    const day = parseInt(ddmmyyyyTime[1]);
    const month = parseInt(ddmmyyyyTime[2]) - 1;
    const year = parseInt(ddmmyyyyTime[3]);
    const hour = parseInt(ddmmyyyyTime[4]);
    const minute = parseInt(ddmmyyyyTime[5]);
    const date = new Date(year, month, day, hour, minute);
    if (!isNaN(date.getTime())) {
      return date;
    }
  }
  
  // Try DD.MM.YYYY format (without time)
  const ddmmyyyy = dateStr.match(/(\d{1,2})\.(\d{1,2})\.(\d{4})/);
  if (ddmmyyyy) {
    const day = parseInt(ddmmyyyy[1]);
    const month = parseInt(ddmmyyyy[2]) - 1;
    const year = parseInt(ddmmyyyy[3]);
    const date = new Date(year, month, day);
    if (!isNaN(date.getTime())) {
      return date;
    }
  }
  
  // Try DD.MM format (without year and time)
  const ddmm = dateStr.match(/(\d{1,2})\.(\d{1,2})/);
  if (ddmm && !dateStr.match(/\d{4}/)) {
    const day = parseInt(ddmm[1]);
    const month = parseInt(ddmm[2]) - 1;
    const currentYear = month >= 7 ? 2025 : 2026;
    const date = new Date(currentYear, month, day);
    if (!isNaN(date.getTime())) {
      return date;
    }
  }
  
  return null;
}

/**
 * Scrapes all fixtures by clicking "Show more" button repeatedly
 */
export async function scrapeAllFixturesFromRezultati(): Promise<Fixture[]> {
  let page;
  
  try {
    console.log('[Rezultati Fixtures] Fetching ALL fixtures from Rezultati.com...');
    console.log('[Rezultati Fixtures] Will click "Show more" button to load all future matches...');
    
    page = await scrapePage(REZULTATI_FIXTURES_URL, undefined, 30000);
    
    // Wait for page to load
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Set viewport
    await page.setViewport({ width: 1920, height: 1080 });
    
    // Wait for match elements to load
    try {
      await page.waitForSelector('.event__match, .event__round', { timeout: 15000 });
    } catch (e) {
      console.log('[Rezultati Fixtures] Waiting for elements...');
    }
    
    // Click "Show more" button repeatedly to load all fixtures
    let clickCount = 0;
    const maxClicks = 30; // Limit to prevent infinite loops
    
    while (clickCount < maxClicks) {
      // Look for "Prikaži još mečeva" button
      const showMoreButton = await page.$('a.wclButtonLink, a[class*="wclButtonLink"]');
      
      if (!showMoreButton) {
        console.log(`[Rezultati Fixtures] No more "Show more" button found after ${clickCount} clicks`);
        break;
      }
      
      // Check if button is visible
      const isVisible = await page.evaluate((el) => {
        const rect = el.getBoundingClientRect();
        return rect.height > 0 && rect.width > 0;
      }, showMoreButton);
      
      if (!isVisible) {
        console.log('[Rezultati Fixtures] Button not visible, stopping');
        break;
      }
      
      // Scroll to button and click
      await page.evaluate((el) => {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, showMoreButton);
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      try {
        await showMoreButton.click();
        clickCount++;
        console.log(`[Rezultati Fixtures] Clicked "Show more" (${clickCount}/${maxClicks})...`);
        
        // Wait for content to load
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Add random delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500));
      } catch (clickError) {
        console.log('[Rezultati Fixtures] Error clicking button, trying JavaScript click...');
        await page.evaluate((el) => (el as HTMLElement).click(), showMoreButton);
        clickCount++;
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    // Get final count of matches
    const matchCount = await page.evaluate(() => 
      document.querySelectorAll('.event__match').length
    );
    console.log(`[Rezultati Fixtures] Total matches found after clicking: ${matchCount}`);
    
    // Extract all fixtures with proper matchweek from event__round elements
    const rawData = await page.evaluate(() => {
      var matches: any[] = [];
      
      // Get all elements in order (both rounds and matches)
      var container = document.querySelector('.sportName.soccer');
      if (!container) {
        container = document.querySelector('.event--results') || 
                    document.querySelector('.leagues--static') || 
                    document.body;
      }
      
      var allElements = container.querySelectorAll('.event__round, .event__match');
      var currentMatchweek = 0;
      
      for (var i = 0; i < allElements.length; i++) {
        var el = allElements[i];
        
        // Check if this is a round header
        if (el.classList.contains('event__round')) {
          // Extract matchweek number from text like "22. kolo" or "38. kolo"
          var roundText = el.textContent || '';
          var roundMatch = roundText.match(/(\d+)\.\s*kolo/i);
          if (roundMatch) {
            currentMatchweek = parseInt(roundMatch[1]);
          }
          continue;
        }
        
        // This is a match element
        if (!el.classList.contains('event__match')) continue;
        
        // Extract match data
        var homeEl = el.querySelector('.event__participant--home') || 
                     el.querySelector('[class*="homeParticipant"]');
        var awayEl = el.querySelector('.event__participant--away') || 
                     el.querySelector('[class*="awayParticipant"]');
        var timeEl = el.querySelector('.event__time');
        
        // Extract team names and clean them up
        var homeTeam = homeEl ? (homeEl.textContent || '').trim() : '';
        var awayTeam = awayEl ? (awayEl.textContent || '').trim() : '';
        
        // Clean team names - remove trailing numbers and extra whitespace
        homeTeam = homeTeam.replace(/\d+$/, '').trim();
        awayTeam = awayTeam.replace(/\d+$/, '').trim();
        
        var dateStr = timeEl ? (timeEl.textContent || '').trim() : '';
        
        // Fixtures don't have scores yet
        if (homeTeam && awayTeam && currentMatchweek > 0) {
          matches.push({
            homeTeam: homeTeam,
            awayTeam: awayTeam,
            dateStr: dateStr,
            matchweek: currentMatchweek
          });
        }
      }
      
      return matches;
    });
    
    console.log(`[Rezultati Fixtures] Extracted ${rawData.length} raw fixtures`);
    
    // Process fixtures
    const fixtures: Fixture[] = [];
    const seenIds = new Set<string>();
    
    for (const match of rawData) {
      const parsedDate = parseDate(match.dateStr);
      if (!parsedDate) continue;
      
      const year = parsedDate.getFullYear();
      if (year < 2024 || year > 2027) continue;
      
      const matchweek = match.matchweek;
      
      const homeTeam = match.homeTeam.trim().replace(/\s+/g, ' ');
      const awayTeam = match.awayTeam.trim().replace(/\s+/g, ' ');
      
      if (homeTeam.length < 3 || awayTeam.length < 3) continue;
      
      const dateOnly = parsedDate.toISOString().split('T')[0];
      const fixtureId = `${homeTeam.toLowerCase().replace(/\s+/g, '-')}-${awayTeam.toLowerCase().replace(/\s+/g, '-')}-${dateOnly}`;
      
      if (seenIds.has(fixtureId)) continue;
      seenIds.add(fixtureId);
      
      fixtures.push({
        id: fixtureId,
        date: parsedDate.toISOString(),
        homeTeam,
        awayTeam,
        homeScore: null,
        awayScore: null,
        matchweek,
        status: 'scheduled',
        isDerby: isDerby(homeTeam, awayTeam),
      });
    }
    
    // Sort by date (earliest first)
    fixtures.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    console.log(`[Rezultati Fixtures] Successfully scraped ${fixtures.length} fixtures`);
    
    // Log matchweek distribution
    const matchweekCounts = new Map<number, number>();
    for (const f of fixtures) {
      matchweekCounts.set(f.matchweek, (matchweekCounts.get(f.matchweek) || 0) + 1);
    }
    console.log('[Rezultati Fixtures] Matchweek distribution:', Object.fromEntries(matchweekCounts));
    
    // Log date range
    if (fixtures.length > 0) {
      console.log(`[Rezultati Fixtures] Date range: ${fixtures[0].date} to ${fixtures[fixtures.length - 1].date}`);
    }
    
    return fixtures;
  } catch (error) {
    console.error('[Rezultati Fixtures] Error scraping fixtures:', error);
    throw error;
  } finally {
    if (page) {
      await page.close();
    }
  }
}
