import React, { createContext, useContext, useMemo } from "react";
import { useColorScheme } from "@/components/useColorScheme";
import { COLORS, COLORS_LIGHT } from "@/src/theme";

type ThemeColors = typeof COLORS;
type ThemeMode = "light" | "dark";

interface ThemeContextValue {
  colors: ThemeColors;
  mode: ThemeMode;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextValue>({
  colors: COLORS,
  mode: "dark",
  isDark: true,
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const colorScheme = useColorScheme();

  const value = useMemo<ThemeContextValue>(() => {
    const isDark = colorScheme === "dark";
    return {
      colors: isDark ? COLORS : (COLORS_LIGHT as unknown as ThemeColors),
      mode: colorScheme,
      isDark,
    };
  }, [colorScheme]);

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
