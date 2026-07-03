# Analytics Audit — Virtual Museum Tapper Game v1.6.6

**Auditor:** Analytics Engineering Team  
**Date:** 2026-07-02  
**Version:** 1.0  
**Classification:** Internal AAA Studio Standards Review  
**Status:** ✅ **INFRASTRUCTURE IMPLEMENTED IN PHASE 16-20**

---

## ✅ IMPLEMENTED IN PHASE 16-20

| Component | Status | Details |
|-----------|--------|---------|
| Analytics sessions table | ✅ Done | `analytics_sessions` table with duration tracking |
| Track analytics edge function | ✅ Done | HMAC validation, batched inserts, real-time metrics |
| A/B testing infrastructure | ✅ Done | `ab_test_assignments` table, `getABTest()` function |
| Event tracking | ✅ Done | All major events (session, progression, economy, social) |
| Conversion tracking | ✅ Done | `trackABTestConversion()` implemented |

---

## Executive Summary

The Virtual Museum Tapper Game has a **foundational but incomplete analytics infrastructure**. The game tracks sessions and ad views, but lacks comprehensive event tracking needed for data-driven optimization at AAA studio scale. This audit identifies critical gaps and provides a roadmap for building a production-grade analytics pipeline.

**Overall Grade: C+ (62/100)**

| Category | Status | Score |
|----------|--------|-------|
| Session Tracking | ✅ Present | 75/100 |
| Ad Analytics | ✅ Present | 70/100 |
| Tap/Core Gameplay | ⚠️ Missing | 0/100 |
| Monetization | ⚠️ Partial | 35/100 |
| Retention Metrics | ⚠️ Minimal | 30/100 |
| Funnel Tracking | ❌ Missing | 0/100 |
| Player Behavior | ❌ Missing | 0/100 |
| A/B Testing | ❌ None | 0/100 |
| Dashboard Ready | ⚠️ Partial | 40/100 |
| Data Pipeline | ⚠️ Fragmented | 45/100 |

---

## 1. Current Telemetry Implementation

### 1.1 What's Working

**Session Tracking (`track-session` Edge Function)**
- ✅ Tracks session start/end/activity
- ✅ Records `session_started_at`, `last_activity_at`, `total_session_seconds`
- ✅ Updates `last_online_at` on player record
- ✅ Sends beacon on page unload for reliability
- ✅ Activity ping every 60 seconds
- ✅ Stores in `player_sessions` table

**Ad View Logging**
- ✅ `ad_views` table tracks all ad impressions
- ✅ `ads_rewards_log` table prevents duplicate rewards
- ✅ Records `ad_type`, `reward_type`, `telegram_id`
- ✅ Daily limits tracked in `daily_ad_views` JSONB column

**Game Progress Storage**
- ✅ All player state stored in `game_progress` table
- ✅ Includes level, XP, currency, generators, artifacts, prestige
- ✅ Syncs to server every 15 seconds

### 1.2 What's Missing

**Event-Driven Analytics System**
- ❌ No dedicated analytics events table
- ❌ No structured event logging (JSONB events)
- ❌ No event aggregation pipeline
- ❌ No real-time analytics hooks

### 1.3 Current Data Flow

```
Player Action → Local State → Remote Save (15s) → game_progress table
                                     ↓
Session Events → track-session → player_sessions table
                                     ↓
Ad Actions → claim-ad-reward/adsgram-reward → ad_views table
```

---

## 2. Event Tracking Coverage Analysis

### 2.1 Currently Tracked Events

| Event | Tracked | Location |
|-------|---------|----------|
| `session_start` | ✅ | `track-session` edge function |
| `session_end` | ✅ | `track-session` edge function |
| `session_activity` | ✅ | `track-session` (60s interval) |
| `ad_view` | ✅ | `ad_views` table |
| `ad_reward_claimed` | ✅ | `ads_rewards_log` table |
| `game_progress_update` | ✅ | `game_progress` table (full state) |

### 2.2 Critical Missing Events (AAA Standard)

For a tapper game at AAA studio level, these events are **required**:

#### Core Gameplay Events (P0 - CRITICAL)

