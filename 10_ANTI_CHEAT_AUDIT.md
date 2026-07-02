# 🔒 ANTI-CHEAT AUDIT REPORT
## Virtual Museum Tapper Game v1.6.6
### Classification: CONFIDENTIAL — DEVELOPMENT USE ONLY

**Auditor:** Anti-Cheat Engineering Team  
**Date:** 2026-07-02  
**Methodology:** Static code analysis, data flow tracing, attack surface mapping  
**Standard:** AAA Game Studio Anti-Cheat (AAA-SAC v3.2)

---

## EXECUTIVE SUMMARY

| Category | Rating | Critical Issues |
|----------|--------|----------------|
| Client-Side Manipulation | 🔴 CRITICAL | 15+ exploit vectors |
| Server-Side Validation | 🔴 CRITICAL | 8+ validation gaps |
| Ad Reward Security | 🔴 CRITICAL | 6+ bypass vectors |
| Offline Reward Security | 🔴 CRITICAL | 4+ exploit vectors |
| Payment Security | 🟡 MODERATE | 2 issues |
| Data Privacy | 🟡 MODERATE | RLS misconfigurations |
| Telegram Integration | 🟡 MODERATE | Partial validation |
| Race Conditions | 🔴 CRITICAL | 1 critical bug |

**Overall Risk: 🔴 CRITICAL — GAME IS NOT SUITABLE FOR PRODUCTION WITHOUT IMMEDIATE REMEDIATION**

---

## SECTION 1: CRITICAL VULNERABILITIES

### CVE-001: COMPLETE CLIENT-SIDE STATE MANIPULATION (CRITICAL)

**Severity:** CRITICAL | **CVSS:** 10.0 | **Affects:** All game systems

**Description:**  
The `saveRemoteState()` function in `src/lib/storage.ts` sends the ENTIRE game state to Supabase with NO `init_data` validation. An attacker can:
1. Open browser DevTools
2. Modify `localStorage.ukraine_tap_game_state`
3. Set `currency: 999999999`, `xp: 999999999`, `level: 999`
4. Call `saveRemoteState()` — values are written directly to the database

**Affected Code:**
```typescript
// src/lib/storage.ts:156-160 — NO VALIDATION
const { error } = await supabase
  .from('game_progress')
  .upsert({ ...payload, telegram_id: telegramId }, { onConflict: 'telegram_id' });
```

**Attack Vector:**
```javascript
// In browser console
localStorage.setItem('ukraine_tap_game_state', JSON.stringify({
  currency: 999999999999,
  xp: 999999999999,
  totalXp: 999999999999,
  level: 999,
  // ... all other fields
}));
// Refresh page — cheat is saved to server
```

**Impact:** Complete economy destruction, leaderboard manipulation, all purchases free.

**Recommendation:**  
- ❌ REMEDIATION BLOCKED — Requires architectural redesign
- All state-changing operations MUST go through validated edge functions
- Implement server-authoritative game state for ALL currency/XP operations

---

### CVE-002: BROKEN swap_last_online_at RPC (CRITICAL)

**Severity:** CRITICAL | **CVSS:** 9.5 | **Affects:** Offline income system

**Description:**  
The `swap_last_online_at()` function in migration `017_swap_last_online_at_rpc.sql` is LOGICALLY BROKEN. It returns the OLD value incorrectly due to a race between the SELECT and UPDATE.

```sql
-- Migration 017: Lines 26-37
CREATE OR REPLACE FUNCTION swap_last_online_at(p_telegram_id bigint, p_new_time timestamptz)
RETURNS timestamptz AS $$
  WITH old AS (
    SELECT last_online_at FROM game_progress WHERE telegram_id = p_telegram_id  -- LINE 1: SELECT
  ),
  updated AS (
    UPDATE game_progress SET last_online_at = p_new_time                          -- LINE 2: UPDATE
    WHERE telegram_id = p_telegram_id
    RETURNING 1
  )
  SELECT last_online_at FROM old;  -- LINE 3: Returns SELECT result
$$ LANGUAGE sql SECURITY DEFINER;
```

