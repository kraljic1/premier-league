"use client";

import { useClubs } from "@/lib/hooks/useClubs";
import { getClubByName } from "@/lib/clubs";
import { findClubEntryByName } from "@/lib/utils/club-name";

interface ComparisonSummaryProps {
  current: {
    points: number;
    wins: number;
    draws: number;
    losses: number;
    played: number;
    goalsFor: number;
    goalsAgainst: number;
  };
  historical: {
    points: number;
    wins: number;
    draws: number;
    losses: number;
    played: number;
    goalsFor: number;
    goalsAgainst: number;
  };
  clubName: string;
}

export function ComparisonSummary({
  current,
  historical,
  clubName,
}: ComparisonSummaryProps) {
  const { clubs } = useClubs();
  const pointsDiff = current.points - historical.points;
  const winsDiff = current.wins - historical.wins;
  const goalsForDiff = current.goalsFor - historical.goalsFor;
  const goalsAgainstDiff = current.goalsAgainst - historical.goalsAgainst;

  // Get logo URL for club
  const clubEntry = findClubEntryByName(clubs, clubName);
  const hardcodedClub = getClubByName(clubName);
  const logoUrl = clubEntry?.logoUrlFromDb || clubEntry?.logoUrl || hardcodedClub?.logoUrl || null;

  return (
    <div className="mt-8 p-6 bg-gray-50 dark:bg-gray-800 rounded-lg">
      <div className="comparison-summary__header">
        {logoUrl && (
          <img
            src={logoUrl}
            alt={`${clubName} logo`}
            className="comparison-summary__logo"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        )}
        <h3 className="text-lg font-semibold mb-4">Comparison Summary</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ComparisonItem
          label="Points"
          current={current.points}
          historical={historical.points}
          diff={pointsDiff}
        />
        <ComparisonItem
          label="Wins"
          current={current.wins}
          historical={historical.wins}
          diff={winsDiff}
        />
        <ComparisonItem
          label="Goals For"
          current={current.goalsFor}
          historical={historical.goalsFor}
          diff={goalsForDiff}
        />
        <ComparisonItem
          label="Goals Against"
          current={current.goalsAgainst}
          historical={historical.goalsAgainst}
          diff={goalsAgainstDiff}
        />
      </div>
    </div>
  );
}

interface ComparisonItemProps {
  label: string;
  current: number;
  historical: number;
  diff: number;
}

function ComparisonItem({
  label,
  current,
  historical,
  diff,
}: ComparisonItemProps) {
  const isPositive = diff > 0;
  const isNegative = diff < 0;

  return (
    <div className="bg-white dark:bg-gray-700 p-4 rounded-lg">
      <div className="text-sm text-gray-600 dark:text-gray-400">{label}</div>
      <div className="flex items-center justify-between mt-2">
        <div>
          <div className="text-lg font-semibold">Current: {current}</div>
          <div className="text-sm text-gray-500">
            Previous: {historical}
          </div>
        </div>
        <div
          className={`text-lg font-bold ${
            isPositive
              ? "text-green-600 dark:text-green-400"
              : isNegative
              ? "text-red-600 dark:text-red-400"
              : "text-gray-600 dark:text-gray-400"
          }`}
        >
          {diff > 0 ? "+" : ""}
          {diff}
        </div>
      </div>
    </div>
  );
}
