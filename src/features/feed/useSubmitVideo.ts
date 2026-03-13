import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/src/lib/supabase";
import { useAuthStore } from "@/src/store/useAuthStore";
import type { SubmitVideoForm } from "./submitSchema";

function extractThumbnailUrl(url: string): string | null {
  // YouTube Shorts / youtu.be
  const ytMatch = url.match(
    /(?:youtube\.com\/shorts\/|youtu\.be\/)([a-zA-Z0-9_-]+)/,
  );
  if (ytMatch) {
    return `https://img.youtube.com/vi/${ytMatch[1]}/hqdefault.jpg`;
  }

  // TikTok - no easy thumbnail extraction without API
  // Instagram - no easy thumbnail extraction without API
  return null;
}

export function useSubmitVideo() {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);

  return useMutation({
    mutationFn: async (form: SubmitVideoForm) => {
      if (!user) throw new Error("Not authenticated");

      const thumbnailUrl = extractThumbnailUrl(form.source_url);

      const { data, error } = await supabase
        .from("videos")
        .insert([
          {
            submitter_id: user.id,
            category_id: form.category_id,
            source_url: form.source_url,
            thumbnail_url: thumbnailUrl,
            is_public: true,
          },
        ])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["videos", "today"] });
      queryClient.invalidateQueries({ queryKey: ["my-videos"] });
    },
  });
}
