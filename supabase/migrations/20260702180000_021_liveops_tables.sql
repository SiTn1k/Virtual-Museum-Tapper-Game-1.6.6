-- LiveOps Tables Migration
-- Creates tables for Events, Seasons, Achievements, Missions, Analytics, and Player Segmentation

-- ============================================================================
-- EVENTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_code TEXT UNIQUE NOT NULL,
    event_type TEXT NOT NULL CHECK (event_type IN (
        'weekend_bonus', 'holiday', 'artifact_hunt', 'epoch_wars',
        'marathon', 'collection', 'flash_sale', 'comeback',
        'seasonal', 'community_goal'
    )),
    name_ua TEXT NOT NULL,
    name_en TEXT NOT NULL,
    description_ua TEXT,
    description_en TEXT,
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ NOT NULL,
    is_active BOOLEAN DEFAULT true,
    priority INTEGER DEFAULT 0,
    reward_multipliers JSONB DEFAULT '{}',
    featured_epochs TEXT[] DEFAULT '{}',
    bonus_tasks TEXT[] DEFAULT '{}',
    event_currency JSONB,
    shop_items JSONB DEFAULT '[]',
    prerequisites JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for active events
CREATE INDEX IF NOT EXISTS idx_events_active ON events(is_active, start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_events_type ON events(event_type);

-- ============================================================================
-- PLAYER EVENT STATE TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS player_event_state (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    telegram_id BIGINT NOT NULL,
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    event_currency INTEGER DEFAULT 0,
    purchase_history JSONB DEFAULT '{}',
    progress JSONB DEFAULT '{}',
    rewards_claimed TEXT[] DEFAULT '{}',
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(telegram_id, event_id)
);

CREATE INDEX IF NOT EXISTS idx_player_event_telegram ON player_event_state(telegram_id);
CREATE INDEX IF NOT EXISTS idx_player_event_event ON player_event_state(event_id);

-- ============================================================================
-- SEASONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS seasons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    season_code TEXT UNIQUE NOT NULL,
    season_number INTEGER NOT NULL,
    name_ua TEXT NOT NULL,
    name_en TEXT NOT NULL,
    description_ua TEXT,
    description_en TEXT,
    theme TEXT,
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ NOT NULL,
    duration_days INTEGER NOT NULL,
    level_count INTEGER DEFAULT 30,
    xp_per_level INTEGER DEFAULT 1000,
    free_rewards JSONB NOT NULL DEFAULT '[]',
    premium_rewards JSONB NOT NULL DEFAULT '[]',
    challenges JSONB DEFAULT '[]',
    premium_price INTEGER, -- Telegram Stars
    bonus_xp_per_level INTEGER DEFAULT 100,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_seasons_active ON seasons(is_active, start_date, end_date);

-- ============================================================================
-- PLAYER SEASONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS player_seasons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    telegram_id BIGINT NOT NULL,
    season_id UUID REFERENCES seasons(id) ON DELETE CASCADE,
    current_tier INTEGER DEFAULT 0,
    total_xp INTEGER DEFAULT 0,
    claimed_tiers INTEGER[] DEFAULT '{}',
    premium_purchased BOOLEAN DEFAULT false,
    challenges JSONB DEFAULT '{}',
    started_at TIMESTAMPTZ,
    ended_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(telegram_id, season_id)
);

CREATE INDEX IF NOT EXISTS idx_player_season_telegram ON player_seasons(telegram_id);
CREATE INDEX IF NOT EXISTS idx_player_season_season ON player_seasons(season_id);

-- ============================================================================
-- ACHIEVEMENTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    achievement_code TEXT UNIQUE NOT NULL,
    category TEXT NOT NULL CHECK (category IN (
        'progression', 'collection', 'engagement', 'social',
        'economy', 'combat', 'special'
    )),
    name_ua TEXT NOT NULL,
    name_en TEXT NOT NULL,
    description_ua TEXT,
    description_en TEXT,
    icon TEXT,
    requirement JSONB NOT NULL,
    reward JSONB NOT NULL,
    is_secret BOOLEAN DEFAULT false,
    is_legacy BOOLEAN DEFAULT false,
    limited_time JSONB,
    prerequisites TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_achievements_category ON achievements(category);
CREATE INDEX IF NOT EXISTS idx_achievements_secret ON achievements(is_secret);

-- ============================================================================
-- PLAYER ACHIEVEMENTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS player_achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    telegram_id BIGINT NOT NULL,
    achievement_id UUID REFERENCES achievements(id) ON DELETE CASCADE,
    progress INTEGER DEFAULT 0,
    completed BOOLEAN DEFAULT false,
    earned_at TIMESTAMPTZ,
    notified BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(telegram_id, achievement_id)
);

