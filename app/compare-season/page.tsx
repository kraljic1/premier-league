"use client";

import { RefreshButton } from "@/components/RefreshButton";
import { LoadingSkeleton } from "@/components/LoadingSkeleton";
import { ErrorDisplay } from "@/components/ErrorDisplay";
import { EmptyState } from "@/components/EmptyState";
import { ClubDropdown } from "@/components/ClubDropdown";
import { SeasonDropdown } from "@/components/SeasonDropdown";
import { SeasonStatsCompact } from "@/components/SeasonStatsCompact";
import { ClubMatchResults } from "@/components/ClubMatchResults";
import { ComparisonSummary } from "@/components/ComparisonSummary";
import { useCompareSeason } from "@/lib/hooks/useCompareSeason";
import { getCurrentSeasonFull } from "@/lib/utils/season-utils";

// Get current season dynamically (auto-updates each year)
const currentSeasonLabel = getCurrentSeasonFull();

export default function CompareSeasonPage() {
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

  return (
    <div className="compare-season-page">
      <div className="compare-season-page__header">
        <h1 className="compare-season-page__title">
          Compare Season Performance
        </h1>
        <RefreshButton />
      </div>

      <div className="compare-season-page__controls">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <ClubDropdown
            selectedClub={selectedClub}
            onSelect={setSelectedClub}
            label="Select Club"
          />
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
                  Current Season ({currentSeasonLabel}) - {currentMatchweek} matchweeks
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
    </div>
  );
}
