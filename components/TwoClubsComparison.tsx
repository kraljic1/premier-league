"use client";

import { ClubDropdown } from "./ClubDropdown";
import { SeasonDropdown } from "./SeasonDropdown";
import { SeasonStatsCompact } from "./SeasonStatsCompact";
import { LoadingSkeleton } from "./LoadingSkeleton";
import { EmptyState } from "./EmptyState";
import { ErrorDisplay } from "./ErrorDisplay";
import { ComparisonBar } from "./ComparisonBar";
import { HeadToHeadSection } from "./HeadToHeadSection";
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
    selectedSeason,
    handleSeasonChange,
    isCurrentSeason,
    clubAStats,
    clubBStats,
    headToHeadMatches,
    headToHeadSummary,
    availableSeasons,
    isLoading,
    error,
    refetch,
    currentMatchweek,
    effectiveMatchweek,
    showFullSeason,
    setShowFullSeason,
  } = useCompareTwoClubs();

  return (
    <div className="two-clubs-comparison">
      <TwoClubsHeader onClose={onClose} />

      <div className="two-clubs-comparison__controls">
        <div className="two-clubs-comparison__clubs">
          <ClubDropdown selectedClub={clubA} onSelect={setClubA} label="Club A" />
          <div className="two-clubs-comparison__vs">vs</div>
          <ClubDropdown selectedClub={clubB} onSelect={setClubB} label="Club B" />
        </div>
        <div className="two-clubs-comparison__season-controls">
          <SeasonDropdown
            seasons={availableSeasons}
            selectedSeason={selectedSeason}
            onSelect={handleSeasonChange}
            label="Select Season"
          />
          {!isCurrentSeason && currentMatchweek > 0 && (
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
          {isCurrentSeason ? (
            <span>Showing stats through Matchweek {effectiveMatchweek}</span>
          ) : (
            <span>
              {showFullSeason
                ? `Showing full season (38 matchweeks)`
                : `Showing stats through Matchweek ${effectiveMatchweek} (same as current season progress)`}
            </span>
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
        <TwoClubsContent
          clubA={clubA}
          clubB={clubB}
          clubAStats={clubAStats}
          clubBStats={clubBStats}
          selectedSeason={selectedSeason}
          headToHeadMatches={headToHeadMatches}
          headToHeadSummary={headToHeadSummary}
        />
      )}
    </div>
  );
}

function TwoClubsHeader({ onClose }: { onClose: () => void }) {
  return (
    <div className="two-clubs-comparison__header">
      <h2 className="two-clubs-comparison__title">Compare Two Clubs</h2>
      <button
        onClick={onClose}
        className="two-clubs-comparison__close"
        aria-label="Close comparison"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

interface MatchweekToggleProps {
  showFullSeason: boolean;
  onToggle: (value: boolean) => void;
  currentMatchweek: number;
}

function MatchweekToggle({ showFullSeason, onToggle, currentMatchweek }: MatchweekToggleProps) {
  return (
    <div className="matchweek-toggle">
      <button
        className={`matchweek-toggle__btn ${!showFullSeason ? 'matchweek-toggle__btn--active' : ''}`}
        onClick={() => onToggle(false)}
        type="button"
      >
        At MW {currentMatchweek}
      </button>
      <button
        className={`matchweek-toggle__btn ${showFullSeason ? 'matchweek-toggle__btn--active' : ''}`}
        onClick={() => onToggle(true)}
        type="button"
      >
        Full Season
      </button>
    </div>
  );
}

interface TwoClubsContentProps {
  clubA: string;
  clubB: string;
  clubAStats: any;
  clubBStats: any;
  selectedSeason: string | null;
  headToHeadMatches: any[];
  headToHeadSummary: any;
}

function TwoClubsContent({
  clubA,
  clubB,
  clubAStats,
  clubBStats,
  selectedSeason,
  headToHeadMatches,
  headToHeadSummary,
}: TwoClubsContentProps) {
  return (
    <div className="two-clubs-comparison__content">
      <div className="two-clubs-comparison__stats">
        <ClubStatsCard clubName={clubA} stats={clubAStats} season={selectedSeason} />
        <ClubStatsCard clubName={clubB} stats={clubBStats} season={selectedSeason} />
      </div>


      <HeadToHeadSection
        clubA={clubA}
        clubB={clubB}
        matches={headToHeadMatches}
        summary={headToHeadSummary}
      />
    </div>
  );
}

interface ClubStatsCardProps {
  clubName: string;
  stats: any;
  season: string | null;
}

function ClubStatsCard({ clubName, stats, season }: ClubStatsCardProps) {
  return (
    <div className="two-clubs-comparison__club-stats">
      <h3 className="two-clubs-comparison__club-name">{clubName}</h3>
      {stats ? (
        <SeasonStatsCompact stats={stats} title={`${season}`} />
      ) : (
        <div className="two-clubs-comparison__no-stats">No stats available</div>
      )}
    </div>
  );
}
