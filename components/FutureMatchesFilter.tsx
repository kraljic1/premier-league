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
  const handleSelect = (count: number | null, event?: React.MouseEvent<HTMLButtonElement>) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    console.log("[FutureMatchesFilter] Selecting count:", count);
    onSelect(count);
  };

  return (
    <div className="future-matches-filter">
      <span className="future-matches-filter__label">Show next:</span>
      <div className="future-matches-filter__buttons">
        {MATCH_OPTIONS.map((count) => {
          const isActive = selectedCount === count;
          return (
            <button
              key={count}
              type="button"
              onClick={(e) => handleSelect(count, e)}
              className={
                isActive
                  ? "future-matches-filter__button future-matches-filter__button--active"
                  : "future-matches-filter__button"
              }
            >
              {count}
            </button>
          );
        })}
        <button
          type="button"
          onClick={(e) => handleSelect(null, e)}
          className={
            selectedCount === null
              ? "future-matches-filter__button future-matches-filter__button--active"
              : "future-matches-filter__button"
          }
        >
          All
        </button>
      </div>
    </div>
  );
}
