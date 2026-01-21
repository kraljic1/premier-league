export type CompetitionDefinition = {
  id: string;
  label: string;
  value: string;
  scheduleUrl: string;
};

export const PREMIER_LEAGUE_COMPETITION = "Premier League";

export const CUP_COMPETITIONS: CompetitionDefinition[] = [
  {
    id: "fa-cup",
    label: "FA Cup",
    value: "FA Cup",
    scheduleUrl: "https://www.rezultati.com/nogomet/engleska/fa-cup/raspored",
  },
  {
    id: "carabao-cup",
    label: "Carabao Cup",
    value: "Carabao Cup",
    scheduleUrl: "https://www.rezultati.com/nogomet/engleska/efl-cup/raspored",
  },
  {
    id: "champions-league",
    label: "UEFA Champions League",
    value: "UEFA Champions League",
    scheduleUrl: "https://www.rezultati.com/nogomet/europa/liga-prvaka/raspored",
  },
  {
    id: "europa-league",
    label: "UEFA Europa League",
    value: "UEFA Europa League",
    scheduleUrl: "https://www.rezultati.com/nogomet/europa/europska-liga/raspored",
  },
  {
    id: "conference-league",
    label: "UEFA Conference League",
    value: "UEFA Conference League",
    scheduleUrl: "https://www.rezultati.com/nogomet/europa/konferencijska-liga/raspored",
  },
];

export const DEFAULT_FIXTURE_COMPETITIONS = [
  PREMIER_LEAGUE_COMPETITION,
  ...CUP_COMPETITIONS.map((competition) => competition.value),
];

export function getCompetitionById(id: string) {
  return CUP_COMPETITIONS.find((competition) => competition.id === id) || null;
}

export function getCompetitionSourcesForCompetitions(competitions: string[]) {
  const competitionSet = new Set(competitions);
  return CUP_COMPETITIONS.filter((competition) => competitionSet.has(competition.value)).map(
    (competition) => ({
      id: competition.id,
      competition: competition.value,
      url: competition.scheduleUrl,
    })
  );
}
