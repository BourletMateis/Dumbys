import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/src/lib/supabase";
import { useAuthStore } from "@/src/store/useAuthStore";
import type { CategoryVideo } from "./useCategoryFeed";

export type ExploreTournament = {
  id: string;
  title: string;
  group_id: string;
  group_name: string;
};

/**
 * Tous les tournois visibles par l'utilisateur connecté
 * (depuis les groupes dont il est membre)
 */
export function useMyTournaments() {
  const user = useAuthStore((s) => s.user);

  return useQuery<ExploreTournament[]>({
    queryKey: ["my-tournaments"],
    queryFn: async () => {
      if (!user) throw new Error("Not authenticated");

      // Groupes dont l'utilisateur est membre
      const { data: memberships, error: memErr } = await supabase
        .from("group_members")
        .select("group_id")
        .eq("user_id", user.id);

      if (memErr) throw memErr;
      if (!memberships || memberships.length === 0) return [];

      const groupIds = memberships.map((m) => m.group_id);

      // Noms des groupes
      const { data: groups, error: grpErr } = await supabase
        .from("groups")
        .select("id, name")
        .in("id", groupIds);

      if (grpErr) throw grpErr;
      const groupMap = new Map((groups ?? []).map((g) => [g.id, g.name]));

      // Tournois de ces groupes
      const { data: tournaments, error: tourErr } = await supabase
        .from("group_tournaments")
        .select("id, title, group_id")
        .in("group_id", groupIds)
        .order("created_at", { ascending: false });

      if (tourErr) throw tourErr;
      if (!tournaments || tournaments.length === 0) return [];

      const tournamentIds = tournaments.map((t) => t.id);

      // Défis de ces tournois
      const { data: challenges } = await supabase
        .from("challenges")
        .select("id, tournament_id")
        .in("tournament_id", tournamentIds);

      if (!challenges || challenges.length === 0) return [];

      const challengeIds = challenges.map((c) => c.id);

      // Vérifier lesquels ont au moins une vidéo
      const { data: videoRows } = await supabase
        .from("videos")
        .select("challenge_id")
        .in("challenge_id", challengeIds);

      const challengeIdsWithVideos = new Set((videoRows ?? []).map((v) => v.challenge_id));
      const tournamentIdsWithVideos = new Set(
        challenges
          .filter((c) => challengeIdsWithVideos.has(c.id))
          .map((c) => c.tournament_id),
      );

      return tournaments
        .filter((t) => tournamentIdsWithVideos.has(t.id))
        .map((t) => ({
          id: t.id,
          title: t.title,
          group_id: t.group_id,
          group_name: groupMap.get(t.group_id) ?? "",
        }));
    },
    enabled: !!user,
  });
}

/**
 * Feed vidéos d'un tournoi — toutes les vidéos liées aux défis du tournoi
 */
/**
 * groupName est passé depuis useMyTournaments — évite une requête supplémentaire
 */
export function useTournamentFeed(tournamentId: string, groupName = "") {
  const user = useAuthStore((s) => s.user);

  return useQuery<CategoryVideo[]>({
    queryKey: ["tournament-feed", tournamentId],
    queryFn: async () => {
      if (!user) throw new Error("Not authenticated");

      // 1. Défis du tournoi + vidéos en parallèle quand possible
      const { data: challenges, error: chalErr } = await supabase
        .from("challenges")
        .select("id")
        .eq("tournament_id", tournamentId);

      if (chalErr) throw chalErr;
      if (!challenges || challenges.length === 0) return [];

      const challengeIds = challenges.map((c) => c.id);

      // 2. Vidéos liées à ces défis
      const { data: videos, error: vidErr } = await supabase
        .from("videos")
        .select("id, source_url, video_path, thumbnail_url, title, description, week_number, year, created_at, submitter_id, group_id, challenge_id")
        .in("challenge_id", challengeIds)
        .order("created_at", { ascending: false });

      if (vidErr) throw vidErr;
      if (!videos || videos.length === 0) return [];

      // 3. Enrichir avec les utilisateurs
      const userIds = [...new Set(videos.map((v) => v.submitter_id))];
      const { data: users, error: usrErr } = await supabase
        .from("users")
        .select("id, username, avatar_url")
        .in("id", userIds);

      if (usrErr) throw usrErr;

      const userMap = new Map((users ?? []).map((u) => [u.id, u]));
      const displayName = groupName || "Tournoi";

      return videos
        .map((v) => {
          const submitter = userMap.get(v.submitter_id);
          if (!submitter) return null;
          return {
            id: v.id,
            source_url: v.source_url,
            video_path: v.video_path,
            thumbnail_url: v.thumbnail_url,
            title: v.title,
            description: v.description,
            week_number: v.week_number ?? 0,
            year: v.year ?? 0,
            created_at: v.created_at,
            submitter,
            group: { id: v.group_id ?? "", name: displayName },
          };
        })
        .filter((v): v is CategoryVideo => v !== null);
    },
    enabled: !!user && !!tournamentId,
  });
}
