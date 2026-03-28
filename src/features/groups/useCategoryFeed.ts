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
 * Returns the set of category keys that have at least one video in a public group.
 */
export function useCategoriesWithVideos() {
  const user = useAuthStore((s) => s.user);

  return useQuery<Set<string>>({
    queryKey: ["categories-with-videos"],
    queryFn: async () => {
      // Get public groups with a category
      const { data: groups, error: grpErr } = await supabase
        .from("groups")
        .select("id, category")
        .eq("is_public", true)
        .not("category", "is", null);

      if (grpErr) throw grpErr;
      if (!groups || groups.length === 0) return new Set<string>();

      const groupIds = groups.map((g) => g.id);
      const groupCategoryMap = new Map(groups.map((g) => [g.id, g.category as string]));

      // Find which of those groups have at least one video
      const { data: videoGroups, error: vidErr } = await supabase
        .from("videos")
        .select("group_id")
        .in("group_id", groupIds);

      if (vidErr) throw vidErr;

      const result = new Set<string>();
      for (const v of videoGroups ?? []) {
        if (v.group_id) {
          const cat = groupCategoryMap.get(v.group_id);
          if (cat) result.add(cat);
        }
      }

      // Also include categories set directly on the video
      const { data: taggedVideos } = await supabase
        .from("videos")
        .select("category")
        .not("category", "is", null);

      for (const v of taggedVideos ?? []) {
        if (v.category) result.add(v.category);
      }

      return result;
    },
    enabled: !!user,
  });
}

/**
 * Fetch all videos from public groups in a given category.
 * Used for the TikTok-style category feed.
 */
export function useCategoryFeed(category: string, options?: { enabled?: boolean }) {
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

      const groupIds = (groups ?? []).map((g) => g.id);
      const groupMap = new Map((groups ?? []).map((g) => [g.id, g]));

      // 2. Get ALL videos from these groups OR with matching category on the video itself
      const orFilter =
        groupIds.length > 0
          ? `group_id.in.(${groupIds.join(",")}),category.eq.${category}`
          : `category.eq.${category}`;

      const { data: videos, error: vidErr } = await supabase
        .from("videos")
        .select("id, source_url, video_path, thumbnail_url, title, description, week_number, year, created_at, submitter_id, group_id")
        .or(orFilter)
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
          if (!submitter) return null;
          const group = v.group_id ? (groupMap.get(v.group_id) ?? { id: v.group_id, name: "" }) : { id: "", name: "" };
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
    enabled: !!user && !!category && (options?.enabled ?? true),
  });
}
