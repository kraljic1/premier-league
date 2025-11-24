"use client";

import { useEffect, useState } from "react";
import { useAppStore } from "@/lib/store";
import { CLUBS } from "@/lib/clubs";

export function ClubTheme() {
  const { primaryClub } = useAppStore();
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const checkDarkMode = () => {
      setIsDark(document.documentElement.classList.contains("dark"));
    };
    checkDarkMode();
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
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
  }, [primaryClub, isDark]);

  return null;
}

