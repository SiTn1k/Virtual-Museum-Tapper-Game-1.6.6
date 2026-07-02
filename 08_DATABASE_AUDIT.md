# Database Audit Report — Virtual Museum Tapper Game

**Project:** Virtual Museum Tapper Game v1.6.6  
**Audit Date:** 2026-07-02  
**Auditor:** AAA Studio Database Architect  
**Database:** PostgreSQL via Supabase

---

## 1. Executive Summary

The Virtual Museum Tapper Game uses Supabase (PostgreSQL) as its backend database with a well-structured migration history. The schema supports player progress, referrals, ads, prestige system, and notifications. While the overall design is sound, several critical issues require immediate attention for production readiness.

### Overall Assessment

| Category | Score | Status |
|----------|-------|--------|
| Schema Design | 7/10 | ⚠️ Needs Work |
| Data Type Choices | 6/10 | ⚠️ Needs Work |
| Index Coverage | 7/10 | ✅ Adequate |
| RLS Policies | 5/10 | 🚨 Critical Issues |
| Query Patterns | 8/10 | ✅ Good |
| Scalability | 6/10 | ⚠️ Concerns |
| Migration Strategy | 8/10 | ✅ Good |

---

## 2. Schema Design Analysis

### 2.1 Current Schema Overview

```
game_progress (PRIMARY TABLE)
├── Core Game State (level, xp, currency)
├── Generators & Epochs (owned_generators, unlocked_epochs, epoch_id)
├── Artifacts (artifact_parts, artifact_levels, completed_artifacts)
├── Referral System (referrer_id, referrals_count, referral_earnings)
├── Boosters (active_boosters, notification_settings)
├── Prestige System (prestige_level, prestige_points, prestige_research)
├── Energy System (energy, max_energy, energy_recharged_at)
├── Session Tracking (last_online_at, session_start_at)
├── Daily Features (daily_ad_views, current_streak, last_check_in)
└── User Profile (username, first_name, photo_url)

SUPPORTING TABLES:
├── ads_rewards_log — AdsGram reward tracking
├── ad_views — Ad view statistics
├── prestige_records — Prestige history
├── stars_purchases — Telegram Stars purchase tracking
├── player_sessions — Session analytics
├── offline_claims — Offline income log
└── scheduled_notifications — Push notification queue
```

### 2.2 Strengths

1. **Single-table dominant design** — Most game state in one table reduces joins
2. **Proper use of UUID for primary keys** where needed
3. **Good use of JSONB** for semi-structured data (generators, boosters, artifacts)
4. **Atomic operations** via RPC functions for race condition protection
5. **Comprehensive indexing** for common query patterns

### 2.3 Weaknesses & Anti-patterns

#### 🔴 CRITICAL: JSONB Overuse for Structured Data

Several fields that should be normalized are stored as JSONB:

```sql
-- PROBLEMATIC:
owned_generators JSONB     -- Should be normalized table
artifact_parts JSONB        -- Could work, but artifact_levels exists too
artifact_levels JSONB       -- Redundant with artifact_parts
active_boosters JSONB       -- Too many mixed concerns
prestige_research JSONB     -- Should be normalized
daily_ad_views JSONB        -- Should be normalized
```

**Impact:**
- Cannot enforce constraints at database level
- No referential integrity
- Harder to query individual components
- JSONB casts add CPU overhead
- Cannot build efficient indexes on sub-fields

**Example Issue:**
```sql
-- Current: Querying all players with offline_boost active
SELECT * FROM game_progress 
WHERE active_boosters->>'offline_boost_end' > NOW();  -- Full scan!

-- Should be: Indexable column
SELECT * FROM game_progress WHERE offline_boost_end > NOW();  -- Index seek
```

#### 🔴 CRITICAL: Single Table Bloat

With 40+ columns, `game_progress` is a "god table." Issues:
- Wide rows = more I/O per read
- All fields updated on every save = write amplification
- Cannot selectively load just needed fields
- Schema changes risk affecting all features

**Recommendation:** Split into logical domains:
```
player_profile (immutable user data)
├── telegram_id (PK)
├── username, first_name, photo_url
├── referrer_id
├── created_at

game_state (frequently updated)
├── telegram_id (FK)
├── level, xp, currency, tap_power
├── epoch_id
├── energy, max_energy
└── timestamps

player_assets (semi-stable)
├── telegram_id (FK)
├── owned_generators[]
├── artifact_parts, artifact_levels
├── unlocked_epochs[]
├── completed_artifacts[]
└── prestige_level, prestige_points

player_boosters (mutable, separate table)
├── telegram_id (FK)
├── booster_type, expires_at, multiplier
```

