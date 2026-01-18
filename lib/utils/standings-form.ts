import { Fixture, Standing } from "@/lib/types";

const MAX_FORM_RESULTS = 6;

function getResultForClub(fixture: Fixture, club: string): "W" | "D" | "L" | null {
  if (fixture.homeScore === null || fixture.awayScore === null) return null;

  if (fixture.homeTeam === club) {
    if (fixture.homeScore > fixture.awayScore) return "W";
    if (fixture.homeScore < fixture.awayScore) return "L";
    return "D";
  }

  if (fixture.awayTeam === club) {
    if (fixture.awayScore > fixture.homeScore) return "W";
    if (fixture.awayScore < fixture.homeScore) return "L";
    return "D";
  }

  return null;
}

export function buildStandingsFormMap(
  fixtures: Fixture[],
  standings: Standing[]
): Record<string, string> {
  const formBuckets = new Map<string, string[]>();
  standings.forEach((standing) => formBuckets.set(standing.club, []));

  const finishedFixtures = fixtures
    .filter(
      (fixture) =>
        fixture.status === "finished" &&
        fixture.homeScore !== null &&
        fixture.awayScore !== null
    )
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  let clubsNeedingResults = standings.length;

  for (const fixture of finishedFixtures) {
    if (clubsNeedingResults === 0) break;

    const homeBucket = formBuckets.get(fixture.homeTeam);
    if (homeBucket && homeBucket.length < MAX_FORM_RESULTS) {
      const result = getResultForClub(fixture, fixture.homeTeam);
      if (result) {
        homeBucket.push(result);
        if (homeBucket.length === MAX_FORM_RESULTS) {
          clubsNeedingResults -= 1;
        }
      }
    }

    const awayBucket = formBuckets.get(fixture.awayTeam);
    if (awayBucket && awayBucket.length < MAX_FORM_RESULTS) {
      const result = getResultForClub(fixture, fixture.awayTeam);
      if (result) {
        awayBucket.push(result);
        if (awayBucket.length === MAX_FORM_RESULTS) {
          clubsNeedingResults -= 1;
        }
      }
    }
  }

  const formMap: Record<string, string> = {};
  for (const [club, results] of formBuckets.entries()) {
    formMap[club] = results.join("");
  }
  return formMap;
}
