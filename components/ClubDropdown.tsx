"use client";

import { useState, useId } from "react";
import { CLUBS, getClubByName } from "@/lib/clubs";
import { useClubs } from "@/lib/hooks/useClubs";
import { SafeImage } from "./SafeImage";
import { ClubSelectionModal } from "./ClubSelectionModal";

interface ClubDropdownProps {
  selectedClub: string | null;
  onSelect: (clubName: string | null) => void;
  label?: string;
}

export function ClubDropdown({
  selectedClub,
  onSelect,
  label = "Select Club",
}: ClubDropdownProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { clubs } = useClubs();
  const buttonId = useId();
  const labelId = `${buttonId}-label`;

  const selectedClubData = selectedClub
    ? getClubByName(selectedClub)
    : null;
  
  const selectedClubWithLogo = selectedClub
    ? Object.values(clubs).find((c) => c.name === selectedClub)
    : null;
  
  const logoUrl = selectedClubWithLogo?.logoUrlFromDb || 
                  selectedClubWithLogo?.logoUrl || 
                  selectedClubData?.logoUrl;

  const handleClubSelect = (clubId: string) => {
    const club = clubs[clubId] || CLUBS[clubId];
    if (club) {
      onSelect(club.name);
    }
  };

  return (
    <div className="club-dropdown-container">
      <p id={labelId} className="block text-sm font-medium mb-1">{label}</p>
      <button
        id={buttonId}
        type="button"
        onClick={() => setIsModalOpen(true)}
        className="club-dropdown__button"
        aria-labelledby={labelId}
      >
        <div className="flex items-center gap-2">
          {selectedClubData && logoUrl ? (
            <>
              <SafeImage
                src={logoUrl}
                alt={`${selectedClubData.name} logo`}
                width={24}
                height={24}
                className="club-dropdown-logo"
                loading="lazy"
                unoptimized={logoUrl.endsWith(".svg")}
              />
              <span>{selectedClubData.name}</span>
            </>
          ) : (
            <span className="text-gray-500 dark:text-gray-400">
              Select a club
            </span>
          )}
        </div>
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

      <ClubSelectionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        selectedClubs={[]}
        onToggleClub={handleClubSelect}
        maxClubs={1}
        singleSelect={true}
        title="Select Club"
        subtitle="Choose a club to compare"
      />
    </div>
  );
}
