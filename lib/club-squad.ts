import { Player } from "./types";

const ESPN_TEAM_IDS: Record<string, number> = {
  arsenal: 359,
  astonVilla: 362,
  bournemouth: 349,
  brentford: 337,
  brighton: 331,
  burnley: 379,
  chelsea: 363,
  crystalPalace: 384,
  everton: 368,
  fulham: 370,
  leeds: 357,
  liverpool: 364,
  manCity: 382,
  manUnited: 360,
  newcastle: 361,
  nottingham: 393,
  sunderland: 366,
  tottenham: 367,
  westHam: 371,
  wolves: 380
};

const POSITION_ORDER: Record<string, number> = {
  Goalkeeper: 0,
  Defender: 1,
  Midfielder: 2,
  Forward: 3
};

const ESPN_BASE_URL = "https://site.api.espn.com/apis/site/v2/sports/soccer/eng.1/teams";

function parseJerseyNumber(jersey?: string): number | null {
  if (!jersey) return null;
  const parsed = Number.parseInt(jersey, 10);
  return Number.isNaN(parsed) ? null : parsed;
}

function normalizeNationality(athlete: Record<string, unknown>): string {
  const citizenship = athlete.citizenship;
  if (typeof citizenship === "string" && citizenship.trim().length > 0) {
    return citizenship;
  }

  const country = athlete.citizenshipCountry as { abbreviation?: string } | undefined;
  return country?.abbreviation ?? "Unknown";
}

function mapAthleteToPlayer(athlete: Record<string, unknown>): Player {
  const position = athlete.position as { displayName?: string } | undefined;

  return {
    name: String(athlete.displayName ?? athlete.fullName ?? "Unknown"),
    position: position?.displayName ?? "Unknown",
    number: parseJerseyNumber(String(athlete.jersey ?? "")),
    nationality: normalizeNationality(athlete)
  };
}

function sortPlayers(players: Player[]): Player[] {
  return [...players].sort((a, b) => {
    const positionA = POSITION_ORDER[a.position] ?? 99;
    const positionB = POSITION_ORDER[b.position] ?? 99;
    if (positionA !== positionB) return positionA - positionB;

    const numberA = a.number ?? 999;
    const numberB = b.number ?? 999;
    if (numberA !== numberB) return numberA - numberB;

    return a.name.localeCompare(b.name);
  });
}

export async function getClubSquad(clubId: string): Promise<Player[]> {
  const teamId = ESPN_TEAM_IDS[clubId];
  if (!teamId) return [];

  try {
    const response = await fetch(`${ESPN_BASE_URL}/${teamId}/roster`, {
      next: { revalidate: 60 * 60 }
    });

    if (!response.ok) {
      return [];
    }

    const data = (await response.json()) as { athletes?: Record<string, unknown>[] };
    if (!Array.isArray(data.athletes)) {
      return [];
    }

    const players = data.athletes.map(mapAthleteToPlayer);
    return sortPlayers(players);
  } catch (error) {
    console.error("[Club Squad] Failed to fetch roster", error);
    return [];
  }
}
