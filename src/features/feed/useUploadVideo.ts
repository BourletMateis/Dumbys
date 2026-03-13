import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/src/lib/supabase";
import { uploadFile } from "@/src/lib/storage";
import { useAuthStore } from "@/src/store/useAuthStore";

type UploadVideoInput = {
  videoUri: string;
  thumbnailUri: string;
  categoryId: string;
  isPublic: boolean;
};

export function useUploadVideo() {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);

  return useMutation({
    mutationFn: async (input: UploadVideoInput) => {
      if (!user) throw new Error("Not authenticated");

      const timestamp = Date.now();
      const videoExt = input.videoUri.split(".").pop()?.split("?")[0] || "mp4";
      const videoKey = `videos/${user.id}/${timestamp}.${videoExt}`;
      const thumbKey = `thumbnails/${user.id}/${timestamp}_thumb.jpg`;

      // Upload video
      const videoUrl = await uploadFile(
        videoKey,
        input.videoUri,
        `video/${videoExt}`,
      );

      // Upload thumbnail
      const thumbnailUrl = await uploadFile(
        thumbKey,
        input.thumbnailUri,
        "image/jpeg",
      );

      // Insert video record
      const { data, error } = await supabase
        .from("videos")
        .insert([
          {
            submitter_id: user.id,
            category_id: input.categoryId,
            source_url: videoUrl,
            thumbnail_url: thumbnailUrl,
            video_path: videoKey,
            is_public: input.isPublic,
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
