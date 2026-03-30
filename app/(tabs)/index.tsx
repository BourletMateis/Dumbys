import { useCallback } from "react";
import {
  View,
  Text,
  Pressable,
  FlatList,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
  Dimensions,
} from "react-native";
import { Image } from "expo-image";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHomeFeed, type HomeFeedVideo } from "@/src/features/feed/useHomeFeed";
import { useMyGroups } from "@/src/features/groups/useMyGroups";
import { useUserProfile } from "@/src/features/profile/useUserProfile";
import { Avatar } from "@/src/components/ui/Avatar";
import { HomeFeedSkeleton } from "@/src/components/Skeleton";
import { getPhaseForDate } from "@/src/hooks/useTimelineLogic";
import {
  PALETTE,
  RADIUS,
  FONT,
  FONT_FAMILY,
  SPACING,
} from "@/src/theme";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_WIDTH = SCREEN_WIDTH;
const THUMBNAIL_HEIGHT = CARD_WIDTH * (9 / 16);

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
        opacity: 0.12,
        top, left, right, bottom,
      }}
    />
  );
}

// ─── Phase ring color ────────────────────────────────────────────
const PHASE_RING: Record<string, string> = {
  upload: "#22C55E",
  vote: "#F97316",
  podium: PALETTE.jaune,
};

// ─── Origin badge config ─────────────────────────────────────────
const ORIGIN_CONFIG = {
  group: { label: "Mon groupe", color: PALETTE.sarcelle },
  friend: { label: "Ami", color: PALETTE.fuchsia },
  discover: { label: "Découvrir", color: "#999" },
} as const;

// ─── Stories bar item ────────────────────────────────────────────
function StoryItem({
  id,
  name,
  coverUrl,
  ringColor,
}: {
  id: string;
  name: string;
  coverUrl: string | null;
  ringColor: string;
}) {
  return (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push({ pathname: "/group/[id]", params: { id } });
      }}
      style={{ alignItems: "center", gap: 5, width: 64 }}
    >
      {/* Ring */}
      <View
        style={{
          width: 56,
          height: 56,
          borderRadius: 28,
          borderWidth: 2.5,
          borderColor: ringColor,
          alignItems: "center",
          justifyContent: "center",
          padding: 2,
        }}
      >
        <Avatar url={coverUrl} username={name} size={46} />
      </View>
      <Text
        numberOfLines={1}
        style={{
          fontSize: FONT.sizes.xs,
          fontFamily: FONT_FAMILY.medium,
          color: "#555",
          maxWidth: 64,
        }}
      >
        {name}
      </Text>
    </Pressable>
  );
}

// ─── Video card ──────────────────────────────────────────────────
function VideoCard({ video, index }: { video: HomeFeedVideo; index: number }) {
  const origin = ORIGIN_CONFIG[video.origin];

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({ pathname: "/feed/home", params: { startIndex: String(index) } } as any);
  };

  const thumbnailSource = video.thumbnail_url
    ? { uri: video.thumbnail_url }
    : null;

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => ({
        opacity: pressed ? 0.93 : 1,
        marginBottom: SPACING.lg,
        borderRadius: 0,
        backgroundColor: "#FFFFFF",
        borderWidth: 1,
        borderColor: "rgba(0,0,0,0.06)",
        overflow: "hidden",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
      })}
    >
      {/* Thumbnail */}
      <View style={{ width: CARD_WIDTH, height: THUMBNAIL_HEIGHT, backgroundColor: "#F0F0F0" }}>
        {thumbnailSource ? (
          <Image
            source={thumbnailSource}
            style={{ width: "100%", height: "100%" }}
            contentFit="cover"
          />
        ) : (
          <View
            style={{
              flex: 1,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: `${PALETTE.fuchsia}10`,
            }}
          >
            <Ionicons name="play-circle-outline" size={40} color={PALETTE.fuchsia} />
          </View>
        )}

        {/* Gradient overlay with all info */}
        <LinearGradient
          colors={["transparent", "rgba(0,0,0,0.7)"]}
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: THUMBNAIL_HEIGHT * 0.6,
            justifyContent: "flex-end",
            padding: SPACING.base,
          }}
        >
          {/* Title */}
          {video.title ? (
            <Text
              numberOfLines={1}
              style={{
                fontSize: FONT.sizes.base,
                fontFamily: FONT_FAMILY.semibold,
                color: "#FFF",
                marginBottom: 4,
              }}
            >
              {video.title}
            </Text>
          ) : null}

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            {/* Submitter + group */}
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6, flex: 1 }}>
              <Avatar
                url={video.submitter.avatar_url}
                username={video.submitter.username}
                size={26}
                borderColor="rgba(255,255,255,0.6)"
                borderWidth={1.5}
              />
              <View style={{ flex: 1 }}>
                <Text
                  numberOfLines={1}
                  style={{
                    color: "#FFF",
                    fontSize: FONT.sizes.sm,
                    fontFamily: FONT_FAMILY.semibold,
                  }}
                >
                  {video.submitter.username}
                </Text>
                {video.group ? (
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 3, marginTop: 1 }}>
                    <Ionicons name="people-outline" size={10} color="rgba(255,255,255,0.6)" />
                    <Text
                      numberOfLines={1}
                      style={{
                        fontSize: FONT.sizes.xs,
                        fontFamily: FONT_FAMILY.regular,
                        color: "rgba(255,255,255,0.6)",
                      }}
                    >
                      {video.group.name}
                    </Text>
                  </View>
                ) : null}
              </View>
            </View>

            {/* Play icon */}
            <View
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: "rgba(255,255,255,0.2)",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons name="play" size={14} color="#FFF" />
            </View>
          </View>
        </LinearGradient>

        {/* Origin badge */}
        <View
          style={{
            position: "absolute",
            top: SPACING.base,
            left: SPACING.base,
            backgroundColor: "rgba(0,0,0,0.45)",
            borderRadius: RADIUS.full,
            paddingHorizontal: 8,
            paddingVertical: 3,
            flexDirection: "row",
            alignItems: "center",
            gap: 4,
          }}
        >
          <View
            style={{
              width: 6,
              height: 6,
              borderRadius: 3,
              backgroundColor: origin.color,
            }}
          />
          <Text
            style={{
              fontSize: FONT.sizes.xs,
              fontFamily: FONT_FAMILY.semibold,
              color: "#FFF",
            }}
          >
            {origin.label}
          </Text>
        </View>
      </View>

    </Pressable>
  );
}

