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

/**
 * Get head-to-head matches between two clubs
 */
function getHeadToHeadMatches(
  fixtures: Fixture[],
  clubA: string,
  clubB: string
): Fixture[] {
  return fixtures.filter(
    (f) =>
      (f.homeTeam === clubA && f.awayTeam === clubB) ||
      (f.homeTeam === clubB && f.awayTeam === clubA)
  );
}

/**
 * Calculate head-to-head summary for two clubs
 */
function calculateHeadToHead(
  fixtures: Fixture[],
  clubA: string,
  clubB: string
): {
  clubAWins: number;
  clubBWins: number;
  draws: number;
  clubAGoals: number;
  clubBGoals: number;
} {
  const h2hMatches = getHeadToHeadMatches(fixtures, clubA, clubB);
  let clubAWins = 0;
  let clubBWins = 0;
  let draws = 0;
  let clubAGoals = 0;
  let clubBGoals = 0;

  h2hMatches.forEach((match) => {
    if (match.homeScore === null || match.awayScore === null) return;

    const isClubAHome = match.homeTeam === clubA;
    const clubAMatchGoals = isClubAHome ? match.homeScore : match.awayScore;
    const clubBMatchGoals = isClubAHome ? match.awayScore : match.homeScore;

    clubAGoals += clubAMatchGoals;
    clubBGoals += clubBMatchGoals;

    if (clubAMatchGoals > clubBMatchGoals) {
      clubAWins++;
    } else if (clubBMatchGoals > clubAMatchGoals) {
      clubBWins++;
    } else {
      draws++;
    }
  });

  return { clubAWins, clubBWins, draws, clubAGoals, clubBGoals };
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

  // Calculate stats for Club A
  const clubAStats = useMemo(() => {
    if (!clubA || fixtures.length === 0) return null;
    return calculatePointsForClub(fixtures, clubA, 38); // Full season (38 matches)
  }, [clubA, fixtures]);

  // Calculate stats for Club B
  const clubBStats = useMemo(() => {
    if (!clubB || fixtures.length === 0) return null;
    return calculatePointsForClub(fixtures, clubB, 38); // Full season (38 matches)
  }, [clubB, fixtures]);

  // Get head-to-head matches
  const headToHeadMatches = useMemo(() => {
    if (!clubA || !clubB || fixtures.length === 0) return [];
    return getHeadToHeadMatches(fixtures, clubA, clubB).filter(
      (f) => f.homeScore !== null && f.awayScore !== null
    );
  }, [clubA, clubB, fixtures]);

  // Calculate head-to-head summary
  const headToHeadSummary = useMemo(() => {
    if (!clubA || !clubB || fixtures.length === 0) return null;
    return calculateHeadToHead(fixtures, clubA, clubB);
  }, [clubA, clubB, fixtures]);

  // Get fixtures for Club A
  const clubAFixtures = useMemo(() => {
    if (!clubA || fixtures.length === 0) return [];
    return fixtures.filter(
      (f) =>
        (f.homeTeam === clubA || f.awayTeam === clubA) &&
        f.homeScore !== null &&
        f.awayScore !== null
    );
  }, [clubA, fixtures]);

  // Get fixtures for Club B
  const clubBFixtures = useMemo(() => {
    if (!clubB || fixtures.length === 0) return [];
    return fixtures.filter(
      (f) =>
        (f.homeTeam === clubB || f.awayTeam === clubB) &&
        f.homeScore !== null &&
        f.awayScore !== null
    );
  }, [clubB, fixtures]);

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
    clubAFixtures,
    clubBFixtures,
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
