import { useState, useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/src/lib/supabase";
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  Pressable,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useChallenge } from "@/src/features/groups/useChallenges";
import {
  useBracketMatches,
  useBracketVote,
  useStartBattle,
  useAdvanceBracketRound,
  useQualifyingVideos,
  type MatchWithVideos,
  type VideoWithStats,
} from "@/src/features/groups/useBattleChallenge";
import {
  useChallengeVideos,
} from "@/src/features/groups/useChallengeVideos";
import { useLikeCount, useHasLiked, useToggleLike } from "@/src/features/feed/useLikes";
import { useMyGroups } from "@/src/features/groups/useMyGroups";
import { useAuthStore } from "@/src/store/useAuthStore";
import { AnimatedPressable } from "@/src/components/ui/AnimatedPressable";
import { Avatar } from "@/src/components/ui/Avatar";
import { EmptyState } from "@/src/components/ui/EmptyState";
import { PALETTE, RADIUS, FONT, FONT_FAMILY } from "@/src/theme";

// ── Helpers ────────────────────────────────────────────────────────────────

function formatCountdown(dateStr: string | null): string {
  if (!dateStr) return "";
  const diff = new Date(dateStr).getTime() - Date.now();
  if (diff <= 0) return "Terminé";
  const h = Math.floor(diff / 3_600_000);
  const m = Math.floor((diff % 3_600_000) / 60_000);
  if (h > 48) return `${Math.floor(h / 24)}j restants`;
  if (h > 0) return `${h}h ${m}m restants`;
  return `${m}m restants`;
}

function roundLabel(round: number, bracketSize: number): string {
  const totalRounds = Math.log2(bracketSize);
  if (round === totalRounds) return "Finale";
  if (round === totalRounds - 1) return "Demi-finales";
  if (round === totalRounds - 2) return "Quarts de finale";
  return `Round ${round}`;
}

// ── Phase banner ──────────────────────────────────────────────────────────

function PhaseBanner({
  status,
  submissionEnd,
  roundEnd,
}: {
  status: string;
  submissionEnd: string | null;
  roundEnd: string | null;
}) {
  const configs = {
    open: { label: "Soumissions ouvertes", icon: "videocam", color: PALETTE.sarcelle, bg: `${PALETTE.sarcelle}18` },
    qualifying: { label: "Phase de qualification", icon: "podium", color: PALETTE.jaune, bg: `${PALETTE.jaune}18` },
    battle: { label: "Battle en cours !", icon: "flash", color: PALETTE.fuchsia, bg: `${PALETTE.fuchsia}18` },
    ended: { label: "Terminé", icon: "trophy", color: PALETTE.jaune, bg: `${PALETTE.jaune}18` },
  } as const;

  const cfg = configs[status as keyof typeof configs] ?? configs.open;
  const countdown =
    status === "open"
      ? formatCountdown(submissionEnd)
      : status === "battle"
        ? formatCountdown(roundEnd)
        : null;

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        backgroundColor: cfg.bg,
        borderRadius: RADIUS.lg,
        paddingHorizontal: 14,
        paddingVertical: 10,
        marginHorizontal: 20,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: `${cfg.color}30`,
      }}
    >
      <Ionicons name={cfg.icon as any} size={16} color={cfg.color} />
      <Text
        style={{
          color: cfg.color,
          fontFamily: FONT_FAMILY.semibold,
          fontSize: FONT.sizes.sm,
          flex: 1,
        }}
      >
        {cfg.label}
      </Text>
      {countdown && (
        <Text
          style={{
            color: `${cfg.color}99`,
            fontFamily: FONT_FAMILY.medium,
            fontSize: FONT.sizes.xs,
          }}
        >
          {countdown}
        </Text>
      )}
    </View>
  );
}

// ── Video card (open phase) ────────────────────────────────────────────────

