import { useState, useMemo } from "react";
import {
  calculatePointsForClub,
  calculatePointsForClubByMatchesPlayed,
  getCutoffDateForMatchesPlayed,
} from "../utils-comparison";
import { ComparisonBasis } from "../types";
import { getCurrentSeasonFull } from "../utils/season-utils";
import { useCompareTwoClubsData } from "./useCompareTwoClubsData";
import { useHeadToHeadComparison } from "./useHeadToHeadComparison";

export function useCompareTwoClubs() {
  const [clubA, setClubA] = useState<string | null>(null);
  const [clubB, setClubB] = useState<string | null>(null);
  const [selectedSeasonA, setSelectedSeasonA] = useState<string | null>(null);
  const [selectedSeasonB, setSelectedSeasonB] = useState<string | null>(null);
  const [isCurrentSeasonA, setIsCurrentSeasonA] = useState(true);
  const [isCurrentSeasonB, setIsCurrentSeasonB] = useState(true);
  const [showFullSeason, setShowFullSeason] = useState(false);
  const [comparisonBasis, setComparisonBasis] = useState<ComparisonBasis>("matchweek");

  const {
    currentSeasonFixtures,
    historicalFixturesAFiltered,
    historicalFixturesBFiltered,
    fixturesA,
    fixturesB,
    currentMatchweek,
    availableSeasons,
    isLoading,
    error,
    refetch,
    currentSeasonLabel,
  } = useCompareTwoClubsData({
    selectedSeasonA,
    selectedSeasonB,
    isCurrentSeasonA,
    isCurrentSeasonB,
  });

  const effectiveMatchweekA = useMemo(() => {
    if (isCurrentSeasonA) {
      return currentMatchweek;
    }
    return showFullSeason ? 38 : currentMatchweek;
  }, [isCurrentSeasonA, showFullSeason, currentMatchweek]);

  const effectiveMatchweekB = useMemo(() => {
    if (isCurrentSeasonB) {
      return currentMatchweek;
    }
    return showFullSeason ? 38 : currentMatchweek;
  }, [isCurrentSeasonB, showFullSeason, currentMatchweek]);

  const maxMatchesPlayed = useMemo(() => {
    return showFullSeason ? 38 : currentMatchweek;
  }, [showFullSeason, currentMatchweek]);


  const clubAStats = useMemo(() => {
    if (!clubA || fixturesA.length === 0) return null;
    if (comparisonBasis === "matches-played") {
      return calculatePointsForClubByMatchesPlayed(fixturesA, clubA, maxMatchesPlayed);
    }
    return calculatePointsForClub(fixturesA, clubA, effectiveMatchweekA);
  }, [clubA, fixturesA, effectiveMatchweekA, comparisonBasis, maxMatchesPlayed]);

  const clubBStats = useMemo(() => {
    if (!clubB || fixturesB.length === 0) return null;
    if (comparisonBasis === "matches-played") {
      return calculatePointsForClubByMatchesPlayed(fixturesB, clubB, maxMatchesPlayed);
    }
    return calculatePointsForClub(fixturesB, clubB, effectiveMatchweekB);
  }, [clubB, fixturesB, effectiveMatchweekB, comparisonBasis, maxMatchesPlayed]);

  const comparisonCutoffDate = useMemo(() => {
    if (comparisonBasis !== "matches-played" || !clubA || !clubB) return null;

    const fixtures = isCurrentSeasonA ? currentSeasonFixtures : historicalFixturesAFiltered;
    const cutoffDateA = getCutoffDateForMatchesPlayed(fixtures, clubA, maxMatchesPlayed);
    const cutoffDateB = getCutoffDateForMatchesPlayed(fixtures, clubB, maxMatchesPlayed);

    if (cutoffDateA === null && cutoffDateB === null) return null;

    // Use the later date so both clubs have reached the target match count.
    return Math.max(cutoffDateA ?? 0, cutoffDateB ?? 0);
  }, [
    comparisonBasis,
    clubA,
    clubB,
    maxMatchesPlayed,
    isCurrentSeasonA,
    currentSeasonFixtures,
    historicalFixturesAFiltered,
  ]);

  const { headToHeadMatches, headToHeadSummary } = useHeadToHeadComparison({
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
  });

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
    isLoading,
    error,
    refetch,
    currentSeasonLabel,
    currentMatchweek,
    effectiveMatchweekA,
    effectiveMatchweekB,
    showFullSeason,
    setShowFullSeason,
    comparisonBasis,
    setComparisonBasis,
    maxMatchesPlayed,
  };
}
