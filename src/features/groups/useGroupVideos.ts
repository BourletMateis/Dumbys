import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/src/lib/supabase";
import { useAuthStore } from "@/src/store/useAuthStore";

export type GroupVideo = {
  id: string;
  source_url: string | null;
  video_path: string | null;
  thumbnail_url: string | null;
  title: string | null;
  description: string | null;
  week_number: number;
  year: number;
  created_at: string;
  submitter: {
    id: string;
    username: string;
    avatar_url: string | null;
  };
};

export function useGroupVideos(groupId: string, weekNumber: number, year: number) {
  const user = useAuthStore((s) => s.user);

  return useQuery<GroupVideo[]>({
    queryKey: ["group-videos", groupId, weekNumber, year],
    queryFn: async () => {
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("videos")
        .select("id, source_url, video_path, thumbnail_url, title, description, week_number, year, created_at, submitter_id")
        .eq("group_id", groupId)
        .eq("week_number", weekNumber)
        .eq("year", year)
        .order("created_at", { ascending: false });

      if (error) throw error;
      if (!data || data.length === 0) return [];

      // Enrich with user data
      const userIds = [...new Set(data.map((v) => v.submitter_id))];
      const { data: users, error: usersError } = await supabase
        .from("users")
        .select("id, username, avatar_url")
        .in("id", userIds);

      if (usersError) throw usersError;

      const usersMap = new Map((users ?? []).map((u) => [u.id, u]));

      return data
        .map((v) => {
          const submitter = usersMap.get(v.submitter_id);
          if (!submitter) return null;
          return {
            id: v.id,
            source_url: v.source_url,
            video_path: v.video_path,
            thumbnail_url: v.thumbnail_url,
            title: v.title,
            description: v.description,
            week_number: v.week_number!,
            year: v.year!,
            created_at: v.created_at,
            submitter,
          };
        })
        .filter((v): v is GroupVideo => v !== null);
    },
    enabled: !!user && !!groupId,
  });
}
