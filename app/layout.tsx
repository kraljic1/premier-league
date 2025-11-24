import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { Navigation } from "@/components/Navigation";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ServiceWorkerRegistration } from "./sw-register";
import { ClubTheme } from "@/components/ClubTheme";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Premier League Tracker 2025/26",
  description: "Personal Premier League tracker",
  manifest: "/manifest.json",
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
      <body className={inter.className}>
        <ServiceWorkerRegistration />
        <Providers>
          <ClubTheme />
          <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <header
              className="border-b border-gray-200 dark:border-gray-800"
              style={{
                backgroundColor: "var(--club-primary)",
                color: "var(--club-text)",
              }}
            >
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

