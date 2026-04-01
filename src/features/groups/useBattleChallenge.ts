import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/src/lib/supabase";
import { useAuthStore } from "@/src/store/useAuthStore";
import type { BracketMatch, BracketVote } from "@/src/types/database.types";

// ── Types ─────────────────────────────────────────────────────────────────

export interface VideoWithStats {
  id: string;
  video_path: string | null;
  source_url: string | null;
  thumbnail_url: string | null;
  title: string | null;
  submitter: {
    id: string;
    username: string;
    avatar_url: string | null;
  };
  like_count: number;
}

export interface MatchWithVideos extends BracketMatch {
  video_a: VideoWithStats | null;
  video_b: VideoWithStats | null;
  winner_video: VideoWithStats | null;
  votes_a: number;
  votes_b: number;
  my_vote: string | null; // video_id the current user voted for
}

// ── Hooks ─────────────────────────────────────────────────────────────────

// Get all matches for the current round of a challenge
export function useBracketMatches(challengeId: string | null, round: number) {
  const user = useAuthStore((s) => s.user);

  return useQuery<MatchWithVideos[]>({
    queryKey: ["bracket-matches", challengeId, round],
    queryFn: async () => {
      if (!challengeId) return [];

      // 1. Fetch matches
      const { data: matchesRaw, error: matchErr } = await supabase
        .from("challenge_bracket_matches")
        .select("id, challenge_id, round, match_index, video_a_id, video_b_id, winner_video_id, created_at")
        .eq("challenge_id", challengeId)
        .eq("round", round)
        .order("match_index");
      const matches = matchesRaw as BracketMatch[] | null;

      if (matchErr) throw matchErr;
      if (!matches?.length) return [];

      const matchIds = matches.map((m) => m.id);
      const videoIds = [
        ...new Set(
          matches.flatMap((m) =>
            [m.video_a_id, m.video_b_id].filter(Boolean),
          ) as string[],
        ),
      ];

      // 2. Fetch videos + submitter + like counts in parallel
      const [videosResult, votesResult, myVotesResult] = await Promise.all([
        videoIds.length
          ? supabase
              .from("videos")
              .select(
                "id, video_path, source_url, thumbnail_url, title, submitter:users!submitter_id(id, username, avatar_url)",
              )
              .in("id", videoIds)
          : Promise.resolve({ data: [], error: null }),
        supabase
          .from("challenge_bracket_votes")
          .select("match_id, video_id")
          .in("match_id", matchIds)
          .then((r) => ({ ...r, data: r.data as { match_id: string; video_id: string }[] | null })),
        user
          ? supabase
              .from("challenge_bracket_votes")
              .select("match_id, video_id")
              .in("match_id", matchIds)
              .eq("voter_id", user.id)
              .then((r) => ({ ...r, data: r.data as { match_id: string; video_id: string }[] | null }))
          : Promise.resolve({ data: [] as { match_id: string; video_id: string }[], error: null }),
      ]);

      if (videosResult.error) throw videosResult.error;
      if (votesResult.error) throw votesResult.error;

      const videoMap = new Map<string, VideoWithStats>();
      for (const v of (videosResult.data ?? []) as any[]) {
        const sub = Array.isArray(v.submitter) ? v.submitter[0] : v.submitter;
        videoMap.set(v.id, {
          id: v.id,
          video_path: v.video_path,
          source_url: v.source_url,
          thumbnail_url: v.thumbnail_url,
          title: v.title,
          submitter: sub as VideoWithStats["submitter"],
          like_count: 0,
        });
      }

      // Build vote counts per match
      const voteCounts = new Map<string, Record<string, number>>();
      for (const vote of votesResult.data ?? []) {
        if (!voteCounts.has(vote.match_id)) voteCounts.set(vote.match_id, {});
        const m = voteCounts.get(vote.match_id)!;
        m[vote.video_id] = (m[vote.video_id] ?? 0) + 1;
      }

      // My votes
      const myVoteMap = new Map<string, string>();
      for (const vote of myVotesResult.data ?? []) {
        myVoteMap.set(vote.match_id, vote.video_id);
      }

      return matches.map((m): MatchWithVideos => {
        const counts = voteCounts.get(m.id) ?? {};
        return {
          ...m,
          video_a: m.video_a_id ? (videoMap.get(m.video_a_id) ?? null) : null,
          video_b: m.video_b_id ? (videoMap.get(m.video_b_id) ?? null) : null,
          winner_video: m.winner_video_id
            ? (videoMap.get(m.winner_video_id) ?? null)
            : null,
          votes_a: m.video_a_id ? (counts[m.video_a_id] ?? 0) : 0,
          votes_b: m.video_b_id ? (counts[m.video_b_id] ?? 0) : 0,
          my_vote: myVoteMap.get(m.id) ?? null,
        };
      });
    },
    enabled: !!challengeId && round > 0,
    refetchInterval: 30_000, // auto-refresh every 30s
  });
}

