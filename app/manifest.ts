import { MetadataRoute } from "next";
import { getCurrentSeasonShort } from "@/lib/utils/season-utils";

// Get current season dynamically (auto-updates each year)
const currentSeason = getCurrentSeasonShort();

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `Premier League Tracker ${currentSeason}`,
    short_name: "PL Tracker",
    description: "Personal Premier League tracker",
    start_url: "/",
    display: "standalone",
    background_color: "#000000",
    theme_color: "#000000",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}

