import { useMemo } from "react";
import { Fixture } from "@/lib/types";
import { getCurrentMatchweek } from "@/lib/utils";
import { normalizeUpcomingMatchweeks } from "@/lib/utils/fixtures-utils";

type TabType = "fixtures" | "results";

interface FixturesResultsDataParams {
  fixtures: Fixture[];
  results: Fixture[];
  activeTab: TabType;
  selectedMatchweek: number | null;
  searchQuery: string;
}

interface FixturesResultsData {
  upcomingFixtures: Fixture[];
  currentMatchweek: number | null;
  matchweeks: number[];
  filteredMatches: Fixture[];
  groupedByMatchweek: Record<number, Fixture[]>;
}

export function useFixturesResultsData({
  fixtures,
  results,
  activeTab,
  selectedMatchweek,
  searchQuery,
}: FixturesResultsDataParams): FixturesResultsData {
  const baseCurrentMatchweek = useMemo(
    () => getCurrentMatchweek(fixtures),
    [fixtures]
  );

  const normalizedFixtures = useMemo(
    () => normalizeUpcomingMatchweeks(fixtures, baseCurrentMatchweek),
    [fixtures, baseCurrentMatchweek]
  );

  const resultIds = useMemo(() => new Set(results.map((result) => result.id)), [
    results,
  ]);
  const resultKeys = useMemo(
    () =>
      new Set(
        results.map(
          (result) => `${result.homeTeam}-${result.awayTeam}-${result.date.split("T")[0]}`
        )
      ),
    [results]
  );

  const upcomingFixtures = useMemo(
    () =>
      normalizedFixtures.filter((fixture) => {
        if (fixture.status === "finished") return false;
        if (resultIds.has(fixture.id)) return false;
        const fixtureKey = `${fixture.homeTeam}-${fixture.awayTeam}-${fixture.date.split("T")[0]}`;
        if (resultKeys.has(fixtureKey)) return false;
        return true;
      }),
    [normalizedFixtures, resultIds, resultKeys]
  );

  const currentMatchweek = useMemo(() => {
    if (baseCurrentMatchweek > 0) {
      return baseCurrentMatchweek;
    }
    if (upcomingFixtures.length > 0) {
      return Math.min(...upcomingFixtures.map((fixture) => fixture.matchweek));
    }
    return null;
  }, [baseCurrentMatchweek, upcomingFixtures]);

  const currentData = activeTab === "fixtures" ? upcomingFixtures : results;
  const matchweeks = useMemo(
    () =>
      Array.from(new Set(currentData.map((fixture) => fixture.matchweek))).sort(
        activeTab === "fixtures" ? (a, b) => a - b : (a, b) => b - a
      ),
    [currentData, activeTab]
  );

  const filteredMatches = useMemo(() => {
    let filtered = currentData;

    if (selectedMatchweek) {
      filtered = filtered.filter(
        (fixture) => fixture.matchweek === selectedMatchweek
      );
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (fixture) =>
          fixture.homeTeam.toLowerCase().includes(query) ||
          fixture.awayTeam.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [currentData, selectedMatchweek, searchQuery]);

  const groupedByMatchweek = useMemo(
    () =>
      filteredMatches.reduce<Record<number, Fixture[]>>((acc, match) => {
        const matchweek = match.matchweek;
        if (!acc[matchweek]) {
          acc[matchweek] = [];
        }
        acc[matchweek]!.push(match);
        return acc;
      }, {}),
    [filteredMatches]
  );

  return {
    upcomingFixtures,
    currentMatchweek,
    matchweeks,
    filteredMatches,
    groupedByMatchweek,
  };
}
