export interface Club {
  id: string;
  name: string;
  shortName: string;
  primaryColor: string;
  secondaryColor: string;
  textColor: string;
  logoUrl?: string;
  logoUrlFromDb?: string | null;
}

export interface Fixture {
  id: string;
  date: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number | null;
  awayScore: number | null;
  matchweek: number;
  status: "scheduled" | "live" | "finished";
  isDerby?: boolean;
  season?: string; // e.g., "2024/2025", "2025/2026"
  competition?: string | null; // e.g., "Premier League", "FA Cup"
  competitionRound?: string | null;
}

export type ComparisonBasis = "matchweek" | "matches-played";

export interface Standing {
  position: number;
  club: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  form: string | null; // e.g., "WWDLWD"
}

export interface DerbyPair {
  club1: string;
  club2: string;
}

