"use client";

import { useState, useRef, useEffect } from "react";
import { useAppStore } from "@/lib/store";
import { CLUBS } from "@/lib/clubs";
import { useClubs } from "@/lib/hooks/useClubs";
import { ClubLogo } from "@/components/ClubLogo";

export function ClubSelector() {
  const { myClubs, primaryClub, addClub, removeClub, setPrimaryClub } =
    useAppStore();
  const { clubs } = useClubs();

  const handleToggleClub = (clubId: string) => {
    if (myClubs.includes(clubId)) {
      removeClub(clubId);
    } else {
      if (myClubs.length < 5) {
        addClub(clubId);
      }
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">My Clubs (max 5)</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {Object.values(clubs).map((club) => {
          const isSelected = myClubs.includes(club.id);
          const isPrimary = primaryClub === club.id;
          const isDisabled = !isSelected && myClubs.length >= 5;

          return (
            <div
              key={club.id}
              className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                isSelected
                  ? isPrimary
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                    : "border-green-500 bg-green-50 dark:bg-green-900/20"
                  : "border-gray-200 dark:border-gray-700"
              } ${isDisabled ? "opacity-50 cursor-not-allowed" : ""}`}
              onClick={() => !isDisabled && handleToggleClub(club.id)}
            >
              <div className="flex items-center gap-2 mb-1">
                {(club.logoUrlFromDb || club.logoUrl) && (
                  <img
                    src={club.logoUrlFromDb || club.logoUrl}
                    alt={`${club.name} logo`}
                    className="w-6 h-6 object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                )}
                <div className="text-sm font-medium">{club.shortName}</div>
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                {club.name}
              </div>
              {isPrimary && (
                <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                  Primary
                </div>
              )}
            </div>
          );
        })}
      </div>
      {myClubs.length > 0 && (
        <div className="mt-4">
          <label className="text-sm font-medium">Set Primary Club:</label>
          <PrimaryClubDropdown
            myClubs={myClubs}
            primaryClub={primaryClub}
            setPrimaryClub={setPrimaryClub}
          />
        </div>
      )}
    </div>
  );
}

interface PrimaryClubDropdownProps {
  myClubs: string[];
  primaryClub: string | null;
  setPrimaryClub: (clubId: string | null) => void;
}

function PrimaryClubDropdown({
  myClubs,
  primaryClub,
  setPrimaryClub,
}: PrimaryClubDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { clubs } = useClubs();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const selectedClub = primaryClub ? (clubs[primaryClub] || CLUBS[primaryClub]) : null;

  return (
    <div className="relative mt-1" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2 text-left border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
      >
        <div className="flex items-center gap-2">
          {selectedClub ? (
            <>
              {(selectedClub.logoUrlFromDb || selectedClub.logoUrl) && (
                <img
                  src={selectedClub.logoUrlFromDb || selectedClub.logoUrl}
                  alt={`${selectedClub.name} logo`}
                  className="w-5 h-5 object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              )}
              <span>{selectedClub.name}</span>
            </>
          ) : (
            <span className="text-gray-500 dark:text-gray-400">None</span>
          )}
        </div>
        <svg
          className={`w-5 h-5 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
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
      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-auto">
          <button
            type="button"
            onClick={() => {
              setPrimaryClub(null);
              setIsOpen(false);
            }}
            className={`w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 ${
              !primaryClub ? "bg-blue-50 dark:bg-blue-900/20" : ""
            }`}
          >
            <span className="text-gray-500 dark:text-gray-400">None</span>
          </button>
          {myClubs.map((clubId) => {
            const club = clubs[clubId] || CLUBS[clubId];
            return (
              <button
                key={clubId}
                type="button"
                onClick={() => {
                  setPrimaryClub(clubId);
                  setIsOpen(false);
                }}
                className={`w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 ${
                  primaryClub === clubId ? "bg-blue-50 dark:bg-blue-900/20" : ""
                }`}
              >
                {(club.logoUrlFromDb || club.logoUrl) && (
                  <img
                    src={club.logoUrlFromDb || club.logoUrl}
                    alt={`${club.name} logo`}
                    className="w-5 h-5 object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                )}
                <span>{club.name}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

