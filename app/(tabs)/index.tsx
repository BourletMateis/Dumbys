import { useCallback, useState } from "react";
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

// ─── Layout constants (match Skeleton.tsx exactly) ───────────────
const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_MARGIN_H = 24;
const CARD_WIDTH = SCREEN_WIDTH - CARD_MARGIN_H * 2;
const THUMB_HEIGHT = CARD_WIDTH * (9 / 16);

// ─── Phase ring color ────────────────────────────────────────────
const PHASE_RING: Record<string, string> = {
  upload: "#22C55E",
  vote: "#F97316",
  podium: PALETTE.jaune,
};

// ─── Origin badge config ─────────────────────────────────────────
const ORIGIN_CONFIG = {
  group: { label: "Mon groupe", color: PALETTE.sarcelle, icon: "people" as const },
  friend: { label: "Ami", color: PALETTE.fuchsia, icon: "person-add" as const },
  discover: { label: "Découvrir", color: "#999", icon: "compass" as const },
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

  return (
    <View
      style={{
        marginHorizontal: 24,
        marginBottom: 20,
        borderRadius: 20,
        backgroundColor: "#FFFFFF",
        overflow: "hidden",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 4,
      }}
    >
      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          router.push({ pathname: "/feed/home", params: { startIndex: String(index) } } as any);
        }}
      >
        {/* Thumbnail */}
        <View style={{ aspectRatio: 16 / 9, backgroundColor: "#E8E8E8" }}>
          {video.thumbnail_url ? (
            <Image
              source={{ uri: video.thumbnail_url }}
              style={{ width: "100%", height: "100%" }}
              contentFit="cover"
            />
          ) : (
            <View
              style={{
                flex: 1,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: `${PALETTE.fuchsia}08`,
              }}
            >
              <Ionicons name="play-circle-outline" size={40} color={PALETTE.fuchsia} />
            </View>
          )}

          {/* Gradient overlay */}
          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.65)"]}
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: "55%",
              justifyContent: "flex-end",
              padding: 14,
            }}
          >
            {video.title ? (
              <Text
                numberOfLines={1}
                style={{
                  fontSize: FONT.sizes.base,
                  fontFamily: FONT_FAMILY.semibold,
                  color: "#FFF",
                  marginBottom: 6,
                }}
              >
                {video.title}
              </Text>
            ) : null}

            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flex: 1 }}>
                <Avatar
                  url={video.submitter.avatar_url}
                  username={video.submitter.username}
                  size={28}
                  borderColor="rgba(255,255,255,0.7)"
                  borderWidth={1.5}
                />
                <View style={{ flex: 1 }}>
                  <Text
                    numberOfLines={1}
                    style={{ color: "#FFF", fontSize: FONT.sizes.sm, fontFamily: FONT_FAMILY.semibold }}
                  >
                    {video.submitter.username}
                  </Text>
                  {video.group ? (
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 3, marginTop: 2 }}>
                      <Ionicons name="people-outline" size={10} color="rgba(255,255,255,0.6)" />
                      <Text
                        numberOfLines={1}
                        style={{ fontSize: FONT.sizes.xs, fontFamily: FONT_FAMILY.regular, color: "rgba(255,255,255,0.6)" }}
                      >
                        {video.group.name}
                      </Text>
                    </View>
                  ) : null}
                </View>
              </View>

              <View
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 17,
                  backgroundColor: "rgba(255,255,255,0.15)",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons name="play" size={15} color="#FFF" />
              </View>
            </View>
          </LinearGradient>

          {/* Origin badge */}
          <View
            style={{
              position: "absolute",
              top: 12,
              left: 12,
              backgroundColor: "rgba(0,0,0,0.5)",
              borderRadius: RADIUS.full,
              paddingHorizontal: 10,
              paddingVertical: 4,
              flexDirection: "row",
              alignItems: "center",
              gap: 5,
            }}
          >
            <View style={{ width: 7, height: 7, borderRadius: 3.5, backgroundColor: origin.color }} />
            <Text style={{ fontSize: FONT.sizes.xs, fontFamily: FONT_FAMILY.semibold, color: "#FFF" }}>
              {origin.label}
            </Text>
          </View>
        </View>
      </Pressable>
    </View>
  );
}

// ─── Feed filter type ────────────────────────────────────────────
type FeedFilter = "all" | "group" | "friend" | "discover";

const FILTER_OPTIONS: { key: FeedFilter; label: string; icon: keyof typeof Ionicons.glyphMap; color: string }[] = [
  { key: "all", label: "Tout", icon: "flame-outline", color: PALETTE.sarcelle },
  { key: "group", label: "Groupes", icon: "people-outline", color: PALETTE.sarcelle },
  { key: "friend", label: "Amis", icon: "heart-outline", color: PALETTE.fuchsia },
  { key: "discover", label: "Découvrir", icon: "compass-outline", color: "#999" },
];

