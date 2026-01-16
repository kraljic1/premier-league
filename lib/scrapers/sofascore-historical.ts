import { Fixture } from "../types";
import { scrapePage } from "./browser";
import { navigateToSeason, navigateToMatchweek } from "./sofascore-navigation";
import { extractResultsFromPage } from "./sofascore-extraction";
import { getSeasonId } from "./sofascore-api-helper";

/**
 * Scrapes historical season results from SofaScore
 * URL format: https://www.sofascore.com/tournament/football/england/premier-league/17#id:61627
 * 
 * The scraper navigates through matchweeks from 38 down to 1 (backwards)
 * Results are stored chronologically (matchweek 1 first, matchweek 38 last)
 * 
 * @param seasonYear - The year of the season (e.g., 2024 for 2024/2025 season)
 * @returns Array of fixtures with results for that season
 */
export async function scrapeHistoricalSeason(seasonYear: number): Promise<Fixture[]> {
  const allResults: Fixture[] = [];
  const seenFixtureIds = new Set<string>();
  let page;
  
  try {
    // Try to get season ID from API to construct correct URL
    console.log(`[SofaScore Historical] Getting season ID for ${seasonYear}/${seasonYear + 1}...`);
    const seasonId = await getSeasonId(seasonYear);
    
    // Construct URL - try with season ID if available
    let baseUrl = `https://www.sofascore.com/tournament/football/england/premier-league/17`;
    if (seasonId) {
      baseUrl = `https://www.sofascore.com/tournament/football/england/premier-league/17#id:${seasonId}`;
      console.log(`[SofaScore Historical] Using season ID ${seasonId} in URL`);
    } else {
      console.log(`[SofaScore Historical] Season ID not found, using default URL`);
    }
    
    console.log(`[SofaScore Historical] Starting scrape for season ${seasonYear}/${seasonYear + 1}...`);
    page = await scrapePage(baseUrl, undefined, 30000);
    
    await new Promise(resolve => setTimeout(resolve, 5000)); // Longer wait for page load
    await page.setViewport({ width: 1920, height: 1080 });
    
    // Dismiss cookie/privacy dialogs more aggressively
    try {
      // Try multiple selectors for cookie/privacy accept buttons
      const cookieSelectors = [
        'button:has-text("Accept")',
        'button:has-text("I agree")',
        '[id*="accept"]',
        '[class*="accept"]',
        'button[aria-label*="accept" i]',
        '#onetrust-accept-btn-handler',
        '.onetrust-accept-btn-handler'
      ];
      
      for (const selector of cookieSelectors) {
        try {
          const button = await page.$(selector);
          if (button) {
            await button.click();
            await new Promise(resolve => setTimeout(resolve, 1000));
            break;
          }
        } catch (e) {
          // Continue to next selector
        }
      }
      
      // Also try to close any modals/overlays
      await page.evaluate(() => {
        // Close any modals
        const modals = document.querySelectorAll('[role="dialog"], [class*="modal"], [class*="overlay"]');
        modals.forEach(modal => {
          const closeBtn = modal.querySelector('button[aria-label*="close" i], button[aria-label*="Close"], [class*="close"]');
          if (closeBtn) {
            (closeBtn as HTMLElement).click();
          }
        });
      });
    } catch (e) {
      // Ignore errors - dialogs might not be present
    }
    
    // Try to navigate to season (may not work if URL already has season ID)
    if (!seasonId) {
      await navigateToSeason(page, seasonYear);
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Verify we're on the correct season by checking the current season selector
      const currentSeason = await page.evaluate(() => {
        const seasonButton = document.querySelector('button.dropdown__button');
        if (seasonButton) {
          return (seasonButton.textContent || '').trim();
        }
        return null;
      });
      console.log(`[SofaScore Historical] Current season selector shows: "${currentSeason}"`);
      
      const expectedShort = `${seasonYear.toString().slice(-2)}/${(seasonYear + 1).toString().slice(-2)}`;
      if (currentSeason && currentSeason !== expectedShort && !currentSeason.includes(seasonYear.toString())) {
        console.warn(`[SofaScore Historical] ⚠️  Warning: Season selector shows "${currentSeason}" but expected "${expectedShort}". Season navigation may have failed.`);
      }
    }
    
    console.log("[SofaScore Historical] Starting to scrape matchweeks backwards from 38 to 1...");
    console.log("[SofaScore Historical] ⚠️  Using slow scraping mode (3-5s delays) to avoid rate limiting...");
    
    for (let targetMatchweek = 38; targetMatchweek >= 1; targetMatchweek--) {
      console.log(`[SofaScore Historical] Scraping matchweek ${targetMatchweek}...`);
      
      try {
        await navigateToMatchweek(page, targetMatchweek);
        
        // Longer wait after navigation to let page fully load
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        const results = await extractResultsFromPage(page, targetMatchweek, seasonYear);
        console.log(`[SofaScore Historical] Matchweek ${targetMatchweek}: Found ${results.length} matches`);
        
        for (const result of results) {
          if (!seenFixtureIds.has(result.id)) {
            seenFixtureIds.add(result.id);
            allResults.push(result);
          }
        }
        
        // Random delay between 3-5 seconds to avoid rate limiting
        // Add extra delay if we found matches (more processing)
        const baseDelay = results.length > 0 ? 4000 : 3000;
        const randomDelay = Math.floor(Math.random() * 2000); // 0-2 seconds random
        const totalDelay = baseDelay + randomDelay;
        
        if (targetMatchweek > 1) {
          console.log(`[SofaScore Historical] ⏳ Waiting ${(totalDelay / 1000).toFixed(1)}s before next matchweek...`);
          await new Promise(resolve => setTimeout(resolve, totalDelay));
        }
      } catch (error: any) {
        console.error(`[SofaScore Historical] Error scraping matchweek ${targetMatchweek}:`, error.message);
        
        // If rate limited, wait longer before continuing
        if (error.message?.includes('rate limit') || error.message?.includes('403') || error.message?.includes('429')) {
          console.warn(`[SofaScore Historical] ⚠️  Rate limit detected. Waiting 30 seconds before continuing...`);
          await new Promise(resolve => setTimeout(resolve, 30000));
        }
        
        continue;
      }
    }
    
    const sortedResults = allResults.sort((a, b) => {
      if (a.matchweek !== b.matchweek) {
        return a.matchweek - b.matchweek;
      }
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });
    
    console.log(`[SofaScore Historical] Total results scraped: ${sortedResults.length} from season ${seasonYear}/${seasonYear + 1}`);
    
    return sortedResults;
  } catch (error) {
    console.error("[SofaScore Historical] Error scraping historical season:", error);
    return [];
  } finally {
    if (page) {
      await page.close();
    }
  }
}
