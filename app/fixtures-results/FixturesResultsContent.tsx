"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { LoadingSkeleton } from "@/components/LoadingSkeleton";
import { ErrorDisplay } from "@/components/ErrorDisplay";
import { EmptyState } from "@/components/EmptyState";
import { FixturesResultsControls } from "@/components/FixturesResultsControls";
import { FixturesResultsList } from "@/components/FixturesResultsList";
import { Fixture } from "@/lib/types";
import { useFixturesResultsData } from "@/lib/hooks/useFixturesResultsData";
import { useClubs } from "@/lib/hooks/useClubs";
import { useMatchDayRefetch } from "@/lib/hooks/useMatchDayRefetch";

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
const PREMIER_LEAGUE_COMPETITION = "Premier League";

export default function FixturesResultsContent() {
  const [activeTab, setActiveTab] = useState<TabType>("fixtures");
  const [selectedMatchweek, setSelectedMatchweek] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const matchweekRefs = useRef<Record<number, HTMLDivElement | null>>({});
  
  // Fetch all clubs in one API call to avoid rate limiting
  const { clubs } = useClubs();
  
  // Get match day aware refetch configuration
  const { refetchInterval, staleTime, isMatchDay } = useMatchDayRefetch();

  const {
    data: fixtures = [],
    isLoading: fixturesLoading,
    error: fixturesError,
    refetch: refetchFixtures,
  } = useQuery({
    queryKey: ["fixtures"],
    queryFn: fetchFixtures,
    refetchOnMount: false,
    refetchOnWindowFocus: isMatchDay, // Auto refetch on focus during match days
    refetchInterval: refetchInterval || false, // Auto refetch during match days
    staleTime,
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
    refetchOnWindowFocus: isMatchDay, // Auto refetch on focus during match days
    refetchInterval: refetchInterval || false, // Auto refetch during match days
    staleTime,
    gcTime: 30 * 60 * 1000, // Keep in cache for 30 minutes
  });

  const handleScrollToMatchweek = (matchweek: number) => {
    const element = matchweekRefs.current[matchweek];
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  // Get upcoming fixtures (not finished)
  // Also exclude any fixture that appears in results (in case of cache mismatch)
  // Check by both ID and team+date combination to handle ID format differences
  const premierLeagueFixtures = useMemo(
    () =>
      fixtures.filter(
        (fixture) =>
          (fixture.competition || PREMIER_LEAGUE_COMPETITION) === PREMIER_LEAGUE_COMPETITION
      ),
    [fixtures]
  );

  const premierLeagueResults = useMemo(() => {
    const filtered = results.filter(
      (result) =>
        (result.competition || PREMIER_LEAGUE_COMPETITION) === PREMIER_LEAGUE_COMPETITION
    );
    // Debug logging
    if (results.length !== filtered.length) {
      console.log(`[Frontend] Results: ${results.length} total, ${filtered.length} after PL filter`);
      const nonPL = results.filter(r => (r.competition || PREMIER_LEAGUE_COMPETITION) !== PREMIER_LEAGUE_COMPETITION);
      console.log(`[Frontend] Non-PL competitions found:`, [...new Set(nonPL.map(r => r.competition))]);
    }
    return filtered;
  }, [results]);

  const {
    upcomingFixtures,
    currentMatchweek,
    matchweeks,
    filteredMatches,
    groupedByMatchweek,
  } = useFixturesResultsData({
    fixtures: premierLeagueFixtures,
    results: premierLeagueResults,
    activeTab,
    selectedMatchweek,
    searchQuery,
  });

  // Auto-select current matchweek when switching to fixtures tab
  useEffect(() => {
    if (activeTab === "fixtures" && currentMatchweek && !selectedMatchweek) {
      setSelectedMatchweek(currentMatchweek);
    }
  }, [activeTab, currentMatchweek, selectedMatchweek]);

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setSelectedMatchweek(null); // Reset matchweek selection when switching tabs
    setSearchQuery(""); // Reset search when switching tabs
  };

  const isLoading = activeTab === "fixtures" ? fixturesLoading : resultsLoading;
  const error = activeTab === "fixtures" ? fixturesError : resultsError;
  const refetch = activeTab === "fixtures" ? refetchFixtures : refetchResults;

  const tabs = [
    { id: "fixtures" as TabType, label: "Upcoming Fixtures", count: upcomingFixtures.length },
    { id: "results" as TabType, label: "Results", count: premierLeagueResults.length },
  ];

  return (
    <div className="space-y-6">
      <FixturesResultsControls
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        matchweeks={matchweeks}
        selectedMatchweek={selectedMatchweek}
        onSelectMatchweek={setSelectedMatchweek}
        onScrollToMatchweek={handleScrollToMatchweek}
        currentMatchweek={currentMatchweek}
      />

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
        <FixturesResultsList
          groupedByMatchweek={groupedByMatchweek}
          matchweekRefs={matchweekRefs}
          activeTab={activeTab}
          clubs={clubs}
        />
      )}
    </div>
  );
}