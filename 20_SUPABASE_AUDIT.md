# Supabase Infrastructure Audit Report

**Project:** Virtual Museum Tapper Game (Ukraine Tap)  
**Version:** 1.6.6  
**Date:** July 2, 2026  
**Auditor:** AAA Studio Architecture Review  

---

## Executive Summary

This audit provides a comprehensive review of the Supabase backend infrastructure for the Virtual Museum Tapper Game. The architecture demonstrates solid fundamentals with server-authoritative game logic, proper Telegram authentication via HMAC-SHA256, and race condition protection for critical operations. However, several critical security vulnerabilities, performance concerns, and cost optimization opportunities were identified.

**Overall Assessment: 6.5/10**  
*Requires immediate security fixes before production launch.*

---

## 1. Edge Functions Architecture

### 1.1 Current Implementation

| Function | Purpose | Server-Authoritative | Status |
|----------|---------|---------------------|--------|
| `game-action` | Tap upgrades, epoch switching, generator purchases | ✅ Yes | ⚠️ Needs work |
| `perform-prestige` | Prestige/rebirth system | ✅ Yes | ✅ Good |
| `claim-offline-income` | Offline progress calculation | ✅ Yes | ✅ Good |
| `open-chest` | Chest/skychest RNG rewards | ✅ Yes | ✅ Good |
| `claim-ad-reward` | Ad reward tracking & limits | ✅ Yes | ✅ Good |
| `adsgram-reward` | Third-party ad integration | ✅ Yes | ✅ Good |
| `validate-init-data` | Telegram initData validation | ✅ Yes | ✅ Good |
| `push-notification` | Telegram push notifications | ✅ Yes | ✅ Good |
| `telegram-payments` | Telegram Stars payments | ✅ Yes | ✅ Good |
| `track-session` | Session analytics | ⚠️ Partial | ⚠️ Needs work |

### 1.2 Strengths

1. **Server-Authoritative Design:** Core game mechanics (prestige, offline income, chest opening, ad rewards) are handled server-side, preventing client manipulation.

2. **HMAC-SHA256 Validation:** All critical functions validate Telegram initData, ensuring user identity verification.

3. **Race Condition Protection:** The `swap_last_online_at` RPC with `FOR UPDATE` lock prevents double-claim exploits on offline income.

4. **Consistent CORS Headers:** All functions implement proper CORS handling.

5. **Idempotency for Payments:** Telegram payments include idempotency checks via `charge_id` to prevent duplicate reward grants.

### 1.3 Critical Issues

#### Issue 1.1: Weak RLS Policies on `game_progress` (CRITICAL)
**Severity:** 🔴 CRITICAL  
**File:** `20260614122943_007_fix_rls_and_level_cap.sql`

```sql
-- Current policy allows ANY user to read/write ANY data
CREATE POLICY "anon_read_progress" ON game_progress FOR SELECT
  TO anon, authenticated USING (true);
```

**Impact:** Any user can read and modify other users' game progress via direct Supabase API calls.

**Recommendation:**
```sql
-- Replace with telegram_id-based access control
CREATE POLICY "anon_read_progress" ON game_progress FOR SELECT
  TO anon, authenticated
  USING (telegram_id = (current_setting('request.jwt.claims', true)::jsonb->>'telegram_id')::bigint);
```

However, for Telegram Mini Apps using anonymous access, this is challenging. **The game should route ALL data operations through Edge Functions that validate initData**, not direct table access.

---

#### Issue 1.2: CORS Allows All Origins
**Severity:** 🟡 MEDIUM  
**Files:** All Edge Functions

```typescript
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",  // Should be restricted
  ...
};
```

**Recommendation:** Restrict to Telegram domains:
```typescript
const ALLOWED_ORIGINS = ['https://t.me', 'https://*.telegram.org'];
```

---

#### Issue 1.3: `buy_generator` Action Not Implemented
**Severity:** 🟡 MEDIUM  
**File:** `game-action/index.ts`

The `buy_generator` action returns an error:
```typescript
return { ok: false, error: "buy_generator: cost validation requires server-side generator definitions" };
```

