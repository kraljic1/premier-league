"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { LoadingSpinner } from "./LoadingSpinner";

interface RefreshButtonProps {
  onRefresh?: () => void | Promise<void>;
  isLoading?: boolean;
  className?: string;
}

type RefreshStatus = "idle" | "loading" | "success" | "error" | "rate-limited";

export function RefreshButton({ onRefresh, isLoading, className }: RefreshButtonProps) {
  const [internalRefreshing, setInternalRefreshing] = useState(false);
  const [status, setStatus] = useState<RefreshStatus>("idle");
  const queryClient = useQueryClient();

  const isRefreshing = isLoading !== undefined ? isLoading : internalRefreshing;

  const handleRefresh = async () => {
    if (onRefresh) {
      // Use custom refresh logic if provided
      setInternalRefreshing(true);
      setStatus("loading");
      try {
        await onRefresh();
        setStatus("success");
      } catch (error) {
        console.error("Error refreshing:", error);
        setStatus("error");
      } finally {
        setInternalRefreshing(false);
        // Reset status after 3 seconds
        setTimeout(() => setStatus("idle"), 3000);
      }
    } else {
      // Default refresh logic - use force-update endpoint
      setInternalRefreshing(true);
      setStatus("loading");
      try {
        const response = await fetch("/api/force-update", { method: "POST" });
        const data = await response.json();
        
        if (response.status === 429) {
          // Rate limited
          setStatus("rate-limited");
        } else if (response.ok && data.success) {
          setStatus("success");
          // Invalidate all queries to fetch fresh data
          await queryClient.invalidateQueries();
        } else {
          setStatus("error");
          console.error("Refresh failed:", data);
        }
      } catch (error) {
        console.error("Error refreshing:", error);
        setStatus("error");
      } finally {
        setInternalRefreshing(false);
        // Reset status after 3 seconds
        setTimeout(() => setStatus("idle"), 3000);
      }
    }
  };

  // Get button text based on status
  const getButtonText = () => {
    switch (status) {
      case "loading":
        return "Refreshing...";
      case "success":
        return "Updated!";
      case "error":
        return "Failed - Retry?";
      case "rate-limited":
        return "Wait 1 min";
      default:
        return "Refresh Data";
    }
  };

  // Get button style based on status
  const getButtonStyle = () => {
    const baseStyle = "px-4 py-2 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed";
    switch (status) {
      case "success":
        return `${baseStyle} bg-green-600 text-white hover:bg-green-700`;
      case "error":
        return `${baseStyle} bg-red-600 text-white hover:bg-red-700`;
      case "rate-limited":
        return `${baseStyle} bg-yellow-600 text-white cursor-not-allowed`;
      default:
        return `${baseStyle} bg-gray-600 text-white hover:bg-gray-700`;
    }
  };

  return (
    <button
      onClick={handleRefresh}
      disabled={isRefreshing || status === "rate-limited"}
      className={className || getButtonStyle()}
    >
      {isRefreshing && <LoadingSpinner size="sm" className="!p-0" />}
      {getButtonText()}
    </button>
  );
}

