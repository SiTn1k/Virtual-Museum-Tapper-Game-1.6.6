# 07 — Backend Architecture Audit
## Virtual Museum Tapper Game (v1.6.6)

**Auditor:** Backend Architect  
**Date:** 2026-07-02  
**AAA Studio Standards Compliance:** ⭐⭐⭐☆☆ (3/5)

---

## Executive Summary

The backend uses **Supabase Edge Functions** (Deno runtime) with PostgreSQL as the database. The architecture demonstrates solid security fundamentals—particularly HMAC-SHA256 authentication for Telegram Mini Apps and server-authoritative game logic—but exhibits significant structural weaknesses in **code organization**, **scalability**, and **operational concerns**. The system is functional for a small-to-medium player base but would require substantial hardening before production at scale.

**Overall Grade: C+ (Needs Improvement)**

---

## 1. Edge Functions Architecture

### 1.1 Inventory of Edge Functions

| Function | Purpose | Auth | Risk Level |
|----------|---------|------|------------|
| `adsgram-reward` | Grant XP boost or currency from ad rewards | Secret + user validation | Medium |
| `claim-ad-reward` | Server-authoritative ad reward limits | None (telegram_id only) | **High** |
| `claim-offline-income` | Calculate offline earnings with race protection | None (telegram_id only) | **High** |
| `game-action` | Upgrade tap, buy generators, switch epoch | HMAC initData | Low |
| `open-chest` | Server-side chest RNG and artifact rewards | None (telegram_id only) | **Critical** |
| `perform-prestige` | Server-authoritative prestige reset | None (telegram_id only) | **High** |
| `push-notification` | Send Telegram push notifications | None | Medium |
| `telegram-payments` | Stars payment processing + webhook | HMAC + idempotency | Low |
| `track-session` | Session tracking for analytics | None (telegram_id only) | Low |
| `validate-init-data` | Validate Telegram WebApp auth | HMAC | Low |

### 1.2 Strengths

✅ **Good:** Standardized CORS headers across all functions  
✅ **Good:** Consistent `jsonResponse` helper pattern  
✅ **Good:** Proper error logging with `console.error`  
✅ **Good:** Separate RPC for atomic `swap_last_online_at` in offline income  
✅ **Good:** Idempotency check in `telegram-payments` via `purchase_log`  

### 1.3 Weaknesses

❌ **CRITICAL:** 6 of 10 functions have **NO authentication** beyond `telegram_id` in request body
- `open-chest`, `perform-prestige`, `claim-offline-income`, `claim-ad-reward`, `track-session`, `push-notification`
- Any caller can forge requests for any `telegram_id`

❌ **HIGH:** `open-chest` contains hardcoded `ARTIFACTS` array duplicated from frontend
- Code drift will cause server/frontend desync
- Must be extracted to shared config or database table

❌ **HIGH:** No rate limiting on any edge function
- No protection against spam/abuse
- No request quota tracking

❌ **MEDIUM:** No request ID/correlation ID for tracing
- Debugging production issues is difficult

❌ **MEDIUM:** No health check endpoint
- Monitoring systems cannot verify function availability

---

## 2. Security Audit

### 2.1 Authentication Analysis

| Function | Auth Method | Verdict |
|----------|-------------|---------|
| `validate-init-data` | HMAC-SHA256 ✓ | ✅ Correct |
| `game-action` | HMAC-SHA256 ✓ | ✅ Correct |
| `telegram-payments` | HMAC-SHA256 + idempotency ✓ | ✅ Correct |
| `adsgram-reward` | Secret token + duplicate check | ⚠️ Partial (secret exposed to client) |
| All others | `telegram_id` only | ❌ **UNAUTHENTICATED** |

### 2.2 Critical Security Issues

#### Issue #1: Unauthenticated Critical Functions
**Severity:** Critical  
**Functions:** `open-chest`, `perform-prestige`

```typescript
// open-chest/index.ts - No authentication
const { telegram_id, epoch_id, chest_type } = body;
// Any attacker can:
// - Open chests for free (skip currency check)
// - Trigger prestige for any user
// - Manipulate artifact counts
```

