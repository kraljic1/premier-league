#!/usr/bin/env tsx

/**
 * Check standings data in database
 */

import * as fs from 'fs';
import * as path from 'path';

// Load environment variables
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
  }
}

loadEnv();

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('URL:', supabaseUrl ? 'SET' : 'MISSING');
  console.error('KEY:', supabaseServiceRoleKey ? 'SET' : 'MISSING');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function checkStandings() {
  console.log('🔍 Checking standings in database...\n');
  console.log('Supabase URL:', supabaseUrl.replace(/https:\/\/([^.]+)\.supabase\.co/, 'https://***.supabase.co'));
  console.log('');

  // Check all seasons
  const { data: allStandings, error: allError } = await supabase
    .from('standings')
    .select('*')
    .order('position', { ascending: true });

  if (allError) {
    console.error('❌ Error querying standings:', allError);
    return;
  }

  console.log(`📊 Total standings records: ${allStandings?.length || 0}\n`);

  if (!allStandings || allStandings.length === 0) {
    console.log('⚠️  No standings data found in database!');
    console.log('');
    console.log('To populate standings, run:');
    console.log('  npx tsx scripts/auto-update-results.ts');
    return;
  }

  // Group by season
  const bySeason: Record<string, any[]> = {};
  allStandings.forEach(s => {
    const season = s.season || 'unknown';
    if (!bySeason[season]) bySeason[season] = [];
    bySeason[season].push(s);
  });

  console.log('📅 Standings by season:');
  Object.keys(bySeason).forEach(season => {
    console.log(`  ${season}: ${bySeason[season].length} teams`);
  });
  console.log('');

  // Show 2025 season specifically
  const season2025 = allStandings.filter(s => s.season === '2025' || s.season === '2025/2026');
  if (season2025.length > 0) {
    console.log(`✅ Season 2025 standings (${season2025.length} teams):`);
    console.log('');
    season2025.slice(0, 5).forEach(s => {
      console.log(`  ${s.position}. ${s.club} - ${s.points} pts (P:${s.played} W:${s.won} D:${s.drawn} L:${s.lost})`);
    });
    if (season2025.length > 5) {
      console.log(`  ... and ${season2025.length - 5} more`);
    }
  } else {
    console.log('⚠️  No standings found for season 2025');
    console.log('');
    console.log('Available seasons:', Object.keys(bySeason).join(', '));
  }

  // Check cache metadata
  console.log('');
  console.log('📋 Cache metadata:');
  const { data: cacheMeta, error: cacheError } = await supabase
    .from('cache_metadata')
    .select('*')
    .eq('key', 'standings');

  if (cacheError) {
    console.error('  Error:', cacheError.message);
  } else if (cacheMeta && cacheMeta.length > 0) {
    cacheMeta.forEach(meta => {
      console.log(`  Key: ${meta.key}`);
      console.log(`  Last updated: ${meta.last_updated}`);
      console.log(`  Data count: ${meta.data_count}`);
    });
  } else {
    console.log('  No cache metadata found');
  }
}

checkStandings().catch(console.error);
