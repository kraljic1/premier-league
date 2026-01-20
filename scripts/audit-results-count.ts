/**
 * Audit script to check why results count doesn't match expected values.
 * 
 * Usage: npx tsx scripts/audit-results-count.ts
 */

import { config } from "dotenv";
import { resolve } from "path";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../lib/supabase";
import {
  getCurrentSeasonFilter,
  getCurrentSeasonStartDate,
  getCurrentSeasonEndDate,
  getCurrentSeasonFull,
} from "../lib/utils/season-utils";
import { normalizeClubName } from "../lib/utils/club-name-utils";

config({ path: resolve(__dirname, "../.env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabaseServer = createClient<Database>(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// Same logic as the API
function normalizeCompetition(competition: string | null | undefined): string {
  return competition || "Premier League";
}

function buildNormalizedFixtureId(
  homeTeam: string,
  awayTeam: string,
  date: string
): string {
  const dateOnly = date.split("T")[0];
  return `${homeTeam}-${awayTeam}-${dateOnly}`.toLowerCase().replace(/\s+/g, "-");
}

async function main() {
  if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase environment variables.");
    process.exit(1);
  }

  const seasonFilter = getCurrentSeasonFilter();
  const seasonStart = getCurrentSeasonStartDate();
  const seasonEnd = getCurrentSeasonEndDate();
  const currentSeason = getCurrentSeasonFull();

  console.log("=== Results Count Audit ===");
  console.log(`Current Season: ${currentSeason}`);
  console.log(`Season Filter: ${seasonFilter}`);
  console.log(`Date Range: ${seasonStart.toISOString()} to ${seasonEnd.toISOString()}`);
  console.log("");

  // Query 1: Total fixtures in current season (using exact API query)
  const { data: allFixtures, error: allFixturesError } = await supabaseServer
    .from('fixtures')
    .select('*')
    .or(seasonFilter)
    .gte('date', seasonStart.toISOString())
    .lte('date', seasonEnd.toISOString())
    .order('date', { ascending: true });

  if (allFixturesError) {
    console.error("Error fetching fixtures:", allFixturesError);
    process.exit(1);
  }

  console.log("=== Database Counts (with season + date filter) ===");
  console.log(`Total fixtures: ${allFixtures?.length || 0}`);

  // Group by competition
  const byCompetition = new Map<string, { total: number; finished: number; upcoming: number }>();
  for (const fixture of allFixtures || []) {
    const comp = fixture.competition || "Premier League";
    const entry = byCompetition.get(comp) || { total: 0, finished: 0, upcoming: 0 };
    entry.total++;
    if (fixture.status === 'finished') {
      entry.finished++;
    } else {
      entry.upcoming++;
    }
    byCompetition.set(comp, entry);
  }

  console.log("\nBy Competition:");
  for (const [comp, counts] of Array.from(byCompetition.entries()).sort((a, b) => b[1].total - a[1].total)) {
    console.log(`  ${comp}: ${counts.total} total (${counts.finished} finished, ${counts.upcoming} upcoming)`);
  }

  // Filter Premier League only (like the API does)
  const premierLeagueFixtures = (allFixtures || []).filter(
    (row) => normalizeCompetition(row.competition) === "Premier League"
  );
  const plFinished = premierLeagueFixtures.filter(f => f.status === 'finished');
  const plUpcoming = premierLeagueFixtures.filter(f => f.status !== 'finished');

  console.log("\n=== Premier League Only (after filtering) ===");
  console.log(`Total PL fixtures: ${premierLeagueFixtures.length}`);
  console.log(`PL Finished (results): ${plFinished.length}`);
  console.log(`PL Upcoming (fixtures): ${plUpcoming.length}`);

  // Check for duplicates based on team names + date (like API does)
  const seen = new Set<string>();
  const duplicates: string[] = [];
  
  for (const fixture of plFinished) {
    const normalizedHomeTeam = normalizeClubName(fixture.home_team);
    const normalizedAwayTeam = normalizeClubName(fixture.away_team);
    const id = buildNormalizedFixtureId(normalizedHomeTeam, normalizedAwayTeam, fixture.date);
    
    if (seen.has(id)) {
      duplicates.push(`${id} (${fixture.id})`);
    }
    seen.add(id);
  }

  if (duplicates.length > 0) {
    console.log("\n=== DUPLICATES FOUND (after normalization) ===");
    console.log(`Found ${duplicates.length} duplicates:`);
    duplicates.forEach(d => console.log(`  - ${d}`));
  } else {
    console.log("\n✓ No duplicates found after normalization");
  }

  // Check matchweek distribution
  const matchweekCounts = new Map<number, number>();
  for (const fixture of plFinished) {
    const mw = fixture.original_matchweek || fixture.matchweek;
    matchweekCounts.set(mw, (matchweekCounts.get(mw) || 0) + 1);
  }

  console.log("\n=== Matchweek Distribution (Results) ===");
  const abnormalMW = [];
  for (const [mw, count] of Array.from(matchweekCounts.entries()).sort((a, b) => a[0] - b[0])) {
    if (count !== 10) {
      console.log(`  MW ${mw}: ${count} matches ⚠️`);
      abnormalMW.push({ mw, count });
    } else {
      console.log(`  MW ${mw}: ${count} matches ✓`);
    }
  }

  if (abnormalMW.length === 0) {
    console.log("\n✓ All matchweeks have exactly 10 matches");
  }

  // Summary
  console.log("\n=== SUMMARY ===");
  console.log(`Expected: 380 total, 220 results (MW 1-22), 160 upcoming (MW 23-38)`);
  console.log(`Actual PL: ${premierLeagueFixtures.length} total, ${plFinished.length} results, ${plUpcoming.length} upcoming`);
  
  if (premierLeagueFixtures.length === 380 && plFinished.length === 220 && plUpcoming.length === 160) {
    console.log("\n✓ All counts are CORRECT in the database!");
    console.log("If the UI shows different numbers, the problem is in:");
    console.log("  1. Browser cache (clear with Ctrl+Shift+Del)");
    console.log("  2. Netlify function cache (redeploy)");
    console.log("  3. API response caching headers");
  } else {
    console.log("\n⚠️ Database counts don't match expected values!");
  }
}

main().catch((error) => {
  console.error("Audit failed:", error);
  process.exit(1);
});
