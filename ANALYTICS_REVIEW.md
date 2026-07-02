# Analytics Review — Virtual Museum Tapper Game v1.6.6

**Reviewer:** Analytics Engineering Team  
**Date:** 2026-07-02  
**Version:** 1.0  
**Classification:** Internal AAA Studio Standards Review  
**Overall Grade:** C (58/100)

---

## Executive Summary

The Virtual Museum Tapper Game has a **foundational but critically incomplete analytics infrastructure**. While basic session tracking and ad view logging exist, the system lacks comprehensive event tracking, funnel analysis, revenue attribution, and retention cohort tracking required for data-driven optimization at AAA mobile game studio level.

### Current State Assessment

| Aspect | Status | Score | Gap |
|--------|--------|-------|-----|
| Telemetry Implementation | ⚠️ Basic | 45/100 | No dedicated analytics pipeline |
| Event Tracking | ❌ Missing | 0/100 | No gameplay events captured |
| Player Metrics | ⚠️ Partial | 30/100 | Only game_progress state |
| Revenue Tracking | ⚠️ Minimal | 25/100 | Webhook-only, no attribution |
| Retention Metrics | ❌ None | 0/100 | No cohort tracking |
| Session Tracking | ✅ Basic | 65/100 | No enrichment data |
| Data Quality | ⚠️ Fragmented | 40/100 | No validation/standardization |
| **OVERALL** | **C** | **58/100** | **Major gaps in all areas** |

---

## 1. Telemetry Implementation Review

### 1.1 Current Implementation

**What's Working:**
- ✅ Session tracking via `track-session` edge function
- ✅ Basic activity pings every 60 seconds
- ✅ `navigator.sendBeacon` for page unload
- ✅ Updates `last_online_at` on game_progress

**Current Data Flow:**
```
Player Action → Local State → Remote Save (15s) → game_progress table
                                     ↓
Session Events → track-session → player_sessions table
                                     ↓
Ad Actions → adsgram-reward/claim-ad-reward → ad_views table
```

### 1.2 CRITICAL ISSUES

#### Issue #1: Missing Dedicated Analytics Table

| Field | Value |
|-------|-------|
| **Severity** | 🔴 CRITICAL |
| **Title** | No `analytics_events` Table Exists |
| **Affected Files** | Database (nonexistent) |
| **Description** | No dedicated analytics_events table for structured event logging. All analytics must piggyback on game_progress and player_sessions tables. |
| **Why This Matters** | Cannot track granular gameplay events (taps, purchases, upgrades). Makes funnel analysis impossible. |
| **Potential Impact** | Complete blind spot for game balance decisions, monetization optimization, and retention analysis. |
| **Risk if Ignored** | **HIGH** — Unable to understand player behavior, optimize LTV, or measure feature effectiveness. |
| **Recommended Solution** | Create analytics_events table with JSONB event_data for flexible event schema: |
| **Estimated Effort** | 2-4 hours |
| **Responsible Agent** | Backend Engineer |

```sql
CREATE TABLE analytics_events (
  id BIGSERIAL PRIMARY KEY,
  telegram_id BIGINT NOT NULL,
  event_name TEXT NOT NULL,
  event_data JSONB NOT NULL DEFAULT '{}',
  session_id UUID,
  client_timestamp BIGINT,
  server_timestamp BIGINT DEFAULT EXTRACT(EPOCH FROM NOW())::BIGINT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_analytics_events_name ON analytics_events(event_name);
CREATE INDEX idx_analytics_events_telegram ON analytics_events(telegram_id);
CREATE INDEX idx_analytics_events_session ON analytics_events(session_id);
CREATE INDEX idx_analytics_events_created ON analytics_events(created_at);
```

---

#### Issue #2: No Analytics Edge Function

