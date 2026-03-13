-- ============================================
-- DUMBAWARD - Migration: Public Categories
-- ============================================

-- 1. Add category column to groups
ALTER TABLE public.groups ADD COLUMN IF NOT EXISTS category TEXT;

-- 2. Index for browsing public groups by category
CREATE INDEX IF NOT EXISTS idx_groups_public_category
ON public.groups(category) WHERE is_public = true;

CREATE INDEX IF NOT EXISTS idx_groups_public
ON public.groups(is_public) WHERE is_public = true;

-- ============================================
-- SECURITY DEFINER helper functions
-- These bypass RLS to avoid circular policy references
-- ============================================

-- Check if a group is public (bypasses groups RLS)
CREATE OR REPLACE FUNCTION public.is_public_group(gid UUID)
RETURNS BOOLEAN AS $$
  SELECT COALESCE(
    (SELECT is_public FROM public.groups WHERE id = gid),
    false
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Check if a user is member of a group (bypasses group_members RLS)
CREATE OR REPLACE FUNCTION public.is_group_member(gid UUID, uid UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS(
    SELECT 1 FROM public.group_members WHERE group_id = gid AND user_id = uid
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Get all group_ids for a user (bypasses group_members RLS)
CREATE OR REPLACE FUNCTION public.user_group_ids(uid UUID)
RETURNS SETOF UUID AS $$
  SELECT group_id FROM public.group_members WHERE user_id = uid;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ============================================
-- GROUPS policies (no cross-table RLS triggers)
-- ============================================
DROP POLICY IF EXISTS "Public groups are viewable by everyone" ON public.groups;
DROP POLICY IF EXISTS "Members can view their groups" ON public.groups;
DROP POLICY IF EXISTS "Owners can always view own groups" ON public.groups;

-- Public groups: simple column check, no subquery
CREATE POLICY "Public groups are viewable by everyone"
ON public.groups FOR SELECT
USING (is_public = true);

-- Owner always sees their own group (needed for INSERT...RETURNING before trigger fires)
CREATE POLICY "Owners can always view own groups"
ON public.groups FOR SELECT
TO authenticated
USING (owner_id = auth.uid());

-- Member groups: uses security definer function to avoid triggering group_members RLS
CREATE POLICY "Members can view their groups"
ON public.groups FOR SELECT
TO authenticated
USING (public.is_group_member(id, auth.uid()));

-- ============================================
-- GROUP_MEMBERS policies
-- ============================================
DROP POLICY IF EXISTS "Members can view group members" ON public.group_members;
DROP POLICY IF EXISTS "Anyone can view members of public groups or own groups" ON public.group_members;

-- Uses security definer functions only — no direct subqueries on RLS-protected tables
CREATE POLICY "Anyone can view members of public groups or own groups"
ON public.group_members FOR SELECT
TO authenticated
USING (
  public.is_public_group(group_id)
  OR public.is_group_member(group_id, auth.uid())
);

DROP POLICY IF EXISTS "Group owners/admins can add members" ON public.group_members;
DROP POLICY IF EXISTS "Users can join groups" ON public.group_members;

CREATE POLICY "Users can join groups"
ON public.group_members FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid()
);

-- ============================================
-- WEEKLY_VOTES policies
-- ============================================
DROP POLICY IF EXISTS "Members can view votes in their groups" ON public.weekly_votes;
DROP POLICY IF EXISTS "Can view votes in own or public groups" ON public.weekly_votes;

CREATE POLICY "Can view votes in own or public groups"
ON public.weekly_votes FOR SELECT
TO authenticated
USING (
  public.is_group_member(group_id, auth.uid())
  OR public.is_public_group(group_id)
);

-- ============================================
-- WEEKLY_PODIUM policies
-- ============================================
DROP POLICY IF EXISTS "Everyone can view podium" ON public.weekly_podium;
DROP POLICY IF EXISTS "Can view podium in own or public groups" ON public.weekly_podium;

CREATE POLICY "Can view podium in own or public groups"
ON public.weekly_podium FOR SELECT
TO authenticated
USING (
  public.is_group_member(group_id, auth.uid())
  OR public.is_public_group(group_id)
);
