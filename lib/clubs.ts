import { Club, DerbyPair } from "./types";

export type { Club };
export const CLUBS: Record<string, Club> = {
  arsenal: {
    id: "arsenal",
    name: "Arsenal",
    shortName: "ARS",
    primaryColor: "#EF0107",
    secondaryColor: "#9C824A",
    textColor: "#FFFFFF",
  },
  astonVilla: {
    id: "astonVilla",
    name: "Aston Villa",
    shortName: "AVL",
    primaryColor: "#95BFE5",
    secondaryColor: "#670E36",
    textColor: "#FFFFFF",
  },
  bournemouth: {
    id: "bournemouth",
    name: "Bournemouth",
    shortName: "BOU",
    primaryColor: "#DA020E",
    secondaryColor: "#000000",
    textColor: "#FFFFFF",
  },
  brentford: {
    id: "brentford",
    name: "Brentford",
    shortName: "BRE",
    primaryColor: "#E30613",
    secondaryColor: "#FFFFFF",
    textColor: "#FFFFFF",
  },
  brighton: {
    id: "brighton",
    name: "Brighton & Hove Albion",
    shortName: "BHA",
    primaryColor: "#0057B8",
    secondaryColor: "#FFFFFF",
    textColor: "#FFFFFF",
  },
  chelsea: {
    id: "chelsea",
    name: "Chelsea",
    shortName: "CHE",
    primaryColor: "#034694",
    secondaryColor: "#FFFFFF",
    textColor: "#FFFFFF",
  },
  crystalPalace: {
    id: "crystalPalace",
    name: "Crystal Palace",
    shortName: "CRY",
    primaryColor: "#1B458F",
    secondaryColor: "#C4122E",
    textColor: "#FFFFFF",
  },
  everton: {
    id: "everton",
    name: "Everton",
    shortName: "EVE",
    primaryColor: "#003399",
    secondaryColor: "#FFFFFF",
    textColor: "#FFFFFF",
  },
  fulham: {
    id: "fulham",
    name: "Fulham",
    shortName: "FUL",
    primaryColor: "#000000",
    secondaryColor: "#FFFFFF",
    textColor: "#FFFFFF",
  },
  ipswich: {
    id: "ipswich",
    name: "Ipswich Town",
    shortName: "IPS",
    primaryColor: "#0033A0",
    secondaryColor: "#FFFFFF",
    textColor: "#FFFFFF",
  },
  leicester: {
    id: "leicester",
    name: "Leicester City",
    shortName: "LEI",
    primaryColor: "#003090",
    secondaryColor: "#FDBE11",
    textColor: "#FFFFFF",
  },
  liverpool: {
    id: "liverpool",
    name: "Liverpool",
    shortName: "LIV",
    primaryColor: "#C8102E",
    secondaryColor: "#FFFFFF",
    textColor: "#FFFFFF",
  },
  manCity: {
    id: "manCity",
    name: "Manchester City",
    shortName: "MCI",
    primaryColor: "#6CABDD",
    secondaryColor: "#FFFFFF",
    textColor: "#000000",
  },
  manUnited: {
    id: "manUnited",
    name: "Manchester United",
    shortName: "MUN",
    primaryColor: "#DA020E",
    secondaryColor: "#FFFFFF",
    textColor: "#FFFFFF",
  },
  newcastle: {
    id: "newcastle",
    name: "Newcastle United",
    shortName: "NEW",
    primaryColor: "#241F20",
    secondaryColor: "#FFFFFF",
    textColor: "#FFFFFF",
  },
  nottingham: {
    id: "nottingham",
    name: "Nottingham Forest",
    shortName: "NFO",
    primaryColor: "#E53233",
    secondaryColor: "#FFFFFF",
    textColor: "#FFFFFF",
  },
  southampton: {
    id: "southampton",
    name: "Southampton",
    shortName: "SOU",
    primaryColor: "#ED1C24",
    secondaryColor: "#FFFFFF",
    textColor: "#FFFFFF",
  },
  tottenham: {
    id: "tottenham",
    name: "Tottenham Hotspur",
    shortName: "TOT",
    primaryColor: "#132257",
    secondaryColor: "#FFFFFF",
    textColor: "#FFFFFF",
  },
  westHam: {
    id: "westHam",
    name: "West Ham United",
    shortName: "WHU",
    primaryColor: "#7A263A",
    secondaryColor: "#1BB1E7",
    textColor: "#FFFFFF",
  },
  wolves: {
    id: "wolves",
    name: "Wolverhampton Wanderers",
    shortName: "WOL",
    primaryColor: "#FDB913",
    secondaryColor: "#231F20",
    textColor: "#000000",
  },
};

export const DERBY_PAIRS: DerbyPair[] = [
  { club1: "Arsenal", club2: "Tottenham Hotspur" },
  { club1: "Manchester United", club2: "Manchester City" },
  { club1: "Liverpool", club2: "Everton" },
  { club1: "Chelsea", club2: "Arsenal" },
  { club1: "Chelsea", club2: "Tottenham Hotspur" },
  { club1: "Arsenal", club2: "Chelsea" },
  { club1: "Tottenham Hotspur", club2: "Arsenal" },
  { club1: "Manchester City", club2: "Manchester United" },
  { club1: "Everton", club2: "Liverpool" },
  { club1: "Newcastle United", club2: "Sunderland" },
  { club1: "West Ham United", club2: "Tottenham Hotspur" },
  { club1: "West Ham United", club2: "Chelsea" },
];

export function getClubByName(name: string): Club | undefined {
  return Object.values(CLUBS).find(
    (club) => club.name === name || club.shortName === name
  );
}

export function isDerby(homeTeam: string, awayTeam: string): boolean {
  return DERBY_PAIRS.some(
    (pair) =>
      (pair.club1 === homeTeam && pair.club2 === awayTeam) ||
      (pair.club1 === awayTeam && pair.club2 === homeTeam)
  );
}

