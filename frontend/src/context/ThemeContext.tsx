import React, { createContext, useContext, useEffect, useState } from "react";
import type { Theme, ThemeContextType } from "../types";

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    // Read from localStorage or default to "system"
    if (typeof window === "undefined") return "system";
    const stored = localStorage.getItem("theme") as Theme;
    return stored || "system";
  });

  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">(
    "light"
  );

  // Update resolved theme based on system preference or user choice
  useEffect(() => {
    const updateResolvedTheme = () => {
      let resolved: "light" | "dark" = "light";

      if (theme === "system") {
        // Check system preference
        resolved = window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light";
      } else {
        resolved = theme;
      }

      setResolvedTheme(resolved);

      // Apply to document
      const root = document.documentElement;
      root.setAttribute("data-theme", resolved);
      root.classList.toggle("dark", resolved === "dark");
    };

    updateResolvedTheme();

    // Listen to system theme changes
    if (theme === "system") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      mediaQuery.addEventListener("change", updateResolvedTheme);
      return () => mediaQuery.removeEventListener("change", updateResolvedTheme);
    }
  }, [theme]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem("theme", newTheme);
  };

  const toggleTheme = () => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  };

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
};