If the frontend bypasses Edge Functions and calls the database directly, generator purchases could be exploited.

---

#### Issue 1.4: No Rate Limiting on Edge Functions
**Severity:** 🟠 HIGH  
**Files:** All Edge Functions

No protection against:
- Rapid-fire tapping (multiple requests per second)
- Offline income farming via bot attacks
- Payment callback spam

**Recommendation:** Implement rate limiting using Supabase's built-in rate limiting or external service (e.g., Upstash Redis).

---

### 1.4 Edge Functions Recommendations

1. **Centralize All Database Access:** Route ALL `game_progress` writes through Edge Functions, not direct Supabase client access.

2. **Add Request Logging:** Implement structured logging for all Edge Function invocations.

3. **Add Authentication Headers:** Consider adding `X-Request-ID` for tracing.

4. **Environment Variable Validation:** Add startup checks for required environment variables.

---

## 2. Database Functions and RPCs

### 2.1 Current RPCs

| RPC | Purpose | Security | Issues |
|-----|---------|----------|--------|
| `update_game_progress` | Bulk upsert player data | ⚠️ SECURITY DEFINER | No telegram_id validation |
| `swap_last_online_at` | Atomic offline time swap | ✅ SECURITY DEFINER | Race condition protected |
| `increment_currency` | Used in referral bonus | ❓ Unknown | Not found in migrations |
| `increment_referrals` | Increment referral count | ❓ Unknown | Not found in migrations |
| `increment_earnings` | Add referral earnings | ❓ Unknown | Not found in migrations |

### 2.2 Critical Issue: Missing RPC Definitions

The code references RPCs that don't exist in migrations:
- `increment_currency`
- `increment_referrals`
- `increment_earnings`

**Current usage in `storage.ts`:**
```typescript
currency: supabase.rpc('increment_currency', { amount: REFERRER_BONUS }),
```

This will fail silently since the RPC doesn't exist.

---

### 2.3 RPC Security Analysis

#### `swap_last_online_at` (GOOD)
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
  SELECT last_online_at FROM locked;