#### 🟡 MODERATE: Denormalized Counters

Fields like `referrals_count`, `total_currency_earned` are maintained manually:
- No database-enforced consistency
- Race conditions possible without proper locking
- Inconsistent state if updates fail mid-operation

**Current Implementation:**
```sql
-- Vulnerable to race conditions
UPDATE game_progress SET referrals_count = referrals_count + 1 WHERE telegram_id = X;
```

**Better Approach:**
```sql
-- Use database function with proper locking
SELECT FOR UPDATE + single atomic UPDATE
```

---

## 3. Data Type Analysis

### 3.1 Problematic Data Types

| Column | Current Type | Issue | Recommendation |
|--------|-------------|-------|----------------|
| `xp` | `real` | Precision loss | `double precision` or `numeric` |
| `total_xp` | `real` | Precision loss for large values | `numeric(20,2)` |
| `currency` | `real` | Same issue | `numeric(20,2)` |
| `total_currency_earned` | `real` | Same issue | `numeric(20,2)` |
| `passive_xp_per_second` | `real` | Division precision issues | `numeric(10,6)` |
| `telegram_id` | `bigint` | Correct for Telegram | ✅ OK |

### 3.2 Real vs Numeric Precision

PostgreSQL `real` (32-bit) has ~6-7 significant digits.

**Example Problem:**
```sql
-- After reaching level 999 with 1M+ XP
SELECT 999999.99::real = 1000000.0::real;  -- May lose precision!
```

**For currency/XP calculations:**
- Use `numeric(20,4)` for intermediate calculations
- Round to `numeric(20,2)` for display
- Real-world: precision loss causes rounding errors visible to players

### 3.3 Boolean vs Text for Flags

```sql
-- Current:
notification_settings JSONB DEFAULT '{"enabled": true, ...}'

-- Better:
notifications_enabled BOOLEAN DEFAULT true,
daily_reminder_enabled BOOLEAN DEFAULT true,
energy_full_alert_enabled BOOLEAN DEFAULT true,
prestige_ready_alert_enabled BOOLEAN DEFAULT true,
```

---

## 4. Index Analysis

### 4.1 Existing Indexes

```sql
-- game_progress
idx_game_progress_telegram        -- telegram_id (UNIQUE implied)
idx_game_progress_device_id       -- device_id (partial, unique)
idx_game_progress_referrer         -- referrer_id
idx_game_progress_total_xp        -- total_xp DESC (leaderboard)
idx_game_progress_referrals        -- referrals_count DESC (leaderboard)
idx_game_progress_prestige        -- (prestige_level, level) DESC

-- ads_rewards_log
idx_ads_rewards_telegram_id       -- telegram_id
idx_ads_rewards_created_at        -- created_at

-- ad_views
idx_ad_views_telegram_id         -- telegram_id
idx_ad_views_created_at           -- created_at

-- prestige_records
idx_prestige_records_telegram_id -- telegram_id

-- stars_purchases
idx_stars_purchases_telegram_id  -- telegram_id

-- player_sessions
idx_player_sessions_telegram_id  -- telegram_id
idx_player_sessions_last_activity -- last_activity_at DESC

-- scheduled_notifications
idx_scheduled_notifications_telegram -- telegram_id
idx_scheduled_notifications_status_scheduled -- (status, scheduled_for) partial
```

### 4.2 Missing Indexes

| Query Pattern | Missing Index | Impact |
|---------------|---------------|--------|
| `WHERE epoch_id = 'x' AND level > 100` | `idx_game_progress_epoch_level` | High |
| `WHERE last_saved_at > NOW() - INTERVAL '1 day'` | `idx_game_progress_recent` | Medium |
| `WHERE device_id IS NOT NULL AND telegram_id IS NULL` | ✅ Exists | - |
| `WHERE status = 'pending' AND scheduled_for < NOW()` | Partial exists | Low |
| `ads_rewards_log(telegram_id, created_at)` | Composite needed | Medium |
| `player_sessions(telegram_id, session_started_at)` | Composite needed | Medium |

