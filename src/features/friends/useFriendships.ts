import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/src/lib/supabase";
import { useAuthStore } from "@/src/store/useAuthStore";
import type { Database } from "@/src/types/database.types";

type FriendshipRow = Database["public"]["Tables"]["friendships"]["Row"];
type UserRow = Database["public"]["Tables"]["users"]["Row"];

export type FriendshipWithUser = FriendshipRow & {
  otherUser: UserRow;
};

export type FriendshipsData = {
  accepted: FriendshipWithUser[];
  pendingReceived: FriendshipWithUser[];
  pendingSent: FriendshipWithUser[];
};

export function useFriendships() {
  const user = useAuthStore((s) => s.user);

  return useQuery({
    queryKey: ["friendships"],
    queryFn: async () => {
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("friendships")
        .select("id, requester_id, addressee_id, status, created_at")
        .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`);

      if (error) throw error;
      const friendships = data as FriendshipRow[];

      // Collect all other user IDs
      const otherIds = friendships.map((f) =>
        f.requester_id === user.id ? f.addressee_id : f.requester_id,
      );

      if (otherIds.length === 0) {
        return { accepted: [], pendingReceived: [], pendingSent: [] } as FriendshipsData;
      }

      const { data: users, error: usersError } = await supabase
        .from("users")
        .select("id, username, avatar_url, role, created_at")
        .in("id", otherIds);

      if (usersError) throw usersError;

      const usersMap = new Map(
        (users as UserRow[]).map((u) => [u.id, u]),
      );

      const result: FriendshipsData = {
        accepted: [],
        pendingReceived: [],
        pendingSent: [],
      };

      for (const f of friendships) {
        const otherId =
          f.requester_id === user.id ? f.addressee_id : f.requester_id;
        const otherUser = usersMap.get(otherId);
        if (!otherUser) continue;

        const enriched: FriendshipWithUser = { ...f, otherUser };

        if (f.status === "accepted") {
          result.accepted.push(enriched);
        } else if (f.addressee_id === user.id) {
          result.pendingReceived.push(enriched);
        } else {
          result.pendingSent.push(enriched);
        }
      }

      return result;
    },
    enabled: !!user,
  });
}
