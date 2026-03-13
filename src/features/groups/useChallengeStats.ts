import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/src/lib/supabase";
import { useAuthStore } from "@/src/store/useAuthStore";
import { useTimelineLogic } from "@/src/hooks/useTimelineLogic";

export type ChallengeStats = {
  group_id: string;
  video_count: number;
  latest_thumbnail: string | null;
};

/**
 * Fetch video stats for public groups this week:
 * - Number of videos posted
 * - Latest video thumbnail
 */
export function useChallengeStats(groupIds: string[]) {
  const user = useAuthStore((s) => s.user);
  const { weekNumber, year } = useTimelineLogic();

  return useQuery<Map<string, ChallengeStats>>({
    queryKey: ["challenge-stats", weekNumber, year, groupIds.sort().join(",")],
    queryFn: async () => {
      if (groupIds.length === 0) return new Map();

      const { data: videos, error } = await supabase
        .from("videos")
        .select("group_id, thumbnail_url, created_at")
        .in("group_id", groupIds)
        .eq("week_number", weekNumber)
        .eq("year", year)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const statsMap = new Map<string, ChallengeStats>();

      // Initialize all groups with 0
      for (const id of groupIds) {
        statsMap.set(id, { group_id: id, video_count: 0, latest_thumbnail: null });
      }

      for (const v of videos ?? []) {
        if (!v.group_id) continue;
        const existing = statsMap.get(v.group_id);
        if (existing) {
          existing.video_count++;
          if (!existing.latest_thumbnail && v.thumbnail_url) {
            existing.latest_thumbnail = v.thumbnail_url;
          }
        }
      }

      return statsMap;
    },
    enabled: !!user && groupIds.length > 0,
  });
}
