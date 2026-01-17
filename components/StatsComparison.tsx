"use client";

import { SeasonStatsCompact } from "./SeasonStatsCompact";
import { ComparisonBar } from "./ComparisonBar";

interface StatsComparisonProps {
  clubA: string;
  clubB: string;
  selectedSeason: string | null;
  clubAStats: {
    points: number;
    wins: number;
    draws: number;
    losses: number;
    played: number;
    goalsFor: number;
    goalsAgainst: number;
  } | null;
  clubBStats: {
    points: number;
    wins: number;
    draws: number;
    losses: number;
    played: number;
    goalsFor: number;
    goalsAgainst: number;
  } | null;
}

export function StatsComparison({
  clubA,
  clubB,
  selectedSeason,
  clubAStats,
  clubBStats,
}: StatsComparisonProps) {
  return (
    <>
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
    </>
  );
}