$$ LANGUAGE sql SECURITY DEFINER;
```

**Strengths:**
- Uses `FOR UPDATE` lock to prevent race conditions
- `SECURITY DEFINER` executes with elevated privileges
- Atomic CTE ensures consistency

---

#### `update_game_progress` (WEAK)
```sql
CREATE OR REPLACE FUNCTION update_game_progress(
  p_telegram_id bigint,
  ...
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO game_progress (...) VALUES (...)
  ON CONFLICT (telegram_id) DO UPDATE SET ...;
END;
$$;
```

**Issues:**
- No validation that caller owns the telegram_id
- Anyone can update any user's data
- The comment suggests relying on "app logic" which is insufficient

---

### 2.4 Database Function Recommendations

1. **Create Missing RPCs:**
```sql
CREATE OR REPLACE FUNCTION increment_currency(p_telegram_id bigint, p_amount real)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE game_progress 
  SET currency = currency + p_amount,
      total_currency_earned = total_currency_earned + p_amount
  WHERE telegram_id = p_telegram_id;
END;
$$;
```

2. **Add Transaction Logging:** Track all balance changes for audit purposes.

3. **Add Input Validation:** Validate all parameters (e.g., amount > 0, telegram_id > 0).

---

## 3. Row Level Security Policies

### 3.1 Current RLS Configuration

| Table | RLS Enabled | SELECT | INSERT | UPDATE | DELETE |
|-------|-------------|--------|--------|--------|--------|
| `game_progress` | ✅ Yes | ⚠️ `USING(true)` | ⚠️ `WITH CHECK(true)` | ⚠️ `USING(true)` | ⚠️ `USING(true)` |
| `player_sessions` | ✅ Yes | ✅ `USING(true)` | ✅ service_role only | ❌ No policy | ❌ No policy |
| `ads_rewards_log` | ✅ Yes | ✅ service_role only | ✅ service_role only | ❌ No policy | ❌ No policy |
| `ad_views` | ✅ Yes | ❌ No policy | ✅ service_role only | ❌ No policy | ❌ No policy |
| `prestige_records` | ✅ Yes | ❌ No policy | ✅ service_role only | ❌ No policy | ❌ No policy |
| `offline_claims` | ✅ Yes | ❌ No policy | ✅ service_role only | ❌ No policy | ❌ No policy |
| `scheduled_notifications` | ✅ Yes | ⚠️ JWT claim | ❌ No policy | ❌ No policy | ✅ User |

### 3.2 Critical RLS Vulnerabilities

#### Vulnerability 3.1: Game Progress Fully Open (CRITICAL)
```sql
CREATE POLICY "anon_read_progress" ON game_progress FOR SELECT
  TO anon, authenticated USING (true);
```

**Attack Scenario:**
```bash
# Attacker can read ANY player's data
curl -X GET "https://xxx.supabase.co/rest/v1/game_progress?select=*" \
  -H "apikey: ANON_KEY" \
  -H "Authorization: Bearer ANON_KEY"
```

**Impact:** Full player data leak including:
- Currency balances
- XP and levels
- Artifact collections
- Prestige progress
- Purchase history

#### Vulnerability 3.2: Game Progress Fully Writable (CRITICAL)
```sql
CREATE POLICY "anon_update_progress" ON game_progress FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
```

**Attack Scenario:**
```bash
# Attacker can modify ANY player's currency to max value
curl -X PATCH "https://xxx.supabase.co/rest/v1/game_progress" \
  -H "apikey: ANON_KEY" \
  -H "Authorization: Bearer ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"currency": 999999999}'
```

---

### 3.3 RLS Recommendations

#### Immediate Fix (Migration 020):
```sql
-- Drop all permissive policies
DROP POLICY IF EXISTS "anon_read_progress" ON game_progress;
DROP POLICY IF EXISTS "anon_insert_progress" ON game_progress;
DROP POLICY IF EXISTS "anon_update_progress" ON game_progress;
DROP POLICY IF EXISTS "anon_delete_progress" ON game_progress;
DROP POLICY IF EXISTS "update_own_progress" ON game_progress;
DROP POLICY IF EXISTS "select_own_progress" ON game_progress;
DROP POLICY IF EXISTS "insert_own_progress" ON game_progress;

-- Create secure policies for authenticated access
-- Note: For Telegram Mini Apps, we rely on Edge Function validation

-- Allow reads for authenticated users (leaderboard)
CREATE POLICY "leaderboard_read" ON game_progress FOR SELECT
  TO authenticated
  USING (true);

-- Allow reads for anon (for leaderboard display)
CREATE POLICY "leaderboard_read_anon" ON game_progress FOR SELECT
  TO anon
  USING (true);

-- Only Edge Functions with service_role can write
CREATE POLICY "service_write_game_progress" ON game_progress
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Deny all direct anon updates (must go through Edge Functions)
CREATE POLICY "deny_anon_write" ON game_progress
  FOR INSERT TO anon WITH CHECK (false);
```

#### Long-term Architecture Change:
1. **Remove direct Supabase client from frontend** for game progress operations
2. **Route ALL game state changes through Edge Functions**
3. **Use server-to-server calls** with service role key from Edge Functions only

---

## 4. Storage Usage

### 4.1 Current Storage Configuration

| Bucket | Purpose | Public | Files |
|--------|---------|--------|-------|
| (None configured) | N/A | N/A | N/A |

### 4.2 Storage Analysis

**Current State:** No Supabase Storage used.

**Potential Uses for This Game:**
- Avatar images (currently using Telegram CDN)
- Leaderboard backgrounds
- Achievement badges
- Audio files for effects

### 4.3 Storage Recommendations

1. **Consider Adding Storage for:**
   - User-uploaded content moderation
   - Game assets that need CDN delivery
   - Analytics data exports

2. **Security Configuration (if implemented):**
```sql
-- Create bucket with restricted access
INSERT INTO storage.buckets (id, name, public) 
VALUES ('game-assets', 'game-assets', false);

-- Policy: Only service role can upload
CREATE POLICY "Service role upload" ON storage.objects
  FOR INSERT TO service_role WITH CHECK (true);

-- Policy: Public read for approved assets
CREATE POLICY "Public read approved" ON storage.objects
  FOR SELECT TO public USING (bucket_id = 'game-assets');
```

---

## 5. Realtime Subscriptions

### 5.1 Current Realtime Configuration

**Status:** ⚠️ NOT IMPLEMENTED

The codebase shows no Supabase Realtime subscriptions:
- No `supabase.channel()` usage
- No `on('INSERT/UPDATE/DELETE')` handlers
- No Realtime configuration in client

### 5.2 Realtime Opportunities

**Recommended Realtime Features:**

1. **Leaderboard Updates:**
```typescript
// Subscribe to leaderboard changes
const channel = supabase
  .channel('leaderboard')
  .on('postgres_changes', { 
    event: '*', 
    schema: 'public', 
    table: 'game_progress',
    filter: 'total_xp=gt.1000'
  }, (payload) => {
    updateLeaderboard(payload.new);
  })
  .subscribe();
```

2. **Cross-Device Sync:**
```typescript
// Sync game state across user's devices
const channel = supabase
  .channel(`user-${telegramId}`)
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'game_progress',
    filter: `telegram_id=eq.${telegramId}`
  }, (payload) => {
    syncGameState(payload.new);
  })
  .subscribe();
