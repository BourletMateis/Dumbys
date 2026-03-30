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
  Share,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useVideoPlayer, VideoView } from "expo-video";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHomeFeed, type HomeFeedVideo } from "@/src/features/feed/useHomeFeed";
import { useLikeCount, useHasLiked, useToggleLike } from "@/src/features/feed/useLikes";
import { useCommentCount } from "@/src/features/feed/useComments";
import { PALETTE, FONT, FONT_FAMILY } from "@/src/theme";

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get("window");
const VIDEO_MARGIN_H = 16;
const VIDEO_MARGIN_V = 12;
const VIDEO_WIDTH = SCREEN_WIDTH - VIDEO_MARGIN_H * 2;
const VIDEO_HEIGHT = SCREEN_HEIGHT - VIDEO_MARGIN_V * 2;
const VIDEO_BORDER_RADIUS = 24;

const ORIGIN_COLOR: Record<HomeFeedVideo["origin"], string> = {
  group: PALETTE.sarcelle,
  friend: PALETTE.fuchsia,
  discover: "#999",
};
const ORIGIN_LABEL: Record<HomeFeedVideo["origin"], string> = {
  group: "Mon groupe",
  friend: "Ami",
  discover: "Découvrir",
};

// ─── Single video item ───────────────────────────────────────────
function HomeFeedItem({ video, isActive }: { video: HomeFeedVideo; isActive: boolean }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();

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
    if (isActive) {
      player.play();
    } else {
      player.pause();
      player.currentTime = 0;
    }
  }, [isActive, player]);

  // Double-tap like
  const [hearts, setHearts] = useState<
    { id: number; x: number; y: number; size: number; rotation: number; anim: Animated.Value }[]
  >([]);
  const heartId = useRef(0);

  const spawnHeart = () => {
    const id = heartId.current++;
    const x = VIDEO_WIDTH / 2 - 40 + (Math.random() * 160 - 80);
    const y = VIDEO_HEIGHT / 2 - 60 + (Math.random() * 100 - 50);
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
  const handleTap = () => {
    const now = Date.now();
    if (now - lastTap.current < 300) {
      if (!hasLiked) toggleLike.mutate();
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      spawnHeart();
    }
    lastTap.current = now;
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

  const originColor = ORIGIN_COLOR[video.origin];

  return (
    <View style={{ height: SCREEN_HEIGHT, width: SCREEN_WIDTH, backgroundColor: "#000", paddingHorizontal: VIDEO_MARGIN_H, paddingVertical: VIDEO_MARGIN_V }}>
    <Pressable
      onPress={handleTap}
      style={{ flex: 1, borderRadius: VIDEO_BORDER_RADIUS, overflow: "hidden", backgroundColor: "#000" }}
    >
      {/* Thumbnail */}
      {video.thumbnail_url && (
        <Image
          source={{ uri: video.thumbnail_url }}
          style={{ position: "absolute", top: 0, left: 0, width: VIDEO_WIDTH, height: VIDEO_HEIGHT }}
          contentFit="cover"
        />
      )}

      {/* Video player */}
      {video.source_url && player ? (
        <VideoView
          player={player}
          style={{ position: "absolute", top: 0, left: 0, width: VIDEO_WIDTH, height: VIDEO_HEIGHT }}
          contentFit="cover"
          nativeControls={false}
        />
      ) : !video.source_url ? (
        <View style={{ position: "absolute", top: 0, left: 0, width: VIDEO_WIDTH, height: VIDEO_HEIGHT, alignItems: "center", justifyContent: "center" }}>
          <Ionicons name="videocam-off-outline" size={48} color="#444" />
          <Text style={{ color: "#555", fontSize: 13, marginTop: 8 }}>Vidéo indisponible</Text>
        </View>
      ) : null}

      {/* Hearts */}
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
          <Ionicons name="heart" size={h.size} color="#ef4444" />
        </Animated.View>
      ))}

      {/* Origin badge */}
      <View
        style={{
          position: "absolute",
          top: insets.top + 10,
          left: 16,
          backgroundColor: "rgba(0,0,0,0.45)",
          borderRadius: 20,
          paddingHorizontal: 10,
          paddingVertical: 4,
          flexDirection: "row",
          alignItems: "center",
          gap: 5,
        }}
      >
        <View style={{ width: 7, height: 7, borderRadius: 3.5, backgroundColor: originColor }} />
        <Text style={{ color: "#FFF", fontSize: FONT.sizes.xs, fontFamily: FONT_FAMILY.semibold }}>
          {ORIGIN_LABEL[video.origin]}
        </Text>
      </View>

      {/* Right side actions */}
      <View
        style={{
          position: "absolute",
          right: 12,
          bottom: 100,
          alignItems: "center",
          gap: 22,
        }}
      >
        {video.submitter.avatar_url ? (
          <Image
            source={{ uri: video.submitter.avatar_url }}
            style={{ width: 44, height: 44, borderRadius: 22, borderWidth: 2, borderColor: "white" }}
          />
        ) : (
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: originColor,
              alignItems: "center",
              justifyContent: "center",
              borderWidth: 2,
              borderColor: "white",
            }}
          >
            <Text style={{ color: "white", fontSize: 16, fontFamily: FONT_FAMILY.bold }}>
              {video.submitter.username.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}

        <Pressable
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); toggleLike.mutate(); }}
          style={{ alignItems: "center" }}
        >
          <Ionicons name={hasLiked ? "heart" : "heart-outline"} size={30} color={hasLiked ? "#ef4444" : "white"} />
          <Text style={{ color: "white", fontSize: 11, fontFamily: FONT_FAMILY.semibold, marginTop: 2 }}>
            {likeCount ?? 0}
          </Text>
        </Pressable>

        <Pressable onPress={openComments} style={{ alignItems: "center" }}>
          <Ionicons name="chatbubble-outline" size={28} color="white" />
          <Text style={{ color: "white", fontSize: 11, fontFamily: FONT_FAMILY.semibold, marginTop: 2 }}>
            {commentCount ?? 0}
          </Text>
        </Pressable>

        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            Share.share({
              message: `Regarde la vidéo "${video.title ?? ""}" de @${video.submitter.username} sur Dumbys !`,
            });
          }}
          style={{ alignItems: "center" }}
        >
          <Ionicons name="share-social-outline" size={28} color="white" />
        </Pressable>
      </View>

      {/* Bottom overlay */}
      <View style={{ position: "absolute", left: 0, right: 0, bottom: 0 }} pointerEvents="box-none">
        <LinearGradient
          colors={["transparent", "rgba(0,0,0,0.25)", "rgba(0,0,0,0.55)"]}
          locations={[0, 0.5, 1]}
          style={{
            paddingLeft: 16,
            paddingRight: 76,
            paddingTop: 60,
            paddingBottom: 36,
          }}
          pointerEvents="box-none"
        >
          <Text
            style={{
              color: "#FFFFFF",
              fontSize: 17,
              fontFamily: FONT_FAMILY.extrabold,
              textShadowColor: "rgba(0,0,0,0.7)",
              textShadowOffset: { width: 0, height: 1 },
              textShadowRadius: 6,
            }}
          >
            @{video.submitter.username}
          </Text>
          {video.title && (
            <Text
              style={{
                color: "rgba(255,255,255,0.55)",
                fontSize: 13,
                fontFamily: FONT_FAMILY.regular,
                marginTop: 4,
                textShadowColor: "rgba(0,0,0,0.4)",
                textShadowOffset: { width: 0, height: 1 },
                textShadowRadius: 3,
              }}
              numberOfLines={2}
            >
              {video.title}
            </Text>
          )}
          {video.group && (
            <View
              style={{
                alignSelf: "flex-start",
                flexDirection: "row",
                alignItems: "center",
                gap: 5,
                marginTop: 8,
                backgroundColor: "rgba(255,255,255,0.10)",
                borderRadius: 20,
                paddingHorizontal: 10,
                paddingVertical: 4,
              }}
            >
              <Ionicons name="people" size={10} color="rgba(255,255,255,0.5)" />
              <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, fontFamily: FONT_FAMILY.medium }}>
                {video.group.name}
              </Text>
            </View>
          )}
        </LinearGradient>
      </View>
    </Pressable>
    </View>
  );
}

