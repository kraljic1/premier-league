import { Fixture } from "../types";
import { isDerby } from "../clubs";
import { scrapePage } from "./browser";

/**
 * Scrapes match results (finished matches) from Premier League website
 * Uses the same navigation approach as fixtures scraper but filters for finished matches only
 * URL: https://www.premierleague.com/en/matches?competition=8&season=2025&matchweek=12&month=11
 */
export async function scrapeResults(): Promise<Fixture[]> {
  const allResults: Fixture[] = [];
  const seenFixtureIds = new Set<string>();
  let page;
  
  try {
    // Start directly at matchweek 1 - more reliable
    const startUrl = `https://www.premierleague.com/en/matches?competition=8&season=2025&matchweek=1&month=11`;
    
    console.log("[Results] Opening Premier League matches page at matchweek 1...");
    page = await scrapePage(startUrl, undefined, 30000);
        
        // Wait for page to fully load
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Set viewport
    await page.setViewport({ width: 1920, height: 1080 });
    
    let currentMatchweek = await getCurrentMatchweek(page);
    console.log(`[Results] Starting at matchweek ${currentMatchweek}`);
    
    // If not at matchweek 1, navigate there directly
    if (currentMatchweek > 1) {
      console.log(`[Results] Not at matchweek 1 (current: ${currentMatchweek}), navigating...`);
      const targetUrl = `https://www.premierleague.com/en/matches?competition=8&season=2025&matchweek=1&month=11`;
      await page.goto(targetUrl, { waitUntil: 'networkidle2', timeout: 30000 });
      await new Promise(resolve => setTimeout(resolve, 2000));
      currentMatchweek = await getCurrentMatchweek(page);
      console.log(`[Results] Now at matchweek ${currentMatchweek}`);
    }
    
    // Now navigate forward through all matchweeks (1-38)
    console.log("[Results] Starting to scrape matchweeks 1-38 for finished matches...");
    const scrapedMatchweeks = new Set<number>();
    let consecutiveRedirects = 0;
    const maxConsecutiveRedirects = 3; // Stop after 3 consecutive redirects
    
    for (let targetMatchweek = 1; targetMatchweek <= 38; targetMatchweek++) {
      // Navigate directly to target matchweek URL
      // URL format: https://www.premierleague.com/en/matches?competition=8&season=2025&matchweek={N}&month=11
      const targetUrl = `https://www.premierleague.com/en/matches?competition=8&season=2025&matchweek=${targetMatchweek}&month=11`;
      console.log(`[Results] Navigating to matchweek ${targetMatchweek}...`);
      
      try {
        await page.goto(targetUrl, { waitUntil: 'networkidle2', timeout: 30000 });
        
        // Wait for page to fully load
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Verify we're on the correct matchweek by checking URL
        const actualUrl = page.url();
        const urlMatch = actualUrl.match(/matchweek=(\d+)/);
        const urlMatchweek = urlMatch ? parseInt(urlMatch[1]) : null;
        
        console.log(`[Results] Target: ${targetMatchweek}, URL shows: ${urlMatchweek}, Full URL: ${actualUrl}`);
        
        // If URL shows a different matchweek, the website redirected us
        // Only skip if redirected to a different matchweek (likely means that matchweek doesn't exist yet)
        if (urlMatchweek && urlMatchweek !== targetMatchweek) {
          console.warn(`[Results] Website redirected matchweek ${targetMatchweek} to matchweek ${urlMatchweek}. This matchweek may not be accessible yet. Skipping.`);
          consecutiveRedirects++;
          if (consecutiveRedirects >= maxConsecutiveRedirects) {
            console.log(`[Results] Stopping: ${consecutiveRedirects} consecutive redirects detected. Last accessible matchweek: ${targetMatchweek - consecutiveRedirects}`);
            break;
          }
          continue; // Skip this matchweek - don't scrape
        }
        
        // If URL doesn't show matchweek parameter, try to proceed anyway (might be a different URL format)
        if (!urlMatchweek) {
          console.warn(`[Results] Could not find matchweek in URL: ${actualUrl}. Proceeding anyway...`);
        }
        
        // Successfully navigated to target matchweek
        currentMatchweek = targetMatchweek;
        console.log(`[Results] ✓ Successfully navigated to matchweek ${targetMatchweek}`);
      } catch (error) {
        console.error(`[Results] Error navigating to matchweek ${targetMatchweek}:`, error);
        consecutiveRedirects++;
        if (consecutiveRedirects >= maxConsecutiveRedirects) {
          console.log(`[Results] Stopping due to navigation errors.`);
          break;
        }
        continue; // Skip this matchweek on error
      }
      
      // Skip if already scraped
      if (scrapedMatchweeks.has(targetMatchweek)) {
        continue;
      }
      
      // Wait a bit for content to load
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Extract results (finished matches only) from current matchweek
      console.log(`[Results] Scraping matchweek ${targetMatchweek} for finished matches...`);
      const results = await extractResultsFromPage(page, targetMatchweek);
      
      console.log(`[Results] Matchweek ${targetMatchweek}: Found ${results.length} finished matches`);
      
      // Validate: Premier League has 20 teams = max 10 matches per matchweek
      if (results.length > 10) {
        console.warn(`[Results] WARNING: Found ${results.length} matches for matchweek ${targetMatchweek}, but max should be 10. This might indicate matches from multiple matchweeks are being extracted.`);
        // Take only first 10 matches (most likely to be from current matchweek)
        results.splice(10);
        console.warn(`[Results] Limiting to first 10 matches for matchweek ${targetMatchweek}`);
      }
      
      // Add results to collection
      for (const result of results) {
        // Use date-only for ID (extract YYYY-MM-DD from ISO string)
        const dateOnly = result.date.split('T')[0];
        const fixtureId = `${result.homeTeam}-${result.awayTeam}-${dateOnly}-${result.matchweek}`;
        
        if (!seenFixtureIds.has(fixtureId)) {
          seenFixtureIds.add(fixtureId);
          allResults.push(result);
        }
      }
      
      scrapedMatchweeks.add(targetMatchweek);
      consecutiveRedirects = 0; // Reset redirect counter on successful scrape
      
      // Stop if we've reached matchweek 38
      if (targetMatchweek >= 38) {
        break;
      }
    }
    
    console.log(`[Results] Total results scraped: ${allResults.length} from ${scrapedMatchweeks.size} matchweeks`);
    
    return allResults.sort(
      (a, b) => {
        // Sort by matchweek first, then by date
        if (a.matchweek !== b.matchweek) {
          return a.matchweek - b.matchweek;
        }
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      }
    );
  } catch (error) {
    console.error("[Results] Error scraping results:", error);
    return [];
  } finally {
    if (page) {
      await page.close();
    }
  }
}