| Field | Value |
|-------|-------|
| **Severity** | 🔴 CRITICAL |
| **Title** | Missing `/analytics` Edge Function |
| **Affected Files** | supabase/functions/analytics (nonexistent) |
| **Description** | No edge function to receive, validate, and store analytics events. Events have nowhere to go. |
| **Why This Matters** | Frontend has no way to send structured analytics events to the backend. |
| **Potential Impact** | Cannot implement any analytics tracking without creating this infrastructure. |
| **Risk if Ignored** | **HIGH** — Analytics system cannot exist without event ingestion endpoint. |
| **Recommended Solution** | Create `analytics` edge function that: |
| | - Accepts batched events (up to 100 per request) |
| | - Validates event schema |
| | - Deduplicates using event_id hash |
| | - Inserts to analytics_events table |
| | - Returns success/failure per event |
| **Estimated Effort** | 4-6 hours |
| **Responsible Agent** | Backend Engineer |

---

#### Issue #3: No Event Schema Standardization

| Field | Value |
|-------|-------|
| **Severity** | 🟠 HIGH |
| **Title** | Missing Event Schema Definition |
| **Affected Files** | src/types/analytics.ts (nonexistent) |
| **Description** | No standardized analytics event interface. Events are not typed or validated. |
| **Why This Matters** | Different developers will log events differently, making analysis inconsistent and error-prone. |
| **Potential Impact** | Data quality issues, difficult queries, unreliable dashboards. |
| **Risk if Ignored** | **MEDIUM** — Leads to technical debt and query complexity. |
| **Recommended Solution** | Create TypeScript interface for all events: |
| **Estimated Effort** | 2-3 hours |
| **Responsible Agent** | Frontend Engineer |

```typescript
// src/types/analytics.ts
export interface AnalyticsEvent {
  event_id: string;           // UUID for deduplication
  event_name: string;         // e.g., 'tap', 'purchase_completed'
  timestamp: number;          // Unix milliseconds (client)
  server_timestamp: number;   // Unix milliseconds (server)
  telegram_id: number;        // Player identifier
  session_id: string;         // UUID for session linking
  
  // Player context
  level: number;
  prestige_level: number;
  epoch_id: string;
  
  // Event-specific payload
  event_data: Record<string, unknown>;
  
  // Technical metadata
  app_version: string;
  platform: 'ios' | 'android' | 'web' | 'desktop';
  sdk_version: string;
  client_time: number;        // For latency analysis
}
```

---

## 2. Event Tracking Review

### 2.1 Currently Tracked Events

| Event | Source | Coverage |
|-------|--------|----------|
| `session_start` | `track-session` | ✅ Basic |
| `session_end` | `track-session` | ✅ Basic |
| `session_activity` | `track-session` | ✅ 60s interval |
| `ad_view` | `ad_views` table | ✅ Basic |
| `ad_reward_claimed` | `adsgram-reward` | ✅ Basic |
| `game_progress_update` | `save-game-state` | ✅ Full state (15s) |

### 2.2 CRITICAL MISSING EVENTS

#### Issue #4: No Core Gameplay Events

| Field | Value |
|-------|-------|
| **Severity** | 🔴 CRITICAL |
| **Title** | Zero Gameplay Events Tracked |
| **Affected Files** | src/hooks/useGame.ts, src/components/TapArea.tsx |
| **Description** | Not a single tap, generator purchase, upgrade, level-up, or epoch unlock is tracked as an analytics event. |
| **Why This Matters** | Cannot calculate tap-to-level conversion, optimal generator balance, or epoch difficulty tuning. |
| **Potential Impact** | Game balancing decisions are based on intuition, not data. |
| **Risk if Ignored** | **HIGH** — Unable to optimize core game loop retention. |
| **Recommended Solution** | Implement all P0 gameplay events (see Section 2.3) |
| **Estimated Effort** | 8-12 hours |
| **Responsible Agent** | Full-Stack Engineer |

### 2.3 Required Event Inventory (AAA Standard)

#### P0 - CRITICAL (Core Gameplay)

