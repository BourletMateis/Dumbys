import { useInfiniteQuery } from "@tanstack/react-query";
import { supabase } from "@/src/lib/supabase";
import { useAuthStore } from "@/src/store/useAuthStore";
import type { CategoryVideo } from "./useCategoryFeed";

const PAGE_SIZE = 20;

/**
 * Feed "Découvrir" — paginated.
 * Page 0: challenge videos (from user's groups) + public videos[0..19], merged & sorted.
 * Pages 1+: public videos[N*20..(N+1)*20-1] only.
 */
export function useDiscoverFeed(options?: { enabled?: boolean }) {
  const user = useAuthStore((s) => s.user);

  return useInfiniteQuery<CategoryVideo[]>({
    queryKey: ["discover-feed"],
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      const publicOffset = pageParam as number;
      const isFirstPage = publicOffset === 0;

      // ── 1. Public groups ─────────────────────────────────────────
      const { data: groups, error: grpErr } = await supabase
        .from("groups")
        .select("id, name")
        .eq("is_public", true);

      if (grpErr) throw grpErr;

      const publicGroupIds = (groups ?? []).map((g) => g.id);
      const groupMap = new Map((groups ?? []).map((g) => [g.id, g]));

      // ── 2. Paginated public videos ────────────────────────────────
      let publicVideos: CategoryVideo[] = [];

      if (publicGroupIds.length > 0) {
        const { data: vids, error: vidErr } = await supabase
          .from("videos")
          .select("id, source_url, video_path, thumbnail_url, title, description, week_number, year, created_at, submitter_id, group_id")
          .in("group_id", publicGroupIds)
          .order("created_at", { ascending: false })
          .range(publicOffset, publicOffset + PAGE_SIZE - 1);

        if (vidErr) throw vidErr;

        if (vids && vids.length > 0) {
          const userIds = [...new Set(vids.map((v) => v.submitter_id))];
          const { data: users } = await supabase
            .from("users")
            .select("id, username, avatar_url")
            .in("id", userIds);

          const userMap = new Map((users ?? []).map((u) => [u.id, u]));

          publicVideos = vids
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
      }

      // ── 3. Challenge videos (first page only) ─────────────────────
      let challengeVideos: CategoryVideo[] = [];

      if (isFirstPage && user) {
        const { data: memberGroups } = await supabase
          .from("group_members")
          .select("group_id")
          .eq("user_id", user.id);

        const memberGroupIds = (memberGroups ?? []).map((m) => m.group_id);

        if (memberGroupIds.length > 0) {
          const { data: memberGroupData } = await supabase
            .from("groups")
            .select("id, name")
            .in("id", memberGroupIds);

          const memberGroupMap = new Map((memberGroupData ?? []).map((g) => [g.id, g]));

          const { data: tournaments } = await supabase
            .from("group_tournaments")
            .select("id, group_id")
            .in("group_id", memberGroupIds);

          if (tournaments && tournaments.length > 0) {
            const tournamentIds = tournaments.map((t) => t.id);
            const tournamentGroupMap = new Map(tournaments.map((t) => [t.id, t.group_id]));

            const { data: challenges } = await supabase
              .from("challenges")
              .select("id, tournament_id")
              .in("tournament_id", tournamentIds);

            if (challenges && challenges.length > 0) {
              const challengeIds = challenges.map((c) => c.id);
              const challengeTournamentMap = new Map(challenges.map((c) => [c.id, c.tournament_id]));

              const { data: cvids } = await supabase
                .from("videos")
                .select("id, source_url, video_path, thumbnail_url, title, description, week_number, year, created_at, submitter_id, challenge_id")
                .in("challenge_id", challengeIds)
                .order("created_at", { ascending: false })
                .limit(30);

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
      }

      // ── 4. Merge, deduplicate, sort ───────────────────────────────
      const seen = new Set<string>();
      return [...publicVideos, ...challengeVideos]
        .filter((v) => { if (seen.has(v.id)) return false; seen.add(v.id); return true; })
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    },
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length >= PAGE_SIZE ? allPages.length * PAGE_SIZE : undefined,
    enabled: !!user && (options?.enabled ?? true),
  });
}
