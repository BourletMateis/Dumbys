import { View, Text, Pressable, ActivityIndicator, ScrollView, RefreshControl, Dimensions } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useUserProfile } from "@/src/features/profile/useUserProfile";
import { useMyVideos } from "@/src/features/profile/useMyVideos";
import { useMyGroups } from "@/src/features/groups/useMyGroups";
import { useAuthStore } from "@/src/store/useAuthStore";
import { useUpdateAvatar } from "@/src/features/profile/useUpdateAvatar";
import { Avatar } from "@/src/components/ui/Avatar";
import { AnimatedPressable } from "@/src/components/ui/AnimatedPressable";
import { COLORS, PALETTE, RADIUS, FONT, FONT_FAMILY, SPACING } from "@/src/theme";
import { useTheme } from "@/src/providers/ThemeProvider";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// ─── Trophies data ──────────────────────────────────────────────
const TROPHIES = [
  { id: "1", icon: "flame" as const, label: "Fou Furieux", color: "#FDB813", unlocked: true },
  { id: "2", icon: "ribbon" as const, label: "Roi du Flow", color: "#FF2D7D", unlocked: true },
  { id: "3", icon: "rocket" as const, label: "Première Place", color: "#3FD0C9", unlocked: true },
  { id: "4", icon: "lock-closed" as const, label: "Verrouillé", color: "#C0C0C0", unlocked: false },
];

// ─── Decorative blob ────────────────────────────────────────────
function Blob({ size, color, top, left, right, bottom }: {
  size: number; color: string;
  top?: number; left?: number; right?: number; bottom?: number;
}) {
  return (
    <View
      style={{
        position: "absolute",
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color,
        opacity: 0.15,
        top, left, right, bottom,
      }}
    />
  );
}

