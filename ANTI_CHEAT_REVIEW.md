# 🔒 COMPREHENSIVE ANTI-CHEAT REVIEW REPORT
## Virtual Museum Tapper Game v1.6.6
### Classification: CONFIDENTIAL — INTERNAL USE ONLY

**Review Date:** 2026-07-02  
**Review Standard:** AAA Competitive Game Studio Anti-Cheat (ACS-2026)  
**Security Model:** Defense-in-Depth with Server-Authoritative Core

---

## EXECUTIVE SUMMARY

| Category | Status | Risk Level | Issues Found |
|----------|--------|------------|--------------|
| **Client-Side Validation** | ⚠️ PARTIAL | MEDIUM | State manipulation vectors exist |
| **Server-Side Validation** | ✅ STRONG | LOW | HMAC auth properly implemented |
| **Cheat Detection Patterns** | ❌ MISSING | HIGH | No anomaly detection |
| **Bot Prevention** | ❌ MISSING | HIGH | Tap rate unvalidated |
| **Exploit Mitigation** | ⚠️ PARTIAL | MEDIUM | Some race conditions fixed |
| **Game State Integrity** | ⚠️ PARTIAL | MEDIUM | Client-side computation risk |
| **Offline Reward Validation** | ✅ STRONG | LOW | Atomic swap with locks |
| **Ad Reward Validation** | ✅ STRONG | LOW | Server-side verification |

**Overall Security Posture:** 🟡 MODERATE  
**Production Readiness:** ⚠️ NOT RECOMMENDED without critical fixes

---

## SECTION 1: CRITICAL VULNERABILITIES (IMMEDIATE ACTION REQUIRED)

### ISSUE-001: Client-Side State Manipulation via localStorage

| Attribute | Value |
|-----------|-------|
| **Title** | Client-State Persistence Without Integrity Validation |
| **Severity** | 🔴 CRITICAL |
| **CVSS Score** | 8.5 |
| **Affects** | `src/lib/storage.ts`, `src/hooks/useGame.ts` |
| **Risk if Ignored** | Complete economy destruction, leaderboard manipulation |

#### Description
The `saveRemoteState()` function sends the entire client state to the server via `rpcSaveGameState()` which ultimately uses the `save-game-state` edge function. While HMAC validation is applied, the **server accepts whatever state the client sends** without validation against delta changes or sanity checks.

An attacker can:
1. Modify `localStorage.ukraine_tap_game_state` to set `currency: 999999999`, `xp: 999999999`, `level: 999`
2. The state is serialized and sent via `rpcSaveGameState()`
3. The edge function performs HMAC validation but **accepts the payload as-is**
4. Values are written directly to the database

```typescript
// supabase/functions/save-game-state/index.ts:80-85
const { error } = await supabaseAdmin
  .from('game_progress')
  .upsert(
    { ...data, telegram_id: data.telegram_id },
    { onConflict: 'telegram_id' }
  );
```

#### Why This Matters
This is a **server-authoritative architecture violation**. The server should compute XP/currency from validated game events, not accept client-submitted values.

#### Potential Impact
- Infinite currency (all purchases free)
- Instant max level (bypass all progression)
- Leaderboard domination
- Complete economy destruction

#### Recommended Solution
1. **Option A (Recommended):** Implement server-authoritative state
   - Client sends events (tap, purchase, chest_open), server computes new state
   - Server maintains authoritative game state, client is display-only
   
2. **Option B (Interim):** Add sanity validation
   - Max level cap: 999 (already exists but check)
   - Max currency: Set reasonable upper bound (e.g., `MAX_CURRENCY = 1e15`)
   - Rate-of-change validation: Reject if delta exceeds expected max
   - Server-side recomputation: Validate submitted values against server-computed

```typescript
// Example: Add validation in save-game-state
const MAX_LEVEL = 999;
const MAX_CURRENCY = 1e15;
const MAX_XP = 1e18;

function validateState(data: SaveGameStateRequest['data']): { valid: boolean; error?: string } {
  if (data.level < 1 || data.level > MAX_LEVEL) {
    return { valid: false, error: 'Invalid level' };
  }
  if (data.currency < 0 || data.currency > MAX_CURRENCY) {
    return { valid: false, error: 'Invalid currency' };
  }
  if (data.xp < 0 || data.xp > MAX_XP) {
    return { valid: false, error: 'Invalid XP' };
  }
  // Add rate-of-change validation
  // ...
  return { valid: true };
}
```

