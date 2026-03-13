import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Alert,
  Share,
  RefreshControl,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useGroupVideos, type GroupVideo } from "@/src/features/groups/useGroupVideos";
import { useUploadGroupVideo } from "@/src/features/groups/useUploadGroupVideo";
import { useDeleteGroup, useLeaveGroup } from "@/src/features/groups/useGroupActions";
import { useWeeklyPodium } from "@/src/features/groups/useWeeklyPodium";
import { useMyVote, useVoteCounts, useCastVote } from "@/src/features/groups/useWeeklyVote";
import { useMyGroups } from "@/src/features/groups/useMyGroups";
import { useTimelineLogic } from "@/src/hooks/useTimelineLogic";
import { useDeleteVideo } from "@/src/features/feed/useDeleteVideo";
import { useLikeCount, useHasLiked, useToggleLike } from "@/src/features/feed/useLikes";
import { useCommentCount } from "@/src/features/feed/useComments";
import { useGroupMembers, useRemoveMember, type GroupMember } from "@/src/features/groups/useGroupMembers";
import { useAuthStore } from "@/src/store/useAuthStore";
import { useRealtimeGroupVideos } from "@/src/features/groups/useRealtimeGroupVideos";
import { Avatar } from "@/src/components/ui/Avatar";
import { AnimatedPressable } from "@/src/components/ui/AnimatedPressable";
import { BottomSheet } from "@/src/components/ui/BottomSheet";
import { EmptyState } from "@/src/components/ui/EmptyState";
import { COLORS, GRADIENTS, RADIUS, FONT, FONT_FAMILY, SPACING, CARD_STYLE, INPUT_STYLE, SECTION_HEADER_STYLE, HEADER_BUTTON_STYLE } from "@/src/theme";
import { useTheme } from "@/src/providers/ThemeProvider";

