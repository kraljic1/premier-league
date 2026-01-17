"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { RefreshButton } from "@/components/RefreshButton";
import { TableSkeleton } from "@/components/LoadingSkeleton";
import { ErrorDisplay } from "@/components/ErrorDisplay";
import { EmptyState } from "@/components/EmptyState";
import { ClubLogo } from "@/components/ClubLogo";
import { Standing } from "@/lib/types";
import { useClubs } from "@/lib/hooks/useClubs";

async function fetchStandings(): Promise<Standing[]> {
  const res = await fetch("/api/standings", {
    next: { revalidate: 1800 }, // Revalidate every 30 minutes
  });
  if (!res.ok) throw new Error("Failed to fetch standings");
  const data = await res.json();
  console.log("Standings fetched:", data.length, "items");
  return Array.isArray(data) ? data : [];
}

function getFormColor(result: string): string {
  switch (result) {
    case "W":
      return "bg-green-500";
    case "D":
      return "bg-yellow-500";
    case "L":
      return "bg-red-500";
    default:
      return "bg-gray-300";
  }
}

export default function StandingsContent() {
  const {
    data: standings = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["standings"],
    queryFn: fetchStandings,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    staleTime: 25 * 60 * 1000, // Consider data fresh for 25 minutes
    gcTime: 30 * 60 * 1000, // Keep in cache for 30 minutes
  });

  // Fetch all clubs in one API call to avoid rate limiting
  const { clubs } = useClubs();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Standings</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Want to see how these positions change? Check out the{" "}
            <Link href="/fixtures-results" className="text-blue-600 dark:text-blue-400 hover:underline">
              upcoming fixtures and results
            </Link>
            .
          </p>
        </div>
        <RefreshButton />
      </div>

      {isLoading ? (
        <TableSkeleton />
      ) : error ? (
        <ErrorDisplay
          message="Failed to load standings. The scraper may need updating."
          onRetry={() => refetch()}
        />
      ) : standings.length === 0 ? (
        <EmptyState
          title="No Standings Available"
          message="Standings data is not available. This may be because the current season hasn't started yet, or the scraper needs to be updated."
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left p-2">Pos</th>
                <th className="text-left p-2">Club</th>
                <th className="text-center p-2">P</th>
                <th className="text-center p-2">W</th>
                <th className="text-center p-2">D</th>
                <th className="text-center p-2">L</th>
                <th className="text-center p-2">GF</th>
                <th className="text-center p-2">GA</th>
                <th className="text-center p-2">GD</th>
                <th className="text-center p-2">Pts</th>
                <th className="text-center p-2">Form</th>
              </tr>
            </thead>
            <tbody>
              {standings.map((standing) => (
                <StandingRow key={standing.club} standing={standing} clubs={clubs} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function StandingRow({ standing, clubs }: { standing: Standing; clubs: Record<string, any> }) {
  const positionColors: Record<number, string> = {
    1: "bg-yellow-100 dark:bg-yellow-900/20",
    2: "bg-gray-100 dark:bg-gray-800",
    3: "bg-orange-100 dark:bg-orange-900/20",
    18: "bg-red-100 dark:bg-red-900/20",
    19: "bg-red-100 dark:bg-red-900/20",
    20: "bg-red-100 dark:bg-red-900/20",
  };

  // Find club data and get logo URL from database if available
  const clubEntry = Object.values(clubs).find((c: any) => c.name === standing.club);
  const logoUrl = clubEntry?.logoUrlFromDb || null;

  return (
    <tr
      className={`border-b border-gray-200 dark:border-gray-700 ${
        positionColors[standing.position] || ""
      }`}
    >
      <td className="p-2 font-semibold">{standing.position}</td>
      <td className="p-2 font-medium">
        <ClubLogo clubName={standing.club} size={20} logoUrl={logoUrl} context="standings" />
      </td>
      <td className="p-2 text-center">{standing.played}</td>
      <td className="p-2 text-center">{standing.won}</td>
      <td className="p-2 text-center">{standing.drawn}</td>
      <td className="p-2 text-center">{standing.lost}</td>
      <td className="p-2 text-center">{standing.goalsFor}</td>
      <td className="p-2 text-center">{standing.goalsAgainst}</td>
      <td className="p-2 text-center">
        {standing.goalDifference > 0 ? "+" : ""}
        {standing.goalDifference}
      </td>
      <td className="p-2 text-center font-bold">{standing.points}</td>
      <td className="p-2">
        <div className="flex gap-1 justify-center">
          {standing.form?.split("").map((result, idx) => (
            <div
              key={idx}
              className={`w-5 h-5 rounded ${getFormColor(result)}`}
              title={result}
            />
          ))}
        </div>
      </td>
    </tr>
  );
}

