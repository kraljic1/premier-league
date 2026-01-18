import { createClient } from "@supabase/supabase-js";
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAllDuplicates() {
  console.log("=== Checking for Duplicate Fixtures in Database ===\n");

  // Get all fixtures
  const { data: allFixtures, error } = await supabase
    .from("fixtures")
    .select("*")
    .order("season", { ascending: false })
    .order("matchweek", { ascending: true });

  if (error) {
    console.error("Error:", error);
    return;
  }

  if (!allFixtures || allFixtures.length === 0) {
    console.log("No fixtures found");
    return;
  }

  console.log(`Total fixtures in database: ${allFixtures.length}\n`);

  // Group by season first, then check for duplicates within each season
  const bySeason = allFixtures.reduce((acc, fixture) => {
    if (!acc[fixture.season]) {
      acc[fixture.season] = [];
    }
    acc[fixture.season].push(fixture);
    return acc;
  }, {} as Record<string, any[]>);

  console.log("Fixtures by season:");
  Object.entries(bySeason).forEach(([season, fixtures]) => {
    console.log(`  ${season}: ${fixtures.length} fixtures`);
  });

  let totalDuplicates = 0;
  const duplicatesBySeason: Record<string, any[]> = {};

  // Check each season for duplicates
  for (const [season, fixtures] of Object.entries(bySeason)) {
    const groups: Record<string, any[]> = {};
    
    for (const fixture of fixtures) {
      // Key: matchweek + home team + away team
      const key = `${fixture.matchweek}-${fixture.home_team}-${fixture.away_team}`;
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(fixture);
    }

    // Find duplicates in this season
    const duplicateGroups = Object.entries(groups).filter(([_, fixtures]) => fixtures.length > 1);
    
    if (duplicateGroups.length > 0) {
      duplicatesBySeason[season] = duplicateGroups;
      console.log(`\n=== Season ${season}: ${duplicateGroups.length} duplicate groups found ===`);
      
      duplicateGroups.forEach(([key, duplicates]) => {
        console.log(`\n  ${key}:`);
        duplicates.forEach((d, i) => {
          console.log(`    ${i + 1}. ID: ${d.id}, Status: ${d.status}, Date: ${d.date}, Scores: ${d.home_score}-${d.away_score}`);
        });
        totalDuplicates += duplicates.length - 1; // -1 because we keep one
      });
    }
  }

  if (totalDuplicates === 0) {
    console.log("\n✅ No duplicates found within any season!");
  } else {
    console.log(`\n⚠️  Total duplicate fixtures that should be removed: ${totalDuplicates}`);
    console.log("\n🔧 Run the cleanup script to remove these duplicates");
  }

  // Check for inconsistent match counts in current season
  console.log("\n=== Checking Match Counts for Current Season (2024/25) ===");
  
  const currentSeasonFixtures = bySeason['2024/25'] || [];
  const teamMatchCounts: Record<string, number> = {};
  
  currentSeasonFixtures.forEach(f => {
    if (f.status === 'finished' && f.matchweek <= 21) {
      teamMatchCounts[f.home_team] = (teamMatchCounts[f.home_team] || 0) + 1;
      teamMatchCounts[f.away_team] = (teamMatchCounts[f.away_team] || 0) + 1;
    }
  });

  const sortedTeams = Object.entries(teamMatchCounts).sort((a, b) => b[1] - a[1]);
  
  console.log("\nFinished matches per team (MW 1-21, 2024/25):");
  sortedTeams.forEach(([team, count]) => {
    console.log(`  ${team}: ${count} matches`);
  });

  const maxMatches = Math.max(...Object.values(teamMatchCounts));
  const minMatches = Math.min(...Object.values(teamMatchCounts));
  
  if (maxMatches !== minMatches) {
    console.log(`\n⚠️  Match count range: ${minMatches} to ${maxMatches}`);
    console.log("Some teams have postponed matches, which is normal.");
    
    const teamsWithPostponed = sortedTeams.filter(([_, count]) => count < maxMatches);
    console.log(`\nTeams with postponed matches:`);
    teamsWithPostponed.forEach(([team, count]) => {
      console.log(`  ${team}: ${maxMatches - count} postponed`);
    });
  } else {
    console.log(`\n✅ All teams have played ${maxMatches} matches`);
  }
}

checkAllDuplicates().catch(console.error);
