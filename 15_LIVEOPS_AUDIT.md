# 🎮 Virtual Museum Tapper Game — LiveOps Audit Report

**Audit Date:** July 2, 2026  
**Auditor:** LiveOps Director  
**Game Version:** 1.6.6  
**Standard:** AAA Studio (Riot Games, Blizzard, Supercell)

---

## Executive Summary

The Virtual Museum Tapper Game has a **functional but incomplete LiveOps infrastructure**. Core retention mechanics exist (daily rewards, streaks, tasks, referrals), but the system lacks enterprise-grade features required for sustained live operations at scale: no Battle Pass, no seasonal content pipeline, limited push notification capabilities, no A/B testing, and no event system.

**LiveOps Readiness Score: 4.5/10**

---

## 1. Daily Reward System Analysis

### Current Implementation ✅

| Feature | Status | Notes |
|---------|--------|-------|
| 7-day check-in cycle | ✅ | DAILY_REWARDS array with progressive rewards |
| Streak tracking | ✅ | DailyStreakModal with weekly bonuses |
| Special rewards | ✅ | Day 7 grants Gacha Ticket, Day 4+ grants XP |
| Weekly milestone bonuses | ✅ | Week numbers cap at 1500 currency |
| Reset handling | ✅ | UTC-based date tracking with yesterday logic |
| Visual feedback | ✅ | Flame icons, progress indicators, animations |

### Strengths
- **Double-layered reward system**: Check-in rewards (DAILY_REWARDS) + Streak rewards (getStreakReward) create layered engagement
- **7-day cycle with milestone psychology**: Day 7 Gacha ticket creates weekly "payoff" moment
- **Graceful degradation**: Handles missed days, new players, edge cases

### Weaknesses
- **Static reward structure**: Rewards are hardcoded, cannot be adjusted per season/event
- **No bonus multipliers**: No "2x Check-in Week" or themed events
- **Single currency type**: Only currency + XP rewards; no gems/premium currency differentiation
- **Limited engagement hooks**: No "Come back in X hours" messaging

### AAA Comparison
| Feature | This Game | Clash Royale | Brawl Stars |
|---------|-----------|-------------|-------------|
| Check-in rewards | 7-day loop | 7-day loop + bonus | 7-day loop + chest |
| Seasonal multipliers | ❌ | ✅ | ✅ |
| Tiered milestones | Weekly only | Match + season | Season only |
| Premium currency check-in | ❌ | ✅ (Gems) | ✅ (Coins + Gems) |

### Recommendations
1. **Add premium currency** (Gems/Stars) to check-in rewards, especially Day 7
2. **Implement "Double Reward Days"** flag that can be toggled via backend config
3. **Add check-in streaks to push notifications** — "Don't break your 15-day streak!"

---

## 2. Event System Readiness

### Current State: ⚠️ FOUNDATIONAL

The game has **no formal event system**. Events are hardcoded in component logic.

### What Exists
- Gacha system with rarity tiers (common 60%, rare 25%, epic 10%, legendary 4%, secret 1%)
- Referral bonuses (100 currency per referral, 50 for referred player)
- Ad-based reward events (session ads, chest ads, energy ads)
- Epoch/era progression system (12 Ukrainian + 8 World epochs)

### What's Missing

| Event Feature | Status | Priority |
|--------------|--------|----------|
| Server-side event config | ❌ | **CRITICAL** |
| Limited-time offers (LTO) | ❌ | **CRITICAL** |
| Themed events (holiday, anniversary) | ❌ | **HIGH** |
| Collaborative events | ❌ | **MEDIUM** |
| Tournament/competition events | ⚠️ Partial | **MEDIUM** |
| Event analytics/tracking | ⚠️ Basic | **HIGH** |

### Required Infrastructure

```
EventConfig (server-side):
├── event_id: string
├── event_name: { ua: string, en: string }
├── start_date: ISO8601
├── end_date: ISO8601
├── reward_multipliers: { checkin?: number, tasks?: number, gacha?: number }
├── limited_shop_items: ShopItem[]
├── featured_epochs: EpochId[]
├── bonus_tasks: TaskDef[]
└── event_currency: { id, icon, name }
```

