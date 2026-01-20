import { createClient } from "@supabase/supabase-js";
import { CLUBS } from "./clubs";
import type { Database } from "./supabase";
import { getCurrentSeasonFull } from "./utils/season-utils";
import {
  CompetitionSource,
  scrapeCompetitionFixtures,
} from "./scrapers/rezultati-competition-fixtures";

export type ReconcileResult = {
  totalUpserted: number;
  perCompetition: { competition: string; upserted: number }[];
};

const COMPETITIONS: CompetitionSource[] = [
  {
    id: "premier-league",
    competition: "Premier League",
    url: "https://www.rezultati.com/nogomet/engleska/premier-league/raspored/",
  },
  {
    id: "fa-cup",
    competition: "FA Cup",
    url: "https://www.rezultati.com/nogomet/engleska/fa-cup/raspored/",
  },
  {
    id: "carabao-cup",
    competition: "Carabao Cup",
    url: "https://www.rezultati.com/nogomet/engleska/efl-cup/raspored/",
  },
  {
    id: "champions-league",
    competition: "UEFA Champions League",
    url: "https://www.rezultati.com/nogomet/europa/liga-prvaka/raspored/",
  },
  {
    id: "europa-league",
    competition: "UEFA Europa League",
    url: "https://www.rezultati.com/nogomet/europa/europska-liga/raspored/",
  },
  {
    id: "conference-league",
    competition: "UEFA Conference League",
    url: "https://www.rezultati.com/nogomet/europa/konferencijska-liga/raspored/",
  },
];

function buildClubSet(): Set<string> {
  return new Set(Object.values(CLUBS).map((club) => club.name));
}

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Missing Supabase environment variables.");
  }

  return createClient<Database>(supabaseUrl, supabaseKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

async function upsertFixtures(
  supabase: ReturnType<typeof getSupabaseClient>,
  fixtures: Awaited<ReturnType<typeof scrapeCompetitionFixtures>>
) {
  if (fixtures.length === 0) return 0;

  const payload = fixtures.map((fixture) => ({
    id: fixture.id,
    date: fixture.date,
    home_team: fixture.homeTeam,
    away_team: fixture.awayTeam,
    home_score: null,
    away_score: null,
    matchweek: fixture.matchweek,
    status: "scheduled",
    is_derby: fixture.isDerby || false,
    season: getCurrentSeasonFull(),
    competition: fixture.competition || null,
    competition_round: null,
  }));

  const { error } = await supabase.from("fixtures").upsert(payload, { onConflict: "id" });
  if (error) {
    console.error("[Reconcile Fixtures] Upsert failed:", error.message);
    return 0;
  }

  return payload.length;
}

export async function reconcileCompetitionFixtures(): Promise<ReconcileResult> {
  const supabase = getSupabaseClient();
  const clubSet = buildClubSet();
  let totalUpserted = 0;
  const perCompetition: ReconcileResult["perCompetition"] = [];

  for (const competition of COMPETITIONS) {
    console.log(`[Reconcile Fixtures] Checking ${competition.competition}...`);
    const fixtures = await scrapeCompetitionFixtures(competition);
    const clubFixtures = fixtures.filter(
      (fixture) => clubSet.has(fixture.homeTeam) || clubSet.has(fixture.awayTeam)
    );

    if (clubFixtures.length === 0) {
      console.log(`[Reconcile Fixtures] No club fixtures found for ${competition.competition}`);
      perCompetition.push({ competition: competition.competition, upserted: 0 });
      continue;
    }

    const upserted = await upsertFixtures(supabase, clubFixtures);
    totalUpserted += upserted;
    perCompetition.push({ competition: competition.competition, upserted });
    console.log(`[Reconcile Fixtures] Upserted ${upserted} fixtures for ${competition.competition}`);
  }

  return { totalUpserted, perCompetition };
}
