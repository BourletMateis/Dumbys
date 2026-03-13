import { useCallback, useRef, useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  Pressable,
  TextInput,
  FlatList,
  Dimensions,
  ActivityIndicator,
  ViewToken,
  Animated,
  ScrollView,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter, Stack, useFocusEffect } from "expo-router";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useVideoPlayer, VideoView } from "expo-video";
import * as ImagePicker from "expo-image-picker";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useGroupVideos, type GroupVideo } from "@/src/features/groups/useGroupVideos";
import { useUploadGroupVideo } from "@/src/features/groups/useUploadGroupVideo";
import { useLikeCount, useHasLiked, useToggleLike } from "@/src/features/feed/useLikes";
import { useCommentCount } from "@/src/features/feed/useComments";
import { useMyVote, useVoteCounts, useCastVote } from "@/src/features/groups/useWeeklyVote";
import { useTimelineLogic } from "@/src/hooks/useTimelineLogic";
import { supabase } from "@/src/lib/supabase";
import { AnimatedPressable } from "@/src/components/ui/AnimatedPressable";
import { BottomSheet } from "@/src/components/ui/BottomSheet";
import { COLORS, GRADIENTS, RADIUS, FONT, FONT_FAMILY, INPUT_STYLE, SECTION_HEADER_STYLE } from "@/src/theme";
import { useTheme } from "@/src/providers/ThemeProvider";

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get("window");

