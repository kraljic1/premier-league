import { Fixture } from "../types";

/**
 * Data processing utilities for SofaScore scraper
 * Converts raw match data into Fixture format
 */

export interface RawMatchData {
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  dateStr: string;
  matchweek: number;
  status: "finished";
}

/**
 * Processes raw results into Fixture format
 */
export function processRawResults(
  resultsData: RawMatchData[],
  seasonYear: number
): Fixture[] {
  const results: Fixture[] = [];
  const season = `${seasonYear}/${seasonYear + 1}`;
  
  for (const resultData of resultsData || []) {
    if (!resultData.homeTeam || !resultData.awayTeam) {
      continue;
    }
    
    const date = parseDate(resultData.dateStr);
    const fixtureId = createFixtureId(resultData, seasonYear, date);
    
    results.push({
      id: fixtureId,
      date: date.toISOString(),
      homeTeam: resultData.homeTeam,
      awayTeam: resultData.awayTeam,
      homeScore: resultData.homeScore,
      awayScore: resultData.awayScore,
      matchweek: resultData.matchweek,
      status: "finished",
      season: season
    });
  }
  
  return results;
}

/**
 * Parses date string into Date object
 */
function parseDate(dateStr: string): Date {
  if (dateStr) {
    const parsedDate = new Date(dateStr);
    if (!isNaN(parsedDate.getTime())) {
      return parsedDate;
    }
  }
  return new Date();
}

/**
 * Creates unique fixture ID
 */
function createFixtureId(
  resultData: RawMatchData,
  seasonYear: number,
  date: Date
): string {
  const dateOnly = date.toISOString().split('T')[0];
  return `${resultData.homeTeam}-${resultData.awayTeam}-${dateOnly}-${resultData.matchweek}-${seasonYear}`;
}
