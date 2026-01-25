/**
 * Normalize team names and remove duplicates created by aliases.
 *
 * Usage:
 *   npx tsx scripts/normalize-team-names-dedupe.ts --execute
 *   npx tsx scripts/normalize-team-names-dedupe.ts --dry-run
 */
import { config } from "dotenv";
import { resolve } from "path";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../lib/supabase";
import { normalizeClubName } from "../lib/utils/club-name-utils";

config({ path: resolve(__dirname, "../.env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient<Database>(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

type FixtureRow = Database["public"]["Tables"]["fixtures"]["Row"];

const DELETE_BATCH_SIZE = 200;
const UPDATE_BATCH_SIZE = 200;

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

function isAlreadyNormalized(row: FixtureRow, normalizedHome: string, normalizedAway: string) {
  return row.home_team === normalizedHome && row.away_team === normalizedAway;
}

function getKey(homeTeam: string, awayTeam: string, date: string) {
  return `${homeTeam}||${awayTeam}||${date}`;
}

async function deleteFixtures(ids: string[]) {
  for (let i = 0; i < ids.length; i += DELETE_BATCH_SIZE) {
    const batch = ids.slice(i, i + DELETE_BATCH_SIZE);
    const { error } = await supabase.from("fixtures").delete().in("id", batch);
    if (error) {
      throw new Error(`Delete failed: ${error.message}`);
    }
  }
}

async function updateFixtures(
  updates: Array<Pick<FixtureRow, "id" | "home_team" | "away_team" | "date">>
) {
  for (let i = 0; i < updates.length; i += UPDATE_BATCH_SIZE) {
    const batch = updates.slice(i, i + UPDATE_BATCH_SIZE);
    for (const update of batch) {
      const { data: conflicts, error: conflictError } = await supabase
        .from("fixtures")
        .select("id")
        .eq("home_team", update.home_team)
        .eq("away_team", update.away_team)
        .eq("date", update.date)
        .neq("id", update.id)
        .limit(1);
      if (conflictError) {
        throw new Error(`Conflict check failed: ${conflictError.message}`);
      }
      if (conflicts && conflicts.length > 0) {
        const { error: deleteError } = await supabase
          .from("fixtures")
          .delete()
          .eq("id", update.id);
        if (deleteError) {
          throw new Error(`Delete failed: ${deleteError.message}`);
        }
        continue;
      }

      const { error } = await supabase
        .from("fixtures")
        .update({ home_team: update.home_team, away_team: update.away_team })
        .eq("id", update.id);
      if (error) {
        throw new Error(`Update failed: ${error.message}`);
      }
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

  const { data, error } = await supabase.from("fixtures").select("*");
  if (error) {
    console.error("Failed to fetch fixtures:", error.message);
    process.exit(1);
  }

  const fixtures = data || [];
  const groups = new Map<string, FixtureRow[]>();
  const normalizedNames = new Map<string, { home: string; away: string }>();
  const currentKeyMap = new Map<string, FixtureRow>();

  fixtures.forEach((row) => {
    const normalizedHome = normalizeClubName(row.home_team);
    const normalizedAway = normalizeClubName(row.away_team);
    const normalizedKey = getKey(normalizedHome, normalizedAway, row.date);
    const group = groups.get(normalizedKey) || [];
    group.push(row);
    groups.set(normalizedKey, group);
    normalizedNames.set(normalizedKey, { home: normalizedHome, away: normalizedAway });
    currentKeyMap.set(getKey(row.home_team, row.away_team, row.date), row);
  });

  const idsToDelete: string[] = [];
  const updates: Array<Pick<FixtureRow, "id" | "home_team" | "away_team" | "date">> = [];

  groups.forEach((group, normalizedKey) => {
    const { home: normalizedHome, away: normalizedAway } = normalizedNames.get(normalizedKey)!;
    const sorted = [...group].sort((a, b) => {
      const scoreDiff = fixtureScore(b) - fixtureScore(a);
      if (scoreDiff !== 0) return scoreDiff;
      const normalizedDiff =
        Number(isAlreadyNormalized(b, normalizedHome, normalizedAway)) -
        Number(isAlreadyNormalized(a, normalizedHome, normalizedAway));
      if (normalizedDiff !== 0) return normalizedDiff;
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
    });

    const keeper = sorted[0];
    sorted.slice(1).forEach((row) => idsToDelete.push(row.id));

    if (!isAlreadyNormalized(keeper, normalizedHome, normalizedAway)) {
      const targetKey = getKey(normalizedHome, normalizedAway, keeper.date);
      const existing = currentKeyMap.get(targetKey);
      if (existing && existing.id !== keeper.id) {
        idsToDelete.push(keeper.id);
      } else {
        updates.push({
          id: keeper.id,
          home_team: normalizedHome,
          away_team: normalizedAway,
          date: keeper.date,
        });
      }
    }
  });

  console.log("=== Normalize Team Names + Dedupe ===");
  console.log(`Fixtures scanned: ${fixtures.length}`);
  console.log(`Groups (normalized): ${groups.size}`);
  console.log(`Fixtures to delete: ${idsToDelete.length}`);
  console.log(`Fixtures to update: ${updates.length}`);
  console.log(`Mode: ${shouldExecute ? "EXECUTE" : "DRY RUN"}`);

  if (!shouldExecute) {
    console.log("Dry run complete. Re-run with --execute to apply updates.");
    return;
  }

  if (idsToDelete.length > 0) {
    await deleteFixtures(idsToDelete);
  }

  if (updates.length > 0) {
    await updateFixtures(updates);
  }

  console.log("Normalization and dedupe complete.");
}

main().catch((error) => {
  console.error("Normalization failed:", error);
  process.exit(1);
});
