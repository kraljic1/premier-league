import { useMemo } from "react";
import { Fixture } from "@/lib/types";
import { FixturesResultsMatchCard } from "@/components/FixturesResultsMatchCard";

type ClubsMap = Record<string, any>;

interface CupFixturesListProps {
  fixtures: Fixture[];
  clubs: ClubsMap;
}

type CupRoundGroup = {
  label: string;
  fixtures: Fixture[];
  earliestDate: number;
};

function getRoundLabel(fixture: Fixture): string {
  if (fixture.competitionRound) {
    return fixture.competitionRound;
  }
  return `Round ${fixture.matchweek}`;
}

export function CupFixturesList({ fixtures, clubs }: CupFixturesListProps) {
  const groupedFixtures = useMemo(() => {
    const groups = new Map<string, CupRoundGroup>();

    fixtures.forEach((fixture) => {
      const label = getRoundLabel(fixture);
      const existing = groups.get(label);
      const matchDate = new Date(fixture.date).getTime();

      if (existing) {
        existing.fixtures.push(fixture);
        existing.earliestDate = Math.min(existing.earliestDate, matchDate);
      } else {
        groups.set(label, {
          label,
          fixtures: [fixture],
          earliestDate: matchDate,
        });
      }
    });

    return Array.from(groups.values()).sort(
      (a, b) => a.earliestDate - b.earliestDate
    );
  }, [fixtures]);

  return (
    <div className="cup-fixtures-list space-y-8">
      {groupedFixtures.map((group) => (
        <div key={group.label}>
          <h2 className="cup-fixtures-list__title">{group.label}</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {group.fixtures
              .filter(
                (fixture, index, self) =>
                  index === self.findIndex((item) => item.id === fixture.id)
              )
              .sort(
                (a, b) =>
                  new Date(a.date).getTime() - new Date(b.date).getTime()
              )
              .map((match) => (
                <FixturesResultsMatchCard
                  key={match.id}
                  fixture={match}
                  isResult={false}
                  clubs={clubs}
                />
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}
