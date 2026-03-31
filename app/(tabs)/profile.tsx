import { View, Text, Pressable, ActivityIndicator, ScrollView, RefreshControl, Dimensions, Alert, Share, FlatList } from "react-native";
import { useRouter } from "expo-router";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import type { GroupWithRole } from "@/src/features/groups/useMyGroups";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useUserProfile } from "@/src/features/profile/useUserProfile";
import { useUserStats } from "@/src/features/profile/useUserStats";
import { useMyVideos } from "@/src/features/profile/useMyVideos";
import { useMyGroups } from "@/src/features/groups/useMyGroups";
import { useDeleteVideo } from "@/src/features/feed/useDeleteVideo";
import { useAuthStore } from "@/src/store/useAuthStore";
import { useUpdateAvatar } from "@/src/features/profile/useUpdateAvatar";
import { Avatar } from "@/src/components/ui/Avatar";
import { AnimatedPressable } from "@/src/components/ui/AnimatedPressable";
import { COLORS, PALETTE, RADIUS, FONT, FONT_FAMILY, SPACING, getGroupBannerColor } from "@/src/theme";
import { useTheme } from "@/src/providers/ThemeProvider";

const { width: SCREEN_WIDTH } = Dimensions.get("window");


// ─── Group chip for horizontal scroll ───────────────────────────
function GroupChip({ group, onPress }: { group: GroupWithRole; onPress: () => void }) {
  const banner = getGroupBannerColor(group.id);
  return (
    <Pressable
      onPress={onPress}
      style={{ alignItems: "center", width: 80 }}
    >
      <View style={{ width: 60, height: 60, borderRadius: 18, overflow: "hidden", marginBottom: 6 }}>
        {group.cover_url ? (
          <Image source={{ uri: group.cover_url }} style={{ width: "100%", height: "100%" }} contentFit="cover" />
        ) : (
          <LinearGradient colors={[banner.from, banner.to]} style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
            <Text style={{ fontSize: 18, fontFamily: FONT_FAMILY.black, color: "rgba(255,255,255,0.65)" }}>
              {group.name.slice(0, 2).toUpperCase()}
            </Text>
          </LinearGradient>
        )}
        {!group.is_public && (
          <View style={{ position: "absolute", bottom: 4, right: 4, width: 16, height: 16, borderRadius: 8, backgroundColor: "rgba(0,0,0,0.55)", alignItems: "center", justifyContent: "center" }}>
            <Ionicons name="lock-closed" size={8} color="#FFF" />
          </View>
        )}
      </View>
      <Text style={{ fontSize: FONT.sizes.xs, fontFamily: FONT_FAMILY.semibold, color: "#1A1A1A", textAlign: "center" }} numberOfLines={1}>
        {group.name}
      </Text>
    </Pressable>
  );
}

