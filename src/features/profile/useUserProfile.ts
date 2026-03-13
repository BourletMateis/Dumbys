import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/src/lib/supabase";
import { useAuthStore } from "@/src/store/useAuthStore";
import type { Database } from "@/src/types/database.types";

type UserRow = Database["public"]["Tables"]["users"]["Row"];

export function useUserProfile() {
  const user = useAuthStore((s) => s.user);

  return useQuery({
    queryKey: ["user", "profile", user?.id],
    queryFn: async (): Promise<UserRow> => {
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("users")
        .select("id, username, avatar_url, role, created_at")
        .eq("id", user.id)
        .single();

      if (error) throw error;
      return data as UserRow;
    },
    enabled: !!user,
  });
}