**The Bug:** In PostgreSQL CTEs, the SELECT in the `old` CTE executes INDEPENDENTLY of the UPDATE. Both CTEs run in the same snapshot, so `old` captures the current value, but the UPDATE hasn't been applied yet. The RETURNING from `updated` is discarded. This function will return the value that WAS there before the update — BUT only if no concurrent transaction exists.

**Race Condition Impact:**
1. User opens game at T=0 → last_online_at = T=0
2. User closes, manipulates clock to T=-8hours
3. User opens game at T=0
4. RPC returns T=-8hours (correct in isolation)
5. BUT: If user sends two concurrent requests:
   - Request A: swap(T=-8hours) → returns T=0
   - Request B: swap(T=-8hours) → ALSO returns T=0 (same snapshot!)
   - Both calculate 8 hours offline → DOUBLE CLAIM

**Impact:** Players can claim offline income multiple times concurrently.

**Recommendation:**
- Rewrite the function to use `FOR UPDATE` lock:
```sql
CREATE OR REPLACE FUNCTION swap_last_online_at(p_telegram_id bigint, p_new_time timestamptz)
RETURNS timestamptz AS $$
DECLARE
  old_time timestamptz;
BEGIN
  SELECT last_online_at INTO old_time
  FROM game_progress
  WHERE telegram_id = p_telegram_id
  FOR UPDATE;  -- LOCK THE ROW
  
  UPDATE game_progress
  SET last_online_at = p_new_time
  WHERE telegram_id = p_telegram_id;
  
  RETURN old_time;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

### CVE-003: NO init_data VALIDATION IN CRITICAL FUNCTIONS (CRITICAL)

**Severity:** CRITICAL | **CVSS:** 9.8 | **Affects:** claim-ad-reward, claim-offline-income, perform-prestige

**Description:**  
Three of the most sensitive edge functions accept `telegram_id` directly from the request body with ZERO validation:

| Function | Validates init_data? | Telegram ID Source |
|----------|---------------------|-------------------|
| `claim-ad-reward` | ❌ NO | `body.telegram_id` |
| `claim-offline-income` | ❌ NO | `body.telegram_id` |
| `perform-prestige` | ❌ NO | `body.telegram_id` |

**Attack Vector:**
```bash
curl -X POST https://xxx.supabase.co/functions/v1/claim-offline-income \
  -H "Content-Type: application/json" \
  -d '{"telegram_id": TARGET_USER_ID, "x2_boost": true}'
```

```bash
curl -X POST https://xxx.supabase.co/functions/v1/perform-prestige \
  -H "Content-Type: application/json" \
  -d '{"telegram_id": TARGET_USER_ID}'
