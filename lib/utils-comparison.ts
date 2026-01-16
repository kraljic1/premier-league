import { Fixture } from "./types";

/**
 * Calculates points for a club in a given range of matchweeks
 * Win = 3 points, Draw = 1 point, Loss = 0 points
 * 
 * @param fixtures - Array of fixtures to analyze
 * @param clubName - Name of the club to calculate points for
 * @param maxMatchweek - Maximum matchweek to include (inclusive)
 * @returns Object with points, wins, draws, losses, and matches played
 */
export function calculatePointsForClub(
  fixtures: Fixture[],
  clubName: string,
  maxMatchweek: number
): {
  points: number;
  wins: number;
  draws: number;
  losses: number;
  played: number;
  goalsFor: number;
  goalsAgainst: number;
} {
  // Filter fixtures for this club up to maxMatchweek, only finished matches
  const clubFixtures = fixtures.filter(
    (f) =>
      (f.homeTeam === clubName || f.awayTeam === clubName) &&
      f.matchweek <= maxMatchweek &&
      f.status === "finished" &&
      f.homeScore !== null &&
      f.awayScore !== null
  );

  let points = 0;
  let wins = 0;
  let draws = 0;
  let losses = 0;
  let goalsFor = 0;
  let goalsAgainst = 0;

  clubFixtures.forEach((fixture) => {
    const isHome = fixture.homeTeam === clubName;
    const clubScore = isHome ? fixture.homeScore! : fixture.awayScore!;
    const opponentScore = isHome ? fixture.awayScore! : fixture.homeScore!;

    goalsFor += clubScore;
    goalsAgainst += opponentScore;

    if (clubScore > opponentScore) {
      points += 3;
      wins++;
    } else if (clubScore === opponentScore) {
      points += 1;
      draws++;
    } else {
      losses++;
    }
  });

  return {
    points,
    wins,
    draws,
    losses,
    played: clubFixtures.length,
    goalsFor,
    goalsAgainst,
  };
}

/**
 * Gets the current matchweek based on finished matches
 * Returns the highest matchweek that has finished matches
 */
export function getCurrentMatchweekFromFixtures(fixtures: Fixture[]): number {
  const finishedMatches = fixtures.filter(
    (f) => f.status === "finished" && f.homeScore !== null && f.awayScore !== null
  );

  if (finishedMatches.length === 0) {
    return 0;
  }

  const finishedMatchweeks = finishedMatches.map((f) => f.matchweek);
  const maxFinishedMatchweek = Math.max(...finishedMatchweeks);

  // Check if this matchweek has enough matches (at least 8 out of 10)
  const matchesInMaxWeek = finishedMatches.filter(
    (f) => f.matchweek === maxFinishedMatchweek
  ).length;

  if (matchesInMaxWeek >= 8) {
    return maxFinishedMatchweek;
  } else {
    return Math.max(0, maxFinishedMatchweek - 1);
  }
}

/**
 * Gets available seasons from fixtures
 */
export function getAvailableSeasons(fixtures: Fixture[]): string[] {
  const seasons = new Set<string>();
  fixtures.forEach((f) => {
    if (f.season) {
      seasons.add(f.season);
    }
  });
  return Array.from(seasons).sort().reverse(); // Most recent first
}