function SubmissionCard({
  video,
  rank,
  isQualified,
  onPress,
}: {
  video: VideoWithStats;
  rank: number;
  isQualified: boolean;
  onPress: () => void;
}) {
  const { data: likeCount } = useLikeCount(video.id);
  const { data: hasLiked } = useHasLiked(video.id);
  const toggleLike = useToggleLike(video.id);

  return (
    <Pressable
      onPress={onPress}
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        backgroundColor: isQualified ? `${PALETTE.sarcelle}10` : "rgba(255,255,255,0.04)",
        borderRadius: RADIUS.lg,
        borderWidth: 1,
        borderColor: isQualified ? `${PALETTE.sarcelle}30` : "rgba(255,255,255,0.08)",
        padding: 12,
        marginBottom: 10,
      }}
    >
      {/* Rank */}
      <View style={{ width: 28, alignItems: "center" }}>
        <Text
          style={{
            color: rank <= 2 ? PALETTE.jaune : "rgba(255,255,255,0.3)",
            fontFamily: FONT_FAMILY.extrabold,
            fontSize: rank <= 2 ? FONT.sizes.lg : FONT.sizes.base,
          }}
        >
          #{rank + 1}
        </Text>
      </View>

      {/* Thumbnail */}
      <View
        style={{
          width: 56,
          height: 80,
          borderRadius: RADIUS.md,
          overflow: "hidden",
          backgroundColor: "rgba(255,255,255,0.06)",
        }}
      >
        {video.thumbnail_url ? (
          <Image source={{ uri: video.thumbnail_url }} style={{ flex: 1 }} contentFit="cover" />
        ) : (
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
            <Ionicons name="videocam" size={18} color="rgba(255,255,255,0.3)" />
          </View>
        )}
        <View
          style={{
            position: "absolute",
            inset: 0,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <View
            style={{
              backgroundColor: "rgba(0,0,0,0.4)",
              width: 28,
              height: 28,
              borderRadius: 14,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name="play" size={12} color="#fff" />
          </View>
        </View>
      </View>

      {/* Info */}
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 }}>
          <Avatar url={video.submitter.avatar_url} username={video.submitter.username} size={18} />
          <Text
            style={{
              color: "rgba(255,255,255,0.7)",
              fontFamily: FONT_FAMILY.semibold,
              fontSize: FONT.sizes.sm,
            }}
            numberOfLines={1}
          >
            {video.submitter.username}
          </Text>
          {isQualified && (
            <View
              style={{
                backgroundColor: `${PALETTE.sarcelle}25`,
                borderRadius: RADIUS.full,
                paddingHorizontal: 6,
                paddingVertical: 2,
              }}
            >
              <Text style={{ color: PALETTE.sarcelle, fontFamily: FONT_FAMILY.bold, fontSize: 9 }}>
                QUALIFIÉ
              </Text>
            </View>
          )}
        </View>
        {video.title && (
          <Text
            style={{
              color: "rgba(255,255,255,0.4)",
              fontFamily: FONT_FAMILY.regular,
              fontSize: FONT.sizes.xs,
            }}
            numberOfLines={1}
          >
            {video.title}
          </Text>
        )}
      </View>

      {/* Like */}
      <AnimatedPressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          toggleLike.mutate();
        }}
        style={{ alignItems: "center", gap: 2 }}
      >
        <Ionicons
          name={hasLiked ? "heart" : "heart-outline"}
          size={22}
          color={hasLiked ? PALETTE.fuchsia : "rgba(255,255,255,0.35)"}
        />
        <Text
          style={{
            color: hasLiked ? PALETTE.fuchsia : "rgba(255,255,255,0.35)",
            fontFamily: FONT_FAMILY.semibold,
            fontSize: 11,
          }}
        >
          {likeCount ?? 0}
        </Text>
      </AnimatedPressable>
    </Pressable>
  );
}

// ── Battle match card ──────────────────────────────────────────────────────

