-- ============================================
-- RLS Policies for DumbAward
-- Run this in Supabase SQL Editor
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hall_of_fame ENABLE ROW LEVEL SECURITY;

-- ============================================
-- USERS
-- ============================================
CREATE POLICY "Users are viewable by everyone"
  ON public.users FOR SELECT
  USING (true);

CREATE POLICY "Users can update their own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Insert is handled by the trigger (002), not by the client directly.

-- ============================================
-- FRIENDSHIPS
-- ============================================
CREATE POLICY "Users can view their own friendships"
  ON public.friendships FOR SELECT
  USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

CREATE POLICY "Users can send friend requests"
  ON public.friendships FOR INSERT
  WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "Users can update friendships addressed to them"
  ON public.friendships FOR UPDATE
  USING (auth.uid() = addressee_id)
  WITH CHECK (auth.uid() = addressee_id);

CREATE POLICY "Users can delete their own friendships"
  ON public.friendships FOR DELETE
  USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

-- ============================================
-- CATEGORIES
-- ============================================
CREATE POLICY "Categories are viewable by everyone"
  ON public.categories FOR SELECT
  USING (true);

-- Insert/Update/Delete managed by admin via Supabase dashboard or service_role key.

-- ============================================
-- VIDEOS
-- ============================================
CREATE POLICY "Videos are viewable by everyone"
  ON public.videos FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can submit videos"
  ON public.videos FOR INSERT
  WITH CHECK (auth.uid() = submitter_id);

CREATE POLICY "Users can update their own videos"
  ON public.videos FOR UPDATE
  USING (auth.uid() = submitter_id)
  WITH CHECK (auth.uid() = submitter_id);

CREATE POLICY "Users can delete their own videos"
  ON public.videos FOR DELETE
  USING (auth.uid() = submitter_id);

-- ============================================
-- REACTIONS
-- ============================================
CREATE POLICY "Reactions are viewable by everyone"
  ON public.reactions FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can add reactions"
  ON public.reactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reactions"
  ON public.reactions FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- TOURNAMENTS
-- ============================================
CREATE POLICY "Tournaments are viewable by everyone"
  ON public.tournaments FOR SELECT
  USING (true);

-- Managed by admin / Edge Functions with service_role key.

-- ============================================
-- MATCHES
-- ============================================
CREATE POLICY "Matches are viewable by everyone"
  ON public.matches FOR SELECT
  USING (true);

-- Managed by admin / Edge Functions with service_role key.

-- ============================================
-- MATCH_VOTES
-- ============================================
CREATE POLICY "Users can view their own votes"
  ON public.match_votes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can cast votes"
  ON public.match_votes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- No UPDATE or DELETE: votes are final.

-- ============================================
-- HALL OF FAME
-- ============================================
CREATE POLICY "Users can view their own hall of fame"
  ON public.hall_of_fame FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert into their hall of fame"
  ON public.hall_of_fame FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- No UPDATE or DELETE: hall of fame entries are permanent.
