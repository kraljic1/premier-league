import { Fixture } from "../types";

export interface HeadToHeadSummary {
  clubAWins: number;
  clubBWins: number;
  draws: number;
  clubAGoals: number;
  clubBGoals: number;
}

/**
 * Get head-to-head matches between two clubs
 */
export function getHeadToHeadMatches(
  fixtures: Fixture[],
  clubA: string,
  clubB: string
): Fixture[] {
  return fixtures.filter(
    (f) =>
      (f.homeTeam === clubA && f.awayTeam === clubB) ||
      (f.homeTeam === clubB && f.awayTeam === clubA)
  );
}

/**
 * Calculate head-to-head summary for two clubs
 */
export function calculateHeadToHead(
  fixtures: Fixture[],
  clubA: string,
  clubB: string
): HeadToHeadSummary {
  const h2hMatches = getHeadToHeadMatches(fixtures, clubA, clubB);
  let clubAWins = 0;
  let clubBWins = 0;
  let draws = 0;
  let clubAGoals = 0;
  let clubBGoals = 0;

  h2hMatches.forEach((match) => {
    if (match.homeScore === null || match.awayScore === null) return;

    const isClubAHome = match.homeTeam === clubA;
    const clubAMatchGoals = isClubAHome ? match.homeScore : match.awayScore;
    const clubBMatchGoals = isClubAHome ? match.awayScore : match.homeScore;

    clubAGoals += clubAMatchGoals;
    clubBGoals += clubBMatchGoals;

    if (clubAMatchGoals > clubBMatchGoals) {
      clubAWins++;
    } else if (clubBMatchGoals > clubAMatchGoals) {
      clubBWins++;
    } else {
      draws++;
    }
  });

  return { clubAWins, clubBWins, draws, clubAGoals, clubBGoals };
}

/**
 * Get finished head-to-head matches (with scores)
 */
export function getFinishedHeadToHeadMatches(
  fixtures: Fixture[],
  clubA: string,
  clubB: string
): Fixture[] {
  return getHeadToHeadMatches(fixtures, clubA, clubB).filter(
    (f) => f.homeScore !== null && f.awayScore !== null
  );
}