```

3. **Social Features:**
- Friend activity notifications
- Guild/Alliance updates (future)
- Global event notifications

### 5.3 Realtime Security Considerations

```typescript
// Use RLS to filter Realtime subscriptions
supabase.channel('user-progress')
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'game_progress',
    filter: `telegram_id=eq.${telegramId}`
  }, handleUpdate)
  .subscribe();
```

---

## 6. Performance Optimization

### 6.1 Current Index Configuration

| Table | Index | Type | Purpose |
|-------|-------|------|---------|
| `game_progress` | `idx_game_progress_telegram` | B-tree | Primary lookup |
| `game_progress` | `idx_game_progress_referrer` | B-tree | Referral queries |
| `game_progress` | `idx_game_progress_total_xp` | B-tree | Leaderboard sorting |
| `game_progress` | `idx_game_progress_referrals` | B-tree | Referral leaderboard |
| `game_progress` | `idx_game_progress_prestige` | Composite | Prestige leaderboard |
| `ads_rewards_log` | `idx_ads_rewards_telegram_id` | B-tree | Ad reward lookups |
| `ads_rewards_log` | `idx_ads_rewards_created_at` | B-tree | Analytics |
| `ad_views` | `idx_ad_views_telegram_id` | B-tree | Analytics |
| `ad_views` | `idx_ad_views_created_at` | B-tree | Time-based queries |
| `player_sessions` | `idx_player_sessions_telegram_id` | B-tree | Session lookups |
| `player_sessions` | `idx_player_sessions_last_activity` | B-tree | Active session queries |
| `prestige_records` | `idx_prestige_records_telegram_id` | B-tree | Player history |
| `offline_claims` | `idx_offline_claims_telegram_claimed` | Composite | Unique constraint |
| `scheduled_notifications` | `idx_scheduled_notifications_telegram` | B-tree | User notifications |
| `scheduled_notifications` | `idx_scheduled_notifications_status_scheduled` | Partial | Pending notifications |

### 6.2 Missing Indexes

| Table | Recommended Index | Purpose |
|-------|------------------|---------|
| `game_progress` | `idx_game_progress_last_online` | Find inactive users |
| `game_progress` | `idx_game_progress_creator` | Partial index for data export |
| `ads_rewards_log` | `idx_ads_rewards_ad_id` | Duplicate prevention |
| `prestige_records` | `idx_prestige_records_created_at` | Time-based analytics |

### 6.3 Query Performance Issues

#### Issue 6.1: Full Table Scan in Leaderboard
**File:** `storage.ts:416-422`

```typescript
// Current: Fetches 1000 rows to find user rank
const { data } = await supabase
  .from('game_progress')
  .select('telegram_id, prestige_level, level, total_xp')
  .order('prestige_level', { ascending: false })
  .order('level', { ascending: false })
  .order('total_xp', { ascending: false })
  .limit(1000);

