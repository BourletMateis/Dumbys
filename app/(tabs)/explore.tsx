import { useCallback, useRef, useState, useEffect, memo } from "react";
import {
  View,
  Text,
  Pressable,
  FlatList,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  ViewToken,
  Animated,
  TextInput,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter, useFocusEffect } from "expo-router";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useVideoPlayer, VideoView } from "expo-video";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useCategoryFeed, type CategoryVideo } from "@/src/features/groups/useCategoryFeed";
import { useDiscoverFeed } from "@/src/features/groups/useDiscoverFeed";
import { usePublicGroups, PUBLIC_CATEGORIES } from "@/src/features/groups/usePublicGroups";
import { useCreateGroup, useJoinPublicGroup } from "@/src/features/groups/useGroupActions";
import { useMyGroups } from "@/src/features/groups/useMyGroups";
import { useAllPublicTournaments } from "@/src/features/groups/useAllPublicTournaments";
import { useCreateGroupTournament } from "@/src/features/groups/useGroupTournaments";
import { useLikeCount, useHasLiked, useToggleLike } from "@/src/features/feed/useLikes";
import { useCommentCount } from "@/src/features/feed/useComments";
import { useIsFollowing, useToggleFollow } from "@/src/features/profile/useFollows";
import { useAuthStore } from "@/src/store/useAuthStore";
import { AnimatedPressable } from "@/src/components/ui/AnimatedPressable";
import { BottomSheet } from "@/src/components/ui/BottomSheet";
import { Avatar } from "@/src/components/ui/Avatar";
import { COLORS, PALETTE, GRADIENTS, RADIUS, FONT, FONT_FAMILY } from "@/src/theme";

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get("window");

type ExploreTab = "decouvrir" | "categories" | "arene";

