import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/src/lib/supabase";
import type { GroupRole } from "@/src/types/database.types";

export type GroupMember = {
  id: string;
  user_id: string;
  role: GroupRole;
  joined_at: string;
  username: string;
  avatar_url: string | null;
};

export function useGroupMembers(groupId: string) {
  return useQuery<GroupMember[]>({
    queryKey: ["group-members", groupId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("group_members")
        .select("id, user_id, role, joined_at")
        .eq("group_id", groupId)
        .order("joined_at", { ascending: true });

      if (error) throw error;
      if (!data || data.length === 0) return [];

      const userIds = data.map((m) => m.user_id);
      const { data: users, error: usersErr } = await supabase
        .from("users")
        .select("id, username, avatar_url")
        .in("id", userIds);

      if (usersErr) throw usersErr;

      const userMap = new Map((users ?? []).map((u) => [u.id, u]));

      return data
        .map((m) => {
          const u = userMap.get(m.user_id);
          if (!u) return null;
          return {
            id: m.id,
            user_id: m.user_id,
            role: m.role as GroupRole,
            joined_at: m.joined_at,
            username: u.username,
            avatar_url: u.avatar_url,
          };
        })
        .filter((m): m is GroupMember => m !== null);
    },
    enabled: !!groupId,
  });
}

export function useRemoveMember(groupId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (membershipId: string) => {
      const { error } = await supabase
        .from("group_members")
        .delete()
        .eq("id", membershipId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["group-members", groupId] });
      queryClient.invalidateQueries({ queryKey: ["my-groups"] });
    },
  });
}
