"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { RefreshButton } from "@/components/RefreshButton";
import { TableSkeleton } from "@/components/LoadingSkeleton";
import { ErrorDisplay } from "@/components/ErrorDisplay";
import { EmptyState } from "@/components/EmptyState";
import { Standing } from "@/lib/types";
import { useClubs } from "@/lib/hooks/useClubs";
import { useMatchDayRefetch } from "@/lib/hooks/useMatchDayRefetch";
import { getClubByName } from "@/lib/clubs";

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
  // Get match day aware refetch configuration
  const { refetchInterval, staleTime, isMatchDay } = useMatchDayRefetch();
  
  const {
    data: standings = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["standings"],
    queryFn: fetchStandings,
    refetchOnMount: false,
    refetchOnWindowFocus: isMatchDay, // Auto refetch on focus during match days
    refetchInterval: refetchInterval || false, // Auto refetch during match days
    staleTime,
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
          <table className="standings-table w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="standings-table__col-pos">Pos</th>
                <th className="standings-table__col-club">Club</th>
                <th className="standings-table__col-stat">P</th>
                <th className="standings-table__col-stat">W</th>
                <th className="standings-table__col-stat">D</th>
                <th className="standings-table__col-stat">L</th>
                <th className="standings-table__col-stat">GF</th>
                <th className="standings-table__col-stat">GA</th>
                <th className="standings-table__col-stat">GD</th>
                <th className="standings-table__col-stat">Pts</th>
                <th className="standings-table__col-form">Form</th>
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
  const [imageError, setImageError] = useState(false);
  
  const positionColors: Record<number, string> = {
    1: "bg-yellow-100 dark:bg-yellow-900/20",
    2: "bg-gray-100 dark:bg-gray-800",
    3: "bg-orange-100 dark:bg-orange-900/20",
    18: "bg-red-100 dark:bg-red-900/20",
    19: "bg-red-100 dark:bg-red-900/20",
    20: "bg-red-100 dark:bg-red-900/20",
  };

  // Find club data and get logo URL with proper fallback chain
  const clubEntry = Object.values(clubs).find((c: any) => c.name === standing.club);
  const hardcodedClub = getClubByName(standing.club);
  
  // Try database logo first, then hardcoded logoUrl, then null
  const logoUrl = clubEntry?.logoUrlFromDb || clubEntry?.logoUrl || hardcodedClub?.logoUrl || null;
  const shouldShowPlaceholder = !logoUrl || imageError;

  return (
    <tr
      className={`border-b border-gray-200 dark:border-gray-700 ${
        positionColors[standing.position] || ""
      }`}
    >
      <td className="standings-table__col-pos font-semibold">{standing.position}</td>
      <td className="standings-table__col-club font-medium">
        <div className="standings-row__club">
          {shouldShowPlaceholder ? (
            <div className="standings-row__logo-placeholder">
              {standing.club.charAt(0)}
            </div>
          ) : (
            <img
              src={logoUrl}
              alt={`${standing.club} logo`}
              width={40}
              height={40}
              className="standings-row__logo"
              loading="lazy"
              onError={() => setImageError(true)}
            />
          )}
          <span className="standings-row__club-name">{standing.club}</span>
        </div>
      </td>
      <td className="standings-table__col-stat">{standing.played}</td>
      <td className="standings-table__col-stat">{standing.won}</td>
      <td className="standings-table__col-stat">{standing.drawn}</td>
      <td className="standings-table__col-stat">{standing.lost}</td>
      <td className="standings-table__col-stat">{standing.goalsFor}</td>
      <td className="standings-table__col-stat">{standing.goalsAgainst}</td>
      <td className="standings-table__col-stat">
        {standing.goalDifference > 0 ? "+" : ""}
        {standing.goalDifference}
      </td>
      <td className="standings-table__col-stat font-bold">{standing.points}</td>
      <td className="standings-table__col-form">
        <div className="standings-row__form">
          {standing.form?.split("").map((result, idx) => (
            <div
              key={idx}
              className={`standings-row__form-item ${getFormColor(result)}`}
              title={result}
            />
          ))}
        </div>
      </td>
    </tr>
  );
}