// Then: Client-side findIndex
const index = data.findIndex(row => row.telegram_id === telegramId);
```

**Recommendation:** Use window functions:
```sql
CREATE OR REPLACE FUNCTION get_user_rank(p_telegram_id bigint)
RETURNS integer LANGUAGE sql STABLE AS $$
  WITH ranked AS (
    SELECT telegram_id, 
           ROW_NUMBER() OVER (ORDER BY prestige_level DESC, level DESC, total_xp DESC) as rank
    FROM game_progress
  )
  SELECT rank FROM ranked WHERE telegram_id = p_telegram_id;
$$;
```

---

#### Issue 6.2: Multiple Sequential Queries in Edge Functions
**Pattern Found:**
```typescript
// Query 1: Fetch current state
const { data: player } = await supabase
  .from("game_progress")
  .select("...").eq("telegram_id", telegram_id).maybeSingle();

// Query 2: Update state
await supabase.from("game_progress")
  .update({...}).eq("telegram_id", telegram_id);
```

**Recommendation:** Use single UPDATE with RETURNING:
```typescript
const { data: updated } = await supabase
  .from("game_progress")
  .update({ currency: newCurrency })
  .eq("telegram_id", telegramId)
  .select()
  .single();
```

---

### 6.4 Performance Recommendations

1. **Add Composite Indexes:**
```sql
-- For leaderboard queries
CREATE INDEX idx_game_progress_leaderboard 
  ON game_progress (prestige_level DESC, level DESC, total_xp DESC);

-- For user lookup by multiple identifiers
CREATE INDEX idx_game_progress_identifiers 
  ON game_progress (telegram_id, device_id);
```

2. **Optimize Leaderboard Query:**
```typescript
// Use database-level ranking instead of client-side
export async function getUserRank(telegramId: number): Promise<number | null> {
  const { data, error } = await supabase.rpc('get_user_rank', { p_telegram_id: telegramId });
  return error ? null : data;
}
```

3. **Add Connection Pooling Hints:** Use prepared statements for frequent queries.

4. **Consider Read Replicas:** For leaderboard-heavy read operations.

---

## 7. Caching Strategy

### 7.1 Current Caching Implementation

**Status:** ❌ NO CACHING LAYER

### 7.2 Identified Caching Opportunities

| Data | Current Behavior | Cache Recommendation | TTL |
|------|-----------------|---------------------|-----|
| Leaderboard | Full table scan | Redis/CDN | 60 seconds |
| User Rank | Full table scan | Redis | 60 seconds |
| Epoch Definitions | Hardcoded in client | Edge Function cache | Permanent |
| Artifact Definitions | Hardcoded in Edge Function | Edge Function cache | Permanent |
| User Session | Database read | In-memory | Session |

### 7.3 Caching Recommendations

#### Tier 1: Edge Function Response Caching
```typescript
// In edge functions
const CACHE-Control = 'public, max-age=60, stale-while-revalidate=30';

return new Response(JSON.stringify(data), {
  headers: { 
    ...corsHeaders, 
    'Content-Type': 'application/json',
    'Cache-Control': CACHE-Control
  },
});
```

#### Tier 2: Database Query Caching
```sql
-- Use materialized views for leaderboard
CREATE MATERIALIZED VIEW leaderboard_top_100 AS
SELECT telegram_id, first_name, username, level, total_xp, prestige_level
FROM game_progress
ORDER BY prestige_level DESC, level DESC, total_xp DESC
LIMIT 100
WITH DATA;

CREATE UNIQUE INDEX ON leaderboard_top_100 (telegram_id);

-- Refresh every minute
CREATE OR REPLACE FUNCTION refresh_leaderboard()
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY leaderboard_top_100;
END;
$$;
```

#### Tier 3: Redis Cache (Supabase Edge Functions)
```typescript
// Using Upstash Redis or similar
const cache = await kv.get(`leaderboard:${page}`);
if (cache) {
  return JSON.parse(cache);
}

