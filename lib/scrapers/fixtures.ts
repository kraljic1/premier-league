import { Fixture } from "../types";
import { isDerby } from "../clubs";
import { scrapePage } from "./browser";

/**
 * Scrapes fixtures and results from Premier League website by navigating through matchweeks
 * Uses the navigation buttons to iterate through all matchweeks (1-38)
 * URL: https://www.premierleague.com/en/matches?competition=8&season=2025&matchweek=12&month=11
 */
export async function scrapeFixtures(): Promise<Fixture[]> {
  const allFixtures: Fixture[] = [];
  const seenFixtureIds = new Set<string>();
  let page;
  
  try {
    // Start directly at matchweek 1 - more reliable than navigating backwards
    const startUrl = `https://www.premierleague.com/en/matches?competition=8&season=2025&matchweek=1&month=11`;
    
    console.log("Opening Premier League matches page at matchweek 1...");
    page = await scrapePage(startUrl, undefined, 30000);
    
    // Wait for page to fully load
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Set viewport to ensure buttons are visible
    await page.setViewport({ width: 1920, height: 1080 });
    
    let currentMatchweek = await getCurrentMatchweek(page);
    console.log(`Starting at matchweek ${currentMatchweek}`);
    
    // If we're not at matchweek 1, try to navigate there
    if (currentMatchweek > 1) {
      console.log(`Not at matchweek 1 (current: ${currentMatchweek}), navigating...`);
      const targetUrl = `https://www.premierleague.com/en/matches?competition=8&season=2025&matchweek=1&month=11`;
      await page.goto(targetUrl, { waitUntil: 'networkidle2', timeout: 30000 });
      await new Promise(resolve => setTimeout(resolve, 2000));
      currentMatchweek = await getCurrentMatchweek(page);
      console.log(`Now at matchweek ${currentMatchweek}`);
    }
    
    // Old navigation code removed - we start at matchweek 1 directly
    // If we still need to navigate backwards, use this:
    let attempts = 0;
    const maxAttempts = 10; // Reduced attempts since we start at MW1
    
    while (currentMatchweek > 1 && attempts < maxAttempts) {
      attempts++;
      
      // Scroll to top to ensure buttons are visible
      await page.evaluate(() => window.scrollTo(0, 0));
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const prevButton = await page.$('button[aria-label="Previous Matchweek"]');
      if (!prevButton) {
        console.warn(`Could not find Previous Matchweek button at matchweek ${currentMatchweek}`);
        break;
      }
      
      // Check if button is enabled/visible
      const isEnabled = await page.evaluate((btn) => {
        return !btn.disabled && btn.offsetParent !== null;
      }, prevButton);
      
      if (!isEnabled) {
        console.warn(`Previous button is disabled or not visible at matchweek ${currentMatchweek}`);
        break;
      }
      
      // Get current matchweek and content before click
      const beforeMatchweek = currentMatchweek;
      const beforeContent = await page.evaluate(() => {
        const matchList = document.querySelector('[class*="match-list"], [class*="matches"], [class*="fixture"]');
        return matchList?.textContent?.substring(0, 300) || document.body.textContent?.substring(0, 300) || '';
      });
      
      // Try JavaScript click instead of Puppeteer click
      await page.evaluate((btn) => {
        btn.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, prevButton);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Use JavaScript click event
      await page.evaluate((btn) => {
        btn.click();
      }, prevButton);
      
      // Wait for navigation/loading
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Wait for content to update - check URL first
      let contentChanged = false;
      for (let i = 0; i < 15; i++) {
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Check if URL changed
        const urlChanged = await page.evaluate(() => {
          return window.location.href.includes('matchweek=');
        });
        
        // Check content
        const afterContent = await page.evaluate(() => {
          const matchList = document.querySelector('[class*="match-list"], [class*="matches"], [class*="fixture"]');
          return matchList?.textContent?.substring(0, 300) || document.body.textContent?.substring(0, 300) || '';
        });
        
        if (afterContent !== beforeContent && afterContent.length > 0) {
          contentChanged = true;
          break;
        }
      }
      
      const newMatchweek = await getCurrentMatchweek(page);
      
      if (newMatchweek < beforeMatchweek) {
        currentMatchweek = newMatchweek;
        console.log(`Navigated to matchweek ${currentMatchweek}`);
        attempts = 0; // Reset attempts on successful navigation
      } else if (!contentChanged) {
        console.warn(`Navigation failed: content unchanged. Current: ${currentMatchweek}, Before: ${beforeMatchweek}`);
        if (attempts >= 3) {
          console.warn(`Stopping navigation after ${attempts} failed attempts`);
          break;
        }
      }
    }
    
    // Now navigate forward through all matchweeks (1-38)
    console.log("Starting to scrape matchweeks 1-38...");
    const scrapedMatchweeks = new Set<number>();
    let consecutiveRedirects = 0;
    const maxConsecutiveRedirects = 3; // Stop after 3 consecutive redirects
    
    for (let targetMatchweek = 1; targetMatchweek <= 38; targetMatchweek++) {
      // Navigate directly to target matchweek URL
      // URL format: https://www.premierleague.com/en/matches?competition=8&season=2025&matchweek={N}&month=11
      const targetUrl = `https://www.premierleague.com/en/matches?competition=8&season=2025&matchweek=${targetMatchweek}&month=11`;
      console.log(`Navigating to matchweek ${targetMatchweek}...`);
      
      try {
        await page.goto(targetUrl, { waitUntil: 'networkidle2', timeout: 30000 });
        
        // Wait for page to fully load
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Verify we're on the correct matchweek by checking URL
        const actualUrl = page.url();
        const urlMatch = actualUrl.match(/matchweek=(\d+)/);
        const urlMatchweek = urlMatch && urlMatch[1] ? parseInt(urlMatch[1]) : null;
        
        console.log(`Target: ${targetMatchweek}, URL shows: ${urlMatchweek}, Full URL: ${actualUrl}`);
        
        // If URL shows a different matchweek, the website redirected us
        // Only skip if redirected to a different matchweek (likely means that matchweek doesn't exist yet)
        if (urlMatchweek && urlMatchweek !== targetMatchweek) {
          console.warn(`Website redirected matchweek ${targetMatchweek} to matchweek ${urlMatchweek}. This matchweek may not be accessible yet. Skipping.`);
          consecutiveRedirects++;
          if (consecutiveRedirects >= maxConsecutiveRedirects) {
            console.log(`Stopping: ${consecutiveRedirects} consecutive redirects detected. Last accessible matchweek: ${targetMatchweek - consecutiveRedirects}`);
            break;
          }
          continue; // Skip this matchweek - don't scrape
        }
        
        // If URL doesn't show matchweek parameter, try to proceed anyway (might be a different URL format)
        if (!urlMatchweek) {
          console.warn(`Could not find matchweek in URL: ${actualUrl}. Proceeding anyway...`);
        }
        
        // Successfully navigated to target matchweek
        currentMatchweek = targetMatchweek;
        console.log(`✓ Successfully navigated to matchweek ${targetMatchweek}`);
      } catch (error) {
        console.error(`Error navigating to matchweek ${targetMatchweek}:`, error);
        consecutiveRedirects++;
        if (consecutiveRedirects >= maxConsecutiveRedirects) {
          console.log(`Stopping due to navigation errors.`);
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
      
      // Extract fixtures from current matchweek
      console.log(`Scraping matchweek ${targetMatchweek}...`);
      const fixtures = await extractFixturesFromPage(page, targetMatchweek);
      
      console.log(`Matchweek ${targetMatchweek}: Found ${fixtures.length} fixtures`);
      
      // Validate: Premier League has 20 teams = max 10 matches per matchweek
      if (fixtures.length > 10) {
        console.warn(`WARNING: Found ${fixtures.length} fixtures for matchweek ${targetMatchweek}, but max should be 10. This might indicate fixtures from multiple matchweeks are being extracted.`);
        // Take only first 10 fixtures (most likely to be from current matchweek)
        fixtures.splice(10);
        console.warn(`Limiting to first 10 fixtures for matchweek ${targetMatchweek}`);
      }
      
      // Add fixtures to collection
      for (const fixture of fixtures) {
        // Use date-only for ID (without matchweek to ensure fixtures and results match)
        const dateOnly = fixture.date.split('T')[0];
        const fixtureId = `${fixture.homeTeam}-${fixture.awayTeam}-${dateOnly}`;
        
        if (!seenFixtureIds.has(fixtureId)) {
          seenFixtureIds.add(fixtureId);
          allFixtures.push(fixture);
        }
      }
      
      scrapedMatchweeks.add(targetMatchweek);
      consecutiveRedirects = 0; // Reset redirect counter on successful scrape
      
      // Stop if we've reached matchweek 38
      if (targetMatchweek >= 38) {
        break;
      }
    }
    
    console.log(`Total fixtures scraped: ${allFixtures.length} from ${scrapedMatchweeks.size} matchweeks`);
    
    return allFixtures.sort(
      (a, b) => {
        // Sort by matchweek first, then by date
        if (a.matchweek !== b.matchweek) {
          return a.matchweek - b.matchweek;
        }
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      }
    );
  } catch (error) {
    console.error("Error scraping fixtures:", error);
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
      if (urlMatch && urlMatch[1]) {
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
            const mwValue = mwMatch[1] || mwMatch[2];
            if (mwValue) {
              const mw = parseInt(mwValue);
              if (!isNaN(mw) && mw >= 1 && mw <= 38) {
                return mw;
              }
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
    console.error("Error getting current matchweek:", error);
    return 1;
  }
}

/**
 * Extracts fixtures from the current page
 */
async function extractFixturesFromPage(page: any, matchweek: number): Promise<Fixture[]> {
  try {
    const fixturesData = await page.evaluate((mw: number) => {
      const fixtures: any[] = [];
      const debug: string[] = [];
      
      // First, try to find the matchweek section/container
      let matchweekContainer: Element | null = null;
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
      // Try multiple specific selectors that are more likely to be actual match cards
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
          // Filter to only elements that likely contain match data
          const filtered = elements.filter(el => {
            const text = el.textContent || '';
            // Must contain team-like text or score pattern
            return /vs|v\.|[-–]\s*\d+|\d+\s*[-–]/.test(text) && text.length > 20;
          });
          if (filtered.length > 0) {
            matchElements = filtered;
            // Limit to max 10 matches (Premier League has 20 teams = 10 matches per matchweek)
            if (matchElements.length > 10) {
              matchElements = matchElements.slice(0, 10);
              debug.push(`Limited to 10 matches (found ${filtered.length} total)`);
            }
            debug.push(`Found ${matchElements.length} matches using selector: ${selector}`);
            break;
          }
        } catch (e) {
          // Continue to next selector
        }
      }
      
      // If still no matches, try finding by team names pattern in list items
      if (matchElements.length === 0) {
        const listItems = Array.from(document.querySelectorAll('li, div[role="listitem"], article'));
        matchElements = listItems.filter(el => {
          const text = el.textContent || '';
          // Must have team pattern and reasonable length
          return /[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*(?:\s+[A-Z][a-z]+)?\s+vs?\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*(?:\s+[A-Z][a-z]+)?/i.test(text) && 
                 text.length > 30 && text.length < 500;
        });
        debug.push(`Found ${matchElements.length} matches using fallback method`);
      }
      
      debug.push(`Total match elements found: ${matchElements.length}`);
      
      matchElements.forEach((element, index) => {
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
          
          // Try to find team elements
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
          
          // Extract from team elements
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
          
          // Pattern 2: Extract from text using regex (fallback)
          if (!homeTeam || !awayTeam) {
            // More flexible regex for team names
            const teamPattern = /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*(?:\s+(?:United|City|Albion|Wanderers|Rovers|Athletic|Hotspur))?)\s+vs?\.?\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*(?:\s+(?:United|City|Albion|Wanderers|Rovers|Athletic|Hotspur))?)/i;
            const vsMatch = elementText.match(teamPattern);
            if (vsMatch && vsMatch[1] && vsMatch[2]) {
              homeTeam = vsMatch[1].trim();
              awayTeam = vsMatch[2].trim();
            }
          }
          
          // Pattern 3: Look for team names in structured format (home team, then away team)
          if (!homeTeam || !awayTeam) {
            // Try to find all text nodes that look like team names
            const textNodes = Array.from(element.querySelectorAll('*'))
              .map(el => el.textContent?.trim())
              .filter(text => text && text.length > 3 && text.length < 30 && /^[A-Z]/.test(text));
            
            // Look for two consecutive team-like names
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
            if (index < 5) {
              debug.push(`Card ${index}: Invalid teams - home: "${homeTeam}", away: "${awayTeam}", text preview: ${elementText.substring(0, 100)}`);
            }
            return;
          }
          
          // Extract date/time
          let dateStr = '';
          const dateElement = element.querySelector('time[datetime], [datetime], [class*="date"], [class*="time"]');
          if (dateElement) {
            dateStr = dateElement.getAttribute('datetime') || dateElement.textContent?.trim() || '';
          }
          
          // If no date element, try to find in parent containers
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
          
          // Extract scores
          let homeScore: number | null = null;
          let awayScore: number | null = null;
          let status: "scheduled" | "live" | "finished" = "scheduled";
          
          // Look for score element
          const scoreElement = element.querySelector('[class*="score"], [data-testid*="score"]');
          const scoreText = scoreElement?.textContent?.trim() || '';
          
          // Check for score pattern "X - Y" or "X-Y"
          const scoreMatch = scoreText.match(/(\d+)\s*[-–]\s*(\d+)/) || elementText.match(/(\d+)\s*[-–]\s*(\d+)/);
          if (scoreMatch) {
            homeScore = parseInt(scoreMatch[1]);
            awayScore = parseInt(scoreMatch[2]);
          }
          
          // Determine status
          const lowerText = elementText.toLowerCase();
          const isLive = lowerText.includes('live') || scoreElement?.textContent?.toLowerCase().includes('live');
          const isFinished = lowerText.includes('ft') || lowerText.includes('full time') || 
                            lowerText.includes('finished') || 
                            element.querySelector('[class*="finished"], [class*="ft"]');
          
          // Check for time pattern (scheduled match)
          const hasTime = /\d{1,2}:\d{2}/.test(elementText);
          
          if (isLive) {
            status = "live";
          } else if (isFinished || (homeScore !== null && awayScore !== null && !isLive && !hasTime)) {
            status = "finished";
          } else if (hasTime && homeScore === null && awayScore === null) {
            status = "scheduled";
          } else if (homeScore !== null && awayScore !== null) {
            // Has score but unclear status - assume finished if not live
            status = "finished";
          }
          
          fixtures.push({
            homeTeam,
            awayTeam,
            dateStr,
            homeScore,
            awayScore,
            matchweek: mw,
            status,
          });
          
          if (index < 3) {
            debug.push(`Card ${index}: Extracted ${homeTeam} vs ${awayTeam}, score: ${homeScore || 'N/A'}-${awayScore || 'N/A'}, status: ${status}`);
          }
        } catch (error) {
          // Skip this element if there's an error
          if (index < 5) {
            debug.push(`Card ${index}: Error processing - ${error}`);
          }
        }
      });
      
      if (fixtures.length > 0) {
        debug.push(`Successfully extracted ${fixtures.length} fixtures`);
        debug.push(`Sample: ${fixtures[0].homeTeam} vs ${fixtures[0].awayTeam}`);
      } else {
        debug.push(`No fixtures extracted. Sample element text: ${matchElements[0]?.textContent?.substring(0, 200)}`);
      }
      
      return { fixtures, debug };
    }, matchweek);
    
    // Extract fixtures and debug info
    const extractedData = fixturesData as { fixtures: any[], debug?: string[] };
    const actualFixtures = extractedData.fixtures || fixturesData || [];
    
    if (extractedData.debug) {
      console.log(`[Matchweek ${matchweek}] Debug:`, extractedData.debug.join('\n'));
    }
    
    // Process and format fixtures
    const fixtures: Fixture[] = [];
    const fixturesToProcess = Array.isArray(actualFixtures) ? actualFixtures : [];
    
    for (const fixtureData of fixturesToProcess) {
      if (!fixtureData.homeTeam || !fixtureData.awayTeam || fixtureData.homeTeam === fixtureData.awayTeam) {
        continue;
      }
      
      // Parse date
      let date: Date;
      if (fixtureData.dateStr) {
        const parsedDate = parseDate(fixtureData.dateStr);
        if (parsedDate) {
          date = parsedDate;
        } else {
          date = new Date();
        }
      } else {
        date = new Date();
      }
      
      // Improve status detection based on date
      let finalStatus = fixtureData.status;
      const now = new Date();
      const matchDate = new Date(date);
      const isPastMatch = matchDate < now;
      
      if (fixtureData.homeScore !== null && fixtureData.awayScore !== null && isPastMatch) {
        finalStatus = "finished";
      } else if (isPastMatch && fixtureData.status === "scheduled") {
        const hoursSinceMatch = (now.getTime() - matchDate.getTime()) / (1000 * 60 * 60);
        if (hoursSinceMatch > 3) {
          finalStatus = "finished";
        }
      }
      
      // Create unique ID using only date (YYYY-MM-DD), not full timestamp
      // Without matchweek to ensure fixtures and results match when status changes
      const dateOnly = date.toISOString().split('T')[0]; // Get just YYYY-MM-DD
      const fixtureId = `${fixtureData.homeTeam}-${fixtureData.awayTeam}-${dateOnly}`;
      
      fixtures.push({
        id: fixtureId,
        date: date.toISOString(),
        homeTeam: fixtureData.homeTeam,
        awayTeam: fixtureData.awayTeam,
        homeScore: fixtureData.homeScore,
        awayScore: fixtureData.awayScore,
        matchweek: fixtureData.matchweek,
        status: finalStatus,
        isDerby: isDerby(fixtureData.homeTeam, fixtureData.awayTeam),
      });
    }
    
    return fixtures;
  } catch (error) {
    console.error(`Error extracting fixtures from page:`, error);
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
