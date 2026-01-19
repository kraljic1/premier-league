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
import { CLUBS, getClubByName } from "@/lib/clubs";
import { Fixture } from "@/lib/types";
import { formatDate, getCurrentMatchweek } from "@/lib/utils";
import { useClubs } from "@/lib/hooks/useClubs";
import { useMatchDayRefetch } from "@/lib/hooks/useMatchDayRefetch";
import { SafeImage } from "@/components/SafeImage";
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

const PREMIER_LEAGUE_COMPETITION = "Premier League";

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

/**
 * Gets fixtures from the current matchweek.
 * Current matchweek is determined by the highest matchweek with finished matches.
 */
function getCurrentMatchweekFixtures(fixtures: Fixture[], currentMatchweek: number): Fixture[] {
  if (currentMatchweek === 0) {
    // No matches finished yet, show matchweek 1
    return fixtures.filter((f) => f.matchweek === 1);
  }
  return fixtures.filter((f) => f.matchweek === currentMatchweek);
}

/**
 * Gets fixtures from the next matchweek.
 */
function getNextMatchweekFixtures(fixtures: Fixture[], currentMatchweek: number): Fixture[] {
  const nextMatchweek = currentMatchweek === 0 ? 2 : currentMatchweek + 1;
  // Cap at 38 (max matchweeks in a season)
  if (nextMatchweek > 38) {
    return [];
  }
  return fixtures.filter((f) => f.matchweek === nextMatchweek);
}

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

  // Calculate current matchweek
  const currentMatchweek = getCurrentMatchweek(premierLeagueFixtures);
  const currentMatchweekFixtures = getCurrentMatchweekFixtures(
    premierLeagueFixtures,
    currentMatchweek
  );
  const nextMatchweekFixtures = getNextMatchweekFixtures(premierLeagueFixtures, currentMatchweek);

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

            {currentMatchweekFixtures.length > 0 && (
              <div className="pl-space-lg">
                <h2 className="pl-heading-md mb-4 goal-underline">
                  Match week {currentMatchweek === 0 ? 1 : currentMatchweek}
                </h2>
                <div className="formation-4-3-3">
                  {currentMatchweekFixtures.map((fixture) => (
                    <FixtureCard key={fixture.id} fixture={fixture} clubs={clubs} />
                  ))}
                </div>
              </div>
            )}

            {nextMatchweekFixtures.length > 0 && (
              <div className="pl-space-lg">
                <h2 className="pl-heading-md mb-4 goal-underline">Next match week</h2>
                <div className="formation-4-3-3">
                  {nextMatchweekFixtures.map((fixture) => (
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

      <div className="fixture-card__teams">
        <div className="fixture-card__team" itemProp="homeTeam" itemScope itemType="https://schema.org/SportsTeam">
          <meta itemProp="name" content={fixture.homeTeam} />
          <div className="fixture-card__logo-wrapper">
            <SafeImage
              src={homeLogoUrl || (Object.values(clubs).find((c: any) => c.name === fixture.homeTeam)?.logoUrl) || ''}
              alt={`${fixture.homeTeam} logo`}
              width={40}
              height={40}
              className="fixture-card__logo"
              loading="lazy"
              unoptimized={Boolean(homeLogoUrl?.endsWith('.svg'))}
            />
          </div>
          <div className="fixture-card__team-name">{fixture.homeTeam}</div>
        </div>
        <span className="fixture-card__vs">vs</span>
        <div className="fixture-card__team" itemProp="awayTeam" itemScope itemType="https://schema.org/SportsTeam">
          <meta itemProp="name" content={fixture.awayTeam} />
          <div className="fixture-card__logo-wrapper">
            <SafeImage
              src={awayLogoUrl || (Object.values(clubs).find((c: any) => c.name === fixture.awayTeam)?.logoUrl) || ''}
              alt={`${fixture.awayTeam} logo`}
              width={40}
              height={40}
              className="fixture-card__logo"
              loading="lazy"
              unoptimized={Boolean(awayLogoUrl?.endsWith('.svg'))}
            />
          </div>
          <div className="fixture-card__team-name">{fixture.awayTeam}</div>
        </div>
      </div>

      <div className="fixture-card__footer">
        {fixture.homeScore !== null && fixture.awayScore !== null ? (
          <div className="match-score text-xl font-bold text-center" itemProp="result">
            <span itemProp="homeTeamScore" className="mr-2">{fixture.homeScore}</span>
            <span className="text-gray-400">-</span>
            <span itemProp="awayTeamScore" className="ml-2">{fixture.awayScore}</span>
          </div>
        ) : (
          <div className="pl-body-sm text-gray-500 text-center">Scheduled</div>
        )}

        {fixture.isDerby && (
          <div className="text-xs text-red-600 dark:text-red-400 mt-2 text-center font-semibold">
            🏆 DERBY MATCH
          </div>
        )}
      </div>
    </article>
  );
}