| Event | Description | Data Needed |
|-------|-------------|-------------|
| `tap` | Every tap on the museum | `tap_power`, `energy_active`, `combo_count`, `epoch_id`, `level`, `prestige_level` |
| `tap_upgrade` | Purchasing tap power upgrade | `new_tap_power`, `currency_spent`, `total_currency` |
| `generator_buy` | Purchasing a generator | `generator_id`, `level`, `cost`, `current_currency`, `epoch_id` |
| `generator_upgrade` | Leveling up existing generator | `generator_id`, `new_level`, `cost`, `production_before`, `production_after` |
| `epoch_unlock` | Unlocking new epoch | `epoch_id`, `previous_epoch`, `level_at_unlock`, `total_time_played` |
| `level_up` | Player leveling up | `new_level`, `total_xp`, `time_to_level` |

#### Monetization Events (P0 - CRITICAL)

| Event | Description | Data Needed |
|-------|-------------|-------------|
| `iap_attempted` | IAP flow started | `product_id`, `price`, `currency` |
| `iap_completed` | IAP successful | `product_id`, `charge_id`, `amount`, `currency`, `items_granted` |
| `iap_failed` | IAP failed/cancelled | `product_id`, `failure_reason`, `step` |
| `ad_offered` | Ad modal shown | `ad_type`, `session_time`, `prestige_level` |
| `ad_started` | User clicked watch ad | `ad_type`, `user_latency_to_click` |
| `ad_completed` | Ad watched to completion | `ad_type`, `watch_duration`, `reward_type` |
| `ad_skipped` | User closed ad early | `ad_type`, `watch_duration` |

#### Retention Events (P1 - HIGH)

| Event | Description | Data Needed |
|-------|-------------|-------------|
| `first_session_complete` | First session ended | `session_duration`, `level_reached`, `tutorial_completed` |
| `tutorial_start` | Tutorial modal opened | `step` |
| `tutorial_complete` | Tutorial dismissed | `steps_completed`, `time_spent` |
| `daily_return` | Player returned next day | `days_since_last_session`, `streak_status` |
| `streak_maintained` | Daily check-in completed | `streak_day`, `streak_reward` |
| `streak_broken` | Missed a day | `broken_streak`, `days_missed` |

#### Progression Events (P1 - HIGH)

| Event | Description | Data Needed |
|-------|-------------|-------------|
| `artifact_found` | Artifact fragment obtained | `artifact_id`, `rarity`, `source` (gacha/ad/chest) |
| `artifact_completed` | Artifact fully assembled | `artifact_id`, `time_to_complete`, `duplicate_count` |
| `artifact_upgraded` | Artifact level increased | `artifact_id`, `new_level`, `duplicates_used` |
| `prestige_started` | Prestige flow initiated | `current_level`, `total_xp`, `projected_points` |
| `prestige_completed` | Prestige executed | `prestige_level`, `points_earned`, `time_played` |
| `research_purchased` | Prestige research bought | `research_id`, `new_level`, `points_spent` |

#### Social/Viral Events (P2 - MEDIUM)

| Event | Description | Data Needed |
|-------|-------------|-------------|
| `referral_link_copy` | User copied referral link | `referral_count_before` |
| `referral_link_share` | User shared to Telegram/Threads | `platform`, `referral_count_before` |
| `referral_signup` | Referred user joined | `referrer_id`, `new_user_tier` |
| `leaderboard_viewed` | Player opened leaderboard | `current_rank`, `view_duration` |
| `leaderboard_position_check` | Player checked own rank | `current_rank`, `score` |

### 2.3 Event Schema Recommendation

Each event should follow this structure for AAA-grade analytics:

```typescript
interface AnalyticsEvent {
  // Required fields
  event_name: string;           // e.g., "tap", "purchase_completed"
  timestamp: number;            // Unix milliseconds
  telegram_id: number;         // Player identifier
  
  // Player context (auto-attached)
  level: number;
  prestige_level: number;
  epoch_id: string;
  session_id: string;          // UUID for this session
  client_time: number;         // Client-side timestamp for latency analysis
  
  // Event-specific payload
  event_data: Record<string, unknown>;
  
  // Technical metadata
  app_version: string;
  platform: 'ios' | 'android' | 'web';
  session_duration_seconds: number;
}
```