```

**Impact:** 
- Claim unlimited ad rewards for any user
- Force prestige on any user (destroys their progress)
- Claim offline income for any user

**Recommendation:**
- All functions MUST call `validateInitData(init_data)` and extract telegram_id from validated data
- Refuse requests without valid `init_data` (401 Unauthorized)
- See `game-action/index.ts` for correct implementation pattern

---

### CVE-004: TAPS ARE ENTIRELY CLIENT-SIDE (CRITICAL)

**Severity:** CRITICAL | **CVSS:** 9.0 | **Affects:** XP generation, progression

**Description:**  
Tapping happens entirely in the browser. The `tap()` function in `useGame.ts` updates local state, which is periodically saved to the server. There is NO server validation of tap count, tap timing, or tap authenticity.

```typescript
// src/hooks/useGame.ts
const tap = useCallback((x: number, y: number) => {
  // NO SERVER CALL — purely client-side
  setState(prev => ({
    ...prev,
    xp: prev.xp + effectiveTapPower,
    totalXp: prev.totalXp + effectiveTapPower,
    // ...
  }));
  // Save happens every 2-15 seconds asynchronously
}, [...]);
```

**Attack Vector:**
1. Modify `effectiveTapPower` in memory → infinite XP per tap
2. Write a script that calls `tap()` 1000 times/second
3. Set `tapPower: 9999` in localStorage
4. Bot the game with automated taps

**Impact:** Complete progression bypass, leaderboard domination.

**Recommendation:**
- Implement server-authoritative tap validation:
  - Client sends batched tap events (timestamps + count)
  - Server validates tap rate (<10 taps/sec max)
  - Server validates tap timing (no future timestamps)
  - Server computes XP and updates DB directly
- OR: Accept client-side taps but implement server-side validation via anomaly detection

---

### CVE-005: buy_generator DISABLED (GAME-BREAKING)

**Severity:** CRITICAL | **CVSS:** 8.5 | **Affects:** Core purchase system

**Description:**  
In `game-action/index.ts`, the `buy_generator` handler returns an error:
```typescript
// supabase/functions/game-action/index.ts:62-79
async function buyGenerator(...) {
  // ...
  return { ok: false, error: "buy_generator: cost validation requires server-side generator definitions — coming soon" };
}
```

**Impact:** ALL generator purchases are handled client-side via `saveRemoteState()`, meaning:
- Players can buy generators they can't afford
- Players can set negative costs
- The comment explicitly states this is incomplete

**Recommendation:**
- URGENT: Implement server-side generator definitions and cost calculation
- Remove client-side purchase logic entirely

---

### CVE-006: ads_rewards_log ad_id IS CLIENT-GENERATED (CRITICAL)

**Severity:** CRITICAL | **CVSS:** 8.0 | **Affects:** Ad reward system

**Description:**  
In `adsgram-reward/index.ts`, the ad reward endpoint accepts ad_id from the client:
```typescript
// supabase/functions/adsgram-reward/index.ts:241-255
async function handlePostCallback(body: { userid?: string; ad_id?: string; reward_type?: string }) {
  // ...
  const adId = ad_id || crypto.randomUUID();  // ← CLIENT CAN SET THIS
  // ...
  // Duplicate check uses this adId
  const { data: existing } = await supabase
    .from("ads_rewards_log")
    .select("id")
    .eq("telegram_id", telegramId)
    .eq("ad_id", adId)  // ← Player controls ad_id
    .maybeSingle();
```

**Attack Vector:**
```javascript
// Watch ad once, then replay with different ad_id
for (let i = 0; i < 100; i++) {
  await fetch('/functions/v1/adsgram-reward', {
    method: 'POST',
    body: JSON.stringify({
      userid: myTelegramId,
      ad_id: `ad_unique_${i}`,  // ← Different each time!
      reward_type: 'xp_boost'
    })
  });
}
```

**Impact:** Unlimited XP boosts, infinite ad rewards.

**Recommendation:**
- Extract ad_id from AdsGram SDK callback ONLY (not client body)
- OR: Use AdsGram's server-to-server callback which includes verified ad_id
- OR: Store session-based claim records (one claim per AdsGram session)

---

### CVE-007: ADSGRAM SDK NEVER LOADED (CRITICAL)

**Severity:** CRITICAL | **CVSS:** 7.5 | **Affects:** Ad reward functionality

**Description:**  
The AdsGram SDK script is never loaded in `index.html`. Components call `initAdsgram()` which checks for `window.Adsgram` — but this property is NEVER set because the SDK script tag is missing.

**Affected Code:**
```typescript
// src/services/adsgram.ts:57-68
export function initAdsgram(blockId: string = ADSGRAM_BLOCK_ID, debug = false): AdsgramController | null {
  if (!window.Adsgram) {
    console.error('AdsGram SDK not loaded');  // ← This ALWAYS fires
    return null;
  }
  // ...
}
```

**Impact:** All ad reward buttons will fail silently or show "SDK not loaded" errors. Users cannot earn ad rewards legitimately.

**Missing in index.html:**
```html
<script src="https://cdn.adsgram.ai/adsgram.js"></script>
```

**Note:** The AdsGram SDK requires proper integration with their server-side verification. Simply adding the script tag is not enough — you need a proper callback URL registered with AdsGram.

---

### CVE-008: RLS POLICIES ALLOW UNAUTHORIZED ACCESS (CRITICAL)

**Severity:** CRITICAL | **CVSS:** 9.2 | **Affects:** Data privacy, game integrity

**Description:**  
The Row Level Security policies are misconfigured:

1. **game_progress INSERT/UPDATE are public:**
```sql
-- From migration 007
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);
-- game_progress policies not shown but INSERT/UPDATE appears unrestricted
```

2. **player_sessions SELECT policy is TOO BROAD:**
```sql
-- Migration 016: Player sessions SELECT
CREATE POLICY "select_own_sessions" ON player_sessions
  FOR SELECT TO anon, authenticated
  USING (true);  -- ← ANYONE can read ALL player sessions!
