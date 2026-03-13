-- ============================================
-- V4: Group Tournaments
-- Séparation claire Group → Tournament → Challenge → Video
-- ============================================

-- ============================================
-- 1. TABLE group_tournaments
-- Un groupe peut contenir plusieurs tournois
-- ============================================
CREATE TABLE public.group_tournaments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  reward TEXT,
  created_by UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Index pour performance
CREATE INDEX idx_group_tournaments_group ON public.group_tournaments(group_id);
CREATE INDEX idx_group_tournaments_created_by ON public.group_tournaments(created_by);

-- ============================================
-- 2. RLS — Seuls les membres du groupe voient ses tournois
-- ============================================
ALTER TABLE public.group_tournaments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view group tournaments"
ON public.group_tournaments FOR SELECT
TO authenticated
USING (
  group_id IN (
    SELECT group_id FROM public.group_members WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Members can create tournaments in their group"
ON public.group_tournaments FOR INSERT
TO authenticated
WITH CHECK (
  created_by = auth.uid()
  AND group_id IN (
    SELECT group_id FROM public.group_members WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Creator can update their tournament"
ON public.group_tournaments FOR UPDATE
TO authenticated
USING (created_by = auth.uid());

CREATE POLICY "Creator can delete their tournament"
ON public.group_tournaments FOR DELETE
TO authenticated
USING (created_by = auth.uid());
