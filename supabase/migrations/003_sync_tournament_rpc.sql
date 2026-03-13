-- ============================================
-- RPC: Sync tournament results atomically
-- Inserts all match_votes + hall_of_fame in one transaction
-- Run this in Supabase SQL Editor
-- ============================================

CREATE OR REPLACE FUNCTION public.sync_tournament_results(
  p_votes JSONB,
  p_hall_of_fame JSONB
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Insert match votes (skip duplicates via ON CONFLICT)
  INSERT INTO public.match_votes (user_id, match_id, voted_video_id)
  SELECT
    (v->>'user_id')::uuid,
    (v->>'match_id')::uuid,
    (v->>'voted_video_id')::uuid
  FROM jsonb_array_elements(p_votes) AS v
  ON CONFLICT (user_id, match_id) DO NOTHING;

  -- Insert hall of fame entries
  INSERT INTO public.hall_of_fame (user_id, tournament_id, category_id, winning_video_id)
  SELECT
    (h->>'user_id')::uuid,
    (h->>'tournament_id')::uuid,
    (h->>'category_id')::uuid,
    (h->>'winning_video_id')::uuid
  FROM jsonb_array_elements(p_hall_of_fame) AS h;
END;
$$;
