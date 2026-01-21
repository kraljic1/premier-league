import { normalizeClubName } from "./utils/club-name-utils";

const DERBY_CLUBS = new Set([
  "Arsenal",
  "Manchester City",
  "Aston Villa",
  "Chelsea",
  "Liverpool",
  "Tottenham Hotspur",
  "Manchester United",
  "Newcastle United",
]);

export function isDerby(homeTeam: string, awayTeam: string): boolean {
  const normalizedHomeTeam = normalizeClubName(homeTeam);
  const normalizedAwayTeam = normalizeClubName(awayTeam);

  if (normalizedHomeTeam === normalizedAwayTeam) {
    return false;
  }

  return (
    DERBY_CLUBS.has(normalizedHomeTeam) &&
    DERBY_CLUBS.has(normalizedAwayTeam)
  );
}
