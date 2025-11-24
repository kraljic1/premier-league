"use client";

import { useState, useMemo, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { RefreshButton } from "@/components/RefreshButton";
import { LoadingSkeleton } from "@/components/LoadingSkeleton";
import { ErrorDisplay } from "@/components/ErrorDisplay";
import { EmptyState } from "@/components/EmptyState";
import { SearchBar } from "@/components/SearchBar";
import { MatchweekSelector } from "@/components/MatchweekSelector";
import { Fixture } from "@/lib/types";
import { formatDate } from "@/lib/utils";

async function fetchResults(): Promise<Fixture[]> {
  const res = await fetch("/api/results", {
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Failed to fetch results");
  const data = await res.json();
  console.log("Results fetched:", data.length, "items");
  return Array.isArray(data) ? data : [];
}

export default function ResultsContent() {
  const [selectedMatchweek, setSelectedMatchweek] = useState<number | null>(
    null
  );
  const [searchQuery, setSearchQuery] = useState("");
  const matchweekRefs = useRef<Record<number, HTMLDivElement | null>>({});
  
  const {
    data: fixtures = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["results"],
    queryFn: fetchResults,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    staleTime: 0, // Always consider data stale to ensure fresh fetches
  });

  const handleScrollToMatchweek = (matchweek: number) => {
    const element = matchweekRefs.current[matchweek];
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const filteredFixtures = useMemo(() => {
    // Results API already returns only finished matches, but filter for search/matchweek
    let filtered = fixtures;

    if (selectedMatchweek) {
      filtered = filtered.filter((f) => f.matchweek === selectedMatchweek);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (f) =>
          f.homeTeam.toLowerCase().includes(query) ||
          f.awayTeam.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [fixtures, selectedMatchweek, searchQuery]);

  const matchweeks = Array.from(
    new Set(filteredFixtures.map((f) => f.matchweek))
  ).sort((a, b) => b - a); // Sort descending (most recent first)

  const groupedByMatchweek = filteredFixtures.reduce(
    (acc, fixture) => {
      if (!acc[fixture.matchweek]) {
        acc[fixture.matchweek] = [];
      }
      acc[fixture.matchweek].push(fixture);
      return acc;
    },
    {} as Record<number, Fixture[]>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Results</h1>
        <RefreshButton />
      </div>

      <div className="space-y-4">
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search by team name..."
        />
        <MatchweekSelector
          availableMatchweeks={matchweeks}
          selectedMatchweek={selectedMatchweek}
          onSelect={setSelectedMatchweek}
          onScrollTo={handleScrollToMatchweek}
        />
      </div>

      {isLoading ? (
        <LoadingSkeleton />
      ) : error ? (
        <ErrorDisplay
          message="Failed to load results. The scraper may need updating."
          onRetry={() => refetch()}
        />
      ) : filteredFixtures.length === 0 ? (
        <EmptyState
          title="No Results Available"
          message="No match results are available yet. Check back after matches are played."
        />
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedByMatchweek)
            .sort(([a], [b]) => parseInt(b) - parseInt(a)) // Most recent first
            .map(([matchweek, matches]) => (
              <div
                key={matchweek}
                ref={(el) => {
                  matchweekRefs.current[parseInt(matchweek)] = el;
                }}
                id={`matchweek-${matchweek}`}
                className="scroll-mt-20"
              >
                <h2 className="text-2xl font-semibold mb-4">
                  Matchweek {matchweek}
                </h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {matches
                    .filter((f, index, self) => 
                      index === self.findIndex((fixture) => fixture.id === f.id)
                    )
                    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                    .map((fixture) => (
                      <ResultCard key={fixture.id} fixture={fixture} />
                    ))}
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}

function ResultCard({ fixture }: { fixture: Fixture }) {
  return (
    <div
      className={`p-4 rounded-lg border ${
        fixture.isDerby
          ? "border-red-500 bg-red-50 dark:bg-red-900/20"
          : "border-gray-200 dark:border-gray-700"
      }`}
    >
      <div className="text-sm text-gray-600 dark:text-gray-400">
        {formatDate(fixture.date)}
      </div>
      <div className="mt-2 font-semibold">
        {fixture.homeTeam} vs {fixture.awayTeam}
      </div>
      {fixture.homeScore !== null && fixture.awayScore !== null ? (
        <div className="text-lg font-bold mt-2">
          {fixture.homeScore} - {fixture.awayScore}
        </div>
      ) : null}
      {fixture.isDerby && (
        <div className="text-xs text-red-600 dark:text-red-400 mt-1">
          🏆 Derby Match
        </div>
      )}
    </div>
  );
}

