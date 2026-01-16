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
    logoUrl: "https://upload.wikimedia.org/wikipedia/en/5/53/Arsenal_FC.svg",
  },
  astonVilla: {
    id: "astonVilla",
    name: "Aston Villa",
    shortName: "AVL",
    primaryColor: "#95BFE5",
    secondaryColor: "#670E36",
    textColor: "#FFFFFF",
    logoUrl: "https://resources.premierleague.com/premierleague/badges/70/t7.png",
  },
  bournemouth: {
    id: "bournemouth",
    name: "Bournemouth",
    shortName: "BOU",
    primaryColor: "#DA020E",
    secondaryColor: "#000000",
    textColor: "#FFFFFF",
    logoUrl: "https://upload.wikimedia.org/wikipedia/en/e/e5/AFC_Bournemouth_%282013%29.svg",
  },
  brentford: {
    id: "brentford",
    name: "Brentford",
    shortName: "BRE",
    primaryColor: "#E30613",
    secondaryColor: "#FFFFFF",
    textColor: "#FFFFFF",
    logoUrl: "https://upload.wikimedia.org/wikipedia/en/2/2a/Brentford_FC_crest.svg",
  },
  brighton: {
    id: "brighton",
    name: "Brighton & Hove Albion",
    shortName: "BHA",
    primaryColor: "#0057B8",
    secondaryColor: "#FFFFFF",
    textColor: "#FFFFFF",
    logoUrl: "https://upload.wikimedia.org/wikipedia/en/f/fd/Brighton_%26_Hove_Albion_logo.svg",
  },
  chelsea: {
    id: "chelsea",
    name: "Chelsea",
    shortName: "CHE",
    primaryColor: "#034694",
    secondaryColor: "#FFFFFF",
    textColor: "#FFFFFF",
    logoUrl: "https://upload.wikimedia.org/wikipedia/en/c/cc/Chelsea_FC.svg",
  },
  crystalPalace: {
    id: "crystalPalace",
    name: "Crystal Palace",
    shortName: "CRY",
    primaryColor: "#1B458F",
    secondaryColor: "#C4122E",
    textColor: "#FFFFFF",
    logoUrl: "https://upload.wikimedia.org/wikipedia/en/a/a2/Crystal_Palace_FC_logo_%282022%29.svg",
  },
  everton: {
    id: "everton",
    name: "Everton",
    shortName: "EVE",
    primaryColor: "#003399",
    secondaryColor: "#FFFFFF",
    textColor: "#FFFFFF",
    logoUrl: "https://upload.wikimedia.org/wikipedia/en/7/7c/Everton_FC_logo.svg",
  },
  fulham: {
    id: "fulham",
    name: "Fulham",
    shortName: "FUL",
    primaryColor: "#000000",
    secondaryColor: "#FFFFFF",
    textColor: "#FFFFFF",
    logoUrl: "https://upload.wikimedia.org/wikipedia/en/e/eb/Fulham_FC_%28shield%29.svg",
  },
  burnley: {
    id: "burnley",
    name: "Burnley",
    shortName: "BUR",
    primaryColor: "#6C1D45",
    secondaryColor: "#99D6EA",
    textColor: "#FFFFFF",
    logoUrl: "https://resources.premierleague.com/premierleague/badges/70/t90.png",
  },
  leeds: {
    id: "leeds",
    name: "Leeds United",
    shortName: "LEE",
    primaryColor: "#FFCD00",
    secondaryColor: "#1D428A",
    textColor: "#000000",
    logoUrl: "https://upload.wikimedia.org/wikipedia/en/5/54/Leeds_United_F.C._logo.svg",
  },
  liverpool: {
    id: "liverpool",
    name: "Liverpool",
    shortName: "LIV",
    primaryColor: "#C8102E",
    secondaryColor: "#FFFFFF",
    textColor: "#FFFFFF",
    logoUrl: "https://upload.wikimedia.org/wikipedia/en/0/0c/Liverpool_FC.svg",
  },
  manCity: {
    id: "manCity",
    name: "Manchester City",
    shortName: "MCI",
    primaryColor: "#6CABDD",
    secondaryColor: "#FFFFFF",
    textColor: "#000000",
    logoUrl: "https://upload.wikimedia.org/wikipedia/en/e/eb/Manchester_City_FC_badge.svg",
  },
  manUnited: {
    id: "manUnited",
    name: "Manchester United",
    shortName: "MUN",
    primaryColor: "#DA020E",
    secondaryColor: "#FFFFFF",
    textColor: "#FFFFFF",
    logoUrl: "https://upload.wikimedia.org/wikipedia/en/7/7a/Manchester_United_FC_crest.svg",
  },
  newcastle: {
    id: "newcastle",
    name: "Newcastle United",
    shortName: "NEW",
    primaryColor: "#241F20",
    secondaryColor: "#FFFFFF",
    textColor: "#FFFFFF",
    logoUrl: "https://upload.wikimedia.org/wikipedia/en/5/56/Newcastle_United_Logo.svg",
  },
  nottingham: {
    id: "nottingham",
    name: "Nottingham Forest",
    shortName: "NFO",
    primaryColor: "#E53233",
    secondaryColor: "#FFFFFF",
    textColor: "#FFFFFF",
    logoUrl: "https://upload.wikimedia.org/wikipedia/en/e/e5/Nottingham_Forest_F.C._logo.svg",
  },
  sunderland: {
    id: "sunderland",
    name: "Sunderland",
    shortName: "SUN",
    primaryColor: "#EB172B",
    secondaryColor: "#211E1F",
    textColor: "#FFFFFF",
    logoUrl: "https://resources.premierleague.com/premierleague/badges/70/t56.png",
  },
  tottenham: {
    id: "tottenham",
    name: "Tottenham Hotspur",
    shortName: "TOT",
    primaryColor: "#132257",
    secondaryColor: "#FFFFFF",
    textColor: "#FFFFFF",
    logoUrl: "https://upload.wikimedia.org/wikipedia/en/b/b4/Tottenham_Hotspur.svg",
  },
  westHam: {
    id: "westHam",
    name: "West Ham United",
    shortName: "WHU",
    primaryColor: "#7A263A",
    secondaryColor: "#1BB1E7",
    textColor: "#FFFFFF",
    logoUrl: "https://upload.wikimedia.org/wikipedia/en/c/c2/West_Ham_United_FC_logo.svg",
  },
  wolves: {
    id: "wolves",
    name: "Wolverhampton Wanderers",
    shortName: "WOL",
    primaryColor: "#FDB913",
    secondaryColor: "#231F20",
    textColor: "#000000",
    logoUrl: "https://upload.wikimedia.org/wikipedia/en/f/fc/Wolverhampton_Wanderers.svg",
  },
};

