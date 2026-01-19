"use client";
import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { RefreshButton } from "@/components/RefreshButton";
import { LoadingSkeleton } from "@/components/LoadingSkeleton";
import { ErrorDisplay } from "@/components/ErrorDisplay";
import { EmptyState } from "@/components/EmptyState";
import { FutureMatchesFilter } from "@/components/FutureMatchesFilter";
import { type CompetitionOption } from "@/components/CompetitionFilter";
import { CompetitionVisibilityFilter } from "@/components/CompetitionVisibilityFilter";
import { ClubFixtureCard } from "@/components/ClubFixtureCard";
import { HelpButton } from "@/components/HelpButton";
import { useAppStore } from "@/lib/store";
import { CLUBS, getClubByName } from "@/lib/clubs";
import { Fixture, Club } from "@/lib/types";
import { getCurrentMatchweek } from "@/lib/utils";
import { getHelpContent } from "@/lib/help-content";
import {
  fetchFixtures,
  getAvailableCompetitionValues,
  getFutureFixtures
} from "@/lib/compare-fixtures-utils";

type ClubFixtureData = {
  club: string;
  clubData: Club | undefined;
  fixtures: Fixture[];
};

const COMPETITION_OPTIONS: CompetitionOption[] = [
  { id: "fa-cup", label: "FA Cup", value: "FA Cup" },
  { id: "carabao-cup", label: "Carabao Cup", value: "Carabao Cup" },
  { id: "champions-league", label: "UEFA Champions League", value: "UEFA Champions League" },
  { id: "europa-league", label: "UEFA Europa League", value: "UEFA Europa League" },
  { id: "conference-league", label: "UEFA Conference League", value: "UEFA Conference League" }
];

const ALL_COMPETITIONS = ["Premier League", ...COMPETITION_OPTIONS.map((option) => option.value)];

export default function ComparePage() {
  const [mounted, setMounted] = useState(false);
  const myClubs = useAppStore((state) => state.myClubs);
  const [futureMatchesCount, setFutureMatchesCount] = useState<number | null>(5);
  const [excludedCompetitions, setExcludedCompetitions] = useState<string[]>([]);

  useEffect(() => {
    setMounted(true);
  }, []);

  const safeMyClubs = useMemo(() => mounted ? myClubs : [], [mounted, myClubs]);

  const handleFutureMatchesCountChange = (count: number | null) => {
    console.log("[ComparePage] Updating futureMatchesCount to:", count);
    setFutureMatchesCount(count);
  };

  const {
    data: fixtures = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["fixtures", "compare-fixtures"],
    queryFn: () => fetchFixtures(ALL_COMPETITIONS),
  });

  const clubNames = useMemo(() => {
    return safeMyClubs
      .map((id: string) => CLUBS[id]?.name)
      .filter((name): name is string => Boolean(name));
  }, [safeMyClubs]);

  const leagueFixtures = useMemo(
    () => fixtures.filter((fixture) => (fixture.competition || "Premier League") === "Premier League"),
    [fixtures]
  );

  const availableCompetitionValues = useMemo(
    () => getAvailableCompetitionValues(fixtures, clubNames),
    [fixtures, clubNames]
  );

  const availableCompetitionOptions = useMemo(
    () => COMPETITION_OPTIONS.filter((option) => availableCompetitionValues.includes(option.value)),
    [availableCompetitionValues]
  );

  useEffect(() => {
    setExcludedCompetitions((prev) =>
      prev.filter((value) => availableCompetitionValues.includes(value))
    );
  }, [availableCompetitionValues]);

  const includedCompetitions = useMemo(
    () =>
      availableCompetitionOptions
        .map((option) => option.value)
        .filter((value) => !excludedCompetitions.includes(value)),
    [availableCompetitionOptions, excludedCompetitions]
  );

  const competitionsToInclude = useMemo(
    () => ["Premier League", ...includedCompetitions],
    [includedCompetitions]
  );

  const filteredFixtures = useMemo(() => {
    const competitionSet = new Set(competitionsToInclude);
    return fixtures.filter((fixture) => competitionSet.has(fixture.competition || "Premier League"));
  }, [fixtures, competitionsToInclude]);

  const currentMatchweek = useMemo(() => getCurrentMatchweek(leagueFixtures), [leagueFixtures]);

  useEffect(() => {
    if (currentMatchweek > 0) {
      const finishedCount = fixtures.filter(f => f.status === "finished").length;
      console.log(`[Compare] Current matchweek: ${currentMatchweek}, Finished matches: ${finishedCount}`);
    }
  }, [currentMatchweek, fixtures]);

  const clubFixtures: ClubFixtureData[] = useMemo(() => {
    console.log(`[ComparePage] Recalculating clubFixtures with limit: ${futureMatchesCount}`);

    return clubNames.map((clubName: string) => {
      const clubAllFixtures = filteredFixtures.filter(
        (f: Fixture) => f.homeTeam === clubName || f.awayTeam === clubName
      );

      const futureFixtures = getFutureFixtures(clubAllFixtures, futureMatchesCount);
      console.log(`[ComparePage] Club: ${clubName}, All fixtures: ${clubAllFixtures.length}, Future fixtures: ${futureFixtures.length}, Limit: ${futureMatchesCount}`);

      const validatedFixtures = futureFixtures.map(fixture => {
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
  }, [clubNames, filteredFixtures, futureMatchesCount, currentMatchweek]);

  return (
    <div className="compare-page">
      <div className="compare-page__header">
        <h1 className="compare-page__title text-2xl sm:text-3xl">Compare Fixtures</h1>
        <div className="flex items-center gap-2">
          <HelpButton {...getHelpContent('compareFixtures')} />
          <RefreshButton />
        </div>
      </div>

      {clubNames.length > 0 && !isLoading && !error && (
        <div className="compare-page__filters">
          <FutureMatchesFilter
            selectedCount={futureMatchesCount}
            onSelect={handleFutureMatchesCountChange}
          />
          {availableCompetitionOptions.length > 0 && (
            <CompetitionVisibilityFilter
              options={availableCompetitionOptions}
              excluded={excludedCompetitions}
              onChange={setExcludedCompetitions}
            />
          )}
        </div>
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
