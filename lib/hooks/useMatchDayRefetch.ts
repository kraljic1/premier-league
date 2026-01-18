import { useState, useEffect, useMemo } from 'react';

/**
 * Hook to determine if we're in a match day period and calculate refetch interval
 * 
 * Match day periods (Premier League typical schedule):
 * - Saturday: 12:30 - 22:30 UTC (main match day)
 * - Sunday: 14:00 - 22:30 UTC (secondary match day)
 * - Midweek: Tuesday/Wednesday 19:00 - 22:30 UTC
 * - Friday: 20:00 - 22:30 UTC (occasional)
 * - Monday: 20:00 - 22:30 UTC (occasional)
 * 
 * During match day periods, we refetch more frequently to keep data fresh
 */

interface MatchDayRefetchConfig {
  /** Whether we're currently in a match day period */
  isMatchDay: boolean;
  /** Refetch interval in milliseconds (0 = no auto refetch) */
  refetchInterval: number;
  /** Stale time in milliseconds */
  staleTime: number;
  /** Human-readable status for debugging */
  status: string;
}

/**
 * Check if current time is within match day hours
 */
function isWithinMatchHours(): { isMatchDay: boolean; status: string } {
  const now = new Date();
  const dayOfWeek = now.getUTCDay(); // 0 = Sunday, 6 = Saturday
  const hour = now.getUTCHours();
  
  // Saturday: 12:30 - 23:00 UTC (main match day)
  if (dayOfWeek === 6 && hour >= 12 && hour <= 23) {
    return { isMatchDay: true, status: 'Saturday match day' };
  }
  
  // Sunday: 12:00 - 23:00 UTC (secondary match day)
  if (dayOfWeek === 0 && hour >= 12 && hour <= 23) {
    return { isMatchDay: true, status: 'Sunday match day' };
  }
  
  // Tuesday: 18:30 - 23:00 UTC (midweek)
  if (dayOfWeek === 2 && hour >= 18 && hour <= 23) {
    return { isMatchDay: true, status: 'Tuesday midweek' };
  }
  
  // Wednesday: 18:30 - 23:00 UTC (midweek)
  if (dayOfWeek === 3 && hour >= 18 && hour <= 23) {
    return { isMatchDay: true, status: 'Wednesday midweek' };
  }
  
  // Friday: 19:30 - 23:00 UTC (occasional)
  if (dayOfWeek === 5 && hour >= 19 && hour <= 23) {
    return { isMatchDay: true, status: 'Friday match' };
  }
  
  // Monday: 19:30 - 23:00 UTC (occasional)
  if (dayOfWeek === 1 && hour >= 19 && hour <= 23) {
    return { isMatchDay: true, status: 'Monday match' };
  }
  
  // Post-match period (22:00 - 02:00 UTC any day) - for catching late updates
  if (hour >= 22 || hour <= 2) {
    return { isMatchDay: true, status: 'Post-match period' };
  }
  
  return { isMatchDay: false, status: 'Off-season/non-match hours' };
}

/**
 * Hook to get match day aware refetch configuration
 * 
 * Usage:
 * ```tsx
 * const { refetchInterval, staleTime, isMatchDay } = useMatchDayRefetch();
 * 
 * const { data } = useQuery({
 *   queryKey: ['fixtures'],
 *   queryFn: fetchFixtures,
 *   refetchInterval,
 *   staleTime,
 * });
 * ```
 */
export function useMatchDayRefetch(): MatchDayRefetchConfig {
  const [config, setConfig] = useState<MatchDayRefetchConfig>(() => {
    const { isMatchDay, status } = isWithinMatchHours();
    return {
      isMatchDay,
      // During match day: refetch every 5 minutes
      // Outside match day: no auto refetch (rely on stale time)
      refetchInterval: isMatchDay ? 5 * 60 * 1000 : 0,
      // During match day: shorter stale time (2 minutes)
      // Outside match day: longer stale time (30 minutes)
      staleTime: isMatchDay ? 2 * 60 * 1000 : 30 * 60 * 1000,
      status,
    };
  });
  
  useEffect(() => {
    // Check every 5 minutes if we've entered/exited match day period
    const checkInterval = setInterval(() => {
      const { isMatchDay, status } = isWithinMatchHours();
      setConfig(prev => {
        // Only update if status changed
        if (prev.isMatchDay !== isMatchDay) {
          return {
            isMatchDay,
            refetchInterval: isMatchDay ? 5 * 60 * 1000 : 0,
            staleTime: isMatchDay ? 2 * 60 * 1000 : 30 * 60 * 1000,
            status,
          };
        }
        return prev;
      });
    }, 5 * 60 * 1000); // Check every 5 minutes
    
    return () => clearInterval(checkInterval);
  }, []);
  
  return config;
}

/**
 * Get static match day config (for server-side or non-reactive use)
 */
export function getMatchDayRefetchConfig(): MatchDayRefetchConfig {
  const { isMatchDay, status } = isWithinMatchHours();
  return {
    isMatchDay,
    refetchInterval: isMatchDay ? 5 * 60 * 1000 : 0,
    staleTime: isMatchDay ? 2 * 60 * 1000 : 30 * 60 * 1000,
    status,
  };
}
