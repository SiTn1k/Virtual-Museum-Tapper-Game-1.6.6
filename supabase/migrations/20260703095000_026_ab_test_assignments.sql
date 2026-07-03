-- A/B Test Assignments Table Migration
-- Creates table for tracking A/B test assignments and experiment participation
-- Part of: A/B testing infrastructure for LiveOps optimization

-- ============================================================================
-- A/B TEST ASSIGNMENTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS ab_test_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    telegram_id BIGINT NOT NULL,
    test_id TEXT NOT NULL,
    variant TEXT NOT NULL CHECK (variant IN ('A', 'B')),
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    params JSONB DEFAULT '{}',
    converted_at TIMESTAMPTZ, -- When player completed target action
    conversion_event TEXT, -- Event type that triggered conversion
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(telegram_id, test_id)
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Fast lookup by telegram_id
CREATE INDEX IF NOT EXISTS idx_ab_test_assignments_telegram 
    ON ab_test_assignments(telegram_id);

-- Fast lookup by test_id
CREATE INDEX IF NOT EXISTS idx_ab_test_assignments_test 
    ON ab_test_assignments(test_id);

-- Fast lookup by variant
CREATE INDEX IF NOT EXISTS idx_ab_test_assignments_variant 
    ON ab_test_assignments(test_id, variant);

-- Index for conversion tracking
CREATE INDEX IF NOT EXISTS idx_ab_test_assignments_conversion 
    ON ab_test_assignments(test_id, variant) 
    WHERE converted_at IS NOT NULL;

-- Index for time-based queries
CREATE INDEX IF NOT EXISTS idx_ab_test_assignments_assigned 
    ON ab_test_assignments(assigned_at);

-- ============================================================================
-- A/B TEST CONFIGURATIONS TABLE (Remote config management)
-- ============================================================================

CREATE TABLE IF NOT EXISTS ab_test_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    test_id TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'paused' CHECK (status IN ('active', 'paused', 'completed')),
    variant_a_params JSONB NOT NULL DEFAULT '{}',
    variant_b_params JSONB NOT NULL DEFAULT '{}',
    traffic_split INTEGER NOT NULL DEFAULT 50 CHECK (traffic_split >= 0 AND traffic_split <= 100),
    primary_metric TEXT,
    minimum_sample_size INTEGER,
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for active tests
CREATE INDEX IF NOT EXISTS idx_ab_test_configs_status 
    ON ab_test_configs(status) WHERE status = 'active';

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to record a conversion for an A/B test
CREATE OR REPLACE FUNCTION record_ab_test_conversion(
    p_telegram_id BIGINT,
    p_test_id TEXT,
    p_conversion_event TEXT
) RETURNS VOID AS $$
BEGIN
    UPDATE ab_test_assignments 
    SET 
        converted_at = NOW(),
        conversion_event = p_conversion_event,
        updated_at = NOW()
    WHERE telegram_id = p_telegram_id 
      AND test_id = p_test_id 
      AND converted_at IS NULL;
END;
$$ LANGUAGE plpgsql;

-- Function to get test statistics
CREATE OR REPLACE FUNCTION get_ab_test_stats(
    p_test_id TEXT
) RETURNS TABLE (
    variant TEXT,
    total_assignments BIGINT,
    total_conversions BIGINT,
    conversion_rate NUMERIC,
    avg_time_to_convert INTERVAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ata.variant::TEXT,
        COUNT(*)::BIGINT AS total_assignments,
        COUNT(ata.converted_at)::BIGINT AS total_conversions,
        CASE 
            WHEN COUNT(*) > 0 
            THEN (COUNT(ata.converted_at)::NUMERIC / COUNT(*) * 100)
            ELSE 0 
        END AS conversion_rate,
        CASE 
            WHEN COUNT(ata.converted_at) > 0 
            THEN AVG(ata.converted_at - ata.assigned_at)
            ELSE NULL 
        END AS avg_time_to_convert
    FROM ab_test_assignments ata
    WHERE ata.test_id = p_test_id
    GROUP BY ata.variant;
END;
$$ LANGUAGE plpgsql;

-- Function to get player's test assignments
CREATE OR REPLACE FUNCTION get_player_ab_tests(
    p_telegram_id BIGINT
) RETURNS TABLE (
    test_id TEXT,
    variant TEXT,
    assigned_at TIMESTAMPTZ,
    params JSONB,
    converted_at TIMESTAMPTZ,
    conversion_event TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ata.test_id,
        ata.variant,
        ata.assigned_at,
        ata.params,
        ata.converted_at,
        ata.conversion_event
    FROM ab_test_assignments ata
    WHERE ata.telegram_id = p_telegram_id
    ORDER BY ata.assigned_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to bulk insert assignments (for batch processing)
CREATE OR REPLACE FUNCTION bulk_insert_ab_assignments(
    p_assignments JSONB
) RETURNS VOID AS $$
DECLARE
    assignment JSONB;
BEGIN
    FOR assignment IN SELECT * FROM jsonb_array_elements(p_assignments)
    LOOP
        INSERT INTO ab_test_assignments (
            telegram_id, 
            test_id, 
            variant, 
            assigned_at, 
            params,
            updated_at
        ) VALUES (
            (assignment->>'telegram_id')::BIGINT,
            assignment->>'test_id',
            assignment->>'variant',
            COALESCE(
                (assignment->>'assigned_at')::TIMESTAMPTZ, 
                NOW()
            ),
            COALESCE(
                (assignment->'params')::JSONB, 
                '{}'::JSONB
            ),
            NOW()
        )
        ON CONFLICT (telegram_id, test_id) DO UPDATE SET
            variant = EXCLUDED.variant,
            assigned_at = GREATEST(ab_test_assignments.assigned_at, EXCLUDED.assigned_at),
            params = EXCLUDED.params,
            updated_at = NOW();
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

ALTER TABLE ab_test_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE ab_test_configs ENABLE ROW LEVEL SECURITY;

-- Service role full access
CREATE POLICY "Service role full access ab_test_assignments" ON ab_test_assignments 
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access ab_test_configs" ON ab_test_configs 
    FOR ALL USING (auth.role() = 'service_role');

-- Players can read their own assignments
CREATE POLICY "Players read own ab test assignments" ON ab_test_assignments 
    FOR SELECT USING (telegram_id = (current_setting('app.telegram_id', true))::BIGINT);

-- Players can read all configs (needed for client-side test application)
CREATE POLICY "Players read ab test configs" ON ab_test_configs 
    FOR SELECT USING (true);

-- ============================================================================
-- GRANTS
-- ============================================================================

GRANT USAGE ON SCHEMA public TO service_role;
GRANT ALL ON ab_test_assignments TO service_role;
GRANT ALL ON ab_test_configs TO service_role;
GRANT EXECUTE ON FUNCTION record_ab_test_conversion TO service_role;
GRANT EXECUTE ON FUNCTION get_ab_test_stats TO service_role;
GRANT EXECUTE ON FUNCTION get_player_ab_tests TO service_role;
GRANT EXECUTE ON FUNCTION bulk_insert_ab_assignments TO service_role;