```

**Impact:** 
- Any user can read all other users' session data (privacy violation)
- The `true` condition means no row-level filtering

**Recommendation:**
```sql
-- Fix the policy to only show own sessions
DROP POLICY "select_own_sessions" ON player_sessions;
CREATE POLICY "select_own_sessions" ON player_sessions
  FOR SELECT TO anon, authenticated
  USING (telegram_id = (SELECT telegram_id FROM game_progress WHERE auth.jwt() ->> 'telegram_id' = telegram_id::text));
```

---

### CVE-009: PASSIVE XP PER SECOND IS CLIENT-CALCULATED (CRITICAL)

**Severity:** CRITICAL | **CVSS:** 8.5 | **Affects:** Offline income, progression

**Description:**  
`passiveXpPerSecond` is calculated entirely on the client based on owned generators. This value is saved to the server and used for offline income calculation.

```typescript
// src/hooks/useGame.ts — passiveXpPerSecond calculation
const passiveXpPerSecond = useMemo(() => {
  return epoch.generators.reduce((sum, g) => {
    const owned = ownedLevels.get(g.id) || 0;
    return sum + getGeneratorProduction(g, owned) * artifactMultipliers.passive;
  }, 0);
}, [ownedLevels, epoch, artifactMultipliers]);
```

**Attack Vector:**
1. Modify `passiveXpPerSecond` in localStorage to 999999
2. Claim 8 hours offline income = 999999 * 28800 = 28.7 billion XP

**Recommendation:**
- Store only `ownedGenerators` on the server
- Recalculate `passiveXpPerSecond` server-side from generator definitions
- Never trust client-computed production rates

---

## SECTION 2: HIGH SEVERITY ISSUES

### HIGH-001: Prestige Has No Epoch Validation on Server

**Severity:** HIGH | **Affects:** Prestige system

**Description:**  
Client checks `state.epochId === 'independence'` before allowing prestige, but the server ONLY checks level:

```typescript
// src/hooks/useGame.ts:271
const canPrestige = state.level >= 950 && state.epochId === 'independence';
```

```typescript
// supabase/functions/perform-prestige/index.ts:78-83
function canPrestige(level: number): { canPrestige: boolean; reason?: string } {
  if (level < 950) {
    return { canPrestige: false, reason: `Need level 950 to prestige.` };
  }
  return { canPrestige: true };  // ← No epoch check!
}
```

**Attack Vector:**
```javascript
// Modify epochId client-side, then prestige
localStorage.setItem('ukraine_tap_game_state', JSON.stringify({
  // ... set level: 950, epochId: 'independence' (even if never unlocked)
}));
```

**Recommendation:** Add epoch validation in `perform-prestige`:
```typescript
const unlocked = (row.unlocked_epochs as string[]) ?? [];
if (!unlocked.includes('independence')) {
  return jsonResponse({ error: "Epoch 'independence' not unlocked" }, 400);
}
```

---

### HIGH-002: Daily Task Counters Are Client-Side

**Severity:** HIGH | **Affects:** Daily task rewards

**Description:**  
Task completion counters (`tap`, `earn_xp`, `buy_generator`) are incremented client-side and saved via `saveRemoteState()`. No server validation.

```typescript
// src/components/DailyTasksPanel.tsx
const counter = dailyTasksState.counters[task.type] || 0;
// Client can set any counter to max value
```

**Recommendation:** 
- Track task completion server-side
- Only grant rewards server-side after verification

---

### HIGH-003: Daily Check-In Is Client-Side

**Severity:** HIGH | **Affects:** Daily rewards, streak system

**Description:**  
Check-in rewards are computed client-side. The `claimDailyReward` function updates local state:

```typescript
// src/hooks/useGame.ts
const claimDailyReward = useCallback(() => {
  setState(prev => {
    const reward = getStreakReward(prev.checkInStreak);
    return {
      ...prev,
      currency: prev.currency + reward.currency,
      xp: prev.xp + reward.xp,
      checkInStreak: prev.checkInStreak + 1,
      lastCheckIn: getTodayDateStr(),
    };
  });
}, []);
```

**Attack Vector:**
1. Set `lastCheckIn` to any past date
2. Set `checkInStreak` to any number
3. Claim rewards for "missed" days

**Recommendation:**
- Server-authoritative check-in system
- One claim per UTC day per user (enforced server-side)

---

### HIGH-004: Generator Cost Is Client-Side

**Severity:** HIGH | **Affects:** Economy, purchases

**Description:**  
Generator costs are computed client-side from frontend definitions. The server doesn't know actual costs.

```typescript
// src/data/epochs.ts
getGeneratorCost(generator: Generator, level: number): number {
  return Math.floor(generator.baseCost * Math.pow(generator.costMultiplier, level));
}
```

```typescript
// src/hooks/useGame.ts
const buyGenerator = useCallback((generatorId: string): boolean => {
  const cost = getGeneratorCost(g, currentLevel + 1);
  if (state.currency < cost) return false;  // Client-side check!
  // No server call — just local state update
});
```

**Attack Vector:**
```javascript
// Override cost calculation
const original = window.getGeneratorCost;
window.getGeneratorCost = () => 1;  // All generators cost 1!
```

**Recommendation:** 
- Move all generator/epoch definitions to server-side
- Validate costs in `game-action` edge function (currently disabled — see CVE-005)

---

### HIGH-005: sessionStartAt Is Client-Manipulable

**Severity:** HIGH | **Affects:** Session ads, session tracking

**Description:**  
`sessionStartAt` is set from `Date.now()` on the client. An attacker can:
1. Set `sessionStartAt` to 20+ minutes in the past
2. Immediately trigger the session ad modal
3. Watch ad → claim reward

```typescript
// src/hooks/useGame.ts:188
sessionStartAt: Date.now(),  // ← Client timestamp
```

**Recommendation:**
- Store `sessionStartAt` server-side only
- Session ad eligibility determined by server
- OR: Trust lastOnlineAt from server, not sessionStartAt

---

## SECTION 3: MODERATE SEVERITY ISSUES

### MOD-001: Multiple Tabs Can Have Independent State

**Severity:** MODERATE | **Affects:** All game systems

**Description:**  
The `TAB_ID` constant in `useGame.ts` doesn't prevent multiple tabs:
```typescript
// src/hooks/useGame.ts:33
const TAB_ID = `tab_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
```

