"use client";

import { usePathname } from "next/navigation";
import { getCurrentSeasonShort } from "@/lib/utils/season-utils";
import { getStadiumByClubName } from "@/lib/stadiums";
import { CLUBS } from "@/lib/clubs";
import {
  generateSportsTeamSchema,
  generateSportsOrganizationSchema,
  generateLocalBusinessSchema,
  generateSpeakableSchema,
  generateFAQSchema,
  generateItemListSchema,
  generateEventAttendanceMode,
} from "@/lib/seo/schema-generator";

interface StructuredDataProps {
  type?: 'organization' | 'breadcrumb' | 'sports-event' | 'webpage';
  data?: {
    fixtures?: any[];
    standings?: any[];
    clubs?: any[];
  };
}

export function StructuredData({ type = 'organization', data }: StructuredDataProps) {
  const pathname = usePathname();
  const currentSeason = getCurrentSeasonShort();

  const getStructuredData = () => {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://premieleaguematches.com';

    // Organization Schema (always included)
    const organizationSchema = {
      "@context": "https://schema.org",
      "@type": "Organization",
      "name": "Premier League Tracker",
      "url": baseUrl,
      "logo": `${baseUrl}/premier-league-trophy.png`,
      "description": `Track Premier League fixtures, results, standings, and top scorers for the ${currentSeason} season. Compare club schedules and stay updated with the latest match information.`,
      "foundingDate": "2024",
      "sameAs": [
        // Add social media links when available
      ],
      "contactPoint": {
        "@type": "ContactPoint",
        "contactType": "customer service",
        "availableLanguage": "English"
      },
      "publishes": {
        "@type": "WebSite",
        "name": "Premier League Tracker",
        "url": baseUrl,
        "potentialAction": {
          "@type": "SearchAction",
          "target": `${baseUrl}/search?q={search_term_string}`,
          "query-input": "required name=search_term_string"
        }
      }
    };

    // WebSite Schema for better search integration
    const websiteSchema = {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "name": "Premier League Tracker",
      "url": baseUrl,
      "description": `Premier League fixtures, results, and standings for the ${currentSeason} season`,
      "publisher": {
        "@type": "Organization",
        "name": "Premier League Tracker"
      },
      "potentialAction": {
        "@type": "SearchAction",
        "target": `${baseUrl}/search?q={search_term_string}`,
        "query-input": "required name=search_term_string"
      },
      "inLanguage": "en-GB"
    };

    // Breadcrumb Schema
    const breadcrumbSchema: any = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Home",
          "item": baseUrl
        }
      ]
    };

    // Add breadcrumb items based on current path
    if (pathname === '/fixtures-results') {
      breadcrumbSchema.itemListElement.push({
        "@type": "ListItem",
        "position": 2,
        "name": "Fixtures & Results",
        "item": `${baseUrl}/fixtures-results`
      });
    } else if (pathname === '/standings') {
      breadcrumbSchema.itemListElement.push({
        "@type": "ListItem",
        "position": 2,
        "name": "Standings",
        "item": `${baseUrl}/standings`
      });
    } else if (pathname === '/compare-fixtures') {
      breadcrumbSchema.itemListElement.push({
        "@type": "ListItem",
        "position": 2,
        "name": "Compare Fixtures",
        "item": `${baseUrl}/compare-fixtures`
      });
    } else if (pathname === '/compare-season') {
      breadcrumbSchema.itemListElement.push({
        "@type": "ListItem",
        "position": 2,
        "name": "Compare Season",
        "item": `${baseUrl}/compare-season`
      });
    }

    // WebPage Schema
    const webpageSchema = {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "url": `${baseUrl}${pathname}`,
      "name": getPageTitle(pathname),
      "description": getPageDescription(pathname),
      "isPartOf": {
        "@type": "WebSite",
        "name": "Premier League Tracker",
        "url": baseUrl
      },
      "publisher": {
        "@type": "Organization",
        "name": "Premier League Tracker"
      }
    };

    // Sports Event Schema (for fixture data)
    let sportsEventSchemas: any[] = [];
    if (data?.fixtures && Array.isArray(data.fixtures)) {
      sportsEventSchemas = data.fixtures.slice(0, 10).map((fixture: any, index: number) => {
        const eventSchema: any = {
          "@context": "https://schema.org",
          "@type": "SportsEvent",
          "name": `${fixture.homeTeam} vs ${fixture.awayTeam}`,
          "description": `Premier League match between ${fixture.homeTeam} and ${fixture.awayTeam}`,
          "startDate": fixture.date,
          "endDate": new Date(new Date(fixture.date).getTime() + 2 * 60 * 60 * 1000).toISOString(), // Assume 2 hours duration
          "eventStatus": fixture.homeScore !== null && fixture.awayScore !== null ? "https://schema.org/EventCompleted" : "https://schema.org/EventScheduled",
          "location": (() => {
            const stadium = getStadiumByClubName(fixture.homeTeam);
            if (stadium) {
              return {
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
              };
            } else {
              return {
                "@type": "Place",
                "name": `${fixture.homeTeam} Stadium`,
                "address": {
                  "@type": "PostalAddress",
                  "addressCountry": "GB"
                }
              };
            }
          })(),
          "organizer": {
            "@type": "SportsOrganization",
            "name": "Premier League",
            "url": "https://www.premierleague.com",
            "logo": "https://resources.premierleague.com/premierleague/badges/50/t2.png",
            "sport": "Soccer"
          },
          "competitor": [
            {
              "@type": "SportsTeam",
              "name": fixture.homeTeam,
              "sport": "Soccer",
              "league": {
                "@type": "SportsOrganization",
                "name": "Premier League"
              }
            },
            {
              "@type": "SportsTeam",
              "name": fixture.awayTeam,
              "sport": "Soccer",
              "league": {
                "@type": "SportsOrganization",
                "name": "Premier League"
              }
            }
          ],
          "offers": {
            "@type": "Offer",
            "url": `https://premieleaguematches.com/fixtures-results`,
            "availability": "https://schema.org/InStock"
          }
        };

        // Add result if match is completed
        if (fixture.homeScore !== null && fixture.awayScore !== null) {
          eventSchema["result"] = [
            {
              "@type": "SportsEventResult",
              "competitor": fixture.homeTeam,
              "score": fixture.homeScore
            },
            {
              "@type": "SportsEventResult",
              "competitor": fixture.awayTeam,
              "score": fixture.awayScore
            }
          ];
        }

        return eventSchema;
      });
    }

    // League Table Schema (for standings)
    let leagueTableSchema: any = null;
    if (data?.standings && Array.isArray(data.standings)) {
      leagueTableSchema = {
        "@context": "https://schema.org",
        "@type": "SportsEventSeries",
        "name": `Premier League ${currentSeason}`,
        "description": `Premier League standings for the ${currentSeason} season`,
        "organizer": {
          "@type": "Organization",
          "name": "Premier League"
        }
      };
    }

    // SportsOrganization Schema for Premier League
    const context = { baseUrl, currentSeason, pathname };
    const sportsOrganizationSchema = generateSportsOrganizationSchema(context);

    // SportsTeam schemas for all clubs (for better entity recognition)
    const sportsTeamSchemas = Object.values(CLUBS).slice(0, 5).map(club => 
      generateSportsTeamSchema(club, context)
    );

    // LocalBusiness schemas for stadiums (for local SEO)
    const stadiumSchemas = Object.values(CLUBS)
      .slice(0, 3)
      .map(club => {
        const stadium = getStadiumByClubName(club.name);
        return stadium ? generateLocalBusinessSchema(stadium.name, club.name) : null;
      })
      .filter(Boolean);

    // Speakable schema for voice search optimization
    const speakableSchema = generateSpeakableSchema([
      `Premier League ${currentSeason}`,
      "fixtures and results",
      "standings table",
    ]);

    // FAQ schema for voice search
    const faqSchema = generateFAQSchema([
      {
        question: "What is the Premier League?",
        answer: `The Premier League is the top level of the English football league system. The ${currentSeason} season features 20 teams competing for the championship.`
      },
      {
        question: "How can I track Premier League fixtures?",
        answer: "You can track Premier League fixtures, results, and standings on Premier League Tracker. View upcoming matches, check results, and compare team schedules."
      },
      {
        question: "Where can I see Premier League standings?",
        answer: `View the current Premier League standings table for the ${currentSeason} season, including points, goal difference, and league positions for all teams.`
      }
    ]);

    // Enhanced SportsEvent with EventAttendanceMode
    if (sportsEventSchemas.length > 0) {
      sportsEventSchemas.forEach(event => {
        event.eventAttendanceMode = generateEventAttendanceMode("OfflineEventAttendanceMode");
      });
    }

    const schemas: any[] = [
      organizationSchema, 
      websiteSchema, 
      webpageSchema,
      sportsOrganizationSchema,
      ...sportsTeamSchemas,
      ...stadiumSchemas,
      speakableSchema,
      faqSchema,
    ];

    if (breadcrumbSchema.itemListElement.length > 1) {
      schemas.push(breadcrumbSchema);
    }

    if (sportsEventSchemas.length > 0) {
      schemas.push(...sportsEventSchemas);
    }

    if (leagueTableSchema) {
      schemas.push(leagueTableSchema);
    }

    return schemas;
  };

  const getPageTitle = (path: string): string => {
    const baseTitle = `Premier League Tracker ${currentSeason}`;

    switch (path) {
      case '/fixtures-results':
        return `Fixtures & Results - ${baseTitle}`;
      case '/standings':
        return `Standings - ${baseTitle}`;
      case '/compare-fixtures':
        return `Compare Fixtures - ${baseTitle}`;
      case '/compare-season':
        return `Compare Season - ${baseTitle}`;
      default:
        return baseTitle;
    }
  };

  const getPageDescription = (path: string): string => {
    const baseDesc = `Track Premier League fixtures, results, standings, and top scorers for the ${currentSeason} season.`;

    switch (path) {
      case '/fixtures-results':
        return `${baseDesc} View upcoming fixtures and recent match results with live scores.`;
      case '/standings':
        return `${baseDesc} Check current Premier League standings, points, goal difference, and league positions.`;
      case '/compare-fixtures':
        return `${baseDesc} Compare upcoming fixtures between different clubs to plan your match schedule.`;
      case '/compare-season':
        return `${baseDesc} Compare season statistics between clubs including points, goals, and performance metrics.`;
      default:
        return `${baseDesc} Compare club schedules and stay updated with the latest match information.`;
    }
  };

  const structuredData = getStructuredData();

  return (
    <>
      {structuredData.map((schema, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(schema, null, 0)
          }}
        />
      ))}
    </>
  );
}