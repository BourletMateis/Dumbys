-- ============================================
-- DUMBAWARD - Migration: Follows system
-- ============================================

-- 1. Follows table
CREATE TABLE IF NOT EXISTS public.follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE (follower_id, following_id),
  CHECK (follower_id != following_id)
);

-- 2. Indexes
CREATE INDEX IF NOT EXISTS idx_follows_follower ON public.follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following ON public.follows(following_id);

-- 3. RLS
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view follows"
ON public.follows FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can follow others"
ON public.follows FOR INSERT
TO authenticated
WITH CHECK (follower_id = auth.uid());

CREATE POLICY "Users can unfollow"
ON public.follows FOR DELETE
TO authenticated
USING (follower_id = auth.uid());
