"use client";

import { Fixture } from "@/lib/types";

interface ClubMatchResultsProps {
  fixtures: Fixture[];
  clubName: string;
  maxMatchweek: number;
  seasonLabel: string;
}

export function ClubMatchResults({
  fixtures,
  clubName,
  maxMatchweek,
  seasonLabel,
}: ClubMatchResultsProps) {
  // Filter fixtures for this club up to maxMatchweek
  const clubFixtures = fixtures
    .filter(
      (f) =>
        (f.homeTeam === clubName || f.awayTeam === clubName) &&
        f.matchweek <= maxMatchweek &&
        f.status === "finished" &&
        f.homeScore !== null &&
        f.awayScore !== null
    )
    .sort((a, b) => a.matchweek - b.matchweek);

  if (clubFixtures.length === 0) {
    return (
      <div className="club-match-results club-match-results--empty">
        <p>No matches found</p>
      </div>
    );
  }

  return (
    <div className="club-match-results">
      <h4 className="club-match-results__title">{seasonLabel} Results</h4>
      <div className="club-match-results__table-container">
        <table className="club-match-results__table">
          <thead>
            <tr>
              <th>MW</th>
              <th>Home</th>
              <th>Score</th>
              <th>Away</th>
              <th>Result</th>
            </tr>
          </thead>
          <tbody>
            {clubFixtures.map((fixture) => {
              const isHome = fixture.homeTeam === clubName;
              const clubScore = isHome ? fixture.homeScore! : fixture.awayScore!;
              const opponentScore = isHome ? fixture.awayScore! : fixture.homeScore!;
              
              let result: "W" | "D" | "L";
              let resultClass = "";
              
              if (clubScore > opponentScore) {
                result = "W";
                resultClass = "club-match-results__result--win";
              } else if (clubScore === opponentScore) {
                result = "D";
                resultClass = "club-match-results__result--draw";
              } else {
                result = "L";
                resultClass = "club-match-results__result--loss";
              }

              return (
                <tr key={fixture.id} className={isHome ? "" : "club-match-results__row--away"}>
                  <td className="club-match-results__matchweek">{fixture.matchweek}</td>
                  <td className={`club-match-results__team ${isHome ? "club-match-results__team--highlight" : ""}`}>
                    {fixture.homeTeam}
                  </td>
                  <td className="club-match-results__score">
                    {fixture.homeScore} - {fixture.awayScore}
                  </td>
                  <td className={`club-match-results__team ${!isHome ? "club-match-results__team--highlight" : ""}`}>
                    {fixture.awayTeam}
                  </td>
                  <td className={`club-match-results__result ${resultClass}`}>
                    {result}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
