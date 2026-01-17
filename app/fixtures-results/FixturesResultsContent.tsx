"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { RefreshButton } from "@/components/RefreshButton";
import { LoadingSkeleton } from "@/components/LoadingSkeleton";
import { ErrorDisplay } from "@/components/ErrorDisplay";
import { EmptyState } from "@/components/EmptyState";
import { SearchBar } from "@/components/SearchBar";
import { MatchweekSelector } from "@/components/MatchweekSelector";
import { ClubLogo } from "@/components/ClubLogo";
import { Fixture } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { useClubs } from "@/lib/hooks/useClubs";

async function fetchFixtures(): Promise<Fixture[]> {
  const res = await fetch("/api/fixtures", {
    next: { revalidate: 1800 }, // Revalidate every 30 minutes
  });
  if (!res.ok) throw new Error("Failed to fetch fixtures");
  const data = await res.json();
  console.log("Fixtures fetched:", data.length, "items");
  return Array.isArray(data) ? data : [];
}

async function fetchResults(): Promise<Fixture[]> {
  const res = await fetch("/api/results", {
    next: { revalidate: 1800 }, // Revalidate every 30 minutes
  });
  if (!res.ok) throw new Error("Failed to fetch results");
  const data = await res.json();
  console.log("Results fetched:", data.length, "items");
  return Array.isArray(data) ? data : [];
}

type TabType = "fixtures" | "results";

