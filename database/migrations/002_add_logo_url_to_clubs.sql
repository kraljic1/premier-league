-- Add logo_url column to clubs table
ALTER TABLE clubs ADD COLUMN IF NOT EXISTS logo_url TEXT;

-- Add comment to explain the column
COMMENT ON COLUMN clubs.logo_url IS 'URL to the club logo stored in Supabase Storage';
