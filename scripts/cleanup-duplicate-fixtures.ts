import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Normalize team names to handle variations
 */
function normalizeTeamName(name: string): string {
  let normalized = name
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
  
  // Team-specific normalizations
  const teamMappings: Record<string, string> = {
    "manchester united": "man utd",
    "manchester utd": "man utd",
    "man utd": "man utd",
    "manchester city": "man city",
    "man city": "man city",
    "liverpool fc": "liverpool",
    "liverpool": "liverpool",
    "tottenham hotspur": "tottenham",
    "tottenham": "tottenham",
    "west ham united": "west ham",
    "west ham": "west ham",
    "wolverhampton wanderers": "wolves",
    "wolves": "wolves",
    "newcastle united": "newcastle",
    "newcastle": "newcastle",
    "leeds united": "leeds",
    "leeds": "leeds",
    "brighton & hove albion": "brighton",
    "brighton": "brighton",
    "afc bournemouth": "bournemouth",
    "bournemouth": "bournemouth",
    "nottingham forest": "nottingham",
    "crystal palace": "palace",
  };
  
  return teamMappings[normalized] || normalized;
}

async function cleanupDuplicates() {
  console.log("=== Cleaning Up Duplicate Fixtures ===\n");

  // Get all scheduled fixtures
  const { data: fixtures, error } = await supabase
    .from("fixtures")
    .select("*")
    .eq("status", "scheduled")
    .order("date", { ascending: true });

  if (error) {
    console.error("Error fetching fixtures:", error);
    return;
  }

  if (!fixtures || fixtures.length === 0) {
    console.log("No scheduled fixtures found");
    return;
  }

  console.log(`Found ${fixtures.length} scheduled fixtures`);

  // Group by matchweek, date, and teams to find duplicates
  const groups: Record<string, any[]> = {};

  for (const fixture of fixtures) {
    const homeNorm = normalizeTeamName(fixture.home_team);
    const awayNorm = normalizeTeamName(fixture.away_team);
    const date = new Date(fixture.date).toISOString().split("T")[0]; // Just date, not time
    
    const key = `${fixture.matchweek}-${date}-${homeNorm}-${awayNorm}`;
    
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(fixture);
  }

  // Find duplicates
  const duplicateGroups = Object.entries(groups).filter(([_, fixtures]) => fixtures.length > 1);

  if (duplicateGroups.length === 0) {
    console.log("No duplicates found!");
    return;
  }

  console.log(`\nFound ${duplicateGroups.length} duplicate groups:\n`);

  let totalDeleted = 0;

  for (const [key, duplicates] of duplicateGroups) {
    console.log(`Group: ${key}`);
    console.log(`  ${duplicates.length} duplicates:`);
    
    duplicates.forEach((d, i) => {
      console.log(`    ${i + 1}. ${d.home_team} vs ${d.away_team} (ID: ${d.id})`);
    });

    // Keep the first one, delete the rest
    const toKeep = duplicates[0];
    const toDelete = duplicates.slice(1);

    console.log(`  Keeping: ${toKeep.id}`);
    console.log(`  Deleting: ${toDelete.map(d => d.id).join(", ")}`);

    for (const fixture of toDelete) {
      const { error: deleteError } = await supabase
        .from("fixtures")
        .delete()
        .eq("id", fixture.id);

      if (deleteError) {
        console.error(`  Error deleting ${fixture.id}:`, deleteError);
      } else {
        totalDeleted++;
      }
    }

    console.log();
  }

  console.log(`\n✅ Deleted ${totalDeleted} duplicate fixtures`);

  // Verify
  const { data: afterCleanup, error: verifyError } = await supabase
    .from("fixtures")
    .select("matchweek")
    .eq("status", "scheduled");

  if (!verifyError && afterCleanup) {
    const matchweekDist = afterCleanup.reduce((acc: Record<number, number>, f: any) => {
      acc[f.matchweek] = (acc[f.matchweek] || 0) + 1;
      return acc;
    }, {});

    console.log("\nFinal matchweek distribution:");
    Object.keys(matchweekDist).sort((a, b) => parseInt(a) - parseInt(b)).forEach(mw => {
      console.log(`  Matchweek ${mw}: ${matchweekDist[parseInt(mw)]} matches`);
    });
    console.log(`\nTotal scheduled fixtures: ${afterCleanup.length}`);
  }
}

cleanupDuplicates().catch(console.error);
