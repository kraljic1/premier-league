import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { Navigation } from "@/components/Navigation";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Footer } from "@/components/Footer";
import { ServiceWorkerRegistration } from "./sw-register";
import { ClubTheme } from "@/components/ClubTheme";
import { PortalFix } from "@/components/PortalFix";
import { GoogleAnalytics } from "@/components/GoogleAnalytics";
import { CookieConsent } from "@/components/CookieConsent";

// Optimize font loading with display swap for better performance
const inter = Inter({
  subsets: ["latin"],
  display: 'swap',
  preload: true,
  variable: '--font-inter'
});

export const metadata: Metadata = {
  title: "Premier League Tracker 2025/26",
  description: "Track Premier League fixtures, results, standings, and top scorers. Compare club schedules and stay updated with the latest match information.",
  keywords: ["Premier League", "football", "soccer", "fixtures", "results", "standings", "top scorers", "EPL"],
  authors: [{ name: "Premier League Tracker" }],
  creator: "Premier League Tracker",
  publisher: "Premier League Tracker",
  manifest: "/manifest.json",
  icons: {
    icon: "/icon-192.png",
    shortcut: "/icon-192.png",
    apple: "/icon-192.png",
  },
  openGraph: {
    type: "website",
    title: "Premier League Tracker 2025/26",
    description: "Track Premier League fixtures, results, standings, and top scorers.",
    siteName: "Premier League Tracker",
    url: "https://premierleaguefixures.com",
  },
  alternates: {
    canonical: "https://premierleaguefixures.com",
  },
  twitter: {
    card: "summary",
    title: "Premier League Tracker 2025/26",
    description: "Track Premier League fixtures, results, standings, and top scorers.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export const viewport: Viewport = {
  themeColor: "#000000",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Resource hints for better performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://upload.wikimedia.org" />
        <link rel="preconnect" href="https://resources.premierleague.com" />
        <link rel="dns-prefetch" href="https://supabase.co" />
      </head>
      <body className={`${inter.variable} ${inter.className}`} suppressHydrationWarning>
        <PortalFix />
        <ServiceWorkerRegistration />
        {process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID && (
          <GoogleAnalytics measurementId={process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID} />
        )}
        <CookieConsent />
        <Providers>
          <ClubTheme />
          <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <header className="header-bar">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-16">
                <div className="flex items-center">
                  <img
                    src="/premier-league-trophy.png"
                    alt="Premier League Trophy"
                    className="h-10 w-10 mr-3 object-contain"
                  />
                  <h1 className="text-xl font-bold">Premier League Tracker</h1>
                </div>
                <ThemeToggle />
              </div>
            </header>
            <Navigation />
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              {children}
            </main>
            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  );
}

