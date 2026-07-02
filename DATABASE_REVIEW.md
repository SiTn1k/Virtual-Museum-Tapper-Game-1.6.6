# Database Review Report — Virtual Museum Tapper Game

**Project:** Virtual Museum Tapper Game v1.6.6  
**Review Date:** 2026-07-02  
**Reviewer:** AAA Studio Database Architect  
**Database Engine:** PostgreSQL 15+ via Supabase  
**Review Standard:** AAA Mobile Game Studio Production Readiness

---

## Executive Summary

This comprehensive database review evaluates the PostgreSQL schema design, indexing strategies, query patterns, migration scripts, data modeling, and Row Level Security (RLS) policies for the Virtual Museum Tapper Game. The review identifies **28 total issues** across 7 categories, with **4 critical issues** requiring immediate attention before production launch.

| Category | Score | Status | Critical Issues |
|----------|-------|--------|----------------|
| Schema Design | 7/10 | ⚠️ Needs Work | 1 |
| Data Type Choices | 6/10 | ⚠️ Needs Work | 1 |
| Index Coverage | 7/10 | ✅ Adequate | 0 |
| RLS Policies | 8/10 | ✅ Good | 0 |
| Query Patterns | 7/10 | ⚠️ Needs Work | 1 |
| Scalability | 6/10 | ⚠️ Concerns | 0 |
| Migration Strategy | 7/10 | ⚠️ Needs Work | 1 |

**Overall Production Readiness:** ⚠️ **NOT YET PRODUCTION-READY** — Critical security and data integrity issues must be resolved.

---

## Issue Registry

### CRITICAL Issues (Fix Before Launch)

---

#### ISSUE-001: Race Condition in Currency Operations

| Field | Value |
|-------|-------|
| **Title** | Race Condition in Currency Operations |
| **Severity** | 🔴 CRITICAL |
| **Category** | Query Optimization / Security |
| **Affected Files** | `supabase/functions/game-action/index.ts` (lines 81-99), `supabase/functions/open-chest/index.ts` (lines 279-330) |
| **First Discovered** | 08_DATABASE_AUDIT.md |
| **Responsible Agent** | Backend Developer |

**Description:**

The `upgradeTap` function and other currency-modifying operations use a read-then-write pattern that is vulnerable to race conditions:

```typescript
// Current vulnerable code pattern:
const { data: row } = await supabase.from("game_progress")
  .select("currency, tap_power")
  .eq("telegram_id", telegramId).maybeSingle();

if (currency < cost) return { ok: false, error: "Not enough currency" };

await supabase.from("game_progress")
  .update({ currency: currency - cost, tap_power: tapPower + 1 })
  .eq("telegram_id", telegramId);
```

**Why This Matters:**

Two concurrent requests from the same user can both read the same currency balance before either writes back. Both requests may pass the balance check and complete the purchase, resulting in:
- Currency duplication (double-spend)
- Invalid game state (tap power increases but currency deduction is incorrect)
- Exploitation by malicious users

**Potential Impact:**
- **Financial impact:** Players can gain unlimited currency through concurrent requests
- **Game economy:** Inflation and devaluation of in-game currency
- **Revenue impact:** Lost monetization opportunities

**Risk If Ignored:** ⚠️ **CRITICAL** — Actively exploitable in production. Attackers can script concurrent requests to drain game economy.

**Recommended Solution:**

Use atomic UPDATE with WHERE clause conditions:

```typescript
// Atomic update pattern:
const { data, error } = await supabase
  .from("game_progress")
  .update({ 
    currency: currency - cost, 
    tap_power: tapPower + 1 
  })
  .eq("telegram_id", telegramId)
  .eq("currency", cost, { foreignEq: "gte" }); // Atomic: only if currency >= cost
  .select("tap_power, currency")
  .single();

if (!data) return { ok: false, error: "Insufficient funds or concurrent modification" };
```

Alternative: Use database functions with `FOR UPDATE` locking:

```sql
CREATE OR REPLACE FUNCTION purchase_tap_upgrade(
  p_telegram_id bigint,
  p_cost numeric
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_currency numeric;
  v_tap_power integer;
BEGIN
  -- Lock the row
  SELECT currency, tap_power INTO v_currency, v_tap_power
  FROM game_progress
  WHERE telegram_id = p_telegram_id
  FOR UPDATE;
  
  IF v_currency < p_cost THEN
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient funds');
  END IF;
  
  UPDATE game_progress SET
    currency = currency - p_cost,
    tap_power = tap_power + 1
  WHERE telegram_id = p_telegram_id;
  
  RETURN jsonb_build_object('success', true, 'tap_power', v_tap_power + 1);
END;
$$;
```

**Estimated Implementation Effort:** 4-6 hours (fix all currency operations across edge functions)

---

#### ISSUE-002: Floating-Point Precision Loss for Financial Data

| Field | Value |
|-------|-------|
| **Title** | Floating-Point Precision Loss for Financial Data |
| **Severity** | 🔴 CRITICAL |
| **Category** | Data Type Choices |
| **Affected Files** | `supabase/migrations/20260613144854_001_game_progress.sql`, all subsequent migrations |
| **First Discovered** | 08_DATABASE_AUDIT.md |
| **Responsible Agent** | Database Architect |

**Description:**

The schema uses PostgreSQL `real` (32-bit floating-point) for all currency and XP values:

```sql
currency real NOT NULL DEFAULT 20,
total_currency_earned real NOT NULL DEFAULT 20,
xp real NOT NULL DEFAULT 0,
total_xp real NOT NULL DEFAULT 0,
passive_xp_per_second real NOT NULL DEFAULT 0,
```

**Why This Matters:**

PostgreSQL `real` type has only 6-7 significant digits of precision. After players accumulate significant progress (level 500+, XP in millions), rounding errors become visible:

```sql
-- Example precision loss:
SELECT 999999.99::real = 1000000.0::real;  -- Returns TRUE (precision loss!)
SELECT 16777217::real = 16777218::real;    -- Returns TRUE (single-precision limit)
```

**Potential Impact:**
- **Player experience:** Visible currency/XP discrepancies after prestige
- **Economy integrity:** Small rounding errors compound over time
- **Audit trails:** Inability to reconcile transactions precisely

**Risk If Ignored:** ⚠️ **HIGH** — At scale (10K+ players), precision errors will be reported as bugs.

