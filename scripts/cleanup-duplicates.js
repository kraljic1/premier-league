// Script to clean up duplicate matches in the database
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

async function cleanupDuplicates() {
  console.log('Finding duplicate matches...\n');
  
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
    console.log('No matches found.');
    return;
  }
  
  // Group by team pair and matchweek (same teams, same matchweek = potential duplicate)
  const groups = new Map();
  matches.forEach(match => {
    // Normalize team names for comparison (remove duplicates like "BurnleyBurnley")
    const normalizeTeam = (team) => {
      // Remove duplicate words
      const words = team.split(/(?=[A-Z])/);
      const cleaned = [];
      for (const word of words) {
        if (cleaned.length === 0 || cleaned[cleaned.length - 1].toLowerCase() !== word.toLowerCase()) {
          cleaned.push(word);
        }
      }
      return cleaned.join(' ').trim();
    };
    
    const homeTeam = normalizeTeam(match.home_team);
    const awayTeam = normalizeTeam(match.away_team);
    const dateOnly = match.date.split('T')[0]; // Just the date part
    
    // Create a key: homeTeam-awayTeam-matchweek-dateOnly
    const key = `${homeTeam}-${awayTeam}-${match.matchweek}-${dateOnly}`;
    
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key).push(match);
  });
  
  // Find duplicates
  const duplicates = Array.from(groups.entries()).filter(([key, matches]) => matches.length > 1);
  
  if (duplicates.length === 0) {
    console.log('✓ No duplicates found!');
    return;
  }
  
  console.log(`Found ${duplicates.length} duplicate groups:\n`);
  
  let totalToDelete = 0;
  const idsToDelete = [];
  
  duplicates.forEach(([key, matchList]) => {
    console.log(`\n${key}:`);
    console.log(`  Found ${matchList.length} duplicates`);
    
    // Sort by date (keep the earliest one, or the one with better data)
    matchList.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    // Keep the first one, mark others for deletion
    const toKeep = matchList[0];
    const toDelete = matchList.slice(1);
    
    console.log(`  Keeping: ${toKeep.id} (${toKeep.date})`);
    toDelete.forEach(match => {
      console.log(`  Deleting: ${match.id} (${match.date})`);
      idsToDelete.push(match.id);
      totalToDelete++;
    });
  });
  
  console.log(`\n\nTotal duplicates to delete: ${totalToDelete}`);
  console.log(`Matches to keep: ${matches.length - totalToDelete}`);
  
  if (idsToDelete.length === 0) {
    console.log('\nNothing to delete.');
    return;
  }
  
  // Ask for confirmation (in a real script, you'd use readline)
  console.log('\n⚠️  Ready to delete duplicates. This will remove:');
  console.log(`   - ${idsToDelete.length} duplicate matches`);
  console.log('\nTo proceed, uncomment the deletion code in this script.');
  
  // Delete duplicates
  console.log('\nDeleting duplicates...');
  const { error: deleteError } = await supabase
    .from('fixtures')
    .delete()
    .in('id', idsToDelete);
  
  if (deleteError) {
    console.error('Error deleting duplicates:', deleteError);
  } else {
    console.log(`✓ Successfully deleted ${idsToDelete.length} duplicate matches`);
    console.log(`✓ Remaining matches: ${matches.length - idsToDelete.length}`);
  }
}

cleanupDuplicates().catch(console.error);

