-- Add timer control fields and switch sides field to the games table
-- Run this SQL in your Supabase SQL Editor or database management tool

ALTER TABLE games 
ADD COLUMN IF NOT EXISTS timer_started_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS timer_paused_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS timer_total_paused_time BIGINT DEFAULT 0,
ADD COLUMN IF NOT EXISTS switch_sides_interval INTEGER;

-- Add comments to document the new fields
COMMENT ON COLUMN games.timer_started_at IS 'Timestamp when the manual timer was started (separate from game creation)';
COMMENT ON COLUMN games.timer_paused_at IS 'Timestamp when the timer was paused (null if running)';
COMMENT ON COLUMN games.timer_total_paused_time IS 'Accumulated paused time in milliseconds';
COMMENT ON COLUMN games.switch_sides_interval IS 'Points interval for switch sides reminder (5, 7, or null for off)';

-- Optional: Add an index on timer_started_at if you plan to query by it frequently
CREATE INDEX IF NOT EXISTS idx_games_timer_started_at ON games(timer_started_at);