"use client";

import { useState, useRef, useEffect } from "react";
import { CLUBS } from "@/lib/clubs";
import { SafeImage } from "./SafeImage";

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
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  const clubs = Object.values(CLUBS);
  const selectedClubData = selectedClub
    ? clubs.find((c) => c.name === selectedClub)
    : null;

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="block text-sm font-medium mb-1">{label}</label>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2 text-left border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
      >
        <div className="flex items-center gap-2">
          {selectedClubData ? (
            <>
              {selectedClubData.logoUrl && (
                <SafeImage
                  src={selectedClubData.logoUrl}
                  alt={`${selectedClubData.name} logo`}
                  width={20}
                  height={20}
                  className="w-5 h-5 object-contain"
                  loading="lazy"
                  unoptimized={selectedClubData.logoUrl.endsWith(".svg")}
                />
              )}
              <span>{selectedClubData.name}</span>
            </>
          ) : (
            <span className="text-gray-500 dark:text-gray-400">
              Select a club
            </span>
          )}
        </div>
        <svg
          className={`w-5 h-5 transition-transform ${isOpen ? "rotate-180" : ""}`}
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
          {clubs.map((club) => (
            <button
              key={club.id}
              type="button"
              onClick={() => {
                onSelect(club.name);
                setIsOpen(false);
              }}
              className={`w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 ${
                selectedClub === club.name
                  ? "bg-blue-50 dark:bg-blue-900/20"
                  : ""
              }`}
            >
              {club.logoUrl && (
                <SafeImage
                  src={club.logoUrl}
                  alt={`${club.name} logo`}
                  width={20}
                  height={20}
                  className="w-5 h-5 object-contain"
                  loading="lazy"
                  unoptimized={club.logoUrl.endsWith(".svg")}
                />
              )}
              <span>{club.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
