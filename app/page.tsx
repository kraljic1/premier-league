"use client";

import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import dynamic from "next/dynamic";
import { RefreshButton } from "@/components/RefreshButton";
import { LoadingSkeleton } from "@/components/LoadingSkeleton";
import { ErrorDisplay } from "@/components/ErrorDisplay";
import { EmptyState } from "@/components/EmptyState";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { useAppStore } from "@/lib/store";
import { Fixture } from "@/lib/types";
import { getHomepageMatchweek, getMatchweekFixtures, getNextMatch, getNextMatchweekFixtures } from "@/lib/homepage-utils";
import { useClubs } from "@/lib/hooks/useClubs";
import { useMatchDayRefetch } from "@/lib/hooks/useMatchDayRefetch";
import { MatchweekSection } from "@/components/MatchweekSection";
import { HelpButton } from "@/components/HelpButton";
import { getHelpContent } from "@/lib/help-content";

// Dynamically import heavy components for better code splitting
// Using ssr: false to prevent hydration mismatches with browser-only code
const MatchCountdown = dynamic(
  () => import("@/components/MatchCountdown").then(mod => ({ default: mod.MatchCountdown })),
  {
    ssr: false,
    loading: () => <div className="animate-pulse h-32 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
  }
);

const ClubSelector = dynamic(
  () => import("@/components/ClubSelector").then(mod => ({ default: mod.ClubSelector })),
  {
    ssr: false,
    loading: () => <div className="animate-pulse h-48 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
  }
);

async function fetchFixtures(): Promise<Fixture[]> {
  const res = await fetch("/api/fixtures", {
    cache: "no-store", // Client-side fetch, don't cache
  });
  if (!res.ok) throw new Error("Failed to fetch fixtures");
  return res.json();
}

const PREMIER_LEAGUE_COMPETITION = "Premier League";

export default function HomePage() {
  const [mounted, setMounted] = useState(false);
  const myClubs = useAppStore((state) => state.myClubs);
  
  // Get match day aware refetch configuration
  // During match days: refetch every 5 minutes to keep scores updated
  // Outside match days: rely on stale time for caching
  const { refetchInterval, staleTime, isMatchDay } = useMatchDayRefetch();
  
  const {
    data: fixtures = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["fixtures"],
    queryFn: fetchFixtures,
    refetchInterval: refetchInterval || false, // 0 means no interval
    staleTime,
    refetchOnWindowFocus: isMatchDay, // Only refetch on focus during match days
  });
  
  // Fetch all clubs in one API call to avoid rate limiting
  const { clubs } = useClubs();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Use empty array during SSR/before mount to prevent mismatch
  const safeMyClubs = mounted ? myClubs : [];
  const premierLeagueFixtures = useMemo(
    () =>
      fixtures.filter(
        (fixture) =>
          (fixture.competition || PREMIER_LEAGUE_COMPETITION) === PREMIER_LEAGUE_COMPETITION
      ),
    [fixtures]
  );

  const nextMatch = getNextMatch(premierLeagueFixtures, safeMyClubs);
  const homepageMatchweek = useMemo(
    () => getHomepageMatchweek(premierLeagueFixtures),
    [premierLeagueFixtures]
  );
  const homepageMatchweekFixtures = useMemo(
    () => getMatchweekFixtures(premierLeagueFixtures, homepageMatchweek),
    [premierLeagueFixtures, homepageMatchweek]
  );
  const nextMatchweekFixtures = useMemo(
    () => getNextMatchweekFixtures(premierLeagueFixtures, homepageMatchweek),
    [premierLeagueFixtures, homepageMatchweek]
  );

  return (
    <ErrorBoundary>
      <main className="space-y-8">
        <header className="flex justify-between items-center pl-space-md">
          <h1 className="pl-heading-lg goal-underline">Home</h1>
          <div className="flex items-center gap-2">
            <HelpButton {...getHelpContent('home')} />
            <RefreshButton />
          </div>
        </header>

        <div className="pl-space-lg">
          <h2 className="pl-heading-md mb-4">My Clubs</h2>
          <ClubSelector />
        </div>

        {isLoading ? (
          <LoadingSkeleton />
        ) : error ? (
          <ErrorDisplay
            message="Failed to load fixtures. The scraper may need updating."
            onRetry={() => refetch()}
          />
        ) : premierLeagueFixtures.length === 0 ? (
          <EmptyState
            title="No Fixtures Available"
            message="Fixtures data is not available. This may be because the current season hasn't started yet, or the scraper needs to be updated with the correct CSS selectors."
          />
        ) : (
          <>
            {nextMatch && (
              <div className="pl-space-lg">
                <h2 className="pl-heading-md mb-4 goal-underline">Next Match</h2>
                <MatchCountdown fixture={nextMatch} />
              </div>
            )}

            <MatchweekSection
              title={`Match week ${homepageMatchweek}`}
              fixtures={homepageMatchweekFixtures}
              clubs={clubs}
            />

            <MatchweekSection
              title="Next match week"
              fixtures={nextMatchweekFixtures}
              clubs={clubs}
            />
          </>
        )}
      </main>
    </ErrorBoundary>
  );
}

