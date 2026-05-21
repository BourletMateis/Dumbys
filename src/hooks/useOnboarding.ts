import { useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "dumbeez_onboarding_v1";

export function useOnboarding() {
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState<boolean | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(KEY).then((val) => {
      setHasSeenOnboarding(val === "true");
    });
  }, []);

  const completeOnboarding = async () => {
    await AsyncStorage.setItem(KEY, "true");
    setHasSeenOnboarding(true);
  };

  const resetOnboarding = async () => {
    await AsyncStorage.removeItem(KEY);
    setHasSeenOnboarding(false);
  };

  return { hasSeenOnboarding, completeOnboarding, resetOnboarding };
}
