import { useCallback, useRef, useState, useEffect } from "react";
import {
  View,
  Text,
  Pressable,
  FlatList,
  Dimensions,
  ActivityIndicator,
  ViewToken,
  Animated,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter, useFocusEffect } from "expo-router";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useVideoPlayer, VideoView } from "expo-video";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useCategoryFeed, type CategoryVideo } from "@/src/features/groups/useCategoryFeed";
import { PUBLIC_CATEGORIES } from "@/src/features/groups/usePublicGroups";
import { useLikeCount, useHasLiked, useToggleLike } from "@/src/features/feed/useLikes";
import { useCommentCount } from "@/src/features/feed/useComments";
import { AnimatedPressable } from "@/src/components/ui/AnimatedPressable";
import { Avatar } from "@/src/components/ui/Avatar";
import { COLORS, PALETTE, GRADIENTS, RADIUS, FONT, FONT_FAMILY } from "@/src/theme";

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get("window");

type ExploreTab = "decouvrir" | "categories" | "tournois";

// ─── TikTok-style Feed Item ─────────────────────────────────────
function ExploreFeedItem({
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

  const { data: likeCount } = useLikeCount(video.id);
  const { data: hasLiked } = useHasLiked(video.id);
  const toggleLike = useToggleLike(video.id);
  const { data: commentCount } = useCommentCount(video.id);

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
          <Text style={{ color: "#FFFFFF", fontSize: FONT.sizes.xs, fontFamily: FONT_FAMILY.bold, marginTop: 2 }}>
            {formatCount(Math.floor(Math.random() * 100))}
          </Text>
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
                PRO CHALLENGEUR
              </Text>
            </Pressable>

            {/* SUIVRE button */}
            <AnimatedPressable
              onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)}
              style={{
                backgroundColor: PALETTE.sarcelle,
                paddingHorizontal: 14,
                paddingVertical: 6,
                borderRadius: 14,
                marginLeft: 10,
              }}
            >
              <Text style={{ color: "#FFFFFF", fontSize: FONT.sizes.xs, fontFamily: FONT_FAMILY.bold }}>
                SUIVRE
              </Text>
            </AnimatedPressable>
          </View>

          {/* Hashtag + challenge name */}
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <View
              style={{
                backgroundColor: "rgba(255,255,255,0.15)",
                paddingHorizontal: 8,
                paddingVertical: 3,
                borderRadius: 6,
              }}
            >
              <Text style={{ color: "#FFFFFF", fontSize: FONT.sizes.xs, fontFamily: FONT_FAMILY.bold }}>
                #WTF
              </Text>
            </View>
            <Text style={{ color: "#FFFFFF", fontSize: FONT.sizes.sm, fontFamily: FONT_FAMILY.semibold }}>
              {"🏆 " + (video.group?.name ?? "CHALLENGE").toUpperCase()}
            </Text>
          </View>

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
}

// ─── Main Explore Screen ─────────────────────────────────────────
export default function ExploreScreen() {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<ExploreTab>("decouvrir");
  const [activeIndex, setActiveIndex] = useState(0);
  const [isFocused, setIsFocused] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Default to first category for "decouvrir"
  const feedCategory = selectedCategory ?? "comedy";
  const { data: videos, isPending, refetch } = useCategoryFeed(feedCategory);

  // Track screen focus to pause videos when navigating away
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
        forcePaused={!isFocused}
      />
    ),
    [activeIndex, isFocused],
  );

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
            { key: "tournois" as const, label: "TOURNOIS" },
          ]).map(({ key, label }) => (
            <Pressable
              key={key}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setActiveTab(key);
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

        {/* Category pills (show when categories tab is active) */}
        {activeTab === "categories" && (
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
            {PUBLIC_CATEGORIES.map((cat) => (
              <AnimatedPressable
                key={cat.key}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setSelectedCategory(cat.key);
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

      {/* ── Video Feed ── */}
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
    </View>
  );
}
