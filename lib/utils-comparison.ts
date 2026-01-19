import { Fixture } from "./types";
import { normalizeClubName } from "./utils/club-name-utils";

const PREMIER_LEAGUE_COMPETITION = "Premier League";

/**
 * Filters fixtures to Premier League only.
 * Accepts legacy rows where competition is missing and round is not set.
 */
export function filterPremierLeagueFixtures(fixtures: Fixture[]): Fixture[] {
  return fixtures.filter((fixture) => {
    if (fixture.competition === PREMIER_LEAGUE_COMPETITION) return true;
    if (fixture.competition) return false;
    return fixture.competitionRound === null || fixture.competitionRound === undefined;
  });
}

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
  const clubFixtures = getFinishedClubFixtures(fixtures, clubName).filter(
    (fixture) => getComparisonMatchweek(fixture) <= maxMatchweek
  );
  return calculateStatsFromFixtures(clubFixtures, clubName);
}

export function calculatePointsForClubByMatchesPlayed(
  fixtures: Fixture[],
  clubName: string,
  maxMatchesPlayed: number
): {
  points: number;
  wins: number;
  draws: number;
  losses: number;
  played: number;
  goalsFor: number;
  goalsAgainst: number;
} {
  const clubFixtures = getFinishedClubFixturesSortedByDate(fixtures, clubName).slice(
    0,
    Math.max(maxMatchesPlayed, 0)
  );
  return calculateStatsFromFixtures(clubFixtures, clubName);
}

export function getFinishedClubFixtures(fixtures: Fixture[], clubName: string): Fixture[] {
  const normalizedClubName = normalizeClubName(clubName);
  return fixtures.filter(
    (f) =>
      (normalizeClubName(f.homeTeam) === normalizedClubName ||
        normalizeClubName(f.awayTeam) === normalizedClubName) &&
      f.status === "finished" &&
      f.homeScore !== null &&
      f.awayScore !== null
  );
}

export function getComparisonMatchweek(fixture: Fixture): number {
  return fixture.originalMatchweek ?? fixture.matchweek;
}

export function getFinishedClubFixturesSortedByDate(
  fixtures: Fixture[],
  clubName: string
): Fixture[] {
  return sortFixturesByDate(getFinishedClubFixtures(fixtures, clubName));
}

export function getCutoffDateForMatchesPlayed(
  fixtures: Fixture[],
  clubName: string,
  maxMatchesPlayed: number
): number | null {
  if (maxMatchesPlayed <= 0) return null;

  const sortedFixtures = getFinishedClubFixturesSortedByDate(fixtures, clubName);
  if (sortedFixtures.length === 0) return null;

  const cutoffIndex = Math.min(maxMatchesPlayed, sortedFixtures.length) - 1;
  const cutoffDate = new Date(sortedFixtures[cutoffIndex].date).getTime();
  return Number.isNaN(cutoffDate) ? null : cutoffDate;
}

export function sortFixturesByDate(fixtures: Fixture[]): Fixture[] {
  return [...fixtures].sort((a, b) => {
    const dateA = new Date(a.date).getTime();
    const dateB = new Date(b.date).getTime();

    if (Number.isNaN(dateA) && Number.isNaN(dateB)) {
      return a.matchweek - b.matchweek;
    }

    if (Number.isNaN(dateA)) return 1;
    if (Number.isNaN(dateB)) return -1;

    if (dateA !== dateB) return dateA - dateB;
    return a.matchweek - b.matchweek;
  });
}

function calculateStatsFromFixtures(
  clubFixtures: Fixture[],
  clubName: string
): {
  points: number;
  wins: number;
  draws: number;
  losses: number;
  played: number;
  goalsFor: number;
  goalsAgainst: number;
} {
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
 * Returns the highest matchweek that has at least one finished match
 * 
 * Note: We count ALL finished matches, even if the matchweek isn't complete.
 * This ensures that if Arsenal played in MW22, their result is counted
 * even if other MW22 matches haven't been played yet.
 */
export function getCurrentMatchweekFromFixtures(fixtures: Fixture[]): number {
  const finishedMatches = fixtures.filter(
    (f) => f.status === "finished" && f.homeScore !== null && f.awayScore !== null
  );

  if (finishedMatches.length === 0) {
    return 0;
  }

  const finishedMatchweeks = finishedMatches.map((fixture) => getComparisonMatchweek(fixture));
  const maxFinishedMatchweek = Math.max(...finishedMatchweeks);

  // Return the highest matchweek that has any finished matches
  // This ensures all finished matches are counted in comparisons
  return maxFinishedMatchweek;
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
