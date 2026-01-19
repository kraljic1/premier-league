import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Suspense } from "react";
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
import { StructuredData } from "@/components/StructuredData";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { RelatedContent } from "@/components/RelatedContent";
import { BackToTop } from "@/components/BackToTop";
import { CoreWebVitals } from "@/components/performance/CoreWebVitals";
import { getCurrentSeasonShort } from "@/lib/utils/season-utils";

// Optimize font loading with display swap for better performance and CLS prevention
const inter = Inter({
  subsets: ["latin"],
  display: 'swap',
  preload: true,
  fallback: ['system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
  variable: '--font-inter'
});

// Get current season dynamically (auto-updates each year)
const currentSeason = getCurrentSeasonShort();
const pageTitle = `Premier League Tracker ${currentSeason}`;

export const metadata: Metadata = {
  title: pageTitle,
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
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Premier League Tracker",
  },
  other: {
    "mobile-web-app-capable": "yes",
    "format-detection": "telephone=no",
  },
  openGraph: {
    type: "website",
    title: pageTitle,
    description: "Track Premier League fixtures, results, standings, and top scorers.",
    siteName: "Premier League Tracker",
    url: "https://premierleaguematches.com",
    images: [
      {
        url: `/api/og?type=default&title=${encodeURIComponent(pageTitle)}&season=${encodeURIComponent(currentSeason)}`,
        width: 1200,
        height: 630,
        alt: pageTitle,
      },
    ],
    locale: "en_GB",
  },
  alternates: {
    canonical: "https://premierleaguematches.com",
  },
  twitter: {
    card: "summary_large_image",
    title: pageTitle,
    description: "Track Premier League fixtures, results, standings, and top scorers.",
    images: [`/api/og?type=default&title=${encodeURIComponent(pageTitle)}&season=${encodeURIComponent(currentSeason)}`],
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
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: "#37003c",
  colorScheme: "light dark",
  viewportFit: "cover", // iOS notch support
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

        {/* Structured Data for SEO */}
        <StructuredData />
      </head>
      <body className={`${inter.variable} ${inter.className}`} suppressHydrationWarning>
        <PortalFix />
        <ServiceWorkerRegistration />
        {process.env['NEXT_PUBLIC_GA_MEASUREMENT_ID'] && (
          <Suspense fallback={null}>
            <GoogleAnalytics measurementId={process.env['NEXT_PUBLIC_GA_MEASUREMENT_ID']} />
          </Suspense>
        )}
        <CoreWebVitals />
        <CookieConsent />
        <Providers>
          <ClubTheme />
          <div className="min-h-screen">
            <header className="header-bar">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-16">
                <div className="flex items-center min-w-0">
                  <img
                    src="/premier-league-trophy.png"
                    alt="Premier League Trophy - Official championship trophy awarded to the winners of England's top football league"
                    className="h-8 w-8 sm:h-10 sm:w-10 mr-2 sm:mr-3 object-contain flex-shrink-0"
                  />
                  <h1 className="text-base sm:text-xl font-bold truncate">Premier League Tracker</h1>
                </div>
                <ThemeToggle />
              </div>
            </header>
            <Navigation />
            <Breadcrumbs />
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 overflow-x-hidden">
              {children}
            </main>
            <RelatedContent />
            <BackToTop />
            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  );
}

