-- ============================================================================
-- CRITICAL SECURITY FIX: RLS Policies for game_progress
-- 
-- USAGE:
--   psql $DATABASE_URL -f fix_rls_policies.sql
--   or apply via Supabase Dashboard > SQL Editor
-- ============================================================================
--
-- SECURITY ARCHITECTURE:
-- This game uses Telegram Mini App with HMAC-based initData validation.
-- Edge functions run with service_role and validate requests via HMAC signature.
-- RLS policies serve as defense-in-depth against edge function compromise.
--
-- BLOCKED ACCESS MODEL:
-- - anon/authenticated: NO direct access to game_progress (blocked by RLS)
-- - service_role: FULL access (edge functions only)
-- - public_leaderboard: SELECT only (anonymized data, no telegram_id)
--
-- ============================================================================
-- STEP 1: Drop ALL existing policies on game_progress (start fresh)
-- ============================================================================

DROP POLICY IF EXISTS "anon_read_progress" ON game_progress;
DROP POLICY IF EXISTS "anon_insert_progress" ON game_progress;
DROP POLICY IF EXISTS "anon_update_progress" ON game_progress;
DROP POLICY IF EXISTS "anon_delete_progress" ON game_progress;
DROP POLICY IF EXISTS "select_own_progress" ON game_progress;
DROP POLICY IF EXISTS "insert_own_progress" ON game_progress;
DROP POLICY IF EXISTS "update_own_progress" ON game_progress;
DROP POLICY IF EXISTS "service_role_all_progress" ON game_progress;
DROP POLICY IF EXISTS "Users can update their game progress" ON game_progress;
DROP POLICY IF EXISTS "service_role_full_access_game_progress" ON game_progress;

-- ============================================================================
-- STEP 2: Create SECURE RLS policies on game_progress
-- ============================================================================

-- service_role ONLY: Full access for edge function operations
-- This is the ONLY authorized pathway for game data operations
CREATE POLICY "service_role_full_access" ON game_progress
    FOR ALL
    TO service_role
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

-- IMPORTANT: NO policies for anon or authenticated roles
-- PostgreSQL RLS denies access by default when no policy exists
-- This BLOCKS universal read/write access - the critical fix

-- ============================================================================
-- STEP 3: Verify RLS is enabled
-- ============================================================================

ALTER TABLE game_progress ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 4: Ensure public_leaderboard view exists for leaderboard UI
-- ============================================================================

-- Drop existing view if present (to handle migrations cleanly)
DROP VIEW IF EXISTS public_leaderboard;

-- Public leaderboard: Only exposes non-sensitive, anonymized data
CREATE VIEW public_leaderboard AS
SELECT 
    id,
    username,
    level,
    total_xp,
    updated_at
FROM game_progress
WHERE username IS NOT NULL 
  AND username != ''
  AND level > 0
ORDER BY level DESC, total_xp DESC
LIMIT 1000;

-- Grant read access to anon for leaderboard only
GRANT SELECT ON public_leaderboard TO anon;
GRANT SELECT ON public_leaderboard TO authenticated;

-- ============================================================================
-- STEP 5: Verify policy configuration
-- ============================================================================

-- Verify policies were created correctly
DO $$
BEGIN
    -- Check service_role policy exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'game_progress' 
          AND policyname = 'service_role_full_access'
          AND cmd = 'ALL'
          AND roles = ARRAY['service_role']
    ) THEN
        RAISE EXCEPTION 'SECURITY POLICY NOT CREATED: service_role_full_access';
    END IF;
    
    -- Ensure NO anon/authenticated policies exist
    IF EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'game_progress' 
          AND (roles @> ARRAY['anon'] OR roles @> ARRAY['authenticated'])
    ) THEN
        RAISE WARNING 'POLICIES FOR anon/authenticated FOUND - manual review required';
    END IF;
    
    RAISE NOTICE 'RLS policies verified successfully';
END $$;

-- ============================================================================
-- POST-FIX VERIFICATION
-- ============================================================================
-- 
-- Run these queries to verify the fix:
--
-- 1. List all policies on game_progress:
--    SELECT policyname, cmd, roles FROM pg_policies WHERE tablename = 'game_progress';
--
-- 2. Verify only service_role has access:
--    Should show exactly 1 policy: service_role_full_access for ALL
--
-- 3. Test blocking (as admin):
--    SET ROLE anon; SELECT * FROM game_progress LIMIT 1; -- Should return 0 rows
--    RESET ROLE;
--
-- ============================================================================
