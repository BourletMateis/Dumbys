-- ============================================
-- V4: Lien vidéo ↔ défi
-- Ajouter challenge_id (nullable) sur la table videos
-- Ne casse pas les vidéos de groupe existantes
-- ============================================

ALTER TABLE public.videos
  ADD COLUMN IF NOT EXISTS challenge_id UUID REFERENCES public.challenges(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_videos_challenge ON public.videos(challenge_id);
