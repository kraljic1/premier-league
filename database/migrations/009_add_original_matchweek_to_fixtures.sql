-- Migration: 009_add_original_matchweek_to_fixtures.sql
-- Description: Store original matchweek for rescheduled fixtures
-- Date: 2026-01-19
--
-- Adds original_matchweek to keep the scheduled matchweek even if a fixture
-- is rescheduled to a later matchweek.

ALTER TABLE fixtures
ADD COLUMN IF NOT EXISTS original_matchweek INTEGER;

UPDATE fixtures
SET original_matchweek = matchweek
WHERE original_matchweek IS NULL;

CREATE INDEX IF NOT EXISTS idx_fixtures_original_matchweek ON fixtures (original_matchweek);
