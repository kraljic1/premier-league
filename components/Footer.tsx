"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export function Footer() {
  const [mounted, setMounted] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>("");

  useEffect(() => {
    setMounted(true);
    // Only set date on client-side to prevent hydration mismatch
    const now = new Date();
    setLastUpdated(now.toLocaleDateString());
  }, []);

  return (
    <footer className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 mt-16" itemScope itemType="https://schema.org/Organization">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center space-y-6">
          {/* About Section */}
          <section aria-labelledby="about-heading">
            <h2 id="about-heading" className="sr-only">About Premier League Tracker</h2>
            <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm max-w-3xl mx-auto leading-relaxed px-4" itemProp="description">
              This site is made for fun and for crazy Premier League fans who follow their club daily
              and the events around it, and they need some tool to make it easier to compare matches with other clubs.
              All data is sourced from official Premier League channels and updated regularly.
            </p>
          </section>

          {/* Social Links */}
          <div className="flex justify-center space-x-6">
            <Link
              href="https://www.facebook.com/profile.php?id=61568479925178"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors"
              aria-label="Facebook"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
            </Link>

            <Link
              href="https://www.instagram.com/code_sail_web.design/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-500 hover:text-pink-600 dark:text-gray-400 dark:hover:text-pink-400 transition-colors"
              aria-label="Instagram"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
            </Link>
          </div>

          {/* Footer Navigation */}
          <nav aria-label="Footer navigation" className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <div className="flex flex-wrap justify-center gap-6 text-sm">
              <Link
                href="/"
                className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                Home
              </Link>
              <Link
                href="/fixtures-results"
                className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                Fixtures & Results
              </Link>
              <Link
                href="/standings"
                className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                Standings
              </Link>
              <Link
                href="/compare-fixtures"
                className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                Compare Fixtures
              </Link>
              <Link
                href="/compare-season"
                className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                Compare Season
              </Link>
            </div>
          </nav>

          {/* Copyright and Attribution */}
          <div className="space-y-2">
            <p className="text-gray-500 dark:text-gray-500 text-xs px-4">
              © 2026 Premier League Tracker. Made with ❤️ for football fans by{" "}
              <Link
                href="https://codeandsail.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors font-medium"
                itemProp="founder"
              >
                Code&Sail
              </Link>
              .
            </p>
            <p className="text-gray-400 dark:text-gray-600 text-xs px-4">
              {mounted ? (
                <time dateTime={new Date().toISOString()}>{lastUpdated}</time>
              ) : (
                <span>Data last updated: Loading...</span>
              )}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}