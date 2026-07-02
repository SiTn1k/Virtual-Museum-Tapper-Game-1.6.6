-- Phase 3: Race Condition Fix for Offline Income
-- 
-- This migration replaces the multi-step RPC + SELECT + UPDATE pattern with
-- a single atomic function that does everything inside one transaction.
-- Advisory locks (pg_advisory_xact_lock) prevent race conditions across
-- different database connections.

-- Drop existing functions first
DROP FUNCTION IF EXISTS swap_last_online_at(bigint, timestamptz);
DROP FUNCTION IF EXISTS claim_offline_income_atomic(bigint, timestamptz, boolean);

-- Create atomic offline income claim function
-- This function:
-- 1. Acquires advisory lock (blocks concurrent claims for same player)
-- 2. Reads player state
-- 3. Calculates offline rewards based on time elapsed
-- 4. Updates player balance with rewards
-- 5. Logs the claim for analytics
-- 6. Returns rewards info
CREATE OR REPLACE FUNCTION claim_offline_income_atomic(
  p_telegram_id bigint,
  p_new_time timestamptz,
  p_x2_boost boolean DEFAULT false
)
RETURNS jsonb AS $$
DECLARE
  v_old_time timestamptz;
  v_elapsed_ms bigint;
  v_offline_sec numeric;
  v_offline_xp numeric;
  v_offline_currency numeric;
  v_level integer;
  v_passive_xp_per_sec numeric;
  v_prestige_level integer;
  v_boosters jsonb;
  v_offline_cap_hours integer;
  v_offline_cap_sec integer;
  v_current_xp numeric;
  v_current_currency numeric;
  v_current_total_xp numeric;
  v_current_total_currency numeric;
  v_xp_to_add numeric;
  v_currency_to_add numeric;
  v_result jsonb;
BEGIN
  -- Acquire advisory lock keyed by telegram_id
  -- This blocks ALL other concurrent calls for the same player until transaction commits
  PERFORM pg_advisory_xact_lock(p_telegram_id);
  
  -- Read current player state
  SELECT 
    last_online_at,
    level,
    xp,
    currency,
    total_xp,
    total_currency_earned,
    passive_xp_per_second,
    prestige_level,
    active_boosters
  INTO v_old_time, v_level, v_current_xp, v_current_currency, 
       v_current_total_xp, v_current_total_currency,
       v_passive_xp_per_sec, v_prestige_level, v_boosters
  FROM game_progress
  WHERE telegram_id = p_telegram_id;
  
  -- If player doesn't exist, return failure
  IF v_old_time IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Player not found'
    );
  END IF;
  
  -- Calculate elapsed time
  v_elapsed_ms := EXTRACT(EPOCH FROM (p_new_time - v_old_time)) * 1000;
  
  -- Skip if less than 1 minute offline
  IF v_elapsed_ms < 60000 THEN
    RETURN jsonb_build_object(
      'success', true,
      'xp', 0,
      'currency', 0,
      'offline_seconds', 0,
      'message', 'Too short offline period'
    );
  END IF;
  
  -- Calculate offline cap based on prestige and boosters
  v_offline_cap_hours := COALESCE(
    (v_boosters->>'offline_cap_hours')::integer,
    CASE WHEN v_prestige_level > 0 THEN 6 ELSE 8 END
  );
  v_offline_cap_sec := v_offline_cap_hours * 3600;
  
  -- Calculate offline duration (capped)
  v_offline_sec := LEAST(v_elapsed_ms / 1000.0, v_offline_cap_sec);
  
  -- Calculate rewards
  v_offline_xp := COALESCE(v_passive_xp_per_sec, 0) * v_offline_sec;
  v_offline_currency := COALESCE(v_level, 1)::numeric * 50 * (v_offline_sec / 60.0);
  
  -- Apply x2 boost if requested and valid
  IF p_x2_boost THEN
    DECLARE
      v_boost_end bigint;
    BEGIN
      v_boost_end := (v_boosters->>'offline_boost_end')::bigint;
      IF v_boost_end IS NOT NULL AND v_boost_end > EXTRACT(EPOCH FROM p_new_time)::bigint * 1000 THEN
        v_offline_xp := v_offline_xp * 2;
        v_offline_currency := v_offline_currency * 2;
      END IF;
    END;
  END IF;
  
  -- Calculate totals to add
  v_xp_to_add := v_offline_xp;
  v_currency_to_add := v_offline_currency;
  
  -- Update player balance with new rewards
  UPDATE game_progress
  SET 
    xp = COALESCE(v_current_xp, 0) + v_xp_to_add,
    total_xp = COALESCE(v_current_total_xp, 0) + v_xp_to_add,
    currency = COALESCE(v_current_currency, 0) + v_currency_to_add,
    total_currency_earned = COALESCE(v_current_total_currency, 0) + v_currency_to_add,
    last_online_at = p_new_time
  WHERE telegram_id = p_telegram_id;
  
  -- Log the offline claim for analytics
  INSERT INTO offline_claims (telegram_id, xp_granted, currency_granted, created_at)
  VALUES (p_telegram_id, v_xp_to_add, v_currency_to_add, p_new_time);
  
  -- Return success with rewards info
  RETURN jsonb_build_object(
    'success', true,
    'xp', FLOOR(v_xp_to_add),
    'currency', FLOOR(v_currency_to_add),
    'offline_seconds', FLOOR(v_offline_sec)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to authenticated users through the service role
GRANT EXECUTE ON FUNCTION claim_offline_income_atomic(bigint, timestamptz, boolean) TO service_role;
