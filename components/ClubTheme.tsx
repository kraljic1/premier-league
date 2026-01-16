"use client";

import { useEffect, useState } from "react";
import { useAppStore } from "@/lib/store";
import { CLUBS } from "@/lib/clubs";

export function ClubTheme() {
  const [mounted, setMounted] = useState(false);
  const [primaryClub, setPrimaryClub] = useState<string | null>(null);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Only access Zustand store after mounting to avoid SSR hydration issues
    const storePrimaryClub = useAppStore.getState().primaryClub;
    setPrimaryClub(storePrimaryClub);
    
    // Subscribe to store changes (Zustand v4 API)
    const unsubscribe = useAppStore.subscribe((state) => {
      setPrimaryClub(state.primaryClub);
    });
    
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!mounted) return;
    
    const checkDarkMode = () => {
      if (typeof document !== "undefined") {
        setIsDark(document.documentElement.classList.contains("dark"));
      }
    };
    checkDarkMode();
    if (typeof document !== "undefined") {
      const observer = new MutationObserver(checkDarkMode);
      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ["class"],
      });
      return () => observer.disconnect();
    }
  }, [mounted]);

  useEffect(() => {
    if (!mounted || typeof document === "undefined") return;
    
    const root = document.documentElement;
    if (primaryClub && CLUBS[primaryClub]) {
      const club = CLUBS[primaryClub];
      root.style.setProperty("--club-primary", club.primaryColor);
      root.style.setProperty("--club-secondary", club.secondaryColor);
      root.style.setProperty("--club-text", club.textColor);
    } else {
      root.style.setProperty(
        "--club-primary",
        isDark ? "rgb(17 24 39)" : "rgb(255 255 255)"
      );
      root.style.removeProperty("--club-secondary");
      root.style.removeProperty("--club-text");
    }
  }, [primaryClub, isDark, mounted]);


  return null;
}

