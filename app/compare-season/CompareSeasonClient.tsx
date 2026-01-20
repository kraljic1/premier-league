"use client";

import { useState, useMemo, useEffect } from "react";
import { getCurrentSeasonShort } from "@/lib/utils/season-utils";

// Note: Client components can't export metadata directly in Next.js
// Metadata is handled at the layout level
import { RefreshButton } from "@/components/RefreshButton";
import { TwoClubsComparison } from "@/components/TwoClubsComparison";
import { HelpButton } from "@/components/HelpButton";
import { useCompareSeason } from "@/lib/hooks/useCompareSeason";
import { getCurrentSeasonFull } from "@/lib/utils/season-utils";
import { getClubByName } from "@/lib/clubs";
import { getHelpContent } from "@/lib/help-content";
import { CompareSeasonSingleClub } from "./CompareSeasonSingleClub";

type CompareMode = "single-club" | "two-clubs";

export function CompareSeasonClient() {
  const [compareMode, setCompareMode] = useState<CompareMode>("single-club");
  const [mounted, setMounted] = useState(false);

  // Get current season only on client-side to prevent hydration mismatch
  const currentSeasonLabel = useMemo(() => {
    if (!mounted) return "";
    return getCurrentSeasonFull();
  }, [mounted]);

  useEffect(() => {
    setMounted(true);
  }, []);

  const {
    selectedClub,
    setSelectedClub,
    selectedSeason,
    setSelectedSeason,
    currentFixtures,
    historicalFixtures,
    isLoadingHistorical,
    isLoading,
    error,
    availableSeasons,
    currentMatchweek,
    currentSeasonStats,
    historicalSeasonStats,
    refetchCurrent,
    refetchHistorical,
  } = useCompareSeason();

  // Get selected club's color
  const selectedClubColor = useMemo(() => {
    if (!selectedClub) return "#666";
    const club = getClubByName(selectedClub);
    return club?.primaryColor || "#666";
  }, [selectedClub]);

  return (
    <div className="compare-season-page">
      <div className="compare-season-page__header">
        <h1 className="compare-season-page__title">
          Compare Season Performance
        </h1>
        <p className="compare-season-page__subtitle">
          Compare a club's current season performance with previous seasons
        </p>
        <div className="flex items-center gap-2">
          <HelpButton {...getHelpContent('compareSeason')} />
          <RefreshButton
            onRefresh={() => {
              refetchCurrent();
              if (selectedSeason) refetchHistorical();
            }}
            isLoading={isLoading || isLoadingHistorical}
            className="compare-season-page__refresh"
          />
        </div>
      </div>

      {compareMode === "two-clubs" ? (
        <TwoClubsComparison
          onClose={() => setCompareMode("single-club")}
          initialClubA={selectedClub}
        />
      ) : (
        <CompareSeasonSingleClub
          selectedClub={selectedClub}
          setSelectedClub={setSelectedClub}
          selectedSeason={selectedSeason}
          setSelectedSeason={setSelectedSeason}
          availableSeasons={availableSeasons}
          isLoading={isLoading}
          isLoadingHistorical={isLoadingHistorical}
          error={error}
          currentMatchweek={currentMatchweek}
          currentSeasonStats={currentSeasonStats}
          historicalSeasonStats={historicalSeasonStats}
          currentFixtures={currentFixtures}
          historicalFixtures={historicalFixtures}
          refetchCurrent={refetchCurrent}
          refetchHistorical={refetchHistorical}
          selectedClubColor={selectedClubColor}
          currentSeasonLabel={currentSeasonLabel}
          mounted={mounted}
          onCompareTwoClubs={() => setCompareMode("two-clubs")}
        />
      )}
    </div>
  );
}