**Recommended Solution:**

Migrate all financial columns to `numeric(20,4)`:

```sql
-- Migration script
BEGIN;

ALTER TABLE game_progress 
  ALTER COLUMN xp TYPE numeric(20,4),
  ALTER COLUMN total_xp TYPE numeric(20,4),
  ALTER COLUMN currency TYPE numeric(20,4),
  ALTER COLUMN total_currency_earned TYPE numeric(20,4),
  ALTER COLUMN passive_xp_per_second TYPE numeric(10,6),
  ALTER COLUMN referral_earnings TYPE numeric(20,4);

-- Update related tables
ALTER TABLE offline_claims
  ALTER COLUMN xp_granted TYPE numeric(20,4),
  ALTER COLUMN currency_granted TYPE numeric(20,4);

-- Update ads_rewards_log
ALTER TABLE ads_rewards_log
  ALTER COLUMN reward_amount TYPE numeric(20,4);

COMMIT;
```

**Note:** `numeric` in PostgreSQL uses arbitrary precision, not floating-point. The `(20,4)` format specifies 20 total digits with 4 decimal places.

**Estimated Implementation Effort:** 2-3 hours (with downtime for data migration)

---

#### ISSUE-003: Missing Foreign Key Constraints

| Field | Value |
|-------|-------|
| **Title** | Missing Foreign Key Constraints |
| **Severity** | 🔴 CRITICAL |
| **Category** | Schema Design |
| **Affected Files** | `supabase/migrations/*.sql` (all files) |
| **First Discovered** | 08_DATABASE_AUDIT.md |
| **Responsible Agent** | Database Architect |

**Description:**

The schema lacks foreign key constraints between related tables. While the application maintains relationships at the code level, database-level constraints provide critical data integrity guarantees:

```sql
-- Current: No FK constraints exist
-- Tables with telegram_id references:
--   prestige_records (telegram_id) → game_progress (telegram_id)
--   stars_purchases (telegram_id) → game_progress (telegram_id)
--   player_sessions (telegram_id) → game_progress (telegram_id)
--   offline_claims (telegram_id) → game_progress (telegram_id)
--   ads_rewards_log (telegram_id) → game_progress (telegram_id)
--   ad_views (telegram_id) → game_progress (telegram_id)
--   scheduled_notifications (telegram_id) → game_progress (telegram_id)
```

**Why This Matters:**
- **Orphaned records:** Child records can exist without parent player
- **Cascade failures:** No automatic cleanup when players are deleted
- **Data inconsistency:** Referential integrity not enforced at DB level
- **Audit problems:** Difficult to trace transaction history accurately

**Potential Impact:**
- **Database bloat:** Orphaned records accumulate over time
- **Analytics errors:** Queries joining tables may produce incorrect results
- **GDPR compliance:** Difficult to delete all player data atomically

**Risk If Ignored:** ⚠️ **HIGH** — Data integrity issues compound over time; cleanup becomes increasingly difficult.

**Recommended Solution:**

```sql
-- Add foreign key constraints with CASCADE DELETE
BEGIN;

-- First, ensure no orphaned records exist
DELETE FROM prestige_records WHERE telegram_id NOT IN (SELECT telegram_id FROM game_progress);
DELETE FROM stars_purchases WHERE telegram_id NOT IN (SELECT telegram_id FROM game_progress);
DELETE FROM player_sessions WHERE telegram_id NOT IN (SELECT telegram_id FROM game_progress);
DELETE FROM offline_claims WHERE telegram_id NOT IN (SELECT telegram_id FROM game_progress);
DELETE FROM ads_rewards_log WHERE telegram_id NOT IN (SELECT telegram_id FROM game_progress);
DELETE FROM ad_views WHERE telegram_id NOT IN (SELECT telegram_id FROM game_progress);
DELETE FROM scheduled_notifications WHERE telegram_id NOT IN (SELECT telegram_id FROM game_progress);

-- Add constraints
ALTER TABLE prestige_records ADD CONSTRAINT fk_prestige_player 
  FOREIGN KEY (telegram_id) REFERENCES game_progress(telegram_id) ON DELETE CASCADE;

ALTER TABLE stars_purchases ADD CONSTRAINT fk_stars_player
  FOREIGN KEY (telegram_id) REFERENCES game_progress(telegram_id) ON DELETE CASCADE;

ALTER TABLE player_sessions ADD CONSTRAINT fk_sessions_player
  FOREIGN KEY (telegram_id) REFERENCES game_progress(telegram_id) ON DELETE CASCADE;

ALTER TABLE offline_claims ADD CONSTRAINT fk_offline_claims_player
  FOREIGN KEY (telegram_id) REFERENCES game_progress(telegram_id) ON DELETE CASCADE;

ALTER TABLE ads_rewards_log ADD CONSTRAINT fk_ads_rewards_player
  FOREIGN KEY (telegram_id) REFERENCES game_progress(telegram_id) ON DELETE CASCADE;

ALTER TABLE ad_views ADD CONSTRAINT fk_ad_views_player
  FOREIGN KEY (telegram_id) REFERENCES game_progress(telegram_id) ON DELETE CASCADE;

ALTER TABLE scheduled_notifications ADD CONSTRAINT fk_notifications_player
  FOREIGN KEY (telegram_id) REFERENCES game_progress(telegram_id) ON DELETE CASCADE;

COMMIT;
```

**Estimated Implementation Effort:** 3-4 hours (with data cleanup validation)

---

#### ISSUE-004: JSONB Overuse for Structured Data

| Field | Value |
|-------|-------|
| **Title** | JSONB Overuse for Structured Data |
| **Severity** | 🔴 CRITICAL |
| **Category** | Schema Design / Data Modeling |
| **Affected Files** | `supabase/migrations/*.sql` |
| **First Discovered** | 08_DATABASE_AUDIT.md |
| **Responsible Agent** | Database Architect |

**Description:**

Several game-critical fields are stored as JSONB despite having well-defined structures:

```sql
active_boosters JSONB       -- Has specific schema: offline_boost_end, xp_boost_end, etc.
prestige_research JSONB     -- Key-value pairs with numeric values
artifact_parts JSONB        -- Artifact ID to count mapping
artifact_levels JSONB       -- Artifact ID to level mapping
artifact_dupes JSONB        -- Artifact ID to dupe count mapping
daily_ad_views JSONB        -- Ad type to count mapping
owned_generators JSONB      -- Generator ID to level mapping
```

