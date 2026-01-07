"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { RefreshButton } from "@/components/RefreshButton";
import { LoadingSkeleton } from "@/components/LoadingSkeleton";
import { ErrorDisplay } from "@/components/ErrorDisplay";
import { EmptyState } from "@/components/EmptyState";
import { FutureMatchesFilter } from "@/components/FutureMatchesFilter";
import { ClubFixtureCard } from "@/components/ClubFixtureCard";
import { useAppStore } from "@/lib/store";
import { CLUBS, getClubByName } from "@/lib/clubs";
import { Fixture, Club } from "@/lib/types";
import { getCurrentMatchweek } from "@/lib/utils";

type ClubFixtureData = {
  club: string;
  clubData: Club | undefined;
  fixtures: Fixture[];
};

async function fetchFixtures(): Promise<Fixture[]> {
  const res = await fetch("/api/fixtures", {
    next: { revalidate: 1800 }, // Revalidate every 30 minutes
  });
  if (!res.ok) throw new Error("Failed to fetch fixtures");
  return res.json();
}

/**
 * Filters fixtures to only include future matches.
 */
function getFutureFixtures(fixtures: Fixture[], limit: number | null): Fixture[] {
  const now = new Date();
  const futureFixtures = fixtures
    .filter((f: Fixture) => new Date(f.date) > now)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  if (limit === null) {
    return futureFixtures;
  }
  return futureFixtures.slice(0, limit);
}

export default function ComparePage() {
  const { myClubs } = useAppStore();
  const [futureMatchesCount, setFutureMatchesCount] = useState<number | null>(5);
  
  const {
    data: fixtures = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["fixtures"],
    queryFn: fetchFixtures,
  });

  const clubNames = myClubs
    .map((id: string) => CLUBS[id]?.name)
    .filter((name): name is string => Boolean(name));

  // Determine current matchweek from finished matches
  const currentMatchweek = getCurrentMatchweek(fixtures);
  
  // Log for debugging
  if (currentMatchweek > 0) {
    const finishedCount = fixtures.filter(f => f.status === "finished").length;
    console.log(`[Compare] Current matchweek: ${currentMatchweek}, Finished matches: ${finishedCount}`);
  }

  const clubFixtures: ClubFixtureData[] = clubNames.map((clubName: string) => {
    const clubAllFixtures = fixtures.filter(
      (f: Fixture) => f.homeTeam === clubName || f.awayTeam === clubName
    );
    const futureFixtures = getFutureFixtures(clubAllFixtures, futureMatchesCount);
    
    // Ensure matchweek numbers are correct - they should already be in fixture data
    // but we validate them here
    const validatedFixtures = futureFixtures.map(fixture => {
      // Matchweek should already be correct from scraper
      // If it's less than current matchweek, something is wrong
      if (currentMatchweek > 0 && fixture.matchweek < currentMatchweek) {
        console.warn(`[Compare] Matchweek mismatch for ${fixture.homeTeam} vs ${fixture.awayTeam}: fixture has MW ${fixture.matchweek}, but current is MW ${currentMatchweek}`);
      }
      return fixture;
    });
    
    return {
      club: clubName,
      clubData: getClubByName(clubName),
      fixtures: validatedFixtures,
    };
  });

  return (
    <div className="compare-page">
      <div className="compare-page__header">
        <h1 className="compare-page__title">Compare Clubs</h1>
        <RefreshButton />
      </div>
      
      {clubNames.length > 0 && !isLoading && !error && (
        <FutureMatchesFilter
          selectedCount={futureMatchesCount}
          onSelect={setFutureMatchesCount}
        />
      )}

      {clubNames.length === 0 ? (
        <EmptyState
          title="No Clubs Selected"
          message="Add clubs from the Home page to compare schedules"
        />
      ) : isLoading ? (
        <LoadingSkeleton />
      ) : error ? (
        <ErrorDisplay
          message="Failed to load fixtures. The scraper may need updating."
          onRetry={() => refetch()}
        />
      ) : (
        <div className="compare-page__grid">
          {clubFixtures.map(({ club, clubData, fixtures }: ClubFixtureData) => (
            <ClubFixtureCard
              key={club}
              club={club}
              clubData={clubData}
              fixtures={fixtures}
            />
          ))}
        </div>
      )}
    </div>
  );
}

