import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  calculatePointsForClub,
  getCurrentMatchweekFromFixtures,
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
    staleTime: 0, // Always consider data stale
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes max
    refetchOnMount: "always", // Always refetch when component mounts
  });

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
      const result = await fetchHistoricalSeason(selectedSeason!);
      return result;
    },
    enabled: !!selectedSeason,
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (historicalFixtures.length > 0) {
      const first = historicalFixtures[0];
      if (first) {
        console.log(`[useCompareSeason] First fixture season: ${first.season}`);
      }
    }
    return undefined;
  }, [historicalFixtures, dataUpdatedAt]);

  const availableSeasons = useMemo(() => getPreviousSeasons(5), []);

  const currentMatchweek = useMemo(
    () => getCurrentMatchweekFromFixtures(currentFixtures),
    [currentFixtures]
  );

  const currentSeasonStats = useMemo(() => {
    if (!selectedClub || currentMatchweek === 0) return null;
    return calculatePointsForClub(currentFixtures, selectedClub, currentMatchweek);
  }, [selectedClub, currentFixtures, currentMatchweek]);

  const historicalSeasonStats = useMemo(() => {
    if (!selectedClub || !selectedSeason || historicalFixtures.length === 0) {
      return null;
    }
    return calculatePointsForClub(historicalFixtures, selectedClub, currentMatchweek);
  }, [selectedClub, selectedSeason, historicalFixtures, currentMatchweek]);

  const handleScrapeSeason = async () => {
    if (!selectedSeason) return;
    const seasonParts = selectedSeason.split("/");
    const yearStr = seasonParts[0];
    if (!yearStr) {
      setScrapingError("Invalid season format");
      return;
    }
    const year = parseInt(yearStr);
    if (isNaN(year)) {
      setScrapingError("Invalid season format");
      return;
    }
    setIsScraping(true);
    setScrapingError(null);
    try {
      await scrapeHistoricalSeason(year);
      await refetchHistorical();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to scrape season";
      setScrapingError(message);
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
