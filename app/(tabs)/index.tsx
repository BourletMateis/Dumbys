import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useVideoPlayer, VideoView } from "expo-video";
import { useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
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
import { useMyGroups, type GroupWithRole } from "@/src/features/groups/useMyGroups";
import { useUserProfile } from "@/src/features/profile/useUserProfile";
import { Avatar } from "@/src/components/ui/Avatar";
import { HomeFeedSkeleton } from "@/src/components/Skeleton";
import { getPhaseForDate } from "@/src/hooks/useTimelineLogic";
import { PALETTE, RADIUS, FONT, FONT_FAMILY, SPACING } from "@/src/theme";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_MARGIN_H = 24; // pour le header / stories
const VIEWABILITY_CONFIG = { itemVisiblePercentThreshold: 50 };

// ─── Decorative blob ────────────────────────────────────────────
function Blob({ size, color, top, left, right, bottom }: {
  size: number; color: string;
  top?: number; left?: number; right?: number; bottom?: number;
}) {
  return (
    <View
      style={{
        position: "absolute",
        width: size, height: size, borderRadius: size / 2,
        backgroundColor: color, opacity: 0.10,
        top, left, right, bottom,
        pointerEvents: "none",
      } as any}
    />
  );
}

// ─── Group filter type ───────────────────────────────────────────
// null = Tous, string = group id
type GroupFilter = null | string;

// ─── Activity dot detection ──────────────────────────────────────
const RECENT_MS = 7 * 24 * 60 * 60 * 1000; // 7 jours

function hasUnseenActivity(groupId: string, videos: HomeFeedVideo[], lastSeenAt: number, currentUserId?: string) {
  const cutoff = Date.now() - RECENT_MS;
  return videos.some(
    (v) =>
      v.group?.id === groupId &&
      v.submitter.id !== currentUserId &&
      new Date(v.created_at).getTime() > cutoff &&
      new Date(v.created_at).getTime() > lastSeenAt,
  );
}

// ─── "Tous" story item ───────────────────────────────────────────
function AllGroupsItem({ isActive, onPress }: { isActive: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={{ alignItems: "center", gap: 5, width: 60 }}>
      <View
        style={{
          width: 54,
          height: 54,
          borderRadius: 27,
          borderWidth: 2.5,
          borderColor: isActive ? PALETTE.sarcelle : "rgba(0,0,0,0.08)",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: isActive ? `${PALETTE.sarcelle}12` : "#F2F3F7",
        }}
      >
        <Ionicons name="grid" size={22} color={isActive ? PALETTE.sarcelle : "#AAA"} />
      </View>
      <Text
        style={{
          fontSize: FONT.sizes.xs,
          fontFamily: isActive ? FONT_FAMILY.bold : FONT_FAMILY.medium,
          color: isActive ? PALETTE.sarcelle : "#888",
        }}
      >
        Tous
      </Text>
    </Pressable>
  );
}

// ─── Group story item ─────────────────────────────────────────────
function GroupStoryItem({
  group,
  isActive,
  hasActivity,
  onPress,
}: {
  group: GroupWithRole;
  isActive: boolean;
  hasActivity: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={{ alignItems: "center", gap: 5, width: 64 }}>
      <View style={{ position: "relative" }}>
        <View
          style={{
            width: 54,
            height: 54,
            borderRadius: 27,
            borderWidth: 2.5,
            borderColor: isActive ? PALETTE.sarcelle : hasActivity ? `${PALETTE.fuchsia}60` : "rgba(0,0,0,0.08)",
            alignItems: "center",
            justifyContent: "center",
            padding: 2,
            backgroundColor: "#FFF",
          }}
        >
          <Avatar url={group.cover_url} username={group.name} size={44} />
        </View>

        {/* Activity dot */}
        {hasActivity && !isActive && (
          <View
            style={{
              position: "absolute",
              bottom: 1,
              right: 1,
              width: 13,
              height: 13,
              borderRadius: 7,
              backgroundColor: PALETTE.fuchsia,
              borderWidth: 2,
              borderColor: "#FFF",
            }}
          />
        )}

        {/* Status badge */}
        {group.status === "pending_public" ? (
          <View
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              width: 16,
              height: 16,
              borderRadius: 8,
              backgroundColor: "#FDB813",
              borderWidth: 1.5,
              borderColor: "#FFF",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name="time" size={8} color="#1A1A1A" />
          </View>
        ) : group.status === "rejected_public" ? (
          <View
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              width: 16,
              height: 16,
              borderRadius: 8,
              backgroundColor: "#F43F5E",
              borderWidth: 1.5,
              borderColor: "#FFF",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name="close" size={8} color="#FFF" />
          </View>
        ) : !group.is_public ? (
          <View
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              width: 16,
              height: 16,
              borderRadius: 8,
              backgroundColor: "#555",
              borderWidth: 1.5,
              borderColor: "#FFF",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name="lock-closed" size={8} color="#FFF" />
          </View>
        ) : null}
      </View>

      <Text
        numberOfLines={1}
        style={{
          fontSize: FONT.sizes.xs,
          fontFamily: isActive ? FONT_FAMILY.bold : FONT_FAMILY.medium,
          color: isActive ? PALETTE.sarcelle : "#777",
          maxWidth: 64,
        }}
      >
        {group.name}
      </Text>
    </Pressable>
  );
}

// ─── Video inline preview ─────────────────────────────────────────
// - visible=false : player créé + buffering en silence (preload)
// - visible=true  : affiché, vidéo déjà bufferisée → quasi instantané
function VideoPreview({ url, visible }: { url: string; visible: boolean }) {
  const [muted, setMuted] = useState(false);
  const player = useVideoPlayer(url, (p) => {
    p.loop = true;
    p.muted = false;
    p.play();
  });

  const [isPlaying, setIsPlaying] = useState(false);
  useEffect(() => {
    const sub = player.addListener("playingChange", ({ isPlaying: playing }) => {
      setIsPlaying(playing);
    });
    return () => sub.remove();
  }, [player]);

  return (
    <View
      style={{ position: "absolute", width: "100%", height: "100%", opacity: visible ? 1 : 0 }}
      pointerEvents={visible ? "auto" : "none"}
    >
      <VideoView
        player={player}
        style={{ width: "100%", height: "100%" }}
        contentFit="cover"
        nativeControls={false}
      />
      {visible && (isPlaying ? (
        <Pressable
          onPress={() => { player.muted = !muted; setMuted((m) => !m); }}
          style={{ position: "absolute", bottom: 58, right: 14, width: 34, height: 34, borderRadius: 17, backgroundColor: "rgba(0,0,0,0.55)", alignItems: "center", justifyContent: "center" }}
        >
          <Ionicons name={muted ? "volume-mute" : "volume-high"} size={15} color="#FFF" />
        </Pressable>
      ) : (
        <View style={{ position: "absolute", bottom: 58, right: 14, width: 34, height: 34, borderRadius: 17, backgroundColor: "rgba(0,0,0,0.55)", alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="small" color="#FFF" />
        </View>
      ))}
    </View>
  );
}

// ─── Video card ──────────────────────────────────────────────────
function VideoCard({ video, index, groupFilter, isPreviewActive, isPreloading }: {
  video: HomeFeedVideo;
  index: number;
  groupFilter: GroupFilter;
  isPreviewActive: boolean;
  isPreloading: boolean;
}) {
  return (
    <View
      style={{
        marginHorizontal: CARD_MARGIN_H,
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
          router.push({ pathname: "/feed/home", params: { startIndex: String(index), filter: groupFilter ?? "all" } } as any);
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
            <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: `${PALETTE.fuchsia}08` }}>
              <Ionicons name="play-circle-outline" size={40} color={PALETTE.fuchsia} />
            </View>
          )}

          {/* Inline video preview — rendu dès le preload, visible seulement quand actif */}
          {(isPreviewActive || isPreloading) && video.source_url && (
            <VideoPreview url={video.stream_url ?? video.source_url} visible={isPreviewActive} />
          )}

          {/* Gradient overlay */}
          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.65)"]}
            style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "55%", justifyContent: "flex-end", padding: 14 }}
          >
            {video.description ? (
              <Text numberOfLines={2} style={{ color: "rgba(255,255,255,0.85)", fontSize: FONT.sizes.sm, fontFamily: FONT_FAMILY.regular, marginBottom: 8, lineHeight: 18 }}>
                {video.description}
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
                  <Text numberOfLines={1} style={{ color: "#FFF", fontSize: FONT.sizes.sm, fontFamily: FONT_FAMILY.semibold }}>
                    {video.submitter.username}
                  </Text>
                  {video.group && (
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 3, marginTop: 2 }}>
                      <Ionicons name="people-outline" size={10} color="rgba(255,255,255,0.6)" />
                      <Text numberOfLines={1} style={{ fontSize: FONT.sizes.xs, fontFamily: FONT_FAMILY.regular, color: "rgba(255,255,255,0.6)" }}>
                        {video.group.name}
                      </Text>
                    </View>
                  )}
                </View>
              </View>

              <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: "rgba(255,255,255,0.15)", alignItems: "center", justifyContent: "center" }}>
                <Ionicons name="play" size={15} color="#FFF" />
              </View>
            </View>
          </LinearGradient>

          {/* Origin badge — uniquement en mode "Tous" */}
          {!groupFilter && video.origin === "friend" && (
            <View
              style={{
                position: "absolute",
                top: 12,
                left: 12,
                backgroundColor: `${PALETTE.fuchsia}CC`,
                borderRadius: RADIUS.full,
                paddingHorizontal: 10,
                paddingVertical: 4,
                flexDirection: "row",
                alignItems: "center",
                gap: 5,
              }}
            >
              <Ionicons name="person" size={10} color="#FFF" />
              <Text style={{ fontSize: FONT.sizes.xs, fontFamily: FONT_FAMILY.semibold, color: "#FFF" }}>Ami</Text>
            </View>
          )}
        </View>
      </Pressable>
    </View>
  );
}

