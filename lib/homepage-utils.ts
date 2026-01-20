import { Fixture } from "@/lib/types";
import { CLUBS } from "@/lib/clubs";
import { getCurrentMatchweek } from "@/lib/utils";

const MAX_MATCHWEEK = 38;

export function getNextMatch(fixtures: Fixture[], myClubs: string[]): Fixture | null {
  const now = new Date();
  const clubNames = myClubs
    .map((id) => CLUBS[id]?.name)
    .filter(Boolean) as string[];

  return (
    fixtures.find((f) => {
      const matchDate = new Date(f.date);
      const isMyClub =
        clubNames.includes(f.homeTeam) || clubNames.includes(f.awayTeam);
      return matchDate > now && isMyClub;
    }) || null
  );
}

export function getMatchweekFixtures(fixtures: Fixture[], matchweek: number): Fixture[] {
  return fixtures.filter((fixture) => fixture.matchweek === matchweek);
}

function isMatchweekComplete(fixtures: Fixture[], matchweek: number): boolean {
  const matchweekFixtures = getMatchweekFixtures(fixtures, matchweek);
  if (matchweekFixtures.length === 0) {
    return false;
  }

  return matchweekFixtures.every((fixture) => {
    const hasScore =
      fixture.homeScore !== null &&
      fixture.awayScore !== null;
    return fixture.status === "finished" || hasScore;
  });
}

export function getHomepageMatchweek(fixtures: Fixture[]): number {
  const currentMatchweek = getCurrentMatchweek(fixtures);
  const fallbackMatchweek = currentMatchweek === 0 ? 1 : currentMatchweek;

  if (isMatchweekComplete(fixtures, fallbackMatchweek)) {
    return Math.min(fallbackMatchweek + 1, MAX_MATCHWEEK);
  }

  return fallbackMatchweek;
}

export function getNextMatchweekFixtures(fixtures: Fixture[], matchweek: number): Fixture[] {
  const nextMatchweek = matchweek + 1;
  if (nextMatchweek > MAX_MATCHWEEK) {
    return [];
  }

  return fixtures.filter((fixture) => fixture.matchweek === nextMatchweek);
}
