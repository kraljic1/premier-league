import { Club } from "./types";
import { normalizeClubName, resolveClubName } from "./utils/club-name";

export type { Club };
export { isDerby } from "./derbies";
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
  ipswich: {
    id: "ipswich",
    name: "Ipswich Town",
    shortName: "IPS",
    primaryColor: "#0033A0",
    secondaryColor: "#FF6600",
    textColor: "#FFFFFF",
    logoUrl: "https://upload.wikimedia.org/wikipedia/en/4/43/Ipswich_Town.svg",
  },
  leicester: {
    id: "leicester",
    name: "Leicester City",
    shortName: "LEI",
    primaryColor: "#003090",
    secondaryColor: "#FDBE11",
    textColor: "#FFFFFF",
    logoUrl: "https://upload.wikimedia.org/wikipedia/en/6/63/Leicester02.png",
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
  southampton: {
    id: "southampton",
    name: "Southampton",
    shortName: "SOU",
    primaryColor: "#D71920",
    secondaryColor: "#FFFFFF",
    textColor: "#FFFFFF",
    logoUrl: "https://upload.wikimedia.org/wikipedia/en/c/c9/FC_Southampton.svg",
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

export function getClubByName(name: string): Club | undefined {
  const normalizedInput = normalizeClubName(name);
  const resolvedInput = resolveClubName(name);

  return Object.values(CLUBS).find((club) => {
    if (resolveClubName(club.name) === resolvedInput) {
      return true;
    }

    if (club.shortName && normalizeClubName(club.shortName) === normalizedInput) {
      return true;
    }

    return club.name === name || club.shortName === name;
  });
}

