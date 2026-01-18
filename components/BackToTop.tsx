"use client";

import { useEffect, useState } from "react";

/**
 * BackToTop component - A floating button that appears when user scrolls down
 * and allows smooth scrolling back to the top of the page
 */
export function BackToTop() {
  const [isVisible, setIsVisible] = useState(true); // Always visible for debugging
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    const toggleVisibility = () => {
      // Show button when user scrolls down 300px
      const shouldBeVisible = window.pageYOffset > 300;
      setIsVisible(shouldBeVisible);
      // console.log('Scroll position:', window.pageYOffset, 'Button visible:', shouldBeVisible);
    };

    window.addEventListener("scroll", toggleVisibility);

    // Check initial scroll position
    toggleVisibility();

    return () => window.removeEventListener("scroll", toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return null;
  }

  return (
    <button
      onClick={scrollToTop}
      className={`fixed bottom-8 right-8 p-3 rounded-full shadow-lg transition-all duration-300 z-50 ${
        isVisible
          ? "opacity-100 translate-y-0"
          : "opacity-0 translate-y-4 pointer-events-none"
      }`}
      style={{
        backgroundColor: '#37003c',
        color: '#ffffff',
        border: '1px solid rgba(55, 0, 60, 0.1)'
      }}
      aria-label="Scroll to top"
      title="Back to top"
    >
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M18 15l-6-6-6 6" />
      </svg>
    </button>
  );
}