"use client";

const CLUB_NAME_ALIASES: Record<string, string> = {
  "Nott'm Forest": "Nottingham Forest",
};

export function normalizeClubName(clubName: string): string {
  const trimmed = clubName.trim();
  return CLUB_NAME_ALIASES[trimmed] ?? trimmed;
}