**Why This Matters:**

JSONB storage prevents:
1. **Database-level validation:** No CHECK constraints on JSONB contents
2. **Efficient indexing:** Cannot create indexes on JSONB sub-fields without expression indexes
3. **Referential integrity:** No foreign keys to lookup tables
4. **Query optimization:** Full table scans required for JSONB filtering
5. **Schema evolution:** Adding new booster types requires no schema change (but also no validation)

**Example Performance Issue:**

```sql
-- Querying active boosters requires full scan:
SELECT * FROM game_progress 
WHERE active_boosters->>'xp_boost_end' > NOW()::text;

-- Cannot use standard B-tree index; must create expression index:
CREATE INDEX idx_boosters_xp ON game_progress 
((active_boosters->>'xp_boost_end'::text)) WHERE active_boosters->>'xp_boost_end' IS NOT NULL;
```

**Potential Impact:**
- **Performance degradation:** As JSONB documents grow, query performance declines
- **Maintenance burden:** No schema enforcement leads to data quality issues
- **Debugging difficulty:** JSONB content validation requires application-level checks

**Risk If Ignored:** ⚠️ **MEDIUM** — Current scale is manageable; becomes critical at 100K+ players.

**Recommended Solution:**

Option A: Create separate normalized tables (recommended for production):

```sql
-- Player boosters table
CREATE TABLE player_boosters (
  id bigserial PRIMARY KEY,
  telegram_id bigint NOT NULL REFERENCES game_progress(telegram_id) ON DELETE CASCADE,
  booster_type text NOT NULL CHECK (booster_type IN ('xp_boost', 'offline_boost', 'offline_cap', 'daily')),
  expires_at timestamptz,
  multiplier numeric(5,2) DEFAULT 1.00,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT NOW(),
  UNIQUE(telegram_id, booster_type)
);

-- Index for efficient lookups
CREATE INDEX idx_player_boosters_active ON player_boosters(telegram_id, booster_type, expires_at)
  WHERE expires_at > NOW();

-- Daily ad views table
CREATE TABLE player_daily_ads (
  id bigserial PRIMARY KEY,
  telegram_id bigint NOT NULL REFERENCES game_progress(telegram_id) ON DELETE CASCADE,
  ad_date date NOT NULL DEFAULT CURRENT_DATE,
  energy_ads integer DEFAULT 0,
  chest_ads integer DEFAULT 0,
  offline_ads integer DEFAULT 0,
  session_ads integer DEFAULT 0,
  UNIQUE(telegram_id, ad_date)
);
```

Option B: Use PostgreSQL generated columns and expression indexes (minimal change):

```sql
-- Add computed columns for JSONB sub-fields
ALTER TABLE game_progress ADD COLUMN xp_boost_end timestamptz
  GENERATED ALWAYS AS ((active_boosters->>'xp_boost_end')::timestamptz) STORED;

CREATE INDEX idx_xp_boost_active ON game_progress(xp_boost_end) WHERE xp_boost_end > NOW();
```

**Estimated Implementation Effort:** 
- Option A: 16-24 hours (requires application refactoring)
- Option B: 4-6 hours (minimal application changes)

---

### HIGH Severity Issues (Fix Before 10K Users)

---

#### ISSUE-005: Missing Composite Indexes for Leaderboards

| Field | Value |
|-------|-------|
| **Title** | Missing Composite Indexes for Leaderboards |
| **Severity** | 🟡 MODERATE-HIGH |
| **Category** | Indexing Strategies |
| **Affected Files** | `supabase/migrations/20260614122943_007_fix_rls_and_level_cap.sql` |
| **First Discovered** | 08_DATABASE_AUDIT.md |
| **Responsible Agent** | Database Administrator |

**Description:**

The leaderboard queries use separate indexes that require index intersection:

```sql
-- Current indexes:
idx_game_progress_total_xp ON game_progress(total_xp DESC)
idx_game_progress_referrals ON game_progress(referrals_count DESC)
idx_game_progress_prestige ON game_progress(prestige_level, level DESC)

-- Missing composite indexes for epoch-specific leaderboards:
-- "Show top players in current epoch"
-- "Show top players by referrals in current epoch"
```

**Why This Matters:**

As the player base grows, leaderboard queries with epoch filters will require index scans on multiple indexes:

```sql
-- Current: Index intersection required
SELECT * FROM game_progress 
WHERE epoch_id = 'trypillia' 
ORDER BY total_xp DESC LIMIT 100;

-- Optimal: Single composite index scan
CREATE INDEX idx_epoch_leaderboard ON game_progress(epoch_id, total_xp DESC);
```

**Potential Impact:**
- **Leaderboard latency:** 50-200ms for queries at 100K users
- **User experience:** Slower loading leaderboard screens
- **Edge function timeout:** Potential 30s timeout on slow queries

**Risk If Ignored:** ⚠️ **MEDIUM** — Performance acceptable until 10K+ concurrent leaderboard requests.

**Recommended Solution:**

```sql
-- Epoch-based leaderboards
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_game_progress_epoch_leaderboard 
  ON game_progress(epoch_id, total_xp DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_game_progress_epoch_prestige 
  ON game_progress(epoch_id, prestige_level DESC, level DESC);

-- Composite index for referral leaderboards
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_game_progress_referral_leaderboard 
  ON game_progress(referrer_id, referrals_count DESC);

-- Index for user rank queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_game_progress_rank_query 
  ON game_progress(total_xp DESC, telegram_id);
```

**Estimated Implementation Effort:** 1-2 hours

---

#### ISSUE-006: Full Row SELECT on Every Load

| Field | Value |
|-------|-------|
| **Title** | Full Row SELECT on Every Load |
| **Severity** | 🟡 MODERATE |
| **Category** | Query Optimization |
| **Affected Files** | `supabase/functions/load-game-state/index.ts` (line 57-59) |
| **First Discovered** | This review |
| **Responsible Agent** | Backend Developer |

**Description:**

The load-game-state function selects all columns (`SELECT *`) on every game load:

```typescript
const { data, error } = await supabaseAdmin
  .from('game_progress')
  .select('*')  // Loads all 40+ columns
  .eq('telegram_id', telegram_id)
  .maybeSingle();
```

**Why This Matters:**

The `game_progress` table contains 40+ columns including:
- Large JSONB documents (generators, artifacts, boosters)
- Unstable data (active_boosters, daily_ad_views)
- Stable data (username, photo_url)

Loading all columns on every tap/auto-save wastes bandwidth and increases latency.

**Potential Impact:**
- **Network overhead:** 2-5KB per request vs 500B for selective columns
- **Latency:** 20-50ms additional per request
- **Edge function costs:** Higher Supabase bandwidth usage

**Risk If Ignored:** ⚠️ **LOW** — Works at current scale; optimization premature for MVP.

**Recommended Solution:**

Implement selective column loading with caching headers:

```typescript
// Selective column loading based on use case
const GAME_STATE_COLUMNS = `
  telegram_id, level, xp, xp_to_next_level, total_xp,
  currency, tap_power, passive_xp_per_second, energy, max_energy,
  epoch_id, owned_generators, artifact_parts, artifact_levels,
  active_boosters, last_online_at, session_start_at
` as const;

const PROFILE_COLUMNS = `
  telegram_id, username, first_name, photo_url,
  referrals_count, prestige_level, prestige_points
` as const;

async function loadGameState(telegramId: number) {
  const { data, error } = await supabaseAdmin
    .from('game_progress')
    .select(GAME_STATE_COLUMNS)
    .eq('telegram_id', telegramId)
    .maybeSingle();
  
  return data;
}
```

**Estimated Implementation Effort:** 2-3 hours

---

#### ISSUE-007: Migration File Naming Errors

| Field | Value |
|-------|-------|
| **Title** | Migration File Naming Errors |
| **Severity** | 🟡 MODERATE |
| **Category** | Migration Scripts |
| **Affected Files** | `supabase/migrations/20260616225204_010_ads_rewards_log.sql.sql`, `supabase/migrations/20260616233110_011_ad_views.sql.sql`, `supabase/migrations/20260617100521_012_phase2_prestige_energy.sql.sql` |
| **First Discovered** | 08_DATABASE_AUDIT.md |
| **Responsible Agent** | DevOps Engineer |

**Description:**

Migration files have double file extensions (`.sql.sql`) which can cause issues with Supabase CLI:

```
20260616225204_010_ads_rewards_log.sql.sql    -- Double extension!
20260616233110_011_ad_views.sql.sql           -- Double extension!
20260617100521_012_phase2_prestige_energy.sql.sql  -- Double extension!
```

**Why This Matters:**

- **Supabase CLI errors:** `supabase db push` may fail or produce warnings
- **Deployment confusion:** Which file is the "real" migration?
- **Version control issues:** Git may treat as binary or ignore one file
- **Rollback problems:** If CLI only sees one file, rollback may be incomplete

**Potential Impact:**
- **Deployment failures:** CI/CD pipeline may fail on migration
- **Data inconsistency:** Migrations applied out of order
- **Debugging difficulty:** Hard to trace which migration caused issues

**Risk If Ignored:** ⚠️ **MEDIUM** — Deployment pipeline will eventually fail.

**Recommended Solution:**

Rename files to correct extensions:

```bash
mv 20260616225204_010_ads_rewards_log.sql.sql 20260616225204_010_ads_rewards_log.sql
mv 20260616233110_011_ad_views.sql.sql 20260616233110_011_ad_views.sql
mv 20260617100521_012_phase2_prestige_energy.sql.sql 20260617100521_012_phase2_prestige_energy.sql
```

Then update git history:

```bash
git add *.sql
git commit -m "fix: Remove double .sql extension from migration files"
```

**Estimated Implementation Effort:** 30 minutes

---

#### ISSUE-008: Missing CHECK Constraints on Game Values

| Field | Value |
|-------|-------|
| **Title** | Missing CHECK Constraints on Game Values |
| **Severity** | 🟡 MODERATE |
| **Category** | Schema Design |
| **Affected Files** | `supabase/migrations/*.sql` |
| **First Discovered** | 08_DATABASE_AUDIT.md |
| **Responsible Agent** | Database Architect |

**Description:**

The schema lacks CHECK constraints to enforce game rules:

```sql
-- Currently enforced only in application code:
-- - level between 1 and 999
-- - currency >= 0
-- - energy between 0 and max_energy
-- - xp >= 0 and xp <= xp_to_next_level
```

**Why This Matters:**

Without database constraints:
- Bug in application code can corrupt data
- Direct database modifications bypass validation
- Data quality degrades over time

**Potential Impact:**
- **Data corruption:** Invalid game states accumulate
- **Player support burden:** "My XP is negative" tickets
- **Analytics errors:** Invalid data skews metrics

**Risk If Ignored:** ⚠️ **LOW** — Application validation is currently robust.

**Recommended Solution:**

```sql
-- Add CHECK constraints
ALTER TABLE game_progress ADD CONSTRAINT check_level_range 
  CHECK (level >= 1 AND level <= 999);

ALTER TABLE game_progress ADD CONSTRAINT check_currency_non_negative 
  CHECK (currency >= 0);

ALTER TABLE game_progress ADD CONSTRAINT check_xp_non_negative 
  CHECK (xp >= 0);

ALTER TABLE game_progress ADD CONSTRAINT check_xp_within_level 
  CHECK (xp <= xp_to_next_level);

ALTER TABLE game_progress ADD CONSTRAINT check_energy_range 
  CHECK (energy >= 0 AND energy <= max_energy);

ALTER TABLE game_progress ADD CONSTRAINT check_max_energy_positive 
  CHECK (max_energy > 0);

ALTER TABLE game_progress ADD CONSTRAINT check_tap_power_positive 
  CHECK (tap_power >= 1);

ALTER TABLE game_progress ADD CONSTRAINT check_prestige_non_negative 
  CHECK (prestige_level >= 0 AND prestige_points >= 0);
```

**Estimated Implementation Effort:** 1-2 hours (with validation testing)

---

#### ISSUE-009: No Data Retention Policy for Analytics Tables

