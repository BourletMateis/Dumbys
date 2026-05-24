import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/src/lib/supabase";
import { useAuthStore } from "@/src/store/useAuthStore";

export function useLikeCount(videoId: string) {
  return useQuery({
    queryKey: ["likes", videoId],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("reactions")
        .select("*", { count: "exact", head: true })
        .eq("video_id", videoId)
        .eq("emoji", "like");

      if (error) throw error;
      return count ?? 0;
    },
  });
}

export function useHasLiked(videoId: string) {
  const user = useAuthStore((s) => s.user);

  return useQuery({
    queryKey: ["liked", videoId, user?.id],
    queryFn: async () => {
      if (!user) return false;

      const { data, error } = await supabase
        .from("reactions")
        .select("id")
        .eq("video_id", videoId)
        .eq("user_id", user.id)
        .eq("emoji", "like")
        .maybeSingle();

      if (error) throw error;
      return !!data;
    },
    enabled: !!user,
  });
}

export function useToggleLike(videoId: string) {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);

  return useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not authenticated");

      // Check if already liked
      const { data: existing } = await supabase
        .from("reactions")
        .select("id")
        .eq("video_id", videoId)
        .eq("user_id", user.id)
        .eq("emoji", "like")
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from("reactions")
          .delete()
          .eq("id", existing.id);
        if (error) throw error;
        return false; // unliked
      } else {
        const { error } = await supabase
          .from("reactions")
          .insert({ user_id: user.id, video_id: videoId, emoji: "like" });
        if (error) throw error;
        return true; // liked
      }
    },
    onMutate: async () => {
      // Cancel in-flight queries to avoid overwriting optimistic update
      await queryClient.cancelQueries({ queryKey: ["liked", videoId, user?.id] });
      await queryClient.cancelQueries({ queryKey: ["likes", videoId] });

      // Snapshot current values for rollback
      const prevHasLiked = queryClient.getQueryData<boolean>(["liked", videoId, user?.id]);
      const prevCount = queryClient.getQueryData<number>(["likes", videoId]);

      // Optimistically flip the like state immediately
      const newHasLiked = !prevHasLiked;
      queryClient.setQueryData(["liked", videoId, user?.id], newHasLiked);
      queryClient.setQueryData(["likes", videoId], (old: number = 0) =>
        newHasLiked ? old + 1 : Math.max(0, old - 1),
      );

      return { prevHasLiked, prevCount };
    },
    onError: (_err, _vars, context) => {
      // Rollback on error
      if (context) {
        queryClient.setQueryData(["liked", videoId, user?.id], context.prevHasLiked);
        queryClient.setQueryData(["likes", videoId], context.prevCount);
      }
    },
    onSettled: () => {
      // Sync with server after mutation
      queryClient.invalidateQueries({ queryKey: ["likes", videoId] });
      queryClient.invalidateQueries({ queryKey: ["liked", videoId] });
    },
  });
}