---

## 3. Funnel Tracking Assessment

### 3.1 Current Funnel State

The game has these implicit funnels but **no tracking**:

**Acquisition → Onboarding**
```
Telegram Mini App Open → Tutorial Seen → First Tap → First Generator Buy
```
- ❌ No funnel tracking for this path
- ❌ Can't measure tutorial completion rate
- ❌ Can't measure drop-off at each step

**Onboarding → Core Loop**
```
First Tap → Level 5 → First Generator → Epoch 2 Unlock
```
- ❌ No tracking
- ❌ Can't identify where players quit

**Core Loop → Monetization**
```
Regular Player → Ad Watch → IAP Interest → Purchase
```
- ⚠️ Only ad views logged, not funnel progression
- ❌ Can't measure conversion rates between steps

**Retention Loop**
```
Day 1 → Day 2 → Day 3 → ... → Day 7 → Week 2 → ...
```
- ⚠️ `last_online_at` exists but no D1/D7/D30 tracking
- ❌ No cohort analysis capability

### 3.2 Required Funnel Events

```typescript
// Onboarding Funnel
'funnel_step_tutorial_start'
'funnel_step_tutorial_complete'
'funnel_step_first_tap'
'funnel_step_first_generator'
'funnel_step_first_epoch_unlock'

// Monetization Funnel  
'funnel_step_ad_offered'
'funnel_step_ad_clicked'
'funnel_step_ad_completed'
'funnel_step_iap_viewed'
'funnel_step_iap_attempted'
'funnel_step_iap_completed'

// Retention Funnel
'funnel_step_daily_return_d1'
'funnel_step_daily_return_d3'
'funnel_step_daily_return_d7'
'funnel_step_daily_return_d14'
'funnel_step_daily_return_d30'
```

---

## 4. Retention Metrics Analysis

### 4.1 What's Available

- ✅ `last_online_at` timestamp in `game_progress`
- ✅ `player_sessions` table with `session_started_at` and `total_session_seconds`
- ✅ `daily_streak`, `check_in_streak` in game state
- ✅ `best_streak` tracked

### 4.2 What's Missing (AAA Standard)

**Retention Cohort Analysis**
- ❌ No cohort table (users grouped by install date)
- ❌ Can't calculate D1/D7/D30 retention rates
- ❌ Can't segment by acquisition source

**Stickiness Metrics**
- ❌ DAU/MAU ratio calculation not possible
- ❌ Average sessions per day not tracked
- ❌ Session frequency distribution not tracked

**Churn Prediction**
- ❌ No last-seen-to-now calculation for churn risk
- ❌ No re-engagement trigger system

### 4.3 Recommended Retention Schema

```sql
-- Retention cohort table (auto-populated daily)
CREATE TABLE retention_cohorts (
  id BIGSERIAL PRIMARY KEY,
  cohort_date DATE NOT NULL,           -- Date user first played
  telegram_id BIGINT NOT NULL,
  d0_level INTEGER,
  d0_session_duration INTEGER,
  d1_retention BOOLEAN,
  d3_retention BOOLEAN,
  d7_retention BOOLEAN,
  d14_retention BOOLEAN,
  d30_retention BOOLEAN,
  churned_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Player engagement summary (updated daily via cron)
CREATE TABLE player_engagement_daily (
  id BIGSERIAL PRIMARY KEY,
  telegram_id BIGINT NOT NULL,
  date DATE NOT NULL,
  sessions_count INTEGER,
  total_session_seconds INTEGER,
  taps_count INTEGER,
  xp_earned BIGINT,
  currency_earned BIGINT,
  ads_watched INTEGER,
  UNIQUE(telegram_id, date)
);
```

---

## 5. Revenue Tracking Analysis

### 5.1 Current State

**Ads Revenue (Tracked)**
- ✅ `ad_views` table logs all ad impressions
- ✅ `ads_rewards_log` tracks completed rewards
- ✅ Can calculate eCPM from ad view count