**Recommendation:** All server-authoritative game mutations MUST validate `init_data` HMAC like `game-action` does.

#### Issue #2: Client-Exposed Secrets
**Severity:** Critical  
**File:** `src/services/adsgram.ts`

```typescript
// Line 17: Hardcoded secret in frontend code
export const ADSGRAM_SECRET = 'e73dc047768d42dba4d64432274c05c1';
```

This secret is visible to all players and sent in request bodies. Anyone can craft fake ad reward requests.

**Recommendation:** Remove client-side secret. Only use server-to-server verification via AdsGram callbacks.

#### Issue #3: CORS Allows All Origins
**Severity:** Medium  
**Pattern:** `"Access-Control-Allow-Origin": "*"` on all functions

This is acceptable for Telegram Mini Apps but exposes webhook endpoints to any origin.

### 2.3 Data Integrity Issues

#### Issue #4: Race Condition in `open-chest`
**Severity:** High  
The read-modify-write cycle for artifacts is not atomic:

```typescript
// Step 1: Fetch
const { data: player } = await supabase
  .from("game_progress")
  .select("currency, artifact_parts, ...");

// Step 2: Calculate locally
const artifactParts = player.artifact_parts || {};
artifactParts[reward.id] += reward.parts_granted;

// Step 3: Write back
await supabase.from("game_progress").update({ artifact_parts: artifactParts });
```

Two concurrent chest opens could overwrite each other's changes.

**Recommendation:** Use database-level atomic operations or advisory locks.

#### Issue #5: `perform-prestige` Level Check is Client-Side
**Severity:** High  
The prestige requirements check happens in the client:

```typescript
// useGame.ts - Line 271
const canPrestige = state.level >= 950 && state.epochId === 'independence';
```

The edge function does verify server-side, but the client UX is misleading.

---

## 3. API Design Quality

### 3.1 REST Compliance

| Function | Method | Endpoint | RESTful? |
|----------|--------|----------|----------|
| `adsgram-reward` | GET/POST | `/adsgram-reward` | ⚠️ Mixed |
| `claim-ad-reward` | POST | `/claim-ad-reward` | ✅ |
| `claim-offline-income` | POST | `/claim-offline-income` | ✅ |
| `game-action` | POST | `/game-action` | ⚠️ Action-based |
| `open-chest` | POST | `/open-chest` | ✅ |
| `perform-prestige` | POST | `/perform-prestige` | ✅ |
| `push-notification` | POST | `/push-notification` | ⚠️ Action-based |
| `telegram-payments` | GET/POST | `/telegram-payments` | ⚠️ Mixed |
| `track-session` | POST | `/track-session` | ✅ |
| `validate-init-data` | POST | `/validate-init-data` | ✅ |

### 3.2 Response Standardization

**Current State: PARTIAL**

Most functions use a `jsonResponse` helper, but responses vary:

```typescript
// Consistent pattern (good)
return jsonResponse({ success: true, ...data });

// Error responses vary
return jsonResponse({ error: "User not found" }, 404);
return jsonResponse({ success: false, error: "..." }, 400);
return new Response(JSON.stringify({ error: "..." }), { status: 500 });
```

**Recommendation:** Standardize error response format:

```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta?: {
    requestId?: string;
    timestamp: string;
  };
}
```

### 3.3 Missing API Concerns

| Concern | Status | Impact |
|---------|--------|--------|
| API Versioning | ❌ None | Breaking changes affect all clients |
| Pagination | ❌ None | Leaderboard will degrade |
| Field Selection | ❌ None | Over-fetching in `game-action` |
| Batch Operations | ❌ None | Multiple round-trips needed |

---

## 4. Error Handling

### 4.1 Current Error Handling Assessment