### 4.3 Index Recommendations

```sql
-- Composite index for leaderboard by epoch
CREATE INDEX idx_game_progress_epoch_leaderboard 
ON game_progress(epoch_id, total_xp DESC);

-- Index for time-based queries
CREATE INDEX idx_game_progress_last_saved 
ON game_progress(last_saved_at DESC);

-- Composite for ad analytics
CREATE INDEX idx_ad_views_telegram_date 
ON ad_views(telegram_id, created_at DESC);

-- Composite for session analytics
CREATE INDEX idx_player_sessions_user_time 
ON player_sessions(telegram_id, session_started_at DESC);
```

---

## 5. Constraint Analysis

### 5.1 Current Constraints

```sql
-- Primary Keys
game_progress.id                  -- UUID PK ✅
ads_rewards_log.id               -- BIGSERIAL PK ✅
ad_views.id                      -- BIGSERIAL PK ✅
prestige_records.id              -- BIGSERIAL PK ✅
stars_purchases.id               -- BIGSERIAL PK ✅
player_sessions.id               -- BIGINT IDENTITY PK ✅
offline_claims.id                -- BIGINT IDENTITY PK ✅
scheduled_notifications.id       -- UUID PK ✅

-- Unique Constraints
game_progress.telegram_id        -- UNIQUE ✅
game_progress.device_id         -- Partial unique ✅
ads_rewards_log(telegram_id, ad_id) -- UNIQUE ✅
stars_purchases.charge_id        -- UNIQUE ✅

-- Check Constraints
scheduled_notifications.status   -- CHECK IN ('pending', 'sent', 'failed', 'cancelled') ✅
game_progress.level              -- CHECK (level <= 999) ✅
```

### 5.2 Missing Constraints

#### 🔴 CRITICAL: No Foreign Keys

```sql
-- MISSING - Critical for data integrity
game_progress.referrer_id        -- Should FK to game_progress(telegram_id)
prestige_records.tferrer_id       -- Should FK to game_progress(telegram_id)
offline_claims.telegram_id        -- Should FK to game_progress(telegram_id)
ads_rewards_log.telegram_id      -- Should FK to game_progress(telegram_id)
ad_views.telegram_id             -- Should FK to game_progress(telegram_id)
player_sessions.telegram_id      -- Should FK to game_progress(telegram_id)
scheduled_notifications.telegram_id -- Should FK to game_progress(telegram_id)
stars_purchases.telegram_id      -- Should FK to game_progress(telegram_id)
```

**Impact:**
- Orphaned records when players deleted
- Invalid referrer_ids pointing to non-existent users
- Cannot use CASCADE DELETE
- Analytics may include invalid users

**Recommendation:**
```sql
-- Add foreign keys with appropriate actions
ALTER TABLE prestige_records 
ADD CONSTRAINT fk_prestige_player 
FOREIGN KEY (telegram_id) REFERENCES game_progress(telegram_id) 
ON DELETE CASCADE;

ALTER TABLE ads_rewards_log 
ADD CONSTRAINT fk_ads_player 
FOREIGN KEY (telegram_id) REFERENCES game_progress(telegram_id) 
ON DELETE CASCADE;
```

#### 🟡 MODERATE: No NOT NULL on Critical Fields

```sql
-- These should be NOT NULL
device_id                        -- Should be NOT NULL if telegram_id can be NULL
last_online_at                   -- Should be NOT NULL
session_start_at                 -- Should be NOT NULL
energy_recharged_at              -- Should be NOT NULL
```

#### 🟡 MODERATE: No Value Range Constraints

```sql
-- Add boundaries
ALTER TABLE game_progress ADD CONSTRAINT positive_xp CHECK (xp >= 0);
ALTER TABLE game_progress ADD CONSTRAINT positive_currency CHECK (currency >= 0);
ALTER TABLE game_progress ADD CONSTRAINT positive_energy CHECK (energy >= 0 AND energy <= max_energy);
ALTER TABLE game_progress ADD CONSTRAINT valid_prestige CHECK (prestige_level >= 0);
```

---

## 6. Row Level Security (RLS) Analysis

### 6.1 Current RLS Policies

