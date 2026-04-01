import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import * as VideoThumbnails from "expo-video-thumbnails";
import { supabase } from "@/src/lib/supabase";
import { uploadFile, triggerStreamEncode } from "@/src/lib/storage";
import { useAuthStore } from "@/src/store/useAuthStore";
import { useUploadStore, type PendingUpload } from "@/src/store/useUploadStore";

/**
 * Mount once in the tab layout.
 * Uses zustand.subscribe (outside React render cycle) to avoid infinite loops.
 */
export function useBackgroundUpload() {
  const queryClient = useQueryClient();
  const processingRef = useRef<Set<string>>(new Set());

  // Keep user in a ref so the async closure always has the latest value
  const user = useAuthStore((s) => s.user);
  const userRef = useRef(user);
  useEffect(() => { userRef.current = user; }, [user]);

  useEffect(() => {
    const process = async (upload: PendingUpload) => {
      const { setStatus, remove } = useUploadStore.getState();
      const currentUser = userRef.current;

      if (!currentUser) {
        setStatus(upload.localId, "error", "Non authentifié");
        processingRef.current.delete(upload.localId);
        return;
      }

      setStatus(upload.localId, "uploading");

      try {
        const timestamp = Date.now();
        const videoKey = `videos/${currentUser.id}/${upload.groupId}/${timestamp}.mp4`;
        const thumbKey = `videos/${currentUser.id}/${upload.groupId}/${timestamp}_thumb.jpg`;

        let thumbnailUrl: string | null = null;
        try {
          const thumbUri = upload.thumbnailUri ?? (
            await VideoThumbnails.getThumbnailAsync(upload.videoUri, { time: 1000, quality: 0.7 })
          ).uri;
          thumbnailUrl = await uploadFile(thumbKey, thumbUri, "image/jpeg");
        } catch {
          // continue without thumbnail
        }

        const videoUrl = await uploadFile(videoKey, upload.videoUri, "video/mp4");

        const insertData: Record<string, unknown> = {
          submitter_id: currentUser.id,
          group_id: upload.groupId,
          source_url: videoUrl,
          video_path: videoKey,
          thumbnail_url: thumbnailUrl,
          is_public: false,
          week_number: upload.weekNumber,
          year: upload.year,
        };
        if (upload.title) insertData.title = upload.title;
        if (upload.challengeId) insertData.challenge_id = upload.challengeId;

        const { data, error } = await supabase
          .from("videos")
          .insert(insertData as any)
          .select()
          .single();

        if (error) throw error;

        triggerStreamEncode(data.id, videoUrl);

        queryClient.invalidateQueries({ queryKey: ["group-videos", upload.groupId, upload.weekNumber, upload.year] });
        queryClient.invalidateQueries({ queryKey: ["my-videos"] });
        queryClient.invalidateQueries({ queryKey: ["home-feed"] });
        if (upload.challengeId) {
          queryClient.invalidateQueries({ queryKey: ["challenge-videos", upload.challengeId] });
        }

        setStatus(upload.localId, "done");
        setTimeout(() => remove(upload.localId), 3000);
      } catch (err) {
        setStatus(upload.localId, "error", (err as Error).message ?? "Erreur upload");
      } finally {
        processingRef.current.delete(upload.localId);
      }
    };

    const tryProcessPending = () => {
      const { uploads } = useUploadStore.getState();
      for (const upload of uploads) {
        if (upload.status === "pending" && !processingRef.current.has(upload.localId)) {
          processingRef.current.add(upload.localId);
          process(upload);
        }
      }
    };

    // Process any uploads already pending on mount
    tryProcessPending();

    // Subscribe to future changes — runs outside React render cycle
    const unsubscribe = useUploadStore.subscribe(() => tryProcessPending());

    return unsubscribe;
  }, []); // empty deps — intentional, uses refs for user
}
