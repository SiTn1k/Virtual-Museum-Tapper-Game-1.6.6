# Backend Architecture Review
## Virtual Museum Tapper Game (v1.6.6)

**Reviewer:** Backend Architect  
**Date:** 2026-07-02  
**Standards:** AAA Mobile Game Studio  
**Repository Path:** `/workspace/project/Virtual-Museum-Tapper-Game-1.6.6`

---

## Executive Summary

The backend demonstrates solid server-authoritative game logic with proper HMAC-SHA256 authentication for critical operations. However, significant security vulnerabilities and architectural weaknesses require immediate attention before production deployment. The system shows inconsistent authentication patterns, duplicate code, and missing operational safeguards.

**Overall Backend Grade: C+ (Needs Improvement)**

| Category | Score | Status |
|----------|-------|--------|
| Edge Functions Design | 6/10 | ⚠️ Needs Work |
| API Endpoints & Patterns | 7/10 | ⚠️ Partial |
| Server-side Logic | 7/10 | ⚠️ Partial |
| RPC Calls | 6/10 | ⚠️ Needs Work |
| Error Handling | 6/10 | ⚠️ Needs Work |
| Input Validation | 7/10 | ⚠️ Partial |
| Response Formatting | 5/10 | ❌ Inconsistent |
| Security Considerations | 5/10 | ❌ High Risk |

---

## 1. Edge Functions Design

### 1.1 Function Inventory

| Function | Lines | Auth Method | Risk Level | Status |
|----------|-------|-------------|------------|--------|
| `game-action` | 167 | HMAC-SHA256 | High | ✅ Protected |
| `perform-prestige` | 217 | HMAC-SHA256 | Critical | ✅ Protected |
| `claim-offline-income` | 213 | HMAC-SHA256 | High | ✅ Protected |
| `open-chest` | 349 | HMAC-SHA256 | Critical | ✅ Protected |
| `claim-ad-reward` | 272 | HMAC-SHA256 | High | ✅ Protected |
| `adsgram-reward` | 329 | HMAC-SHA256 + Secret | High | ✅ Protected |
| `telegram-payments` | 448 | HMAC + Idempotency | Critical | ✅ Protected |
| `push-notification` | 264 | HMAC-SHA256 | Medium | ✅ Protected |
| `track-session` | 206 | HMAC-SHA256 | Low | ✅ Protected |
| `validate-init-data` | 107 | HMAC-SHA256 | Low | ✅ Protected |
| `save-game-state` | 115 | HMAC-SHA256 | High | ✅ Protected |
| `load-game-state` | 105 | HMAC-SHA256 | High | ✅ Protected |
| `get-leaderboard` | 88 | Optional HMAC | Low | ⚠️ Optional |
| `get-user-rank` | 63 | None | Low | ⚠️ No Auth |
| `apply-referral-bonus` | 100 | HMAC-SHA256 | High | ✅ Protected |
| `fetch-active-boosters` | 69 | Optional HMAC | Medium | ⚠️ Optional |

### 1.2 Architectural Strengths

✅ **Good:** Centralized HMAC validation in `_shared/validate-init-data.ts`  
✅ **Good:** Consistent CORS headers pattern across all functions  
✅ **Good:** Proper use of `SECURITY DEFINER` for RPC calls  
✅ **Good:** Race condition protection via `swap_last_online_at` RPC with `FOR UPDATE`  
✅ **Good:** Idempotency check in `telegram-payments` using `charge_id`  
✅ **Good:** Server-authoritative chest RNG and prestige calculations

### 1.3 Architectural Issues

#### ISSUE-BE-001: Duplicate HMAC Validation Code
**Severity:** Medium  
**Affected Files:** 
- `supabase/functions/_shared/validate-init-data.ts` (shared module)
- `supabase/functions/game-action/index.ts` (lines 34-58, duplicate)
- `supabase/functions/validate-init-data/index.ts` (full duplicate)

**Description:** The `game-action` function contains a complete copy of the `validateInitData` function (lines 34-58) instead of importing from the shared module. Similarly, `validate-init-data` duplicates logic available elsewhere.

```typescript
// game-action/index.ts - Lines 34-58 (DUPLICATE)
function validateInitData(initData: string): { valid: boolean; userId: number | null; error?: string } {
  if (!BOT_TOKEN) return { valid: false, userId: null, error: "BOT_TOKEN not configured" };
  // ... entire function duplicated
}
```

**Why This Matters:** Code duplication leads to maintenance nightmares. When HMAC validation logic needs updates (e.g., extending token freshness window), developers must update multiple locations, risking inconsistency.

**Potential Impact:** Security vulnerability if one copy is updated but not others. Inconsistent behavior across endpoints.

**Risk if Ignored:** Medium - Future security patches may miss copies, leading to exploitable inconsistencies.

**Recommended Solution:**
```typescript
// game-action/index.ts
import { validateRequest } from "../_shared/validate-init-data.ts";

// Use the imported function instead of duplicate
const validation = validateRequest(init_data);
```

**Estimated Effort:** 2 hours - Update 2 functions to use shared module, remove duplicates.

---

#### ISSUE-BE-002: CORS Headers Allow All Origins
**Severity:** Medium  
**Affected Files:** All 16 Edge Functions

**Description:** All functions use `"Access-Control-Allow-Origin": "*"` which permits requests from any origin.

```typescript
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",  // Should be restricted
  // ...
};
```

