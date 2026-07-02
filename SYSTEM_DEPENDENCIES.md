# Virtual Museum Tapper Game — System Dependencies
## Jolt Time (Україна Крізь Час) | v1.6.6

**Document Version:** 1.0  
**Date:** 2026-07-02  
**Classification:** CONFIDENTIAL — AAA STUDIO PRODUCTION STANDARDS  
**Prepared By:** Executive Producer  

---

## Executive Overview

This document describes all dependencies between gameplay systems, identifies which systems block other systems, and maps critical paths for development planning. Understanding these dependencies is essential for sequencing development work correctly.

---

## 1. SYSTEM DEPENDENCY MAP

### 1.1 Core Dependency Graph

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         LAYER 1: FOUNDATION                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐ │
│  │   Security   │  │    CI/CD     │  │   Database   │  │   Testing   │ │
│  │  (HMAC,RLS) │  │   Pipeline   │  │   Schema     │  │  Framework  │ │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬──────┘ │
│         │                  │                  │                  │         │
│         └──────────────────┴────────┬─────────┴──────────────────┘         │
│                                     │                                       │
└─────────────────────────────────────┼───────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         LAYER 2: CORE GAME SYSTEMS                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐ │
│  │   Economy    │  │  Tap/Energy  │  │  Generators  │  │  XP/Level   │ │
│  │  Validation  │  │   System     │  │   System     │  │   System    │ │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬──────┘ │
│         │                  │                  │                  │         │
│         └──────────────────┴────────┬─────────┴──────────────────┘         │
│                                     │                                       │
└─────────────────────────────────────┼───────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         LAYER 3: RETENTION SYSTEMS                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐ │
│  │  Daily/Check │  │ Achievements │  │ Milestones   │  │   Tasks     │ │
│  │     In       │  │   System     │  │  Celebrat.   │  │   System    │ │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬──────┘ │
│         │                  │                  │                  │         │
│         └──────────────────┴────────┬─────────┴──────────────────┘         │
│                                     │                                       │
└─────────────────────────────────────┼───────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         LAYER 4: MONETIZATION                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐ │
│  │     Ads      │  │    IAP      │  │ Battle Pass  │  │    LTO      │ │
│  │   System     │  │   System    │  │   System     │  │   System    │ │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬──────┘ │
│         │                  │                  │                  │         │
│         └──────────────────┴────────┬─────────┴──────────────────┘         │
│                                     │                                       │
└─────────────────────────────────────┼───────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         LAYER 5: SOCIAL & LIVE OPS                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐ │
│  │ Leaderboard  │  │   Guild     │  │  Events     │  │ Notifications│ │
│  │   System     │  │   System    │  │   System     │  │   System    │ │
│  └──────────────┘  └──────────────┘  └──────────────┘  └─────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. BLOCKING DEPENDENCIES

### 2.1 Systems That Block Others

| System | Blocks | Reason |
|--------|--------|--------|
| **Security (HMAC/RLS)** | ALL edge function-based systems | No system can be secure without auth |
| **CI/CD Pipeline** | All deployment-dependent work | Cannot deploy safely without CI/CD |
| **Analytics Infrastructure** | A/B Testing, Feature Flags | Data needed for experiments |
| **Testing Framework** | All code changes | Cannot safely modify without tests |
| **Event System** | Battle Pass, Seasonal Content | Events underpin seasonal features |
| **Achievement System** | Guild Shared Bonuses | Achievement tracking needed for guilds |

### 2.2 Blocking Matrix

| If You Want To Build... | You Must First Complete... |
|------------------------|---------------------------|
| Battle Pass | Event System, Achievement System |
| Guild System | Achievement System, Leaderboard |
| Feature Flags | Analytics Infrastructure |
| A/B Testing | Analytics Infrastructure |
| Seasonal Events | Event System |
| Leaderboard Seasons | Server-side Ranking |
| LTO System | Event System |
| Push Notifications | Analytics (for triggers) |

---

## 3. CRITICAL PATHS

### 3.1 Production Launch Critical Path

