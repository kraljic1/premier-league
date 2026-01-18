import { RefObject } from "react";
import { Fixture } from "@/lib/types";
import { FixturesResultsMatchCard } from "@/components/FixturesResultsMatchCard";

type ClubsMap = Record<string, any>;

interface FixturesResultsListProps {
  groupedByMatchweek: Record<number, Fixture[]>;
  matchweekRefs: RefObject<Record<number, HTMLDivElement | null>>;
  activeTab: "fixtures" | "results";
  clubs: ClubsMap;
}

export function FixturesResultsList({
  groupedByMatchweek,
  matchweekRefs,
  activeTab,
  clubs,
}: FixturesResultsListProps) {
  return (
    <div className="space-y-8">
      {Object.entries(groupedByMatchweek)
        .sort(([a], [b]) =>
          activeTab === "fixtures"
            ? parseInt(a) - parseInt(b)
            : parseInt(b) - parseInt(a)
        )
        .map(([matchweek, matches]) => (
          <div
            key={matchweek}
            className="scroll-mt-20"
            id={`matchweek-${matchweek}`}
            ref={(element) => {
              matchweekRefs.current[parseInt(matchweek)] = element;
            }}
          >
            <h2 className="text-xl sm:text-2xl font-semibold mb-4">
              Matchweek {matchweek}
            </h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {matches
                .filter(
                  (fixture, index, self) =>
                    index ===
                    self.findIndex((item) => item.id === fixture.id)
                )
                .sort(
                  (a, b) =>
                    new Date(a.date).getTime() - new Date(b.date).getTime()
                )
                .map((match) => (
                  <FixturesResultsMatchCard
                    key={match.id}
                    fixture={match}
                    isResult={activeTab === "results"}
                    clubs={clubs}
                  />
                ))}
            </div>
          </div>
        ))}
    </div>
  );
}
