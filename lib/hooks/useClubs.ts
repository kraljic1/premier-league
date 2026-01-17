"use client";

import { useState, useEffect } from 'react';
import { CLUBS } from '@/lib/clubs';
import { Club } from '@/lib/types';

/**
 * Hook to fetch clubs with logo URLs from database
 * Falls back to hardcoded CLUBS if database is unavailable
 */
interface ClubWithLogo extends Club {
  logoUrlFromDb?: string | null;
}

export function useClubs() {
  const [clubs, setClubs] = useState<Record<string, ClubWithLogo>>(CLUBS as Record<string, ClubWithLogo>);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchClubs() {
      try {
        const response = await fetch('/api/clubs');
        if (response.ok) {
          const clubsFromDb = await response.json();
          
          // Merge database clubs with hardcoded CLUBS
          const mergedClubs: Record<string, ClubWithLogo> = {};
          
          // Copy all hardcoded clubs first
          Object.entries(CLUBS).forEach(([key, club]) => {
            mergedClubs[key] = { ...club };
          });
          
          // Update with database logo URLs
          clubsFromDb.forEach((dbClub: { name: string; logo_url: string | null }) => {
            const clubKey = Object.keys(CLUBS).find(
              key => CLUBS[key]?.name === dbClub.name
            );
            
            if (clubKey && mergedClubs[clubKey]) {
              mergedClubs[clubKey] = {
                ...mergedClubs[clubKey],
                logoUrlFromDb: dbClub.logo_url,
              };
            }
          });
          
          setClubs(mergedClubs);
        }
      } catch (error) {
        console.error('Error fetching clubs:', error);
        // Keep hardcoded CLUBS as fallback
      } finally {
        setIsLoading(false);
      }
    }

    fetchClubs();
    return undefined;
  }, []);

  return { clubs, isLoading };
}
