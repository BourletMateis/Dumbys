import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/src/lib/supabase";
import { useAuthStore } from "@/src/store/useAuthStore";
import type { Challenge } from "@/src/types/database.types";

// Récupérer tous les défis d'un tournoi
export function useTournamentChallenges(tournamentId: string) {
  return useQuery<Challenge[]>({
    queryKey: ["tournament-challenges", tournamentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("challenges")
        .select("*")
        .eq("tournament_id", tournamentId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data ?? [];
    },
    enabled: !!tournamentId,
  });
}

type CreateChallengeInput = {
  tournamentId: string;
  title: string;
  description?: string;
};

// Créer un défi dans un tournoi
export function useCreateChallenge() {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);

  return useMutation({
    mutationFn: async (input: CreateChallengeInput) => {
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("challenges")
        .insert({
          tournament_id: input.tournamentId,
          title: input.title,
          description: input.description ?? null,
          created_by: user.id,
        })
        .select("*")
        .single();

      if (error) throw error;
      return data as Challenge;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["tournament-challenges", variables.tournamentId],
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
      tournamentId,
    }: {
      challengeId: string;
      tournamentId: string;
    }) => {
      const { error } = await supabase
        .from("challenges")
        .delete()
        .eq("id", challengeId);

      if (error) throw error;
      return tournamentId;
    },
    onSuccess: (tournamentId) => {
      queryClient.invalidateQueries({
        queryKey: ["tournament-challenges", tournamentId],
      });
    },
  });
}
