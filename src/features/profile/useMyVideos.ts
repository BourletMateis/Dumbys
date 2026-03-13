import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/src/lib/supabase";
import { useAuthStore } from "@/src/store/useAuthStore";

export type MyVideo = {
  id: string;
  source_url: string | null;
  thumbnail_url: string | null;
  video_path: string | null;
  created_at: string;
  group: {
    id: string;
    name: string;
  } | null;
};

export function useMyVideos() {
  const user = useAuthStore((s) => s.user);

  return useQuery<MyVideo[]>({
    queryKey: ["my-videos", user?.id],
    queryFn: async () => {
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("videos")
        .select("id, source_url, thumbnail_url, video_path, created_at, group_id")
        .eq("submitter_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      if (!data || data.length === 0) return [];

      // Fetch groups for enrichment
      const groupIds = [...new Set(data.map((v) => v.group_id).filter(Boolean))] as string[];

      let groupMap = new Map<string, { id: string; name: string }>();
      if (groupIds.length > 0) {
        const { data: groups, error: grpError } = await supabase
          .from("groups")
          .select("id, name")
          .in("id", groupIds);

        if (!grpError && groups) {
          groupMap = new Map(groups.map((g) => [g.id, g]));
        }
      }

      return data.map((v) => ({
        id: v.id,
        source_url: v.source_url,
        thumbnail_url: v.thumbnail_url,
        video_path: v.video_path ?? null,
        created_at: v.created_at,
        group: v.group_id ? groupMap.get(v.group_id) ?? null : null,
      }));
    },
    enabled: !!user,
  });
}
