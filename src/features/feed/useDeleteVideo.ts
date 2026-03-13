import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/src/lib/supabase";
import { deleteFiles } from "@/src/lib/storage";

export function useDeleteVideo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ videoId, videoPath }: { videoId: string; videoPath?: string | null }) => {
      // Delete files from Cloudflare R2
      if (videoPath) {
        const thumbPath = videoPath.replace(/\.[^.]+$/, "_thumb.jpg");
        await deleteFiles([videoPath, thumbPath]).catch(() => {
          // Ignore storage deletion errors
        });
      }

      // Delete from database
      const { error } = await supabase
        .from("videos")
        .delete()
        .eq("id", videoId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["videos", "today"] });
      queryClient.invalidateQueries({ queryKey: ["my-videos"] });
      queryClient.invalidateQueries({ queryKey: ["group-videos"] });
    },
  });
}
