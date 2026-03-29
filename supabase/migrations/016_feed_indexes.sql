-- 016_feed_indexes.sql
-- Index de performance pour le Feed Home (groupes + amis + discover)

CREATE INDEX IF NOT EXISTS idx_videos_submitter_created
  ON videos (submitter_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_videos_group_week
  ON videos (group_id, week_number, year)
  WHERE group_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_friendships_accepted
  ON friendships (requester_id, addressee_id)
  WHERE status = 'accepted';

CREATE INDEX IF NOT EXISTS idx_videos_challenge_created
  ON videos (challenge_id, created_at DESC)
  WHERE challenge_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_videos_is_public
  ON videos (is_public, created_at DESC)
  WHERE is_public = TRUE;

CREATE INDEX IF NOT EXISTS idx_group_members_user
  ON group_members (user_id, group_id);
