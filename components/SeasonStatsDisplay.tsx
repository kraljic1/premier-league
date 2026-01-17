"use client";

import { getClubByName } from "@/lib/clubs";

interface SeasonStatsDisplayProps {
  stats: {
    points: number;
    wins: number;
    draws: number;
    losses: number;
    played: number;
    goalsFor: number;
    goalsAgainst: number;
  };
  clubName: string;
  matchweek: number;
}

export function SeasonStatsDisplay({
  stats,
  clubName,
  matchweek,
}: SeasonStatsDisplayProps) {
  const clubData = getClubByName(clubName);

  return (
    <div
      className="p-6 rounded-lg border-2 club-stats-display"
      style={{
        "--club-color": clubData?.primaryColor || "#6b7280",
        "--club-bg": `${clubData?.primaryColor || "#6b7280"}10`,
      } as React.CSSProperties}
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Points" value={stats.points} />
        <StatCard label="Wins" value={stats.wins} />
        <StatCard label="Draws" value={stats.draws} />
        <StatCard label="Losses" value={stats.losses} />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
        <StatCard label="Matches Played" value={stats.played} />
        <StatCard label="Goals For" value={stats.goalsFor} />
        <StatCard label="Goals Against" value={stats.goalsAgainst} />
      </div>
      <div className="mt-4">
        <StatCard
          label="Goal Difference"
          value={stats.goalsFor - stats.goalsAgainst}
        />
      </div>
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: number;
}

function StatCard({ label, value }: StatCardProps) {
  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg">
      <div className="text-sm text-gray-600 dark:text-gray-400">{label}</div>
      <div className="text-2xl font-bold mt-1">{value}</div>
    </div>
  );
}
