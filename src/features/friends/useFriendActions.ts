import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/src/lib/supabase";
import { useAuthStore } from "@/src/store/useAuthStore";

function useInvalidateFriendships() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: ["friendships"] });
    queryClient.invalidateQueries({ queryKey: ["videos", "today", "friends"] });
  };
}

export function useSendRequest() {
  const user = useAuthStore((s) => s.user);
  const invalidate = useInvalidateFriendships();

  return useMutation({
    mutationFn: async (addresseeId: string) => {
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase.from("friendships").insert([
        {
          requester_id: user.id,
          addressee_id: addresseeId,
        },
      ]);

      if (error) throw error;
    },
    onSuccess: invalidate,
  });
}

export function useAcceptRequest() {
  const invalidate = useInvalidateFriendships();

  return useMutation({
    mutationFn: async (friendshipId: string) => {
      const { error } = await supabase
        .from("friendships")
        .update({ status: "accepted" as const })
        .eq("id", friendshipId);

      if (error) throw error;
    },
    onSuccess: invalidate,
  });
}

export function useRemoveFriendship() {
  const invalidate = useInvalidateFriendships();

  return useMutation({
    mutationFn: async (friendshipId: string) => {
      const { error } = await supabase
        .from("friendships")
        .delete()
        .eq("id", friendshipId);

      if (error) throw error;
    },
    onSuccess: invalidate,
  });
}
