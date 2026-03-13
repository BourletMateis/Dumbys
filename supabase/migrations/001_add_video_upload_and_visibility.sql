-- ============================================
-- Add video upload support and visibility
-- Run this in Supabase SQL Editor
-- ============================================

-- Add is_public column to videos
ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT true NOT NULL;

-- Make source_url nullable (uploaded videos use storage, not external URLs)
ALTER TABLE public.videos ALTER COLUMN source_url DROP NOT NULL;

-- Add video_path for uploaded videos stored in Supabase Storage
ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS video_path TEXT;

-- Create storage bucket for videos
INSERT INTO storage.buckets (id, name, public)
VALUES ('videos', 'videos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies: authenticated users can upload
CREATE POLICY "Authenticated users can upload videos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'videos');

-- Anyone can view public videos
CREATE POLICY "Public video access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'videos');

-- Users can delete their own videos
CREATE POLICY "Users can delete own videos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'videos' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Create storage bucket for thumbnails
INSERT INTO storage.buckets (id, name, public)
VALUES ('thumbnails', 'thumbnails', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Authenticated users can upload thumbnails"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'thumbnails');

CREATE POLICY "Public thumbnail access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'thumbnails');

-- Index for visibility filtering
CREATE INDEX IF NOT EXISTS idx_videos_is_public ON public.videos(is_public);
