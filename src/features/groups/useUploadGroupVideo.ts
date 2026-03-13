import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/src/lib/supabase";
import { uploadFile, getPublicUrl } from "@/src/lib/storage";
import { useAuthStore } from "@/src/store/useAuthStore";
import * as VideoThumbnails from "expo-video-thumbnails";

type UploadInput = {
  videoUri: string;
  groupId: string;
  weekNumber: number;
  year: number;
  title?: string;
  description?: string;
};

export function useUploadGroupVideo() {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);

  return useMutation({
    mutationFn: async (input: UploadInput) => {
      if (!user) throw new Error("Not authenticated");

      const timestamp = Date.now();
      const videoKey = `videos/${user.id}/${input.groupId}/${timestamp}.mp4`;
      const thumbKey = `videos/${user.id}/${input.groupId}/${timestamp}_thumb.jpg`;

      // Generate & upload thumbnail
      let thumbnailUrl: string | null = null;
      try {
        const thumb = await VideoThumbnails.getThumbnailAsync(input.videoUri, {
          time: 1000,
          quality: 0.7,
        });
        thumbnailUrl = await uploadFile(thumbKey, thumb.uri, "image/jpeg");
      } catch {
        // Thumbnail generation failed, continue without it
      }

      // Upload video
      const videoUrl = await uploadFile(videoKey, input.videoUri, "video/mp4");

      // Insert record in Supabase
      const insertData: Record<string, unknown> = {
        submitter_id: user.id,
        group_id: input.groupId,
        source_url: videoUrl,
        video_path: videoKey,
        thumbnail_url: thumbnailUrl,
        is_public: false,
        week_number: input.weekNumber,
        year: input.year,
      };

      // Only include title/description if provided (columns may not exist yet)
      if (input.title) insertData.title = input.title;
      if (input.description) insertData.description = input.description;

      const { data, error } = await supabase
        .from("videos")
        .insert(insertData as any)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["group-videos", variables.groupId, variables.weekNumber, variables.year],
      });
      queryClient.invalidateQueries({ queryKey: ["my-videos"] });
    },
  });
}
