#!/usr/bin/env tsx

/**
 * Test script to manually run the scheduler
 * This will analyze fixtures and create scheduled updates
 * 
 * Usage:
 *   npx tsx scripts/test-scheduler.ts
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
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function testScheduler() {
  console.log('🔍 Testing scheduler...\n');

  const now = new Date();
  const next7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  console.log(`📅 Finding matches between ${now.toISOString()} and ${next7Days.toISOString()}\n`);

  // Get all scheduled matches in the next 7 days
  const { data: fixtures, error } = await supabase
    .from('fixtures')
    .select('id, date, home_team, away_team, status')
    .eq('status', 'scheduled')
    .gte('date', now.toISOString())
    .lte('date', next7Days.toISOString())
    .order('date', { ascending: true });

  if (error) {
    console.error('❌ Error fetching fixtures:', error);
    return;
  }

  if (!fixtures || fixtures.length === 0) {
    console.log('⚠️  No upcoming matches found');
    return;
  }

  console.log(`✅ Found ${fixtures.length} upcoming matches\n`);

  // Calculate update times
  const scheduledUpdates = fixtures.map((fixture) => {
    const matchStart = new Date(fixture.date);
    const updateTime = new Date(matchStart.getTime() + 120 * 60 * 1000); // +120 minutes

    return {
      match_id: fixture.id,
      update_time: updateTime.toISOString(),
      home_team: fixture.home_team,
      away_team: fixture.away_team,
      match_start: fixture.date,
    };
  });

  console.log('📋 Scheduled updates to be created:\n');
  scheduledUpdates.slice(0, 10).forEach((update) => {
    const matchStart = new Date(update.match_start);
    const updateTime = new Date(update.update_time);
    console.log(`  ${update.home_team} vs ${update.away_team}`);
    console.log(`    Match start: ${matchStart.toLocaleString()}`);
    console.log(`    Update time: ${updateTime.toLocaleString()} (120 min after start)`);
    console.log('');
  });

  if (scheduledUpdates.length > 10) {
    console.log(`  ... and ${scheduledUpdates.length - 10} more matches\n`);
  }

  // Clear old scheduled updates
  console.log('🧹 Cleaning old scheduled updates...');
  const { error: deleteError } = await supabase
    .from('scheduled_updates')
    .delete()
    .lt('update_time', now.toISOString());

  if (deleteError) {
    console.error('❌ Error deleting old updates:', deleteError);
  } else {
    console.log('✅ Old updates cleaned\n');
  }

  // Insert new scheduled updates
  console.log(`💾 Inserting ${scheduledUpdates.length} scheduled updates...`);
  const { error: insertError } = await supabase
    .from('scheduled_updates')
    .upsert(scheduledUpdates, {
      onConflict: 'match_id',
      ignoreDuplicates: false
    });

  if (insertError) {
    console.error('❌ Error inserting scheduled updates:', insertError);
    return;
  }

  console.log(`✅ Successfully scheduled ${scheduledUpdates.length} updates\n`);

  // Show next few updates
  console.log('📅 Next scheduled updates:\n');
  const { data: nextUpdates } = await supabase
    .from('scheduled_updates')
    .select('*')
    .gte('update_time', now.toISOString())
    .order('update_time', { ascending: true })
    .limit(5);

  if (nextUpdates && nextUpdates.length > 0) {
    nextUpdates.forEach((update) => {
      const updateTime = new Date(update.update_time);
      const hoursUntil = ((updateTime.getTime() - now.getTime()) / (60 * 60 * 1000)).toFixed(1);
      console.log(`  ${update.home_team} vs ${update.away_team}`);
      console.log(`    Update in: ${hoursUntil} hours (${updateTime.toLocaleString()})`);
      console.log('');
    });
  }

  console.log('✅ Scheduler test completed!');
}

testScheduler().catch(console.error);
