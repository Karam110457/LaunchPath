"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

type CanvasTheme = "light" | "dark";

interface CanvasThemeContextValue {
  theme: CanvasTheme;
  toggleTheme: () => void;
}

const STORAGE_KEY = "canvas-theme";

const CanvasThemeContext = createContext<CanvasThemeContextValue>({
  theme: "light",
  toggleTheme: () => {},
});

export function CanvasThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<CanvasTheme>("light");

  // Hydrate from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY) as CanvasTheme | null;
      if (stored === "light" || stored === "dark") {
        setTheme(stored);
      }
    } catch {
      // SSR or localStorage unavailable
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next = prev === "light" ? "dark" : "light";
      try {
        localStorage.setItem(STORAGE_KEY, next);
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  return (
    <CanvasThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </CanvasThemeContext.Provider>
  );
}

export function useCanvasTheme() {
  return useContext(CanvasThemeContext);
}
