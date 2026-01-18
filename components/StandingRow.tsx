import { useState } from "react";
import { Standing, Club } from "@/lib/types";
import { getClubByName } from "@/lib/clubs";

type ClubWithLogo = Club & { logoUrlFromDb?: string | null };

type StandingRowProps = {
  standing: Standing;
  clubs: Record<string, ClubWithLogo>;
  formOverride?: string;
};

function getFormColor(result: string): string {
  switch (result) {
    case "W":
      return "bg-green-500";
    case "D":
      return "bg-yellow-500";
    case "L":
      return "bg-red-500";
    default:
      return "bg-gray-300";
  }
}

export function StandingRow({ standing, clubs, formOverride }: StandingRowProps) {
  const [imageError, setImageError] = useState(false);

  const positionColors: Record<number, string> = {
    1: "bg-yellow-100 dark:bg-yellow-900/20",
    2: "bg-gray-100 dark:bg-gray-800",
    3: "bg-orange-100 dark:bg-orange-900/20",
    18: "bg-red-100 dark:bg-red-900/20",
    19: "bg-red-100 dark:bg-red-900/20",
    20: "bg-red-100 dark:bg-red-900/20",
  };

  // Find club data and get logo URL with proper fallback chain
  const clubEntry = Object.values(clubs).find((club) => club.name === standing.club);
  const hardcodedClub = getClubByName(standing.club);

  // Try database logo first, then hardcoded logoUrl, then null
  const logoUrl = clubEntry?.logoUrlFromDb || clubEntry?.logoUrl || hardcodedClub?.logoUrl || null;
  const shouldShowPlaceholder = !logoUrl || imageError;

  const formValue = (standing.form || "").trim() || (formOverride || "").trim();
  const formItems = formValue.split("").filter((result) => ["W", "D", "L"].includes(result));

  return (
    <tr
      className={`border-b border-gray-200 dark:border-gray-700 ${
        positionColors[standing.position] || ""
      }`}
    >
      <td className="standings-table__col-pos font-semibold">{standing.position}</td>
      <td className="standings-table__col-club font-medium">
        <div className="standings-row__club">
          {shouldShowPlaceholder ? (
            <div className="standings-row__logo-placeholder">
              {standing.club.charAt(0)}
            </div>
          ) : (
            <img
              src={logoUrl}
              alt={`${standing.club} logo`}
              width={40}
              height={40}
              className="standings-row__logo"
              loading="lazy"
              onError={() => setImageError(true)}
            />
          )}
          <span className="standings-row__club-name">{standing.club}</span>
        </div>
      </td>
      <td className="standings-table__col-stat">{standing.played}</td>
      <td className="standings-table__col-stat">{standing.won}</td>
      <td className="standings-table__col-stat">{standing.drawn}</td>
      <td className="standings-table__col-stat">{standing.lost}</td>
      <td className="standings-table__col-stat">{standing.goalsFor}</td>
      <td className="standings-table__col-stat">{standing.goalsAgainst}</td>
      <td className="standings-table__col-stat">
        {standing.goalDifference > 0 ? "+" : ""}
        {standing.goalDifference}
      </td>
      <td className="standings-table__col-stat font-bold">{standing.points}</td>
      <td className="standings-table__col-form">
        <div className="standings-row__form">
          {formItems.length > 0 ? (
            formItems.map((result, idx) => (
              <div
                key={idx}
                className={`standings-row__form-item ${getFormColor(result)}`}
                title={result === "W" ? "Win" : result === "D" ? "Draw" : "Loss"}
              />
            ))
          ) : (
            <span
              className="text-xs text-gray-400 dark:text-gray-500"
              title="Form data not available"
            >
              -
            </span>
          )}
        </div>
      </td>
    </tr>
  );
}
