import StandingsContent from "./StandingsContent";
import { getCurrentSeasonShort } from "@/lib/utils/season-utils";

export const metadata = {
  title: `Standings - Premier League Tracker ${getCurrentSeasonShort()}`,
  description: `Check the current Premier League standings for the ${getCurrentSeasonShort()} season. View team positions, points, goal difference, wins, draws, losses, and more.`,
  keywords: ["Premier League standings", "league table", "points table", "team rankings", "EPL table", getCurrentSeasonShort()],
  openGraph: {
    title: `Standings - Premier League Tracker ${getCurrentSeasonShort()}`,
    description: `Check the current Premier League standings for the ${getCurrentSeasonShort()} season.`,
    type: "website",
  },
  twitter: {
    card: "summary",
    title: `Standings - Premier League Tracker ${getCurrentSeasonShort()}`,
    description: `Check the current Premier League standings for the ${getCurrentSeasonShort()} season.`,
  },
};

export default function StandingsPage() {
  return <StandingsContent />;
}

