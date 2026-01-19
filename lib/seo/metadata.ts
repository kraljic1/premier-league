/**
 * SEO metadata utilities for 2026 standards
 * Generates dynamic Open Graph images and enhanced metadata
 */

import { Metadata } from "next";
import { getCurrentSeasonShort } from "@/lib/utils/season-utils";

export interface OGImageConfig {
  type?: "default" | "match" | "club" | "standings";
  title?: string;
  subtitle?: string;
  season?: string;
}

/**
 * Generate dynamic Open Graph image URL
 */
export function generateOGImageUrl(config: OGImageConfig = {}): string {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://premierleaguematches.com";
  const season = config.season || getCurrentSeasonShort();
  
  const params = new URLSearchParams({
    type: config.type || "default",
    ...(config.title && { title: config.title }),
    ...(config.subtitle && { subtitle: config.subtitle }),
    season,
  });

  return `${baseUrl}/api/og?${params.toString()}`;
}

/**
 * Generate enhanced metadata with dynamic OG images
 */
export function generateMetadata(config: {
  title: string;
  description: string;
  path?: string;
  ogImage?: OGImageConfig;
  keywords?: string[];
}): Metadata {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://premierleaguematches.com";
  const url = config.path ? `${baseUrl}${config.path}` : baseUrl;
  const ogImage = generateOGImageUrl(config.ogImage || { type: "default", title: config.title });

  return {
    title: config.title,
    description: config.description,
    keywords: config.keywords || ["Premier League", "football", "soccer"],
    authors: [{ name: "Premier League Tracker" }],
    creator: "Premier League Tracker",
    publisher: "Premier League Tracker",
    alternates: {
      canonical: url,
    },
    openGraph: {
      type: "website",
      title: config.title,
      description: config.description,
      siteName: "Premier League Tracker",
      url,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: config.title,
        },
      ],
      locale: "en_GB",
    },
    twitter: {
      card: "summary_large_image",
      title: config.title,
      description: config.description,
      images: [ogImage],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
  };
}