The game can be opened in multiple browser tabs, each with independent state. These are not synchronized, allowing:
- Double passive income (if one tab is open for offline, another tab can claim)
- Multiple concurrent sessions

**Impact:** Limited exploit potential but inconsistent state.

---

### MOD-002: No Rate Limiting on Edge Functions

**Severity:** MODERATE | **Affects:** All edge functions

**Description:**  
No rate limiting exists on any edge function. An attacker can:
- Call `claim-offline-income` hundreds of times (race condition + CVE-002)
- Call `claim-ad-reward` rapidly to test limits
- Spam `game-action` requests

**Recommendation:** Implement Supabase rate limiting or add request throttling in edge functions.

---

### MOD-003: CORS Allows All Origins

**Severity:** MODERATE | **Affects:** All edge functions

**Description:**  
All edge functions use `"Access-Control-Allow-Origin": "*"`:
```typescript
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",  // ← Any website can call these!
  // ...
};
```

This allows CSRF attacks where a malicious site makes requests on behalf of a logged-in user.

**Recommendation:**
- Use specific origin: `https://t.me/*` (Telegram Mini App domain)
- Implement CSRF token validation

---

### MOD-004: No Anomaly Detection on Progression

**Severity:** MODERATE | **Affects:** Leaderboard integrity

