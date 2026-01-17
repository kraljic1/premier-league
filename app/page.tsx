"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import dynamic from "next/dynamic";
import { RefreshButton } from "@/components/RefreshButton";
import { LoadingSkeleton } from "@/components/LoadingSkeleton";
import { ErrorDisplay } from "@/components/ErrorDisplay";
import { EmptyState } from "@/components/EmptyState";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { useAppStore } from "@/lib/store";
import { CLUBS, getClubByName } from "@/lib/clubs";
import { Fixture } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { useClubs } from "@/lib/hooks/useClubs";

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

const ClubLogo = dynamic(
  () => import("@/components/ClubLogo").then(mod => ({ default: mod.ClubLogo })),
  {
    ssr: false,
    loading: () => <div className="w-5 h-5 bg-gray-200 dark:bg-gray-700 rounded"></div>
  }
);

async function fetchFixtures(): Promise<Fixture[]> {
  const res = await fetch("/api/fixtures", {
    cache: "no-store", // Client-side fetch, don't cache
  });
  if (!res.ok) throw new Error("Failed to fetch fixtures");
  return res.json();
}

function getNextMatch(fixtures: Fixture[], myClubs: string[]): Fixture | null {
  const now = new Date();
  const clubNames = myClubs
    .map((id) => CLUBS[id]?.name)
    .filter(Boolean) as string[];

  return (
    fixtures.find((f) => {
      const matchDate = new Date(f.date);
      const isMyClub =
        clubNames.includes(f.homeTeam) || clubNames.includes(f.awayTeam);
      return matchDate > now && isMyClub;
    }) || null
  );
}

function getTodayFixtures(fixtures: Fixture[]): Fixture[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  return fixtures.filter((f) => {
    const matchDate = new Date(f.date);
    return matchDate >= today && matchDate < tomorrow;
  });
}

function getWeekendFixtures(fixtures: Fixture[]): Fixture[] {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const daysUntilSaturday = dayOfWeek === 0 ? 6 : 6 - dayOfWeek;
  const saturday = new Date(now);
  saturday.setDate(now.getDate() + daysUntilSaturday);
  saturday.setHours(0, 0, 0, 0);
  const monday = new Date(saturday);
  monday.setDate(saturday.getDate() + 2);
  monday.setHours(23, 59, 59, 999);

  return fixtures.filter((f) => {
    const matchDate = new Date(f.date);
    return matchDate >= saturday && matchDate <= monday;
  });
}

export default function HomePage() {
  const [mounted, setMounted] = useState(false);
  const myClubs = useAppStore((state) => state.myClubs);
  const {
    data: fixtures = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["fixtures"],
    queryFn: fetchFixtures,
  });
  
  // Fetch all clubs in one API call to avoid rate limiting
  const { clubs } = useClubs();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Use empty array during SSR/before mount to prevent mismatch
  const safeMyClubs = mounted ? myClubs : [];
  const nextMatch = getNextMatch(fixtures, safeMyClubs);
  const todayFixtures = getTodayFixtures(fixtures);
  const weekendFixtures = getWeekendFixtures(fixtures);

  return (
    <ErrorBoundary>
      <main className="space-y-8">
      <header className="flex justify-between items-center pl-space-md">
        <h1 className="pl-heading-lg goal-underline">Home</h1>
        <RefreshButton />
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
      ) : fixtures.length === 0 ? (
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

          {todayFixtures.length > 0 && (
            <div className="pl-space-lg">
              <h2 className="pl-heading-md mb-4 goal-underline">Today&apos;s Fixtures</h2>
              <div className="formation-4-3-3">
                {todayFixtures.map((fixture) => (
                  <FixtureCard key={fixture.id} fixture={fixture} clubs={clubs} />
                ))}
              </div>
            </div>
          )}

          {weekendFixtures.length > 0 && (
            <div className="pl-space-lg">
              <h2 className="pl-heading-md mb-4 goal-underline">Weekend Fixtures</h2>
              <div className="formation-4-3-3">
                {weekendFixtures.map((fixture) => (
                  <FixtureCard key={fixture.id} fixture={fixture} clubs={clubs} />
                ))}
              </div>
            </div>
          )}
        </>
      )}
      </main>
    </ErrorBoundary>
  );
}

function FixtureCard({ fixture, clubs }: { fixture: Fixture; clubs: Record<string, any> }) {
  const club = getClubByName(fixture.homeTeam);

  // Get logo URLs from clubs object
  const homeClubEntry = Object.values(clubs).find((c: any) => c.name === fixture.homeTeam);
  const awayClubEntry = Object.values(clubs).find((c: any) => c.name === fixture.awayTeam);
  const homeLogoUrl = homeClubEntry?.logoUrlFromDb || null;
  const awayLogoUrl = awayClubEntry?.logoUrlFromDb || null;

  // Determine match status
  const now = new Date();
  const matchDate = new Date(fixture.date);
  const hasScore = fixture.homeScore !== null && fixture.awayScore !== null;

  let statusClass = 'status-scheduled';
  if (hasScore) {
    statusClass = 'status-finished';
  } else if (matchDate <= now) {
    statusClass = 'status-live';
  }

  return (
    <article
      className={`match-card p-4 ${
        fixture.isDerby
          ? "border-red-500 bg-red-50 dark:bg-red-900/20"
          : ""
      }`}
      itemScope
      itemType="https://schema.org/SportsEvent"
    >
      <div className="flex justify-between items-start mb-2">
        <time
          className="pl-caption"
          dateTime={fixture.date}
          itemProp="startDate"
        >
          {formatDate(fixture.date)}
        </time>
        <span className={`status-badge ${statusClass}`}>
          {hasScore ? 'FT' : matchDate <= now ? 'LIVE' : 'SCHEDULED'}
        </span>
      </div>

      <div className="mt-3 font-semibold flex items-center gap-3 flex-wrap">
        <div itemProp="homeTeam" itemScope itemType="https://schema.org/SportsTeam">
          <meta itemProp="name" content={fixture.homeTeam} />
          <ClubLogo clubName={fixture.homeTeam} size={20} logoUrl={homeLogoUrl} context="fixture" position="home" />
        </div>
        <span className="pl-body-sm text-gray-500">vs</span>
        <div itemProp="awayTeam" itemScope itemType="https://schema.org/SportsTeam">
          <meta itemProp="name" content={fixture.awayTeam} />
          <ClubLogo clubName={fixture.awayTeam} size={20} logoUrl={awayLogoUrl} context="fixture" position="away" />
        </div>
      </div>

      {fixture.homeScore !== null && fixture.awayScore !== null ? (
        <div className="match-score text-xl font-bold mt-3 text-center" itemProp="result">
          <span itemProp="homeTeamScore" className="mr-2">{fixture.homeScore}</span>
          <span className="text-gray-400">-</span>
          <span itemProp="awayTeamScore" className="ml-2">{fixture.awayScore}</span>
        </div>
      ) : (
        <div className="pl-body-sm text-gray-500 mt-3 text-center">Scheduled</div>
      )}

      {fixture.isDerby && (
        <div className="text-xs text-red-600 dark:text-red-400 mt-2 text-center font-semibold">
          🏆 DERBY MATCH
        </div>
      )}
    </article>
  );
}

