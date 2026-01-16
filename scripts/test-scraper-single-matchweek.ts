/**
 * Test script to scrape a single matchweek for debugging
 * Run with: npx tsx scripts/test-scraper-single-matchweek.ts [matchweek]
 * 
 * Example: npx tsx scripts/test-scraper-single-matchweek.ts 38
 */

import { scrapePage } from "../lib/scrapers/browser";
import { extractResultsFromPage } from "../lib/scrapers/sofascore-extraction";
import { getCurrentMatchweek, navigateToMatchweek } from "../lib/scrapers/sofascore-navigation";

async function testSingleMatchweek(matchweek: number = 38) {
  let page;
  
  try {
    console.log(`Testing single matchweek scraping for MW ${matchweek}...\n`);
    
    const baseUrl = `https://www.sofascore.com/tournament/football/england/premier-league/17`;
    page = await scrapePage(baseUrl, undefined, 30000);
    
    await new Promise(resolve => setTimeout(resolve, 5000));
    await page.setViewport({ width: 1920, height: 1080 });
    
    console.log("1. Checking current matchweek...");
    const currentMW = await getCurrentMatchweek(page);
    console.log(`   Current matchweek: ${currentMW}\n`);
    
    console.log(`2. Navigating to matchweek ${matchweek}...`);
    await navigateToMatchweek(page, matchweek);
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const newMW = await getCurrentMatchweek(page);
    console.log(`   Now at matchweek: ${newMW}\n`);
    
    if (newMW !== matchweek) {
      console.warn(`⚠️  Warning: Expected MW ${matchweek}, but got MW ${newMW}`);
      console.log("   Continuing anyway...\n");
    }
    
    console.log(`3. Extracting results from matchweek ${matchweek}...`);
    console.log("   Note: Only finished matches (with scores) will be extracted.");
    console.log("   If this is a current/future matchweek, there may be no finished matches.\n");
    const seasonYear = 2024; // Test with 2024 season
    const results = await extractResultsFromPage(page, matchweek, seasonYear);
    
    console.log(`\n=== RESULTS ===`);
    console.log(`Total matches found: ${results.length}\n`);
    
    if (results.length === 0) {
      console.log("❌ No matches found!");
      console.log("\nDebugging info:");
      
      // Check what's on the page
      const pageInfo = await page.evaluate(() => {
        const matchSelectors = [
          '[class*="match"]',
          '[class*="event"]',
          '[data-testid*="match"]',
          '[class*="fixture"]',
          'a[href*="/match/"]'
        ];
        
        const found = matchSelectors.map(selector => {
          const elements = document.querySelectorAll(selector);
          return {
            selector,
            count: elements.length,
            sample: elements.length > 0 ? {
              text: elements[0].textContent?.trim().substring(0, 100),
              className: elements[0].className
            } : null
          };
        });
        
        return {
          url: window.location.href,
          title: document.title,
          bodyText: document.body.textContent?.substring(0, 500),
          found
        };
      });
      
      console.log(`   URL: ${pageInfo.url}`);
      console.log(`   Title: ${pageInfo.title}`);
      console.log(`   Body text sample: ${pageInfo.bodyText?.substring(0, 200)}...`);
      console.log("\n   Selector results:");
      pageInfo.found.forEach(info => {
        console.log(`     ${info.selector}: ${info.count} elements`);
        if (info.sample) {
          console.log(`       Sample: ${info.sample.text}`);
          console.log(`       Class: ${info.sample.className}`);
        }
      });
      
      console.log("\n💡 Tip: Run 'npx tsx scripts/inspect-sofascore-page.ts' to inspect the page structure");
    } else {
      console.log("✅ Matches found:\n");
      results.forEach((result, i) => {
        console.log(`${i + 1}. ${result.homeTeam} vs ${result.awayTeam}`);
        console.log(`   Score: ${result.homeScore} - ${result.awayScore}`);
        console.log(`   Date: ${result.date}`);
        console.log(`   ID: ${result.id}`);
        console.log('');
      });
      
      // Validate data
      console.log("=== VALIDATION ===");
      const issues: string[] = [];
      
      if (results.length < 8) {
        issues.push(`Only ${results.length} matches found (expected ~10)`);
      }
      
      const teams = new Set<string>();
      results.forEach(r => {
        teams.add(r.homeTeam);
        teams.add(r.awayTeam);
      });
      
      if (teams.size < 10) {
        issues.push(`Only ${teams.size} unique teams found (expected 20)`);
      }
      
      const invalidScores = results.filter(r => 
        r.homeScore === null || r.awayScore === null || 
        r.homeScore < 0 || r.awayScore < 0
      );
      
      if (invalidScores.length > 0) {
        issues.push(`${invalidScores.length} matches have invalid scores`);
      }
      
      if (issues.length > 0) {
        console.log("⚠️  Issues found:");
        issues.forEach(issue => console.log(`   - ${issue}`));
      } else {
        console.log("✅ All validations passed!");
      }
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

// Get matchweek from command line args
const matchweekArg = process.argv[2];
const matchweek = matchweekArg ? parseInt(matchweekArg) : 38;

if (isNaN(matchweek) || matchweek < 1 || matchweek > 38) {
  console.error("Invalid matchweek. Please provide a number between 1 and 38.");
  console.log("Usage: npx tsx scripts/test-scraper-single-matchweek.ts [matchweek]");
  process.exit(1);
}

testSingleMatchweek(matchweek);
