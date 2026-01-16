/**
 * Helper functions to get SofaScore season IDs via API
 * This helps us navigate to the correct season pages
 */

interface SofaScoreSeason {
  id: number;
  name: string;
  year: string;
  startDate: string;
  endDate: string;
}

/**
 * Gets all available seasons for Premier League from SofaScore API
 */
export async function getSofaScoreSeasons(): Promise<SofaScoreSeason[]> {
  try {
    const response = await fetch('https://api.sofascore.com/api/v1/unique-tournament/17/seasons', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
      }
    });
    
    if (!response.ok) {
      console.warn(`[SofaScore API] Failed to fetch seasons: ${response.status}`);
      return [];
    }
    
    const data = await response.json();
    return data.seasons || [];
  } catch (error) {
    console.error('[SofaScore API] Error fetching seasons:', error);
    return [];
  }
}

/**
 * Gets season ID for a specific year
 */
export async function getSeasonId(seasonYear: number): Promise<number | null> {
  const seasons = await getSofaScoreSeasons();
  const seasonStr = `${seasonYear}/${seasonYear + 1}`;
  const seasonStrAlt = `${seasonYear}-${seasonYear + 1}`;
  
  const season = seasons.find(s => 
    s.year === seasonStr || 
    s.year === seasonStrAlt ||
    s.name.includes(seasonYear.toString())
  );
  
  return season?.id || null;
}

/**
 * Gets rounds/matchweeks for a specific season
 */
export async function getSeasonRounds(seasonId: number): Promise<any[]> {
  try {
    const response = await fetch(`https://api.sofascore.com/api/v1/unique-tournament/17/season/${seasonId}/rounds`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
      }
    });
    
    if (!response.ok) {
      console.warn(`[SofaScore API] Failed to fetch rounds: ${response.status}`);
      return [];
    }
    
    const data = await response.json();
    return data.rounds || [];
  } catch (error) {
    console.error('[SofaScore API] Error fetching rounds:', error);
    return [];
  }
}