**IAP Revenue (Partial)**
- ✅ Webhook receives payment confirmation
- ✅ `purchase_log` in `active_boosters` stores charge IDs
- ⚠️ No revenue events for analytics
- ⚠️ No product analytics

**Revenue Gaps (Critical)**
- ❌ No revenue event with amount/currency
- ❌ No ARPU calculation possible
- ❌ No payer's vs non-payer segmentation
- ❌ No IAP funnel tracking (view → click → purchase)

### 5.2 Revenue Event Schema

```typescript
interface RevenueEvent {
  event_name: 'ad_impression' | 'ad_completed' | 'iap_completed';
  
  // Ad-specific
  ad_type?: 'session' | 'chest' | 'energy' | 'adsgram';
  ad_format?: 'rewarded' | 'interstitial';
  estimated_revenue_cents?: number;
  
  // IAP-specific
  product_id?: string;
  product_type?: 'booster' | 'currency' | 'subscription';
  amount_cents?: number;
  currency?: string;  // XTR (Telegram Stars)
  charge_id?: string;
  
  // Player context
  player_value_usd?: number;  // LTV estimate
  is_first_purchase?: boolean;
  total_purchases_count?: number;
}
```

### 5.3 Key Revenue Metrics to Track

| Metric | Formula | Current |
|--------|---------|---------|
| ARPDAU | Total Revenue / DAU | ❌ Cannot calculate |
| ARPPU | Paying Revenue / Payers | ❌ Cannot calculate |
| Conversion Rate | Payers / DAU | ❌ Cannot calculate |
| eCPM | (Revenue × 1000) / Impressions | ⚠️ Partial |
| Ad Fill Rate | Filled / Requested | ❌ Not tracked |
| IAP Average Order Value | Total IAP / Transactions | ❌ Not tracked |

---

## 6. Player Behavior Analytics

### 6.1 Missing Capabilities

**Tap Behavior**
- ❌ Total taps per session
- ❌ Taps per minute (TPM)
- ❌ Combo usage patterns
- ❌ Tap timing distribution
- ❌ Idle time patterns

**Generator Behavior**
- ❌ Time to first generator purchase
- ❌ Generator tier preferences
- ❌ Upgrade timing patterns
- ❌ Most/least popular generators

**Session Behavior**
- ❌ Session length distribution
- ❌ Time of day activity patterns
- ❌ Session frequency
- ❌ Return session behavior

### 6.2 Required Player Behavior Events

```typescript
// Tap behavior (batch every 100 taps for performance)
{
  event_name: 'tap_batch',
  event_data: {
    taps_count: 100,
    total_xp_earned: 500,
    avg_combo: 2.3,
    max_combo: 8,
    epoch_id: 'kyiv_rus',
    prestige_active: true,
    energy_active: false,
    boosters_active: ['xp_boost'],
    session_time_bucket: '5-10min'
  }
}

// Session summary (on session end)
{
  event_name: 'session_summary',
  event_data: {
    session_duration_seconds: 1800,
    total_taps: 2500,
    taps_per_minute: 83,
    total_xp: 15000,
    total_currency_earned: 5000,
    generators_bought: 3,
    epochs_visited: ['trypillia', 'scythia'],
    ads_watched: 2,
    level_start: 5,
    level_end: 12,
    energy_drained: 450,
    tutorial_completed: true
  }
}

// Generators analysis
{
  event_name: 'generator_purchase',
  event_data: {
    generator_id: 'scythia_archer',
    epoch_id: 'scythia',
    level_purchased: 1,
    cost: 150,
    player_currency_before: 500,
    time_since_last_generator: 300,
    total_generators_owned: 5,
    passive_xp_before: 10,
    passive_xp_after: 25
  }
}
```

---

## 7. A/B Testing Capability

### 7.1 Current State

**❌ No A/B Testing Infrastructure**

The game has no capability to:
- Assign users to experiment cohorts
- Track experiment exposure
- Measure experiment outcomes
- Run multivariate tests

### 7.2 Required A/B Testing System