```
Week 1-2: Security Foundation
│
├── S-001: HMAC Validation on all edge functions
│   └── Required for: ALL edge function usage
│
├── S-002: Fix RLS Policies
│   └── Required for: All database operations
│
├── S-003: Fix Race Condition (swap_last_online_at)
│   └── Required for: Offline income system
│
└── S-004: Remove Hardcoded Secrets
    └── Required for: Safe external integrations

Week 2-3: Economy Stabilization
│
├── E-001: Energy System Redesign
│   └── Blocks: Core gameplay tuning
│
├── E-002: Generator Cost Scaling
│   └── Required for: Progression balance
│
└── E-008: Server-side Offline Income
    └── Required for: Economy integrity

Week 3-4: DevOps Foundation
│
├── F-001: CI/CD Pipeline
│   └── Required for: Safe deployments
│
├── T-001: Testing Framework
│   └── Required for: All further development
│
└── A-001: Analytics Infrastructure
    └── Required for: Data-driven decisions

Week 4-6: Engagement Systems
│
├── G-001: Milestone Celebrations
│   └── Blocks: Achievement system UI
│
├── G-002: Achievement System
│   └── Required for: Battle Pass, Guilds
│
└── L-001: Event System
    └── Required for: Battle Pass, LTO

Week 7-8: Monetization
│
├── M-006: Battle Pass
│   └── Required for: Primary revenue
│
└── M-011: IAP Expansion
    └── Required for: Revenue optimization

Week 9-10: Social Features
│
├── S-015: Leaderboard Seasons
│   └── Required for: Competition
│
└── S-019: Guild System
    └── Required for: Community retention

Week 11-14: Polish & Launch
│
├── P-001: Performance Optimization
│   └── Required for: Scale
│
└── T-006: Telegram Integration
    └── Required for: Platform compliance
```

### 3.2 Shortest Path to Production Launch

```
Security (2 weeks) → Economy (1 week) → CI/CD (1 week) → Testing (1 week) → Battle Pass (2 weeks) → Polish (1 week) = 8 weeks MINIMUM
```

---

## 4. CROSS-SYSTEM DEPENDENCIES

### 4.1 Economy → Other Systems

| Economy Component | Depends On | Blocks |
|-------------------|-----------|--------|
| **Currency System** | Security, Generators | Achievements, Battle Pass, Daily Rewards |
| **XP System** | Security, Tap Mechanics | Level-based unlocks, Leaderboard |
| **Prestige Points** | Prestige System | Museum Laboratory upgrades |
| **Artifact Fragments** | Gacha System | Artifact collection, Guild bonuses |

### 4.2 Retention → Monetization

| Retention Feature | Enables |
|-------------------|---------|
| **Daily Check-in** | Streak-based IAP |
| **Daily Tasks** | Task completion IAP |
| **Achievements** | Achievement rewards, Battle Pass challenges |
| **Milestones** | Milestone-based offers |
| **Events** | Event-specific Battle Pass, LTO |

### 4.3 Social → Retention

| Social Feature | Drives Retention Via |
|----------------|---------------------|
| **Leaderboard** | Competition, status |
| **Guild** | Social bonds, group goals |
| **Friends** | Gifting, comparisons |
| **Clan Wars** | Group competition |

---

## 5. DATA FLOW DEPENDENCIES

### 5.1 Core Game Loop Data Flow

```
User Tap
    │
    ▼
┌─────────────────────────────────────────────┐
│           FRONTEND (useGame.ts)              │
│  • Tap detection                             │
│  • Energy calculation                        │
│  • XP accumulation                           │
│  • Passive income calculation                │
└─────────────────────────────────────────────┘
    │
    │ saveRemoteState() every 15 seconds
    ▼
┌─────────────────────────────────────────────┐
│         SUPABASE (game_progress)             │
│  • Currency                                 │
│  • XP & Level                               │
│  • Energy                                   │
│  • Epoch progress                           │
│  • Artifact inventory                        │
│  • Prestige data                            │
└─────────────────────────────────────────────┘
    │
    │ Edge Functions (server-authoritative)
    ▼
┌─────────────────────────────────────────────┐
│           GAME ACTION LOGIC                  │
│  • Generator purchases (CURRENTLY DISABLED)   │
│  • Tap upgrades                             │
│  • Prestige                                 │
│  • Gacha rolls                              │
│  • Offline income claims                    │
└─────────────────────────────────────────────┘
```

### 5.2 Reward Claiming Flow

```
User Requests Reward
    │
    ▼
┌─────────────────────────────────────────────┐
│        EDGE FUNCTION (e.g., claim-ad-reward) │
│  • HMAC Validation (MUST ADD)                │
│  • Rate Limiting (MUST ADD)                  │
│  • Daily Limit Check                         │
│  • Idempotency Check                         │
└─────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────┐
│              DATABASE                         │
│  • game_progress (balance update)           │
│  • ad_rewards_log (claim record)            │
│  • analytics_events (tracking)              │
└─────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────┐
│              ANALYTICS                        │
│  • Event recorded                            │
│  • Cohort data updated                       │
│  • A/B test assignment checked              │
└─────────────────────────────────────────────┘
    │
    ▼
Response to Client
```