### Recommendations
1. **Create `events` table in Supabase** with JSONB config for flexible event definitions
2. **Build Event Manager Edge Function** that returns active event for each player
3. **Add event-specific reward hooks** in claim functions
4. **Implement "Flash Events"** (4-hour windows with 2x rewards)

---

## 3. Battle Pass Infrastructure

### Current State: ❌ NOT IMPLEMENTED

**This is the #1 LiveOps gap.** Battle Pass is the primary revenue driver for mobile F2P games.

### Required Battle Pass Structure

```
BattlePass:
├── season_id: string (e.g., "2026-summer")
├── season_name: { ua: string, en: string }
├── duration_days: number (typically 30-60)
├── free_track: RewardTier[]
├── premium_track: RewardTier[] (costs Telegram Stars)
├── challenges: Challenge[] (daily + weekly)
├── level_xp_requirement: number
└── bonus_currency: { currency, amount }
```

### Missing Components
- No premium tier distinction (free vs paid)
- No season pass UI/modal
- No XP-based leveling for season
- No exclusive season cosmetics/rewards
- No challenge system (daily/weekly tasks)

### Revenue Impact
Battle Pass typically represents **30-50% of mobile F2P LiveOps revenue**. For a Telegram mini-app with 100k DAU, a $4.99 Battle Pass could generate $15k-30k/month.

### Recommendations
1. **Create Season table** with 30-day seasons
2. **Build BattlePassModal UI component** with free + premium tracks
3. **Add season-specific challenges** (e.g., "Tap 5000 times this season")
4. **Implement Telegram Stars purchase** for premium tier ($4.99 = 500 Stars)

---

## 4. Season Content Cadence

### Current State: ⚠️ EPOCH-BASED

The game uses epochs as content progression, but these are **linear, not seasonal**.

| Aspect | Current | Target |
|--------|---------|--------|
| Content refresh | On prestige/rebirth | Every 30-60 days |
| New epochs | Added on rebirth | Quarterly expansion |
| Event themes | None | Monthly themes |
| Meta changes | None | Balance patches |

### Epoch System Analysis
- 20 epochs total (12 Ukrainian + 8 World History)
- Each epoch has 5 generators + artifact set
- Unlock via level progression or rebirth
- **Issue**: Once created, epochs are static

### Recommendations
1. **Implement "Seasonal Epoch Events"**: Rotate featured epochs with bonus rewards
2. **Add "Limited Epoch" concept**: Special epochs available for 2 weeks only
3. **Create seasonal generator variants**: "Summer Festival Pottery" vs "Winter Solstice Temple"
4. **Set content calendar**: Q3 = Ancient Civilizations, Q4 = Medieval Europe

---

## 5. Push Notification System

### Current State: ⚠️ BASIC INFRASTRUCTURE

**Migration 019** added the notifications system, but it's **underutilized**.

### Implemented Features
- ✅ `scheduled_notifications` table with status tracking
- ✅ Telegram Bot API integration for direct messages
- ✅ User opt-out via `notification_settings`
- ✅ Scheduled notification support
- ✅ Inline keyboard buttons with action URLs

### Missing Features

| Notification Type | Status | Priority |
|-------------------|--------|----------|
| Daily reminder | ❌ | **CRITICAL** |
| Streak warning | ❌ | **HIGH** |
| Energy full | ❌ | **HIGH** |
| Prestige ready | ❌ | **MEDIUM** |
| New content drops | ❌ | **HIGH** |
| Referral bonus reminders | ❌ | **MEDIUM** |
| Limited-time event alerts | ❌ | **CRITICAL** |
| Leaderboard position changes | ❌ | **LOW** |

### Push Notification Gaps

1. **No automated triggers**: Notifications must be sent manually via API
2. **No segment targeting**: Can't send to "players who haven't played in 24h"
3. **No notification scheduling UI**: Must use API directly
4. **No A/B testing**: Can't test notification copy/timing

