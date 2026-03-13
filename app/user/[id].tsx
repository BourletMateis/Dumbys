import { useEffect } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  ScrollView,
  Dimensions,
  Pressable,
} from "react-native";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  usePublicProfile,
  usePublicVideos,
  type PublicVideo,
} from "@/src/features/profile/usePublicProfile";
import {
  useIsFollowing,
  useFollowerCount,
  useFollowingCount,
  useToggleFollow,
} from "@/src/features/profile/useFollows";
import { useAuthStore } from "@/src/store/useAuthStore";
import { Avatar } from "@/src/components/ui/Avatar";
import { AnimatedPressable } from "@/src/components/ui/AnimatedPressable";
import { EmptyState } from "@/src/components/ui/EmptyState";
import { COLORS, GRADIENTS, RADIUS, FONT, FONT_FAMILY, SECTION_HEADER_STYLE, HEADER_BUTTON_STYLE } from "@/src/theme";
import { useTheme } from "@/src/providers/ThemeProvider";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const GRID_GAP = 2;
const GRID_COLS = 3;
const TILE_SIZE = (SCREEN_WIDTH - GRID_GAP * (GRID_COLS - 1)) / GRID_COLS;

function formatJoinDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

function VideoTile({ video, index, allVideoIds, userId }: { video: PublicVideo; index: number; allVideoIds: string[]; userId: string }) {
  const { colors } = useTheme();
  const router = useRouter();

  return (
    <AnimatedPressable
      onPress={() => {
        router.push({
          pathname: "/feed/[groupId]",
          params: {
            groupId: "profile",
            userId,
            startIndex: String(index),
            videoIds: JSON.stringify(allVideoIds),
          },
        });
      }}
      style={{
        width: TILE_SIZE,
        height: TILE_SIZE,
        backgroundColor: colors.card,
        borderRadius: RADIUS.xs,
        overflow: "hidden",
      }}
    >
      {video.thumbnail_url ? (
        <Image
          source={{ uri: video.thumbnail_url }}
          style={{ width: TILE_SIZE, height: TILE_SIZE, borderRadius: RADIUS.xs }}
          contentFit="cover"
        />
      ) : (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <Ionicons name="play" size={24} color={colors.textMuted} />
        </View>
      )}
    </AnimatedPressable>
  );
}

function StatItem({ value, label }: { value: number; label: string }) {
  const { colors } = useTheme();
  return (
    <View style={{ alignItems: "center", flex: 1 }}>
      <Text
        style={{
          color: colors.textPrimary,
          fontSize: FONT.sizes["2xl"],
          fontFamily: FONT_FAMILY.extrabold,
        }}
      >
        {value}
      </Text>
      <Text
        style={{
          color: colors.textTertiary,
          fontSize: FONT.sizes.sm,
          marginTop: 4,
        }}
      >
        {label}
      </Text>
    </View>
  );
}