```typescript
// Experiment assignment (stored per player)
interface ExperimentAssignment {
  experiment_id: string;
  variant_id: string;
  assigned_at: number;
  exposed_at?: number;
}

// Core experiment types needed for tapper game
interface GameExperiments {
  'tutorial_flow_v2': 'control' | 'variant_a' | 'variant_b';
  'ad_frequency_tuning': 'control' | 'aggressive' | 'relaxed';
  'generator_pricing_v2': 'control' | '10%_cheaper' | '20%_cheaper';
  'chest_odds_boost': 'control' | '5%_better' | '10%_better';
  'prestige_rewards': 'control' | 'more_points' | 'bonus_artifact';
  'daily_task_difficulty': 'easy' | 'medium' | 'hard';
  'energy_regen_rate': 'control' | 'faster' | 'slower';
  'passive_income_scaling': 'control' | '1.25x' | '1.5x';
}

// Event extension for A/B tracking
{
  event_name: 'tap',
  active_experiments: {
    'ad_frequency_tuning': 'relaxed',
    'generator_pricing_v2': '10%_cheaper'
  }
}
```

### 7.3 Experiment Data Model

```sql
-- Experiment definitions
CREATE TABLE experiments (
  id BIGSERIAL PRIMARY KEY,
  experiment_id TEXT UNIQUE NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'draft',  -- draft, running, paused, concluded
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  traffic_percentage INTEGER DEFAULT 100,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Variant definitions
CREATE TABLE experiment_variants (
  id BIGSERIAL PRIMARY KEY,
  experiment_id TEXT REFERENCES experiments(experiment_id),
  variant_id TEXT NOT NULL,
  weight INTEGER DEFAULT 1,  -- Relative probability
  config JSONB,  -- Feature flags for this variant
  UNIQUE(experiment_id, variant_id)
);

-- Player assignments
CREATE TABLE player_experiments (
  id BIGSERIAL PRIMARY KEY,
  telegram_id BIGINT NOT NULL,
  experiment_id TEXT REFERENCES experiments(experiment_id),
  variant_id TEXT NOT NULL,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  exposed BOOLEAN DEFAULT FALSE,
  exposed_at TIMESTAMPTZ,
  UNIQUE(telegram_id, experiment_id)
);

-- Experiment events (for statistical analysis)
CREATE TABLE experiment_events (
  id BIGSERIAL PRIMARY KEY,
  experiment_id TEXT NOT NULL,
  variant_id TEXT NOT NULL,
  telegram_id BIGINT NOT NULL,
  event_name TEXT NOT NULL,
  event_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 8. Dashboard Readiness

### 8.1 Current Dashboard Capabilities

**What's Available**
- ⚠️ Supabase tables accessible for SQL queries
- ⚠️ Basic session data in `player_sessions`
- ⚠️ Ad view counts in `ad_views`

**What's Missing**
- ❌ No dedicated analytics dashboard (Metabase, Looker, etc.)
- ❌ No real-time metrics
- ❌ No automated reports
- ❌ No alerting system
- ❌ No funnel visualization tools

### 8.2 Recommended Dashboard Stack

| Tool | Purpose | Cost |
|------|---------|------|
| **Metabase** | Self-hosted BI dashboard | Free |
| **Grafana** | Real-time metrics & alerting | Free |
| **PostHog** | Product analytics + dashboards | $0-200/mo |
| **Mixpanel** | Advanced funnel analytics | $0-1000/mo |
| **Amplitude** | Behavioral analytics | $0-2000/mo |

### 8.3 Essential Dashboard Views

**1. Overview Dashboard**
```
┌─────────────────────────────────────────────────────────┐
│ TODAY'S METRICS                                        │
├─────────────────────────────────────────────────────────┤
│ DAU: 1,234  ↑12%  │  New Users: 89  │  Revenue: $234 │
│                                                                    │
│ SESSIONS: 2,456    │  Avg Duration: 8.5min  │  Ads: 890       │
└─────────────────────────────────────────────────────────┘
```

**2. Retention Dashboard**
```
┌─────────────────────────────────────────────────────────┐
│ RETENTION CURVE                                         │
├─────────────────────────────────────────────────────────┤
│ D1: 45%  ████████████████░░░░░░░                       │
│ D3: 28%  ██████████░░░░░░░░░░░░░░                       │
│ D7: 15%  ██████░░░░░░░░░░░░░░░░░                       │
│ D14: 8%  ███░░░░░░░░░░░░░░░░░░░░░                       │
│ D30: 3%  █░░░░░░░░░░░░░░░░░░░░░░░                       │
└─────────────────────────────────────────────────────────┘
```

**3. Monetization Dashboard**
```
┌─────────────────────────────────────────────────────────┐
│ REVENUE BREAKDOWN                                       │
├─────────────────────────────────────────────────────────┤
│ Ads Revenue:  $180 (67%)  │  IAP: $54 (33%)            │
│                                                                    │
│ eCPM: $0.45  │  ARPDAU: $0.12  │  Payer Rate: 2.3%   │
│                                                                    │
│ Top Product: Super Boost x3 (45% of IAP revenue)                   │
└─────────────────────────────────────────────────────────┘
```

**4. Funnel Dashboard**
```
┌─────────────────────────────────────────────────────────┐
│ CONVERSION FUNNEL                                        │
├─────────────────────────────────────────────────────────┤
│ App Open     → 100% (10,000)                             │
│ Tutorial     →  85% (8,500)                             │
│ First Tap    →  72% (7,200)                             │
│ Lv 5         →  58% (5,800)                             │
│ First Gen    →  45% (4,500)                             │
│ Ad Watch     →  22% (2,200)                             │
│ Purchase     →   2% (200)                                │
└─────────────────────────────────────────────────────────┘
```

---

## 9. Data Pipeline Reliability

### 9.1 Current Pipeline

```
┌──────────────┐     ┌──────────────────┐     ┌──────────────┐
│  Frontend    │ ──▶ │  Edge Functions  │ ──▶ │  Supabase    │
│  React App   │     │  (Deno)          │     │  Tables      │
└──────────────┘     └──────────────────┘     └──────────────┘
       │                    │                        │
       │                    ▼                        │
       │             ┌──────────────┐                │
       └────────────▶│  Local State │                │
                     │  (Lost on    │                │
                     │   crash)     │                │
                     └──────────────┘                │
