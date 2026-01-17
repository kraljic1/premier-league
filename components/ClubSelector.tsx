"use client";

import { useState, useRef, useEffect } from "react";
import { useAppStore } from "@/lib/store";
import { CLUBS } from "@/lib/clubs";
import { useClubs } from "@/lib/hooks/useClubs";
import { SafeImage } from "@/components/SafeImage";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { ClubSelectionModal } from "@/components/ClubSelectionModal";

interface ClubWithLogo {
  id: string;
  name: string;
  shortName: string;
  primaryColor: string;
  secondaryColor: string;
  textColor: string;
  logoUrl?: string;
  logoUrlFromDb?: string | null;
}

export function ClubSelector() {
  const [mounted, setMounted] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const myClubs = useAppStore((state) => state.myClubs);
  const primaryClub = useAppStore((state) => state.primaryClub);
  const addClub = useAppStore((state) => state.addClub);
  const removeClub = useAppStore((state) => state.removeClub);
  const setPrimaryClub = useAppStore((state) => state.setPrimaryClub);
  const { clubs, isLoading } = useClubs();
  
  useEffect(() => {
    setMounted(true);
  }, []);

  // Use empty array during SSR/before mount to prevent mismatch
  const safeMyClubs = mounted ? myClubs : [];
  const safePrimaryClub = mounted ? primaryClub : null;

  const handleToggleClub = (clubId: string) => {
    if (safeMyClubs.includes(clubId)) {
      removeClub(clubId);
    } else {
      if (safeMyClubs.length < 5) {
        addClub(clubId);
      }
    }
  };

  const handleRemoveClub = (clubId: string) => {
    removeClub(clubId);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">My Clubs (max 5)</h3>
        <LoadingSpinner size="md" />
      </div>
    );
  }

  const selectedClubsData = safeMyClubs
    .map((clubId) => clubs[clubId] || CLUBS[clubId])
    .filter((club): club is NonNullable<typeof club> => !!club);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">My Clubs (max 5)</h3>
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="club-selector__add-button"
          disabled={safeMyClubs.length >= 5}
        >
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
              d="M12 4v16m8-8H4"
            />
          </svg>
          Add Club
        </button>
      </div>

      {selectedClubsData.length === 0 ? (
        <div className="club-selector__empty">
          <p className="text-gray-500 dark:text-gray-400">
            No clubs selected. Click "Add Club" to get started.
          </p>
        </div>
      ) : (
        <div className="club-selector__chips">
          {selectedClubsData.map((club) => {
            const isPrimary = safePrimaryClub === club.id;
            return (
              <div
                key={club.id}
                className={`club-selector__chip ${
                  isPrimary ? "club-selector__chip--primary" : ""
                }`}
              >
                <div className="club-selector__chip-content">
                  {(club.logoUrlFromDb || club.logoUrl) && (
                    <SafeImage
                      src={club.logoUrlFromDb || club.logoUrl!}
                      alt={`${club.name} logo`}
                      width={32}
                      height={32}
                      className="club-selector__chip-logo"
                      loading="lazy"
                      unoptimized={Boolean(
                        (club.logoUrlFromDb || club.logoUrl)?.endsWith(".svg")
                      )}
                    />
                  )}
                  <span className="club-selector__chip-name">{club.name}</span>
                  {isPrimary && (
                    <span className="club-selector__chip-primary-badge">
                      Primary
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveClub(club.id)}
                  className="club-selector__chip-remove"
                  aria-label={`Remove ${club.name}`}
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            );
          })}
        </div>
      )}

      {safeMyClubs.length > 0 && (
        <div className="mt-4">
          <label className="text-sm font-medium">Set Primary Club:</label>
          <PrimaryClubDropdown
            myClubs={safeMyClubs}
            primaryClub={safePrimaryClub}
            setPrimaryClub={setPrimaryClub}
          />
        </div>
      )}

      <ClubSelectionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        selectedClubs={safeMyClubs}
        onToggleClub={handleToggleClub}
        maxClubs={5}
      />
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
  const { clubs, isLoading } = useClubs();

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

  const selectedClub = primaryClub ? (clubs[primaryClub] || CLUBS[primaryClub]) : null as ClubWithLogo | null;

  if (isLoading) {
    return (
      <div className="mt-1">
        <LoadingSpinner size="sm" />
      </div>
    );
  }

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
                <SafeImage
                  src={selectedClub.logoUrlFromDb || selectedClub.logoUrl!}
                  alt={`${selectedClub.name} logo`}
                  width={20}
                  height={20}
                  className="club-dropdown-logo"
                  loading="lazy"
                  unoptimized={Boolean((selectedClub.logoUrlFromDb || selectedClub.logoUrl)?.endsWith('.svg'))}
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
          {myClubs
            .map((clubId) => clubs[clubId] || CLUBS[clubId])
            .filter((club): club is NonNullable<typeof club> => !!club)
            .map((club) => (
              <button
                key={club.id}
                type="button"
                onClick={() => {
                  setPrimaryClub(club.id);
                  setIsOpen(false);
                }}
                className={`w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 ${
                  primaryClub === club.id ? "bg-blue-50 dark:bg-blue-900/20" : ""
                }`}
              >
                {(club.logoUrlFromDb || club.logoUrl) && (
                  <SafeImage
                    src={club.logoUrlFromDb || club.logoUrl!}
                    alt={`${club.name} logo`}
                    width={20}
                    height={20}
                    className="club-dropdown-logo"
                    loading="lazy"
                    unoptimized={Boolean((club.logoUrlFromDb || club.logoUrl)?.endsWith('.svg'))}
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