export default function FixturesResultsContent() {
  const [activeTab, setActiveTab] = useState<TabType>("fixtures");
  const [selectedMatchweek, setSelectedMatchweek] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const matchweekRefs = useRef<Record<number, HTMLDivElement | null>>({});
  
  // Fetch all clubs in one API call to avoid rate limiting
  const { clubs } = useClubs();

  const {
    data: fixtures = [],
    isLoading: fixturesLoading,
    error: fixturesError,
    refetch: refetchFixtures,
  } = useQuery({
    queryKey: ["fixtures"],
    queryFn: fetchFixtures,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    staleTime: 25 * 60 * 1000, // Consider data fresh for 25 minutes
    gcTime: 30 * 60 * 1000, // Keep in cache for 30 minutes
  });

  const {
    data: results = [],
    isLoading: resultsLoading,
    error: resultsError,
    refetch: refetchResults,
  } = useQuery({
    queryKey: ["results"],
    queryFn: fetchResults,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    staleTime: 25 * 60 * 1000, // Consider data fresh for 25 minutes
    gcTime: 30 * 60 * 1000, // Keep in cache for 30 minutes
  });

  const handleScrollToMatchweek = (matchweek: number) => {
    const element = matchweekRefs.current[matchweek];
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  // Get upcoming fixtures (not finished)
  const upcomingFixtures = fixtures.filter(f => f.status !== "finished");

  // Find the current matchweek (earliest upcoming fixture's matchweek)
  const currentMatchweek = upcomingFixtures.length > 0 
    ? Math.min(...upcomingFixtures.map(f => f.matchweek))
    : null;

  // Auto-select current matchweek when switching to fixtures tab
  useEffect(() => {
    if (activeTab === "fixtures" && currentMatchweek && !selectedMatchweek) {
      setSelectedMatchweek(currentMatchweek);
    }
  }, [activeTab, currentMatchweek, selectedMatchweek]);

  // Get available matchweeks based on active tab
  const currentData = activeTab === "fixtures" ? upcomingFixtures : results;
  const matchweeks = Array.from(
    new Set(currentData.map((f) => f.matchweek))
  ).sort(activeTab === "fixtures" ? (a, b) => a - b : (a, b) => b - a);

  const filteredMatches = useMemo(() => {
    let filtered = currentData;

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
  }, [currentData, selectedMatchweek, searchQuery]);

  const groupedByMatchweek = filteredMatches.reduce(
    (acc, match) => {
      if (!acc[match.matchweek]) {
        acc[match.matchweek] = [];
      }
      acc[match.matchweek].push(match);
      return acc;
    },
    {} as Record<number, Fixture[]>
  );

  const isLoading = activeTab === "fixtures" ? fixturesLoading : resultsLoading;
  const error = activeTab === "fixtures" ? fixturesError : resultsError;
  const refetch = activeTab === "fixtures" ? refetchFixtures : refetchResults;

  const tabs = [
    { id: "fixtures" as TabType, label: "Upcoming Fixtures", count: upcomingFixtures.length },
    { id: "results" as TabType, label: "Results", count: results.length },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl sm:text-3xl font-bold">Fixtures & Results</h1>
        <RefreshButton />
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-4 sm:space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setSelectedMatchweek(null); // Reset matchweek selection when switching tabs
                setSearchQuery(""); // Reset search when switching tabs
              }}
              className={`py-2 px-1 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap ${
                activeTab === tab.id
                  ? "border-blue-500 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
              }`}
            >
              {tab.label}
              <span className="ml-1 sm:ml-2 py-0.5 px-1 sm:px-2 rounded-full text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                {tab.count}
              </span>
            </button>
          ))}
        </nav>
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
          currentMatchweek={activeTab === "fixtures" ? currentMatchweek : null}
        />
      </div>

      {isLoading ? (
        <LoadingSkeleton />
      ) : error ? (
        <ErrorDisplay
          message={`Failed to load ${activeTab}. The scraper may need updating.`}
          onRetry={() => refetch()}
        />
      ) : filteredMatches.length === 0 ? (
        <EmptyState
          title={`No ${activeTab === "fixtures" ? "Upcoming Fixtures" : "Results"} Available`}
          message={
            activeTab === "fixtures"
              ? "No upcoming fixtures are available. Use the refresh button to scrape data."
              : "No match results are available yet. Check back after matches are played."
          }
        />
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedByMatchweek)
            .sort(([a], [b]) => activeTab === "fixtures" ? parseInt(a) - parseInt(b) : parseInt(b) - parseInt(a))
            .map(([matchweek, matches]) => (
              <div
                key={matchweek}
                ref={(el) => {
                  matchweekRefs.current[parseInt(matchweek)] = el;
                }}
                id={`matchweek-${matchweek}`}
                className="scroll-mt-20"
              >
                <h2 className="text-xl sm:text-2xl font-semibold mb-4">
                  Matchweek {matchweek}
                </h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {matches
                    .filter((f, index, self) =>
                      index === self.findIndex((fixture) => fixture.id === f.id)
                    )
                    .sort(activeTab === "fixtures"
                      ? (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
                      : (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
                    )
                    .map((match) => (
                      <MatchCard key={match.id} fixture={match} isResult={activeTab === "results"} clubs={clubs} />
                    ))}
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}

function MatchCard({ fixture, isResult, clubs }: { fixture: Fixture; isResult: boolean; clubs: Record<string, any> }) {
  const isFinished = fixture.status === "finished";
  const hasScore = fixture.homeScore !== null && fixture.awayScore !== null;

  // Get logo URLs from clubs object
  const homeClubEntry = Object.values(clubs).find((c: any) => c.name === fixture.homeTeam);
  const awayClubEntry = Object.values(clubs).find((c: any) => c.name === fixture.awayTeam);
  const homeLogoUrl = homeClubEntry?.logoUrlFromDb || null;
  const awayLogoUrl = awayClubEntry?.logoUrlFromDb || null;

  return (
    <div
      className={`p-4 rounded-lg border ${
        fixture.isDerby
          ? "border-red-500 bg-red-50 dark:bg-red-900/20"
          : isResult
          ? "border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50"
          : "border-gray-200 dark:border-gray-700"
      }`}
    >
      <div className="text-sm text-gray-600 dark:text-gray-400">
        {formatDate(fixture.date)}
      </div>
      <div className="mt-2 font-semibold flex items-center gap-2 flex-wrap">
        <ClubLogo clubName={fixture.homeTeam} size={20} logoUrl={homeLogoUrl} />
        <span>vs</span>
        <ClubLogo clubName={fixture.awayTeam} size={20} logoUrl={awayLogoUrl} />
      </div>
      {hasScore ? (
        <div className={`text-lg font-bold mt-2 ${isResult ? "text-gray-900 dark:text-gray-100" : ""}`}>
          {fixture.homeScore} - {fixture.awayScore}
          {isResult && (
            <span className="text-xs text-gray-500 dark:text-gray-400 ml-2 font-normal">FT</span>
          )}
        </div>
      ) : (
        <div className="text-sm text-gray-500 mt-2">
          {fixture.status === "live" ? (
            <span className="text-red-600 dark:text-red-400 font-semibold">LIVE</span>
          ) : (
            "Scheduled"
          )}
        </div>
      )}
      {fixture.isDerby && (
        <div className="text-xs text-red-600 dark:text-red-400 mt-1">
          🏆 Derby Match
        </div>
      )}
    </div>
  );
}