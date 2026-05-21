import React, { createContext, useContext, useMemo } from "react";
import { useColorScheme } from "@/components/useColorScheme";
import { COLORS, COLORS_LIGHT } from "@/src/theme";
import { useThemeStore } from "@/src/store/useThemeStore";

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
  const systemScheme = useColorScheme();
  const { preference } = useThemeStore();

  const value = useMemo<ThemeContextValue>(() => {
    const effective = preference === "system" ? systemScheme : preference;
    const isDark = effective === "dark";
    return {
      colors: isDark ? COLORS : (COLORS_LIGHT as unknown as ThemeColors),
      mode: effective as ThemeMode,
      isDark,
    };
  }, [preference, systemScheme]);

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
