-- V3: Challenge enhancements
-- Add end_date, goal_description, prize, and type to groups
ALTER TABLE groups ADD COLUMN IF NOT EXISTS end_date timestamptz;
ALTER TABLE groups ADD COLUMN IF NOT EXISTS goal_description text;
ALTER TABLE groups ADD COLUMN IF NOT EXISTS prize text;
ALTER TABLE groups ADD COLUMN IF NOT EXISTS type text NOT NULL DEFAULT 'private';

-- Add role to users (admin vs regular user)
ALTER TABLE users ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'user';
