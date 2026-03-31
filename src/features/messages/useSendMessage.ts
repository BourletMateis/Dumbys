import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/src/lib/supabase";
import { useAuthStore } from "@/src/store/useAuthStore";

export function useSendMessage(conversationId: string | undefined) {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);

  return useMutation({
    mutationFn: async (text: string) => {
      if (!user || !conversationId) throw new Error("Missing data");

      const { error } = await supabase.from("messages").insert({
        conversation_id: conversationId,
        sender_id: user.id,
        text,
      });
      if (error) throw error;

      // Update last_message_at on conversation
      await supabase
        .from("conversations")
        .update({ last_message_at: new Date().toISOString() })
        .eq("id", conversationId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages", conversationId] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
}