const data = await fetchLeaderboard(page);
await kv.setex(`leaderboard:${page}`, 60, JSON.stringify(data));
return data;
```

---

## 8. Connection Pooling

### 8.1 Current Configuration

**Status:** ⚠️ DEFAULT CONFIGURATION

The project uses default Supabase connection pooling settings.

### 8.2 Connection Pooling Analysis

**Edge Functions:**
- Each Edge Function creates its own Supabase client
- Connection established per request
- No connection reuse within function

**Frontend Client:**
- Browser-based connections (WebSocket)
- No persistent connections (typical SPA pattern)

### 8.3 Connection Pooling Recommendations

1. **For Edge Functions:**
```typescript
// Reuse client instance
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
  db: {
    schema: 'public',
  },
});
```

2. **For High-Traffic Operations:**
```sql
-- Configure pool mode in Supabase dashboard:
-- Transaction mode (recommended for Edge Functions)
-- Pool size: 10-20 connections
```

3. **Monitor Connection Usage:**
```sql
-- View active connections
SELECT * FROM pg_stat_activity WHERE datname = 'postgres';
```

---

## 9. API Rate Limiting

### 9.1 Current Rate Limiting

**Status:** ❌ NOT IMPLEMENTED

No rate limiting on:
- Edge Functions
- Direct table access
- Authentication attempts

### 9.2 Rate Limiting Requirements

| Endpoint | Recommended Limit | Window |
|----------|------------------|--------|
| `game-action` (tap) | 10 req/sec | Per user |
| `game-action` (upgrade) | 1 req/sec | Per user |
| `claim-offline-income` | 1 req/min | Per user |
| `open-chest` | 1 req/sec | Per user |
| `claim-ad-reward` | 1 req/min | Per user |
| Leaderboard reads | 10 req/min | Per user |
| Direct table reads | 60 req/min | Per IP |

### 9.3 Rate Limiting Implementation

#### Option 1: Supabase Built-in (Pro Tier)
```json
{
  "rate_limiting": {
    "enabled": true,
    "limit": 100,
    "window": 60
  }
}
```

#### Option 2: Edge Function Implementation
```typescript
// Simple in-memory rate limiter (for single instance)
const rateLimits = new Map<string, { count: number; reset: number }>();

function checkRateLimit(userId: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const key = `rate:${userId}`;
  const current = rateLimits.get(key);
  
  if (!current || now > current.reset) {
    rateLimits.set(key, { count: 1, reset: now + windowMs });
    return true;
  }
  
  if (current.count >= limit) {
    return false;
  }
  
  current.count++;
  return true;
}

// Usage in Edge Function
if (!checkRateLimit(telegramId.toString(), 10, 1000)) {
  return jsonResponse({ error: 'Rate limit exceeded' }, 429);
}
```

#### Option 3: Upstash Redis (Recommended for Scale)
```typescript
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: Deno.env.get("UPSTASH_REDIS_REST_URL")!,
  token: Deno.env.get("UPSTASH_REDIS_REST_TOKEN")!,
});

async function rateLimit(userId: string, limit: number, window: number) {
  const key = `ratelimit:${userId}`;
  const current = await redis.get<number>(key);
  
  if (current && current >= limit) {
    return false;
  }
  
  await redis.incr(key);
  if (!current) {
    await redis.expire(key, window);
  }
  
  return true;
}
```

### 9.4 Anti-Abuse Measures

1. **Telegram initData Validation:** Already implemented ✅
2. **Request Signing:** Consider adding timestamp signatures
3. **Bot Detection:** Implement honeypot fields
4. **Anomaly Detection:** Flag unusual patterns (e.g., impossible tap speeds)

---

## 10. Cost Optimization

### 10.1 Cost Analysis

**Estimated Monthly Costs (based on typical Supabase pricing):**

| Component | Free Tier | Usage | Estimated Cost |
|-----------|-----------|-------|----------------|
| Edge Functions | 500K invocations | ~2M/month | ~$10-50 |
| Database Storage | 500 MB | ~100 MB | $0 |
| Database Bandwidth | 2 GB | ~500 MB | $0 |
| Realtime | 100 concurrent | ~1000 avg | $0 |
| Auth | 50K MAU | ~100K MAU | ~$50 |
| Storage | 1 GB | 0 GB | $0 |
| **Total** | - | - | **~$60-100/month** |

### 10.2 Cost Optimization Strategies

#### Strategy 1: Reduce Edge Function Invocations
**Current:** Client calls `saveRemoteState` frequently (on every state change)

**Optimization:** Batch updates
```typescript
// Debounce saves
let saveTimeout: number | null = null;
function debouncedSave(state: GameState) {
  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => saveRemoteState(state), 5000);
}
```

**Savings:** ~80% reduction in save operations

---

#### Strategy 2: Optimize Database Queries
**Current:** Multiple queries per action

**Optimization:** Combine queries
```typescript
// Before: 2 queries
const { data: player } = await supabase.from("game_progress").select("*").eq("telegram_id", id);
await supabase.from("game_progress").update({...}).eq("telegram_id", id);