**Why This Matters:** For Telegram Mini Apps, wildcard CORS is technically acceptable since the app runs within Telegram's context. However, it exposes webhook endpoints (e.g., `telegram-payments`) to arbitrary web requests.

**Potential Impact:** Webhook endpoints could be probed by attackers. Information disclosure from error messages.

**Risk if Ignored:** Medium - Limited risk for Telegram Mini Apps but violates defense-in-depth principle.

**Recommended Solution:**
```typescript
const ALLOWED_ORIGINS = [
  'https://t.me',
  'https://web.telegram.org',
  'https://*.telegram.org'
];

function getCorsHeaders(origin: string | null) {
  const allowedOrigin = origin && ALLOWED_ORIGINS.some(o => 
    origin === o || (o.includes('*') && origin.match(o.replace('*', '.*')))
  ) ? origin : ALLOWED_ORIGINS[0];
  
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    // ...
  };
}
```

**Estimated Effort:** 4 hours - Update all functions to use dynamic origin validation.

---

#### ISSUE-BE-003: No Request Correlation IDs
**Severity:** Medium  
**Affected Files:** All Edge Functions

**Description:** No request tracing capability. Each function invocation is isolated with no correlation ID for debugging.

**Why This Matters:** Production debugging requires correlating logs across multiple systems. Without request IDs, tracing issues through Supabase logs, application logs, and client reports is extremely difficult.

**Potential Impact:** Extended debugging time for production incidents. Difficulty identifying attack patterns.

**Risk if Ignored:** Medium - Increases MTTR (Mean Time To Recovery) during incidents.

**Recommended Solution:**
```typescript
Deno.serve(async (req: Request) => {
  const requestId = req.headers.get("X-Request-ID") || crypto.randomUUID();
  const startTime = Date.now();
  
  // Add to all log statements
  console.log(JSON.stringify({
    level: "info",
    requestId,
    function: "open-chest",
    timestamp: new Date().toISOString(),
    duration_ms: Date.now() - startTime
  }));
  
  return jsonResponse({ ... }, 200, requestId);
});
```

**Estimated Effort:** 6 hours - Add request ID to all functions and logging infrastructure.

---

#### ISSUE-BE-004: Missing Health Check Endpoint
**Severity:** Low  
**Affected Files:** None (missing feature)

**Description:** No dedicated health check endpoint for monitoring systems to verify function availability.

**Why This Matters:** Production monitoring, load balancers, and deployment systems require health check endpoints to verify service health.

**Potential Impact:** Inability to automatically detect and respond to function failures.

**Risk if Ignored:** Low - Manual monitoring can compensate temporarily.

**Recommended Solution:**
```typescript
// supabase/functions/health/index.ts
Deno.serve(async (req: Request) => {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  
  try {
    // Verify database connectivity
    await supabase.from("game_progress").select("id").limit(1);
    
    return new Response(JSON.stringify({
      status: "healthy",
      timestamp: new Date().toISOString(),
      version: "1.6.6"
    }), { headers: { "Content-Type": "application/json" } });
  } catch {
    return new Response(JSON.stringify({
      status: "unhealthy",
      timestamp: new Date().toISOString()
    }), { status: 503 });
  }
});
```

**Estimated Effort:** 2 hours - Create new function and configure monitoring.

---

## 2. API Endpoints and Patterns

### 2.1 Endpoint Summary

| Endpoint | Method | Auth | Idempotent | Versioned |
|----------|--------|------|------------|-----------|
| `/game-action` | POST | HMAC | Partial | ❌ |
| `/perform-prestige` | POST | HMAC | ✅ | ❌ |
| `/claim-offline-income` | POST | HMAC | ✅ | ❌ |
| `/open-chest` | POST | HMAC | ✅ | ❌ |
| `/claim-ad-reward` | POST | HMAC | ✅ | ❌ |
| `/adsgram-reward` | GET/POST | Secret/HMAC | ✅ | ❌ |
| `/telegram-payments` | GET/POST | HMAC | ✅ | ❌ |
| `/push-notification` | POST | HMAC | ❌ | ❌ |
| `/track-session` | POST | HMAC | ❌ | ❌ |
| `/validate-init-data` | POST | HMAC | N/A | ❌ |
| `/save-game-state` | POST | HMAC | ✅ | ❌ |
| `/load-game-state` | POST | HMAC | N/A | ❌ |
| `/get-leaderboard` | POST | Optional | N/A | ❌ |
| `/get-user-rank` | POST | None | N/A | ❌ |
| `/apply-referral-bonus` | POST | HMAC | ❌ | ❌ |
| `/fetch-active-boosters` | POST | Optional | N/A | ❌ |

### 2.2 API Design Issues

#### ISSUE-BE-005: No API Versioning Strategy
**Severity:** Medium  
**Affected Files:** All Edge Functions

**Description:** All endpoints use `/functions/v1/` with no versioning mechanism. Breaking changes affect all clients simultaneously.

**Why This Matters:** When backend changes require client updates (e.g., modified chest reward structure), there's no way to support old clients during transition periods.

**Potential Impact:** Forced migrations on all users. Inability to A/B test changes. Revenue loss during update windows.

**Risk if Ignored:** Medium - Minor inconvenience during updates, major issue during critical hotfixes.

**Recommended Solution:** Implement function-level versioning:
```
/functions/v1/open-chest-v2
/functions/v1/open-chest-v1  // Grace period for old clients
```

Or header-based versioning:
```typescript
const apiVersion = req.headers.get("X-API-Version") || "1.0";
```

