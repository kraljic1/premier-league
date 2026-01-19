"use client";

import { useMemo } from "react";
import { getCurrentSeasonFull } from "../utils/season-utils";
import { calculateHeadToHead, getFinishedHeadToHeadMatches } from "../utils/head-to-head-utils";
import { ComparisonBasis, Fixture } from "../types";

interface UseHeadToHeadComparisonParams {
  clubA: string | null;
  clubB: string | null;
  isCurrentSeasonA: boolean;
  isCurrentSeasonB: boolean;
  selectedSeasonA: string | null;
  selectedSeasonB: string | null;
  currentSeasonFixtures: Fixture[];
  historicalFixturesAFiltered: Fixture[];
  effectiveMatchweekA: number;
  effectiveMatchweekB: number;
  comparisonBasis: ComparisonBasis;
  comparisonCutoffDate: number | null;
}

export function useHeadToHeadComparison({
  clubA,
  clubB,
  isCurrentSeasonA,
  isCurrentSeasonB,
  selectedSeasonA,
  selectedSeasonB,
  currentSeasonFixtures,
  historicalFixturesAFiltered,
  effectiveMatchweekA,
  effectiveMatchweekB,
  comparisonBasis,
  comparisonCutoffDate,
}: UseHeadToHeadComparisonParams) {
  const headToHeadMatches = useMemo(() => {
    if (!clubA || !clubB) return [];
    const seasonA = isCurrentSeasonA ? getCurrentSeasonFull() : selectedSeasonA;
    const seasonB = isCurrentSeasonB ? getCurrentSeasonFull() : selectedSeasonB;
    if (seasonA !== seasonB) return [];

    const fixtures = isCurrentSeasonA ? currentSeasonFixtures : historicalFixturesAFiltered;
    if (fixtures.length === 0) return [];

    const allH2H = getFinishedHeadToHeadMatches(fixtures, clubA, clubB);
    const effectiveMatchweek = isCurrentSeasonA ? effectiveMatchweekA : effectiveMatchweekB;

    if (comparisonBasis === "matches-played" && comparisonCutoffDate !== null) {
      return allH2H.filter((fixture) => {
        const fixtureDate = new Date(fixture.date).getTime();
        return !Number.isNaN(fixtureDate) && fixtureDate <= comparisonCutoffDate;
      });
    }

    return allH2H.filter((fixture) => fixture.matchweek <= effectiveMatchweek);
  }, [
    clubA,
    clubB,
    isCurrentSeasonA,
    isCurrentSeasonB,
    selectedSeasonA,
    selectedSeasonB,
    currentSeasonFixtures,
    historicalFixturesAFiltered,
    effectiveMatchweekA,
    effectiveMatchweekB,
    comparisonBasis,
    comparisonCutoffDate,
  ]);

  const headToHeadSummary = useMemo(() => {
    if (!clubA || !clubB) return null;
    const seasonA = isCurrentSeasonA ? getCurrentSeasonFull() : selectedSeasonA;
    const seasonB = isCurrentSeasonB ? getCurrentSeasonFull() : selectedSeasonB;
    if (seasonA !== seasonB) return null;

    const fixtures = isCurrentSeasonA ? currentSeasonFixtures : historicalFixturesAFiltered;
    if (fixtures.length === 0) return null;

    const effectiveMatchweek = isCurrentSeasonA ? effectiveMatchweekA : effectiveMatchweekB;
    const filteredFixtures =
      comparisonBasis === "matches-played" && comparisonCutoffDate !== null
        ? fixtures.filter((fixture) => {
            const fixtureDate = new Date(fixture.date).getTime();
            return !Number.isNaN(fixtureDate) && fixtureDate <= comparisonCutoffDate;
          })
        : fixtures.filter((fixture) => fixture.matchweek <= effectiveMatchweek);

    return calculateHeadToHead(filteredFixtures, clubA, clubB);
  }, [
    clubA,
    clubB,
    isCurrentSeasonA,
    isCurrentSeasonB,
    selectedSeasonA,
    selectedSeasonB,
    currentSeasonFixtures,
    historicalFixturesAFiltered,
    effectiveMatchweekA,
    effectiveMatchweekB,
    comparisonBasis,
    comparisonCutoffDate,
  ]);

  return { headToHeadMatches, headToHeadSummary };
}
