"use client";

import { ClubDropdown } from "./ClubDropdown";
import { SeasonDropdown } from "./SeasonDropdown";

interface ComparisonControlsProps {
  clubA: string | null;
  setClubA: (club: string | null) => void;
  clubB: string | null;
  setClubB: (club: string | null) => void;
  selectedSeason: string | null;
  availableSeasons: string[];
  onSeasonChange: (season: string | null) => void;
}

export function ComparisonControls({
  clubA,
  setClubA,
  clubB,
  setClubB,
  selectedSeason,
  availableSeasons,
  onSeasonChange,
}: ComparisonControlsProps) {
  return (
    <div className="two-clubs-comparison__controls">
      <div className="two-clubs-comparison__clubs">
        <ClubDropdown
          selectedClub={clubA}
          onSelect={setClubA}
          label="Club A"
        />
        <div className="two-clubs-comparison__vs">vs</div>
        <ClubDropdown
          selectedClub={clubB}
          onSelect={setClubB}
          label="Club B"
        />
      </div>
      <div className="two-clubs-comparison__season">
        <SeasonDropdown
          seasons={availableSeasons}
          selectedSeason={selectedSeason}
          onSelect={onSeasonChange}
          label="Select Season"
        />
      </div>
    </div>
  );
}