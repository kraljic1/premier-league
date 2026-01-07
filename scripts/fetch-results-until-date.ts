#!/usr/bin/env tsx

/**
 * Premier League Tracker - Fetch Results Until Date Script
 * Fetches all finished results from the current season until a specified date
 * 
 * Usage:
 *   npx tsx scripts/fetch-results-until-date.ts
 *   npx tsx scripts/fetch-results-until-date.ts 2026-01-07
 *   END_DATE=2026-01-07 npx tsx scripts/fetch-results-until-date.ts
 *   OUTPUT_FILE=results.json npx tsx scripts/fetch-results-until-date.ts
 */

import { scrapeResultsFromOneFootball, scrapeFixturesFromOneFootball } from '../lib/scrapers/onefootball-fixtures';
import { scrapeResults } from '../lib/scrapers/results';
import { scrapeResultsFromRezultati } from '../lib/scrapers/rezultati-results';
import { Fixture } from '../lib/types';
import * as fs from 'fs';
import * as path from 'path';

// Parse command line arguments or environment variables
const endDateStr = process.argv[2] || process.env.END_DATE || '2026-01-07';
const outputFile = process.env.OUTPUT_FILE || 'results-until-date.json';

// Parse the end date
const endDate = new Date(endDateStr);
if (isNaN(endDate.getTime())) {
  console.error(`❌ Invalid date format: ${endDateStr}`);
  console.error('Please use format: YYYY-MM-DD (e.g., 2026-01-07)');
  process.exit(1);
}

