"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { RefreshButton } from "@/components/RefreshButton";
import { TableSkeleton } from "@/components/LoadingSkeleton";
import { ErrorDisplay } from "@/components/ErrorDisplay";
import { EmptyState } from "@/components/EmptyState";
import { Standing, Fixture } from "@/lib/types";
import { useClubs } from "@/lib/hooks/useClubs";
import { useMatchDayRefetch } from "@/lib/hooks/useMatchDayRefetch";
import { buildStandingsFormMap } from "@/lib/utils/standings-form";
import { StandingRow } from "@/components/StandingRow";

async function fetchStandings(): Promise<Standing[]> {
  const res = await fetch("/api/standings", {
    next: { revalidate: 1800 }, // Revalidate every 30 minutes
  });
  if (!res.ok) throw new Error("Failed to fetch standings");
  const data = await res.json();
  console.log("Standings fetched:", data.length, "items");
  return Array.isArray(data) ? data : [];
}

async function fetchFixtures(): Promise<Fixture[]> {
  const res = await fetch("/api/fixtures", {
    next: { revalidate: 1800 }, // Revalidate every 30 minutes
  });
  if (!res.ok) throw new Error("Failed to fetch fixtures");
  const data = await res.json();
  return Array.isArray(data) ? data : [];
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

  const needsFormData = standings.some(
    (standing) => !standing.form || standing.form.trim().length === 0
  );

  const { data: fixtures = [] } = useQuery({
    queryKey: ["fixtures"],
    queryFn: fetchFixtures,
    enabled: needsFormData,
    refetchOnWindowFocus: isMatchDay,
    refetchInterval: refetchInterval || false,
    staleTime,
    gcTime: 30 * 60 * 1000,
  });

  const formMap = useMemo(() => {
    if (!needsFormData || fixtures.length === 0) return {};
    return buildStandingsFormMap(fixtures, standings);
  }, [fixtures, needsFormData, standings]);

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
                <StandingRow
                  key={standing.club}
                  standing={standing}
                  clubs={clubs}
                  formOverride={formMap[standing.club]}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