export const DERBY_PAIRS: DerbyPair[] = [
  // Arsenal derbies
  { club1: "Arsenal", club2: "Aston Villa" },
  { club1: "Arsenal", club2: "Chelsea" },
  { club1: "Arsenal", club2: "Liverpool" },
  { club1: "Arsenal", club2: "Manchester City" },
  { club1: "Arsenal", club2: "Manchester United" },
  { club1: "Arsenal", club2: "Newcastle United" },
  { club1: "Arsenal", club2: "Tottenham Hotspur" },
  // Aston Villa derbies
  { club1: "Aston Villa", club2: "Chelsea" },
  { club1: "Aston Villa", club2: "Liverpool" },
  { club1: "Aston Villa", club2: "Manchester City" },
  { club1: "Aston Villa", club2: "Manchester United" },
  { club1: "Aston Villa", club2: "Newcastle United" },
  { club1: "Aston Villa", club2: "Tottenham Hotspur" },
  // Chelsea derbies
  { club1: "Chelsea", club2: "Liverpool" },
  { club1: "Chelsea", club2: "Manchester City" },
  { club1: "Chelsea", club2: "Manchester United" },
  { club1: "Chelsea", club2: "Newcastle United" },
  { club1: "Chelsea", club2: "Tottenham Hotspur" },
  // Liverpool derbies
  { club1: "Liverpool", club2: "Manchester City" },
  { club1: "Liverpool", club2: "Manchester United" },
  { club1: "Liverpool", club2: "Newcastle United" },
  { club1: "Liverpool", club2: "Tottenham Hotspur" },
  // Manchester City derbies
  { club1: "Manchester City", club2: "Manchester United" },
  { club1: "Manchester City", club2: "Newcastle United" },
  { club1: "Manchester City", club2: "Tottenham Hotspur" },
  // Manchester United derbies
  { club1: "Manchester United", club2: "Newcastle United" },
  { club1: "Manchester United", club2: "Tottenham Hotspur" },
  // Newcastle United derbies
  { club1: "Newcastle United", club2: "Tottenham Hotspur" },
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