function log(message: string) {
  const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
  console.log(`[${timestamp}] ${message}`);
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

function formatDateTime(date: Date): string {
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

async function fetchResultsUntilDate(): Promise<Fixture[]> {
  log(`Starting to fetch results until ${formatDate(endDate)}...`);
  
  let allResults: Fixture[] = [];
  
  try {
    // Try Rezultati.com first - it typically has comprehensive historical results
    log('Attempting to scrape results from Rezultati.com (FlashScore)...');
    let tryNextSource = false;
    
    try {
      const rezultatiResults = await scrapeResultsFromRezultati();
      log(`✅ Successfully scraped ${rezultatiResults.length} results from Rezultati.com`);
      
      // Check if we got results from early matchweeks (1-5)
      if (rezultatiResults.length > 0) {
        const matchweeks = new Set(rezultatiResults.map(r => r.matchweek));
        const hasEarlyMatchweeks = Array.from(matchweeks).some(mw => mw >= 1 && mw <= 5);
        const minMatchweek = Math.min(...Array.from(matchweeks));
        
        if (hasEarlyMatchweeks || rezultatiResults.length > 50) {
          log(`✅ Rezultati.com has ${rezultatiResults.length} results from matchweek ${minMatchweek} onwards - using this data`);
          allResults = rezultatiResults;
        } else {
          log(`⚠️  Rezultati.com only has ${rezultatiResults.length} results starting at matchweek ${minMatchweek}. Trying other sources...`);
          tryNextSource = true;
        }
      } else {
        log(`⚠️  No results found from Rezultati.com. Trying other sources...`);
        tryNextSource = true;
      }
    } catch (rezultatiError) {
      log(`⚠️  Rezultati.com scraping failed: ${rezultatiError}`);
      log('Trying other sources...');
      tryNextSource = true;
    }
    
    // Try OneFootball fixtures scraper if Rezultati didn't work
    if (tryNextSource) {
      log('Attempting to scrape all fixtures from OneFootball (includes historical results)...');
      try {
        // Get ALL fixtures (scheduled + finished) from OneFootball
        const allFixtures = await scrapeFixturesFromOneFootball();
        log(`✅ Successfully scraped ${allFixtures.length} fixtures from OneFootball`);
        
        // Filter for finished matches only (these are our results)
        const finishedFixtures = allFixtures.filter(f => f.status === 'finished');
        log(`   Found ${finishedFixtures.length} finished matches out of ${allFixtures.length} total fixtures`);
        
        if (finishedFixtures.length > 0) {
          const matchweeks = new Set(finishedFixtures.map(r => r.matchweek));
          const minMatchweek = Math.min(...Array.from(matchweeks));
          log(`✅ OneFootball fixtures include ${finishedFixtures.length} results from matchweek ${minMatchweek} onwards`);
          allResults = finishedFixtures;
          tryNextSource = false;
        } else {
          log(`⚠️  No finished matches found in fixtures. Trying results scraper...`);
          const onefootballResults = await scrapeResultsFromOneFootball();
          log(`✅ Got ${onefootballResults.length} results from OneFootball results page`);
          allResults = onefootballResults;
          tryNextSource = false;
        }
      } catch (onefootballError) {
        log(`⚠️  OneFootball scraping failed: ${onefootballError}`);
        tryNextSource = true;
      }
    }
    
    // Use official scraper as last resort
    if (tryNextSource) {
      log('Using official Premier League scraper to get all historical results...');
      log('This may take a few minutes as it navigates through all matchweeks...');
      allResults = await scrapeResults();
      log(`✅ Successfully scraped ${allResults.length} results from official site`);
    }
  } catch (error) {
    log(`❌ Error scraping results: ${error}`);
    throw error;
  }
  
  // Filter results up to the end date
  const filteredResults = allResults.filter(fixture => {
    const fixtureDate = new Date(fixture.date);
    return fixtureDate <= endDate && fixture.status === 'finished';
  });
  
  log(`Filtered to ${filteredResults.length} results until ${formatDate(endDate)}`);
  
  // Sort by matchweek, then by date
  filteredResults.sort((a, b) => {
    if (a.matchweek !== b.matchweek) {
      return a.matchweek - b.matchweek;
    }
    return new Date(a.date).getTime() - new Date(b.date).getTime();
  });
  
  return filteredResults;
}

function displayResults(results: Fixture[]) {
  console.log('\n' + '='.repeat(80));
  console.log(`📊 RESULTS SUMMARY (until ${formatDate(endDate)})`);
  console.log('='.repeat(80));
  console.log(`Total results: ${results.length}\n`);
  
  // Group by matchweek
  const byMatchweek: Record<number, Fixture[]> = {};
  results.forEach(result => {
    if (!byMatchweek[result.matchweek]) {
      byMatchweek[result.matchweek] = [];
    }
    byMatchweek[result.matchweek].push(result);
  });
  
  // Display by matchweek
  const matchweeks = Object.keys(byMatchweek)
    .map(Number)
    .sort((a, b) => a - b);
  
  matchweeks.forEach(mw => {
    const mwResults = byMatchweek[mw];
    console.log(`\n📅 MATCHWEEK ${mw} (${mwResults.length} matches)`);
    console.log('-'.repeat(80));
    
    mwResults.forEach((result, index) => {
      const date = new Date(result.date);
      const dateStr = formatDateTime(date);
      const score = result.homeScore !== null && result.awayScore !== null
        ? `${result.homeScore} - ${result.awayScore}`
        : 'N/A';
      
      console.log(`${index + 1}. ${result.homeTeam} vs ${result.awayTeam}`);
      console.log(`   Score: ${score} | Date: ${dateStr}`);
      if (result.isDerby) {
        console.log('   🏆 DERBY MATCH');
      }
    });
  });
  
  // Summary statistics
  console.log('\n' + '='.repeat(80));
  console.log('\n📈 STATISTICS:');
  console.log(`Total matches: ${results.length}`);
  console.log(`Matchweeks covered: ${matchweeks.length}`);
  console.log(`Date range: ${formatDateTime(new Date(results[0]?.date || ''))} - ${formatDateTime(new Date(results[results.length - 1]?.date || ''))}`);
  
  // Matchweek distribution
  console.log('\nMatchweek distribution:');
  matchweeks.forEach(mw => {
    console.log(`  Matchweek ${mw}: ${byMatchweek[mw].length} matches`);
  });
}

function saveResults(results: Fixture[], filename: string) {
  const outputPath = path.join(process.cwd(), filename);
  const data = {
    metadata: {
      fetchedAt: new Date().toISOString(),
      endDate: formatDate(endDate),
      totalResults: results.length,
      matchweeks: Array.from(new Set(results.map(r => r.matchweek))).sort((a, b) => a - b),
    },
    results: results,
  };
  
  fs.writeFileSync(outputPath, JSON.stringify(data, null, 2), 'utf8');
  log(`✅ Results saved to: ${outputPath}`);
}

async function main() {
  try {
    log(`Fetching results until ${formatDate(endDate)}...`);
    
    const results = await fetchResultsUntilDate();
    
    if (results.length === 0) {
      log('⚠️  No results found for the specified date range.');
      process.exit(0);
    }
    
    // Display results
    displayResults(results);
    
    // Save to file
    saveResults(results, outputFile);
    
    log('\n✅ Script completed successfully!');
    process.exit(0);
  } catch (error) {
    log(`❌ Error: ${error}`);
    console.error(error);
    process.exit(1);
  }
}

main();
