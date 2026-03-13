-- ============================================
-- V4: Challenges
-- Un tournoi contient plusieurs défis
-- ============================================

CREATE TABLE public.challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL REFERENCES public.group_tournaments(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  created_by UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Index pour performance
CREATE INDEX idx_challenges_tournament ON public.challenges(tournament_id);
CREATE INDEX idx_challenges_created_by ON public.challenges(created_by);

-- ============================================
-- RLS — Accès limité aux membres du groupe parent
-- On passe par group_tournaments pour remonter au group_id
-- ============================================
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view challenges of their group tournaments"
ON public.challenges FOR SELECT
TO authenticated
USING (
  tournament_id IN (
    SELECT gt.id
    FROM public.group_tournaments gt
    WHERE gt.group_id IN (
      SELECT group_id FROM public.group_members WHERE user_id = auth.uid()
    )
  )
);

CREATE POLICY "Members can create challenges in their group tournaments"
ON public.challenges FOR INSERT
TO authenticated
WITH CHECK (
  created_by = auth.uid()
  AND tournament_id IN (
    SELECT gt.id
    FROM public.group_tournaments gt
    WHERE gt.group_id IN (
      SELECT group_id FROM public.group_members WHERE user_id = auth.uid()
    )
  )
);

CREATE POLICY "Creator can update their challenge"
ON public.challenges FOR UPDATE
TO authenticated
USING (created_by = auth.uid());

CREATE POLICY "Creator can delete their challenge"
ON public.challenges FOR DELETE
TO authenticated
USING (created_by = auth.uid());
