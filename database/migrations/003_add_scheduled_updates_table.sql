-- Migration: Add scheduled_updates table for calendar-based update scheduling
-- This table stores pre-calculated update times based on fixtures calendar
-- The schedule-updates function runs daily to populate this table

CREATE TABLE IF NOT EXISTS scheduled_updates (
    match_id VARCHAR(100) PRIMARY KEY,
    update_time TIMESTAMP WITH TIME ZONE NOT NULL,
    home_team VARCHAR(100) NOT NULL,
    away_team VARCHAR(100) NOT NULL,
    match_start TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Foreign key to fixtures table
    CONSTRAINT fk_match FOREIGN KEY (match_id) REFERENCES fixtures(id) ON DELETE CASCADE
);

-- Index for fast lookups by update time
CREATE INDEX IF NOT EXISTS idx_scheduled_updates_time ON scheduled_updates(update_time);

-- Index for cleanup queries
CREATE INDEX IF NOT EXISTS idx_scheduled_updates_match_start ON scheduled_updates(match_start);

-- Enable Row Level Security
ALTER TABLE scheduled_updates ENABLE ROW LEVEL SECURITY;

-- Allow service role to manage scheduled updates
DROP POLICY IF EXISTS "Allow service role access on scheduled_updates" ON scheduled_updates;
CREATE POLICY "Allow service role access on scheduled_updates" ON scheduled_updates
    FOR ALL USING (true);

-- Allow public read access (for debugging/monitoring)
DROP POLICY IF EXISTS "Allow public read access on scheduled_updates" ON scheduled_updates;
CREATE POLICY "Allow public read access on scheduled_updates" ON scheduled_updates
    FOR SELECT USING (true);

-- Comment explaining the table
COMMENT ON TABLE scheduled_updates IS 'Stores pre-calculated update times for matches. Updated daily by schedule-updates function.';
