import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/src/lib/supabase";
import { useAuthStore } from "@/src/store/useAuthStore";

export type PublicGroup = {
  id: string;
  name: string;
  description: string | null;
  owner_id: string;
  category: string | null;
  cover_url: string | null;
  end_date: string | null;
  goal_description: string | null;
  prize: string | null;
  type: string;
  created_at: string;
  member_count: number;
  challenge_count: number;
  is_member: boolean;
};

export function usePublicGroups(category?: string) {
  const user = useAuthStore((s) => s.user);

  return useQuery<PublicGroup[]>({
    queryKey: ["public-groups", category],
    queryFn: async () => {
      let query = supabase
        .from("groups")
        .select("id, name, description, owner_id, category, cover_url, end_date, goal_description, prize, type, created_at")
        .eq("is_public", true)
        .order("created_at", { ascending: false });

      if (category) {
        query = query.eq("category", category);
      }

      const { data: groups, error } = await query;
      if (error) throw error;
      if (!groups || groups.length === 0) return [];

      const groupIds = groups.map((g) => g.id);

      // Get member counts
      const { data: members, error: memError } = await supabase
        .from("group_members")
        .select("group_id")
        .in("group_id", groupIds);

      if (memError) throw memError;

      const countMap = new Map<string, number>();
      for (const m of members ?? []) {
        countMap.set(m.group_id, (countMap.get(m.group_id) ?? 0) + 1);
      }

      // Get challenge counts
      const { data: challenges } = await supabase
        .from("challenges")
        .select("id, group_id")
        .in("group_id", groupIds);

      const challengeCountMap = new Map<string, number>();
      for (const c of challenges ?? []) {
        challengeCountMap.set(c.group_id, (challengeCountMap.get(c.group_id) ?? 0) + 1);
      }

      // Check which groups the user is already in
      let myGroupIds = new Set<string>();
      if (user) {
        const { data: myMemberships } = await supabase
          .from("group_members")
          .select("group_id")
          .eq("user_id", user.id)
          .in("group_id", groupIds);

        myGroupIds = new Set((myMemberships ?? []).map((m) => m.group_id));
      }

      return groups.map((g) => ({
        id: g.id,
        name: g.name,
        description: g.description,
        owner_id: g.owner_id,
        category: g.category,
        cover_url: g.cover_url,
        end_date: g.end_date,
        goal_description: g.goal_description,
        prize: g.prize,
        type: g.type,
        created_at: g.created_at,
        member_count: countMap.get(g.id) ?? 0,
        challenge_count: challengeCountMap.get(g.id) ?? 0,
        is_member: myGroupIds.has(g.id),
      }));
    },
    enabled: !!user,
  });
}

export const PUBLIC_CATEGORIES = [
  { key: "comedy", label: "Comedy", icon: "happy" as const, color: "#f59e0b" },
  { key: "sports", label: "Sports", icon: "football" as const, color: "#22c55e" },
  { key: "dance", label: "Dance", icon: "musical-notes" as const, color: "#ec4899" },
  { key: "fails", label: "Fails", icon: "skull" as const, color: "#ef4444" },
  { key: "pets", label: "Pets", icon: "paw" as const, color: "#8b5cf6" },
  { key: "food", label: "Food", icon: "fast-food" as const, color: "#f97316" },
  { key: "talent", label: "Talent", icon: "star" as const, color: "#3b82f6" },
  { key: "other", label: "Other", icon: "ellipsis-horizontal" as const, color: "#6b7280" },
] as const;
