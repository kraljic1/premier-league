"use client";

import { ClubDropdown } from "./ClubDropdown";
import { SeasonDropdown } from "./SeasonDropdown";
import { SeasonStatsCompact } from "./SeasonStatsCompact";
import { LoadingSkeleton } from "./LoadingSkeleton";
import { EmptyState } from "./EmptyState";
import { ErrorDisplay } from "./ErrorDisplay";
import { useCompareTwoClubs } from "@/lib/hooks/useCompareTwoClubs";
import { Fixture } from "@/lib/types";

interface HeadToHeadMatchProps {
  match: Fixture;
  clubA: string;
  clubB: string;
}

function HeadToHeadMatch({ match, clubA, clubB }: HeadToHeadMatchProps) {
  const isClubAHome = match.homeTeam === clubA;
  const clubAScore = isClubAHome ? match.homeScore : match.awayScore;
  const clubBScore = isClubAHome ? match.awayScore : match.homeScore;

  return (
    <div className="head-to-head__match">
      <span className="head-to-head__matchweek">MW {match.matchweek}</span>
      <span className="head-to-head__team">{match.homeTeam}</span>
      <span className="head-to-head__score">
        {match.homeScore} - {match.awayScore}
      </span>
      <span className="head-to-head__team">{match.awayTeam}</span>
    </div>
  );
}

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
    clubAStats,
    clubBStats,
    headToHeadMatches,
    headToHeadSummary,
    availableSeasons,
    isLoading,
    error,
    refetch,
  } = useCompareTwoClubs();

  return (
    <div className="two-clubs-comparison">
      {/* Header with close button */}
      <div className="two-clubs-comparison__header">
        <h2 className="two-clubs-comparison__title">Compare Two Clubs</h2>
        <button
          onClick={onClose}
          className="two-clubs-comparison__close"
          aria-label="Close comparison"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Controls */}
      <div className="two-clubs-comparison__controls">
        <div className="two-clubs-comparison__clubs">
          <ClubDropdown
            selectedClub={clubA}
            onSelect={setClubA}
            label="Club A"
          />
          <div className="two-clubs-comparison__vs">vs</div>
          <ClubDropdown
            selectedClub={clubB}
            onSelect={setClubB}
            label="Club B"
          />
        </div>
        <div className="two-clubs-comparison__season">
          <SeasonDropdown
            seasons={availableSeasons}
            selectedSeason={selectedSeason}
            onSelect={handleSeasonChange}
            label="Select Season"
          />
        </div>
      </div>

      {/* Content */}
      {!clubA || !clubB ? (
        <EmptyState
          title="Select Two Clubs"
          message="Choose two clubs to compare their season performance"
        />
      ) : isLoading ? (
        <LoadingSkeleton />
      ) : error ? (
        <ErrorDisplay
          message="Failed to load data. Please try again."
          onRetry={refetch}
        />
      ) : (
        <div className="two-clubs-comparison__content">
          {/* Stats Comparison */}
          <div className="two-clubs-comparison__stats">
            <div className="two-clubs-comparison__club-stats">
              <h3 className="two-clubs-comparison__club-name">{clubA}</h3>
              {clubAStats ? (
                <SeasonStatsCompact stats={clubAStats} title={`${selectedSeason}`} />
              ) : (
                <div className="two-clubs-comparison__no-stats">
                  No stats available
                </div>
              )}
            </div>

            <div className="two-clubs-comparison__club-stats">
              <h3 className="two-clubs-comparison__club-name">{clubB}</h3>
              {clubBStats ? (
                <SeasonStatsCompact stats={clubBStats} title={`${selectedSeason}`} />
              ) : (
                <div className="two-clubs-comparison__no-stats">
                  No stats available
                </div>
              )}
            </div>
          </div>

          {/* Stats Comparison Bar */}
          {clubAStats && clubBStats && (
            <div className="two-clubs-comparison__bar-comparison">
              <ComparisonBar
                label="Points"
                valueA={clubAStats.points}
                valueB={clubBStats.points}
                clubA={clubA}
                clubB={clubB}
              />
              <ComparisonBar
                label="Wins"
                valueA={clubAStats.wins}
                valueB={clubBStats.wins}
                clubA={clubA}
                clubB={clubB}
              />
              <ComparisonBar
                label="Goals For"
                valueA={clubAStats.goalsFor}
                valueB={clubBStats.goalsFor}
                clubA={clubA}
                clubB={clubB}
              />
              <ComparisonBar
                label="Goals Against"
                valueA={clubAStats.goalsAgainst}
                valueB={clubBStats.goalsAgainst}
                clubA={clubA}
                clubB={clubB}
                lowerIsBetter
              />
            </div>
          )}

          {/* Head-to-Head Section */}
          <div className="head-to-head">
            <h3 className="head-to-head__title">Head-to-Head</h3>
            {headToHeadMatches.length === 0 ? (
              <p className="head-to-head__no-matches">
                No head-to-head matches in this season
              </p>
            ) : (
              <>
                {/* Summary */}
                {headToHeadSummary && (
                  <div className="head-to-head__summary">
                    <div className="head-to-head__summary-item">
                      <span className="head-to-head__summary-club">{clubA}</span>
                      <span className="head-to-head__summary-value">
                        {headToHeadSummary.clubAWins} wins
                      </span>
                    </div>
                    <div className="head-to-head__summary-item head-to-head__summary-item--draws">
                      <span className="head-to-head__summary-value">
                        {headToHeadSummary.draws} draws
                      </span>
                    </div>
                    <div className="head-to-head__summary-item">
                      <span className="head-to-head__summary-club">{clubB}</span>
                      <span className="head-to-head__summary-value">
                        {headToHeadSummary.clubBWins} wins
                      </span>
                    </div>
                  </div>
                )}

                {/* Matches */}
                <div className="head-to-head__matches">
                  {headToHeadMatches.map((match) => (
                    <HeadToHeadMatch
                      key={match.id}
                      match={match}
                      clubA={clubA}
                      clubB={clubB}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

interface ComparisonBarProps {
  label: string;
  valueA: number;
  valueB: number;
  clubA: string;
  clubB: string;
  lowerIsBetter?: boolean;
}

function ComparisonBar({
  label,
  valueA,
  valueB,
  clubA,
  clubB,
  lowerIsBetter = false,
}: ComparisonBarProps) {
  const total = valueA + valueB || 1;
  const percentA = (valueA / total) * 100;
  const percentB = (valueB / total) * 100;

  const isABetter = lowerIsBetter ? valueA < valueB : valueA > valueB;
  const isBBetter = lowerIsBetter ? valueB < valueA : valueB > valueA;
  const isDraw = valueA === valueB;

  return (
    <div className="comparison-bar">
      <div className="comparison-bar__label">{label}</div>
      <div className="comparison-bar__content">
        <span
          className={`comparison-bar__value comparison-bar__value--left ${
            isABetter ? "comparison-bar__value--winner" : ""
          }`}
        >
          {valueA}
        </span>
        <div className="comparison-bar__bar">
          <div
            className={`comparison-bar__fill comparison-bar__fill--left ${
              isABetter ? "comparison-bar__fill--winner" : ""
            }`}
            style={{ width: `${percentA}%` }}
          />
          <div
            className={`comparison-bar__fill comparison-bar__fill--right ${
              isBBetter ? "comparison-bar__fill--winner" : ""
            }`}
            style={{ width: `${percentB}%` }}
          />
        </div>
        <span
          className={`comparison-bar__value comparison-bar__value--right ${
            isBBetter ? "comparison-bar__value--winner" : ""
          }`}
        >
          {valueB}
        </span>
      </div>
    </div>
  );
}
