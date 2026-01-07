"use client";

import { Fixture, Club } from "@/lib/types";
import { formatDate } from "@/lib/utils";

interface ClubFixtureCardProps {
  club: string;
  clubData: Club | undefined;
  fixtures: Fixture[];
}

/**
 * Card component displaying future fixtures for a specific club.
 * Styled to match Premier League design aesthetics.
 */
export function ClubFixtureCard({ club, clubData, fixtures }: ClubFixtureCardProps) {
  return (
    <div className="club-fixture-card">
      <div
        className="club-fixture-card__header"
        style={{
          backgroundColor: clubData?.primaryColor || "#37003c",
        }}
      >
        <h3 className="club-fixture-card__club-name">{club}</h3>
      </div>
      <div className="club-fixture-card__content">
        {fixtures.length === 0 ? (
          <div className="club-fixture-card__empty">No fixtures found</div>
        ) : (
          <div className="club-fixture-card__matches">
            {fixtures.map((fixture: Fixture) => (
              <MatchItem
                key={fixture.id}
                fixture={fixture}
                club={club}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface MatchItemProps {
  fixture: Fixture;
  club: string;
}

/**
 * Individual match item within a club fixture card.
 */
function MatchItem({ fixture, club }: MatchItemProps) {
  const isHome = fixture.homeTeam === club;
  const opponent = isHome ? fixture.awayTeam : fixture.homeTeam;
  const hasScore = fixture.homeScore !== null && fixture.awayScore !== null;

  return (
    <div className="match-item">
      <div className="match-item__header">
        <span className="match-item__date">{formatDate(fixture.date)}</span>
        <span className="match-item__matchweek">MW {fixture.matchweek}</span>
      </div>
      <div className="match-item__teams">
        <div className="match-item__team-info">
          {isHome ? (
            <>
              <span className="match-item__vs">vs</span>
              <span className="match-item__opponent">{opponent}</span>
              <span className="match-item__venue">(H)</span>
            </>
          ) : (
            <>
              <span className="match-item__vs">@</span>
              <span className="match-item__opponent">{opponent}</span>
              <span className="match-item__venue">(A)</span>
            </>
          )}
        </div>
        {hasScore && (
          <div className="match-item__score">
            {isHome
              ? `${fixture.homeScore} - ${fixture.awayScore}`
              : `${fixture.awayScore} - ${fixture.homeScore}`}
          </div>
        )}
      </div>
    </div>
  );
}
