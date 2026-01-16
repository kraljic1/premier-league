"use client";

import { RefreshButton } from "@/components/RefreshButton";
import { LoadingSkeleton } from "@/components/LoadingSkeleton";
import { ErrorDisplay } from "@/components/ErrorDisplay";
import { EmptyState } from "@/components/EmptyState";
import { ClubDropdown } from "@/components/ClubDropdown";
import { SeasonDropdown } from "@/components/SeasonDropdown";
import { SeasonStatsDisplay } from "@/components/SeasonStatsDisplay";
import { ComparisonSummary } from "@/components/ComparisonSummary";
import { useCompareSeason } from "@/lib/hooks/useCompareSeason";

export default function CompareSeasonPage() {
  const {
    selectedClub,
    setSelectedClub,
    selectedSeason,
    setSelectedSeason,
    isScraping,
    scrapingError,
    historicalFixtures,
    isLoadingHistorical,
    isLoading,
    error,
    availableSeasons,
    currentMatchweek,
    currentSeasonStats,
    historicalSeasonStats,
    handleScrapeSeason,
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

        {selectedSeason && (
          <div className="mb-4">
            <button
              onClick={handleScrapeSeason}
              disabled={isScraping}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isScraping
                ? "Scraping..."
                : `Scrape ${selectedSeason} Season Data`}
            </button>
            {scrapingError && (
              <div className="mt-2 text-red-600 dark:text-red-400 text-sm">
                {scrapingError}
              </div>
            )}
          </div>
        )}
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
              <div className="mb-6">
                <h2 className="text-xl font-semibold mb-4">
                  Current Season ({currentMatchweek} matchweeks played)
                </h2>
                {currentSeasonStats && (
                  <SeasonStatsDisplay
                    stats={currentSeasonStats}
                    clubName={selectedClub}
                    matchweek={currentMatchweek}
                  />
                )}
              </div>

              {selectedSeason ? (
                <div>
                  <h2 className="text-xl font-semibold mb-4">
                    {selectedSeason} Season (first {currentMatchweek}{" "}
                    matchweeks)
                  </h2>
                  {/* Debug info - remove after fixing */}
                  <div className="mb-4 p-2 bg-gray-100 dark:bg-gray-800 rounded text-xs font-mono">
                    <p>Debug: selectedSeason = "{selectedSeason}"</p>
                    <p>Debug: historicalFixtures.length = {historicalFixtures.length}</p>
                    <p>Debug: First fixture season = {historicalFixtures[0]?.season || "N/A"}</p>
                    <p>Debug: isLoadingHistorical = {isLoadingHistorical ? "true" : "false"}</p>
                  </div>
                  {isLoadingHistorical ? (
                    <LoadingSkeleton />
                  ) : historicalFixtures.length === 0 ? (
                    <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                      <p className="text-yellow-800 dark:text-yellow-200">
                        No data available for {selectedSeason}. Click the button
                        above to scrape the season data.
                      </p>
                    </div>
                  ) : historicalSeasonStats ? (
                    <SeasonStatsDisplay
                      stats={historicalSeasonStats}
                      clubName={selectedClub}
                      matchweek={currentMatchweek}
                    />
                  ) : (
                    <EmptyState
                      title="No Data"
                      message={`No matches found for ${selectedClub} in ${selectedSeason}`}
                    />
                  )}
                </div>
              ) : (
                <EmptyState
                  title="Select a Season"
                  message="Choose a previous season to compare"
                />
              )}

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
