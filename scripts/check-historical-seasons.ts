/**
 * Quick script to check if historical season fixtures were saved to the database
 * 
 * Usage: npx tsx scripts/check-historical-seasons.ts
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables FIRST
config({ path: resolve(__dirname, '../.env.local') });

import { createClient } from '@supabase/supabase-js';
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

async function checkHistoricalSeasons() {
  console.log('\n🔍 Checking database for historical season fixtures...\n');

  const seasons = ['2024/25', '2023/24', '2022/23', '2021/22', '2020/21'];

  for (const season of seasons) {
    const { data, error } = await supabaseServer
      .from('fixtures')
      .select('*')
      .eq('season', season)
      .order('matchweek', { ascending: true })
      .order('date', { ascending: true });

    if (error) {
      console.error(`❌ Error checking season ${season}:`, error.message);
      continue;
    }

    const count = data?.length || 0;
    if (count > 0) {
      // Group by matchweek
      const byMatchweek = new Map<number, number>();
      data?.forEach((fixture) => {
        const mw = fixture.matchweek;
        byMatchweek.set(mw, (byMatchweek.get(mw) || 0) + 1);
      });

      console.log(`✅ ${season}: ${count} fixtures found`);
      console.log(`   Matchweeks: ${byMatchweek.size} (${Array.from(byMatchweek.keys()).sort((a, b) => a - b).join(', ')})`);
      
      // Show sample
      if (data && data.length > 0) {
        const sample = data[0];
        console.log(`   Sample: ${sample.home_team} vs ${sample.away_team} (MW ${sample.matchweek}, ${sample.date.split('T')[0]})`);
      }
    } else {
      console.log(`⚠️  ${season}: No fixtures found`);
    }
    console.log('');
  }

  // Total summary
  const { data: allHistorical, error: allError } = await supabaseServer
    .from('fixtures')
    .select('season')
    .in('season', seasons);

  if (!allError && allHistorical) {
    const total = allHistorical.length;
    console.log(`\n📊 Total historical fixtures: ${total}`);
  }
}

checkHistoricalSeasons().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
