-- ============================================
-- DumbAward - Table Creation
-- Run this FIRST in Supabase SQL Editor
-- ============================================

-- Enums
CREATE TYPE public.friendship_status AS ENUM ('pending', 'accepted');
CREATE TYPE public.tournament_type AS ENUM ('weekly', 'monthly', 'yearly');
CREATE TYPE public.tournament_status AS ENUM ('pending', 'active', 'closed');

-- ============================================
-- USERS
-- ============================================
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ============================================
-- FRIENDSHIPS
-- ============================================
CREATE TABLE public.friendships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  addressee_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  status public.friendship_status DEFAULT 'pending' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE (requester_id, addressee_id),
  CHECK (requester_id <> addressee_id)
);

-- ============================================
-- CATEGORIES
-- ============================================
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  icon_name TEXT NOT NULL
);

-- Seed default categories
INSERT INTO public.categories (slug, name, icon_name) VALUES
  ('cringe', 'Cringe', 'face-with-open-eyes-and-hand-over-mouth'),
  ('funny', 'Funny', 'face-with-tears-of-joy'),
  ('fail', 'Fail', 'person-facepalming'),
  ('wholesome', 'Wholesome', 'smiling-face-with-hearts'),
  ('unexpected', 'Unexpected', 'exploding-head');

-- ============================================
-- VIDEOS
-- ============================================
CREATE TABLE public.videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submitter_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  source_url TEXT NOT NULL,
  thumbnail_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ============================================
-- REACTIONS
-- ============================================
CREATE TABLE public.reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  video_id UUID NOT NULL REFERENCES public.videos(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL,
  UNIQUE (user_id, video_id, emoji)
);

-- ============================================
-- TOURNAMENTS
-- ============================================
CREATE TABLE public.tournaments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type public.tournament_type NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  status public.tournament_status DEFAULT 'pending' NOT NULL
);

-- ============================================
-- MATCHES
-- ============================================
CREATE TABLE public.matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  video_a_id UUID NOT NULL REFERENCES public.videos(id) ON DELETE CASCADE,
  video_b_id UUID NOT NULL REFERENCES public.videos(id) ON DELETE CASCADE,
  round_level INT NOT NULL
);

-- ============================================
-- MATCH VOTES
-- ============================================
CREATE TABLE public.match_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  voted_video_id UUID NOT NULL REFERENCES public.videos(id) ON DELETE CASCADE,
  UNIQUE (user_id, match_id)
);

-- ============================================
-- HALL OF FAME
-- ============================================
CREATE TABLE public.hall_of_fame (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  tournament_id UUID NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  winning_video_id UUID NOT NULL REFERENCES public.videos(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX idx_videos_submitter ON public.videos(submitter_id);
CREATE INDEX idx_videos_category ON public.videos(category_id);
CREATE INDEX idx_videos_created_at ON public.videos(created_at DESC);
CREATE INDEX idx_friendships_requester ON public.friendships(requester_id);
CREATE INDEX idx_friendships_addressee ON public.friendships(addressee_id);
CREATE INDEX idx_matches_tournament ON public.matches(tournament_id);
CREATE INDEX idx_match_votes_match ON public.match_votes(match_id);
CREATE INDEX idx_hall_of_fame_user ON public.hall_of_fame(user_id);
