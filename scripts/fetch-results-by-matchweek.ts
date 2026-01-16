#!/usr/bin/env tsx

/**
 * Premier League Tracker - Fetch Results By Matchweek Script
 * Fetches all finished results for specific matchweeks and saves them to database
 * 
 * Usage:
 *   npx tsx scripts/fetch-results-by-matchweek.ts                    # Fetch all matchweeks
 *   npx tsx scripts/fetch-results-by-matchweek.ts 1 5 10             # Fetch specific matchweeks
 *   npx tsx scripts/fetch-results-by-matchweek.ts --start=1 --end=10 # Fetch range of matchweeks
 *   MATCHWEEKS=1,2,3,4,5 npx tsx scripts/fetch-results-by-matchweek.ts
 */

import * as fs from 'fs';
import * as path from 'path';

// Load environment variables from .env.local file BEFORE importing supabase
function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const match = trimmed.match(/^([^=]+)=(.*)$/);
        if (match) {
          const key = match[1].trim();
          let value = match[2].trim();
          // Remove quotes if present
          if ((value.startsWith('"') && value.endsWith('"')) || 
              (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
          }
          if (!process.env[key]) {
            process.env[key] = value;
          }
        }
      }
    });
    console.log('[Script] Loaded environment variables from .env.local');
  } else {
    console.warn('[Script] Warning: .env.local file not found. Make sure Supabase credentials are set.');
  }
}

// Load environment variables BEFORE importing supabase
loadEnv();

import { createClient } from '@supabase/supabase-js';
import { scrapeResultsFromOneFootball, scrapeFixturesFromOneFootball } from '../lib/scrapers/onefootball-fixtures';
import { scrapeResults } from '../lib/scrapers/results';
import { scrapeAllResultsFromRezultati } from '../lib/scrapers/rezultati-all-results';
import { Fixture } from '../lib/types';

// Create Supabase client directly after loading env vars
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('❌ Missing Supabase environment variables. Please check your .env.local file.');
  process.exit(1);
}

const supabaseServer = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Parse command line arguments
const args = process.argv.slice(2);
let targetMatchweeks: number[] = [];

// Parse arguments
if (args.length === 0) {
  // No arguments - fetch all matchweeks (1-38)
  targetMatchweeks = Array.from({ length: 38 }, (_, i) => i + 1);
} else {
  // Check for --start and --end flags
  const startFlag = args.find(arg => arg.startsWith('--start='));
  const endFlag = args.find(arg => arg.startsWith('--end='));
  
  if (startFlag && endFlag) {
    const start = parseInt(startFlag.split('=')[1]);
    const end = parseInt(endFlag.split('=')[1]);
    if (!isNaN(start) && !isNaN(end) && start >= 1 && end <= 38 && start <= end) {
      targetMatchweeks = Array.from({ length: end - start + 1 }, (_, i) => start + i);
    } else {
      console.error('❌ Invalid range. Use --start=1 --end=10 (values must be between 1 and 38)');
      process.exit(1);
    }
  } else {
    // Parse individual matchweek numbers or comma-separated list from env
    const matchweeksEnv = process.env.MATCHWEEKS;
    const matchweeksStr = matchweeksEnv || args.join(',');
    
    targetMatchweeks = matchweeksStr
      .split(',')
      .map(mw => parseInt(mw.trim()))
      .filter(mw => !isNaN(mw) && mw >= 1 && mw <= 38);
    
    if (targetMatchweeks.length === 0) {
      console.error('❌ No valid matchweeks provided. Use numbers between 1 and 38.');
      process.exit(1);
    }
  }
}

function log(message: string) {
  const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
  console.log(`[${timestamp}] ${message}`);
}

