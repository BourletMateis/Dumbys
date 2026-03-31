import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/src/lib/supabase";
import { useAuthStore } from "@/src/store/useAuthStore";

export type Message = {
  id: string;
  conversation_id: string;
  sender_id: string;
  text: string;
  created_at: string;
};

export function useMessages(conversationId: string | undefined) {
  const user = useAuthStore((s) => s.user);

  return useQuery<Message[]>({
    queryKey: ["messages", conversationId],
    queryFn: async () => {
      if (!conversationId) return [];

      const { data, error } = await supabase
        .from("messages")
        .select("id, conversation_id, sender_id, text, created_at")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user && !!conversationId,
    refetchInterval: 10000,
  });
}
