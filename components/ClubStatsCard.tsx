"use client";

import { SeasonStatsCompact } from "./SeasonStatsCompact";
import { getClubByName } from "@/lib/clubs";
import { useClubs } from "@/lib/hooks/useClubs";

interface ClubStatsCardProps {
  clubName: string;
  stats: any;
  season: string | null;
}

export function ClubStatsCard({ clubName, stats, season }: ClubStatsCardProps) {
  const { clubs } = useClubs();

  // Get logo URL for club
  const clubEntry = Object.values(clubs).find((c: any) => c.name === clubName);
  const hardcodedClub = getClubByName(clubName);
  const logoUrl = clubEntry?.logoUrlFromDb || clubEntry?.logoUrl || hardcodedClub?.logoUrl || null;

  return (
    <div className="two-clubs-comparison__club-stats">
      <div className="two-clubs-comparison__club-header">
        {logoUrl ? (
          <img
            src={logoUrl}
            alt={`${clubName} logo`}
            className="two-clubs-comparison__club-logo"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        ) : (
          <div className="two-clubs-comparison__club-logo-placeholder">
            {clubName.charAt(0)}
          </div>
        )}
        <h3 className="two-clubs-comparison__club-name">{clubName}</h3>
      </div>
      {stats ? (
        <SeasonStatsCompact stats={stats} title={`${season}`} />
      ) : (
        <div className="two-clubs-comparison__no-stats">No stats available</div>
      )}
    </div>
  );
}
