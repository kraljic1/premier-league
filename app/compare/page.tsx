"use client";

import { useQuery } from "@tanstack/react-query";
import { RefreshButton } from "@/components/RefreshButton";
import { LoadingSkeleton } from "@/components/LoadingSkeleton";
import { ErrorDisplay } from "@/components/ErrorDisplay";
import { EmptyState } from "@/components/EmptyState";
import { useAppStore } from "@/lib/store";
import { CLUBS, getClubByName } from "@/lib/clubs";
import { Fixture, Club } from "@/lib/types";
import { formatDate } from "@/lib/utils";

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

export default function ComparePage() {
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

  const clubNames = myClubs
    .map((id: string) => CLUBS[id]?.name)
    .filter((name): name is string => Boolean(name));

  const clubFixtures: ClubFixtureData[] = clubNames.map((clubName: string) => ({
    club: clubName,
    clubData: getClubByName(clubName),
    fixtures: fixtures.filter(
      (f: Fixture) => f.homeTeam === clubName || f.awayTeam === clubName
    ),
  }));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Compare Clubs</h1>
        <RefreshButton />
      </div>

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
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {clubFixtures.map(({ club, clubData, fixtures }: ClubFixtureData) => (
            <div
              key={club}
              className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
            >
              <div
                className="p-4 text-white font-semibold"
                style={{
                  backgroundColor: clubData?.primaryColor || "#000",
                }}
              >
                {club}
              </div>
              <div className="p-4 space-y-3">
                {fixtures.length === 0 ? (
                  <div className="text-sm text-gray-500">No fixtures found</div>
                ) : (
                  fixtures.map((fixture: Fixture) => (
                    <div
                      key={fixture.id}
                      className="text-sm border-b border-gray-200 dark:border-gray-700 pb-2"
                    >
                      <div className="font-medium">
                        {fixture.homeTeam === club ? (
                          <>
                            <span className="font-bold">vs {fixture.awayTeam}</span>
                            <span className="text-gray-500 ml-2">(H)</span>
                          </>
                        ) : (
                          <>
                            <span className="font-bold">@ {fixture.homeTeam}</span>
                            <span className="text-gray-500 ml-2">(A)</span>
                          </>
                        )}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        {formatDate(fixture.date)} - MW {fixture.matchweek}
                      </div>
                      {fixture.homeScore !== null &&
                        fixture.awayScore !== null && (
                          <div className="text-xs font-semibold mt-1">
                            {fixture.homeTeam === club
                              ? `${fixture.homeScore} - ${fixture.awayScore}`
                              : `${fixture.awayScore} - ${fixture.homeScore}`}
                          </div>
                        )}
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

