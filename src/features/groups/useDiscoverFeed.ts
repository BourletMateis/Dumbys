import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/src/lib/supabase";
import { useAuthStore } from "@/src/store/useAuthStore";
import type { CategoryVideo } from "./useCategoryFeed";

/**
 * Feed "Découvrir" — vidéos publiques récentes de tous les groupes publics,
 * toutes catégories confondues.
 */
export function useDiscoverFeed() {
  const user = useAuthStore((s) => s.user);

  return useQuery<CategoryVideo[]>({
    queryKey: ["discover-feed"],
    queryFn: async () => {
      // 1. Tous les groupes publics
      const { data: groups, error: grpErr } = await supabase
        .from("groups")
        .select("id, name")
        .eq("is_public", true);

      if (grpErr) throw grpErr;
      if (!groups || groups.length === 0) return [];

      const groupIds = groups.map((g) => g.id);
      const groupMap = new Map(groups.map((g) => [g.id, g]));

      // 2. Vidéos récentes de ces groupes
      const { data: videos, error: vidErr } = await supabase
        .from("videos")
        .select("id, source_url, video_path, thumbnail_url, title, description, week_number, year, created_at, submitter_id, group_id")
        .in("group_id", groupIds)
        .order("created_at", { ascending: false })
        .limit(100);

      if (vidErr) throw vidErr;
      if (!videos || videos.length === 0) return [];

      // 3. Enrichir avec les utilisateurs
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
    enabled: !!user,
  });
}
