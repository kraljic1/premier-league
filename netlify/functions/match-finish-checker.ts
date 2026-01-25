import { schedule } from "@netlify/functions";
import { createClient } from "@supabase/supabase-js";
import * as cheerio from "cheerio";
import { normalizeClubName } from "../../lib/utils/club-name-utils";
const supabaseUrl = process.env["NEXT_PUBLIC_SUPABASE_URL"] || "";
const supabaseKey =
  process.env["SUPABASE_SERVICE_ROLE_KEY"] ||
  process.env["NEXT_PUBLIC_SUPABASE_ANON_KEY"] ||
  "";
const supabase = createClient(supabaseUrl, supabaseKey);
const REZULTATI_URL =
  "https://www.rezultati.com/nogomet/engleska/premier-league/rezultati/";
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
interface MatchResult {
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  date: Date | null;
}
function normalizeTeamName(name: string): string {
  const cleaned = name
    .replace(/\d+$/, "")
    .replace(/[.\-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return normalizeClubName(cleaned);
}
function parseDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  const ddmmTime = dateStr.match(/(\d{1,2})\.(\d{1,2})\.\s*(\d{1,2}):(\d{2})/);
  if (!ddmmTime) return null;
  const day = parseInt(ddmmTime[1], 10);
  const month = parseInt(ddmmTime[2], 10) - 1;
  const hour = parseInt(ddmmTime[3], 10);
  const minute = parseInt(ddmmTime[4], 10);
  const currentYear = month >= 7 ? 2025 : 2026;
  return new Date(currentYear, month, day, hour, minute);
}
async function fetchResults(): Promise<MatchResult[]> {
  const response = await fetch(REZULTATI_URL, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.5",
    },
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch results: ${response.status}`);
  }
  const html = await response.text();
  const $ = cheerio.load(html);
  const results: MatchResult[] = [];
  $(".event__match").each((_, el) => {
    const $el = $(el);
    const homeTeam = $el
      .find(".event__participant--home, .event__homeParticipant")
      .first()
      .text()
      .trim();
    const awayTeam = $el
      .find(".event__participant--away, .event__awayParticipant")
      .first()
      .text()
      .trim();
    const homeScoreText = $el
      .find(".event__score--home, [class*='score--home']")
      .first()
      .text()
      .trim();
    const awayScoreText = $el
      .find(".event__score--away, [class*='score--away']")
      .first()
      .text()
      .trim();
    const dateStr = $el.find(".event__time").first().text().trim();
    const homeScore = parseInt(homeScoreText, 10);
    const awayScore = parseInt(awayScoreText, 10);
    const parsedDate = parseDate(dateStr);
    if (
      homeTeam &&
      awayTeam &&
      !isNaN(homeScore) &&
      !isNaN(awayScore)
    ) {
      results.push({
        homeTeam,
        awayTeam,
        homeScore,
        awayScore,
        date: parsedDate,
      });
    }
  });

  return results;
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
    const results = await fetchResults();
    console.log(`[FinishChecker] Results scraped: ${results.length}`);
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
