-- Premier League Database Schema for 2025/2026 Season
-- Run this in your Supabase SQL Editor
-- This migration creates all necessary tables for the Premier League tracker

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Clubs table (reference data for teams)
CREATE TABLE IF NOT EXISTS clubs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    short_name VARCHAR(50),
    primary_color VARCHAR(7), -- hex color code
    secondary_color VARCHAR(7),
    text_color VARCHAR(7),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Fixtures table (all matches: scheduled, live, finished)
CREATE TABLE IF NOT EXISTS fixtures (
    id VARCHAR(100) PRIMARY KEY, -- composite key: homeTeam-awayTeam-date-matchweek
    date TIMESTAMP WITH TIME ZONE NOT NULL,
    home_team VARCHAR(100) NOT NULL,
    away_team VARCHAR(100) NOT NULL,
    home_score INTEGER,
    away_score INTEGER,
    matchweek INTEGER NOT NULL CHECK (matchweek >= 1 AND matchweek <= 38),
    status VARCHAR(20) NOT NULL CHECK (status IN ('scheduled', 'live', 'finished')),
    is_derby BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Ensure no duplicate matches on same date
    UNIQUE(home_team, away_team, date)
);

-- Standings table (league table)
CREATE TABLE IF NOT EXISTS standings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    position INTEGER NOT NULL CHECK (position >= 1 AND position <= 20),
    club VARCHAR(100) NOT NULL,
    played INTEGER NOT NULL DEFAULT 0,
    won INTEGER NOT NULL DEFAULT 0,
    drawn INTEGER NOT NULL DEFAULT 0,
    lost INTEGER NOT NULL DEFAULT 0,
    goals_for INTEGER NOT NULL DEFAULT 0,
    goals_against INTEGER NOT NULL DEFAULT 0,
    goal_difference INTEGER NOT NULL DEFAULT 0,
    points INTEGER NOT NULL DEFAULT 0,
    form VARCHAR(10), -- e.g., "WWDLWD"
    season VARCHAR(20) NOT NULL DEFAULT '2025/2026',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Only one entry per club per season
    UNIQUE(club, season)
);

-- Scorers table (top goal scorers)
CREATE TABLE IF NOT EXISTS scorers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    club VARCHAR(100) NOT NULL,
    goals INTEGER NOT NULL DEFAULT 0,
    assists INTEGER NOT NULL DEFAULT 0,
    season VARCHAR(20) NOT NULL DEFAULT '2025/2026',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Cache metadata table (to track when data was last updated)
