import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/src/lib/supabase";
import { useAuthStore } from "@/src/store/useAuthStore";
import type { Challenge } from "@/src/types/database.types";

// Récupérer tous les défis d'un groupe
export function useGroupChallenges(groupId: string) {
  return useQuery<Challenge[]>({
    queryKey: ["group-challenges", groupId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("challenges")
        .select("id, group_id, title, description, created_by, created_at")
        .eq("group_id", groupId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return (data ?? []) as Challenge[];
    },
    enabled: !!groupId,
  });
}

type CreateChallengeInput = {
  groupId: string;
  title: string;
  description?: string;
};

// Créer un défi dans un groupe
export function useCreateChallenge() {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);

  return useMutation({
    mutationFn: async (input: CreateChallengeInput) => {
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("challenges")
        .insert({
          group_id: input.groupId,
          title: input.title,
          description: input.description ?? null,
          created_by: user.id,
        })
        .select("id, group_id, title, description, created_by, created_at")
        .single();

      if (error) throw error;
      return data as Challenge;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["group-challenges", variables.groupId],
      });
    },
  });
}

// Supprimer un défi
export function useDeleteChallenge() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      challengeId,
      groupId,
    }: {
      challengeId: string;
      groupId: string;
    }) => {
      const { error } = await supabase
        .from("challenges")
        .delete()
        .eq("id", challengeId);

      if (error) throw error;
      return groupId;
    },
    onSuccess: (groupId) => {
      queryClient.invalidateQueries({
        queryKey: ["group-challenges", groupId],
      });
    },
  });
}