**Estimated Effort:** 8 hours - Create versioned function copies and update routing logic.

---

#### ISSUE-BE-006: Inconsistent Response Formats
**Severity:** High  
**Affected Files:** All Edge Functions

**Description:** Responses vary between functions in structure and error format:

```typescript
// Pattern A: success flag
return jsonResponse({ success: true, data: {...} });

// Pattern B: ok flag  
return jsonResponse({ ok: true, new_tap_power: 2 });

// Pattern C: No wrapper
return jsonResponse({ rewards: [...], chest_type: "daily" });

// Pattern D: Mixed success/error
return jsonResponse({ success: true, rewards: [...] });
return new Response(JSON.stringify({ error: "..." }), { status: 500 });
```

**Why This Matters:** Client code must handle multiple response formats, increasing complexity and bug potential.

**Potential Impact:** Client-side parsing bugs. Inconsistent user experience. Increased development time.

**Risk if Ignored:** High - Client integration bugs, support burden.

**Recommended Solution:** Standardize all responses:

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
    version: string;
  };
}

// Example usage
return jsonResponse<ChestRewards>({
  success: true,
  data: { rewards, chest_type },
  meta: { requestId, timestamp: new Date().toISOString(), version: "1.6.6" }
});
```

**Estimated Effort:** 12 hours - Refactor all functions to use unified response format.

---

#### ISSUE-BE-007: Missing Pagination on Leaderboard
**Severity:** Medium  
**Affected Files:** `supabase/functions/get-leaderboard/index.ts`

**Description:** The leaderboard endpoint returns up to 50 entries with no cursor-based pagination:

```typescript
.limit(limit);  // Default 50, no offset/cursor support
```

**Why This Matters:** As player base grows, fetching top 50 repeatedly is inefficient. Users viewing ranks beyond 50 have no way to access them.

**Potential Impact:** Performance degradation. Limited UX for competitive players.

**Risk if Ignored:** Medium - Acceptable for current scale, will become critical at 10K+ players.

**Recommended Solution:**
```typescript
interface LeaderboardRequest {
  init_data?: string;
  limit?: number;  // Max 100
  cursor?: string;  // Base64 encoded telegram_id
}
```

**Estimated Effort:** 6 hours - Add cursor-based pagination with proper indexing.

---

#### ISSUE-BE-008: Action-Based vs Resource-Based Naming
**Severity:** Low  
**Affected Files:** `game-action`, `push-notification`

**Description:** Some endpoints use action-based naming (`game-action`) while REST principles favor resource-based naming (`/taps`, `/notifications`).

**Why This Matters:** Violates REST conventions, making the API less intuitive for developers familiar with REST patterns.

**Potential Impact:** Minor developer experience issue. No functional impact.

**Risk if Ignored:** Low - Current approach works, just not RESTful.

**Estimated Effort:** 16 hours - Major refactoring to split into resource-based endpoints.

---

## 3. Server-side Logic

### 3.1 Logic Quality Assessment

| Function | Complexity | Atomicity | Validation | Issues |
|----------|------------|-----------|------------|--------|
| `game-action` | Medium | ⚠️ Partial | ✅ Complete | Duplicate validation |
| `perform-prestige` | Medium | ✅ Full | ✅ Complete | None |
| `claim-offline-income` | Medium | ✅ Full | ✅ Complete | None |
| `open-chest` | High | ⚠️ Partial | ✅ Complete | Race condition risk |
| `claim-ad-reward` | Medium | ⚠️ Partial | ✅ Complete | None |
| `adsgram-reward` | Medium | ✅ Full | ✅ Complete | None |
| `telegram-payments` | High | ✅ Full | ✅ Complete | None |
| `save-game-state` | Low | ✅ Full | ✅ Complete | None |

### 3.2 Server-side Logic Issues

#### ISSUE-BE-009: Race Condition in Chest Opening
**Severity:** High  
**Affected Files:** `supabase/functions/open-chest/index.ts` (lines 263-335)

**Description:** The read-modify-write cycle for artifacts is not atomic:

```typescript
// Step 1: Fetch current state (LINE 264-268)
const { data: player } = await supabase
  .from("game_progress")
  .select("currency, prestige_level, ...");

// Step 2: Calculate locally (LINES 296-314)
const artifactParts = (player.artifact_parts as Record<string, number>) || {};
for (const reward of rewards) {
  artifactParts[reward.id] = (artifactParts[reward.id] || 0) + reward.parts_granted;
}

// Step 3: Write back (LINES 327-330)
await supabase.from("game_progress").update(updateData).eq("telegram_id", telegram_id);
```

**Why This Matters:** Two concurrent chest opens could both read the same artifact counts, then overwrite each other's changes (lost update problem).

**Potential Impact:** Players could exploit race conditions to gain duplicate artifacts. Currency inconsistency.

**Risk if Ignored:** High - Exploitable by users with multiple tabs or automated scripts.

**Recommended Solution:** Use database transaction with advisory lock or atomic CTE:

```typescript
// Option A: Database function with row lock
const { data: result } = await supabase.rpc('open_chest_safe', {
  p_telegram_id: telegram_id,
  p_epoch_id: epoch_id,
  p_chest_type: chest_type
});

// Database function:
// CREATE OR REPLACE FUNCTION open_chest_safe(...)
// RETURNS json AS $$
// DECLARE
//   player_row game_progress%ROWTYPE;
// BEGIN
//   SELECT * INTO player_row FROM game_progress 
//   WHERE telegram_id = p_telegram_id FOR UPDATE;
//   -- Perform all calculations
//   -- Update and return result
// END;
// $$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Estimated Effort:** 8 hours - Create atomic database function and update edge function.

