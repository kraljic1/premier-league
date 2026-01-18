-- Migration: 008_add_competition_to_fixtures.sql
-- Description: Add competition fields for cup fixtures
-- Date: 2026-01-18
--
-- Adds competition and competition_round columns so we can store
-- FA Cup, Carabao Cup, Champions League, Europa League, and Conference League fixtures.

ALTER TABLE fixtures
ADD COLUMN IF NOT EXISTS competition VARCHAR(50) DEFAULT 'Premier League';

ALTER TABLE fixtures
ADD COLUMN IF NOT EXISTS competition_round VARCHAR(50);

UPDATE fixtures
SET competition = 'Premier League'
WHERE competition IS NULL;

CREATE INDEX IF NOT EXISTS idx_fixtures_competition ON fixtures (competition);

-- Update unique constraint to include competition
ALTER TABLE fixtures DROP CONSTRAINT IF EXISTS fixtures_home_team_away_team_date_season_key;

ALTER TABLE fixtures ADD CONSTRAINT fixtures_home_team_away_team_date_season_competition_key
UNIQUE(home_team, away_team, date, season, competition);