| Event Name | Description | Required Data |
|------------|-------------|---------------|
| `tap` | Every tap on museum | `tap_power`, `energy_active`, `combo_count`, `epoch_id`, `level`, `prestige_level` |
| `tap_upgrade` | Tap power purchased | `new_tap_power`, `cost`, `currency_before`, `currency_after` |
| `generator_buy` | First purchase of generator | `generator_id`, `epoch_id`, `cost`, `currency_before` |
| `generator_upgrade` | Generator level increased | `generator_id`, `new_level`, `cost`, `production_before`, `production_after` |
| `epoch_unlock` | New epoch unlocked | `epoch_id`, `previous_epoch`, `level_at_unlock`, `total_time_played` |
| `level_up` | Player leveled up | `new_level`, `total_xp`, `time_to_level`, `xp_from_taps`, `xp_from_passive` |
| `prestige_started` | Prestige flow initiated | `current_level`, `total_xp`, `projected_points` |
| `prestige_completed` | Prestige executed | `prestige_level`, `points_earned`, `time_played`, `generators_lost` |

#### P0 - CRITICAL (Monetization)

| Event Name | Description | Required Data |
|------------|-------------|---------------|
| `ad_offered` | Ad modal shown | `ad_type`, `session_duration`, `prestige_level`, `level` |
| `ad_started` | User clicked watch | `ad_type`, `latency_ms`, `offer_to_click_time` |
| `ad_completed` | Ad watched fully | `ad_type`, `watch_duration_ms`, `reward_type`, `reward_amount` |
| `ad_skipped` | User closed early | `ad_type`, `watch_duration_ms`, `close_reason` |
| `iap_viewed` | IAP screen opened | `source` (boosters/shop), `session_duration` |
| `iap_attempted` | Purchase flow started | `product_id`, `price_stars`, `currency` |
| `iap_completed` | Purchase successful | `product_id`, `charge_id`, `stars_amount`, `items_granted` |
| `iap_failed` | Purchase failed/cancelled | `product_id`, `failure_step`, `failure_reason` |

#### P1 - HIGH (Retention)

| Event Name | Description | Required Data |
|------------|-------------|---------------|
| `first_session_complete` | First session ended | `session_duration`, `level_reached`, `tutorial_completed` |
| `tutorial_start` | Tutorial modal opened | `step`, `is_new_user` |
| `tutorial_complete` | Tutorial dismissed | `steps_completed`, `time_spent_ms`, `skip_used` |
| `daily_return` | Player returned | `days_since_last_session`, `previous_max_level` |
| `streak_maintained` | Daily check-in | `streak_day`, `streak_reward_type`, `reward_amount` |
| `streak_broken` | Missed daily | `broken_streak`, `days_missed`, `total_sessions` |

#### P1 - HIGH (Progression)

| Event Name | Description | Required Data |
|------------|-------------|---------------|
| `artifact_fragment_found` | Artifact part obtained | `artifact_id`, `rarity`, `source` (gacha/chest/ad) |
| `artifact_completed` | Artifact assembled | `artifact_id`, `time_to_complete_days`, `duplicates_used` |
| `artifact_upgraded` | Artifact leveled up | `artifact_id`, `new_level`, `parts_used` |
| `chest_opened` | Gacha chest used | `chest_type`, `cost`, `result_rarity`, `result_artifact` |
| `offline_income_claimed` | Offline rewards collected | `offline_duration_hours`, `xp_earned`, `currency_earned` |

#### P2 - MEDIUM (Social/Viral)

| Event Name | Description | Required Data |
|------------|-------------|---------------|
| `referral_link_copy` | Referral link copied | `referral_count_before`, `source` (share_btn/auto) |
| `referral_link_share` | Shared to platform | `platform`, `referral_count_before` |
| `referral_signup` | Referred user joined | `referrer_id`, `new_user_first_session_duration` |
| `leaderboard_viewed` | Leaderboard opened | `current_rank`, `view_duration_ms`, `source_tab` |
| `social_share` | Game shared | `platform`, `content_type` (achievement/score/reward) |

