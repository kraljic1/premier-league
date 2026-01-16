/**
 * Script to scrape all historical seasons and save them to the database
 * 
 * Seasons to scrape:
 * - 2024/25 (seasonYear: 2024)
 * - 2023/24 (seasonYear: 2023)
 * - 2022/23 (seasonYear: 2022)
 * - 2021/22 (seasonYear: 2021)
 * - 2020/21 (seasonYear: 2020)
 * 
 * Usage: npx tsx scripts/scrape-all-historical-seasons.ts
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.local
config({ path: resolve(__dirname, '../.env.local') });

import { scrapeHistoricalSeason } from '../lib/scrapers/sofascore-historical';
import { supabaseServer } from '../lib/supabase';
import { Fixture } from '../lib/types';

const SEASONS_TO_SCRAPE = [
  { year: 2024, name: '2024/25' },
  { year: 2023, name: '2023/24' },
  { year: 2022, name: '2022/23' },
  { year: 2021, name: '2021/22' },
  { year: 2020, name: '2020/21' },
];

async function saveFixturesToDatabase(fixtures: Fixture[], season: string): Promise<number> {
  if (fixtures.length === 0) {
    console.log(`⚠️  No fixtures to save for season ${season}.`);
    return 0;
  }

  console.log(`\n💾 Saving ${fixtures.length} fixtures for season ${season} to database...`);

  // Prepare data for database insertion
  const dbFixtures = fixtures.map((fixture) => ({
    id: fixture.id,
    date: fixture.date,
    home_team: fixture.homeTeam,
    away_team: fixture.awayTeam,
    home_score: fixture.homeScore,
    away_score: fixture.awayScore,
    matchweek: fixture.matchweek,
    status: fixture.status,
    is_derby: fixture.isDerby || false,
    season: fixture.season || season,
  }));

  // Upsert fixtures in batches to avoid timeout
  const batchSize = 50;
  let totalSaved = 0;

  for (let i = 0; i < dbFixtures.length; i += batchSize) {
    const batch = dbFixtures.slice(i, i + batchSize);

    const { error: insertError } = await supabaseServer
      .from('fixtures')
      .upsert(batch, {
        onConflict: 'id',
        ignoreDuplicates: false,
      });

    if (insertError) {
      console.error(`❌ Error saving batch ${Math.floor(i / batchSize) + 1} for season ${season}:`, insertError.message);
      throw insertError;
    }

    totalSaved += batch.length;
    console.log(`  ✓ Saved batch ${Math.floor(i / batchSize) + 1}: ${batch.length} fixtures`);
  }

  console.log(`✅ Successfully saved ${totalSaved} fixtures for season ${season}`);

  // Update cache metadata
  await supabaseServer
    .from('cache_metadata')
    .upsert(
      {
        key: 'fixtures',
        last_updated: new Date().toISOString(),
        data_count: totalSaved,
      },
      { onConflict: 'key' }
    );

  return totalSaved;
}

async function scrapeAndSaveSeason(seasonYear: number, seasonName: string): Promise<number> {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`🏆 Starting scrape for season ${seasonName} (year: ${seasonYear})`);
  console.log(`${'='.repeat(80)}\n`);

  try {
    const startTime = Date.now();

    // Scrape all matchweeks for this season
    const fixtures = await scrapeHistoricalSeason(seasonYear);

    const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`\n⏱️  Scraping completed in ${elapsedTime}s`);

    if (fixtures.length === 0) {
      console.log(`⚠️  No fixtures found for season ${seasonName}`);
      return 0;
    }

    console.log(`\n📊 Summary for ${seasonName}:`);
    console.log(`   Total fixtures: ${fixtures.length}`);
    
    // Count fixtures by matchweek
    const matchweekCounts = new Map<number, number>();
    fixtures.forEach((f) => {
      matchweekCounts.set(f.matchweek, (matchweekCounts.get(f.matchweek) || 0) + 1);
    });
    
    console.log(`   Matchweeks covered: ${matchweekCounts.size}`);
    console.log(`   Matchweeks breakdown:`);
    Array.from(matchweekCounts.entries())
      .sort((a, b) => a[0] - b[0])
      .forEach(([mw, count]) => {
        console.log(`     - Matchweek ${mw}: ${count} fixtures`);
      });

    // Save to database
    const savedCount = await saveFixturesToDatabase(fixtures, seasonName);

    return savedCount;
  } catch (error: any) {
    console.error(`\n❌ Error scraping season ${seasonName}:`, error.message);
    console.error(error);
    throw error;
  }
}

async function main() {
  console.log('\n🚀 Starting historical seasons scraping process...\n');
  console.log(`📅 Seasons to scrape: ${SEASONS_TO_SCRAPE.map((s) => s.name).join(', ')}\n`);

  const results: Array<{ season: string; count: number; success: boolean }> = [];
  const overallStartTime = Date.now();

  for (const { year, name } of SEASONS_TO_SCRAPE) {
    try {
      const count = await scrapeAndSaveSeason(year, name);
      results.push({ season: name, count, success: true });

      // Add longer delay between seasons to avoid rate limiting
      if (year !== SEASONS_TO_SCRAPE[SEASONS_TO_SCRAPE.length - 1].year) {
        const delay = 15000; // 15 seconds between seasons
        console.log(`\n⏳ Waiting ${delay / 1000} seconds before next season to avoid rate limiting...\n`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    } catch (error: any) {
      console.error(`\n❌ Failed to scrape season ${name}:`, error.message);
      
      // If rate limited, wait much longer before continuing
      if (error.message?.includes('rate limit') || error.message?.includes('403') || error.message?.includes('429')) {
        console.warn(`\n⚠️  Rate limit detected. Waiting 60 seconds before continuing...\n`);
        await new Promise((resolve) => setTimeout(resolve, 60000));
      }
      
      results.push({ season: name, count: 0, success: false });
      // Continue with next season even if one fails
    }
  }

  // Final summary
  const overallElapsedTime = ((Date.now() - overallStartTime) / 1000).toFixed(2);
  const totalFixtures = results.reduce((sum, r) => sum + r.count, 0);
  const successfulSeasons = results.filter((r) => r.success).length;

  console.log(`\n${'='.repeat(80)}`);
  console.log('📊 FINAL SUMMARY');
  console.log(`${'='.repeat(80)}`);
  console.log(`⏱️  Total time: ${overallElapsedTime}s`);
  console.log(`✅ Successful seasons: ${successfulSeasons}/${SEASONS_TO_SCRAPE.length}`);
  console.log(`📈 Total fixtures saved: ${totalFixtures}`);
  console.log(`\n📋 Per-season breakdown:`);
  results.forEach(({ season, count, success }) => {
    const status = success ? '✅' : '❌';
    console.log(`   ${status} ${season}: ${count} fixtures`);
  });
  console.log(`${'='.repeat(80)}\n`);

  if (successfulSeasons === SEASONS_TO_SCRAPE.length) {
    console.log('🎉 All seasons scraped successfully!');
    process.exit(0);
  } else {
    console.log('⚠️  Some seasons failed. Check the logs above for details.');
    process.exit(1);
  }
}

// Run the script
main().catch((error) => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});