| Function | Try/Catch | Typed Errors | Retry Logic |
|----------|-----------|--------------|-------------|
| `adsgram-reward` | ✅ | ⚠️ Partial | ❌ |
| `claim-ad-reward` | ✅ | ✅ | ❌ |
| `claim-offline-income` | ✅ | ✅ | ❌ |
| `game-action` | ✅ | ❌ | ❌ |
| `open-chest` | ✅ | ⚠️ Partial | ❌ |
| `perform-prestige` | ✅ | ⚠️ Partial | ❌ |
| `push-notification` | ✅ | ⚠️ Partial | ❌ |
| `telegram-payments` | ✅ | ⚠️ Partial | ❌ |
| `track-session` | ✅ | ⚠️ Partial | ❌ |
| `validate-init-data` | ✅ | ❌ | ❌ |

### 4.2 Error Categories Not Handled

- Database connection failures (transient)
- Timeout errors (Supabase cold starts ~200ms-2s)
- Rate limit errors from Telegram API
- Invalid JSON parsing errors (partial handling)
- Network errors in external API calls

### 4.3 Missing Error Handling Example

```typescript
// telegram-payments/index.ts - Line 78
async function tgCall(method: string, body: Record<string, unknown>) {
  const res = await fetch(`${TG_API}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return res.json(); // No error handling for network failures
}
```

---

## 5. Input Validation

### 5.1 Validation Coverage

| Field Type | Validation | Location |
|-----------|-----------|----------|
| `telegram_id` | Number + positive check | ✅ All functions |
| `epoch_id` | String presence check | ✅ Most functions |
| `reward_type` | Enum whitelist | ⚠️ Partial |
| `chest_type` | Default fallback | ⚠️ Weak |
| `event` (session) | Enum whitelist | ✅ |
| `action` | Enum whitelist | ✅ |

### 5.2 Validation Gaps

#### Gap #1: No Upper Bound on `telegram_id`
```typescript
// All functions
if (!telegram_id || typeof telegram_id !== "number" || telegram_id <= 0) {
  return jsonResponse({ error: "Invalid telegram_id" }, 400);
}
```
Telegram IDs can be very large numbers. Should verify against `Number.isSafeInteger()`.

#### Gap #2: No String Length Limits
```typescript
// open-chest: epoch_id could be arbitrarily long
if (!epoch_id) {
  return jsonResponse({ error: "Missing epoch_id" }, 400);
}
```

#### Gap #3: `init_data` Not Validated for Length
The HMAC validation accepts any length `init_data` string.

### 5.3 Missing Input Validation

| Validation | Needed For | Risk |
|-----------|-----------|------|
| Type coercion protection | All numeric fields | Medium |
| String sanitization | User-provided text | Medium |
| Array length limits | `owned_generators`, `completed_artifacts` | Low |
| JSONB structure validation | `active_boosters`, `artifact_parts` | Medium |

---

## 6. Server-Side Business Logic

### 6.1 Logic That Should Be Server-Only

✅ **Correctly server-side:**
- XP boost calculation with grace period
- Currency deduction with balance verification
- Offline income calculation (anti-cheat)
- Chest RNG (prevents client manipulation)
- Prestige reset logic
- Ad reward daily limits
- Payment idempotency

### 6.2 Logic That Leaks to Client

⚠️ **Client calculates, server trusts:**
- Tap power upgrade cost: `25 * Math.pow(1.8, tapPower - 1)` (in `game-action`)
- Generator costs (planned, not implemented)
- XP to next level calculation (frontend in `useGame.ts`)
- Energy regeneration (client-side timestamp math)

### 6.3 Code Duplication

**CRITICAL:** `ARTIFACTS` array exists in THREE locations:

1. `supabase/functions/open-chest/index.ts` (server, lines 57-123)
2. `src/data/epochs.ts` (frontend, ~400 lines)
3. Hardcoded values referenced in `telegram-payments/index.ts` (lines 405-428)

**Consequence:** Secret artifacts won't match between server RNG and client display.

---

## 7. Database Design

### 7.1 Schema Assessment

| Table | Purpose | Design Quality |
|-------|---------|----------------|
| `game_progress` | Core player state | ✅ Good with indexes |
| `ads_rewards_log` | Duplicate prevention | ✅ Simple |
| `ad_views` | Analytics | ⚠️ Missing indexes |
| `player_sessions` | Session tracking | ⚠️ No TTL cleanup |
| `prestige_records` | Prestige history | ✅ Good |
| `scheduled_notifications` | Push notification queue | ⚠️ No processor |
| `offline_claims` | Analytics | ✅ Simple |

### 7.2 Missing Database Features

| Feature | Impact | Priority |
|---------|--------|----------|
| Periodic cleanup job for `player_sessions` | Storage bloat | High |
| Trigger to update `total_xp` on level-up | Data integrity | Medium |
| Unique constraint on `ads_rewards_log.ad_id` | Double-claim prevention | High |
| Composite index on `ad_views` for analytics queries | Query performance | Medium |
| `swap_last_online_at` RPC fallback documentation | Operational risk | Medium |

### 7.3 RLS Policy Concerns

```sql
-- game_progress policies allow ANON write access
CREATE POLICY "anon_update_progress" ON game_progress FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
```

This is intentional for Telegram Mini App UX but removes database-level protection. All security is delegated to edge functions.

---

## 8. Scalability Considerations

### 8.1 Current Scalability Posture

| Concern | Status | Notes |
|---------|--------|-------|
| Connection pooling | ✅ Managed by Supabase | Good |
| Edge function cold starts | ⚠️ ~200ms-2s | Acceptable for games |
| Database indexes | ⚠️ Partial | Leaderboard index exists |
| Session storage | ❌ No cleanup | Will grow unbounded |
| No caching layer | ❌ Missing | Every request hits DB |

### 8.2 Scalability Issues

#### Issue #1: No Connection Reuse
Each edge function invocation creates a new Supabase client:

```typescript
// Every function
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
```

This is fine for Supabase Edge Functions but limits portability.

#### Issue #2: N+1 Query Pattern in `track-session`
```typescript
// track-session/index.ts - Lines 111-146
// Finds latest session, updates it
const { data: sessions } = await supabase
  .from("player_sessions")
  .select("id, session_started_at, last_activity_at")
  .eq("telegram_id", telegram_id)
  .order("session_started_at", { ascending: false })
  .limit(1);
