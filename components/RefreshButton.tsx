"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { LoadingSpinner } from "./LoadingSpinner";

interface RefreshButtonProps {
  onRefresh?: () => void | Promise<void>;
  isLoading?: boolean;
  className?: string;
}

export function RefreshButton({ onRefresh, isLoading, className }: RefreshButtonProps) {
  const [internalRefreshing, setInternalRefreshing] = useState(false);
  const queryClient = useQueryClient();

  const isRefreshing = isLoading !== undefined ? isLoading : internalRefreshing;

  const handleRefresh = async () => {
    if (onRefresh) {
      // Use custom refresh logic if provided
      setInternalRefreshing(true);
      try {
        await onRefresh();
      } catch (error) {
        console.error("Error refreshing:", error);
      } finally {
        setInternalRefreshing(false);
      }
    } else {
      // Default refresh logic
      setInternalRefreshing(true);
      try {
        await fetch("/api/refresh", { method: "POST" });
        await queryClient.invalidateQueries();
      } catch (error) {
        console.error("Error refreshing:", error);
      } finally {
        setInternalRefreshing(false);
      }
    }
  };

  return (
    <button
      onClick={handleRefresh}
      disabled={isRefreshing}
      className={className || "px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"}
    >
      {isRefreshing && <LoadingSpinner size="sm" className="!p-0" />}
      {isRefreshing ? "Refreshing..." : "Refresh Data"}
    </button>
  );
}

