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
import { useGroupTournaments, useCreateGroupTournament } from "@/src/features/groups/useGroupTournaments";
import { Avatar } from "@/src/components/ui/Avatar";
import { AnimatedPressable } from "@/src/components/ui/AnimatedPressable";
import { BottomSheet } from "@/src/components/ui/BottomSheet";
import { EmptyState } from "@/src/components/ui/EmptyState";
import { useTheme } from "@/src/providers/ThemeProvider";
import { PALETTE, RADIUS, FONT, FONT_FAMILY } from "@/src/theme";

type ThemeProps = {
  colors: ReturnType<typeof useTheme>["colors"];
  isDark: boolean;
};

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
  colors,
  isDark,
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
} & ThemeProps) {
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
        backgroundColor: colors.card,
        borderRadius: RADIUS.xl,
        borderWidth: 1,
        borderColor: colors.border,
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
                  backgroundColor: "rgba(0,0,0,0.35)",
                  width: 56,
                  height: 56,
                  borderRadius: RADIUS.full,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons name="play" size={28} color="#FFFFFF" />
              </View>
            </View>
          </View>
        ) : (
          <View style={{ width: "100%", height: 200, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center", borderTopLeftRadius: RADIUS.xl, borderTopRightRadius: RADIUS.xl }}>
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
            <Text style={{ color: colors.textPrimary, fontSize: FONT.sizes.base, fontFamily: FONT_FAMILY.semibold }} numberOfLines={1}>
              {video.submitter.username}
            </Text>
          </Pressable>
          {isOwnVideo && (
            <Pressable onPress={onDelete} hitSlop={8}>
              <Ionicons name="trash-outline" size={16} color="#F43F5E" />
            </Pressable>
          )}
        </View>

        {/* Actions */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 18 }}>
          <Pressable onPress={handleLike} style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <Ionicons
              name={hasLiked ? "heart" : "heart-outline"}
              size={22}
              color={hasLiked ? "#F43F5E" : colors.textTertiary}
            />
            {(likeCount ?? 0) > 0 && (
              <Text style={{ color: hasLiked ? "#F43F5E" : colors.textTertiary, fontSize: FONT.sizes.sm, fontFamily: FONT_FAMILY.semibold }}>
                {likeCount}
              </Text>
            )}
          </Pressable>

          <Pressable onPress={openComments} style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <Ionicons name="chatbubble-outline" size={20} color={colors.textTertiary} />
            {(commentCount ?? 0) > 0 && (
              <Text style={{ color: colors.textTertiary, fontSize: FONT.sizes.sm, fontFamily: FONT_FAMILY.semibold }}>{commentCount}</Text>
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
                backgroundColor: isVoted ? PALETTE.sarcelle : isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
                borderWidth: isVoted ? 0 : 1,
                borderColor: isVoted ? "transparent" : colors.border,
              }}
            >
              <Ionicons
                name={isVoted ? "checkmark-circle" : "trophy-outline"}
                size={16}
                color={isVoted ? "#FFFFFF" : colors.textTertiary}
              />
              <Text style={{ color: isVoted ? "#FFFFFF" : colors.textTertiary, fontSize: FONT.sizes.sm, fontFamily: FONT_FAMILY.semibold }}>
                {voteCount}
              </Text>
            </AnimatedPressable>
          )}

          {!canVote && voteCount > 0 && (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginLeft: "auto" }}>
              <Ionicons name="trophy" size={14} color={PALETTE.jaune} />
              <Text style={{ color: colors.textTertiary, fontSize: FONT.sizes.sm, fontFamily: FONT_FAMILY.regular }}>{voteCount}</Text>
            </View>
          )}
        </View>

        {(commentCount ?? 0) > 0 && (
          <Pressable onPress={openComments} style={{ marginTop: 8 }}>
            <Text style={{ color: colors.textMuted, fontSize: FONT.sizes.sm, fontFamily: FONT_FAMILY.regular }}>
              Voir les {commentCount} commentaire{(commentCount ?? 0) !== 1 ? "s" : ""}
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

export default function GroupScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const { colors, isDark } = useTheme();
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

  const { data: tournaments } = useGroupTournaments(id!);
  const createTournament = useCreateGroupTournament();

  const [isUploading, setIsUploading] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [showCreateTournament, setShowCreateTournament] = useState(false);
  const [pendingVideoUri, setPendingVideoUri] = useState<string | null>(null);
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadDesc, setUploadDesc] = useState("");
  const [tournamentTitle, setTournamentTitle] = useState("");
  const [tournamentDesc, setTournamentDesc] = useState("");
  const [tournamentReward, setTournamentReward] = useState("");
  const [isCreatingTournament, setIsCreatingTournament] = useState(false);

  const handleCreateTournament = () => {
    if (!tournamentTitle.trim()) return;
    setIsCreatingTournament(true);
    createTournament.mutate(
      { groupId: id!, title: tournamentTitle.trim(), description: tournamentDesc.trim() || undefined, reward: tournamentReward.trim() || undefined },
      {
        onSuccess: (t) => {
          setShowCreateTournament(false);
          setTournamentTitle("");
          setTournamentDesc("");
          setTournamentReward("");
          router.push({ pathname: "/tournament/[id]", params: { id: t.id } });
        },
        onError: (err) => Alert.alert("Erreur", err.message),
        onSettled: () => setIsCreatingTournament(false),
      },
    );
  };

  useRealtimeGroupVideos(id!, weekNumber, year);

  const myRole = members?.find((m) => m.user_id === user?.id)?.role;
  const isOwner = myRole === "owner";
  const challengeEnded = group?.end_date ? new Date(group.end_date).getTime() < Date.now() : false;

  const handleDeleteGroup = () => {
    Alert.alert(
      "Supprimer le défi",
      "Cela supprimera définitivement le défi et tout son contenu. Es-tu sûr ?",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
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
    Alert.alert("Quitter le défi", "Es-tu sûr de vouloir quitter ?", [
      { text: "Annuler", style: "cancel" },
      {
        text: "Quitter",
        style: "destructive",
        onPress: () => leaveGroup.mutate(id!, { onSuccess: () => router.back() }),
      },
    ]);
  };

  const handleRemoveMember = (member: GroupMember) => {
    Alert.alert("Retirer le membre", `Retirer ${member.username} ?`, [
      { text: "Annuler", style: "cancel" },
      { text: "Retirer", style: "destructive", onPress: () => removeMember.mutate(member.id) },
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
        onError: (err) => Alert.alert("Échec de l'upload", err.message),
      },
    );
  };

  const handlePickVideo = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission requise", "Autorise l'accès à ta galerie.");
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
      Alert.alert("Permission requise", "Autorise l'accès à la caméra.");
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
      message: `Rejoins mon défi Dumbeez "${group.name}" ! Code : ${group.invite_code}`,
    });
  };

  const handleDelete = (videoId: string, videoPath: string | null) => {
    Alert.alert("Supprimer la vidéo", "Es-tu sûr ?", [
      { text: "Annuler", style: "cancel" },
      { text: "Supprimer", style: "destructive", onPress: () => deleteMutation.mutate({ videoId, videoPath }) },
    ]);
  };

  const phaseLabel = canVote ? "Phase Vote" : canUpload ? "Phase Upload" : "Résultats";
  const phaseColor = canVote ? PALETTE.sarcelle : canUpload ? PALETTE.fuchsia : PALETTE.jaune;

  const inputStyle = {
    backgroundColor: colors.surface,
    borderRadius: RADIUS.md,
    paddingVertical: 12,
    paddingHorizontal: 14,
    fontSize: FONT.sizes.base,
    fontFamily: FONT_FAMILY.regular,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
  };

  const sectionHeaderStyle = {
    color: colors.textSecondary,
    fontSize: FONT.sizes.xs,
    fontFamily: FONT_FAMILY.semibold,
    textTransform: "uppercase" as const,
    letterSpacing: 1,
  };

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
            style={{
              width: 40,
              height: 40,
              borderRadius: RADIUS.sm,
              backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
              alignItems: "center",
              justifyContent: "center",
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
          </AnimatedPressable>

          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.textPrimary, fontSize: FONT.sizes.xl, fontFamily: FONT_FAMILY.bold }} numberOfLines={1}>
              {group?.name ?? "Défi"}
            </Text>
          </View>

          <AnimatedPressable
            onPress={() => setShowMembers(true)}
            style={{
              width: 40,
              height: 40,
              borderRadius: RADIUS.sm,
              backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
              alignItems: "center",
              justifyContent: "center",
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Ionicons name="people-outline" size={20} color={colors.textSecondary} />
          </AnimatedPressable>

          <AnimatedPressable
            onPress={() => setShowInvite(true)}
            style={{
              width: 40,
              height: 40,
              borderRadius: RADIUS.sm,
              backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
              alignItems: "center",
              justifyContent: "center",
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Ionicons name="share-outline" size={20} color={colors.textSecondary} />
          </AnimatedPressable>
        </View>

        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetchGroups} tintColor={PALETTE.sarcelle} />
          }
          showsVerticalScrollIndicator={false}
        >
          {/* Group Info */}
          {group && (
            <View
              style={{
                backgroundColor: colors.card,
                borderRadius: RADIUS.xl,
                borderWidth: 1,
                borderColor: colors.border,
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
                    backgroundColor: PALETTE.sarcelle + "15",
                    paddingHorizontal: 10,
                    paddingVertical: 5,
                    borderRadius: RADIUS.xs,
                  }}
                >
                  <Ionicons
                    name={group.is_public ? "globe" : "lock-closed"}
                    size={12}
                    color={PALETTE.sarcelle}
                  />
                  <Text style={{ color: PALETTE.sarcelle, fontSize: FONT.sizes.xs, fontFamily: FONT_FAMILY.semibold }}>
                    {group.is_public ? "Public" : "Privé"}
                  </Text>
                </View>

                {/* Countdown timer */}
                {group.end_date && (() => {
                  const endMs = new Date(group.end_date).getTime();
                  const nowMs = Date.now();
                  const diffMs = endMs - nowMs;
                  if (diffMs <= 0) {
                    return (
                      <View style={{ backgroundColor: "rgba(244,63,94,0.08)", paddingHorizontal: 10, paddingVertical: 5, borderRadius: RADIUS.xs }}>
                        <Text style={{ color: "#F43F5E", fontSize: FONT.sizes.xs, fontFamily: FONT_FAMILY.semibold }}>Terminé</Text>
                      </View>
                    );
                  }
                  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
                  const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                  const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
                  const label = days > 0 ? `${days}j ${hours}h restant` : hours > 0 ? `${hours}h ${mins}m restant` : `${mins}m restant`;
                  return (
                    <View style={{ backgroundColor: PALETTE.jaune + "15", paddingHorizontal: 10, paddingVertical: 5, borderRadius: RADIUS.xs, flexDirection: "row", alignItems: "center", gap: 4 }}>
                      <Ionicons name="time-outline" size={11} color={PALETTE.jaune} />
                      <Text style={{ color: PALETTE.jaune, fontSize: FONT.sizes.xs, fontFamily: FONT_FAMILY.semibold }}>{label}</Text>
                    </View>
                  );
                })()}
              </View>

              {/* Goal description */}
              {group.goal_description && (
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 }}>
                  <Ionicons name="flag" size={14} color={PALETTE.jaune} />
                  <Text style={{ color: PALETTE.jaune, fontSize: FONT.sizes.md, fontFamily: FONT_FAMILY.medium, flex: 1 }} numberOfLines={2}>
                    {group.goal_description}
                  </Text>
                </View>
              )}

              {/* Prize */}
              {group.prize && (
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 }}>
                  <Ionicons name="gift" size={14} color={PALETTE.sarcelle} />
                  <Text style={{ color: PALETTE.sarcelle, fontSize: FONT.sizes.md, fontFamily: FONT_FAMILY.medium, flex: 1 }} numberOfLines={2}>
                    {group.prize}
                  </Text>
                </View>
              )}

              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                <View style={{ flex: 1, marginRight: 12 }}>
                  {group.is_public && group.description && (
                    <Text style={{ color: colors.textSecondary, fontSize: FONT.sizes.md, fontFamily: FONT_FAMILY.regular }} numberOfLines={2}>
                      {group.description}
                    </Text>
                  )}
                </View>
                <View style={{ alignItems: "center" }}>
                  <Text style={{ color: colors.textPrimary, fontSize: FONT.sizes["2xl"], fontFamily: FONT_FAMILY.extrabold }}>{group.member_count}</Text>
                  <Text style={{ color: colors.textTertiary, fontSize: FONT.sizes.xs, fontFamily: FONT_FAMILY.regular }}>membres</Text>
                </View>
              </View>
            </View>
          )}

          {/* Podium */}
          {podium && podium.length > 0 && (
            <View
              style={{
                backgroundColor: PALETTE.jaune + "10",
                borderRadius: RADIUS.xl,
                padding: 16,
                marginBottom: 16,
                borderWidth: 1,
                borderColor: PALETTE.jaune + "20",
              }}
            >
              <Text style={{ color: PALETTE.jaune, fontSize: FONT.sizes.xs, fontFamily: FONT_FAMILY.bold, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 12 }}>
                Gagnants de la semaine
              </Text>
              {podium.map((entry) => (
                <View key={entry.id} style={{ flexDirection: "row", alignItems: "center", paddingVertical: 8 }}>
                  <View
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 16,
                      marginRight: 12,
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor:
                        entry.rank === 1 ? PALETTE.jaune + "22"
                        : entry.rank === 2 ? "rgba(192,192,192,0.15)"
                        : "rgba(180,120,60,0.15)",
                    }}
                  >
                    <Ionicons
                      name="trophy"
                      size={16}
                      color={
                        entry.rank === 1 ? PALETTE.jaune
                        : entry.rank === 2 ? "#C0C0C0"
                        : "#CD7F32"
                      }
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: colors.textPrimary, fontFamily: FONT_FAMILY.semibold }}>{entry.user.username}</Text>
                    <Text style={{ color: colors.textTertiary, fontSize: FONT.sizes.sm, fontFamily: FONT_FAMILY.regular }}>
                      {entry.vote_count} vote{entry.vote_count !== 1 ? "s" : ""}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* ─── Tournois ──────────────────────────────────────── */}
          <View style={{ marginBottom: 20 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <Text style={{ color: colors.textPrimary, fontSize: FONT.sizes.xl, fontFamily: FONT_FAMILY.bold }}>
                Tournois
              </Text>
              <AnimatedPressable
                onPress={() => setShowCreateTournament(true)}
                style={{ flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 12, paddingVertical: 6, borderRadius: RADIUS.sm, backgroundColor: PALETTE.fuchsia + "12", borderWidth: 1, borderColor: PALETTE.fuchsia + "20" }}
              >
                <Ionicons name="add" size={16} color={PALETTE.fuchsia} />
                <Text style={{ color: PALETTE.fuchsia, fontSize: FONT.sizes.sm, fontFamily: FONT_FAMILY.bold }}>Créer</Text>
              </AnimatedPressable>
            </View>

            {(tournaments ?? []).length === 0 ? (
              <View style={{ backgroundColor: colors.surface, borderRadius: RADIUS.lg, padding: 20, alignItems: "center", borderWidth: 1, borderColor: colors.border }}>
                <Ionicons name="trophy-outline" size={28} color={colors.textMuted} />
                <Text style={{ color: colors.textMuted, fontSize: FONT.sizes.base, fontFamily: FONT_FAMILY.regular, marginTop: 8 }}>Aucun tournoi pour l'instant</Text>
              </View>
            ) : (
              (tournaments ?? []).map((t) => (
                <AnimatedPressable
                  key={t.id}
                  onPress={() => router.push({ pathname: "/tournament/[id]", params: { id: t.id } })}
                  style={{ backgroundColor: colors.card, borderRadius: RADIUS.xl, borderWidth: 1, borderColor: colors.border, flexDirection: "row", alignItems: "center", padding: 14, marginBottom: 8, gap: 12 }}
                >
                  <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: PALETTE.fuchsia + "12", alignItems: "center", justifyContent: "center" }}>
                    <Ionicons name="trophy" size={20} color={PALETTE.fuchsia} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: colors.textPrimary, fontSize: FONT.sizes.base, fontFamily: FONT_FAMILY.semibold }} numberOfLines={1}>{t.title}</Text>
                    {t.reward ? (
                      <Text style={{ color: PALETTE.jaune, fontSize: FONT.sizes.xs, fontFamily: FONT_FAMILY.medium, marginTop: 2 }} numberOfLines={1}>{t.reward}</Text>
                    ) : null}
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
                </AnimatedPressable>
              ))
            )}
          </View>

          {/* Phase banner */}
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <Text style={{ color: colors.textPrimary, fontSize: FONT.sizes.xl, fontFamily: FONT_FAMILY.bold }}>
              Semaine {weekNumber}
            </Text>
            <View
              style={{
                backgroundColor: phaseColor + "15",
                paddingHorizontal: 14,
                paddingVertical: 6,
                borderRadius: RADIUS.xs,
              }}
            >
              <Text style={{ color: phaseColor, fontSize: FONT.sizes.sm, fontFamily: FONT_FAMILY.bold }}>{phaseLabel}</Text>
            </View>
          </View>

          {/* Upload buttons */}
          {canUpload && !challengeEnded && (
            isUploading ? (
              <View style={{ backgroundColor: PALETTE.sarcelle + "10", flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 18, borderRadius: RADIUS.lg, marginBottom: 16 }}>
                <ActivityIndicator color={PALETTE.sarcelle} />
                <Text style={{ color: PALETTE.sarcelle, fontFamily: FONT_FAMILY.semibold, fontSize: FONT.sizes.lg, marginLeft: 10 }}>Upload en cours...</Text>
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
                    backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
                    paddingVertical: 16,
                    borderRadius: RADIUS.lg,
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}
                >
                  <Ionicons name="images" size={20} color={PALETTE.sarcelle} />
                  <Text style={{ color: colors.textPrimary, fontFamily: FONT_FAMILY.semibold }}>Galerie</Text>
                </AnimatedPressable>
                <AnimatedPressable
                  onPress={handleRecordVideo}
                  style={{
                    flex: 1,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
                    paddingVertical: 16,
                    borderRadius: RADIUS.lg,
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}
                >
                  <Ionicons name="videocam" size={20} color={PALETTE.fuchsia} />
                  <Text style={{ color: colors.textPrimary, fontFamily: FONT_FAMILY.semibold }}>Filmer</Text>
                </AnimatedPressable>
              </View>
            )
          )}

          {/* Videos */}
          {videosPending && (
            <View style={{ alignItems: "center", paddingVertical: 48 }}>
              <ActivityIndicator size="large" color={PALETTE.sarcelle} />
            </View>
          )}

          {!videosPending && (videos ?? []).length === 0 && (
            <EmptyState
              icon="videocam-outline"
              title="Pas de vidéos cette semaine"
              subtitle={canUpload ? "Sois le premier à poster !" : "Personne n'a posté cette semaine."}
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
              colors={colors}
              isDark={isDark}
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
            <Text style={{ color: colors.textPrimary, fontSize: FONT.sizes["2xl"], fontFamily: FONT_FAMILY.bold, marginBottom: 20 }}>
              Inviter des amis
            </Text>
            {group && !group.is_public && (
              <View style={{ marginBottom: 16 }}>
                <Text style={{ color: colors.textTertiary, fontSize: FONT.sizes.xs, fontFamily: FONT_FAMILY.semibold, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>Code d'invitation</Text>
                <View style={{ backgroundColor: colors.surface, borderRadius: RADIUS.md, paddingVertical: 14, paddingHorizontal: 18, borderWidth: 1, borderColor: colors.border }}>
                  <Text style={{ color: colors.textPrimary, fontSize: FONT.sizes["3xl"], letterSpacing: 4, fontFamily: "SpaceMono" }}>
                    {group.invite_code}
                  </Text>
                </View>
              </View>
            )}
            <AnimatedPressable
              onPress={handleShare}
              style={{
                backgroundColor: PALETTE.sarcelle,
                paddingVertical: 16,
                borderRadius: RADIUS.md,
                alignItems: "center",
                flexDirection: "row",
                justifyContent: "center",
                gap: 8,
              }}
            >
              <Ionicons name="share-outline" size={20} color="#FFFFFF" />
              <Text style={{ color: "#FFFFFF", fontSize: FONT.sizes.lg, fontFamily: FONT_FAMILY.bold }}>Partager le défi</Text>
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
            <Text style={{ color: colors.textPrimary, fontSize: FONT.sizes["2xl"], fontFamily: FONT_FAMILY.bold, marginBottom: 20 }}>
              Membres
            </Text>

            {membersPending && (
              <ActivityIndicator size="large" color={PALETTE.sarcelle} style={{ paddingVertical: 20 }} />
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
                  backgroundColor: colors.surface,
                  borderRadius: RADIUS.md,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <Avatar url={member.avatar_url} username={member.username} size={40} />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={{ color: colors.textPrimary, fontSize: FONT.sizes.base, fontFamily: FONT_FAMILY.semibold }}>
                    {member.username}
                  </Text>
                  <View style={{ flexDirection: "row", marginTop: 3 }}>
                    <View style={{
                      backgroundColor: member.role === "owner" ? PALETTE.sarcelle + "15" : isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
                      paddingHorizontal: 8,
                      paddingVertical: 2,
                      borderRadius: RADIUS.xs,
                    }}>
                      <Text style={{
                        color: member.role === "owner" ? PALETTE.sarcelle : colors.textTertiary,
                        fontSize: FONT.sizes.xs,
                        fontFamily: FONT_FAMILY.medium,
                        textTransform: "capitalize",
                      }}>
                        {member.role === "owner" ? "Créateur" : "Membre"}
                      </Text>
                    </View>
                  </View>
                </View>
                {isOwner && member.role !== "owner" && (
                  <Pressable onPress={() => handleRemoveMember(member)} hitSlop={8}>
                    <Ionicons name="close-circle" size={22} color="#F43F5E" />
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
                    backgroundColor: "rgba(244,63,94,0.06)",
                    paddingVertical: 14,
                    borderRadius: RADIUS.md,
                    alignItems: "center",
                    borderWidth: 1,
                    borderColor: "rgba(244,63,94,0.12)",
                  }}
                >
                  <Text style={{ color: "#F43F5E", fontSize: FONT.sizes.base, fontFamily: FONT_FAMILY.semibold }}>Supprimer le défi</Text>
                </AnimatedPressable>
              ) : (
                <AnimatedPressable
                  onPress={handleLeaveGroup}
                  style={{
                    backgroundColor: "rgba(244,63,94,0.06)",
                    paddingVertical: 14,
                    borderRadius: RADIUS.md,
                    alignItems: "center",
                    borderWidth: 1,
                    borderColor: "rgba(244,63,94,0.12)",
                  }}
                >
                  <Text style={{ color: "#F43F5E", fontSize: FONT.sizes.base, fontFamily: FONT_FAMILY.semibold }}>Quitter le défi</Text>
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
            <Text style={{ color: colors.textPrimary, fontSize: FONT.sizes["2xl"], fontFamily: FONT_FAMILY.bold, marginBottom: 20 }}>
              Nouveau Post
            </Text>

            <Text style={{ ...sectionHeaderStyle, marginBottom: 8 }}>
              Titre (optionnel)
            </Text>
            <TextInput
              value={uploadTitle}
              onChangeText={setUploadTitle}
              placeholder="Donne un nom à ta vidéo..."
              placeholderTextColor={colors.textMuted}
              style={{
                ...inputStyle,
                marginBottom: 16,
              }}
              maxLength={100}
            />

            <Text style={{ ...sectionHeaderStyle, marginBottom: 8 }}>
              Description (optionnel)
            </Text>
            <TextInput
              value={uploadDesc}
              onChangeText={setUploadDesc}
              placeholder="Qu'est-ce qui se passe dans cette vidéo ?"
              placeholderTextColor={colors.textMuted}
              multiline
              numberOfLines={3}
              style={{
                ...inputStyle,
                marginBottom: 24,
                minHeight: 80,
                textAlignVertical: "top",
              }}
              maxLength={300}
            />

            <AnimatedPressable
              onPress={doUpload}
              disabled={isUploading}
              style={{
                backgroundColor: PALETTE.sarcelle,
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
                  <ActivityIndicator color="#FFFFFF" />
                  <Text style={{ color: "#FFFFFF", fontSize: FONT.sizes.lg, fontFamily: FONT_FAMILY.bold }}>Upload en cours...</Text>
                </>
              ) : (
                <>
                  <Ionicons name="arrow-up-circle" size={20} color="#FFFFFF" />
                  <Text style={{ color: "#FFFFFF", fontSize: FONT.sizes.lg, fontFamily: FONT_FAMILY.bold }}>Publier</Text>
                </>
              )}
            </AnimatedPressable>
          </View>
        </BottomSheet>

        {/* Create Tournament Bottom Sheet */}
        <BottomSheet
          isOpen={showCreateTournament}
          onClose={() => { setShowCreateTournament(false); setTournamentTitle(""); setTournamentDesc(""); setTournamentReward(""); }}
          snapPoint={0.6}
        >
          <View style={{ paddingHorizontal: 20, paddingTop: 8 }}>
            <Text style={{ color: colors.textPrimary, fontSize: FONT.sizes["2xl"], fontFamily: FONT_FAMILY.bold, marginBottom: 20 }}>
              Nouveau Tournoi
            </Text>
            <Text style={{ ...sectionHeaderStyle, marginBottom: 8 }}>Titre *</Text>
            <TextInput
              value={tournamentTitle}
              onChangeText={setTournamentTitle}
              placeholder="Ex: Kickflip Masters"
              placeholderTextColor={colors.textMuted}
              style={{ ...inputStyle, marginBottom: 16 }}
              maxLength={80}
              autoFocus
            />
            <Text style={{ ...sectionHeaderStyle, marginBottom: 8 }}>Description (optionnel)</Text>
            <TextInput
              value={tournamentDesc}
              onChangeText={setTournamentDesc}
              placeholder="Décris le tournoi..."
              placeholderTextColor={colors.textMuted}
              multiline
              numberOfLines={2}
              style={{ ...inputStyle, marginBottom: 16, minHeight: 64, textAlignVertical: "top" }}
              maxLength={200}
            />
            <Text style={{ ...sectionHeaderStyle, marginBottom: 8 }}>Récompense (optionnel)</Text>
            <TextInput
              value={tournamentReward}
              onChangeText={setTournamentReward}
              placeholder="Ex: Pizza pour l'équipe"
              placeholderTextColor={colors.textMuted}
              style={{ ...inputStyle, marginBottom: 24 }}
              maxLength={100}
            />
            <AnimatedPressable
              onPress={handleCreateTournament}
              disabled={!tournamentTitle.trim() || isCreatingTournament}
              style={{ backgroundColor: tournamentTitle.trim() ? PALETTE.fuchsia : colors.elevated, paddingVertical: 16, borderRadius: RADIUS.md, alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 8 }}
            >
              {isCreatingTournament ? <ActivityIndicator color="#FFFFFF" /> : <Ionicons name="trophy-outline" size={20} color="#FFFFFF" />}
              <Text style={{ color: "#FFFFFF", fontSize: FONT.sizes.lg, fontFamily: FONT_FAMILY.bold }}>
                {isCreatingTournament ? "Création..." : "Créer le tournoi"}
              </Text>
            </AnimatedPressable>
          </View>
        </BottomSheet>
      </View>
    </>
  );
}
