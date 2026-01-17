"use client";

interface SeasonStatsCompactProps {
  stats: {
    points: number;
    wins: number;
    draws: number;
    losses: number;
    played: number;
    goalsFor: number;
    goalsAgainst: number;
  };
  title: string;
}

export function SeasonStatsCompact({ stats, title }: SeasonStatsCompactProps) {
  const goalDifference = stats.goalsFor - stats.goalsAgainst;

  return (
    <div className="season-stats-compact">
      <h4 className="season-stats-compact__title">{title}</h4>
      <div className="season-stats-compact__grid">
        <div className="season-stats-compact__item">
          <div className="season-stats-compact__label">Points</div>
          <div className="season-stats-compact__value">{stats.points}</div>
        </div>
        <div className="season-stats-compact__item">
          <div className="season-stats-compact__label">Played</div>
          <div className="season-stats-compact__value">{stats.played}</div>
        </div>
        <div className="season-stats-compact__item">
          <div className="season-stats-compact__label">Wins</div>
          <div className="season-stats-compact__value">{stats.wins}</div>
        </div>
        <div className="season-stats-compact__item">
          <div className="season-stats-compact__label">Draws</div>
          <div className="season-stats-compact__value">{stats.draws}</div>
        </div>
        <div className="season-stats-compact__item">
          <div className="season-stats-compact__label">Losses</div>
          <div className="season-stats-compact__value">{stats.losses}</div>
        </div>
        <div className="season-stats-compact__item">
          <div className="season-stats-compact__label">GD</div>
          <div className="season-stats-compact__value">
            {goalDifference > 0 ? "+" : ""}{goalDifference}
          </div>
        </div>
        <div className="season-stats-compact__item">
          <div className="season-stats-compact__label">Goals For</div>
          <div className="season-stats-compact__value">{stats.goalsFor}</div>
        </div>
        <div className="season-stats-compact__item">
          <div className="season-stats-compact__label">Goals Against</div>
          <div className="season-stats-compact__value">{stats.goalsAgainst}</div>
        </div>
      </div>
    </div>
  );
}