**Description:**  
No server-side checks for suspicious progression patterns:
- Level jump from 1 to 950 in one session
- 1 million XP earned in 1 minute
- Perfect tap rate (constant, inhuman)

**Recommendation:**
- Implement session analytics
- Flag anomalies for manual review
- Add invisible CAPTCHA (optional)

---

### MOD-005: Telegram Webhook Not Validated

**Severity:** MODERATE | **Affects:** Payment system

**Description:**  
In `telegram-payments/index.ts`, successful payment handling trusts the Telegram webhook without additional validation:

```typescript
// supabase/functions/telegram-payments/index.ts:235-240
if (body.message?.successful_payment) {
  const msg = body.message;
  const telegramId: number = msg.from?.id;  // ← Can this be spoofed?
  // ...
}
```

While Telegram webhook updates are signed by Telegram's servers, there's no explicit signature verification on the webhook endpoint.

**Recommendation:** 
- Verify webhook authenticity using Telegram's secret token
- Telegram's infrastructure already provides security here, but explicit verification is best practice

---

### MOD-006: adsgram-reward Accepts GET with Secret

**Severity:** MODERATE | **Affects:** Ad reward system

**Description:**  
The GET handler for AdsGram callbacks accepts a secret parameter:
```typescript
// supabase/functions/adsgram-reward/index.ts:182-199
async function handleGetCallback(params: URLSearchParams) {
  const secret = params.get("secret");
  if (!secret) {
    return jsonResponse({ error: "Missing secret" }, 400);
  }
  if (!ADSGRAM_SECRET || secret !== ADSGRAM_SECRET) {
    return jsonResponse({ error: "Invalid secret" }, 403);
  }
  // ...
}
```

The secret (`e73dc047768d42dba4d64432274c05c1`) is stored in the code. If leaked:
- Anyone can claim rewards for any user

**Recommendation:**
- Store secret in environment variables only
- Rotate secrets periodically
- Implement AdsGram's official server-to-server verification flow

---

## SECTION 4: INFORMATION DISCLOSURE

### INFO-001: AdsGram Secret Hardcoded in Client Code

**Severity:** INFO | **Affects:** Ad reward system

**Description:**  
`ADSGRAM_SECRET` is hardcoded in `src/services/adsgram.ts`:
```typescript
// src/services/adsgram.ts:17
export const ADSGRAM_SECRET = 'e73dc047768d42dba4d64432274c05c1';
```

This is also in the server-side code. If the client bundle is decompiled, the secret is exposed.

**Recommendation:** 
- Never include secrets in client code
- Use only server-side secrets for verification

---

### INFO-002: All Game Definitions Are Public

**Severity:** INFO | **Affects:** Transparency

**Description:**  
All game data (epochs, generators, artifacts, tasks) exists in public client code. While this aids transparency, it also aids cheating.

**Note:** This is acceptable for a single-player idle game. No action needed.

---

## SECTION 5: EXPLOIT CHAIN DEMONSTRATIONS

### ATTACK SCENARIO 1: Max Level Without Playing

```javascript
// 1. Open browser console
// 2. Set localStorage to max stats
const fakeState = {
  epochId: 'independence',
  level: 999,
  xp: 999999999999,
  totalXp: 999999999999,
  currency: 999999999999,
  // ... other required fields
};
localStorage.setItem('ukraine_tap_game_state', JSON.stringify(fakeState));
// 3. Refresh page
// 4. Now prestige to get prestige points without earning them legitimately
```

---

### ATTACK SCENARIO 2: Infinite XP via Multiple Tabs + Offline

```javascript
// 1. Open Tab A, play for 30 minutes, close
// 2. Open Tab B immediately, claim offline income (8 hours)
// 3. Tab A also claims offline when opened
// 4. Both tabs have independent lastOnlineAt = different offline claims
```

