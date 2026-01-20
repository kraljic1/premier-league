import { Fixture } from "./types";
import { normalizeClubName } from "./utils/club-name-utils";

const PREMIER_LEAGUE_COMPETITION = "Premier League";
// Filters fixtures to Premier League only (supports legacy rows).
export function filterPremierLeagueFixtures(fixtures: Fixture[]): Fixture[] {
  return fixtures.filter((fixture) => {
    if (fixture.competition === PREMIER_LEAGUE_COMPETITION) return true;
    if (fixture.competition) return false;
    return fixture.competitionRound === null || fixture.competitionRound === undefined;
  });
}
function buildNormalizedFixtureKey(fixture: Fixture): string {
  const dateOnly = fixture.date.split("T")[0];
  const normalizedHomeTeam = normalizeClubName(fixture.homeTeam);
  const normalizedAwayTeam = normalizeClubName(fixture.awayTeam);
  return `${normalizedHomeTeam}-${normalizedAwayTeam}-${dateOnly}`
    .toLowerCase()
    .replace(/\s+/g, "-");
}
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
  const seen = new Set<string>();
  return fixtures.filter((fixture) => {
    const isClubMatch =
      normalizeClubName(fixture.homeTeam) === normalizedClubName ||
      normalizeClubName(fixture.awayTeam) === normalizedClubName;
    const isFinished =
      fixture.status === "finished" &&
      fixture.homeScore !== null &&
      fixture.awayScore !== null;

    if (!isClubMatch || !isFinished) return false;

    const key = buildNormalizedFixtureKey(fixture);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
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

  const normalizedClubName = normalizeClubName(clubName);

  clubFixtures.forEach((fixture) => {
    const isHome = normalizeClubName(fixture.homeTeam) === normalizedClubName;
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

// Current matchweek = highest matchweek with any finished match.
export function getCurrentMatchweekFromFixtures(fixtures: Fixture[]): number {
  const finishedMatches = fixtures.filter(
    (f) => f.status === "finished" && f.homeScore !== null && f.awayScore !== null
  );

  if (finishedMatches.length === 0) {
    return 0;
  }

  const finishedMatchweeks = finishedMatches.map((fixture) => getComparisonMatchweek(fixture));
  const maxFinishedMatchweek = Math.max(...finishedMatchweeks);

  return maxFinishedMatchweek;
}

// Gets available seasons from fixtures.
export function getAvailableSeasons(fixtures: Fixture[]): string[] {
  const seasons = new Set<string>();
  fixtures.forEach((f) => {
    if (f.season) {
      seasons.add(f.season);
    }
  });
  return Array.from(seasons).sort().reverse(); // Most recent first
}