export default function UserProfileScreen() {
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const currentUser = useAuthStore((s) => s.user);

  const { data: profile, isPending, isError } = usePublicProfile(id!);
  const { data: videos, isPending: videosPending } = usePublicVideos(id!);
  const { data: isFollowing } = useIsFollowing(id!);
  const { data: followerCount } = useFollowerCount(id!);
  const { data: followingCount } = useFollowingCount(id!);
  const toggleFollow = useToggleFollow(id!);

  useEffect(() => {
    if (currentUser?.id === id) {
      router.replace("/(tabs)/profile");
    }
  }, [currentUser?.id, id]);

  if (currentUser?.id === id) return null;

  const handleFollow = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    toggleFollow.mutate();
  };

  if (isPending) {
    return (
      <>
        <Stack.Screen options={{ title: "Profile", headerShown: false }} />
        <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color={COLORS.brand} />
        </View>
      </>
    );
  }

  if (isError || !profile) {
    return (
      <>
        <Stack.Screen options={{ title: "Profile", headerShown: false }} />
        <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: "center", justifyContent: "center" }}>
          <Text style={{ color: COLORS.error, fontSize: FONT.sizes.lg, fontWeight: FONT.weights.semibold }}>
            User not found
          </Text>
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: "", headerShown: false }} />
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        {/* Custom header with back button */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingTop: insets.top + 8,
            paddingHorizontal: 16,
            paddingBottom: 8,
          }}
        >
          <Pressable
            onPress={() => router.back()}
            style={HEADER_BUTTON_STYLE as any}
          >
            <Ionicons name="chevron-back" size={20} color={colors.textPrimary} />
          </Pressable>
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Profile Header */}
          <View style={{ alignItems: "center", paddingTop: 12, paddingBottom: 28, paddingHorizontal: 16 }}>
            {/* Avatar with subtle border */}
            <View
              style={{
                width: 104,
                height: 104,
                borderRadius: 52,
                borderWidth: 2,
                borderColor: colors.borderLight,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Avatar
                url={profile.avatar_url}
                username={profile.username}
                size={100}
              />
            </View>
            <Text
              style={{
                color: colors.textPrimary,
                fontSize: FONT.sizes["3xl"],
                fontFamily: FONT_FAMILY.extrabold,
                marginTop: 16,
              }}
            >
              {profile.username}
            </Text>
            <Text
              style={{
                color: colors.textTertiary,
                fontSize: FONT.sizes.md,
                marginTop: 4,
              }}
            >
              Joined {formatJoinDate(profile.created_at)}
            </Text>

            {/* Follow Button */}
            {isFollowing ? (
              <AnimatedPressable
                onPress={handleFollow}
                disabled={toggleFollow.isPending}
                style={{
                  marginTop: 18,
                  paddingHorizontal: 32,
                  paddingVertical: 12,
                  borderRadius: RADIUS.md,
                  backgroundColor: colors.glass,
                  borderWidth: 1,
                  borderColor: colors.border,
                  minWidth: 140,
                  alignItems: "center",
                }}
              >
                {toggleFollow.isPending ? (
                  <ActivityIndicator size="small" color={colors.textSecondary} />
                ) : (
                  <Text
                    style={{
                      color: colors.textSecondary,
                      fontSize: FONT.sizes.base,
                      fontWeight: FONT.weights.bold,
                    }}
                  >
                    Following
                  </Text>
                )}
              </AnimatedPressable>
            ) : (
              <AnimatedPressable
                onPress={handleFollow}
                disabled={toggleFollow.isPending}
                style={{
                  marginTop: 18,
                  borderRadius: RADIUS.md,
                  minWidth: 140,
                  overflow: "hidden",
                }}
              >
                <LinearGradient
                  colors={GRADIENTS.brand}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{
                    paddingHorizontal: 32,
                    paddingVertical: 12,
                    alignItems: "center",
                  }}
                >
                  {toggleFollow.isPending ? (
                    <ActivityIndicator size="small" color={colors.textPrimary} />
                  ) : (
                    <Text
                      style={{
                        color: colors.textPrimary,
                        fontSize: FONT.sizes.base,
                        fontWeight: FONT.weights.bold,
                      }}
                    >
                      Follow
                    </Text>
                  )}
                </LinearGradient>
              </AnimatedPressable>
            )}
          </View>

          {/* Stats - Glass Card */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-evenly",
              marginHorizontal: 16,
              marginBottom: 28,
              paddingVertical: 20,
              backgroundColor: colors.glass,
              borderRadius: RADIUS.xl,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <StatItem value={(videos ?? []).length} label="Videos" />
            <StatItem value={followerCount ?? 0} label="Followers" />
            <StatItem value={followingCount ?? 0} label="Following" />
          </View>

          {/* Video grid header */}
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 16, marginBottom: 12 }}>
            <Ionicons name="grid" size={14} color={COLORS.brand} />
            <Text style={SECTION_HEADER_STYLE}>
              Videos
            </Text>
          </View>

          {/* Videos */}
          {videosPending && (
            <View style={{ alignItems: "center", paddingVertical: 32 }}>
              <ActivityIndicator size="large" color={COLORS.brand} />
            </View>
          )}

          {!videosPending && (videos ?? []).length === 0 && (
            <EmptyState icon="videocam-outline" title="No videos yet" />
          )}

          {!videosPending && (videos ?? []).length > 0 && (
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: GRID_GAP }}>
              {(videos ?? []).map((video, index) => (
                <VideoTile
                  key={video.id}
                  video={video}
                  index={index}
                  allVideoIds={(videos ?? []).map((v) => v.id)}
                  userId={id!}
                />
              ))}
            </View>
          )}
        </ScrollView>
      </View>
    </>
  );
}
