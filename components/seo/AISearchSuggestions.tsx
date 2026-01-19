"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { CLUBS } from "@/lib/clubs";

interface SearchSuggestion {
  query: string;
  type: "fixture" | "club" | "standings" | "comparison";
  relevance: number;
}

/**
 * AI-powered search suggestions component
 * Provides intelligent content recommendations based on user context
 */
export function AISearchSuggestions() {
  const pathname = usePathname();
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);

  useEffect(() => {
    // Generate contextual suggestions based on current page
    const contextualSuggestions = generateContextualSuggestions(pathname);
    setSuggestions(contextualSuggestions);
  }, [pathname]);

  if (suggestions.length === 0) {
    return null;
  }

  return (
    <section 
      className="mt-8 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900 rounded-lg border border-purple-200 dark:border-purple-800 p-6"
      aria-label="AI-powered search suggestions"
    >
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
        <span className="mr-2" aria-hidden="true">🤖</span>
        Smart Suggestions
      </h2>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        Discover related content based on your current page
      </p>
      <ul className="flex flex-wrap gap-2 list-none">
        {suggestions.map((suggestion, index) => (
          <li key={index}>
            <a
              href={getSuggestionUrl(suggestion)}
              className="inline-block px-4 py-2 bg-white dark:bg-gray-800 border border-purple-200 dark:border-purple-700 rounded-full text-sm text-gray-700 dark:text-gray-300 hover:bg-purple-100 dark:hover:bg-purple-900 hover:border-purple-300 dark:hover:border-purple-600 transition-colors"
              aria-label={`Search for ${suggestion.query}`}
            >
              {suggestion.query}
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}

/**
 * Generate contextual search suggestions based on current page
 */
function generateContextualSuggestions(pathname: string): SearchSuggestion[] {
  const suggestions: SearchSuggestion[] = [];

  switch (pathname) {
    case "/":
      suggestions.push(
        { query: "Arsenal fixtures", type: "fixture", relevance: 0.9 },
        { query: "Manchester City standings", type: "standings", relevance: 0.8 },
        { query: "Compare Liverpool vs Chelsea", type: "comparison", relevance: 0.7 }
      );
      break;
    case "/fixtures-results":
      suggestions.push(
        { query: "Next matchweek fixtures", type: "fixture", relevance: 0.9 },
        { query: "Recent results", type: "fixture", relevance: 0.8 },
        { query: "Current standings", type: "standings", relevance: 0.7 }
      );
      break;
    case "/standings":
      suggestions.push(
        { query: "Top teams comparison", type: "comparison", relevance: 0.9 },
        { query: "Upcoming fixtures", type: "fixture", relevance: 0.8 },
        { query: "Goal difference leaders", type: "standings", relevance: 0.7 }
      );
      break;
    default:
      // Generic suggestions
      suggestions.push(
        { query: "Premier League fixtures", type: "fixture", relevance: 0.8 },
        { query: "League standings", type: "standings", relevance: 0.7 },
        { query: "Team comparison", type: "comparison", relevance: 0.6 }
      );
  }

  // Add popular club suggestions
  const popularClubs = Object.values(CLUBS).slice(0, 3);
  popularClubs.forEach(club => {
    suggestions.push({
      query: `${club.name} fixtures`,
      type: "club",
      relevance: 0.6,
    });
  });

  return suggestions.sort((a, b) => b.relevance - a.relevance).slice(0, 6);
}

/**
 * Get URL for search suggestion
 */
function getSuggestionUrl(suggestion: SearchSuggestion): string {
  switch (suggestion.type) {
    case "fixture":
      return "/fixtures-results";
    case "standings":
      return "/standings";
    case "comparison":
      return "/compare-fixtures";
    case "club":
      const clubId = Object.values(CLUBS).find(
        c => suggestion.query.toLowerCase().includes(c.name.toLowerCase())
      )?.id;
      return clubId ? `/club/${clubId}` : "/";
    default:
      return "/";
  }
}
