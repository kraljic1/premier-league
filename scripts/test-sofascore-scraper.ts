/**
 * Test script for SofaScore historical scraper
 * Run with: npx tsx scripts/test-sofascore-scraper.ts
 */

import { scrapeHistoricalSeason } from "../lib/scrapers/sofascore-historical";

async function main() {
  console.log("Testing SofaScore Historical Scraper...");
  console.log("This will scrape a test season to verify the scraper works.\n");

  // Test with a recent season (2023/2024)
  const testSeasonYear = 2023;

  try {
    console.log(`Starting scrape for season ${testSeasonYear}/${testSeasonYear + 1}...`);
    console.log("Note: This may take several minutes due to rate limiting delays.\n");

    const results = await scrapeHistoricalSeason(testSeasonYear);

    console.log("\n=== Scrape Results ===");
    console.log(`Total fixtures scraped: ${results.length}`);
    
    if (results.length > 0) {
      console.log("\nFirst 5 fixtures:");
      results.slice(0, 5).forEach((fixture, index) => {
        console.log(`${index + 1}. ${fixture.homeTeam} vs ${fixture.awayTeam} - ${fixture.homeScore}:${fixture.awayScore} (MW ${fixture.matchweek})`);
      });

      console.log("\nLast 5 fixtures:");
      results.slice(-5).forEach((fixture, index) => {
        console.log(`${results.length - 4 + index}. ${fixture.homeTeam} vs ${fixture.awayTeam} - ${fixture.homeScore}:${fixture.awayScore} (MW ${fixture.matchweek})`);
      });

      // Group by matchweek
      const byMatchweek = new Map<number, number>();
      results.forEach(f => {
        byMatchweek.set(f.matchweek, (byMatchweek.get(f.matchweek) || 0) + 1);
      });

      console.log("\nFixtures by matchweek:");
      Array.from(byMatchweek.entries())
        .sort((a, b) => a[0] - b[0])
        .forEach(([mw, count]) => {
          console.log(`  Matchweek ${mw}: ${count} fixtures`);
        });

      console.log(`\n✅ Scraper test completed successfully!`);
      console.log(`\nNext steps:`);
      console.log(`1. Verify the data looks correct`);
      console.log(`2. Check if all 38 matchweeks are present`);
      console.log(`3. If data looks good, you can use the scraper via the UI`);
    } else {
      console.log("\n⚠️  No fixtures were scraped.");
      console.log("This could mean:");
      console.log("- The page structure has changed");
      console.log("- The selectors need updating");
      console.log("- Network/access issues");
      console.log("\nCheck the console logs above for error messages.");
    }
  } catch (error: any) {
    console.error("\n❌ Error during scraping:", error);
    console.error("\nStack trace:", error.stack);
    process.exit(1);
  }
}

main();
