import { useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  FlatList,
  ActivityIndicator,
  Alert,
  Share,
  RefreshControl,
} from "react-native";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { PUBLIC_CATEGORIES } from "@/src/features/groups/usePublicGroups";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useGroupVideos, type GroupVideo } from "@/src/features/groups/useGroupVideos";
import { useDeleteGroup, useLeaveGroup, useUpdateGroup, useJoinGroupByCode } from "@/src/features/groups/useGroupActions";
import * as ImagePicker from "expo-image-picker";
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
import { useGroupChallenges, useCreateChallenge } from "@/src/features/groups/useChallenges";
import { Avatar } from "@/src/components/ui/Avatar";
import { AnimatedPressable } from "@/src/components/ui/AnimatedPressable";
import { BottomSheet, type BottomSheetHandle } from "@/src/components/ui/BottomSheet";
import { PhaseIndicator } from "@/src/components/ui/PhaseIndicator";
import { EmptyState } from "@/src/components/ui/EmptyState";
import { toast } from "@/src/lib/toast";
import {
  PALETTE,
  RADIUS,
  FONT,
  FONT_FAMILY,
  SPACING,
  CARD_STYLE,
  INPUT_STYLE,
  getGroupBannerColor,
} from "@/src/theme";

// ─── Video item ──────────────────────────────────────────────────
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
    <View style={{ ...CARD_STYLE, overflow: "hidden", marginBottom: 12 }}>
      {/* Thumbnail */}
      <AnimatedPressable onPress={openFeed}>
        {video.thumbnail_url ? (
          <View>
            <Image
              source={{ uri: video.thumbnail_url }}
              style={{
                width: "100%",
                height: 220,
                borderTopLeftRadius: RADIUS.xl,
                borderTopRightRadius: RADIUS.xl,
              }}
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
          <View
            style={{
              width: "100%",
              height: 200,
              backgroundColor: "#F5F5F5",
              alignItems: "center",
              justifyContent: "center",
              borderTopLeftRadius: RADIUS.xl,
              borderTopRightRadius: RADIUS.xl,
            }}
          >
            <Ionicons name="play" size={28} color="#BBB" />
          </View>
        )}
      </AnimatedPressable>

      <View style={{ padding: 14 }}>
        {/* User row */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 10,
          }}
        >
          <Pressable
            onPress={() =>
              router.push({ pathname: "/user/[id]", params: { id: video.submitter.id } })
            }
            style={{ flexDirection: "row", alignItems: "center", gap: 10, flex: 1 }}
          >
            <Avatar
              url={video.submitter.avatar_url}
              username={video.submitter.username}
              size={32}
            />
            <Text
              style={{
                color: "#1A1A1A",
                fontSize: FONT.sizes.base,
                fontFamily: FONT_FAMILY.semibold,
              }}
              numberOfLines={1}
            >
              {video.submitter.username}
            </Text>
          </Pressable>
          {isOwnVideo && (
            <Pressable onPress={onDelete} hitSlop={8}>
              <Ionicons name="trash-outline" size={16} color="#F43F5E" />
            </Pressable>
          )}
        </View>

        {/* Actions row */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 18 }}>
          <Pressable
            onPress={handleLike}
            style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
          >
            <Ionicons
              name={hasLiked ? "heart" : "heart-outline"}
              size={22}
              color={hasLiked ? "#F43F5E" : "#999"}
            />
            {(likeCount ?? 0) > 0 && (
              <Text
                style={{
                  color: hasLiked ? "#F43F5E" : "#999",
                  fontSize: FONT.sizes.sm,
                  fontFamily: FONT_FAMILY.semibold,
                }}
              >
                {likeCount}
              </Text>
            )}
          </Pressable>

          <Pressable
            onPress={openComments}
            style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
          >
            <Ionicons name="chatbubble-outline" size={20} color="#999" />
            {(commentCount ?? 0) > 0 && (
              <Text
                style={{
                  color: "#999",
                  fontSize: FONT.sizes.sm,
                  fontFamily: FONT_FAMILY.semibold,
                }}
              >
                {commentCount}
              </Text>
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
                backgroundColor: isVoted ? PALETTE.sarcelle : "rgba(0,0,0,0.04)",
                borderWidth: isVoted ? 0 : 1,
                borderColor: isVoted ? "transparent" : "rgba(0,0,0,0.06)",
              }}
            >
              <Ionicons
                name={isVoted ? "checkmark-circle" : "trophy-outline"}
                size={16}
                color={isVoted ? "#FFFFFF" : "#999"}
              />
              <Text
                style={{
                  color: isVoted ? "#FFFFFF" : "#999",
                  fontSize: FONT.sizes.sm,
                  fontFamily: FONT_FAMILY.semibold,
                }}
              >
                {voteCount}
              </Text>
            </AnimatedPressable>
          )}

          {!canVote && voteCount > 0 && (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 4,
                marginLeft: "auto",
              }}
            >
              <Ionicons name="trophy" size={14} color={PALETTE.jaune} />
              <Text
                style={{
                  color: "#999",
                  fontSize: FONT.sizes.sm,
                  fontFamily: FONT_FAMILY.regular,
                }}
              >
                {voteCount}
              </Text>
            </View>
          )}
        </View>

        {(commentCount ?? 0) > 0 && (
          <Pressable onPress={openComments} style={{ marginTop: 8 }}>
            <Text
              style={{
                color: "#BBB",
                fontSize: FONT.sizes.sm,
                fontFamily: FONT_FAMILY.regular,
              }}
            >
              Voir les {commentCount} commentaire{(commentCount ?? 0) !== 1 ? "s" : ""}
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

// ─── Main screen ─────────────────────────────────────────────────
export default function GroupScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const { weekNumber, year, canUpload, canVote, prevWeek, prevYear, phase } =
    useTimelineLogic();

  const [activeTab, setActiveTab] = useState<"videos" | "defis">("videos");
  const [showMembers, setShowMembers] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [showJoinCode, setShowJoinCode] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const joinByCode = useJoinGroupByCode();
  const [showCreateChallenge, setShowCreateChallenge] = useState(false);
  const challengeSheetRef = useRef<BottomSheetHandle>(null);
  const challengeDescRef = useRef<any>(null);
  const challengePrizeRef = useRef<any>(null);
  const challengeRulesRef = useRef<any>(null);
  const editDescRef = useRef<any>(null);
  const [challengeTitle, setChallengeTitle] = useState("");
  const [challengeDesc, setChallengeDesc] = useState("");
  const [challengePrize, setChallengePrize] = useState("");
  const [challengeRules, setChallengeRules] = useState("");
  const [challengeDays, setChallengeDays] = useState(7);
  const [isCreatingChallenge, setIsCreatingChallenge] = useState(false);

  // Edit group
  const [showEditGroup, setShowEditGroup] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editCoverUri, setEditCoverUri] = useState<string | null>(null);
  const [isSavingGroup, setIsSavingGroup] = useState(false);

  const { data: groups, refetch: refetchGroups, isRefetching } = useMyGroups();
  const group = groups?.find((g) => g.id === id);

  const { data: videos, isPending: videosPending } = useGroupVideos(id!, weekNumber, year);
  const deleteMutation = useDeleteVideo();
  const { data: myVote } = useMyVote(id!, weekNumber, year);
  const { data: voteCounts } = useVoteCounts(id!, weekNumber, year);
  const castVote = useCastVote();
  const { data: podium } = useWeeklyPodium(id!, prevWeek, prevYear);
  const { data: members, isPending: membersPending } = useGroupMembers(id!);
  const removeMember = useRemoveMember(id!);
  const deleteGroup = useDeleteGroup();
  const leaveGroup = useLeaveGroup();
  const { data: challenges } = useGroupChallenges(id!);
  const createChallengeMut = useCreateChallenge();
  const updateGroup = useUpdateGroup();

  useRealtimeGroupVideos(id!, weekNumber, year);

  const myRole = members?.find((m) => m.user_id === user?.id)?.role;
  const isOwner = myRole === "owner";
  const isMember = !!myRole;
  const challengeEnded = group?.end_date
    ? new Date(group.end_date).getTime() < Date.now()
    : false;

  const handleCreateChallenge = () => {
    if (!challengeTitle.trim()) return;
    const submissionEnd = new Date(
      Date.now() + challengeDays * 24 * 60 * 60 * 1000,
    ).toISOString();
    setIsCreatingChallenge(true);
    createChallengeMut.mutate(
      {
        groupId: id!,
        title: challengeTitle.trim(),
        description: challengeDesc.trim() || undefined,
        prize: challengePrize.trim() || undefined,
        rules: challengeRules.trim() || undefined,
        submissionEnd,
      },
      {
        onSuccess: (c) => {
          setShowCreateChallenge(false);
          setChallengeTitle("");
          setChallengeDesc("");
          setChallengePrize("");
          setChallengeRules("");
          setChallengeDays(7);
          router.push({ pathname: "/challenge/[id]" as any, params: { id: c.id, groupId: id } });
        },
        onError: (err) => toast.error(err.message),
        onSettled: () => setIsCreatingChallenge(false),
      },
    );
  };

  const openEditGroup = () => {
    if (!group) return;
    setEditName(group.name);
    setEditDesc(group.description ?? "");
    setEditCoverUri(null);
    setShowEditGroup(true);
  };

  const pickEditCover = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Permission requise", "Autorise l'accès à ta galerie.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.8,
      allowsEditing: true,
      aspect: [16, 9],
    });
    if (result.canceled || !result.assets[0]) return;
    setEditCoverUri(result.assets[0].uri);
  };

  const handleSaveGroup = () => {
    if (!editName.trim()) return;
    setIsSavingGroup(true);
    updateGroup.mutate(
      {
        groupId: id!,
        name: editName.trim(),
        description: editDesc.trim() || null,
        coverUri: editCoverUri ?? undefined,
      },
      {
        onSuccess: () => {
          setShowEditGroup(false);
          toast.success("Groupe mis à jour !");
        },
        onError: (err) => toast.error(err.message),
        onSettled: () => setIsSavingGroup(false),
      },
    );
  };

  const handleDeleteGroup = () => {
    Alert.alert(
      "Supprimer le groupe",
      "Cela supprimera définitivement le groupe et tout son contenu. Es-tu sûr ?",
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
    Alert.alert("Quitter le groupe", "Es-tu sûr de vouloir quitter ?", [
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
      {
        text: "Retirer",
        style: "destructive",
        onPress: () => removeMember.mutate(member.id),
      },
    ]);
  };

  const handleShare = () => {
    if (!group) return;
    Share.share({
      message: `Rejoins mon groupe Dumbys "${group.name}" ! Code : ${group.invite_code}`,
    });
  };

  const handleDelete = (videoId: string, videoPath: string | null) => {
    Alert.alert("Supprimer la vidéo", "Es-tu sûr ?", [
      { text: "Annuler", style: "cancel" },
      {
        text: "Supprimer",
        style: "destructive",
        onPress: () => deleteMutation.mutate({ videoId, videoPath }),
      },
    ]);
  };

  const handleUploadPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push(`/camera?groupId=${id}` as any);
  };

  // ── Videos content ──────────────────────────────────────────────
  const VideosContent = (
    <>
      {/* Podium — last week's winners */}
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
          <Text
            style={{
              color: PALETTE.jaune,
              fontSize: FONT.sizes.xs,
              fontFamily: FONT_FAMILY.bold,
              textTransform: "uppercase",
              letterSpacing: 1.5,
              marginBottom: 12,
            }}
          >
            🏆 Gagnants de la semaine dernière
          </Text>
          {podium.map((entry) => (
            <View
              key={entry.id}
              style={{ flexDirection: "row", alignItems: "center", paddingVertical: 8 }}
            >
              <Text style={{ fontSize: 22, marginRight: 12 }}>
                {entry.rank === 1 ? "🥇" : entry.rank === 2 ? "🥈" : "🥉"}
              </Text>
              <View style={{ flex: 1 }}>
                <Text style={{ color: "#1A1A1A", fontFamily: FONT_FAMILY.semibold }}>
                  {entry.user.username}
                </Text>
                <Text
                  style={{
                    color: "#999",
                    fontSize: FONT.sizes.sm,
                    fontFamily: FONT_FAMILY.regular,
                  }}
                >
                  {entry.vote_count} vote{entry.vote_count !== 1 ? "s" : ""}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Week header */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 16,
        }}
      >
        <Text
          style={{
            fontSize: FONT.sizes.lg,
            fontFamily: FONT_FAMILY.bold,
            color: "#1A1A1A",
          }}
        >
          Semaine {weekNumber}
        </Text>
        <Text
          style={{
            fontSize: FONT.sizes.sm,
            fontFamily: FONT_FAMILY.regular,
            color: "#BBB",
          }}
        >
          {(videos ?? []).length} vidéo{(videos ?? []).length !== 1 ? "s" : ""}
        </Text>
      </View>

      {/* Videos list */}
      {videosPending ? (
        <View style={{ alignItems: "center", paddingVertical: 48 }}>
          <ActivityIndicator size="large" color={PALETTE.sarcelle} />
        </View>
      ) : (videos ?? []).length === 0 ? (
        <EmptyState
          icon="videocam-outline"
          title="Pas de vidéos cette semaine"
          subtitle={
            canUpload
              ? "Sois le premier à poster !"
              : "Personne n'a posté cette semaine."
          }
        />
      ) : (
        (videos ?? []).map((video, index) => (
          <VideoItem
            key={video.id}
            video={video}
            canVote={canVote}
            isVoted={myVote?.video_id === video.id}
            voteCount={voteCounts?.[video.id] ?? 0}
            onVote={() =>
              castVote.mutate({ videoId: video.id, groupId: id!, weekNumber, year })
            }
            isOwnVideo={video.submitter.id === user?.id}
            onDelete={() => handleDelete(video.id, video.video_path)}
            index={index}
            groupId={id!}
          />
        ))
      )}
    </>
  );

  // ── Challenges content ───────────────────────────────────────────
  const ChallengesContent = (
    <>
      {/* Header row */}
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <Text style={{ fontSize: FONT.sizes.lg, fontFamily: FONT_FAMILY.bold, color: "#1A1A1A" }}>
          {(challenges ?? []).length} défi{(challenges ?? []).length !== 1 ? "s" : ""}
        </Text>
        <AnimatedPressable
          onPress={() => setShowCreateChallenge(true)}
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 4,
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: RADIUS.sm,
            backgroundColor: PALETTE.fuchsia + "12",
            borderWidth: 1,
            borderColor: PALETTE.fuchsia + "20",
          }}
        >
          <Ionicons name="add" size={16} color={PALETTE.fuchsia} />
          <Text style={{ color: PALETTE.fuchsia, fontSize: FONT.sizes.sm, fontFamily: FONT_FAMILY.bold }}>
            Créer
          </Text>
        </AnimatedPressable>
      </View>

      {(challenges ?? []).length === 0 ? (
        <EmptyState
          icon="flag-outline"
          title="Aucun défi pour l'instant"
          subtitle="Lance le premier défi du groupe !"
        />
      ) : (
        (challenges ?? []).map((c) => {
          const statusConfig = {
            open: { label: "Soumissions ouvertes", color: PALETTE.sarcelle, icon: "videocam" as const, bg: PALETTE.sarcelle + "12" },
            qualifying: { label: "Qualification", color: PALETTE.jaune, icon: "podium" as const, bg: PALETTE.jaune + "12" },
            battle: { label: "Battle en cours !", color: PALETTE.fuchsia, icon: "flash" as const, bg: PALETTE.fuchsia + "12" },
            ended: { label: "Terminé", color: "#888", icon: "trophy" as const, bg: "#8882" },
          };
          const cfg = statusConfig[c.status as keyof typeof statusConfig] ?? statusConfig.open;
          const isActive = c.status !== "ended";
          return (
            <AnimatedPressable
              key={c.id}
              onPress={() => router.push({ pathname: "/challenge/[id]" as any, params: { id: c.id, groupId: id } })}
              style={{
                backgroundColor: "#FFF",
                borderRadius: RADIUS.xl,
                marginBottom: 10,
                overflow: "hidden",
                borderWidth: 1,
                borderColor: isActive ? cfg.color + "30" : "rgba(0,0,0,0.06)",
                shadowColor: isActive ? cfg.color : "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: isActive ? 0.10 : 0.04,
                shadowRadius: 8,
                elevation: isActive ? 4 : 1,
              }}
            >
              {/* Colored top stripe for active challenges */}
              {isActive && (
                <View style={{ height: 3, backgroundColor: cfg.color }} />
              )}
              <View style={{ flexDirection: "row", alignItems: "center", padding: 14, gap: 12 }}>
                <View style={{ width: 48, height: 48, borderRadius: RADIUS.lg, backgroundColor: cfg.bg, alignItems: "center", justifyContent: "center" }}>
                  <Ionicons name={cfg.icon} size={24} color={cfg.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: "#1A1A1A", fontSize: FONT.sizes.base, fontFamily: FONT_FAMILY.bold }} numberOfLines={1}>
                    {c.title}
                  </Text>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 }}>
                    <View style={{ backgroundColor: cfg.bg, borderRadius: RADIUS.full, paddingHorizontal: 8, paddingVertical: 3 }}>
                      <Text style={{ color: cfg.color, fontFamily: FONT_FAMILY.bold, fontSize: FONT.sizes.xs }}>
                        {cfg.label}
                      </Text>
                    </View>
                    {c.prize ? (
                      <Text style={{ color: "#999", fontSize: FONT.sizes.xs, fontFamily: FONT_FAMILY.regular }} numberOfLines={1}>
                        🏆 {c.prize}
                      </Text>
                    ) : c.description ? (
                      <Text style={{ color: "#999", fontSize: FONT.sizes.xs, fontFamily: FONT_FAMILY.regular, flex: 1 }} numberOfLines={1}>
                        {c.description}
                      </Text>
                    ) : null}
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={18} color={isActive ? cfg.color : "#CCC"} />
              </View>
            </AnimatedPressable>
          );
        })
      )}
    </>
  );

  // ── Bottom CTA bar ───────────────────────────────────────────────
  const BottomCTA = !challengeEnded ? (
    <View
      style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: SPACING["2xl"],
        paddingTop: SPACING.base,
        paddingBottom: Math.max(insets.bottom, SPACING.lg),
        backgroundColor: "#FFFFFF",
        borderTopWidth: 1,
        borderTopColor: "rgba(0,0,0,0.06)",
      }}
    >
      {canUpload && (
        <AnimatedPressable
          onPress={handleUploadPress}
          style={{ borderRadius: RADIUS.lg, overflow: "hidden" }}
        >
          <LinearGradient
            colors={["#FF6B3D", PALETTE.fuchsia]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              paddingVertical: 16,
              borderRadius: RADIUS.lg,
            }}
          >
            <Ionicons name="videocam" size={22} color="#FFF" />
            <Text
              style={{
                color: "#FFF",
                fontSize: FONT.sizes.lg,
                fontFamily: FONT_FAMILY.bold,
              }}
            >
              Uploader une vidéo
            </Text>
          </LinearGradient>
        </AnimatedPressable>
      )}

      {canVote && (
        <View
          style={{
            backgroundColor: `${PALETTE.sarcelle}12`,
            borderRadius: RADIUS.lg,
            paddingVertical: 14,
            paddingHorizontal: SPACING.lg,
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
          }}
        >
          <Ionicons name="trophy-outline" size={20} color={PALETTE.sarcelle} />
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: FONT.sizes.base,
                fontFamily: FONT_FAMILY.bold,
                color: PALETTE.sarcelle,
              }}
            >
              Phase de vote
            </Text>
            <Text
              style={{
                fontSize: FONT.sizes.xs,
                fontFamily: FONT_FAMILY.regular,
                color: PALETTE.sarcelle,
                opacity: 0.7,
              }}
            >
              Vote pour ta vidéo préférée ci-dessus
            </Text>
          </View>
        </View>
      )}

      {phase === "podium" && (
        <View
          style={{
            backgroundColor: `${PALETTE.jaune}12`,
            borderRadius: RADIUS.lg,
            paddingVertical: 14,
            paddingHorizontal: SPACING.lg,
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
          }}
        >
          <Text style={{ fontSize: 20 }}>🏆</Text>
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: FONT.sizes.base,
                fontFamily: FONT_FAMILY.bold,
                color: PALETTE.jaune,
              }}
            >
              Podium disponible
            </Text>
            <Text
              style={{
                fontSize: FONT.sizes.xs,
                fontFamily: FONT_FAMILY.regular,
                color: PALETTE.jaune,
                opacity: 0.7,
              }}
            >
              Les résultats de la semaine sont affichés ci-dessus
            </Text>
          </View>
        </View>
      )}
    </View>
  ) : null;

  const CTA_HEIGHT = challengeEnded ? 0 : 72 + Math.max(insets.bottom, SPACING.lg);

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={{ flex: 1, backgroundColor: "#F8F8FA" }}>

        {/* ── Hero header ──────────────────────────────────────── */}
        {(() => {
          const banner = group ? getGroupBannerColor(group.id) : { from: "#3FD0C9", to: "#1FAAA4" };
          const catMeta = group?.category ? PUBLIC_CATEGORIES.find((c) => c.key === group.category) : null;
          const initials = (group?.name ?? "G").slice(0, 2).toUpperCase();
          const endDate = group?.end_date ? (() => {
            const diffMs = new Date(group.end_date!).getTime() - Date.now();
            if (diffMs <= 0) return { label: "Terminé", color: "#F43F5E" };
            const days = Math.floor(diffMs / 86400000);
            const hours = Math.floor((diffMs % 86400000) / 3600000);
            return { label: days > 0 ? `${days}j restant` : `${hours}h restant`, color: PALETTE.jaune };
          })() : null;

          return (
            <View style={{ height: 260 }}>
              {/* Cover or banner */}
              {group?.cover_url ? (
                <Image source={{ uri: group.cover_url }} style={{ position: "absolute", width: "100%", height: "100%" }} contentFit="cover" />
              ) : (
                <LinearGradient colors={[banner.from, banner.to]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ position: "absolute", width: "100%", height: "100%", alignItems: "center", justifyContent: "center" }}>
                  <Text style={{ fontSize: 72, fontFamily: FONT_FAMILY.black, color: "rgba(255,255,255,0.18)", letterSpacing: -4 }}>{initials}</Text>
                </LinearGradient>
              )}

              {/* Top gradient for buttons readability */}
              <LinearGradient colors={["rgba(0,0,0,0.45)", "transparent"]} style={{ position: "absolute", top: 0, left: 0, right: 0, height: 90 }} />
              {/* Bottom gradient for info readability */}
              <LinearGradient colors={["transparent", "rgba(0,0,0,0.80)"]} style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 110 }} />

              {/* Top action buttons */}
              <View style={{ position: "absolute", top: insets.top + 8, left: 16, right: 16, flexDirection: "row", alignItems: "center" }}>
                <AnimatedPressable
                  onPress={() => router.back()}
                  style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(0,0,0,0.35)", alignItems: "center", justifyContent: "center" }}
                >
                  <Ionicons name="arrow-back" size={20} color="#FFF" />
                </AnimatedPressable>

                <View style={{ flex: 1 }} />
                <PhaseIndicator showDaysLeft={false} />
                <View style={{ width: 8 }} />

                <AnimatedPressable onPress={() => setShowMembers(true)} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(0,0,0,0.35)", alignItems: "center", justifyContent: "center" }}>
                  <Ionicons name="people-outline" size={18} color="#FFF" />
                </AnimatedPressable>

                {isOwner && (
                  <AnimatedPressable onPress={openEditGroup} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(0,0,0,0.35)", alignItems: "center", justifyContent: "center", marginLeft: 8 }}>
                    <Ionicons name="settings-outline" size={18} color="#FFF" />
                  </AnimatedPressable>
                )}

                <AnimatedPressable onPress={() => setShowInvite(true)} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(0,0,0,0.35)", alignItems: "center", justifyContent: "center", marginLeft: 8 }}>
                  <Ionicons name="share-outline" size={18} color="#FFF" />
                </AnimatedPressable>
              </View>

              {/* Bottom info overlay */}
              <View style={{ position: "absolute", bottom: 14, left: 16, right: 16 }}>
                {/* Category + badges row */}
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 6, flexWrap: "wrap" }}>
                  {catMeta && (
                    <View style={{ backgroundColor: "rgba(0,0,0,0.45)", borderRadius: RADIUS.full, paddingHorizontal: 9, paddingVertical: 3, flexDirection: "row", alignItems: "center", gap: 4 }}>
                      <Ionicons name={catMeta.icon as any} size={11} color={catMeta.color} />
                      <Text style={{ color: "#FFF", fontSize: FONT.sizes.xs, fontFamily: FONT_FAMILY.semibold }}>{catMeta.label}</Text>
                    </View>
                  )}
                  {group?.status === "pending_public" ? (
                    <View style={{ backgroundColor: "rgba(253,184,19,0.92)", borderRadius: RADIUS.full, paddingHorizontal: 9, paddingVertical: 3, flexDirection: "row", alignItems: "center", gap: 4 }}>
                      <Ionicons name="time-outline" size={10} color="#1A1A1A" />
                      <Text style={{ color: "#1A1A1A", fontSize: FONT.sizes.xs, fontFamily: FONT_FAMILY.bold }}>En révision</Text>
                    </View>
                  ) : group?.status === "rejected_public" ? (
                    <View style={{ backgroundColor: "rgba(244,63,94,0.88)", borderRadius: RADIUS.full, paddingHorizontal: 9, paddingVertical: 3, flexDirection: "row", alignItems: "center", gap: 4 }}>
                      <Ionicons name="close-circle-outline" size={10} color="#FFF" />
                      <Text style={{ color: "#FFF", fontSize: FONT.sizes.xs, fontFamily: FONT_FAMILY.semibold }}>Demande refusée</Text>
                    </View>
                  ) : (
                    <View style={{ backgroundColor: group?.is_public ? "rgba(63,208,201,0.7)" : "rgba(0,0,0,0.45)", borderRadius: RADIUS.full, paddingHorizontal: 9, paddingVertical: 3, flexDirection: "row", alignItems: "center", gap: 4 }}>
                      <Ionicons name={group?.is_public ? "globe-outline" : "lock-closed-outline"} size={10} color="#FFF" />
                      <Text style={{ color: "#FFF", fontSize: FONT.sizes.xs, fontFamily: FONT_FAMILY.semibold }}>{group?.is_public ? "Public" : "Privé"}</Text>
                    </View>
                  )}
                  {endDate && (
                    <View style={{ backgroundColor: "rgba(0,0,0,0.45)", borderRadius: RADIUS.full, paddingHorizontal: 9, paddingVertical: 3, flexDirection: "row", alignItems: "center", gap: 4 }}>
                      <Ionicons name="time-outline" size={10} color={endDate.color} />
                      <Text style={{ color: endDate.color, fontSize: FONT.sizes.xs, fontFamily: FONT_FAMILY.semibold }}>{endDate.label}</Text>
                    </View>
                  )}
                </View>

                {/* Group name + members */}
                <Text style={{ color: "#FFF", fontSize: FONT.sizes["2xl"], fontFamily: FONT_FAMILY.black, letterSpacing: -0.5 }} numberOfLines={1}>
                  {group?.name ?? "Groupe"}
                </Text>
                <Text style={{ color: "rgba(255,255,255,0.65)", fontSize: FONT.sizes.xs, fontFamily: FONT_FAMILY.medium, marginTop: 2 }}>
                  {group?.member_count ?? 0} membre{(group?.member_count ?? 0) !== 1 ? "s" : ""}
                  {group?.description ? `  ·  ${group.description}` : ""}
                </Text>
              </View>
            </View>
          );
        })()}

        {/* ── Status banner (pending / rejected) ───────── */}
        {group?.status === "pending_public" && (
          <View style={{ backgroundColor: "#FFFBEB", borderBottomWidth: 1, borderBottomColor: "#FDE68A", paddingHorizontal: SPACING.lg, paddingVertical: 12, flexDirection: "row", alignItems: "flex-start", gap: 10 }}>
            <Ionicons name="time-outline" size={18} color="#D97706" style={{ marginTop: 1 }} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: FONT.sizes.sm, fontFamily: FONT_FAMILY.bold, color: "#92400E" }}>Groupe en révision</Text>
              <Text style={{ fontSize: FONT.sizes.xs, fontFamily: FONT_FAMILY.regular, color: "#B45309", marginTop: 2, lineHeight: 16 }}>
                Un admin va examiner ta demande. Tu seras notifié dès qu'une décision est prise. En attendant, le groupe reste privé.
              </Text>
            </View>
          </View>
        )}
        {group?.status === "rejected_public" && (
          <View style={{ backgroundColor: "#FFF1F2", borderBottomWidth: 1, borderBottomColor: "#FECDD3", paddingHorizontal: SPACING.lg, paddingVertical: 12, flexDirection: "row", alignItems: "flex-start", gap: 10 }}>
            <Ionicons name="close-circle-outline" size={18} color="#E11D48" style={{ marginTop: 1 }} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: FONT.sizes.sm, fontFamily: FONT_FAMILY.bold, color: "#9F1239" }}>Demande refusée</Text>
              <Text style={{ fontSize: FONT.sizes.xs, fontFamily: FONT_FAMILY.regular, color: "#BE123C", marginTop: 2, lineHeight: 16 }}>
                Ta demande de groupe public n'a pas été approuvée. Le groupe reste privé, tu peux continuer à inviter des membres.
              </Text>
            </View>
          </View>
        )}

        {/* ── Tab switcher ───────────────────────────────── */}
        {(() => {
          const activeCount = (challenges ?? []).filter((c) => c.status !== "ended").length;
          return (
            <View style={{ flexDirection: "row", paddingHorizontal: SPACING.lg, paddingVertical: 10, backgroundColor: "#F8F8FA", gap: 8 }}>
              <AnimatedPressable
                onPress={() => setActiveTab("videos")}
                style={{
                  flex: 1,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  paddingVertical: 10,
                  borderRadius: RADIUS.lg,
                  backgroundColor: activeTab === "videos" ? "#FFF" : "transparent",
                  borderWidth: 1,
                  borderColor: activeTab === "videos" ? "rgba(0,0,0,0.08)" : "transparent",
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: activeTab === "videos" ? 0.06 : 0,
                  shadowRadius: 4,
                  elevation: activeTab === "videos" ? 2 : 0,
                }}
              >
                <Ionicons name="videocam-outline" size={16} color={activeTab === "videos" ? "#1A1A1A" : "#999"} />
                <Text style={{ fontSize: FONT.sizes.sm, fontFamily: FONT_FAMILY.bold, color: activeTab === "videos" ? "#1A1A1A" : "#999" }}>
                  Vidéos
                </Text>
              </AnimatedPressable>

              <AnimatedPressable
                onPress={() => setActiveTab("defis")}
                style={{
                  flex: 1,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  paddingVertical: 10,
                  borderRadius: RADIUS.lg,
                  backgroundColor: activeTab === "defis" ? "#FFF" : "transparent",
                  borderWidth: 1,
                  borderColor: activeTab === "defis" ? PALETTE.fuchsia + "30" : "transparent",
                  shadowColor: PALETTE.fuchsia,
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: activeTab === "defis" ? 0.10 : 0,
                  shadowRadius: 4,
                  elevation: activeTab === "defis" ? 2 : 0,
                }}
              >
                <Ionicons name="flag-outline" size={16} color={activeTab === "defis" ? PALETTE.fuchsia : "#999"} />
                <Text style={{ fontSize: FONT.sizes.sm, fontFamily: FONT_FAMILY.bold, color: activeTab === "defis" ? PALETTE.fuchsia : "#999" }}>
                  Défis
                </Text>
                {activeCount > 0 && (
                  <View style={{ backgroundColor: PALETTE.fuchsia, borderRadius: RADIUS.full, minWidth: 18, height: 18, alignItems: "center", justifyContent: "center", paddingHorizontal: 4 }}>
                    <Text style={{ color: "#FFF", fontSize: 10, fontFamily: FONT_FAMILY.bold }}>{activeCount}</Text>
                  </View>
                )}
              </AnimatedPressable>
            </View>
          );
        })()}

        {/* ── Content ────────────────────────────────────── */}
        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: SPACING.lg,
            paddingTop: SPACING.lg,
            paddingBottom: CTA_HEIGHT + SPACING.xl,
          }}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetchGroups}
              tintColor={PALETTE.sarcelle}
            />
          }
          showsVerticalScrollIndicator={false}
        >
          {activeTab === "videos" ? VideosContent : ChallengesContent}
        </ScrollView>

        {/* ── Sticky bottom CTA ─────────────────────────────── */}
        {BottomCTA}

        {/* ── Join by code sheet ────────────────────────────── */}
        <BottomSheet isOpen={showJoinCode} onClose={() => { setShowJoinCode(false); setJoinCode(""); }} snapPoint={0.4}>
          <View style={{ paddingHorizontal: SPACING["2xl"], paddingTop: 8 }}>
            <Text style={{ color: "#1A1A1A", fontSize: FONT.sizes["2xl"], fontFamily: FONT_FAMILY.bold, marginBottom: 6 }}>
              Rejoindre un groupe
            </Text>
            <Text style={{ color: "#999", fontSize: FONT.sizes.sm, fontFamily: FONT_FAMILY.regular, marginBottom: 24 }}>
              Entre le code d'invitation partagé par le créateur du groupe.
            </Text>

            <Text style={{ color: "#999", fontSize: FONT.sizes.xs, fontFamily: FONT_FAMILY.bold, textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 8 }}>
              Code d'invitation
            </Text>
            <TextInput
              value={joinCode}
              onChangeText={(t) => setJoinCode(t.toLowerCase().trim())}
              placeholder="ex: a1b2c3d4"
              placeholderTextColor="#CCC"
              autoCapitalize="none"
              autoCorrect={false}
              maxLength={12}
              returnKeyType="done"
              style={{
                backgroundColor: "#F5F5F5",
                borderRadius: RADIUS.md,
                paddingVertical: 14,
                paddingHorizontal: 18,
                borderWidth: 1.5,
                borderColor: joinCode.length > 0 ? PALETTE.sarcelle : "rgba(0,0,0,0.06)",
                fontSize: FONT.sizes["2xl"],
                fontFamily: "SpaceMono",
                color: "#1A1A1A",
                letterSpacing: 4,
                marginBottom: 20,
              }}
            />

            {joinByCode.isError && (
              <View style={{ backgroundColor: "rgba(244,63,94,0.08)", borderRadius: RADIUS.md, padding: SPACING.base, flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 16 }}>
                <Ionicons name="alert-circle-outline" size={16} color="#F43F5E" />
                <Text style={{ flex: 1, fontSize: FONT.sizes.sm, fontFamily: FONT_FAMILY.medium, color: "#F43F5E" }}>
                  {(joinByCode.error as Error)?.message ?? "Code invalide"}
                </Text>
              </View>
            )}

            <AnimatedPressable
              disabled={joinCode.length < 4 || joinByCode.isPending}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                joinByCode.mutate(joinCode, {
                  onSuccess: () => {
                    setShowJoinCode(false);
                    setJoinCode("");
                    toast.success("Tu as rejoint le groupe !");
                  },
                });
              }}
              style={{ borderRadius: RADIUS.lg, overflow: "hidden", opacity: joinCode.length < 4 ? 0.4 : 1 }}
            >
              <LinearGradient
                colors={[PALETTE.sarcelle, "#2ABFB8"]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={{ paddingVertical: 16, alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 8 }}
              >
                {joinByCode.isPending
                  ? <ActivityIndicator color="#FFF" />
                  : <><Ionicons name="enter-outline" size={20} color="#FFF" /><Text style={{ color: "#FFF", fontSize: FONT.sizes.lg, fontFamily: FONT_FAMILY.bold }}>Rejoindre</Text></>
                }
              </LinearGradient>
            </AnimatedPressable>
          </View>
        </BottomSheet>

        {/* ── Invite sheet ──────────────────────────────────── */}
        <BottomSheet isOpen={showInvite} onClose={() => setShowInvite(false)} snapPoint={0.35}>
          <View style={{ paddingHorizontal: SPACING["2xl"], paddingTop: 8 }}>
            <Text
              style={{
                color: "#1A1A1A",
                fontSize: FONT.sizes["2xl"],
                fontFamily: FONT_FAMILY.bold,
                marginBottom: 20,
              }}
            >
              Inviter des amis
            </Text>
            {group && !group.is_public && (
              <View style={{ marginBottom: 16 }}>
                <Text
                  style={{
                    color: "#999",
                    fontSize: FONT.sizes.xs,
                    fontFamily: FONT_FAMILY.semibold,
                    textTransform: "uppercase",
                    letterSpacing: 1,
                    marginBottom: 6,
                  }}
                >
                  Code d'invitation
                </Text>
                <View
                  style={{
                    backgroundColor: "#F5F5F5",
                    borderRadius: RADIUS.md,
                    paddingVertical: 14,
                    paddingHorizontal: 18,
                    borderWidth: 1,
                    borderColor: "rgba(0,0,0,0.06)",
                  }}
                >
                  <Text
                    style={{
                      color: "#1A1A1A",
                      fontSize: FONT.sizes["3xl"],
                      letterSpacing: 4,
                      fontFamily: "SpaceMono",
                    }}
                  >
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
              <Text
                style={{
                  color: "#FFFFFF",
                  fontSize: FONT.sizes.lg,
                  fontFamily: FONT_FAMILY.bold,
                }}
              >
                Partager le groupe
              </Text>
            </AnimatedPressable>
          </View>
        </BottomSheet>

        {/* ── Members sheet ─────────────────────────────────── */}
        <BottomSheet
          isOpen={showMembers}
          onClose={() => setShowMembers(false)}
          snapPoint={0.65}
        >
          <View style={{ paddingHorizontal: SPACING["2xl"], paddingTop: 8 }}>
            <Text
              style={{
                color: "#1A1A1A",
                fontSize: FONT.sizes["2xl"],
                fontFamily: FONT_FAMILY.bold,
                marginBottom: 20,
              }}
            >
              Membres
            </Text>

            {membersPending && (
              <ActivityIndicator
                size="large"
                color={PALETTE.sarcelle}
                style={{ paddingVertical: 20 }}
              />
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
                  backgroundColor: "#F8F8FA",
                  borderRadius: RADIUS.md,
                  borderWidth: 1,
                  borderColor: "rgba(0,0,0,0.04)",
                }}
              >
                <Avatar
                  url={member.avatar_url}
                  username={member.username}
                  size={40}
                />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text
                    style={{
                      color: "#1A1A1A",
                      fontSize: FONT.sizes.base,
                      fontFamily: FONT_FAMILY.semibold,
                    }}
                  >
                    {member.username}
                  </Text>
                  <View
                    style={{
                      flexDirection: "row",
                      marginTop: 3,
                    }}
                  >
                    <View
                      style={{
                        backgroundColor:
                          member.role === "owner"
                            ? PALETTE.sarcelle + "15"
                            : "rgba(0,0,0,0.04)",
                        paddingHorizontal: 8,
                        paddingVertical: 2,
                        borderRadius: RADIUS.xs,
                      }}
                    >
                      <Text
                        style={{
                          color: member.role === "owner" ? PALETTE.sarcelle : "#999",
                          fontSize: FONT.sizes.xs,
                          fontFamily: FONT_FAMILY.medium,
                        }}
                      >
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
                  <Text
                    style={{
                      color: "#F43F5E",
                      fontSize: FONT.sizes.base,
                      fontFamily: FONT_FAMILY.semibold,
                    }}
                  >
                    Supprimer le groupe
                  </Text>
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
                  <Text
                    style={{
                      color: "#F43F5E",
                      fontSize: FONT.sizes.base,
                      fontFamily: FONT_FAMILY.semibold,
                    }}
                  >
                    Quitter le groupe
                  </Text>
                </AnimatedPressable>
              )}
            </View>
          </View>
        </BottomSheet>

        {/* ── Edit group sheet ───────────────────────────────── */}
        <BottomSheet
          isOpen={showEditGroup}
          onClose={() => setShowEditGroup(false)}
          snapPoint={0.65}
        >
          <ScrollView style={{ paddingHorizontal: SPACING["2xl"], paddingTop: 8 }} keyboardShouldPersistTaps="handled">
            <Text
              style={{
                color: "#1A1A1A",
                fontSize: FONT.sizes["2xl"],
                fontFamily: FONT_FAMILY.bold,
                marginBottom: 20,
              }}
            >
              Modifier le groupe
            </Text>

            {/* Cover image */}
            <Text
              style={{
                fontSize: FONT.sizes.xs,
                fontFamily: FONT_FAMILY.bold,
                color: "#B0B0B0",
                textTransform: "uppercase",
                letterSpacing: 1.2,
                marginBottom: 8,
              }}
            >
              IMAGE DE COUVERTURE
            </Text>
            <Pressable
              onPress={pickEditCover}
              style={{
                width: "100%",
                height: 130,
                borderRadius: RADIUS.lg,
                backgroundColor: "#F2F2F2",
                borderWidth: 2,
                borderColor: (editCoverUri || group?.cover_url) ? PALETTE.sarcelle : "#E0E0E0",
                borderStyle: (editCoverUri || group?.cover_url) ? "solid" : "dashed",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
                marginBottom: 16,
              }}
            >
              {(editCoverUri || group?.cover_url) ? (
                <>
                  <Image
                    source={{ uri: editCoverUri ?? group!.cover_url! }}
                    style={{ position: "absolute", width: "100%", height: "100%" }}
                    contentFit="cover"
                  />
                  <View
                    style={{
                      position: "absolute",
                      bottom: 8,
                      right: 8,
                      backgroundColor: "rgba(0,0,0,0.5)",
                      borderRadius: RADIUS.full,
                      paddingHorizontal: 10,
                      paddingVertical: 4,
                    }}
                  >
                    <Text style={{ color: "#FFF", fontSize: FONT.sizes.xs, fontFamily: FONT_FAMILY.semibold }}>
                      Changer
                    </Text>
                  </View>
                </>
              ) : (
                <>
                  <Ionicons name="image-outline" size={28} color="#BBB" />
                  <Text style={{ color: "#BBB", fontSize: FONT.sizes.sm, fontFamily: FONT_FAMILY.medium, marginTop: 6 }}>
                    Ajouter une image
                  </Text>
                </>
              )}
            </Pressable>

            {/* Name */}
            <Text
              style={{
                fontSize: FONT.sizes.xs,
                fontFamily: FONT_FAMILY.bold,
                color: "#B0B0B0",
                textTransform: "uppercase",
                letterSpacing: 1.2,
                marginBottom: 8,
              }}
            >
              NOM DU GROUPE *
            </Text>
            <TextInput
              value={editName}
              onChangeText={setEditName}
              placeholder="Nom du groupe"
              placeholderTextColor="#CCC"
              style={{ ...INPUT_STYLE, marginBottom: 16 }}
              maxLength={50}
              returnKeyType="next"
              onSubmitEditing={() => editDescRef.current?.focus()}
              blurOnSubmit={false}
            />

            {/* Description */}
            <Text
              style={{
                fontSize: FONT.sizes.xs,
                fontFamily: FONT_FAMILY.bold,
                color: "#B0B0B0",
                textTransform: "uppercase",
                letterSpacing: 1.2,
                marginBottom: 8,
              }}
            >
              DESCRIPTION
            </Text>
            <TextInput
              ref={editDescRef}
              value={editDesc}
              onChangeText={setEditDesc}
              placeholder="Décris ton groupe..."
              placeholderTextColor="#CCC"
              multiline
              numberOfLines={3}
              style={{
                ...INPUT_STYLE,
                marginBottom: 24,
                minHeight: 80,
                textAlignVertical: "top",
              }}
              maxLength={200}
              returnKeyType="done"
              blurOnSubmit={true}
            />

            {/* Save */}
            <AnimatedPressable
              onPress={handleSaveGroup}
              disabled={!editName.trim() || isSavingGroup}
              style={{
                backgroundColor: editName.trim() ? PALETTE.sarcelle : "#DDD",
                paddingVertical: 16,
                borderRadius: RADIUS.md,
                alignItems: "center",
                flexDirection: "row",
                justifyContent: "center",
                gap: 8,
                marginBottom: 40,
              }}
            >
              {isSavingGroup ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Ionicons name="checkmark-circle-outline" size={20} color="#FFFFFF" />
              )}
              <Text
                style={{
                  color: "#FFFFFF",
                  fontSize: FONT.sizes.lg,
                  fontFamily: FONT_FAMILY.bold,
                }}
              >
                {isSavingGroup ? "Enregistrement..." : "Enregistrer"}
              </Text>
            </AnimatedPressable>
          </ScrollView>
        </BottomSheet>

        {/* ── Create challenge sheet ────────────────────────── */}
        <BottomSheet
          ref={challengeSheetRef}
          isOpen={showCreateChallenge}
          onClose={() => {
            setShowCreateChallenge(false);
            setChallengeTitle("");
            setChallengeDesc("");
            setChallengePrize("");
            setChallengeRules("");
            setChallengeDays(7);
          }}
          snapPoint={0.92}
        >
          <View style={{ paddingHorizontal: SPACING["2xl"], paddingTop: 8 }}>
            <Text
              style={{
                color: "#1A1A1A",
                fontSize: FONT.sizes["2xl"],
                fontFamily: FONT_FAMILY.bold,
                marginBottom: 20,
              }}
            >
              Nouveau défi
            </Text>

            <Text
              style={{
                fontSize: FONT.sizes.xs,
                fontFamily: FONT_FAMILY.bold,
                color: "#B0B0B0",
                textTransform: "uppercase",
                letterSpacing: 1.2,
                marginBottom: 8,
              }}
            >
              NOM *
            </Text>
            <TextInput
              value={challengeTitle}
              onChangeText={setChallengeTitle}
              placeholder="Ex: La meilleure chute"
              placeholderTextColor="#CCC"
              style={{ ...INPUT_STYLE, marginBottom: 16 }}
              maxLength={100}
              autoFocus
              returnKeyType="next"
              onSubmitEditing={() => challengeDescRef.current?.focus()}
              blurOnSubmit={false}
            />

            <Text
              style={{
                fontSize: FONT.sizes.xs,
                fontFamily: FONT_FAMILY.bold,
                color: "#B0B0B0",
                textTransform: "uppercase",
                letterSpacing: 1.2,
                marginBottom: 8,
              }}
            >
              DESCRIPTION (optionnel)
            </Text>
            <TextInput
              ref={challengeDescRef}
              value={challengeDesc}
              onChangeText={setChallengeDesc}
              placeholder="Décris le défi..."
              placeholderTextColor="#CCC"
              multiline
              numberOfLines={2}
              style={{
                ...INPUT_STYLE,
                marginBottom: 24,
                minHeight: 72,
                textAlignVertical: "top",
              }}
              maxLength={300}
            />

            <Text
              style={{
                fontSize: FONT.sizes.xs,
                fontFamily: FONT_FAMILY.bold,
                color: "#B0B0B0",
                textTransform: "uppercase",
                letterSpacing: 1.2,
                marginBottom: 8,
              }}
            >
              GAIN / RÉCOMPENSE (optionnel)
            </Text>
            <TextInput
              ref={challengePrizeRef}
              value={challengePrize}
              onChangeText={setChallengePrize}
              placeholder="Ex: Le gagnant choisit l'activité 🏆"
              placeholderTextColor="#CCC"
              style={{ ...INPUT_STYLE, marginBottom: 16 }}
              maxLength={150}
              returnKeyType="next"
              onSubmitEditing={() => challengeRulesRef.current?.focus()}
              blurOnSubmit={false}
              onFocus={() => challengeSheetRef.current?.scrollTo(250)}
            />

            <Text
              style={{
                fontSize: FONT.sizes.xs,
                fontFamily: FONT_FAMILY.bold,
                color: "#B0B0B0",
                textTransform: "uppercase",
                letterSpacing: 1.2,
                marginBottom: 8,
              }}
            >
              RÈGLES (optionnel)
            </Text>
            <TextInput
              ref={challengeRulesRef}
              value={challengeRules}
              onChangeText={setChallengeRules}
              placeholder="Ex: Vidéo max 30s, en extérieur uniquement..."
              placeholderTextColor="#CCC"
              multiline
              numberOfLines={3}
              style={{
                ...INPUT_STYLE,
                marginBottom: 24,
                minHeight: 80,
                textAlignVertical: "top",
              }}
              maxLength={500}
              returnKeyType="done"
              blurOnSubmit={true}
              onFocus={() => challengeSheetRef.current?.scrollToEnd()}
            />

            <Text
              style={{
                fontSize: FONT.sizes.xs,
                fontFamily: FONT_FAMILY.bold,
                color: "#B0B0B0",
                textTransform: "uppercase",
                letterSpacing: 1.2,
                marginBottom: 10,
              }}
            >
              DURÉE DES SOUMISSIONS
            </Text>
            <View style={{ flexDirection: "row", gap: 8, marginBottom: 24 }}>
              {[3, 7, 14].map((d) => (
                <Pressable
                  key={d}
                  onPress={() => setChallengeDays(d)}
                  style={{
                    flex: 1,
                    paddingVertical: 10,
                    borderRadius: RADIUS.md,
                    alignItems: "center",
                    backgroundColor: challengeDays === d ? PALETTE.fuchsia + "18" : "rgba(0,0,0,0.04)",
                    borderWidth: 1.5,
                    borderColor: challengeDays === d ? PALETTE.fuchsia : "rgba(0,0,0,0.06)",
                  }}
                >
                  <Text
                    style={{
                      color: challengeDays === d ? PALETTE.fuchsia : "#999",
                      fontFamily: FONT_FAMILY.bold,
                      fontSize: FONT.sizes.sm,
                    }}
                  >
                    {d}j
                  </Text>
                </Pressable>
              ))}
            </View>

            <AnimatedPressable
              onPress={handleCreateChallenge}
              disabled={!challengeTitle.trim() || isCreatingChallenge}
              style={{
                backgroundColor: challengeTitle.trim()
                  ? PALETTE.fuchsia
                  : "#DDD",
                paddingVertical: 16,
                borderRadius: RADIUS.md,
                alignItems: "center",
                flexDirection: "row",
                justifyContent: "center",
                gap: 8,
              }}
            >
              {isCreatingChallenge ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Ionicons name="flag-outline" size={20} color="#FFFFFF" />
              )}
              <Text
                style={{
                  color: "#FFFFFF",
                  fontSize: FONT.sizes.lg,
                  fontFamily: FONT_FAMILY.bold,
                }}
              >
                {isCreatingChallenge ? "Création..." : "Créer le défi"}
              </Text>
            </AnimatedPressable>
          </View>
        </BottomSheet>
      </View>
    </>
  );
}
