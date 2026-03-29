import { View, Text, Pressable, FlatList, ActivityIndicator } from "react-native";
import { router, Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FONT, FONT_FAMILY, PALETTE, RADIUS, SPACING } from "@/src/theme";
import {
  useNotificationLog,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
  type NotificationLog,
} from "@/src/features/notifications/useNotificationLog";

const TYPE_ICONS: Record<string, { icon: keyof typeof Ionicons.glyphMap; color: string }> = {
  vote_reminder: { icon: "trophy-outline",      color: "#F59E0B" },
  podium:        { icon: "medal-outline",        color: "#FF6B3D" },
  friend_request:{ icon: "person-add-outline",  color: PALETTE.sarcelle },
  new_video:     { icon: "play-circle-outline",  color: PALETTE.fuchsia },
  challenge:     { icon: "flash-outline",        color: "#A78BFA" },
  default:       { icon: "notifications-outline", color: "#999" },
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1)  return "À l'instant";
  if (m < 60) return `Il y a ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `Il y a ${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7)  return `Il y a ${d}j`;
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

function NotifItem({ item }: { item: NotificationLog }) {
  const markRead = useMarkNotificationRead();
  const meta = TYPE_ICONS[item.type ?? "default"] ?? TYPE_ICONS.default;

  return (
    <Pressable
      onPress={() => {
        if (!item.read) markRead.mutate(item.id);
      }}
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        paddingHorizontal: SPACING.lg,
        paddingVertical: 14,
        backgroundColor: item.read ? "#FFFFFF" : `${PALETTE.sarcelle}08`,
        opacity: pressed ? 0.7 : 1,
        borderBottomWidth: 1,
        borderBottomColor: "rgba(0,0,0,0.04)",
      })}
    >
      {/* Icône type */}
      <View
        style={{
          width: 42, height: 42,
          borderRadius: RADIUS.sm,
          backgroundColor: `${meta.color}15`,
          alignItems: "center", justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Ionicons name={meta.icon} size={20} color={meta.color} />
      </View>

      {/* Texte */}
      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontSize: FONT.sizes.sm,
            fontFamily: item.read ? FONT_FAMILY.medium : FONT_FAMILY.bold,
            color: "#1A1A1A",
          }}
          numberOfLines={1}
        >
          {item.title}
        </Text>
        {item.body ? (
          <Text
            style={{
              fontSize: FONT.sizes.xs,
              fontFamily: FONT_FAMILY.regular,
              color: "#666",
              marginTop: 2,
            }}
            numberOfLines={2}
          >
            {item.body}
          </Text>
        ) : null}
        <Text style={{ fontSize: FONT.sizes.xs, fontFamily: FONT_FAMILY.regular, color: "#BBB", marginTop: 4 }}>
          {timeAgo(item.created_at)}
        </Text>
      </View>

      {/* Point non lu */}
      {!item.read && (
        <View
          style={{
            width: 8, height: 8,
            borderRadius: 4,
            backgroundColor: PALETTE.sarcelle,
            flexShrink: 0,
          }}
        />
      )}
    </Pressable>
  );
}

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const { data, isLoading } = useNotificationLog();
  const markAll = useMarkAllNotificationsRead();

  const unreadCount = (data ?? []).filter((n) => !n.read).length;

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={{ flex: 1, backgroundColor: "#F8F8FA" }}>

        {/* Header */}
        <View
          style={{
            paddingTop: insets.top + SPACING.base,
            paddingBottom: SPACING.base,
            paddingHorizontal: SPACING.lg,
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
            backgroundColor: "#FFFFFF",
            borderBottomWidth: 1,
            borderBottomColor: "rgba(0,0,0,0.05)",
          }}
        >
          <Pressable
            onPress={() => router.back()}
            style={{
              width: 38, height: 38,
              borderRadius: RADIUS.sm,
              backgroundColor: "rgba(0,0,0,0.04)",
              alignItems: "center", justifyContent: "center",
            }}
          >
            <Ionicons name="arrow-back" size={22} color="#1A1A1A" />
          </Pressable>

          <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75} style={{ flex: 1, fontSize: FONT.sizes.xl, fontFamily: FONT_FAMILY.bold, color: "#1A1A1A" }}>
            Notifications
          </Text>

          {unreadCount > 0 && (
            <Pressable
              onPress={() => markAll.mutate()}
              style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: RADIUS.sm, backgroundColor: `${PALETTE.sarcelle}12` }}
            >
              <Text style={{ fontSize: FONT.sizes.xs, fontFamily: FONT_FAMILY.semibold, color: PALETTE.sarcelle }}>
                Tout lire
              </Text>
            </Pressable>
          )}
        </View>

        {isLoading ? (
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
            <ActivityIndicator color={PALETTE.sarcelle} />
          </View>
        ) : !data?.length ? (
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 12 }}>
            <Ionicons name="notifications-off-outline" size={48} color="#DDD" />
            <Text style={{ fontSize: FONT.sizes.base, fontFamily: FONT_FAMILY.medium, color: "#BBB" }}>
              Aucune notification
            </Text>
          </View>
        ) : (
          <FlatList
            data={data}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <NotifItem item={item} />}
            contentContainerStyle={{ paddingBottom: insets.bottom + SPACING.base }}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </>
  );
}
