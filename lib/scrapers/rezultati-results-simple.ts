/**
 * Simplified Rezultati.com scraper - extracts data in smaller chunks
 * URL: https://www.rezultati.com/nogomet/engleska/premier-league/rezultati/
 */

import { Fixture } from '../types';
import { isDerby } from '../clubs';
import { scrapePage } from './browser';

const REZULTATI_BASE_URL = 'https://www.rezultati.com/nogomet/engleska/premier-league/rezultati';

/**
 * Helper function to parse date string
 */
function parseDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  
  // Try ISO format first
  if (dateStr.includes('T') || /^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
    const date = new Date(dateStr);
    if (!isNaN(date.getTime()) && date.getFullYear() >= 2024) {
      return date;
    }
  }
  
  // Try DD.MM.YYYY format (common on Rezultati.com)
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
  
  // Try DD.MM. HH:mm format (without year - assume current season 2025/2026)
  const ddmmyyyyTime = dateStr.match(/(\d{1,2})\.(\d{1,2})\.\s*(\d{1,2}):(\d{2})/);
  if (ddmmyyyyTime) {
    const day = parseInt(ddmmyyyyTime[1]);
    const month = parseInt(ddmmyyyyTime[2]) - 1;
    const hour = parseInt(ddmmyyyyTime[3]);
    const minute = parseInt(ddmmyyyyTime[4]);
    
    // Determine year: if month is Aug-Dec (7-11), it's 2025, otherwise 2026
    const currentYear = month >= 7 ? 2025 : 2026;
    const date = new Date(currentYear, month, day, hour, minute);
    if (!isNaN(date.getTime())) {
      return date;
    }
  }
  
  // Try DD.MM format (without year and time)
  const ddmmyyyyNoYear = dateStr.match(/(\d{1,2})\.(\d{1,2})/);
  if (ddmmyyyyNoYear && !dateStr.match(/\d{4}/)) {
    const day = parseInt(ddmmyyyyNoYear[1]);
    const month = parseInt(ddmmyyyyNoYear[2]) - 1;
    
    // Determine year: if month is Aug-Dec (7-11), it's 2025, otherwise 2026
    const currentYear = month >= 7 ? 2025 : 2026;
    const date = new Date(currentYear, month, day);
    if (!isNaN(date.getTime())) {
      return date;
    }
  }
  
  // Try DD/MM/YYYY format
  const ddmmyyyy2 = dateStr.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (ddmmyyyy2) {
    const day = parseInt(ddmmyyyy2[1]);
    const month = parseInt(ddmmyyyy2[2]) - 1;
    const year = parseInt(ddmmyyyy2[3]);
    const date = new Date(year, month, day);
    if (!isNaN(date.getTime())) {
      return date;
    }
  }
  
  // Fallback: try standard Date parsing
  const date = new Date(dateStr);
  if (!isNaN(date.getTime()) && date.getFullYear() >= 2024) {
    return date;
  }
  
  return null;
}

/**
 * Scrapes all finished results from Rezultati.com
 */
