"use client";

import { useEffect } from "react";
import { useAppStore } from "@/lib/store";

/**
 * Component that handles Zustand store hydration on the client side.
 * Must be placed in the root layout to ensure proper hydration.
 */
export function StoreHydration() {
  useEffect(() => {
    // Trigger rehydration after the component mounts
    // This ensures server and client render the same initial state
    useAppStore.persist.rehydrate();
  }, []);

  return null;
}