// ─── Screen ──────────────────────────────────────────────────────
export default function HomeFeedScreen() {
  const { startIndex } = useLocalSearchParams<{ startIndex?: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const initialIndex = Number(startIndex ?? 0);

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useHomeFeed();
  const videos = data?.pages.flatMap((p) => p).filter((v, i, arr) => arr.findIndex((x) => x.id === v.id) === i) ?? [];

  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const listRef = useRef<FlatList>(null);

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index != null) {
        setActiveIndex(viewableItems[0].index);
      }
    },
    [],
  );

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 60 }).current;

  const onEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (isLoading) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={{ flex: 1, backgroundColor: "#000", alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color="white" />
        </View>
      </>
    );
  }

  if (!videos || videos.length === 0) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={{ flex: 1, backgroundColor: "#000", alignItems: "center", justifyContent: "center" }}>
          <Ionicons name="film-outline" size={56} color="#444" />
          <Text style={{ color: "white", fontSize: 20, fontFamily: FONT_FAMILY.bold, marginTop: 16 }}>
            Aucune vidéo
          </Text>
          <Pressable
            onPress={() => router.back()}
            style={{ marginTop: 24, backgroundColor: "rgba(255,255,255,0.15)", paddingHorizontal: 24, paddingVertical: 12, borderRadius: 20 }}
          >
            <Text style={{ color: "white", fontFamily: FONT_FAMILY.semibold }}>Retour</Text>
          </Pressable>
        </View>
      </>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#000" }}>
      <Stack.Screen options={{ headerShown: false, animation: "fade" }} />

      {/* Back button */}
      <View style={{ position: "absolute", top: VIDEO_MARGIN_V + insets.top + 10, left: VIDEO_MARGIN_H + 16, zIndex: 50 }}>
        <Pressable
          onPress={() => router.back()}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: "rgba(0,0,0,0.5)",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </Pressable>
      </View>

      {/* Counter */}
      <View
        style={{
          position: "absolute",
          top: VIDEO_MARGIN_V + insets.top + 10,
          right: VIDEO_MARGIN_H + 16,
          zIndex: 50,
          backgroundColor: "rgba(0,0,0,0.4)",
          paddingHorizontal: 10,
          paddingVertical: 4,
          borderRadius: 12,
        }}
      >
        <Text style={{ color: "white", fontSize: 12, fontFamily: FONT_FAMILY.semibold }}>
          {activeIndex + 1}/{videos.length}
        </Text>
      </View>

      <FlatList
        ref={listRef}
        style={{ flex: 1 }}
        data={videos}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <HomeFeedItem video={item} isActive={index === activeIndex} />
        )}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        snapToAlignment="start"
        decelerationRate="fast"
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        getItemLayout={(_, index) => ({
          length: SCREEN_HEIGHT,
          offset: SCREEN_HEIGHT * index,
          index,
        })}
        initialScrollIndex={initialIndex}
        windowSize={3}
        maxToRenderPerBatch={3}
        removeClippedSubviews={false}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.5}
      />
    </View>
  );
}
