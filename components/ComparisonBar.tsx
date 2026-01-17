"use client";

import { memo } from "react";

interface ComparisonBarProps {
  label: string;
  valueA: number;
  valueB: number;
  clubA: string;
  clubB: string;
  lowerIsBetter?: boolean;
}

export const ComparisonBar = memo(function ComparisonBar({
  label,
  valueA,
  valueB,
  lowerIsBetter = false,
}: ComparisonBarProps) {
  const total = valueA + valueB || 1;
  const percentA = (valueA / total) * 100;
  const percentB = (valueB / total) * 100;

  const isABetter = lowerIsBetter ? valueA < valueB : valueA > valueB;
  const isBBetter = lowerIsBetter ? valueB < valueA : valueB > valueA;

  return (
    <div className="comparison-bar">
      <div className="comparison-bar__label">{label}</div>
      <div className="comparison-bar__content">
        <span
          className={`comparison-bar__value comparison-bar__value--left ${
            isABetter ? "comparison-bar__value--winner" : ""
          }`}
        >
          {valueA}
        </span>
        <div className="comparison-bar__bar">
          <div
            className={`comparison-bar__fill comparison-bar__fill--left ${
              isABetter ? "comparison-bar__fill--winner" : ""
            }`}
            style={{ width: `${percentA}%` }}
          />
          <div
            className={`comparison-bar__fill comparison-bar__fill--right ${
              isBBetter ? "comparison-bar__fill--winner" : ""
            }`}
            style={{ width: `${percentB}%` }}
          />
        </div>
        <span
          className={`comparison-bar__value comparison-bar__value--right ${
            isBBetter ? "comparison-bar__value--winner" : ""
          }`}
        >
          {valueB}
        </span>
      </div>
    </div>
  );
});
