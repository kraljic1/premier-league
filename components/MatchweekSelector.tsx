"use client";

import { useState, useEffect, useRef } from "react";

interface MatchweekSelectorProps {
  availableMatchweeks: number[];
  selectedMatchweek: number | null;
  onSelect: (matchweek: number | null) => void;
  onScrollTo?: (matchweek: number) => void;
  currentMatchweek?: number | null;
}

const TOTAL_MATCHWEEKS = 38;

export function MatchweekSelector({
  availableMatchweeks,
  selectedMatchweek,
  onSelect,
  onScrollTo,
  currentMatchweek,
}: MatchweekSelectorProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const allMatchweeks = Array.from({ length: TOTAL_MATCHWEEKS }, (_, i) => i + 1);

  const handleMatchweekSelect = (mw: number | null) => {
    onSelect(mw);
    setIsDropdownOpen(false);
    if (mw !== null && onScrollTo) {
      // Small delay to ensure DOM is updated
      setTimeout(() => {
        onScrollTo(mw);
      }, 100);
    }
  };

  return (
    <div className="flex gap-1 sm:gap-2 flex-wrap items-center">
      <button
        onClick={() => handleMatchweekSelect(null)}
        className={`px-2 sm:px-4 py-2 rounded-lg transition-colors text-sm sm:text-base ${
          selectedMatchweek === null
            ? "bg-blue-600 text-white"
            : "bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"
        }`}
      >
        All Matchweeks
      </button>

      {/* Quick access buttons for available matchweeks */}
      {availableMatchweeks.slice(0, 8).map((mw) => (
        <button
          key={mw}
          onClick={() => handleMatchweekSelect(mw)}
          className={`px-2 sm:px-4 py-2 rounded-lg transition-colors text-sm sm:text-base ${
            selectedMatchweek === mw
              ? "bg-blue-600 text-white"
              : "bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"
          }`}
        >
          MW {mw}
          {mw === currentMatchweek && (
            <span className="ml-1 text-xs">●</span>
          )}
        </button>
      ))}

      {/* Dropdown for all matchweeks */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="px-2 sm:px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors flex items-center gap-1 text-sm sm:text-base"
        >
          <span>Jump to Matchweek</span>
          <svg
            className={`w-4 h-4 transition-transform ${
              isDropdownOpen ? "rotate-180" : ""
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

        {isDropdownOpen && (
          <div className="absolute top-full left-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto w-48">
            <div className="p-2">
              <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 px-2 py-1 mb-1">
                Select Matchweek
              </div>
              <div className="grid grid-cols-3 gap-1">
                {allMatchweeks.map((mw) => {
                  const hasData = availableMatchweeks.includes(mw);
                  return (
                    <button
                      key={mw}
                      onClick={() => handleMatchweekSelect(mw)}
                      className={`px-3 py-2 rounded text-sm transition-colors ${
                        selectedMatchweek === mw
                          ? "bg-blue-600 text-white"
                          : hasData
                          ? "bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
                          : "bg-gray-50 dark:bg-gray-900 text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
                      }`}
                      title={hasData ? `Matchweek ${mw}` : `Matchweek ${mw} (no data)`}
                    >
                      {mw}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

