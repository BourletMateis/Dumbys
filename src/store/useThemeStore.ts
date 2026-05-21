import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type ThemePreference = "light" | "dark" | "system";

type ThemeStore = {
  preference: ThemePreference;
  initialize: () => Promise<void>;
  setPreference: (p: ThemePreference) => Promise<void>;
};

export const useThemeStore = create<ThemeStore>((set) => ({
  preference: "system",

  initialize: async () => {
    const stored = await AsyncStorage.getItem("dumbeez_theme");
    if (stored === "light" || stored === "dark" || stored === "system") {
      set({ preference: stored });
    }
  },

  setPreference: async (preference) => {
    await AsyncStorage.setItem("dumbeez_theme", preference);
    set({ preference });
  },
}));
