-- ============================================================
-- Flatten tournaments: challenges now belong directly to groups
-- ============================================================

-- Step 1: Add group_id column to challenges
ALTER TABLE public.challenges
  ADD COLUMN IF NOT EXISTS group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE;

-- Step 2: Backfill group_id from group_tournaments
UPDATE public.challenges c
SET group_id = gt.group_id
FROM public.group_tournaments gt
WHERE c.tournament_id = gt.id
  AND c.group_id IS NULL;

-- Step 3: Make group_id NOT NULL
ALTER TABLE public.challenges
  ALTER COLUMN group_id SET NOT NULL;

-- Step 4: Make tournament_id nullable (transition period)
ALTER TABLE public.challenges
  ALTER COLUMN tournament_id DROP NOT NULL;

-- Step 5: Index
CREATE INDEX IF NOT EXISTS idx_challenges_group ON public.challenges(group_id);

-- Step 6: Update RLS policies
-- Drop old tournament-based policies if they exist
DROP POLICY IF EXISTS "Members can view challenges" ON public.challenges;
DROP POLICY IF EXISTS "Members can create challenges" ON public.challenges;
DROP POLICY IF EXISTS "Members can delete own challenges" ON public.challenges;
DROP POLICY IF EXISTS "Anyone can view challenges" ON public.challenges;

-- New group-based policies
CREATE POLICY "View group challenges"
  ON public.challenges FOR SELECT TO authenticated
  USING (
    group_id IN (SELECT group_id FROM public.group_members WHERE user_id = auth.uid())
    OR group_id IN (SELECT id FROM public.groups WHERE is_public = true)
  );

CREATE POLICY "Create group challenges"
  ON public.challenges FOR INSERT TO authenticated
  WITH CHECK (
    created_by = auth.uid()
    AND group_id IN (SELECT group_id FROM public.group_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Delete own challenges"
  ON public.challenges FOR DELETE TO authenticated
  USING (
    created_by = auth.uid()
    AND group_id IN (SELECT group_id FROM public.group_members WHERE user_id = auth.uid())
  );
