-- 015_push_notifications.sql
-- Ajoute le support push notifications (token + préférences)

-- Colonnes sur users
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS push_token TEXT,
  ADD COLUMN IF NOT EXISTS notifications_enabled BOOLEAN DEFAULT TRUE;

-- Table préférences granulaires par user
CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  vote_reminder BOOLEAN DEFAULT TRUE,
  podium_result BOOLEAN DEFAULT TRUE,
  new_video BOOLEAN DEFAULT TRUE,
  friend_request BOOLEAN DEFAULT TRUE,
  new_challenge BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- RLS
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own notification prefs" ON notification_preferences;
CREATE POLICY "Users manage own notification prefs"
  ON notification_preferences
  FOR ALL
  USING (auth.uid() = user_id);

-- Trigger : créer les prefs par défaut automatiquement à l'inscription
CREATE OR REPLACE FUNCTION handle_new_user_notifications()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO notification_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_user_created_notifications ON users;
CREATE TRIGGER on_user_created_notifications
  AFTER INSERT ON users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user_notifications();

-- Rétrospectivement créer les prefs pour les users existants
INSERT INTO notification_preferences (user_id)
SELECT id FROM users
ON CONFLICT (user_id) DO NOTHING;
