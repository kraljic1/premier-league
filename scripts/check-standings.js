// Script to check standings in database
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

async function checkStandings() {
  console.log('='.repeat(60));
  console.log('CHECKING STANDINGS IN DATABASE');
  console.log('='.repeat(60));
  console.log();
  
  // Get all standings for season 2025
  const { data: standings, error } = await supabase
    .from('standings')
    .select('*')
    .eq('season', '2025')
    .order('position', { ascending: true });
  
  if (error) {
    console.error('Error fetching standings:', error);
    return;
  }
  
  if (!standings || standings.length === 0) {
    console.log('❌ No standings found in database for season 2025.');
    console.log();
    console.log('Checking all seasons...');
    
    const { data: allStandings, error: allError } = await supabase
      .from('standings')
      .select('season, position, club')
      .order('season', { ascending: false })
      .order('position', { ascending: true });
    
    if (allError) {
      console.error('Error:', allError);
      return;
    }
    
    if (allStandings && allStandings.length > 0) {
      const bySeason = {};
      allStandings.forEach(s => {
        if (!bySeason[s.season]) {
          bySeason[s.season] = [];
        }
        bySeason[s.season].push(s);
      });
      
      console.log('Found standings for seasons:');
      Object.keys(bySeason).forEach(season => {
        console.log(`  Season ${season}: ${bySeason[season].length} teams`);
      });
    } else {
      console.log('❌ No standings found in database at all.');
    }
    return;
  }
  
  console.log(`✅ Found ${standings.length} standings for season 2025\n`);
  
  console.log('📊 STANDINGS TABLE:');
  console.log('-'.repeat(60));
  console.log('Pos | Club                    | P  | W  | D  | L  | GF | GA | GD | Pts | Form');
  console.log('-'.repeat(60));
  
  standings.forEach(standing => {
    const club = standing.club.padEnd(22);
    const form = standing.form || '-----';
    console.log(
      `${standing.position.toString().padStart(3)} | ${club} | ${standing.played.toString().padStart(2)} | ${standing.won.toString().padStart(2)} | ${standing.drawn.toString().padStart(2)} | ${standing.lost.toString().padStart(2)} | ${standing.goals_for.toString().padStart(2)} | ${standing.goals_against.toString().padStart(2)} | ${standing.goal_difference >= 0 ? '+' : ''}${standing.goal_difference.toString().padStart(2)} | ${standing.points.toString().padStart(3)} | ${form}`
    );
  });
  
  console.log('-'.repeat(60));
  console.log();
  
  // Check cache metadata
  const { data: cacheMeta, error: cacheError } = await supabase
    .from('cache_metadata')
    .select('*')
    .eq('key', 'standings')
    .single();
  
  if (!cacheError && cacheMeta) {
    console.log('📅 CACHE METADATA:');
    console.log(`  Last updated: ${cacheMeta.last_updated}`);
    console.log(`  Data count: ${cacheMeta.data_count}`);
    console.log();
  }
}

checkStandings().catch(console.error);
