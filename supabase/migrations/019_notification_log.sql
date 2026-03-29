-- 019_notification_log.sql
-- Table pour stocker l'historique des notifications reçues par chaque user

CREATE TABLE IF NOT EXISTS notification_log (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  body        TEXT,
  type        TEXT,           -- 'vote_reminder' | 'podium' | 'friend_request' | 'new_video' | ...
  read        BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS notification_log_user_id_created_at
  ON notification_log (user_id, created_at DESC);

-- RLS
ALTER TABLE notification_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own notifications" ON notification_log;
CREATE POLICY "Users read own notifications"
  ON notification_log FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users update own notifications" ON notification_log;
CREATE POLICY "Users update own notifications"
  ON notification_log FOR UPDATE
  USING (auth.uid() = user_id);

-- Service role peut insérer (Edge Functions)
DROP POLICY IF EXISTS "Service role insert notifications" ON notification_log;
CREATE POLICY "Service role insert notifications"
  ON notification_log FOR INSERT
  WITH CHECK (true);
