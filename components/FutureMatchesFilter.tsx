"use client";

interface FutureMatchesFilterProps {
  selectedCount: number | null;
  onSelect: (count: number | null) => void;
}

const MATCH_OPTIONS = [1, 3, 5, 10];

/**
 * Filter component for selecting how many future matches to display.
 * Pass null for "All" matches.
 */
export function FutureMatchesFilter({
  selectedCount,
  onSelect,
}: FutureMatchesFilterProps) {
  return (
    <div className="future-matches-filter">
      <span className="future-matches-filter__label">Show next:</span>
      <div className="future-matches-filter__buttons">
        {MATCH_OPTIONS.map((count) => (
          <button
            key={count}
            onClick={() => onSelect(count)}
            className={`future-matches-filter__button ${
              selectedCount === count
                ? "future-matches-filter__button--active"
                : ""
            }`}
          >
            {count}
          </button>
        ))}
        <button
          onClick={() => onSelect(null)}
          className={`future-matches-filter__button ${
            selectedCount === null
              ? "future-matches-filter__button--active"
              : ""
          }`}
        >
          All
        </button>
      </div>
    </div>
  );
}