function MatchCard({
  match,
  onVote,
  isVoting,
}: {
  match: MatchWithVideos;
  onVote: (matchId: string, videoId: string) => void;
  isVoting: boolean;
}) {
  const router = useRouter();
  const totalVotes = match.votes_a + match.votes_b;
  const pctA = totalVotes > 0 ? Math.round((match.votes_a / totalVotes) * 100) : 50;
  const pctB = 100 - pctA;
  const isEnded = !!match.winner_video_id;

  const renderSide = (
    video: VideoWithStats | null,
    votes: number,
    pct: number,
    videoId: string | null,
    isWinner: boolean,
  ) => {
    if (!video || !videoId) {
      return (
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(255,255,255,0.03)",
            borderRadius: RADIUS.lg,
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.06)",
            alignItems: "center",
            justifyContent: "center",
            minHeight: 160,
          }}
        >
          <Text style={{ color: "rgba(255,255,255,0.2)", fontFamily: FONT_FAMILY.medium }}>BYE</Text>
        </View>
      );
    }

    const hasVoted = match.my_vote === videoId;
    const canVote = !isEnded && !match.my_vote;

    return (
      <View style={{ flex: 1 }}>
        <Pressable
          onPress={() =>
            router.push({
              pathname: "/video",
              params: {
                url: video.source_url ?? "",
                thumbnail: video.thumbnail_url ?? "",
              },
            })
          }
          style={{
            borderRadius: RADIUS.lg,
            overflow: "hidden",
            backgroundColor: "rgba(255,255,255,0.05)",
            marginBottom: 8,
            borderWidth: isWinner ? 2 : hasVoted ? 1.5 : 1,
            borderColor: isWinner
              ? PALETTE.jaune
              : hasVoted
                ? PALETTE.fuchsia
                : "rgba(255,255,255,0.08)",
          }}
        >
          {/* Thumbnail */}
          <View style={{ width: "100%", aspectRatio: 9 / 16 }}>
            {video.thumbnail_url ? (
              <Image source={{ uri: video.thumbnail_url }} style={{ flex: 1 }} contentFit="cover" />
            ) : (
              <View style={{ flex: 1, backgroundColor: "rgba(255,255,255,0.06)", alignItems: "center", justifyContent: "center" }}>
                <Ionicons name="videocam" size={28} color="rgba(255,255,255,0.2)" />
              </View>
            )}
            <View style={{ position: "absolute", inset: 0, alignItems: "center", justifyContent: "center" }}>
              <View
                style={{
                  backgroundColor: "rgba(0,0,0,0.35)",
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons name="play" size={20} color="#fff" />
              </View>
            </View>
            {isWinner && (
              <View style={{ position: "absolute", top: 8, right: 8 }}>
                <Ionicons name="trophy" size={22} color={PALETTE.jaune} />
              </View>
            )}
          </View>

          {/* Author */}
          <View style={{ padding: 8, flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Avatar url={video.submitter.avatar_url} username={video.submitter.username} size={20} />
            <Text
              style={{ color: "#fff", fontFamily: FONT_FAMILY.semibold, fontSize: FONT.sizes.sm, flex: 1 }}
              numberOfLines={1}
            >
              {video.submitter.username}
            </Text>
          </View>
        </Pressable>

        {/* Vote bar */}
        {(isEnded || match.my_vote) ? (
          <View>
            <View
              style={{
                height: 6,
                backgroundColor: "rgba(255,255,255,0.08)",
                borderRadius: 3,
                overflow: "hidden",
                marginBottom: 4,
              }}
            >
              <View
                style={{
                  height: "100%",
                  width: `${pct}%`,
                  backgroundColor: isWinner ? PALETTE.jaune : PALETTE.sarcelle,
                  borderRadius: 3,
                }}
              />
            </View>
            <Text
              style={{
                color: isWinner ? PALETTE.jaune : "rgba(255,255,255,0.5)",
                fontFamily: FONT_FAMILY.bold,
                fontSize: FONT.sizes.sm,
                textAlign: "center",
              }}
            >
              {pct}% ({votes})
            </Text>
          </View>
        ) : canVote ? (
          <AnimatedPressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              onVote(match.id, videoId);
            }}
            disabled={isVoting}
            style={{ overflow: "hidden", borderRadius: RADIUS.md }}
          >
            <LinearGradient
              colors={[PALETTE.fuchsia, PALETTE.sarcelle]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{
                paddingVertical: 10,
                alignItems: "center",
                opacity: isVoting ? 0.6 : 1,
              }}
            >
              <Text style={{ color: "#fff", fontFamily: FONT_FAMILY.bold, fontSize: FONT.sizes.sm }}>
                Voter
              </Text>
            </LinearGradient>
          </AnimatedPressable>
        ) : null}
      </View>
    );
  };

  return (
    <View
      style={{
        backgroundColor: "rgba(255,255,255,0.04)",
        borderRadius: RADIUS.xl,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.08)",
        padding: 14,
        marginBottom: 16,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "stretch", gap: 10 }}>
        {renderSide(
          match.video_a,
          match.votes_a,
          pctA,
          match.video_a_id,
          match.winner_video_id === match.video_a_id,
        )}

        {/* VS */}
        <View style={{ alignItems: "center", justifyContent: "center", paddingHorizontal: 2 }}>
          <View
            style={{
              backgroundColor: "rgba(255,255,255,0.08)",
              borderRadius: RADIUS.full,
              width: 32,
              height: 32,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ color: "rgba(255,255,255,0.4)", fontFamily: FONT_FAMILY.extrabold, fontSize: 10 }}>
              VS
            </Text>
          </View>
        </View>

        {renderSide(
          match.video_b,
          match.votes_b,
          pctB,
          match.video_b_id,
          match.winner_video_id === match.video_b_id,
        )}
      </View>
    </View>
  );
}

