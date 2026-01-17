"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { CLUBS } from "@/lib/clubs";
import { useClubs } from "@/lib/hooks/useClubs";
import { SafeImage } from "@/components/SafeImage";

interface PrimaryClubModalProps {
  isOpen: boolean;
  onClose: () => void;
  myClubs: string[];
  primaryClub: string | null;
  onSelect: (clubId: string | null) => void;
}

export function PrimaryClubModal({
  isOpen,
  onClose,
  myClubs,
  primaryClub,
  onSelect,
}: PrimaryClubModalProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [mounted, setMounted] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const { clubs } = useClubs();

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

  useEffect(() => {
    if (!isOpen) {
      setIsAnimating(false);
    }
  }, [isOpen]);

  if (!mounted || !isOpen) return null;

  const handleClubClick = (clubId: string | null) => {
    onSelect(clubId);
    onClose();
  };

  const myClubsData = myClubs
    .map((clubId) => clubs[clubId] || CLUBS[clubId])
    .filter((club): club is NonNullable<typeof club> => !!club);

  const modalContent = (
    <div className={`primary-club-modal-overlay ${isAnimating ? "primary-club-modal-overlay--open" : ""}`}>
      <div 
        className={`primary-club-modal ${isAnimating ? "primary-club-modal--open" : ""}`} 
        ref={modalRef}
      >
        <div className="primary-club-modal__header">
          <div>
            <h3 className="primary-club-modal__title">Set Primary Club</h3>
            <p className="primary-club-modal__subtitle">
              Choose your main club for highlights
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="primary-club-modal__close"
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

        <div className="primary-club-modal__list">
          <button
            type="button"
            onClick={() => handleClubClick(null)}
            className={`primary-club-modal__item ${
              !primaryClub ? "primary-club-modal__item--selected" : ""
            }`}
          >
            <div className="primary-club-modal__item-content">
              <div className="primary-club-modal__item-none">
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
                    d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                  />
                </svg>
              </div>
              <span className="primary-club-modal__item-text">None</span>
            </div>
            {!primaryClub && (
              <svg
                className="primary-club-modal__item-check"
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
            )}
          </button>

          {myClubsData.map((club) => {
            const isSelected = primaryClub === club.id;
            const logoUrl = club.logoUrlFromDb || club.logoUrl;
            
            return (
              <button
                key={club.id}
                type="button"
                onClick={() => handleClubClick(club.id)}
                className={`primary-club-modal__item ${
                  isSelected ? "primary-club-modal__item--selected" : ""
                }`}
              >
                <div className="primary-club-modal__item-content">
                  {logoUrl && (
                    <SafeImage
                      src={logoUrl}
                      alt={`${club.name} logo`}
                      width={40}
                      height={40}
                      className="primary-club-modal__item-logo"
                      loading="lazy"
                      unoptimized={logoUrl.endsWith(".svg")}
                    />
                  )}
                  <span className="primary-club-modal__item-text">
                    {club.name}
                  </span>
                </div>
                {isSelected && (
                  <svg
                    className="primary-club-modal__item-check"
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
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
