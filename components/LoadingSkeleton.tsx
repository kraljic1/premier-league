"use client";

import { LoadingSpinner } from "./LoadingSpinner";

export function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      <LoadingSpinner size="lg" />
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg"
            ></div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function TableSkeleton() {
  return (
    <div className="space-y-4">
      <LoadingSpinner size="lg" />
      <div className="animate-pulse">
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="h-12 bg-gray-200 dark:bg-gray-700 rounded"
            ></div>
          ))}
        </div>
      </div>
    </div>
  );
}

