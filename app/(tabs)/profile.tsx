import { useState } from "react";
import { View, Text, Pressable, ActivityIndicator, ScrollView, RefreshControl, Dimensions, Alert } from "react-native";
import { useRouter } from "expo-router";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useUserProfile } from "@/src/features/profile/useUserProfile";
import { useMyVideos } from "@/src/features/profile/useMyVideos";
import { useMyGroups } from "@/src/features/groups/useMyGroups";
import { useDeleteVideo } from "@/src/features/feed/useDeleteVideo";
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

// ─── Gallery tab type ────────────────────────────────────────────
type GalleryTab = "defis" | "shorts";

// ─── Demo gallery data (matches template) ────────────────────────
const DEMO_GALLERY = [
  { id: "1", title: "Moonwalk...", emoji: "", views: "2.4k", date: "24 JAN.", thumbnail: null },
  { id: "2", title: "Kickflip Pro Trick", emoji: "🛹", views: "892", date: "IL Y A 3J", thumbnail: null },
  { id: "3", title: "Cliff Jump Hawaii", emoji: "🌊", views: "12k", date: "DÉC. 2023", thumbnail: null },
  { id: "4", title: "Hard Work Gym", emoji: "🏋", views: "5.6k", date: "OCT. 2023", thumbnail: null },
];

