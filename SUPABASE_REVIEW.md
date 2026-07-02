# Supabase Architecture Review
## Virtual Museum Tapper Game

**Project:** Virtual Museum Tapper Game (Ukraine Tap)  
**Version:** 1.6.6  
**Review Date:** July 2, 2026  
**Reviewer:** AAA Mobile Game Studio - Supabase Architect  
**Overall Score:** 7.2/10

---

## Executive Summary

The Supabase implementation demonstrates solid server-authoritative game logic with HMAC-SHA256 authentication, race condition protection, and Phase 2 RLS hardening. However, critical security gaps, performance concerns, and operational deficiencies require immediate attention before production launch.

**Key Strengths:**
- ✅ Server-authoritative design for all game-critical operations
- ✅ HMAC-SHA256 Telegram initData validation
- ✅ RLS policies fixed (migration 020) - service_role only access
- ✅ Race condition protection via atomic RPC operations
- ✅ Comprehensive audit logging for payments

**Critical Gaps:**
- 🔴 CORS allows all origins (security risk)
- 🔴 No rate limiting on edge functions
- 🔴 Telegram webhook endpoint lacks HMAC verification
- 🟠 swap_last_online_at RPC has incorrect implementation
- 🟠 Leaderboard queries perform full table scans
- 🟠 No real-time subscriptions configured
- 🟡 Hardcoded secrets in edge functions
- 🟡 Missing database indexes on critical columns
- 🟡 No monitoring/alerting infrastructure

---

## Review Scope

| Category | Files Reviewed | Status |
|----------|----------------|--------|
| Edge Functions | 14 functions | ✅ Complete |
| Database Migrations | 20 migrations | ⚠️ Issues found |
| Client Code | supabase.ts, rpc.ts, storage.ts | ✅ Complete |
| RLS Policies | migration 020 | ✅ Fixed |
| Authentication | HMAC validation | ⚠️ Inconsistent |
| Storage | Not configured | ❌ Missing |

---

## 1. Edge Functions Implementation

### 1.1 Summary Table

| Function | HMAC | Rate Limit | Error Handling | Status |
|----------|------|------------|----------------|--------|
| `game-action` | ✅ Required | ❌ None | ✅ Good | ⚠️ Partial |
| `save-game-state` | ✅ Required | ❌ None | ✅ Good | ✅ Good |
| `load-game-state` | ✅ Required | ❌ None | ✅ Good | ✅ Good |
| `claim-offline-income` | ✅ Required | ❌ None | ✅ Good | ✅ Good |
| `claim-ad-reward` | ✅ Required | ❌ None | ✅ Good | ✅ Good |
| `open-chest` | ✅ Required | ❌ None | ✅ Good | ✅ Good |
| `perform-prestige` | ✅ Required | ❌ None | ✅ Good | ✅ Good |
| `apply-referral-bonus` | ✅ Required | ❌ None | ✅ Good | ✅ Good |
| `get-leaderboard` | ⚠️ Optional | ❌ None | ✅ Good | ⚠️ Needs work |
| `get-user-rank` | ❌ None | ❌ None | ⚠️ Basic | ⚠️ Risk |
| `fetch-active-boosters` | ⚠️ Optional | ❌ None | ⚠️ Basic | ⚠️ Risk |
| `telegram-payments` | ⚠️ Partial | ❌ None | ⚠️ Basic | 🔴 Critical |
| `push-notification` | ✅ Required | ❌ None | ✅ Good | ✅ Good |
| `adsgram-reward` | ⚠️ GET uses secret | ❌ None | ✅ Good | ⚠️ Risk |
| `track-session` | ✅ Required | ❌ None | ✅ Good | ✅ Good |
| `validate-init-data` | ✅ N/A | ❌ None | ✅ Good | ✅ Good |

### 1.2 Critical Issues

#### ISSUE-S1: CORS Allows All Origins
**Severity:** 🔴 CRITICAL  
**Files:** ALL Edge Functions

```typescript
// Current (VULNERABLE)
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",  // Allows any website to call edge functions
  ...
};
```

**Why This Matters:** Any malicious website can make requests to your edge functions, potentially:
- Scraping leaderboard data
- Exploiting timing attacks
- Performing enumeration attacks

