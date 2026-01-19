"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchCurrentSeasonFixtures, fetchHistoricalSeason } from "../api/compare-season-api";
import { filterPremierLeagueFixtures, getCurrentMatchweekFromFixtures } from "../utils-comparison";
import {
  getCurrentSeasonShort,
  getCurrentSeasonFull,
  getCurrentSeasonStartDate,
  getCurrentSeasonEndDate,
  getPreviousSeasons,
} from "../utils/season-utils";
import { Fixture } from "../types";

// Get current season values dynamically
const CURRENT_SEASON_SHORT = getCurrentSeasonShort();
const CURRENT_SEASON_FULL = getCurrentSeasonFull();
const CURRENT_SEASON_START = getCurrentSeasonStartDate();
const CURRENT_SEASON_END = getCurrentSeasonEndDate();

/**
 * Filters fixtures to only include those from the current season.
 */
function filterCurrentSeasonFixtures(fixtures: Fixture[]): Fixture[] {
  return fixtures.filter((fixture) => {
    if (fixture.season) {
      return fixture.season === CURRENT_SEASON_SHORT || fixture.season === CURRENT_SEASON_FULL;
    }
    const fixtureDate = new Date(fixture.date);
    return fixtureDate >= CURRENT_SEASON_START && fixtureDate <= CURRENT_SEASON_END;
  });
}

interface UseCompareTwoClubsDataParams {
  selectedSeasonA: string | null;
  selectedSeasonB: string | null;
  isCurrentSeasonA: boolean;
  isCurrentSeasonB: boolean;
}

export function useCompareTwoClubsData({
  selectedSeasonA,
  selectedSeasonB,
  isCurrentSeasonA,
  isCurrentSeasonB,
}: UseCompareTwoClubsDataParams) {
  // Fetch current season fixtures
  const {
    data: allCurrentFixtures = [],
    isLoading: isLoadingCurrent,
    error: currentError,
    refetch: refetchCurrent,
  } = useQuery({
    queryKey: ["currentFixtures"],
    queryFn: fetchCurrentSeasonFixtures,
    staleTime: 0, // Always consider data stale
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes max
    refetchOnMount: "always", // Always refetch when component mounts
  });

  // Filter for current season only
  const currentSeasonFixtures = useMemo(() => {
    const seasonFixtures = filterCurrentSeasonFixtures(allCurrentFixtures);
    return filterPremierLeagueFixtures(seasonFixtures);
  }, [allCurrentFixtures]);

  // Fetch historical season fixtures for Club A
  const {
    data: historicalFixturesA = [],
    isLoading: isLoadingHistoricalA,
    error: historicalErrorA,
    refetch: refetchHistoricalA,
  } = useQuery({
    queryKey: ["historicalFixtures", selectedSeasonA],
    queryFn: async () => {
      if (!selectedSeasonA) return [];
      return await fetchHistoricalSeason(selectedSeasonA);
    },
    enabled: !!selectedSeasonA && !isCurrentSeasonA,
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: false,
  });

  // Fetch historical season fixtures for Club B
  const {
    data: historicalFixturesB = [],
    isLoading: isLoadingHistoricalB,
    error: historicalErrorB,
    refetch: refetchHistoricalB,
  } = useQuery({
    queryKey: ["historicalFixtures", selectedSeasonB],
    queryFn: async () => {
      if (!selectedSeasonB) return [];
      return await fetchHistoricalSeason(selectedSeasonB);
    },
    enabled: !!selectedSeasonB && !isCurrentSeasonB,
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: false,
  });

  const historicalFixturesAFiltered = useMemo(() => {
    return filterPremierLeagueFixtures(historicalFixturesA);
  }, [historicalFixturesA]);

  const historicalFixturesBFiltered = useMemo(() => {
    return filterPremierLeagueFixtures(historicalFixturesB);
  }, [historicalFixturesB]);

  // Get fixtures for Club A based on selected season
  const fixturesA = useMemo(() => {
    return isCurrentSeasonA ? currentSeasonFixtures : historicalFixturesAFiltered;
  }, [isCurrentSeasonA, currentSeasonFixtures, historicalFixturesAFiltered]);

  // Get fixtures for Club B based on selected season
  const fixturesB = useMemo(() => {
    return isCurrentSeasonB ? currentSeasonFixtures : historicalFixturesBFiltered;
  }, [isCurrentSeasonB, currentSeasonFixtures, historicalFixturesBFiltered]);

  // Calculate current matchweek from the current season fixtures
  const currentMatchweek = useMemo(() => {
    return getCurrentMatchweekFromFixtures(currentSeasonFixtures);
  }, [currentSeasonFixtures]);

  // Get all available seasons (current + previous)
  const availableSeasons = useMemo(() => {
    const previousSeasons = getPreviousSeasons(5);
    return [getCurrentSeasonFull(), ...previousSeasons];
  }, []);

  return {
    currentSeasonFixtures,
    historicalFixturesAFiltered,
    historicalFixturesBFiltered,
    fixturesA,
    fixturesB,
    currentMatchweek,
    availableSeasons,
    isLoading: isLoadingCurrent || (isLoadingHistoricalA && !isCurrentSeasonA) || (isLoadingHistoricalB && !isCurrentSeasonB),
    error: currentError || historicalErrorA || historicalErrorB,
    refetch: () => {
      refetchCurrent();
      if (!isCurrentSeasonA) refetchHistoricalA();
      if (!isCurrentSeasonB) refetchHistoricalB();
    },
    currentSeasonLabel: CURRENT_SEASON_FULL,
  };
}
