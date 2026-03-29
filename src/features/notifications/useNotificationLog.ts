import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/src/lib/supabase";
import { useAuthStore } from "@/src/store/useAuthStore";

export type NotificationLog = {
  id: string;
  user_id: string;
  title: string;
  body: string | null;
  type: string | null;
  read: boolean;
  created_at: string;
};

export function useNotificationLog() {
  const user = useAuthStore((s) => s.user);

  return useQuery<NotificationLog[]>({
    queryKey: ["notification-log", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notification_log")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("notification_log")
        .update({ read: true })
        .eq("id", id);
      if (error) throw error;
    },
    onMutate: async (id) => {
      const key = ["notification-log", user?.id];
      await queryClient.cancelQueries({ queryKey: key });
      const prev = queryClient.getQueryData<NotificationLog[]>(key);
      if (prev) {
        queryClient.setQueryData<NotificationLog[]>(
          key,
          prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
        );
      }
      return { prev };
    },
    onError: (_e, _id, ctx) => {
      if (ctx?.prev) {
        queryClient.setQueryData(["notification-log", user?.id], ctx.prev);
      }
    },
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);

  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("notification_log")
        .update({ read: true })
        .eq("user_id", user!.id)
        .eq("read", false);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notification-log", user?.id] });
    },
  });
}

export function useUnreadNotificationCount() {
  const user = useAuthStore((s) => s.user);

  return useQuery<number>({
    queryKey: ["notification-log-unread", user?.id],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("notification_log")
        .select("*", { count: "exact", head: true })
        .eq("read", false);
      if (error) throw error;
      return count ?? 0;
    },
    enabled: !!user,
    refetchInterval: 60_000,
  });
}
