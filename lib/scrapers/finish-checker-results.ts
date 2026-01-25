import { scrapeRecentResults } from "./results-api";
import { scrapeResultsFromOneFootball } from "./onefootball-fixtures";
import { Fixture } from "../types";

export interface FinishCheckerResult {
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  date: Date | null;
}

type ResultSource = "rezultati" | "onefootball";

function toFinishCheckerResults(fixtures: Fixture[]): FinishCheckerResult[] {
  return fixtures
    .map((fixture) => ({
      homeTeam: fixture.homeTeam,
      awayTeam: fixture.awayTeam,
      homeScore: fixture.homeScore ?? NaN,
      awayScore: fixture.awayScore ?? NaN,
      date: fixture.date ? new Date(fixture.date) : null,
    }))
    .filter(
      (result) =>
        result.homeTeam &&
        result.awayTeam &&
        !isNaN(result.homeScore) &&
        !isNaN(result.awayScore)
    );
}

export async function fetchFinishCheckerResults(): Promise<{
  results: FinishCheckerResult[];
  source: ResultSource | null;
}> {
  try {
    const rezResults = await scrapeRecentResults();
    const mappedRez = toFinishCheckerResults(rezResults);
    if (mappedRez.length > 0) {
      return { results: mappedRez, source: "rezultati" };
    }
  } catch (error) {
    console.error("[FinishChecker] Rezultati scraper failed:", error);
  }

  try {
    const oneFootballResults = await scrapeResultsFromOneFootball();
    const mappedOneFootball = toFinishCheckerResults(oneFootballResults);
    if (mappedOneFootball.length > 0) {
      return { results: mappedOneFootball, source: "onefootball" };
    }
  } catch (error) {
    console.error("[FinishChecker] OneFootball scraper failed:", error);
  }

  return { results: [], source: null };
}