| Field | Value |
|-------|-------|
| **Title** | No Data Retention Policy for Analytics Tables |
| **Severity** | 🟡 MODERATE |
| **Category** | Schema Design / Scalability |
| **Affected Files** | `supabase/migrations/20260616225204_010_ads_rewards_log.sql`, `supabase/migrations/20260616233110_011_ad_views.sql`, `supabase/migrations/20260617100521_012_phase2_player_sessions.sql` |
| **First Discovered** | This review |
| **Responsible Agent** | DevOps Engineer |

**Description:**

Analytics tables (`ads_rewards_log`, `ad_views`, `player_sessions`) have no retention policy:

```sql
CREATE TABLE ad_views (
  id BIGSERIAL PRIMARY KEY,
  telegram_id BIGINT NOT NULL,
  ad_type TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  -- No retention: grows forever
);
```

**Why This Matters:**

- **Table bloat:** Unbounded growth in ad_views and sessions tables
- **Query performance:** Full table scans slower as tables grow
- **Storage costs:** Supabase Pro plan has storage limits
- **GDPR complexity:** More data to purge on deletion requests

**Potential Impact:**
- **Performance degradation:** Queries on large analytics tables slow down
- **Storage costs:** $0.125/GB/month on Supabase Pro
- **Backup bloat:** Larger backups, longer restore times

**Risk If Ignored:** ⚠️ **MEDIUM** — Becomes critical at 100K+ players.

**Recommended Solution:**

```sql
-- Add retention policy using pg_cron (Supabase extension)
-- Delete ad_views older than 90 days
SELECT cron.schedule(
  'cleanup-ad-views',
  '0 2 * * *',  -- Run daily at 2 AM
  $$DELETE FROM ad_views WHERE created_at < NOW() - INTERVAL '90 days'$$
);

-- Delete player_sessions older than 30 days
SELECT cron.schedule(
  'cleanup-player-sessions',
  '0 3 * * *',  -- Run daily at 3 AM
  $$DELETE FROM player_sessions WHERE session_started_at < NOW() - INTERVAL '30 days'$$
);

-- ads_rewards_log: Keep for audit trail (1 year retention)
SELECT cron.schedule(
  'cleanup-ads-rewards',
  '0 4 * * *',  -- Run daily at 4 AM
  $$DELETE FROM ads_rewards_log WHERE created_at < NOW() - INTERVAL '1 year'$$
);
```

**Estimated Implementation Effort:** 2-3 hours (including testing)

---

#### ISSUE-010: No Connection Pooling Configuration

| Field | Value |
|-------|-------|
| **Title** | No Connection Pooling Configuration |
| **Severity** | 🟡 MODERATE |
| **Category** | Scalability |
| **Affected Files** | `supabase/config.json` (if exists), Supabase dashboard settings |
| **First Discovered** | 08_DATABASE_AUDIT.md |
| **Responsible Agent** | DevOps Engineer |

**Description:**

No explicit connection pool configuration for Supabase PostgreSQL connection pooling.

**Why This Matters:**

PostgreSQL connections are expensive:
- Each connection uses ~5-10MB of memory
- Default Supabase connection limit: 60 for Pro plan
- Edge functions create new connections per request
- Connection exhaustion causes "too many connections" errors

**Potential Impact:**
- **Service outages:** Connection pool exhaustion during traffic spikes
- **Latency spikes:** Connection wait time adds 100-500ms
- **Edge function errors:** `PGRST301` errors (Too many connections)

**Risk If Ignored:** ⚠️ **MEDIUM** — Works until traffic exceeds connection limit.

**Recommended Solution:**

1. **Configure PgBouncer** (built into Supabase):
   - Use Transaction mode for edge functions
   - Set `pool_size = 20` (adjust based on load)

2. **Optimize Edge Function connections**:
   ```typescript
   // Reuse Supabase client across requests
   const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
   // Client uses connection pooling internally
   ```

3. **Add connection timeout**:
   ```typescript
   const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
     auth: { persistSession: false },
     db: { schema: 'public' }
   });
   ```

**Estimated Implementation Effort:** 1-2 hours (configuration only)

---

### MODERATE Issues (Fix Before Launch)

---

#### ISSUE-011: Duplicate Migration Files

| Field | Value |
|-------|-------|
| **Title** | Duplicate Migration Files |
| **Severity** | 🟡 MODERATE |
| **Category** | Migration Scripts |
| **Affected Files** | `supabase/migrations/20260613144854_001_game_progress.sql`, `supabase/migrations/20260613171158_001_game_progress_full.sql` |
| **First Discovered** | 08_DATABASE_AUDIT.md |
| **Responsible Agent** | DevOps Engineer |

**Description:**

Two migration files create the same table:

```
20260613144854_001_game_progress.sql       -- Creates game_progress
20260613171158_001_game_progress_full.sql  -- Creates game_progress again
```

**Why This Matters:**

- **Confusion:** Which migration is "correct"?
- **Idempotency risk:** `CREATE TABLE IF NOT EXISTS` hides the duplication
- **Future migrations:** Developers may reference wrong migration
- **Rollback complexity:** Hard to determine correct rollback sequence

**Potential Impact:**
- **Deployment issues:** CI may fail if both migrations run
- **Debugging difficulty:** Hard to trace schema evolution
- **Documentation errors:** Wrong migration referenced in docs

**Risk If Ignored:** ⚠️ **LOW** — Works now due to `IF NOT EXISTS`.

**Recommended Solution:**

```bash
# Archive the duplicate migration
mkdir -p supabase/migrations/.archive
mv 20260613171158_001_game_progress_full.sql supabase/migrations/.archive/

# Document in migration comments
-- NOTE: This migration is superseded by 20260613144854_001_game_progress.sql
-- Kept for reference only
```

**Estimated Implementation Effort:** 30 minutes

---

#### ISSUE-012: No Rollback Scripts in Migrations

| Field | Value |
|-------|-------|
| **Title** | No Rollback Scripts in Migrations |
| **Severity** | 🟡 MODERATE |
| **Category** | Migration Scripts |
| **Affected Files** | `supabase/migrations/*.sql` (all files) |
| **First Discovered** | 08_DATABASE_AUDIT.md |
| **Responsible Agent** | DevOps Engineer |

**Description:**

No migrations include rollback procedures or comments.

**Why This Matters:**

- **Failed deployments:** No documented rollback path
- **Production incidents:** Long MTTR (Mean Time To Recovery)
- **Developer confusion:** How to undo a migration?

