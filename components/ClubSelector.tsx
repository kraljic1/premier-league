"use client";

import { useAppStore } from "@/lib/store";
import { CLUBS } from "@/lib/clubs";

export function ClubSelector() {
  const { myClubs, primaryClub, addClub, removeClub, setPrimaryClub } =
    useAppStore();

  const handleToggleClub = (clubId: string) => {
    if (myClubs.includes(clubId)) {
      removeClub(clubId);
    } else {
      if (myClubs.length < 5) {
        addClub(clubId);
      }
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">My Clubs (max 5)</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {Object.values(CLUBS).map((club) => {
          const isSelected = myClubs.includes(club.id);
          const isPrimary = primaryClub === club.id;
          const isDisabled = !isSelected && myClubs.length >= 5;

          return (
            <div
              key={club.id}
              className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                isSelected
                  ? isPrimary
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                    : "border-green-500 bg-green-50 dark:bg-green-900/20"
                  : "border-gray-200 dark:border-gray-700"
              } ${isDisabled ? "opacity-50 cursor-not-allowed" : ""}`}
              onClick={() => !isDisabled && handleToggleClub(club.id)}
            >
              <div className="text-sm font-medium">{club.shortName}</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                {club.name}
              </div>
              {isPrimary && (
                <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                  Primary
                </div>
              )}
            </div>
          );
        })}
      </div>
      {myClubs.length > 0 && (
        <div className="mt-4">
          <label className="text-sm font-medium">Set Primary Club:</label>
          <select
            value={primaryClub || ""}
            onChange={(e) => setPrimaryClub(e.target.value || null)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
          >
            <option value="">None</option>
            {myClubs.map((clubId) => {
              const club = CLUBS[clubId];
              return (
                <option key={clubId} value={clubId}>
                  {club.name}
                </option>
              );
            })}
          </select>
        </div>
      )}
    </div>
  );
}

