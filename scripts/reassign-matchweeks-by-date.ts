/**
 * Reassign matchweeks by chronological order (10 fixtures per round).
 *
 * Usage:
 *   npx tsx scripts/reassign-matchweeks-by-date.ts --execute
 *   npx tsx scripts/reassign-matchweeks-by-date.ts --dry-run
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

const supabase = createClient<Database>(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const PREMIER_LEAGUE = "Premier League";
const UPDATE_BATCH_SIZE = 50;

type FixtureRow = Database["public"]["Tables"]["fixtures"]["Row"];

function isPremierLeagueFixture(row: FixtureRow) {
  if (row.competition === PREMIER_LEAGUE) return true;
  if (row.competition) return false;
  return row.competition_round === null || row.competition_round === undefined;
}

async function updateMatchweeks(updates: Array<{ id: string; matchweek: number }>) {
  for (let i = 0; i < updates.length; i += UPDATE_BATCH_SIZE) {
    const batch = updates.slice(i, i + UPDATE_BATCH_SIZE);
    await Promise.all(
      batch.map((update) =>
        supabase.from("fixtures").update({ matchweek: update.matchweek }).eq("id", update.id)
      )
    );
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

  const { data, error } = await supabase
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

  const fixtures = (data || []).filter(isPremierLeagueFixture);
  const updates: Array<{ id: string; matchweek: number }> = [];

  fixtures.forEach((row, index) => {
    const newMatchweek = Math.floor(index / 10) + 1;
    if (newMatchweek !== row.matchweek) {
      updates.push({ id: row.id, matchweek: newMatchweek });
    }
  });

  console.log("=== Reassign Matchweeks by Date ===");
  console.log(`Fixtures scanned: ${fixtures.length}`);
  console.log(`Matchweeks to update: ${updates.length}`);
  console.log(`Mode: ${shouldExecute ? "EXECUTE" : "DRY RUN"}`);

  if (updates.length > 0) {
    console.log("Sample updates:");
    updates.slice(0, 10).forEach((update) => {
      console.log(`  ${update.id} -> MW ${update.matchweek}`);
    });
  }

  if (!shouldExecute) {
    console.log("Dry run complete. Re-run with --execute to apply updates.");
    return;
  }

  if (updates.length > 0) {
    await updateMatchweeks(updates);
  }

  await supabase.from("cache_metadata").upsert(
    {
      key: "fixtures",
      last_updated: new Date().toISOString(),
      data_count: fixtures.length,
    },
    { onConflict: "key" }
  );

  console.log("Matchweek reassignment complete.");
}

main().catch((error) => {
  console.error("Matchweek reassignment failed:", error);
  process.exit(1);
});
