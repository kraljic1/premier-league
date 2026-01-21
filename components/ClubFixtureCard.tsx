"use client";

import { Fixture, Club } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { ClubLogo } from "@/components/ClubLogo";
import { useClubs } from "@/lib/hooks/useClubs";
import { findClubEntryByName } from "@/lib/utils/club-name";

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
  // Fetch all clubs in one API call to avoid rate limiting
  const { clubs } = useClubs();
  
  // Get logo URL from clubs object
  const clubEntry = findClubEntryByName(clubs, club);
  const logoUrl = clubEntry?.logoUrlFromDb || null;
  
  return (
    <div className="club-fixture-card">
      <div
        className="club-fixture-card__header"
        style={{
          backgroundColor: clubData?.primaryColor || "#37003c",
        }}
      >
        <h3 className="club-fixture-card__club-name">
          <ClubLogo clubName={club} size={28} logoUrl={logoUrl} context="fixture" />
        </h3>
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
                clubData={clubData}
                clubs={clubs}
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
  clubData: Club | undefined;
  clubs: Record<string, any>;
}

/**
 * Individual match item within a club fixture card.
 */
function MatchItem({ fixture, club, clubData, clubs }: MatchItemProps) {
  const isHome = fixture.homeTeam === club;
  const opponent = isHome ? fixture.awayTeam : fixture.homeTeam;
  const hasScore = fixture.homeScore !== null && fixture.awayScore !== null;
  const primaryColor = clubData?.primaryColor || "#37003c";
  const competition = fixture.competition || "Premier League";
  const isLeagueFixture = competition === "Premier League";
  const roundLabel = fixture.competitionRound || `Round ${fixture.matchweek}`;
  
  // Get logo URL for opponent from clubs object
  const opponentClubEntry = findClubEntryByName(clubs, opponent);
  const opponentLogoUrl = opponentClubEntry?.logoUrlFromDb || null;

  return (
    <div 
      className={`match-item ${isHome ? 'match-item--home' : ''}`}
      style={isHome ? { '--club-primary-color': primaryColor } as React.CSSProperties : undefined}
    >
      <div className="match-item__header">
        <span className="match-item__date">{formatDate(fixture.date)}</span>
        <span className="match-item__meta">
          <span className="match-item__competition">{competition}</span>
          <span className="match-item__matchweek">
            {isLeagueFixture ? `MW ${fixture.matchweek}` : roundLabel}
          </span>
        </span>
      </div>
      <div className="match-item__teams">
        <div className="match-item__team-info">
          {isHome ? (
            <>
              <span className="match-item__vs">vs</span>
              <span className="match-item__opponent">
                <ClubLogo clubName={opponent} size={16} logoUrl={opponentLogoUrl} context="fixture" position={isHome ? "away" : "home"} />
              </span>
              <span className="match-item__venue">(H)</span>
            </>
          ) : (
            <>
              <span className="match-item__vs">@</span>
              <span className="match-item__opponent">
                <ClubLogo clubName={opponent} size={16} logoUrl={opponentLogoUrl} context="fixture" position={isHome ? "away" : "home"} />
              </span>
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