// ─── Video card for gallery grid ─────────────────────────────────
function VideoGalleryCard({ title, emoji, views, date, thumbnailUrl, width, onPress, onDelete, onShare }: {
  title: string;
  emoji: string;
  views: string;
  date: string;
  thumbnailUrl: string | null;
  width: number;
  onPress?: () => void;
  onDelete?: () => void;
  onShare?: () => void;
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
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onShare?.();
          }}
          style={{
            width: 34,
            height: 34,
            borderRadius: 17,
            backgroundColor: "rgba(0,0,0,0.45)",
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

  const { data: stats } = useUserStats();
  const { data: myVideos } = useMyVideos();
  const { data: groups } = useMyGroups();
  const deleteVideo = useDeleteVideo();

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
          <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
            <Pressable hitSlop={8} onPress={() => router.push("/notifications" as any)}>
              <Ionicons name="notifications-outline" size={22} color="#333" />
            </Pressable>
            <Pressable hitSlop={8} onPress={() => router.push("/settings" as any)}>
              <Ionicons name="settings-outline" size={22} color="#333" />
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
            <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6} style={{ fontSize: FONT.sizes["3xl"], fontFamily: FONT_FAMILY.extrabold, color: "#1A1A1A" }}>
              {"Salut, " + profile.username + " ! 👋"}
            </Text>
            <Text style={{ fontSize: FONT.sizes.base, fontFamily: FONT_FAMILY.regular, color: "#888", marginTop: 2 }}>
              {"@" + profile.username}
            </Text>
          </View>
        </View>

        {/* ─── Stat cards ──────────────────────────────────────── */}
        <View style={{ flexDirection: "row", paddingHorizontal: 20, gap: 10, marginTop: 28 }}>
          {/* Vidéos */}
          <View style={{ flex: 1, backgroundColor: PALETTE.sarcelle, borderRadius: RADIUS.xl, padding: 16, overflow: "hidden", minHeight: 96, justifyContent: "space-between" }}>
            <View style={{ position: "absolute", right: -6, bottom: -6, opacity: 0.18 }}>
              <Ionicons name="videocam" size={64} color="#FFFFFF" />
            </View>
            <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7} style={{ fontSize: FONT.sizes.xs, fontFamily: FONT_FAMILY.bold, color: "#FFFFFF", textTransform: "uppercase", letterSpacing: 1 }}>
              Vidéos
            </Text>
            <Text style={{ fontSize: 34, fontFamily: FONT_FAMILY.black, color: "#FFFFFF" }}>
              {stats?.video_count ?? (myVideos ?? []).length}
            </Text>
          </View>

          {/* Groupes */}
          <View style={{ flex: 1, backgroundColor: PALETTE.fuchsia, borderRadius: RADIUS.xl, padding: 16, overflow: "hidden", minHeight: 96, justifyContent: "space-between" }}>
            <View style={{ position: "absolute", right: -6, bottom: -6, opacity: 0.18 }}>
              <Ionicons name="people" size={64} color="#FFFFFF" />
            </View>
            <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7} style={{ fontSize: FONT.sizes.xs, fontFamily: FONT_FAMILY.bold, color: "#FFFFFF", textTransform: "uppercase", letterSpacing: 1 }}>
              Groupes
            </Text>
            <Text style={{ fontSize: 34, fontFamily: FONT_FAMILY.black, color: "#FFFFFF" }}>
              {stats?.group_count ?? (groups ?? []).length}
            </Text>
          </View>

          {/* Victoires podium */}
          <View style={{ flex: 1, backgroundColor: PALETTE.jaune, borderRadius: RADIUS.xl, padding: 16, overflow: "hidden", minHeight: 96, justifyContent: "space-between" }}>
            <View style={{ position: "absolute", right: -6, bottom: -6, opacity: 0.18 }}>
              <Ionicons name="trophy" size={64} color="#FFFFFF" />
            </View>
            <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7} style={{ fontSize: FONT.sizes.xs, fontFamily: FONT_FAMILY.bold, color: "#FFFFFF", textTransform: "uppercase", letterSpacing: 1 }}>
              Victoires
            </Text>
            <Text style={{ fontSize: 34, fontFamily: FONT_FAMILY.black, color: "#FFFFFF" }}>
              {stats?.win_count ?? 0}
            </Text>
          </View>
        </View>

        {/* ─── Mes Groupes ─────────────────────────────────────── */}
        {(groups ?? []).length > 0 && (
          <View style={{ marginTop: 28 }}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, marginBottom: 14 }}>
              <Text style={{ fontSize: FONT.sizes["3xl"], fontFamily: FONT_FAMILY.extrabold, color: "#1A1A1A" }}>
                Mes Groupes
              </Text>
              <Pressable onPress={() => router.push("/(tabs)/explorer" as any)} hitSlop={8}>
                <Text style={{ fontSize: FONT.sizes.sm, fontFamily: FONT_FAMILY.bold, color: PALETTE.sarcelle }}>Voir tout</Text>
              </Pressable>
            </View>
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={groups ?? []}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ paddingHorizontal: 20, gap: 16 }}
              renderItem={({ item }) => (
                <GroupChip
                  group={item}
                  onPress={() => router.push({ pathname: "/group/[id]", params: { id: item.id } })}
                />
              )}
            />
          </View>
        )}

        {/* ─── Ma Galerie Vidéo ─────────────────────────────────── */}
        <View style={{ marginTop: 32, paddingHorizontal: 20 }}>
          <Text style={{ fontSize: FONT.sizes["3xl"], fontFamily: FONT_FAMILY.extrabold, color: "#1A1A1A", marginBottom: 16 }}>
            Ma Galerie Vidéo
          </Text>

          {/* Video grid */}
          <View>
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
                  : [];

                // Chunk into rows of 2
                const rows: typeof videos[] = [];
                for (let i = 0; i < videos.length; i += 2) {
                  rows.push(videos.slice(i, i + 2));
                }

                if (!hasRealVideos) {
                  return (
                    <View style={{ alignItems: "center", paddingVertical: 40 }}>
                      <Ionicons name="videocam-outline" size={48} color="#D0D0D0" />
                      <Text style={{ fontSize: FONT.sizes.lg, fontFamily: FONT_FAMILY.semibold, color: "#BBB", marginTop: 12 }}>
                        Aucune vidéo pour l'instant
                      </Text>
                      <Text style={{ fontSize: FONT.sizes.sm, fontFamily: FONT_FAMILY.regular, color: "#CCC", marginTop: 4 }}>
                        Poste ta première vidéo !
                      </Text>
                    </View>
                  );
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
                        onShare={hasRealVideos ? () => {
                          Share.share({
                            message: `Regarde ma vidéo "${video.title}" sur Dumbys !`,
                          });
                        } : undefined}
                      />
                    ))}
                    {/* Fill empty space if odd number */}
                    {row.length === 1 && <View style={{ width: CARD_WIDTH }} />}
                  </View>
                ));
              })()}

            </View>
        </View>


      </ScrollView>
    </View>
  );
}
