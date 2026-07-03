-- ============================================================================
-- CRITICAL SECURITY FIX: RLS Policies for game_progress
-- Timestamp: 2026-07-03 08:34:00 UTC
-- Severity: CRITICAL - Prevents data breach
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
-- SECURITY VERIFICATION QUERIES (can be run manually to audit)
-- ============================================================================
-- 
-- 1. Check all policies on game_progress:
--    SELECT policyname, cmd, roles, qual FROM pg_policies WHERE tablename = 'game_progress';
--
-- 2. Verify no anon/authenticated access:
--    SELECT * FROM pg_policies WHERE tablename = 'game_progress' AND roles @> ARRAY['anon'];
--
-- 3. Test that RLS blocks anonymous access:
--    SET ROLE anon; SELECT * FROM game_progress LIMIT 1; -- Should return 0 rows
--    RESET ROLE;
--
-- ============================================================================
-- IMPACT OF THIS MIGRATION
-- ============================================================================
-- 
-- BEFORE: Any user could read/write ANY player's game_progress data
--          - SELECT * FROM game_progress; -- Returns ALL data
--          - UPDATE game_progress SET currency = 999999 WHERE true; -- Modifies ALL
--
-- AFTER:  Only edge functions (service_role) can access game_progress
--          - SELECT * FROM game_progress; -- Returns 0 rows (blocked by RLS)
--          - Edge functions validate HMAC signature before any operation
--
-- PUBLIC LEADERBOARD: Available for leaderboard UI
--          - SELECT * FROM public_leaderboard; -- Returns anonymized data only
--          - No telegram_id or sensitive player data exposed