// ─── Filter chips bar ────────────────────────────────────────────
function FilterChips({
  active,
  onChange,
}: {
  active: FeedFilter;
  onChange: (f: FeedFilter) => void;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{
        paddingHorizontal: CARD_MARGIN_H,
        paddingTop: 14,
        paddingBottom: 6,
        gap: 8,
      }}
    >
      {FILTER_OPTIONS.map((opt) => {
        const isActive = active === opt.key;
        return (
          <Pressable
            key={opt.key}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onChange(opt.key);
            }}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
              paddingHorizontal: 14,
              paddingVertical: 8,
              borderRadius: 20,
              backgroundColor: isActive ? opt.color : "rgba(0,0,0,0.04)",
            }}
          >
            <Ionicons
              name={opt.icon}
              size={14}
              color={isActive ? "#FFF" : "#999"}
            />
            <Text
              style={{
                fontSize: FONT.sizes.sm,
                fontFamily: isActive ? FONT_FAMILY.bold : FONT_FAMILY.medium,
                color: isActive ? "#FFF" : "#777",
              }}
            >
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

// ─── Section divider ─────────────────────────────────────────────
function SectionDivider({ origin }: { origin: HomeFeedVideo["origin"] }) {
  const cfg = ORIGIN_CONFIG[origin];
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
        paddingHorizontal: CARD_MARGIN_H,
        paddingVertical: SPACING.base,
        gap: 8,
        marginTop: SPACING.xs,
      }}
    >
      <Ionicons name={cfg.icon} size={15} color={cfg.color} />
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
  const [activeFilter, setActiveFilter] = useState<FeedFilter>("all");

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

  // Deduplicate videos by id (same video can appear in multiple layers)
  const allVideos = data?.pages.flatMap((p) => p) ?? [];
  const seen = new Set<string>();
  const videos: HomeFeedVideo[] = [];
  for (const v of allVideos) {
    if (!seen.has(v.id)) {
      seen.add(v.id);
      videos.push(v);
    }
  }

  // Filter by active chip
  const filteredVideos = activeFilter === "all"
    ? videos
    : videos.filter((v) => v.origin === activeFilter);

  // Build list items: inject section dividers only in "all" mode
  type ListItem =
    | { type: "divider"; origin: HomeFeedVideo["origin"]; key: string }
    | { type: "video"; video: HomeFeedVideo; videoIndex: number; key: string };

  const listItems: ListItem[] = [];
  let lastOrigin: HomeFeedVideo["origin"] | null = null;
  let videoIndex = 0;
  for (const video of filteredVideos) {
    if (activeFilter === "all" && video.origin !== lastOrigin) {
      listItems.push({ type: "divider", origin: video.origin, key: `divider-${video.origin}` });
      lastOrigin = video.origin;
    }
    listItems.push({ type: "video", video, videoIndex: videoIndex++, key: `${video.origin}-${video.id}` });
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

  // ── Header ──
  const ListHeader = (
    <>
      {/* Top bar */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingTop: insets.top + SPACING.base,
          paddingHorizontal: CARD_MARGIN_H,
          paddingBottom: SPACING.base,
          backgroundColor: "#FFFFFF",
        }}
      >
        <Pressable
          hitSlop={8}
          onPress={() => router.push("/(tabs)/profile")}
          style={{ width: 38, height: 38, borderRadius: 19, overflow: "hidden" }}
        >
          <Avatar
            url={profile?.avatar_url}
            username={profile?.username ?? ""}
            size={38}
          />
        </Pressable>

        <Text
          style={{
            fontSize: FONT.sizes["2xl"],
            fontFamily: FONT_FAMILY.black,
            color: PALETTE.sarcelle,
            letterSpacing: -0.5,
          }}
        >
          Dumbys
        </Text>

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
              paddingHorizontal: CARD_MARGIN_H,
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

      {/* Filter chips */}
      <FilterChips active={activeFilter} onChange={setActiveFilter} />

      <View style={{ height: SPACING.xs }} />
    </>
  );

  const ListFooter = isFetchingNextPage ? (
    <View style={{ paddingVertical: SPACING["2xl"], alignItems: "center" }}>
      <ActivityIndicator color={PALETTE.fuchsia} />
    </View>
  ) : null;

  const ListEmpty = !isLoading ? (
    <View style={{ alignItems: "center", paddingTop: 60, paddingHorizontal: CARD_MARGIN_H }}>
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
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingTop: insets.top + SPACING.base,
            paddingHorizontal: CARD_MARGIN_H,
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
          <Text style={{ fontSize: FONT.sizes["2xl"], fontFamily: FONT_FAMILY.black, color: PALETTE.sarcelle, letterSpacing: -0.5 }}>
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