async function fetchResultsForMatchweeks(matchweeks: number[]): Promise<Fixture[]> {
  log(`Starting to fetch results for matchweeks: ${matchweeks.join(', ')}...`);
  
  let allResults: Fixture[] = [];
  
  try {
    // Try Rezultati.com first - it has ALL results for the season
    log('Attempting to scrape ALL results from Rezultati.com (clicking "Show more" to load history)...');
    let tryNextSource = false;
    
    try {
      const rezultatiResults = await scrapeAllResultsFromRezultati();
      log(`✅ Successfully scraped ${rezultatiResults.length} results from Rezultati.com`);
      
      // Filter for target matchweeks
      const filteredResults = rezultatiResults.filter(r => matchweeks.includes(r.matchweek));
      
      if (filteredResults.length > 0) {
        log(`✅ Found ${filteredResults.length} results for target matchweeks from Rezultati.com`);
        allResults = filteredResults;
        tryNextSource = false;
      } else {
        log(`⚠️  No results found for target matchweeks from Rezultati.com. Trying other sources...`);
        tryNextSource = true;
      }
    } catch (rezultatiError) {
      log(`⚠️  Rezultati.com scraping failed: ${rezultatiError}`);
      log('Trying other sources...');
      tryNextSource = true;
    }
    
    // Fallback to OneFootball if Rezultati didn't work
    if (tryNextSource) {
      log('Attempting to scrape results from OneFootball...');
      try {
        const onefootballResults = await scrapeResultsFromOneFootball();
        log(`✅ Successfully scraped ${onefootballResults.length} results from OneFootball`);
        
        const filteredResults = onefootballResults.filter(r => matchweeks.includes(r.matchweek));
        
        if (filteredResults.length > 0) {
          log(`✅ Found ${filteredResults.length} results for target matchweeks from OneFootball`);
          log(`⚠️  Note: OneFootball may only have recent matchweeks (19-21)`);
          allResults = filteredResults;
          tryNextSource = false;
        } else {
          log(`⚠️  No results found for target matchweeks from OneFootball. Trying official site...`);
          tryNextSource = true;
        }
      } catch (onefootballError) {
        log(`⚠️  OneFootball scraping failed: ${onefootballError}`);
        tryNextSource = true;
      }
    }
    
    // Last resort: official Premier League scraper (may redirect to current matchweek)
    if (tryNextSource) {
      log('Using official Premier League scraper (may have limited access to past matchweeks)...');
      log('This may take a few minutes...');
      try {
        const officialResults = await scrapeResults();
        const filtered = officialResults.filter(r => matchweeks.includes(r.matchweek));
        if (filtered.length > 0) {
          log(`✅ Found ${filtered.length} results for target matchweeks from official site`);
          allResults = filtered;
        } else {
          log(`⚠️  Official site also returned no results for target matchweeks`);
        }
      } catch (officialError) {
        log(`⚠️  Official Premier League scraper failed: ${officialError}`);
      }
    }
  } catch (error) {
    log(`❌ Error scraping results: ${error}`);
    throw error;
  }
  
  // Sort by matchweek, then by date
  allResults.sort((a, b) => {
    if (a.matchweek !== b.matchweek) {
      return a.matchweek - b.matchweek;
    }
    return new Date(a.date).getTime() - new Date(b.date).getTime();
  });
  
  return allResults;
}

async function saveResultsToDatabase(results: Fixture[]): Promise<void> {
  if (results.length === 0) {
    log('⚠️  No results to save.');
    return;
  }
  
  log(`Saving ${results.length} results to database...`);
  
  // Prepare data for database insertion
  const dbResults = results.map(result => ({
    id: result.id,
    date: result.date,
    home_team: result.homeTeam,
    away_team: result.awayTeam,
    home_score: result.homeScore,
    away_score: result.awayScore,
    matchweek: result.matchweek,
    status: 'finished' as const,
    is_derby: result.isDerby || false
  }));
  
  // Upsert results (update if exists, insert if not)
  // Use home_team, away_team, date as conflict resolution since that's the unique constraint
  const { error: insertError, data } = await supabaseServer
    .from('fixtures')
    .upsert(dbResults, { 
      onConflict: 'home_team,away_team,date',
      ignoreDuplicates: false 
    });
  
  if (insertError) {
    log(`❌ Error saving results to database: ${insertError.message}`);
    log(`❌ Error details: ${JSON.stringify(insertError)}`);
    throw insertError;
  }
  
  log(`✅ Successfully saved ${results.length} results to database`);
  
  // Update cache metadata
  await supabaseServer
    .from('cache_metadata')
    .upsert({
      key: 'fixtures',
      last_updated: new Date().toISOString(),
      data_count: results.length
    }, { onConflict: 'key' });
  
  log('✅ Cache metadata updated');
}

function displayResults(results: Fixture[]) {
  console.log('\n' + '='.repeat(80));
  console.log(`📊 RESULTS SUMMARY`);
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
      const dateStr = date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
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
  if (results.length > 0) {
    console.log(`Date range: ${new Date(results[0].date).toLocaleDateString()} - ${new Date(results[results.length - 1].date).toLocaleDateString()}`);
  }
  
  // Matchweek distribution
  console.log('\nMatchweek distribution:');
  matchweeks.forEach(mw => {
    console.log(`  Matchweek ${mw}: ${byMatchweek[mw].length} matches`);
  });
}

async function main() {
  try {
    log(`Fetching results for matchweeks: ${targetMatchweeks.join(', ')}...`);
    
    const results = await fetchResultsForMatchweeks(targetMatchweeks);
    
    if (results.length === 0) {
      log('⚠️  No results found for the specified matchweeks.');
      process.exit(0);
    }
    
    // Display results
    displayResults(results);
    
    // Save to database
    await saveResultsToDatabase(results);
    
    log('\n✅ Script completed successfully!');
    process.exit(0);
  } catch (error) {
    log(`❌ Error: ${error}`);
    console.error(error);
    process.exit(1);
  }
}

main();
