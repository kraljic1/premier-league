import { Fixture } from "../types";

/**
 * API functions for Compare Season feature
 */

export async function fetchCurrentSeasonFixtures(): Promise<Fixture[]> {
  // Add timestamp to bust cache and ensure fresh data for comparisons
  const timestamp = Date.now();
  const res = await fetch(`/api/fixtures?_t=${timestamp}`, {
    cache: 'no-store',
    headers: {
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache',
    },
  });
  if (!res.ok) throw new Error("Failed to fetch current season fixtures");
  return res.json();
}

export async function fetchHistoricalSeason(seasonYear: string): Promise<Fixture[]> {
  const year = seasonYear.split("/")[0];
  // Add timestamp to bust any caching
  const timestamp = Date.now();
  const url = `/api/historical-season?seasonYear=${year}&_t=${timestamp}`;
  
  console.log(`[fetchHistoricalSeason] Called with seasonYear: "${seasonYear}", extracted year: "${year}"`);
  console.log(`[fetchHistoricalSeason] Fetching URL: ${url}`);
  
  // Use cache: 'no-store' to ensure fresh data for each season request
  const res = await fetch(url, {
    cache: 'no-store',
    headers: {
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache',
    },
  });
  
  if (!res.ok) {
    console.error(`[fetchHistoricalSeason] API error: ${res.status} ${res.statusText}`);
    throw new Error("Failed to fetch historical season");
  }
  
  const data = await res.json();
  console.log(`[fetchHistoricalSeason] Response for season "${data.season}": ${data.fixtures?.length || 0} fixtures`);
  
  // Log sample fixture to verify correct season data
  if (data.fixtures && data.fixtures.length > 0) {
    const sample = data.fixtures[0];
    console.log(`[fetchHistoricalSeason] Sample fixture: ${sample.homeTeam} vs ${sample.awayTeam}, matchweek ${sample.matchweek}, season: ${sample.season}`);
  }
  
  return data.fixtures || [];
}

export async function scrapeHistoricalSeason(seasonYear: number): Promise<void> {
  const res = await fetch("/api/historical-season", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ seasonYear }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to scrape historical season");
  }
}
