-- Migration: 004_add_season_to_fixtures.sql
-- Description: Add season column to fixtures table for historical data comparison
-- Date: 2025-01-16
-- 
-- This migration allows storing results from multiple seasons in the fixtures table.
-- Required for the "Compare Season" feature that compares current season results
-- with previous seasons (2020/21, 2021/22, 2022/23, 2023/24, 2024/25).

-- Add season column to fixtures table
ALTER TABLE fixtures 
ADD COLUMN IF NOT EXISTS season VARCHAR(20) DEFAULT '2025/2026';

-- Create index for season queries (improves performance when filtering by season)
CREATE INDEX IF NOT EXISTS idx_fixtures_season ON fixtures (season);

-- Update existing fixtures to have the default season (2025/2026)
UPDATE fixtures SET season = '2025/2026' WHERE season IS NULL;

-- Verify the migration
-- Run this query to verify the column was added:
-- SELECT column_name, data_type, column_default 
-- FROM information_schema.columns 
-- WHERE table_name = 'fixtures' AND column_name = 'season';
