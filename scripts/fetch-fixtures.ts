/**
 * Script to fetch all future fixtures from Rezultati.com and save to database
 * 
 * Usage:
 *   npx tsx scripts/fetch-fixtures.ts
 */

import * as fs from 'fs';
import * as path from 'path';

// Load environment variables from .env.local at the very top
function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    envContent.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        const value = valueParts.join('=').replace(/^["']|["']$/g, '');
        if (key && value) {
          process.env[key] = value;
        }
      }
    });
    console.log('[Script] Loaded environment variables from .env.local');
  }
}

loadEnv();

import { createClient } from '@supabase/supabase-js';
import { scrapeAllFixturesFromRezultati } from '../lib/scrapers/rezultati-fixtures';
import { closeBrowser } from '../lib/scrapers/browser';
import { Fixture } from '../lib/types';

// Create Supabase client
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

function log(message: string) {
  const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
  console.log(`[${timestamp}] ${message}`);
}

async function saveFixturesToDatabase(fixtures: Fixture[]): Promise<void> {
  if (fixtures.length === 0) {
    log('⚠️  No fixtures to save.');
    return;
  }
  
  log(`Saving ${fixtures.length} fixtures to database...`);
  
  // Prepare data for database insertion
  const dbFixtures = fixtures.map(fixture => ({
    id: fixture.id,
    date: fixture.date,
    home_team: fixture.homeTeam,
    away_team: fixture.awayTeam,
    home_score: fixture.homeScore,
    away_score: fixture.awayScore,
    matchweek: fixture.matchweek,
    status: 'scheduled' as const,
    is_derby: fixture.isDerby || false
  }));
  
  // Upsert fixtures (update if exists, insert if not)
  const { error: insertError } = await supabaseServer
    .from('fixtures')
    .upsert(dbFixtures, { 
      onConflict: 'home_team,away_team,date',
      ignoreDuplicates: false 
    });
  
  if (insertError) {
    log(`❌ Error saving fixtures to database: ${insertError.message}`);
    log(`❌ Error details: ${JSON.stringify(insertError)}`);
    throw insertError;
  }
  
  log(`✅ Successfully saved ${fixtures.length} fixtures to database`);
  
  // Update cache metadata
  await supabaseServer
    .from('cache_metadata')
    .upsert({
      key: 'fixtures',
      last_updated: new Date().toISOString(),
      data_count: fixtures.length
    }, { onConflict: 'key' });
  
  log('✅ Cache metadata updated');
}

function displayFixtures(fixtures: Fixture[]) {
  console.log('\n' + '='.repeat(80));
  console.log(`📅 FIXTURES SUMMARY`);
  console.log('='.repeat(80));
  console.log(`Total fixtures: ${fixtures.length}\n`);
  
  // Group by matchweek
  const byMatchweek: Record<number, Fixture[]> = {};
  fixtures.forEach(fixture => {
    if (!byMatchweek[fixture.matchweek]) {
      byMatchweek[fixture.matchweek] = [];
    }
    byMatchweek[fixture.matchweek].push(fixture);
  });
  
  // Display by matchweek
  const matchweeks = Object.keys(byMatchweek)
    .map(Number)
    .sort((a, b) => a - b);
  
  matchweeks.forEach(mw => {
    const mwFixtures = byMatchweek[mw];
    console.log(`\n📅 MATCHWEEK ${mw} (${mwFixtures.length} matches)`);
    console.log('-'.repeat(80));
    
    mwFixtures.forEach((fixture, index) => {
      const date = new Date(fixture.date);
      const dateStr = date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      
      console.log(`${index + 1}. ${fixture.homeTeam} vs ${fixture.awayTeam}`);
      console.log(`   Date: ${dateStr}${fixture.isDerby ? ' 🏆 DERBY MATCH' : ''}`);
    });
  });
  
  // Statistics
  console.log('\n' + '='.repeat(80));
  console.log(`\n📈 STATISTICS:`);
  console.log(`Total fixtures: ${fixtures.length}`);
  console.log(`Matchweeks covered: ${matchweeks.length}`);
  
  if (fixtures.length > 0) {
    const dates = fixtures.map(f => new Date(f.date));
    const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
    const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));
    console.log(`Date range: ${minDate.toLocaleDateString()} - ${maxDate.toLocaleDateString()}`);
  }
  
  console.log('\nMatchweek distribution:');
  matchweeks.forEach(mw => {
    const count = byMatchweek[mw].length;
    const status = count === 10 ? '✓' : '⚠️';
    console.log(`  Matchweek ${mw}: ${count} matches ${status}`);
  });
}

async function main() {
  try {
    log('Fetching all fixtures from Rezultati.com...');
    
    const fixtures = await scrapeAllFixturesFromRezultati();
    
    if (fixtures.length === 0) {
      log('⚠️  No fixtures found.');
      return;
    }
    
    // Display fixtures
    displayFixtures(fixtures);
    
    // Save to database
    await saveFixturesToDatabase(fixtures);
    
    log('\n✅ Script completed successfully!');
  } catch (error) {
    log(`❌ Error: ${error}`);
    console.error(error);
    process.exit(1);
  } finally {
    await closeBrowser();
  }
}

main();
