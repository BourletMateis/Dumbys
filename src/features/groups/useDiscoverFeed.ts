import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/src/lib/supabase";
import { useAuthStore } from "@/src/store/useAuthStore";
import type { CategoryVideo } from "./useCategoryFeed";

/**
 * Feed "Découvrir" — vidéos publiques récentes de tous les groupes publics
 * + vidéos des tournois des groupes dont l'utilisateur est membre.
 */
export function useDiscoverFeed(options?: { enabled?: boolean }) {
  const user = useAuthStore((s) => s.user);

  return useQuery<CategoryVideo[]>({
    queryKey: ["discover-feed"],
    queryFn: async () => {
      // ── 1. Vidéos de groupes publics ──────────────────────────────
      const { data: groups, error: grpErr } = await supabase
        .from("groups")
        .select("id, name")
        .eq("is_public", true);

      if (grpErr) throw grpErr;

      const publicGroupIds = (groups ?? []).map((g) => g.id);
      const groupMap = new Map((groups ?? []).map((g) => [g.id, g]));

      const [publicVideosRes, memberGroupsRes] = await Promise.all([
        publicGroupIds.length > 0
          ? supabase
              .from("videos")
              .select("id, source_url, video_path, thumbnail_url, title, description, week_number, year, created_at, submitter_id, group_id")
              .in("group_id", publicGroupIds)
              .order("created_at", { ascending: false })
              .limit(100)
          : Promise.resolve({ data: [], error: null }),

        // ── 2. Groupes dont l'utilisateur est membre ─────────────────
        user
          ? supabase
              .from("group_members")
              .select("group_id")
              .eq("user_id", user.id)
          : Promise.resolve({ data: [], error: null }),
      ]);

      if (publicVideosRes.error) throw publicVideosRes.error;
      if (memberGroupsRes.error) throw memberGroupsRes.error;

      const memberGroupIds = (memberGroupsRes.data ?? []).map((m) => m.group_id);

      // ── 3. Challenge videos from user's group tournaments ──────────
      let challengeVideos: CategoryVideo[] = [];

      if (memberGroupIds.length > 0) {
        // Get groups info for member groups (for the `group` field)
        const { data: memberGroups } = await supabase
          .from("groups")
          .select("id, name")
          .in("id", memberGroupIds);

        const memberGroupMap = new Map((memberGroups ?? []).map((g) => [g.id, g]));

        // Get tournaments from those groups
        const { data: tournaments, error: tourErr } = await supabase
          .from("group_tournaments")
          .select("id, group_id")
          .in("group_id", memberGroupIds);

        if (tourErr) throw tourErr;

        if (tournaments && tournaments.length > 0) {
          const tournamentIds = tournaments.map((t) => t.id);
          const tournamentGroupMap = new Map(tournaments.map((t) => [t.id, t.group_id]));

          // Get challenges from those tournaments
          const { data: challenges, error: chalErr } = await supabase
            .from("challenges")
            .select("id, tournament_id")
            .in("tournament_id", tournamentIds);

          if (chalErr) throw chalErr;

          if (challenges && challenges.length > 0) {
            const challengeIds = challenges.map((c) => c.id);
            const challengeTournamentMap = new Map(challenges.map((c) => [c.id, c.tournament_id]));

            // Fetch videos for those challenges
            const { data: cvids, error: cvidErr } = await supabase
              .from("videos")
              .select("id, source_url, video_path, thumbnail_url, title, description, week_number, year, created_at, submitter_id, challenge_id")
              .in("challenge_id", challengeIds)
              .order("created_at", { ascending: false })
              .limit(100);

            if (cvidErr) throw cvidErr;

            if (cvids && cvids.length > 0) {
              const cUserIds = [...new Set(cvids.map((v) => v.submitter_id))];
              const { data: cUsers } = await supabase
                .from("users")
                .select("id, username, avatar_url")
                .in("id", cUserIds);

              const cUserMap = new Map((cUsers ?? []).map((u) => [u.id, u]));

              challengeVideos = cvids
                .map((v) => {
                  const submitter = cUserMap.get(v.submitter_id);
                  const tournamentId = v.challenge_id ? challengeTournamentMap.get(v.challenge_id) : null;
                  const groupId = tournamentId ? tournamentGroupMap.get(tournamentId) : null;
                  const group = groupId ? memberGroupMap.get(groupId) : null;
                  if (!submitter || !group) return null;
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
                    group,
                  } satisfies CategoryVideo;
                })
                .filter((v): v is CategoryVideo => v !== null);
            }
          }
        }
      }

      // ── 4. Enrich public group videos with submitter + group ───────
      const publicVids = publicVideosRes.data ?? [];
      let publicVideos: CategoryVideo[] = [];

      if (publicVids.length > 0) {
        const userIds = [...new Set(publicVids.map((v) => v.submitter_id))];
        const { data: users, error: usrErr } = await supabase
          .from("users")
          .select("id, username, avatar_url")
          .in("id", userIds);

        if (usrErr) throw usrErr;

        const userMap = new Map((users ?? []).map((u) => [u.id, u]));

        publicVideos = publicVids
          .map((v) => {
            const submitter = userMap.get(v.submitter_id);
            const group = v.group_id ? groupMap.get(v.group_id) : null;
            if (!submitter || !group) return null;
            return {
              id: v.id,
              source_url: v.source_url,
              video_path: v.video_path,
              thumbnail_url: v.thumbnail_url,
              title: v.title,
              description: v.description,
              week_number: v.week_number!,
              year: v.year!,
              created_at: v.created_at,
              submitter,
              group,
            } satisfies CategoryVideo;
          })
          .filter((v): v is CategoryVideo => v !== null);
      }

      // ── 5. Merge & sort by date ────────────────────────────────────
      const seen = new Set<string>();
      return [...publicVideos, ...challengeVideos]
        .filter((v) => { if (seen.has(v.id)) return false; seen.add(v.id); return true; })
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    },
    enabled: !!user && (options?.enabled ?? true),
  });
}
