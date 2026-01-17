"use client";

import { memo } from "react";
import { Fixture } from "@/lib/types";
import { HeadToHeadSummary } from "@/lib/utils/head-to-head-utils";

interface HeadToHeadMatchProps {
  match: Fixture;
}

function HeadToHeadMatch({ match }: HeadToHeadMatchProps) {
  return (
    <div className="head-to-head__match">
      <span className="head-to-head__matchweek">MW {match.matchweek}</span>
      <span className="head-to-head__team">{match.homeTeam}</span>
      <span className="head-to-head__score">
        {match.homeScore} - {match.awayScore}
      </span>
      <span className="head-to-head__team">{match.awayTeam}</span>
    </div>
  );
}

interface HeadToHeadSectionProps {
  clubA: string;
  clubB: string;
  matches: Fixture[];
  summary: HeadToHeadSummary | null;
}

export const HeadToHeadSection = memo(function HeadToHeadSection({
  clubA,
  clubB,
  matches,
  summary,
}: HeadToHeadSectionProps) {
  return (
    <div className="head-to-head">
      <h3 className="head-to-head__title">Head-to-Head</h3>
      {matches.length === 0 ? (
        <p className="head-to-head__no-matches">
          No head-to-head matches in this season
        </p>
      ) : (
        <>
          {summary && (
            <div className="head-to-head__summary">
              <div className="head-to-head__summary-item">
                <span className="head-to-head__summary-club">{clubA}</span>
                <span className="head-to-head__summary-value">
                  {summary.clubAWins} wins
                </span>
              </div>
              <div className="head-to-head__summary-item head-to-head__summary-item--draws">
                <span className="head-to-head__summary-value">
                  {summary.draws} draws
                </span>
              </div>
              <div className="head-to-head__summary-item">
                <span className="head-to-head__summary-club">{clubB}</span>
                <span className="head-to-head__summary-value">
                  {summary.clubBWins} wins
                </span>
              </div>
            </div>
          )}

          <div className="head-to-head__matches">
            {matches.map((match) => (
              <HeadToHeadMatch key={match.id} match={match} />
            ))}
          </div>
        </>
      )}
    </div>
  );
});