```

### 9.2 Reliability Issues

| Issue | Severity | Impact |
|-------|----------|--------|
| Session events lost on network error | HIGH | Undercount sessions |
| No event batching | MEDIUM | API rate limits, missed events |
| No client-side event queue | HIGH | Events lost on crash/unload |
| `navigator.sendBeacon` unreliable | MEDIUM | Session ends not logged |
| No event deduplication | MEDIUM | Duplicate analytics entries |

### 9.3 Recommended Pipeline Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                        CLIENT SIDE                                │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │ Analytics SDK                                                │  │
│  │  ├── Event Queue (IndexedDB, survives crashes)              │  │
│  │  ├── Batching (100 events or 5s interval)                 │  │
│  │  ├── Deduplication (event_id hash)                         │  │
│  │  ├── Retry logic (exponential backoff)                     │  │
│  │  └── Offline handling (queue until online)                  │  │
│  └────────────────────────────────────────────────────────────┘  │
│                              │                                    │
│                              ▼                                    │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │ Event Format (Standardized)                                  │  │
│  │  { event_id, event_name, timestamp, telegram_id,            │  │
│  │    event_data, session_id, app_version, sdk_version }       │  │
│  └────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────────┐
│                        SERVER SIDE                                │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────────┐   │
│  │ Edge Func    │───▶│ Event        │───▶│ Analytics        │   │
│  │ /analytics   │    │ Validator    │    │ Pipeline         │   │
│  └──────────────┘    └──────────────┘    └──────────────────┘   │
│                                                 │                 │
│                                                 ▼                 │
│                              ┌─────────────────────────────────┐  │
│                              │ Data Warehouse                  │  │
│                              │  ├── events_*/ (raw)          │  │
│                              │  ├── events_daily (aggregated) │  │
│                              │  ├── player_metrics            │  │
│                              │  └── cohorts                   │  │
│                              └─────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
```

