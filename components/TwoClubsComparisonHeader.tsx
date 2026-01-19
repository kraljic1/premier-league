"use client";

interface TwoClubsComparisonHeaderProps {
  onClose: () => void;
}

export function TwoClubsComparisonHeader({ onClose }: TwoClubsComparisonHeaderProps) {
  return (
    <div className="two-clubs-comparison__header">
      <h2 className="two-clubs-comparison__title">Compare Two Clubs</h2>
      <button
        onClick={onClose}
        className="two-clubs-comparison__close"
        aria-label="Close comparison"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
