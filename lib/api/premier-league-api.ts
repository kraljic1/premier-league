/**
 * Wrapper for the Premier League API (Flask service)
 * This assumes the Flask API is running on http://localhost:5000
 * 
 * To run the Flask API:
 * 1. Clone: git clone https://github.com/tarun7r/Premier-League-API.git
 * 2. Install: pip install -r requirements.txt
 * 3. Run: python main.py
 */

const PREMIER_LEAGUE_API_URL = process.env['PREMIER_LEAGUE_API_URL'] || 'http://localhost:5000';

export interface PremierLeagueTableRow {
  Position: string;
  Team: string;
  Played: string;
  Wins: string;
  Draws: string;
  Losses: string;
  'Goal Difference': string;
  Points: string;
}

export interface PremierLeaguePlayer {
  name: string;
  position: string;
  club: string;
  Nationality: string;
  'Date of Birth': string;
  height: string;
  key_stats: any;
}

export interface PremierLeagueFixture {
  fixture: string; // Format: "Team A vs Team B DD/MM/YYYY HH:MM"
}

/**
 * Fetches the Premier League table from the Flask API
 */
export async function fetchTableFromAPI(): Promise<PremierLeagueTableRow[]> {
  try {
    const response = await fetch(`${PREMIER_LEAGUE_API_URL}/table`, {
      next: { revalidate: 1800 }, // Cache for 30 minutes
    });

    if (!response.ok) {
      throw new Error(`Premier League API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('[Premier League API] Error fetching table:', error);
    throw error;
  }
}

/**
 * Fetches player stats from the Flask API
 */
export async function fetchPlayerFromAPI(playerName: string): Promise<PremierLeaguePlayer[]> {
  try {
    const encodedName = encodeURIComponent(playerName);
    const response = await fetch(`${PREMIER_LEAGUE_API_URL}/players/${encodedName}`, {
      next: { revalidate: 1800 },
    });

    if (!response.ok) {
      throw new Error(`Premier League API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`[Premier League API] Error fetching player ${playerName}:`, error);
    throw error;
  }
}

/**
 * Fetches next 3 fixtures for a team from the Flask API
 */
export async function fetchFixturesFromAPI(teamName: string): Promise<PremierLeagueFixture[]> {
  try {
    const encodedName = encodeURIComponent(teamName);
    const response = await fetch(`${PREMIER_LEAGUE_API_URL}/fixtures/${encodedName}`, {
      next: { revalidate: 1800 },
    });

    if (!response.ok) {
      throw new Error(`Premier League API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`[Premier League API] Error fetching fixtures for ${teamName}:`, error);
    throw error;
  }
}

/**
 * Checks if the Premier League API service is available
 */
export async function checkAPIAvailability(): Promise<boolean> {
  try {
    const response = await fetch(`${PREMIER_LEAGUE_API_URL}/table`, {
      method: 'HEAD',
      signal: AbortSignal.timeout(5000), // 5 second timeout
    });
    return response.ok;
  } catch (error) {
    return false;
  }
}

