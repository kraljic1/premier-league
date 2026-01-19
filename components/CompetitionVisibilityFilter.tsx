"use client";

import { useMemo } from "react";
import { CompetitionFilter, type CompetitionOption } from "@/components/CompetitionFilter";

interface CompetitionVisibilityFilterProps {
  options: CompetitionOption[];
  excluded: string[];
  onChange: (excluded: string[]) => void;
}

/**
 * Shows included competitions while storing exclusions.
 */
export function CompetitionVisibilityFilter({
  options,
  excluded,
  onChange
}: CompetitionVisibilityFilterProps) {
  const selected = useMemo(
    () => options.filter((option) => !excluded.includes(option.value)).map((option) => option.value),
    [options, excluded]
  );

  const handleChange = (nextSelected: string[]) => {
    const nextExcluded = options
      .filter((option) => !nextSelected.includes(option.value))
      .map((option) => option.value);
    onChange(nextExcluded);
  };

  return <CompetitionFilter options={options} selected={selected} onChange={handleChange} />;
}