---

#### Issue #5: No Ad Funnel Analytics

| Field | Value |
|-------|-------|
| **Severity** | 🔴 CRITICAL |
| **Title** | Missing Ad View → Completion Funnel |
| **Affected Files** | src/components/AdsGramButton.tsx, src/components/AdSystem.tsx |
| **Description** | Only successful ad completions are logged. No tracking of: ad offered vs shown, user interest, completion rate, skip rate, failure reasons. |
| **Why This Matters** | Cannot optimize ad placement, frequency, or identify friction points in the ad flow. |
| **Potential Impact** | Revenue optimization is guesswork. |
| **Risk if Ignored** | **HIGH** — Ad revenue cannot be systematically improved. |
| **Recommended Solution** | Add all ad funnel events: `ad_offered`, `ad_started`, `ad_completed`, `ad_skipped` |
| **Estimated Effort** | 4-6 hours |
| **Responsible Agent** | Frontend Engineer |

---

## 3. Player Metrics Review

### 3.1 Current Metrics

| Metric | Source | Completeness |
|--------|--------|--------------|
| Level | game_progress.level | ✅ Complete |
| Total XP | game_progress.total_xp | ✅ Complete |
| Currency | game_progress.currency | ✅ Complete |
| Generators | game_progress.owned_generators | ✅ Complete |
| Artifacts | game_progress.artifact_parts/levels | ✅ Complete |
| Prestige | game_progress.prestige_* | ✅ Complete |
| Energy | game_progress.energy | ✅ Complete |
| Session count | player_sessions | ⚠️ Basic (count only) |
| Session duration | player_sessions.total_session_seconds | ⚠️ Basic (aggregate only) |

### 3.2 MISSING METRICS

#### Issue #6: No Per-Session Player Metrics

| Field | Value |
|-------|-------|
| **Severity** | 🟠 HIGH |
| **Title** | Session Metrics Lack Enrichment |
| **Affected Files** | supabase/functions/track-session/index.ts |
| **Description** | player_sessions only tracks duration. No per-session stats: taps per session, XP earned, currency spent, achievements unlocked. |
| **Why This Matters** | Cannot calculate session quality, engagement depth, or correlate behavior with retention. |
| **Potential Impact** | Cannot identify high-value vs. casual players by session behavior. |
| **Risk if Ignored** | **MEDIUM** — Limits retention cohort analysis. |
| **Recommended Solution** | Add session summary events with rich player state at session end. |
| **Estimated Effort** | 3-4 hours |
| **Responsible Agent** | Backend Engineer |

---

#### Issue #7: No Lifetime Value Calculation

| Field | Value |
|-------|-------|
| **Severity** | 🟠 HIGH |
| **Title** | No LTV Tracking Infrastructure |
| **Affected Files** | Database (nonexistent metrics table) |
| **Description** | No calculated LTV metrics. Cannot segment players by value tier. |
| **Why This Matters** | Cannot prioritize retention efforts, personalize offers, or measure IAP effectiveness by segment. |
| **Potential Impact** | Inefficient monetization and retention spend. |
| **Risk if Ignored** | **MEDIUM** — Limits monetization optimization. |
| **Recommended Solution** | Create player_metrics_daily table for rolling LTV calculation. |
| **Estimated Effort** | 4-6 hours |
| **Responsible Agent** | Analytics Engineer |

---

## 4. Revenue Tracking Review

### 4.1 Current State

**Working:**
- ✅ Telegram Stars webhook delivery
- ✅ Booster granting via `telegram-payments`
- ✅ Idempotency via `purchase_log` in boosters JSONB
- ✅ Ad view logging in `ad_views` table

**Issues:**

#### Issue #8: No Revenue Attribution

