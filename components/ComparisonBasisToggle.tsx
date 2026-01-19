"use client";

import { ComparisonBasis } from "@/lib/types";

interface ComparisonBasisToggleProps {
  comparisonBasis: ComparisonBasis;
  onChange: (basis: ComparisonBasis) => void;
}

export function ComparisonBasisToggle({
  comparisonBasis,
  onChange,
}: ComparisonBasisToggleProps) {
  return (
    <div className="matchweek-toggle">
      <button
        className={`matchweek-toggle__btn ${comparisonBasis === "matchweek" ? "matchweek-toggle__btn--active" : ""}`}
        onClick={() => onChange("matchweek")}
        type="button"
      >
        By Matchweek
      </button>
      <button
        className={`matchweek-toggle__btn ${comparisonBasis === "matches-played" ? "matchweek-toggle__btn--active" : ""}`}
        onClick={() => onChange("matches-played")}
        type="button"
      >
        By Matches Played
      </button>
    </div>
  );
}
