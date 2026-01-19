"use client";

import { ClubDropdown } from "./ClubDropdown";
import { SeasonDropdown } from "./SeasonDropdown";
import { LoadingSkeleton } from "./LoadingSkeleton";
import { EmptyState } from "./EmptyState";
import { ErrorDisplay } from "./ErrorDisplay";
import { ComparisonBasisToggle } from "./ComparisonBasisToggle";
import { MatchweekToggle } from "./MatchweekToggle";
import { TwoClubsComparisonContent } from "./TwoClubsComparisonContent";
import { TwoClubsComparisonHeader } from "./TwoClubsComparisonHeader";
import { useCompareTwoClubs } from "@/lib/hooks/useCompareTwoClubs";

interface TwoClubsComparisonProps {
  onClose: () => void;
}

export function TwoClubsComparison({ onClose }: TwoClubsComparisonProps) {
  const {
    clubA,
    setClubA,
    clubB,
    setClubB,
    selectedSeasonA,
    selectedSeasonB,
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
    currentMatchweek,
    effectiveMatchweekA,
    effectiveMatchweekB,
    showFullSeason,
    setShowFullSeason,
    comparisonBasis,
    setComparisonBasis,
    maxMatchesPlayed,
  } = useCompareTwoClubs();

  const sameSeason = selectedSeasonA === selectedSeasonB;
  const isMatchweekBasis = comparisonBasis === "matchweek";

  return (
    <div className="two-clubs-comparison">
      <TwoClubsComparisonHeader onClose={onClose} />

      <div className="two-clubs-comparison__controls">
        <div className="two-clubs-comparison__clubs">
          <ClubDropdown selectedClub={clubA} onSelect={setClubA} label="Club A" />
          <div className="two-clubs-comparison__vs">vs</div>
          <ClubDropdown selectedClub={clubB} onSelect={setClubB} label="Club B" />
        </div>
        <div className="two-clubs-comparison__season-controls">
          <SeasonDropdown
            seasons={availableSeasons}
            selectedSeason={selectedSeasonA}
            onSelect={handleSeasonChangeA}
            label="Club A Season"
          />
          <SeasonDropdown
            seasons={availableSeasons}
            selectedSeason={selectedSeasonB}
            onSelect={handleSeasonChangeB}
            label="Club B Season"
          />
          {currentMatchweek > 0 && (
            <ComparisonBasisToggle
              comparisonBasis={comparisonBasis}
              onChange={setComparisonBasis}
            />
          )}
          {(!isCurrentSeasonA || !isCurrentSeasonB) && currentMatchweek > 0 && (
            <MatchweekToggle
              showFullSeason={showFullSeason}
              onToggle={setShowFullSeason}
              currentMatchweek={currentMatchweek}
            />
          )}
        </div>
      </div>

      {clubA && clubB && !isLoading && !error && (
        <div className="two-clubs-comparison__matchweek-info">
          {sameSeason ? (
            <>
              {isMatchweekBasis ? (
                <>
                  {isCurrentSeasonA ? (
                    <span>Showing stats through Matchweek {effectiveMatchweekA}</span>
                  ) : (
                    <span>
                      {showFullSeason
                        ? `Showing full season (38 matchweeks)`
                        : `Showing stats through Matchweek ${effectiveMatchweekA} (same as current season progress)`}
                    </span>
                  )}
                </>
              ) : (
                <span>
                  {showFullSeason
                    ? "Showing full season (38 matches played)"
                    : `Showing stats after ${maxMatchesPlayed} matches played`}
                </span>
              )}
            </>
          ) : (
            <span>
              Comparing {clubA} ({selectedSeasonA}, {isMatchweekBasis ? `MW ${effectiveMatchweekA}` : `${maxMatchesPlayed} matches`}) vs {clubB} ({selectedSeasonB}, {isMatchweekBasis ? `MW ${effectiveMatchweekB}` : `${maxMatchesPlayed} matches`})
            </span>
          )}
          {clubAStats && clubBStats && clubAStats.played !== clubBStats.played && (
            <div className="two-clubs-comparison__match-warning">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 9v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>
                {clubA} has played {clubAStats.played} matches, {clubB} has played {clubBStats.played} matches 
                {clubAStats.played > clubBStats.played 
                  ? ` (${clubB} has ${clubAStats.played - clubBStats.played} ${sameSeason ? 'postponed ' : ''}match${clubAStats.played - clubBStats.played > 1 ? 'es' : ''})`
                  : ` (${clubA} has ${clubBStats.played - clubAStats.played} ${sameSeason ? 'postponed ' : ''}match${clubBStats.played - clubAStats.played > 1 ? 'es' : ''})`
                }
              </span>
            </div>
          )}
        </div>
      )}

      {!clubA || !clubB ? (
        <EmptyState
          title="Select Two Clubs"
          message="Choose two clubs to compare their season performance"
        />
      ) : isLoading ? (
        <LoadingSkeleton />
      ) : error ? (
        <ErrorDisplay message="Failed to load data. Please try again." onRetry={refetch} />
      ) : (
        <TwoClubsComparisonContent
          clubA={clubA}
          clubB={clubB}
          clubAStats={clubAStats}
          clubBStats={clubBStats}
          selectedSeasonA={selectedSeasonA}
          selectedSeasonB={selectedSeasonB}
          fixturesA={fixturesA}
          fixturesB={fixturesB}
          effectiveMatchweekA={effectiveMatchweekA}
          effectiveMatchweekB={effectiveMatchweekB}
          maxMatchesPlayed={maxMatchesPlayed}
          comparisonBasis={comparisonBasis}
          headToHeadMatches={headToHeadMatches}
          headToHeadSummary={headToHeadSummary}
          sameSeason={sameSeason}
        />
      )}
    </div>
  );
}
