"use client";

import { useEffect } from "react";

/**
 * Custom hook to fix Google Autocomplete interaction with Radix UI Dialog
 * This hook disables the pointer events lockout that prevents clicking on autocomplete suggestions
 * Use this hook in any component that renders Google Autocomplete within a dialog
 */
export function useGoogleAutocompleteFix() {
  useEffect(() => {
    // Disable Radix UI dialog pointer events lockout
    // This allows clicking on Google Autocomplete suggestions
    const timer = setTimeout(() => {
      document.body.style.pointerEvents = "";
    }, 0);

    return () => clearTimeout(timer);
  }, []);
}