| Field | Value |
|-------|-------|
| **Severity** | 🟠 HIGH |
| **Title** | Purchases Not Attributed to Source |
| **Affected Files** | supabase/functions/telegram-payments/index.ts |
| **Description** | Successful purchases are logged but not attributed: no acquisition source, no campaign ID, no A/B test variant. |
| **Why This Matters** | Cannot measure marketing campaign ROI or optimize user acquisition channels. |
| **Potential Impact** | Blind to which channels drive paying users. |
| **Risk if Ignored** | **MEDIUM** — Marketing optimization is impossible. |
| **Recommended Solution** | Capture `start_param` (referral code) from Telegram initData and log with purchase. |
| **Estimated Effort** | 2-3 hours |
| **Responsible Agent** | Backend Engineer |

---

#### Issue #9: No Ad Revenue Tracking

| Field | Value |
|-------|-------|
| **Severity** | 🟠 HIGH |
| **Title** | No Estimated Ad Revenue Per User |
| **Affected Files** | supabase/functions/adsgram-reward/index.ts |
| **Description** | Ad views are logged but not attributed with estimated revenue. Cannot calculate ARPU. |
| **Why This Matters** | Cannot measure ad monetization effectiveness or LTV from ads. |
| **Potential Impact** | Cannot optimize ad placement or frequency for revenue. |
| **Risk if Ignored** | **MEDIUM** — Ad revenue optimization is blind. |
| **Recommended Solution** | Create daily_revenue table with estimated eCPM per user segment. |
| **Estimated Effort** | 3-4 hours |
| **Responsible Agent** | Analytics Engineer |

---

#### Issue #10: No IAP Failure Analysis

| Field | Value |
|-------|-------|
| **Severity** | 🟡 MEDIUM |
| **Title** | IAP Failures Not Logged |
| **Affected Files** | supabase/functions/telegram-payments/index.ts |
| **Description** | Cancelled and failed purchases are not logged. Cannot identify friction points. |
| **Why This Matters** | Cannot optimize checkout flow or identify payment method issues. |
| **Potential Impact** | Revenue lost to avoidable friction. |
| **Risk if Ignored** | **MEDIUM** — Checkout optimization is guesswork. |
| **Recommended Solution** | Add `iap_failed` event tracking with failure reason. |
| **Estimated Effort** | 2 hours |
| **Responsible Agent** | Frontend Engineer |

---

## 5. Retention Metrics Review

### 5.1 Current State

**Working:**
- ✅ `last_online_at` tracking in game_progress
- ✅ `dailyStreak` tracking
- ✅ Basic session timestamps in player_sessions

**Missing:**

#### Issue #11: No Cohort Analysis Infrastructure

| Field | Value |
|-------|-------|
| **Severity** | 🔴 CRITICAL |
| **Title** | No Retention Cohort Tables |
| **Affected Files** | Database (nonexistent) |
| **Description** | No cohort tracking tables. Cannot calculate D1, D7, D30 retention rates. |
| **Why This Matters** | Cannot measure game health or compare retention across updates. |
| **Potential Impact** | Blind to player churn and unable to measure feature impact on retention. |
| **Risk if Ignored** | **HIGH** — Critical KPI is unmeasurable. |
| **Recommended Solution** | Create `player_cohorts` table and daily retention calculation job. |
| **Estimated Effort** | 6-8 hours |
| **Responsible Agent** | Analytics Engineer |

```sql
CREATE TABLE player_cohorts (
  telegram_id BIGINT PRIMARY KEY,
  cohort_date DATE NOT NULL,           -- First play date
  cohort_week INTEGER,                 -- ISO week number
  install_source TEXT,                  -- Telegram referral param
  first_level INTEGER,                 -- Level at first session
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE daily_retention (
  cohort_date DATE NOT NULL,
  day_number INTEGER NOT NULL,          -- D0, D1, D2, ... D30
  retained_users INTEGER NOT NULL,
  churned_users INTEGER NOT NULL,
  retention_rate NUMERIC(5,2),          -- 0.00 to 1.00
  PRIMARY KEY (cohort_date, day_number)
);
```

