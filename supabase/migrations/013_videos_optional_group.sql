-- ============================================
-- V5: Rendre group_id / week_number / year optionnels
-- Permet d'insérer des vidéos liées à un défi de tournoi
-- sans group_id ni semaine (ces champs n'ont pas de sens pour les vidéos de défis)
-- ============================================

ALTER TABLE public.videos
  ALTER COLUMN group_id    DROP NOT NULL,
  ALTER COLUMN week_number DROP NOT NULL,
  ALTER COLUMN year        DROP NOT NULL;