---

## 10. Critical Recommendations (Priority Order)

### Phase 1: Foundation (Week 1-2)

1. **Create `analytics_events` table**
   ```sql
   CREATE TABLE analytics_events (
     id BIGSERIAL PRIMARY KEY,
     telegram_id BIGINT,
     event_name TEXT NOT NULL,
     event_data JSONB NOT NULL,
     session_id TEXT,
     client_timestamp BIGINT,
     server_timestamp BIGINT DEFAULT EXTRACT(EPOCH FROM NOW())::BIGINT,
     created_at TIMESTAMPTZ DEFAULT NOW()
   );
   CREATE INDEX idx_analytics_events_name ON analytics_events(event_name);
   CREATE INDEX idx_analytics_events_telegram ON analytics_events(telegram_id);
   CREATE INDEX idx_analytics_events_created ON analytics_events(created_at);
   ```

2. **Create `analytics` Edge Function**
   - Accept batched events
   - Validate schema
   - Insert to `analytics_events`
   - Return success/failure

3. **Add Core Gameplay Events**
   - `tap` (batched, every 100 taps)
   - `tap_upgrade`
   - `generator_buy`
   - `level_up`

### Phase 2: Monetization (Week 3-4)

4. **Add Revenue Events**
   - `ad_offered`, `ad_started`, `ad_completed`, `ad_skipped`
   - `iap_attempted`, `iap_completed`, `iap_failed`

5. **Create Revenue Summary Table**
   ```sql
   CREATE TABLE daily_revenue (
     date DATE PRIMARY KEY,
     ad_revenue_cents BIGINT,
     ad_impressions INTEGER,
     iap_revenue_cents BIGINT,
     iap_transactions INTEGER,
     new_payers INTEGER,
     total_active_payers INTEGER
   );
   ```

### Phase 3: Retention (Week 5-6)

6. **Add Cohort Tracking**
   - `cohort_registration` event on first play
   - Daily job to calculate retention

7. **Add Funnel Events**
   - All onboarding funnel steps
   - All monetization funnel steps

### Phase 4: Advanced Analytics (Week 7-8)

8. **Implement A/B Testing**
   - Experiment definitions table
   - Variant assignment
   - Exposure tracking

9. **Build Dashboard**
   - Metabase setup
   - Essential dashboards
   - Automated reports

---

## 11. Implementation Checklist

### Must Have (MVP Analytics)

- [ ] `analytics_events` table created
- [ ] `analytics` edge function created
- [ ] Tap batching implemented (100 taps/event)
- [ ] Session summary on session end
- [ ] Ad view completion tracking
- [ ] IAP webhook revenue logging
- [ ] Daily DAU count job

### Should Have (Production Analytics)

- [ ] Event deduplication
- [ ] Client-side event queue (IndexedDB)
- [ ] Batch event sending (5s interval)
- [ ] Cohort table
- [ ] Retention calculation job
- [ ] Basic Metabase dashboard

### Nice to Have (Advanced Analytics)

- [ ] A/B testing framework
- [ ] Real-time metrics (Grafana)
- [ ] Predictive churn model
- [ ] LTV prediction
- [ ] Custom dashboards per stakeholder

---

## 12. Conclusion

The Virtual Museum Tapper Game has a solid technical foundation with Supabase for data storage and Edge Functions for server-side logic. However, the analytics implementation falls significantly short of AAA studio standards.

**Key Gaps:**
1. No structured event logging system
2. No funnel tracking capability
3. No A/B testing infrastructure
4. No dashboard/reporting system
5. No cohort analysis capability
6. Missing critical gameplay events

**Recommended Path Forward:**
1. Implement Phase 1 immediately (2 weeks)
2. Add monetization tracking (Week 3-4)
3. Build retention system (Week 5-6)
4. Deploy dashboards and A/B testing (Week 7-8)

With this analytics infrastructure, the team can make data-driven decisions about game balancing, monetization optimization, and player retention strategies.

---

**Audit Completed By:** Analytics Engineering Team  
**Next Review:** After Phase 1 implementation