export async function scrapeResultsFromRezultati(): Promise<Fixture[]> {
  let page;
  
  try {
    console.log('[Rezultati] Fetching results from Rezultati.com...');
    console.log('[Rezultati] Opening page with Puppeteer...');
    
    page = await scrapePage(REZULTATI_BASE_URL, undefined, 30000);
    
    // Wait for page to fully load and let JavaScript execute
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Viewport is already set in scrapePage, but ensure it's correct
    await page.setViewport({ width: 1920, height: 1080 });
    
    // Add random delay to mimic human behavior
    await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500));
    
    // Wait for match elements to load
    try {
      await page.waitForSelector('.event__match', { timeout: 15000 });
    } catch (e) {
      console.log('[Rezultati] Waiting for elements...');
    }
    
    // Scroll multiple times to load all content
    for (let i = 0; i < 10; i++) {
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await new Promise(resolve => setTimeout(resolve, 1500));
    }
    
    await page.evaluate(() => window.scrollTo(0, 0));
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Extract results using page.evaluate with minimal code to avoid TypeScript issues
    const rawData = await page.evaluate(() => {
      var matches = [];
      // Use the selector that we know works: .event__match
      var elements = document.querySelectorAll('.event__match');
      
      for (var i = 0; i < elements.length; i++) {
        var el = elements[i];
        var text = el.textContent || '';
        
        // Extract basic info - try multiple selectors
        var homeEl = el.querySelector('.event__participant--home') || 
                     el.querySelector('[class*="participant--home"]') ||
                     el.querySelector('[class*="home"]');
        var awayEl = el.querySelector('.event__participant--away') || 
                     el.querySelector('[class*="participant--away"]') ||
                     el.querySelector('[class*="away"]');
        var homeScoreEl = el.querySelector('.event__score--home') ||
                          el.querySelector('[class*="score--home"]');
        var awayScoreEl = el.querySelector('.event__score--away') ||
                          el.querySelector('[class*="score--away"]');
        var timeEl = el.querySelector('.event__time') ||
                     el.querySelector('[class*="time"]') ||
                     el.querySelector('time[datetime]');
        
        // If we don't have score elements, try to extract from text
        var homeScore: number | null = null;
        var awayScore: number | null = null;
        
        if (homeScoreEl && awayScoreEl) {
          homeScore = parseInt((homeScoreEl.textContent || '').trim());
          awayScore = parseInt((awayScoreEl.textContent || '').trim());
        }
        
        // Fallback: extract from text
        if (homeScore === null || awayScore === null || isNaN(homeScore) || isNaN(awayScore)) {
          var scoreMatch = text.match(/(\d+)\s*[-–]\s*(\d+)/);
          if (scoreMatch) {
            homeScore = parseInt(scoreMatch[1]);
            awayScore = parseInt(scoreMatch[2]);
          }
        }
        
        var homeTeam = '';
        var awayTeam = '';
        
        if (homeEl && awayEl) {
          homeTeam = (homeEl.textContent || '').trim();
          awayTeam = (awayEl.textContent || '').trim();
        }
        
        // Fallback: extract from text
        if (!homeTeam || !awayTeam) {
          var teamMatch = text.match(/([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*(?:\s+(?:United|City|Albion|Wanderers|Rovers|Athletic|Hotspur|FC))?)\s+vs?\.?\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*(?:\s+(?:United|City|Albion|Wanderers|Rovers|Athletic|Hotspur|FC))?)/i);
          if (teamMatch && teamMatch[1] && teamMatch[2]) {
            homeTeam = teamMatch[1].trim();
            awayTeam = teamMatch[2].trim();
          }
        }
        
        var dateStr = '';
        if (timeEl) {
          dateStr = timeEl.getAttribute('datetime') || (timeEl.textContent || '').trim();
        }
        
        // Only add if we have all required data (scores are required for results)
        if (homeTeam && awayTeam && homeTeam.length >= 3 && awayTeam.length >= 3 && 
            homeScore !== null && awayScore !== null && 
            !isNaN(homeScore) && !isNaN(awayScore) && homeScore >= 0 && awayScore >= 0) {
          matches.push({
            homeTeam: homeTeam,
            awayTeam: awayTeam,
            homeScore: homeScore,
            awayScore: awayScore,
            dateStr: dateStr,
            text: text.substring(0, 200) // Limit text size
          });
        }
      }
      
      return matches;
    });
    
    console.log(`[Rezultati] Extracted ${rawData?.length || 0} raw matches from page`);
    
    // Debug: show sample data
    if (rawData && rawData.length > 0) {
      console.log(`[Rezultati] Sample match data:`, JSON.stringify(rawData[0], null, 2));
    }
    
    // Process results outside of page.evaluate
    const results: Fixture[] = [];
    const seenIds = new Set<string>();
    let skippedCount = 0;
    let skippedReasons: Record<string, number> = {};
    
    for (const match of rawData || []) {
      try {
        const { homeTeam, awayTeam, homeScore, awayScore, dateStr, text } = match;
        
        if (!homeTeam || !awayTeam) {
          skippedReasons['no_teams'] = (skippedReasons['no_teams'] || 0) + 1;
          skippedCount++;
          continue;
        }
        
        if (isNaN(homeScore) || isNaN(awayScore)) {
          skippedReasons['no_scores'] = (skippedReasons['no_scores'] || 0) + 1;
          skippedCount++;
          continue;
        }
        
        // Parse date
        let parsedDate = parseDate(dateStr);
        
        // Try to extract date from text if not found
        if (!parsedDate) {
          const dateMatch = text.match(/(\d{1,2})[\.\/](\d{1,2})[\.\/](\d{4})/);
          if (dateMatch) {
            parsedDate = parseDate(dateMatch[0]);
          }
        }
        
        if (!parsedDate) {
          skippedReasons['no_date'] = (skippedReasons['no_date'] || 0) + 1;
          skippedCount++;
          continue;
        }
        
        // Validate date
        const year = parsedDate.getFullYear();
        if (year < 2024 || year > 2027) {
          continue;
        }
        
        // Extract matchweek
        let matchweek = 1;
        const mwMatch = text.match(/kolo\s*(\d+)|round\s*(\d+)|matchweek\s*(\d+)/i);
        if (mwMatch) {
          matchweek = parseInt(mwMatch[1] || mwMatch[2] || mwMatch[3]) || 1;
        }
        
        // If matchweek not found, estimate based on date
        if (matchweek === 1 && parsedDate) {
          // Season starts August 17, 2025
          const seasonStart = new Date(2025, 7, 17); // August 17, 2025
          const daysDiff = Math.floor((parsedDate.getTime() - seasonStart.getTime()) / (1000 * 60 * 60 * 24));
          const estimatedMatchweek = Math.max(1, Math.min(38, Math.floor(daysDiff / 7) + 1));
          matchweek = estimatedMatchweek;
        }
        
        // Clean team names
        const cleanHomeTeam = homeTeam.trim().replace(/\s+/g, ' ');
        const cleanAwayTeam = awayTeam.trim().replace(/\s+/g, ' ');
        
        if (cleanHomeTeam.length < 3 || cleanAwayTeam.length < 3) {
          continue;
        }
        
        // Create fixture ID (without matchweek to ensure fixtures and results match)
        const dateOnly = parsedDate.toISOString().split('T')[0];
        const fixtureId = `${cleanHomeTeam.toLowerCase().replace(/\s+/g, '-')}-${cleanAwayTeam.toLowerCase().replace(/\s+/g, '-')}-${dateOnly}`;
        
        if (seenIds.has(fixtureId)) {
          continue;
        }
        seenIds.add(fixtureId);
        
        results.push({
          id: fixtureId,
          date: parsedDate.toISOString(),
          homeTeam: cleanHomeTeam,
          awayTeam: cleanAwayTeam,
          homeScore,
          awayScore,
          matchweek,
          status: 'finished',
          isDerby: isDerby(cleanHomeTeam, cleanAwayTeam),
        });
      } catch (error) {
        // Skip errors
        continue;
      }
    }
    
    console.log(`[Rezultati] Successfully scraped ${results.length} results`);
    console.log(`[Rezultati] Skipped ${skippedCount} matches. Reasons:`, skippedReasons);
    
    return results.sort((a, b) => {
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
