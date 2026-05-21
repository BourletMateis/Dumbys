import { View, Text, SectionList, Pressable, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import {
  useNotifications,
  useMarkAllRead,
  useMarkRead,
  type AppNotification,
} from "@/src/features/notifications/useNotifications";
import { useTheme } from "@/src/providers/ThemeProvider";
import { PALETTE, FONT, FONT_FAMILY } from "@/src/theme";

const ICON_MAP: Record<AppNotification["type"], { icon: keyof typeof Ionicons.glyphMap; color: string }> = {
  like:            { icon: "heart",          color: PALETTE.fuchsia },
  comment:         { icon: "chatbubble",      color: PALETTE.sarcelle },
  friend_request:  { icon: "person-add",     color: PALETTE.jaune },
  friend_accepted: { icon: "people",         color: PALETTE.sarcelle },
  tournament_new:  { icon: "trophy",         color: PALETTE.jaune },
  video_new:       { icon: "play-circle",    color: PALETTE.fuchsia },
};

function groupByDate(notifs: AppNotification[]) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);

  const groups: Record<string, AppNotification[]> = {
    "Aujourd'hui": [],
    "Hier": [],
    "Cette semaine": [],
    "Plus ancien": [],
  };

  for (const n of notifs) {
    const d = new Date(n.created_at);
    d.setHours(0, 0, 0, 0);
    if (d >= today) groups["Aujourd'hui"].push(n);
    else if (d >= yesterday) groups["Hier"].push(n);
    else if (d >= weekAgo) groups["Cette semaine"].push(n);
    else groups["Plus ancien"].push(n);
  }

  return Object.entries(groups)
    .filter(([, items]) => items.length > 0)
    .map(([title, data]) => ({ title, data }));
}

function NotifRow({ notif, onPress, isDark }: { notif: AppNotification; onPress: () => void; isDark: boolean }) {
  const { icon, color } = ICON_MAP[notif.type] ?? { icon: "notifications", color: PALETTE.sarcelle };
  const timeAgo = formatTime(notif.created_at);

  return (
    <Pressable
      onPress={onPress}
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 20,
        paddingVertical: 14,
        gap: 14,
        backgroundColor: notif.read
          ? "transparent"
          : isDark ? "rgba(63,208,201,0.06)" : "rgba(63,208,201,0.08)",
      }}
    >
      {/* Icon */}
      <View
        style={{
          width: 46,
          height: 46,
          borderRadius: 23,
          backgroundColor: `${color}18`,
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Ionicons name={icon} size={22} color={color} />
      </View>

      {/* Content */}
      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontSize: FONT.sizes.base,
            fontFamily: notif.read ? FONT_FAMILY.regular : FONT_FAMILY.semibold,
            color: isDark ? (notif.read ? "#666" : "#F5F5F5") : (notif.read ? "#999" : "#1A1A1A"),
            marginBottom: 3,
          }}
          numberOfLines={1}
        >
          {notif.title}
        </Text>
        <Text
          style={{
            fontSize: FONT.sizes.sm,
            fontFamily: FONT_FAMILY.regular,
            color: isDark ? "#505050" : "#AAAAAA",
            lineHeight: 18,
          }}
          numberOfLines={2}
        >
          {notif.body}
        </Text>
        <Text
          style={{
            fontSize: FONT.sizes.xs,
            fontFamily: FONT_FAMILY.medium,
            color: isDark ? "#404040" : "#CCCCCC",
            marginTop: 4,
          }}
        >
          {timeAgo}
        </Text>
      </View>

      {/* Unread dot */}
      {!notif.read && (
        <View
          style={{
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: PALETTE.sarcelle,
            flexShrink: 0,
          }}
        />
      )}
    </Pressable>
  );
}

function formatTime(iso: string) {
  const now = new Date();
  const d = new Date(iso);
  const diff = Math.floor((now.getTime() - d.getTime()) / 1000);
  if (diff < 60) return "À l'instant";
  if (diff < 3600) return `Il y a ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `Il y a ${Math.floor(diff / 3600)} h`;
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

export default function NotificationsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { data: notifs, isLoading } = useNotifications();
  const markAll = useMarkAllRead();
  const markOne = useMarkRead();

  const sections = notifs?.length ? groupByDate(notifs) : [];
  const unread = notifs?.filter((n) => !n.read).length ?? 0;

  const handlePress = (notif: AppNotification) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (!notif.read) markOne.mutate(notif.id);
    const d = notif.data as any;
    if (d?.video_id) router.push(`/feed/challenge/${d.video_id}` as any);
    else if (d?.user_id) router.push(`/user/${d.user_id}` as any);
    else if (d?.group_id) router.push(`/group/${d.group_id}` as any);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      {/* Header */}
      <View
        style={{
          paddingTop: insets.top + 8,
          paddingBottom: 16,
          paddingHorizontal: 20,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        }}
      >
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </Pressable>

        <Text style={{ fontSize: FONT.sizes.xl, fontFamily: FONT_FAMILY.bold, color: colors.textPrimary }}>
          Notifications
        </Text>

        {unread > 0 ? (
          <Pressable
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); markAll.mutate(); }}
            hitSlop={12}
          >
            <Text style={{ fontSize: FONT.sizes.sm, fontFamily: FONT_FAMILY.semibold, color: PALETTE.sarcelle }}>
              Tout lire
            </Text>
          </Pressable>
        ) : (
          <View style={{ width: 55 }} />
        )}
      </View>

      {isLoading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator color={PALETTE.sarcelle} />
        </View>
      ) : !sections.length ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 16 }}>
          <View
            style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: isDark ? "rgba(63,208,201,0.08)" : "rgba(63,208,201,0.1)",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name="notifications-off-outline" size={36} color={PALETTE.sarcelle} />
          </View>
          <Text style={{ fontSize: FONT.sizes.lg, fontFamily: FONT_FAMILY.semibold, color: colors.textSecondary }}>
            Tout est calme ici
          </Text>
          <Text style={{ fontSize: FONT.sizes.sm, fontFamily: FONT_FAMILY.regular, color: colors.textTertiary, textAlign: "center", paddingHorizontal: 40 }}>
            Tes notifications apparaîtront ici dès qu'il y a de l'activité
          </Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <NotifRow notif={item} onPress={() => handlePress(item)} isDark={isDark} />
          )}
          renderSectionHeader={({ section: { title } }) => (
            <View
              style={{
                paddingHorizontal: 20,
                paddingVertical: 10,
                backgroundColor: isDark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)",
                borderBottomWidth: 1,
                borderBottomColor: colors.border,
              }}
            >
              <Text style={{ fontSize: FONT.sizes.xs, fontFamily: FONT_FAMILY.bold, color: colors.textTertiary, textTransform: "uppercase", letterSpacing: 1.2 }}>
                {title}
              </Text>
            </View>
          )}
          contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
          showsVerticalScrollIndicator={false}
          stickySectionHeadersEnabled={false}
        />
      )}
    </View>
  );
}
