import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/src/lib/supabase";
import { useAuthStore } from "@/src/store/useAuthStore";

/**
 * Global realtime subscriptions.
 * Call this once at app root level.
 * Listens to: comments, reactions, groups, friendships, group_members.
 */
export function useRealtimeSubscriptions() {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("global-realtime")
      // ── Comments ──
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "comments" },
        (payload) => {
          const videoId =
            (payload.new as any)?.video_id ?? (payload.old as any)?.video_id;
          if (videoId) {
            queryClient.invalidateQueries({ queryKey: ["comments", videoId] });
            queryClient.invalidateQueries({
              queryKey: ["comment-count", videoId],
            });
          }
        },
      )
      // ── Reactions (likes) ──
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "reactions" },
        (payload) => {
          const videoId =
            (payload.new as any)?.video_id ?? (payload.old as any)?.video_id;
          if (videoId) {
            queryClient.invalidateQueries({ queryKey: ["likes", videoId] });
            queryClient.invalidateQueries({ queryKey: ["liked", videoId] });
          }
        },
      )
      // ── New public groups ──
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "groups" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["public-groups"] });
        },
      )
      // ── Group members (someone joined/left) ──
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "group_members" },
        (payload) => {
          const memberId =
            (payload.new as any)?.user_id ?? (payload.old as any)?.user_id;
          // Refresh own groups if it concerns us
          if (memberId === user.id) {
            queryClient.invalidateQueries({ queryKey: ["my-groups"] });
          }
          // Refresh public groups (member counts change)
          queryClient.invalidateQueries({ queryKey: ["public-groups"] });
          // Refresh group members list
          const groupId =
            (payload.new as any)?.group_id ?? (payload.old as any)?.group_id;
          if (groupId) {
            queryClient.invalidateQueries({
              queryKey: ["group-members", groupId],
            });
          }
        },
      )
      // ── Friendships ──
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "friendships" },
        (payload) => {
          const row = (payload.new ?? payload.old) as any;
          // Only refresh if it involves us
          if (
            row?.requester_id === user.id ||
            row?.addressee_id === user.id
          ) {
            queryClient.invalidateQueries({ queryKey: ["friendships"] });
          }
        },
      )
      // ── Follows ──
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "follows" },
        (payload) => {
          const row = (payload.new ?? payload.old) as any;
          if (row?.follower_id === user.id || row?.following_id === user.id) {
            queryClient.invalidateQueries({ queryKey: ["is-following"] });
            queryClient.invalidateQueries({ queryKey: ["follower-count"] });
            queryClient.invalidateQueries({ queryKey: ["following-count"] });
          }
        },
      )
      // ── Videos (nouveau post) ──
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "videos" },
        (payload) => {
          const row = (payload.new as any);
          if (row?.group_id) {
            queryClient.invalidateQueries({ queryKey: ["group-videos", row.group_id] });
          }
          if (row?.challenge_id) {
            queryClient.invalidateQueries({ queryKey: ["challenge-videos", row.challenge_id] });
          }
          if (row?.submitter_id === user.id) {
            queryClient.invalidateQueries({ queryKey: ["my-videos"] });
          }
        },
      )
      // ── Weekly votes ──
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "weekly_votes" },
        (payload) => {
          const row = (payload.new ?? payload.old) as any;
          if (row?.video_id) {
            queryClient.invalidateQueries({ queryKey: ["vote-counts", row.video_id] });
          }
          if (row?.voter_id === user.id) {
            queryClient.invalidateQueries({ queryKey: ["my-vote"] });
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]);
}