/**
 * Gets the current matchweek from the page
 */
async function getCurrentMatchweek(page: any): Promise<number> {
  try {
    const matchweek = await page.evaluate(() => {
      // Method 1: Try to find in URL (most reliable)
      const urlMatch = window.location.href.match(/matchweek=(\d+)/);
      if (urlMatch) {
        const mw = parseInt(urlMatch[1]);
        if (!isNaN(mw) && mw >= 1 && mw <= 38) {
          return mw;
        }
      }
      
      // Method 2: Look for matchweek in navigation/header area
      // Check the matchweek selector or header text
      const headerSelectors = [
        '[class*="match-list-header"]',
        '[class*="matchweek"]',
        '[class*="match-week"]',
        'h1', 'h2', 'h3'
      ];
      
      for (const selector of headerSelectors) {
        const elements = document.querySelectorAll(selector);
        for (const el of elements) {
          const text = el.textContent || '';
          const mwMatch = text.match(/matchweek\s*(\d+)|mw\s*(\d+)/i);
          if (mwMatch) {
            const mw = parseInt(mwMatch[1] || mwMatch[2]);
            if (!isNaN(mw) && mw >= 1 && mw <= 38) {
              return mw;
            }
          }
        }
      }
      
      // Method 3: Check page body text
      const bodyText = document.body.textContent || '';
      const bodyMatch = bodyText.match(/matchweek\s*(\d+)|mw\s*(\d+)/i);
      if (bodyMatch) {
        const mw = parseInt(bodyMatch[1] || bodyMatch[2]);
        if (!isNaN(mw) && mw >= 1 && mw <= 38) {
          return mw;
        }
      }
      
      return null;
    });
    
    return matchweek || 1;
  } catch (error) {
    console.error("[Results] Error getting current matchweek:", error);
    return 1;
  }
}