```

Could be optimized with a single upsert or RPC.

#### Issue #3: Session Table Will Grow Unbounded
No TTL or archival strategy for `player_sessions`. At 1000 daily active users, this is 365,000 rows/year.

### 8.3 Load Testing Recommendations

- Simulate 10,000 concurrent users claiming offline income
- Test `open-chest` at 100 TPS with full artifact arrays
- Verify leaderboard query performance at 1M rows

---

## 9. Rate Limiting & Abuse Prevention

### 9.1 Current State: NONE

No rate limiting exists anywhere in the system.

### 9.2 Required Rate Limits

| Endpoint | Limit | Window | Reason |
|----------|-------|--------|--------|
| `claim-ad-reward` | 10 | per minute | Prevent ad farming |
| `open-chest` | 20 | per minute | Prevent currency exploits |
| `perform-prestige` | 1 | per hour | Prevent abuse |
| `track-session` | 60 | per minute | Logging overhead |
| `claim-offline-income` | 5 | per minute | Offline farming |

### 9.3 Implementation Options

**Option A: Supabase Built-in (if available)**
```sql
-- Using pg_limiter or similar
```

**Option B: Custom in-edge-function**
```typescript
// Store rate limit data in Redis or dedicated table
const { data: rateLimit } = await supabase
  .from("rate_limits")
  .select("*")
  .eq("telegram_id", telegramId)
  .eq("endpoint", "open-chest");
