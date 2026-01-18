"use client";

import { ClubDropdown } from "./ClubDropdown";
import { SeasonDropdown } from "./SeasonDropdown";
import { SeasonStatsCompact } from "./SeasonStatsCompact";
import { ClubMatchResults } from "./ClubMatchResults";
import { LoadingSkeleton } from "./LoadingSkeleton";
import { EmptyState } from "./EmptyState";
import { ErrorDisplay } from "./ErrorDisplay";
import { ComparisonBar } from "./ComparisonBar";
import { HeadToHeadSection } from "./HeadToHeadSection";
import { useCompareTwoClubs } from "@/lib/hooks/useCompareTwoClubs";
import { getClubByName } from "@/lib/clubs";
import { Fixture } from "@/lib/types";
import { useClubs } from "@/lib/hooks/useClubs";

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
  } = useCompareTwoClubs();

  const sameSeason = selectedSeasonA === selectedSeasonB;

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
          {(!isCurrentSeasonA || !isCurrentSeasonB) && sameSeason && currentMatchweek > 0 && (
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
              Comparing {clubA} ({selectedSeasonA}, MW {effectiveMatchweekA}) vs {clubB} ({selectedSeasonB}, MW {effectiveMatchweekB})
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
        <TwoClubsContent
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
          headToHeadMatches={headToHeadMatches}
          headToHeadSummary={headToHeadSummary}
          sameSeason={sameSeason}
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
  selectedSeasonA: string | null;
  selectedSeasonB: string | null;
  fixturesA: Fixture[];
  fixturesB: Fixture[];
  effectiveMatchweekA: number;
  effectiveMatchweekB: number;
  headToHeadMatches: any[];
  headToHeadSummary: any;
  sameSeason: boolean;
}

function TwoClubsContent({
  clubA,
  clubB,
  clubAStats,
  clubBStats,
  selectedSeasonA,
  selectedSeasonB,
  fixturesA,
  fixturesB,
  effectiveMatchweekA,
  effectiveMatchweekB,
  headToHeadMatches,
  headToHeadSummary,
  sameSeason,
}: TwoClubsContentProps) {
  const clubAColor = getClubByName(clubA)?.primaryColor || "#37003c";
  const clubBColor = getClubByName(clubB)?.primaryColor || "#37003c";

  return (
    <div className="two-clubs-comparison__content">
      <div className="two-clubs-comparison__stats">
        <ClubStatsCard clubName={clubA} stats={clubAStats} season={selectedSeasonA} />
        <ClubStatsCard clubName={clubB} stats={clubBStats} season={selectedSeasonB} />
      </div>

      <div className="two-clubs-comparison__results">
        <ClubMatchResults
          fixtures={fixturesA}
          clubName={clubA}
          maxMatchweek={effectiveMatchweekA}
          seasonLabel={`${clubA} Results (${selectedSeasonA})`}
          clubColor={clubAColor}
        />
        <ClubMatchResults
          fixtures={fixturesB}
          clubName={clubB}
          maxMatchweek={effectiveMatchweekB}
          seasonLabel={`${clubB} Results (${selectedSeasonB})`}
          clubColor={clubBColor}
        />
      </div>

      {sameSeason && (
        <HeadToHeadSection
          clubA={clubA}
          clubB={clubB}
          matches={headToHeadMatches}
          summary={headToHeadSummary}
        />
      )}
      {!sameSeason && (
        <div className="two-clubs-comparison__different-seasons-notice">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 16v-4M12 8h.01" />
          </svg>
          <span>Head-to-head comparison is only available when comparing clubs from the same season</span>
        </div>
      )}
    </div>
  );
}

interface ClubStatsCardProps {
  clubName: string;
  stats: any;
  season: string | null;
}

function ClubStatsCard({ clubName, stats, season }: ClubStatsCardProps) {
  const { clubs } = useClubs();
  
  // Get logo URL for club
  const clubEntry = Object.values(clubs).find((c: any) => c.name === clubName);
  const hardcodedClub = getClubByName(clubName);
  const logoUrl = clubEntry?.logoUrlFromDb || clubEntry?.logoUrl || hardcodedClub?.logoUrl || null;

  return (
    <div className="two-clubs-comparison__club-stats">
      <div className="two-clubs-comparison__club-header">
        {logoUrl ? (
          <img
            src={logoUrl}
            alt={`${clubName} logo`}
            className="two-clubs-comparison__club-logo"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        ) : (
          <div className="two-clubs-comparison__club-logo-placeholder">
            {clubName.charAt(0)}
          </div>
        )}
        <h3 className="two-clubs-comparison__club-name">{clubName}</h3>
      </div>
      {stats ? (
        <SeasonStatsCompact stats={stats} title={`${season}`} />
      ) : (
        <div className="two-clubs-comparison__no-stats">No stats available</div>
      )}
    </div>
  );
}
