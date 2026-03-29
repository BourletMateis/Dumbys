import { useState } from "react";
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
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useGroupVideos, type GroupVideo } from "@/src/features/groups/useGroupVideos";
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
} from "@/src/theme";

type GroupTab = "videos" | "tournois";

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

  const [activeTab, setActiveTab] = useState<GroupTab>("videos");
  const [showMembers, setShowMembers] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [showCreateTournament, setShowCreateTournament] = useState(false);
  const [tournamentTitle, setTournamentTitle] = useState("");
  const [tournamentDesc, setTournamentDesc] = useState("");
  const [tournamentReward, setTournamentReward] = useState("");
  const [isCreatingTournament, setIsCreatingTournament] = useState(false);

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
  const { data: tournaments } = useGroupTournaments(id!);
  const createTournament = useCreateGroupTournament();

  useRealtimeGroupVideos(id!, weekNumber, year);

  const myRole = members?.find((m) => m.user_id === user?.id)?.role;
  const isOwner = myRole === "owner";
  const challengeEnded = group?.end_date
    ? new Date(group.end_date).getTime() < Date.now()
    : false;

  const handleCreateTournament = () => {
    if (!tournamentTitle.trim()) return;
    setIsCreatingTournament(true);
    createTournament.mutate(
      {
        groupId: id!,
        title: tournamentTitle.trim(),
        description: tournamentDesc.trim() || undefined,
        reward: tournamentReward.trim() || undefined,
      },
      {
        onSuccess: (t) => {
          setShowCreateTournament(false);
          setTournamentTitle("");
          setTournamentDesc("");
          setTournamentReward("");
          router.push({ pathname: "/tournament/[id]", params: { id: t.id } });
        },
        onError: (err) => toast.error(err.message),
        onSettled: () => setIsCreatingTournament(false),
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

  // ── Videos tab content ──────────────────────────────────────────
  const VideosTab = (
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

  // ── Tournois tab content ─────────────────────────────────────────
  const TournoisTab = (
    <>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
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
          {(tournaments ?? []).length} tournoi{(tournaments ?? []).length !== 1 ? "s" : ""}
        </Text>
        <AnimatedPressable
          onPress={() => setShowCreateTournament(true)}
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
          <Text
            style={{
              color: PALETTE.fuchsia,
              fontSize: FONT.sizes.sm,
              fontFamily: FONT_FAMILY.bold,
            }}
          >
            Créer
          </Text>
        </AnimatedPressable>
      </View>

      {(tournaments ?? []).length === 0 ? (
        <View
          style={{
            backgroundColor: "#F8F8FA",
            borderRadius: RADIUS.lg,
            padding: 32,
            alignItems: "center",
            borderWidth: 1,
            borderColor: "rgba(0,0,0,0.04)",
          }}
        >
          <Ionicons name="trophy-outline" size={36} color="#CCC" />
          <Text
            style={{
              color: "#BBB",
              fontSize: FONT.sizes.base,
              fontFamily: FONT_FAMILY.medium,
              marginTop: 12,
              textAlign: "center",
            }}
          >
            Aucun tournoi pour l'instant
          </Text>
          <Text
            style={{
              color: "#CCC",
              fontSize: FONT.sizes.sm,
              fontFamily: FONT_FAMILY.regular,
              marginTop: 4,
              textAlign: "center",
            }}
          >
            Crée le premier tournoi de ce groupe !
          </Text>
        </View>
      ) : (
        (tournaments ?? []).map((t) => (
          <AnimatedPressable
            key={t.id}
            onPress={() =>
              router.push({ pathname: "/tournament/[id]", params: { id: t.id } })
            }
            style={{
              ...CARD_STYLE,
              flexDirection: "row",
              alignItems: "center",
              padding: 14,
              marginBottom: 8,
              gap: 12,
            }}
          >
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: RADIUS.md,
                backgroundColor: PALETTE.fuchsia + "12",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons name="trophy" size={22} color={PALETTE.fuchsia} />
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  color: "#1A1A1A",
                  fontSize: FONT.sizes.base,
                  fontFamily: FONT_FAMILY.semibold,
                }}
                numberOfLines={1}
              >
                {t.title}
              </Text>
              {t.reward ? (
                <Text
                  style={{
                    color: PALETTE.jaune,
                    fontSize: FONT.sizes.xs,
                    fontFamily: FONT_FAMILY.medium,
                    marginTop: 2,
                  }}
                  numberOfLines={1}
                >
                  🏅 {t.reward}
                </Text>
              ) : null}
            </View>
            <Ionicons name="chevron-forward" size={18} color="#CCC" />
          </AnimatedPressable>
        ))
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

        {/* ── Header ──────────────────────────────────────────── */}
        <View
          style={{
            paddingTop: insets.top + SPACING.base,
            paddingBottom: SPACING.base,
            paddingHorizontal: SPACING.lg,
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
            backgroundColor: "#FFFFFF",
            borderBottomWidth: 1,
            borderBottomColor: "rgba(0,0,0,0.05)",
          }}
        >
          <AnimatedPressable
            onPress={() => router.back()}
            style={{
              width: 38,
              height: 38,
              borderRadius: RADIUS.sm,
              backgroundColor: "rgba(0,0,0,0.04)",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name="arrow-back" size={22} color="#1A1A1A" />
          </AnimatedPressable>

          <View style={{ flex: 1 }}>
            <Text
              style={{
                color: "#1A1A1A",
                fontSize: FONT.sizes.xl,
                fontFamily: FONT_FAMILY.bold,
              }}
              numberOfLines={1}
            >
              {group?.name ?? "Groupe"}
            </Text>
          </View>

          {/* Phase indicator */}
          <PhaseIndicator showDaysLeft={false} />

          <AnimatedPressable
            onPress={() => setShowMembers(true)}
            style={{
              width: 38,
              height: 38,
              borderRadius: RADIUS.sm,
              backgroundColor: "rgba(0,0,0,0.04)",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name="people-outline" size={20} color="#666" />
          </AnimatedPressable>

          <AnimatedPressable
            onPress={() => setShowInvite(true)}
            style={{
              width: 38,
              height: 38,
              borderRadius: RADIUS.sm,
              backgroundColor: "rgba(0,0,0,0.04)",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name="share-outline" size={20} color="#666" />
          </AnimatedPressable>
        </View>

        {/* ── Group info strip ──────────────────────────────── */}
        {group && (
          <View
            style={{
              backgroundColor: "#FFFFFF",
              paddingHorizontal: SPACING["2xl"],
              paddingVertical: SPACING.base,
              borderBottomWidth: 1,
              borderBottomColor: "rgba(0,0,0,0.05)",
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
            }}
          >
            {/* Public/Private badge */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 4,
                backgroundColor: PALETTE.sarcelle + "15",
                paddingHorizontal: 8,
                paddingVertical: 4,
                borderRadius: RADIUS.full,
              }}
            >
              <Ionicons
                name={group.is_public ? "globe-outline" : "lock-closed-outline"}
                size={11}
                color={PALETTE.sarcelle}
              />
              <Text
                style={{
                  color: PALETTE.sarcelle,
                  fontSize: FONT.sizes.xs,
                  fontFamily: FONT_FAMILY.semibold,
                }}
              >
                {group.is_public ? "Public" : "Privé"}
              </Text>
            </View>

            {/* Member count */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 4,
                backgroundColor: "rgba(0,0,0,0.04)",
                paddingHorizontal: 8,
                paddingVertical: 4,
                borderRadius: RADIUS.full,
              }}
            >
              <Ionicons name="people-outline" size={11} color="#666" />
              <Text
                style={{
                  color: "#666",
                  fontSize: FONT.sizes.xs,
                  fontFamily: FONT_FAMILY.semibold,
                }}
              >
                {group.member_count} membre{group.member_count !== 1 ? "s" : ""}
              </Text>
            </View>

            {/* End date countdown */}
            {group.end_date &&
              (() => {
                const diffMs = new Date(group.end_date).getTime() - Date.now();
                if (diffMs <= 0) {
                  return (
                    <View
                      style={{
                        backgroundColor: "rgba(244,63,94,0.08)",
                        paddingHorizontal: 8,
                        paddingVertical: 4,
                        borderRadius: RADIUS.full,
                      }}
                    >
                      <Text
                        style={{
                          color: "#F43F5E",
                          fontSize: FONT.sizes.xs,
                          fontFamily: FONT_FAMILY.semibold,
                        }}
                      >
                        Terminé
                      </Text>
                    </View>
                  );
                }
                const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
                const hours = Math.floor(
                  (diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
                );
                const label = days > 0 ? `${days}j restant` : `${hours}h restant`;
                return (
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 4,
                      backgroundColor: PALETTE.jaune + "15",
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                      borderRadius: RADIUS.full,
                    }}
                  >
                    <Ionicons name="time-outline" size={11} color={PALETTE.jaune} />
                    <Text
                      style={{
                        color: PALETTE.jaune,
                        fontSize: FONT.sizes.xs,
                        fontFamily: FONT_FAMILY.semibold,
                      }}
                    >
                      {label}
                    </Text>
                  </View>
                );
              })()}
          </View>
        )}

        {/* ── Tab bar ───────────────────────────────────────── */}
        <View
          style={{
            flexDirection: "row",
            backgroundColor: "#FFFFFF",
            borderBottomWidth: 1,
            borderBottomColor: "rgba(0,0,0,0.06)",
          }}
        >
          {(
            [
              { key: "videos", label: "Vidéos", icon: "play-circle-outline" },
              { key: "tournois", label: "Tournois", icon: "trophy-outline" },
            ] as const
          ).map((tab) => (
            <Pressable
              key={tab.key}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setActiveTab(tab.key);
              }}
              style={{
                flex: 1,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                paddingVertical: 12,
                borderBottomWidth: 2,
                borderBottomColor:
                  activeTab === tab.key ? PALETTE.fuchsia : "transparent",
              }}
            >
              <Ionicons
                name={tab.icon}
                size={16}
                color={activeTab === tab.key ? PALETTE.fuchsia : "#AAA"}
              />
              <Text
                style={{
                  fontSize: FONT.sizes.base,
                  fontFamily:
                    activeTab === tab.key ? FONT_FAMILY.bold : FONT_FAMILY.medium,
                  color: activeTab === tab.key ? PALETTE.fuchsia : "#AAA",
                }}
              >
                {tab.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* ── Tab content ───────────────────────────────────── */}
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
          {activeTab === "videos" ? VideosTab : TournoisTab}
        </ScrollView>

        {/* ── Sticky bottom CTA ─────────────────────────────── */}
        {BottomCTA}

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

        {/* ── Create tournament sheet ────────────────────────── */}
        <BottomSheet
          isOpen={showCreateTournament}
          onClose={() => {
            setShowCreateTournament(false);
            setTournamentTitle("");
            setTournamentDesc("");
            setTournamentReward("");
          }}
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
              Nouveau tournoi
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
              value={tournamentTitle}
              onChangeText={setTournamentTitle}
              placeholder="Ex: Défi Halloween 🎃"
              placeholderTextColor="#CCC"
              style={{ ...INPUT_STYLE, marginBottom: 16 }}
              maxLength={80}
              autoFocus
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
              value={tournamentDesc}
              onChangeText={setTournamentDesc}
              placeholder="Décris le tournoi..."
              placeholderTextColor="#CCC"
              multiline
              numberOfLines={2}
              style={{
                ...INPUT_STYLE,
                marginBottom: 16,
                minHeight: 72,
                textAlignVertical: "top",
              }}
              maxLength={200}
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
              RÉCOMPENSE (optionnel)
            </Text>
            <TextInput
              value={tournamentReward}
              onChangeText={setTournamentReward}
              placeholder="Ex: Un abonnement Netflix 🎬"
              placeholderTextColor="#CCC"
              style={{ ...INPUT_STYLE, marginBottom: 24 }}
              maxLength={100}
            />

            <AnimatedPressable
              onPress={handleCreateTournament}
              disabled={!tournamentTitle.trim() || isCreatingTournament}
              style={{
                backgroundColor: tournamentTitle.trim()
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
              {isCreatingTournament ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Ionicons name="trophy-outline" size={20} color="#FFFFFF" />
              )}
              <Text
                style={{
                  color: "#FFFFFF",
                  fontSize: FONT.sizes.lg,
                  fontFamily: FONT_FAMILY.bold,
                }}
              >
                {isCreatingTournament ? "Création..." : "Créer le tournoi"}
              </Text>
            </AnimatedPressable>
          </View>
        </BottomSheet>
      </View>
    </>
  );
}
