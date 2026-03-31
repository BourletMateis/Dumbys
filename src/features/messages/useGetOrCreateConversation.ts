import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/src/lib/supabase";
import { useAuthStore } from "@/src/store/useAuthStore";

export function useGetOrCreateConversation() {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);

  return useMutation({
    mutationFn: async (otherUserId: string): Promise<string> => {
      if (!user) throw new Error("Not authenticated");

      // Sort IDs so user1_id < user2_id (constraint)
      const [user1, user2] =
        user.id < otherUserId ? [user.id, otherUserId] : [otherUserId, user.id];

      // Try to find existing conversation
      const { data: existing } = await supabase
        .from("conversations")
        .select("id")
        .eq("user1_id", user1)
        .eq("user2_id", user2)
        .single();

      if (existing) return existing.id;

      // Create new conversation
      const { data: created, error } = await supabase
        .from("conversations")
        .insert({ user1_id: user1, user2_id: user2 })
        .select("id")
        .single();

      if (error) throw error;
      return created.id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
}
