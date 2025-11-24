"use client";

import { useState } from "react";
import { Fixture } from "@/lib/types";
import { createEvents } from "ics";

interface AddToCalendarButtonProps {
  fixtures: Fixture[];
  clubNames: string[];
}

export function AddToCalendarButton({
  fixtures,
  clubNames,
}: AddToCalendarButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleExport = async () => {
    setIsGenerating(true);
    try {
      const events = fixtures
        .filter(
          (f) =>
            clubNames.includes(f.homeTeam) || clubNames.includes(f.awayTeam)
        )
        .map((fixture) => {
          const date = new Date(fixture.date);
          return {
            title: `${fixture.homeTeam} vs ${fixture.awayTeam}`,
            description: `Premier League Matchweek ${fixture.matchweek}`,
            start: [
              date.getFullYear(),
              date.getMonth() + 1,
              date.getDate(),
              date.getHours(),
              date.getMinutes(),
            ] as [number, number, number, number, number],
            duration: { hours: 2 },
            location: fixture.homeTeam,
          };
        });

      const { error, value } = createEvents(events);
      if (error) {
        console.error(error);
        return;
      }

      if (value) {
        const blob = new Blob([value], { type: "text/calendar" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "premier-league-matches.ics";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error("Error generating calendar:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={isGenerating || fixtures.length === 0}
      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
    >
      {isGenerating ? "Generating..." : "Add to Calendar"}
    </button>
  );
}

