"use client";

import { useState, useMemo, useEffect } from "react";
import { getCurrentSeasonShort } from "@/lib/utils/season-utils";

// Note: Client components can't export metadata directly in Next.js
// Metadata is handled at the layout level
import { RefreshButton } from "@/components/RefreshButton";
import { LoadingSkeleton } from "@/components/LoadingSkeleton";
import { ErrorDisplay } from "@/components/ErrorDisplay";
import { EmptyState } from "@/components/EmptyState";
import { ClubDropdown } from "@/components/ClubDropdown";
import { SeasonDropdown } from "@/components/SeasonDropdown";
import { SeasonStatsCompact } from "@/components/SeasonStatsCompact";
import { ClubMatchResults } from "@/components/ClubMatchResults";
import { ComparisonSummary } from "@/components/ComparisonSummary";
import { TwoClubsComparison } from "@/components/TwoClubsComparison";
import { useCompareSeason } from "@/lib/hooks/useCompareSeason";
import { getCurrentSeasonFull } from "@/lib/utils/season-utils";
import { getClubByName } from "@/lib/clubs";

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
        <RefreshButton
          onRefresh={() => {
            refetchCurrent();
            if (selectedSeason) refetchHistorical();
          }}
          isLoading={isLoading || isLoadingHistorical}
          className="compare-season-page__refresh"
        />
      </div>

      {compareMode === "two-clubs" ? (
        <TwoClubsComparison onClose={() => setCompareMode("single-club")} />
      ) : (
        <>
          <div className="compare-season-page__controls">
            <div className="compare-season-page__club-row">
              <div className="compare-season-page__club-dropdown">
                <ClubDropdown
                  selectedClub={selectedClub}
                  onSelect={setSelectedClub}
                  label="Select Club"
                />
              </div>
              <button
                onClick={() => setCompareMode("two-clubs")}
                className="compare-season-page__add-club-btn"
                title="Compare two clubs"
                aria-label="Compare two clubs"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M12 5v14M5 12h14" />
                </svg>
              </button>
            </div>
            <div className="compare-season-page__season-dropdown">
              <SeasonDropdown
                seasons={availableSeasons}
                selectedSeason={selectedSeason}
                onSelect={setSelectedSeason}
                label="Select Previous Season"
              />
            </div>
          </div>

          {!selectedClub ? (
            <EmptyState
              title="Select a Club"
              message="Choose a club to compare season performance"
            />
          ) : isLoading ? (
            <LoadingSkeleton />
          ) : error ? (
            <ErrorDisplay
              message="Failed to load data. Please try again."
              onRetry={() => {
                refetchCurrent();
                if (selectedSeason) refetchHistorical();
              }}
            />
          ) : (
            <div className="compare-season-page__comparison">
                {currentMatchweek === 0 ? (
                  <EmptyState
                    title="No Match Data"
                    message="No finished matches found for the current season"
                  />
                ) : (
                  <>
                    {/* Current Season Section */}
                    <div className="mb-8">
                      <h2 className="text-lg sm:text-xl font-semibold mb-4">
                        {mounted ? `Current Season (${currentSeasonLabel}) - ${currentMatchweek} matchweeks` : `Current Season - ${currentMatchweek} matchweeks`}
                      </h2>
                      <div className="season-stats-layout">
                        <div className="season-stats-layout__stats">
                          {currentSeasonStats && (
                            <SeasonStatsCompact
                              stats={currentSeasonStats}
                              title="Statistics"
                            />
                          )}
                        </div>
                        <div className="season-stats-layout__results">
                          <ClubMatchResults
                            fixtures={currentFixtures}
                            clubName={selectedClub}
                            maxMatchweek={currentMatchweek}
                            seasonLabel="Current Season"
                            clubColor={selectedClubColor}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Historical Season Section */}
                    {selectedSeason ? (
                      <div className="mb-8">
                        <h2 className="text-lg sm:text-xl font-semibold mb-4">
                          {selectedSeason} Season (first {currentMatchweek} matchweeks)
                        </h2>
                        {isLoadingHistorical ? (
                          <LoadingSkeleton />
                        ) : historicalFixtures.length === 0 ? (
                          <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                            <p className="text-yellow-800 dark:text-yellow-200">
                              No data available for {selectedSeason}.
                            </p>
                          </div>
                        ) : (
                          <div className="season-stats-layout">
                            <div className="season-stats-layout__stats">
                              {historicalSeasonStats && (
                                <SeasonStatsCompact
                                  stats={historicalSeasonStats}
                                  title="Statistics"
                                />
                              )}
                            </div>
                            <div className="season-stats-layout__results">
                              <ClubMatchResults
                                fixtures={historicalFixtures}
                                clubName={selectedClub}
                                maxMatchweek={currentMatchweek}
                                seasonLabel={selectedSeason}
                                clubColor={selectedClubColor}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <EmptyState
                        title="Select a Season"
                        message="Choose a previous season to compare"
                      />
                    )}

                    {/* Comparison Summary */}
                    {currentSeasonStats && historicalSeasonStats && (
                      <ComparisonSummary
                        current={currentSeasonStats}
                        historical={historicalSeasonStats}
                        clubName={selectedClub}
                      />
                    )}
                  </>
                )}
            </div>
          )}
        </>
      )}
    </div>
  );
}