import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/src/lib/supabase";
import { useAuthStore } from "@/src/store/useAuthStore";

export function useUpdateUsername() {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);

  return useMutation({
    mutationFn: async (username: string) => {
      if (!user) throw new Error("Not authenticated");

      const trimmed = username.trim();
      if (trimmed.length < 3) throw new Error("Le nom doit faire au moins 3 caractères");
      if (trimmed.length > 24) throw new Error("Le nom ne peut pas dépasser 24 caractères");

      const { error } = await supabase
        .from("users")
        .update({ username: trimmed })
        .eq("id", user.id);

      if (error) {
        if (error.code === "23505") throw new Error("Ce nom est déjà pris");
        throw error;
      }

      return trimmed;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user", "profile"] });
    },
  });
}