// ─── Trophy badge ───────────────────────────────────────────────
function TrophyBadge({ icon, label, color, unlocked }: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  color: string;
  unlocked: boolean;
}) {
  return (
    <View style={{ alignItems: "center", width: (SCREEN_WIDTH - 64) / 4 }}>
      <View
        style={{
          width: 64,
          height: 64,
          borderRadius: 32,
          borderWidth: 2,
          borderStyle: "dashed",
          borderColor: unlocked ? color : "#D0D0D0",
          backgroundColor: unlocked ? color + "18" : "#F0F0F0",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Ionicons
          name={icon}
          size={26}
          color={unlocked ? color : "#C0C0C0"}
        />
      </View>
      <Text
        style={{
          marginTop: 8,
          fontSize: FONT.sizes.xs,
          fontFamily: FONT_FAMILY.medium,
          color: unlocked ? "#333" : "#B0B0B0",
          textAlign: "center",
        }}
        numberOfLines={1}
      >
        {label}
      </Text>
    </View>
  );
}

export default function ProfileScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const signOut = useAuthStore((s) => s.signOut);
  const authLoading = useAuthStore((s) => s.isLoading);
  const updateAvatar = useUpdateAvatar();

  const {
    data: profile,
    isPending: profilePending,
    isError: profileError,
    refetch,
    isRefetching,
  } = useUserProfile();

  const { data: myVideos } = useMyVideos();
  const { data: groups } = useMyGroups();

  const videosCount = (myVideos ?? []).length;
  const challengesCount = (groups ?? []).length;

  if (profilePending) {
    return (
      <View style={{ flex: 1, backgroundColor: "#FFFFFF", alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" color={PALETTE.sarcelle} />
      </View>
    );
  }

  if (profileError || !profile) {
    return (
      <View style={{ flex: 1, backgroundColor: "#FFFFFF", alignItems: "center", justifyContent: "center" }}>
        <Text style={{ color: COLORS.error, fontSize: FONT.sizes.lg, fontFamily: FONT_FAMILY.semibold }}>
          Failed to load profile
        </Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
      {/* Decorative background blobs */}
      <Blob size={200} color={PALETTE.sarcelle} top={-30} right={-60} />
      <Blob size={140} color={PALETTE.fuchsia} bottom={300} left={-50} />
      <Blob size={100} color={PALETTE.jaune} bottom={200} right={-30} />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 120 }}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={PALETTE.sarcelle} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* ─── Top bar ─────────────────────────────────────────── */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingTop: insets.top + 8,
            paddingHorizontal: 20,
            paddingBottom: 8,
          }}
        >
          <Text style={{ fontSize: FONT.sizes.lg, fontFamily: FONT_FAMILY.bold, color: PALETTE.sarcelle }}>
            Dumbys
          </Text>
          <View style={{ flexDirection: "row", gap: 16 }}>
            <Pressable hitSlop={8}>
              <Ionicons name="search-outline" size={22} color="#333" />
            </Pressable>
            <Pressable hitSlop={8}>
              <Ionicons name="notifications-outline" size={22} color="#333" />
            </Pressable>
          </View>
        </View>

        {/* ─── Profile header ──────────────────────────────────── */}
        <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 20, marginTop: 24 }}>
          {/* Avatar with badge */}
          <View style={{ position: "relative" }}>
            <Pressable onPress={() => updateAvatar.mutate()} disabled={updateAvatar.isPending}>
              <Avatar
                url={profile.avatar_url}
                username={profile.username}
                size={80}
              />
            </Pressable>
            {/* Level badge */}
            <View
              style={{
                position: "absolute",
                bottom: -2,
                left: -2,
                width: 28,
                height: 28,
                borderRadius: 14,
                backgroundColor: PALETTE.sarcelle,
                alignItems: "center",
                justifyContent: "center",
                borderWidth: 3,
                borderColor: "#FFFFFF",
              }}
            >
              <Ionicons name="flash" size={14} color="#FFFFFF" />
            </View>
          </View>

          {/* Name & level */}
          <View style={{ marginLeft: 16, flex: 1 }}>
            <Text style={{ fontSize: FONT.sizes["3xl"], fontFamily: FONT_FAMILY.extrabold, color: "#1A1A1A" }}>
              {"Salut, " + profile.username + " ! 👋"}
            </Text>
            <Text style={{ fontSize: FONT.sizes.base, fontFamily: FONT_FAMILY.regular, color: "#888", marginTop: 2 }}>
              {"Niveau 24 • Pro Challengeur"}
            </Text>
          </View>
        </View>

        {/* ─── Stat cards ──────────────────────────────────────── */}
        <View style={{ flexDirection: "row", paddingHorizontal: 20, gap: 12, marginTop: 28 }}>
          {/* Défis relevés */}
          <View
            style={{
              flex: 1,
              backgroundColor: PALETTE.sarcelle,
              borderRadius: RADIUS.xl,
              padding: 20,
              overflow: "hidden",
              minHeight: 110,
              justifyContent: "space-between",
            }}
          >
            {/* Watermark icon */}
            <View style={{ position: "absolute", right: -8, bottom: -8, opacity: 0.2 }}>
              <Ionicons name="trophy" size={80} color="#FFFFFF" />
            </View>
            <Text style={{ fontSize: FONT.sizes.xs, fontFamily: FONT_FAMILY.bold, color: "#FFFFFF", textTransform: "uppercase", letterSpacing: 1.2 }}>
              Défis relevés
            </Text>
            <Text style={{ fontSize: 42, fontFamily: FONT_FAMILY.black, color: "#FFFFFF", marginTop: 4 }}>
              {challengesCount > 0 ? challengesCount : 128}
            </Text>
          </View>

          {/* Victoires */}
          <View
            style={{
              flex: 1,
              backgroundColor: PALETTE.fuchsia,
              borderRadius: RADIUS.xl,
              padding: 20,
              overflow: "hidden",
              minHeight: 110,
              justifyContent: "space-between",
            }}
          >
            {/* Watermark icon */}
            <View style={{ position: "absolute", right: -8, bottom: -8, opacity: 0.2 }}>
              <Ionicons name="trophy" size={80} color="#FFFFFF" />
            </View>
            <Text style={{ fontSize: FONT.sizes.xs, fontFamily: FONT_FAMILY.bold, color: "#FFFFFF", textTransform: "uppercase", letterSpacing: 1.2 }}>
              Victoires
            </Text>
            <Text style={{ fontSize: 42, fontFamily: FONT_FAMILY.black, color: "#FFFFFF", marginTop: 4 }}>
              {videosCount > 0 ? videosCount : 42}
            </Text>
          </View>
        </View>

        {/* ─── Trophées ────────────────────────────────────────── */}
        <View style={{ marginTop: 32, paddingHorizontal: 20 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <Text style={{ fontSize: FONT.sizes.xl, fontFamily: FONT_FAMILY.extrabold, color: "#1A1A1A" }}>
              {"Mes Trophées 🏆"}
            </Text>
            <Pressable>
              <Text style={{ fontSize: FONT.sizes.sm, fontFamily: FONT_FAMILY.bold, color: PALETTE.sarcelle, textTransform: "uppercase" }}>
                Voir tout
              </Text>
            </Pressable>
          </View>

          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            {TROPHIES.map((t) => (
              <TrophyBadge
                key={t.id}
                icon={t.icon}
                label={t.label}
                color={t.color}
                unlocked={t.unlocked}
              />
            ))}
          </View>
        </View>

        {/* ─── Mon Record Personnel ────────────────────────────── */}
        <View style={{ marginTop: 32, paddingHorizontal: 20 }}>
          <Text style={{ fontSize: FONT.sizes.xl, fontFamily: FONT_FAMILY.extrabold, color: "#1A1A1A", marginBottom: 14 }}>
            {"Mon Record Personnel ⚡"}
          </Text>

          <AnimatedPressable
            style={{
              backgroundColor: "#F8F8FA",
              borderRadius: RADIUS.xl,
              padding: 18,
              flexDirection: "row",
              alignItems: "center",
              borderWidth: 1,
              borderColor: "rgba(0,0,0,0.05)",
            }}
          >
            {/* Star icon */}
            <View
              style={{
                width: 52,
                height: 52,
                borderRadius: 16,
                backgroundColor: PALETTE.jaune + "25",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons name="star" size={26} color={PALETTE.jaune} />
            </View>

            <View style={{ flex: 1, marginLeft: 14 }}>
              <Text style={{ fontSize: FONT.sizes.lg, fontFamily: FONT_FAMILY.bold, color: "#1A1A1A" }}>
                Score Max : 12,450
              </Text>
              <Text style={{ fontSize: FONT.sizes.sm, fontFamily: FONT_FAMILY.semibold, color: "#AAA", marginTop: 2, textTransform: "uppercase", letterSpacing: 0.5 }}>
                #DANCEOFF CHALLENGE
              </Text>
            </View>

            <Ionicons name="chevron-forward" size={20} color="#CCC" />
          </AnimatedPressable>
        </View>

        {/* ─── Sign Out ────────────────────────────────────────── */}
        <View style={{ paddingHorizontal: 20, marginTop: 40 }}>
          <AnimatedPressable
            onPress={() => {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
              signOut();
            }}
            disabled={authLoading}
            style={{
              backgroundColor: "rgba(244,63,94,0.06)",
              paddingVertical: 16,
              borderRadius: RADIUS.md,
              alignItems: "center",
              borderWidth: 1,
              borderColor: "rgba(244,63,94,0.12)",
            }}
          >
            {authLoading ? (
              <ActivityIndicator color={COLORS.error} />
            ) : (
              <Text style={{ color: COLORS.error, fontSize: FONT.sizes.lg, fontFamily: FONT_FAMILY.semibold }}>
                Se déconnecter
              </Text>
            )}
          </AnimatedPressable>
        </View>
      </ScrollView>
    </View>
  );
}
