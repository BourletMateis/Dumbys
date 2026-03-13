-- Add title and description columns to videos
ALTER TABLE videos ADD COLUMN IF NOT EXISTS title text;
ALTER TABLE videos ADD COLUMN IF NOT EXISTS description text;
