-- Groups can now request to become public.
-- status values:
--   'private'         — normal private group
--   'pending_public'  — owner requested public, waiting for admin approval
--   'approved_public' — admin approved, group is public
--   'rejected_public' — admin rejected the request

-- Add 'rejected_public' to the existing group_status enum
ALTER TYPE public.group_status ADD VALUE IF NOT EXISTS 'rejected_public';

-- Add public_request_reason for the owner to explain why they want it public
ALTER TABLE groups
  ADD COLUMN IF NOT EXISTS public_request_reason text,
  ADD COLUMN IF NOT EXISTS public_request_at      timestamptz;

-- Trigger: when status flips to 'approved_public', set is_public = true
-- When status flips to 'rejected_public', keep is_public = false
CREATE OR REPLACE FUNCTION handle_group_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'approved_public' AND OLD.status != 'approved_public' THEN
    NEW.is_public := true;
  END IF;

  IF NEW.status = 'rejected_public' AND OLD.status = 'pending_public' THEN
    NEW.is_public := false;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_group_status_change ON groups;
CREATE TRIGGER on_group_status_change
  BEFORE UPDATE OF status ON groups
  FOR EACH ROW
  EXECUTE FUNCTION handle_group_status_change();

-- Index for admin to quickly find pending requests
CREATE INDEX IF NOT EXISTS groups_pending_public_idx ON groups (status)
  WHERE status = 'pending_public';
