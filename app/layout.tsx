import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { Navigation } from "@/components/Navigation";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ServiceWorkerRegistration } from "./sw-register";
import { ClubTheme } from "@/components/ClubTheme";

// Optimize font loading with display swap for better performance
const inter = Inter({
  subsets: ["latin"],
  display: 'swap',
  preload: true,
  variable: '--font-inter'
});

export const metadata: Metadata = {
  title: "Premier League Tracker 2025/26",
  description: "Personal Premier League tracker",
  manifest: "/manifest.json",
  icons: {
    icon: "/icon-192.png",
    shortcut: "/icon-192.png",
    apple: "/icon-192.png",
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

        {/* Preload critical resources */}
        <link rel="preload" href="/icon-192.png" as="image" />
        <link rel="preload" href="/manifest.json" as="fetch" />

        {/* Optimize font display */}
        <link rel="preload" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" as="style" />
      </head>
      <body className={`${inter.variable} ${inter.className}`}>
        <ServiceWorkerRegistration />
        <Providers>
          <ClubTheme />
          <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <header className="header-bar">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-16">
                <h1 className="text-xl font-bold">Premier League Tracker</h1>
                <ThemeToggle />
              </div>
            </header>
            <Navigation />
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              {children}
            </main>
          </div>
        </Providers>
      </body>
    </html>
  );
}

