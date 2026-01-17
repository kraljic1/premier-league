import FixturesResultsContent from "./FixturesResultsContent";
import { getCurrentSeasonShort } from "@/lib/utils/season-utils";

export const metadata = {
  title: `Fixtures & Results - Premier League Tracker ${getCurrentSeasonShort()}`,
  description: `View all Premier League fixtures and results for the ${getCurrentSeasonShort()} season. Track upcoming matches, live scores, and recent results with detailed match information.`,
  keywords: ["Premier League fixtures", "football results", "match schedule", "live scores", "EPL matches", getCurrentSeasonShort()],
  openGraph: {
    title: `Fixtures & Results - Premier League Tracker ${getCurrentSeasonShort()}`,
    description: `View all Premier League fixtures and results for the ${getCurrentSeasonShort()} season.`,
    type: "website",
  },
  twitter: {
    card: "summary",
    title: `Fixtures & Results - Premier League Tracker ${getCurrentSeasonShort()}`,
    description: `View all Premier League fixtures and results for the ${getCurrentSeasonShort()} season.`,
  },
};

export default function FixturesResultsPage() {
  return <FixturesResultsContent />;
}