```sql
-- game_progress (MIXED POLICIES)
anon_read_progress              -- SELECT: true (leaderboard access)
insert_own_progress             -- INSERT: true (new user registration)
update_own_progress              -- UPDATE: true (client upsert)
service_role_all_progress        -- ALL: service_role only

-- scheduled_notifications
"Service role full access"      -- ALL: service_role only
"Users read own notifications"  -- SELECT: JWT telegram_id
"Users delete own notifications" -- DELETE: JWT telegram_id

-- Other tables
ads_rewards_log                 -- INSERT: service_role only, SELECT: false
ad_views                        -- INSERT: service_role only
prestige_records                -- INSERT: service_role only
offline_claims                  -- INSERT: service_role only
player_sessions                 -- INSERT: service_role only, SELECT: true
```

### 6.2 🚨 CRITICAL SECURITY ISSUES

#### Issue 1: game_progress RLS Allows Universal Access

```sql
-- Current policy allows ANYONE to:
CREATE POLICY "update_own_progress" ON game_progress
  FOR UPDATE TO anon, authenticated
  USING (true) WITH CHECK (true);
```

**Problem:** The `USING (true)` means any authenticated user can update ANY player's data if they know the `telegram_id`.

**Attack Scenario:**
```javascript
// Attacker crafts request with victim's telegram_id
await supabase
  .from("game_progress")
  .update({ currency: 9999999 })
  .eq("telegram_id", victimTelegramId);
```

**Fix Required:**
```sql
-- Option A: Rely on edge function validation (current approach)
-- Keep USING(true) but ensure all writes go through edge functions
-- Edge functions use service_role key with HMAC validation

-- Option B: Proper RLS with JWT claims
CREATE POLICY "update_own_progress" ON game_progress
  FOR UPDATE TO anon, authenticated
  USING (telegram_id = (current_setting('request.jwt.claims', true)::jsonb->>'telegram_id')::bigint)
  WITH CHECK (telegram_id = (current_setting('request.jwt.claims', true)::jsonb->>'telegram_id')::bigint);
```

**Assessment:** The current approach is **acceptable for Telegram Mini Apps** IF:
1. All game state mutations go through edge functions
2. Edge functions validate HMAC signature
3. Client never uses direct Supabase write access

**Current Status:** ✅ Most writes go through edge functions, but some direct writes exist in client code.

#### Issue 2: Inconsistent SELECT Policy

```sql
-- Read policy allows all (for leaderboard)
CREATE POLICY "select_own_progress" ON game_progress
  FOR SELECT TO anon, authenticated USING (true);
```

**Problem:** Any player can read all game_progress data including:
- Other players' currency amounts
- Other players' prestige level
- Other players' usernames/emails

**Recommendation:** Create separate policies for leaderboard vs personal data
```sql
-- Leaderboard: anonymized data only
CREATE POLICY "leaderboard_read" ON game_progress
  FOR SELECT TO anon, authenticated
  USING (true)
  WITH CHECK (false);  -- Never applies to writes

-- Personal data: require authentication
CREATE POLICY "personal_read" ON game_progress
  FOR SELECT TO authenticated
  USING (telegram_id = (current_setting('request.jwt.claims', true)::jsonb->>'telegram_id')::bigint);
```

#### Issue 3: Telegram ID Validation in Edge Functions

The `validateInitData` function validates HMAC signature but there's a potential issue:

```typescript
// Current edge function does NOT verify telegram_id matches JWT
const validation = validateInitData(init_data);
if (!validation.valid) return json({ error: validation.error }, 401);
if (!validation.userId) return json({ error: "No user_id in initData" }, 401);

// User provides telegram_id separately - could differ from initData user!
const { telegram_id } = body;
```

**Fix Required:**
```typescript
// Verify telegram_id in request matches validated user from initData
if (telegram_id !== validation.userId) {
  return json({ error: "telegram_id mismatch" }, 403);
}
```

### 6.3 RLS Best Practices Checklist

- [x] RLS enabled on all user tables
- [ ] No USING(true) for UPDATE/DELETE policies
- [ ] Service role has separate policies (not bypass)
- [ ] JWT claims used for user identification
- [ ] Edge functions use service_role key only
- [ ] Input validation on all edge functions
- [ ] HMAC validation for Telegram data

---

## 7. Query Pattern Analysis

### 7.1 Common Queries

