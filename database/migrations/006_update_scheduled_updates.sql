-- Migration: Update scheduled_updates table for multiple update times per match
-- This allows creating primary, secondary, and final update checks for each match

-- Add update_type column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'scheduled_updates' AND column_name = 'update_type'
    ) THEN
        ALTER TABLE scheduled_updates ADD COLUMN update_type VARCHAR(20) DEFAULT 'primary';
    END IF;
END $$;

-- Drop the foreign key constraint since we now use composite IDs (match_id-type)
ALTER TABLE scheduled_updates DROP CONSTRAINT IF EXISTS fk_match;

-- Create index on update_type for filtering
CREATE INDEX IF NOT EXISTS idx_scheduled_updates_type ON scheduled_updates(update_type);

-- Add comment explaining the update types
COMMENT ON COLUMN scheduled_updates.update_type IS 'Type of update check: primary (120min), secondary (180min), or final (240min)';