function FeedItem({
  video,
  isActive,
  canVote,
  isVoted,
  voteCount,
  onVote,
  forcePaused,
}: {
  video: GroupVideo;
  isActive: boolean;
  canVote: boolean;
  isVoted: boolean;
  voteCount: number;
  onVote: () => void;
  forcePaused?: boolean;
}) {
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [descExpanded, setDescExpanded] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
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

  // Reset pause state when becoming inactive
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
      Animated.spring(anim, {
        toValue: 1,
        friction: 3,
        tension: 150,
        useNativeDriver: true,
      }),
      Animated.timing(anim, {
        toValue: 2,
        duration: 1200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setHearts((prev) => prev.filter((h) => h.id !== id));
    });
  };

  const lastTap = useRef(0);
  const singleTapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleTap = () => {
    const now = Date.now();
    const isDoubleTap = now - lastTap.current < 300;
    lastTap.current = now;

    if (isDoubleTap) {
      // Cancel pending single-tap action
      if (singleTapTimer.current) {
        clearTimeout(singleTapTimer.current);
        singleTapTimer.current = null;
      }
      if (!hasLiked) {
        toggleLike.mutate();
      }
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      spawnHeart();
    } else {
      // Delay single-tap to distinguish from double-tap
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

  return (
    <Pressable
      onPress={handleTap}
      style={{ height: SCREEN_HEIGHT, width: SCREEN_WIDTH, backgroundColor: colors.bg }}
    >
      {/* Thumbnail fallback behind video */}
      {video.thumbnail_url && (
        <Image
          source={{ uri: video.thumbnail_url }}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: SCREEN_WIDTH,
            height: SCREEN_HEIGHT,
          }}
          contentFit="cover"
        />
      )}

      {/* Video player (expo-video) */}
      {video.source_url && player ? (
        <VideoView
          player={player}
          style={{ flex: 1 }}
          contentFit="cover"
          nativeControls={false}
        />
      ) : !video.source_url ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <Ionicons name="videocam-off-outline" size={48} color={colors.textMuted} />
          <Text style={{ color: colors.textTertiary, fontSize: FONT.sizes.md, marginTop: 8 }}>Video unavailable</Text>
        </View>
      ) : null}

      {/* Spammable heart animations */}
      {hearts.map((h) => (
        <Animated.View
          key={h.id}
          pointerEvents="none"
          style={{
            position: "absolute",
            left: h.x,
            top: h.y,
            opacity: h.anim.interpolate({
              inputRange: [0, 0.8, 1.5, 2],
              outputRange: [0, 1, 0.8, 0],
            }),
            transform: [
              {
                scale: h.anim.interpolate({
                  inputRange: [0, 0.4, 1, 2],
                  outputRange: [0.2, 1.4, 1, 1.8],
                }),
              },
              {
                translateY: h.anim.interpolate({
                  inputRange: [0, 1, 2],
                  outputRange: [0, -10, -180],
                }),
              },
              { rotate: `${h.rotation}deg` },
            ],
          }}
        >
          <Ionicons name="heart" size={h.size} color={COLORS.error} />
        </Animated.View>
      ))}

      {/* Pause/Play indicator */}
      <Animated.View
        pointerEvents="none"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          alignItems: "center",
          justifyContent: "center",
          opacity: pauseIconAnim,
          transform: [
            {
              scale: pauseIconAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.5, 1],
              }),
            },
          ],
        }}
      >
        <View
          style={{
            width: 72,
            height: 72,
            borderRadius: 36,
            backgroundColor: colors.overlay,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons name={isPaused ? "play" : "pause"} size={36} color={colors.textPrimary} />
        </View>
      </Animated.View>

      {/* Right side actions */}
      <View
        style={{
          position: "absolute",
          right: 12,
          bottom: 100 + insets.bottom,
          alignItems: "center",
          gap: 20,
        }}
      >
        {/* Profile pic */}
        <Pressable
          onPress={() =>
            router.push({ pathname: "/user/[id]", params: { id: video.submitter.id } })
          }
          style={{ alignItems: "center", marginBottom: 4 }}
        >
          {video.submitter.avatar_url ? (
            <Image
              source={{ uri: video.submitter.avatar_url }}
              style={{
                width: 46,
                height: 46,
                borderRadius: 23,
                borderWidth: 2,
                borderColor: colors.textPrimary,
              }}
            />
          ) : (
            <View
              style={{
                width: 46,
                height: 46,
                borderRadius: 23,
                backgroundColor: COLORS.brand,
                alignItems: "center",
                justifyContent: "center",
                borderWidth: 2,
                borderColor: colors.textPrimary,
              }}
            >
              <Text style={{ color: colors.textPrimary, fontSize: FONT.sizes.lg, fontWeight: FONT.weights.bold }}>
                {video.submitter.username.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
        </Pressable>

        {/* Like */}
        <Pressable onPress={handleLike} style={{ alignItems: "center" }}>
          <View
            style={{
              width: 46,
              height: 46,
              borderRadius: RADIUS.full,
              backgroundColor: hasLiked ? "rgba(244,63,94,0.2)" : colors.glass,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons
              name={hasLiked ? "heart" : "heart-outline"}
              size={26}
              color={hasLiked ? COLORS.error : colors.textPrimary}
            />
          </View>
          <Text style={{ color: colors.textPrimary, fontSize: FONT.sizes.xs, fontWeight: FONT.weights.semibold, marginTop: 3 }}>
            {likeCount ?? 0}
          </Text>
        </Pressable>

        {/* Comments */}
        <Pressable onPress={openComments} style={{ alignItems: "center" }}>
          <View
            style={{
              width: 46,
              height: 46,
              borderRadius: RADIUS.full,
              backgroundColor: colors.glass,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name="chatbubble-outline" size={24} color={colors.textPrimary} />
          </View>
          <Text style={{ color: colors.textPrimary, fontSize: FONT.sizes.xs, fontWeight: FONT.weights.semibold, marginTop: 3 }}>
            {commentCount ?? 0}
          </Text>
        </Pressable>

        {/* Vote (weekend only) */}
        {canVote && (
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              onVote();
            }}
            style={{ alignItems: "center" }}
          >
            <View
              style={{
                width: 46,
                height: 46,
                borderRadius: RADIUS.full,
                backgroundColor: isVoted ? COLORS.brand : colors.glass,
                alignItems: "center",
                justifyContent: "center",
                borderWidth: isVoted ? 0 : 1,
                borderColor: colors.border,
              }}
            >
              <Ionicons
                name={isVoted ? "checkmark-circle" : "trophy-outline"}
                size={24}
                color={colors.textPrimary}
              />
            </View>
            <Text style={{ color: colors.textPrimary, fontSize: FONT.sizes.xs, fontWeight: FONT.weights.semibold, marginTop: 3 }}>
              {voteCount}
            </Text>
          </Pressable>
        )}

        {/* Vote count (non-vote phase) */}
        {!canVote && voteCount > 0 && (
          <View style={{ alignItems: "center" }}>
            <View
              style={{
                width: 46,
                height: 46,
                borderRadius: RADIUS.full,
                backgroundColor: "rgba(251,191,36,0.12)",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons name="trophy" size={24} color={COLORS.warning} />
            </View>
            <Text style={{ color: COLORS.warning, fontSize: FONT.sizes.xs, fontWeight: FONT.weights.semibold, marginTop: 3 }}>
              {voteCount}
            </Text>
          </View>
        )}
      </View>

      {/* Bottom: TikTok-style info overlay */}
      <View
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
        }}
        pointerEvents="box-none"
      >
        <LinearGradient
          colors={GRADIENTS.overlay as unknown as string[]}
          style={{
            paddingLeft: 16,
            paddingRight: 80,
            paddingTop: 40,
            paddingBottom: 36 + insets.bottom,
          }}
          pointerEvents="box-none"
        >
          {/* Username */}
          <Pressable
            onPress={() =>
              router.push({ pathname: "/user/[id]", params: { id: video.submitter.id } })
            }
          >
            <Text style={{ color: colors.textPrimary, fontSize: FONT.sizes.lg, fontWeight: FONT.weights.bold }}>
              @{video.submitter.username}
            </Text>
          </Pressable>

          {/* Title */}
          {video.title ? (
            <Text
              style={{
                color: colors.textPrimary,
                fontSize: FONT.sizes.base,
                fontWeight: FONT.weights.semibold,
                marginTop: 6,
              }}
              numberOfLines={1}
            >
              {video.title}
            </Text>
          ) : null}

          {/* Description - expandable */}
          {video.description ? (
            <Pressable
              onPress={() => setDescExpanded(!descExpanded)}
              style={{ marginTop: 4 }}
            >
              {descExpanded ? (
                <ScrollView
                  style={{ maxHeight: 160 }}
                  showsVerticalScrollIndicator={false}
                  nestedScrollEnabled
                >
                  <Text style={{ color: colors.textSecondary, fontSize: FONT.sizes.md, lineHeight: 18 }}>
                    {video.description}
                  </Text>
                  <Text style={{ color: colors.textTertiary, fontSize: FONT.sizes.sm, marginTop: 4 }}>
                    Show less
                  </Text>
                </ScrollView>
              ) : (
                <View style={{ flexDirection: "row", alignItems: "flex-end" }}>
                  <Text
                    style={{ color: colors.textSecondary, fontSize: FONT.sizes.md, lineHeight: 18, flex: 1 }}
                    numberOfLines={2}
                  >
                    {video.description}
                  </Text>
                  {video.description.length > 80 && (
                    <Text style={{ color: COLORS.accent, fontSize: FONT.sizes.sm, marginLeft: 4 }}>
                      more
                    </Text>
                  )}
                </View>
              )}
            </Pressable>
          ) : null}
        </LinearGradient>
      </View>
    </Pressable>
  );
}

export default function FeedScreen() {
  const { colors } = useTheme();
  const { groupId, startIndex, userId, videoIds: videoIdsParam } = useLocalSearchParams<{
    groupId: string;
    startIndex: string;
    userId?: string;
    videoIds?: string;
  }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { weekNumber, year, canVote, canUpload } = useTimelineLogic();

  const isUserMode = !!userId;

  const { data: groupVideos, isPending: groupPending } = useGroupVideos(
    isUserMode ? "__skip__" : groupId!,
    weekNumber,
    year,
  );

  // For user mode, fetch user's videos directly
  const [userVideos, setUserVideos] = useState<GroupVideo[] | null>(null);
  useEffect(() => {
    if (!isUserMode || !userId) return;
    (async () => {
      // Parse video IDs passed as param
      const ids: string[] = videoIdsParam ? JSON.parse(videoIdsParam) : [];
      if (ids.length === 0) {
        setUserVideos([]);
        return;
      }
      const { data, error } = await supabase
        .from("videos")
        .select("id, source_url, video_path, thumbnail_url, title, description, week_number, year, created_at")
        .in("id", ids)
        .order("created_at", { ascending: false });

      if (error || !data) {
        setUserVideos([]);
        return;
      }

      // Fetch submitter info
      const { data: userRow } = await supabase
        .from("users")
        .select("id, username, avatar_url")
        .eq("id", userId)
        .single();

      const submitter = userRow ?? { id: userId, username: "User", avatar_url: null };

      setUserVideos(
        data.map((v) => ({
          id: v.id,
          source_url: v.source_url,
          video_path: v.video_path,
          thumbnail_url: v.thumbnail_url,
          title: v.title,
          description: v.description,
          week_number: v.week_number ?? 0,
          year: v.year ?? 0,
          created_at: v.created_at,
          submitter: {
            id: submitter.id,
            username: submitter.username,
            avatar_url: submitter.avatar_url,
          },
        })),
      );
    })();
  }, [isUserMode, userId, videoIdsParam]);

  const videos = isUserMode ? userVideos : groupVideos;
  const isPending = isUserMode ? userVideos === null : groupPending;

  const { data: myVote } = useMyVote(
    isUserMode ? "__skip__" : groupId!,
    weekNumber,
    year,
  );
  const { data: voteCounts } = useVoteCounts(
    isUserMode ? "__skip__" : groupId!,
    weekNumber,
    year,
  );
  const castVote = useCastVote();
  const uploadMutation = useUploadGroupVideo();

  const initialIndex = parseInt(startIndex ?? "0", 10);
  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const [showUploadPicker, setShowUploadPicker] = useState(false);
  const [pendingVideoUri, setPendingVideoUri] = useState<string | null>(null);
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadDesc, setUploadDesc] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [feedPaused, setFeedPaused] = useState(false);

  // Resume playback when returning to this screen
  useFocusEffect(
    useCallback(() => {
      setFeedPaused(false);
    }, []),
  );

  const handlePickVideo = async () => {
    setShowUploadPicker(false);
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Permission required", "Allow access to your gallery.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["videos"],
      quality: 0.8,
      videoMaxDuration: 60,
    });
    if (result.canceled || !result.assets[0]) return;
    setPendingVideoUri(result.assets[0].uri);
  };

  const handleRecordVideo = async () => {
    setShowUploadPicker(false);
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Permission required", "Allow camera access to record.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["videos"],
      quality: 0.8,
      videoMaxDuration: 60,
    });
    if (result.canceled || !result.assets[0]) return;
    setPendingVideoUri(result.assets[0].uri);
  };

  const doUpload = () => {
    if (!pendingVideoUri) return;
    setIsUploading(true);
    uploadMutation.mutate(
      {
        videoUri: pendingVideoUri,
        groupId: groupId!,
        weekNumber,
        year,
        title: uploadTitle.trim() || undefined,
        description: uploadDesc.trim() || undefined,
      },
      {
        onSuccess: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          setPendingVideoUri(null);
          setUploadTitle("");
          setUploadDesc("");
        },
        onSettled: () => setIsUploading(false),
        onError: (err) => Alert.alert("Upload failed", err.message),
      },
    );
  };

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index != null) {
        setActiveIndex(viewableItems[0].index);
      }
    },
    [],
  );

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 60 }).current;

  if (isPending) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <View
          style={{
            flex: 1,
            backgroundColor: colors.bg,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <ActivityIndicator size="large" color={COLORS.brand} />
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
          justifyContent: "space-between",
          paddingHorizontal: 16,
        }}
      >
        {/* Left: back + upload */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <Pressable
            onPress={() => router.back()}
            style={{
              width: 42,
              height: 42,
              borderRadius: RADIUS.full,
              backgroundColor: COLORS.overlayLight,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
          </Pressable>

          {canUpload && !isUserMode && (
            <LinearGradient
              colors={GRADIENTS.brand as unknown as string[]}
              style={{
                width: 42,
                height: 42,
                borderRadius: RADIUS.full,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  setShowUploadPicker(true);
                }}
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: RADIUS.full,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons name="add" size={24} color={colors.textPrimary} />
              </Pressable>
            </LinearGradient>
          )}
        </View>

        {/* Counter */}
        <View
          style={{
            backgroundColor: colors.overlay,
            paddingHorizontal: 14,
            paddingVertical: 5,
            borderRadius: RADIUS.full,
          }}
        >
          <Text style={{ color: colors.textPrimary, fontSize: FONT.sizes.md, fontWeight: FONT.weights.semibold }}>
            {activeIndex + 1} / {(videos ?? []).length}
          </Text>
        </View>

        {/* Challenge info button */}
        {!isUserMode && (
          <Pressable
            onPress={() => {
              setFeedPaused(true);
              router.push({ pathname: "/group/[id]", params: { id: groupId! } });
            }}
            style={{
              width: 42,
              height: 42,
              borderRadius: RADIUS.full,
              backgroundColor: COLORS.overlayLight,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name="information-circle-outline" size={24} color={colors.textPrimary} />
          </Pressable>
        )}
        {isUserMode && <View style={{ width: 42 }} />}
      </View>

      <FlatList
        data={videos ?? []}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <FeedItem
            video={item}
            isActive={index === activeIndex}
            canVote={canVote}
            isVoted={myVote?.video_id === item.id}
            voteCount={voteCounts?.[item.id] ?? 0}
            forcePaused={feedPaused}
            onVote={() =>
              castVote.mutate({
                videoId: item.id,
                groupId: groupId!,
                weekNumber,
                year,
              })
            }
          />
        )}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        snapToAlignment="start"
        decelerationRate="fast"
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        initialScrollIndex={initialIndex}
        getItemLayout={(_, index) => ({
          length: SCREEN_HEIGHT,
          offset: SCREEN_HEIGHT * index,
          index,
        })}
        windowSize={3}
        maxToRenderPerBatch={3}
        removeClippedSubviews={false}
      />

      {/* Upload picker bottom sheet */}
      <BottomSheet
        isOpen={showUploadPicker}
        onClose={() => setShowUploadPicker(false)}
        snapPoint={0.35}
      >
        <View style={{ paddingHorizontal: 20, paddingTop: 8 }}>
          <Text style={{ color: colors.textPrimary, fontSize: FONT.sizes["2xl"], fontWeight: FONT.weights.bold, marginBottom: 20 }}>
            Add a video
          </Text>
          <AnimatedPressable
            onPress={handlePickVideo}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 14,
              padding: 16,
              backgroundColor: colors.glass,
              borderRadius: RADIUS.lg,
              marginBottom: 10,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <View style={{ width: 44, height: 44, borderRadius: RADIUS.sm, backgroundColor: "rgba(255,45,125,0.15)", alignItems: "center", justifyContent: "center" }}>
              <Ionicons name="images" size={22} color={COLORS.brand} />
            </View>
            <View>
              <Text style={{ color: colors.textPrimary, fontSize: FONT.sizes.lg, fontWeight: FONT.weights.semibold }}>Choose from Gallery</Text>
              <Text style={{ color: colors.textTertiary, fontSize: FONT.sizes.md }}>Pick a video from your library</Text>
            </View>
          </AnimatedPressable>
          <AnimatedPressable
            onPress={handleRecordVideo}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 14,
              padding: 16,
              backgroundColor: colors.glass,
              borderRadius: RADIUS.lg,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <View style={{ width: 44, height: 44, borderRadius: RADIUS.sm, backgroundColor: "rgba(255,45,125,0.15)", alignItems: "center", justifyContent: "center" }}>
              <Ionicons name="videocam" size={22} color={COLORS.brandLight} />
            </View>
            <View>
              <Text style={{ color: colors.textPrimary, fontSize: FONT.sizes.lg, fontWeight: FONT.weights.semibold }}>Record a Video</Text>
              <Text style={{ color: colors.textTertiary, fontSize: FONT.sizes.md }}>Max 60 seconds</Text>
            </View>
          </AnimatedPressable>
        </View>
      </BottomSheet>

      {/* Upload details bottom sheet */}
      <BottomSheet
        isOpen={!!pendingVideoUri}
        onClose={() => {
          setPendingVideoUri(null);
          setUploadTitle("");
          setUploadDesc("");
        }}
        snapPoint={0.5}
      >
        <View style={{ paddingHorizontal: 20, paddingTop: 8 }}>
          <Text style={{ color: colors.textPrimary, fontSize: FONT.sizes["2xl"], fontWeight: FONT.weights.bold, marginBottom: 20 }}>
            New Post
          </Text>

          <Text style={[SECTION_HEADER_STYLE, { marginBottom: 8 }]}>
            Title (optional)
          </Text>
          <TextInput
            value={uploadTitle}
            onChangeText={setUploadTitle}
            placeholder="Give your video a name..."
            placeholderTextColor={colors.textMuted}
            style={{
              ...INPUT_STYLE,
              marginBottom: 16,
            }}
            maxLength={100}
          />

          <Text style={[SECTION_HEADER_STYLE, { marginBottom: 8 }]}>
            Description (optional)
          </Text>
          <TextInput
            value={uploadDesc}
            onChangeText={setUploadDesc}
            placeholder="What's happening in this video?"
            placeholderTextColor={colors.textMuted}
            multiline
            numberOfLines={3}
            style={{
              ...INPUT_STYLE,
              marginBottom: 24,
              minHeight: 80,
              textAlignVertical: "top",
            }}
            maxLength={300}
          />

          <AnimatedPressable
            onPress={doUpload}
            disabled={isUploading}
          >
            <LinearGradient
              colors={GRADIENTS.brand as unknown as string[]}
              style={{
                paddingVertical: 16,
                borderRadius: RADIUS.md,
                alignItems: "center",
                flexDirection: "row",
                justifyContent: "center",
                gap: 8,
              }}
            >
              {isUploading ? (
                <>
                  <ActivityIndicator color={colors.textPrimary} />
                  <Text style={{ color: colors.textPrimary, fontSize: FONT.sizes.lg, fontWeight: FONT.weights.bold }}>Uploading...</Text>
                </>
              ) : (
                <>
                  <Ionicons name="arrow-up-circle" size={20} color={colors.textPrimary} />
                  <Text style={{ color: colors.textPrimary, fontSize: FONT.sizes.lg, fontWeight: FONT.weights.bold }}>Publish</Text>
                </>
              )}
            </LinearGradient>
          </AnimatedPressable>
        </View>
      </BottomSheet>
    </>
  );
}
