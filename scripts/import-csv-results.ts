/**
 * Script to import historical season results from CSV files
 * 
 * CSV files are located in the results/ folder:
 * - 24:25.csv (2024/25 season)
 * - epl-2020-GMTStandardTime.csv (2020/21 season)
 * - epl-2021-GMTStandardTime.csv (2021/22 season)
 * - epl-2022-UTC.csv (2022/23 season)
 * - epl-2023-GMTStandardTime.csv (2023/24 season)
 * 
 * Usage: npx tsx scripts/import-csv-results.ts
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import * as fs from 'fs';
import * as path from 'path';

// Load environment variables FIRST
config({ path: resolve(__dirname, '../.env.local') });

import { createClient } from '@supabase/supabase-js';
import { Fixture } from '../lib/types';
import type { Database } from '../lib/supabase';

// Create Supabase client directly with loaded env vars
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabaseServer = createClient<Database>(
  supabaseUrl,
  supabaseKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Team name mappings from CSV to our standard format
const TEAM_NAME_MAPPINGS: Record<string, string> = {
  'Man United': 'Manchester United',
  'Man Utd': 'Manchester United',
  'Man City': 'Manchester City',
  'Tottenham': 'Tottenham Hotspur',
  'Spurs': 'Tottenham Hotspur',
  'Brighton': 'Brighton & Hove Albion',
  'Wolves': 'Wolverhampton Wanderers',
  'West Ham': 'West Ham United',
  'Newcastle': 'Newcastle United',
  'Leeds': 'Leeds United',
  'Forest': 'Nottingham Forest',
  'Nottingham': 'Nottingham Forest',
  'Sheffield Utd': 'Sheffield United',
  'Sheff Utd': 'Sheffield United',
  'Leicester': 'Leicester City',
  'Norwich': 'Norwich City',
  'Watford': 'Watford',
  'Southampton': 'Southampton',
  'Burnley': 'Burnley',
  'Fulham': 'Fulham',
  'Bournemouth': 'Bournemouth',
  'Brentford': 'Brentford',
  'Luton': 'Luton Town',
  'Ipswich': 'Ipswich Town',
};

function normalizeTeamName(name: string): string {
  const trimmed = name.trim();
  return TEAM_NAME_MAPPINGS[trimmed] || trimmed;
}

function parseDate(dateStr: string, seasonYear: number): Date {
  // Handle formats like "16/08/2024" or "12/09/2020 12:30"
  const parts = dateStr.trim().split(/[\s\/]+/);
  
  if (parts.length >= 3) {
    const day = parseInt(parts[0]);
    const month = parseInt(parts[1]) - 1; // Month is 0-indexed
    let year = parseInt(parts[2]);
    
    // Handle 2-digit years
    if (year < 100) {
      year = 2000 + year;
    }
    
    // Handle time if present (format: "12:30")
    let hours = 12;
    let minutes = 0;
    if (parts.length >= 4) {
      const timeParts = parts[3].split(':');
      hours = parseInt(timeParts[0]) || 12;
      minutes = parseInt(timeParts[1]) || 0;
    }
    
    return new Date(year, month, day, hours, minutes);
  }
  
  // Fallback: use season start date
  return new Date(seasonYear, 7, 17); // August 17
}

function parseScore(result: string): { homeScore: number; awayScore: number } | null {
  // Handle formats like "0 - 3", "2-1", "2 - 1"
  const match = result.match(/(\d+)\s*[-–]\s*(\d+)/);
  if (match) {
    return {
      homeScore: parseInt(match[1]),
      awayScore: parseInt(match[2]),
    };
  }
  return null;
}

function createFixtureId(
  homeTeam: string,
  awayTeam: string,
  date: Date,
  matchweek: number,
  seasonYear: number
): string {
  const dateOnly = date.toISOString().split('T')[0];
  return `${homeTeam}-${awayTeam}-${dateOnly}-${matchweek}-${seasonYear}`;
}

interface CSVRow {
  [key: string]: string;
}

async function importDetailedCSV(filePath: string, seasonYear: number, seasonName: string): Promise<number> {
  console.log(`\n📄 Importing ${path.basename(filePath)} (${seasonName})...`);
  
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n').filter(line => line.trim());
  
  if (lines.length < 2) {
    console.log('⚠️  File is empty or has no data rows');
    return 0;
  }
  
  // Parse header
  const header = lines[0].split(',').map(h => h.trim().replace(/^\uFEFF/, '')); // Remove BOM if present
  const rawFixtures: Array<{ date: Date; homeTeam: string; awayTeam: string; homeScore: number; awayScore: number }> = [];
  
  // First pass: parse all fixtures
  for (let i = 1; i < lines.length; i++) {
    // Handle CSV with quoted values
    const values: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let j = 0; j < lines[i].length; j++) {
      const char = lines[i][j];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());
    
    if (values.length < header.length) continue;
    
    const row: CSVRow = {};
    header.forEach((h, idx) => {
      row[h] = values[idx] || '';
    });
    
    // Extract data from detailed format (24:25.csv)
    const homeTeam = normalizeTeamName(row['HomeTeam'] || '');
    const awayTeam = normalizeTeamName(row['AwayTeam'] || '');
    const dateStr = row['Date'] || '';
    const homeScore = parseInt(row['FTHG'] || '0');
    const awayScore = parseInt(row['FTAG'] || '0');
    
    if (!homeTeam || !awayTeam || !dateStr) continue;
    
    const date = parseDate(dateStr, seasonYear);
    
    rawFixtures.push({
      date,
      homeTeam,
      awayTeam,
      homeScore: isNaN(homeScore) ? 0 : homeScore,
      awayScore: isNaN(awayScore) ? 0 : awayScore,
    });
  }
  
  // Sort by date
  rawFixtures.sort((a, b) => a.date.getTime() - b.date.getTime());
  
  // Assign matchweeks: group matches by week (typically 10 matches per matchweek)
  const fixtures: Fixture[] = [];
  let currentMatchweek = 1;
  let matchesInCurrentWeek = 0;
  let lastWeekStart: Date | null = null;
  
  for (const raw of rawFixtures) {
    // Check if this match starts a new matchweek
    // A new matchweek starts when:
    // 1. We've seen 10 matches (typical for a matchweek)
    // 2. OR there's a gap of more than 7 days from the last match
    const shouldStartNewWeek = 
      matchesInCurrentWeek >= 10 ||
      (lastWeekStart && (raw.date.getTime() - lastWeekStart.getTime()) > 7 * 24 * 60 * 60 * 1000);
    
    if (shouldStartNewWeek && matchesInCurrentWeek > 0) {
      currentMatchweek++;
      matchesInCurrentWeek = 0;
      lastWeekStart = raw.date;
    }
    
    if (matchesInCurrentWeek === 0) {
      lastWeekStart = raw.date;
    }
    
    matchesInCurrentWeek++;
    
    // Cap matchweek at 38 (Premier League has 38 matchweeks)
    const matchweek = Math.min(currentMatchweek, 38);
    
    const fixture: Fixture = {
      id: createFixtureId(raw.homeTeam, raw.awayTeam, raw.date, matchweek, seasonYear),
      date: raw.date.toISOString(),
      homeTeam: raw.homeTeam,
      awayTeam: raw.awayTeam,
      homeScore: raw.homeScore,
      awayScore: raw.awayScore,
      matchweek: matchweek,
      status: 'finished',
      season: seasonName,
    };
    
    fixtures.push(fixture);
  }
  
  // Save to database
  if (fixtures.length > 0) {
    console.log(`  ✓ Parsed ${fixtures.length} fixtures`);
    
    // First, delete existing fixtures for this season to avoid duplicates
    console.log(`  🗑️  Deleting existing fixtures for ${seasonName}...`);
    const { error: deleteError } = await supabaseServer
      .from('fixtures')
      .delete()
      .eq('season', seasonName);
    
    if (deleteError) {
      console.warn(`  ⚠️  Warning: Could not delete existing fixtures: ${deleteError.message}`);
    } else {
      console.log(`  ✓ Cleared existing fixtures for ${seasonName}`);
    }
    
    const dbFixtures = fixtures.map((fixture) => ({
      id: fixture.id,
      date: fixture.date,
      home_team: fixture.homeTeam,
      away_team: fixture.awayTeam,
      home_score: fixture.homeScore,
      away_score: fixture.awayScore,
      matchweek: fixture.matchweek,
      original_matchweek: fixture.matchweek,
      status: fixture.status,
      is_derby: false,
      season: fixture.season,
    }));
    
    // Insert in batches (no need for upsert since we deleted existing ones)
    const batchSize = 50;
    let totalSaved = 0;
    
    for (let i = 0; i < dbFixtures.length; i += batchSize) {
      const batch = dbFixtures.slice(i, i + batchSize);
      
      const { error } = await supabaseServer
        .from('fixtures')
        .insert(batch);
      
      if (error) {
        console.error(`  ❌ Error saving batch ${Math.floor(i / batchSize) + 1}:`, error.message);
        console.error(`  Error details:`, JSON.stringify(error, null, 2));
        throw error;
      }
      
      totalSaved += batch.length;
    }
    
    console.log(`  ✅ Saved ${totalSaved} fixtures to database`);
    return totalSaved;
  }
  
  return 0;
}

async function importSimpleCSV(filePath: string, seasonYear: number, seasonName: string): Promise<number> {
  console.log(`\n📄 Importing ${path.basename(filePath)} (${seasonName})...`);
  
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n').filter(line => line.trim());
  
  if (lines.length < 2) {
    console.log('⚠️  File is empty or has no data rows');
    return 0;
  }
  
  const fixtures: Fixture[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    // Parse CSV line (handle quoted values)
    const values: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let j = 0; j < lines[i].length; j++) {
      const char = lines[i][j];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());
    
    if (values.length < 7) continue;
    
    const roundNumber = parseInt(values[1] || '1');
    const dateStr = values[2] || '';
    const homeTeam = normalizeTeamName(values[4] || '');
    const awayTeam = normalizeTeamName(values[5] || '');
    const result = values[6] || '';
    
    if (!homeTeam || !awayTeam || !dateStr || !result) continue;
    
    const score = parseScore(result);
    if (!score) continue;
    
    const date = parseDate(dateStr, seasonYear);
    
    const fixture: Fixture = {
      id: createFixtureId(homeTeam, awayTeam, date, roundNumber, seasonYear),
      date: date.toISOString(),
      homeTeam,
      awayTeam,
      homeScore: score.homeScore,
      awayScore: score.awayScore,
      matchweek: roundNumber,
      status: 'finished',
      season: seasonName,
    };
    
    fixtures.push(fixture);
  }
  
  // Save to database
  if (fixtures.length > 0) {
    console.log(`  ✓ Parsed ${fixtures.length} fixtures`);
    
    // First, delete existing fixtures for this season to avoid duplicates
    console.log(`  🗑️  Deleting existing fixtures for ${seasonName}...`);
    const { error: deleteError } = await supabaseServer
      .from('fixtures')
      .delete()
      .eq('season', seasonName);
    
    if (deleteError) {
      console.warn(`  ⚠️  Warning: Could not delete existing fixtures: ${deleteError.message}`);
    } else {
      console.log(`  ✓ Cleared existing fixtures for ${seasonName}`);
    }
    
    const dbFixtures = fixtures.map((fixture) => ({
      id: fixture.id,
      date: fixture.date,
      home_team: fixture.homeTeam,
      away_team: fixture.awayTeam,
      home_score: fixture.homeScore,
      away_score: fixture.awayScore,
      matchweek: fixture.matchweek,
      original_matchweek: fixture.matchweek,
      status: fixture.status,
      is_derby: false,
      season: fixture.season,
    }));
    
    // Insert in batches (no need for upsert since we deleted existing ones)
    const batchSize = 50;
    let totalSaved = 0;
    
    for (let i = 0; i < dbFixtures.length; i += batchSize) {
      const batch = dbFixtures.slice(i, i + batchSize);
      
      const { error } = await supabaseServer
        .from('fixtures')
        .insert(batch);
      
      if (error) {
        console.error(`  ❌ Error saving batch ${Math.floor(i / batchSize) + 1}:`, error.message);
        console.error(`  Error details:`, JSON.stringify(error, null, 2));
        throw error;
      }
      
      totalSaved += batch.length;
    }
    
    console.log(`  ✅ Saved ${totalSaved} fixtures to database`);
    return totalSaved;
  }
  
  return 0;
}

async function main() {
  console.log('\n🚀 Starting CSV import process...\n');
  
  // Verify environment variables are loaded
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase environment variables!');
    console.error('   Make sure .env.local contains:');
    console.error('   - NEXT_PUBLIC_SUPABASE_URL');
    console.error('   - SUPABASE_SERVICE_ROLE_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY)');
    process.exit(1);
  }
  
  console.log(`✓ Supabase URL: ${supabaseUrl.substring(0, 30)}...`);
  console.log(`✓ Supabase Key: ${supabaseKey.substring(0, 20)}...\n`);
  
  // Test connection
  try {
    const { data, error } = await supabaseServer.from('fixtures').select('id').limit(1);
    if (error) {
      console.error('❌ Supabase connection test failed:', error.message);
      console.error('   Error details:', JSON.stringify(error, null, 2));
      process.exit(1);
    }
    console.log('✓ Supabase connection successful!\n');
  } catch (err: any) {
    console.error('❌ Failed to connect to Supabase:', err.message);
    console.error('   Error type:', err.constructor.name);
    if (err.cause) {
      console.error('   Cause:', err.cause);
    }
    console.error('   Check your internet connection and Supabase URL');
    process.exit(1);
  }
  
  const resultsDir = path.join(__dirname, '../results');
  const files = [
    { file: 'epl-2020-GMTStandardTime.csv', year: 2020, name: '2020/21' },
    { file: 'epl-2021-GMTStandardTime.csv', year: 2021, name: '2021/22' },
    { file: 'epl-2022-UTC.csv', year: 2022, name: '2022/23' },
    { file: 'epl-2023-GMTStandardTime.csv', year: 2023, name: '2023/24' },
    { file: '24:25.csv', year: 2024, name: '2024/25' },
  ];
  
  const results: Array<{ season: string; count: number; success: boolean }> = [];
  
  for (const { file, year, name } of files) {
    const filePath = path.join(resultsDir, file);
    
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  File not found: ${file}`);
      results.push({ season: name, count: 0, success: false });
      continue;
    }
    
    try {
      let count: number;
      
      if (file === '24:25.csv') {
        count = await importDetailedCSV(filePath, year, name);
      } else {
        count = await importSimpleCSV(filePath, year, name);
      }
      
      results.push({ season: name, count, success: true });
    } catch (error: any) {
      console.error(`❌ Error importing ${name}:`, error.message);
      results.push({ season: name, count: 0, success: false });
    }
  }
  
  // Summary
  console.log(`\n${'='.repeat(80)}`);
  console.log('📊 IMPORT SUMMARY');
  console.log(`${'='.repeat(80)}`);
  const total = results.reduce((sum, r) => sum + r.count, 0);
  const successful = results.filter((r) => r.success).length;
  
  console.log(`✅ Successful imports: ${successful}/${files.length}`);
  console.log(`📈 Total fixtures imported: ${total}`);
  console.log(`\n📋 Per-season breakdown:`);
  results.forEach(({ season, count, success }) => {
    const status = success ? '✅' : '❌';
    console.log(`   ${status} ${season}: ${count} fixtures`);
  });
  console.log(`${'='.repeat(80)}\n`);
}

main().catch((error) => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});
