"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Club } from "@/lib/types";
import { getClubByName } from "@/lib/clubs";

interface ClubLogoProps {
  clubName: string;
  size?: number;
  className?: string;
}

/**
 * Component that displays a club logo next to the club name.
 * First tries to get logo URL from database, then falls back to hardcoded URL.
 * Falls back to club name only if logo is not available.
 */
export function ClubLogo({ clubName, size = 24, className = "" }: ClubLogoProps) {
  const [imageError, setImageError] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const club: Club | undefined = getClubByName(clubName);

  // Fetch logo URL from database
  useEffect(() => {
    async function fetchLogoUrl() {
      if (!club) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/clubs?name=${encodeURIComponent(club.name)}`);
        if (response.ok) {
          const clubs = await response.json();
          const clubData = clubs.find((c: any) => c.name === club.name);
          if (clubData?.logo_url) {
            setLogoUrl(clubData.logo_url);
          } else {
            // Fallback to hardcoded URL
            setLogoUrl(club.logoUrl || null);
          }
        } else {
          // Fallback to hardcoded URL
          setLogoUrl(club.logoUrl || null);
        }
      } catch (error) {
        console.error(`Error fetching logo for ${club.name}:`, error);
        // Fallback to hardcoded URL
        setLogoUrl(club.logoUrl || null);
      } finally {
        setIsLoading(false);
      }
    }

    fetchLogoUrl();
  }, [club]);

  // Use hardcoded URL as immediate fallback while loading
  const displayLogoUrl = logoUrl || club?.logoUrl;

  if (isLoading && !club?.logoUrl) {
    return <span className={className}>{clubName}</span>;
  }

  if (!displayLogoUrl || imageError) {
    return <span className={className}>{clubName}</span>;
  }

  return (
    <div className={`club-logo ${className}`}>
      <Image
        src={displayLogoUrl}
        alt={`${clubName} logo`}
        className="club-logo__image"
        width={size}
        height={size}
        loading="lazy"
        {...(size >= 40 ? {
          placeholder: "blur" as const,
          blurDataURL: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iI2Y5ZmFmYiIvPgo8L3N2Zz4K"
        } : {})}
        onError={() => {
          // Use setTimeout to defer state update and avoid render-time warnings
          setTimeout(() => setImageError(true), 0);
        }}
      />
      <span className="club-logo__name">{clubName}</span>
    </div>
  );
}
