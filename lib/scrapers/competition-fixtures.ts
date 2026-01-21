import { Fixture } from "@/lib/types";
import { CLUBS } from "@/lib/clubs";
import { normalizeClubName } from "@/lib/utils/club-name-utils";
import { scrapeCompetitionFixtures, CompetitionSource } from "./rezultati-competition-fixtures";

const CLUB_NAME_SET = new Set(
  Object.values(CLUBS).map((club) => normalizeClubName(club.name))
);

function isKnownClub(clubName: string): boolean {
  return CLUB_NAME_SET.has(normalizeClubName(clubName));
}

function isFixtureForKnownClubs(fixture: Fixture): boolean {
  return isKnownClub(fixture.homeTeam) || isKnownClub(fixture.awayTeam);
}

export async function scrapeCompetitionFixturesForClubs(
  sources: CompetitionSource[]
): Promise<Fixture[]> {
  const fixtures: Fixture[] = [];

  for (const source of sources) {
    try {
      const competitionFixtures = await scrapeCompetitionFixtures(source);
      const filteredFixtures = competitionFixtures.filter(isFixtureForKnownClubs);
      fixtures.push(...filteredFixtures);
    } catch (error) {
      console.error(
        `[Competition Fixtures] Failed to scrape ${source.competition}:`,
        error
      );
    }
  }

  return fixtures.sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
}
