import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/src/lib/supabase";
import { useAuthStore } from "@/src/store/useAuthStore";
import type { Challenge } from "@/src/types/database.types";

const CHALLENGE_SELECT =
  "id, group_id, title, description, prize, rules, created_by, created_at, status, submission_end, bracket_size, current_round, round_end";

// Récupérer tous les défis d'un groupe
export function useGroupChallenges(groupId: string) {
  return useQuery<Challenge[]>({
    queryKey: ["group-challenges", groupId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("challenges")
        .select(CHALLENGE_SELECT)
        .eq("group_id", groupId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return (data ?? []) as Challenge[];
    },
    enabled: !!groupId,
  });
}

// Récupérer un défi par son id
export function useChallenge(challengeId: string | null) {
  return useQuery<Challenge | null>({
    queryKey: ["challenge", challengeId],
    queryFn: async () => {
      if (!challengeId) return null;
      const { data, error } = await supabase
        .from("challenges")
        .select(CHALLENGE_SELECT)
        .eq("id", challengeId)
        .single();

      if (error) throw error;
      return data as Challenge;
    },
    enabled: !!challengeId,
  });
}

type CreateChallengeInput = {
  groupId: string;
  title: string;
  description?: string;
  prize?: string;
  rules?: string;
  submissionEnd?: string; // ISO date string
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
          prize: input.prize ?? null,
          rules: input.rules ?? null,
          created_by: user.id,
          submission_end: input.submissionEnd ?? null,
        })
        .select(CHALLENGE_SELECT)
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
