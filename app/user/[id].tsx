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
import { PALETTE, RADIUS, FONT, FONT_FAMILY } from "@/src/theme";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const GRID_GAP = 2;
const GRID_COLS = 3;
const TILE_SIZE = (SCREEN_WIDTH - GRID_GAP * (GRID_COLS - 1)) / GRID_COLS;

function formatJoinDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    month: "long",
    year: "numeric",
  });
}

function VideoTile({ video, index, allVideoIds, userId }: { video: PublicVideo; index: number; allVideoIds: string[]; userId: string }) {
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
        backgroundColor: "#F5F5F5",
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
          <Ionicons name="play" size={24} color="#BBB" />
        </View>
      )}
    </AnimatedPressable>
  );
}

function StatItem({ value, label }: { value: number; label: string }) {
  return (
    <View style={{ alignItems: "center", flex: 1 }}>
      <Text
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.7}
        style={{
          color: "#1A1A1A",
          fontSize: FONT.sizes["2xl"],
          fontFamily: FONT_FAMILY.extrabold,
        }}
      >
        {value}
      </Text>
      <Text
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.7}
        style={{
          color: "#999",
          fontSize: FONT.sizes.sm,
          fontFamily: FONT_FAMILY.regular,
          marginTop: 4,
        }}
      >
        {label}
      </Text>
    </View>
  );
}

export default function UserProfileScreen() {
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
        <Stack.Screen options={{ title: "Profil", headerShown: false }} />
        <View style={{ flex: 1, backgroundColor: "#FFFFFF", alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color={PALETTE.sarcelle} />
        </View>
      </>
    );
  }

  if (isError || !profile) {
    return (
      <>
        <Stack.Screen options={{ title: "Profil", headerShown: false }} />
        <View style={{ flex: 1, backgroundColor: "#FFFFFF", alignItems: "center", justifyContent: "center" }}>
          <Text style={{ color: "#F43F5E", fontSize: FONT.sizes.lg, fontFamily: FONT_FAMILY.semibold }}>
            Utilisateur introuvable
          </Text>
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: "", headerShown: false }} />
      <View style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
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
            style={{
              width: 40,
              height: 40,
              borderRadius: RADIUS.sm,
              backgroundColor: "rgba(0,0,0,0.04)",
              alignItems: "center",
              justifyContent: "center",
              borderWidth: 1,
              borderColor: "rgba(0,0,0,0.06)",
            }}
          >
            <Ionicons name="chevron-back" size={20} color="#1A1A1A" />
          </Pressable>
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Profile Header */}
          <View style={{ alignItems: "center", paddingTop: 12, paddingBottom: 28, paddingHorizontal: 16 }}>
            <View
              style={{
                width: 104,
                height: 104,
                borderRadius: 52,
                borderWidth: 2,
                borderColor: "rgba(0,0,0,0.08)",
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
                color: "#1A1A1A",
                fontSize: FONT.sizes["3xl"],
                fontFamily: FONT_FAMILY.extrabold,
                marginTop: 16,
              }}
            >
              {profile.username}
            </Text>
            <Text
              style={{
                color: "#999",
                fontSize: FONT.sizes.md,
                fontFamily: FONT_FAMILY.regular,
                marginTop: 4,
              }}
            >
              Membre depuis {formatJoinDate(profile.created_at)}
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
                  backgroundColor: "rgba(0,0,0,0.04)",
                  borderWidth: 1,
                  borderColor: "rgba(0,0,0,0.06)",
                  minWidth: 140,
                  alignItems: "center",
                }}
              >
                {toggleFollow.isPending ? (
                  <ActivityIndicator size="small" color="#666" />
                ) : (
                  <Text
                    style={{
                      color: "#666",
                      fontSize: FONT.sizes.base,
                      fontFamily: FONT_FAMILY.bold,
                    }}
                  >
                    Abonné
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
                  backgroundColor: PALETTE.sarcelle,
                  paddingHorizontal: 32,
                  paddingVertical: 12,
                  alignItems: "center",
                }}
              >
                {toggleFollow.isPending ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text
                    style={{
                      color: "#FFFFFF",
                      fontSize: FONT.sizes.base,
                      fontFamily: FONT_FAMILY.bold,
                    }}
                  >
                    Suivre
                  </Text>
                )}
              </AnimatedPressable>
            )}
          </View>

          {/* Stats Card */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-evenly",
              marginHorizontal: 16,
              marginBottom: 28,
              paddingVertical: 20,
              backgroundColor: "#F8F8FA",
              borderRadius: RADIUS.xl,
              borderWidth: 1,
              borderColor: "rgba(0,0,0,0.06)",
            }}
          >
            <StatItem value={(videos ?? []).length} label="Vidéos" />
            <StatItem value={followerCount ?? 0} label="Abonnés" />
            <StatItem value={followingCount ?? 0} label="Abonnements" />
          </View>

          {/* Video grid header */}
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 16, marginBottom: 12 }}>
            <Ionicons name="grid" size={14} color={PALETTE.sarcelle} />
            <Text style={{ color: "#999", fontSize: FONT.sizes.xs, fontFamily: FONT_FAMILY.bold, textTransform: "uppercase", letterSpacing: 1.5 }}>
              Vidéos
            </Text>
          </View>

          {/* Videos */}
          {videosPending && (
            <View style={{ alignItems: "center", paddingVertical: 32 }}>
              <ActivityIndicator size="large" color={PALETTE.sarcelle} />
            </View>
          )}

          {!videosPending && (videos ?? []).length === 0 && (
            <EmptyState icon="videocam-outline" title="Pas encore de vidéos" />
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
