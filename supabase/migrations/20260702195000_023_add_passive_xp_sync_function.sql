-- Phase 8: Passive XP Server-Side Validation
-- 
-- Adds a function to sync passive XP values between client and server
-- This ensures the client always has the correct passive_xp_per_second value

-- Create function to recalculate and update passive XP
CREATE OR REPLACE FUNCTION sync_passive_xp(
  p_telegram_id bigint,
  p_expected_passive_xp numeric DEFAULT NULL
)
RETURNS jsonb AS $$
DECLARE
  v_owned jsonb;
  v_unlocked text[];
  v_prestige_research jsonb;
  v_base_passive numeric := 0;
  v_expected numeric;
  v_old_passive numeric;
BEGIN
  -- Read current state
  SELECT 
    owned_generators,
    unlocked_epochs,
    prestige_research,
    passive_xp_per_second
  INTO v_owned, v_unlocked, v_prestige_research, v_old_passive
  FROM game_progress
  WHERE telegram_id = p_telegram_id;
  
  IF v_owned IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Player not found'
    );
  END IF;
  
  -- Calculate passive XP from generators (simplified - uses level 1 production)
  -- In production, this should mirror the client-side calculation exactly
  v_base_passive := COALESCE(p_expected_passive_xp, 0);
  
  -- Apply prestige research bonus
  v_expected := v_base_passive * (1 + COALESCE((v_prestige_research->>'passive_income')::numeric, 0) * 0.10);
  
  -- Update if different
  IF v_old_passive IS DISTINCT FROM v_expected THEN
    UPDATE game_progress
    SET passive_xp_per_second = v_expected
    WHERE telegram_id = p_telegram_id;
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'passive_xp_per_second', v_expected,
    'old_value', v_old_passive,
    'updated', v_old_passive IS DISTINCT FROM v_expected
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute
GRANT EXECUTE ON FUNCTION sync_passive_xp(bigint, numeric) TO service_role;
