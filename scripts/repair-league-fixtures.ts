/**
 * Normalize team names, dedupe, and rebuild matchweeks for current season.
 *
 * Usage:
 *   npx tsx scripts/repair-league-fixtures.ts --execute
 *   npx tsx scripts/repair-league-fixtures.ts --dry-run
 */

import { config } from "dotenv";
import { resolve } from "path";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../lib/supabase";
import {
  getCurrentSeasonFilter,
  getCurrentSeasonStartDate,
  getCurrentSeasonEndDate,
} from "../lib/utils/season-utils";

config({ path: resolve(__dirname, "../.env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabaseServer = createClient<Database>(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

type FixtureRow = Database["public"]["Tables"]["fixtures"]["Row"];

const PREMIER_LEAGUE = "Premier League";
const UPDATE_BATCH_SIZE = 50;
const DELETE_BATCH_SIZE = 200;

const TEAM_NAME_MAPPINGS: Record<string, string> = {
  "Man United": "Manchester United",
  "Man Utd": "Manchester United",
  "Manchester Utd": "Manchester United",
  "Man City": "Manchester City",
  "Tottenham": "Tottenham Hotspur",
  "Spurs": "Tottenham Hotspur",
  "Brighton": "Brighton & Hove Albion",
  "Wolves": "Wolverhampton Wanderers",
  "West Ham": "West Ham United",
  "Newcastle": "Newcastle United",
  "Nottingham": "Nottingham Forest",
  "Forest": "Nottingham Forest",
  "Leeds": "Leeds United",
};

function normalizeCompetition(competition: string | null) {
  return competition || PREMIER_LEAGUE;
}

function normalizeTeamName(name: string) {
  const trimmed = name.trim().replace(/\s+/g, " ");
  return TEAM_NAME_MAPPINGS[trimmed] || trimmed;
}

function getDateOnly(date: string) {
  return date.split("T")[0] || date;
}

function fixtureScore(row: FixtureRow) {
  let score = 0;
  if (row.status === "finished" && row.home_score !== null && row.away_score !== null) {
    score += 3;
  } else if (row.status === "finished") {
    score += 2;
  } else if (row.status === "live") {
    score += 1;
  }
  if (row.season) score += 1;
  if (row.matchweek > 0) score += 1;
  if (row.competition_round) score += 1;
  return score;
}

function pickBestFixture(rows: FixtureRow[]) {
  return rows.reduce((best, current) => {
    const bestScore = fixtureScore(best);
    const currentScore = fixtureScore(current);
    if (currentScore > bestScore) return current;
    if (currentScore < bestScore) return best;
    return new Date(current.updated_at) > new Date(best.updated_at) ? current : best;
  });
}

async function updateNameBatch(batch: Array<{ id: string; home_team: string; away_team: string }>) {
  await Promise.all(
    batch.map((item) =>
      supabaseServer
        .from("fixtures")
        .update({ home_team: item.home_team, away_team: item.away_team })
        .eq("id", item.id)
    )
  );
}

async function updateMatchweekBatch(batch: Array<{ id: string; matchweek: number }>) {
  await Promise.all(
    batch.map((item) =>
      supabaseServer.from("fixtures").update({ matchweek: item.matchweek }).eq("id", item.id)
    )
  );
}

async function deleteFixtures(ids: string[]) {
  for (let i = 0; i < ids.length; i += DELETE_BATCH_SIZE) {
    const batch = ids.slice(i, i + DELETE_BATCH_SIZE);
    const { error } = await supabaseServer.from("fixtures").delete().in("id", batch);
    if (error) {
      throw new Error(`Delete failed: ${error.message}`);
    }
  }
}

async function main() {
  if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase environment variables.");
    process.exit(1);
  }

  const args = process.argv.slice(2);
  const shouldExecute = args.includes("--execute");
  const seasonFilter = getCurrentSeasonFilter();
  const seasonStart = getCurrentSeasonStartDate();
  const seasonEnd = getCurrentSeasonEndDate();

  const { data, error } = await supabaseServer
    .from("fixtures")
    .select("*")
    .or(seasonFilter)
    .gte("date", seasonStart.toISOString())
    .lte("date", seasonEnd.toISOString())
    .order("date", { ascending: true });

  if (error) {
    console.error("Failed to fetch fixtures:", error.message);
    process.exit(1);
  }

  const fixtures = (data || []).filter(
    (row) => normalizeCompetition(row.competition) === PREMIER_LEAGUE
  );

  const nameUpdates = fixtures
    .map((row) => {
      const home_team = normalizeTeamName(row.home_team);
      const away_team = normalizeTeamName(row.away_team);
      return home_team !== row.home_team || away_team !== row.away_team
        ? { id: row.id, home_team, away_team }
        : null;
    })
    .filter(Boolean) as Array<{ id: string; home_team: string; away_team: string }>;

  console.log("=== League Fixture Repair ===");
  console.log(`Fixtures scanned: ${fixtures.length}`);
  console.log(`Name updates needed: ${nameUpdates.length}`);

  if (!shouldExecute) {
    console.log("Dry run mode: no database updates applied.");
  } else {
    for (let i = 0; i < nameUpdates.length; i += UPDATE_BATCH_SIZE) {
      await updateNameBatch(nameUpdates.slice(i, i + UPDATE_BATCH_SIZE));
    }
  }

  const normalizedFixtures = fixtures.map((row) => {
    const home_team = normalizeTeamName(row.home_team);
    const away_team = normalizeTeamName(row.away_team);
    return { ...row, home_team, away_team };
  });

  const groups = new Map<string, FixtureRow[]>();
  normalizedFixtures.forEach((row) => {
    const key = [
      row.home_team,
      row.away_team,
      getDateOnly(row.date),
      normalizeCompetition(row.competition),
    ].join("||");
    const group = groups.get(key) || [];
    group.push(row);
    groups.set(key, group);
  });

  const duplicateGroups = Array.from(groups.values()).filter((group) => group.length > 1);
  const idsToDelete: string[] = [];

  duplicateGroups.forEach((group) => {
    const keeper = pickBestFixture(group);
    group.forEach((row) => {
      if (row.id !== keeper.id) {
        idsToDelete.push(row.id);
      }
    });
  });

  console.log(`Duplicate groups: ${duplicateGroups.length}`);
  console.log(`Fixtures marked for deletion: ${idsToDelete.length}`);

  if (shouldExecute && idsToDelete.length > 0) {
    await deleteFixtures(idsToDelete);
  }

  const dedupedFixtures = normalizedFixtures.filter((row) => !idsToDelete.includes(row.id));
  dedupedFixtures.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const expectedFixtureCount = 380;
  if (dedupedFixtures.length !== expectedFixtureCount) {
    console.warn(
      `Warning: expected ${expectedFixtureCount} fixtures after dedupe, got ${dedupedFixtures.length}`
    );
  }

  const matchweekUpdates: Array<{ id: string; matchweek: number }> = [];
  dedupedFixtures.forEach((row, index) => {
    const newMatchweek = Math.min(38, Math.floor(index / 10) + 1);
    if (newMatchweek !== row.matchweek) {
      matchweekUpdates.push({ id: row.id, matchweek: newMatchweek });
    }
  });

  console.log(`Matchweek updates needed: ${matchweekUpdates.length}`);

  if (shouldExecute) {
    for (let i = 0; i < matchweekUpdates.length; i += UPDATE_BATCH_SIZE) {
      await updateMatchweekBatch(matchweekUpdates.slice(i, i + UPDATE_BATCH_SIZE));
    }

    await supabaseServer.from("cache_metadata").upsert(
      {
        key: "fixtures",
        last_updated: new Date().toISOString(),
        data_count: dedupedFixtures.length,
      },
      { onConflict: "key" }
    );

    console.log("Repair complete.");
  } else {
    console.log("Dry run complete. Re-run with --execute to apply changes.");
  }
}

main().catch((error) => {
  console.error("Repair failed:", error);
  process.exit(1);
});