/**
 * Extracts finished matches (results) from the current page
 */
async function extractResultsFromPage(page: any, matchweek: number): Promise<Fixture[]> {
  try {
    const resultsData = await page.evaluate((mw: number) => {
            const results: any[] = [];
      
      // First, try to find the matchweek section/container
      // Look for elements that contain the matchweek number
      let matchweekContainer: Element | null = null;
      const containerSelectors = [
        `[class*="matchweek-${mw}"]`,
        `[class*="match-week-${mw}"]`,
        `[data-matchweek="${mw}"]`,
        `[data-matchweek="${mw}"]`,
        `[id*="matchweek-${mw}"]`,
        `[id*="match-week-${mw}"]`
      ];
      
      // Also check for headings that mention the matchweek
      const headings = document.querySelectorAll('h1, h2, h3, h4, [class*="heading"], [class*="title"]');
      for (const heading of headings) {
        const headingText = heading.textContent || '';
        if (headingText.match(new RegExp(`matchweek\\s*${mw}|mw\\s*${mw}`, 'i'))) {
          // Find the parent container that holds matches for this matchweek
          let parent = heading.parentElement;
          for (let i = 0; i < 10 && parent; i++) {
            const matches = parent.querySelectorAll('[class*="match"], [class*="fixture"]');
            if (matches.length > 0) {
              matchweekContainer = parent;
              break;
            }
            parent = parent.parentElement;
          }
          break;
        }
      }
      
      // Premier League uses specific structure - look for match list items
      const matchSelectors = [
        'li[class*="match"]',
        'div[class*="match-card"]',
        'article[class*="match"]',
        '[data-testid*="match"]',
        '[class*="match-list"] > *',
        '[class*="fixtures"] > *',
        '[class*="matches"] > *'
      ];
      
      let matchElements: Element[] = [];
      const searchRoot = matchweekContainer || document;
      
      for (const selector of matchSelectors) {
        try {
          const elements = Array.from(searchRoot.querySelectorAll(selector));
          const filtered = elements.filter(el => {
            const text = el.textContent || '';
            return /vs|v\.|[-–]\s*\d+|\d+\s*[-–]/.test(text) && text.length > 20;
          });
          if (filtered.length > 0) {
            matchElements = filtered;
            // Limit to max 10 matches (Premier League has 20 teams = 10 matches per matchweek)
            if (matchElements.length > 10) {
              matchElements = matchElements.slice(0, 10);
            }
            break;
          }
        } catch (e) {
          // Continue to next selector
        }
      }
      
      if (matchElements.length === 0) {
        const listItems = Array.from(document.querySelectorAll('li, div[role="listitem"], article'));
        matchElements = listItems.filter(el => {
          const text = el.textContent || '';
          return /[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*(?:\s+[A-Z][a-z]+)?\s+vs?\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*(?:\s+[A-Z][a-z]+)?/i.test(text) && 
                 text.length > 30 && text.length < 500;
        });
      }
      
      matchElements.forEach((element) => {
        try {
          const elementText = element.textContent || '';
          
          // Extract team names - try multiple patterns
                  let homeTeam = '';
                  let awayTeam = '';

          // Pattern 1: Look for team name elements with specific classes
          const teamSelectors = [
            '[class*="team--home"]',
            '[class*="team-home"]',
            '[class*="home-team"]',
            '[class*="team"][class*="home"]',
            '[data-testid*="home"]',
            '[class*="team"]:first-child'
          ];
          
          const awayTeamSelectors = [
            '[class*="team--away"]',
            '[class*="team-away"]',
            '[class*="away-team"]',
            '[class*="team"][class*="away"]',
            '[data-testid*="away"]',
            '[class*="team"]:last-child'
          ];
          
          let homeTeamEl: Element | null = null;
          let awayTeamEl: Element | null = null;
          
          for (const selector of teamSelectors) {
            homeTeamEl = element.querySelector(selector);
            if (homeTeamEl) break;
          }
          
          for (const selector of awayTeamSelectors) {
            awayTeamEl = element.querySelector(selector);
            if (awayTeamEl) break;
          }
          
          if (homeTeamEl && awayTeamEl) {
            // Try to find the team name element (prefer elements with "name" in class)
            const homeNameEl = homeTeamEl.querySelector('[class*="name"], [class*="team-name"]');
            const awayNameEl = awayTeamEl.querySelector('[class*="name"], [class*="team-name"]');
            
            // Get text - prefer name element, fallback to direct children text nodes
            let homeText = '';
            let awayText = '';
            
            if (homeNameEl) {
              homeText = homeNameEl.textContent || '';
            } else {
              // Get only direct text, not from nested elements
              const homeChildren = Array.from(homeTeamEl.childNodes);
              homeText = homeChildren
                .filter(node => node.nodeType === 3) // Text nodes only
                .map(node => node.textContent)
                .join(' ')
                .trim();
              // If no direct text, get first meaningful text element
              if (!homeText) {
                const firstTextEl = homeTeamEl.querySelector('span, div, p');
                homeText = firstTextEl?.textContent || homeTeamEl.textContent || '';
              }
            }
            
            if (awayNameEl) {
              awayText = awayNameEl.textContent || '';
                  } else {
              const awayChildren = Array.from(awayTeamEl.childNodes);
              awayText = awayChildren
                .filter(node => node.nodeType === 3)
                .map(node => node.textContent)
                .join(' ')
                .trim();
              if (!awayText) {
                const firstTextEl = awayTeamEl.querySelector('span, div, p');
                awayText = firstTextEl?.textContent || awayTeamEl.textContent || '';
              }
            }
            
            if (homeText && awayText) {
              // Clean team names - remove duplicates and extra whitespace
              homeTeam = homeText.split('\n')[0].split(/\s+/).join(' ').trim();
              awayTeam = awayText.split('\n')[0].split(/\s+/).join(' ').trim();
              
              // Remove duplicate words (e.g., "BurnleyBurnley" -> "Burnley")
              homeTeam = removeDuplicateWords(homeTeam);
              awayTeam = removeDuplicateWords(awayTeam);
            }
          }
          
          // Pattern 2: Extract from text using regex
          if (!homeTeam || !awayTeam) {
            const teamPattern = /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*(?:\s+(?:United|City|Albion|Wanderers|Rovers|Athletic|Hotspur))?)\s+vs?\.?\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*(?:\s+(?:United|City|Albion|Wanderers|Rovers|Athletic|Hotspur))?)/i;
            const vsMatch = elementText.match(teamPattern);
            if (vsMatch && vsMatch[1] && vsMatch[2]) {
              homeTeam = vsMatch[1].trim();
              awayTeam = vsMatch[2].trim();
            }
          }
          
          // Pattern 3: Look for team names in structured format
          if (!homeTeam || !awayTeam) {
            const textNodes = Array.from(element.querySelectorAll('*'))
              .map(el => el.textContent?.trim())
              .filter(text => text && text.length > 3 && text.length < 30 && /^[A-Z]/.test(text));
            
            for (let i = 0; i < textNodes.length - 1; i++) {
              const first = textNodes[i] || '';
              const second = textNodes[i + 1] || '';
              if (/^[A-Z][a-z]+/.test(first) && /^[A-Z][a-z]+/.test(second) && 
                  !first.match(/\d/) && !second.match(/\d/)) {
                homeTeam = first;
                awayTeam = second;
                break;
              }
            }
          }
          
          // Validate team names
          if (!homeTeam || !awayTeam || homeTeam === awayTeam || 
              homeTeam.length < 3 || awayTeam.length < 3 ||
              homeTeam.match(/^\d/) || awayTeam.match(/^\d/)) {
                    return;
                  }

          // Extract date/time
          let dateStr = '';
          const dateElement = element.querySelector('time[datetime], [datetime], [class*="date"], [class*="time"]');
          if (dateElement) {
            dateStr = dateElement.getAttribute('datetime') || dateElement.textContent?.trim() || '';
          }
          
          if (!dateStr) {
            let parent = element.parentElement;
            for (let i = 0; i < 5 && parent; i++) {
              const parentDate = parent.querySelector('time[datetime], [datetime]');
              if (parentDate) {
                dateStr = parentDate.getAttribute('datetime') || parentDate.textContent?.trim() || '';
                break;
              }
              parent = parent.parentElement;
            }
          }
          
          // Extract scores - results MUST have scores
                  let homeScore: number | null = null;
                  let awayScore: number | null = null;

          const scoreElement = element.querySelector('[class*="score"], [data-testid*="score"]');
          const scoreText = scoreElement?.textContent?.trim() || '';
          
          const scoreMatch = scoreText.match(/(\d+)\s*[-–]\s*(\d+)/) || elementText.match(/(\d+)\s*[-–]\s*(\d+)/);
                  if (scoreMatch) {
                    homeScore = parseInt(scoreMatch[1]);
                    awayScore = parseInt(scoreMatch[2]);
          }
          
          // Results must have scores and be finished (not live)
          if (homeScore === null || awayScore === null) {
            return; // Skip matches without scores
          }
          
          const lowerText = elementText.toLowerCase();
          const isLive = lowerText.includes('live') || scoreElement?.textContent?.toLowerCase().includes('live');

                  if (isLive) {
            return; // Skip live matches
          }
          
          // Check if finished
          const isFinished = lowerText.includes('ft') || lowerText.includes('full time') || 
                            lowerText.includes('finished') || 
                            element.querySelector('[class*="finished"], [class*="ft"]');
          
          // If it has scores and is not live, it's a result
          if (isFinished || (!isLive && homeScore !== null && awayScore !== null)) {
                  results.push({
                    homeTeam,
                    awayTeam,
              dateStr,
                    homeScore,
                    awayScore,
                    matchweek: mw,
                    status: "finished",
                  });
          }
        } catch (error) {
          // Skip this element if there's an error
          console.warn('[Results] Error processing match element:', error);
        }
      });
      
      return results;
          }, matchweek);

        // Process and format results
    const results: Fixture[] = [];
    for (const resultData of resultsData || []) {
          if (!resultData.homeTeam || !resultData.awayTeam || resultData.homeTeam === resultData.awayTeam) {
            continue;
          }
          
      // Results must have scores
      if (resultData.homeScore === null || resultData.awayScore === null) {
            continue;
          }
          
      // Parse date
          let date: Date;
          if (resultData.dateStr) {
            const parsedDate = parseDate(resultData.dateStr);
            if (parsedDate) {
              date = parsedDate;
            } else {
              date = new Date();
            }
          } else {
            date = new Date();
          }
          
      // Create unique ID using only date (YYYY-MM-DD), not full timestamp
      // This prevents duplicates when the same match is scraped at different times
      const dateOnly = date.toISOString().split('T')[0]; // Get just YYYY-MM-DD
      const fixtureId = `${resultData.homeTeam}-${resultData.awayTeam}-${dateOnly}-${resultData.matchweek}`;
          
      results.push({
            id: fixtureId,
            date: date.toISOString(),
            homeTeam: resultData.homeTeam,
            awayTeam: resultData.awayTeam,
            homeScore: resultData.homeScore,
            awayScore: resultData.awayScore,
            matchweek: resultData.matchweek,
            status: "finished",
            isDerby: isDerby(resultData.homeTeam, resultData.awayTeam),
          });
        }
        
    return results;
      } catch (error) {
    console.error(`[Results] Error extracting results from page:`, error);
    return [];
  }
}