// Vote in a match
export function useBracketVote(challengeId: string) {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);

  return useMutation({
    mutationFn: async ({
      matchId,
      videoId,
      round,
    }: {
      matchId: string;
      videoId: string;
      round: number;
    }) => {
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase.from("challenge_bracket_votes").insert({
        challenge_id: challengeId,
        match_id: matchId,
        voter_id: user.id,
        video_id: videoId,
      });

      if (error) throw error;
      return { matchId, videoId, round };
    },
    onSuccess: ({ round }) => {
      queryClient.invalidateQueries({
        queryKey: ["bracket-matches", challengeId, round],
      });
    },
  });
}

// Admin: launch battle from qualifying phase
export function useStartBattle(challengeId: string, groupId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (bracketSize: 4 | 8) => {
      const { error } = await (supabase as any).rpc("start_challenge_battle", {
        p_challenge_id: challengeId,
        p_bracket_size: bracketSize,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["challenge", challengeId] });
      queryClient.invalidateQueries({
        queryKey: ["group-challenges", groupId],
      });
    },
  });
}

// Admin: advance to next round (resolves current round winners and seeds next)
export function useAdvanceBracketRound(challengeId: string, groupId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { error } = await (supabase as any).rpc("advance_bracket_round", {
        p_challenge_id: challengeId,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["challenge", challengeId] });
      queryClient.invalidateQueries({
        queryKey: ["group-challenges", groupId],
      });
      // Invalidate all bracket rounds
      queryClient.invalidateQueries({
        predicate: (q) =>
          q.queryKey[0] === "bracket-matches" && q.queryKey[1] === challengeId,
      });
    },
  });
}

// Get qualifying videos (sorted by likes) for the submission phase
export function useQualifyingVideos(
  challengeId: string | null,
  limit: 4 | 8 = 8,
) {
  return useQuery<VideoWithStats[]>({
    queryKey: ["challenge-qualifying", challengeId, limit],
    queryFn: async () => {
      if (!challengeId) return [];

      // Fetch all videos for the challenge
      const { data: videos, error } = await supabase
        .from("videos")
        .select(
          "id, video_path, source_url, thumbnail_url, title, submitter:users!submitter_id(id, username, avatar_url)",
        )
        .eq("challenge_id", challengeId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      if (!videos?.length) return [];

      const videoIds = (videos as any[]).map((v) => v.id as string);

      // Fetch like counts from reactions table
      const { data: likes } = await supabase
        .from("reactions")
        .select("video_id")
        .in("video_id", videoIds)
        .eq("emoji", "like");

      const likeCounts = new Map<string, number>();
      for (const l of likes ?? []) {
        likeCounts.set(l.video_id, (likeCounts.get(l.video_id) ?? 0) + 1);
      }

      const withCounts = (videos as any[]).map((v) => {
        const sub = Array.isArray(v.submitter) ? v.submitter[0] : v.submitter;
        return {
          id: v.id,
          video_path: v.video_path,
          source_url: v.source_url,
          thumbnail_url: v.thumbnail_url,
          title: v.title,
          submitter: sub as VideoWithStats["submitter"],
          like_count: likeCounts.get(v.id) ?? 0,
        } as VideoWithStats;
      });

      return withCounts.sort((a, b) => b.like_count - a.like_count).slice(0, limit);
    },
    enabled: !!challengeId,
  });
}
