export interface Club {
  id: string;
  name: string;
  shortName: string;
  primaryColor: string;
  secondaryColor: string;
  textColor: string;
  logoUrl?: string;
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
}

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

