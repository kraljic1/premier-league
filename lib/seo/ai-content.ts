/**
 * AI-powered content personalization utilities for SEO
 * Provides intelligent content recommendations and personalization
 */

import { Club } from "@/lib/types";

export interface PersonalizedContent {
  title: string;
  description: string;
  url: string;
  relevance: number;
  category: "fixture" | "standings" | "comparison" | "club";
}

/**
 * Generate personalized content recommendations
 */
export function generatePersonalizedContent(
  userPreferences: {
    favoriteClubs?: string[];
    interests?: string[];
  }
): PersonalizedContent[] {
  const recommendations: PersonalizedContent[] = [];

  // Generate recommendations based on favorite clubs
  if (userPreferences.favoriteClubs && userPreferences.favoriteClubs.length > 0) {
    userPreferences.favoriteClubs.forEach(clubName => {
      recommendations.push({
        title: `${clubName} Fixtures & Results`,
        description: `Track all ${clubName} matches, results, and upcoming fixtures`,
        url: `/club/${clubName.toLowerCase().replace(/\s+/g, '-')}`,
        relevance: 0.9,
        category: "club",
      });
    });
  }

  // Generate recommendations based on interests
  if (userPreferences.interests) {
    if (userPreferences.interests.includes("standings")) {
      recommendations.push({
        title: "Current Premier League Standings",
        description: "View the latest league table and team positions",
        url: "/standings",
        relevance: 0.8,
        category: "standings",
      });
    }

    if (userPreferences.interests.includes("comparison")) {
      recommendations.push({
        title: "Compare Team Schedules",
        description: "Compare fixtures between different clubs",
        url: "/compare-fixtures",
        relevance: 0.8,
        category: "comparison",
      });
    }
  }

  return recommendations.sort((a, b) => b.relevance - a.relevance);
}

/**
 * Generate AI-optimized meta description
 */
export function generateAIMetaDescription(
  pageType: string,
  context?: {
    clubName?: string;
    season?: string;
    matchCount?: number;
  }
): string {
  const baseDescription = "Track Premier League fixtures, results, standings, and top scorers.";

  switch (pageType) {
    case "home":
      return `${baseDescription} Compare club schedules and stay updated with the latest match information.`;
    case "fixtures":
      return `${baseDescription} View upcoming fixtures and recent match results with live scores.`;
    case "standings":
      return `${baseDescription} Check current Premier League standings, points, goal difference, and league positions.`;
    case "club":
      if (context?.clubName) {
        return `Track ${context.clubName} fixtures, results, and performance in the Premier League. View upcoming matches and recent results.`;
      }
      return baseDescription;
    default:
      return baseDescription;
  }
}

/**
 * Generate conversational content for voice search
 */
export function generateConversationalContent(question: string): string {
  const conversationalAnswers: Record<string, string> = {
    "what is the premier league": "The Premier League is the top level of the English football league system, featuring 20 teams competing for the championship.",
    "when does the premier league start": "The Premier League season typically starts in August and runs through May, with matches played on weekends and some midweek fixtures.",
    "who is leading the premier league": "Check our standings page for the current Premier League leader and complete league table.",
    "what are the upcoming fixtures": "View all upcoming Premier League fixtures on our fixtures and results page, organized by matchweek.",
  };

  const normalizedQuestion = question.toLowerCase().trim();
  
  for (const [key, answer] of Object.entries(conversationalAnswers)) {
    if (normalizedQuestion.includes(key)) {
      return answer;
    }
  }

  return "Visit Premier League Tracker to find information about fixtures, results, standings, and team comparisons.";
}