**Potential Impact:** 
- Data leakage of player information
- DDoS attacks from any origin
- Security audit failures

**Risk If Ignored:** High - production security audit will fail

**Recommended Solution:**
```typescript
const ALLOWED_ORIGINS = [
  'https://t.me',
  'https://*.telegram.org',
  'https://*.telegram-cdn.org',
];

function getCorsHeaders(origin: string | null) {
  if (!origin) return corsHeaders;
  const isAllowed = ALLOWED_ORIGINS.some(
    allowed => origin === allowed || 
               (allowed.includes('*') && origin.match(new RegExp(allowed.replace('*', '.*'))))
  );
  return {
    ...corsHeaders,
    "Access-Control-Allow-Origin": isAllowed ? origin : '',
  };
}
```

**Estimated Implementation Effort:** 2 hours  
**Responsible Agent:** Backend Developer

---

#### ISSUE-S2: No Rate Limiting on Edge Functions
**Severity:** 🔴 CRITICAL  
**Files:** ALL Edge Functions

**Why This Matters:** Without rate limiting, attackers can:
- Spam offline income claims
- Exhaust server resources
- Perform enumeration attacks
- Exploit referral systems

**Potential Impact:**
- Revenue loss from fake claims
- Server costs spike
- Database connection exhaustion

**Risk If Ignored:** Critical - production will be exploited

**Recommended Solution:**
```typescript
// Option 1: Use Supabase's built-in rate limiting
// Add to edge function headers:
'X-RateLimit-Limit': '100',
'X-RateLimit-Remaining': remaining.toString(),
'X-RateLimit-Reset': resetTime.toString(),

// Option 2: Implement in-memory rate limiter
const rateLimiter = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(identifier: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const record = rateLimiter.get(identifier);
  
  if (!record || now > record.resetTime) {
    rateLimiter.set(identifier, { count: 1, resetTime: now + windowMs });
    return true;
  }
  
  if (record.count >= limit) return false;
  record.count++;
  return true;
}
```

**Estimated Implementation Effort:** 4-6 hours  
**Responsible Agent:** Backend Developer + DevOps

---

#### ISSUE-S3: Inconsistent HMAC Validation
**Severity:** 🟠 HIGH  
**Files:** 
- `get-leaderboard/index.ts` (optional)
- `get-user-rank/index.ts` (none)
- `fetch-active-boosters/index.ts` (optional)
- `adsgram-reward/index.ts` (partial for GET)

**Why This Matters:** Functions without HMAC validation can be called by:
- Malicious scripts
- Automated tools
- Unauthorized applications

**Potential Impact:**
- Data enumeration
- Server resource exhaustion
- Potential information disclosure

**Recommended Solution:**
```typescript
// Make HMAC validation mandatory for all functions
async function handleRequest(req: Request) {
  const init_data = body.init_data;
  if (!init_data) {
    return jsonResponse({ error: "Missing init_data" }, 400);
  }

  const validation = validateRequest(init_data);
  if (!validation.valid) {
    return jsonResponse({ error: validation.error }, 401);
  }

  if (validation.userId !== telegram_id) {
    return jsonResponse({ error: "User ID mismatch" }, 403);
  }
  // ... rest of handler
}
```

**Estimated Implementation Effort:** 3 hours  
**Responsible Agent:** Backend Developer

---

#### ISSUE-S4: Telegram Payments Webhook Lacks HMAC Verification
**Severity:** 🔴 CRITICAL  
**Files:** `telegram-payments/index.ts`

**Why This Matters:** The webhook receives updates from Telegram but does NOT verify the authenticity of incoming messages. Anyone who discovers the webhook URL could send fake payment confirmations.

**Current Code (VULNERABLE):**
```typescript
// Step 2: Successful payment — NO VERIFICATION of message authenticity
if (body.message?.successful_payment) {
  const msg = body.message;
  const telegramId: number = msg.from?.id;  // Could be forged!
  // ... grants rewards without verifying message is from Telegram
}
```

**Potential Impact:**
- Unlimited free boosters
- Currency manipulation
- Complete game economy collapse