```

**Option C: Third-party (e.g., Upstash Redis)**
Recommended for production scale.

---

## 10. Logging & Monitoring

### 10.1 Current Logging

| Level | Usage | Coverage |
|-------|-------|----------|
| `console.log` | Success events | Partial |
| `console.error` | Errors | Partial |
| `console.warn` | Security events | Minimal |

### 10.2 Missing Logging

❌ **No request correlation IDs**  
❌ **No structured logging format**  
❌ **No performance metrics (duration, DB time)**  
❌ **No security audit trail**  
❌ **No business metrics (revenue, DAU, retention)**

### 10.3 Logging Implementation

```typescript
// Recommended structured log format
console.log(JSON.stringify({
  level: "info",
  timestamp: new Date().toISOString(),
  requestId: crypto.randomUUID(),
  function: "open-chest",
  telegramId,
  duration_ms,
  dbDuration_ms,
  action: "chest_opened",
  rewards_count: rewards.length,
}));
```

### 10.4 Monitoring Recommendations

| Metric | Alert Threshold |
|--------|------------------|
| Function error rate | > 1% |
| P99 latency | > 3000ms |
| DB connection errors | > 0 |
| Telegram API failures | > 5% |
| Duplicate payment attempts | > 0 |

---

## 11. API Versioning

### 11.1 Current State: NONE

All endpoints use `/functions/v1/` with no versioning mechanism.

### 11.2 Versioning Problems

When breaking changes are needed:
- No way to serve old clients
- Forced migrations on all users
- Cannot A/B test changes

### 11.3 Recommended Strategy

**Option A: Function-level versioning** (Supabase-native)
```
/functions/v1/open-chest-v2
/functions/v1/open-chest-v1  // Keep for grace period
```

**Option B: Request header versioning**
```typescript
// Check API version in header
const apiVersion = req.headers.get("X-API-Version") || "1.0";
if (apiVersion < "2.0") {
  // Handle legacy logic
}
```

---

## 12. Deployment & Operations

### 12.1 Deployment Process

Current: Manual edge function deployment via Supabase CLI
```bash
supabase functions deploy <function-name>
```

### 12.2 Missing CI/CD

| Concern | Current | Needed |
|---------|---------|--------|
| Linting | ❌ | ✅ ESLint on all functions |
| Type checking | ❌ | ✅ TypeScript strict mode |
| Unit tests | ❌ | ✅ Vitest/Deno test |
| Integration tests | ❌ | ✅ Supabase local |
| Environment validation | ⚠️ Partial | ✅ Startup checks |
| Deployment gating | ❌ | ✅ Require passing tests |

### 12.3 Environment Configuration

```typescript
// Current pattern
const BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN") ?? "";

