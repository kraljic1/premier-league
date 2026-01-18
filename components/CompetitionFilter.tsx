"use client";

export type CompetitionOption = {
  id: string;
  label: string;
  value: string;
};

interface CompetitionFilterProps {
  options: CompetitionOption[];
  selected: string[];
  onChange: (selected: string[]) => void;
}

/**
 * Checkbox filter for selecting which competitions to include.
 */
export function CompetitionFilter({
  options,
  selected,
  onChange
}: CompetitionFilterProps) {
  const selectedSet = new Set(selected);

  const handleToggle = (value: string) => {
    const nextSelected = new Set(selectedSet);
    if (nextSelected.has(value)) {
      nextSelected.delete(value);
    } else {
      nextSelected.add(value);
    }
    const orderedSelected = options
      .filter((option) => nextSelected.has(option.value))
      .map((option) => option.value);
    onChange(orderedSelected);
  };

  return (
    <div className="competition-filter">
      <span className="competition-filter__label">Include cups:</span>
      <div className="competition-filter__options">
        {options.map((option) => {
          const inputId = `competition-${option.id}`;
          const isChecked = selectedSet.has(option.value);

          return (
            <label key={option.id} htmlFor={inputId} className="competition-filter__option">
              <input
                id={inputId}
                type="checkbox"
                checked={isChecked}
                onChange={() => handleToggle(option.value)}
                className="competition-filter__checkbox"
              />
              <span className="competition-filter__text">{option.label}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
}