#### Implementation Effort
- **Estimated Time:** 3-5 days
- **Complexity:** HIGH
- **Responsible Agent:** Backend Engineer

---

### ISSUE-002: Taps Computed Entirely Client-Side

| Attribute | Value |
|-----------|-------|
| **Title** | Server-Trusting-Client Tap System |
| **Severity** | 🔴 CRITICAL |
| **CVSS Score** | 8.0 |
| **Affects** | `src/hooks/useGame.ts` (lines 517-571) |
| **Risk if Ignored** | Automated botting, infinite XP, progression bypass |

#### Description
The `tap()` function in `useGame.ts` operates entirely client-side:

```typescript
// src/hooks/useGame.ts:517-571
const tap = useCallback((x: number, y: number) => {
  setState(prev => {
    const baseTap = Math.max(1, Math.round(
      prev.tapPower * artXpMult * boostXpMult * energyMult * prestigeXpBonus
    ));
    // ...
    return { ...prev, xp: prev.xp + value, totalXp: prev.totalXp + value };
  });
}, []);
```

There is **NO server call** for tap validation. The XP accumulates locally and is periodically saved (every 15 seconds) without server verification of tap count or timing.

#### Why This Matters
Attackers can:
1. Write a script to call `tap()` at 1000+ taps/second
2. Modify multipliers in memory before tapping
3. Forge tap events that never happened
4. Bot the game 24/7 without detection

#### Potential Impact
- Automated farming bots dominate leaderboard
- Economy inflation from unearned XP
- Unfair advantage over legitimate players
- Revenue loss from reduced engagement

#### Recommended Solution
Implement **server-validated tap batching**:

```typescript
// Client sends tap batches periodically
interface TapBatch {
  init_data: string;
  tap_count: number;
  tap_power: number;
  multipliers: {
    artXpMult: number;
    boostXpMult: number;
    energyMult: number;
    prestigeXpBonus: number;
  };
  timestamp: number;
}

// Server validates:
// 1. HMAC authentication
// 2. Tap rate limit (< 10 taps/second)
// 3. Timestamp sanity (not in future)
// 4. Multiplier values (must match active boosters)
// 5. Computes XP and updates DB directly
```

#### Implementation Effort
- **Estimated Time:** 4-6 days
- **Complexity:** HIGH
- **Responsible Agent:** Full-Stack Engineer

---

### ISSUE-003: Buy Generator Has No Server Validation

| Attribute | Value |
|-----------|-------|
| **Title** | Generator Purchase Client-Validated |
| **Severity** | 🔴 CRITICAL |
| **CVSS Score** | 7.5 |
| **Affects** | `supabase/functions/game-action/index.ts` (lines 62-79) |
| **Risk if Ignored** | Free generators, currency manipulation |

#### Description
The `buy_generator` handler in `game-action` is **disabled with a placeholder error**:

```typescript
// supabase/functions/game-action/index.ts:78
return { ok: false, error: "buy_generator: cost validation requires server-side generator definitions — coming soon" };
```

This means generator purchases are handled **entirely client-side** in `buyGenerator()` (useGame.ts:573-599), which:
1. Reads current currency from client state
2. Computes cost client-side
3. Updates client state
4. Sends state to server (which accepts it)

```typescript
// src/hooks/useGame.ts:573-599
const buyGenerator = useCallback((generatorId: string) => {
  const cost = getGeneratorCost(generator, currentLevel);
  if (state.currency < cost) return false;  // Client check only
  // Updates local state, server accepts
```

#### Why This Matters
An attacker can:
1. Set `currency: 999999999` via localStorage
2. Buy unlimited generators
3. Server accepts the manipulated state

#### Recommended Solution
Implement server-authoritative purchase:

```typescript
// supabase/functions/game-action/index.ts
async function buyGenerator(supabase, telegramId, generatorId, expectedCost) {
  // 1. Fetch server-side generator definition
  const generators = await getGeneratorDefinitions(); // Shared config
  const generator = generators.find(g => g.id === generatorId);
  
  // 2. Fetch player's owned generators and currency
  const { data: player } = await supabase
    .from('game_progress')
    .select('currency, owned_generators')
    .eq('telegram_id', telegramId).single();
  
  // 3. Compute cost server-side
  const currentLevel = player.owned_generators?.find(g => g.generatorId === generatorId)?.level || 0;
  const actualCost = computeGeneratorCost(generator, currentLevel);
  
  // 4. Validate cost matches (prevent client manipulation)
  if (expectedCost !== actualCost) {
    return { ok: false, error: 'Cost mismatch' };
  }
  
  // 5. Validate balance
  if (player.currency < actualCost) {
    return { ok: false, error: 'Insufficient currency' };
  }
  
  // 6. Deduct and update atomically
  // ...
}
```

#### Implementation Effort
- **Estimated Time:** 2-3 days
- **Complexity:** MEDIUM
- **Responsible Agent:** Backend Engineer

---

## SECTION 2: HIGH SEVERITY ISSUES (WEEK 1 SPRINT)

### ISSUE-004: No Anomaly Detection System

| Attribute | Value |
|-----------|-------|
| **Title** | Missing Anti-Cheat Detection Layer |
| **Severity** | 🟠 HIGH |
| **CVSS Score** | 6.5 |
| **Affects** | All game systems |
| **Risk if Ignored** | Undetected cheating, trust erosion |

#### Description
There is **no anomaly detection** anywhere in the codebase. The system cannot detect:
- Unusual tap rates (botting)
- Abnormal session lengths
- Suspicious currency accumulation
- Geographic anomalies (impossible travel)
- Time manipulation exploits

#### Why This Matters
Even with server validation, some attacks may slip through. Without detection:
- Cheaters go undetected
- Legitimate players lose trust
- No data for cheat pattern analysis
- Cannot respond to new attack vectors

#### Recommended Solution
Implement a detection framework:

```typescript
// supabase/functions/detect-anomaly/index.ts
interface AnomalyEvent {
  telegram_id: number;
  event_type: 'tap_batch' | 'purchase' | 'offline_claim' | 'session';
  metrics: Record<string, number>;
  timestamp: number;
}

interface AnomalyResult {
  is_anomaly: boolean;
  risk_score: number; // 0-100
  signals: string[];
}

async function analyzeAnomaly(event: AnomalyEvent): Promise<AnomalyResult> {
  const signals: string[] = [];
  let riskScore = 0;
  
  // Tap rate analysis
  if (event.event_type === 'tap_batch') {
    const tapsPerSecond = event.metrics.taps / event.metrics.duration;
    if (tapsPerSecond > 10) {
      signals.push('EXCESSIVE_TAP_RATE');
      riskScore += 50;
    }
    if (tapsPerSecond > 5) {
      signals.push('HIGH_TAP_RATE');
      riskScore += 20;
    }
  }
  
  // Offline claim analysis
  if (event.event_type === 'offline_claim') {
    if (event.metrics.offline_seconds > 8 * 3600) {
      signals.push('MAX_OFFLINE_CLAIMED');
      riskScore += 15;
    }
  }
  
  return {
    is_anomaly: riskScore >= 30,
    risk_score: riskScore,
    signals
  };
}
```

#### Implementation Effort
- **Estimated Time:** 3-4 days
- **Complexity:** MEDIUM
- **Responsible Agent:** Security Engineer

---

### ISSUE-005: Prestige Without Epoch Validation

| Attribute | Value |
|-----------|-------|
| **Title** | Client-Side Epoch Check Before Prestige |
| **Severity** | 🟠 HIGH |
| **CVSS Score** | 6.0 |
| **Affects** | `src/hooks/useGame.ts`, `supabase/functions/perform-prestige/index.ts` |
| **Risk if Ignored** | Premature prestige, game-breaking exploit |

#### Description
The client checks `canPrestige` locally:

```typescript
// src/hooks/useGame.ts:271
const canPrestige = state.level >= 950 && state.epochId === 'independence';
```

But the server only checks level:

```typescript
// supabase/functions/perform-prestige/index.ts:138-141
const prestigeCheck = canPrestige(player.level as number);
if (!prestigeCheck.canPrestige) {
  return jsonResponse({ error: prestigeCheck.reason || "Cannot prestige" }, 400);
}
```

**Missing:** Server-side epoch validation.

#### Why This Matters
While the client prevents this, a malicious user could:
1. Modify client to bypass epoch check
2. Directly call `perform-prestige` with forged `init_data`
3. Force prestige without reaching independence epoch

#### Recommended Solution
Add epoch validation to server:

```typescript
// supabase/functions/perform-prestige/index.ts
const REQUIRED_EPOCH = 'independence';

async function canPrestigeServer(
  level: number,
  epochId: string,
  unlockedEpochs: string[]
): Promise<{ canPrestige: boolean; reason?: string }> {
  if (level < 950) {
    return { canPrestige: false, reason: `Need level 950 to prestige. Current: ${level}` };
  }
  if (epochId !== REQUIRED_EPOCH) {
    return { canPrestige: false, reason: `Must be in ${REQUIRED_EPOCH} epoch to prestige` };
  }
  if (!unlockedEpochs.includes(REQUIRED_EPOCH)) {
    return { canPrestige: false, reason: 'Independence epoch not unlocked' };
  }
  return { canPrestige: true };
}
```

#### Implementation Effort
- **Estimated Time:** 0.5 day
- **Complexity:** LOW
- **Responsible Agent:** Backend Engineer

---

### ISSUE-006: Passive XP Computed Client-Side

| Attribute | Value |
|-----------|-------|
| **Title** | Server-Trusting-Client Passive Income |
| **Severity** | 🟠 HIGH |
| **CVSS Score** | 6.5 |
| **Affects** | `src/hooks/useGame.ts` (tick system) |
| **Risk if Ignored** | Passive income manipulation |

#### Description
Passive XP accumulation happens entirely in the browser tick loop:

```typescript
// src/hooks/useGame.ts:456-514
tickRef.current = window.setInterval(() => {
  setState(prev => {
    const effectivePassiveXp = basePassiveXp * passMult * boostXpMult * /* ... */;
    const xpGainThisTick = effectivePassiveXp / 10; // 100ms tick = 10/sec
    // ...
  });
}, 100);
```

The `passiveXpPerSecond` value is:
1. Computed client-side from owned generators
2. Periodically sent to server via `saveRemoteState()`
3. Accepted by server without re-validation

#### Why This Matters
An attacker can:
1. Modify generator levels in memory
2. Add fake generators
3. Increase `passiveXpPerSecond` multiplier
4. Accumulate XP without playing

#### Recommended Solution
Server-authoritative passive income:

```typescript
// Option: Server computes and credits
// OR: Validate passive income on save
async function validatePassiveIncome(
  storedPassiveXp: number,
  ownedGenerators: OwnedGenerator[],
  boosters: ActiveBoosters,
  lastOnlineAt: Date
): Promise<{ valid: boolean; actualPassiveXp: number }> {
  // Recompute server-side
  const baseProduction = calculateServerProduction(ownedGenerators);
  const multipliers = getServerMultipliers(boosters);
  const expected = baseProduction * multipliers.total;
  
  // Allow small variance for timing differences
  const variance = Math.abs(storedPassiveXp - expected) / expected;
  if (variance > 0.01) { // >1% difference
    return { valid: false, actualPassiveXp: expected };
  }
  return { valid: true, actualPassiveXp: expected };
}
```

#### Implementation Effort
- **Estimated Time:** 2-3 days
- **Complexity:** MEDIUM
- **Responsible Agent:** Backend Engineer

---

### ISSUE-007: Missing Rate Limiting on Edge Functions

| Attribute | Value |
|-----------|-------|
| **Title** | No Request Rate Limiting |
| **Severity** | 🟠 HIGH |
| **CVSS Score** | 5.5 |
| **Affects** | All edge functions |
| **Risk if Ignored** | API abuse, farming, DoS |

#### Description
No edge function implements rate limiting. Attackers can spam:
- `claim-offline-income` - unlimited offline claims
- `claim-ad-reward` - bypass daily limits
- `save-game-state` - storage exhaustion
- `game-action` - rapid fire actions