CREATE TABLE IF NOT EXISTS cache_metadata (
    key VARCHAR(50) PRIMARY KEY,
    last_updated TIMESTAMP WITH TIME ZONE NOT NULL,
    data_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert clubs for 2025/2026 season
-- Updated based on current Premier League teams
INSERT INTO clubs (name, short_name, primary_color, secondary_color, text_color) VALUES
('Arsenal', 'ARS', '#EF0107', '#FFFFFF', '#000000'),
('Aston Villa', 'AVL', '#670E36', '#95BFE5', '#FFFFFF'),
('AFC Bournemouth', 'BOU', '#DA030E', '#000000', '#FFFFFF'),
('Brentford', 'BRE', '#E30613', '#FFFFFF', '#000000'),
('Brighton & Hove Albion', 'BHA', '#0057B8', '#FFFFFF', '#FFFFFF'),
('Burnley', 'BUR', '#6C1D45', '#99D6EA', '#FFFFFF'),
('Chelsea', 'CHE', '#034694', '#FFFFFF', '#FFFFFF'),
('Crystal Palace', 'CRY', '#1B458F', '#C4122E', '#FFFFFF'),
('Everton', 'EVE', '#003399', '#FFFFFF', '#FFFFFF'),
('Fulham', 'FUL', '#FFFFFF', '#000000', '#000000'),
('Leeds United', 'LEE', '#FFFFFF', '#1D428A', '#000000'),
('Liverpool FC', 'LIV', '#C8102E', '#FFFFFF', '#FFFFFF'),
('Manchester City', 'MCI', '#6CABDD', '#1C2C5B', '#FFFFFF'),
('Manchester United', 'MUN', '#DA291C', '#FBE122', '#000000'),
('Newcastle United', 'NEW', '#241F20', '#FFFFFF', '#FFFFFF'),
('Nottingham Forest', 'NFO', '#DD0000', '#FFFFFF', '#000000'),
('Sunderland', 'SUN', '#EB172B', '#FFFFFF', '#000000'),
('Tottenham Hotspur', 'TOT', '#132257', '#FFFFFF', '#FFFFFF'),
('West Ham United', 'WHU', '#7A263A', '#1BB1E7', '#FFFFFF'),
('Wolverhampton Wanderers', 'WOL', '#FDB913', '#000000', '#000000')
ON CONFLICT (name) DO UPDATE SET
    short_name = EXCLUDED.short_name,
    primary_color = EXCLUDED.primary_color,
    secondary_color = EXCLUDED.secondary_color,
    text_color = EXCLUDED.text_color,
    updated_at = NOW();

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_fixtures_date ON fixtures (date);
CREATE INDEX IF NOT EXISTS idx_fixtures_matchweek ON fixtures (matchweek);
CREATE INDEX IF NOT EXISTS idx_fixtures_status ON fixtures (status);
CREATE INDEX IF NOT EXISTS idx_fixtures_home_team ON fixtures (home_team);
CREATE INDEX IF NOT EXISTS idx_fixtures_away_team ON fixtures (away_team);
CREATE INDEX IF NOT EXISTS idx_standings_position ON standings (position);
CREATE INDEX IF NOT EXISTS idx_standings_season ON standings (season);
CREATE INDEX IF NOT EXISTS idx_scorers_goals ON scorers (goals DESC);
CREATE INDEX IF NOT EXISTS idx_scorers_season ON scorers (season);

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql' SET search_path = '';

-- Drop existing triggers if they exist (to avoid conflicts)
DROP TRIGGER IF EXISTS update_fixtures_updated_at ON fixtures;
DROP TRIGGER IF EXISTS update_standings_updated_at ON standings;
DROP TRIGGER IF EXISTS update_scorers_updated_at ON scorers;
DROP TRIGGER IF EXISTS update_clubs_updated_at ON clubs;
DROP TRIGGER IF EXISTS update_cache_metadata_updated_at ON cache_metadata;

-- Create triggers to automatically update updated_at
CREATE TRIGGER update_fixtures_updated_at BEFORE UPDATE ON fixtures FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_standings_updated_at BEFORE UPDATE ON standings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_scorers_updated_at BEFORE UPDATE ON scorers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_clubs_updated_at BEFORE UPDATE ON clubs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_cache_metadata_updated_at BEFORE UPDATE ON cache_metadata FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert initial cache metadata
INSERT INTO cache_metadata (key, last_updated, data_count) VALUES
('fixtures', NOW(), 0),
('standings', NOW(), 0),
('scorers', NOW(), 0)
ON CONFLICT (key) DO NOTHING;

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE fixtures ENABLE ROW LEVEL SECURITY;
ALTER TABLE standings ENABLE ROW LEVEL SECURITY;
ALTER TABLE scorers ENABLE ROW LEVEL SECURITY;
ALTER TABLE cache_metadata ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Allow public read access on clubs" ON clubs;
DROP POLICY IF EXISTS "Allow public read access on fixtures" ON fixtures;
DROP POLICY IF EXISTS "Allow public read access on standings" ON standings;
DROP POLICY IF EXISTS "Allow public read access on scorers" ON scorers;
DROP POLICY IF EXISTS "Allow public read access on cache_metadata" ON cache_metadata;
DROP POLICY IF EXISTS "Allow authenticated insert on fixtures" ON fixtures;
DROP POLICY IF EXISTS "Allow authenticated update on fixtures" ON fixtures;
DROP POLICY IF EXISTS "Allow authenticated insert on standings" ON standings;
DROP POLICY IF EXISTS "Allow authenticated update on standings" ON standings;
DROP POLICY IF EXISTS "Allow authenticated insert on scorers" ON scorers;
DROP POLICY IF EXISTS "Allow authenticated update on scorers" ON scorers;
DROP POLICY IF EXISTS "Allow authenticated insert on cache_metadata" ON cache_metadata;
DROP POLICY IF EXISTS "Allow authenticated update on cache_metadata" ON cache_metadata;
DROP POLICY IF EXISTS "Allow authenticated delete on standings" ON standings;
DROP POLICY IF EXISTS "Allow authenticated delete on scorers" ON scorers;
DROP POLICY IF EXISTS "Allow authenticated delete on cache_metadata" ON cache_metadata;

-- Create policies for public read access (since this is a public app)
-- Allow everyone to read all data
CREATE POLICY "Allow public read access on clubs" ON clubs FOR SELECT USING (true);
CREATE POLICY "Allow public read access on fixtures" ON fixtures FOR SELECT USING (true);
CREATE POLICY "Allow public read access on standings" ON standings FOR SELECT USING (true);
CREATE POLICY "Allow public read access on scorers" ON scorers FOR SELECT USING (true);
CREATE POLICY "Allow public read access on cache_metadata" ON cache_metadata FOR SELECT USING (true);

-- Allow service role (server-side) to insert/update data (for the refresh endpoint)
-- This allows the API routes to modify data using service role key
CREATE POLICY "Allow service role insert on fixtures" ON fixtures FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow service role update on fixtures" ON fixtures FOR UPDATE USING (true);
CREATE POLICY "Allow service role insert on standings" ON standings FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow service role update on standings" ON standings FOR UPDATE USING (true);
CREATE POLICY "Allow service role insert on scorers" ON scorers FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow service role update on scorers" ON scorers FOR UPDATE USING (true);
CREATE POLICY "Allow service role insert on cache_metadata" ON cache_metadata FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow service role update on cache_metadata" ON cache_metadata FOR UPDATE USING (true);
CREATE POLICY "Allow service role delete on standings" ON standings FOR DELETE USING (true);
CREATE POLICY "Allow service role delete on scorers" ON scorers FOR DELETE USING (true);
CREATE POLICY "Allow service role delete on cache_metadata" ON cache_metadata FOR DELETE USING (true);