CREATE INDEX IF NOT EXISTS idx_player_ach_telegram ON player_achievements(telegram_id);
CREATE INDEX IF NOT EXISTS idx_player_ach_completed ON player_achievements(completed);

-- ============================================================================
-- MISSIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS missions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mission_code TEXT UNIQUE NOT NULL,
    name_ua TEXT NOT NULL,
    name_en TEXT NOT NULL,
    description_ua TEXT,
    description_en TEXT,
    type TEXT NOT NULL,
    frequency TEXT NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly')),
    target INTEGER NOT NULL,
    reward JSONB NOT NULL,
    icon TEXT,
    exclusivity TEXT DEFAULT 'both' CHECK (exclusivity IN ('free', 'premium', 'both', 'event')),
    event_id UUID REFERENCES events(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_missions_frequency ON missions(frequency);
CREATE INDEX IF NOT EXISTS idx_missions_type ON missions(type);

-- ============================================================================
-- PLAYER MISSIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS player_missions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    telegram_id BIGINT NOT NULL,
    mission_id UUID REFERENCES missions(id) ON DELETE CASCADE,
    progress INTEGER DEFAULT 0,
    completed BOOLEAN DEFAULT false,
    claimed BOOLEAN DEFAULT false,
    assigned_at TIMESTAMPTZ NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    claimed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(telegram_id, mission_id, assigned_at)
);

CREATE INDEX IF NOT EXISTS idx_player_mission_telegram ON player_missions(telegram_id);
CREATE INDEX IF NOT EXISTS idx_player_mission_expires ON player_missions(expires_at);

-- ============================================================================
-- ANALYTICS EVENTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS analytics_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type TEXT NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL,
    session_id TEXT NOT NULL,
    telegram_id BIGINT NOT NULL,
    properties JSONB DEFAULT '{}',
    value NUMERIC,
    ab_test_variant TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_analytics_telegram ON analytics_events(telegram_id);
CREATE INDEX IF NOT EXISTS idx_analytics_type ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_timestamp ON analytics_events(timestamp);
CREATE INDEX IF NOT EXISTS idx_analytics_session ON analytics_events(session_id);

-- ============================================================================
-- A/B TESTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS ab_tests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    test_code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'archived')),
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    target_segments TEXT[] DEFAULT '{}',
    variants JSONB NOT NULL DEFAULT '[]',
    primary_metric TEXT,
    minimum_sample_size INTEGER,
    current_enrollment INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ab_tests_active ON ab_tests(status, start_date, end_date);

-- ============================================================================
-- PLAYER A/B TEST ASSIGNMENTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS player_ab_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    telegram_id BIGINT NOT NULL,
    test_id UUID REFERENCES ab_tests(id) ON DELETE CASCADE,
    variant_id TEXT NOT NULL,
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    converted BOOLEAN DEFAULT false,
    conversion_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(telegram_id, test_id)
);

CREATE INDEX IF NOT EXISTS idx_player_ab_telegram ON player_ab_assignments(telegram_id);
CREATE INDEX IF NOT EXISTS idx_player_ab_test ON player_ab_assignments(test_id);

-- ============================================================================
-- PLAYER SEGMENTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS player_segments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    telegram_id BIGINT UNIQUE NOT NULL,
    segments TEXT[] DEFAULT '{}',
    first_session_at TIMESTAMPTZ,
    last_session_at TIMESTAMPTZ,
    total_playtime_minutes INTEGER DEFAULT 0,
    lifetime_spend NUMERIC DEFAULT 0,
    lifetime_purchases INTEGER DEFAULT 0,
    vip_level INTEGER,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_player_segments_telegram ON player_segments(telegram_id);

-- ============================================================================
-- COMEBACK CAMPAIGNS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS comeback_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_code TEXT UNIQUE NOT NULL,
    name_ua TEXT NOT NULL,
    name_en TEXT NOT NULL,
    description_ua TEXT,
    description_en TEXT,
    target_segments TEXT[] DEFAULT '{}',
    conditions JSONB NOT NULL,
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ NOT NULL,
    rewards JSONB NOT NULL,
    requirements JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_comeback_active ON comeback_campaigns(is_active, start_date, end_date);

