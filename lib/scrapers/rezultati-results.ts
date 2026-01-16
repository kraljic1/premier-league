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
    
    // Scroll multiple times to load all content (Rezultati.com loads content dynamically)
    for (let i = 0; i < 5; i++) {
      await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight);
      });
      await new Promise(resolve => setTimeout(resolve, 1500));
    }
    
    // Scroll back up
    await page.evaluate(() => {
      window.scrollTo(0, 0);
    });
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Extract results from the page
    // Using a simpler approach to avoid TypeScript compilation issues
    const resultsData = await page.evaluate(() => {
      var results = [];
      var seenFixtureIds = new Set();
      
      // Helper function to parse date from various formats
      var parseDate = function(dateStr: string) {
        if (!dateStr) return null;
        
        // Try ISO format first
        if (dateStr.indexOf('T') !== -1 || /^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
          var date = new Date(dateStr);
          if (!isNaN(date.getTime()) && date.getFullYear() >= 2024) {
            return date;
          }
        }
        
        // Try DD.MM.YYYY format (common on Rezultati.com)
        var ddmmyyyy = dateStr.match(/(\d{1,2})\.(\d{1,2})\.(\d{4})/);
        if (ddmmyyyy) {
          var day = parseInt(ddmmyyyy[1]);
          var month = parseInt(ddmmyyyy[2]) - 1; // JS months are 0-indexed
          var year = parseInt(ddmmyyyy[3]);
          var date = new Date(year, month, day);
          if (!isNaN(date.getTime())) {
            return date;
          }
        }
        
        // Try DD/MM/YYYY format
        var ddmmyyyy2 = dateStr.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
        if (ddmmyyyy2) {
          var day = parseInt(ddmmyyyy2[1]);
          var month = parseInt(ddmmyyyy2[2]) - 1;
          var year = parseInt(ddmmyyyy2[3]);
          var date = new Date(year, month, day);
          if (!isNaN(date.getTime())) {
            return date;
          }
        }
        
        // Try DD MMM YYYY format
        var monthMap: Record<string, number> = {
          'jan': 0, 'feb': 1, 'mar': 2, 'apr': 3, 'may': 4, 'jun': 5,
          'jul': 6, 'aug': 7, 'sep': 8, 'oct': 9, 'nov': 10, 'dec': 11,
          'sij': 0, 'velj': 1, 'ožu': 2, 'tra': 3, 'svi': 4, 'lip': 5,
          'srp': 6, 'kol': 7, 'ruj': 8, 'lis': 9, 'stu': 10, 'pro': 11
        };
        
        var ddmmyyyy3 = dateStr.match(/(\d{1,2})\s+([a-z]{3})\s+(\d{4})/i);
        if (ddmmyyyy3) {
          var day = parseInt(ddmmyyyy3[1]);
          var monthStr = ddmmyyyy3[2].toLowerCase().substring(0, 3);
          var month = monthMap[monthStr] as number;
          var year = parseInt(ddmmyyyy3[3]);
          if (month !== undefined && !isNaN(day) && !isNaN(year)) {
            var date = new Date(year, month, day);
            if (!isNaN(date.getTime())) {
              return date;
            }
          }
        }
        
        // Fallback: try standard Date parsing
        var date = new Date(dateStr);
        if (!isNaN(date.getTime()) && date.getFullYear() >= 2024) {
          return date;
        }
        
        return null; // Explicit return for clarity
      }

      // Rezultati.com/FlashScore structure - look for match rows
      var matchSelectors = [
        '.event__match',
        'tr[data-id]',
        '[class*="event__match"]',
        'tr.event__match',
        '[class*="event__round"]',
      ];

      var matchElements: Element[] = [];
      
      // Try each selector
      for (var i = 0; i < matchSelectors.length; i++) {
        var selector = matchSelectors[i];
        var elements = Array.from(document.querySelectorAll(selector));
        if (elements.length > 0) {
          matchElements = elements;
          break;
        }
      }

      // If no matches found, try broader search
      if (matchElements.length === 0) {
        var allElements = Array.from(document.querySelectorAll('tr, div[class*="event"], div[class*="match"]'));
        matchElements = allElements.filter(function(el) {
          var text = el.textContent || '';
          return /vs|v\.|[-–]\s*\d+|\d+\s*[-–]/.test(text) && text.length > 20 && text.length < 500;
        });
      }

      for (var idx = 0; idx < matchElements.length; idx++) {
        var element = matchElements[idx];
        try {
          var elementText = element.textContent || '';
          
          // Extract team names
          var homeTeam = '';
          var awayTeam = '';
          
          // Try FlashScore/Rezultati specific selectors
          var homeTeamEl = element.querySelector('.event__participant--home, [class*="home"]');
          var awayTeamEl = element.querySelector('.event__participant--away, [class*="away"]');
          
          if (homeTeamEl && awayTeamEl) {
            homeTeam = (homeTeamEl.textContent || '').trim();
            awayTeam = (awayTeamEl.textContent || '').trim();
          }

          // Fallback: extract from text
          if (!homeTeam || !awayTeam) {
            var teamPattern = /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*(?:\s+(?:United|City|Albion|Wanderers|Rovers|Athletic|Hotspur|FC))?)\s+vs?\.?\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*(?:\s+(?:United|City|Albion|Wanderers|Rovers|Athletic|Hotspur|FC))?)/i;
            var vsMatch = elementText.match(teamPattern);
            if (vsMatch && vsMatch[1] && vsMatch[2]) {
              homeTeam = vsMatch[1].trim();
              awayTeam = vsMatch[2].trim();
            }
          }

          // Extract scores
          var homeScore = null;
          var awayScore = null;

          var homeScoreEl = element.querySelector('.event__score--home, [class*="score--home"]');
          var awayScoreEl = element.querySelector('.event__score--away, [class*="score--away"]');
          
          if (homeScoreEl && awayScoreEl) {
            var homeScoreText = (homeScoreEl.textContent || '').trim();
            var awayScoreText = (awayScoreEl.textContent || '').trim();
            homeScore = parseInt(homeScoreText);
            awayScore = parseInt(awayScoreText);
          }

          // Fallback: extract from text
          if (homeScore === null || awayScore === null) {
            var scoreMatch = elementText.match(/(\d+)\s*[-–]\s*(\d+)/);
            if (scoreMatch) {
              homeScore = parseInt(scoreMatch[1]);
              awayScore = parseInt(scoreMatch[2]);
            }
          }

          // Results must have scores
          if (homeScore === null || awayScore === null) {
            continue;
          }

          // Extract date - try multiple methods
          var dateStr = '';
          var parsedDate = null;
          
          // Method 1: Check datetime attribute
          var dateEl = element.querySelector('time[datetime], [datetime]');
          if (dateEl) {
            dateStr = dateEl.getAttribute('datetime') || '';
            if (dateStr) {
              parsedDate = parseDate(dateStr);
            }
          }
          
          // Method 2: Check event__time element
          if (!parsedDate) {
            var timeEl = element.querySelector('.event__time, [class*="event__time"]');
            if (timeEl) {
              dateStr = (timeEl.textContent || '').trim();
              parsedDate = parseDate(dateStr);
            }
          }
          
          // Method 3: Look for date in parent elements (date headers)
          if (!parsedDate) {
            var parent = element.parentElement;
            for (var j = 0; j < 5 && parent; j++) {
              var parentDateEl = parent.querySelector('.event__time, [class*="date"], time[datetime]');
              if (parentDateEl) {
                dateStr = parentDateEl.getAttribute('datetime') || (parentDateEl.textContent || '').trim();
                parsedDate = parseDate(dateStr);
                if (parsedDate) break;
              }
              parent = parent.parentElement;
            }
          }
          
          // Method 4: Extract from element text
          if (!parsedDate) {
            var dateMatch = elementText.match(/(\d{1,2})[\.\/](\d{1,2})[\.\/](\d{4})/);
            if (dateMatch) {
              dateStr = dateMatch[0];
              parsedDate = parseDate(dateStr);
            }
          }
          
          // If still no date, skip this match (we need dates for proper matchweek assignment)
          if (!parsedDate) {
            continue;
          }
          
          // Validate date is in reasonable range (2024-2027 for 2025/26 season)
          var year = parsedDate.getFullYear();
          if (year < 2024 || year > 2027) {
            continue; // Skip dates that are clearly wrong
          }

          // Extract matchweek - try to find in element or nearby
          var matchweek = 1;
          
          // Method 1: Look for matchweek in text
          var matchweekMatch = elementText.match(/kolo\s*(\d+)|round\s*(\d+)|matchweek\s*(\d+)|mw\s*(\d+)/i);
          if (matchweekMatch) {
            matchweek = parseInt(matchweekMatch[1] || matchweekMatch[2] || matchweekMatch[3] || matchweekMatch[4]) || 1;
          }
          
          // Method 2: Look in parent elements
          if (matchweek === 1) {
            var parent2 = element.parentElement;
            for (var k = 0; k < 5 && parent2; k++) {
              var parentText = parent2.textContent || '';
              var mwMatch = parentText.match(/kolo\s*(\d+)|round\s*(\d+)/i);
              if (mwMatch) {
                matchweek = parseInt(mwMatch[1] || mwMatch[2]) || 1;
                break;
              }
              parent2 = parent2.parentElement;
            }
          }

          // Validate team names
          if (!homeTeam || !awayTeam || homeTeam.length < 3 || awayTeam.length < 3) {
            continue;
          }

          // Clean team names
          homeTeam = homeTeam.trim().replace(/\s+/g, ' ');
          awayTeam = awayTeam.trim().replace(/\s+/g, ' ');

          // Create fixture ID
          var dateOnly = parsedDate.toISOString().split('T')[0];
          var fixtureId = homeTeam.toLowerCase().replace(/\s+/g, '-') + '-' + awayTeam.toLowerCase().replace(/\s+/g, '-') + '-' + dateOnly + '-' + matchweek;

          if (seenFixtureIds.has(fixtureId)) {
            continue;
          }
          seenFixtureIds.add(fixtureId);

          results.push({
            homeTeam: homeTeam,
            awayTeam: awayTeam,
            homeScore: homeScore,
            awayScore: awayScore,
            dateStr: parsedDate.toISOString(),
            matchweek: matchweek,
          });
        } catch (error) {
          // Skip errors
        }
      }

      return results;
    });

    // Process and format results
    const formattedResults: Fixture[] = [];
    const seenIds = new Set<string>();
    
    // Helper function to assign matchweek based on date if not found
    const assignMatchweekByDate = (date: Date, allResults: any[]): number => {
      // If we have results with matchweeks, use them to estimate
      const resultsWithMatchweek = allResults.filter(r => r.matchweek > 1);
      if (resultsWithMatchweek.length > 0) {
        // Find closest date with known matchweek
        const sorted = resultsWithMatchweek.sort((a, b) => 
          Math.abs(new Date(a.dateStr).getTime() - date.getTime()) - 
          Math.abs(new Date(b.dateStr).getTime() - date.getTime())
        );
        const closest = sorted[0];
        const closestDate = new Date(closest.dateStr);
        const daysDiff = Math.floor((date.getTime() - closestDate.getTime()) / (1000 * 60 * 60 * 24));
        const estimatedMatchweek = closest.matchweek + Math.floor(daysDiff / 7);
        return Math.max(1, Math.min(38, estimatedMatchweek));
      }
      
      // Fallback: estimate based on season start (August 17, 2025)
      const seasonStart = new Date(2025, 7, 17); // August 17, 2025
      const daysDiff = Math.floor((date.getTime() - seasonStart.getTime()) / (1000 * 60 * 60 * 24));
      const estimatedMatchweek = Math.max(1, Math.min(38, Math.floor(daysDiff / 7) + 1));
      return estimatedMatchweek;
    };

    for (const result of resultsData || []) {
      if (!result.homeTeam || !result.awayTeam) continue;
      
      const date = result.dateStr ? new Date(result.dateStr) : null;
      if (!date || isNaN(date.getTime())) continue;
      
      // Validate date is reasonable
      const year = date.getFullYear();
      if (year < 2024 || year > 2027) {
        console.warn(`[Rezultati] Skipping result with invalid date: ${result.homeTeam} vs ${result.awayTeam}, date: ${result.dateStr}`);
        continue;
      }
      
      // Assign matchweek if not found
      let matchweek = result.matchweek;
      if (matchweek === 1 || matchweek === undefined) {
        matchweek = assignMatchweekByDate(date, resultsData);
      }
      
      const dateOnly = date.toISOString().split('T')[0];
      const fixtureId = `${result.homeTeam.toLowerCase().replace(/\s+/g, '-')}-${result.awayTeam.toLowerCase().replace(/\s+/g, '-')}-${dateOnly}-${matchweek}`;
      
      if (seenIds.has(fixtureId)) continue;
      seenIds.add(fixtureId);

      formattedResults.push({
        id: fixtureId,
        date: date.toISOString(),
        homeTeam: result.homeTeam,
        awayTeam: result.awayTeam,
        homeScore: result.homeScore,
        awayScore: result.awayScore,
        matchweek: matchweek,
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
