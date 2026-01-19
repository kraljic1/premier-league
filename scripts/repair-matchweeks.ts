/**
 * Repair matchweek values for current season Premier League fixtures.
 *
 * Usage:
 *   npx tsx scripts/repair-matchweeks.ts --execute
 *   npx tsx scripts/repair-matchweeks.ts --dry-run
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

function normalizeCompetition(competition: string | null) {
  return competition || PREMIER_LEAGUE;
}

function computeMatchweek(dateIso: string, seasonStart: Date) {
  const fixtureDate = new Date(dateIso);
  const diffMs = fixtureDate.getTime() - seasonStart.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const matchweek = Math.floor(diffDays / 7) + 1;
  return Math.min(38, Math.max(1, matchweek));
}

function normalizeStartDate(date: Date) {
  const dateOnly = date.toISOString().split("T")[0] || date.toISOString();
  return new Date(`${dateOnly}T00:00:00.000Z`);
}

async function updateMatchweeks(updates: Array<{ id: string; matchweek: number }>) {
  for (let i = 0; i < updates.length; i += UPDATE_BATCH_SIZE) {
    const batch = updates.slice(i, i + UPDATE_BATCH_SIZE);
    await Promise.all(
      batch.map((update) =>
        supabaseServer.from("fixtures").update({ matchweek: update.matchweek }).eq("id", update.id)
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

  const earliestFixtureDate = fixtures.reduce<Date | null>((earliest, row) => {
    const fixtureDate = new Date(row.date);
    if (!earliest || fixtureDate < earliest) {
      return fixtureDate;
    }
    return earliest;
  }, null);

  const effectiveSeasonStart = earliestFixtureDate
    ? normalizeStartDate(earliestFixtureDate)
    : seasonStart;

  const updates: Array<{ id: string; matchweek: number }> = [];
  fixtures.forEach((row) => {
    const newMatchweek = computeMatchweek(row.date, effectiveSeasonStart);
    if (newMatchweek !== row.matchweek) {
      updates.push({ id: row.id, matchweek: newMatchweek });
    }
  });

  console.log("=== Matchweek Repair ===");
  console.log(`Fixtures scanned: ${fixtures.length}`);
  console.log(`Season start: ${effectiveSeasonStart.toISOString()}`);
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

  await supabaseServer.from("cache_metadata").upsert(
    {
      key: "fixtures",
      last_updated: new Date().toISOString(),
      data_count: fixtures.length,
    },
    { onConflict: "key" }
  );

  console.log("Matchweek repair complete.");
}

main().catch((error) => {
  console.error("Matchweek repair failed:", error);
  process.exit(1);
});