**Recommended Solution:**
```typescript
// Verify Telegram updates using their secret token
async function verifyTelegramUpdate(req: Request, body: unknown): Promise<boolean> {
  const secretToken = Deno.env.get("TELEGRAM_BOT_TOKEN");
  if (!secretToken) return false;
  
  // Telegram signs updates with a secret token
  // Implement verification according to Telegram docs
  const telegramSecret = createHash('sha256').update(secretToken).digest();
  const checkString = JSON.stringify(body);
  
  // For webhook verification, check the X-Telegram-Webhook-Secret header
  const secretHeader = req.headers.get('X-Telegram-Webhook-Secret');
  return secretHeader === secretToken;
}

// In the webhook handler:
if (body.pre_checkout_query || body.message?.successful_payment) {
  const isValid = await verifyTelegramUpdate(req, body);
  if (!isValid) {
    console.error("Invalid Telegram webhook signature");
    return new Response("Unauthorized", { status: 401 });
  }
}
```

**Estimated Implementation Effort:** 4 hours  
**Responsible Agent:** Backend Developer + Security

---

#### ISSUE-S5: Hardcoded Secrets in Edge Functions
**Severity:** 🟠 HIGH  
**Files:** 
- `adsgram-reward/index.ts` (ADSGRAM_SECRET)

**Current Code:**
```typescript
const ADSGRAM_SECRET = 'e73dc047768d42dba4d64432274c05c1';
```

**Why This Matters:**
- Secret exposed in source code
- Anyone with repo access can use AdsGram rewards
- Secret rotation impossible without code change

**Recommended Solution:**
```typescript
const ADSGRAM_SECRET = Deno.env.get("ADSGRAM_SECRET") ?? "";
```

**Estimated Implementation Effort:** 30 minutes  
**Responsible Agent:** Backend Developer

---

### 1.3 Edge Function Recommendations

1. **Centralize HMAC Validation:** Create a shared middleware for all edge functions
2. **Add Request Tracing:** Implement X-Request-ID headers for debugging
3. **Implement Health Checks:** Add `/_health` endpoints for monitoring
4. **Add Comprehensive Logging:** Log all security-relevant events
5. **Implement Graceful Shutdown:** Handle Deno.close() properly

---

## 2. Database Operations

### 2.1 Schema Overview

| Table | RLS Enabled | Indexes | Relationships | Status |
|-------|------------|---------|--------------|--------|
| `game_progress` | ✅ Yes | ✅ 4 indexes | - | ✅ Good |
| `player_sessions` | ✅ Yes | ⚠️ Missing | FK → game_progress | ⚠️ Needs work |
| `ads_rewards_log` | ✅ Yes | ⚠️ Missing | - | ⚠️ Needs work |
| `ad_views` | ✅ Yes | ⚠️ Missing | - | ⚠️ Needs work |
| `prestige_records` | ✅ Yes | ⚠️ Missing | FK → game_progress | ⚠️ Needs work |
| `offline_claims` | ✅ Yes | ⚠️ Missing | - | ⚠️ Needs work |
| `scheduled_notifications` | ✅ Yes | ✅ 2 indexes | FK → game_progress | ✅ Good |
| `stars_purchases` | ✅ Yes | ⚠️ Missing | - | ⚠️ Needs work |

### 2.2 Critical Issues

#### ISSUE-D1: swap_last_online_at RPC Has Incorrect Implementation
**Severity:** 🔴 CRITICAL  
**Files:** `20260617135150_017_swap_last_online_at_rpc.sql`

**Current Code (BROKEN):**
```sql
CREATE OR REPLACE FUNCTION swap_last_online_at(p_telegram_id bigint, p_new_time timestamptz)
RETURNS timestamptz AS $$
DECLARE
  old_time timestamptz;
BEGIN
  UPDATE game_progress
  SET last_online_at = p_new_time
  WHERE telegram_id = p_telegram_id
  RETURNING last_online_at INTO old_time;
  -- BUG: RETURNING gives NEW value, not old
  -- old_time is always NULL here!
  RETURN old_time;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Why This Matters:** The function ALWAYS returns NULL (or the new time), breaking the race condition protection mechanism. Concurrent requests will NOT be properly serialized.

**Potential Impact:**
- Race conditions in offline income claims
- Potential double-claim exploits
- Inconsistent game state

**Risk If Ignored:** Critical - allows exploitation

**Recommended Solution:**
```sql
CREATE OR REPLACE FUNCTION swap_last_online_at(p_telegram_id bigint, p_new_time timestamptz)
RETURNS timestamptz AS $$
DECLARE
  old_time timestamptz;
