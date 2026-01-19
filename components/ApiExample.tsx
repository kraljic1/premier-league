'use client';

import { useState, useEffect } from 'react';
import { useApi } from '@/lib/api-client';

export function ApiExample() {
  const [fixtures, setFixtures] = useState<any[]>([]);
  const [standings, setStandings] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const api = useApi();

  const loadData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Load fixtures
      const fixturesResponse = await api.getFixtures({
        competitions: 'Premier League',
        limit: 5
      });

      if (fixturesResponse.success) {
        setFixtures(fixturesResponse.data || []);
      } else {
        setError(fixturesResponse.error || 'Failed to load fixtures');
      }

      // Load standings
      const standingsResponse = await api.getStandings('2025');

      if (standingsResponse.success) {
        setStandings(standingsResponse.data || []);
      }

    } catch (err) {
      setError('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async () => {
    const response = await api.forceUpdate();
    if (response.success) {
      alert(`Data refreshed: ${response.data?.message}`);
      loadData(); // Reload data
    } else {
      alert(`Refresh failed: ${response.error}`);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">API Integration Example</h2>

      <div className="flex gap-4 mb-6">
        <button
          onClick={loadData}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Loading...' : 'Load Data'}
        </button>

        <button
          onClick={refreshData}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          Force Refresh
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Fixtures */}
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-lg font-semibold mb-3">Recent Fixtures</h3>
          {fixtures.length > 0 ? (
            <div className="space-y-2">
              {fixtures.slice(0, 3).map((fixture: any, index: number) => (
                <div key={fixture.id || index} className="text-sm border-b pb-2">
                  <div className="font-medium">
                    {fixture.homeTeam} vs {fixture.awayTeam}
                  </div>
                  <div className="text-gray-600">
                    {fixture.homeScore !== null ? `${fixture.homeScore}-${fixture.awayScore}` : 'Not played'}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No fixtures loaded</p>
          )}
        </div>

        {/* Standings */}
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-lg font-semibold mb-3">Standings</h3>
          {standings.length > 0 ? (
            <div className="space-y-1">
              {standings.slice(0, 5).map((team: any, index: number) => (
                <div key={team.club || index} className="flex justify-between text-sm">
                  <span>{team.position}. {team.club}</span>
                  <span className="font-semibold">{team.points} pts</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No standings loaded</p>
          )}
        </div>
      </div>

      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-semibold mb-2">🔒 Security Notes:</h4>
        <ul className="text-sm text-gray-700 space-y-1">
          <li>• API keys are NEVER exposed in frontend code</li>
          <li>• All requests go through secure Next.js API routes</li>
          <li>• Rate limiting protects against abuse</li>
          <li>• CORS policy restricts cross-origin requests</li>
          <li>• Admin operations require separate authentication</li>
        </ul>
      </div>
    </div>
  );
}