---

### ATTACK SCENARIO 3: Ad Reward Spam via cURL

```bash
# Watch ONE ad legitimately, then spam different ad_ids
for i in {1..1000}; do
  curl -X POST https://xxx.supabase.co/functions/v1/adsgram-reward \
    -H "Content-Type: application/json" \
    -d "{\"userid\":\"$MY_ID\",\"ad_id\":\"fake_$i\",\"reward_type\":\"xp_boost\"}"
done
```

---

### ATTACK SCENARIO 4: Force Prestige on Rival

```bash
# Destroy a competitor's progress
curl -X POST https://xxx.supabase.co/functions/v1/perform-prestige \
  -H "Content-Type: application/json" \
  -d '{"telegram_id": RIVAL_USER_ID}'
```

---

## SECTION 6: SUMMARY TABLE

| ID | Vulnerability | Severity | Exploitability | Impact | Fix Effort |
|----|--------------|----------|----------------|--------|------------|
| CVE-001 | Client-side state manipulation | CRITICAL | Trivial | Complete | HIGH |
| CVE-002 | Broken swap_last_online_at RPC | CRITICAL | Moderate | Economy | MEDIUM |
| CVE-003 | No init_data validation | CRITICAL | Trivial | Any user | MEDIUM |
| CVE-004 | Taps entirely client-side | CRITICAL | Moderate | Progression | HIGH |
| CVE-005 | buy_generator disabled | CRITICAL | Trivial | Economy | HIGH |
| CVE-006 | ad_id client-controlled | CRITICAL | Moderate | Ad rewards | MEDIUM |
| CVE-007 | AdsGram SDK not loaded | CRITICAL | N/A | No ads work | LOW |
| CVE-008 | RLS policies too broad | CRITICAL | Trivial | Privacy | LOW |
| CVE-009 | passiveXpPerSecond client-side | CRITICAL | Trivial | Economy | MEDIUM |
| HIGH-001 | Prestige no epoch check | HIGH | Moderate | Prestige | LOW |
| HIGH-002 | Task counters client-side | HIGH | Moderate | Tasks | MEDIUM |
| HIGH-003 | Check-in client-side | HIGH | Moderate | Streaks | MEDIUM |
| HIGH-004 | Generator cost client-side | HIGH | Trivial | Economy | HIGH |
| HIGH-005 | sessionStartAt manipulable | HIGH | Moderate | Session ads | MEDIUM |
| MOD-001 | Multiple tabs state | MODERATE | Easy | Inconsistency | LOW |
| MOD-002 | No rate limiting | MODERATE | Easy | DoS/Farm | LOW |
| MOD-003 | CORS allows all | MODERATE | Easy | CSRF | LOW |
| MOD-004 | No anomaly detection | MODERATE | N/A | Detection | MEDIUM |
| MOD-005 | Webhook not validated | MODERATE | Hard | Payments | LOW |
| MOD-006 | Secret in client code | MODERATE | Easy | Ad rewards | LOW |
| INFO-001 | Hardcoded secret | INFO | Easy | Secret leak | LOW |
| INFO-002 | Public game data | INFO | N/A | None | N/A |

---

## SECTION 7: PRIORITIZED REMEDIATION ROADMAP

### PHASE 1: CRITICAL HOTFIX (Week 1)
1. Fix `swap_last_online_at` RPC (CVE-002) — add `FOR UPDATE` lock
2. Add `init_data` validation to ALL critical edge functions (CVE-003)
3. Fix RLS policies (CVE-008)
4. Add AdsGram SDK script to index.html (CVE-007)
5. Fix duplicate ad reward claim (CVE-006) — use session-based claims

### PHASE 2: HIGH PRIORITY (Week 2-3)
1. Implement server-authoritative tap validation (CVE-004)
2. Enable and fix `buy_generator` in game-action (CVE-005)
3. Make `passiveXpPerSecond` server-computed (CVE-009)
4. Add epoch validation to prestige (HIGH-001)
5. Add CORS restrictions

