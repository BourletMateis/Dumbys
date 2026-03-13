import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/src/lib/supabase";
import { useAuthStore } from "@/src/store/useAuthStore";

export function useIsFollowing(userId: string) {
  const me = useAuthStore((s) => s.user);

  return useQuery({
    queryKey: ["is-following", me?.id, userId],
    queryFn: async () => {
      if (!me) return false;
      const { data } = await supabase
        .from("follows")
        .select("id")
        .eq("follower_id", me.id)
        .eq("following_id", userId)
        .maybeSingle();
      return !!data;
    },
    enabled: !!me && !!userId && me.id !== userId,
  });
}

export function useFollowerCount(userId: string) {
  return useQuery({
    queryKey: ["follower-count", userId],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("follows")
        .select("*", { count: "exact", head: true })
        .eq("following_id", userId);
      if (error) throw error;
      return count ?? 0;
    },
    enabled: !!userId,
  });
}

export function useFollowingCount(userId: string) {
  return useQuery({
    queryKey: ["following-count", userId],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("follows")
        .select("*", { count: "exact", head: true })
        .eq("follower_id", userId);
      if (error) throw error;
      return count ?? 0;
    },
    enabled: !!userId,
  });
}

export function useToggleFollow(userId: string) {
  const queryClient = useQueryClient();
  const me = useAuthStore((s) => s.user);

  return useMutation({
    mutationFn: async () => {
      if (!me) throw new Error("Not authenticated");

      // Check current state
      const { data: existing } = await supabase
        .from("follows")
        .select("id")
        .eq("follower_id", me.id)
        .eq("following_id", userId)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from("follows")
          .delete()
          .eq("id", existing.id);
        if (error) throw error;
        return false; // unfollowed
      } else {
        const { error } = await supabase
          .from("follows")
          .insert({ follower_id: me.id, following_id: userId });
        if (error) throw error;
        return true; // followed
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["is-following", me?.id, userId] });
      queryClient.invalidateQueries({ queryKey: ["follower-count", userId] });
      queryClient.invalidateQueries({ queryKey: ["following-count", me?.id] });
    },
  });
}
