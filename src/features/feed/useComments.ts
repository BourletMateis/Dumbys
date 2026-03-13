import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/src/lib/supabase";
import { useAuthStore } from "@/src/store/useAuthStore";

export type Comment = {
  id: string;
  text: string;
  created_at: string;
  user: {
    id: string;
    username: string;
    avatar_url: string | null;
  };
};

export function useComments(videoId: string) {
  return useQuery<Comment[]>({
    queryKey: ["comments", videoId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("comments")
        .select("id, text, created_at, user_id")
        .eq("video_id", videoId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      if (!data || data.length === 0) return [];

      const userIds = [...new Set(data.map((c) => c.user_id))];
      const { data: users, error: usersErr } = await supabase
        .from("users")
        .select("id, username, avatar_url")
        .in("id", userIds);

      if (usersErr) throw usersErr;

      const userMap = new Map((users ?? []).map((u) => [u.id, u]));

      return data
        .map((c) => {
          const u = userMap.get(c.user_id);
          if (!u) return null;
          return {
            id: c.id,
            text: c.text,
            created_at: c.created_at,
            user: u,
          };
        })
        .filter((c): c is Comment => c !== null);
    },
    enabled: !!videoId,
  });
}

export function useCommentCount(videoId: string) {
  return useQuery({
    queryKey: ["comment-count", videoId],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("comments")
        .select("*", { count: "exact", head: true })
        .eq("video_id", videoId);

      if (error) throw error;
      return count ?? 0;
    },
    enabled: !!videoId,
  });
}

export function useAddComment(videoId: string) {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);

  return useMutation({
    mutationFn: async (text: string) => {
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("comments")
        .insert({ user_id: user.id, video_id: videoId, text });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", videoId] });
      queryClient.invalidateQueries({ queryKey: ["comment-count", videoId] });
    },
  });
}

export function useDeleteComment(videoId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (commentId: string) => {
      const { error } = await supabase
        .from("comments")
        .delete()
        .eq("id", commentId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", videoId] });
      queryClient.invalidateQueries({ queryKey: ["comment-count", videoId] });
    },
  });
}
