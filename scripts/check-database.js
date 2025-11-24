// Quick script to check what's in the database
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

async function checkDatabase() {
  console.log('Checking database for finished matches...\n');
  
  // Get all finished matches
  const { data: results, error } = await supabase
    .from('fixtures')
    .select('*')
    .eq('status', 'finished')
    .order('matchweek', { ascending: true })
    .order('date', { ascending: true });
  
  if (error) {
    console.error('Error:', error);
    return;
  }
  
  if (!results || results.length === 0) {
    console.log('No finished matches found in database.');
    return;
  }
  
  console.log(`Found ${results.length} finished matches\n`);
  
  // Group by matchweek
  const byMatchweek = {};
  results.forEach(match => {
    if (!byMatchweek[match.matchweek]) {
      byMatchweek[match.matchweek] = [];
    }
    byMatchweek[match.matchweek].push(match);
  });
  
  // Show summary
  console.log('Matches by matchweek:');
  Object.keys(byMatchweek).sort((a, b) => parseInt(a) - parseInt(b)).forEach(mw => {
    console.log(`  Matchweek ${mw}: ${byMatchweek[mw].length} matches`);
  });
  
  // Check for potential duplicates (same teams, same date, different matchweek)
  console.log('\nChecking for potential duplicates (same teams, different matchweek)...');
  const duplicates = [];
  for (let i = 0; i < results.length; i++) {
    for (let j = i + 1; j < results.length; j++) {
      const match1 = results[i];
      const match2 = results[j];
      if (
        match1.home_team === match2.home_team &&
        match1.away_team === match2.away_team &&
        match1.date === match2.date &&
        match1.matchweek !== match2.matchweek
      ) {
        duplicates.push({
          teams: `${match1.home_team} vs ${match1.away_team}`,
          date: match1.date,
          matchweeks: [match1.matchweek, match2.matchweek]
        });
      }
    }
  }
  
  if (duplicates.length > 0) {
    console.log(`Found ${duplicates.length} potential duplicates:`);
    duplicates.forEach(dup => {
      console.log(`  ${dup.teams} on ${dup.date} - labeled as MW ${dup.matchweeks.join(' and ')}`);
    });
  } else {
    console.log('No duplicates found.');
  }
  
  // Show sample matches
  console.log('\nSample matches:');
  results.slice(0, 5).forEach(match => {
    console.log(`  MW ${match.matchweek}: ${match.home_team} ${match.home_score || '?'} - ${match.away_score || '?'} ${match.away_team} (${match.date})`);
  });
}

checkDatabase().catch(console.error);

