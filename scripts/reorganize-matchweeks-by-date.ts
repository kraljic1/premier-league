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

/**
 * Strategy: Reassign matchweeks based on chronological order of match dates
 * Each "round" of 10 matches (one for each pair of teams) = 1 matchweek
 */
async function reorganizeMatchweeksByDate() {
  console.log("=== Reorganizing Matchweeks by Date ===\n");

  // Get all fixtures for 2024/25, sorted by date
  const { data: allFixtures, error } = await supabase
    .from("fixtures")
    .select("*")
    .eq("season", "2024/25")
    .order("date", { ascending: true });

  if (error || !allFixtures) {
    console.error("Error:", error);
    return;
  }

  console.log(`Total fixtures: ${allFixtures.length}\n`);

  // Group fixtures by date
  const fixturesByDate: Record<string, any[]> = {};
  allFixtures.forEach(f => {
    const date = f.date.split('T')[0]; // Get just the date part
    if (!fixturesByDate[date]) {
      fixturesByDate[date] = [];
    }
    fixturesByDate[date].push(f);
  });

  // Get unique dates sorted
  const dates = Object.keys(fixturesByDate).sort();

  console.log(`Matches span ${dates.length} different dates\n`);
  console.log("Current distribution of matches by date:\n");

  dates.slice(0, 30).forEach((date, index) => {
    const count = fixturesByDate[date].length;
    console.log(`  ${index + 1}. ${date}: ${count} matches`);
  });

  console.log("\n...\n");

  // Strategy: Group dates into matchweeks
  // Typically, a matchweek happens over a few days (Friday-Monday)
  let currentMatchweek = 1;
  const matchweekRanges: Array<{ mw: number; startDate: string; endDate: string; count: number }> = [];
  
  // Heuristic: dates within 4 days of each other belong to same matchweek
  const DAYS_THRESHOLD = 4;
  
  let currentMWStart = dates[0];
  let currentMWEnd = dates[0];
  let currentMWCount = 0;
  
  console.log("\n=== Proposed Matchweek Groupings ===\n");

  for (let i = 0; i < dates.length; i++) {
    const date = dates[i];
    const matchCount = fixturesByDate[date].length;
    
    // Check if this date is within threshold of current matchweek end
    const daysDiff = (new Date(date).getTime() - new Date(currentMWEnd).getTime()) / (1000 * 60 * 60 * 24);
    
    if (daysDiff <= DAYS_THRESHOLD && currentMWCount + matchCount <= 10) {
      // Add to current matchweek
      currentMWEnd = date;
      currentMWCount += matchCount;
    } else {
      // Start new matchweek
      if (currentMWCount > 0) {
        matchweekRanges.push({
          mw: currentMatchweek,
          startDate: currentMWStart,
          endDate: currentMWEnd,
          count: currentMWCount
        });
        console.log(`MW ${currentMatchweek}: ${currentMWStart} to ${currentMWEnd} (${currentMWCount} matches)`);
        currentMatchweek++;
      }
      
      currentMWStart = date;
      currentMWEnd = date;
      currentMWCount = matchCount;
    }
  }
  
  // Add last matchweek
  if (currentMWCount > 0) {
    matchweekRanges.push({
      mw: currentMatchweek,
      startDate: currentMWStart,
      endDate: currentMWEnd,
      count: currentMWCount
    });
    console.log(`MW ${currentMatchweek}: ${currentMWStart} to ${currentMWEnd} (${currentMWCount} matches)`);
  }

  console.log(`\nTotal proposed matchweeks: ${matchweekRanges.length}`);
  console.log("\n⚠️  This script provides analysis only. To actually update the database:");
  console.log("1. Review the proposed matchweek groupings above");
  console.log("2. Compare with official Premier League fixture list");
  console.log("3. Create a manual mapping or update script");
  console.log("4. Test on a backup database first!");
  
  console.log("\n📝 Alternative: Use the official Premier League fixture data");
  console.log("   - Scrape from premierleague.com");
  console.log("   - Use Fantasy Premier League API");
  console.log("   - Match fixtures by teams + approximate date");
}

reorganizeMatchweeksByDate().catch(console.error);
