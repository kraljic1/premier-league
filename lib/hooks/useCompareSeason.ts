import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  calculatePointsForClub,
  getCurrentMatchweekFromFixtures,
  getAvailableSeasons,
} from "../utils-comparison";
import {
  fetchCurrentSeasonFixtures,
  fetchHistoricalSeason,
  scrapeHistoricalSeason,
} from "../api/compare-season-api";
import { Fixture } from "../types";
import {
  getCurrentSeasonShort,
  getCurrentSeasonFull,
  getCurrentSeasonStartDate,
  getCurrentSeasonEndDate,
  getPreviousSeasons,
} from "../utils/season-utils";

// Get current season values dynamically (auto-updates each year)
const CURRENT_SEASON_SHORT = getCurrentSeasonShort();
const CURRENT_SEASON_FULL = getCurrentSeasonFull();
const CURRENT_SEASON_START = getCurrentSeasonStartDate();
const CURRENT_SEASON_END = getCurrentSeasonEndDate();

/**
 * Filters fixtures to only include those from the current season.
 * Handles both season format variants and falls back to date range.
 */
function filterCurrentSeasonFixtures(fixtures: Fixture[]): Fixture[] {
  return fixtures.filter((f) => {
    // If fixture has season field set, check both formats
    if (f.season) {
      return f.season === CURRENT_SEASON_SHORT || f.season === CURRENT_SEASON_FULL;
    }
    // Otherwise, filter by date range (for fixtures without season field)
    const fixtureDate = new Date(f.date);
    return fixtureDate >= CURRENT_SEASON_START && fixtureDate <= CURRENT_SEASON_END;
  });
}

export function useCompareSeason() {
  const [selectedClub, setSelectedClub] = useState<string | null>(null);
  const [selectedSeason, setSelectedSeason] = useState<string | null>(null);
  const [isScraping, setIsScraping] = useState(false);
  const [scrapingError, setScrapingError] = useState<string | null>(null);

  const {
    data: allFixtures = [],
    isLoading: isLoadingCurrent,
    error: currentError,
    refetch: refetchCurrent,
  } = useQuery({
    queryKey: ["currentFixtures"],
    queryFn: fetchCurrentSeasonFixtures,
  });

  // Filter fixtures for current season only (by season field or date range)
  const currentFixtures = useMemo(() => {
    return filterCurrentSeasonFixtures(allFixtures);
  }, [allFixtures]);

  const {
    data: historicalFixtures = [],
    isLoading: isLoadingHistorical,
    error: historicalError,
    refetch: refetchHistorical,
    dataUpdatedAt,
  } = useQuery({
    queryKey: ["historicalFixtures", selectedSeason],
    queryFn: async () => {
      console.log(`[useCompareSeason] Fetching historical data for season: "${selectedSeason}"`);
      const result = await fetchHistoricalSeason(selectedSeason!);
      console.log(`[useCompareSeason] Received ${result.length} fixtures for "${selectedSeason}"`);
      // Verify the data matches the requested season
      if (result.length > 0 && result[0].season) {
        const expectedShortSeason = `${selectedSeason!.split("/")[0]}/${(parseInt(selectedSeason!.split("/")[0]) + 1).toString().slice(-2)}`;
        if (result[0].season !== expectedShortSeason) {
          console.error(`[useCompareSeason] SEASON MISMATCH! Expected ${expectedShortSeason}, got ${result[0].season}`);
        }
      }
      return result;
    },
    enabled: !!selectedSeason,
    // Don't use stale data - always refetch when season changes
    staleTime: 0,
    gcTime: 0, // Don't cache at all - ensures fresh data for each season
    refetchOnMount: "always",
    refetchOnWindowFocus: false,
  });

  // Log when historicalFixtures changes
  useEffect(() => {
    if (historicalFixtures.length > 0) {
      console.log(`[useCompareSeason] historicalFixtures updated: ${historicalFixtures.length} fixtures, dataUpdatedAt: ${dataUpdatedAt}`);
      const firstFixture = historicalFixtures[0];
      console.log(`[useCompareSeason] First fixture season: ${firstFixture.season}`);
    }
  }, [historicalFixtures, dataUpdatedAt]);

  // Use centralized season utility for previous seasons
  // Auto-updates when new season starts
  const availableSeasons = useMemo(() => getPreviousSeasons(5), []);

  const currentMatchweek = useMemo(
    () => getCurrentMatchweekFromFixtures(currentFixtures),
    [currentFixtures]
  );

  const currentSeasonStats = useMemo(() => {
    if (!selectedClub || currentMatchweek === 0) {
      return null;
    }
    return calculatePointsForClub(
      currentFixtures,
      selectedClub,
      currentMatchweek
    );
  }, [selectedClub, currentFixtures, currentMatchweek]);

  const historicalSeasonStats = useMemo(() => {
    if (!selectedClub || !selectedSeason || historicalFixtures.length === 0) {
      console.log(`[useCompareSeason] historicalSeasonStats: null (selectedClub=${selectedClub}, selectedSeason=${selectedSeason}, fixtures=${historicalFixtures.length})`);
      return null;
    }
    console.log(`[useCompareSeason] Calculating stats for "${selectedClub}" in "${selectedSeason}" (${historicalFixtures.length} fixtures, matchweek ${currentMatchweek})`);
    const stats = calculatePointsForClub(
      historicalFixtures,
      selectedClub,
      currentMatchweek
    );
    console.log(`[useCompareSeason] Stats result: ${JSON.stringify(stats)}`);
    return stats;
  }, [selectedClub, selectedSeason, historicalFixtures, currentMatchweek]);

  const handleScrapeSeason = async () => {
    if (!selectedSeason) return;

    const year = parseInt(selectedSeason.split("/")[0]);
    if (isNaN(year)) {
      setScrapingError("Invalid season format");
      return;
    }

    setIsScraping(true);
    setScrapingError(null);

    try {
      await scrapeHistoricalSeason(year);
      await refetchHistorical();
    } catch (error: any) {
      setScrapingError(error.message || "Failed to scrape season");
    } finally {
      setIsScraping(false);
    }
  };

  return {
    selectedClub,
    setSelectedClub,
    selectedSeason,
    setSelectedSeason,
    isScraping,
    scrapingError,
    currentFixtures,
    historicalFixtures,
    isLoadingCurrent,
    isLoadingHistorical,
    isLoading: isLoadingCurrent || isLoadingHistorical,
    error: currentError || historicalError,
    availableSeasons,
    currentMatchweek,
    currentSeasonStats,
    historicalSeasonStats,
    handleScrapeSeason,
    refetchCurrent,
    refetchHistorical,
  };
}
