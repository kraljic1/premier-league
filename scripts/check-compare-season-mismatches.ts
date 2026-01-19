"use client";

import { config } from "dotenv";
import { resolve } from "path";
import { createClient } from "@supabase/supabase-js";
import {
  calculatePointsForClub,
  filterPremierLeagueFixtures,
  getComparisonMatchweek,
  getCurrentMatchweekFromFixtures,
} from "../lib/utils-comparison";
import {
  getCurrentSeasonEndDate,
  getCurrentSeasonFull,
  getCurrentSeasonShort,
  getCurrentSeasonStartDate,
  seasonYearToShortFormat,
} from "../lib/utils/season-utils";
import { normalizeClubName } from "../lib/utils/club-name-utils";
import { Fixture } from "../lib/types";

config({ path: resolve(__dirname, "../.env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const fixtureSelectFields =
  "id,date,home_team,away_team,home_score,away_score,matchweek,status,season,competition,competition_round";

function getArgValue(flag: string): string | null {
  const index = process.argv.findIndex((arg) => arg === flag);
  if (index === -1) return null;
  return process.argv[index + 1] || null;
}

function mapRowToFixture(row: any): Fixture {
  return {
    id: row.id,
    date: row.date,
    homeTeam: row.home_team,
    awayTeam: row.away_team,
    homeScore: row.home_score,
    awayScore: row.away_score,
    matchweek: row.matchweek,
    status: row.status,
    season: row.season || undefined,
    competition: row.competition,
    competitionRound: row.competition_round,
  };
}

function getSeasonCandidates(seasonInput: string): string[] {
  const candidates = new Set<string>();
  candidates.add(seasonInput);
  const parts = seasonInput.split("/");
  if (parts.length === 2 && parts[1].length === 4) {
    candidates.add(seasonYearToShortFormat(parts[0]));
  }
  return Array.from(candidates);
}

function buildClubFixtureList(fixtures: Fixture[], clubName: string): Fixture[] {
  const normalizedClubName = normalizeClubName(clubName);
  return fixtures.filter((fixture) => {
    const home = normalizeClubName(fixture.homeTeam);
    const away = normalizeClubName(fixture.awayTeam);
    return home === normalizedClubName || away === normalizedClubName;
  });
}

async function fetchCurrentSeasonFixtures(): Promise<Fixture[]> {
  const currentSeasonShort = getCurrentSeasonShort();
  const currentSeasonFull = getCurrentSeasonFull();
  const startDate = getCurrentSeasonStartDate().toISOString();
  const endDate = getCurrentSeasonEndDate().toISOString();

  const [seasonResult, nullSeasonResult] = await Promise.all([
    supabase
      .from("fixtures")
      .select(fixtureSelectFields)
      .in("season", [currentSeasonShort, currentSeasonFull]),
    supabase
      .from("fixtures")
      .select(fixtureSelectFields)
      .is("season", null)
      .gte("date", startDate)
      .lte("date", endDate),
  ]);

  if (seasonResult.error) {
    throw seasonResult.error;
  }
  if (nullSeasonResult.error) {
    throw nullSeasonResult.error;
  }

  const combined = [...(seasonResult.data || []), ...(nullSeasonResult.data || [])];
  const uniqueById = new Map<string, Fixture>();
  combined.forEach((row) => {
    const fixture = mapRowToFixture(row);
    uniqueById.set(fixture.id, fixture);
  });

  return Array.from(uniqueById.values());
}

async function fetchHistoricalSeasonFixtures(seasonInput: string): Promise<Fixture[]> {
  const candidates = getSeasonCandidates(seasonInput);
  const { data, error } = await supabase
    .from("fixtures")
    .select(fixtureSelectFields)
    .in("season", candidates);

  if (error) {
    throw error;
  }

  return (data || []).map(mapRowToFixture);
}

async function run() {
  const seasonInput = getArgValue("--season");
  if (!seasonInput) {
    console.error("Usage: ts-node scripts/check-compare-season-mismatches.ts --season 2024/25");
    process.exit(1);
  }

  const matchweekArg = getArgValue("--matchweek");
  const overrideMatchweek = matchweekArg ? parseInt(matchweekArg, 10) : null;
  const clubFilterRaw = getArgValue("--club");
  const clubFilter = clubFilterRaw ? normalizeClubName(clubFilterRaw) : null;

  const currentSeasonFixtures = filterPremierLeagueFixtures(await fetchCurrentSeasonFixtures());
  const historicalFixtures = filterPremierLeagueFixtures(
    await fetchHistoricalSeasonFixtures(seasonInput)
  );

  const currentMatchweek = overrideMatchweek ?? getCurrentMatchweekFromFixtures(currentSeasonFixtures);

  const clubSet = new Set<string>();
  historicalFixtures.forEach((fixture) => {
    clubSet.add(normalizeClubName(fixture.homeTeam));
    clubSet.add(normalizeClubName(fixture.awayTeam));
  });

  const clubs = Array.from(clubSet).sort();
  const clubsToCheck = clubFilter ? clubs.filter((club) => club === clubFilter) : clubs;

  console.log(`Season: ${seasonInput}`);
  console.log(`Matchweek target: ${currentMatchweek}`);
  console.log(`Clubs checked: ${clubsToCheck.length}\n`);

  clubsToCheck.forEach((clubName) => {
    const stats = calculatePointsForClub(historicalFixtures, clubName, currentMatchweek);
    if (stats.played >= currentMatchweek) return;

    const clubFixtures = buildClubFixtureList(historicalFixtures, clubName);
    const fixturesInRange = clubFixtures.filter(
      (fixture) => getComparisonMatchweek(fixture) <= currentMatchweek
    );
    const unfinished = fixturesInRange.filter(
      (fixture) =>
        fixture.status !== "finished" ||
        fixture.homeScore === null ||
        fixture.awayScore === null
    );

    const matchweeksInRange = new Set(
      fixturesInRange.map((fixture) => getComparisonMatchweek(fixture))
    );
    const missingMatchweeks: number[] = [];
    for (let mw = 1; mw <= currentMatchweek; mw += 1) {
      if (!matchweeksInRange.has(mw)) missingMatchweeks.push(mw);
    }

    const futureFixtures = clubFixtures
      .filter((fixture) => getComparisonMatchweek(fixture) > currentMatchweek)
      .sort((a, b) => getComparisonMatchweek(a) - getComparisonMatchweek(b))
      .slice(0, 5);

    console.log(`${clubName}: played ${stats.played} of ${currentMatchweek} (missing ${currentMatchweek - stats.played})`);
    if (missingMatchweeks.length > 0) {
      console.log(`  Missing matchweeks: ${missingMatchweeks.join(", ")}`);
    }
    if (unfinished.length > 0) {
      console.log("  Unfinished fixtures in range:");
      unfinished.forEach((fixture) => {
        console.log(
          `    MW ${getComparisonMatchweek(fixture)}: ${fixture.homeTeam} vs ${fixture.awayTeam} (${fixture.status})`
        );
      });
    }
    if (futureFixtures.length > 0) {
      console.log("  Fixtures beyond range:");
      futureFixtures.forEach((fixture) => {
        console.log(
          `    MW ${getComparisonMatchweek(fixture)}: ${fixture.homeTeam} vs ${fixture.awayTeam} (${fixture.status})`
        );
      });
    }
    console.log();
  });
}

run().catch((error) => {
  console.error("Failed to run mismatch check:", error);
  process.exit(1);
});