---

#### Issue #12: No Funnel Tracking

| Field | Value |
|-------|-------|
| **Severity** | 🔴 CRITICAL |
| **Title** | No Onboarding Funnel Defined or Tracked |
| **Affected Files** | All onboarding-related components |
| **Description** | No events for onboarding funnel steps: Tutorial Start → First Tap → Lv 5 → First Generator → Epoch 2. |
| **Why This Matters** | Cannot identify where players drop off during onboarding. |
| **Potential Impact** | Cannot optimize onboarding to improve D1 retention. |
| **Risk if Ignored** | **HIGH** — First experience optimization is impossible. |
| **Recommended Solution** | Add funnel step events and create funnel analysis queries. |
| **Estimated Effort** | 4-6 hours |
| **Responsible Agent** | Full-Stack Engineer |

---

## 6. Session Tracking Review

### 6.1 Current Implementation Quality

| Aspect | Score | Notes |
|--------|-------|-------|
| Session start tracking | ✅ Good | Creates new session row |
| Session end tracking | ⚠️ Partial | sendBeacon unreliable on mobile |
| Activity pings | ⚠️ 60s interval | Too infrequent for accurate engagement |
| Session duration calc | ✅ Good | Server-side timestamp math |
| Multiple tabs | ⚠️ Basic | Closes old session on new start |

### 6.2 Issues

#### Issue #13: Session Tracking Reliability

| Field | Value |
|-------|-------|
| **Severity** | 🟡 MEDIUM |
| **Title** | Session End Events Frequently Lost |
| **Affected Files** | src/App.tsx (beforeunload handler) |
| **Description** | `navigator.sendBeacon` is unreliable on mobile Telegram. Sessions may not be closed properly. |
| **Why This Matters** | Session duration metrics are undercounted. DAU/MAU calculations may be inaccurate. |
| **Potential Impact** | Analytics dashboard shows shorter sessions than reality. |
| **Risk if Ignored** | **MEDIUM** — Metric quality degradation. |
| **Recommended Solution** | Use visibilitychange + pagehide events with fetch fallback. Implement session timeout detection. |
| **Estimated Effort** | 2-3 hours |
| **Responsible Agent** | Frontend Engineer |

---

#### Issue #14: No Session Quality Metrics

| Field | Value |
|-------|-------|
| **Severity** | 🟡 MEDIUM |
| **Title** | Session Duration is Only Metric |
| **Affected Files** | supabase/functions/track-session/index.ts |
| **Description** | No taps, XP, purchases, or other quality indicators per session. |
| **Why This Matters** | Cannot identify "engaged" vs "zombie" sessions. |
| **Potential Impact** | DAU overstates true engagement. |
| **Risk if Ignored** | **LOW** — Workaround exists via game_progress analysis. |
| **Recommended Solution** | Add session summary event with quality metrics at session end. |
| **Estimated Effort** | 3-4 hours |
| **Responsible Agent** | Backend Engineer |

---

## 7. Data Quality Review

### 7.1 Current Issues

#### Issue #15: No Event Validation

| Field | Value |
|-------|-------|
| **Severity** | 🟡 MEDIUM |
| **Title** | Analytics Events Not Validated |
| **Affected Files** | All analytics-sending code |
| **Description** | No schema validation on events. Malformed events corrupt data. |
| **Why This Matters** | Bad data leads to incorrect dashboards and bad decisions. |
| **Potential Impact** | Silent data corruption that undermines trust in analytics. |
| **Risk if Ignored** | **MEDIUM** — Requires manual data cleaning. |
| **Recommended Solution** | Add JSON Schema validation in analytics edge function. |
| **Estimated Effort** | 3-4 hours |
| **Responsible Agent** | Backend Engineer |

---