#### Why This Matters
Without rate limiting:
- Bot networks can overwhelm the system
- Daily limits can be circumvented via rapid requests
- Storage costs increase dramatically
- Service degradation for legitimate users

#### Recommended Solution
Implement rate limiting middleware:

```typescript
// supabase/functions/_shared/rate-limit.ts
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMITS = {
  'claim-offline-income': 5, // 5 claims per minute
  'claim-ad-reward': 10,
  'save-game-state': 60, // 1 per second
  'game-action': 120, // 2 per second
  'default': 60,
};

async function checkRateLimit(
  telegramId: number,
  functionName: string
): Promise<{ allowed: boolean; retryAfter?: number }> {
  const key = `ratelimit:${functionName}:${telegramId}`;
  const limit = RATE_LIMITS[functionName] || RATE_LIMITS.default;
  
  const { data } = await supabase
    .from('rate_limits')
    .select('count, window_start')
    .eq('key', key)
    .single();
  
  const now = Date.now();
  const windowStart = data?.window_start || now;
  
  if (now - windowStart > RATE_LIMIT_WINDOW_MS) {
    // New window
    await supabase.from('rate_limits').upsert({
      key, count: 1, window_start: now
    });
    return { allowed: true };
  }
  
  if (data?.count >= limit) {
    return { allowed: false, retryAfter: RATE_LIMIT_WINDOW_MS - (now - windowStart) };
  }
  
  await supabase.from('rate_limits')
    .update({ count: data.count + 1 })
    .eq('key', key);
    
  return { allowed: true };
}
```

#### Implementation Effort
- **Estimated Time:** 1-2 days
- **Complexity:** MEDIUM
- **Responsible Agent:** Backend Engineer

---

## SECTION 3: MEDIUM SEVERITY ISSUES (WEEK 2 SPRINT)

### ISSUE-008: CORS Allows All Origins

| Attribute | Value |
|-----------|-------|
| **Title** | Overly Permissive CORS Configuration |
| **Severity** | 🟡 MODERATE |
| **CVSS Score** | 5.0 |
| **Affects** | All edge functions |

#### Description
All edge functions use `Access-Control-Allow-Origin: *`:

```typescript
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  // ...
};
```

#### Why This Matters
While HMAC validation prevents unauthorized access, overly permissive CORS:
- Allows any website to make requests (CSRF risk)
- Makes it easier to probe for vulnerabilities
- Violates security best practices

#### Recommended Solution
Restrict to Telegram domains:

```typescript
const ALLOWED_ORIGINS = [
  'https://t.me',
  'https://*.t.me',
  'https://web.telegram.org',
];

const corsHeaders = {
  "Access-Control-Allow-Origin": ALLOWED_ORIGINS.join(', '),
  // ...
};
```

#### Implementation Effort
- **Estimated Time:** 0.5 day
- **Complexity:** LOW
- **Responsible Agent:** Backend Engineer

---

### ISSUE-009: Session Ad Timer Client-Side

| Attribute | Value |
|-----------|-------|
| **Title** | Client-Controlled Session Ad Trigger |
| **Severity** | 🟡 MODERATE |
| **CVSS Score** | 4.5 |
| **Affects** | `src/components/AdSystem.tsx` |

#### Description
The session ad trigger uses `Date.now()` and `sessionStartAt` from client state:

```typescript
// src/components/AdSystem.tsx:416-419
const lastAd = lastSessionAdAt || sessionStartAt;
const timeSinceLastAd = Date.now() - lastAd;
if (timeSinceLastAd >= SESSION_AD_INTERVAL_MS) {
  setShouldShowSessionAd(true);
}
```

An attacker can:
1. Modify `sessionStartAt` to an old timestamp
2. Immediately trigger session ads

#### Why This Matters
- Bypasses 20-minute wait between session ads
- Reduces ad revenue
- Unfair advantage

#### Recommended Solution
Move session tracking server-side:

```typescript
// supabase/functions/track-session/index.ts already exists
// Enhance to track session ad timestamps
const { data } = await supabase
  .from('game_progress')
  .select('last_session_ad_at')
  .eq('telegram_id', telegramId)
  .single();

const SESSION_AD_INTERVAL_MS = 20 * 60 * 1000;
if (Date.now() - (data.last_session_ad_at || 0) < SESSION_AD_INTERVAL_MS) {
  return { can_show_ad: false, wait_seconds: /* ... */ };
}
```

#### Implementation Effort
- **Estimated Time:** 1 day
- **Complexity:** MEDIUM
- **Responsible Agent:** Full-Stack Engineer

---

### ISSUE-010: Daily Task Counters Client-Side

| Attribute | Value |
|-----------|-------|
| **Title** | Daily Task Progress Not Server-Validated |
| **Severity** | 🟡 MODERATE |
| **CVSS Score** | 4.0 |
| **Affects** | `src/hooks/useGame.ts` |

#### Description
Task progress counters are tracked client-side:

```typescript
// src/hooks/useGame.ts:543-554
const updatedTasks = tasks ? {
  ...tasks,
  counters: {
    ...tasks.counters,
    tap: tasks.counters.tap + 1,
    earn_xp: tasks.counters.earn_xp + value,
  },
} : tasks;
```

Server trusts submitted task completion without validation.

#### Why This Matters
Attacker can:
1. Set `tap: 100000` in localStorage
2. Claim task rewards immediately
3. Server accepts the inflated counters

#### Recommended Solution
Server-side task tracking for sensitive counters:

```typescript
// supabase/functions/game-action/index.ts
case "record_tap":
  // Server increments tap counter
  await supabase.rpc('increment_task_counter', {
    telegram_id: telegramId,
    counter: 'tap',
    increment: 1
  });
  break;
```

#### Implementation Effort
- **Estimated Time:** 2 days
- **Complexity:** MEDIUM
- **Responsible Agent:** Backend Engineer

---

## SECTION 4: LOW SEVERITY ISSUES (BACKLOG)

### ISSUE-011: No Transaction Isolation for Game State

| Attribute | Value |
|-----------|-------|
| **Title** | Race Conditions in Multi-Step Operations |
| **Severity** | 🟢 LOW |
| **CVSS Score** | 3.0 |
| **Affects** | Multiple edge functions |

#### Description
Some operations perform read-modify-write without proper locking:

```typescript
// Example: Non-atomic purchase
const { data: player } = await supabase
  .from('game_progress')
  .select('currency');
// ... time passes, another request modifies currency
await supabase
  .from('game_progress')
  .update({ currency: player.currency - cost }); // Lost update!
```

#### Recommended Solution
Use `SELECT FOR UPDATE` or atomic operations:

```typescript
// Atomic increment/decrement
await supabase.rpc('deduct_currency', {
  p_telegram_id: telegramId,
  p_amount: cost
});
```

#### Implementation Effort
- **Estimated Time:** 2 days
- **Complexity:** MEDIUM

---

### ISSUE-012: Hardcoded Ad Rewards in Client Code

| Attribute | Value |
|-----------|-------|
| **Title** | Reward Values Visible to Clients |
| **Severity** | 🟢 LOW |
| **CVSS Score** | 2.0 |
| **Affects** | `src/services/adsgram.ts`, `src/components/AdSystem.tsx` |

#### Description
Reward values are hardcoded client-side:
- `XP_BOOST_MULTIPLIER = 3`
- `XP_BOOST_DURATION_MS = 30 * 60 * 1000`
- `CURRENCY_REWARD = 100`

#### Why This Matters
While server validates rewards, knowing exact values helps attackers:
- Know when boosts expire
- Understand reward structures
- Craft more targeted attacks

#### Recommended Solution
Move reward configuration to server constants, client reads display values only.

#### Implementation Effort
- **Estimated Time:** 1 day
- **Complexity:** LOW

---

## SECTION 5: POSITIVE SECURITY FINDINGS

The following security measures are **correctly implemented**:

### ✅ init_data HMAC Validation
All sensitive edge functions properly validate Telegram init_data:
- `claim-ad-reward` ✅
- `claim-offline-income` ✅
- `perform-prestige` ✅
- `open-chest` ✅
- `save-game-state` ✅
- `load-game-state` ✅
- `game-action` ✅
- `apply-referral-bonus` ✅

