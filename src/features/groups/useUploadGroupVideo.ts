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
  category?: string;
};

type MultiUploadInput = Omit<UploadInput, "groupId"> & { groupIds: string[] };

export function useUploadGroupVideoToGroups() {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);

  return useMutation({
    mutationFn: async (input: MultiUploadInput) => {
      if (!user) throw new Error("Not authenticated");

      const timestamp = Date.now();
      // Single shared path — uploaded once regardless of group count
      const videoKey = `videos/${user.id}/shared/${timestamp}.mp4`;
      const thumbKey = `videos/${user.id}/shared/${timestamp}_thumb.jpg`;

      // Generate & upload thumbnail once
      let thumbnailUrl: string | null = null;
      try {
        const thumb = await VideoThumbnails.getThumbnailAsync(input.videoUri, {
          time: 1000,
          quality: 0.7,
        });
        thumbnailUrl = await uploadFile(thumbKey, thumb.uri, "image/jpeg");
      } catch {
        // continue without thumbnail
      }

      // Upload video once
      const videoUrl = await uploadFile(videoKey, input.videoUri, "video/mp4");

      // Insert one record per group (batch insert)
      const records = input.groupIds.map((groupId) => {
        const row: Record<string, unknown> = {
          submitter_id: user.id,
          group_id: groupId,
          source_url: videoUrl,
          video_path: videoKey,
          thumbnail_url: thumbnailUrl,
          is_public: false,
          week_number: input.weekNumber,
          year: input.year,
        };
        if (input.title) row.title = input.title;
        if (input.description) row.description = input.description;
        if (input.category) row.category = input.category;
        return row;
      });

      const { data, error } = await supabase
        .from("videos")
        .insert(records as any)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: (_data, variables) => {
      for (const groupId of variables.groupIds) {
        queryClient.invalidateQueries({
          queryKey: ["group-videos", groupId, variables.weekNumber, variables.year],
        });
      }
      queryClient.invalidateQueries({ queryKey: ["my-videos"] });
      queryClient.invalidateQueries({ queryKey: ["categories-with-videos"] });
      if (variables.category) {
        queryClient.invalidateQueries({ queryKey: ["category-feed", variables.category] });
      }
    },
  });
}

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
      // category column — requires: ALTER TABLE videos ADD COLUMN category text;
      if (input.category) insertData.category = input.category;

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
      queryClient.invalidateQueries({ queryKey: ["categories-with-videos"] });
      if (variables.category) {
        queryClient.invalidateQueries({ queryKey: ["category-feed", variables.category] });
      }
    },
  });
}