// ── Main screen ─────────────────────────────────────────────────────────────

export default function ChallengeScreen() {
  const { id, groupId } = useLocalSearchParams<{ id: string; groupId: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);

  const { data: challenge, isPending: challengePending } = useChallenge(id ?? null);
  const { data: myGroups } = useMyGroups();

  const myRole = myGroups?.find((g) => g.id === groupId)?.role ?? null;
  const isAdmin = myRole === "owner" || myRole === "admin";

  // ── Submission phase data
  const { data: allVideosRaw } = useChallengeVideos(id!);
  const allVideos = allVideosRaw as import("@/src/features/groups/useChallengeVideos").ChallengeVideo[] | undefined;
  const videoCount = allVideos?.length ?? 0;
  const { data: qualifyingVideos } = useQualifyingVideos(
    id ?? null,
    (challenge?.bracket_size as 4 | 8) ?? 8,
  );

  // ── Battle phase data
  const currentRound = challenge?.current_round ?? 0;
  const { data: matches, isPending: matchesPending } = useBracketMatches(
    challenge?.status === "battle" ? (id ?? null) : null,
    currentRound,
  );

  const voteMut = useBracketVote(id ?? "");
  const startBattleMut = useStartBattle(id ?? "", groupId ?? "");
  const advanceMut = useAdvanceBracketRound(id ?? "", groupId ?? "");

  const handleVote = useCallback(
    (matchId: string, videoId: string) => {
      voteMut.mutate({ matchId, videoId, round: currentRound });
    },
    [voteMut, currentRound],
  );

  const handleStartBattle = (size: 4 | 8) => {
    Alert.alert(
      `Lancer le Battle (top ${size})`,
      `Les ${size} vidéos les mieux likées passent en bracket. Impossible d'annuler.`,
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Lancer",
          style: "destructive",
          onPress: () => startBattleMut.mutate(size),
        },
      ],
    );
  };

  const handleAdvance = () => {
    const bracketSize = challenge?.bracket_size ?? 8;
    const totalRounds = Math.log2(bracketSize);
    const label =
      currentRound >= totalRounds ? "Terminer le défi" : "Passer au round suivant";

    Alert.alert(
      label,
      "Cela va résoudre les matchs en cours selon les votes et préparer le prochain round.",
      [
        { text: "Annuler", style: "cancel" },
        { text: "Confirmer", onPress: () => advanceMut.mutate() },
      ],
    );
  };

  if (challengePending) {
    return (
      <View style={{ flex: 1, backgroundColor: "#080F0F", alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color={PALETTE.sarcelle} />
      </View>
    );
  }

  if (!challenge) {
    return (
      <View style={{ flex: 1, backgroundColor: "#080F0F", alignItems: "center", justifyContent: "center" }}>
        <Text style={{ color: "rgba(255,255,255,0.4)", fontFamily: FONT_FAMILY.medium }}>
          Défi introuvable
        </Text>
      </View>
    );
  }

  const status = challenge.status;
  const bracketSize = challenge.bracket_size as 4 | 8;
  const totalRounds = Math.log2(bracketSize);
  const allMatchesDone = matches?.every((m) => !!m.winner_video_id) ?? false;

  // Find final winner (last round, only 1 match)
  const finalWinner =
    status === "ended"
      ? (matches?.find((m) => m.round === totalRounds)?.winner_video ?? null)
      : null;

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={{ flex: 1, backgroundColor: "#080F0F" }}>
        <ScrollView
          contentContainerStyle={{ paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View
            style={{
              paddingTop: insets.top + 10,
              paddingHorizontal: 20,
              paddingBottom: 20,
              flexDirection: "row",
              alignItems: "center",
              gap: 14,
            }}
          >
            <Pressable
              onPress={() => router.back()}
              style={{
                width: 42,
                height: 42,
                borderRadius: 21,
                backgroundColor: "rgba(255,255,255,0.06)",
                alignItems: "center",
                justifyContent: "center",
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.1)",
              }}
            >
              <Ionicons name="arrow-back" size={20} color="#FFF" />
            </Pressable>

            <View style={{ flex: 1 }}>
              <Text
                style={{
                  color: "#FFF",
                  fontFamily: FONT_FAMILY.extrabold,
                  fontSize: FONT.sizes["2xl"],
                }}
                numberOfLines={1}
              >
                {challenge.title}
              </Text>
              {challenge.description && (
                <Text
                  style={{
                    color: "rgba(255,255,255,0.4)",
                    fontFamily: FONT_FAMILY.regular,
                    fontSize: FONT.sizes.sm,
                  }}
                  numberOfLines={1}
                >
                  {challenge.description}
                </Text>
              )}
            </View>
          </View>

          {/* Phase banner */}
          <PhaseBanner
            status={status}
            submissionEnd={challenge.submission_end}
            roundEnd={challenge.round_end}
          />

          {/* ── Prize & Rules ── */}
          {(challenge.prize || challenge.rules) && (
            <View
              style={{
                marginHorizontal: 20,
                marginBottom: 20,
                gap: 10,
              }}
            >
              {challenge.prize && (
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 10,
                    backgroundColor: `${PALETTE.jaune}12`,
                    borderRadius: RADIUS.lg,
                    paddingHorizontal: 14,
                    paddingVertical: 10,
                    borderWidth: 1,
                    borderColor: `${PALETTE.jaune}25`,
                  }}
                >
                  <Ionicons name="trophy" size={16} color={PALETTE.jaune} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: `${PALETTE.jaune}99`, fontFamily: FONT_FAMILY.bold, fontSize: 10, textTransform: "uppercase", letterSpacing: 1, marginBottom: 2 }}>
                      Récompense
                    </Text>
                    <Text style={{ color: "#fff", fontFamily: FONT_FAMILY.semibold, fontSize: FONT.sizes.sm }}>
                      {challenge.prize}
                    </Text>
                  </View>
                </View>
              )}
              {challenge.rules && (
                <View
                  style={{
                    backgroundColor: "rgba(255,255,255,0.04)",
                    borderRadius: RADIUS.lg,
                    paddingHorizontal: 14,
                    paddingVertical: 10,
                    borderWidth: 1,
                    borderColor: "rgba(255,255,255,0.08)",
                  }}
                >
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    <Ionicons name="document-text-outline" size={14} color="rgba(255,255,255,0.4)" />
                    <Text style={{ color: "rgba(255,255,255,0.4)", fontFamily: FONT_FAMILY.bold, fontSize: 10, textTransform: "uppercase", letterSpacing: 1 }}>
                      Règles
                    </Text>
                  </View>
                  <Text style={{ color: "rgba(255,255,255,0.7)", fontFamily: FONT_FAMILY.regular, fontSize: FONT.sizes.sm, lineHeight: 20 }}>
                    {challenge.rules}
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* ── ENDED: podium ── */}
          {status === "ended" && finalWinner && (
            <View style={{ paddingHorizontal: 20, marginBottom: 32, alignItems: "center" }}>
              <Ionicons name="trophy" size={48} color={PALETTE.jaune} style={{ marginBottom: 12 }} />
              <Text
                style={{
                  color: PALETTE.jaune,
                  fontFamily: FONT_FAMILY.extrabold,
                  fontSize: FONT.sizes["3xl"],
                  marginBottom: 4,
                }}
              >
                Vainqueur !
              </Text>
              <Text
                style={{
                  color: "rgba(255,255,255,0.6)",
                  fontFamily: FONT_FAMILY.medium,
                  fontSize: FONT.sizes.base,
                  marginBottom: 20,
                }}
              >
                {finalWinner.submitter.username}
              </Text>
              {finalWinner.thumbnail_url && (
                <Pressable
                  onPress={() =>
                    router.push({
                      pathname: "/video",
                      params: {
                        url: finalWinner.source_url ?? "",
                        thumbnail: finalWinner.thumbnail_url ?? "",
                      },
                    })
                  }
                  style={{
                    width: "60%",
                    aspectRatio: 9 / 16,
                    borderRadius: RADIUS.xl,
                    overflow: "hidden",
                    borderWidth: 2,
                    borderColor: PALETTE.jaune,
                  }}
                >
                  <Image source={{ uri: finalWinner.thumbnail_url }} style={{ flex: 1 }} contentFit="cover" />
                  <View style={{ position: "absolute", inset: 0, alignItems: "center", justifyContent: "center" }}>
                    <View
                      style={{
                        backgroundColor: "rgba(0,0,0,0.4)",
                        width: 52,
                        height: 52,
                        borderRadius: 26,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Ionicons name="play" size={24} color="#fff" />
                    </View>
                  </View>
                </Pressable>
              )}
            </View>
          )}

          {/* ── BATTLE: bracket ── */}
          {status === "battle" && (
            <View style={{ paddingHorizontal: 16 }}>
              <Text
                style={{
                  color: "#fff",
                  fontFamily: FONT_FAMILY.extrabold,
                  fontSize: FONT.sizes.xl,
                  marginBottom: 4,
                  marginLeft: 4,
                }}
              >
                {roundLabel(currentRound, bracketSize)}
              </Text>
              <Text
                style={{
                  color: "rgba(255,255,255,0.35)",
                  fontFamily: FONT_FAMILY.medium,
                  fontSize: FONT.sizes.xs,
                  marginBottom: 16,
                  marginLeft: 4,
                }}
              >
                1 vote par match • {formatCountdown(challenge.round_end)}
              </Text>

              {matchesPending ? (
                <ActivityIndicator color={PALETTE.sarcelle} style={{ paddingVertical: 40 }} />
              ) : (matches ?? []).length === 0 ? (
                <EmptyState icon="flash-outline" title="Aucun match" subtitle="Le bracket est en cours de génération" />
              ) : (
                (matches ?? []).map((match) => (
                  <MatchCard
                    key={match.id}
                    match={match}
                    onVote={handleVote}
                    isVoting={voteMut.isPending}
                  />
                ))
              )}

              {/* Admin: advance round */}
              {isAdmin && allMatchesDone && (
                <AnimatedPressable
                  onPress={handleAdvance}
                  disabled={advanceMut.isPending}
                  style={{ overflow: "hidden", borderRadius: RADIUS.lg, marginTop: 8 }}
                >
                  <LinearGradient
                    colors={[PALETTE.fuchsia, PALETTE.sarcelle]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{
                      paddingVertical: 16,
                      alignItems: "center",
                      flexDirection: "row",
                      justifyContent: "center",
                      gap: 8,
                    }}
                  >
                    {advanceMut.isPending ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <>
                        <Ionicons name="arrow-forward-circle" size={20} color="#fff" />
                        <Text style={{ color: "#fff", fontFamily: FONT_FAMILY.bold, fontSize: FONT.sizes.base }}>
                          {currentRound >= totalRounds
                            ? "Terminer le défi"
                            : `Passer au ${roundLabel(currentRound + 1, bracketSize)}`}
                        </Text>
                      </>
                    )}
                  </LinearGradient>
                </AnimatedPressable>
              )}
            </View>
          )}

          {/* ── QUALIFYING: top videos + admin can start battle ── */}
          {status === "qualifying" && (
            <View style={{ paddingHorizontal: 20 }}>
              <Text
                style={{
                  color: "#fff",
                  fontFamily: FONT_FAMILY.bold,
                  fontSize: FONT.sizes.xl,
                  marginBottom: 4,
                }}
              >
                Classement des soumissions
              </Text>
              <Text
                style={{
                  color: "rgba(255,255,255,0.35)",
                  fontFamily: FONT_FAMILY.regular,
                  fontSize: FONT.sizes.sm,
                  marginBottom: 16,
                }}
              >
                {videoCount} vidéo{videoCount !== 1 ? "s" : ""} soumises
              </Text>

              {(qualifyingVideos ?? []).map((v, i) => (
                <SubmissionCard
                  key={v.id}
                  video={v}
                  rank={i}
                  isQualified={true}
                  onPress={() =>
                    router.push({
                      pathname: "/video",
                      params: {
                        url: v.source_url ?? "",
                        thumbnail: v.thumbnail_url ?? "",
                      },
                    })
                  }
                />
              ))}

              {isAdmin && (
                <View style={{ gap: 10, marginTop: 24 }}>
                  <Text
                    style={{
                      color: "rgba(255,255,255,0.4)",
                      fontFamily: FONT_FAMILY.semibold,
                      fontSize: FONT.sizes.xs,
                      textTransform: "uppercase",
                      letterSpacing: 1.2,
                      marginBottom: 4,
                    }}
                  >
                    Admin — Lancer le Battle
                  </Text>
                  {([4, 8] as const).map((size) => (
                    <AnimatedPressable
                      key={size}
                      onPress={() => handleStartBattle(size)}
                      disabled={startBattleMut.isPending || videoCount < 2}
                      style={{
                        backgroundColor: "rgba(255,255,255,0.06)",
                        borderRadius: RADIUS.lg,
                        paddingVertical: 14,
                        paddingHorizontal: 20,
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 10,
                        borderWidth: 1,
                        borderColor: "rgba(255,255,255,0.1)",
                        opacity: videoCount < 2 ? 0.4 : 1,
                      }}
                    >
                      <Ionicons name="flash" size={18} color={PALETTE.fuchsia} />
                      <Text style={{ color: "#fff", fontFamily: FONT_FAMILY.semibold, fontSize: FONT.sizes.base }}>
                        Top {size} en Battle
                      </Text>
                    </AnimatedPressable>
                  ))}
                </View>
              )}
            </View>
          )}

          {/* ── OPEN: submissions list ── */}
          {(status === "open" || status === "ended") && status !== "ended" && (
            <View style={{ paddingHorizontal: 20 }}>
              {/* Submit CTA */}
              <AnimatedPressable
                onPress={() =>
                  router.push({
                    pathname: "/camera" as any,
                    params: { groupId: groupId ?? "", challengeId: id ?? "" },
                  })
                }
                style={{ borderRadius: RADIUS.xl, overflow: "hidden", marginBottom: 20 }}
              >
                <LinearGradient
                  colors={[PALETTE.fuchsia, "#C0007A"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, paddingVertical: 16 }}
                >
                  <Ionicons name="videocam" size={20} color="#FFF" />
                  <Text style={{ color: "#FFF", fontFamily: FONT_FAMILY.bold, fontSize: FONT.sizes.lg }}>
                    Soumettre ma vidéo
                  </Text>
                </LinearGradient>
              </AnimatedPressable>

              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 16,
                }}
              >
                <Text style={{ color: "#fff", fontFamily: FONT_FAMILY.bold, fontSize: FONT.sizes.xl }}>
                  Soumissions
                </Text>
                <Text style={{ color: "rgba(255,255,255,0.35)", fontFamily: FONT_FAMILY.medium, fontSize: FONT.sizes.sm }}>
                  {videoCount} vidéo{videoCount !== 1 ? "s" : ""}
                </Text>
              </View>

              {videoCount === 0 ? (
                <EmptyState
                  icon="videocam-outline"
                  title="Aucune soumission encore"
                  subtitle="Sois le premier à participer !"
                />
              ) : (
                (qualifyingVideos ?? []).map((v, i) => (
                  <SubmissionCard
                    key={v.id}
                    video={v}
                    rank={i}
                    isQualified={false}
                    onPress={() =>
                      router.push({
                        pathname: "/video",
                        params: {
                          url: v.source_url ?? "",
                          thumbnail: v.thumbnail_url ?? "",
                        },
                      })
                    }
                  />
                ))
              )}

              {/* Admin: move to qualifying */}
              {isAdmin && videoCount > 0 && (
                <View style={{ marginTop: 24 }}>
                  <Text
                    style={{
                      color: "rgba(255,255,255,0.4)",
                      fontFamily: FONT_FAMILY.semibold,
                      fontSize: FONT.sizes.xs,
                      textTransform: "uppercase",
                      letterSpacing: 1.2,
                      marginBottom: 8,
                    }}
                  >
                    Admin — Fermer les soumissions
                  </Text>
                  <AdminStatusButton
                    label="Passer en qualification"
                    icon="podium"
                    challengeId={id!}
                    groupId={groupId!}
                    newStatus="qualifying"
                  />
                </View>
              )}
            </View>
          )}
        </ScrollView>
      </View>
    </>
  );
}

