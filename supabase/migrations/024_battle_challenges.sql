-- ============================================
-- V6: Battle Qualifié — challenge system
-- Phase 1: Soumission (likes)
-- Phase 2: Qualification automatique (top 4 ou 8)
-- Phase 3: Bracket head-to-head (rounds 24h)
-- Phase 4: Podium
-- ============================================

-- Ensure challenges has group_id (may have been added manually or via flatten migration)
ALTER TABLE public.challenges
  ADD COLUMN IF NOT EXISTS group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE;

-- Backfill group_id from group_tournaments if needed (for existing rows with tournament_id)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'challenges' AND column_name = 'tournament_id'
  ) THEN
    UPDATE public.challenges c
    SET group_id = gt.group_id
    FROM public.group_tournaments gt
    WHERE c.tournament_id = gt.id
      AND c.group_id IS NULL;
  END IF;
END $$;

-- Extend challenges table
ALTER TABLE public.challenges
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'qualifying', 'battle', 'ended')),
  ADD COLUMN IF NOT EXISTS submission_end TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS bracket_size INT NOT NULL DEFAULT 8
    CHECK (bracket_size IN (4, 8)),
  ADD COLUMN IF NOT EXISTS current_round INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS round_end TIMESTAMPTZ;

-- ============================================
-- Bracket matches table
-- Stores each match in each round of the bracket
-- ============================================
CREATE TABLE IF NOT EXISTS public.challenge_bracket_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id UUID NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  round INT NOT NULL,           -- 1 = quarter, 2 = semi, 3 = final
  match_index INT NOT NULL,     -- 0-based position in round
  video_a_id UUID REFERENCES public.videos(id) ON DELETE SET NULL,
  video_b_id UUID REFERENCES public.videos(id) ON DELETE SET NULL,
  winner_video_id UUID REFERENCES public.videos(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE (challenge_id, round, match_index)
);

CREATE INDEX IF NOT EXISTS idx_bracket_matches_challenge ON public.challenge_bracket_matches(challenge_id);

-- ============================================
-- Bracket votes table
-- One vote per user per match
-- ============================================
CREATE TABLE IF NOT EXISTS public.challenge_bracket_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id UUID NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  match_id UUID NOT NULL REFERENCES public.challenge_bracket_matches(id) ON DELETE CASCADE,
  voter_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  video_id UUID NOT NULL REFERENCES public.videos(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE (match_id, voter_id)   -- one vote per match per user
);

CREATE INDEX IF NOT EXISTS idx_bracket_votes_match ON public.challenge_bracket_votes(match_id);
CREATE INDEX IF NOT EXISTS idx_bracket_votes_voter ON public.challenge_bracket_votes(voter_id);

-- ============================================
-- RLS — challenge_bracket_matches
-- ============================================
ALTER TABLE public.challenge_bracket_matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view bracket matches"
ON public.challenge_bracket_matches FOR SELECT
TO authenticated
USING (
  challenge_id IN (
    SELECT c.id FROM public.challenges c
    WHERE c.group_id IN (
      SELECT group_id FROM public.group_members WHERE user_id = auth.uid()
    )
  )
);

CREATE POLICY "Service role can manage bracket matches"
ON public.challenge_bracket_matches FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================
-- RLS — challenge_bracket_votes
-- ============================================
ALTER TABLE public.challenge_bracket_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view bracket votes"
ON public.challenge_bracket_votes FOR SELECT
TO authenticated
USING (
  challenge_id IN (
    SELECT c.id FROM public.challenges c
    WHERE c.group_id IN (
      SELECT group_id FROM public.group_members WHERE user_id = auth.uid()
    )
  )
);

CREATE POLICY "Members can vote in bracket"
ON public.challenge_bracket_votes FOR INSERT
TO authenticated
WITH CHECK (
  voter_id = auth.uid()
  AND challenge_id IN (
    SELECT c.id FROM public.challenges c
    WHERE c.group_id IN (
      SELECT group_id FROM public.group_members WHERE user_id = auth.uid()
    )
  )
);

-- ============================================
-- RPC: start_qualifying — admin moves challenge to 'qualifying'
-- Then auto-generates round 1 bracket when moving to 'battle'
-- ============================================
CREATE OR REPLACE FUNCTION public.start_challenge_battle(p_challenge_id UUID, p_bracket_size INT DEFAULT 8)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_group_id UUID;
  v_top_videos UUID[];
  v_i INT;
  v_match_count INT;
  v_video_a UUID;
  v_video_b UUID;