### ✅ Atomic Offline Claim with FOR UPDATE Lock
Migration `018_swap_last_online_at_lock_fix.sql` correctly implements row locking:

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

### ✅ RLS Policies Properly Configured
Migration `020_fix_rls_policies.sql` correctly:
- Drops broken anon/authenticated policies
- Restricts access to service_role only
- Creates public_leaderboard view for leaderboard display

### ✅ AdsGram Secret Properly Guarded
The AdsGram secret is in edge function environment variables, not client code.

### ✅ Server-Side Chest RNG
`open-chest` function rolls rarities server-side, preventing client RNG manipulation.

---

## SECTION 6: THREAT MODEL ANALYSIS

### TRUST BOUNDARY DIAGRAM

```
┌─────────────────────────────────────────────────────────────┐
│                     TELEGRAM PLATFORM                        │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │   Browser    │───▶│  DevTools    │───▶│   Proxy      │  │
│  │  (Client)    │    │  (Attacker)  │    │  Interceptor │  │
│  └──────┬───────┘    └──────────────┘    └──────────────┘  │
└─────────┼───────────────────────────────────────────────────┘
          │ init_data (HMAC signed)
          ▼
┌─────────────────────────────────────────────────────────────┐
│                   SUPABASE EDGE FUNCTIONS                    │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │ Validated    │    │  Rate Limit  │    │  Anomaly     │  │
│  │ Functions    │───▶│  Middleware  │───▶│  Detection   │  │
│  └──────┬───────┘    └──────────────┘    └──────────────┘  │
│         │                                               ▲   │
│         ▼                                               │   │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐ │
│  │  PostgreSQL  │◀───│    RLS       │◀───│  Audit Log   │ │
│  │  Database    │    │  Policies    │    │              │ │
│  └──────────────┘    └──────────────┘    └──────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### ATTACK VECTORS

| Vector | Likelihood | Impact | Mitigation Status |
|--------|------------|--------|-------------------|
| localStorage manipulation | HIGH | CRITICAL | ⚠️ PARTIAL |
| API request forging | MEDIUM | CRITICAL | ✅ MITIGATED |
| Bot automation | HIGH | HIGH | ❌ MISSING |
| Race condition exploits | LOW | HIGH | ✅ MITIGATED |
| Clock manipulation | MEDIUM | MEDIUM | ✅ MITIGATED |
| Tab duplication | MEDIUM | LOW | ✅ MITIGATED |

---

## SECTION 7: REMEDIATION ROADMAP

### PHASE 1: HOTFIX (Week 1)
| Priority | Issue | Action | Effort |
|----------|-------|--------|--------|
| 1 | ISSUE-001 | Add state sanity validation to save-game-state | 1 day |
| 2 | ISSUE-003 | Enable server-side generator purchase validation | 2 days |
| 3 | ISSUE-005 | Add epoch validation to prestige | 0.5 day |
| 4 | ISSUE-007 | Implement rate limiting middleware | 1 day |

### PHASE 2: HIGH PRIORITY (Week 2-3)
| Priority | Issue | Action | Effort |
|----------|-------|--------|--------|
| 5 | ISSUE-002 | Implement server-validated tap batching | 4 days |
| 6 | ISSUE-004 | Build anomaly detection framework | 3 days |
| 7 | ISSUE-006 | Server-authoritative passive income | 2 days |
| 8 | ISSUE-009 | Server-side session ad tracking | 1 day |

### PHASE 3: ARCHITECTURE (Month 2+)
| Priority | Issue | Action | Effort |
|----------|-------|--------|--------|
| 9 | ISSUE-001 | Full server-authoritative state | 5 days |
| 10 | ISSUE-010 | Server-side task tracking | 2 days |
| 11 | ISSUE-011 | Transaction isolation fixes | 2 days |
| 12 | ISSUE-008 | CORS restriction | 0.5 day |

---

## SECTION 8: TESTING CHECKLIST

### Manual Testing
- [ ] Modify localStorage and verify state saves correctly
- [ ] Forge API requests with fake telegram_id (should fail)
- [ ] Rapid-fire requests to edge functions (should be rate-limited)
- [ ] Test prestige without independence epoch (should fail)
- [ ] Test concurrent offline claims (only one should succeed)

### Automated Testing
- [ ] Unit test HMAC validation
- [ ] Unit test rate limiting
- [ ] Integration test state save with invalid values
- [ ] Load test concurrent requests

### Security Testing
- [ ] Penetration test all edge functions
- [ ] SQL injection testing
- [ ] CSRF testing
- [ ] Request forgery testing

---

## SECTION 9: FILE INVENTORY

| File | Risk Level | Status | Notes |
|------|------------|--------|-------|
| `src/hooks/useGame.ts` | 🔴 HIGH | ⚠️ REVIEW | Tap/generator logic client-side |
| `src/lib/storage.ts` | 🟠 MEDIUM | ✅ OK | RPC routing proper |
| `src/lib/rpc.ts` | 🟢 LOW | ✅ OK | Correct HMAC usage |
| `src/lib/telegram.ts` | 🟢 LOW | ✅ OK | Documentation clear |
| `src/services/adsgram.ts` | 🟡 INFO | ⚠️ REVIEW | Secrets hidden, values visible |
| `supabase/functions/_shared/validate-init-data.ts` | 🟢 LOW | ✅ SECURE | Correct HMAC validation |
| `supabase/functions/claim-ad-reward/index.ts` | 🟢 LOW | ✅ SECURE | Proper validation |
| `supabase/functions/claim-offline-income/index.ts` | 🟢 LOW | ✅ SECURE | Atomic swap used |
| `supabase/functions/perform-prestige/index.ts` | 🟡 LOW | ⚠️ PARTIAL | Missing epoch check |
| `supabase/functions/game-action/index.ts` | 🔴 HIGH | ❌ BROKEN | buy_generator disabled |
| `supabase/functions/save-game-state/index.ts` | 🟠 MEDIUM | ⚠️ REVIEW | No value validation |
| `supabase/functions/open-chest/index.ts` | 🟢 LOW | ✅ SECURE | Server-side RNG |
| `supabase/functions/adsgram-reward/index.ts` | 🟢 LOW | ✅ SECURE | Secret validation |
| `supabase/migrations/017_*.sql` | 🟢 LOW | ✅ FIXED | FOR UPDATE lock added |
| `supabase/migrations/020_*.sql` | 🟢 LOW | ✅ SECURE | RLS properly configured |

---

## SECTION 10: COMPLIANCE CHECKLIST

| Requirement | Status | Evidence |
|-------------|--------|----------|
| HMAC validation on sensitive endpoints | ✅ PASS | All functions validate init_data |
| Rate limiting | ❌ FAIL | No rate limiting implemented |
| Anomaly detection | ❌ FAIL | No detection system |
| Server-authoritative game state | ❌ FAIL | Client sends state, server accepts |
| Input validation | ⚠️ PARTIAL | Some validation exists |
| RLS policies | ✅ PASS | Properly configured |
| Audit logging | ⚠️ PARTIAL | Some logging exists |
| Secure credential storage | ✅ PASS | Secrets in env vars |

---

## CONCLUSION

The Virtual Museum Tapper Game has a **moderate security posture** with strong foundations in HMAC authentication and atomic operations, but suffers from **critical client-trusting architecture decisions** that could allow determined attackers to manipulate game state.

### Key Strengths
1. HMAC authentication properly implemented
2. Atomic offline claim with row locking
3. Server-side RNG for chest rewards
4. Proper RLS configuration

### Critical Gaps
1. **Client-state manipulation** - server accepts client values
2. **Botting vulnerability** - taps unvalidated
3. **No anomaly detection** - cheating goes undetected
4. **Rate limiting missing** - API abuse possible

### Recommended Next Steps
1. **Immediate:** Add state sanity validation to save-game-state
2. **This week:** Enable server-side generator purchase
3. **Next week:** Implement anomaly detection framework
4. **Next month:** Full server-authoritative architecture

---

**Report Prepared By:** Anti-Cheat Engineering Team  
**Review Date:** 2026-07-02  
**Next Review:** 2026-07-09 (after Phase 1 fixes)
