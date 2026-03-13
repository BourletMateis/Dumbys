import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/src/lib/supabase";
import { useAuthStore } from "@/src/store/useAuthStore";

export function useMyVote(groupId: string, weekNumber: number, year: number) {
  const user = useAuthStore((s) => s.user);

  return useQuery({
    queryKey: ["my-vote", groupId, weekNumber, year],
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await supabase
        .from("weekly_votes")
        .select("id, video_id")
        .eq("voter_id", user.id)
        .eq("group_id", groupId)
        .eq("week_number", weekNumber)
        .eq("year", year)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!user && !!groupId,
  });
}

export function useVoteCounts(groupId: string, weekNumber: number, year: number) {
  return useQuery<Record<string, number>>({
    queryKey: ["vote-counts", groupId, weekNumber, year],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("weekly_votes")
        .select("video_id")
        .eq("group_id", groupId)
        .eq("week_number", weekNumber)
        .eq("year", year);

      if (error) throw error;

      const counts: Record<string, number> = {};
      for (const v of data ?? []) {
        counts[v.video_id] = (counts[v.video_id] ?? 0) + 1;
      }
      return counts;
    },
  });
}

export function useCastVote() {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);

  return useMutation({
    mutationFn: async ({
      videoId,
      groupId,
      weekNumber,
      year,
    }: {
      videoId: string;
      groupId: string;
      weekNumber: number;
      year: number;
    }) => {
      if (!user) throw new Error("Not authenticated");

      // Delete existing vote if any (change vote)
      await supabase
        .from("weekly_votes")
        .delete()
        .eq("voter_id", user.id)
        .eq("group_id", groupId)
        .eq("week_number", weekNumber)
        .eq("year", year);

      // Cast new vote
      const { error } = await supabase
        .from("weekly_votes")
        .insert({
          voter_id: user.id,
          video_id: videoId,
          group_id: groupId,
          week_number: weekNumber,
          year: year,
        });

      if (error) throw error;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["my-vote", variables.groupId, variables.weekNumber, variables.year],
      });
      queryClient.invalidateQueries({
        queryKey: ["vote-counts", variables.groupId, variables.weekNumber, variables.year],
      });
    },
  });
}