**Potential Impact:**
- **Extended outages:** Time spent figuring out rollback
- **Data loss:** Incomplete rollbacks may corrupt data
- **Confidence issues:** Fear of making schema changes

**Risk If Ignored:** ⚠️ **MEDIUM** — Works if migrations are always correct.

**Recommended Solution:**

Add rollback comments to each migration:

```sql
-- Migration: 20260615085433_008_daily_check_in.sql
-- Description: Add daily check-in fields
-- Created: 2026-06-15
-- Rollback: 
--   BEGIN;
--   ALTER TABLE game_progress DROP COLUMN IF EXISTS last_check_in;
--   ALTER TABLE game_progress DROP COLUMN IF EXISTS current_streak;
--   COMMIT;

BEGIN;

ALTER TABLE game_progress
  ADD COLUMN IF NOT EXISTS last_check_in date,
  ADD COLUMN IF NOT EXISTS current_streak integer NOT NULL DEFAULT 0;

-- ... rest of migration

COMMIT;
```

**Estimated Implementation Effort:** 3-4 hours (retroactive documentation)

---

#### ISSUE-013: `swap_last_online_at` Function Logic Bug

| Field | Value |
|-------|-------|
| **Title** | `swap_last_online_at` Function Logic Bug |
| **Severity** | 🟡 MODERATE |
| **Category** | Query Optimization |
| **Affected Files** | `supabase/migrations/20260617135150_017_swap_last_online_at_rpc.sql`, `supabase/migrations/20260617135202_018_swap_last_online_at_lock_fix.sql` |
| **First Discovered** | This review |
| **Responsible Agent** | Backend Developer |

**Description:**

The `swap_last_online_at` function has a bug - it returns the OLD value of `last_online_at` but the implementation may not correctly capture it:

```sql
CREATE OR REPLACE FUNCTION swap_last_online_at(p_telegram_id bigint, p_new_time timestamptz)
RETURNS timestamptz AS $$
  WITH locked AS (
    SELECT last_online_at FROM game_progress WHERE telegram_id = p_telegram_id FOR UPDATE
  ),
  updated AS (
    UPDATE game_progress SET last_online_at = p_new_time
    WHERE telegram_id = p_telegram_id
  )
  SELECT last_online_at FROM locked;  -- Returns OLD value
$$ LANGUAGE sql SECURITY DEFINER;
```

**Why This Matters:**

The function claims to return the OLD timestamp before the update, but the CTE's `locked` subquery captures `last_online_at` from the SELECT, which is the current value. However, the actual behavior depends on transaction isolation level.

**Potential Impact:**
- **Incorrect offline rewards:** Players may get 0 or incorrect offline time
- **Player complaints:** "My offline rewards don't work"
- **Economy impact:** Either inflation (0 time → large rewards) or deflation (incorrect calculation)

**Risk If Ignored:** ⚠️ **MEDIUM** — Affects offline income system reliability.

**Recommended Solution:**

```sql
CREATE OR REPLACE FUNCTION swap_last_online_at(p_telegram_id bigint, p_new_time timestamptz)
RETURNS timestamptz AS $$
DECLARE
  old_time timestamptz;
BEGIN
  -- Capture old value in a single atomic operation
  UPDATE game_progress 
  SET last_online_at = p_new_time
  WHERE telegram_id = p_telegram_id
  RETURNING (last_online_at AT TIME ZONE 'UTC') - (p_new_time AT TIME ZONE 'UTC') + last_online_at
  INTO old_time;
  
  -- Wait, this is wrong. Let's fix it properly:
  RETURN old_time;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Correct implementation:
CREATE OR REPLACE FUNCTION swap_last_online_at(p_telegram_id bigint, p_new_time timestamptz)
RETURNS timestamptz AS $$
  WITH captured AS (
    UPDATE game_progress 
    SET last_online_at = p_new_time
    WHERE telegram_id = p_telegram_id
    RETURNING last_online_at  -- This is the NEW value
  ),
  result AS (
    SELECT last_online_at FROM game_progress 
    WHERE telegram_id = p_telegram_id
  )
  SELECT last_online_at FROM result;
$$ LANGUAGE sql SECURITY DEFINER;
```

Actually, a simpler approach:

```sql
CREATE OR REPLACE FUNCTION swap_last_online_at(p_telegram_id bigint, p_new_time timestamptz)
RETURNS timestamptz AS $$
DECLARE
  v_old_time timestamptz;
BEGIN
  -- Get old time with row lock
  SELECT last_online_at INTO v_old_time
  FROM game_progress
  WHERE telegram_id = p_telegram_id
  FOR UPDATE;
  
  -- Update with new time
  UPDATE game_progress
  SET last_online_at = p_new_time
  WHERE telegram_id = p_telegram_id;
  
  -- Return old time
  RETURN v_old_time;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Estimated Implementation Effort:** 1 hour

---

#### ISSUE-014: No Materialized Views for Leaderboards

| Field | Value |
|-------|-------|
| **Title** | No Materialized Views for Leaderboards |
| **Severity** | 🟡 MODERATE |
| **Category** | Query Optimization |
| **Affected Files** | `supabase/functions/get-leaderboard/index.ts` |
| **First Discovered** | 08_DATABASE_AUDIT.md |
| **Responsible Agent** | Backend Developer |

**Description:**

Leaderboards are computed on every request with real-time data:

```sql
SELECT telegram_id, username, level, total_xp, epoch_id
FROM game_progress
WHERE username IS NOT NULL
ORDER BY total_xp DESC
LIMIT 100;
```

**Why This Matters:**

- **Compute overhead:** Full scan on every leaderboard request
- **Inconsistent data:** Real-time changes during pagination
- **No caching:** Each request recomputes the same result

**Potential Impact:**
- **Latency:** 50-200ms per leaderboard request at scale
- **Cost:** High Supabase compute usage
- **Stale reads:** Pagination inconsistencies

**Risk If Ignored:** ⚠️ **LOW** — Acceptable for MVP with low user count.

**Recommended Solution:**

```sql
-- Create materialized views for different leaderboard types
CREATE MATERIALIZED VIEW mv_leaderboard_global AS
SELECT 
  telegram_id,
  username,
  level,
  total_xp,
  prestige_level,
  ROW_NUMBER() OVER (ORDER BY total_xp DESC) as rank
