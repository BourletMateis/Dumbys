import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/src/lib/supabase";

/**
 * Subscribes to realtime INSERT events on the videos table for a specific group.
 * When a new video is inserted, it invalidates the React Query cache
 * so the video list refreshes instantly for all members.
 */
export function useRealtimeGroupVideos(
  groupId: string,
  weekNumber: number,
  year: number,
) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!groupId) return;

    const channel = supabase
      .channel(`group-videos-${groupId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "videos",
          filter: `group_id=eq.${groupId}`,
        },
        () => {
          queryClient.invalidateQueries({
            queryKey: ["group-videos", groupId, weekNumber, year],
          });
        },
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "videos",
          filter: `group_id=eq.${groupId}`,
        },
        () => {
          queryClient.invalidateQueries({
            queryKey: ["group-videos", groupId, weekNumber, year],
          });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [groupId, weekNumber, year, queryClient]);
}
