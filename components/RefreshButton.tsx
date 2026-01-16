"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { LoadingSpinner } from "./LoadingSpinner";

export function RefreshButton() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const queryClient = useQueryClient();

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await fetch("/api/refresh", { method: "POST" });
      await queryClient.invalidateQueries();
    } catch (error) {
      console.error("Error refreshing:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <button
      onClick={handleRefresh}
      disabled={isRefreshing}
      className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
    >
      {isRefreshing && <LoadingSpinner size="sm" className="!p-0" />}
      {isRefreshing ? "Refreshing..." : "Refresh Data"}
    </button>
  );
}

