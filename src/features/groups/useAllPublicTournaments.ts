import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/src/lib/supabase";
import { useAuthStore } from "@/src/store/useAuthStore";

export type PublicTournament = {
  id: string;
  title: string;
  description: string | null;
  reward: string | null;
  created_at: string;
  group: {
    id: string;
    name: string;
    cover_url: string | null;
    member_count: number;
  };
  challenge_count: number;
  is_member: boolean;
};

export function useAllPublicTournaments() {
  const user = useAuthStore((s) => s.user);

  return useQuery<PublicTournament[]>({
    queryKey: ["all-public-tournaments"],
    queryFn: async () => {
      if (!user) throw new Error("Not authenticated");

      // Groupes publics
      const { data: groups, error: grpErr } = await supabase
        .from("groups")
        .select("id, name, cover_url")
        .eq("is_public", true);

      if (grpErr) throw grpErr;
      if (!groups || groups.length === 0) return [];

      const groupIds = groups.map((g) => g.id);

      // Tournois de ces groupes + memberships + member counts en parallèle
      const [tourRes, memberRes, myMemberRes] = await Promise.all([
        supabase
          .from("group_tournaments")
          .select("id, title, description, reward, created_at, group_id")
          .in("group_id", groupIds)
          .order("created_at", { ascending: false }),

        supabase
          .from("group_members")
          .select("group_id")
          .in("group_id", groupIds),

        supabase
          .from("group_members")
          .select("group_id")
          .eq("user_id", user.id)
          .in("group_id", groupIds),
      ]);

      if (tourRes.error) throw tourRes.error;
      const tournaments = tourRes.data ?? [];
      if (tournaments.length === 0) return [];

      // Nombre de membres par groupe
      const memberCountMap = new Map<string, number>();
      for (const m of memberRes.data ?? []) {
        memberCountMap.set(m.group_id, (memberCountMap.get(m.group_id) ?? 0) + 1);
      }

      // Groupes dont l'utilisateur est déjà membre
      const myGroupIds = new Set((myMemberRes.data ?? []).map((m) => m.group_id));

      // Nombre de défis par tournoi
      const tournamentIds = tournaments.map((t) => t.id);
      const { data: challenges } = await supabase
        .from("challenges")
        .select("id, tournament_id")
        .in("tournament_id", tournamentIds);

      const challengeCountMap = new Map<string, number>();
      for (const c of challenges ?? []) {
        challengeCountMap.set(c.tournament_id, (challengeCountMap.get(c.tournament_id) ?? 0) + 1);
      }

      const groupMap = new Map(groups.map((g) => [g.id, g]));

      return tournaments
        .map((t) => {
          const group = groupMap.get(t.group_id);
          if (!group) return null;
          return {
            id: t.id,
            title: t.title,
            description: t.description,
            reward: t.reward,
            created_at: t.created_at,
            group: {
              id: group.id,
              name: group.name,
              cover_url: group.cover_url,
              member_count: memberCountMap.get(group.id) ?? 0,
            },
            challenge_count: challengeCountMap.get(t.id) ?? 0,
            is_member: myGroupIds.has(t.group_id),
          };
        })
        .filter((t): t is PublicTournament => t !== null);
    },
    enabled: !!user,
  });
}

export function useJoinTournamentGroup() {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);

  return useMutation({
    mutationFn: async (groupId: string) => {
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase
        .from("group_members")
        .insert({ group_id: groupId, user_id: user.id, role: "member" });
      if (error && error.code !== "23505") throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-public-tournaments"] });
      queryClient.invalidateQueries({ queryKey: ["my-groups"] });
      queryClient.invalidateQueries({ queryKey: ["my-tournaments"] });
    },
  });
}