---

#### ISSUE-BE-010: Hardcoded Artifact Definitions
**Severity:** High  
**Affected Files:** `supabase/functions/open-chest/index.ts` (lines 58-122)

**Description:** The `ARTIFACTS` array is duplicated between frontend and backend:

```typescript
// open-chest/index.ts - Lines 58-122 (336 lines of artifact definitions)
const ARTIFACTS: Array<{...}> = [
  { id: "trypillia_vase", epoch: "trypillia", rarity: "common", ... },
  // ... 50+ artifact definitions
];

// Same definitions exist in src/data/epochs.ts (frontend)
```

**Why This Matters:** Code drift will cause server/frontend desync. Adding artifacts requires updating two places. Inconsistency leads to bugs.

**Potential Impact:** Server and client disagree on artifact properties. Missing artifacts in one environment.

**Risk if Ignored:** High - Manual sync errors will cause gameplay bugs.

**Recommended Solution:** Move artifacts to database table:

```sql
-- Migration
CREATE TABLE artifacts (
  id TEXT PRIMARY KEY,
  epoch TEXT NOT NULL,
  rarity TEXT NOT NULL,
  parts_required INTEGER NOT NULL,
  bonus_type TEXT NOT NULL,
  bonus_value REAL NOT NULL,
  icon TEXT NOT NULL,
  name_ua TEXT NOT NULL,
  name_en TEXT NOT NULL,
  required_prestige INTEGER DEFAULT 0
);

-- Seed from current definitions
-- Edge function reads from DB instead of hardcoded array
const { data: artifacts } = await supabase.from("artifacts").select("*");
```

**Estimated Effort:** 4 hours - Create migration, seed data, update edge function to read from DB.

---

#### ISSUE-BE-011: Duplicate Validation in `adsgram-reward`
**Severity:** Medium  
**Affected Files:** `supabase/functions/adsgram-reward/index.ts`

**Description:** The `adsgram-reward` function imports `validateRequest` but also has its own secret-based validation for GET requests:

```typescript
// Line 3: Imports shared validation
import { validateRequest } from "../_shared/validate-init-data.ts";

// Line 198-200: Own secret validation for GET
if (!ADSGRAM_SECRET || secret !== ADSGRAM_SECRET) {
  console.warn(`Invalid AdsGram secret attempt for user ${userid}`);
  return jsonResponse({ error: "Invalid secret" }, 403);
}
```

**Why This Matters:** Two different authentication paths for the same function increases complexity and potential for security gaps.

**Potential Impact:** Confusion about which auth applies. Potential for auth bypass if logic has gaps.

**Risk if Ignored:** Medium - Current implementation is secure but harder to maintain.

**Estimated Effort:** 2 hours - Document auth paths clearly or refactor to single path.

---

## 4. RPC Calls

### 4.1 RPC Inventory

| RPC | Purpose | Security | Status |
|-----|---------|----------|--------|
| `swap_last_online_at` | Atomic offline time swap | SECURITY DEFINER + FOR UPDATE | ✅ Secure |
| `update_game_progress` | Bulk upsert player data | SECURITY DEFINER | ⚠️ Missing validation |
| `increment_currency` | Add currency (referral) | Unknown | ❌ Not found |
| `increment_referrals` | Increment referrer count | Unknown | ❌ Not found |
| `increment_earnings` | Add referral earnings | Unknown | ❌ Not found |

### 4.2 RPC Issues

#### ISSUE-BE-012: Missing RPC Definitions
**Severity:** High  
**Affected Files:** `src/lib/rpc.ts` (references non-existent RPCs)

**Description:** The RPC client code references RPCs that don't exist in migrations:

```typescript
// src/lib/rpc.ts
// These RPCs are called but NOT defined in any migration:
supabase.rpc('increment_currency', { amount: REFERRER_BONUS }),
supabase.rpc('increment_referrals', { ... }),
supabase.rpc('increment_earnings', { ... }),
```

**Why This Matters:** These calls will fail silently or cause runtime errors. The referral bonus system may not work.

**Potential Impact:** Referral system is broken. User confusion. Support burden.

**Risk if Ignored:** High - Core feature (referrals) doesn't work.

**Recommended Solution:** Create missing RPCs:

```sql
CREATE OR REPLACE FUNCTION increment_currency(p_telegram_id bigint, p_amount real)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Amount must be positive';
  END IF;
  
  UPDATE game_progress 
  SET currency = currency + p_amount,
      total_currency_earned = total_currency_earned + p_amount
  WHERE telegram_id = p_telegram_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Player not found';
  END IF;
END;
$$;

-- Similar for increment_referrals and increment_earnings
```

**Estimated Effort:** 4 hours - Create migrations for all missing RPCs with proper validation.

---

#### ISSUE-BE-013: `update_game_progress` Has No Validation
**Severity:** High  
**Affected Files:** Migration file for `update_game_progress` (if it exists)

**Description:** The `update_game_progress` RPC executes with elevated privileges but doesn't validate that the caller owns the `telegram_id`:

```sql
CREATE OR REPLACE FUNCTION update_game_progress(p_telegram_id bigint, ...)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO game_progress (...) VALUES (...)
  ON CONFLICT (telegram_id) DO UPDATE SET ...;
END;
$$;
```

