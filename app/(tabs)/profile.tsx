import { useState } from "react";
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
  Dimensions,
  Alert,
  TextInput,
} from "react-native";
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
import { useThemeStore, type ThemePreference } from "@/src/store/useThemeStore";
import { useOnboardingStore } from "@/src/store/useOnboardingStore";
import { supabase } from "@/src/lib/supabase";
import { Avatar } from "@/src/components/ui/Avatar";
import { AnimatedPressable } from "@/src/components/ui/AnimatedPressable";
import { PALETTE, RADIUS, FONT, FONT_FAMILY } from "@/src/theme";
import { useTheme } from "@/src/providers/ThemeProvider";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

type GalleryTab = "videos" | "parametres";

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
      style={{ width, height: cardHeight, borderRadius: 20, overflow: "hidden", backgroundColor: "#2C2C2C" }}
    >
      {thumbnailUrl ? (
        <Image
          source={{ uri: thumbnailUrl }}
          style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
          contentFit="cover"
        />
      ) : (
        <View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "#3A3A3A", alignItems: "center", justifyContent: "center" }}>
          <Ionicons name="videocam" size={36} color="#666" />
        </View>
      )}

      <View style={{ position: "absolute", top: 10, right: 10, flexDirection: "row", gap: 8 }}>
        <AnimatedPressable
          onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
          style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: "rgba(255,255,255,0.25)", alignItems: "center", justifyContent: "center" }}
        >
          <Ionicons name="share-social-outline" size={16} color="#FFF" />
        </AnimatedPressable>
        <AnimatedPressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            Alert.alert("Supprimer la vidéo", "Cette action est irréversible.", [
              { text: "Annuler", style: "cancel" },
              { text: "Supprimer", style: "destructive", onPress: onDelete },
            ]);
          }}
          style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: "rgba(244,63,94,0.35)", alignItems: "center", justifyContent: "center" }}
        >
          <Ionicons name="trash-outline" size={16} color="#FFF" />
        </AnimatedPressable>
      </View>

      <LinearGradient
        colors={["transparent", "rgba(0,0,0,0.7)"]}
        style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: cardHeight * 0.45, justifyContent: "flex-end", padding: 12 }}
      >
        <Text style={{ color: "#FFFFFF", fontSize: FONT.sizes.base, fontFamily: FONT_FAMILY.bold }} numberOfLines={1}>
          {title} {emoji}
        </Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 }}>
          <Ionicons name="play" size={10} color="rgba(255,255,255,0.7)" />
          <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: FONT.sizes.xs, fontFamily: FONT_FAMILY.semibold }}>{views}</Text>
          <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: FONT.sizes.xs, fontFamily: FONT_FAMILY.semibold, textTransform: "uppercase" }}>{date}</Text>
        </View>
      </LinearGradient>
    </Pressable>
  );
}

function Blob({ size, color, top, left, right, bottom }: {
  size: number; color: string;
  top?: number; left?: number; right?: number; bottom?: number;
}) {
  return (
    <View
      style={{
        position: "absolute",
        width: size, height: size, borderRadius: size / 2,
        backgroundColor: color, opacity: 0.15,
        top, left, right, bottom,
      }}
    />
  );
}

const THEME_OPTIONS: { key: ThemePreference; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: "light",  label: "Clair",   icon: "sunny" },
  { key: "dark",   label: "Sombre",  icon: "moon" },
  { key: "system", label: "Système", icon: "phone-portrait" },
];

