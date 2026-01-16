import { config } from "dotenv";
import { resolve } from "path";
import { createClient } from "@supabase/supabase-js";

// Load environment variables
config({ path: resolve(__dirname, "../.env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Mapping of various team name variations to canonical names
 * The canonical names match those in lib/clubs.ts
 */
const TEAM_NAME_MAPPING: Record<string, string> = {
  // Arsenal - no variations needed
  "Arsenal": "Arsenal",
  
  // Aston Villa
  "Aston Villa": "Aston Villa",
  
  // Bournemouth
  "Bournemouth": "Bournemouth",
  "AFC Bournemouth": "Bournemouth",
  
  // Brentford
  "Brentford": "Brentford",
  
  // Brighton
  "Brighton": "Brighton & Hove Albion",
  "Brighton & Hove Albion": "Brighton & Hove Albion",
  "Brighton Hove Albion": "Brighton & Hove Albion",
  
  // Chelsea
  "Chelsea": "Chelsea",
  "Chelsea FC": "Chelsea",
  
  // Crystal Palace
  "Crystal Palace": "Crystal Palace",
  
  // Everton
  "Everton": "Everton",
  "Everton FC": "Everton",
  
  // Fulham
  "Fulham": "Fulham",
  "Fulham FC": "Fulham",
  
  // Ipswich
  "Ipswich": "Ipswich Town",
  "Ipswich Town": "Ipswich Town",
  
  // Leicester
  "Leicester": "Leicester City",
  "Leicester City": "Leicester City",
  
  // Liverpool
  "Liverpool": "Liverpool",
  "Liverpool FC": "Liverpool",
  "Liverpool F.C.": "Liverpool",
  
  // Manchester City
  "Manchester City": "Manchester City",
  "Man City": "Manchester City",
  "Man. City": "Manchester City",
  
  // Manchester United
  "Manchester United": "Manchester United",
  "Manchester Utd": "Manchester United",
  "Man United": "Manchester United",
  "Man Utd": "Manchester United",
  "Man. United": "Manchester United",
  
  // Newcastle
  "Newcastle": "Newcastle United",
  "Newcastle United": "Newcastle United",
  "Newcastle Utd": "Newcastle United",
  
  // Nottingham Forest
  "Nottingham Forest": "Nottingham Forest",
  "Nottingham": "Nottingham Forest",
  "Nott'm Forest": "Nottingham Forest",
  
  // Southampton
  "Southampton": "Southampton",
  "Southampton FC": "Southampton",
  
  // Tottenham
  "Tottenham": "Tottenham Hotspur",
  "Tottenham Hotspur": "Tottenham Hotspur",
  "Spurs": "Tottenham Hotspur",
  
  // West Ham
  "West Ham": "West Ham United",
  "West Ham United": "West Ham United",
  "West Ham Utd": "West Ham United",
  
  // Wolves
  "Wolves": "Wolverhampton Wanderers",
  "Wolverhampton": "Wolverhampton Wanderers",
  "Wolverhampton Wanderers": "Wolverhampton Wanderers",
  "Wolverhampton W.": "Wolverhampton Wanderers",
  
  // Teams not in current Premier League (keep as-is or map to known names)
  "Burnley": "Burnley",
  "Leeds": "Leeds United",
  "Leeds United": "Leeds United",
  "Sunderland": "Sunderland",
};

async function normalizeTeamNames() {
  console.log("Starting team name normalization...\n");

  // Get all fixtures
  const { data: fixtures, error } = await supabase
    .from("fixtures")
    .select("*");

  if (error) {
    console.error("Error fetching fixtures:", error);
    return;
  }

  console.log(`Found ${fixtures?.length || 0} fixtures to process\n`);

  let updatedCount = 0;
  const updates: any[] = [];

  // Process each fixture
  for (const fixture of fixtures || []) {
    const originalHome = fixture.home_team;
    const originalAway = fixture.away_team;
    
    const normalizedHome = TEAM_NAME_MAPPING[originalHome] || originalHome;
    const normalizedAway = TEAM_NAME_MAPPING[originalAway] || originalAway;
    
    // Check if normalization is needed
    if (normalizedHome !== originalHome || normalizedAway !== originalAway) {
      console.log(`Normalizing: "${originalHome}" vs "${originalAway}" -> "${normalizedHome}" vs "${normalizedAway}"`);
      
      updates.push({
        id: fixture.id,
        home_team: normalizedHome,
        away_team: normalizedAway,
        // Keep all other fields
        date: fixture.date,
        home_score: fixture.home_score,
        away_score: fixture.away_score,
        matchweek: fixture.matchweek,
        status: fixture.status,
        is_derby: fixture.is_derby,
      });
      
      updatedCount++;
    }
  }

  if (updates.length > 0) {
    console.log(`\nUpdating ${updates.length} fixtures...`);
    
    // Update in batches of 100
    const batchSize = 100;
    for (let i = 0; i < updates.length; i += batchSize) {
      const batch = updates.slice(i, i + batchSize);
      
      const { error: updateError } = await supabase
        .from("fixtures")
        .upsert(batch, { onConflict: "id" });
      
      if (updateError) {
        console.error(`Error updating batch ${i / batchSize + 1}:`, updateError);
      } else {
        console.log(`Updated batch ${i / batchSize + 1} (${batch.length} fixtures)`);
      }
    }
    
    console.log(`\n✓ Successfully normalized ${updatedCount} fixtures`);
  } else {
    console.log("\n✓ No fixtures need normalization");
  }

  // Show final team names
  console.log("\nChecking final team names...");
  const { data: finalFixtures } = await supabase
    .from("fixtures")
    .select("home_team, away_team");

  const finalTeamNames = new Set<string>();
  finalFixtures?.forEach((f) => {
    if (f.home_team) finalTeamNames.add(f.home_team);
    if (f.away_team) finalTeamNames.add(f.away_team);
  });

  console.log(`\nFinal unique team names (${finalTeamNames.size}):`);
  Array.from(finalTeamNames).sort().forEach((name) => {
    console.log(`  - ${name}`);
  });
}

normalizeTeamNames().catch(console.error);
