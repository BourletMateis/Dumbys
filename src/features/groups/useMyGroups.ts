import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/src/lib/supabase";
import { useAuthStore } from "@/src/store/useAuthStore";
import type { GroupRole } from "@/src/types/database.types";

export type GroupWithRole = {
  id: string;
  name: string;
  description: string | null;
  owner_id: string;
  is_public: boolean;
  invite_code: string;
  cover_url: string | null;
  category: string | null;
  end_date: string | null;
  goal_description: string | null;
  prize: string | null;
  type: string;
  created_at: string;
  role: GroupRole;
  member_count: number;
};

/** All groups the user is a member of (private + public) */
export function useMyGroups() {
  const user = useAuthStore((s) => s.user);

  return useQuery<GroupWithRole[]>({
    queryKey: ["my-groups", user?.id],
    queryFn: async () => {
      if (!user) throw new Error("Not authenticated");

      // Get groups where user is a member
      const { data: memberships, error: memError } = await supabase
        .from("group_members")
        .select("group_id, role")
        .eq("user_id", user.id);

      if (memError) throw memError;
      if (!memberships || memberships.length === 0) return [];

      const groupIds = memberships.map((m) => m.group_id);
      const roleMap = new Map(memberships.map((m) => [m.group_id, m.role as GroupRole]));

      // Fetch group details
      const { data: groups, error: grpError } = await supabase
        .from("groups")
        .select("id, name, description, owner_id, is_public, invite_code, cover_url, category, end_date, goal_description, prize, type, created_at")
        .in("id", groupIds)
        .order("created_at", { ascending: false });

      if (grpError) throw grpError;

      // Get member counts
      const { data: counts, error: countError } = await supabase
        .from("group_members")
        .select("group_id")
        .in("group_id", groupIds);

      if (countError) throw countError;

      const countMap = new Map<string, number>();
      for (const c of counts ?? []) {
        countMap.set(c.group_id, (countMap.get(c.group_id) ?? 0) + 1);
      }

      return (groups ?? []).map((g) => ({
        id: g.id,
        name: g.name,
        description: g.description,
        owner_id: g.owner_id,
        is_public: g.is_public,
        invite_code: g.invite_code,
        cover_url: g.cover_url,
        category: g.category,
        end_date: g.end_date,
        goal_description: g.goal_description,
        prize: g.prize,
        type: g.type,
        created_at: g.created_at,
        role: roleMap.get(g.id) ?? "member",
        member_count: countMap.get(g.id) ?? 1,
      }));
    },
    enabled: !!user,
  });
}
