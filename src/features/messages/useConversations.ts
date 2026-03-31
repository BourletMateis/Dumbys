import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/src/lib/supabase";
import { useAuthStore } from "@/src/store/useAuthStore";

export type ConversationWithUser = {
  id: string;
  otherUser: {
    id: string;
    username: string;
    avatar_url: string | null;
  };
  lastMessage: {
    text: string;
    created_at: string;
    sender_id: string;
  } | null;
  last_message_at: string;
};

export function useConversations() {
  const user = useAuthStore((s) => s.user);

  return useQuery<ConversationWithUser[]>({
    queryKey: ["conversations"],
    queryFn: async () => {
      if (!user) throw new Error("Not authenticated");

      // Fetch conversations where user is participant
      const { data: convos, error } = await supabase
        .from("conversations")
        .select("id, user1_id, user2_id, last_message_at")
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
        .order("last_message_at", { ascending: false });

      if (error) throw error;
      if (!convos || convos.length === 0) return [];

      // Get other user IDs
      const otherUserIds = convos.map((c) =>
        c.user1_id === user.id ? c.user2_id : c.user1_id,
      );

      // Fetch user profiles
      const { data: users, error: usersError } = await supabase
        .from("users")
        .select("id, username, avatar_url")
        .in("id", otherUserIds);

      if (usersError) throw usersError;
      const userMap = new Map(users?.map((u) => [u.id, u]) ?? []);

      // Fetch last message for each conversation
      const convoIds = convos.map((c) => c.id);
      const { data: lastMessages } = await supabase
        .from("messages")
        .select("conversation_id, text, created_at, sender_id")
        .in("conversation_id", convoIds)
        .order("created_at", { ascending: false });

      const lastMessageMap = new Map<string, { text: string; created_at: string; sender_id: string }>();
      if (lastMessages) {
        for (const msg of lastMessages) {
          if (!lastMessageMap.has(msg.conversation_id)) {
            lastMessageMap.set(msg.conversation_id, msg);
          }
        }
      }

      return convos.map((c) => {
        const otherId = c.user1_id === user.id ? c.user2_id : c.user1_id;
        const otherUser = userMap.get(otherId);
        return {
          id: c.id,
          otherUser: otherUser ?? { id: otherId, username: "Inconnu", avatar_url: null },
          lastMessage: lastMessageMap.get(c.id) ?? null,
          last_message_at: c.last_message_at,
        };
      });
    },
    enabled: !!user,
  });
}