// ─── Section divider ─────────────────────────────────────────────
function SectionDivider({ origin }: { origin: HomeFeedVideo["origin"] }) {
  const cfg = ORIGIN_CONFIG[origin];
  const icons: Record<HomeFeedVideo["origin"], keyof typeof Ionicons.glyphMap> = {
    group: "people",
    friend: "person-add",
    discover: "compass",
  };
  const labels: Record<HomeFeedVideo["origin"], string> = {
    group: "Mes groupes",
    friend: "Mes amis",
    discover: "Découvrir",
  };
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: SPACING["2xl"],
        paddingVertical: SPACING.base,
        gap: 8,
        marginTop: SPACING.xs,
      }}
    >
      <Ionicons name={icons[origin]} size={15} color={cfg.color} />
      <Text
        style={{
          fontSize: FONT.sizes.xs,
          fontFamily: FONT_FAMILY.bold,
          color: cfg.color,
          textTransform: "uppercase",
          letterSpacing: 1.2,
        }}
      >
        {labels[origin]}
      </Text>
      <View style={{ flex: 1, height: 1, backgroundColor: `${cfg.color}25` }} />
    </View>
  );
}

// ─── Main screen ─────────────────────────────────────────────────
export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { data: profile } = useUserProfile();
  const { data: myGroups } = useMyGroups();

  const {
    data,
    isLoading,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
    refetch,
    isRefetching,
  } = useHomeFeed();

  const { phase } = getPhaseForDate(new Date());
  const ringColor = PHASE_RING[phase];

  const videos = data?.pages.flatMap((p) => p) ?? [];

  // Build list items: inject section dividers when origin changes
  type ListItem =
    | { type: "divider"; origin: HomeFeedVideo["origin"]; key: string }
    | { type: "video"; video: HomeFeedVideo; videoIndex: number; key: string };

  const listItems: ListItem[] = [];
  let lastOrigin: HomeFeedVideo["origin"] | null = null;
  let videoIndex = 0;
  for (const video of videos) {
    if (video.origin !== lastOrigin) {
      listItems.push({ type: "divider", origin: video.origin, key: `divider-${video.origin}` });
      lastOrigin = video.origin;
    }
    listItems.push({ type: "video", video, videoIndex: videoIndex++, key: video.id });
  }

  const onEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const renderItem = useCallback(({ item }: { item: ListItem }) => {
    if (item.type === "divider") {
      return <SectionDivider origin={item.origin} />;
    }
    return <VideoCard video={item.video} index={item.videoIndex} />;
  }, []);

  // ── Header component (inside FlatList as ListHeaderComponent) ──
  const ListHeader = (
    <>
      {/* Top bar */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingTop: insets.top + SPACING.base,
          paddingHorizontal: SPACING["2xl"],
          paddingBottom: SPACING.base,
          backgroundColor: "#FFFFFF",
        }}
      >
        {/* User avatar → profile */}
        <Pressable
          hitSlop={8}
          onPress={() => router.push("/(tabs)/profile")}
          style={{
            width: 38,
            height: 38,
            borderRadius: 19,
            overflow: "hidden",
          }}
        >
          <Avatar
            url={profile?.avatar_url}
            username={profile?.username ?? ""}
            size={38}
          />
        </Pressable>

        {/* App name */}
        <Text
          style={{
            fontSize: FONT.sizes["2xl"],
            fontFamily: FONT_FAMILY.black,
            color: "#1A1A1A",
            letterSpacing: -0.5,
          }}
        >
          Dumbys
        </Text>

        {/* Notifications */}
        <Pressable
          hitSlop={12}
          onPress={() => router.push("/notifications" as any)}
          style={{
            width: 38,
            height: 38,
            borderRadius: 12,
            backgroundColor: "rgba(0,0,0,0.04)",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons name="notifications-outline" size={22} color="#333" />
        </Pressable>
      </View>

      {/* Stories / groups bar */}
      {myGroups && myGroups.length > 0 && (
        <View
          style={{
            backgroundColor: "#FFFFFF",
            borderBottomWidth: 1,
            borderBottomColor: "rgba(0,0,0,0.05)",
            paddingBottom: SPACING.lg,
          }}
        >
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{
              paddingHorizontal: SPACING["2xl"],
              paddingTop: SPACING.base,
              gap: SPACING.lg,
            }}
          >
            {myGroups.map((group) => (
              <StoryItem
                key={group.id}
                id={group.id}
                name={group.name}
                coverUrl={group.cover_url}
                ringColor={ringColor}
              />
            ))}
          </ScrollView>
        </View>
      )}

      {/* Feed heading */}
      <View
        style={{
          paddingHorizontal: SPACING["2xl"],
          paddingTop: SPACING.xl,
          paddingBottom: SPACING.base,
        }}
      >
        <Text
          style={{
            fontSize: FONT.sizes.lg,
            fontFamily: FONT_FAMILY.bold,
            color: "#1A1A1A",
          }}
        >
          {profile?.username ? `Salut ${profile.username} 👋` : "Bienvenue"}
        </Text>
        <Text
          style={{
            fontSize: FONT.sizes.sm,
            fontFamily: FONT_FAMILY.regular,
            color: "#AAA",
            marginTop: 2,
          }}
        >
          {phase === "upload"
            ? "Phase upload — montre ce que tu vaux"
            : phase === "vote"
            ? "Phase vote — soutiens tes préférés"
            : "Podium — les résultats sont tombés"}
        </Text>
      </View>
    </>
  );

  const ListFooter = isFetchingNextPage ? (
    <View style={{ paddingVertical: SPACING["2xl"], alignItems: "center" }}>
      <ActivityIndicator color={PALETTE.fuchsia} />
    </View>
  ) : null;

  const ListEmpty = !isLoading ? (
    <View
      style={{
        alignItems: "center",
        paddingTop: 60,
        paddingHorizontal: SPACING["2xl"],
      }}
    >
      <Ionicons name="film-outline" size={52} color="#DDD" />
      <Text
        style={{
          marginTop: SPACING.lg,
          fontSize: FONT.sizes.lg,
          fontFamily: FONT_FAMILY.semibold,
          color: "#CCC",
          textAlign: "center",
        }}
      >
        Pas encore de vidéos
      </Text>
      <Text
        style={{
          marginTop: SPACING.xs,
          fontSize: FONT.sizes.sm,
          fontFamily: FONT_FAMILY.regular,
          color: "#DDD",
          textAlign: "center",
        }}
      >
        Rejoins un groupe ou commence à uploader !
      </Text>
    </View>
  ) : null;

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: "#F8F8FA" }}>
        <Blob size={220} color={PALETTE.fuchsia} top={-60} right={-70} />
        <Blob size={160} color={PALETTE.sarcelle} top={300} left={-60} />
        <Blob size={120} color={PALETTE.jaune} bottom={200} right={-40} />
        {/* Top bar — always visible */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingTop: insets.top + SPACING.base,
            paddingHorizontal: SPACING["2xl"],
            paddingBottom: SPACING.base,
            backgroundColor: "#FFFFFF",
          }}
        >
          <View
            style={{
              width: 38,
              height: 38,
              borderRadius: 12,
              backgroundColor: `${PALETTE.fuchsia}15`,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ fontSize: FONT.sizes.xl, fontFamily: FONT_FAMILY.black, color: PALETTE.fuchsia }}>
              D
            </Text>
          </View>
          <Text style={{ fontSize: FONT.sizes["2xl"], fontFamily: FONT_FAMILY.black, color: "#1A1A1A", letterSpacing: -0.5 }}>
            Dumbys
          </Text>
          <View style={{ width: 38 }} />
        </View>
        <ScrollView showsVerticalScrollIndicator={false}>
          <HomeFeedSkeleton />
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#F8F8FA" }}>
      {/* Decorative blobs */}
      <Blob size={220} color={PALETTE.fuchsia} top={-60} right={-70} />
      <Blob size={160} color={PALETTE.sarcelle} top={280} left={-60} />
      <Blob size={120} color={PALETTE.jaune} bottom={200} right={-40} />
      <Blob size={180} color={PALETTE.fuchsia} bottom={-50} left={-50} />
      <FlatList
        data={listItems}
        keyExtractor={(item) => item.key}
        renderItem={renderItem}
        ListHeaderComponent={ListHeader}
        ListFooterComponent={ListFooter}
        ListEmptyComponent={ListEmpty}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.4}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={PALETTE.fuchsia}
          />
        }
      />
    </View>
  );
}
