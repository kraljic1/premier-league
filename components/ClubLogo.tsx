"use client";

import { useState, useEffect, memo } from "react";
import { Club } from "@/lib/types";
import { getClubByName } from "@/lib/clubs";
import { SafeImage } from "@/components/SafeImage";

interface ClubLogoProps {
  clubName: string;
  size?: number;
  className?: string;
  logoUrl?: string | null; // Optional: if provided, skip API call
}

/**
 * Component that displays a club logo next to the club name.
 * If logoUrl prop is provided, uses it directly (no API call).
 * Otherwise, fetches logo URL from database, then falls back to hardcoded URL.
 * Falls back to club name only if logo is not available.
 */
export const ClubLogo = memo(function ClubLogo({ clubName, size = 24, className = "", logoUrl: providedLogoUrl }: ClubLogoProps) {
  const [imageError, setImageError] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(providedLogoUrl || null);
  const [isLoading, setIsLoading] = useState(!providedLogoUrl);
  const club: Club | undefined = getClubByName(clubName);

  // Fetch logo URL from database only if not provided via prop
  useEffect(() => {
    // Skip API call if logoUrl was provided via prop
    if (providedLogoUrl !== undefined) {
      setIsLoading(false);
      return;
    }

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
  }, [club, providedLogoUrl]);

  // Use provided logoUrl, fetched logoUrl, or hardcoded URL as fallback
  const displayLogoUrl = providedLogoUrl || logoUrl || club?.logoUrl;

  if (isLoading && !club?.logoUrl) {
    return <span className={className}>{clubName}</span>;
  }

  if (!displayLogoUrl || imageError) {
    return <span className={className}>{clubName}</span>;
  }

  // Normalize URL - ensure it's properly formatted
  const normalizedUrl = displayLogoUrl 
    ? (displayLogoUrl.includes('%25') ? decodeURIComponent(displayLogoUrl) : displayLogoUrl)
    : null;

  if (!normalizedUrl) {
    return <span className={className}>{clubName}</span>;
  }

  const isSvg = normalizedUrl.endsWith('.svg') || normalizedUrl.includes('.svg');

  return (
    <div className={`club-logo ${className}`}>
      <SafeImage
        src={normalizedUrl}
        alt={`${clubName} logo`}
        className="club-logo__image"
        width={size}
        height={size}
        loading="lazy"
        unoptimized={isSvg}
      />
      <span className="club-logo__name">{clubName}</span>
    </div>
  );
});
