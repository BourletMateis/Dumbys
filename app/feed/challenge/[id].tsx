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
  ScrollView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useVideoPlayer, VideoView } from "expo-video";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useChallengeVideos, type ChallengeVideo } from "@/src/features/groups/useChallengeVideos";
import { useLikeCount, useHasLiked, useToggleLike } from "@/src/features/feed/useLikes";
import { useCommentCount } from "@/src/features/feed/useComments";

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get("window");

function ChallengeFeedItem({
  video,
  isActive,
}: {
  video: ChallengeVideo;
  isActive: boolean;
}) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [descExpanded, setDescExpanded] = useState(false);

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

  // Double-tap like animation
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

  return (
    <Pressable
      onPress={handleTap}
      style={{ height: SCREEN_HEIGHT, width: SCREEN_WIDTH, backgroundColor: "#000" }}
    >
      {/* Thumbnail behind video */}
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
          <Ionicons name="videocam-off-outline" size={48} color="#444" />
          <Text style={{ color: "#555", fontSize: 13, marginTop: 8 }}>Vidéo indisponible</Text>
        </View>
      ) : null}

      {/* Hearts animation */}
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

      {/* Right side actions */}
      <View
        style={{
          position: "absolute",
          right: 12,
          bottom: 100 + insets.bottom,
          alignItems: "center",
          gap: 22,
        }}
      >
        <Pressable
          onPress={() => router.push({ pathname: "/user/[id]", params: { id: video.submitter.id } })}
          style={{ alignItems: "center", marginBottom: 4 }}
        >
          {video.submitter.avatar_url ? (
            <Image
              source={{ uri: video.submitter.avatar_url }}
              style={{ width: 44, height: 44, borderRadius: 22, borderWidth: 2, borderColor: "white" }}
            />
          ) : (
            <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: "#3b82f6", alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: "white" }}>
              <Text style={{ color: "white", fontSize: 16, fontWeight: "700" }}>
                {video.submitter.username.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
        </Pressable>

        <Pressable
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); toggleLike.mutate(); }}
          style={{ alignItems: "center" }}
        >
          <Ionicons name={hasLiked ? "heart" : "heart-outline"} size={30} color={hasLiked ? "#ef4444" : "white"} />
          <Text style={{ color: "white", fontSize: 11, fontWeight: "600", marginTop: 2 }}>{likeCount ?? 0}</Text>
        </Pressable>

        <Pressable onPress={openComments} style={{ alignItems: "center" }}>
          <Ionicons name="chatbubble-outline" size={28} color="white" />
          <Text style={{ color: "white", fontSize: 11, fontWeight: "600", marginTop: 2 }}>{commentCount ?? 0}</Text>
        </Pressable>
      </View>

      {/* Bottom overlay */}
      <View style={{ position: "absolute", left: 0, right: 0, bottom: 0 }} pointerEvents="box-none">
        <LinearGradient
          colors={["transparent", "rgba(0,0,0,0.7)"]}
          style={{ paddingLeft: 16, paddingRight: 76, paddingTop: 40, paddingBottom: 36 + insets.bottom }}
          pointerEvents="box-none"
        >
          <Pressable onPress={() => router.push({ pathname: "/user/[id]", params: { id: video.submitter.id } })}>
            <Text style={{ color: "white", fontSize: 16, fontWeight: "700" }}>
              @{video.submitter.username}
            </Text>
          </Pressable>

          {video.title ? (
            <Text style={{ color: "white", fontSize: 15, fontWeight: "600", marginTop: 6 }} numberOfLines={1}>
              {video.title}
            </Text>
          ) : null}

          {video.description ? (
            <Pressable onPress={() => setDescExpanded(!descExpanded)} style={{ marginTop: 4 }}>
              {descExpanded ? (
                <ScrollView style={{ maxHeight: 160 }} showsVerticalScrollIndicator={false} nestedScrollEnabled>
                  <Text style={{ color: "rgba(255,255,255,0.85)", fontSize: 13, lineHeight: 18 }}>
                    {video.description}
                  </Text>
                </ScrollView>
              ) : (
                <Text style={{ color: "rgba(255,255,255,0.85)", fontSize: 13, lineHeight: 18 }} numberOfLines={2}>
                  {video.description}
                </Text>
              )}
            </Pressable>
          ) : null}
        </LinearGradient>
      </View>
    </Pressable>
  );
}

export default function ChallengeFeedScreen() {
  const { id, title, startIndex } = useLocalSearchParams<{ id: string; title?: string; startIndex?: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { data: videos, isPending } = useChallengeVideos(id!);
  const [activeIndex, setActiveIndex] = useState(Number(startIndex ?? 0));

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
  const initialIndex = Number(startIndex ?? 0);

  if (isPending) {
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
        <View style={{ flex: 1, backgroundColor: "#000", alignItems: "center", justifyContent: "center", paddingHorizontal: 32 }}>
          <Ionicons name="videocam-outline" size={56} color="#444" />
          <Text style={{ color: "white", fontSize: 20, fontWeight: "700", marginTop: 16 }}>
            Aucune vidéo pour ce défi
          </Text>
          <Pressable
            onPress={() => router.back()}
            style={{ marginTop: 24, backgroundColor: "rgba(255,255,255,0.15)", paddingHorizontal: 24, paddingVertical: 12, borderRadius: 20 }}
          >
            <Text style={{ color: "white", fontWeight: "600" }}>Retour</Text>
          </Pressable>
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false, animation: "fade" }} />

      {/* Header overlay */}
      <View
        style={{
          position: "absolute",
          top: insets.top + 10,
          left: 0,
          right: 0,
          zIndex: 50,
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 16,
        }}
      >
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

        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
            marginLeft: 12,
            backgroundColor: "rgba(0,0,0,0.5)",
            paddingHorizontal: 14,
            paddingVertical: 6,
            borderRadius: 16,
          }}
        >
          <Ionicons name="flag" size={16} color="#FF2D7D" />
          <Text style={{ color: "white", fontSize: 15, fontWeight: "700" }} numberOfLines={1}>
            {title ?? "Défi"}
          </Text>
        </View>

        <View
          style={{
            marginLeft: "auto",
            backgroundColor: "rgba(0,0,0,0.4)",
            paddingHorizontal: 10,
            paddingVertical: 4,
            borderRadius: 12,
          }}
        >
          <Text style={{ color: "white", fontSize: 12, fontWeight: "600" }}>
            {activeIndex + 1}/{videos.length}
          </Text>
        </View>
      </View>

      <FlatList
        style={{ flex: 1 }}
        ref={listRef}
        data={videos}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <ChallengeFeedItem video={item} isActive={index === activeIndex} />
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
      />
    </>
  );
}
