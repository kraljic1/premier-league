"use client";

import { useState } from "react";
import { Fixture } from "@/lib/types";
import { useClubs } from "@/lib/hooks/useClubs";
import { getClubByName } from "@/lib/clubs";

interface ClubMatchResultsProps {
  fixtures: Fixture[];
  clubName: string;
  maxMatchweek: number;
  seasonLabel: string;
  clubColor?: string;
}

export function ClubMatchResults({
  fixtures,
  clubName,
  maxMatchweek,
  seasonLabel,
  clubColor = "#37003c",
}: ClubMatchResultsProps) {
  const { clubs } = useClubs();
  
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

  // Helper function to get logo URL for a team
  const getTeamLogoUrl = (teamName: string) => {
    const clubEntry = Object.values(clubs).find((c: any) => c.name === teamName);
    const hardcodedClub = getClubByName(teamName);
    return clubEntry?.logoUrlFromDb || clubEntry?.logoUrl || hardcodedClub?.logoUrl || null;
  };

  if (clubFixtures.length === 0) {
    return (
      <div className="club-match-results club-match-results--empty">
        <p>No matches found</p>
      </div>
    );
  }

  return (
    <div 
      className="club-match-results"
      style={{ "--club-highlight-color": clubColor } as React.CSSProperties}
    >
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

              const homeLogoUrl = getTeamLogoUrl(fixture.homeTeam);
              const awayLogoUrl = getTeamLogoUrl(fixture.awayTeam);

              return (
                <tr key={fixture.id} className={isHome ? "" : "club-match-results__row--away"}>
                  <td className="club-match-results__matchweek">{fixture.matchweek}</td>
                  <td className={`club-match-results__team ${isHome ? "club-match-results__team--highlight" : ""}`}>
                    <div className="club-match-results__team-cell">
                      {homeLogoUrl ? (
                        <img
                          src={homeLogoUrl}
                          alt={`${fixture.homeTeam} logo`}
                          className="club-match-results__team-logo"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="club-match-results__team-logo-placeholder">
                          {fixture.homeTeam.charAt(0)}
                        </div>
                      )}
                      <span>{fixture.homeTeam}</span>
                    </div>
                  </td>
                  <td className="club-match-results__score">
                    {fixture.homeScore} - {fixture.awayScore}
                  </td>
                  <td className={`club-match-results__team ${!isHome ? "club-match-results__team--highlight" : ""}`}>
                    <div className="club-match-results__team-cell">
                      {awayLogoUrl ? (
                        <img
                          src={awayLogoUrl}
                          alt={`${fixture.awayTeam} logo`}
                          className="club-match-results__team-logo"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="club-match-results__team-logo-placeholder">
                          {fixture.awayTeam.charAt(0)}
                        </div>
                      )}
                      <span>{fixture.awayTeam}</span>
                    </div>
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
