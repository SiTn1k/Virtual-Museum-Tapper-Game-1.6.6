-- Analytics Sessions Table Migration
-- Creates table for tracking player sessions with duration metrics
-- Part of: session_start, session_end event tracking

-- ============================================================================
-- ANALYTICS SESSIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS analytics_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id TEXT UNIQUE NOT NULL,
    telegram_id BIGINT NOT NULL,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ended_at TIMESTAMPTZ,
    duration_ms BIGINT,
    platform TEXT DEFAULT 'telegram_miniapp',
    device_info JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for efficient session queries
CREATE INDEX IF NOT EXISTS idx_analytics_sessions_telegram ON analytics_sessions(telegram_id);
CREATE INDEX IF NOT EXISTS idx_analytics_sessions_started ON analytics_sessions(started_at);
CREATE INDEX IF NOT EXISTS idx_analytics_sessions_ended ON analytics_sessions(ended_at) WHERE ended_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_analytics_sessions_duration ON analytics_sessions(duration_ms) WHERE duration_ms IS NOT NULL;

-- ============================================================================
-- ANALYTICS EVENT TYPES CONSTRAINT
-- ============================================================================

-- Add check constraint for valid event types (extensible enum-like pattern)
-- This aligns with AnalyticsEventType in src/types/liveops.ts
ALTER TABLE analytics_events DROP CONSTRAINT IF EXISTS valid_event_type;
ALTER TABLE analytics_events ADD CONSTRAINT valid_event_type 
    CHECK (event_type IN (
        -- Session events
        'session_start',
        'session_end',
        'session_heartbeat',
        -- Progression events
        'level_up',
        'epoch_unlock',
        'prestige',
        'tap_power_upgrade',
        -- Economy events
        'currency_earned',
        'currency_spent',
        'generator_purchase',
        'gacha_opened',
        'artifact_collected',
        'artifact_upgraded',
        -- Engagement events
        'daily_claimed',
        'streak_continued',
        'streak_broken',
        'ad_watched',
        'ad_skipped',
        'offer_viewed',
        'offer_purchased',
        'mission_completed',
        'achievement_earned',
        'season_tier_reached',
        -- Social events
        'referral_sent',
        'referral_completed',
        'leaderboard_viewed',
        'leaderboard_rank_up',
        'leaderboard_top_10',
        'share_clicked',
        -- LiveOps events
        'event_started',
        'event_completed',
        'event_reward_claimed',
        'season_started',
        'season_purchased',
        'season_challenge_completed',
        'comeback_reward_claimed',
        'notification_clicked',
        -- Energy events
        'energy_full',
        'energy_low',
        -- Commerce events
        'iap_started',
        'iap_completed',
        'purchase_failed',
        -- Funnel events
        'tutorial_completed',
        'ftue_completed',
        -- Error/Quality events
        'error_occurred',
        'settings_changed',
        'notification_settings_changed'
    ));

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to end a session and calculate duration
CREATE OR REPLACE FUNCTION end_session(
    p_session_id TEXT,
    p_ended_at TIMESTAMPTZ DEFAULT NOW()
) RETURNS VOID AS $$
DECLARE
    v_started_at TIMESTAMPTZ;
    v_duration_ms BIGINT;
BEGIN
    SELECT started_at INTO v_started_at 
    FROM analytics_sessions 
    WHERE session_id = p_session_id;
    
    IF v_started_at IS NOT NULL THEN
        v_duration_ms := EXTRACT(EPOCH FROM (p_ended_at - v_started_at)) * 1000;
        
        UPDATE analytics_sessions 
        SET ended_at = p_ended_at,
            duration_ms = v_duration_ms,
            updated_at = NOW()
        WHERE session_id = p_session_id;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to get player session stats
CREATE OR REPLACE FUNCTION get_player_session_stats(
    p_telegram_id BIGINT,
    p_days INTEGER DEFAULT 7
) RETURNS TABLE (
    total_sessions BIGINT,
    total_duration_ms BIGINT,
    avg_duration_ms NUMERIC,
    min_duration_ms BIGINT,
    max_duration_ms BIGINT,
    last_session_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::BIGINT AS total_sessions,
        COALESCE(SUM(duration_ms), 0)::BIGINT AS total_duration_ms,
        COALESCE(AVG(duration_ms), 0)::NUMERIC AS avg_duration_ms,
        COALESCE(MIN(duration_ms), 0)::BIGINT AS min_duration_ms,
        COALESCE(MAX(duration_ms), 0)::BIGINT AS max_duration_ms,
        MAX(started_at) AS last_session_at
    FROM analytics_sessions
    WHERE telegram_id = p_telegram_id
      AND started_at >= NOW() - (p_days || ' days')::INTERVAL
      AND ended_at IS NOT NULL;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

ALTER TABLE analytics_sessions ENABLE ROW LEVEL SECURITY;

-- Service role full access
CREATE POLICY "Service role full access analytics_sessions" ON analytics_sessions 
    FOR ALL USING (auth.role() = 'service_role');

-- Read-only for players (their own session data only)
CREATE POLICY "Players read own sessions" ON analytics_sessions 
    FOR SELECT USING (telegram_id = (current_setting('app.telegram_id', true))::BIGINT);

-- ============================================================================
-- GRANTS
-- ============================================================================

GRANT USAGE ON SCHEMA public TO service_role;
GRANT ALL ON analytics_sessions TO service_role;
GRANT EXECUTE ON FUNCTION end_session TO service_role;
GRANT EXECUTE ON FUNCTION get_player_session_stats TO service_role;
