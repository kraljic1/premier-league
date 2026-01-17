"use client";

import { useState, useRef, useEffect } from "react";
import { useAppStore } from "@/lib/store";
import { CLUBS } from "@/lib/clubs";
import { useClubs } from "@/lib/hooks/useClubs";

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
import { ClubLogo } from "@/components/ClubLogo";
import { SafeImage } from "@/components/SafeImage";
import { LoadingSpinner } from "@/components/LoadingSpinner";

export function ClubSelector() {
  const [mounted, setMounted] = useState(false);
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

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">My Clubs (max 5)</h3>
        <LoadingSpinner size="md" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">My Clubs (max 5)</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {Object.values(clubs).map((club) => {
          const isSelected = safeMyClubs.includes(club.id);
          const isPrimary = safePrimaryClub === club.id;
          const isDisabled = !isSelected && safeMyClubs.length >= 5;

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
                  <SafeImage
                    src={club.logoUrlFromDb || club.logoUrl!}
                    alt={`${club.name} logo`}
                    width={24}
                    height={24}
                    className="w-6 h-6 object-contain"
                    loading="lazy"
                    unoptimized={Boolean((club.logoUrlFromDb || club.logoUrl)?.endsWith('.svg'))}
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
                  className="w-5 h-5 object-contain"
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
                    className="w-5 h-5 object-contain"
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

