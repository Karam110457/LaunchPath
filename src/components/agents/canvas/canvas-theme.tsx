"use client";

import { createContext, useCallback, useContext } from "react";
import { useTheme } from "next-themes";

type CanvasTheme = "light" | "dark";

interface CanvasThemeContextValue {
  theme: CanvasTheme;
  toggleTheme: () => void;
}

const CanvasThemeContext = createContext<CanvasThemeContextValue>({
  theme: "light",
  toggleTheme: () => {},
});

export function CanvasThemeProvider({ children }: { children: React.ReactNode }) {
  const { theme: globalTheme, setTheme: setGlobalTheme } = useTheme();

  // Derive canvas theme from the global next-themes value
  const theme: CanvasTheme = globalTheme === "dark" ? "dark" : "light";

  const toggleTheme = useCallback(() => {
    setGlobalTheme(globalTheme === "dark" ? "light" : "dark");
  }, [globalTheme, setGlobalTheme]);

  return (
    <CanvasThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </CanvasThemeContext.Provider>
  );
}

export function useCanvasTheme() {
  return useContext(CanvasThemeContext);
}
