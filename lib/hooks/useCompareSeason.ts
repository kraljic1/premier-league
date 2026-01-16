import { useState, useMemo } from "react";
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

// Current season identifiers (both formats for compatibility)
// Short format used by import script: "2025/26"
// Full format used by database default: "2025/2026"
const CURRENT_SEASON_SHORT = "2025/26";
const CURRENT_SEASON_FULL = "2025/2026";
// Season 2025/26 runs from approximately August 2025 to May 2026
const CURRENT_SEASON_START = new Date("2025-08-01");
const CURRENT_SEASON_END = new Date("2026-06-30");

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
  } = useQuery({
    queryKey: ["historicalFixtures", selectedSeason],
    queryFn: () => fetchHistoricalSeason(selectedSeason!),
    enabled: !!selectedSeason,
  });

  const availableSeasons = useMemo(() => {
    const seasons = getAvailableSeasons(currentFixtures);
    const currentYear = new Date().getFullYear();
    const previousSeasons: string[] = [];
    for (let i = 1; i <= 5; i++) {
      const year = currentYear - i;
      previousSeasons.push(`${year}/${year + 1}`);
    }
    return [...seasons, ...previousSeasons].filter(
      (v, i, a) => a.indexOf(v) === i
    );
  }, [currentFixtures]);

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
      return null;
    }
    return calculatePointsForClub(
      historicalFixtures,
      selectedClub,
      currentMatchweek
    );
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
