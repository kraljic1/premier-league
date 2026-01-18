import { Fixture } from "@/lib/types";

const DATE_GROUP_THRESHOLD_MS = 3 * 24 * 60 * 60 * 1000;

function groupUpcomingFixturesByDate(fixtures: Fixture[]): Fixture[][] {
  const sortedFixtures = [...fixtures].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  const groups: Fixture[][] = [];
  let currentGroup: Fixture[] = [];
  let lastDate: Date | null = null;

  for (const fixture of sortedFixtures) {
    const fixtureDate = new Date(fixture.date);
    if (
      !lastDate ||
      fixtureDate.getTime() - lastDate.getTime() > DATE_GROUP_THRESHOLD_MS
    ) {
      if (currentGroup.length > 0) {
        groups.push(currentGroup);
      }
      currentGroup = [fixture];
    } else {
      currentGroup.push(fixture);
    }
    lastDate = fixtureDate;
  }

  if (currentGroup.length > 0) {
    groups.push(currentGroup);
  }

  return groups;
}

export function normalizeUpcomingMatchweeks(
  fixtures: Fixture[],
  currentMatchweek: number
): Fixture[] {
  if (currentMatchweek <= 0) {
    return fixtures;
  }

  const upcomingFixtures = fixtures.filter(
    (fixture) => fixture.status !== "finished"
  );

  if (upcomingFixtures.length === 0) {
    return fixtures;
  }

  const hasUpcomingInCurrent = upcomingFixtures.some(
    (fixture) => fixture.matchweek === currentMatchweek
  );
  const startMatchweek = hasUpcomingInCurrent
    ? currentMatchweek
    : currentMatchweek + 1;

  const groupedUpcomingFixtures = groupUpcomingFixturesByDate(upcomingFixtures);
  const fixtureGroupIndex = new Map<string, number>();
  groupedUpcomingFixtures.forEach((group, index) => {
    group.forEach((fixture) => fixtureGroupIndex.set(fixture.id, index));
  });

  return fixtures.map((fixture) => {
    if (fixture.status === "finished") {
      return fixture;
    }

    const groupIndex = fixtureGroupIndex.get(fixture.id);
    if (groupIndex === undefined) {
      if (fixture.matchweek < startMatchweek) {
        return { ...fixture, matchweek: startMatchweek };
      }
      return fixture;
    }

    if (fixture.matchweek >= startMatchweek) {
      return fixture;
    }

    return { ...fixture, matchweek: startMatchweek + groupIndex };
  });
}