**Why This Matters:** Anyone with access to the RPC (even through a compromised anon key) could modify any player's data.

**Potential Impact:** Account takeover. Currency exploit. Progress manipulation.

**Risk if Ignored:** High - Critical security vulnerability if RPC is exposed.

**Recommended Solution:** The edge functions should use this RPC, but with proper telegram_id validation inside. Ensure all callers are authenticated.

**Estimated Effort:** 2 hours - Audit all RPC callers and add telegram_id validation.

---

## 5. Error Handling

### 5.1 Error Handling Assessment

| Function | Try/Catch | Typed Errors | Retry Logic | Logging |
|----------|-----------|--------------|-------------|---------|
| `game-action` | ✅ | ❌ | ❌ | ⚠️ Basic |
| `perform-prestige` | ✅ | ❌ | ❌ | ⚠️ Basic |
| `claim-offline-income` | ✅ | ❌ | ❌ | ⚠️ Basic |
| `open-chest` | ✅ | ❌ | ❌ | ⚠️ Basic |
| `claim-ad-reward` | ✅ | ❌ | ❌ | ⚠️ Basic |
| `adsgram-reward` | ✅ | ❌ | ❌ | ⚠️ Basic |
| `telegram-payments` | ✅ | ❌ | ❌ | ⚠️ Basic |
| `save-game-state` | ✅ | ❌ | ❌ | ⚠️ Basic |

### 5.2 Error Handling Issues

#### ISSUE-BE-014: No Typed Error Classes
**Severity:** Medium  
**Affected Files:** All Edge Functions

**Description:** Errors are returned as generic strings with no structured error codes:

```typescript
// Current pattern
return jsonResponse({ error: "User not found" }, 404);
return jsonResponse({ error: "Database error" }, 500);
return jsonResponse({ error: "Internal server error" }, 500);

// No error codes, no structured details
```

**Why This Matters:** Client code can't programmatically handle specific errors. Internationalization is difficult. Analytics on error types are impossible.

**Potential Impact:** Poor error UX. Inability to debug patterns. Support burden.

**Risk if Ignored:** Medium - Works but not maintainable.

**Recommended Solution:**
```typescript
enum ErrorCode {
  USER_NOT_FOUND = "USER_NOT_FOUND",
  DATABASE_ERROR = "DATABASE_ERROR",
  VALIDATION_FAILED = "VALIDATION_FAILED",
  // ...
}

class AppError extends Error {
  constructor(
    public code: ErrorCode,
    message: string,
    public status: number = 500,
    public details?: unknown
  ) {
    super(message);
  }
}

// Usage
throw new AppError(ErrorCode.USER_NOT_FOUND, "Player not found", 404);
```

**Estimated Effort:** 6 hours - Create error classes and update all functions.

---

#### ISSUE-BE-015: No Retry Logic for External APIs
**Severity:** Medium  
**Affected Files:** `telegram-payments`, `push-notification`, `adsgram-reward`

**Description:** External API calls (Telegram Bot API) have no retry logic:

```typescript
// telegram-payments/index.ts - Lines 78-85
async function tgCall(method: string, body: Record<string, unknown>) {
  const res = await fetch(`${TG_API}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return res.json();
  // No retry on failure
}
```

**Why This Matters:** Transient network failures cause permanent failures. Users might lose purchased items or not receive notifications.

**Potential Impact:** Purchases not delivered. Notifications not sent. Poor user experience.

**Risk if Ignored:** Medium - Telegram API is reliable but not 100%. Failures affect revenue and engagement.

**Recommended Solution:**
```typescript
async function tgCallWithRetry(
  method: string, 
  body: Record<string, unknown>, 
  retries = 3
): Promise<unknown> {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(`${TG_API}/${method}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      
      if (res.ok) return res.json();
      
      // Don't retry client errors (4xx)
      if (res.status >= 400 && res.status < 500) {
        return res.json();
      }
      
      // Retry server errors (5xx)
      console.warn(`tgCall ${method} failed (attempt ${i+1}/${retries}): ${res.status}`);
    } catch (err) {
      console.warn(`tgCall ${method} error (attempt ${i+1}/${retries}):`, err);
    }
    
    if (i < retries - 1) {
      await new Promise(r => setTimeout(r, Math.pow(2, i) * 1000)); // Exponential backoff
    }
  }
  
  throw new Error(`tgCall ${method} failed after ${retries} attempts`);
}
```

**Estimated Effort:** 4 hours - Add retry logic to all external API calls.

---

## 6. Input Validation

### 6.1 Validation Assessment

| Function | telegram_id | Type Check | Range Check | HMAC |
|----------|-------------|------------|-------------|------|
| `game-action` | ✅ | ✅ | ✅ | ✅ |
| `perform-prestige` | ✅ | ✅ | ✅ | ✅ |
| `claim-offline-income` | ✅ | ✅ | ✅ | ✅ |
| `open-chest` | ✅ | ✅ | ✅ | ✅ |
| `claim-ad-reward` | ✅ | ✅ | ✅ | ✅ |
| `adsgram-reward` | ✅ | ✅ | ✅ | ✅ |
| `telegram-payments` | ⚠️ Partial | ⚠️ Partial | ⚠️ Partial | ⚠️ Webhook |
| `push-notification` | ✅ | ✅ | ✅ | ✅ |
| `track-session` | ✅ | ✅ | ✅ | ✅ |

### 6.2 Input Validation Issues

#### ISSUE-BE-016: Weak Input Validation in `telegram-payments`
**Severity:** High  
**Affected Files:** `supabase/functions/telegram-payments/index.ts` (lines 235-262)

**Description:** Webhook handling trusts incoming Telegram data without validation:

```typescript
// Lines 235-245 - No validation of incoming webhook data
if (body.message?.successful_payment) {
  const msg = body.message;
  const payment = msg.successful_payment;
  const telegramId: number = msg.from?.id;  // Could be undefined
  const payload: string = payment.invoice_payload ?? "";
  const chargeId: string = payment.telegram_payment_charge_id ?? "";
  
  if (!telegramId || !chargeId) {  // Only checks after extraction
    // ...
  }
}
```

**Why This Matters:** Webhook endpoints are prime attack vectors. While Telegram signs updates, improper validation can lead to processing fake payments.

**Potential Impact:** Fake payment processing if Telegram signature verification is bypassed.

**Risk if Ignored:** High - Webhook security is critical for payment processing.

**Recommended Solution:**
```typescript
// Validate webhook authenticity using Telegram's secret token
function validateTelegramWebhook(body: unknown, secret: string): boolean {
  // Telegram sends X-Telegram-Message-Signature header
  // Verify HMAC-SHA256 of request body
  // This is in addition to Telegram's own signature
}

if (body.message?.successful_payment) {
  // Add explicit type narrowing
  if (typeof body.message.from?.id !== 'number') {
    console.error('Invalid telegram ID type');
    return new Response("ok", { headers: corsHeaders });
  }
  
  const telegramId = body.message.from.id;
  // ... rest of processing
}
```

**Estimated Effort:** 4 hours - Add explicit type validation and webhook signature verification.

---

#### ISSUE-BE-017: No Input Sanitization for HTML Content
**Severity:** Medium  
**Affected Files:** `supabase/functions/push-notification/index.ts` (lines 48-49)

**Description:** User-provided notification content is rendered with HTML parsing:

```typescript
// Lines 48-49
const fullMessage = `<b>${title}</b>\n\n${message}`;
// Directly inserted into HTML, no sanitization
```

**Why This Matters:** If title or message contains malicious HTML/JavaScript, it could execute in the Telegram client (stored XSS via notification).

**Potential Impact:** Stored XSS in Telegram notifications. Account compromise.

**Risk if Ignored:** Medium - Lower risk since Telegram sanitizes messages, but defense-in-depth requires sanitization.

**Recommended Solution:**
```typescript
import DOMPurify from 'isomorphic-dompurify'; // Deno-compatible

function sanitizeHtml(input: string): string {
  return DOMPurify.sanitize(input, { ALLOWED_TAGS: ['b', 'i', 'a', 'code'] });
}

// Or use a simple allowlist for Telegram's HTML
function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

const fullMessage = `<b>${escapeHtml(title)}</b>\n\n${escapeHtml(message)}`;
```

**Estimated Effort:** 2 hours - Add HTML sanitization utility and apply to notification content.

---

#### ISSUE-BE-018: No Rate Limiting on Critical Endpoints
**Severity:** High  
**Affected Files:** All Edge Functions

**Description:** No rate limiting anywhere in the system. Critical endpoints can be hammered:

```typescript
// Any user can call these endpoints hundreds of times per second
// No protection against:
POST /open-chest      // Could farm artifacts
POST /claim-offline-income  // Could farm offline income
POST /claim-ad-reward  // Could farm ad rewards
```

**Why This Matters:** Without rate limiting, automated scripts can exploit the game economy. Cheaters gain unfair advantages.

**Potential Impact:** Economy inflation. Legitimate players disadvantaged. Revenue loss.

**Risk if Ignored:** High - Cheating will proliferate. Game balance destroyed.

**Recommended Solution:** Implement rate limiting via Supabase's built-in rate limiting or external service:

```typescript
// Option 1: Supabase-native (if available)
// Configure rate limits in supabase/config.toml

// Option 2: Upstash Redis
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, "60 s"), // 10 requests per minute per user
});

Deno.serve(async (req: Request) => {
  const identifier = req.headers.get("x-forwarded-for") ?? "anonymous";
  const { success, remaining } = await ratelimit.limit(identifier);
  
  if (!success) {
    return jsonResponse({ 
      error: "Rate limit exceeded", 
      retryAfter: remaining 
    }, 429);
  }
  // ... rest of handler
});
```

**Estimated Effort:** 8 hours - Set up Redis, implement rate limiting middleware, apply to all functions.

---

## 7. Response Formatting

### 7.1 Response Format Issues

#### ISSUE-BE-019: Inconsistent HTTP Status Codes
**Severity:** Medium  
**Affected Files:** All Edge Functions

**Description:** Different functions use different status codes for similar situations:

```typescript
// User not found - varies by function
return jsonResponse({ error: "User not found" }, 404);  // open-chest
return jsonResponse({ error: "Player not found" }, 404);  // perform-prestige
return jsonResponse({ success: false, error: "..." }, 429);  // claim-ad-reward (limit reached)

// Database error - varies
return jsonResponse({ error: "Database error" }, 500);  // Most functions
return jsonResponse({ error: "Failed to update balance" }, 500);  // claim-offline-income
```

**Why This Matters:** Inconsistent status codes make client error handling complex. Standard HTTP status semantics are violated.

**Potential Impact:** Client bugs. Poor error handling UX.

**Risk if Ignored:** Medium - Current clients handle it, but future integrations will struggle.

**Recommended Solution:** Standardize status codes:
- 400: Bad Request (validation errors)
- 401: Unauthorized (auth failures)
- 403: Forbidden (permission denied)
- 404: Not Found (resource doesn't exist)
- 409: Conflict (business logic rejection, e.g., "already claimed")
- 429: Too Many Requests (rate limited)
- 500: Internal Server Error (unexpected errors)

**Estimated Effort:** 4 hours - Audit all responses and standardize status codes.

---

#### ISSUE-BE-020: Missing Response Headers
**Severity:** Low  
**Affected Files:** All Edge Functions

**Description:** Responses lack standard security and caching headers:

```typescript
// Missing headers like:
Cache-Control: no-store
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
```

**Why This Matters:** Missing security headers increase attack surface. Cache headers prevent sensitive data caching.

**Potential Impact:** Information disclosure. Clickjacking vulnerabilities (low risk for API).

**Risk if Ignored:** Low - API responses aren't rendered in browsers directly.

**Recommended Solution:**
```typescript
const securityHeaders = {
  "Cache-Control": "no-store, no-cache, must-revalidate",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-XSS-Protection": "1; mode=block",
};

const corsHeaders = { /* ... */ };

return new Response(JSON.stringify(data), {
  headers: {
    ...securityHeaders,
    ...corsHeaders,
    "Content-Type": "application/json"
  }
});
```

**Estimated Effort:** 2 hours - Create shared security headers and apply to all functions.

---

## 8. Security Considerations

### 8.1 Security Assessment

| Aspect | Status | Notes |
|--------|--------|-------|
| Authentication | ✅ Good | HMAC-SHA256 properly implemented |
| Authorization | ⚠️ Partial | User ID validated, but no role-based access |
| Data Validation | ⚠️ Partial | Missing sanitization for HTML |
| Rate Limiting | ❌ Missing | No protection against abuse |
| Secrets Management | ✅ Good | Environment variables used |
| Logging/Auditing | ⚠️ Partial | Basic logs, no structured audit trail |
| Payment Security | ✅ Good | Idempotency and HMAC validation |
| RLS Policies | ⚠️ Review Needed | Per database audit |

### 8.2 Security Issues

#### ISSUE-BE-021: No Security Audit Trail
**Severity:** Medium  
**Affected Files:** All Edge Functions

**Description:** No structured logging for security-relevant events:

```typescript
// Current: basic console.log
console.log(`Chest opened: user=${telegram_id}, epoch=${epoch_id}, type=${chest_type}, rewards=${rewards.length}`);

// Missing: structured audit log
// - Who accessed what
// - Failed authentication attempts
// - Suspicious activity patterns
```

**Why This Matters:** Security incidents are difficult to investigate without audit trails. Compliance requirements may mandate logging.

**Potential Impact:** Delayed incident response. Inability to prove compliance.

**Risk if Ignored:** Medium - Works short-term but creates liability.

**Recommended Solution:**
```typescript
// Structured audit log
console.log(JSON.stringify({
  level: "audit",
  timestamp: new Date().toISOString(),
  requestId,
  event: "CHEST_OPENED",
  actor: { telegramId, ip: req.headers.get("x-forwarded-for") },
  resource: { type: "chest", chestType, epoch },
  result: "SUCCESS",
  metadata: { rewardsCount: rewards.length }
}));

// Failed auth audit
console.log(JSON.stringify({
  level: "warn",
  timestamp: new Date().toISOString(),
  event: "AUTH_FAILED",
  actor: { ip: req.headers.get("x-forwarded-for") },
  reason: "HMAC mismatch",
  initDataHash: hash.substring(0, 8) // Don't log full initData
}));
```

**Estimated Effort:** 6 hours - Implement structured audit logging across all functions.

---

#### ISSUE-BE-022: Telemetry Data Exposure
**Severity:** Low  
**Affected Files:** `supabase/functions/track-session/index.ts`

**Description:** Session tracking could expose sensitive patterns:

```typescript
// Line 78-99 - Session data includes potentially sensitive info
const { data: openSessions } = await supabase
  .from("player_sessions")
  .select("id, session_started_at, last_activity_at, total_session_seconds")
  .eq("telegram_id", telegram_id);
```

**Why This Matters:** Session patterns could reveal user behavior, peak usage times, etc.

**Potential Impact:** Privacy concerns. GDPR implications.

**Risk if Ignored:** Low - Current data is game-related, not personal.

**Recommended Solution:**
- Add data retention policy (delete sessions older than 90 days)
- Anonymize analytics data
- Add consent mechanism for session tracking

**Estimated Effort:** 2 hours - Add cleanup job and update privacy policy.

---

#### ISSUE-BE-023: No Environment Variable Validation
**Severity:** Medium  
**Affected Files:** All Edge Functions

**Description:** Environment variables are used with fallback empty strings:

```typescript
// Current pattern
const BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN") ?? "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";

// Problem: Empty string is falsy but valid in some contexts
if (!BOT_TOKEN) { /* works */ }
// vs
if (BOT_TOKEN === "") { /* different check */ }
```

**Why This Matters:** Silent configuration failures are hard to debug. Functions may run in misconfigured states.

**Potential Impact:** Unexpected behavior in production. Difficult debugging.

**Risk if Ignored:** Medium - Current approach works but isn't robust.

**Recommended Solution:**
```typescript
function requireEnv(name: string): string {
  const value = Deno.env.get(name);
  if (!value) {
    throw new Error(`${name} environment variable is required`);
  }
  return value;
}

// Usage
const BOT_TOKEN = requireEnv("TELEGRAM_BOT_TOKEN");
const SUPABASE_URL = requireEnv("SUPABASE_URL");
const SUPABASE_SERVICE_KEY = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
```

**Estimated Effort:** 2 hours - Create validation helper and update all functions.

---

## 9. Summary and Prioritization

### 9.1 Issue Summary by Severity

| Severity | Count | Issues |
|----------|-------|--------|
| **Critical** | 0 | None identified |
| **High** | 8 | BE-009, BE-010, BE-012, BE-013, BE-016, BE-018, BE-019 (partial) |
| **Medium** | 10 | BE-001, BE-002, BE-003, BE-005, BE-006, BE-011, BE-014, BE-015, BE-017, BE-021, BE-023 |
| **Low** | 4 | BE-004, BE-007, BE-008, BE-019, BE-020, BE-022 |

### 9.2 Recommended Priority Order

#### Phase 1: Critical Security (Week 1)
1. **BE-018**: Add rate limiting to all game-mutating endpoints
2. **BE-012**: Create missing RPC definitions for referral system
3. **BE-016**: Strengthen webhook validation in telegram-payments
4. **BE-009**: Fix race condition in chest opening with atomic operations

#### Phase 2: Data Integrity (Week 2)
5. **BE-010**: Move artifact definitions to database
6. **BE-013**: Audit and secure update_game_progress RPC
7. **BE-006**: Standardize response format across all functions

#### Phase 3: Maintainability (Week 3-4)
8. **BE-001**: Remove duplicate HMAC validation code
9. **BE-014**: Implement typed error classes
10. **BE-015**: Add retry logic for external APIs
11. **BE-005**: Implement API versioning strategy

#### Phase 4: Operations (Week 5+)
12. **BE-003**: Add request correlation IDs
13. **BE-021**: Implement security audit trail
14. **BE-002**: Restrict CORS to Telegram domains
15. **BE-004**: Create health check endpoint

### 9.3 Estimated Total Effort

| Phase | Hours | Description |
|-------|-------|-------------|
| Phase 1 | 24 | Critical security fixes |
| Phase 2 | 20 | Data integrity improvements |
| Phase 3 | 30 | Code quality and maintainability |
| Phase 4 | 16 | Operational readiness |
| **Total** | **90** | ~2-3 weeks of development |

---

## 10. Files Reviewed

### Edge Functions
- `supabase/functions/_shared/validate-init-data.ts`
- `supabase/functions/adsgram-reward/index.ts`
- `supabase/functions/apply-referral-bonus/index.ts`
- `supabase/functions/claim-ad-reward/index.ts`
- `supabase/functions/claim-offline-income/index.ts`
- `supabase/functions/fetch-active-boosters/index.ts`
- `supabase/functions/game-action/index.ts`
- `supabase/functions/get-leaderboard/index.ts`
- `supabase/functions/get-user-rank/index.ts`
- `supabase/functions/load-game-state/index.ts`
- `supabase/functions/open-chest/index.ts`
- `supabase/functions/perform-prestige/index.ts`
- `supabase/functions/push-notification/index.ts`
- `supabase/functions/save-game-state/index.ts`
- `supabase/functions/telegram-payments/index.ts`
- `supabase/functions/track-session/index.ts`
- `supabase/functions/validate-init-data/index.ts`

### Client Code
- `src/lib/rpc.ts`
- `src/lib/supabase.ts`

### Reference Documents
- `07_BACKEND_AUDIT.md`
- `20_SUPABASE_AUDIT.md`

---

## Appendix A: Response Format Standard

### Standard Success Response
```typescript
interface SuccessResponse<T> {
  success: true;
  data: T;
  meta: {
    requestId: string;
    timestamp: string;
    version: string;
  };
}
```

### Standard Error Response
```typescript
interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta: {
    requestId: string;
    timestamp: string;
  };
}
```

### Error Codes
```typescript
enum ErrorCode {
  // Authentication
  MISSING_INIT_DATA = "MISSING_INIT_DATA",
  INVALID_INIT_DATA = "INVALID_INIT_DATA",
  HMAC_MISMATCH = "HMAC_MISMATCH",
  AUTH_DATE_EXPIRED = "AUTH_DATE_EXPIRED",
  USER_ID_MISMATCH = "USER_ID_MISMATCH",
  
  // Validation
  INVALID_PARAMETER = "INVALID_PARAMETER",
  MISSING_PARAMETER = "MISSING_PARAMETER",
  
  // Resources
  USER_NOT_FOUND = "USER_NOT_FOUND",
  RESOURCE_NOT_FOUND = "RESOURCE_NOT_FOUND",
  
  // Business Logic
  INSUFFICIENT_FUNDS = "INSUFFICIENT_FUNDS",
  ALREADY_CLAIMED = "ALREADY_CLAIMED",
  DAILY_LIMIT_REACHED = "DAILY_LIMIT_REACHED",
  PRESTIGE_REQUIREMENT_NOT_MET = "PRESTIGE_REQUIREMENT_NOT_MET",
  
  // System
  DATABASE_ERROR = "DATABASE_ERROR",
  EXTERNAL_API_ERROR = "EXTERNAL_API_ERROR",
  INTERNAL_ERROR = "INTERNAL_ERROR",
  RATE_LIMITED = "RATE_LIMITED"
}
```

---

**End of Backend Review**

*Next: Review integration with frontend components and client-side RPC calls*