// After: 1 query with RETURNING
const { data } = await supabase
  .from("game_progress")
  .update({...})
  .eq("telegram_id", id)
  .select()
  .single();
```

**Savings:** 50% reduction in DB calls

---

#### Strategy 3: Use Prepared Statements
```typescript
// Create prepared statement for frequent queries
await supabase.rpc('create_or_increment_counter', { ... });
```

---

#### Strategy 4: Implement Caching
- Cache leaderboard results (60-second TTL)
- Cache epoch/artifact definitions (permanent, no DB hits)

**Savings:** ~90% reduction in leaderboard DB queries

---

### 10.3 Cost Optimization Recommendations

1. **Implement Client-Side Debouncing:** Reduce save frequency
2. **Add Response Caching:** Cache frequently accessed data
3. **Use Database Views:** Pre-compute leaderboard rankings
4. **Monitor Usage:** Set up billing alerts
5. **Consider Edge Caching:** CloudFlare KV for leaderboard

---

## 11. Backup and Recovery

### 11.1 Current Backup Configuration

**Supabase Default:**
- Daily automated backups
- Point-in-time recovery (PITR) for Pro tier
- 7-day retention on free tier

### 11.2 Backup Gaps

1. **No Custom Backup Schedule:** Relying on Supabase defaults
2. **No Cross-Region Backups:** Single region dependency
3. **No Game State Snapshots:** Player progress not independently backed up
4. **No Offline Claims/Ad Views Cleanup:** Tables grow indefinitely

### 11.3 Backup and Recovery Recommendations

#### Backup Strategy

1. **Weekly Exports:**
```sql
-- Export critical data to JSON
COPY (
  SELECT json_agg(game_progress.*) 
  FROM game_progress
) TO '/tmp/backup_game_progress.json';
```

2. **Daily Archive Tables:**
```sql
-- Create archive for old sessions
CREATE TABLE player_sessions_archive AS
SELECT * FROM player_sessions
WHERE session_started_at < NOW() - INTERVAL '30 days';

-- Delete from main table
DELETE FROM player_sessions
WHERE session_started_at < NOW() - INTERVAL '30 days';

-- Create archive for old ad views
CREATE TABLE ad_views_archive AS
SELECT * FROM ad_views
WHERE created_at < NOW() - INTERVAL '30 days';

