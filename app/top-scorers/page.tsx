"use client";

import { useQuery } from "@tanstack/react-query";
import { RefreshButton } from "@/components/RefreshButton";
import { TableSkeleton } from "@/components/LoadingSkeleton";
import { ErrorDisplay } from "@/components/ErrorDisplay";
import { EmptyState } from "@/components/EmptyState";
import { Scorer } from "@/lib/types";

async function fetchScorers(): Promise<Scorer[]> {
  const res = await fetch("/api/scorers", {
    next: { revalidate: 1800 }, // Revalidate every 30 minutes
  });
  if (!res.ok) throw new Error("Failed to fetch scorers");
  return res.json();
}

export default function TopScorersPage() {
  const {
    data: scorers = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["scorers"],
    queryFn: fetchScorers,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    staleTime: 25 * 60 * 1000, // Consider data fresh for 25 minutes
    gcTime: 30 * 60 * 1000, // Keep in cache for 30 minutes
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Top Scorers</h1>
        <RefreshButton />
      </div>

      {isLoading ? (
        <TableSkeleton />
      ) : error ? (
        <ErrorDisplay
          message="Failed to load scorers. The scraper may need updating."
          onRetry={() => refetch()}
        />
      ) : scorers.length === 0 ? (
        <EmptyState
          title="No Scorers Data Available"
          message="Top scorers data is not available. This may be because the 2025/26 season hasn't started yet, or the scraper needs to be updated."
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left p-2">Rank</th>
                <th className="text-left p-2">Player</th>
                <th className="text-left p-2">Club</th>
                <th className="text-center p-2">Goals</th>
                <th className="text-center p-2">Assists</th>
                <th className="text-center p-2">Total</th>
              </tr>
            </thead>
            <tbody>
              {scorers.map((scorer, index) => (
                <ScorerRow key={scorer.name} scorer={scorer} rank={index + 1} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function ScorerRow({ scorer, rank }: { scorer: Scorer; rank: number }) {
  const medalColors: Record<number, string> = {
    1: "bg-yellow-100 dark:bg-yellow-900/20",
    2: "bg-gray-100 dark:bg-gray-800",
    3: "bg-orange-100 dark:bg-orange-900/20",
  };

  return (
    <tr
      className={`border-b border-gray-200 dark:border-gray-700 ${
        medalColors[rank] || ""
      }`}
    >
      <td className="p-2 font-semibold">{rank}</td>
      <td className="p-2 font-medium">{scorer.name}</td>
      <td className="p-2">{scorer.club}</td>
      <td className="p-2 text-center font-semibold">{scorer.goals}</td>
      <td className="p-2 text-center">{scorer.assists}</td>
      <td className="p-2 text-center font-bold">
        {scorer.goals + scorer.assists}
      </td>
    </tr>
  );
}

