"use client";

import { createContext, useContext, useEffect } from "react";

const ThemeContext = createContext(null);
const STORAGE_KEY = "finance_theme";
const DARK_THEME = "dark";

export function ThemeProvider({ children }) {
  useEffect(() => {
    document.documentElement.dataset.theme = DARK_THEME;
    window.localStorage.removeItem(STORAGE_KEY);
  }, []);

  return <ThemeContext.Provider value={{ theme: DARK_THEME }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme must be used inside ThemeProvider.");
  }

  return context;
}