// ─── TikTok-style Feed Item ─────────────────────────────────────
const ExploreFeedItem = memo(function ExploreFeedItem({
  video,
  isActive,
  forcePaused,
}: {
  video: CategoryVideo;
  isActive: boolean;
  forcePaused: boolean;
}) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [isPaused, setIsPaused] = useState(false);
  const [descExpanded, setDescExpanded] = useState(false);
  const pauseIconAnim = useRef(new Animated.Value(0)).current;

  const currentUser = useAuthStore((s) => s.user);
  const { data: likeCount } = useLikeCount(video.id);
  const { data: hasLiked } = useHasLiked(video.id);
  const toggleLike = useToggleLike(video.id);
  const { data: commentCount } = useCommentCount(video.id);
  const isOwnVideo = currentUser?.id === video.submitter.id;
  const { data: isFollowing } = useIsFollowing(video.submitter.id);
  const toggleFollow = useToggleFollow(video.submitter.id);

  const player = useVideoPlayer(video.source_url ?? null, (p) => {
    p.loop = true;
    p.muted = false;
  });

  useEffect(() => {
    if (!player) return;
    if (isActive && !isPaused && !forcePaused) {
      player.play();
    } else {
      player.pause();
      if (!isActive) player.currentTime = 0;
    }
  }, [isActive, isPaused, forcePaused, player]);

  useEffect(() => {
    if (!isActive) setIsPaused(false);
  }, [isActive]);

  const showPauseIcon = () => {
    pauseIconAnim.setValue(0);
    Animated.sequence([
      Animated.timing(pauseIconAnim, { toValue: 1, duration: 150, useNativeDriver: true }),
      Animated.delay(600),
      Animated.timing(pauseIconAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start();
  };

  // Spammable hearts
  const [hearts, setHearts] = useState<
    { id: number; x: number; y: number; size: number; rotation: number; anim: Animated.Value }[]
  >([]);
  const heartId = useRef(0);

  const spawnHeart = () => {
    const id = heartId.current++;
    const x = SCREEN_WIDTH / 2 - 40 + (Math.random() * 160 - 80);
    const y = SCREEN_HEIGHT / 2 - 60 + (Math.random() * 100 - 50);
    const size = 50 + Math.random() * 50;
    const rotation = (Math.random() - 0.5) * 40;
    const anim = new Animated.Value(0);
    setHearts((prev) => [...prev, { id, x, y, size, rotation, anim }]);
    Animated.sequence([
      Animated.spring(anim, { toValue: 1, friction: 3, tension: 150, useNativeDriver: true }),
      Animated.timing(anim, { toValue: 2, duration: 1200, useNativeDriver: true }),
    ]).start(() => setHearts((prev) => prev.filter((h) => h.id !== id)));
  };

  const lastTap = useRef(0);
  const singleTapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleTap = () => {
    const now = Date.now();
    const isDoubleTap = now - lastTap.current < 300;
    lastTap.current = now;
    if (isDoubleTap) {
      if (singleTapTimer.current) { clearTimeout(singleTapTimer.current); singleTapTimer.current = null; }
      if (!hasLiked) toggleLike.mutate();
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      spawnHeart();
    } else {
      singleTapTimer.current = setTimeout(() => {
        singleTapTimer.current = null;
        setIsPaused((prev) => !prev);
        showPauseIcon();
      }, 300);
    }
  };

  const handleLike = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    toggleLike.mutate();
  };

  const openComments = () => {
    router.push({
      pathname: "/video-comments/[id]",
      params: {
        id: video.id,
        thumbnail: video.thumbnail_url ?? "",
        sourceUrl: video.source_url ?? "",
        username: video.submitter.username,
        avatarUrl: video.submitter.avatar_url ?? "",
      },
    });
  };

  const formatCount = (n: number) => {
    if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, "") + "K";
    return String(n);
  };

  return (
    <Pressable
      onPress={handleTap}
      style={{ height: SCREEN_HEIGHT, width: SCREEN_WIDTH, backgroundColor: "#000" }}
    >
      {/* Thumbnail fallback */}
      {video.thumbnail_url && (
        <Image
          source={{ uri: video.thumbnail_url }}
          style={{ position: "absolute", top: 0, left: 0, width: SCREEN_WIDTH, height: SCREEN_HEIGHT }}
          contentFit="cover"
        />
      )}

      {/* Video player */}
      {video.source_url && player ? (
        <VideoView
          player={player}
          style={{ flex: 1 }}
          contentFit="cover"
          nativeControls={false}
        />
      ) : !video.source_url ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <Ionicons name="videocam-off-outline" size={48} color="#666" />
          <Text style={{ color: "#999", fontSize: FONT.sizes.md, marginTop: 8 }}>Vidéo indisponible</Text>
        </View>
      ) : null}

      {/* Spammable hearts */}
      {hearts.map((h) => (
        <Animated.View
          key={h.id}
          pointerEvents="none"
          style={{
            position: "absolute",
            left: h.x,
            top: h.y,
            opacity: h.anim.interpolate({ inputRange: [0, 0.8, 1.5, 2], outputRange: [0, 1, 0.8, 0] }),
            transform: [
              { scale: h.anim.interpolate({ inputRange: [0, 0.4, 1, 2], outputRange: [0.2, 1.4, 1, 1.8] }) },
              { translateY: h.anim.interpolate({ inputRange: [0, 1, 2], outputRange: [0, -10, -180] }) },
              { rotate: `${h.rotation}deg` },
            ],
          }}
        >
          <Ionicons name="heart" size={h.size} color={COLORS.error} />
        </Animated.View>
      ))}

      {/* Pause indicator */}
      <Animated.View
        pointerEvents="none"
        style={{
          position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
          alignItems: "center", justifyContent: "center",
          opacity: pauseIconAnim,
          transform: [{ scale: pauseIconAnim.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] }) }],
        }}
      >
        <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: "rgba(0,0,0,0.65)", alignItems: "center", justifyContent: "center" }}>
          <Ionicons name={isPaused ? "play" : "pause"} size={36} color="#FFF" />
        </View>
      </Animated.View>

      {/* ── Right side actions ── */}
      <View
        style={{
          position: "absolute",
          right: 12,
          bottom: 120 + insets.bottom,
          alignItems: "center",
          gap: 20,
        }}
      >
        {/* Like */}
        <Pressable onPress={handleLike} style={{ alignItems: "center" }}>
          <Ionicons
            name={hasLiked ? "heart" : "heart-outline"}
            size={32}
            color={hasLiked ? COLORS.error : "#FFFFFF"}
          />
          <Text style={{ color: "#FFFFFF", fontSize: FONT.sizes.xs, fontFamily: FONT_FAMILY.bold, marginTop: 2 }}>
            {formatCount(likeCount ?? 0)}
          </Text>
        </Pressable>

        {/* Comments */}
        <Pressable onPress={openComments} style={{ alignItems: "center" }}>
          <Ionicons name="chatbubble-ellipses-outline" size={30} color="#FFFFFF" />
          <Text style={{ color: "#FFFFFF", fontSize: FONT.sizes.xs, fontFamily: FONT_FAMILY.bold, marginTop: 2 }}>
            {formatCount(commentCount ?? 0)}
          </Text>
        </Pressable>

        {/* Share */}
        <Pressable
          onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
          style={{ alignItems: "center" }}
        >
          <Ionicons name="share-social-outline" size={30} color="#FFFFFF" />
        </Pressable>
      </View>

      {/* ── Bottom overlay ── */}
      <View
        style={{ position: "absolute", left: 0, right: 0, bottom: 0 }}
        pointerEvents="box-none"
      >
        <LinearGradient
          colors={["transparent", "rgba(0,0,0,0.85)"]}
          style={{
            paddingLeft: 16,
            paddingRight: 80,
            paddingTop: 60,
            paddingBottom: 36 + insets.bottom,
          }}
          pointerEvents="box-none"
        >
          {/* User row: avatar + username + badge + SUIVRE */}
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}>
            <Pressable
              onPress={() => router.push({ pathname: "/user/[id]", params: { id: video.submitter.id } })}
            >
              <Avatar
                url={video.submitter.avatar_url}
                username={video.submitter.username}
                size={36}
                borderWidth={2}
                borderColor="#FFFFFF"
              />
            </Pressable>
            <Pressable
              onPress={() => router.push({ pathname: "/user/[id]", params: { id: video.submitter.id } })}
              style={{ marginLeft: 10 }}
            >
              <Text style={{ color: "#FFFFFF", fontSize: FONT.sizes.base, fontFamily: FONT_FAMILY.bold }}>
                @{video.submitter.username}
              </Text>
              <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: FONT.sizes.xs, fontFamily: FONT_FAMILY.semibold, textTransform: "uppercase" }}>
                CHALLENGEUR
              </Text>
            </Pressable>

            {/* Follow button — caché pour ses propres vidéos */}
            {!isOwnVideo && (
              <AnimatedPressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  toggleFollow.mutate();
                }}
                disabled={toggleFollow.isPending}
                style={{
                  backgroundColor: isFollowing ? "rgba(255,255,255,0.12)" : PALETTE.sarcelle,
                  paddingHorizontal: 14,
                  paddingVertical: 6,
                  borderRadius: 14,
                  marginLeft: 10,
                  borderWidth: isFollowing ? 1 : 0,
                  borderColor: "rgba(255,255,255,0.3)",
                  minWidth: 72,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {toggleFollow.isPending ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={{
                    color: "#FFFFFF",
                    fontSize: FONT.sizes.xs,
                    fontFamily: FONT_FAMILY.bold,
                  }}>
                    {isFollowing ? "ABONNÉ" : "SUIVRE"}
                  </Text>
                )}
              </AnimatedPressable>
            )}
          </View>

          {/* Challenge name */}
          {video.group?.name ? (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 }}>
              <Ionicons name="trophy" size={12} color={PALETTE.jaune} />
              <Text style={{ color: "#FFFFFF", fontSize: FONT.sizes.sm, fontFamily: FONT_FAMILY.semibold }}>
                {video.group.name.toUpperCase()}
              </Text>
            </View>
          ) : null}

          {/* Description */}
          <Pressable onPress={() => setDescExpanded(!descExpanded)}>
            <Text
              style={{ color: "#FFFFFF", fontSize: FONT.sizes.base, fontFamily: FONT_FAMILY.regular, lineHeight: 20 }}
              numberOfLines={descExpanded ? undefined : 2}
            >
              {video.description || video.title || ""}
            </Text>
          </Pressable>
        </LinearGradient>
      </View>
    </Pressable>
  );
});

