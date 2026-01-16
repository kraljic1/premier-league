// Comprehensive script to check all fixtures in database
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Read .env.local file manually
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
  }
}

loadEnv();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAllFixtures() {
  console.log('='.repeat(60));
  console.log('COMPREHENSIVE DATABASE CHECK');
  console.log('='.repeat(60));
  console.log();
  
  // Get ALL fixtures
  const { data: allFixtures, error: allError } = await supabase
    .from('fixtures')
    .select('*')
    .order('date', { ascending: true });
  
  if (allError) {
    console.error('Error fetching fixtures:', allError);
    return;
  }
  
  if (!allFixtures || allFixtures.length === 0) {
    console.log('❌ No fixtures found in database.');
    return;
  }
  
  console.log(`📊 TOTAL FIXTURES IN DATABASE: ${allFixtures.length}`);
  console.log();
  
  // Group by status
  const byStatus = {
    finished: allFixtures.filter(f => f.status === 'finished'),
    scheduled: allFixtures.filter(f => f.status === 'scheduled'),
    live: allFixtures.filter(f => f.status === 'live'),
  };
  
  console.log('📈 BY STATUS:');
  console.log(`  ✅ Finished: ${byStatus.finished.length}`);
  console.log(`  📅 Scheduled: ${byStatus.scheduled.length}`);
  console.log(`  🔴 Live: ${byStatus.live.length}`);
  console.log();
  
  // Group by matchweek
  const byMatchweek = {};
  allFixtures.forEach(fixture => {
    if (!byMatchweek[fixture.matchweek]) {
      byMatchweek[fixture.matchweek] = {
        total: 0,
        finished: 0,
        scheduled: 0,
        live: 0
      };
    }
    byMatchweek[fixture.matchweek].total++;
    if (fixture.status === 'finished') byMatchweek[fixture.matchweek].finished++;
    if (fixture.status === 'scheduled') byMatchweek[fixture.matchweek].scheduled++;
    if (fixture.status === 'live') byMatchweek[fixture.matchweek].live++;
  });
  
  const matchweeks = Object.keys(byMatchweek).map(Number).sort((a, b) => a - b);
  
  console.log('📅 BY MATCHWEEK:');
  matchweeks.forEach(mw => {
    const stats = byMatchweek[mw];
    const expected = 10; // Premier League has 20 teams = 10 matches per matchweek
    const status = stats.total === expected ? '✓' : '⚠️';
    console.log(`  MW ${mw.toString().padStart(2, ' ')}: ${stats.total.toString().padStart(3, ' ')} total (${stats.finished} finished, ${stats.scheduled} scheduled, ${stats.live} live) ${status}`);
  });
  console.log();
  
  // Date range
  const dates = allFixtures.map(f => new Date(f.date)).sort((a, b) => a - b);
  const earliest = dates[0];
  const latest = dates[dates.length - 1];
  
  console.log('📆 DATE RANGE:');
  console.log(`  Earliest: ${earliest.toISOString().split('T')[0]}`);
  console.log(`  Latest: ${latest.toISOString().split('T')[0]}`);
  console.log();
  
  // Check for duplicates
  console.log('🔍 CHECKING FOR DUPLICATES...');
  const seenIds = new Set();
  const duplicates = [];
  
  allFixtures.forEach(fixture => {
    if (seenIds.has(fixture.id)) {
      duplicates.push(fixture);
    } else {
      seenIds.add(fixture.id);
    }
  });
  
  if (duplicates.length > 0) {
    console.log(`  ⚠️  Found ${duplicates.length} duplicate IDs:`);
    duplicates.slice(0, 5).forEach(dup => {
      console.log(`    - ${dup.id}: ${dup.home_team} vs ${dup.away_team} (MW ${dup.matchweek})`);
    });
  } else {
    console.log('  ✓ No duplicate IDs found');
  }
  console.log();
  
  // Summary
  console.log('='.repeat(60));
  console.log('SUMMARY:');
  console.log(`  Total fixtures: ${allFixtures.length}`);
  console.log(`  Finished (Results): ${byStatus.finished.length}`);
  console.log(`  Upcoming (Scheduled + Live): ${byStatus.scheduled.length + byStatus.live.length}`);
  console.log(`  Matchweeks covered: ${matchweeks[0]} - ${matchweeks[matchweeks.length - 1]} (${matchweeks.length} matchweeks)`);
  console.log('='.repeat(60));
  
  // Expected counts
  const expectedTotal = 38 * 10; // 38 matchweeks * 10 matches = 380 total fixtures
  const expectedFinished = Math.floor((new Date() - earliest) / (1000 * 60 * 60 * 24 * 7)) * 10; // Rough estimate
  
  console.log();
  console.log('💡 EXPECTED COUNTS (for full season):');
  console.log(`  Total fixtures: ~380 (38 matchweeks × 10 matches)`);
  console.log(`  Current season progress: ~${Math.round((allFixtures.length / expectedTotal) * 100)}%`);
  console.log();
}

checkAllFixtures().catch(console.error);