BEGIN
  -- Capture old value before update
  SELECT last_online_at INTO old_time
  FROM game_progress
  WHERE telegram_id = p_telegram_id;
  
  -- Update to new time
  UPDATE game_progress
  SET last_online_at = p_new_time
  WHERE telegram_id = p_telegram_id;
  
  RETURN old_time;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Estimated Implementation Effort:** 1 hour  
**Responsible Agent:** Database Engineer

---

#### ISSUE-D2: Missing Indexes on Foreign Keys
**Severity:** 🟠 HIGH  
**Files:** All migration files

**Why This Matters:** Without indexes, queries joining tables will perform full table scans.

**Missing Indexes:**
```sql
-- player_sessions needs index on telegram_id
CREATE INDEX idx_player_sessions_telegram ON player_sessions(telegram_id);

-- prestige_records needs index on telegram_id
CREATE INDEX idx_prestige_records_telegram ON prestige_records(telegram_id);

-- ads_rewards_log needs indexes
CREATE INDEX idx_ads_rewards_log_telegram ON ads_rewards_log(telegram_id);
CREATE INDEX idx_ads_rewards_log_ad_id ON ads_rewards_log(ad_id);

-- ad_views needs indexes
CREATE INDEX idx_ad_views_telegram ON ad_views(telegram_id);
CREATE INDEX idx_ad_views_created ON ad_views(created_at);

-- offline_claims needs index on telegram_id
CREATE INDEX idx_offline_claims_telegram ON offline_claims(telegram_id);

-- stars_purchases needs index on telegram_id
CREATE INDEX idx_stars_purchases_telegram ON stars_purchases(telegram_id);
```

**Estimated Implementation Effort:** 2 hours  
**Responsible Agent:** Database Engineer

---

#### ISSUE-D3: Leaderboard Query Performance
**Severity:** 🟠 HIGH  
**Files:** `get-leaderboard/index.ts`, `get-user-rank/index.ts`

**Current Implementation:**
```typescript
// Full table scan for every leaderboard request
const { data } = await supabaseAdmin
  .from('game_progress')
  .select('telegram_id, prestige_level, level, total_xp')
  .order('prestige_level', { ascending: false })
  .order('level', { ascending: false })
  .order('total_xp', { ascending: false })
  .limit(1000);
```

**Why This Matters:** 
- O(n log n) for every request
- No caching
- Will degrade with user growth

**Recommended Solution:**
```sql
-- Create materialized view with refresh
CREATE MATERIALIZED VIEW leaderboard_cache AS
SELECT 
  telegram_id,
  level,
  total_xp,
  prestige_level,
  ROW_NUMBER() OVER (ORDER BY prestige_level DESC, level DESC, total_xp DESC) as rank
FROM game_progress
WHERE username IS NOT NULL AND username != ''
WITH DATA;

-- Index for fast refresh
CREATE UNIQUE INDEX idx_leaderboard_cache_rank ON leaderboard_cache(rank);

-- Refresh every minute
-- Add to pg_cron or edge function
```

**Estimated Implementation Effort:** 4 hours  
**Responsible Agent:** Backend Developer + Database Engineer

---

### 2.3 Database Recommendations

1. **Add Partial Indexes:** For commonly filtered queries
2. **Implement Table Partitioning:** For time-series data (sessions, ad_views)
3. **Add Composite Indexes:** For multi-column ORDER BY queries
4. **Implement Connection Pooling:** Configure pool mode for edge functions

---

## 3. Real-time Subscriptions

### 3.1 Current Status

**Status:** ❌ NOT IMPLEMENTED

The game does NOT use Supabase Realtime for:
- Leaderboard updates
- Friend notifications
- Global events
- Multiplayer features