```typescript
// 1. Load player progress
supabase.from("game_progress").select("*").eq("telegram_id", id);

// 2. Upsert player progress (client-side)
supabase.from("game_progress").upsert({ telegram_id, ...data });

// 3. Leaderboard by XP
supabase.from("game_progress")
  .select("telegram_id, first_name, username, level, total_xp, prestige_level")
  .order("total_xp", { ascending: false })
  .limit(100);

// 4. Leaderboard by referrals
supabase.from("game_progress")
  .select("telegram_id, first_name, username, referrals_count")
  .order("referrals_count", { ascending: false })
  .limit(100);

// 5. Get referrer info
supabase.from("game_progress")
  .select("first_name, referrals_count")
  .eq("telegram_id", referrerId);
```

### 7.2 Edge Function Queries

```typescript
// game-action: Select for update
await supabase.from("game_progress")
  .select("currency, tap_power")
  .eq("telegram_id", telegramId);

// open-chest: Complex read + write
await supabase.from("game_progress")
  .select("currency, prestige_level, prestige_research, artifact_parts, artifact_levels, completed_artifacts")
  .eq("telegram_id", telegram_id);

// perform-prestige: Full row read
await supabase.from("game_progress")
  .select("level, total_xp, prestige_level, prestige_points, ...")
  .eq("telegram_id", telegram_id);

// claim-offline-income: Atomic swap
await supabase.rpc("swap_last_online_at", { p_telegram_id, p_new_time });
```

### 7.3 Query Issues

#### 🟡 MODERATE: Full Row Selects

```typescript
// Current: Selects ALL 40+ columns every time
const { data } = await supabase
  .from("game_progress")
  .select("*")
  .eq("telegram_id", id);

// Better: Select only needed columns
const { data } = await supabase
  .from("game_progress")
  .select("telegram_id, level, xp, currency, epoch_id")
  .eq("telegram_id", id);
```

**Impact:** 
- Increased I/O (wide rows)
- More memory allocation
- Slower network transfer

#### 🟡 MODERATE: No Batch Operations

When fetching multiple leaderboards:
```typescript
// Current: 3 separate queries
const xpLeaderboard = await supabase.from("game_progress")...;
const refLeaderboard = await supabase.from("game_progress")...;
const prestigeLeaderboard = await supabase.from("game_progress")...;

// Better: Single RPC returning all
CREATE FUNCTION get_all_leaderboards()
RETURNS TABLE (...)
```

#### 🟡 MODERATE: N+1 Query Pattern

```typescript
// Current: Loop makes N queries
for (const referrerId of referrerIds) {
  const { data } = await supabase
    .from("game_progress")
    .select("first_name, referrals_count")
    .eq("telegram_id", referrerId);
}

// Better: Batch query
const { data } = await supabase
  .from("game_progress")
  .select("telegram_id, first_name, referrals_count")
  .in("telegram_id", referrerIds);
```

---

## 8. Scalability Analysis

### 8.1 Current Scalability Concerns

#### 🔴 CRITICAL: Wide Single Table

With 40+ columns and JSONB fields, `game_progress` will have:
- Large row size (~2-5KB per player)
- High memory usage for indexes
- Slow full table scans

**Projections:**
| Players | Table Size | Index Size | Total |
|---------|------------|------------|-------|
| 10,000 | ~50 MB | ~30 MB | ~80 MB |
| 100,000 | ~500 MB | ~300 MB | ~800 MB |
| 1,000,000 | ~5 GB | ~3 GB | ~8 GB |

**At 1M players:** Queries become noticeably slow without sharding.

#### 🔴 CRITICAL: No Connection Pooling Configuration

```typescript
// Current: Default pool settings
const supabase = createClient(url, key);

// Recommended for high traffic:
const supabase = createClient(url, key, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  db: {
    schema: 'public',
  },
  global: {
    headers: {
      'x-my-custom-header': 'value',
    },
  },
  // Supabase handles connection pooling internally
  // But no explicit configuration visible
});
```

#### 🟡 MODERATE: Hot Partition Strategy Missing

Leaderboard queries hit the same data:
```sql
-- Current: All users in one table
SELECT * FROM game_progress ORDER BY total_xp DESC LIMIT 100;

-- Future: Time-based partitioning
CREATE TABLE game_progress_partitioned (...)
PARTITION BY RANGE (last_saved_at);
```

### 8.2 Scalability Recommendations

