"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface RelatedLink {
  title: string;
  description: string;
  href: string;
  icon?: string;
}

export function RelatedContent() {
  const pathname = usePathname();

  const getRelatedLinks = (): RelatedLink[] => {
    switch (pathname) {
      case "/":
        return [
          {
            title: "Fixtures & Results",
            description: "View all upcoming matches and recent results",
            href: "/fixtures-results",
            icon: "📅"
          },
          {
            title: "Premier League Standings",
            description: "Check current team positions and points",
            href: "/standings",
            icon: "🏆"
          },
          {
            title: "Compare Fixtures",
            description: "Compare schedules between different clubs",
            href: "/compare-fixtures",
            icon: "⚖️"
          },
          {
            title: "Season Comparison",
            description: "Compare team performance across seasons",
            href: "/compare-season",
            icon: "📊"
          }
        ];

      case "/fixtures-results":
        return [
          {
            title: "Live Standings",
            description: "See how teams are performing this season",
            href: "/standings",
            icon: "📈"
          },
          {
            title: "Compare Team Schedules",
            description: "Plan your match viewing by comparing fixtures",
            href: "/compare-fixtures",
            icon: "⚖️"
          }
        ];

      case "/standings":
        return [
          {
            title: "Upcoming Fixtures",
            description: "See what matches are coming up next",
            href: "/fixtures-results",
            icon: "📅"
          },
          {
            title: "Compare Performance",
            description: "Analyze how teams compare across seasons",
            href: "/compare-season",
            icon: "📊"
          },
          {
            title: "Fixture Planning",
            description: "Plan ahead by comparing team schedules",
            href: "/compare-fixtures",
            icon: "⚖️"
          }
        ];

      case "/compare-fixtures":
        return [
          {
            title: "Current Standings",
            description: "Check the latest league positions",
            href: "/standings",
            icon: "🏆"
          },
          {
            title: "All Fixtures",
            description: "View complete fixture list and results",
            href: "/fixtures-results",
            icon: "📅"
          },
          {
            title: "Season Analytics",
            description: "Deep dive into team performance data",
            href: "/compare-season",
            icon: "📊"
          }
        ];

      case "/compare-season":
        return [
          {
            title: "Live Standings",
            description: "Current league table and positions",
            href: "/standings",
            icon: "📈"
          },
          {
            title: "Fixture Comparison",
            description: "Compare upcoming match schedules",
            href: "/compare-fixtures",
            icon: "⚖️"
          },
          {
            title: "Match Results",
            description: "View all completed fixtures and scores",
            href: "/fixtures-results",
            icon: "📅"
          }
        ];

      default:
        return [];
    }
  };

  const relatedLinks = getRelatedLinks();

  if (relatedLinks.length === 0) {
    return null;
  }

  return (
    <section className="mt-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
        Related Content
      </h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {relatedLinks.map((link, index) => (
          <Link
            key={index}
            href={link.href}
            className="group block p-4 rounded-lg border border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-md transition-all duration-200"
          >
            <div className="flex items-start space-x-3">
              {link.icon && (
                <span className="text-2xl flex-shrink-0" role="img" aria-label={link.title}>
                  {link.icon}
                </span>
              )}
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {link.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {link.description}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}