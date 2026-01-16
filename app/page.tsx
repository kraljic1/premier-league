"use client";

import { useQuery } from "@tanstack/react-query";
import dynamic from "next/dynamic";
import { RefreshButton } from "@/components/RefreshButton";
import { LoadingSkeleton } from "@/components/LoadingSkeleton";
import { ErrorDisplay } from "@/components/ErrorDisplay";
import { EmptyState } from "@/components/EmptyState";
import { useAppStore } from "@/lib/store";
import { CLUBS, getClubByName } from "@/lib/clubs";
import { Fixture } from "@/lib/types";
import { formatDate } from "@/lib/utils";

// Dynamically import heavy components for better code splitting
const MatchCountdown = dynamic(() => import("@/components/MatchCountdown").then(mod => ({ default: mod.MatchCountdown })), {
  loading: () => <div className="animate-pulse h-32 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
});

const ClubSelector = dynamic(() => import("@/components/ClubSelector").then(mod => ({ default: mod.ClubSelector })), {
  loading: () => <div className="animate-pulse h-48 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
});

const ClubLogo = dynamic(() => import("@/components/ClubLogo").then(mod => ({ default: mod.ClubLogo })), {
  loading: () => <div className="w-5 h-5 bg-gray-200 dark:bg-gray-700 rounded"></div>
});

async function fetchFixtures(): Promise<Fixture[]> {
  const res = await fetch("/api/fixtures", {
    next: { revalidate: 1800 }, // Revalidate every 30 minutes
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
  const { myClubs } = useAppStore();
  const {
    data: fixtures = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["fixtures"],
    queryFn: fetchFixtures,
  });

  const nextMatch = getNextMatch(fixtures, myClubs);
  const todayFixtures = getTodayFixtures(fixtures);
  const weekendFixtures = getWeekendFixtures(fixtures);

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Home</h1>
        <RefreshButton />
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
          message="Fixtures data is not available. This may be because the 2025/26 season hasn't started yet, or the scraper needs to be updated with the correct CSS selectors."
        />
      ) : (
        <>
          {nextMatch && (
            <div>
              <h2 className="text-2xl font-semibold mb-4">Next Match</h2>
              <MatchCountdown fixture={nextMatch} />
            </div>
          )}

          <div>
            <h2 className="text-2xl font-semibold mb-4">My Clubs</h2>
            <ClubSelector />
          </div>

          {todayFixtures.length > 0 && (
            <div>
              <h2 className="text-2xl font-semibold mb-4">Today&apos;s Fixtures</h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {todayFixtures.map((fixture) => (
                  <FixtureCard key={fixture.id} fixture={fixture} />
                ))}
              </div>
            </div>
          )}

          {weekendFixtures.length > 0 && (
            <div>
              <h2 className="text-2xl font-semibold mb-4">Weekend Fixtures</h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {weekendFixtures.map((fixture) => (
                  <FixtureCard key={fixture.id} fixture={fixture} />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function FixtureCard({ fixture }: { fixture: Fixture }) {
  const club = getClubByName(fixture.homeTeam);
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
      <div className="mt-2 font-semibold flex items-center gap-2 flex-wrap">
        <ClubLogo clubName={fixture.homeTeam} size={20} />
        <span>vs</span>
        <ClubLogo clubName={fixture.awayTeam} size={20} />
      </div>
      {fixture.homeScore !== null && fixture.awayScore !== null ? (
        <div className="text-lg font-bold mt-2">
          {fixture.homeScore} - {fixture.awayScore}
        </div>
      ) : (
        <div className="text-sm text-gray-500 mt-2">Scheduled</div>
      )}
      {fixture.isDerby && (
        <div className="text-xs text-red-600 dark:text-red-400 mt-1">
          🏆 Derby Match
        </div>
      )}
    </div>
  );
}