function AdminStatusButton({
  label,
  icon,
  challengeId,
  groupId,
  newStatus,
}: {
  label: string;
  icon: string;
  challengeId: string;
  groupId: string;
  newStatus: "open" | "qualifying" | "battle" | "ended";
}) {
  const queryClient = useQueryClient();
  const mut = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("challenges")
        .update({ status: newStatus } as any)
        .eq("id", challengeId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["challenge", challengeId] });
      queryClient.invalidateQueries({ queryKey: ["group-challenges", groupId] });
    },
  });

  return (
    <AnimatedPressable
      onPress={() => {
        Alert.alert(label, "Confirmer ?", [
          { text: "Annuler", style: "cancel" },
          { text: "Confirmer", onPress: () => mut.mutate() },
        ]);
      }}
      disabled={mut.isPending}
      style={{
        backgroundColor: "rgba(255,255,255,0.06)",
        borderRadius: RADIUS.lg,
        paddingVertical: 14,
        paddingHorizontal: 20,
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.1)",
      }}
    >
      {mut.isPending ? (
        <ActivityIndicator size="small" color={PALETTE.sarcelle} />
      ) : (
        <Ionicons name={icon as any} size={18} color={PALETTE.sarcelle} />
      )}
      <Text style={{ color: "#fff", fontFamily: FONT_FAMILY.semibold, fontSize: FONT.sizes.base }}>
        {label}
      </Text>
    </AnimatedPressable>
  );
}