DELETE FROM ad_views
WHERE created_at < NOW() - INTERVAL '30 days';
```

3. **Scheduled Edge Function:**
```typescript
// Weekly backup function
Deno.serve(async (req) => {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  
  // Archive old data
  await archiveOldData(supabase);
  
  // Export critical data
  await exportToStorage(supabase);
  
  return jsonResponse({ success: true });
});
```

#### Recovery Procedures

1. **Point-in-Time Recovery:** Use Supabase PITR for accidental data deletion
2. **Cross-Reference Validation:** Verify data consistency after recovery
3. **Disaster Recovery Plan:** Document RTO (< 1 hour) and RPO (< 24 hours)

---

## 12. Security Recommendations Summary

### 12.1 Critical Priority

| Issue | Impact | Fix Effort |
|-------|--------|------------|
| RLS allows any user to read/write any data | Full account takeover | Medium |
| No rate limiting on critical endpoints | DDoS, resource exhaustion | Low |
| Missing RPC definitions | Silent failures in referral system | Low |
| Direct database access from client | Game state manipulation | High (architectural) |

### 12.2 High Priority

| Issue | Impact | Fix Effort |
|-------|--------|------------|
| CORS allows all origins | XSS attacks possible | Low |
| No request signing | Replay attacks possible | Medium |
| No logging/audit trail | Security incidents undetected | Medium |
| No input sanitization | SQL injection (low risk with RLS) | Low |

### 12.3 Medium Priority

| Issue | Impact | Fix Effort |
|-------|--------|------------|
| No caching layer | Performance degradation | Medium |
| Leaderboard full table scan | Slow queries | Low |
| No connection pooling config | Connection exhaustion | Low |
| No backup verification | Data loss risk | Medium |

---

## 13. Migration Plan

### Phase 1: Emergency Fixes (Week 1)
1. [ ] Fix RLS policies to block direct anon writes
2. [ ] Add rate limiting to Edge Functions
3. [ ] Create missing RPCs
4. [ ] Add comprehensive logging

### Phase 2: Security Hardening (Week 2-3)
1. [ ] Remove direct Supabase access from frontend
2. [ ] Route all writes through Edge Functions
3. [ ] Add request signing
4. [ ] Implement proper authentication

### Phase 3: Performance (Week 3-4)
1. [ ] Add database indexes
2. [ ] Implement leaderboard caching
3. [ ] Optimize queries
4. [ ] Add connection pooling

### Phase 4: Operations (Week 4-5)
1. [ ] Set up monitoring/alerting
2. [ ] Configure backups
3. [ ] Document procedures
4. [ ] Load testing

---

## 14. Conclusion

The Supabase infrastructure for Virtual Museum Tapper Game demonstrates good architectural foundations with server-authoritative game logic and race condition protection. However, critical security vulnerabilities in RLS policies and lack of rate limiting pose significant production risks.

**Immediate Actions Required:**
1. Fix RLS to block unauthorized access
2. Implement rate limiting
3. Route all writes through Edge Functions
4. Add logging and monitoring

**Long-term Vision:**
- Fully server-authoritative architecture
- Multi-layer caching strategy
- Real-time leaderboard with minimal latency
- Comprehensive backup and recovery

---

## Appendix A: Files Reviewed

### Edge Functions
- `/supabase/functions/game-action/index.ts`
- `/supabase/functions/perform-prestige/index.ts`
- `/supabase/functions/claim-offline-income/index.ts`
- `/supabase/functions/open-chest/index.ts`
- `/supabase/functions/claim-ad-reward/index.ts`
- `/supabase/functions/adsgram-reward/index.ts`
- `/supabase/functions/validate-init-data/index.ts`
- `/supabase/functions/push-notification/index.ts`
- `/supabase/functions/telegram-payments/index.ts`
- `/supabase/functions/track-session/index.ts`

### Migrations
- `20260613144854_001_game_progress.sql`
- `20260613171158_001_game_progress_full.sql`
- `20260613150403_002_add_referrals.sql`
- `20260613172147_003_add_device_id.sql`
- `20260613195338_005_add_boosters.sql`
- `20260613204518_006_add_epoch_id.sql`
- `20260614122943_007_fix_rls_and_level_cap.sql`
- `20260615085433_008_daily_check_in.sql`
- `20260615091145_009_artifact_dupes.sql`
- `20260616225204_010_ads_rewards_log.sql.sql`
- `20260616233110_011_ad_views.sql.sql`
- `20260617100521_012_phase2_prestige_energy.sql.sql`
- `20260617125752_013_fix_energy_system.sql`
- `20260617131858_014_session_tracking_rls_fix.sql`
- `20260617133815_016_player_sessions_select_policy.sql`
- `20260617135150_017_swap_last_online_at_rpc.sql`
- `20260617135202_018_swap_last_online_at_lock_fix.sql`
- `20260701120000_019_notifications_system.sql`

### Client Code
- `/src/lib/supabase.ts`
- `/src/lib/rpc.ts`
- `/src/lib/storage.ts`

---

*End of Audit Report*
