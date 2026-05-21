import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/src/lib/supabase";
import { useAuthStore } from "@/src/store/useAuthStore";
import type { Database } from "@/src/types/database.types";

export type AppNotification = Database["public"]["Tables"]["notifications"]["Row"];

export function useNotifications() {
  const user = useAuthStore((s) => s.user);

  return useQuery({
    queryKey: ["notifications", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data as AppNotification[];
    },
  });
}

export function useUnreadCount() {
  const user = useAuthStore((s) => s.user);

  return useQuery({
    queryKey: ["notifications-unread", user?.id],
    enabled: !!user?.id,
    refetchInterval: 30_000,
    queryFn: async () => {
      const { count, error } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user!.id)
        .eq("read", false);
      if (error) throw error;
      return count ?? 0;
    },
  });
}

export function useMarkAllRead() {
  const user = useAuthStore((s) => s.user);
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("notifications")
        .update({ read: true })
        .eq("user_id", user!.id)
        .eq("read", false);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications", user?.id] });
      qc.invalidateQueries({ queryKey: ["notifications-unread", user?.id] });
    },
  });
}

export function useMarkRead() {
  const user = useAuthStore((s) => s.user);
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("notifications")
        .update({ read: true })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications", user?.id] });
      qc.invalidateQueries({ queryKey: ["notifications-unread", user?.id] });
    },
  });
}
