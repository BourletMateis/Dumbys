-- ============================================
-- Fix challenges RLS policies to use group_id
-- (was using tournament_id which is no longer relevant)
-- ============================================

DROP POLICY IF EXISTS "Members can create challenges in their group tournaments" ON public.challenges;
DROP POLICY IF EXISTS "Members can view challenges of their group tournaments" ON public.challenges;
DROP POLICY IF EXISTS "Creator can update their challenge" ON public.challenges;
DROP POLICY IF EXISTS "Creator can delete their challenge" ON public.challenges;

CREATE POLICY "Members can view challenges"
ON public.challenges FOR SELECT
TO authenticated
USING (
  group_id IN (
    SELECT group_id FROM public.group_members WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Members can create challenges"
ON public.challenges FOR INSERT
TO authenticated
WITH CHECK (
  created_by = auth.uid()
  AND group_id IN (
    SELECT group_id FROM public.group_members WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Creator can update challenge"
ON public.challenges FOR UPDATE
TO authenticated
USING (created_by = auth.uid());

CREATE POLICY "Creator can delete challenge"
ON public.challenges FOR DELETE
TO authenticated
USING (created_by = auth.uid());
