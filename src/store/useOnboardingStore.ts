import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "dumbeez_onboarding_v1";

type OnboardingStore = {
  hasSeenOnboarding: boolean | null;
  initialize: () => Promise<void>;
  complete: () => Promise<void>;
  reset: () => Promise<void>;
};

export const useOnboardingStore = create<OnboardingStore>((set) => ({
  hasSeenOnboarding: null,

  initialize: async () => {
    const val = await AsyncStorage.getItem(KEY);
    set({ hasSeenOnboarding: val === "true" });
  },

  complete: async () => {
    await AsyncStorage.setItem(KEY, "true");
    set({ hasSeenOnboarding: true });
  },

  reset: async () => {
    await AsyncStorage.removeItem(KEY);
    set({ hasSeenOnboarding: false });
  },
}));
