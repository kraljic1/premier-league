"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";

interface SeasonSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  seasons: string[];
  selectedSeason: string | null;
  onSelect: (season: string) => void;
  title?: string;
  subtitle?: string;
}

export function SeasonSelectionModal({
  isOpen,
  onClose,
  seasons,
  selectedSeason,
  onSelect,
  title = "Select Season",
  subtitle = "Choose a previous season to compare",
}: SeasonSelectionModalProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [mounted, setMounted] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

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

  const handleSeasonClick = (season: string) => {
    onSelect(season);
    onClose();
  };

  const modalContent = (
    <div className={`season-selection-modal-overlay ${isAnimating ? "season-selection-modal-overlay--open" : ""}`}>
      <div 
        className={`season-selection-modal ${isAnimating ? "season-selection-modal--open" : ""}`} 
        ref={modalRef}
      >
        <div className="season-selection-modal__header">
          <div>
            <h3 className="season-selection-modal__title">{title}</h3>
            <p className="season-selection-modal__subtitle">{subtitle}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="season-selection-modal__close"
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

        {seasons.length === 0 ? (
          <div className="season-selection-modal__empty">
            <p>No seasons available</p>
          </div>
        ) : (
          <div className="season-selection-modal__list">
            {seasons.map((season) => {
              const isSelected = selectedSeason === season;
              return (
                <button
                  key={season}
                  type="button"
                  onClick={() => handleSeasonClick(season)}
                  className={`season-selection-modal__item ${
                    isSelected ? "season-selection-modal__item--selected" : ""
                  }`}
                  aria-label={`Select ${season}`}
                >
                  <div className="season-selection-modal__item-content">
                    <svg
                      className="season-selection-modal__item-icon"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    <span className="season-selection-modal__item-text">
                      {season}
                    </span>
                  </div>
                  {isSelected && (
                    <svg
                      className="season-selection-modal__item-check"
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
        )}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