BEGIN
  -- Get group_id and verify caller is admin/owner
  SELECT group_id INTO v_group_id FROM public.challenges WHERE id = p_challenge_id;

  IF NOT EXISTS (
    SELECT 1 FROM public.group_members
    WHERE group_id = v_group_id
      AND user_id = auth.uid()
      AND role IN ('owner', 'admin')
  ) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  -- Get top videos by likes count (submitted to this challenge)
  SELECT ARRAY(
    SELECT v.id
    FROM public.videos v
    LEFT JOIN public.reactions r ON r.video_id = v.id AND r.emoji = 'like'
    WHERE v.challenge_id = p_challenge_id
    GROUP BY v.id
    ORDER BY COUNT(r.id) DESC
    LIMIT p_bracket_size
  ) INTO v_top_videos;

  -- Pad with NULLs if fewer submissions than bracket_size (bye rounds)
  WHILE array_length(v_top_videos, 1) < p_bracket_size LOOP
    v_top_videos := v_top_videos || NULL::UUID;
  END LOOP;

  -- Update challenge status
  UPDATE public.challenges
  SET status = 'battle',
      bracket_size = p_bracket_size,
      current_round = 1,
      round_end = now() + interval '24 hours'
  WHERE id = p_challenge_id;

  -- Generate round 1 matches (seeded: 1 vs last, 2 vs second-to-last, ...)
  v_match_count := p_bracket_size / 2;
  FOR v_i IN 0..(v_match_count - 1) LOOP
    v_video_a := v_top_videos[v_i + 1];
    v_video_b := v_top_videos[p_bracket_size - v_i];

    INSERT INTO public.challenge_bracket_matches (challenge_id, round, match_index, video_a_id, video_b_id)
    VALUES (p_challenge_id, 1, v_i, v_video_a, v_video_b)
    ON CONFLICT (challenge_id, round, match_index) DO NOTHING;
  END LOOP;
END;
$$;

-- ============================================
-- RPC: advance_bracket_round — resolves current round and seeds next
-- ============================================
CREATE OR REPLACE FUNCTION public.advance_bracket_round(p_challenge_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_group_id UUID;
  v_current_round INT;
  v_match RECORD;
  v_winner UUID;
  v_winners UUID[] := '{}';
  v_i INT;
  v_next_round INT;
  v_match_count INT;
BEGIN
  SELECT group_id, current_round INTO v_group_id, v_current_round
  FROM public.challenges WHERE id = p_challenge_id;

  IF NOT EXISTS (
    SELECT 1 FROM public.group_members
    WHERE group_id = v_group_id
      AND user_id = auth.uid()
      AND role IN ('owner', 'admin')
  ) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  -- Resolve each match in current round by vote count
  FOR v_match IN
    SELECT * FROM public.challenge_bracket_matches
    WHERE challenge_id = p_challenge_id AND round = v_current_round
    ORDER BY match_index
  LOOP
    -- Count votes for each side
    SELECT video_id INTO v_winner
    FROM public.challenge_bracket_votes
    WHERE match_id = v_match.id
    GROUP BY video_id
    ORDER BY COUNT(*) DESC, RANDOM()  -- random tiebreak
    LIMIT 1;

    -- If no votes, pick video_a as winner (or handle bye)
    IF v_winner IS NULL THEN
      v_winner := COALESCE(v_match.video_a_id, v_match.video_b_id);
    END IF;

    -- Update match winner
    UPDATE public.challenge_bracket_matches
    SET winner_video_id = v_winner
    WHERE id = v_match.id;

    v_winners := v_winners || v_winner;
  END LOOP;

  -- If only 1 winner, challenge is ended (final resolved)
  IF array_length(v_winners, 1) = 1 THEN
    UPDATE public.challenges
    SET status = 'ended', current_round = v_current_round
    WHERE id = p_challenge_id;
    RETURN;
  END IF;

  -- Seed next round
  v_next_round := v_current_round + 1;
  v_match_count := array_length(v_winners, 1) / 2;

  FOR v_i IN 0..(v_match_count - 1) LOOP
    INSERT INTO public.challenge_bracket_matches (challenge_id, round, match_index, video_a_id, video_b_id)
    VALUES (p_challenge_id, v_next_round, v_i, v_winners[v_i * 2 + 1], v_winners[v_i * 2 + 2])
    ON CONFLICT (challenge_id, round, match_index) DO NOTHING;
  END LOOP;

  UPDATE public.challenges
  SET current_round = v_next_round,
      round_end = now() + interval '24 hours'
  WHERE id = p_challenge_id;
END;
$$;
