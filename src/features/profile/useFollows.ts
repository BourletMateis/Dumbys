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
        return false;
      } else {
        const { error } = await supabase
          .from("follows")
          .insert({ follower_id: me.id, following_id: userId });
        if (error) throw error;
        return true;
      }
    },
    onMutate: async () => {
      // Cancel in-flight queries
      await queryClient.cancelQueries({ queryKey: ["is-following", me?.id, userId] });
      await queryClient.cancelQueries({ queryKey: ["follower-count", userId] });

      // Snapshot
      const prevIsFollowing = queryClient.getQueryData<boolean>(["is-following", me?.id, userId]);
      const prevCount = queryClient.getQueryData<number>(["follower-count", userId]);

      // Optimistic flip — instant UI response
      queryClient.setQueryData(["is-following", me?.id, userId], !prevIsFollowing);
      queryClient.setQueryData(["follower-count", userId], (old: number = 0) =>
        prevIsFollowing ? Math.max(0, old - 1) : old + 1,
      );

      return { prevIsFollowing, prevCount };
    },
    onError: (_err, _vars, context) => {
      // Rollback on error
      if (context) {
        queryClient.setQueryData(["is-following", me?.id, userId], context.prevIsFollowing);
        queryClient.setQueryData(["follower-count", userId], context.prevCount);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["is-following", me?.id, userId] });
      queryClient.invalidateQueries({ queryKey: ["follower-count", userId] });
      queryClient.invalidateQueries({ queryKey: ["following-count", me?.id] });
    },
  });
}
