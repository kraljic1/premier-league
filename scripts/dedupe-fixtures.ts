/**
 * Dedupe fixtures by home/away/date/competition.
 *
 * Usage:
 *   npx tsx scripts/dedupe-fixtures.ts --execute
 *   npx tsx scripts/dedupe-fixtures.ts --dry-run
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
const DELETE_BATCH_SIZE = 200;

function normalizeCompetition(competition: string | null) {
  return competition || PREMIER_LEAGUE;
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
  const seasonStart = getCurrentSeasonStartDate().toISOString();
  const seasonEnd = getCurrentSeasonEndDate().toISOString();

  const { data, error } = await supabaseServer
    .from("fixtures")
    .select("*")
    .or(seasonFilter)
    .gte("date", seasonStart)
    .lte("date", seasonEnd)
    .order("date", { ascending: true });

  if (error) {
    console.error("Failed to fetch fixtures:", error.message);
    process.exit(1);
  }

  const fixtures = data || [];
  const groups = new Map<string, FixtureRow[]>();

  fixtures.forEach((row) => {
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

  console.log("=== Fixture Deduplication ===");
  console.log(`Fixtures scanned: ${fixtures.length}`);
  console.log(`Duplicate groups: ${duplicateGroups.length}`);
  console.log(`Fixtures marked for deletion: ${idsToDelete.length}`);
  console.log(`Mode: ${shouldExecute ? "EXECUTE" : "DRY RUN"}`);

  if (!shouldExecute) {
    console.log("Dry run complete. Re-run with --execute to delete duplicates.");
    return;
  }

  if (idsToDelete.length > 0) {
    await deleteFixtures(idsToDelete);
  }

  await supabaseServer.from("cache_metadata").upsert(
    {
      key: "fixtures",
      last_updated: new Date().toISOString(),
      data_count: fixtures.length - idsToDelete.length,
    },
    { onConflict: "key" }
  );

  console.log("Deduplication complete.");
}

main().catch((error) => {
  console.error("Deduplication failed:", error);
  process.exit(1);
});