/**
 * Removes duplicate consecutive words from team name
 * e.g., "BurnleyBurnley" -> "Burnley", "Brighton and Hove AlbionBrighton" -> "Brighton and Hove Albion"
 */
function removeDuplicateWords(text: string): string {
  if (!text) return text;
  
  const trimmed = text.trim();
  
  // First, handle cases where the entire string is duplicated (no space)
  // e.g., "BurnleyBurnley" -> "Burnley"
  const midPoint = Math.floor(trimmed.length / 2);
  if (trimmed.length > 0 && trimmed.length % 2 === 0) {
    const firstHalf = trimmed.substring(0, midPoint);
    const secondHalf = trimmed.substring(midPoint);
    if (firstHalf.toLowerCase() === secondHalf.toLowerCase()) {
      return firstHalf.trim();
    }
  }
  
  // Handle cases where a word is immediately followed by itself (no space)
  // e.g., "BurnleyBurnley" -> "Burnley"
  text = text.replace(/([A-Z][a-z]+)\1/gi, '$1');
  
  // Handle cases like "Brighton and Hove AlbionBrighton" or "Manchester CityMan City"
  // Check if text ends with a capitalized word/phrase that's contained in the beginning
  const words = text.trim().split(/\s+/);
  
  // Try to find if the end of the string is a duplicate/shortened version of the beginning
  // Look for patterns like "Full NameShort Name" or "Full Name Short Name"
  for (let i = 1; i < words.length; i++) {
    const firstPart = words.slice(0, i).join(' ');
    const remaining = words.slice(i).join(' ');
    
    // Check if remaining is exactly the same as first part
    if (firstPart.toLowerCase() === remaining.toLowerCase()) {
      return firstPart.trim();
    }
    
    // Check if remaining is a shortened version of first part
    // e.g., "Brighton and Hove Albion" contains "Brighton"
    const firstLower = firstPart.toLowerCase();
    const remainingLower = remaining.toLowerCase();
    
    // If remaining is contained in first part, remove it
    if (firstLower.includes(remainingLower) && remainingLower.length >= 3) {
      return firstPart.trim();
    }
    
    // Check for common team name patterns
    // e.g., "Manchester City" followed by "Man City" or "City"
    const commonPatterns = [
      { full: /manchester\s+city/i, short: /man\s+city|city/i },
      { full: /manchester\s+united/i, short: /man\s+utd|united/i },
      { full: /wolverhampton\s+wanderers/i, short: /wolves/i },
      { full: /tottenham\s+hotspur/i, short: /spurs|tottenham/i },
      { full: /brighton\s+and\s+hove\s+albion/i, short: /brighton/i },
      { full: /newcastle\s+united/i, short: /newcastle/i },
      { full: /west\s+ham\s+united/i, short: /west\s+ham/i },
      { full: /nottingham\s+forest/i, short: /nott['']?m\s+forest|forest/i },
    ];
    
    for (const pattern of commonPatterns) {
      if (pattern.full.test(firstPart) && pattern.short.test(remaining)) {
        return firstPart.trim();
      }
    }
  }
  
  // Handle cases where text has no spaces but contains duplicates
  // e.g., "BrightonBrighton" or "BrightonandHoveAlbionBrighton"
  const noSpaceMatch = trimmed.match(/^(.+?)([A-Z][a-z]+)$/);
  if (noSpaceMatch) {
    const [, firstPart, lastWord] = noSpaceMatch;
    const firstLower = firstPart.toLowerCase();
    const lastLower = lastWord.toLowerCase();
    
    // If last word is contained in first part, remove it
    if (firstLower.includes(lastLower) && lastLower.length >= 3) {
      return firstPart.trim();
    }
    
    // Check if first part ends with last word
    if (firstLower.endsWith(lastLower)) {
      return firstPart.trim();
    }
  }
  
  // Split into words for word-by-word deduplication
  const cleaned: string[] = [];
  
  for (let i = 0; i < words.length; i++) {
    const word = words[i].trim();
    if (!word) continue;
    
    // Check if this word is a duplicate of any previous word
    const isDuplicate = cleaned.some(prevWord => {
      const prevLower = prevWord.toLowerCase();
      const wordLower = word.toLowerCase();
      // Exact match
      if (prevLower === wordLower) return true;
      // One contains the other (keep longer)
      if (prevLower.includes(wordLower) || wordLower.includes(prevLower)) {
        // Replace shorter with longer
        if (word.length > prevWord.length) {
          const index = cleaned.indexOf(prevWord);
          if (index !== -1) cleaned[index] = word;
        }
        return true;
      }
      return false;
    });
    
    if (!isDuplicate) {
      cleaned.push(word);
    }
  }
  
  return cleaned.join(' ').trim();
}

/**
 * Parses date string into Date object
 */
function parseDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  
  try {
    // Try ISO date format first
    if (dateStr.includes("T") || dateStr.includes("-")) {
      const date = new Date(dateStr);
      if (!isNaN(date.getTime())) {
        return date;
      }
    }
    
    // Try "DD MMM" format
    const now = new Date();
    const parts = dateStr.trim().split(" ");
    if (parts.length >= 2) {
      const day = parseInt(parts[0]);
      const monthStr = parts[1];
      const monthMap: Record<string, number> = {
        Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
        Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11,
      };
      
      if (!isNaN(day) && monthMap[monthStr] !== undefined) {
        const date = new Date(now.getFullYear(), monthMap[monthStr], day);
        return date;
      }
    }
    
    // Try other common formats
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      return date;
    }
    
    return null;
  } catch {
    return null;
  }
}
