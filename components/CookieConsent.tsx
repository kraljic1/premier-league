"use client";

import { useState, useEffect } from "react";

export function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // Wait for client-side to check localStorage
    if (typeof window === "undefined") return;
    
    // Check if user has already made a choice
    const consent = localStorage.getItem("cookie-consent");
    
    if (!consent) {
      // Show banner after a short delay for better UX
      const timer = setTimeout(() => {
        setShowBanner(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem("cookie-consent", "accepted");
      localStorage.setItem("cookie-consent-date", new Date().toISOString());
      // Dispatch custom event to notify other components of consent change
      window.dispatchEvent(new CustomEvent("cookie-consent-changed", {
        detail: { consent: "accepted" }
      }));
    }
    setShowBanner(false);
  };

  const handleReject = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem("cookie-consent", "rejected");
      localStorage.setItem("cookie-consent-date", new Date().toISOString());
    }
    setShowBanner(false);
  };

  // Don't render anything until mounted (prevents hydration mismatch)
  if (!mounted) {
    return null;
  }

  // Don't render if banner shouldn't be shown
  if (!showBanner) {
    return null;
  }

  return (
    <div className="cookie-consent-banner">
      <div className="cookie-consent-content">
        <div className="cookie-consent-text">
          <h3 className="cookie-consent-title">Cookie Consent</h3>
          <p className="cookie-consent-description">
            We use cookies to analyze website traffic and optimize your experience.
            By accepting, you agree to our use of cookies. You can reject non-essential
            cookies, but some features may not work properly.
          </p>
        </div>
        <div className="cookie-consent-buttons">
          <button
            onClick={handleAccept}
            className="cookie-consent-accept"
            aria-label="Accept cookies"
          >
            Accept All
          </button>
          <button
            onClick={handleReject}
            className="cookie-consent-reject"
            aria-label="Reject cookies"
          >
            Reject
          </button>
        </div>
      </div>
    </div>
  );
}
