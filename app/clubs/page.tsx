import { Metadata } from "next";
import { ClubCarousel } from "@/components/club/ClubCarousel";
import { generateMetadata } from "@/lib/seo/metadata";
import { AISearchSuggestions } from "@/components/seo/AISearchSuggestions";
import { ContentHub } from "@/components/seo/ContentHub";

export const metadata: Metadata = generateMetadata({
  title: "Premier League Clubs - Team Profiles & Information",
  description: "Browse all Premier League clubs. Explore detailed profiles, history, stadium information, and current squads for every team in the league.",
  path: "/clubs",
  ogImage: { type: "default", title: "Premier League Clubs", subtitle: "Explore Team Profiles" },
  keywords: ["Premier League", "Clubs", "Teams", "Football", "Soccer", "Club Profiles"]
});

export default function ClubsPage() {
  return (
    <main className="max-w-7xl mx-auto px-4 py-12">
      <header className="text-center mb-16">
        <h1 className="text-4xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
          Premier League Clubs
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Select a club to explore its rich history, iconic stadium, current squad, and latest achievements.
        </p>
      </header>

      <div className="mb-20">
        <ClubCarousel />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mt-12">
        <div>
          <h2 className="text-2xl font-bold mb-6">Why Follow Your Club?</h2>
          <div className="space-y-4 text-gray-700 dark:text-gray-300">
            <p>
              Our club profiles provide an in-depth look at what makes each Premier League team unique. From the historic terraces of Anfield to the modern marvel of the Tottenham Hotspur Stadium.
            </p>
            <p>
              Stay updated with current squad lists, management staff, and the legendary history that defines each badge.
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