### Recommendations
1. **Build Notification Scheduler cron job** (run daily at 9:00 AM local time per user)
2. **Add engagement-based triggers**:
   - "You haven't tapped in 24 hours — your streak is at risk!"
   - "Your generators are ready — 500 bonus currency awaits!"
3. **Create notification templates** stored in database
4. **Add localization** for Ukrainian/Russian/English

---

## 6. Content Update Pipeline

### Current State: ⚠️ MANUAL/HARDCODED

Content updates require **code changes and redeployment**.

### Current Content Locations
- Epochs/Generators: `/src/data/epochs.ts`
- Artifacts: `/src/data/epochs.ts`
- Tasks: `/src/data/tasks.ts`
- Daily Rewards: `/src/components/DailyRewards.tsx`

### Issues
- No hotfix capability for balance changes
- No A/B testing for reward tuning
- No feature flags for gradual rollout
- No content calendar visibility

### Required Infrastructure

```
ContentConfig (server-side JSONB):
├── epochs: Epoch[]
├── generators: Generator[]
├── artifacts: Artifact[]
├── tasks: TaskDef[]
├── dailyRewards: DailyReward[]
├── gachaRates: GachaRates
├── economyBalancing: BalanceConfig
└── featureFlags: FeatureFlag[]

FeatureFlag:
├── flag_id: string
├── enabled: boolean
├── rollout_percentage: number (0-100)
├── target_audience: { min_level?, max_level?, prestige_level? }
└── description: string
```

### Recommendations
1. **Create `game_config` table** in Supabase for all game data
2. **Add Feature Flags table** for gradual rollouts
3. **Build Content CDN endpoint** for assets (images, audio)
4. **Implement client-side config refresh** every 5 minutes

---

## 7. Player Engagement Loops

### Current Loop Analysis

```
┌─────────────────────────────────────────────────────────┐
│                    CORE ENGAGEMENT LOOP                  │
├─────────────────────────────────────────────────────────┤
│  TAP → Earn XP/Currency → Buy Generators → Passive Income │
│     ↳ Level Up → Unlock Epochs → New Content            │
│     ↳ Complete Artifacts → Bonuses                     │
│     ↳ Daily Tasks → Extra Rewards                      │
│     ↳ Check-in → Streak Bonuses                        │
│     ↳ Gacha → Collect Artifacts                        │
└─────────────────────────────────────────────────────────┘
```

### Existing Engagement Mechanics

| Loop | Implementation | Effectiveness |
|------|----------------|---------------|
| Daily login | DailyRewards + DailyStreakModal | ✅ Strong |
| Session length | Session ads at 20 min | ✅ Good |
| Chest opening | Gacha with animation | ✅ Strong |
| Collector loop | Artifact completion | ✅ Strong |
| Social proof | Leaderboard + referrals | ⚠️ Basic |
| Progression | Epoch unlocking | ✅ Strong |
| Prestige | Rebirth system | ✅ Strong |

### Missing Engagement Loops

1. **Achievement system** — Long-term goals beyond artifacts
2. **Daily challenges** — Varied daily objectives
3. **Weekly competitions** — Leaderboard reset events
4. **Club/Guild system** — Social layer
5. **Seasonal reset** — Battle Pass style progression

### Engagement Loop Recommendations

| Loop | Implementation | Priority |
|------|----------------|----------|
| Achievement badges | Add 50+ achievements with rewards | **HIGH** |
| Daily spin wheel | Free daily random reward | **MEDIUM** |
| Weekend bonus | 2x currency Sat-Sun | **HIGH** |
| First-tap-of-day | Extra bonus on first session | **MEDIUM** |
| Streak rescue | Watch ad to save streak | **HIGH** |

---

## 8. Limited Time Offers (LTO)

### Current State: ❌ NONE

No LTO infrastructure exists.

### Required LTO System

```
LimitedTimeOffer:
├── offer_id: string
├── offer_type: "bundle" | "sale" | "boost" | "exclusive"
├── start_time: ISO8601
├── end_time: ISO8601
├── products: Product[]
├── original_price: number
├── sale_price: number
├── purchase_limit: number
├── display_conditions: { min_level?, max_prestige? }
└── analytics: { views, purchases, revenue }
```

