/**
 * Advanced Schema.org markup generator for 2026 SEO standards
 * Includes SportsTeam, LocalBusiness, Speakable, and AI-powered schemas
 */

import { Club } from "@/lib/types";
import { getStadiumByClubName } from "@/lib/stadiums";
import { getCurrentSeasonShort } from "@/lib/utils/season-utils";

export interface SchemaContext {
  baseUrl: string;
  currentSeason: string;
  pathname: string;
}

/**
 * Generate SportsTeam schema for individual clubs
 */
export function generateSportsTeamSchema(club: Club, context: SchemaContext) {
  const stadium = getStadiumByClubName(club.name);
  
  return {
    "@context": "https://schema.org",
    "@type": "SportsTeam",
    "name": club.name,
    "alternateName": club.shortName,
    "sport": "Soccer",
    "league": {
      "@type": "SportsOrganization",
      "name": "Premier League",
      "url": "https://www.premierleague.com"
    },
    "url": `${context.baseUrl}/club/${club.id}`,
    "logo": club.logoUrl,
    "memberOf": {
      "@type": "SportsOrganization",
      "name": "Premier League",
      "sport": "Soccer"
    },
    ...(stadium && {
      "location": {
        "@type": "Place",
        "name": stadium.name,
        "address": {
          "@type": "PostalAddress",
          ...stadium.address
        },
        ...(stadium.geo && {
          "geo": {
            "@type": "GeoCoordinates",
            "latitude": stadium.geo.latitude,
            "longitude": stadium.geo.longitude
          }
        })
      }
    })
  };
}

/**
 * Generate LocalBusiness schema for stadiums
 */
export function generateLocalBusinessSchema(stadiumName: string, clubName: string, baseUrl: string) {
  const stadium = getStadiumByClubName(clubName);
  if (!stadium) return null;

  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": `${baseUrl}/stadium/${stadiumName.toLowerCase().replace(/\s+/g, '-')}`,
    "name": stadium.name,
    "description": `Home stadium of ${clubName} in the Premier League`,
    "address": {
      "@type": "PostalAddress",
      ...stadium.address
    },
    ...(stadium.geo && {
      "geo": {
        "@type": "GeoCoordinates",
        "latitude": stadium.geo.latitude,
        "longitude": stadium.geo.longitude
      }
    }),
    "openingHoursSpecification": {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": ["Saturday", "Sunday"],
      "opens": "12:00",
      "closes": "18:00"
    }
  };
}

/**
 * Generate SportsOrganization schema for Premier League
 */
export function generateSportsOrganizationSchema(context: SchemaContext) {
  return {
    "@context": "https://schema.org",
    "@type": "SportsOrganization",
    "name": "Premier League",
    "alternateName": "English Premier League",
    "url": "https://www.premierleague.com",
    "logo": "https://resources.premierleague.com/premierleague/badges/50/t2.png",
    "sport": "Soccer",
    "description": `The Premier League is the top level of the English football league system. ${context.currentSeason} season.`,
    "foundingDate": "1992",
    "location": {
      "@type": "Country",
      "name": "United Kingdom"
    }
  };
}

/**
 * Generate Speakable schema for voice search optimization
 */
export function generateSpeakableSchema(content: string[]) {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "speakable": {
      "@type": "SpeakableSpecification",
      "cssSelector": [".speakable-content"],
      "xpath": []
    }
  };
}

/**
 * Generate FAQ schema for voice search
 */
export function generateFAQSchema(faqs: Array<{ question: string; answer: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  };
}

/**
 * Generate ItemList schema for standings
 */
export function generateItemListSchema(items: Array<{ name: string; position: number; url?: string }>, listName: string) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": listName,
    "itemListElement": items.map((item, index) => ({
      "@type": "ListItem",
      "position": item.position || index + 1,
      "name": item.name,
      ...(item.url && { "url": item.url })
    }))
  };
}

/**
 * Generate VideoObject schema for future video content
 */
export function generateVideoObjectSchema(video: {
  name: string;
  description: string;
  thumbnailUrl: string;
  uploadDate: string;
  contentUrl: string;
  embedUrl?: string;
}, baseUrl: string) {
  return {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    "name": video.name,
    "description": video.description,
    "thumbnailUrl": video.thumbnailUrl,
    "uploadDate": video.uploadDate,
    "contentUrl": video.contentUrl,
    ...(video.embedUrl && { "embedUrl": video.embedUrl }),
    "publisher": {
      "@type": "Organization",
      "name": "Premier League Tracker",
      "logo": {
        "@type": "ImageObject",
        "url": `${baseUrl}/premier-league-trophy.png`
      }
    }
  };
}

/**
 * Generate AggregateRating schema for user reviews
 */
export function generateAggregateRatingSchema(rating: {
  ratingValue: number;
  bestRating?: number;
  worstRating?: number;
  ratingCount: number;
}) {
  return {
    "@type": "AggregateRating",
    "ratingValue": rating.ratingValue,
    "bestRating": rating.bestRating || 5,
    "worstRating": rating.worstRating || 1,
    "ratingCount": rating.ratingCount
  };
}

/**
 * Generate EventAttendanceMode schema for matches
 */
export function generateEventAttendanceMode(mode: "OnlineEventAttendanceMode" | "OfflineEventAttendanceMode" | "MixedEventAttendanceMode" = "OfflineEventAttendanceMode") {
  return {
    "@type": "EventAttendanceModeEnumeration",
    "@id": `https://schema.org/${mode}`
  };
}