#### Issue #16: No Event Deduplication

| Field | Value |
|-------|-------|
| **Severity** | 🟡 MEDIUM |
| **Title** | Duplicate Events Not Prevented |
| **Affected Files** | supabase/functions/analytics (nonexistent) |
| **Description** | No deduplication mechanism. Network retries can create duplicate analytics rows. |
| **Why This Matters** | Dashboard metrics are inflated. Attribution is wrong. |
| **Potential Impact** | Overstated KPIs lead to poor decisions. |
| **Risk if Ignored** | **MEDIUM** — Requires post-hoc deduplication queries. |
| **Recommended Solution** | Use event_id hash for dedup with 24-hour window. |
| **Estimated Effort** | 2 hours |
| **Responsible Agent** | Backend Engineer |

---

#### Issue #17: No Client-Side Event Queue

| Field | Value |
|-------|-------|
| **Severity** | 🟠 HIGH |
| **Title** | Events Lost on Network Failure |
| **Affected Files** | src/lib/analytics.ts (nonexistent) |
| **Description** | Events sent synchronously. Network failures lose events silently. |
| **Why This Matters** | Analytics undercounts true activity. |
| **Potential Impact** | Incomplete picture of player behavior. |
| **Risk if Ignored** | **MEDIUM** — Systematic undercounting. |
| **Recommended Solution** | Implement IndexedDB event queue with retry logic. |
| **Estimated Effort** | 4-6 hours |
| **Responsible Agent** | Frontend Engineer |

---

## 8. Infrastructure Gaps

### 8.1 Missing Infrastructure

| Component | Status | Priority |
|-----------|--------|----------|
| Analytics Edge Function | ❌ Missing | 🔴 P0 |
| analytics_events Table | ❌ Missing | 🔴 P0 |
| Event Type Definitions | ❌ Missing | 🔴 P0 |
| Event Queue (IndexedDB) | ❌ Missing | 🟠 P1 |
| Dashboard/BI Tool | ❌ Missing | 🟠 P1 |
| Retention Cohort Tables | ❌ Missing | 🔴 P0 |
| A/B Testing Framework | ❌ Missing | 🟡 P2 |
| Real-time Metrics | ❌ Missing | 🟡 P2 |
| Daily Revenue Summary | ❌ Missing | 🟠 P1 |
| LTV Calculation Job | ❌ Missing | 🟠 P1 |

---

## 9. Recommended Implementation Roadmap

### Phase 1: Foundation (Week 1-2)

| Task | Effort | Priority |
|------|--------|----------|
| Create `analytics_events` table | 2h | 🔴 P0 |
| Create `/analytics` edge function | 4h | 🔴 P0 |
| Define event schema TypeScript types | 2h | 🔴 P0 |
| Implement client-side analytics SDK stub | 4h | 🔴 P0 |
| Add tap batching events (every 100 taps) | 4h | 🔴 P0 |
| Add session summary events | 3h | 🟠 P1 |

### Phase 2: Core Events (Week 2-3)

| Task | Effort | Priority |
|------|--------|----------|
| Add all P0 gameplay events | 8h | 🔴 P0 |
| Add ad funnel events | 4h | 🔴 P0 |
| Add IAP tracking events | 4h | 🔴 P0 |
| Add IndexedDB event queue | 6h | 🟠 P1 |
| Add event deduplication | 2h | 🟡 P2 |

### Phase 3: Retention & Revenue (Week 3-4)

| Task | Effort | Priority |
|------|--------|----------|
| Create player_cohorts table | 3h | 🔴 P0 |
| Create retention calculation job | 4h | 🔴 P0 |
| Add onboarding funnel events | 4h | 🔴 P0 |
| Create daily_revenue table | 3h | 🟠 P1 |
| Add revenue attribution | 3h | 🟠 P1 |

### Phase 4: Dashboard & Insights (Week 4-6)