---

## 6. FEATURE FLAG DEPENDENCIES

### 6.1 Feature Flag Hierarchy

```
┌─────────────────────────────────────────┐
│         MASTER FLAG: new_version         │
│         (Controls entire rollout)         │
└─────────────────────────────────────────┘
                    │
        ┌───────────┴───────────┐
        ▼                       ▼
┌───────────────┐       ┌───────────────┐
│ feature_x    │       │ feature_y    │
│ (requires:    │       │ (requires:    │
│  - security   │       │  - feature_x │
│  - ci_cd)     │       │  - analytics)│
└───────────────┘       └───────────────┘
        │                       │
        ▼                       ▼
┌───────────────┐       ┌───────────────┐
│ feature_x_v2  │       │ feature_z    │
│ (requires:    │       │ (requires:    │
│  - feature_x) │       │  - ci_cd)    │
└───────────────┘       └───────────────┘
```

### 6.2 Feature Flag Requirements

| Feature Flag | Prerequisites | Enables |
|--------------|---------------|---------|
| `battle_pass_enabled` | `events_enabled`, `achievements_enabled` | Battle Pass purchases |
| `guild_system_enabled` | `achievements_enabled`, `leaderboard_enabled` | Guild creation, joining |
| `seasonal_events_enabled` | `events_system_enabled` | Flash events, themed events |
| `ltos_enabled` | `events_system_enabled` | Limited-time offers |
| `server_side_offline` | `security_hardened` | Server-calculated offline income |
| `server_generators` | `security_hardened` | Server-validated generator purchases |

---

## 7. DATABASE DEPENDENCIES

### 7.1 Table Dependency Graph

```
┌─────────────────────┐
│   game_progress     │ ← Core player state
│   (PRIMARY)         │
└──────────┬──────────┘
           │
    ┌──────┼──────┐
    ▼      ▼      ▼
┌────────┐┌────────┐┌──────────┐
│genera-││artifacts││prestige_│
│tors   ││        ││research │
└───┬────┘└────────┘└────┬─────┘
    │                    │
    ▼                    ▼
┌─────────────────┐  ┌─────────────────┐
│  generators     │  │   artifacts     │
│  (purchases)    │  │  (inventory)    │
└─────────────────┘  └────────┬────────┘
                             │
                             ▼
                      ┌─────────────────┐
                      │ artifact_       │
                      │ fragments       │
                      └─────────────────┘

┌─────────────────────┐
│  scheduled_        │
│  notifications     │ ← Depends on nothing
└─────────────────────┘
           │
           ▼
┌─────────────────────┐
│  notification_     │
│  templates         │
└─────────────────────┘
```

### 7.2 Index Dependencies

| Table | Required Indexes | Enables |
|-------|-----------------|---------|
| `game_progress` | telegram_id (PK), level, total_xp | Leaderboard queries |
| `ad_rewards_log` | (telegram_id, date), reward_type | Rate limiting |
| `analytics_events` | (telegram_id, timestamp), event_type | Cohort analysis |
| `leaderboard` | season_id, rank | Leaderboard display |

---

## 8. EDGE FUNCTION DEPENDENCIES

### 8.1 Function Call Chain

```
┌─────────────────────────────────────────────────────────────┐
│                     CLIENT REQUEST                          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              validate-init-data (ALL requests)               │
│  • HMAC-SHA256 signature verification                      │
│  • Telegram ID extraction                                  │
│  • Returns validated user context                         │
└─────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
    ┌─────────────┐   ┌─────────────┐   ┌─────────────┐
    │ game-action │   │open-chest  │   │perform-    │
    │             │   │            │   │prestige    │
    │ • Tap power │   │ • Gacha    │   │            │
    │ • Generator │   │ • Artifacts│   │ • Prestige │
    │ • Upgrades  │   │            │   │ • Points   │
    └─────────────┘   └─────────────┘   └─────────────┘
              │               │               │
              └───────────────┼───────────────┘
                              ▼
                    ┌─────────────────┐
                    │ game_progress  │
                    │   (UPDATE)     │
                    └─────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │ analytics_     │
                    │ events         │
                    │ (TRACKING)     │
                    └─────────────────┘
```