### 3.2 Recommendations

#### ISSUE-R1: No Real-time Infrastructure
**Severity:** 🟡 MEDIUM  
**Files:** None

**Why This Matters:** Future features requiring real-time updates will need significant refactoring.

**Recommended Solution:**
```typescript
// src/lib/realtime.ts
import { supabase } from './supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

let leaderboardChannel: RealtimeChannel | null = null;

export function subscribeToLeaderboard(
  callback: (leaderboard: LeaderboardEntry[]) => void
) {
  if (!supabase) return null;

  leaderboardChannel = supabase
    .channel('leaderboard-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'game_progress',
        filter: 'username=not.is.null'
      },
      (payload) => {
        // Debounce and refresh leaderboard
        debouncedRefresh(callback);
      }
    )
    .subscribe();

  return leaderboardChannel;
}
```

**Estimated Implementation Effort:** 8 hours  
**Responsible Agent:** Frontend Developer + Backend Developer

---

## 4. Authentication Setup

### 4.1 Current Implementation

| Component | Implementation | Status |
|-----------|----------------|--------|
| Telegram HMAC | Custom validation | ✅ Good |
| Supabase Auth | Not used | ⚠️ Design choice |
| JWT Claims | Not used | ⚠️ Compatible |
| Session Management | Edge functions | ✅ Good |

### 4.2 Analysis

The game uses **custom HMAC-based authentication** instead of Supabase Auth, which is appropriate for Telegram Mini Apps but introduces some limitations.

#### ISSUE-A1: No Fallback Authentication
**Severity:** 🟡 MEDIUM  
**Files:** `supabase.ts`, `validate-init-data.ts`

**Why This Matters:** Users without valid Telegram initData cannot access their game state.

**Recommended Solution:** Implement Supabase Auth as fallback:
```typescript
// Add anonymous auth for non-Telegram users
const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      }
    })
  : null;
```

**Estimated Implementation Effort:** 6 hours  
**Responsible Agent:** Full-stack Developer

---

## 5. Storage Configuration

### 5.1 Current Status

**Status:** ❌ NOT CONFIGURED

The game does NOT use Supabase Storage for:
- User avatars
- Asset caching
- Game assets
- Backup exports

### 5.2 Recommendations

#### ISSUE-ST1: Storage Not Configured
**Severity:** 🟢 LOW (Future consideration)  
**Files:** None

**Why This Matters:** Future features may require file storage.

**Recommended Solution:**
```sql
-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES 
  ('avatars', 'avatars', true),
  ('game-assets', 'game-assets', true),
  ('backups', 'backups', false);

-- Set up RLS policies
CREATE POLICY "Users can upload avatars" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars');
```

**Estimated Implementation Effort:** 4 hours  
**Responsible Agent:** Backend Developer

---

## 6. Supabase-Specific Optimizations

### 6.1 Connection Pooling

#### ISSUE-O1: No Connection Pooling Configuration
**Severity:** 🟡 MEDIUM  
**Files:** Edge functions, supabase.ts

**Why This Matters:** Edge functions may exhaust database connections under load.

**Recommended Solution:**
```typescript
// For Edge Functions - already optimized (Deno)
// For client - add connection pooling config
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  global: {
    headers: {
      'x-connection-release': 'after',
    },
  },
});
```

**Estimated Implementation Effort:** 1 hour  
**Responsible Agent:** Backend Developer

---

### 6.2 Edge Function Cold Starts

#### ISSUE-O2: No Cold Start Optimization
**Severity:** 🟢 LOW  
**Files:** All edge functions

**Recommended Solution:**
```typescript
// Create a shared client instance
let supabaseAdmin: ReturnType<typeof createClient> | null = null;

export function getSupabaseAdmin() {
  if (!supabaseAdmin) {
    supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  }
  return supabaseAdmin;
}
```

**Estimated Implementation Effort:** 2 hours  
**Responsible Agent:** Backend Developer

---

### 6.3 Query Optimization

#### ISSUE-O3: Multiple Sequential Queries
**Severity:** 🟡 MEDIUM  
**Files:** Multiple edge functions

