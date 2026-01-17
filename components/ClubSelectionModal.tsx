"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useClubs } from "@/lib/hooks/useClubs";
import { SafeImage } from "@/components/SafeImage";
import { LoadingSpinner } from "@/components/LoadingSpinner";

interface ClubSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedClubs: string[];
  onToggleClub: (clubId: string) => void;
  maxClubs: number;
  singleSelect?: boolean;
  title?: string;
  subtitle?: string;
}

export function ClubSelectionModal({
  isOpen,
  onClose,
  selectedClubs,
  onToggleClub,
  maxClubs,
  singleSelect = false,
  title = "Select Your Clubs",
  subtitle,
}: ClubSelectionModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isAnimating, setIsAnimating] = useState(false);
  const [mounted, setMounted] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const { clubs, isLoading } = useClubs();

  // Ensure portal mounts only on client
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    }

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
      setIsAnimating(true);
      // Focus search input after animation
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
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

  // Reset search when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery("");
      setIsAnimating(false);
    }
  }, [isOpen]);

  // Don't render on server or if not mounted
  if (!mounted || !isOpen) return null;

  const filteredClubs = Object.values(clubs).filter((club) =>
    club.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleClubClick = (clubId: string) => {
    if (singleSelect) {
      onToggleClub(clubId);
      onClose();
    } else {
      if (selectedClubs.includes(clubId)) {
        onToggleClub(clubId);
      } else {
        if (selectedClubs.length < maxClubs) {
          onToggleClub(clubId);
        }
      }
    }
  };

  const modalContent = (
    <div className={`club-selection-modal-overlay ${isAnimating ? "club-selection-modal-overlay--open" : ""}`}>
      <div 
        className={`club-selection-modal ${isAnimating ? "club-selection-modal--open" : ""}`} 
        ref={modalRef}
      >
        <div className="club-selection-modal__header">
          <div>
            <h3 className="club-selection-modal__title">
              {title}
            </h3>
            <p className="club-selection-modal__subtitle">
              {subtitle || (singleSelect ? "Choose a club" : `${selectedClubs.length} of ${maxClubs} selected`)}
            </p>
          </div>
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
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search clubs..."
            className="club-selection-modal__search-input"
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
        ) : filteredClubs.length === 0 ? (
          <div className="club-selection-modal__empty">
            <p>No clubs found matching "{searchQuery}"</p>
          </div>
        ) : (
          <div className="club-selection-modal__grid">
            {filteredClubs.map((club) => {
              const isSelected = selectedClubs.includes(club.id);
              const isDisabled = !singleSelect && !isSelected && selectedClubs.length >= maxClubs;

              return (
                <button
                  key={club.id}
                  type="button"
                  onClick={() => !isDisabled && handleClubClick(club.id)}
                  className={`club-selection-modal__card ${
                    isSelected && !singleSelect ? "club-selection-modal__card--selected" : ""
                  } ${isDisabled ? "club-selection-modal__card--disabled" : ""}`}
                  disabled={isDisabled}
                  aria-label={`Select ${club.name}`}
                >
                  {isSelected && !singleSelect && (
                    <div className="club-selection-modal__card-check">
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={3}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                  )}
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
                </button>
              );
            })}
          </div>
        )}

        {!singleSelect && selectedClubs.length >= maxClubs && (
          <div className="club-selection-modal__limit-message">
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
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            Maximum {maxClubs} clubs selected. Remove a club to add another.
          </div>
        )}
      </div>
    </div>
  );

  // Use portal to render modal at document body level
  return createPortal(modalContent, document.body);
}
