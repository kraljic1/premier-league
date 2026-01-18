"use client";

import { useState, useId } from "react";
import { SeasonSelectionModal } from "./SeasonSelectionModal";

interface SeasonDropdownProps {
  seasons: string[];
  selectedSeason: string | null;
  onSelect: (season: string | null) => void;
  label?: string;
}

export function SeasonDropdown({
  seasons,
  selectedSeason,
  onSelect,
  label = "Select Season",
}: SeasonDropdownProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const buttonId = useId();
  const labelId = `${buttonId}-label`;

  const handleSeasonSelect = (season: string) => {
    onSelect(season);
  };

  return (
    <div className="season-dropdown-container">
      <label id={labelId} className="block text-sm font-medium mb-1">{label}</label>
      <button
        id={buttonId}
        type="button"
        onClick={() => setIsModalOpen(true)}
        className="season-dropdown__button"
        aria-labelledby={labelId}
      >
        <span>{selectedSeason || "Select a season"}</span>
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      <SeasonSelectionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        seasons={seasons}
        selectedSeason={selectedSeason}
        onSelect={handleSeasonSelect}
      />
    </div>
  );
}
