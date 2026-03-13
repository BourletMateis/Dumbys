import { useState, useMemo } from "react";
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
} from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  usePublicGroups,
  type PublicGroup,
} from "@/src/features/groups/usePublicGroups";
import { useChallengeStats } from "@/src/features/groups/useChallengeStats";
import { useJoinPublicGroup } from "@/src/features/groups/useGroupActions";
import { useTimelineLogic } from "@/src/hooks/useTimelineLogic";
import { AnimatedPressable } from "@/src/components/ui/AnimatedPressable";
import {
  COLORS,
  GRADIENTS,
  RADIUS,
  SPACING,
  FONT,
  FONT_FAMILY,
  CARD_STYLE,
  SECTION_HEADER_STYLE,
  HEADER_BUTTON_STYLE,
} from "@/src/theme";
import { useTheme } from "@/src/providers/ThemeProvider";

function daysUntilNextPhase(phase: string, dayOfWeek: number): string {
  if (phase === "upload") {
    const daysLeft = 5 - dayOfWeek;
    return daysLeft === 0 ? "Last day!" : `${daysLeft}d left`;
  }
  if (phase === "vote") {
    const daysLeft = dayOfWeek === 6 ? 1 : 0;
    return daysLeft === 0 ? "Last day!" : "1d left";
  }
  return "Today";
}

const PHASE_CONFIG = {
  upload: {
    gradient: GRADIENTS.uploadPhase,
    icon: "flame" as const,
    title: "Upload your video",
    subtitle: "Record or pick your funniest video",
  },
  vote: {
    gradient: GRADIENTS.votePhase,
    icon: "checkmark-circle" as const,
    title: "Vote for the best!",
    subtitle: "Watch all videos and pick your favorite",
  },
  podium: {
    gradient: GRADIENTS.podiumPhase,
    icon: "trophy" as const,
    title: "Results are in!",
    subtitle: "Check who won this week",
  },
};

type ChallengeFilter = "hot" | "new" | "joined";