// ─── Video card for gallery grid ─────────────────────────────────
function VideoGalleryCard({ title, emoji, views, date, thumbnailUrl, width, onPress, onDelete }: {
  title: string;
  emoji: string;
  views: string;
  date: string;
  thumbnailUrl: string | null;
  width: number;
  onPress?: () => void;
  onDelete?: () => void;
}) {
  const cardHeight = width * 1.25;
  return (
    <Pressable
      onPress={onPress}
      style={{
        width,
        height: cardHeight,
        borderRadius: 20,
        overflow: "hidden",
        backgroundColor: "#2C2C2C",
      }}
    >
      {/* Thumbnail */}
      {thumbnailUrl ? (
        <Image
          source={{ uri: thumbnailUrl }}
          style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
          contentFit="cover"
        />
      ) : (
        <View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "#3A3A3A" }}>
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
            <Ionicons name="videocam" size={36} color="#666" />
          </View>
        </View>
      )}

      {/* Action buttons (share + delete) */}
      <View style={{ position: "absolute", top: 10, right: 10, flexDirection: "row", gap: 8 }}>
        <AnimatedPressable
          onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
          style={{
            width: 34,
            height: 34,
            borderRadius: 17,
            backgroundColor: "rgba(255,255,255,0.25)",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons name="share-social-outline" size={16} color="#FFF" />
        </AnimatedPressable>
        <AnimatedPressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            Alert.alert(
              "Supprimer la vidéo",
              "Cette action est irréversible. Tu veux vraiment supprimer cette vidéo ?",
              [
                { text: "Annuler", style: "cancel" },
                { text: "Supprimer", style: "destructive", onPress: onDelete },
              ]
            );
          }}
          style={{
            width: 34,
            height: 34,
            borderRadius: 17,
            backgroundColor: "rgba(244,63,94,0.35)",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons name="trash-outline" size={16} color="#FFF" />
        </AnimatedPressable>
      </View>

      {/* Bottom gradient overlay */}
      <LinearGradient
        colors={["transparent", "rgba(0,0,0,0.7)"]}
        style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: cardHeight * 0.45, justifyContent: "flex-end", padding: 12 }}
      >
        {/* Title with emoji */}
        <Text
          style={{ color: "#FFFFFF", fontSize: FONT.sizes.base, fontFamily: FONT_FAMILY.bold }}
          numberOfLines={1}
        >
          {title} {emoji}
        </Text>
        {/* Views and date */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 }}>
          <Ionicons name="play" size={10} color="rgba(255,255,255,0.7)" />
          <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: FONT.sizes.xs, fontFamily: FONT_FAMILY.semibold }}>
            {views}
          </Text>
          <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: FONT.sizes.xs, fontFamily: FONT_FAMILY.semibold, textTransform: "uppercase" }}>
            {date}
          </Text>
        </View>
      </LinearGradient>
    </Pressable>
  );
}

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
  const deleteVideo = useDeleteVideo();

  const [galleryTab, setGalleryTab] = useState<GalleryTab>("defis");

  const videosCount = (myVideos ?? []).length;
  const challengesCount = (groups ?? []).length;
  const CARD_GAP = 12;
  const CARD_WIDTH = (SCREEN_WIDTH - 40 - CARD_GAP) / 2;

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

        {/* ─── Ma Galerie Vidéo ─────────────────────────────────── */}
        <View style={{ marginTop: 32, paddingHorizontal: 20 }}>
          <Text style={{ fontSize: FONT.sizes["3xl"], fontFamily: FONT_FAMILY.extrabold, color: "#1A1A1A", marginBottom: 16 }}>
            Ma Galerie Vidéo
          </Text>

          {/* Défis / Shorts tabs */}
          <View
            style={{
              flexDirection: "row",
              backgroundColor: "#F2F2F2",
              borderRadius: 25,
              padding: 4,
              marginBottom: 20,
            }}
          >
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setGalleryTab("defis");
              }}
              style={{
                flex: 1,
                paddingVertical: 10,
                alignItems: "center",
                borderRadius: 22,
                backgroundColor: galleryTab === "defis" ? "#FFFFFF" : "transparent",
                ...(galleryTab === "defis"
                  ? { shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 }
                  : {}),
              }}
            >
              <Text
                style={{
                  fontSize: FONT.sizes.base,
                  fontFamily: galleryTab === "defis" ? FONT_FAMILY.semibold : FONT_FAMILY.medium,
                  color: galleryTab === "defis" ? PALETTE.sarcelle : "#999999",
                }}
              >
                Défis
              </Text>
            </Pressable>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setGalleryTab("shorts");
              }}
              style={{
                flex: 1,
                paddingVertical: 10,
                alignItems: "center",
                borderRadius: 22,
                backgroundColor: galleryTab === "shorts" ? "#FFFFFF" : "transparent",
                ...(galleryTab === "shorts"
                  ? { shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 }
                  : {}),
              }}
            >
              <Text
                style={{
                  fontSize: FONT.sizes.base,
                  fontFamily: galleryTab === "shorts" ? FONT_FAMILY.semibold : FONT_FAMILY.medium,
                  color: galleryTab === "shorts" ? PALETTE.sarcelle : "#999999",
                }}
              >
                Shorts
              </Text>
            </Pressable>
          </View>

          {/* Video grid 2x2 */}
          {galleryTab === "defis" ? (
            <View>
              {/* Use real videos if available, otherwise demo */}
              {(() => {
                const hasRealVideos = (myVideos ?? []).length > 0;
                const videos = hasRealVideos
                  ? (myVideos ?? []).map((v, index) => ({
                      id: v.id,
                      videoPath: v.video_path,
                      index,
                      title: v.group?.name ?? "Vidéo",
                      emoji: "",
                      views: "—",
                      date: new Date(v.created_at).toLocaleDateString("fr-FR", { month: "short", year: "numeric" }).toUpperCase(),
                      thumbnail: v.thumbnail_url,
                    }))
                  : DEMO_GALLERY.map((v, index) => ({ ...v, index, thumbnail: v.thumbnail }));

                // Chunk into rows of 2
                const rows: typeof videos[] = [];
                for (let i = 0; i < videos.length; i += 2) {
                  rows.push(videos.slice(i, i + 2));
                }

                return rows.map((row, rowIndex) => (
                  <View key={rowIndex} style={{ flexDirection: "row", gap: CARD_GAP, marginBottom: CARD_GAP }}>
                    {row.map((video) => (
                      <VideoGalleryCard
                        key={video.id}
                        title={video.title}
                        emoji={video.emoji}
                        views={video.views}
                        date={video.date}
                        thumbnailUrl={video.thumbnail}
                        width={CARD_WIDTH}
                        onPress={hasRealVideos ? () => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          router.push({ pathname: "/feed/my-videos", params: { startIndex: String(video.index) } });
                        } : undefined}
                        onDelete={hasRealVideos ? () => {
                          deleteVideo.mutate({ videoId: video.id, videoPath: (video as any).videoPath });
                        } : undefined}
                      />
                    ))}
                    {/* Fill empty space if odd number */}
                    {row.length === 1 && <View style={{ width: CARD_WIDTH }} />}
                  </View>
                ));
              })()}

              {/* NOUVEAU button */}
              <View style={{ alignItems: "center", marginTop: 8, marginBottom: 8 }}>
                <AnimatedPressable
                  onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)}
                  style={{ alignItems: "center" }}
                >
                  <View
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: 28,
                      backgroundColor: PALETTE.sarcelle,
                      alignItems: "center",
                      justifyContent: "center",
                      shadowColor: PALETTE.sarcelle,
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.3,
                      shadowRadius: 8,
                      elevation: 4,
                    }}
                  >
                    <Ionicons name="add-circle-outline" size={28} color="#FFFFFF" />
                  </View>
                  <Text
                    style={{
                      fontSize: FONT.sizes.xs,
                      fontFamily: FONT_FAMILY.bold,
                      color: PALETTE.sarcelle,
                      textTransform: "uppercase",
                      marginTop: 8,
                      letterSpacing: 1,
                    }}
                  >
                    NOUVEAU
                  </Text>
                </AnimatedPressable>
              </View>
            </View>
          ) : (
            /* Shorts tab - empty state */
            <View style={{ alignItems: "center", paddingVertical: 40 }}>
              <Ionicons name="film-outline" size={48} color="#D0D0D0" />
              <Text style={{ fontSize: FONT.sizes.lg, fontFamily: FONT_FAMILY.semibold, color: "#BBB", marginTop: 12 }}>
                Aucun short pour l'instant
              </Text>
            </View>
          )}
        </View>

        {/* Decorative pink blob for gallery section */}
        <Blob size={180} color={PALETTE.fuchsia} bottom={-40} left={-40} />

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
