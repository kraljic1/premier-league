import { useState } from "react";
import { Fixture } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { getClubByName } from "@/lib/clubs";
import { findClubEntryByName } from "@/lib/utils/club-name";

type ClubsMap = Record<string, any>;

interface FixturesResultsMatchCardProps {
  fixture: Fixture;
  isResult: boolean;
  clubs: ClubsMap;
}

export function FixturesResultsMatchCard({
  fixture,
  isResult,
  clubs,
}: FixturesResultsMatchCardProps) {
  const [homeImageError, setHomeImageError] = useState(false);
  const [awayImageError, setAwayImageError] = useState(false);

  const hasScore = fixture.homeScore !== null && fixture.awayScore !== null;

  // Get logo URLs with proper fallback chain
  const homeClubEntry = findClubEntryByName(clubs, fixture.homeTeam);
  const awayClubEntry = findClubEntryByName(clubs, fixture.awayTeam);
  const homeHardcodedClub = getClubByName(fixture.homeTeam);
  const awayHardcodedClub = getClubByName(fixture.awayTeam);

  const homeLogoUrl =
    homeClubEntry?.logoUrlFromDb ||
    homeClubEntry?.logoUrl ||
    homeHardcodedClub?.logoUrl ||
    null;
  const awayLogoUrl =
    awayClubEntry?.logoUrlFromDb ||
    awayClubEntry?.logoUrl ||
    awayHardcodedClub?.logoUrl ||
    null;

  return (
    <div
      className={`match-card p-4 ${
        fixture.isDerby
          ? "border-red-500 bg-red-50 dark:bg-red-900/20"
          : isResult
          ? "border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50"
          : ""
      }`}
    >
      <div className="text-sm text-gray-600 dark:text-gray-400">
        {formatDate(fixture.date)}
      </div>
      <div className="fixture-card__teams">
        <div className="fixture-card__team">
          <div className="fixture-card__logo-wrapper">
            {homeLogoUrl && !homeImageError ? (
              <img
                src={homeLogoUrl}
                alt={`${fixture.homeTeam} logo`}
                width={40}
                height={40}
                className="fixture-card__logo"
                loading="lazy"
                onError={() => setHomeImageError(true)}
              />
            ) : (
              <div className="fixture-card__logo-placeholder">
                {fixture.homeTeam.charAt(0)}
              </div>
            )}
          </div>
          <div className="fixture-card__team-name">{fixture.homeTeam}</div>
        </div>
        <span className="fixture-card__vs">vs</span>
        <div className="fixture-card__team">
          <div className="fixture-card__logo-wrapper">
            {awayLogoUrl && !awayImageError ? (
              <img
                src={awayLogoUrl}
                alt={`${fixture.awayTeam} logo`}
                width={40}
                height={40}
                className="fixture-card__logo"
                loading="lazy"
                onError={() => setAwayImageError(true)}
              />
            ) : (
              <div className="fixture-card__logo-placeholder">
                {fixture.awayTeam.charAt(0)}
              </div>
            )}
          </div>
          <div className="fixture-card__team-name">{fixture.awayTeam}</div>
        </div>
      </div>
      {hasScore ? (
        <div
          className={`text-lg font-bold mt-2 ${
            isResult ? "text-gray-900 dark:text-gray-100" : ""
          }`}
        >
          {fixture.homeScore} - {fixture.awayScore}
          {isResult && (
            <span className="text-xs text-gray-500 dark:text-gray-400 ml-2 font-normal">
              FT
            </span>
          )}
        </div>
      ) : (
        <div className="text-sm text-gray-500 mt-2">
          {fixture.status === "live" ? (
            <span className="text-red-600 dark:text-red-400 font-semibold">
              LIVE
            </span>
          ) : (
            "Scheduled"
          )}
        </div>
      )}
      {fixture.isDerby && (
        <div className="text-xs text-red-600 dark:text-red-400 mt-1">
          🏆 Derby Match
        </div>
      )}
    </div>
  );
}
