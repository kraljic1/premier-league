"use client";

import { Fixture } from "@/lib/types";
import { FixtureCard } from "@/components/FixtureCard";

type MatchweekSectionProps = {
  title: string;
  fixtures: Fixture[];
  clubs: Record<string, any>;
};

export function MatchweekSection({ title, fixtures, clubs }: MatchweekSectionProps) {
  if (fixtures.length === 0) {
    return null;
  }

  return (
    <div className="pl-space-lg">
      <h2 className="pl-heading-md mb-4 goal-underline">{title}</h2>
      <div className="formation-4-3-3">
        {fixtures.map((fixture) => (
          <FixtureCard key={fixture.id} fixture={fixture} clubs={clubs} />
        ))}
      </div>
    </div>
  );
}
