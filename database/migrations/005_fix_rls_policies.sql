-- Migration: 005_fix_rls_policies.sql
-- Description: Fix overly permissive RLS policies that bypass row-level security
-- Date: 2026-01-16
--
-- This migration addresses Supabase database linter warnings about RLS policies
-- that use 'USING (true)' and 'WITH CHECK (true)' which effectively bypass
-- row-level security for service role operations.
--
-- The issue: Service role policies with unrestricted conditions allow any
-- authenticated user to bypass RLS, creating security vulnerabilities.
--
-- Solution: Replace permissive policies with proper role-based checks or
-- remove them entirely (since service role bypasses RLS anyway).

-- =============================================
-- FIX CACHE_METADATA TABLE POLICIES
-- =============================================

-- Drop the problematic policies
DROP POLICY IF EXISTS "Allow service role insert on cache_metadata" ON cache_metadata;
DROP POLICY IF EXISTS "Allow service role update on cache_metadata" ON cache_metadata;
DROP POLICY IF EXISTS "Allow service role delete on cache_metadata" ON cache_metadata;

-- Create secure policies that check for service role
-- Note: Service role bypasses RLS entirely, but these policies provide an extra layer of security
CREATE POLICY "Allow service role insert on cache_metadata" ON cache_metadata
    FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Allow service role update on cache_metadata" ON cache_metadata
    FOR UPDATE USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Allow service role delete on cache_metadata" ON cache_metadata
    FOR DELETE USING (auth.jwt() ->> 'role' = 'service_role');

-- =============================================
-- FIX FIXTURES TABLE POLICIES
-- =============================================

-- Drop the problematic policies
DROP POLICY IF EXISTS "Allow service role insert on fixtures" ON fixtures;
DROP POLICY IF EXISTS "Allow service role update on fixtures" ON fixtures;

-- Create secure policies that check for service role
CREATE POLICY "Allow service role insert on fixtures" ON fixtures
    FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Allow service role update on fixtures" ON fixtures
    FOR UPDATE USING (auth.jwt() ->> 'role' = 'service_role');

-- =============================================
-- FIX SCHEDULED_UPDATES TABLE POLICIES
-- =============================================

-- Drop the problematic policy
DROP POLICY IF EXISTS "Allow service role access on scheduled_updates" ON scheduled_updates;

-- Create secure policies that check for service role
CREATE POLICY "Allow service role insert on scheduled_updates" ON scheduled_updates
    FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Allow service role update on scheduled_updates" ON scheduled_updates
    FOR UPDATE USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Allow service role delete on scheduled_updates" ON scheduled_updates
    FOR DELETE USING (auth.jwt() ->> 'role' = 'service_role');

-- =============================================
-- FIX SCORERS TABLE POLICIES
-- =============================================

-- Drop the problematic policies
DROP POLICY IF EXISTS "Allow service role insert on scorers" ON scorers;
DROP POLICY IF EXISTS "Allow service role update on scorers" ON scorers;
DROP POLICY IF EXISTS "Allow service role delete on scorers" ON scorers;

-- Create secure policies that check for service role
CREATE POLICY "Allow service role insert on scorers" ON scorers
    FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Allow service role update on scorers" ON scorers
    FOR UPDATE USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Allow service role delete on scorers" ON scorers
    FOR DELETE USING (auth.jwt() ->> 'role' = 'service_role');

-- =============================================
-- FIX STANDINGS TABLE POLICIES
-- =============================================

-- Drop the problematic policies
DROP POLICY IF EXISTS "Allow service role insert on standings" ON standings;
DROP POLICY IF EXISTS "Allow service role update on standings" ON standings;
DROP POLICY IF EXISTS "Allow service role delete on standings" ON standings;

-- Create secure policies that check for service role
CREATE POLICY "Allow service role insert on standings" ON standings
    FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Allow service role update on standings" ON standings
    FOR UPDATE USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Allow service role delete on standings" ON standings
    FOR DELETE USING (auth.jwt() ->> 'role' = 'service_role');

-- =============================================
-- VERIFICATION QUERIES
-- =============================================
-- After running this migration, verify the policies are correct:
--
-- 1. Check that service role can still perform operations:
-- SELECT * FROM cache_metadata LIMIT 1; -- Should work with service role
--
-- 2. Check that authenticated users cannot bypass RLS:
-- SELECT * FROM cache_metadata LIMIT 1; -- Should be restricted for regular authenticated users
--
-- 3. Run the database linter again to confirm warnings are resolved