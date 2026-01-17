"use client";

import { useState, useEffect, useRef } from "react";
import { useClubs } from "@/lib/hooks/useClubs";
import { SafeImage } from "@/components/SafeImage";
import { LoadingSpinner } from "@/components/LoadingSpinner";

interface ClubSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedClubs: string[];
  onToggleClub: (clubId: string) => void;
  maxClubs: number;
}

export function ClubSelectionModal({
  isOpen,
  onClose,
  selectedClubs,
  onToggleClub,
  maxClubs,
}: ClubSelectionModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const modalRef = useRef<HTMLDivElement>(null);
  const { clubs, isLoading } = useClubs();

  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
      }
    }

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        modalRef.current &&
        !modalRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filteredClubs = Object.values(clubs).filter((club) =>
    club.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleClubClick = (clubId: string) => {
    if (selectedClubs.includes(clubId)) {
      onToggleClub(clubId);
    } else {
      if (selectedClubs.length < maxClubs) {
        onToggleClub(clubId);
      }
    }
  };

  return (
    <div className="club-selection-modal-overlay">
      <div className="club-selection-modal" ref={modalRef}>
        <div className="club-selection-modal__header">
          <h3 className="club-selection-modal__title">
            Select Clubs ({selectedClubs.length}/{maxClubs})
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="club-selection-modal__close"
            aria-label="Close modal"
          >
            <svg
              className="w-6 h-6"
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

        <div className="club-selection-modal__search">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search clubs..."
            className="club-selection-modal__search-input"
            autoFocus
          />
          <svg
            className="club-selection-modal__search-icon"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>

        {isLoading ? (
          <div className="club-selection-modal__loading">
            <LoadingSpinner size="md" />
          </div>
        ) : (
          <div className="club-selection-modal__grid">
            {filteredClubs.map((club) => {
              const isSelected = selectedClubs.includes(club.id);
              const isDisabled = !isSelected && selectedClubs.length >= maxClubs;

              return (
                <button
                  key={club.id}
                  type="button"
                  onClick={() => !isDisabled && handleClubClick(club.id)}
                  className={`club-selection-modal__card ${
                    isSelected ? "club-selection-modal__card--selected" : ""
                  } ${isDisabled ? "club-selection-modal__card--disabled" : ""}`}
                  disabled={isDisabled}
                >
                  <div className="club-selection-modal__card-badge">
                    {club.shortName}
                  </div>
                  <div className="club-selection-modal__card-logo">
                    {(club.logoUrlFromDb || club.logoUrl) && (
                      <SafeImage
                        src={club.logoUrlFromDb || club.logoUrl!}
                        alt={`${club.name} logo`}
                        width={64}
                        height={64}
                        className="club-selection-modal__logo"
                        loading="lazy"
                        unoptimized={Boolean(
                          (club.logoUrlFromDb || club.logoUrl)?.endsWith(
                            ".svg"
                          )
                        )}
                      />
                    )}
                  </div>
                  <div className="club-selection-modal__card-name">
                    {club.name}
                  </div>
                  {isSelected && (
                    <div className="club-selection-modal__card-check">
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
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {selectedClubs.length >= maxClubs && (
          <div className="club-selection-modal__limit-message">
            Maximum {maxClubs} clubs selected. Remove a club to add another.
          </div>
        )}
      </div>
    </div>
  );
}
