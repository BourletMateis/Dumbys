import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/src/lib/supabase";
import { useAuthStore } from "@/src/store/useAuthStore";

export type CategoryVideo = {
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
  group: {
    id: string;
    name: string;
  };
};

/**
 * Fetch all videos from public groups in a given category.
 * Used for the TikTok-style category feed.
 */
export function useCategoryFeed(category: string) {
  const user = useAuthStore((s) => s.user);

  return useQuery<CategoryVideo[]>({
    queryKey: ["category-feed", category],
    queryFn: async () => {
      // 1. Get all public groups in this category
      let groupQuery = supabase
        .from("groups")
        .select("id, name")
        .eq("is_public", true);

      if (category === "other") {
        // "Other" includes groups with no category or category = "other"
        groupQuery = groupQuery.or("category.is.null,category.eq.other");
      } else {
        groupQuery = groupQuery.eq("category", category);
      }

      const { data: groups, error: grpErr } = await groupQuery;

      if (grpErr) throw grpErr;
      if (!groups || groups.length === 0) return [];

      const groupIds = groups.map((g) => g.id);
      const groupMap = new Map(groups.map((g) => [g.id, g]));

      // 2. Get ALL videos from these groups (recent first)
      const { data: videos, error: vidErr } = await supabase
        .from("videos")
        .select("id, source_url, video_path, thumbnail_url, title, description, week_number, year, created_at, submitter_id, group_id")
        .in("group_id", groupIds)
        .order("created_at", { ascending: false })
        .limit(200);

      if (vidErr) throw vidErr;
      if (!videos || videos.length === 0) return [];

      // 3. Enrich with user data
      const userIds = [...new Set(videos.map((v) => v.submitter_id))];
      const { data: users, error: usrErr } = await supabase
        .from("users")
        .select("id, username, avatar_url")
        .in("id", userIds);

      if (usrErr) throw usrErr;

      const userMap = new Map((users ?? []).map((u) => [u.id, u]));

      return videos
        .map((v) => {
          const submitter = userMap.get(v.submitter_id);
          const group = v.group_id ? groupMap.get(v.group_id) : null;
          if (!submitter || !group) return null;
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
            group,
          };
        })
        .filter((v): v is CategoryVideo => v !== null);
    },
    enabled: !!user && !!category,
  });
}