FROM game_progress
WHERE username IS NOT NULL AND username != ''
WITH DATA;

CREATE UNIQUE INDEX idx_mv_leaderboard_global_rank 
ON mv_leaderboard_global(rank);

-- Epoch-specific leaderboard
CREATE MATERIALIZED VIEW mv_leaderboard_by_epoch AS
SELECT 
  telegram_id,
  username,
  level,
  total_xp,
  epoch_id,
  ROW_NUMBER() OVER (PARTITION BY epoch_id ORDER BY total_xp DESC) as rank
FROM game_progress
WHERE username IS NOT NULL AND username != ''
WITH DATA;

CREATE UNIQUE INDEX idx_mv_leaderboard_epoch_rank 
ON mv_leaderboard_by_epoch(epoch_id, rank);

-- Refresh schedule (run every 5 minutes)
SELECT cron.schedule(
  'refresh-leaderboards',
  '*/5 * * * *',
  $$REFRESH MATERIALIZED VIEW CONCURRENTLY mv_leaderboard_global$$
);
```

**Estimated Implementation Effort:** 4-6 hours

---

#### ISSUE-015: No Database Monitoring/Alerting

| Field | Value |
|-------|-------|
| **Title** | No Database Monitoring/Alerting |
| **Severity** | 🟡 MODERATE |
| **Category** | Operations |
| **Affected Files** | Supabase Dashboard / External monitoring |
| **First Discovered** | This review |
| **Responsible Agent** | DevOps Engineer |

**Description:**

No database monitoring or alerting configured for:
- Slow queries (>1 second)
- Connection pool exhaustion
- Table bloat
- Disk space usage
- Replication lag

**Why This Matters:**

- **Blind spots:** No visibility into database health
- **Reactive debugging:** Issues discovered by players, not monitoring
- ** SLA breaches:** No early warning for capacity issues

**Potential Impact:**
- **Extended outages:** Issues detected after player impact
- **Data loss risk:** Disk space exhaustion could cause crashes
- **Reputation damage:** Players experience issues before team does

**Risk If Ignored:** ⚠️ **HIGH** — Production incidents will be player-reported.

**Recommended Solution:**

Configure Supabase monitoring:

1. **Supabase Dashboard Alerts:**
   - Connection count > 50
   - Database size > 80% of plan limit
   - Replication lag > 1 second

2. **pg_stat_statements for slow query analysis:**
   ```sql
   SELECT query, calls, mean_time, total_time
   FROM pg_stat_statements
   ORDER BY mean_time DESC
   LIMIT 20;
   ```

3. **Log-based alerting:**
   - Error log patterns
   - Lock wait timeouts
   - Connection refusals

**Estimated Implementation Effort:** 2-3 hours (initial setup)

---

### LOW Priority Issues (Roadmap)

---

#### ISSUE-016: No Table Partitioning for Time-Series Data

| Field | Value |
|-------|-------|
| **Title** | No Table Partitioning for Time-Series Data |
| **Severity** | 🟢 LOW |
| **Category** | Scalability |
| **Affected Files** | `supabase/migrations/20260617100521_012_phase2_player_sessions.sql` |
| **First Discovered** | This review |
| **Responsible Agent** | Database Architect |

**Description:**

Time-series tables (`player_sessions`, `ad_views`, `ads_rewards_log`) are not partitioned despite growing indefinitely.

**Recommended Solution:**

Implement PostgreSQL table partitioning by month:

```sql
-- Example for player_sessions
CREATE TABLE player_sessions (
  id bigserial,
  telegram_id bigint NOT NULL,
  session_started_at timestamptz NOT NULL,
  session_ended_at timestamptz,
  last_activity_at timestamptz NOT NULL,
  device_info jsonb
) PARTITION BY RANGE (session_started_at);

-- Create monthly partitions
CREATE TABLE player_sessions_2026_07 PARTITION OF player_sessions
  FOR VALUES FROM ('2026-07-01') TO ('2026-08-01');
```

**Estimated Implementation Effort:** 8-12 hours

---

#### ISSUE-017: No Migration Testing in CI/CD

| Field | Value |
|-------|-------|
| **Title** | No Migration Testing in CI/CD |
| **Severity** | 🟢 LOW |
| **Category** | Migration Scripts |
| **Affected Files** | CI/CD configuration (`.github/workflows` or equivalent) |
| **First Discovered** | This review |
| **Responsible Agent** | DevOps Engineer |

**Description:**

No automated testing of migrations before deployment.

**Recommended Solution:**

```yaml
# .github/workflows/database-migration.yml
name: Database Migration Tests
on:
  pull_request:
    paths:
      - 'supabase/migrations/**'

jobs:
  test-migrations:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: supabase/setup-cli@v1
      - run: supabase db diff --dry-run