// ─── Main Explore Screen ─────────────────────────────────────────
export default function ExploreScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<ExploreTab>("decouvrir");
  const [activeIndex, setActiveIndex] = useState(0);
  const [isFocused, setIsFocused] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>("comedy");
  const [categoryListOpen, setCategoryListOpen] = useState(false);

  // Groupes tab state
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showCreateTournament, setShowCreateTournament] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [groupDesc, setGroupDesc] = useState("");
  const [tournamentTitle, setTournamentTitle] = useState("");
  const [tournamentReward, setTournamentReward] = useState("");
  const [selectedGroupForTournament, setSelectedGroupForTournament] = useState<string | null>(null);

  // Video feed queries — enabled uniquement quand l'onglet est actif
  const discoverQuery = useDiscoverFeed({ enabled: activeTab === "decouvrir" });
  const categoryQuery = useCategoryFeed(selectedCategory ?? "", { enabled: activeTab === "categories" && !!selectedCategory });

  // Community queries — enabled quand l'onglet groupes est actif
  const publicGroupsQuery = usePublicGroups();
  const myGroupsQuery = useMyGroups();
  const tournamentsQuery = useAllPublicTournaments();
  const myTournaments = (tournamentsQuery.data ?? []).filter((t) => t.is_member);

  const joinGroup = useJoinPublicGroup();
  const createGroup = useCreateGroup();
  const createTournament = useCreateGroupTournament();

  const activeQuery = activeTab === "decouvrir" ? discoverQuery : categoryQuery;
  const videos = activeQuery.data;
  const isPending = activeQuery.isPending;

  useFocusEffect(
    useCallback(() => {
      setIsFocused(true);
      return () => setIsFocused(false);
    }, []),
  );

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 60 }).current;
  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index != null) {
        setActiveIndex(viewableItems[0].index);
      }
    },
  ).current;

  const renderItem = useCallback(
    ({ item, index }: { item: CategoryVideo; index: number }) => (
      <ExploreFeedItem
        video={item}
        isActive={index === activeIndex && isFocused}
        forcePaused={!isFocused || activeTab !== "decouvrir" && activeTab !== "categories"}
      />
    ),
    [activeIndex, isFocused, activeTab],
  );

  const handleCreateGroup = () => {
    if (!groupName.trim()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    createGroup.mutate(
      { name: groupName.trim(), description: groupDesc.trim() || undefined, isPublic: true },
      {
        onSuccess: () => { setShowCreateGroup(false); setGroupName(""); setGroupDesc(""); },
        onError: (err) => Alert.alert("Erreur", err.message),
      },
    );
  };

  const handleCreateTournament = () => {
    if (!tournamentTitle.trim() || !selectedGroupForTournament) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    createTournament.mutate(
      {
        groupId: selectedGroupForTournament,
        title: tournamentTitle.trim(),
        reward: tournamentReward.trim() || undefined,
      },
      {
        onSuccess: (data) => {
          setShowCreateTournament(false);
          setTournamentTitle("");
          setTournamentReward("");
          setSelectedGroupForTournament(null);
          if (data?.id) router.push(`/tournament/${data.id}` as any);
        },
        onError: (err) => Alert.alert("Erreur", err.message),
      },
    );
  };

  const TABS_HEIGHT = insets.top + 56;

  return (
    <View style={{ flex: 1, backgroundColor: "#000" }}>

      {/* ── Top tabs overlay ── */}
      <View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 20,
          paddingTop: insets.top + 4,
          paddingHorizontal: 20,
        }}
        pointerEvents="box-none"
      >
        <View style={{ flexDirection: "row", justifyContent: "space-around", alignItems: "center" }}>
          {([
            { key: "decouvrir" as const, label: "DÉCOUVRIR" },
            { key: "categories" as const, label: "CATÉGORIES" },
            { key: "arene" as const, label: "ARÈNE" },
          ]).map(({ key, label }) => (
            <Pressable
              key={key}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                if (key === "categories") {
                  if (activeTab === "categories") {
                    setCategoryListOpen((v) => !v);
                  } else {
                    setActiveTab(key);
                    setCategoryListOpen(true);
                  }
                } else {
                  setActiveTab(key);
                  setCategoryListOpen(false);
                }
              }}
              style={{ paddingVertical: 10, paddingHorizontal: 4 }}
            >
              <Text
                style={{
                  fontSize: FONT.sizes.sm,
                  fontFamily: activeTab === key ? FONT_FAMILY.extrabold : FONT_FAMILY.semibold,
                  color: activeTab === key ? PALETTE.sarcelle : "rgba(255,255,255,0.5)",
                  textTransform: "uppercase",
                  letterSpacing: 1,
                }}
              >
                {label}
              </Text>
              {activeTab === key && (
                <View
                  style={{
                    height: 3,
                    backgroundColor: PALETTE.sarcelle,
                    borderRadius: 2,
                    marginTop: 6,
                    width: "60%",
                    alignSelf: "center",
                  }}
                />
              )}
            </Pressable>
          ))}
        </View>

        {/* Category pills */}
        {activeTab === "categories" && categoryListOpen && (
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
            {PUBLIC_CATEGORIES.map((cat) => (
              <AnimatedPressable
                key={cat.key}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setSelectedCategory(cat.key);
                  setCategoryListOpen(false);
                }}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                  backgroundColor: selectedCategory === cat.key ? PALETTE.sarcelle : "rgba(255,255,255,0.12)",
                  paddingHorizontal: 12,
                  paddingVertical: 7,
                  borderRadius: 16,
                }}
              >
                <Ionicons name={cat.icon} size={14} color={selectedCategory === cat.key ? "#FFF" : cat.color} />
                <Text
                  style={{
                    fontSize: FONT.sizes.xs,
                    fontFamily: FONT_FAMILY.semibold,
                    color: selectedCategory === cat.key ? "#FFF" : "rgba(255,255,255,0.8)",
                  }}
                >
                  {cat.label}
                </Text>
              </AnimatedPressable>
            ))}
          </View>
        )}
      </View>

      {/* ── GROUPES community tab ── */}
      {activeTab === "arene" ? (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            paddingTop: TABS_HEIGHT + 16,
            paddingBottom: 140,
            paddingHorizontal: 16,
          }}
          showsVerticalScrollIndicator={false}
        >
          {/* Create buttons */}
          <View style={{ flexDirection: "row", gap: 12, marginBottom: 32 }}>
            <AnimatedPressable
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setShowCreateGroup(true); }}
              style={{
                flex: 1,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                backgroundColor: PALETTE.sarcelle,
                paddingVertical: 14,
                borderRadius: RADIUS.xl,
              }}
            >
              <Ionicons name="people" size={18} color="#FFF" />
              <Text style={{ fontSize: FONT.sizes.base, fontFamily: FONT_FAMILY.bold, color: "#FFF" }}>
                Nouveau groupe
              </Text>
            </AnimatedPressable>
            <AnimatedPressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                if ((myGroupsQuery.data ?? []).length === 0) {
                  Alert.alert("Aucun groupe", "Crée ou rejoins un groupe d'abord pour pouvoir créer un tournoi.");
                  return;
                }
                setSelectedGroupForTournament((myGroupsQuery.data ?? [])[0]?.id ?? null);
                setShowCreateTournament(true);
              }}
              style={{
                flex: 1,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                backgroundColor: PALETTE.fuchsia,
                paddingVertical: 14,
                borderRadius: RADIUS.xl,
              }}
            >
              <Ionicons name="trophy" size={18} color="#FFF" />
              <Text style={{ fontSize: FONT.sizes.base, fontFamily: FONT_FAMILY.bold, color: "#FFF" }}>
                Nouveau tournoi
              </Text>
            </AnimatedPressable>
          </View>

          {/* Public groups */}
          <Text style={{ fontSize: FONT.sizes.xs, fontFamily: FONT_FAMILY.bold, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: 1.4, marginBottom: 12 }}>
            Groupes publics
          </Text>
          {publicGroupsQuery.isLoading ? (
            <ActivityIndicator color={PALETTE.sarcelle} style={{ paddingVertical: 20 }} />
          ) : (publicGroupsQuery.data ?? []).length === 0 ? (
            <Text style={{ color: "rgba(255,255,255,0.3)", fontSize: FONT.sizes.sm, fontFamily: FONT_FAMILY.regular, paddingVertical: 16 }}>
              Aucun groupe public pour l'instant.
            </Text>
          ) : (publicGroupsQuery.data ?? []).map((group) => (
            <AnimatedPressable
              key={group.id}
              onPress={() => router.push(`/group/${group.id}` as any)}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 14,
                backgroundColor: "rgba(255,255,255,0.06)",
                borderRadius: RADIUS.xl,
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.08)",
                padding: 14,
                marginBottom: 10,
              }}
            >
              {group.cover_url ? (
                <Image source={{ uri: group.cover_url }} style={{ width: 52, height: 52, borderRadius: RADIUS.sm }} contentFit="cover" />
              ) : (
                <View style={{ width: 52, height: 52, borderRadius: RADIUS.sm, backgroundColor: `${PALETTE.sarcelle}20`, alignItems: "center", justifyContent: "center" }}>
                  <Ionicons name="people" size={24} color={PALETTE.sarcelle} />
                </View>
              )}
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: FONT.sizes.base, fontFamily: FONT_FAMILY.bold, color: "#FFF" }} numberOfLines={1}>
                  {group.name}
                </Text>
                <Text style={{ fontSize: FONT.sizes.xs, fontFamily: FONT_FAMILY.regular, color: "rgba(255,255,255,0.45)", marginTop: 2 }}>
                  {group.member_count} membre{group.member_count !== 1 ? "s" : ""}
                  {group.prize ? ` · ${group.prize}` : ""}
                </Text>
              </View>
              {group.is_member ? (
                <View style={{ backgroundColor: `${PALETTE.sarcelle}20`, borderRadius: RADIUS.full, paddingHorizontal: 12, paddingVertical: 5 }}>
                  <Text style={{ fontSize: FONT.sizes.xs, fontFamily: FONT_FAMILY.semibold, color: PALETTE.sarcelle }}>Membre</Text>
                </View>
              ) : (
                <AnimatedPressable
                  onPress={(e) => {
                    e.stopPropagation();
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    joinGroup.mutate(group.id);
                  }}
                  style={{ backgroundColor: PALETTE.fuchsia, borderRadius: RADIUS.full, paddingHorizontal: 12, paddingVertical: 5 }}
                >
                  <Text style={{ fontSize: FONT.sizes.xs, fontFamily: FONT_FAMILY.bold, color: "#FFF" }}>Rejoindre</Text>
                </AnimatedPressable>
              )}
            </AnimatedPressable>
          ))}

          {/* Mes tournois */}
          <Text style={{ fontSize: FONT.sizes.xs, fontFamily: FONT_FAMILY.bold, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: 1.4, marginTop: 28, marginBottom: 12 }}>
            Mes tournois
          </Text>
          {tournamentsQuery.isLoading ? (
            <ActivityIndicator color={PALETTE.sarcelle} style={{ paddingVertical: 20 }} />
          ) : myTournaments.length === 0 ? (
            <Text style={{ color: "rgba(255,255,255,0.3)", fontSize: FONT.sizes.sm, fontFamily: FONT_FAMILY.regular, paddingVertical: 16 }}>
              Rejoins un groupe pour voir ses tournois.
            </Text>
          ) : myTournaments.map((t) => (
            <AnimatedPressable
              key={t.id}
              onPress={() => router.push(`/tournament/${t.id}` as any)}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 14,
                backgroundColor: "rgba(255,255,255,0.06)",
                borderRadius: RADIUS.xl,
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.08)",
                padding: 14,
                marginBottom: 10,
              }}
            >
              <View style={{ width: 52, height: 52, borderRadius: RADIUS.sm, backgroundColor: `${PALETTE.fuchsia}20`, alignItems: "center", justifyContent: "center" }}>
                <Ionicons name="trophy" size={24} color={PALETTE.fuchsia} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: FONT.sizes.base, fontFamily: FONT_FAMILY.bold, color: "#FFF" }} numberOfLines={1}>
                  {t.title}
                </Text>
                <Text style={{ fontSize: FONT.sizes.xs, fontFamily: FONT_FAMILY.regular, color: "rgba(255,255,255,0.45)", marginTop: 2 }}>
                  {t.group.name} · {t.challenge_count} défi{t.challenge_count !== 1 ? "s" : ""}
                  {t.reward ? ` · ${t.reward}` : ""}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.3)" />
            </AnimatedPressable>
          ))}
        </ScrollView>
      ) : (
        /* ── Video Feed (DÉCOUVRIR & CATÉGORIES) ── */
        <>
          {isPending ? (
            <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
              <ActivityIndicator size="large" color={PALETTE.sarcelle} />
            </View>
          ) : !videos || videos.length === 0 ? (
            <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 40 }}>
              <Ionicons name="videocam-outline" size={56} color="#555" />
              <Text style={{ color: "#888", fontSize: FONT.sizes.lg, fontFamily: FONT_FAMILY.semibold, marginTop: 16, textAlign: "center" }}>
                Aucune vidéo pour l'instant
              </Text>
              <Text style={{ color: "#666", fontSize: FONT.sizes.base, fontFamily: FONT_FAMILY.regular, marginTop: 6, textAlign: "center" }}>
                Sois le premier à poster dans cette catégorie !
              </Text>
            </View>
          ) : (
            <FlatList
              style={{ flex: 1 }}
              data={videos}
              keyExtractor={(item) => item.id}
              renderItem={renderItem}
              pagingEnabled
              snapToAlignment="start"
              decelerationRate="fast"
              showsVerticalScrollIndicator={false}
              onViewableItemsChanged={onViewableItemsChanged}
              viewabilityConfig={viewabilityConfig}
              windowSize={3}
              maxToRenderPerBatch={3}
              removeClippedSubviews={false}
              getItemLayout={(_, index) => ({
                length: SCREEN_HEIGHT,
                offset: SCREEN_HEIGHT * index,
                index,
              })}
            />
          )}
        </>
      )}

      {/* ── BottomSheet : Créer un groupe ── */}
      <BottomSheet isOpen={showCreateGroup} onClose={() => { setShowCreateGroup(false); setGroupName(""); setGroupDesc(""); }} snapPoint={0.55}>
        <View style={{ paddingHorizontal: 20, paddingTop: 8 }}>
          <Text style={{ color: "#FFF", fontSize: FONT.sizes["2xl"], fontFamily: FONT_FAMILY.bold, marginBottom: 20 }}>
            Nouveau groupe
          </Text>
          <Text style={{ color: "rgba(255,255,255,0.4)", fontSize: FONT.sizes.xs, fontFamily: FONT_FAMILY.bold, textTransform: "uppercase", letterSpacing: 1.4, marginBottom: 8 }}>
            Nom *
          </Text>
          <TextInput
            value={groupName}
            onChangeText={setGroupName}
            placeholder="Ex : Gym Bros, Dance Crew..."
            placeholderTextColor="rgba(255,255,255,0.25)"
            style={{ backgroundColor: "rgba(255,255,255,0.08)", borderWidth: 1, borderColor: "rgba(255,255,255,0.12)", color: "#FFF", paddingHorizontal: 18, paddingVertical: 15, borderRadius: RADIUS.md, fontSize: FONT.sizes.lg, marginBottom: 16 }}
            maxLength={60}
            autoFocus
          />
          <Text style={{ color: "rgba(255,255,255,0.4)", fontSize: FONT.sizes.xs, fontFamily: FONT_FAMILY.bold, textTransform: "uppercase", letterSpacing: 1.4, marginBottom: 8 }}>
            Description (optionnel)
          </Text>
          <TextInput
            value={groupDesc}
            onChangeText={setGroupDesc}
            placeholder="De quoi parle ce groupe ?"
            placeholderTextColor="rgba(255,255,255,0.25)"
            multiline
            numberOfLines={2}
            style={{ backgroundColor: "rgba(255,255,255,0.08)", borderWidth: 1, borderColor: "rgba(255,255,255,0.12)", color: "#FFF", paddingHorizontal: 18, paddingVertical: 15, borderRadius: RADIUS.md, fontSize: FONT.sizes.lg, marginBottom: 24, minHeight: 64, textAlignVertical: "top" }}
            maxLength={200}
          />
          <AnimatedPressable
            onPress={handleCreateGroup}
            disabled={!groupName.trim() || createGroup.isPending}
            style={{ backgroundColor: groupName.trim() ? PALETTE.sarcelle : "rgba(255,255,255,0.1)", paddingVertical: 16, borderRadius: RADIUS.md, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8 }}
          >
            {createGroup.isPending ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <>
                <Ionicons name="people" size={18} color={groupName.trim() ? "#FFF" : "rgba(255,255,255,0.3)"} />
                <Text style={{ color: groupName.trim() ? "#FFF" : "rgba(255,255,255,0.3)", fontSize: FONT.sizes.lg, fontFamily: FONT_FAMILY.bold }}>
                  Créer le groupe
                </Text>
              </>
            )}
          </AnimatedPressable>
        </View>
      </BottomSheet>

      {/* ── BottomSheet : Créer un tournoi ── */}
      <BottomSheet isOpen={showCreateTournament} onClose={() => { setShowCreateTournament(false); setTournamentTitle(""); setTournamentReward(""); }} snapPoint={0.7}>
        <View style={{ paddingHorizontal: 20, paddingTop: 8 }}>
          <Text style={{ color: "#FFF", fontSize: FONT.sizes["2xl"], fontFamily: FONT_FAMILY.bold, marginBottom: 20 }}>
            Nouveau tournoi
          </Text>

          {/* Group picker */}
          <Text style={{ color: "rgba(255,255,255,0.4)", fontSize: FONT.sizes.xs, fontFamily: FONT_FAMILY.bold, textTransform: "uppercase", letterSpacing: 1.4, marginBottom: 8 }}>
            Dans quel groupe ?
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }} style={{ marginBottom: 20 }}>
            {(myGroupsQuery.data ?? []).map((g) => (
              <AnimatedPressable
                key={g.id}
                onPress={() => setSelectedGroupForTournament(g.id)}
                style={{ backgroundColor: selectedGroupForTournament === g.id ? PALETTE.fuchsia : "rgba(255,255,255,0.1)", borderRadius: RADIUS.full, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: selectedGroupForTournament === g.id ? PALETTE.fuchsia : "rgba(255,255,255,0.12)" }}
              >
                <Text style={{ color: "#FFF", fontSize: FONT.sizes.sm, fontFamily: selectedGroupForTournament === g.id ? FONT_FAMILY.bold : FONT_FAMILY.regular }}>
                  {g.name}
                </Text>
              </AnimatedPressable>
            ))}
          </ScrollView>

          <Text style={{ color: "rgba(255,255,255,0.4)", fontSize: FONT.sizes.xs, fontFamily: FONT_FAMILY.bold, textTransform: "uppercase", letterSpacing: 1.4, marginBottom: 8 }}>
            Titre *
          </Text>
          <TextInput
            value={tournamentTitle}
            onChangeText={setTournamentTitle}
            placeholder="Ex : Tournoi été 2025..."
            placeholderTextColor="rgba(255,255,255,0.25)"
            style={{ backgroundColor: "rgba(255,255,255,0.08)", borderWidth: 1, borderColor: "rgba(255,255,255,0.12)", color: "#FFF", paddingHorizontal: 18, paddingVertical: 15, borderRadius: RADIUS.md, fontSize: FONT.sizes.lg, marginBottom: 16 }}
            maxLength={80}
          />
          <Text style={{ color: "rgba(255,255,255,0.4)", fontSize: FONT.sizes.xs, fontFamily: FONT_FAMILY.bold, textTransform: "uppercase", letterSpacing: 1.4, marginBottom: 8 }}>
            Récompense (optionnel)
          </Text>
          <TextInput
            value={tournamentReward}
            onChangeText={setTournamentReward}
            placeholder="Ex : Pizza party, 50€..."
            placeholderTextColor="rgba(255,255,255,0.25)"
            style={{ backgroundColor: "rgba(255,255,255,0.08)", borderWidth: 1, borderColor: "rgba(255,255,255,0.12)", color: "#FFF", paddingHorizontal: 18, paddingVertical: 15, borderRadius: RADIUS.md, fontSize: FONT.sizes.lg, marginBottom: 24 }}
            maxLength={100}
          />
          <AnimatedPressable
            onPress={handleCreateTournament}
            disabled={!tournamentTitle.trim() || !selectedGroupForTournament || createTournament.isPending}
            style={{ backgroundColor: tournamentTitle.trim() && selectedGroupForTournament ? PALETTE.fuchsia : "rgba(255,255,255,0.1)", paddingVertical: 16, borderRadius: RADIUS.md, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8 }}
          >
            {createTournament.isPending ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <>
                <Ionicons name="trophy" size={18} color={tournamentTitle.trim() && selectedGroupForTournament ? "#FFF" : "rgba(255,255,255,0.3)"} />
                <Text style={{ color: tournamentTitle.trim() && selectedGroupForTournament ? "#FFF" : "rgba(255,255,255,0.3)", fontSize: FONT.sizes.lg, fontFamily: FONT_FAMILY.bold }}>
                  Créer le tournoi
                </Text>
              </>
            )}
          </AnimatedPressable>
        </View>
      </BottomSheet>

    </View>
  );
}
