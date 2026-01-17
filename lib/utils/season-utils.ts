/**
 * Season Utility Functions
 * 
 * Provides dynamic season calculation based on the current date.
 * Premier League seasons run from August to May:
 * - August - December: First half of season (e.g., Aug 2025 = 2025/26 season)
 * - January - July: Second half of season (e.g., Jan 2026 = 2025/26 season)
 */

/**
 * Get the start year of the current season based on a given date.
 * @param date - The date to check (defaults to current date)
 * @returns The year the current season started (e.g., 2025 for 2025/26 season)
 */
export function getCurrentSeasonStartYear(date: Date = new Date()): number {
  const month = date.getMonth(); // 0-11 (0 = January, 7 = August)
  const year = date.getFullYear();
  
  // If we're in January-July (months 0-6), the season started last year
  // If we're in August-December (months 7-11), the season started this year
  return month < 7 ? year - 1 : year;
}

/**
 * Get the current season in short format (e.g., "2025/26")
 * This format is used by the import scripts and database storage.
 */
export function getCurrentSeasonShort(date: Date = new Date()): string {
  const startYear = getCurrentSeasonStartYear(date);
  const endYear = (startYear + 1).toString().slice(-2);
  return `${startYear}/${endYear}`;
}

/**
 * Get the current season in full format (e.g., "2025/2026")
 * This format is used by the database default values.
 */
export function getCurrentSeasonFull(date: Date = new Date()): string {
  const startYear = getCurrentSeasonStartYear(date);
  const endYear = startYear + 1;
  return `${startYear}/${endYear}`;
}

/**
 * Get the start date of the current season (approximately August 1st)
 */
export function getCurrentSeasonStartDate(date: Date = new Date()): Date {
  const startYear = getCurrentSeasonStartYear(date);
  return new Date(`${startYear}-08-01`);
}

/**
 * Get the end date of the current season (approximately June 30th)
 */
export function getCurrentSeasonEndDate(date: Date = new Date()): Date {
  const startYear = getCurrentSeasonStartYear(date);
  const endYear = startYear + 1;
  return new Date(`${endYear}-06-30`);
}

/**
 * Get the Supabase OR filter string for the current season.
 * Matches both short and full season formats, plus null values.
 */
export function getCurrentSeasonFilter(date: Date = new Date()): string {
  const shortSeason = getCurrentSeasonShort(date);
  const fullSeason = getCurrentSeasonFull(date);
  return `season.eq.${shortSeason},season.eq.${fullSeason},season.is.null`;
}

/**
 * Generate a list of previous seasons for the dropdown.
 * @param count - Number of previous seasons to generate (default: 5)
 * @param date - Reference date for determining current season
 * @returns Array of season strings in full format (e.g., ["2024/2025", "2023/2024", ...])
 */
export function getPreviousSeasons(
  count: number = 5,
  date: Date = new Date()
): string[] {
  const currentSeasonStartYear = getCurrentSeasonStartYear(date);
  const previousSeasons: string[] = [];
  
  // Start from the season before current, go back 'count' seasons
  for (let i = 1; i <= count; i++) {
    const year = currentSeasonStartYear - i;
    previousSeasons.push(`${year}/${year + 1}`);
  }
  
  return previousSeasons;
}

/**
 * Convert a season year to short format (e.g., 2024 -> "2024/25")
 */
export function seasonYearToShortFormat(year: number | string): string {
  const yearNum = typeof year === 'string' ? parseInt(year) : year;
  const endYear = (yearNum + 1).toString().slice(-2);
  return `${yearNum}/${endYear}`;
}

/**
 * Convert a season year to full format (e.g., 2024 -> "2024/2025")
 */
export function seasonYearToFullFormat(year: number | string): string {
  const yearNum = typeof year === 'string' ? parseInt(year) : year;
  return `${yearNum}/${yearNum + 1}`;
}

/**
 * Get season date range from a season start year
 */
export function getSeasonDateRange(startYear: number | string): {
  start: Date;
  end: Date;
} {
  const yearNum = typeof startYear === 'string' ? parseInt(startYear) : startYear;
  return {
    start: new Date(`${yearNum}-08-01`),
    end: new Date(`${yearNum + 1}-06-30`),
  };
}

/**
 * Check if a given season string matches the current season
 */
export function isCurrentSeason(
  season: string,
  date: Date = new Date()
): boolean {
  const currentShort = getCurrentSeasonShort(date);
  const currentFull = getCurrentSeasonFull(date);
  return season === currentShort || season === currentFull;
}
