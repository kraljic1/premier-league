/**
 * Audit Premier League matchweek integrity for current season.
 *
 * Usage: npx tsx scripts/audit-league-matchweeks.ts
 */

import { config } from "dotenv";
import { resolve } from "path";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../lib/supabase";
import type { Fixture } from "../lib/types";
import {
  getCurrentSeasonFilter,
  getCurrentSeasonStartDate,
  getCurrentSeasonEndDate,
} from "../lib/utils/season-utils";
import {
  filterPremierLeagueFixtures,
  getCurrentMatchweekFromFixtures,
} from "../lib/utils-comparison";

config({ path: resolve(__dirname, "../.env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabaseServer = createClient<Database>(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

function mapDbRowToFixture(row: Database["public"]["Tables"]["fixtures"]["Row"]): Fixture {
  return {
    id: row.id,
    date: row.date,
    homeTeam: row.home_team,
    awayTeam: row.away_team,
    homeScore: row.home_score,
    awayScore: row.away_score,
    matchweek: row.matchweek,
    status: row.status as Fixture["status"],
    isDerby: row.is_derby || false,
    season: row.season || undefined,
    competition: row.competition || undefined,
    competitionRound: row.competition_round || undefined,
  };
}

function countByMatchweek(fixtures: Fixture[]): Map<number, number> {
  const counts = new Map<number, number>();
  fixtures.forEach((fixture) => {
    counts.set(fixture.matchweek, (counts.get(fixture.matchweek) || 0) + 1);
  });
  return counts;
}

async function main() {
  if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase environment variables.");
    process.exit(1);
  }

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

  const allFixtures = (data || []).map(mapDbRowToFixture);
  const premierLeagueFixtures = filterPremierLeagueFixtures(allFixtures);
  const finishedFixtures = premierLeagueFixtures.filter(
    (fixture) =>
      fixture.status === "finished" &&
      fixture.homeScore !== null &&
      fixture.awayScore !== null
  );

  const currentMatchweek = getCurrentMatchweekFromFixtures(finishedFixtures);
  const fixturesUpToMatchweek = finishedFixtures.filter(
    (fixture) => fixture.matchweek <= currentMatchweek
  );

  console.log("=== Premier League Matchweek Audit ===");
  console.log(`Season range: ${seasonStart} -> ${seasonEnd}`);
  console.log(`Total fixtures (PL only): ${premierLeagueFixtures.length}`);
  console.log(`Finished fixtures: ${finishedFixtures.length}`);
  console.log(`Current matchweek (max finished): ${currentMatchweek}`);
  console.log(`Finished fixtures <= MW ${currentMatchweek}: ${fixturesUpToMatchweek.length}`);

  const matchweekCounts = countByMatchweek(fixturesUpToMatchweek);
  const abnormalMatchweeks = Array.from(matchweekCounts.entries())
    .filter(([, count]) => count !== 10)
    .sort((a, b) => a[0] - b[0]);

  if (abnormalMatchweeks.length > 0) {
    console.log("Matchweeks with non-10 fixture counts:");
    abnormalMatchweeks.forEach(([mw, count]) => {
      console.log(`  MW ${mw}: ${count} fixtures`);
    });
  } else {
    console.log("All matchweeks up to current have exactly 10 fixtures.");
  }

  const fixturesByTeam = new Map<string, Fixture[]>();
  fixturesUpToMatchweek.forEach((fixture) => {
    const homeList = fixturesByTeam.get(fixture.homeTeam) || [];
    homeList.push(fixture);
    fixturesByTeam.set(fixture.homeTeam, homeList);

    const awayList = fixturesByTeam.get(fixture.awayTeam) || [];
    awayList.push(fixture);
    fixturesByTeam.set(fixture.awayTeam, awayList);
  });

  const teamAudit = Array.from(fixturesByTeam.entries())
    .map(([team, teamFixtures]) => {
      const matchweekCountsByTeam = new Map<number, number>();
      teamFixtures.forEach((fixture) => {
        matchweekCountsByTeam.set(
          fixture.matchweek,
          (matchweekCountsByTeam.get(fixture.matchweek) || 0) + 1
        );
      });
      const duplicateMatchweeks = Array.from(matchweekCountsByTeam.entries())
        .filter(([, count]) => count > 1)
        .map(([mw]) => mw)
        .sort((a, b) => a - b);

      return {
        team,
        played: teamFixtures.length,
        distinctMatchweeks: matchweekCountsByTeam.size,
        duplicateMatchweeks,
      };
    })
    .sort((a, b) => a.team.localeCompare(b.team));

  const teamsWithIssues = teamAudit.filter(
    (team) => team.played > currentMatchweek || team.duplicateMatchweeks.length > 0
  );

  if (teamsWithIssues.length === 0) {
    console.log("All teams have <= current matchweek played with no duplicates.");
  } else {
    console.log("Teams with played count or matchweek duplication issues:");
    teamsWithIssues.forEach((team) => {
      const duplicateInfo =
        team.duplicateMatchweeks.length > 0
          ? ` duplicates in MW: ${team.duplicateMatchweeks.join(", ")}`
          : "";
      console.log(
        `  ${team.team}: played ${team.played} (distinct MW ${team.distinctMatchweeks})${duplicateInfo}`
      );
    });
  }
}

main().catch((error) => {
  console.error("Audit failed:", error);
  process.exit(1);
});
