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

export function useCompareSeason() {
  const [selectedClub, setSelectedClub] = useState<string | null>(null);
  const [selectedSeason, setSelectedSeason] = useState<string | null>(null);
  const [isScraping, setIsScraping] = useState(false);
  const [scrapingError, setScrapingError] = useState<string | null>(null);

  const {
    data: currentFixtures = [],
    isLoading: isLoadingCurrent,
    error: currentError,
    refetch: refetchCurrent,
  } = useQuery({
    queryKey: ["currentFixtures"],
    queryFn: fetchCurrentSeasonFixtures,
  });

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