// ─── Main screen ─────────────────────────────────────────────────
export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { data: profile } = useUserProfile();
  const { data: myGroups } = useMyGroups();
  const [groupFilter, setGroupFilter] = useState<GroupFilter>(null);
  const [previewVideoId, setPreviewVideoId] = useState<string | null>(null);
  const [preloadVideoId, setPreloadVideoId] = useState<string | null>(null);
  const storiesRef = useRef<ScrollView>(null);
  const viewableItemsRef = useRef<any[]>([]);
  const previewTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // lastSeenAt[groupId] = timestamp de la dernière fois que l'user a cliqué sur ce groupe
  const lastSeenAt = useRef<Record<string, number>>({});

  // Stoppe la preview en quittant l'écran
  useFocusEffect(useCallback(() => {
    return () => {
      if (previewTimerRef.current) clearTimeout(previewTimerRef.current);
      setPreviewVideoId(null);
      setPreloadVideoId(null);
    };
  }, []));

  const getCandidateVideoId = useCallback(() => {
    const videoItems = viewableItemsRef.current.filter((t) => t.item?.type === "video");
    if (videoItems.length === 0) return null;
    return videoItems[Math.floor(videoItems.length / 2)].item.video.id as string;
  }, []);

  const startPreviewTimer = useCallback(() => {
    if (previewTimerRef.current) clearTimeout(previewTimerRef.current);
    // Preload immédiatement (buffering silencieux)
    const candidate = getCandidateVideoId();
    if (candidate) setPreloadVideoId(candidate);
    // Affiche après 2s (déjà bufferisé → quasi instantané)
    previewTimerRef.current = setTimeout(() => {
      const id = getCandidateVideoId();
      if (id) setPreviewVideoId(id);
    }, 1000);
  }, [getCandidateVideoId]);

  const stopPreview = useCallback(() => {
    if (previewTimerRef.current) clearTimeout(previewTimerRef.current);
    setPreviewVideoId(null);
    setPreloadVideoId(null);
  }, []);

  const onViewableItemsChanged = useCallback(({ viewableItems }: { viewableItems: any[] }) => {
    viewableItemsRef.current = viewableItems;
  }, []);

  // Charge lastSeenAt depuis AsyncStorage au montage
  useEffect(() => {
    AsyncStorage.getItem("lastSeenAt").then((raw) => {
      if (raw) {
        try { lastSeenAt.current = JSON.parse(raw); } catch {}
      }
    });
  }, []);

  const { data, isLoading, isFetchingNextPage, fetchNextPage, hasNextPage, refetch, isRefetching } = useHomeFeed();
  const { phase } = getPhaseForDate(new Date());

  // Toutes les vidéos dédupliquées
  const allVideos = useMemo(() => {
    const raw = (data?.pages.flatMap((p) => p) ?? []) as HomeFeedVideo[];
    const seen = new Set<string>();
    const result: HomeFeedVideo[] = [];
    for (const v of raw) {
      if (!seen.has(v.id)) { seen.add(v.id); result.push(v); }
    }
    return result;
  }, [data]);

  // Filtrage par groupe sélectionné
  const filteredVideos = useMemo(() => {
    if (!groupFilter) return allVideos;
    return allVideos.filter((v) => v.group?.id === groupFilter);
  }, [allVideos, groupFilter]);

  // Ordre des groupes dans la stories bar : non-vus en premier, privés devant
  const sortedGroups = useMemo(() => {
    if (!myGroups) return [];
    return [...myGroups].sort((a, b) => {
      const aUnseen = hasUnseenActivity(a.id, allVideos, lastSeenAt.current[a.id] ?? 0, profile?.id) ? 1 : 0;
      const bUnseen = hasUnseenActivity(b.id, allVideos, lastSeenAt.current[b.id] ?? 0) ? 1 : 0;
      if (aUnseen !== bUnseen) return bUnseen - aUnseen;
      if (!a.is_public && b.is_public) return -1;
      if (a.is_public && !b.is_public) return 1;
      return 0;
    });
  }, [myGroups, allVideos]);

  const handleGroupSelect = (id: GroupFilter) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (id) {
      lastSeenAt.current[id] = Date.now();
      AsyncStorage.setItem("lastSeenAt", JSON.stringify(lastSeenAt.current));
    }
    setGroupFilter((prev) => (prev === id ? null : id));
  };

  type ListItem =
    | { type: "video"; video: HomeFeedVideo; videoIndex: number; key: string }
    | { type: "section"; label: string; key: string };

  const listItems = useMemo<ListItem[]>(() => {
    const items: ListItem[] = [];
    // En mode "Tous", injecter un séparateur entre groupes et amis
    if (!groupFilter) {
      let passedToFriends = false;
      let videoIndex = 0;
      for (const video of filteredVideos) {
        if (video.origin === "friend" && !passedToFriends) {
          items.push({ type: "section", label: "Amis", key: "section-friends" });
          passedToFriends = true;
        }
        items.push({ type: "video", video, videoIndex: videoIndex++, key: video.id });
      }
    } else {
      filteredVideos.forEach((video, idx) => {
        items.push({ type: "video", video, videoIndex: idx, key: video.id });
      });
    }
    return items;
  }, [filteredVideos, groupFilter]);

  const onEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const renderItem = useCallback(({ item }: { item: ListItem }) => {
    if (item.type === "section") {
      return (
        <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: CARD_MARGIN_H, paddingVertical: 10, gap: 8, marginTop: 4 }}>
          <Ionicons name="heart" size={13} color={PALETTE.fuchsia} />
          <Text style={{ fontSize: FONT.sizes.xs, fontFamily: FONT_FAMILY.bold, color: PALETTE.fuchsia, textTransform: "uppercase", letterSpacing: 1.2 }}>
            Amis
          </Text>
          <View style={{ flex: 1, height: 1, backgroundColor: `${PALETTE.fuchsia}25` }} />
        </View>
      );
    }
    return <VideoCard video={item.video} index={item.videoIndex} groupFilter={groupFilter} isPreviewActive={item.video.id === previewVideoId} isPreloading={item.video.id === preloadVideoId && item.video.id !== previewVideoId} />;
  }, [groupFilter, previewVideoId, preloadVideoId]);

  // ── Header ─────────────────────────────────────────────────────
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
          <Avatar url={profile?.avatar_url} username={profile?.username ?? ""} size={38} />
        </Pressable>

        <Text style={{ fontSize: FONT.sizes["2xl"], fontFamily: FONT_FAMILY.black, color: PALETTE.sarcelle, letterSpacing: -0.5 }}>
          Dumbys
        </Text>

        <Pressable
          hitSlop={12}
          onPress={() => router.push("/notifications" as any)}
          style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: "rgba(0,0,0,0.04)", alignItems: "center", justifyContent: "center" }}
        >
          <Ionicons name="notifications-outline" size={22} color="#333" />
        </Pressable>
      </View>

      {/* ── Stories / group selector ─────────────────────────── */}
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
            ref={storiesRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: CARD_MARGIN_H, paddingTop: SPACING.base, gap: SPACING.lg }}
          >
            {/* Tous */}
            <AllGroupsItem
              isActive={groupFilter === null}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setGroupFilter(null); }}
            />

            {/* Groupes triés */}
            {sortedGroups.map((group) => (
              <GroupStoryItem
                key={group.id}
                group={group}
                isActive={groupFilter === group.id}
                hasActivity={hasUnseenActivity(group.id, allVideos, lastSeenAt.current[group.id] ?? 0, profile?.id)}
                onPress={() => handleGroupSelect(group.id)}
              />
            ))}
          </ScrollView>
        </View>
      )}

      {/* Label du filtre actif */}
      {groupFilter && (() => {
        const g = myGroups?.find((gr) => gr.id === groupFilter);
        if (!g) return null;
        return (
          <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: CARD_MARGIN_H, paddingTop: 14, paddingBottom: 4, gap: 8 }}>
            <Text style={{ fontSize: FONT.sizes.sm, fontFamily: FONT_FAMILY.bold, color: "#1A1A1A" }}>
              {g.name}
            </Text>
            {!g.is_public && <Ionicons name="lock-closed" size={12} color="#999" />}
            <Pressable
              onPress={() => setGroupFilter(null)}
              style={{ marginLeft: "auto", flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "rgba(0,0,0,0.05)", borderRadius: RADIUS.full, paddingHorizontal: 10, paddingVertical: 4 }}
            >
              <Ionicons name="close" size={12} color="#777" />
              <Text style={{ fontSize: FONT.sizes.xs, fontFamily: FONT_FAMILY.medium, color: "#777" }}>Tous</Text>
            </Pressable>
          </View>
        );
      })()}

      <View style={{ height: SPACING.base }} />
    </>
  );

  const ListFooter = isFetchingNextPage ? (
    <View style={{ paddingVertical: SPACING["2xl"], alignItems: "center" }}>
      <ActivityIndicator color={PALETTE.fuchsia} />
    </View>
  ) : null;

  const ListEmpty = !isLoading ? (
    <View style={{ alignItems: "center", paddingTop: 60, paddingHorizontal: CARD_MARGIN_H }}>
      <Ionicons name={groupFilter ? "videocam-outline" : "film-outline"} size={52} color="#DDD" />
      <Text style={{ marginTop: SPACING.lg, fontSize: FONT.sizes.lg, fontFamily: FONT_FAMILY.semibold, color: "#CCC", textAlign: "center" }}>
        {groupFilter ? "Aucune vidéo dans ce groupe" : "Pas encore de vidéos"}
      </Text>
      <Text style={{ marginTop: SPACING.xs, fontSize: FONT.sizes.sm, fontFamily: FONT_FAMILY.regular, color: "#DDD", textAlign: "center" }}>
        {groupFilter ? "Sois le premier à poster !" : "Rejoins un groupe ou commence à uploader !"}
      </Text>
      {!groupFilter && (
        <Pressable
          onPress={() => router.push("/(tabs)/explorer")}
          style={{ marginTop: SPACING.xl, flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: PALETTE.sarcelle, paddingHorizontal: 20, paddingVertical: 12, borderRadius: RADIUS.full }}
        >
          <Ionicons name="compass-outline" size={18} color="#FFF" />
          <Text style={{ fontSize: FONT.sizes.base, fontFamily: FONT_FAMILY.bold, color: "#FFF" }}>Découvrir des groupes</Text>
        </Pressable>
      )}
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
          <View style={{ width: 38 }} />
          <Text style={{ fontSize: FONT.sizes["2xl"], fontFamily: FONT_FAMILY.black, color: PALETTE.sarcelle, letterSpacing: -0.5 }}>Dumbys</Text>
          <View style={{ width: 38 }} />
        </View>
        <ScrollView showsVerticalScrollIndicator={false}>
          <HomeFeedSkeleton />
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#F2F3F7" }}>
      <Blob size={220} color={PALETTE.sarcelle} top={-60} right={-70} />
      <Blob size={160} color={PALETTE.fuchsia} top={300} left={-60} />
      <Blob size={120} color={PALETTE.jaune} bottom={220} right={-40} />
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
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={PALETTE.fuchsia} />}
        onScrollBeginDrag={stopPreview}
        onScrollEndDrag={startPreviewTimer}
        onMomentumScrollEnd={startPreviewTimer}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={VIEWABILITY_CONFIG}
      />
    </View>
  );
}