export default function HomeScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { phase, weekNumber, dayOfWeek } = useTimelineLogic();
  const {
    data: groups,
    isPending,
    refetch,
    isRefetching,
  } = usePublicGroups();
  const joinGroup = useJoinPublicGroup();

  const [filter, setFilter] = useState<ChallengeFilter>("hot");

  // Get challenge stats for all groups
  const groupIds = useMemo(() => (groups ?? []).map((g) => g.id), [groups]);
  const { data: statsMap } = useChallengeStats(groupIds);

  // Filter & sort challenges
  const challenges = useMemo(() => {
    let list = groups ?? [];

    if (filter === "joined") {
      list = list.filter((g) => g.is_member);
    }

    if (filter === "hot") {
      list = [...list].sort((a, b) => {
        const aCount = statsMap?.get(a.id)?.video_count ?? 0;
        const bCount = statsMap?.get(b.id)?.video_count ?? 0;
        if (bCount !== aCount) return bCount - aCount;
        return b.member_count - a.member_count;
      });
    } else if (filter === "new") {
      list = [...list].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );
    }

    return list;
  }, [groups, filter, statsMap]);

  const handleJoin = (groupId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    joinGroup.mutate(groupId, {
      onSuccess: () => {
        router.push({ pathname: "/feed/[groupId]", params: { groupId } });
      },
      onError: (err) => {
        if (err.message.includes("already")) {
          router.push({ pathname: "/feed/[groupId]", params: { groupId } });
        } else {
          Alert.alert("Error", err.message);
        }
      },
    });
  };

  const config = PHASE_CONFIG[phase as keyof typeof PHASE_CONFIG] ?? PHASE_CONFIG.upload;
  const countdown = daysUntilNextPhase(phase, dayOfWeek);

  const FILTERS: { key: ChallengeFilter; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
    { key: "hot", label: "Hot", icon: "flame" },
    { key: "new", label: "New", icon: "sparkles" },
    { key: "joined", label: "Joined", icon: "checkmark-circle" },
  ];

  const renderChallenge = ({ item: group }: { item: PublicGroup }) => {
    const stats = statsMap?.get(group.id);
    const videoCount = stats?.video_count ?? 0;
    const thumbnail = stats?.latest_thumbnail ?? null;

    return (
      <AnimatedPressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          if (group.is_member) {
            router.push({ pathname: "/feed/[groupId]", params: { groupId: group.id } });
          } else {
            handleJoin(group.id);
          }
        }}
        style={{
          ...CARD_STYLE,
          overflow: "hidden",
          marginBottom: SPACING.lg,
          borderColor: group.is_member
            ? colors.borderBrand
            : colors.border,
        }}
      >
        {/* Thumbnail / gradient header */}
        {thumbnail ? (
          <View style={{ height: 150, position: "relative" }}>
            <Image
              source={{ uri: thumbnail }}
              style={{ width: "100%", height: "100%" }}
              contentFit="cover"
            />
            <LinearGradient
              colors={GRADIENTS.overlay as any}
              style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                height: 70,
              }}
            />
            {videoCount > 0 && (
              <View
                style={{
                  position: "absolute",
                  top: SPACING.base,
                  right: SPACING.base,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: SPACING.xs,
                  backgroundColor: colors.overlay,
                  paddingHorizontal: SPACING.base,
                  paddingVertical: SPACING.sm,
                  borderRadius: RADIUS.xs,
                }}
              >
                <Ionicons name="flame" size={12} color={COLORS.error} />
                <Text style={{ color: colors.textPrimary, fontSize: FONT.sizes.sm, fontWeight: FONT.weights.bold }}>
                  {videoCount}
                </Text>
              </View>
            )}
            {group.is_member && (
              <View
                style={{
                  position: "absolute",
                  top: SPACING.base,
                  left: SPACING.base,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: SPACING.xs,
                  backgroundColor: "rgba(255,45,125,0.85)",
                  paddingHorizontal: SPACING.base,
                  paddingVertical: SPACING.sm,
                  borderRadius: RADIUS.xs,
                }}
              >
                <Ionicons name="checkmark-circle" size={12} color={colors.textPrimary} />
                <Text style={{ color: colors.textPrimary, fontSize: FONT.sizes.xs, fontWeight: FONT.weights.bold }}>
                  Joined
                </Text>
              </View>
            )}
          </View>
        ) : (
          <View
            style={{
              height: 110,
              backgroundColor: colors.glass,
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
            }}
          >
            <Ionicons name="trophy" size={36} color={colors.textMuted} />
            {videoCount > 0 && (
              <View
                style={{
                  position: "absolute",
                  top: SPACING.base,
                  right: SPACING.base,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: SPACING.xs,
                  backgroundColor: colors.overlay,
                  paddingHorizontal: SPACING.base,
                  paddingVertical: SPACING.sm,
                  borderRadius: RADIUS.xs,
                }}
              >
                <Ionicons name="flame" size={12} color={COLORS.error} />
                <Text style={{ color: colors.textPrimary, fontSize: FONT.sizes.sm, fontWeight: FONT.weights.bold }}>
                  {videoCount}
                </Text>
              </View>
            )}
            {group.is_member && (
              <View
                style={{
                  position: "absolute",
                  top: SPACING.base,
                  left: SPACING.base,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: SPACING.xs,
                  backgroundColor: "rgba(255,45,125,0.85)",
                  paddingHorizontal: SPACING.base,
                  paddingVertical: SPACING.sm,
                  borderRadius: RADIUS.xs,
                }}
              >
                <Ionicons name="checkmark-circle" size={12} color={colors.textPrimary} />
                <Text style={{ color: colors.textPrimary, fontSize: FONT.sizes.xs, fontWeight: FONT.weights.bold }}>
                  Joined
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Challenge info */}
        <View style={{ padding: SPACING.lg }}>
          <Text
            style={{ color: colors.textPrimary, fontSize: FONT.sizes.xl, fontFamily: FONT_FAMILY.extrabold }}
            numberOfLines={2}
          >
            {group.name}
          </Text>
          {group.description && (
            <Text
              style={{ color: colors.textSecondary, fontSize: FONT.sizes.md, marginTop: SPACING.xs, lineHeight: 19 }}
              numberOfLines={2}
            >
              {group.description}
            </Text>
          )}

          {/* Prize / Goal */}
          {(group.prize || group.goal_description) && (
            <View style={{ marginTop: SPACING.md, gap: SPACING.xs }}>
              {group.goal_description && (
                <View style={{ flexDirection: "row", alignItems: "center", gap: SPACING.sm }}>
                  <Ionicons name="flag" size={12} color={COLORS.warning} />
                  <Text style={{ color: COLORS.warning, fontSize: FONT.sizes.sm, fontWeight: FONT.weights.medium }} numberOfLines={1}>
                    {group.goal_description}
                  </Text>
                </View>
              )}
              {group.prize && (
                <View style={{ flexDirection: "row", alignItems: "center", gap: SPACING.sm }}>
                  <Ionicons name="gift" size={12} color={COLORS.accent} />
                  <Text style={{ color: COLORS.accent, fontSize: FONT.sizes.sm, fontWeight: FONT.weights.medium }} numberOfLines={1}>
                    {group.prize}
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Stats row */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: SPACING.lg,
              marginTop: SPACING.base,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: SPACING.sm }}>
              <Ionicons name="people" size={14} color={colors.textTertiary} />
              <Text style={{ color: colors.textTertiary, fontSize: FONT.sizes.md, fontWeight: FONT.weights.medium }}>
                {group.member_count} participant{group.member_count !== 1 ? "s" : ""}
              </Text>
            </View>
            {videoCount > 0 && (
              <View style={{ flexDirection: "row", alignItems: "center", gap: SPACING.sm }}>
                <Ionicons name="flame" size={14} color={COLORS.error} />
                <Text style={{ color: COLORS.error, fontSize: FONT.sizes.md, fontWeight: FONT.weights.semibold }}>
                  {videoCount} this week
                </Text>
              </View>
            )}
          </View>

          {/* Join button */}
          {!group.is_member && (
            <Pressable
              onPress={() => handleJoin(group.id)}
              disabled={joinGroup.isPending}
              style={{ marginTop: SPACING.lg, borderRadius: RADIUS.md, overflow: "hidden" }}
            >
              <LinearGradient
                colors={GRADIENTS.brandAccent as any}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{
                  paddingVertical: SPACING.base,
                  borderRadius: RADIUS.md,
                  alignItems: "center",
                  flexDirection: "row",
                  justifyContent: "center",
                  gap: SPACING.sm,
                }}
              >
                <Ionicons name="flash" size={16} color={colors.textPrimary} />
                <Text style={{ color: colors.textPrimary, fontSize: FONT.sizes.base, fontWeight: FONT.weights.bold }}>
                  Join Challenge
                </Text>
              </LinearGradient>
            </Pressable>
          )}
        </View>
      </AnimatedPressable>
    );
  };

  const ListHeader = (
    <>
      {/* Header */}
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: SPACING.xl }}>
        <Text style={{ color: COLORS.accent, fontSize: FONT.sizes["4xl"], fontFamily: FONT_FAMILY.black }}>
          Dumbys
        </Text>
        <Pressable style={HEADER_BUTTON_STYLE as any}>
          <Ionicons name="notifications-outline" size={20} color={colors.textTertiary} />
        </Pressable>
      </View>

      {/* Phase Banner */}
      <LinearGradient
        colors={config.gradient as any}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ borderRadius: RADIUS.xl, padding: SPACING.xl, marginBottom: SPACING["2xl"] }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: SPACING.md }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: SPACING.md }}>
            <Ionicons name={config.icon} size={18} color={colors.textPrimary} />
            <Text style={{ color: colors.textPrimary, fontSize: FONT.sizes.base, fontWeight: FONT.weights.bold }}>
              Week {weekNumber}
            </Text>
          </View>
          <View style={{ backgroundColor: "rgba(255,255,255,0.15)", paddingHorizontal: SPACING.base, paddingVertical: SPACING.xs, borderRadius: RADIUS.full }}>
            <Text style={{ color: colors.textPrimary, fontSize: FONT.sizes.xs, fontWeight: FONT.weights.bold }}>{countdown}</Text>
          </View>
        </View>

        <Text style={{ color: colors.textPrimary, fontSize: FONT.sizes["2xl"], fontFamily: FONT_FAMILY.extrabold, marginBottom: SPACING.xs }}>
          {config.title}
        </Text>
        <Text style={{ color: "rgba(255,255,255,0.65)", fontSize: FONT.sizes.md }}>
          {config.subtitle}
        </Text>

        {/* Timeline dots */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: SPACING.xs, marginTop: SPACING.lg }}>
          {["M", "T", "W", "T", "F", "S", "S"].map((day, i) => {
            const dayIndex = i === 0 ? 1 : i === 1 ? 2 : i === 2 ? 3 : i === 3 ? 4 : i === 4 ? 5 : i === 5 ? 6 : 0;
            const isToday = dayIndex === dayOfWeek;
            const isPast = (dayOfWeek === 0 ? 7 : dayOfWeek) > (dayIndex === 0 ? 7 : dayIndex);
            return (
              <View key={i} style={{ flex: 1, alignItems: "center" }}>
                <View
                  style={{
                    width: isToday ? 28 : 24,
                    height: isToday ? 28 : 24,
                    borderRadius: RADIUS.full,
                    backgroundColor: isToday
                      ? colors.textPrimary
                      : isPast
                        ? "rgba(255,255,255,0.25)"
                        : "rgba(255,255,255,0.08)",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text
                    style={{
                      color: isToday ? config.gradient[0] : "rgba(255,255,255,0.7)",
                      fontSize: FONT.sizes.xs,
                      fontWeight: FONT.weights.bold,
                    }}
                  >
                    {day}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      </LinearGradient>

      {/* Filter chips */}
      <View style={{ flexDirection: "row", gap: SPACING.md, marginBottom: SPACING.xl }}>
        {FILTERS.map((f) => (
          <AnimatedPressable
            key={f.key}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setFilter(f.key);
            }}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: SPACING.sm,
              paddingHorizontal: SPACING.lg,
              paddingVertical: SPACING.base,
              borderRadius: RADIUS.sm,
              backgroundColor:
                filter === f.key ? COLORS.brand : colors.glass,
              borderWidth: 1,
              borderColor:
                filter === f.key ? colors.borderBrand : colors.border,
            }}
          >
            <Ionicons
              name={f.icon}
              size={14}
              color={
                filter === f.key
                  ? colors.textPrimary
                  : f.key === "hot"
                    ? COLORS.error
                    : colors.textTertiary
              }
            />
            <Text
              style={{
                color: filter === f.key ? colors.textPrimary : colors.textSecondary,
                fontSize: FONT.sizes.base,
                fontWeight: FONT.weights.semibold,
              }}
            >
              {f.label}
            </Text>
          </AnimatedPressable>
        ))}
      </View>

      {/* Section header */}
      <View style={{ flexDirection: "row", alignItems: "center", gap: SPACING.sm, marginBottom: SPACING.lg }}>
        <Ionicons name="globe" size={12} color={colors.textTertiary} />
        <Text style={SECTION_HEADER_STYLE as any}>
          Public Challenges
        </Text>
      </View>
    </>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <FlatList
        data={challenges}
        keyExtractor={(item) => item.id}
        renderItem={renderChallenge}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={
          isPending ? (
            <View style={{ alignItems: "center", paddingVertical: SPACING["5xl"] }}>
              <ActivityIndicator size="large" color={COLORS.brand} />
            </View>
          ) : (
            <View style={{ alignItems: "center", paddingVertical: SPACING["5xl"], paddingHorizontal: SPACING["3xl"] }}>
              <Ionicons name="globe-outline" size={48} color={colors.textMuted} />
              <Text
                style={{
                  color: colors.textTertiary,
                  fontSize: FONT.sizes.lg,
                  fontWeight: FONT.weights.semibold,
                  marginTop: SPACING.base,
                  textAlign: "center",
                }}
              >
                {filter === "joined"
                  ? "You haven't joined any public challenges yet"
                  : "No public challenges available"}
              </Text>
            </View>
          )
        }
        contentContainerStyle={{
          paddingTop: insets.top + SPACING.md,
          paddingHorizontal: SPACING.lg,
          paddingBottom: 120,
        }}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={COLORS.brand}
          />
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}