**Current Pattern:**
```typescript
// 3 sequential queries
const { data: row } = await supabase.from("game_progress").select("*")...
// ... process ...
const { error } = await supabase.from("game_progress").update(...)...
```

**Recommended Solution:**
```typescript
// Use RPC for atomic operations
const { data } = await supabase.rpc('perform_upgrade_tap', {
  p_telegram_id: telegramId
});
```

**Estimated Implementation Effort:** 8 hours  
**Responsible Agent:** Backend Developer + Database Engineer

---

## 7. RLS Policies

### 7.1 Current Status

**Status:** ✅ FIXED (Migration 020)

The critical RLS vulnerabilities from earlier migrations have been addressed:
- ✅ `game_progress` - service_role only
- ✅ `ads_rewards_log` - service_role only
- ✅ `ad_views` - service_role only
- ✅ `prestige_records` - service_role only
- ✅ `player_sessions` - service_role only
- ✅ `offline_claims` - service_role only
- ✅ `scheduled_notifications` - service_role only

### 7.2 Recommendations

#### ISSUE-RLS1: Public Leaderboard View Exposes telegram_id
**Severity:** 🟡 MEDIUM  
**Files:** `20260702120000_020_fix_rls_policies.sql`

**Current Implementation:**
```sql
CREATE OR REPLACE VIEW public_leaderboard AS
SELECT 
    id,  -- This is internal ID, not telegram_id
    username,
    level,
    ...
```

**Status:** ✅ Acceptable - exposes level/rank but not telegram_id

---

#### ISSUE-RLS2: No RLS on prestige_records
**Severity:** 🟡 LOW  
**Files:** `prestige_records`

**Recommended Solution:**
```sql
ALTER TABLE prestige_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_prestige_records" ON prestige_records
    FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
```

**Estimated Implementation Effort:** 1 hour  
**Responsible Agent:** Database Engineer

---

## 8. Issue Summary by Severity

### 🔴 CRITICAL (Must Fix Before Launch)

| Issue ID | Title | Files | Effort |
|----------|-------|-------|--------|
| S1 | CORS Allows All Origins | All Edge Functions | 2h |
| S2 | No Rate Limiting | All Edge Functions | 4-6h |
| S4 | Telegram Webhook Lacks HMAC | telegram-payments | 4h |
| D1 | swap_last_online_at RPC Bug | Migration 017 | 1h |

### 🟠 HIGH (Fix Before Production)

| Issue ID | Title | Files | Effort |
|----------|-------|-------|--------|
| S3 | Inconsistent HMAC Validation | 4 functions | 3h |
| S5 | Hardcoded Secrets | adsgram-reward | 30m |
| D2 | Missing Database Indexes | All tables | 2h |
| D3 | Leaderboard Full Table Scan | get-leaderboard | 4h |

### 🟡 MEDIUM (Fix in Sprint)

| Issue ID | Title | Files | Effort |
|----------|-------|-------|--------|
| R1 | No Real-time Infrastructure | None | 8h |
| A1 | No Fallback Authentication | supabase.ts | 6h |
| O1 | No Connection Pooling Config | Edge functions | 1h |
| O3 | Multiple Sequential Queries | Multiple | 8h |

### 🟢 LOW (Technical Debt)

| Issue ID | Title | Files | Effort |
|----------|-------|-------|--------|
| ST1 | Storage Not Configured | None | 4h |
| O2 | Cold Start Optimization | All Edge Functions | 2h |
| RLS2 | Missing RLS on prestige_records | Migration | 1h |

---

## 9. Migration Plan

### Phase 1: Critical Fixes (Week 1)
1. [ ] Fix swap_last_online_at RPC (D1)
2. [ ] Restrict CORS origins (S1)
3. [ ] Add rate limiting (S2)
4. [ ] Add HMAC verification to Telegram webhook (S4)

### Phase 2: Security Hardening (Week 2)
1. [ ] Make HMAC mandatory for all functions (S3)
2. [ ] Move secrets to environment variables (S5)
3. [ ] Add missing database indexes (D2)
4. [ ] Optimize leaderboard queries (D3)

