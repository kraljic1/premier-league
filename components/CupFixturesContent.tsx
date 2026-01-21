"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { CompetitionDefinition } from "@/lib/competition-sources";
import { Fixture } from "@/lib/types";
import { useClubs } from "@/lib/hooks/useClubs";
import { LoadingSkeleton } from "@/components/LoadingSkeleton";
import { ErrorDisplay } from "@/components/ErrorDisplay";
import { EmptyState } from "@/components/EmptyState";
import { CupFixturesList } from "@/components/CupFixturesList";

interface CupFixturesContentProps {
  competition: CompetitionDefinition;
}

async function fetchCompetitionFixtures(
  competition: CompetitionDefinition
): Promise<Fixture[]> {
  const params = new URLSearchParams();
  params.set("competitions", competition.value);
  const res = await fetch(`/api/fixtures?${params.toString()}`, {
    next: { revalidate: 1800 },
  });
  if (!res.ok) {
    throw new Error("Failed to fetch fixtures");
  }
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

export function CupFixturesContent({ competition }: CupFixturesContentProps) {
  const { clubs } = useClubs();

  const {
    data: fixtures = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["fixtures", "cup", competition.value],
    queryFn: () => fetchCompetitionFixtures(competition),
  });

  const competitionFixtures = useMemo(
    () =>
      fixtures.filter(
        (fixture) =>
          (fixture.competition || "Premier League") === competition.value
      ),
    [fixtures, competition.value]
  );

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return (
      <ErrorDisplay
        message="Failed to load fixtures. The scraper may need updating."
        onRetry={() => refetch()}
      />
    );
  }

  if (competitionFixtures.length === 0) {
    return (
      <EmptyState
        title="No fixtures available"
        message="No fixtures are available for this competition yet."
      />
    );
  }

  return <CupFixturesList fixtures={competitionFixtures} clubs={clubs} />;
}
