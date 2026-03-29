import { useEffect, useRef } from "react";
import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { router } from "expo-router";
import { supabase } from "@/src/lib/supabase";
import { useAuthStore } from "@/src/store/useAuthStore";

// ── Foreground notification behavior ───────────────────────────────
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// ── Main hook — call once in RootLayoutNav after auth is ready ─────
export function usePushNotifications() {
  const user = useAuthStore((s) => s.user);
  const notifListener = useRef<Notifications.EventSubscription | null>(null);
  const responseListener = useRef<Notifications.EventSubscription | null>(null);

  useEffect(() => {
    if (!user) return;

    // Register and save token
    registerForPushAsync()
      .then((token) => {
        if (token) savePushToken(token, user.id);
      })
      .catch(() => {
        // Permissions denied or simulator — silently skip
      });

    // Notification received while app is in foreground (display handled above)
    notifListener.current = Notifications.addNotificationReceivedListener(() => {
      // Nothing extra — alert is shown by setNotificationHandler
    });

    // User tapped a notification
    responseListener.current = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const data = response.notification.request.content.data as Record<
          string,
          string
        >;
        handleNotificationTap(data);
      },
    );

    return () => {
      notifListener.current?.remove();
      responseListener.current?.remove();
    };
  }, [user?.id]);
}

// ── Token registration ─────────────────────────────────────────────
async function registerForPushAsync(): Promise<string | null> {
  if (Platform.OS === "web") return null;

  const { status: existing } = await Notifications.getPermissionsAsync();
  let status = existing;

  if (status !== "granted") {
    const { status: asked } = await Notifications.requestPermissionsAsync();
    status = asked;
  }

  if (status !== "granted") return null;

  // Android: create default notification channel
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "Dumbys",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF2D7D",
    });
  }

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    Constants.easConfig?.projectId;

  if (!projectId) {
    console.warn("[Push] No EAS projectId found in app.json — skipping token registration");
    return null;
  }

  const { data: token } = await Notifications.getExpoPushTokenAsync({
    projectId,
  });

  return token ?? null;
}

// ── Save token to Supabase ─────────────────────────────────────────
async function savePushToken(token: string, userId: string) {
  const { error } = await supabase
    .from("users")
    .update({ push_token: token, notifications_enabled: true })
    .eq("id", userId);

  if (error) {
    console.warn("[Push] Failed to save token:", error.message);
  }
}

// ── Navigate on notification tap ───────────────────────────────────
function handleNotificationTap(data: Record<string, string>) {
  if (!data) return;

  if (data.groupId) {
    router.push({ pathname: "/group/[id]", params: { id: data.groupId } });
  } else if (data.videoId) {
    router.push({ pathname: "/video", params: { id: data.videoId } } as any);
  }
}
