-- 017_profile_stats.sql
-- Vue pour les stats de profil : victoires podium + count vidéos

CREATE OR REPLACE VIEW user_podium_wins AS
SELECT
  user_id,
  COUNT(*) AS win_count
FROM weekly_podium
WHERE rank = 1
GROUP BY user_id;

-- Stats complètes par user (utilisée dans l'en-tête profil)
CREATE OR REPLACE VIEW user_stats AS
SELECT
  u.id AS user_id,
  COUNT(DISTINCT v.id) AS video_count,
  COUNT(DISTINCT gm.group_id) AS group_count,
  COALESCE(w.win_count, 0) AS win_count
FROM users u
LEFT JOIN videos v ON v.submitter_id = u.id
LEFT JOIN group_members gm ON gm.user_id = u.id
LEFT JOIN user_podium_wins w ON w.user_id = u.id
GROUP BY u.id, w.win_count;
