import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/src/lib/supabase";

export type PodiumEntry = {
  id: string;
  rank: number;
  vote_count: number;
  video: {
    id: string;
    thumbnail_url: string | null;
    source_url: string | null;
  };
  user: {
    id: string;
    username: string;
    avatar_url: string | null;
  };
};

export function useWeeklyPodium(groupId: string, weekNumber: number, year: number) {
  return useQuery<PodiumEntry[]>({
    queryKey: ["weekly-podium", groupId, weekNumber, year],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("weekly_podium")
        .select("id, rank, vote_count, video_id, user_id")
        .eq("group_id", groupId)
        .eq("week_number", weekNumber)
        .eq("year", year)
        .order("rank", { ascending: true });

      if (error) throw error;
      if (!data || data.length === 0) return [];

      const videoIds = data.map((d) => d.video_id);
      const userIds = data.map((d) => d.user_id);

      const [videosRes, usersRes] = await Promise.all([
        supabase
          .from("videos")
          .select("id, thumbnail_url, source_url")
          .in("id", videoIds),
        supabase
          .from("users")
          .select("id, username, avatar_url")
          .in("id", userIds),
      ]);

      if (videosRes.error) throw videosRes.error;
      if (usersRes.error) throw usersRes.error;

      const videoMap = new Map((videosRes.data ?? []).map((v) => [v.id, v]));
      const userMap = new Map((usersRes.data ?? []).map((u) => [u.id, u]));

      return data
        .map((d) => {
          const video = videoMap.get(d.video_id);
          const user = userMap.get(d.user_id);
          if (!video || !user) return null;
          return {
            id: d.id,
            rank: d.rank,
            vote_count: d.vote_count,
            video,
            user,
          };
        })
        .filter((e): e is PodiumEntry => e !== null);
    },
    enabled: !!groupId,
  });
}
