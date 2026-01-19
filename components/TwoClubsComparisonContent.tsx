"use client";

import { ClubMatchResults } from "./ClubMatchResults";
import { HeadToHeadSection } from "./HeadToHeadSection";
import { ClubStatsCard } from "./ClubStatsCard";
import { getClubByName } from "@/lib/clubs";
import { ComparisonBasis, Fixture } from "@/lib/types";

interface TwoClubsComparisonContentProps {
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
  maxMatchesPlayed: number;
  comparisonBasis: ComparisonBasis;
  headToHeadMatches: any[];
  headToHeadSummary: any;
  sameSeason: boolean;
}

export function TwoClubsComparisonContent({
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
  maxMatchesPlayed,
  comparisonBasis,
  headToHeadMatches,
  headToHeadSummary,
  sameSeason,
}: TwoClubsComparisonContentProps) {
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
          maxMatchesPlayed={maxMatchesPlayed}
          comparisonBasis={comparisonBasis}
          seasonLabel={`${clubA} Results (${selectedSeasonA})`}
          clubColor={clubAColor}
        />
        <ClubMatchResults
          fixtures={fixturesB}
          clubName={clubB}
          maxMatchweek={effectiveMatchweekB}
          maxMatchesPlayed={maxMatchesPlayed}
          comparisonBasis={comparisonBasis}
          seasonLabel={`${clubB} Results (${selectedSeasonB})`}
          clubColor={clubBColor}
        />
      </div>

      {sameSeason ? (
        <HeadToHeadSection
          clubA={clubA}
          clubB={clubB}
          matches={headToHeadMatches}
          summary={headToHeadSummary}
        />
      ) : (
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
