import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/src/lib/supabase";
import { useAuthStore } from "@/src/store/useAuthStore";
import type { GroupTournament } from "@/src/types/database.types";

// Récupérer un seul tournoi par son ID
export function useGroupTournament(tournamentId: string) {
  return useQuery<GroupTournament | null>({
    queryKey: ["group-tournament", tournamentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("group_tournaments")
        .select("*")
        .eq("id", tournamentId)
        .single();

      if (error) throw error;
      return data as GroupTournament;
    },
    enabled: !!tournamentId,
  });
}

// Récupérer tous les tournois d'un groupe
export function useGroupTournaments(groupId: string) {
  return useQuery<GroupTournament[]>({
    queryKey: ["group-tournaments", groupId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("group_tournaments")
        .select("*")
        .eq("group_id", groupId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data ?? [];
    },
    enabled: !!groupId,
  });
}

type CreateTournamentInput = {
  groupId: string;
  title: string;
  description?: string;
  reward?: string;
};

// Créer un tournoi dans un groupe
export function useCreateGroupTournament() {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);

  return useMutation({
    mutationFn: async (input: CreateTournamentInput) => {
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("group_tournaments")
        .insert({
          group_id: input.groupId,
          title: input.title,
          description: input.description ?? null,
          reward: input.reward ?? null,
          created_by: user.id,
        })
        .select("*")
        .single();

      if (error) throw error;
      return data as GroupTournament;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["group-tournaments", variables.groupId] });
      queryClient.invalidateQueries({ queryKey: ["my-tournaments"] });
    },
  });
}

// Supprimer un tournoi
export function useDeleteGroupTournament() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      tournamentId,
      groupId,
    }: {
      tournamentId: string;
      groupId: string;
    }) => {
      const { error } = await supabase
        .from("group_tournaments")
        .delete()
        .eq("id", tournamentId);

      if (error) throw error;
      return groupId;
    },
    onSuccess: (groupId) => {
      queryClient.invalidateQueries({ queryKey: ["group-tournaments", groupId] });
      queryClient.invalidateQueries({ queryKey: ["my-tournaments"] });
    },
  });
}