1. **Normalize frequently-queried JSONB fields** into indexed columns
2. **Implement connection pooling** via Supabase pooler
3. **Consider table partitioning** for `ad_views`, `player_sessions` (time-series)
4. **Use materialized views** for leaderboards (refresh on schedule)
5. **Implement read replicas** for leaderboard queries
6. **Consider sharding** at 500K+ players

### 8.3 Estimated Query Performance

| Query | Current | With Indexes | With Normalization |
|-------|---------|--------------|-------------------|
| Load player | 5-10ms | 2-5ms | 1-2ms |
| XP leaderboard | 50-100ms | 10-20ms | 5-10ms |
| Referral leaderboard | 50-100ms | 10-20ms | 5-10ms |
| Full table scan | 500ms+ | N/A | N/A |

---

## 9. Migration Strategy Analysis

### 9.1 Current Migration Quality

**Positives:**
- ✅ Versioned migrations with sequential numbering
- ✅ IF NOT EXISTS / ADD COLUMN IF NOT EXISTS used
- ✅ Descriptive comments explaining purpose
- ✅ Multiple fix migrations show iterative improvement
- ✅ RLS and constraints added progressively

**Negatives:**
- ❌ Duplicate migrations (001 vs 001_game_progress_full)
- ❌ Migration files with double extension (.sql.sql)
- ❌ Some migrations could be combined
- ❌ No rollback strategies documented
- ❌ No migration testing in CI

### 9.2 Migration Issues Found

#### 🟡 File Naming Error
```
20260616225204_010_ads_rewards_log.sql.sql  -- Double extension!
20260616233110_011_ad_views.sql.sql         -- Double extension!
```

#### 🟡 Redundant Migrations
```
20260613144854_001_game_progress.sql       -- Initial schema
20260613171158_001_game_progress_full.sql   -- Redundant (same table)
```

#### 🟡 Missing Migrations
- No migration to drop unused `device_id` unique constraint after telegram_id migration
- No migration to backfill historical data

### 9.3 Migration Best Practices

```sql
-- 1. Always include rollback
-- migration_xyz.sql
BEGIN;

-- Add new column
ALTER TABLE game_progress ADD COLUMN new_field TEXT;

-- Update existing rows
UPDATE game_progress SET new_field = 'default' WHERE new_field IS NULL;

-- Add constraint
ALTER TABLE game_progress ALTER COLUMN new_field SET NOT NULL;

-- Create index
CREATE INDEX idx_new_field ON game_progress(new_field);

COMMIT;

-- ROLLBACK SCRIPT (in comments)
-- BEGIN;
-- DROP INDEX idx_new_field;
-- ALTER TABLE game_progress DROP COLUMN new_field;
-- COMMIT;

-- 2. Use transaction blocks
-- 3. Test migrations on staging with production-like data
-- 4. Monitor lock time during ALTER TABLE
```

---

## 10. Edge Function Security Analysis

### 10.1 Current Implementation

**✅ Good Practices:**
- HMAC-SHA256 validation for Telegram initData
- Service role key for server-to-server operations
- Input validation on all functions
- Error handling and logging
- Idempotency checks (ads_rewards_log duplicate prevention)

**⚠️ Concerns:**

1. **No telegram_id mismatch check** in game-action
```typescript
// User provides telegram_id separately - could differ from initData user!
const { telegram_id } = body;  // From request body
const userId = validation.userId;  // From HMAC-validated initData

// Missing validation:
if (telegram_id !== userId) {
  return json({ error: "telegram_id mismatch" }, 403);
}
```

2. **Race conditions in upgradeTap**
```typescript
// Current: Read-then-write (not atomic)
const { data: row } = await supabase.from("game_progress").select(...);
if (currency < cost) return error;
await supabase.from("game_progress").update({ currency: currency - cost });

// Two concurrent requests could both pass the currency check!
// Better: Use UPDATE with WHERE clause
await supabase.from("game_progress")
  .update({ currency: currency - cost })
  .eq("telegram_id", telegramId)
  .gt("currency", cost);  // Atomic check
```

3. **No rate limiting** on edge functions
```typescript
// Attacker could spam upgradeTap
// Recommendation: Add Supabase rate limiting or pg_cron job
```

### 10.2 Edge Function Recommendations

