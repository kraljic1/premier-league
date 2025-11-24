// Script to list all matches stored in the database
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

async function listMatches() {
  console.log('Fetching all matches from database...\n');
  
  // Get all matches
  const { data: matches, error } = await supabase
    .from('fixtures')
    .select('*')
    .order('matchweek', { ascending: true })
    .order('date', { ascending: true });
  
  if (error) {
    console.error('Error:', error);
    return;
  }
  
  if (!matches || matches.length === 0) {
    console.log('No matches found in database.');
    return;
  }
  
  console.log(`Total matches: ${matches.length}\n`);
  console.log('='.repeat(80));
  
  // Group by matchweek
  const byMatchweek = {};
  matches.forEach(match => {
    if (!byMatchweek[match.matchweek]) {
      byMatchweek[match.matchweek] = [];
    }
    byMatchweek[match.matchweek].push(match);
  });
  
  // Display matches grouped by matchweek
  Object.keys(byMatchweek).sort((a, b) => parseInt(a) - parseInt(b)).forEach(mw => {
    const mwMatches = byMatchweek[mw];
    console.log(`\n📅 MATCHWEEK ${mw} (${mwMatches.length} matches)`);
    console.log('-'.repeat(80));
    
    mwMatches.forEach((match, index) => {
      const date = new Date(match.date);
      const dateStr = date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      
      const score = match.home_score !== null && match.away_score !== null
        ? `${match.home_score} - ${match.away_score}`
        : 'TBD';
      
      const status = match.status === 'finished' ? '✅' : match.status === 'live' ? '🔴' : '⏰';
      
      console.log(`${index + 1}. ${status} ${match.home_team} vs ${match.away_team}`);
      console.log(`   Score: ${score} | Date: ${dateStr} | Status: ${match.status}`);
      console.log(`   ID: ${match.id}`);
      if (match.is_derby) {
        console.log('   🏆 DERBY MATCH');
      }
      console.log('');
    });
  });
  
  // Summary
  console.log('\n' + '='.repeat(80));
  console.log('\nSUMMARY:');
  console.log(`Total matches: ${matches.length}`);
  console.log(`Matchweeks covered: ${Object.keys(byMatchweek).length}`);
  Object.keys(byMatchweek).sort((a, b) => parseInt(a) - parseInt(b)).forEach(mw => {
    console.log(`  Matchweek ${mw}: ${byMatchweek[mw].length} matches`);
  });
  
  // Check for issues
  console.log('\n' + '='.repeat(80));
  console.log('\nVALIDATION:');
  
  // Check for matchweeks with more than 10 matches
  Object.keys(byMatchweek).forEach(mw => {
    const count = byMatchweek[mw].length;
    if (count > 10) {
      console.log(`⚠️  Matchweek ${mw} has ${count} matches (should be max 10)`);
    }
  });
  
  // Check for duplicate team combinations
  const teamPairs = new Map();
  matches.forEach(match => {
    const pair = `${match.home_team} vs ${match.away_team}`;
    if (!teamPairs.has(pair)) {
      teamPairs.set(pair, []);
    }
    teamPairs.get(pair).push(match);
  });
  
  const duplicates = Array.from(teamPairs.entries()).filter(([pair, matches]) => matches.length > 1);
  if (duplicates.length > 0) {
    console.log(`\n⚠️  Found ${duplicates.length} duplicate team pairs:`);
    duplicates.forEach(([pair, matchList]) => {
      console.log(`  ${pair}: ${matchList.length} times`);
      matchList.forEach(m => {
        console.log(`    - MW ${m.matchweek}, ${m.date}, ID: ${m.id}`);
      });
    });
  } else {
    console.log('✓ No duplicate team pairs found');
  }
}

listMatches().catch(console.error);

