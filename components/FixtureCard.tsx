"use client";

import { Fixture } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { SafeImage } from "@/components/SafeImage";
import { findClubEntryByName } from "@/lib/utils/club-name";

type FixtureCardProps = {
  fixture: Fixture;
  clubs: Record<string, any>;
};

export function FixtureCard({ fixture, clubs }: FixtureCardProps) {
  // Get logo URLs from clubs object
  const homeClubEntry = findClubEntryByName(clubs, fixture.homeTeam);
  const awayClubEntry = findClubEntryByName(clubs, fixture.awayTeam);
  const homeLogoUrl = homeClubEntry?.logoUrlFromDb || null;
  const awayLogoUrl = awayClubEntry?.logoUrlFromDb || null;

  // Determine match status
  const now = new Date();
  const matchDate = new Date(fixture.date);
  const hasScore = fixture.homeScore !== null && fixture.awayScore !== null;

  let statusClass = "status-scheduled";
  if (hasScore) {
    statusClass = "status-finished";
  } else if (matchDate <= now) {
    statusClass = "status-live";
  }

  return (
    <article
      className={`match-card p-4 ${
        fixture.isDerby
          ? "border-red-500 bg-red-50 dark:bg-red-900/20"
          : ""
      }`}
      itemScope
      itemType="https://schema.org/SportsEvent"
    >
      <div className="flex justify-between items-start mb-2">
        <time
          className="pl-caption"
          dateTime={fixture.date}
          itemProp="startDate"
        >
          {formatDate(fixture.date)}
        </time>
        <span className={`status-badge ${statusClass}`}>
          {hasScore ? "FT" : matchDate <= now ? "LIVE" : "SCHEDULED"}
        </span>
      </div>

      <div className="fixture-card__teams">
        <div
          className="fixture-card__team"
          itemProp="homeTeam"
          itemScope
          itemType="https://schema.org/SportsTeam"
        >
          <meta itemProp="name" content={fixture.homeTeam} />
          <div className="fixture-card__logo-wrapper">
            <SafeImage
              src={homeLogoUrl || homeClubEntry?.logoUrl || ""}
              alt={`${fixture.homeTeam} logo`}
              width={40}
              height={40}
              className="fixture-card__logo"
              loading="lazy"
              unoptimized={Boolean(homeLogoUrl?.endsWith(".svg"))}
            />
          </div>
          <div className="fixture-card__team-name">{fixture.homeTeam}</div>
        </div>
        <span className="fixture-card__vs">vs</span>
        <div
          className="fixture-card__team"
          itemProp="awayTeam"
          itemScope
          itemType="https://schema.org/SportsTeam"
        >
          <meta itemProp="name" content={fixture.awayTeam} />
          <div className="fixture-card__logo-wrapper">
            <SafeImage
              src={awayLogoUrl || awayClubEntry?.logoUrl || ""}
              alt={`${fixture.awayTeam} logo`}
              width={40}
              height={40}
              className="fixture-card__logo"
              loading="lazy"
              unoptimized={Boolean(awayLogoUrl?.endsWith(".svg"))}
            />
          </div>
          <div className="fixture-card__team-name">{fixture.awayTeam}</div>
        </div>
      </div>

      <div className="fixture-card__footer">
        {fixture.homeScore !== null && fixture.awayScore !== null ? (
          <div
            className="match-score text-xl font-bold text-center"
            itemProp="result"
          >
            <span itemProp="homeTeamScore" className="mr-2">
              {fixture.homeScore}
            </span>
            <span className="text-gray-400">-</span>
            <span itemProp="awayTeamScore" className="ml-2">
              {fixture.awayScore}
            </span>
          </div>
        ) : (
          <div className="pl-body-sm text-gray-500 text-center">Scheduled</div>
        )}

        {fixture.isDerby && (
          <div className="text-xs text-red-600 dark:text-red-400 mt-2 text-center font-semibold">
            🏆 DERBY MATCH
          </div>
        )}
      </div>
    </article>
  );
}
