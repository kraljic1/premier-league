export type ClubNameLike = {
  name: string;
  shortName?: string;
};

const CLUB_NAME_ALIASES: Record<string, string> = {
  manunited: "manchesterunited",
  manutd: "manchesterunited",
  manchesterutd: "manchesterunited",
  mancity: "manchestercity",
  manchestercity: "manchestercity",
  manchestercty: "manchestercity",
  spurs: "tottenhamhotspur",
  tottenham: "tottenhamhotspur",
  westham: "westhamunited",
  newcastle: "newcastleunited",
  wolves: "wolverhamptonwanderers",
  brighton: "brightonandhovealbion",
  leeds: "leedsunited",
  forest: "nottinghamforest",
  nottsforest: "nottinghamforest",
  nottmforest: "nottinghamforest",
};

export function normalizeClubName(name: string): string {
  return name
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/\b(fc|afc|cf|sc)\b/g, "")
    .replace(/[^a-z0-9]/g, "");
}

export function resolveClubName(name: string): string {
  const normalized = normalizeClubName(name);
  return CLUB_NAME_ALIASES[normalized] || normalized;
}

export function clubNamesMatch(nameA: string, nameB: string): boolean {
  return resolveClubName(nameA) === resolveClubName(nameB);
}

export function findClubEntryByName<T extends ClubNameLike>(
  clubs: Record<string, T>,
  name: string
): T | undefined {
  const normalizedInput = normalizeClubName(name);
  const resolvedInput = resolveClubName(name);

  return Object.values(clubs).find((club) => {
    if (clubNamesMatch(club.name, name)) {
      return true;
    }

    if (club.shortName && normalizeClubName(club.shortName) === normalizedInput) {
      return true;
    }

    return resolveClubName(club.name) === resolvedInput;
  });
}

export function findClubKeyByName<T extends ClubNameLike>(
  clubs: Record<string, T>,
  name: string
): string | undefined {
  const normalizedInput = normalizeClubName(name);
  const resolvedInput = resolveClubName(name);

  return Object.keys(clubs).find((key) => {
    const club = clubs[key];

    if (clubNamesMatch(club.name, name)) {
      return true;
    }

    if (club.shortName && normalizeClubName(club.shortName) === normalizedInput) {
      return true;
    }

    return resolveClubName(club.name) === resolvedInput;
  });
}
