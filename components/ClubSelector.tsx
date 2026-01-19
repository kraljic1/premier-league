"use client";

import { useState, useEffect } from "react";
import { useAppStore } from "@/lib/store";
import { CLUBS } from "@/lib/clubs";
import { useClubs } from "@/lib/hooks/useClubs";
import { SafeImage } from "@/components/SafeImage";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { ClubSelectionModal } from "@/components/ClubSelectionModal";
import { PrimaryClubModal } from "@/components/PrimaryClubModal";

export function ClubSelector() {
  const [mounted, setMounted] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPrimaryModalOpen, setIsPrimaryModalOpen] = useState(false);
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
                      width={48}
                      height={48}
                      className="club-selector__chip-logo"
                      loading="lazy"
                      unoptimized={Boolean(
                        (club.logoUrlFromDb || club.logoUrl)?.endsWith(".svg")
                      )}
                      cssControlledSize={true}
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
          <p className="block text-sm font-medium mb-1">
            Set Primary Club:
          </p>
          <PrimaryClubButton
            id="primary-club-button"
            clubs={clubs}
            primaryClub={safePrimaryClub}
            onClick={() => setIsPrimaryModalOpen(true)}
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

      <PrimaryClubModal
        isOpen={isPrimaryModalOpen}
        onClose={() => setIsPrimaryModalOpen(false)}
        myClubs={safeMyClubs}
        primaryClub={safePrimaryClub}
        onSelect={setPrimaryClub}
      />
    </div>
  );
}

interface PrimaryClubButtonProps {
  id?: string;
  clubs: Record<string, any>;
  primaryClub: string | null;
  onClick: () => void;
}

function PrimaryClubButton({ id, clubs, primaryClub, onClick }: PrimaryClubButtonProps) {
  const selectedClub = primaryClub 
    ? (clubs[primaryClub] || CLUBS[primaryClub]) 
    : null;
  const logoUrl = selectedClub?.logoUrlFromDb || selectedClub?.logoUrl;

  return (
    <button
      id={id}
      type="button"
      onClick={onClick}
      className="primary-club-button"
    >
      <div className="flex items-center gap-2">
        {selectedClub && logoUrl ? (
          <>
            <SafeImage
              src={logoUrl}
              alt={`${selectedClub.name} logo`}
              width={24}
              height={24}
              className="club-dropdown-logo"
              loading="lazy"
              unoptimized={logoUrl.endsWith(".svg")}
            />
            <span>{selectedClub.name}</span>
          </>
        ) : (
          <span className="text-gray-500 dark:text-gray-400">None</span>
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
  );
}

