"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CLUBS } from "@/lib/clubs";

interface ContentHubProps {
  title?: string;
  maxItems?: number;
}

/**
 * Content Hub component for enhanced internal linking
 * Creates topic clusters around Premier League content
 */
export function ContentHub({ title = "Explore Premier League", maxItems = 6 }: ContentHubProps) {
  const pathname = usePathname();

  // Don't show on home page
  if (pathname === "/") {
    return null;
  }

  const hubLinks = [
    {
      title: "All Fixtures & Results",
      href: "/fixtures-results",
      description: "Complete match schedule and results",
      category: "matches",
    },
    {
      title: "Current Standings",
      href: "/standings",
      description: "Live league table and positions",
      category: "standings",
    },
    {
      title: "Compare Fixtures",
      href: "/compare-fixtures",
      description: "Compare team schedules side-by-side",
      category: "comparison",
    },
    {
      title: "Season Comparison",
      href: "/compare-season",
      description: "Analyze performance across seasons",
      category: "analytics",
    },
    ...Object.values(CLUBS)
      .slice(0, maxItems - 4)
      .map(club => ({
        title: `${club.name} Information`,
        href: `/club/${club.id}`,
        description: `View ${club.name} fixtures, results, and stats`,
        category: "clubs",
      })),
  ];

  return (
    <section className="mt-8 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-800 dark:to-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
        {title}
      </h2>
      <p className="text-gray-600 dark:text-gray-400 mb-6">
        Discover more Premier League content and resources
      </p>
      <nav aria-label="Content hub navigation">
        <ul className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 list-none">
          {hubLinks.map((link, index) => (
            <li key={index}>
              <Link
                href={link.href}
                className="block p-3 rounded-md bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-600 hover:shadow-sm transition-all duration-200"
                aria-label={`Navigate to ${link.title}`}
              >
                <span className="font-medium text-gray-900 dark:text-white block mb-1">
                  {link.title}
                </span>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {link.description}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </section>
  );
}
