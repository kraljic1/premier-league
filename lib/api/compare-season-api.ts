import { Fixture } from "../types";

/**
 * API functions for Compare Season feature
 */

export async function fetchCurrentSeasonFixtures(): Promise<Fixture[]> {
  const res = await fetch("/api/fixtures", {
    next: { revalidate: 1800 },
  });
  if (!res.ok) throw new Error("Failed to fetch current season fixtures");
  return res.json();
}

export async function fetchHistoricalSeason(seasonYear: string): Promise<Fixture[]> {
  const year = seasonYear.split("/")[0];
  const res = await fetch(`/api/historical-season?seasonYear=${year}`, {
    next: { revalidate: 3600 },
  });
  if (!res.ok) throw new Error("Failed to fetch historical season");
  const data = await res.json();
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