```typescript
// 1. Always validate telegram_id matches
const { telegram_id } = body;
if (telegram_id !== validation.userId) {
  return json({ error: "Forbidden: telegram_id mismatch" }, 403);
}

// 2. Use atomic updates where possible
const { data } = await supabase
  .from("game_progress")
  .update({ currency: supabase.rpc('decrement_currency', { amount: cost }) })
  .eq("telegram_id", telegramId)
  .eq("currency", { Op: { gte: cost } });  // Atomic condition

// 3. Add logging for security audit
console.log(`[SECURITY] upgradeTap by ${validation.userId} at ${new Date().toISOString()}`);
```

---

## 11. Summary of Issues

### Critical Issues (Fix Immediately)

| # | Issue | Impact | Recommendation |
|---|-------|--------|----------------|
| 1 | RLS `USING(true)` on game_progress UPDATE | Any user can modify any player's data | Ensure all writes go through edge functions OR add proper JWT-based RLS |
| 2 | No telegram_id mismatch check in edge functions | User A could modify User B's data | Add validation in all edge functions |
| 3 | Race condition in upgradeTap | Double-spend currency possible | Use atomic UPDATE with WHERE clause |
| 4 | No foreign keys | Orphaned records, data integrity issues | Add FK constraints with CASCADE DELETE |
| 5 | Real vs Numeric for currency/XP | Precision loss at scale | Change to NUMERIC(20,2) |

### Moderate Issues (Fix Before Launch)

| # | Issue | Impact | Recommendation |
|---|-------|--------|----------------|
| 6 | JSONB overuse | Cannot index, slow queries | Normalize active_boosters, daily_ad_views |
| 7 | Full row SELECT on every load | Performance degradation | Select only needed columns |
| 8 | Wide game_progress table | I/O overhead | Split into domain tables |
| 9 | Missing composite indexes | Slow leaderboards | Add (epoch_id, total_xp DESC) index |
| 10 | Migration file naming errors | Confusion, potential issues | Fix double extensions |

### Low Priority (Roadmap)

| # | Issue | Recommendation |
|---|-------|----------------|
| 11 | No materialized views for leaderboards | Create pre-computed leaderboards |
| 12 | No connection pool configuration | Configure for production traffic |
| 13 | No database partitioning | Partition time-series tables |
| 14 | No migration testing in CI | Add automated migration tests |

---

## 12. Recommended Next Steps

### Immediate (Before Production)

1. **Fix edge function telegram_id validation** — Add mismatch checks
2. **Add atomic updates** for currency operations
3. **Add foreign key constraints** for referential integrity
4. **Change REAL to NUMERIC** for financial columns
5. **Audit all direct Supabase writes** from client code

### Short-term (Before 10K Users)

6. **Add composite indexes** for leaderboard queries
7. **Normalize active_boosters** into separate table
8. **Split game_progress** into domain tables
9. **Add value range constraints** (CHECK constraints)
10. **Fix migration file naming**

### Long-term (Before 100K+ Users)

11. **Implement materialized views** for leaderboards
12. **Add table partitioning** for analytics tables
13. **Configure read replicas** for reporting
14. **Implement caching layer** (Redis)
15. **Plan for horizontal sharding**

---

## Appendix A: Complete Schema DDL

```sql
-- See migrations/20260701120000_019_notifications_system.sql for latest
```

## Appendix B: Index Recommendations

```sql
-- Run these for immediate performance improvement
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_game_progress_epoch_leaderboard 
ON game_progress(epoch_id, total_xp DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_game_progress_last_saved 
ON game_progress(last_saved_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ad_views_telegram_date 
ON ad_views(telegram_id, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_player_sessions_user_time 
ON player_sessions(telegram_id, session_started_at DESC);

-- Foreign key constraints (add with caution, requires data cleanup)
-- ALTER TABLE prestige_records ADD CONSTRAINT fk_prestige_player 
-- FOREIGN KEY (telegram_id) REFERENCES game_progress(telegram_id) ON DELETE CASCADE;
```

## Appendix C: Data Type Fixes

```sql
-- Fix precision issues
ALTER TABLE game_progress 
ALTER COLUMN xp TYPE numeric(20,4),
ALTER COLUMN total_xp TYPE numeric(20,4),
ALTER COLUMN currency TYPE numeric(20,4),
ALTER COLUMN total_currency_earned TYPE numeric(20,4),
ALTER COLUMN passive_xp_per_second TYPE numeric(10,6);
```

---

*Report generated by AAA Studio Database Architect*  
*For questions, contact: database-team@aaastudio.dev*