| Task | Effort | Priority |
|------|--------|----------|
| Set up Metabase/BI dashboard | 8h | 🟠 P1 |
| Build essential dashboards | 12h | 🟠 P1 |
| Create automated reports | 6h | 🟡 P2 |
| Implement A/B testing framework | 16h | 🟡 P2 |
| Build LTV prediction model | 24h | 🟡 P2 |

---

## 10. Risk Assessment Summary

| Risk | Severity | Likelihood | Impact | Mitigation |
|------|----------|------------|--------|------------|
| Cannot measure game balance | 🔴 HIGH | **Occurred** | Game design is guesswork | Implement gameplay events |
| Cannot optimize monetization | 🟠 MEDIUM | **Occurred** | Revenue left on table | Add revenue tracking |
| Cannot measure retention | 🔴 HIGH | **Occurred** | Blind to churn | Create cohort tables |
| Data quality issues | 🟡 MEDIUM | **Likely** | Wrong decisions | Add validation/dedup |
| Events lost on network error | 🟡 MEDIUM | **Likely** | Undercounting | Implement event queue |

---

## 11. Immediate Action Items

### Must Fix (This Sprint)

1. **Create `analytics_events` table** (2h) — Backend Engineer
2. **Create `/analytics` edge function** (4h) — Backend Engineer
3. **Define event schema** (2h) — Frontend Engineer
4. **Add tap batching events** (4h) — Frontend Engineer
5. **Add ad funnel events** (4h) — Frontend Engineer

### Should Fix (Next Sprint)

6. **Create player_cohorts table** (3h) — Backend Engineer
7. **Add IndexedDB event queue** (6h) — Frontend Engineer
8. **Add retention calculation job** (4h) — Analytics Engineer
9. **Add onboarding funnel events** (4h) — Frontend Engineer

### Nice to Have (Future)

10. Set up BI dashboard
11. Implement A/B testing
12. Build LTV prediction

---

## 12. Appendix: Event Schema Examples

### Tap Event
```typescript
{
  event_id: "uuid-v4",
  event_name: "tap",
  timestamp: 1719920400000,
  telegram_id: 123456789,
  session_id: "session-uuid",
  level: 45,
  prestige_level: 0,
  epoch_id: "scythia",
  event_data: {
    tap_power: 3,
    energy_active: false,
    combo_count: 12,
    tap_position_x: 150,
    tap_position_y: 300
  },
  app_version: "1.6.6",
  platform: "android",
  sdk_version: "1.0.0"
}
```

### Purchase Event
```typescript
{
  event_id: "uuid-v4",
  event_name: "iap_completed",
  timestamp: 1719920400000,
  telegram_id: 123456789,
  session_id: "session-uuid",
  level: 78,
  prestige_level: 1,
  epoch_id: "kyiv_rus",
  event_data: {
    product_id: "super_boost_30m",
    charge_id: "telegram_charge_xxx",
    stars_amount: 100,
    items_granted: { type: "booster", id: "super_boost", duration_minutes: 30 },
    install_source: "telegram_ad",
    first_purchase: false
  },
  app_version: "1.6.6",
  platform: "ios",
  sdk_version: "1.0.0"
}
```

---

## 13. Conclusion

The Virtual Museum Tapper Game analytics implementation is **at a pre-production stage** despite being version 1.6.6. The game has strong session tracking but lacks the comprehensive event tracking, retention analysis, and revenue attribution required for AAA mobile game studio operations.

**Critical Path to Production:**
1. Create analytics infrastructure (table + edge function)
2. Implement P0 gameplay events
3. Implement P0 monetization events
4. Build retention cohort system
5. Deploy basic dashboards

**Estimated Time to MVP Analytics:** 3-4 weeks  
**Estimated Time to Full AAA Analytics:** 6-8 weeks

**Investment Required:** ~80-100 hours engineering time

---

**Review Completed By:** Analytics Engineering Team  
**Next Review:** After Phase 1 implementation (Week 2)
