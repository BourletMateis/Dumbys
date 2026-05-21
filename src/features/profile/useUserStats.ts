import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/src/lib/supabase";
import { useAuthStore } from "@/src/store/useAuthStore";

export type UserStats = {
  video_count: number;
  group_count: number;
  win_count: number;
};

/** Queries the user_stats view (migration 017) */
export function useUserStats() {
  const user = useAuthStore((s) => s.user);

  return useQuery<UserStats>({
    queryKey: ["user-stats", user?.id],
    queryFn: async () => {
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("user_stats")
        .select("video_count, group_count, win_count")
        .eq("user_id", user.id)
        .single();

      if (error) {
        // View may not exist in all envs — return zeros rather than crash
        console.warn("[useUserStats]", error.message);
        return { video_count: 0, group_count: 0, win_count: 0 };
      }

      return {
        video_count: Number(data.video_count ?? 0),
        group_count: Number(data.group_count ?? 0),
        win_count: Number(data.win_count ?? 0),
      };
    },
    enabled: !!user,
  });
}
