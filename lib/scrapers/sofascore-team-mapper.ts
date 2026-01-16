/**
 * Maps SofaScore team names to our club names
 * Add mappings here if team names don't match exactly
 */

import { CLUBS } from "../clubs";

const TEAM_NAME_MAPPINGS: Record<string, string> = {
  // Common SofaScore variations
  "Man City": "Manchester City",
  "Man United": "Manchester United",
  "Man Utd": "Manchester United",
  "Tottenham": "Tottenham Hotspur",
  "Spurs": "Tottenham Hotspur",
  "Brighton": "Brighton & Hove Albion",
  "Brighton Hove": "Brighton & Hove Albion",
  "Wolves": "Wolverhampton Wanderers",
  "Wolverhampton": "Wolverhampton Wanderers",
  "West Ham": "West Ham United",
  "Newcastle": "Newcastle United",
  "Leeds": "Leeds United",
  "Nottingham": "Nottingham Forest",
  "Nott'm Forest": "Nottingham Forest",
  "Forest": "Nottingham Forest", // SofaScore uses "Forest"
  "Crystal Palace": "Crystal Palace",
  "Aston Villa": "Aston Villa",
  "Bournemouth": "Bournemouth",
  "Brentford": "Brentford",
  "Burnley": "Burnley",
  "Chelsea": "Chelsea",
  "Everton": "Everton",
  "Fulham": "Fulham",
  "Liverpool": "Liverpool",
  "Arsenal": "Arsenal",
  "Sunderland": "Sunderland",
};

/**
 * Maps a team name from SofaScore to our standard club name
 */
export function mapTeamName(sofascoreName: string): string {
  // First, try exact match
  const exactMatch = Object.values(CLUBS).find(
    club => club.name.toLowerCase() === sofascoreName.toLowerCase() ||
            club.shortName.toLowerCase() === sofascoreName.toLowerCase()
  );
  
  if (exactMatch) {
    return exactMatch.name;
  }
  
  // Try mapping table
  const normalized = sofascoreName.trim();
  if (TEAM_NAME_MAPPINGS[normalized]) {
    return TEAM_NAME_MAPPINGS[normalized];
  }
  
  // Try case-insensitive mapping
  const lowerNormalized = normalized.toLowerCase();
  for (const [key, value] of Object.entries(TEAM_NAME_MAPPINGS)) {
    if (key.toLowerCase() === lowerNormalized) {
      return value;
    }
  }
  
  // Try partial match with club names
  const partialMatch = Object.values(CLUBS).find(
    club => club.name.toLowerCase().includes(lowerNormalized) ||
            lowerNormalized.includes(club.name.toLowerCase())
  );
  
  if (partialMatch) {
    return partialMatch.name;
  }
  
  // Return original if no match found (will be logged as warning)
  return normalized;
}

/**
 * Validates if a team name matches any of our clubs
 */
export function isValidTeamName(teamName: string): boolean {
  const mappedName = mapTeamName(teamName);
  return Object.values(CLUBS).some(
    club => club.name === mappedName || club.shortName === mappedName
  );
}
