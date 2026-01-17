import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { calculatePointsForClub } from "../utils-comparison";
import {
  fetchCurrentSeasonFixtures,
  fetchHistoricalSeason,
} from "../api/compare-season-api";
import { Fixture } from "../types";
import {
  getCurrentSeasonShort,
  getCurrentSeasonFull,
  getCurrentSeasonStartDate,
  getCurrentSeasonEndDate,
  getPreviousSeasons,
} from "../utils/season-utils";
import {
  getFinishedHeadToHeadMatches,
  calculateHeadToHead,
} from "../utils/head-to-head-utils";

// Get current season values dynamically
const CURRENT_SEASON_SHORT = getCurrentSeasonShort();
const CURRENT_SEASON_FULL = getCurrentSeasonFull();
const CURRENT_SEASON_START = getCurrentSeasonStartDate();
const CURRENT_SEASON_END = getCurrentSeasonEndDate();

/**
 * Filters fixtures to only include those from the current season.
 */
function filterCurrentSeasonFixtures(fixtures: Fixture[]): Fixture[] {
  return fixtures.filter((f) => {
    if (f.season) {
      return f.season === CURRENT_SEASON_SHORT || f.season === CURRENT_SEASON_FULL;
    }
    const fixtureDate = new Date(f.date);
    return fixtureDate >= CURRENT_SEASON_START && fixtureDate <= CURRENT_SEASON_END;
  });
}

export function useCompareTwoClubs() {
  const [clubA, setClubA] = useState<string | null>(null);
  const [clubB, setClubB] = useState<string | null>(null);
  const [selectedSeason, setSelectedSeason] = useState<string | null>(null);
  const [isCurrentSeason, setIsCurrentSeason] = useState(true);

  // Fetch current season fixtures
  const {
    data: allCurrentFixtures = [],
    isLoading: isLoadingCurrent,
    error: currentError,
    refetch: refetchCurrent,
  } = useQuery({
    queryKey: ["currentFixtures"],
    queryFn: fetchCurrentSeasonFixtures,
  });

  // Filter for current season only
  const currentSeasonFixtures = useMemo(() => {
    return filterCurrentSeasonFixtures(allCurrentFixtures);
  }, [allCurrentFixtures]);

  // Fetch historical season fixtures
  const {
    data: historicalFixtures = [],
    isLoading: isLoadingHistorical,
    error: historicalError,
    refetch: refetchHistorical,
  } = useQuery({
    queryKey: ["historicalFixtures", selectedSeason],
    queryFn: async () => {
      if (!selectedSeason) return [];
      return await fetchHistoricalSeason(selectedSeason);
    },
    enabled: !!selectedSeason && !isCurrentSeason,
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: false,
  });

  // Get fixtures based on selected season
  const fixtures = useMemo(() => {
    return isCurrentSeason ? currentSeasonFixtures : historicalFixtures;
  }, [isCurrentSeason, currentSeasonFixtures, historicalFixtures]);

  // Get all available seasons (current + previous)
  const availableSeasons = useMemo(() => {
    const previousSeasons = getPreviousSeasons(5);
    return [getCurrentSeasonFull(), ...previousSeasons];
  }, []);

  // Calculate stats for both clubs
  const clubAStats = useMemo(() => {
    if (!clubA || fixtures.length === 0) return null;
    return calculatePointsForClub(fixtures, clubA, 38);
  }, [clubA, fixtures]);

  const clubBStats = useMemo(() => {
    if (!clubB || fixtures.length === 0) return null;
    return calculatePointsForClub(fixtures, clubB, 38);
  }, [clubB, fixtures]);

  // Get head-to-head data
  const headToHeadMatches = useMemo(() => {
    if (!clubA || !clubB || fixtures.length === 0) return [];
    return getFinishedHeadToHeadMatches(fixtures, clubA, clubB);
  }, [clubA, clubB, fixtures]);

  const headToHeadSummary = useMemo(() => {
    if (!clubA || !clubB || fixtures.length === 0) return null;
    return calculateHeadToHead(fixtures, clubA, clubB);
  }, [clubA, clubB, fixtures]);

  const handleSeasonChange = (season: string | null) => {
    if (season === getCurrentSeasonFull()) {
      setIsCurrentSeason(true);
      setSelectedSeason(null);
    } else {
      setIsCurrentSeason(false);
      setSelectedSeason(season);
    }
  };

  const currentSeasonLabel = getCurrentSeasonFull();

  return {
    clubA,
    setClubA,
    clubB,
    setClubB,
    selectedSeason: isCurrentSeason ? currentSeasonLabel : selectedSeason,
    handleSeasonChange,
    isCurrentSeason,
    fixtures,
    clubAStats,
    clubBStats,
    headToHeadMatches,
    headToHeadSummary,
    availableSeasons,
    isLoading: isLoadingCurrent || (isLoadingHistorical && !isCurrentSeason),
    error: currentError || historicalError,
    refetch: () => {
      refetchCurrent();
      if (!isCurrentSeason) refetchHistorical();
    },
    currentSeasonLabel,
  };
}
