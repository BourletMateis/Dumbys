import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/src/lib/supabase";
import { uploadFile } from "@/src/lib/storage";
import { useAuthStore } from "@/src/store/useAuthStore";
import * as VideoThumbnails from "expo-video-thumbnails";

export type ChallengeVideo = {
  id: string;
  source_url: string | null;
  video_path: string | null;
  thumbnail_url: string | null;
  title: string | null;
  description: string | null;
  created_at: string;
  submitter: {
    id: string;
    username: string;
    avatar_url: string | null;
  };
};

// Récupérer toutes les vidéos d'un défi
export function useChallengeVideos(challengeId: string) {
  const user = useAuthStore((s) => s.user);

  return useQuery<ChallengeVideo[]>({
    queryKey: ["challenge-videos", challengeId],
    queryFn: async () => {
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("videos")
        .select("id, source_url, video_path, thumbnail_url, title, description, created_at, submitter_id")
        .eq("challenge_id", challengeId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      if (!data || data.length === 0) return [];

      const userIds = [...new Set(data.map((v) => v.submitter_id))];
      const { data: users, error: usersError } = await supabase
        .from("users")
        .select("id, username, avatar_url")
        .in("id", userIds);

      if (usersError) throw usersError;

      const usersMap = new Map((users ?? []).map((u) => [u.id, u]));

      return data
        .map((v) => {
          const submitter = usersMap.get(v.submitter_id);
          if (!submitter) return null;
          return {
            id: v.id,
            source_url: v.source_url,
            video_path: v.video_path,
            thumbnail_url: v.thumbnail_url,
            title: v.title,
            description: v.description,
            created_at: v.created_at,
            submitter,
          };
        })
        .filter((v): v is ChallengeVideo => v !== null);
    },
    enabled: !!user && !!challengeId,
  });
}

type UploadChallengeVideoInput = {
  videoUri: string;
  challengeId: string;
  groupId: string;
  title?: string;
  description?: string;
};

// Uploader une vidéo dans un défi
export function useUploadChallengeVideo() {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);

  return useMutation({
    mutationFn: async (input: UploadChallengeVideoInput) => {
      if (!user) throw new Error("Not authenticated");

      const timestamp = Date.now();
      const videoKey = `videos/${user.id}/challenge/${input.challengeId}/${timestamp}.mp4`;
      const thumbKey = `videos/${user.id}/challenge/${input.challengeId}/${timestamp}_thumb.jpg`;

      // Génération + upload thumbnail
      let thumbnailUrl: string | null = null;
      try {
        const thumb = await VideoThumbnails.getThumbnailAsync(input.videoUri, {
          time: 1000,
          quality: 0.7,
        });
        thumbnailUrl = await uploadFile(thumbKey, thumb.uri, "image/jpeg");
      } catch {
        // Thumbnail non critique
      }

      // Upload vidéo
      const videoUrl = await uploadFile(videoKey, input.videoUri, "video/mp4");

      const insertData: Record<string, unknown> = {
        submitter_id: user.id,
        challenge_id: input.challengeId,
        group_id: input.groupId,
        source_url: videoUrl,
        video_path: videoKey,
        thumbnail_url: thumbnailUrl,
        is_public: false,
      };

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
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["challenge-videos", variables.challengeId],
      });
      queryClient.invalidateQueries({ queryKey: ["my-videos"] });
    },
  });
}
