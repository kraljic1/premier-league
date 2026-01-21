import { Fixture } from "@/lib/types";
import {
  PREMIER_LEAGUE_COMPETITION,
  getCompetitionSourcesForCompetitions,
} from "@/lib/competition-sources";
import { scrapeFixtures } from "@/lib/scrapers/fixtures";
import { scrapeFixturesFromOneFootball } from "@/lib/scrapers/onefootball-fixtures";
import { scrapeCompetitionFixturesForClubs } from "@/lib/scrapers/competition-fixtures";

type ScrapeResult = {
  fixtures: Fixture[];
  sources: string[];
};

function dedupeFixtures(fixtures: Fixture[]): Fixture[] {
  const seen = new Set<string>();
  const deduped: Fixture[] = [];

  for (const fixture of fixtures) {
    if (seen.has(fixture.id)) {
      continue;
    }
    seen.add(fixture.id);
    deduped.push(fixture);
  }

  return deduped;
}

function normalizePremierLeagueFixtures(fixtures: Fixture[]): Fixture[] {
  return fixtures.map((fixture) => ({
    ...fixture,
    competition: PREMIER_LEAGUE_COMPETITION,
    competitionRound: fixture.competitionRound ?? null,
  }));
}

export async function scrapeFixturesForCompetitions(
  competitions: string[]
): Promise<ScrapeResult> {
  const fixtures: Fixture[] = [];
  const sources: string[] = [];
  const competitionSet = new Set(competitions);

  if (competitionSet.has(PREMIER_LEAGUE_COMPETITION)) {
    try {
      const oneFootballFixtures = await scrapeFixturesFromOneFootball();
      fixtures.push(...normalizePremierLeagueFixtures(oneFootballFixtures));
      sources.push("onefootball");
    } catch (error) {
      console.warn(
        "[Fixtures Aggregator] OneFootball failed, falling back to official site:",
        error
      );
      const officialFixtures = await scrapeFixtures();
      fixtures.push(...normalizePremierLeagueFixtures(officialFixtures));
      sources.push("official-site");
    }
  }

  const competitionSources = getCompetitionSourcesForCompetitions(competitions);
  if (competitionSources.length > 0) {
    const competitionFixtures = await scrapeCompetitionFixturesForClubs(
      competitionSources
    );
    fixtures.push(...competitionFixtures);
    sources.push("rezultati-competitions");
  }

  const deduped = dedupeFixtures(fixtures).sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  return { fixtures: deduped, sources };
}
