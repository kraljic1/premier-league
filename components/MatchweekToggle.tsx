"use client";

interface MatchweekToggleProps {
  showFullSeason: boolean;
  onToggle: (value: boolean) => void;
  currentMatchweek: number;
}

export function MatchweekToggle({
  showFullSeason,
  onToggle,
  currentMatchweek,
}: MatchweekToggleProps) {
  return (
    <div className="matchweek-toggle">
      <button
        className={`matchweek-toggle__btn ${!showFullSeason ? "matchweek-toggle__btn--active" : ""}`}
        onClick={() => onToggle(false)}
        type="button"
      >
        At MW {currentMatchweek}
      </button>
      <button
        className={`matchweek-toggle__btn ${showFullSeason ? "matchweek-toggle__btn--active" : ""}`}
        onClick={() => onToggle(true)}
        type="button"
      >
        Full Season
      </button>
    </div>
  );
}