function VideoItem({
  video,
  canVote,
  isVoted,
  voteCount,
  onVote,
  isOwnVideo,
  onDelete,
  index,
  groupId,
}: {
  video: GroupVideo;
  canVote: boolean;
  isVoted: boolean;
  voteCount: number;
  onVote: () => void;
  isOwnVideo: boolean;
  onDelete: () => void;
  index: number;
  groupId: string;
}) {
  const { colors } = useTheme();
  const router = useRouter();

  const { data: likeCount } = useLikeCount(video.id);
  const { data: hasLiked } = useHasLiked(video.id);
  const toggleLike = useToggleLike(video.id);
  const { data: commentCount } = useCommentCount(video.id);

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

  const openFeed = () => {
    router.push({
      pathname: "/feed/[groupId]",
      params: { groupId, startIndex: String(index) },
    });
  };

  return (
    <View
      style={{
        ...CARD_STYLE,
        overflow: "hidden",
        marginBottom: 12,
      }}
    >
      {/* Thumbnail */}
      <AnimatedPressable onPress={openFeed}>
        {video.thumbnail_url ? (
          <View>
            <Image
              source={{ uri: video.thumbnail_url }}
              style={{ width: "100%", height: 220, borderTopLeftRadius: RADIUS.xl, borderTopRightRadius: RADIUS.xl }}
              contentFit="cover"
            />
            <View
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <View
                style={{
                  backgroundColor: colors.overlay,
                  width: 56,
                  height: 56,
                  borderRadius: RADIUS.full,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons name="play" size={28} color={colors.textPrimary} />
              </View>
            </View>
          </View>
        ) : (
          <View style={{ width: "100%", height: 200, backgroundColor: colors.elevated, alignItems: "center", justifyContent: "center", borderTopLeftRadius: RADIUS.xl, borderTopRightRadius: RADIUS.xl }}>
            <Ionicons name="play" size={28} color={colors.textMuted} />
          </View>
        )}
      </AnimatedPressable>

      <View style={{ padding: 14 }}>
        {/* User */}
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <Pressable
            onPress={() => router.push({ pathname: "/user/[id]", params: { id: video.submitter.id } })}
            style={{ flexDirection: "row", alignItems: "center", gap: 10, flex: 1 }}
          >
            <Avatar url={video.submitter.avatar_url} username={video.submitter.username} size={32} />
            <Text style={{ color: colors.textPrimary, fontSize: FONT.sizes.base, fontWeight: FONT.weights.semibold }} numberOfLines={1}>
              {video.submitter.username}
            </Text>
          </Pressable>
          {isOwnVideo && (
            <Pressable onPress={onDelete} hitSlop={8}>
              <Ionicons name="trash-outline" size={16} color={COLORS.error} />
            </Pressable>
          )}
        </View>

        {/* Actions */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 18 }}>
          <Pressable onPress={handleLike} style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <Ionicons
              name={hasLiked ? "heart" : "heart-outline"}
              size={22}
              color={hasLiked ? COLORS.error : colors.textTertiary}
            />
            {(likeCount ?? 0) > 0 && (
              <Text style={{ color: hasLiked ? COLORS.error : colors.textTertiary, fontSize: FONT.sizes.sm, fontWeight: FONT.weights.semibold }}>
                {likeCount}
              </Text>
            )}
          </Pressable>

          <Pressable onPress={openComments} style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <Ionicons name="chatbubble-outline" size={20} color={colors.textTertiary} />
            {(commentCount ?? 0) > 0 && (
              <Text style={{ color: colors.textTertiary, fontSize: FONT.sizes.sm, fontWeight: FONT.weights.semibold }}>{commentCount}</Text>
            )}
          </Pressable>

          {canVote && (
            <AnimatedPressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                onVote();
              }}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
                paddingHorizontal: 14,
                paddingVertical: 6,
                borderRadius: RADIUS.sm,
                marginLeft: "auto",
                backgroundColor: isVoted ? COLORS.brand : colors.glass,
                borderWidth: isVoted ? 0 : 1,
                borderColor: isVoted ? "transparent" : colors.border,
              }}
            >
              <Ionicons
                name={isVoted ? "checkmark-circle" : "trophy-outline"}
                size={16}
                color={isVoted ? colors.textPrimary : colors.textTertiary}
              />
              <Text style={{ color: isVoted ? colors.textPrimary : colors.textTertiary, fontSize: FONT.sizes.sm, fontWeight: FONT.weights.semibold }}>
                {voteCount}
              </Text>
            </AnimatedPressable>
          )}

          {!canVote && voteCount > 0 && (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginLeft: "auto" }}>
              <Ionicons name="trophy" size={14} color={COLORS.warning} />
              <Text style={{ color: colors.textTertiary, fontSize: FONT.sizes.sm }}>{voteCount}</Text>
            </View>
          )}
        </View>

        {(commentCount ?? 0) > 0 && (
          <Pressable onPress={openComments} style={{ marginTop: 8 }}>
            <Text style={{ color: colors.textMuted, fontSize: FONT.sizes.sm }}>
              View all {commentCount} comment{(commentCount ?? 0) !== 1 ? "s" : ""}
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

export default function GroupScreen() {
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const { weekNumber, year, canUpload, canVote, prevWeek, prevYear, phase } = useTimelineLogic();

  const { data: groups, refetch: refetchGroups, isRefetching } = useMyGroups();
  const group = groups?.find((g) => g.id === id);

  const { data: videos, isPending: videosPending } = useGroupVideos(id!, weekNumber, year);
  const uploadMutation = useUploadGroupVideo();
  const deleteMutation = useDeleteVideo();
  const { data: myVote } = useMyVote(id!, weekNumber, year);
  const { data: voteCounts } = useVoteCounts(id!, weekNumber, year);
  const castVote = useCastVote();
  const { data: podium } = useWeeklyPodium(id!, prevWeek, prevYear);
  const { data: members, isPending: membersPending } = useGroupMembers(id!);
  const removeMember = useRemoveMember(id!);
  const deleteGroup = useDeleteGroup();
  const leaveGroup = useLeaveGroup();

  const [isUploading, setIsUploading] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [pendingVideoUri, setPendingVideoUri] = useState<string | null>(null);
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadDesc, setUploadDesc] = useState("");

  useRealtimeGroupVideos(id!, weekNumber, year);

  const myRole = members?.find((m) => m.user_id === user?.id)?.role;
  const isOwner = myRole === "owner";
  const challengeEnded = group?.end_date ? new Date(group.end_date).getTime() < Date.now() : false;

  const handleDeleteGroup = () => {
    Alert.alert(
      "Delete challenge",
      "This will permanently delete the challenge and all its content. Are you sure?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            deleteGroup.mutate(id!, { onSuccess: () => router.back() });
          },
        },
      ],
    );
  };

  const handleLeaveGroup = () => {
    Alert.alert("Leave challenge", "Are you sure you want to leave?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Leave",
        style: "destructive",
        onPress: () => leaveGroup.mutate(id!, { onSuccess: () => router.back() }),
      },
    ]);
  };

  const handleRemoveMember = (member: GroupMember) => {
    Alert.alert("Remove member", `Remove ${member.username}?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Remove", style: "destructive", onPress: () => removeMember.mutate(member.id) },
    ]);
  };

  const doUpload = () => {
    if (!pendingVideoUri) return;
    setIsUploading(true);
    uploadMutation.mutate(
      {
        videoUri: pendingVideoUri,
        groupId: id!,
        weekNumber,
        year,
        title: uploadTitle.trim() || undefined,
        description: uploadDesc.trim() || undefined,
      },
      {
        onSuccess: () => {
          setPendingVideoUri(null);
          setUploadTitle("");
          setUploadDesc("");
        },
        onSettled: () => setIsUploading(false),
        onError: (err) => Alert.alert("Upload failed", err.message),
      },
    );
  };

  const handlePickVideo = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
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
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
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

  const handleShare = () => {
    if (!group) return;
    Share.share({
      message: `Join my Dumbys challenge "${group.name}"! Use code: ${group.invite_code}`,
    });
  };

  const handleDelete = (videoId: string, videoPath: string | null) => {
    Alert.alert("Delete video", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => deleteMutation.mutate({ videoId, videoPath }) },
    ]);
  };

  const phaseGradient = canVote
    ? GRADIENTS.votePhase
    : canUpload
    ? GRADIENTS.uploadPhase
    : GRADIENTS.podiumPhase;
  const phaseLabel = canVote ? "Vote Phase" : canUpload ? "Upload Phase" : "Results";

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        {/* Custom Header */}
        <View
          style={{
            paddingTop: insets.top + 8,
            paddingBottom: 12,
            paddingHorizontal: 16,
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
          }}
        >
          <AnimatedPressable
            onPress={() => router.back()}
            style={HEADER_BUTTON_STYLE}
          >
            <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
          </AnimatedPressable>

          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.textPrimary, fontSize: FONT.sizes.xl, fontWeight: FONT.weights.bold }} numberOfLines={1}>
              {group?.name ?? "Challenge"}
            </Text>
          </View>

          <AnimatedPressable
            onPress={() => setShowMembers(true)}
            style={HEADER_BUTTON_STYLE}
          >
            <Ionicons name="people-outline" size={20} color={colors.textSecondary} />
          </AnimatedPressable>

          <AnimatedPressable
            onPress={() => setShowInvite(true)}
            style={HEADER_BUTTON_STYLE}
          >
            <Ionicons name="share-outline" size={20} color={colors.textSecondary} />
          </AnimatedPressable>
        </View>

        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetchGroups} tintColor={COLORS.brand} />
          }
          showsVerticalScrollIndicator={false}
        >
          {/* Group Info */}
          {group && (
            <View
              style={{
                ...CARD_STYLE,
                padding: 16,
                marginBottom: 16,
              }}
            >
              {/* Type badge + countdown */}
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 5,
                    backgroundColor: "rgba(255,45,125,0.1)",
                    paddingHorizontal: 10,
                    paddingVertical: 5,
                    borderRadius: RADIUS.xs,
                    borderWidth: 1,
                    borderColor: "rgba(255,45,125,0.15)",
                  }}
                >
                  <Ionicons
                    name={group.is_public ? "globe" : "lock-closed"}
                    size={12}
                    color={COLORS.brand}
                  />
                  <Text style={{ color: COLORS.brandLight, fontSize: FONT.sizes.xs, fontWeight: FONT.weights.semibold }}>
                    {group.is_public ? "Public" : "Private"}
                  </Text>
                </View>

                {/* Countdown timer */}
                {group.end_date && (() => {
                  const endMs = new Date(group.end_date).getTime();
                  const nowMs = Date.now();
                  const diffMs = endMs - nowMs;
                  if (diffMs <= 0) {
                    return (
                      <View style={{ backgroundColor: "rgba(244,63,94,0.1)", paddingHorizontal: 10, paddingVertical: 5, borderRadius: RADIUS.xs, borderWidth: 1, borderColor: "rgba(244,63,94,0.15)" }}>
                        <Text style={{ color: COLORS.error, fontSize: FONT.sizes.xs, fontWeight: FONT.weights.semibold }}>Ended</Text>
                      </View>
                    );
                  }
                  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
                  const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                  const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
                  const label = days > 0 ? `${days}d ${hours}h left` : hours > 0 ? `${hours}h ${mins}m left` : `${mins}m left`;
                  return (
                    <View style={{ backgroundColor: "rgba(251,191,36,0.1)", paddingHorizontal: 10, paddingVertical: 5, borderRadius: RADIUS.xs, flexDirection: "row", alignItems: "center", gap: 4, borderWidth: 1, borderColor: "rgba(251,191,36,0.15)" }}>
                      <Ionicons name="time-outline" size={11} color={COLORS.warning} />
                      <Text style={{ color: COLORS.warning, fontSize: FONT.sizes.xs, fontWeight: FONT.weights.semibold }}>{label}</Text>
                    </View>
                  );
                })()}
              </View>

              {/* Goal description */}
              {group.goal_description && (
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 }}>
                  <Ionicons name="flag" size={14} color={COLORS.warning} />
                  <Text style={{ color: COLORS.warning, fontSize: FONT.sizes.md, fontWeight: FONT.weights.medium, flex: 1 }} numberOfLines={2}>
                    {group.goal_description}
                  </Text>
                </View>
              )}

              {/* Prize */}
              {group.prize && (
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 }}>
                  <Ionicons name="gift" size={14} color={COLORS.accent} />
                  <Text style={{ color: COLORS.accent, fontSize: FONT.sizes.md, fontWeight: FONT.weights.medium, flex: 1 }} numberOfLines={2}>
                    {group.prize}
                  </Text>
                </View>
              )}

              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                <View style={{ flex: 1, marginRight: 12 }}>
                  {group.is_public && group.description && (
                    <Text style={{ color: colors.textSecondary, fontSize: FONT.sizes.md }} numberOfLines={2}>
                      {group.description}
                    </Text>
                  )}
                </View>
                <View style={{ alignItems: "center" }}>
                  <Text style={{ color: colors.textPrimary, fontSize: FONT.sizes["2xl"], fontWeight: FONT.weights.extrabold }}>{group.member_count}</Text>
                  <Text style={{ color: colors.textTertiary, fontSize: FONT.sizes.xs }}>members</Text>
                </View>
              </View>
            </View>
          )}

          {/* Podium */}
          {podium && podium.length > 0 && (
            <View
              style={{
                backgroundColor: "rgba(251,191,36,0.06)",
                borderRadius: RADIUS.xl,
                padding: 16,
                marginBottom: 16,
                borderWidth: 1,
                borderColor: "rgba(251,191,36,0.12)",
              }}
            >
              <Text style={{ ...SECTION_HEADER_STYLE, color: COLORS.warning, marginBottom: 12 }}>
                Last Week's Winners
              </Text>
              {podium.map((entry) => (
                <View key={entry.id} style={{ flexDirection: "row", alignItems: "center", paddingVertical: 8 }}>
                  <Text style={{ fontSize: 22, marginRight: 12 }}>
                    {entry.rank === 1 ? "\uD83E\uDD47" : entry.rank === 2 ? "\uD83E\uDD48" : "\uD83E\uDD49"}
                  </Text>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: colors.textPrimary, fontWeight: FONT.weights.semibold }}>{entry.user.username}</Text>
                    <Text style={{ color: colors.textTertiary, fontSize: FONT.sizes.sm }}>
                      {entry.vote_count} vote{entry.vote_count !== 1 ? "s" : ""}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Phase banner */}
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <Text style={{ color: colors.textPrimary, fontSize: FONT.sizes.xl, fontWeight: FONT.weights.bold }}>
              Week {weekNumber}
            </Text>
            <LinearGradient
              colors={phaseGradient as unknown as string[]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{ paddingHorizontal: 14, paddingVertical: 6, borderRadius: RADIUS.xs }}
            >
              <Text style={{ color: colors.textPrimary, fontSize: FONT.sizes.sm, fontWeight: FONT.weights.bold }}>{phaseLabel}</Text>
            </LinearGradient>
          </View>

          {/* Upload buttons */}
          {canUpload && !challengeEnded && (
            isUploading ? (
              <View style={{ backgroundColor: colors.glass, flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 18, borderRadius: RADIUS.lg, marginBottom: 16, borderWidth: 1, borderColor: colors.borderBrand }}>
                <ActivityIndicator color={COLORS.brand} />
                <Text style={{ color: COLORS.brandLight, fontWeight: FONT.weights.semibold, fontSize: FONT.sizes.lg, marginLeft: 10 }}>Uploading...</Text>
              </View>
            ) : (
              <View style={{ flexDirection: "row", gap: 10, marginBottom: 16 }}>
                <AnimatedPressable
                  onPress={handlePickVideo}
                  style={{
                    flex: 1,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    backgroundColor: colors.glass,
                    paddingVertical: 16,
                    borderRadius: RADIUS.lg,
                    borderWidth: 1,
                    borderColor: colors.borderBrand,
                  }}
                >
                  <Ionicons name="images" size={20} color={COLORS.brand} />
                  <Text style={{ color: colors.textPrimary, fontWeight: FONT.weights.semibold }}>Gallery</Text>
                </AnimatedPressable>
                <AnimatedPressable
                  onPress={handleRecordVideo}
                  style={{
                    flex: 1,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    backgroundColor: colors.glass,
                    paddingVertical: 16,
                    borderRadius: RADIUS.lg,
                    borderWidth: 1,
                    borderColor: colors.borderBrand,
                  }}
                >
                  <Ionicons name="videocam" size={20} color={COLORS.brandLight} />
                  <Text style={{ color: colors.textPrimary, fontWeight: FONT.weights.semibold }}>Record</Text>
                </AnimatedPressable>
              </View>
            )
          )}

          {/* Videos */}
          {videosPending && (
            <View style={{ alignItems: "center", paddingVertical: 48 }}>
              <ActivityIndicator size="large" color={COLORS.brand} />
            </View>
          )}

          {!videosPending && (videos ?? []).length === 0 && (
            <EmptyState
              icon="videocam-outline"
              title="No videos this week"
              subtitle={canUpload ? "Be the first to post a video!" : "No one posted this week."}
            />
          )}

          {(videos ?? []).map((video, index) => (
            <VideoItem
              key={video.id}
              video={video}
              canVote={canVote}
              isVoted={myVote?.video_id === video.id}
              voteCount={voteCounts?.[video.id] ?? 0}
              onVote={() => castVote.mutate({ videoId: video.id, groupId: id!, weekNumber, year })}
              isOwnVideo={video.submitter.id === user?.id}
              onDelete={() => handleDelete(video.id, video.video_path)}
              index={index}
              groupId={id!}
            />
          ))}
        </ScrollView>

        {/* Invite Bottom Sheet */}
        <BottomSheet
          isOpen={showInvite}
          onClose={() => setShowInvite(false)}
          snapPoint={0.35}
        >
          <View style={{ paddingHorizontal: 20, paddingTop: 8 }}>
            <Text style={{ color: colors.textPrimary, fontSize: FONT.sizes["2xl"], fontWeight: FONT.weights.bold, marginBottom: 20 }}>
              Invite Friends
            </Text>
            {group && !group.is_public && (
              <View style={{ marginBottom: 16 }}>
                <Text style={{ color: colors.textTertiary, fontSize: FONT.sizes.xs, fontWeight: FONT.weights.semibold, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>Invite code</Text>
                <View style={{ backgroundColor: colors.glassLight, borderRadius: RADIUS.md, paddingVertical: 14, paddingHorizontal: 18, borderWidth: 1, borderColor: colors.border }}>
                  <Text style={{ color: colors.textPrimary, fontSize: FONT.sizes["3xl"], letterSpacing: 4, fontFamily: "SpaceMono" }}>
                    {group.invite_code}
                  </Text>
                </View>
              </View>
            )}
            <AnimatedPressable onPress={handleShare}>
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
                <Ionicons name="share-outline" size={20} color={colors.textPrimary} />
                <Text style={{ color: colors.textPrimary, fontSize: FONT.sizes.lg, fontWeight: FONT.weights.bold }}>Share Challenge</Text>
              </LinearGradient>
            </AnimatedPressable>
          </View>
        </BottomSheet>

        {/* Members Bottom Sheet */}
        <BottomSheet
          isOpen={showMembers}
          onClose={() => setShowMembers(false)}
          snapPoint={0.6}
        >
          <View style={{ paddingHorizontal: 20, paddingTop: 8 }}>
            <Text style={{ color: colors.textPrimary, fontSize: FONT.sizes["2xl"], fontWeight: FONT.weights.bold, marginBottom: 20 }}>
              Members
            </Text>

            {membersPending && (
              <ActivityIndicator size="large" color={COLORS.brand} style={{ paddingVertical: 20 }} />
            )}

            {(members ?? []).map((member) => (
              <View
                key={member.id}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingVertical: 12,
                  paddingHorizontal: 12,
                  marginBottom: 6,
                  backgroundColor: colors.glass,
                  borderRadius: RADIUS.md,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <Avatar url={member.avatar_url} username={member.username} size={40} />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={{ color: colors.textPrimary, fontSize: FONT.sizes.base, fontWeight: FONT.weights.semibold }}>
                    {member.username}
                  </Text>
                  <View style={{ flexDirection: "row", marginTop: 3 }}>
                    <View style={{
                      backgroundColor: member.role === "owner" ? "rgba(255,45,125,0.15)" : colors.glass,
                      paddingHorizontal: 8,
                      paddingVertical: 2,
                      borderRadius: RADIUS.xs,
                    }}>
                      <Text style={{
                        color: member.role === "owner" ? COLORS.brandLight : colors.textTertiary,
                        fontSize: FONT.sizes.xs,
                        fontWeight: FONT.weights.medium,
                        textTransform: "capitalize",
                      }}>
                        {member.role}
                      </Text>
                    </View>
                  </View>
                </View>
                {isOwner && member.role !== "owner" && (
                  <Pressable onPress={() => handleRemoveMember(member)} hitSlop={8}>
                    <Ionicons name="close-circle" size={22} color={COLORS.error} />
                  </Pressable>
                )}
              </View>
            ))}

            {/* Group actions */}
            <View style={{ marginTop: 24, gap: 10 }}>
              {isOwner ? (
                <AnimatedPressable
                  onPress={handleDeleteGroup}
                  style={{
                    backgroundColor: "rgba(244,63,94,0.08)",
                    paddingVertical: 14,
                    borderRadius: RADIUS.md,
                    alignItems: "center",
                    borderWidth: 1,
                    borderColor: "rgba(244,63,94,0.15)",
                  }}
                >
                  <Text style={{ color: COLORS.error, fontSize: FONT.sizes.base, fontWeight: FONT.weights.semibold }}>Delete Challenge</Text>
                </AnimatedPressable>
              ) : (
                <AnimatedPressable
                  onPress={handleLeaveGroup}
                  style={{
                    backgroundColor: "rgba(244,63,94,0.08)",
                    paddingVertical: 14,
                    borderRadius: RADIUS.md,
                    alignItems: "center",
                    borderWidth: 1,
                    borderColor: "rgba(244,63,94,0.15)",
                  }}
                >
                  <Text style={{ color: COLORS.error, fontSize: FONT.sizes.base, fontWeight: FONT.weights.semibold }}>Leave Challenge</Text>
                </AnimatedPressable>
              )}
            </View>
          </View>
        </BottomSheet>

        {/* Upload details Bottom Sheet */}
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
      </View>
    </>
  );
}
