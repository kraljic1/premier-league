const CLUB_NAME_ALIASES: Record<string, string> = {
  "afc bournemouth": "Bournemouth",
  "arsenal": "Arsenal",
  "aston villa": "Aston Villa",
  "avfc": "Aston Villa",
  "bournemouth": "Bournemouth",
  "bournemouth afc": "Bournemouth",
  "brentford": "Brentford",
  "brighton": "Brighton & Hove Albion",
  "brighton and hove albion": "Brighton & Hove Albion",
  "brighton hove albion": "Brighton & Hove Albion",
  "bha": "Brighton & Hove Albion",
  "burnley": "Burnley",
  "chelsea": "Chelsea",
  "crystal palace": "Crystal Palace",
  "everton": "Everton",
  "fulham": "Fulham",
  "ipswich": "Ipswich Town",
  "ipswich town": "Ipswich Town",
  "leeds": "Leeds United",
  "leeds united": "Leeds United",
  "leicester": "Leicester City",
  "leicester city": "Leicester City",
  "liverpool": "Liverpool",
  "lfc": "Liverpool",
  "luton": "Luton Town",
  "luton town": "Luton Town",
  "man city": "Manchester City",
  "man united": "Manchester United",
  "manchester c": "Manchester City",
  "manchester city": "Manchester City",
  "manchester u": "Manchester United",
  "manchester united": "Manchester United",
  "mcfc": "Manchester City",
  "mufc": "Manchester United",
  "newcastle": "Newcastle United",
  "newcastle united": "Newcastle United",
  "nottingham": "Nottingham Forest",
  "nottingham forest": "Nottingham Forest",
  "nottm forest": "Nottingham Forest",
  "nufc": "Newcastle United",
  "norwich": "Norwich City",
  "norwich city": "Norwich City",
  "sheffield united": "Sheffield United",
  "sheff utd": "Sheffield United",
  "sheffield utd": "Sheffield United",
  "southampton": "Southampton",
  "spurs": "Tottenham Hotspur",
  "sunderland": "Sunderland",
  "tottenham": "Tottenham Hotspur",
  "tottenham hotspur": "Tottenham Hotspur",
  "west brom": "West Bromwich Albion",
  "west bromwich albion": "West Bromwich Albion",
  "west ham": "West Ham United",
  "west ham united": "West Ham United",
  "whu": "West Ham United",
  "wolves": "Wolverhampton Wanderers",
  "wolverhampton": "Wolverhampton Wanderers",
  "wolverhampton wanderers": "Wolverhampton Wanderers",
  "cardiff city": "Cardiff City",
  "huddersfield town": "Huddersfield Town",
  "hull city": "Hull City",
  "middlesbrough": "Middlesbrough",
  "stoke city": "Stoke City",
  "swansea city": "Swansea City",
  "watford": "Watford",
};

function normalizeKey(clubName: string): string {
  return clubName
    .trim()
    .replace(/['’]/g, "")
    .replace(/[.,()]/g, "")
    .replace(/&/g, "and")
    .replace(/-/g, " ")
    .replace(/\bafc\b/gi, "")
    .replace(/\bfc\b/gi, "")
    .replace(/\butd\b/gi, "united")
    .replace(/\s+/g, " ")
    .toLowerCase();
}

export function normalizeClubName(clubName: string): string {
  const trimmed = clubName.trim().replace(/\s+/g, " ");
  const normalizedKey = normalizeKey(trimmed);
  return CLUB_NAME_ALIASES[normalizedKey] ?? trimmed;
}