### 8.2 Function Dependencies

| Function | Depends On | Required For |
|----------|-----------|--------------|
| `game-action` | `validate-init-data` | All game state changes |
| `open-chest` | `validate-init-data` | Gacha, artifacts |
| `perform-prestige` | `validate-init-data` | Prestige system |
| `claim-ad-reward` | `validate-init-data`, `ad_rewards_log` | Ad monetization |
| `claim-offline-income` | `validate-init-data`, `swap_last_online_at` RPC | Idle retention |
| `track-session` | `validate-init-data`, `analytics_events` | Session tracking |
| `push-notification` | `scheduled_notifications`, `notification_templates` | Re-engagement |
| `telegram-payments` | `validate-init-data`, `payment_log` | IAP processing |

---

## 9. INTEGRATION DEPENDENCIES

### 9.1 Third-Party Integrations

```
┌─────────────────────────────────────────────┐
│            TELEGRAM MINI APP SDK            │
│  • User authentication                      │
│  • Payments (Stars)                        │
│  • Haptic feedback                         │
│  • Share functionality                     │
│  • BackButton, MainButton                  │
└─────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────┐
│              SUPABASE                        │
│  • Database (PostgreSQL + RLS)             │
│  • Edge Functions                          │
│  • Realtime subscriptions                  │
│  • Auth                                   │
└─────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────┐
│              EXTERNAL SERVICES               │
│  • AdsGram (rewarded ads)                  │
│  • Sentry (error tracking) [TO ADD]        │
│  • Analytics platform [TO BUILD]           │
│  • Push notification service               │
└─────────────────────────────────────────────┘
```

### 9.2 Integration Prerequisites

| Integration | Prerequisites | Required For |
|-------------|--------------|--------------|
| **Telegram Payments** | Telegram SDK, HMAC validation | IAP, Battle Pass |
| **AdsGram** | Ad SDK integration | Ad monetization |
| **Sentry** | Error tracking setup | Production monitoring |
| **Push Notifications** | Telegram Bot API | Re-engagement |
| **Analytics** | Event schema, API endpoint | Data-driven decisions |

---

## 10. DEPENDENCY SUMMARY TABLES

### 10.1 System to System Dependencies

| System | Requires | Blocked By |
|--------|----------|------------|
| **Security** | None | - |
| **CI/CD** | None | Security, Testing |
| **Testing** | CI/CD | - |
| **Analytics** | CI/CD, Database | A/B Testing, Feature Flags |
| **Economy** | Security | Retention, Monetization |
| **Retention** | Economy, Analytics | Monetization, Social |
| **Monetization** | Retention, Events | Revenue |
| **Social** | Retention, Analytics | Community |
| **LiveOps** | Analytics, Events | Seasonal Content |
| **Platform** | CI/CD | User Experience |

### 10.2 Priority Dependencies

| Priority | Must Complete Before | Required For |
|---------|--------------------|--------------|
| P0 | Security (HMAC/RLS) | All edge function work |
| P0 | CI/CD | Safe deployments |
| P0 | Testing Framework | Any code changes |
| P1 | Analytics | A/B testing, Feature flags |
| P1 | Economy Stabilization | Progression systems |
| P2 | Achievement System | Battle Pass, Guilds |
| P2 | Event System | Battle Pass, LTO |
| P2 | Leaderboard | Competition |
| P3 | Guild System | Community |

---

## 11. DEVELOPMENT SEQUENCING GUIDANCE

### 11.1 Safe to Start Now (No Dependencies)
- CI/CD pipeline setup
- Testing framework research
- Design documents for future features
- Code architecture planning

### 11.2 Blocked Until Security Complete
- All edge function modifications
- Economy rebalancing
- Any feature requiring server validation

### 11.3 Blocked Until CI/CD Complete
- Feature flag system
- Automated deployment
- Feature branch development

### 11.4 Blocked Until Analytics Complete
- A/B testing
- Feature flags with data
- Notification triggers
- LiveOps optimization

### 11.5 Blocked Until Economy Stable
- Progression tuning
- Achievement rewards
- Battle Pass rewards
- Daily task rewards

---

*Document Version: 1.0*  
*Classification: CONFIDENTIAL*  
*Distribution: Internal AI Studio Agents Only*  
*Prepared by: Executive Producer*  
*Date: 2026-07-02*