### Recommended LTO Calendar

| Event | Duration | Offer Type | Revenue Target |
|-------|----------|------------|----------------|
| Weekend Flash Sale | 48 hours | 50% off boosters | $500-2k |
| Anniversary Bundle | 7 days | Exclusive bundle | $3-5k |
| Holiday Special | 14 days | Themed items + 2x rewards | $5-10k |
| Rebirth Celebration | 3 days | 3x prestige points | Retention |

### Recommendations
1. **Build ShopManager** for LTO display in app
2. **Add purchase limits** to prevent abuse
3. **Create countdown timer** component
4. **Implement "Offer dismissed" tracking** to retarget users

---

## 9. Community Events

### Current State: ⚠️ REFERRALS ONLY

Social features are minimal:
- Referral system (100 currency per referral)
- Leaderboard (global, by total XP)
- Telegram share integration

### Missing Community Features

| Feature | Status | Priority |
|---------|--------|----------|
| In-game chat | ❌ | **LOW** (Telegram handles) |
| Clan/Guild system | ❌ | **HIGH** |
| Group challenges | ❌ | **MEDIUM** |
| Global leaderboards | ⚠️ Basic | **MEDIUM** |
| Friend gifting | ❌ | **MEDIUM** |
| Community goals | ❌ | **HIGH** |

### Community Event Concepts

1. **"Museum Builders"** — Collective goal: Community reaches 1M total taps
2. **"Artifact Hunt"** — Find specific artifacts, top 100 get bonus rewards
3. **"Epoch Wars"** — Vote for next featured epoch, winning epoch gets bonus drops
4. **"Marathon Month"** — Accumulate playtime, rewards tiered by hours

### Recommendations
1. **Build Clan system** with shared artifact bonuses
2. **Add weekly clan leaderboards**
3. **Create "Community Chest"** — unlocked by collective goals
4. **Implement Twitch integration** for streamers (bonus for viewers)

---

## 10. Data-Driven LiveOps Capability

### Current Analytics State: ⚠️ BASIC

**Existing tracking:**
- Session tracking (`track-session` function)
- Ad view logging (`ad_views` table)
- Game action logging (implicit in state saves)
- Leaderboard data

**Missing analytics:**
- Cohort analysis
- Retention curves (D1, D7, D30)
- Revenue tracking per feature
- A/B test infrastructure
- Real-time dashboards
- Predictive churn modeling

### Required Analytics Infrastructure

```
AnalyticsEvent:
├── event_type: string
├── telegram_id: number
├── timestamp: ISO8601
├── session_id: string
├── properties: JSONB
├── event_value: number? (for revenue)
└── ab_test_variant: string?

// Key metrics to track:
├── session_start/end
├── level_up
├── epoch_unlock
├── purchase_completed
├── ad_viewed
├── referral_completed
├── gacha_opened
├── artifact_completed
├── streak_broken
└── churned (no session for 7 days)
```

### Dashboard Requirements

| Dashboard | Metrics | Priority |
|-----------|---------|----------|
| DAU/MAU | Daily/monthly active users | **CRITICAL** |
| Retention | D1, D7, D30 retention curves | **CRITICAL** |
| Revenue | ARPDAU, LTV, conversion | **CRITICAL** |
| Engagement | Sessions/day, avg session length | **HIGH** |
| Economy | Currency flow, sink analysis | **HIGH** |
| Events | LTO performance, event ROI | **MEDIUM** |

### Recommendations
1. **Add `analytics_events` table** for all player actions
2. **Create analytics Edge Function** for batch event ingestion
3. **Build Supabase Dashboard** with key metrics
4. **Implement A/B testing framework** for LiveOps experiments

---

## 11. Monetization LiveOps Integration

### Current State: ⚠️ BASIC

**Existing monetization:**
- Telegram Stars for boosters
- Ad revenue (AdsGram integration)

### Missing Monetization Loops

