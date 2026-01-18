-- Migration: 007_fix_fixtures_unique_constraint.sql
-- Description: Update the unique constraint on fixtures to include season
-- Date: 2026-01-18
--
-- The current unique constraint on (home_team, away_team, date) prevents
-- storing fixtures from different seasons that happen to have the same teams and date.
-- We need to include season in the constraint to allow this.

-- Drop the existing constraint
ALTER TABLE fixtures DROP CONSTRAINT IF EXISTS fixtures_home_team_away_team_date_key;

-- Add new constraint that includes season
ALTER TABLE fixtures ADD CONSTRAINT fixtures_home_team_away_team_date_season_key
UNIQUE(home_team, away_team, date, season);