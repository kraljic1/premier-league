/**
 * Frontend API Client - Safe API calls without exposing keys
 *
 * This client handles all API communication from the frontend.
 * API keys are NEVER exposed in frontend code - they remain server-side only.
 */

interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  success: boolean;
}

class ApiClient {
  private baseUrl = '';

  constructor() {
    // In production, this would be your domain
    this.baseUrl = typeof window !== 'undefined'
      ? '' // Relative URLs for client-side
      : process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';
  }

  /**
   * Generic API request method with error handling
   */
  private async request<T = any>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${this.baseUrl}/api/${endpoint}`;

      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          error: errorData.error || `HTTP ${response.status}: ${response.statusText}`,
        };
      }

      const data = await response.json();
      return {
        success: true,
        data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  /**
   * Fetch fixtures data
   */
  async getFixtures(params?: {
    competitions?: string;
    season?: string;
    limit?: number;
  }): Promise<ApiResponse<any[]>> {
    const searchParams = new URLSearchParams();
    if (params?.competitions) searchParams.set('competitions', params.competitions);
    if (params?.season) searchParams.set('season', params.season);
    if (params?.limit) searchParams.set('limit', params.limit.toString());

    const query = searchParams.toString();
    return this.request(`fixtures${query ? `?${query}` : ''}`);
  }

  /**
   * Fetch results data
   */
  async getResults(params?: {
    competitions?: string;
    season?: string;
    limit?: number;
  }): Promise<ApiResponse<any[]>> {
    const searchParams = new URLSearchParams();
    if (params?.competitions) searchParams.set('competitions', params.competitions);
    if (params?.season) searchParams.set('season', params.season);
    if (params?.limit) searchParams.set('limit', params.limit.toString());

    const query = searchParams.toString();
    return this.request(`results${query ? `?${query}` : ''}`);
  }

  /**
   * Fetch standings data
   */
  async getStandings(season?: string): Promise<ApiResponse<any[]>> {
    const query = season ? `?season=${season}` : '';
    return this.request(`standings${query}`);
  }

  /**
   * Fetch clubs data
   */
  async getClubs(): Promise<ApiResponse<any[]>> {
    return this.request('clubs');
  }

  /**
   * Force refresh data (use sparingly to avoid rate limiting)
   */
  async forceUpdate(): Promise<ApiResponse<{ message: string; fixturesUpdated: number; resultsUpdated: number; standingsUpdated: number }>> {
    return this.request('force-update', { method: 'POST' });
  }

  /**
   * Compare two seasons
   */
  async compareSeasons(season1: string, season2: string): Promise<ApiResponse<any>> {
    return this.request(`historical-season?season1=${season1}&season2=${season2}`);
  }
}

// Export singleton instance
export const apiClient = new ApiClient();

// React hook for easy API usage
export function useApi() {
  return {
    getFixtures: apiClient.getFixtures.bind(apiClient),
    getResults: apiClient.getResults.bind(apiClient),
    getStandings: apiClient.getStandings.bind(apiClient),
    getClubs: apiClient.getClubs.bind(apiClient),
    forceUpdate: apiClient.forceUpdate.bind(apiClient),
    compareSeasons: apiClient.compareSeasons.bind(apiClient),
  };
}