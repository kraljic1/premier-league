import { Fixture } from "@/lib/types";

export async function fetchFixtures(competitions: string[]): Promise<Fixture[]> {
  const params = new URLSearchParams();
  if (competitions.length > 0) {
    params.set("competitions", competitions.join(","));
  }

  const url = params.toString() ? `/api/fixtures?${params.toString()}` : "/api/fixtures";
  const res = await fetch(url, {
    next: { revalidate: 1800 }, // Revalidate every 30 minutes
  });
  if (!res.ok) throw new Error("Failed to fetch fixtures");
  return res.json();
}

/**
 * Filters fixtures to only include future matches.
 * Compares dates properly, ignoring time component for more accurate filtering.
 */
export function getFutureFixtures(fixtures: Fixture[], limit: number | null): Fixture[] {
  const now = new Date();
  now.setHours(0, 0, 0, 0); // Set to start of day for accurate comparison

  const futureFixtures = fixtures
    .filter((f: Fixture) => {
      const fixtureDate = new Date(f.date);
      fixtureDate.setHours(0, 0, 0, 0);
      return fixtureDate >= now;
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  if (limit === null) {
    return futureFixtures;
  }

  const limited = futureFixtures.slice(0, limit);
  console.log(
    `[getFutureFixtures] Total future: ${futureFixtures.length}, Limit: ${limit}, Returning: ${limited.length}`
  );
  return limited;
}

export function getAvailableCompetitionValues(
  fixtures: Fixture[],
  clubNames: string[]
): string[] {
  if (clubNames.length === 0) {
    return [];
  }

  const clubSet = new Set(clubNames);
  const competitionSet = new Set<string>();

  fixtures.forEach((fixture) => {
    const competition = fixture.competition || "Premier League";
    if (competition === "Premier League") {
      return;
    }

    if (clubSet.has(fixture.homeTeam) || clubSet.has(fixture.awayTeam)) {
      competitionSet.add(competition);
    }
  });

  return Array.from(competitionSet);
}