### Phase 3: Performance (Week 3-4)
1. [ ] Implement connection pooling (O1)
2. [ ] Convert sequential queries to RPC (O3)
3. [ ] Add cold start optimization (O2)
4. [ ] Implement real-time infrastructure (R1)

### Phase 4: Feature Parity (Week 4-5)
1. [ ] Add fallback authentication (A1)
2. [ ] Configure storage buckets (ST1)
3. [ ] Add RLS to prestige_records (RLS2)
4. [ ] Load testing and monitoring setup

---

## 10. Testing Requirements

### Pre-Launch Checklist

- [ ] Rate limiting tested under load
- [ ] HMAC validation verified for all endpoints
- [ ] CORS headers validated
- [ ] Database indexes performance tested
- [ ] Leaderboard query performance < 100ms
- [ ] Race condition tests for offline income
- [ ] Webhook security audit

### Security Testing

- [ ] SQL injection attempts blocked
- [ ] XSS attacks mitigated
- [ ] CSRF tokens validated
- [ ] Replay attacks prevented
- [ ] Brute force attacks rate limited

---

## 11. Monitoring Recommendations

### Essential Metrics

1. **Edge Function Invocation Count**
2. **Edge Function Latency (p50, p95, p99)**
3. **Database Query Time**
4. **Error Rate by Function**
5. **Rate Limit Hits**
6. **Active Users (concurrent)**

### Recommended Tools

- Supabase Dashboard Analytics
- Custom logging to Supabase Storage
- External APM (e.g., BetterStack, Grafana)

---

## 12. Appendix: Files Reviewed

### Edge Functions
```
supabase/functions/
├── _shared/
│   ├── deno-types.d.ts
│   └── validate-init-data.ts
├── adsgram-reward/index.ts
├── apply-referral-bonus/index.ts
├── claim-ad-reward/index.ts
├── claim-offline-income/index.ts
├── fetch-active-boosters/index.ts
├── game-action/index.ts
├── get-leaderboard/index.ts
├── get-user-rank/index.ts
├── load-game-state/index.ts
├── open-chest/index.ts
├── perform-prestige/index.ts
├── push-notification/index.ts
├── save-game-state/index.ts
├── telegram-payments/index.ts
├── track-session/index.ts
└── validate-init-data/index.ts
```

### Migrations
```
supabase/migrations/
├── 20260613144854_001_game_progress.sql
├── 20260613150403_002_add_referrals.sql
├── 20260613171158_001_game_progress_full.sql
├── 20260613172147_003_add_device_id.sql
├── 20260613195338_005_add_boosters.sql
├── 20260613204518_006_add_epoch_id.sql
├── 20260614122943_007_fix_rls_and_level_cap.sql
├── 20260615085433_008_daily_check_in.sql
├── 20260615091145_009_artifact_dupes.sql
├── 20260616225204_010_ads_rewards_log.sql.sql
├── 20260616233110_011_ad_views.sql.sql
├── 20260617100521_012_phase2_prestige_energy.sql.sql
├── 20260617125752_013_fix_energy_system.sql
├── 20260617131858_014_session_tracking_rls_fix.sql
├── 20260617133815_016_player_sessions_select_policy.sql
├── 20260617135150_017_swap_last_online_at_rpc.sql
├── 20260617135202_018_swap_last_online_at_lock_fix.sql
├── 20260701120000_019_notifications_system.sql
└── 20260702120000_020_fix_rls_policies.sql
```

### Client Code
```
src/lib/
├── supabase.ts
├── rpc.ts
├── storage.ts
├── telegram.ts
└── utils.ts
```

---

## Conclusion

The Supabase implementation is **production-ready with caveats**. The critical Phase 2 RLS fixes have been applied, and the server-authoritative architecture provides strong protection against client manipulation. However, the following must be addressed before launch:

1. **Immediate:** Fix swap_last_online_at RPC bug
2. **Immediate:** Restrict CORS origins
3. **Immediate:** Implement rate limiting
4. **High Priority:** Add HMAC verification to Telegram webhook

With these fixes, the Supabase backend will meet AAA mobile game studio standards for security, performance, and reliability.

---

*Review conducted by AAA Mobile Game Studio - Supabase Architecture Team*
*Next review: After Phase 1 fixes are implemented*
