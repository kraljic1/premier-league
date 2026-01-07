import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function getTimeUntil(date: string | Date): {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
} {
  const target = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diff = target.getTime() - now.getTime();

  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  return { days, hours, minutes, seconds };
}

/**
 * Determines the current matchweek based on finished matches.
 * Returns the highest matchweek that has at least one finished match.
 * If no matches are finished, returns 0.
 */
export function getCurrentMatchweek(fixtures: Array<{ matchweek: number; status: string }>): number {
  const finishedMatches = fixtures.filter(f => f.status === "finished");
  
  if (finishedMatches.length === 0) {
    return 0;
  }

  // Find the highest matchweek with finished matches
  const finishedMatchweeks = finishedMatches.map(f => f.matchweek);
  const maxFinishedMatchweek = Math.max(...finishedMatchweeks);

  // Check if this matchweek is fully completed (should have ~10 matches)
  // For Premier League, each matchweek should have 10 matches (20 teams)
  const matchesInMaxWeek = finishedMatches.filter(f => f.matchweek === maxFinishedMatchweek).length;
  
  // If we have a reasonable number of matches in the highest matchweek, consider it current
  // Otherwise, the current matchweek might be the next one
  if (matchesInMaxWeek >= 8) {
    // Most matches in this week are finished, so we're likely in or past this matchweek
    return maxFinishedMatchweek;
  } else {
    // Not enough matches finished in the highest week, so current is likely the previous week
    return Math.max(0, maxFinishedMatchweek - 1);
  }
}