export default function ProfileScreen() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const signOut = useAuthStore((s) => s.signOut);
  const authLoading = useAuthStore((s) => s.isLoading);
  const updateAvatar = useUpdateAvatar();
  const { preference, setPreference } = useThemeStore();
  const { reset: resetOnboarding } = useOnboardingStore();

  const { data: profile, isPending: profilePending, isError: profileError, refetch, isRefetching } = useUserProfile();
  const { data: myVideos } = useMyVideos();
  const { data: groups } = useMyGroups();
  const deleteVideo = useDeleteVideo();

  const [galleryTab, setGalleryTab] = useState<GalleryTab>("videos");
  const [editingUsername, setEditingUsername] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [savingUsername, setSavingUsername] = useState(false);

  const videosCount = (myVideos ?? []).length;
  const challengesCount = (groups ?? []).length;
  const CARD_GAP = 12;
  const CARD_WIDTH = (SCREEN_WIDTH - 40 - CARD_GAP) / 2;

  const saveUsername = async () => {
    const trimmed = newUsername.trim();
    if (!trimmed || trimmed === profile?.username) { setEditingUsername(false); return; }
    setSavingUsername(true);
    const { error } = await supabase.from("users").update({ username: trimmed }).eq("id", profile!.id);
    setSavingUsername(false);
    if (error) Alert.alert("Erreur", error.message);
    else setEditingUsername(false);
  };

  if (profilePending) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" color={PALETTE.sarcelle} />
      </View>
    );
  }

  if (profileError || !profile) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: "center", justifyContent: "center" }}>
        <Text style={{ color: "#F43F5E", fontSize: FONT.sizes.lg, fontFamily: FONT_FAMILY.semibold }}>
          Failed to load profile
        </Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Blob size={200} color={PALETTE.sarcelle} top={-30} right={-60} />
      <Blob size={140} color={PALETTE.fuchsia} bottom={300} left={-50} />
      <Blob size={100} color={PALETTE.jaune} bottom={200} right={-30} />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 160 }}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={PALETTE.sarcelle} />}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── Top bar ─────────────────────────────────────────── */}
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: insets.top + 8, paddingHorizontal: 20, paddingBottom: 8 }}>
          <Text style={{ fontSize: FONT.sizes.lg, fontFamily: FONT_FAMILY.bold, color: PALETTE.sarcelle }}>
            Dumbeez
          </Text>
          <Pressable
            hitSlop={12}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setGalleryTab("parametres"); }}
          >
            <Ionicons name="settings-outline" size={22} color={colors.textSecondary} />
          </Pressable>
        </View>

        {/* ─── Profile header ──────────────────────────────────── */}
        <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 20, marginTop: 24 }}>
          <View style={{ position: "relative" }}>
            <Pressable onPress={() => updateAvatar.mutate()} disabled={updateAvatar.isPending}>
              <Avatar url={profile.avatar_url} username={profile.username} size={80} />
            </Pressable>
            <View
              style={{
                position: "absolute",
                bottom: -2, left: -2,
                width: 28, height: 28, borderRadius: 14,
                backgroundColor: PALETTE.sarcelle,
                alignItems: "center", justifyContent: "center",
                borderWidth: 3,
                borderColor: colors.bg,
              }}
            >
              <Ionicons name="flash" size={14} color="#FFFFFF" />
            </View>
          </View>

          <View style={{ marginLeft: 16, flex: 1 }}>
            <Text style={{ fontSize: FONT.sizes["3xl"], fontFamily: FONT_FAMILY.extrabold, color: colors.textPrimary }}>
              {"Salut, " + profile.username + " ! 👋"}
            </Text>
            <Text style={{ fontSize: FONT.sizes.base, fontFamily: FONT_FAMILY.regular, color: colors.textTertiary, marginTop: 2 }}>
              {"@" + profile.username}
            </Text>
          </View>
        </View>

        {/* ─── Stat cards ──────────────────────────────────────── */}
        <View style={{ flexDirection: "row", paddingHorizontal: 20, gap: 12, marginTop: 28 }}>
          <View style={{ flex: 1, backgroundColor: PALETTE.sarcelle, borderRadius: RADIUS.xl, padding: 20, overflow: "hidden", minHeight: 110, justifyContent: "space-between" }}>
            <View style={{ position: "absolute", right: -8, bottom: -8, opacity: 0.2 }}>
              <Ionicons name="trophy" size={80} color="#FFFFFF" />
            </View>
            <Text style={{ fontSize: FONT.sizes.xs, fontFamily: FONT_FAMILY.bold, color: "#FFFFFF", textTransform: "uppercase", letterSpacing: 1.2 }}>
              Défis relevés
            </Text>
            <Text style={{ fontSize: 42, fontFamily: FONT_FAMILY.black, color: "#FFFFFF", marginTop: 4 }}>
              {challengesCount}
            </Text>
          </View>

          <View style={{ flex: 1, backgroundColor: PALETTE.fuchsia, borderRadius: RADIUS.xl, padding: 20, overflow: "hidden", minHeight: 110, justifyContent: "space-between" }}>
            <View style={{ position: "absolute", right: -8, bottom: -8, opacity: 0.2 }}>
              <Ionicons name="videocam" size={80} color="#FFFFFF" />
            </View>
            <Text style={{ fontSize: FONT.sizes.xs, fontFamily: FONT_FAMILY.bold, color: "#FFFFFF", textTransform: "uppercase", letterSpacing: 1.2 }}>
              Vidéos
            </Text>
            <Text style={{ fontSize: 42, fontFamily: FONT_FAMILY.black, color: "#FFFFFF", marginTop: 4 }}>
              {videosCount}
            </Text>
          </View>
        </View>

        {/* ─── Gallery / Paramètres tabs ───────────────────────── */}
        <View style={{ marginTop: 32, paddingHorizontal: 20 }}>
          <Text style={{ fontSize: FONT.sizes["3xl"], fontFamily: FONT_FAMILY.extrabold, color: colors.textPrimary, marginBottom: 16 }}>
            {galleryTab === "videos" ? "Ma Galerie Vidéo" : "Paramètres"}
          </Text>

          {/* Tab selector */}
          <View
            style={{
              flexDirection: "row",
              backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "#F2F2F2",
              borderRadius: 25,
              padding: 4,
              marginBottom: 20,
            }}
          >
            {([
              { key: "videos" as const, label: "Vidéos", icon: "videocam-outline" as const },
              { key: "parametres" as const, label: "Paramètres", icon: "settings-outline" as const },
            ]).map(({ key, label, icon }) => {
              const active = galleryTab === key;
              return (
                <Pressable
                  key={key}
                  onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setGalleryTab(key); }}
                  style={{
                    flex: 1,
                    paddingVertical: 10,
                    alignItems: "center",
                    borderRadius: 22,
                    flexDirection: "row",
                    justifyContent: "center",
                    gap: 6,
                    backgroundColor: active ? (isDark ? "#2C2C2C" : "#FFFFFF") : "transparent",
                    ...(active ? { shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 } : {}),
                  }}
                >
                  <Ionicons name={icon} size={14} color={active ? PALETTE.sarcelle : colors.textTertiary} />
                  <Text style={{ fontSize: FONT.sizes.base, fontFamily: active ? FONT_FAMILY.semibold : FONT_FAMILY.medium, color: active ? PALETTE.sarcelle : colors.textTertiary }}>
                    {label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* ── Vidéos tab content ──────────────────────────────── */}
          {galleryTab === "videos" ? (
            <View>
              {(() => {
                const videos = (myVideos ?? []).map((v, index) => ({
                  id: v.id,
                  videoPath: v.video_path,
                  index,
                  title: v.group?.name ?? "Vidéo",
                  emoji: "",
                  views: "—",
                  date: new Date(v.created_at).toLocaleDateString("fr-FR", { month: "short", year: "numeric" }).toUpperCase(),
                  thumbnail: v.thumbnail_url,
                }));

                if (videos.length === 0) {
                  return (
                    <View style={{ alignItems: "center", paddingVertical: 40 }}>
                      <Ionicons name="videocam-outline" size={48} color={isDark ? "#505050" : "#D0D0D0"} />
                      <Text style={{ fontSize: FONT.sizes.lg, fontFamily: FONT_FAMILY.semibold, color: colors.textTertiary, marginTop: 12 }}>
                        Aucune vidéo pour l'instant
                      </Text>
                      <Text style={{ fontSize: FONT.sizes.sm, fontFamily: FONT_FAMILY.regular, color: colors.textMuted, marginTop: 4 }}>
                        Poste ta première vidéo !
                      </Text>
                    </View>
                  );
                }

                const rows: typeof videos[] = [];
                for (let i = 0; i < videos.length; i += 2) rows.push(videos.slice(i, i + 2));

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
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          router.push({ pathname: "/feed/my-videos", params: { startIndex: String(video.index) } });
                        }}
                        onDelete={() => deleteVideo.mutate({ videoId: video.id, videoPath: (video as any).videoPath })}
                      />
                    ))}
                    {row.length === 1 && <View style={{ width: CARD_WIDTH }} />}
                  </View>
                ));
              })()}

              {/* Add video button */}
              <View style={{ alignItems: "center", marginTop: 8, marginBottom: 8 }}>
                <AnimatedPressable
                  onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); router.push("/(tabs)/upload"); }}
                  style={{ alignItems: "center" }}
                >
                  <View
                    style={{
                      width: 56, height: 56, borderRadius: 28,
                      backgroundColor: PALETTE.sarcelle,
                      alignItems: "center", justifyContent: "center",
                      shadowColor: PALETTE.sarcelle,
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
                    }}
                  >
                    <Ionicons name="add-circle-outline" size={28} color="#FFFFFF" />
                  </View>
                  <Text style={{ fontSize: FONT.sizes.xs, fontFamily: FONT_FAMILY.bold, color: PALETTE.sarcelle, textTransform: "uppercase", marginTop: 8, letterSpacing: 1 }}>
                    NOUVEAU
                  </Text>
                </AnimatedPressable>
              </View>
            </View>
          ) : (
            /* ── Paramètres tab content ──────────────────────────── */
            <View>

              {/* ── Compte ── */}
              <View
                style={{
                  borderRadius: RADIUS.xl,
                  backgroundColor: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)",
                  borderWidth: 1,
                  borderColor: colors.border,
                  overflow: "hidden",
                  marginBottom: 24,
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", padding: 16, gap: 14 }}>
                  <Avatar url={profile.avatar_url} username={profile.username} size={48} />
                  <View style={{ flex: 1 }}>
                    {editingUsername ? (
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                        <TextInput
                          value={newUsername}
                          onChangeText={setNewUsername}
                          autoFocus
                          style={{
                            flex: 1,
                            fontSize: FONT.sizes.base,
                            fontFamily: FONT_FAMILY.semibold,
                            color: colors.textPrimary,
                            borderBottomWidth: 1.5,
                            borderBottomColor: PALETTE.sarcelle,
                            paddingBottom: 4,
                          }}
                          onSubmitEditing={saveUsername}
                          returnKeyType="done"
                        />
                        {savingUsername ? (
                          <ActivityIndicator size="small" color={PALETTE.sarcelle} />
                        ) : (
                          <Pressable onPress={saveUsername} hitSlop={8}>
                            <Ionicons name="checkmark-circle" size={24} color={PALETTE.sarcelle} />
                          </Pressable>
                        )}
                      </View>
                    ) : (
                      <Text style={{ fontSize: FONT.sizes.base, fontFamily: FONT_FAMILY.semibold, color: colors.textPrimary }}>
                        {profile.username}
                      </Text>
                    )}
                    <Text style={{ fontSize: FONT.sizes.sm, fontFamily: FONT_FAMILY.regular, color: colors.textTertiary, marginTop: 2 }}>
                      {profile.role ?? "Membre"}
                    </Text>
                  </View>
                  {!editingUsername && (
                    <Pressable onPress={() => { setNewUsername(profile.username); setEditingUsername(true); }} hitSlop={8}>
                      <Ionicons name="pencil-outline" size={18} color={colors.textTertiary} />
                    </Pressable>
                  )}
                </View>
              </View>

              {/* ── Apparence ── */}
              <Text style={{ fontSize: FONT.sizes.xs, fontFamily: FONT_FAMILY.bold, color: isDark ? "#505050" : "#AAAAAA", textTransform: "uppercase", letterSpacing: 1.4, marginBottom: 10 }}>
                Apparence
              </Text>
              <View
                style={{
                  borderRadius: RADIUS.xl,
                  backgroundColor: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)",
                  borderWidth: 1,
                  borderColor: colors.border,
                  padding: 16,
                  marginBottom: 24,
                }}
              >
                <Text style={{ fontSize: FONT.sizes.sm, fontFamily: FONT_FAMILY.medium, color: colors.textSecondary, marginBottom: 12 }}>
                  Thème de l'application
                </Text>
                <View style={{ flexDirection: "row", gap: 10 }}>
                  {THEME_OPTIONS.map((opt) => {
                    const active = preference === opt.key;
                    return (
                      <AnimatedPressable
                        key={opt.key}
                        onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setPreference(opt.key); }}
                        style={{
                          flex: 1,
                          alignItems: "center",
                          paddingVertical: 12,
                          borderRadius: RADIUS.lg,
                          backgroundColor: active ? `${PALETTE.sarcelle}18` : (isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)"),
                          borderWidth: active ? 1.5 : 1,
                          borderColor: active ? PALETTE.sarcelle : colors.border,
                          gap: 6,
                        }}
                      >
                        <Ionicons name={opt.icon} size={18} color={active ? PALETTE.sarcelle : colors.textTertiary} />
                        <Text style={{ fontSize: FONT.sizes.xs, fontFamily: active ? FONT_FAMILY.semibold : FONT_FAMILY.regular, color: active ? PALETTE.sarcelle : colors.textTertiary }}>
                          {opt.label}
                        </Text>
                      </AnimatedPressable>
                    );
                  })}
                </View>
              </View>

              {/* ── Application ── */}
              <Text style={{ fontSize: FONT.sizes.xs, fontFamily: FONT_FAMILY.bold, color: isDark ? "#505050" : "#AAAAAA", textTransform: "uppercase", letterSpacing: 1.4, marginBottom: 10 }}>
                Application
              </Text>
              <View
                style={{
                  borderRadius: RADIUS.xl,
                  backgroundColor: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)",
                  borderWidth: 1,
                  borderColor: colors.border,
                  overflow: "hidden",
                  marginBottom: 24,
                }}
              >
                <Pressable
                  onPress={async () => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    await resetOnboarding();
                    router.push("/onboarding");
                  }}
                  style={({ pressed }) => ({
                    backgroundColor: pressed ? (isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)") : "transparent",
                  })}
                >
                  <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14 }}>
                    <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)", alignItems: "center", justifyContent: "center", marginRight: 14 }}>
                      <Ionicons name="book-outline" size={16} color={isDark ? "#A0A0A0" : "#666"} />
                    </View>
                    <Text style={{ flex: 1, fontSize: FONT.sizes.base, fontFamily: FONT_FAMILY.medium, color: colors.textPrimary }}>
                      Revoir le guide
                    </Text>
                    <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
                  </View>
                </Pressable>
                <View style={{ height: 1, backgroundColor: colors.border, marginHorizontal: 16 }} />
                <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14 }}>
                  <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)", alignItems: "center", justifyContent: "center", marginRight: 14 }}>
                    <Ionicons name="information-circle-outline" size={16} color={isDark ? "#A0A0A0" : "#666"} />
                  </View>
                  <Text style={{ flex: 1, fontSize: FONT.sizes.base, fontFamily: FONT_FAMILY.medium, color: colors.textPrimary }}>
                    Version
                  </Text>
                  <Text style={{ fontSize: FONT.sizes.sm, fontFamily: FONT_FAMILY.regular, color: colors.textTertiary }}>1.0.0</Text>
                </View>
              </View>

              {/* ── Déconnexion ── */}
              <View
                style={{
                  borderRadius: RADIUS.xl,
                  backgroundColor: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)",
                  borderWidth: 1,
                  borderColor: colors.border,
                  overflow: "hidden",
                }}
              >
                <Pressable
                  onPress={() => {
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                    Alert.alert("Se déconnecter", "Tu veux vraiment te déconnecter ?", [
                      { text: "Annuler", style: "cancel" },
                      { text: "Déconnecter", style: "destructive", onPress: signOut },
                    ]);
                  }}
                  style={({ pressed }) => ({
                    backgroundColor: pressed ? "rgba(244,63,94,0.06)" : "transparent",
                  })}
                >
                  <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14 }}>
                    <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: "rgba(244,63,94,0.12)", alignItems: "center", justifyContent: "center", marginRight: 14 }}>
                      <Ionicons name="log-out-outline" size={16} color="#F43F5E" />
                    </View>
                    <Text style={{ flex: 1, fontSize: FONT.sizes.base, fontFamily: FONT_FAMILY.medium, color: "#F43F5E" }}>
                      {authLoading ? "Déconnexion…" : "Se déconnecter"}
                    </Text>
                  </View>
                </Pressable>
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
