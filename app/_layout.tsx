import { DarkTheme, DefaultTheme, ThemeProvider as NavThemeProvider } from "@react-navigation/native";
import { QueryClientProvider } from "@tanstack/react-query";
import { useFonts } from "expo-font";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import "react-native-reanimated";
import Toast from "react-native-toast-message";

import { queryClient } from "@/src/lib/queryClient";
import { useAuthStore } from "@/src/store/useAuthStore";
import { useRealtimeSubscriptions } from "@/src/hooks/useRealtimeSubscriptions";
import { usePushNotifications } from "@/src/features/notifications/usePushNotifications";
import { ThemeProvider } from "@/src/providers/ThemeProvider";
import { useColorScheme } from "@/components/useColorScheme";

import "../global.css";

export { ErrorBoundary } from "expo-router";

export const unstable_settings = {
  initialRouteName: "(tabs)",
};

SplashScreen.preventAutoHideAsync();

const AppDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: "#121212",    // Charbon Dumbys
    card: "#1F1F1F",          // Gris Ardoise
    border: "#2C2C2C",        // Gris Plomb
    primary: "#FF2D7D",       // Fuchsia Defi
    text: "#F5F5F5",          // Blanc Casse
  },
};

const AppLightTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: "#FFFFFF",
    card: "#FFFFFF",
    border: "#E5E5E5",
    primary: "#FF2D7D",       // Fuchsia Defi
    text: "#1A1A1A",
  },
};

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
    "Poppins-Regular": require("@expo-google-fonts/poppins/400Regular/Poppins_400Regular.ttf"),
    "Poppins-Medium": require("@expo-google-fonts/poppins/500Medium/Poppins_500Medium.ttf"),
    "Poppins-SemiBold": require("@expo-google-fonts/poppins/600SemiBold/Poppins_600SemiBold.ttf"),
    "Poppins-Bold": require("@expo-google-fonts/poppins/700Bold/Poppins_700Bold.ttf"),
    "Poppins-ExtraBold": require("@expo-google-fonts/poppins/800ExtraBold/Poppins_800ExtraBold.ttf"),
    "Poppins-Black": require("@expo-google-fonts/poppins/900Black/Poppins_900Black.ttf"),
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <RootLayoutNav />
        <Toast />
      </ThemeProvider>
    </QueryClientProvider>
  );
}

function RootLayoutNav() {
  const router = useRouter();
  const segments = useSegments();

  const { session, isInitialized, initialize } = useAuthStore();

  useRealtimeSubscriptions();
  usePushNotifications();

  useEffect(() => {
    const cleanup = initialize();
    return cleanup;
  }, [initialize]);

  useEffect(() => {
    if (!isInitialized) return;

    const inAuthGroup = segments[0] === "(auth)";
    const inOnboarding = inAuthGroup && segments[1] === "onboarding";

    if (!session && !inAuthGroup) {
      router.replace("/(auth)/login");
    } else if (session && inAuthGroup && !inOnboarding) {
      // New users (no onboarding_completed) → onboarding, else → tabs
      const onboardingDone = session.user.user_metadata?.onboarding_completed;
      if (!onboardingDone) {
        router.replace("/(auth)/onboarding");
      } else {
        router.replace("/(tabs)");
      }
    }
  }, [session, isInitialized, segments, router]);

  const colorScheme = useColorScheme();
  const navTheme = colorScheme === "dark" ? AppDarkTheme : AppLightTheme;

  return (
    <NavThemeProvider value={navTheme}>
      <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
      <Stack>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="category/[key]" options={{ headerShown: false, animation: "slide_from_right" }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: "modal" }} />
        <Stack.Screen
          name="camera"
          options={{ presentation: "fullScreenModal", headerShown: false, animation: "fade" }}
        />
        <Stack.Screen
          name="post"
          options={{ headerShown: false, animation: "slide_from_bottom" }}
        />
        <Stack.Screen
          name="video"
          options={{ presentation: "fullScreenModal", headerShown: false }}
        />
        <Stack.Screen
          name="group/[id]"
          options={{
            headerShown: false,
            animation: "slide_from_right",
          }}
        />
        <Stack.Screen
          name="user/[id]"
          options={{
            headerStyle: { backgroundColor: "#121212" },
            headerTintColor: "#fff",
            animation: "slide_from_right",
          }}
        />
        <Stack.Screen
          name="feed/home"
          options={{ headerShown: false, animation: "fade" }}
        />
        <Stack.Screen
          name="feed/[groupId]"
          options={{ headerShown: false, animation: "fade" }}
        />
        <Stack.Screen
          name="feed/category/[category]"
          options={{ headerShown: false, animation: "fade" }}
        />
        <Stack.Screen
          name="video-comments/[id]"
          options={{
            presentation: "modal",
            headerStyle: { backgroundColor: "#1F1F1F" },
            headerTintColor: "#fff",
          }}
        />
        <Stack.Screen
          name="notifications"
          options={{ headerShown: false, animation: "slide_from_right" }}
        />
        <Stack.Screen
          name="notifications-settings"
          options={{ headerShown: false, animation: "slide_from_right" }}
        />
        <Stack.Screen
          name="settings"
          options={{ headerShown: false, animation: "slide_from_right" }}
        />
        <Stack.Screen
          name="groups/create"
          options={{ headerShown: false, animation: "slide_from_bottom" }}
        />
      </Stack>
    </NavThemeProvider>
  );
}