| Feature | Status | Priority |
|---------|--------|----------|
| Battle Pass | ❌ | **CRITICAL** |
| Daily deals | ❌ | **HIGH** |
| Starter packs | ❌ | **HIGH** |
| Gem store refresh | ❌ | **MEDIUM** |
| Limited bundles | ❌ | **HIGH** |
| Subscription (VIP) | ❌ | **MEDIUM** |

### Recommended Monetization Ladder

```
FREE:
├── Daily rewards
├── Basic boosters (limited)
└── Standard gacha rates

STAR PURCHASES ($0.99-$9.99):
├── Starter Pack ($0.99) — 500 currency + Gacha ticket
├── Gem Bundle ($4.99) — 500 Stars
├── Power Pack ($9.99) — 1000 Stars + 3-day x2 boost

BATTLE PASS ($4.99):
├── Season track (30 levels)
├── Exclusive cosmetics
└── Bonus currency

SUBSCRIPTION ($2.99/month):
├── Daily 100 bonus currency
├── +10% XP boost
├── Exclusive monthly skin
└── Priority support

BUNDLES ($14.99-$49.99):
├── Anniversary Bundle
├── Artifact Hunter Bundle
└── Epoch Explorer Bundle
```

---

## Priority Roadmap

### Phase 1: Foundation (Weeks 1-4)
1. ✅ **Complete push notification triggers** — automated daily reminders, streak warnings
2. ✅ **Create event config table** — server-side event configuration
3. ✅ **Add seasonal reward multipliers** — 2x weekends, themed weeks

### Phase 2: Revenue (Weeks 5-8)
4. ✅ **Build Battle Pass system** — Season 1 with Telegram Stars purchase
5. ✅ **Implement limited-time offers** — Weekend flash sales
6. ✅ **Add achievement system** — 50 achievements with rewards

### Phase 3: Social (Weeks 9-12)
7. ✅ **Build Clan system** — Shared goals, clan chat, clan leaderboard
8. ✅ **Add community events** — Collective goals, epoch wars
9. ✅ **Implement friend gifting** — Send currency to friends

### Phase 4: Analytics (Weeks 13-16)
10. ✅ **Build analytics pipeline** — Event tracking, cohort analysis
11. ✅ **Create LiveOps dashboard** — Real-time metrics
12. ✅ **Implement A/B testing** — Feature flag experiments

---

## Summary Scorecard

| Category | Score | Grade | Priority |
|-----------|-------|-------|----------|
| Daily Rewards | 7/10 | B | Maintain |
| Event System | 3/10 | D | CRITICAL |
| Battle Pass | 1/10 | F | CRITICAL |
| Seasonal Content | 4/10 | D | HIGH |
| Push Notifications | 4/10 | D | HIGH |
| Content Pipeline | 3/10 | D | HIGH |
| Engagement Loops | 6/10 | C | MEDIUM |
| Limited Time Offers | 1/10 | F | HIGH |
| Community Events | 3/10 | D | MEDIUM |
| Data-Driven Ops | 3/10 | D | HIGH |

**Overall LiveOps Readiness: 4.5/10 (D+)**

---

## Appendix: Technical Debt Impact on LiveOps

### Hardcoded Values Requiring Changes
1. `DAILY_REWARDS` in DailyRewards.tsx — Rewards locked in code
2. `TASK_POOL` in tasks.ts — Cannot add/remove tasks without deploy
3. Epoch/generator definitions — Balance changes require code deploy
4. Gacha drop rates — Cannot adjust rates dynamically

### Database Tables Needed
- `seasons` — Battle Pass seasons
- `events` — Event configurations
- `offers` — Limited time offers
- `achievements` — Achievement definitions
- `clans` — Guild system
- `analytics_events` — Event pipeline
- `ab_tests` — A/B test configuration

### Edge Functions Needed
- `get-active-event` — Return current event config
- `claim-season-reward` — Battle Pass reward claiming
- `track-analytics` — Batch analytics ingestion
- `process-clan-action` — Clan operations
- `evaluate-achievements` — Achievement progress checking

---

*Report prepared for Virtual Museum Tapper Game v1.6.6*  
*LiveOps Director | July 2, 2026*