-- ============================================================================
-- PLAYER COMEBACK STATE TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS player_comeback_state (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    telegram_id BIGINT NOT NULL,
    campaign_id UUID REFERENCES comeback_campaigns(id) ON DELETE CASCADE,
    started_at TIMESTAMPTZ NOT NULL,
    last_claimed_day INTEGER,
    total_playtime_minutes INTEGER DEFAULT 0,
    current_day INTEGER DEFAULT 1,
    completed BOOLEAN DEFAULT false,
    rewards_claimed INTEGER[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(telegram_id, campaign_id)
);

CREATE INDEX IF NOT EXISTS idx_player_comeback_telegram ON player_comeback_state(telegram_id);

-- ============================================================================
-- COLLECTION MILESTONES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS collection_milestones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    milestone_code TEXT UNIQUE NOT NULL,
    collection_type TEXT NOT NULL CHECK (collection_type IN (
        'artifact', 'epoch', 'generator', 'achievement', 'season'
    )),
    name_ua TEXT NOT NULL,
    name_en TEXT NOT NULL,
    description_ua TEXT,
    description_en TEXT,
    target INTEGER NOT NULL,
    reward JSONB NOT NULL,
    icon TEXT,
    tier INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_milestones_type ON collection_milestones(collection_type);

-- ============================================================================
-- PLAYER COLLECTION PROGRESS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS player_collection_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    telegram_id BIGINT NOT NULL,
    collection_type TEXT NOT NULL,
    current_count INTEGER DEFAULT 0,
    milestones_completed TEXT[] DEFAULT '{}',
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(telegram_id, collection_type)
);

CREATE INDEX IF NOT EXISTS idx_player_collection_telegram ON player_collection_progress(telegram_id);

-- ============================================================================
-- IAP PRODUCTS TABLE (for server-side offer management)
-- ============================================================================

CREATE TABLE IF NOT EXISTS iap_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_code TEXT UNIQUE NOT NULL,
    type TEXT NOT NULL CHECK (type IN (
        'starter_pack', 'value_pack', 'currency_bundle', 'energy_pack',
        'artifact_pack', 'booster_bundle', 'limited_offer', 'season_pass',
        'subscription', 'bundle'
    )),
    name_ua TEXT NOT NULL,
    name_en TEXT NOT NULL,
    description_ua TEXT,
    description_en TEXT,
    price_stars INTEGER NOT NULL,
    price_usd NUMERIC NOT NULL,
    items JSONB NOT NULL DEFAULT '[]',
    is_limited BOOLEAN DEFAULT false,
    limited_quantity INTEGER,
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    display_conditions JSONB DEFAULT '{}',
    sort_order INTEGER DEFAULT 0,
    is_featured BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_iap_products_active ON iap_products(is_active, type);
CREATE INDEX IF NOT EXISTS idx_iap_products_sort ON iap_products(sort_order);

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_event_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE seasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_seasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE ab_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_ab_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE comeback_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_comeback_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE collection_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_collection_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE iap_products ENABLE ROW LEVEL SECURITY;

-- Service role full access for all tables
CREATE POLICY "Service role full access events" ON events FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access player_event_state" ON player_event_state FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access seasons" ON seasons FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access player_seasons" ON player_seasons FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access achievements" ON achievements FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access player_achievements" ON player_achievements FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access missions" ON missions FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access player_missions" ON player_missions FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access analytics_events" ON analytics_events FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access ab_tests" ON ab_tests FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access player_ab_assignments" ON player_ab_assignments FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access player_segments" ON player_segments FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access comeback_campaigns" ON comeback_campaigns FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access player_comeback_state" ON player_comeback_state FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access collection_milestones" ON collection_milestones FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access player_collection_progress" ON player_collection_progress FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access iap_products" ON iap_products FOR ALL USING (auth.role() = 'service_role');

-- Read-only for configuration tables (events, seasons, achievements, missions, ab_tests, milestones, products)
CREATE POLICY "Anyone read events" ON events FOR SELECT USING (true);
CREATE POLICY "Anyone read seasons" ON seasons FOR SELECT USING (true);
CREATE POLICY "Anyone read achievements" ON achievements FOR SELECT USING (true);
CREATE POLICY "Anyone read missions" ON missions FOR SELECT USING (true);
CREATE POLICY "Anyone read ab_tests" ON ab_tests FOR SELECT USING (true);
CREATE POLICY "Anyone read collection_milestones" ON collection_milestones FOR SELECT USING (true);
CREATE POLICY "Anyone read iap_products" ON iap_products FOR SELECT USING (true);

-- Grant permissions
GRANT USAGE ON SCHEMA public TO service_role;
GRANT ALL ON events TO service_role;
GRANT ALL ON player_event_state TO service_role;
GRANT ALL ON seasons TO service_role;
GRANT ALL ON player_seasons TO service_role;
GRANT ALL ON achievements TO service_role;
GRANT ALL ON player_achievements TO service_role;
GRANT ALL ON missions TO service_role;
GRANT ALL ON player_missions TO service_role;
GRANT ALL ON analytics_events TO service_role;
GRANT ALL ON ab_tests TO service_role;
GRANT ALL ON player_ab_assignments TO service_role;
GRANT ALL ON player_segments TO service_role;
GRANT ALL ON comeback_campaigns TO service_role;
GRANT ALL ON player_comeback_state TO service_role;
GRANT ALL ON collection_milestones TO service_role;
GRANT ALL ON player_collection_progress TO service_role;
GRANT ALL ON iap_products TO service_role;
