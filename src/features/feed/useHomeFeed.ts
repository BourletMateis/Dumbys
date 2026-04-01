import { useInfiniteQuery } from "@tanstack/react-query";
import { supabase } from "@/src/lib/supabase";
import { useAuthStore } from "@/src/store/useAuthStore";

const PAGE_SIZE = 15;

export type HomeFeedVideo = {
  id: string;
  source_url: string | null;
  stream_url: string | null;
  video_path: string | null;
  thumbnail_url: string | null;
  title: string | null;
  description: string | null;
  created_at: string;
  /** Origine pour l'affichage du badge dans la card */
  origin: "group" | "friend";
  submitter: {
    id: string;
    username: string;
    avatar_url: string | null;
  };
  group: {
    id: string;
    name: string;
  } | null;
};

/**
 * Feed Home paginé — 2 couches de contenu dans l'ordre :
 * 1. Vidéos de mes groupes (cette semaine et récentes)
 * 2. Vidéos de mes amis (toutes périodes)
 *
 * Chaque page contient PAGE_SIZE éléments de la couche courante.
 * La pagination avance layer par layer : d'abord toutes les pages groupes,
 * puis amis.
 */
export function useHomeFeed() {
  const user = useAuthStore((s) => s.user);

  return useInfiniteQuery<HomeFeedVideo[]>({
    queryKey: ["home-feed", user?.id],
    initialPageParam: { layer: 0, offset: 0 } as { layer: number; offset: number },

    queryFn: async ({ pageParam }) => {
      if (!user) throw new Error("Not authenticated");
      const { layer, offset } = pageParam as { layer: number; offset: number };

      // ── Couche 0 : vidéos de mes groupes ──────────────────────────
      if (layer === 0) {
        const { data: memberships } = await supabase
          .from("group_members")
          .select("group_id")
          .eq("user_id", user.id);

        const myGroupIds = (memberships ?? []).map((m) => m.group_id);
        if (myGroupIds.length === 0) return [];

        const { data: groups } = await supabase
          .from("groups")
          .select("id, name")
          .in("id", myGroupIds);

        const groupMap = new Map((groups ?? []).map((g) => [g.id, g]));

        const { data: videos, error } = await supabase
          .from("videos")
          .select("id, source_url, stream_url, video_path, thumbnail_url, title, description, created_at, submitter_id, group_id")
          .in("group_id", myGroupIds)
          .order("created_at", { ascending: false })
          .range(offset, offset + PAGE_SIZE - 1);

        if (error) throw error;
        if (!videos || videos.length === 0) return [];

        const userIds = [...new Set(videos.map((v) => v.submitter_id))];
        const { data: users } = await supabase
          .from("users").select("id, username, avatar_url").in("id", userIds);
        const userMap = new Map((users ?? []).map((u) => [u.id, u]));

        return videos
          .map((v) => {
            const submitter = userMap.get(v.submitter_id);
            if (!submitter) return null;
            return {
              id: v.id,
              source_url: v.source_url,
              stream_url: v.stream_url,
              video_path: v.video_path,
              thumbnail_url: v.thumbnail_url,
              title: v.title,
              description: v.description,
              created_at: v.created_at,
              origin: "group" as const,
              submitter,
              group: v.group_id ? (groupMap.get(v.group_id) ?? null) : null,
            };
          })
          .filter((v): v is HomeFeedVideo => v !== null);
      }

      // ── Couche 1 : vidéos de mes amis ─────────────────────────────
      if (layer === 1) {
        const { data: friendships } = await supabase
          .from("friendships")
          .select("requester_id, addressee_id")
          .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
          .eq("status", "accepted");

        const friendIds = (friendships ?? [])
          .map((f) => f.requester_id === user.id ? f.addressee_id : f.requester_id)
          .filter((id) => id !== user.id);

        if (friendIds.length === 0) return [];

        const { data: videos, error } = await supabase
          .from("videos")
          .select("id, source_url, stream_url, video_path, thumbnail_url, title, description, created_at, submitter_id, group_id")
          .in("submitter_id", friendIds)
          .order("created_at", { ascending: false })
          .range(offset, offset + PAGE_SIZE - 1);

        if (error) throw error;
        if (!videos || videos.length === 0) return [];

        const groupIds = [...new Set(videos.map((v) => v.group_id).filter(Boolean))] as string[];
        const { data: groups } = groupIds.length > 0
          ? await supabase.from("groups").select("id, name").in("id", groupIds)
          : { data: [] };
        const groupMap = new Map((groups ?? []).map((g) => [g.id, g]));

        const userIds = [...new Set(videos.map((v) => v.submitter_id))];
        const { data: users } = await supabase
          .from("users").select("id, username, avatar_url").in("id", userIds);
        const userMap = new Map((users ?? []).map((u) => [u.id, u]));

        return videos
          .map((v) => {
            const submitter = userMap.get(v.submitter_id);
            if (!submitter) return null;
            return {
              id: v.id,
              source_url: v.source_url,
              stream_url: v.stream_url,
              video_path: v.video_path,
              thumbnail_url: v.thumbnail_url,
              title: v.title,
              description: v.description,
              created_at: v.created_at,
              origin: "friend" as const,
              submitter,
              group: v.group_id ? (groupMap.get(v.group_id) ?? null) : null,
            };
          })
          .filter((v): v is HomeFeedVideo => v !== null);
      }

      // No more layers
      return [];
    },

    getNextPageParam: (lastPage, _allPages, lastPageParam) => {
      const { layer, offset } = lastPageParam as { layer: number; offset: number };
      if (lastPage.length < PAGE_SIZE) {
        // Couche épuisée → passer à la suivante
        const nextLayer = layer + 1;
        if (nextLayer > 1) return undefined;
        return { layer: nextLayer, offset: 0 };
      }
      return { layer, offset: offset + PAGE_SIZE };
    },

    enabled: !!user,
  });
}