// Problematic: Empty string is falsy but valid
// Better:
const BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN");
if (!BOT_TOKEN) throw new Error("TELEGRAM_BOT_TOKEN is required");
```

---

## 13. Third-Party Integrations

### 13.1 Telegram Bot API

| Endpoint | Usage | Error Handling |
|---------|-------|----------------|
| `sendMessage` | Push notifications | ✅ Basic |
| `createInvoiceLink` | Stars payments | ✅ Basic |
| `setWebhook` | Payment callbacks | ✅ Basic |
| `answerPreCheckoutQuery` | Payment processing | ✅ Basic |

**Gap:** No retry logic for Telegram API failures.

### 13.2 AdsGram

| Integration | Security | Notes |
|------------|----------|-------|
| Server callback (GET) | ✅ Secret verified | Good |
| Client callback (POST) | ❌ **No auth** | Risk |

The AdsGram integration sends rewards via GET callback (with secret verification) but the client-side SDK also calls the edge function without proper verification.

### 13.3 External API Resilience

```typescript
// Missing: Exponential backoff retry
async function fetchWithRetry(url: string, options: RequestInit, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, options);
      if (response.ok) return response;
    } catch (err) {
      if (i === retries - 1) throw err;
      await new Promise(r => setTimeout(r, 2 ** i * 1000));
    }
  }
}
```

---

## 14. Summary of Recommendations

### Priority 1 (Critical - Fix Within Sprint)

1. **Add HMAC authentication to all game-mutating functions**
   - `open-chest`, `perform-prestige`, `claim-ad-reward`, `claim-offline-income`
   - Follow `game-action` pattern with `init_data` validation

2. **Remove `ADSGRAM_SECRET` from frontend code**
   - Only use server-side AdsGram callback verification

3. **Move `ARTIFACTS` to shared config or database**
   - Eliminate code drift between server and client

4. **Add duplicate-claim protection to all reward endpoints**
   - Use `UNIQUE` constraint on `ads_rewards_log.ad_id`

### Priority 2 (High - Fix Within Month)

5. **Implement rate limiting**
   - Start with `claim-ad-reward` and `open-chest`

6. **Add structured logging with request IDs**
   - Enable production debugging

7. **Implement atomic operations for chest opening**
   - Use database transactions or advisory locks

8. **Add database cleanup job for `player_sessions`**
   - Archive/delete sessions older than 90 days

### Priority 3 (Medium - Fix Within Quarter)

9. **Standardize API response format**
   - Implement `ApiResponse<T>` interface

10. **Add health check endpoint**
    - Enable monitoring systems

11. **Implement API versioning strategy**
    - Support backward compatibility

12. **Add integration tests for all edge functions**
    - Test happy path and error conditions

### Priority 4 (Low - Future Enhancement)

13. **Add caching layer for leaderboard**
    - Reduce database load

14. **Implement retry logic for external APIs**
    - Telegram Bot API resilience

15. **Add performance metrics tracking**
    - DB query duration, function execution time

---

## 15. Risk Matrix

| Risk | Likelihood | Impact | Mitigation |
|------|-------------|--------|------------|
| Currency exploit via chest | **HIGH** | Critical | Add auth + rate limiting |
| Prestige farming | Medium | High | Add auth + cooldown |
| Ad reward farming | **HIGH** | Medium | Rate limiting + server verification |
| Data loss from race conditions | Medium | Critical | Atomic operations |
| Secret exposure | **HIGH** | Critical | Remove from frontend |
| Database bloat | Medium | Medium | Cleanup jobs |
| Telegram API failures | Low | Low | Retry logic |

---

## 16. Code Quality Metrics

| Metric | Score | Notes |
|--------|-------|-------|
| TypeScript strict mode | ⚠️ Partial | Types used but not enforced |
| Error handling coverage | ⚠️ 70% | Try/catch exists, but partial recovery |
| Test coverage | ❌ 0% | No tests found |
| Code duplication | ❌ HIGH | ARTIFACTS, CORS headers, jsonResponse |
| Documentation | ⚠️ Partial | JSDoc exists, but incomplete |
| Linting | ⚠️ Partial | ESLint config exists but not run on functions |

---

## Appendix A: File Inventory

```
supabase/functions/
├── adsgram-reward/index.ts          (192 lines) - Partial auth
├── claim-ad-reward/index.ts         (256 lines) - No auth
├── claim-offline-income/index.ts     (197 lines) - No auth
├── game-action/index.ts              (167 lines) - HMAC auth ✅
├── open-chest/index.ts              (336 lines) - No auth ⚠️
├── perform-prestige/index.ts        (200 lines) - No auth ⚠️
├── push-notification/index.ts        (238 lines) - No auth
├── telegram-payments/index.ts       (447 lines) - HMAC + idempotency ✅
├── track-session/index.ts           (190 lines) - No auth
└── validate-init-data/index.ts      (106 lines) - HMAC auth ✅
```

## Appendix B: Migration Files

```
supabase/migrations/
├── 001_game_progress_full.sql       ✅ Schema foundation
├── 002_add_referrals.sql
├── 003_add_device_id.sql
├── 005_add_boosters.sql
├── 006_add_epoch_id.sql
├── 007_fix_rls_and_level_cap.sql
├── 008_daily_check_in.sql
├── 009_artifact_dupes.sql
├── 010_ads_rewards_log.sql.sql      ✅ Duplicate prevention
├── 011_ad_views.sql.sql             ⚠️ Missing indexes
├── 012_phase2_prestige_energy.sql.sql
├── 013_fix_energy_system.sql
├── 014_session_tracking_rls_fix.sql
├── 016_player_sessions_select_policy.sql
├── 017_swap_last_online_at_rpc.sql   ✅ Race condition protection
├── 018_swap_last_online_at_lock_fix.sql
└── 019_notifications_system.sql
```

---

**End of Audit**

*Next: 08_FRONTEND_AUDIT.md*
