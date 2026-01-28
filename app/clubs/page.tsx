import { Metadata } from "next";
import { ClubCarousel } from "@/components/club/ClubCarousel";
import { generateMetadata } from "@/lib/seo/metadata";
import { AISearchSuggestions } from "@/components/seo/AISearchSuggestions";
import { ContentHub } from "@/components/seo/ContentHub";

export const metadata: Metadata = generateMetadata({
  title: "Premier League Clubs 2025/2026 - Team Profiles & Information",
  description: "Browse all 20 Premier League clubs for the 2025/2026 season. Explore detailed profiles, history, stadium information, and current squads for Arsenal, Liverpool, Manchester City, and more.",
  path: "/clubs",
  ogImage: { type: "default", title: "Premier League Clubs 2025/2026", subtitle: "Explore Team Profiles" },
  keywords: ["Premier League", "Clubs", "Teams", "Football", "Soccer", "Club Profiles", "2025/2026", "EPL"]
});

export default function ClubsPage() {
  return (
    <main className="max-w-7xl mx-auto px-4 py-12">
      <header className="text-center mb-16">
        <h1 className="text-4xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
          Premier League Clubs 2025/2026
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Discover all 20 Premier League clubs for the 2025/2026 season. Select a team to explore its rich history, iconic stadium, current squad, and latest achievements.
        </p>
      </header>

      <div className="mb-20">
        <ClubCarousel />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mt-12">
        <div>
          <h2 className="text-2xl font-bold mb-6">Premier League 2025/2026 Season</h2>
          <div className="space-y-4 text-gray-700 dark:text-gray-300">
            <p>
              The 2025/2026 Premier League season features 20 elite clubs competing for the title. From the historic terraces of Anfield to the modern marvel of the Tottenham Hotspur Stadium, each team brings its unique character and ambition.
            </p>
            <p>
              Welcome back promoted teams Burnley, Leeds United, and Sunderland alongside established giants like Manchester City, Arsenal, and Liverpool. Stay updated with current squad lists, management staff, and the legendary history that defines each badge.
            </p>
          </div>
        </div>
        <div>
          <AISearchSuggestions />
        </div>
      </div>

      <div className="mt-12">
        <ContentHub title="More to Explore" maxItems={6} />
      </div>
    </main>
  );
}
