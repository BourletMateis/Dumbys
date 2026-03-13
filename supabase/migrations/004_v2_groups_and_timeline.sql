Ex-- ============================================
-- DUMBAWARD V2 - Migration: Groups & Timeline
-- Run this in Supabase SQL Editor
-- ============================================

-- ============================================
-- 1. ENUM FOR GROUP STATUS
-- ============================================
CREATE TYPE public.group_status AS ENUM ('private', 'pending_public', 'approved_public');
CREATE TYPE public.group_role AS ENUM ('owner', 'admin', 'member');

-- ============================================
-- 2. GROUPS TABLE
-- ============================================
CREATE TABLE public.groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  owner_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  is_public BOOLEAN DEFAULT false NOT NULL,
  status public.group_status DEFAULT 'private' NOT NULL,
  invite_code TEXT UNIQUE DEFAULT substr(md5(random()::text), 1, 8),
  cover_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ============================================
-- 3. GROUP MEMBERS TABLE
-- ============================================
CREATE TABLE public.group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role public.group_role DEFAULT 'member' NOT NULL,
  joined_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE (group_id, user_id)
);

-- ============================================
-- 4. UPDATE VIDEOS TABLE
-- ============================================
-- Add group_id (nullable for now, will be required after code migration)
ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE;

-- Add week/year tracking for timeline
ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS week_number INT;
ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS year INT;

-- ============================================
-- 5. WEEKLY VOTES TABLE (replaces tournament voting)
-- ============================================
CREATE TABLE public.weekly_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  voter_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  video_id UUID NOT NULL REFERENCES public.videos(id) ON DELETE CASCADE,
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  week_number INT NOT NULL,
  year INT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  -- Each user can only vote once per group per week
  UNIQUE (voter_id, group_id, week_number, year)
);

-- ============================================
-- 6. WEEKLY PODIUM TABLE (stores winners)
-- ============================================
CREATE TABLE public.weekly_podium (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  video_id UUID NOT NULL REFERENCES public.videos(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  week_number INT NOT NULL,
  year INT NOT NULL,
  rank INT NOT NULL CHECK (rank BETWEEN 1 AND 3),
  vote_count INT DEFAULT 0 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE (group_id, week_number, year, rank)
);

-- ============================================
-- 7. STORAGE BUCKET FOR GROUP VIDEOS
-- ============================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('group_videos', 'group_videos', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 8. INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_groups_owner ON public.groups(owner_id);
CREATE INDEX IF NOT EXISTS idx_group_members_group ON public.group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user ON public.group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_videos_group ON public.videos(group_id);
CREATE INDEX IF NOT EXISTS idx_videos_week ON public.videos(week_number, year);
CREATE INDEX IF NOT EXISTS idx_weekly_votes_group_week ON public.weekly_votes(group_id, week_number, year);
CREATE INDEX IF NOT EXISTS idx_weekly_podium_group_week ON public.weekly_podium(group_id, week_number, year);

-- ============================================
-- 9. RLS POLICIES
-- ============================================

-- Groups
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public groups are viewable by everyone"
ON public.groups FOR SELECT
USING (is_public = true AND status = 'approved_public');

CREATE POLICY "Members can view their groups"
ON public.groups FOR SELECT
TO authenticated
USING (
  id IN (SELECT group_id FROM public.group_members WHERE user_id = auth.uid())
);

CREATE POLICY "Authenticated users can create groups"
ON public.groups FOR INSERT
TO authenticated
WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Owners can update their groups"
ON public.groups FOR UPDATE
TO authenticated
USING (owner_id = auth.uid());

CREATE POLICY "Owners can delete their groups"
ON public.groups FOR DELETE
TO authenticated
USING (owner_id = auth.uid());

-- Group Members
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view group members"
ON public.group_members FOR SELECT
TO authenticated
USING (
  group_id IN (SELECT group_id FROM public.group_members WHERE user_id = auth.uid())
);

CREATE POLICY "Group owners/admins can add members"
ON public.group_members FOR INSERT
TO authenticated
WITH CHECK (
  group_id IN (
    SELECT group_id FROM public.group_members
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  )
  OR user_id = auth.uid() -- users can join via invite
);

CREATE POLICY "Members can leave groups"
ON public.group_members FOR DELETE
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Owners can remove members"
ON public.group_members FOR DELETE
TO authenticated
USING (
  group_id IN (
    SELECT group_id FROM public.group_members
    WHERE user_id = auth.uid() AND role = 'owner'
  )
);

-- Weekly Votes
ALTER TABLE public.weekly_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view votes in their groups"
ON public.weekly_votes FOR SELECT
TO authenticated
USING (
  group_id IN (SELECT group_id FROM public.group_members WHERE user_id = auth.uid())
);

CREATE POLICY "Members can vote in their groups"
ON public.weekly_votes FOR INSERT
TO authenticated
WITH CHECK (
  voter_id = auth.uid()
  AND group_id IN (SELECT group_id FROM public.group_members WHERE user_id = auth.uid())
);

CREATE POLICY "Users can delete their own votes"
ON public.weekly_votes FOR DELETE
TO authenticated
USING (voter_id = auth.uid());

-- Weekly Podium
ALTER TABLE public.weekly_podium ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view podium"
ON public.weekly_podium FOR SELECT
TO authenticated
USING (
  group_id IN (SELECT group_id FROM public.group_members WHERE user_id = auth.uid())
);

-- Storage policies for group_videos bucket
CREATE POLICY "Authenticated users can upload group videos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'group_videos');

CREATE POLICY "Public group video access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'group_videos');

CREATE POLICY "Users can delete own group videos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'group_videos' AND (storage.foldername(name))[1] = auth.uid()::text);

-- ============================================
-- 10. AUTO-ADD OWNER AS MEMBER ON GROUP CREATE
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_group()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.group_members (group_id, user_id, role)
  VALUES (NEW.id, NEW.owner_id, 'owner');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_group_created
  AFTER INSERT ON public.groups
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_group();

-- ============================================
-- 11. HELPER: Get current week number (ISO)
-- ============================================
CREATE OR REPLACE FUNCTION public.current_week_number()
RETURNS INT AS $$
  SELECT EXTRACT(WEEK FROM now())::INT;
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION public.current_year()
RETURNS INT AS $$
  SELECT EXTRACT(YEAR FROM now())::INT;
$$ LANGUAGE sql STABLE;
