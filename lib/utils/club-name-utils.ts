const CLUB_NAME_ALIASES: Record<string, string> = {
  "afc bournemouth": "Bournemouth",
  "arsenal": "Arsenal",
  "aston villa": "Aston Villa",
  "avfc": "Aston Villa",
  "bournemouth": "Bournemouth",
  "bournemouth afc": "Bournemouth",
  "brentford": "Brentford",
  "brentford fc": "Brentford",
  "brighton": "Brighton & Hove Albion",
  "brighton and hove albion": "Brighton & Hove Albion",
  "brighton hove albion": "Brighton & Hove Albion",
  "brighton hove albion fc": "Brighton & Hove Albion",
  "bha": "Brighton & Hove Albion",
  "burnley": "Burnley",
  "burnley fc": "Burnley",
  "chelsea": "Chelsea",
  "chelsea fc": "Chelsea",
  "crystal palace": "Crystal Palace",
  "crystal palace fc": "Crystal Palace",
  "everton": "Everton",
  "everton fc": "Everton",
  "fulham": "Fulham",
  "fulham fc": "Fulham",
  "leeds": "Leeds United",
  "leeds utd": "Leeds United",
  "leeds united": "Leeds United",
  "lfc": "Liverpool",
  "liverpool": "Liverpool",
  "liverpool fc": "Liverpool",
  "man city": "Manchester City",
  "man city fc": "Manchester City",
  "man utd": "Manchester United",
  "man united": "Manchester United",
  "manchester c": "Manchester City",
  "manchester city": "Manchester City",
  "manchester city fc": "Manchester City",
  "manchester u": "Manchester United",
  "manchester utd": "Manchester United",
  "manchester united": "Manchester United",
  "manchester united fc": "Manchester United",
  "mcfc": "Manchester City",
  "mufc": "Manchester United",
  "newcastle": "Newcastle United",
  "newcastle utd": "Newcastle United",
  "newcastle united": "Newcastle United",
  "newcastle united fc": "Newcastle United",
  "nottingham": "Nottingham Forest",
  "nottingham forest": "Nottingham Forest",
  "nottingham forest fc": "Nottingham Forest",
  "nott'm forest": "Nottingham Forest",
  "nufc": "Newcastle United",
  "spurs": "Tottenham Hotspur",
  "sunderland": "Sunderland",
  "sunderland afc": "Sunderland",
  "sunderland fc": "Sunderland",
  "tottenham": "Tottenham Hotspur",
  "tottenham hotspur": "Tottenham Hotspur",
  "tottenham hotspur fc": "Tottenham Hotspur",
  "west ham": "West Ham United",
  "west ham utd": "West Ham United",
  "west ham united": "West Ham United",
  "west ham united fc": "West Ham United",
  "whu": "West Ham United",
  "wolves": "Wolverhampton Wanderers",
  "wolves fc": "Wolverhampton Wanderers",
  "wolverhampton": "Wolverhampton Wanderers",
  "wolverhampton wanderers": "Wolverhampton Wanderers",
  "wolverhampton wanderers fc": "Wolverhampton Wanderers",
};

function normalizeKey(clubName: string): string {
  return clubName
    .trim()
    .replace(/\./g, "")
    .replace(/&/g, "and")
    .replace(/\bfc\b/gi, "")
    .replace(/\s+/g, " ")
    .toLowerCase();
}

export function normalizeClubName(clubName: string): string {
  const trimmed = clubName.trim().replace(/\s+/g, " ");
  const normalizedKey = normalizeKey(trimmed);
  return CLUB_NAME_ALIASES[normalizedKey] ?? trimmed;
}