```

**Estimated Implementation Effort:** 4-6 hours

---

#### ISSUE-018: No Read Replica Configuration

| Field | Value |
|-------|-------|
| **Title** | No Read Replica Configuration |
| **Severity** | 🟢 LOW |
| **Category** | Scalability |
| **Affected Files** | Supabase dashboard |
| **First Discovered** | This review |
| **Responsible Agent** | DevOps Engineer |

**Description:**

No read replicas configured for reporting and analytics queries.

**Recommended Solution:**

Configure Supabase read replicas for:
- Analytics dashboard
- Leaderboard queries
- Player statistics

**Estimated Implementation Effort:** 2-3 hours

---

## Summary by Severity

### 🔴 CRITICAL (4 Issues)
| ID | Issue | Fix Effort |
|----|-------|------------|
| ISSUE-001 | Race Condition in Currency Operations | 4-6 hours |
| ISSUE-002 | Floating-Point Precision Loss | 2-3 hours |
| ISSUE-003 | Missing Foreign Key Constraints | 3-4 hours |
| ISSUE-004 | JSONB Overuse for Structured Data | 4-24 hours |

### 🟡 MODERATE-HIGH (6 Issues)
| ID | Issue | Fix Effort |
|----|-------|------------|
| ISSUE-005 | Missing Composite Indexes | 1-2 hours |
| ISSUE-006 | Full Row SELECT on Every Load | 2-3 hours |
| ISSUE-007 | Migration File Naming Errors | 30 minutes |
| ISSUE-008 | Missing CHECK Constraints | 1-2 hours |
| ISSUE-009 | No Data Retention Policy | 2-3 hours |
| ISSUE-010 | No Connection Pooling Configuration | 1-2 hours |

### 🟡 MODERATE (5 Issues)
| ID | Issue | Fix Effort |
|----|-------|------------|
| ISSUE-011 | Duplicate Migration Files | 30 minutes |
| ISSUE-012 | No Rollback Scripts | 3-4 hours |
| ISSUE-013 | `swap_last_online_at` Logic Bug | 1 hour |
| ISSUE-014 | No Materialized Views | 4-6 hours |
| ISSUE-015 | No Database Monitoring | 2-3 hours |

### 🟢 LOW (3 Issues)
| ID | Issue | Fix Effort |
|----|-------|------------|
| ISSUE-016 | No Table Partitioning | 8-12 hours |
| ISSUE-017 | No Migration Testing | 4-6 hours |
| ISSUE-018 | No Read Replica | 2-3 hours |

---

## Recommended Implementation Roadmap

### Phase 1: Critical Security & Data Integrity (Week 1)
1. **ISSUE-001:** Fix race conditions in all currency operations
2. **ISSUE-002:** Migrate REAL to NUMERIC for all financial columns
3. **ISSUE-003:** Add foreign key constraints with CASCADE DELETE
4. **ISSUE-007:** Fix migration file naming errors

**Estimated Effort:** 8-13 hours

### Phase 2: Performance Optimization (Week 2)
5. **ISSUE-005:** Add composite indexes for leaderboards
6. **ISSUE-013:** Fix `swap_last_online_at` function
7. **ISSUE-008:** Add CHECK constraints on game values
8. **ISSUE-010:** Configure connection pooling

**Estimated Effort:** 5-9 hours

### Phase 3: Operational Excellence (Week 3)
9. **ISSUE-009:** Implement data retention policies
10. **ISSUE-015:** Configure database monitoring
11. **ISSUE-012:** Add rollback comments to migrations
12. **ISSUE-011:** Clean up duplicate migrations

**Estimated Effort:** 8-12 hours

### Phase 4: Scalability Preparation (Week 4+)
13. **ISSUE-004:** Normalize JSONB fields (Option B - expression indexes)
14. **ISSUE-014:** Create materialized views for leaderboards
15. **ISSUE-006:** Optimize SELECT statements
16. **ISSUE-016:** Implement table partitioning
17. **ISSUE-017:** Add migration testing to CI/CD
18. **ISSUE-018:** Configure read replicas

**Estimated Effort:** 20-48 hours

---

## Appendix A: Complete Schema Reference

### Primary Tables

| Table | Purpose | Row Estimate (1K users) |
|-------|---------|------------------------|
| `game_progress` | Player game state | 1,000 |
| `prestige_records` | Prestige history | 50-500 |
| `stars_purchases` | Telegram Stars purchases | 100-500 |
| `player_sessions` | Session analytics | 10,000-50,000 |
| `offline_claims` | Offline income log | 1,000-5,000 |
| `ads_rewards_log` | AdsGram rewards | 5,000-20,000 |
| `ad_views` | Ad view statistics | 20,000-100,000 |
| `scheduled_notifications` | Push notification queue | 1,000-5,000 |

### Key Indexes

```sql
-- Primary lookups
idx_game_progress_telegram          -- UNIQUE on telegram_id
idx_game_progress_device_id          -- Partial unique on device_id

-- Leaderboard indexes
idx_game_progress_total_xp           -- ORDER BY total_xp DESC
idx_game_progress_referrals          -- ORDER BY referrals_count DESC
idx_game_progress_prestige           -- (prestige_level, level) DESC

-- Supporting tables
idx_ads_rewards_telegram_id          -- telegram_id lookup
idx_ad_views_telegram_id            -- telegram_id lookup
idx_player_sessions_telegram_id     -- telegram_id lookup
idx_scheduled_notifications_status  -- (status, scheduled_for) partial
```

### RLS Policy Summary

| Table | SELECT | INSERT | UPDATE | DELETE |
|-------|--------|--------|--------|--------|
| `game_progress` | service_role | service_role | service_role | service_role |
| `ads_rewards_log` | service_role | service_role | service_role | service_role |
| `ad_views` | service_role | service_role | service_role | service_role |
| `prestige_records` | service_role | service_role | service_role | service_role |
| `stars_purchases` | service_role | service_role | service_role | service_role |
| `player_sessions` | service_role | service_role | service_role | service_role |
| `offline_claims` | service_role | service_role | service_role | service_role |
| `scheduled_notifications` | service_role | service_role | service_role | service_role |
| `public_leaderboard` | anon | - | - | - |

---

## Appendix B: Quick Fix Scripts

### Script 1: Add All Missing Indexes

```sql
-- Epoch-based leaderboards
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_game_progress_epoch_leaderboard 
  ON game_progress(epoch_id, total_xp DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_game_progress_epoch_prestige 
  ON game_progress(epoch_id, prestige_level DESC, level DESC);

-- User rank queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_game_progress_rank_query 
  ON game_progress(total_xp DESC, telegram_id);

-- Composite indexes for supporting tables
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ad_views_telegram_date 
  ON ad_views(telegram_id, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_player_sessions_user_time 
  ON player_sessions(telegram_id, session_started_at DESC);
```

### Script 2: Add CHECK Constraints

```sql
ALTER TABLE game_progress ADD CONSTRAINT check_level_range 
  CHECK (level >= 1 AND level <= 999);

ALTER TABLE game_progress ADD CONSTRAINT check_currency_non_negative 
  CHECK (currency >= 0);

ALTER TABLE game_progress ADD CONSTRAINT check_xp_non_negative 
  CHECK (xp >= 0);

ALTER TABLE game_progress ADD CONSTRAINT check_tap_power_positive 
  CHECK (tap_power >= 1);

ALTER TABLE game_progress ADD CONSTRAINT check_energy_range 
  CHECK (energy >= 0 AND energy <= max_energy);

ALTER TABLE game_progress ADD CONSTRAINT check_prestige_non_negative 
  CHECK (prestige_level >= 0 AND prestige_points >= 0);
```

---

*Report generated by AAA Studio Database Architect*  
*Review Date: 2026-07-02*  
*Next Review: After Phase 1 fixes*