import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/src/lib/supabase";
import { useAuthStore } from "@/src/store/useAuthStore";

export type NotificationPreferences = {
  vote_reminder: boolean;
  podium_result: boolean;
  new_video: boolean;
  friend_request: boolean;
  new_challenge: boolean;
};

export function useNotificationPreferences() {
  const user = useAuthStore((s) => s.user);

  return useQuery<NotificationPreferences>({
    queryKey: ["notification-prefs", user?.id],
    queryFn: async () => {
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("notification_preferences")
        .select(
          "vote_reminder, podium_result, new_video, friend_request, new_challenge",
        )
        .eq("user_id", user.id)
        .single();

      if (error) throw error;

      return {
        vote_reminder: data.vote_reminder ?? true,
        podium_result: data.podium_result ?? true,
        new_video: data.new_video ?? true,
        friend_request: data.friend_request ?? true,
        new_challenge: data.new_challenge ?? true,
      };
    },
    enabled: !!user,
  });
}

export function useUpdateNotificationPreferences() {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);

  return useMutation({
    mutationFn: async (patch: Partial<NotificationPreferences>) => {
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("notification_preferences")
        .update(patch)
        .eq("user_id", user.id);

      if (error) throw error;
    },
    onMutate: async (patch) => {
      // Optimistic update
      const key = ["notification-prefs", user?.id];
      await queryClient.cancelQueries({ queryKey: key });
      const prev = queryClient.getQueryData<NotificationPreferences>(key);
      if (prev) {
        queryClient.setQueryData<NotificationPreferences>(key, { ...prev, ...patch });
      }
      return { prev };
    },
    onError: (_err, _patch, ctx) => {
      if (ctx?.prev) {
        queryClient.setQueryData(["notification-prefs", user?.id], ctx.prev);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["notification-prefs", user?.id] });
    },
  });
}

/** Toggle global notifications on/off (users.notifications_enabled) */
export function useToggleNotificationsEnabled() {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);

  return useMutation({
    mutationFn: async (enabled: boolean) => {
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase
        .from("users")
        .update({ notifications_enabled: enabled })
        .eq("id", user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user", "profile", user?.id] });
    },
  });
}
