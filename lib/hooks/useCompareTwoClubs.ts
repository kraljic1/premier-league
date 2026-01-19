import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  calculatePointsForClub,
  getCurrentMatchweekFromFixtures,
  filterPremierLeagueFixtures,
} from "../utils-comparison";
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
  const [selectedSeasonA, setSelectedSeasonA] = useState<string | null>(null);
  const [selectedSeasonB, setSelectedSeasonB] = useState<string | null>(null);
  const [isCurrentSeasonA, setIsCurrentSeasonA] = useState(true);
  const [isCurrentSeasonB, setIsCurrentSeasonB] = useState(true);
  const [showFullSeason, setShowFullSeason] = useState(false);

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

  const historicalFixturesAFiltered = useMemo(() => {
    return filterPremierLeagueFixtures(historicalFixturesA);
  }, [historicalFixturesA]);

  const historicalFixturesBFiltered = useMemo(() => {
    return filterPremierLeagueFixtures(historicalFixturesB);
  }, [historicalFixturesB]);

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

  // Determine which matchweek limit to use for stats calculation for Club A
  const effectiveMatchweekA = useMemo(() => {
    if (isCurrentSeasonA) {
      return currentMatchweek;
    }
    return showFullSeason ? 38 : currentMatchweek;
  }, [isCurrentSeasonA, showFullSeason, currentMatchweek]);

  // Determine which matchweek limit to use for stats calculation for Club B
  const effectiveMatchweekB = useMemo(() => {
    if (isCurrentSeasonB) {
      return currentMatchweek;
    }
    return showFullSeason ? 38 : currentMatchweek;
  }, [isCurrentSeasonB, showFullSeason, currentMatchweek]);

  // Get all available seasons (current + previous)
  const availableSeasons = useMemo(() => {
    const previousSeasons = getPreviousSeasons(5);
    return [getCurrentSeasonFull(), ...previousSeasons];
  }, []);

  // Calculate stats for Club A based on its season fixtures
  const clubAStats = useMemo(() => {
    if (!clubA || fixturesA.length === 0) return null;
    return calculatePointsForClub(fixturesA, clubA, effectiveMatchweekA);
  }, [clubA, fixturesA, effectiveMatchweekA]);

  // Calculate stats for Club B based on its season fixtures
  const clubBStats = useMemo(() => {
    if (!clubB || fixturesB.length === 0) return null;
    return calculatePointsForClub(fixturesB, clubB, effectiveMatchweekB);
  }, [clubB, fixturesB, effectiveMatchweekB]);

  // Get head-to-head data only if both clubs are in the same season
  const headToHeadMatches = useMemo(() => {
    if (!clubA || !clubB) return [];
    // Check if both clubs are in the same season
    const seasonA = isCurrentSeasonA ? getCurrentSeasonFull() : selectedSeasonA;
    const seasonB = isCurrentSeasonB ? getCurrentSeasonFull() : selectedSeasonB;
    if (seasonA !== seasonB) return [];
    
    const fixtures = isCurrentSeasonA ? currentSeasonFixtures : historicalFixturesAFiltered;
    if (fixtures.length === 0) return [];
    
    const allH2H = getFinishedHeadToHeadMatches(fixtures, clubA, clubB);
    const effectiveMatchweek = isCurrentSeasonA ? effectiveMatchweekA : effectiveMatchweekB;
    return allH2H.filter((f) => f.matchweek <= effectiveMatchweek);
  }, [clubA, clubB, isCurrentSeasonA, isCurrentSeasonB, selectedSeasonA, selectedSeasonB, currentSeasonFixtures, historicalFixturesAFiltered, effectiveMatchweekA, effectiveMatchweekB]);

  const headToHeadSummary = useMemo(() => {
    if (!clubA || !clubB) return null;
    // Check if both clubs are in the same season
    const seasonA = isCurrentSeasonA ? getCurrentSeasonFull() : selectedSeasonA;
    const seasonB = isCurrentSeasonB ? getCurrentSeasonFull() : selectedSeasonB;
    if (seasonA !== seasonB) return null;
    
    const fixtures = isCurrentSeasonA ? currentSeasonFixtures : historicalFixturesAFiltered;
    if (fixtures.length === 0) return null;
    
    const effectiveMatchweek = isCurrentSeasonA ? effectiveMatchweekA : effectiveMatchweekB;
    const filteredFixtures = fixtures.filter((f) => f.matchweek <= effectiveMatchweek);
    return calculateHeadToHead(filteredFixtures, clubA, clubB);
  }, [clubA, clubB, isCurrentSeasonA, isCurrentSeasonB, selectedSeasonA, selectedSeasonB, currentSeasonFixtures, historicalFixturesAFiltered, effectiveMatchweekA, effectiveMatchweekB]);

  const handleSeasonChangeA = (season: string | null) => {
    if (season === getCurrentSeasonFull()) {
      setIsCurrentSeasonA(true);
      setSelectedSeasonA(null);
    } else {
      setIsCurrentSeasonA(false);
      setSelectedSeasonA(season);
    }
  };

  const handleSeasonChangeB = (season: string | null) => {
    if (season === getCurrentSeasonFull()) {
      setIsCurrentSeasonB(true);
      setSelectedSeasonB(null);
    } else {
      setIsCurrentSeasonB(false);
      setSelectedSeasonB(season);
    }
  };

  const currentSeasonLabel = getCurrentSeasonFull();

  return {
    clubA,
    setClubA,
    clubB,
    setClubB,
    selectedSeasonA: isCurrentSeasonA ? currentSeasonLabel : selectedSeasonA,
    selectedSeasonB: isCurrentSeasonB ? currentSeasonLabel : selectedSeasonB,
    handleSeasonChangeA,
    handleSeasonChangeB,
    isCurrentSeasonA,
    isCurrentSeasonB,
    fixturesA,
    fixturesB,
    clubAStats,
    clubBStats,
    headToHeadMatches,
    headToHeadSummary,
    availableSeasons,
    isLoading: isLoadingCurrent || (isLoadingHistoricalA && !isCurrentSeasonA) || (isLoadingHistoricalB && !isCurrentSeasonB),
    error: currentError || historicalErrorA || historicalErrorB,
    refetch: () => {
      refetchCurrent();
      if (!isCurrentSeasonA) refetchHistoricalA();
      if (!isCurrentSeasonB) refetchHistoricalB();
    },
    currentSeasonLabel,
    // New matchweek-related values
    currentMatchweek,
    effectiveMatchweekA,
    effectiveMatchweekB,
    showFullSeason,
    setShowFullSeason,
  };
}
