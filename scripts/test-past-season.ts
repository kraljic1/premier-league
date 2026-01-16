/**
 * Test script to scrape a past season with finished matches
 * Run with: npx tsx scripts/test-past-season.ts [seasonYear] [matchweek]
 * 
 * Example: npx tsx scripts/test-past-season.ts 2023 1
 */

import { scrapePage } from "../lib/scrapers/browser";
import { extractResultsFromPage } from "../lib/scrapers/sofascore-extraction";
import { navigateToSeason, navigateToMatchweek, getCurrentMatchweek } from "../lib/scrapers/sofascore-navigation";
import { getSeasonId } from "../lib/scrapers/sofascore-api-helper";

async function testPastSeason(seasonYear: number = 2023, matchweek: number = 1) {
  let page;
  
  try {
    console.log(`Testing past season scraping for ${seasonYear}/${seasonYear + 1}, Matchweek ${matchweek}...\n`);
    
    // Try to get season ID from API to construct correct URL
    console.log(`Getting season ID for ${seasonYear}/${seasonYear + 1}...`);
    const seasonId = await getSeasonId(seasonYear);
    
    // Construct URL - try with season ID if available
    let baseUrl = `https://www.sofascore.com/tournament/football/england/premier-league/17`;
    if (seasonId) {
      baseUrl = `https://www.sofascore.com/tournament/football/england/premier-league/17#id:${seasonId}`;
      console.log(`✓ Using season ID ${seasonId} in URL\n`);
    } else {
      console.log(`⚠️  Season ID not found, using default URL (may not navigate to correct season)\n`);
    }
    
    page = await scrapePage(baseUrl, undefined, 30000);
    
    await new Promise(resolve => setTimeout(resolve, 5000));
    await page.setViewport({ width: 1920, height: 1080 });
    
    // Handle cookie consent more aggressively
    try {
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
    } catch (e) {
      // Ignore
    }
    
    await new Promise(resolve => setTimeout(resolve, 3000)); // Wait for page to fully load
    
    // Only try to navigate to season if we didn't get a season ID from API
    if (!seasonId) {
      console.log("1. Navigating to season (fallback method)...");
      await navigateToSeason(page, seasonYear);
      await new Promise(resolve => setTimeout(resolve, 3000));
    } else {
      console.log("1. Using season ID from URL, skipping season navigation...");
    }
    
    console.log("2. Checking current matchweek...");
    const currentMW = await getCurrentMatchweek(page);
    console.log(`   Current matchweek: ${currentMW}\n`);
    
    console.log(`3. Navigating to matchweek ${matchweek}...`);
    await navigateToMatchweek(page, matchweek);
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const newMW = await getCurrentMatchweek(page);
    console.log(`   Now at matchweek: ${newMW}\n`);
    
    if (newMW !== matchweek) {
      console.warn(`⚠️  Warning: Expected MW ${matchweek}, but got MW ${newMW}`);
      console.log("   Continuing anyway...\n");
    }
    
    console.log(`4. Extracting results from matchweek ${matchweek}...`);
    
    // Scroll to top and wait a bit for matches to load
    await page.evaluate(() => window.scrollTo(0, 0));
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Scroll down to trigger lazy loading
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Debug: Check what match elements are on the page
    const debugInfo = await page.evaluate(() => {
      const matchLinks = Array.from(document.querySelectorAll('a[href*="/match/"]'));
      const eventLinks = Array.from(document.querySelectorAll('a[class*="event"]'));
      return {
        matchLinks: matchLinks.length,
        eventLinks: eventLinks.length,
        sampleMatchText: matchLinks.slice(0, 3).map(el => (el.textContent || '').substring(0, 100))
      };
    });
    console.log(`   Debug: Found ${debugInfo.matchLinks} match links, ${debugInfo.eventLinks} event links`);
    if (debugInfo.sampleMatchText.length > 0) {
      console.log(`   Sample match text: "${debugInfo.sampleMatchText[0]}"`);
    }
    
    const results = await extractResultsFromPage(page, matchweek, seasonYear);
    
    console.log(`\n=== RESULTS ===`);
    console.log(`Total matches found: ${results.length}\n`);
    
    if (results.length === 0) {
      console.log("❌ No matches found!");
      console.log("\nDebugging info:");
      console.log(`- Season: ${seasonYear}/${seasonYear + 1}`);
      console.log(`- Matchweek: ${matchweek}`);
      console.log(`- Season ID used: ${seasonId || 'none'}`);
      console.log("\nPossible reasons:");
      console.log("1. This matchweek hasn't been played yet");
      console.log("2. Matches don't have scores (not finished)");
      console.log("3. Selectors need updating");
      console.log("4. Need to navigate to a different season");
      console.log("5. Page structure changed - run inspect script");
    } else {
      console.log("✅ Matches found:\n");
      results.forEach((result, i) => {
        console.log(`${i + 1}. ${result.homeTeam} vs ${result.awayTeam}`);
        console.log(`   Score: ${result.homeScore} - ${result.awayScore}`);
        console.log(`   Date: ${result.date}`);
        console.log(`   ID: ${result.id}`);
        console.log('');
      });
    }
    
  } catch (error: any) {
    console.error("\n❌ Error:", error);
    console.error("Stack:", error.stack);
  } finally {
    if (page) {
      await page.close();
    }
  }
}

// Get args from command line
const seasonYearArg = process.argv[2];
const matchweekArg = process.argv[3];

const seasonYear = seasonYearArg ? parseInt(seasonYearArg) : 2023;
const matchweek = matchweekArg ? parseInt(matchweekArg) : 1;

if (isNaN(seasonYear) || seasonYear < 2015 || seasonYear > new Date().getFullYear()) {
  console.error("Invalid season year. Please provide a year between 2015 and current year.");
  console.log("Usage: npx tsx scripts/test-past-season.ts [seasonYear] [matchweek]");
  process.exit(1);
}

if (isNaN(matchweek) || matchweek < 1 || matchweek > 38) {
  console.error("Invalid matchweek. Please provide a number between 1 and 38.");
  console.log("Usage: npx tsx scripts/test-past-season.ts [seasonYear] [matchweek]");
  process.exit(1);
}

testPastSeason(seasonYear, matchweek);
