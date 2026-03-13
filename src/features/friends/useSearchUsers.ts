import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/src/lib/supabase";
import { useAuthStore } from "@/src/store/useAuthStore";
import type { Database } from "@/src/types/database.types";

export type UserRow = Database["public"]["Tables"]["users"]["Row"];

export function useSearchUsers(searchTerm: string) {
  const user = useAuthStore((s) => s.user);

  return useQuery({
    queryKey: ["users", "search", searchTerm],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("users")
        .select("id, username, avatar_url, role, created_at")
        .ilike("username", `%${searchTerm}%`)
        .neq("id", user!.id)
        .limit(20);

      if (error) throw error;
      return data as UserRow[];
    },
    enabled: !!user && searchTerm.length >= 2,
  });
}
