import { schedule } from "@netlify/functions";
import { createClient } from "@supabase/supabase-js";
import { normalizeClubName } from "../../lib/utils/club-name-utils";
import {
  fetchFinishCheckerResults,
  FinishCheckerResult,
} from "../../lib/scrapers/finish-checker-results";
const supabaseUrl = process.env["NEXT_PUBLIC_SUPABASE_URL"] || "";
const supabaseKey =
  process.env["SUPABASE_SERVICE_ROLE_KEY"] ||
  process.env["NEXT_PUBLIC_SUPABASE_ANON_KEY"] ||
  "";
const supabase = createClient(supabaseUrl, supabaseKey);
const CHECK_AFTER_MINUTES = 120;
const LOOKBACK_HOURS = 24;
const CHECK_CYCLES = 1;
interface FixtureRow {
  id: string;
  date: string;
  home_team: string;
  away_team: string;
  status: string;
}
type MatchResult = FinishCheckerResult;
function normalizeTeamName(name: string): string {
  const cleaned = name
    .replace(/\d+$/, "")
    .replace(/[.\-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return normalizeClubName(cleaned);
}
function isLikelySameMatch(fixture: FixtureRow, result: MatchResult): boolean {
  const fixtureHome = normalizeTeamName(fixture.home_team);
  const fixtureAway = normalizeTeamName(fixture.away_team);
  const resultHome = normalizeTeamName(result.homeTeam);
  const resultAway = normalizeTeamName(result.awayTeam);
  if (fixtureHome !== resultHome || fixtureAway !== resultAway) return false;
  if (!result.date) return true;
  const fixtureTime = new Date(fixture.date).getTime();
  const resultTime = result.date.getTime();
  const diffHours = Math.abs(fixtureTime - resultTime) / (60 * 60 * 1000);
  return diffHours <= 24;
}
async function getFixturesToCheck(): Promise<FixtureRow[]> {
  const now = new Date();
  const latestStart = new Date(now.getTime() - CHECK_AFTER_MINUTES * 60 * 1000);
  const earliestStart = new Date(now.getTime() - LOOKBACK_HOURS * 60 * 60 * 1000);
  const { data, error } = await supabase
    .from("fixtures")
    .select("id, date, home_team, away_team, status")
    .in("status", ["scheduled", "live"])
    .gte("date", earliestStart.toISOString())
    .lte("date", latestStart.toISOString());
  if (error) {
    console.error("[FinishChecker] Error loading fixtures:", error);
    return [];
  }
  return data || [];
}
async function updateFixtureResult(
  fixtureId: string,
  result: MatchResult
): Promise<boolean> {
  const { error } = await supabase
    .from("fixtures")
    .update({
      home_score: result.homeScore,
      away_score: result.awayScore,
      status: "finished",
    })
    .eq("id", fixtureId);
  if (error) {
    console.error("[FinishChecker] Error updating fixture:", error);
    return false;
  }
  return true;
}
export const handler = schedule("*/5 * * * *", async () => {
  if (!supabaseUrl || !supabaseKey) {
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, error: "Missing Supabase config" }),
    };
  }
  const fixturesToCheck = await getFixturesToCheck();
  console.log(`[FinishChecker] Fixtures to check: ${fixturesToCheck.length}`);
  if (fixturesToCheck.length === 0) {
    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, checked: 0, updated: 0 }),
    };
  }
  let updated = 0;
  let pending = fixturesToCheck;
  for (let cycle = 0; cycle < CHECK_CYCLES && pending.length > 0; cycle += 1) {
    const { results, source } = await fetchFinishCheckerResults();
    console.log(`[FinishChecker] Results scraped: ${results.length}`);
    if (source) {
      console.log(`[FinishChecker] Results source: ${source}`);
    }
    if (results.length > 0) {
      const sample = results.slice(0, 5).map((result) => {
        return `${result.homeTeam} vs ${result.awayTeam} (${result.homeScore}-${result.awayScore})`;
      });
      console.log(`[FinishChecker] Sample results: ${sample.join(" | ")}`);
    }
    const nextPending: FixtureRow[] = [];
    for (const fixture of pending) {
      console.log(
        `[FinishChecker] Checking: ${fixture.home_team} vs ${fixture.away_team} (${fixture.date})`
      );
      const matchResult = results.find((result) =>
        isLikelySameMatch(fixture, result)
      );
      if (!matchResult) {
        console.log(`[FinishChecker] No match found for fixture ${fixture.id}`);
        nextPending.push(fixture);
        continue;
      }
      const updatedOk = await updateFixtureResult(fixture.id, matchResult);
      console.log(
        `[FinishChecker] Update ${updatedOk ? "OK" : "FAILED"} for ${fixture.id} -> ${matchResult.homeScore}-${matchResult.awayScore}`
      );
      if (!updatedOk) nextPending.push(fixture);
      if (updatedOk) updated += 1;
    }
    pending = nextPending;
  }
  await supabase.from("cache_metadata").upsert(
    {
      key: "last_finish_checker",
      last_updated: new Date().toISOString(),
      data_count: updated,
    },
    { onConflict: "key" }
  );
  return {
    statusCode: 200,
    body: JSON.stringify({
      success: true,
      checked: fixturesToCheck.length,
      updated,
      timestamp: new Date().toISOString(),
    }),
  };
});