### PHASE 3: LONG-TERM ARCHITECTURE (Month 1+)
1. Complete server-authoritative game state
2. Implement anomaly detection
3. Add rate limiting across all endpoints
4. Security audit of payment webhook handling
5. Penetration testing

---

## SECTION 8: TESTING CHECKLIST

### Automated Tests to Implement
- [ ] Race condition test: concurrent offline claims
- [ ] State manipulation test: localStorage modification
- [ ] init_data bypass test: direct API calls without valid signature
- [ ] Rate limiting test: rapid fire requests
- [ ] Epoch bypass test: prestige without epoch
- [ ] Ad reward spam test: multiple ad_ids
- [ ] Tab duplication test: multiple sessions

### Manual Testing
- [ ] Proxy intercept and modify game state
- [ ] Browser console state manipulation
- [ ] Multiple tab exploit
- [ ] Clock manipulation for offline income
- [ ] Direct API calls with arbitrary telegram_ids

---

## APPENDIX A: FILE INVENTORY

| File | Risk Level | Notes |
|------|------------|-------|
| `src/hooks/useGame.ts` | 🔴 CRITICAL | All game logic client-side |
| `src/lib/storage.ts` | 🔴 CRITICAL | saveRemoteState no validation |
| `src/lib/telegram.ts` | 🟡 MODERATE | init_data parsing only |
| `src/services/adsgram.ts` | 🔴 CRITICAL | Secret exposed, no SDK |
| `src/components/AdSystem.tsx` | 🔴 CRITICAL | Ad rewards bypassable |
| `src/components/AdsGramButton.tsx` | 🔴 CRITICAL | SDK not loaded |
| `src/components/OfflineRewardModal.tsx` | 🔴 CRITICAL | No server validation |
| `src/components/PrestigeSystem.tsx` | 🟡 MODERATE | Client-side checks only |
| `src/components/DailyStreakModal.tsx` | 🟡 MODERATE | Client-side only |
| `src/components/DailyTasksPanel.tsx` | 🟡 MODERATE | Counters not validated |
| `src/components/GachaModal.tsx` | 🟡 MODERATE | Server calls but limited validation |
| `supabase/functions/claim-offline-income/index.ts` | 🔴 CRITICAL | No init_data validation |
| `supabase/functions/claim-ad-reward/index.ts` | 🔴 CRITICAL | No init_data validation |
| `supabase/functions/perform-prestige/index.ts` | 🔴 CRITICAL | No init_data validation |
| `supabase/functions/adsgram-reward/index.ts` | 🔴 CRITICAL | ad_id controllable |
| `supabase/functions/game-action/index.ts` | 🔴 CRITICAL | buy_generator disabled |
| `supabase/functions/validate-init-data/index.ts` | 🟢 GOOD | Correct implementation |
| `supabase/functions/open-chest/index.ts` | 🟡 MODERATE | Rarity roll is server-side ✓ |
| `supabase/functions/telegram-payments/index.ts` | 🟡 MODERATE | Webhook trust |
| `supabase/functions/track-session/index.ts` | 🟡 MODERATE | Session tracking |
| `supabase/migrations/*.sql` | 🔴 CRITICAL | Broken RPC, bad RLS |

---

## APPENDIX B: QUICK REFERENCE — CORRECT VS INCORRECT

### ❌ WRONG: Accepting telegram_id from body
```typescript
const { telegram_id } = body;  // ← Can be spoofed
```

### ✅ CORRECT: Validating via init_data
```typescript
const { init_data } = body;
const validation = validateInitData(init_data);
if (!validation.valid) return json({ error: "Unauthorized" }, 401);
const telegramId = validation.userId;
```

### ❌ WRONG: Client-side state update
```typescript
setState(prev => ({ ...prev, currency: prev.currency + 100 }));
// Saved to server without validation
```

### ✅ CORRECT: Server-authoritative update
```typescript
// Client sends action
const response = await fetch('/functions/v1/game-action', {
  body: JSON.stringify({ action: 'earn_reward', init_data, amount: 100 })
});
// Server validates and updates
```

---

**END OF REPORT**
