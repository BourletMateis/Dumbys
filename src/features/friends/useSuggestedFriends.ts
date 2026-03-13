import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/src/lib/supabase";
import { useAuthStore } from "@/src/store/useAuthStore";

export type SuggestedUser = {
  id: string;
  username: string;
  avatar_url: string | null;
  shared_groups: number;
};

export function useSuggestedFriends() {
  const user = useAuthStore((s) => s.user);

  return useQuery<SuggestedUser[]>({
    queryKey: ["suggested-friends", user?.id],
    queryFn: async () => {
      if (!user) throw new Error("Not authenticated");

      // Get user's group IDs
      const { data: myMemberships, error: memErr } = await supabase
        .from("group_members")
        .select("group_id")
        .eq("user_id", user.id);

      if (memErr) throw memErr;
      if (!myMemberships || myMemberships.length === 0) return [];

      const myGroupIds = myMemberships.map((m) => m.group_id);

      // Get other users in those groups
      const { data: otherMembers, error: otherErr } = await supabase
        .from("group_members")
        .select("user_id, group_id")
        .in("group_id", myGroupIds)
        .neq("user_id", user.id);

      if (otherErr) throw otherErr;
      if (!otherMembers || otherMembers.length === 0) return [];

      // Count shared groups per user
      const sharedMap = new Map<string, number>();
      for (const m of otherMembers) {
        sharedMap.set(m.user_id, (sharedMap.get(m.user_id) ?? 0) + 1);
      }

      // Get existing friendships to exclude
      const { data: friendships } = await supabase
        .from("friendships")
        .select("requester_id, addressee_id")
        .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`);

      const friendIds = new Set<string>();
      for (const f of friendships ?? []) {
        friendIds.add(f.requester_id === user.id ? f.addressee_id : f.requester_id);
      }

      // Filter to non-friends, sort by shared groups
      const candidateIds = [...sharedMap.entries()]
        .filter(([uid]) => !friendIds.has(uid))
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([uid]) => uid);

      if (candidateIds.length === 0) return [];

      // Fetch user profiles
      const { data: users, error: usersErr } = await supabase
        .from("users")
        .select("id, username, avatar_url")
        .in("id", candidateIds);

      if (usersErr) throw usersErr;

      return (users ?? []).map((u) => ({
        id: u.id,
        username: u.username,
        avatar_url: u.avatar_url,
        shared_groups: sharedMap.get(u.id) ?? 0,
      })).sort((a, b) => b.shared_groups - a.shared_groups);
    },
    enabled: !!user,
  });
}
