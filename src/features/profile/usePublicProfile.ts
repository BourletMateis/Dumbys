import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/src/lib/supabase";
import { useAuthStore } from "@/src/store/useAuthStore";

export type PublicProfile = {
  id: string;
  username: string;
  avatar_url: string | null;
  created_at: string;
};

export type PublicVideo = {
  id: string;
  source_url: string | null;
  thumbnail_url: string | null;
  created_at: string;
  group: { id: string; name: string; is_public: boolean } | null;
};

export function usePublicProfile(userId: string) {
  return useQuery<PublicProfile>({
    queryKey: ["public-profile", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("users")
        .select("id, username, avatar_url, created_at")
        .eq("id", userId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });
}

export function usePublicVideos(userId: string) {
  const me = useAuthStore((s) => s.user);

  return useQuery<PublicVideo[]>({
    queryKey: ["public-videos", userId, me?.id],
    queryFn: async () => {
      // 1. Fetch all videos from this user
      const { data, error } = await supabase
        .from("videos")
        .select("id, source_url, thumbnail_url, created_at, group_id")
        .eq("submitter_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      if (!data || data.length === 0) return [];

      // 2. Fetch group info for all videos
      const groupIds = [
        ...new Set(data.map((v) => v.group_id).filter(Boolean)),
      ] as string[];

      let groupMap = new Map<
        string,
        { id: string; name: string; is_public: boolean }
      >();
      if (groupIds.length > 0) {
        const { data: groups } = await supabase
          .from("groups")
          .select("id, name, is_public")
          .in("id", groupIds);
        if (groups) {
          groupMap = new Map(groups.map((g) => [g.id, g]));
        }
      }

      // 3. Get groups where the viewer is a member
      let myGroupIds = new Set<string>();
      if (me) {
        const { data: memberships } = await supabase
          .from("group_members")
          .select("group_id")
          .eq("user_id", me.id);
        if (memberships) {
          myGroupIds = new Set(memberships.map((m) => m.group_id));
        }
      }

      // 4. Filter: only show videos from public groups or groups the viewer is in
      return data
        .map((v) => {
          const group = v.group_id ? groupMap.get(v.group_id) ?? null : null;

          // If video has a group, check access
          if (v.group_id) {
            const isPublicGroup = group?.is_public === true;
            const isMember = myGroupIds.has(v.group_id);
            if (!isPublicGroup && !isMember) return null; // hidden
          }

          return {
            id: v.id,
            source_url: v.source_url,
            thumbnail_url: v.thumbnail_url,
            created_at: v.created_at,
            group,
          };
        })
        .filter((v): v is PublicVideo => v !== null);
    },
    enabled: !!userId,
  });
}
