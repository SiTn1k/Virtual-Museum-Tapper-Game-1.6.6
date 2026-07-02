# Security Audit Report: Virtual Museum Tapper Game

**Version:** 1.6.6  
**Date:** 2026-07-02  
**Auditor:** Security Engineer (AAA Studio Standards)  
**Classification:** CONFIDENTIAL

---

## Executive Summary

This security audit identified **13 vulnerabilities** across authentication, authorization, input validation, and data protection mechanisms. Of these, **3 are CRITICAL**, **4 are HIGH**, **3 are MEDIUM**, and **3 are LOW** severity.

The most critical issue is that **most edge functions do not validate Telegram initData**, allowing any attacker who knows a user's `telegram_id` to manipulate their game state, claim rewards, and perform in-game purchases without authorization.

---

## Vulnerability Registry

| ID | Severity | Category | Title |
|----|----------|----------|-------|
| V001 | 🔴 CRITICAL | Authentication | Missing initData validation in 8 of 10 edge functions |
| V002 | 🔴 CRITICAL | Authorization | RLS policies allow universal read/write access |
| V003 | 🔴 CRITICAL | Race Condition | swap_last_online_at returns incorrect value |
| V004 | 🟠 HIGH | Authorization | Client-side direct DB updates bypass server logic |
| V005 | 🟠 HIGH | Secrets | AdsGram reward secret hardcoded in source |
| V006 | 🟠 HIGH | Rate Limiting | No rate limiting on any edge function |
| V007 | 🟠 HIGH | Authentication | AdsGram POST endpoint accepts userid without verification |
| V008 | 🟡 MEDIUM | Injection | HTML injection in push-notification function |
| V009 | 🟡 MEDIUM | Business Logic | Generator purchase validation not implemented |
| V010 | 🟡 MEDIUM | CORS | Overly permissive CORS policy |
| V011 | 🟢 LOW | Transport | No explicit HTTPS enforcement documented |
| V012 | 🟢 LOW | Privacy | Device ID tracking for non-Telegram users |
| V013 | 🟢 LOW | CSRF | No CSRF token protection |

---

## Detailed Findings

### V001: Missing initData Validation in Edge Functions

**Severity:** 🔴 CRITICAL  
**CVSS 3.1:** 9.1 (CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:N)

#### Description
Only 2 of 10 edge functions validate Telegram initData via HMAC-SHA256:
- ✅ `validate-init-data/index.ts` - validates
- ✅ `game-action/index.ts` - validates

**The following 8 functions DO NOT validate initData and trust `telegram_id` from request body:**

```typescript
// Files accepting telegram_id from body without validation:
- claim-ad-reward/index.ts:28-29
- open-chest/index.ts:33-34  
- perform-prestige/index.ts:45-46
- claim-offline-income/index.ts:24-25
- track-session/index.ts:25-26
- push-notification/index.ts:152
- telegram-payments/index.ts:265-269 (Mini App API)
```

#### Proof of Concept
```bash
# Attacker can claim ad rewards for any user
curl -X POST https://[project].supabase.co/functions/v1/claim-ad-reward \
  -H "Content-Type: application/json" \
  -d '{"telegram_id": 123456789, "reward_type": "energy_restore"}'

# Response: {"success": true, "remaining_today": 4}
# Energy granted without authentication!
```

#### Impact
- **Unauthorized reward claims**: Attacker can claim unlimited ad rewards for any user
- **Currency manipulation**: Direct DB access allows modifying balances
- **Prestige manipulation**: Can force prestige reset on any account
- **Offline income theft**: Can claim offline rewards for other users

#### Remediation
Add initData validation to all edge functions:

```typescript
// Add to each edge function:
const validation = validateInitData(init_data);
if (!validation.valid) return json({ error: validation.error }, 401);
const authorizedTelegramId = validation.userId;

// Compare with request telegram_id for extra safety:
if (body.telegram_id !== authorizedTelegramId) {
  return json({ error: "Unauthorized telegram_id mismatch" }, 403);
}
```

---

### V002: Row Level Security Allows Universal Access

**Severity:** 🔴 CRITICAL  
**CVSS 3.1:** 9.8 (CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H)

#### Description
Despite migration `007_fix_rls_and_level_cap.sql` claiming to fix RLS, the policies still use `USING (true)`:

```sql
-- 20260614122943_007_fix_rls_and_level_cap.sql (lines 36-51)
CREATE POLICY "anon_read_progress" ON game_progress FOR SELECT
  TO anon, authenticated USING (true);  -- ⚠️ ALLOWS ALL READS

CREATE POLICY "anon_insert_progress" ON game_progress FOR INSERT
  TO anon, authenticated WITH CHECK (true);  -- ⚠️ ALLOWS ALL INSERTS

CREATE POLICY "anon_update_progress" ON game_progress FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);  -- ⚠️ ALLOWS ALL UPDATES
```

#### Proof of Concept
```typescript
// Any user can read/write ANY other user's data
const { data } = await supabase
  .from('game_progress')
  .select('*')
  .eq('telegram_id', 999999999);  // Target victim's ID
```

#### Impact
- **Full data breach**: All player game states exposed
- **Account takeover**: Modify any player's currency, level, artifacts
- **Leaderboard manipulation**: Set any user as #1

#### Remediation
Implement proper telegram_id verification in RLS policies:

```sql
-- Use JWT claims to verify telegram_id
CREATE POLICY "anon_read_progress" ON game_progress FOR SELECT
  TO anon USING (
    telegram_id = (current_setting('request.jwt.claims', true)::jsonb->>'telegram_id')::bigint
  );

-- For Edge Functions using service role, add telegram_id check
-- Note: This requires edge functions to pass telegram_id via JWT
```

---

### V003: Race Condition in swap_last_online_at Function

**Severity:** 🔴 CRITICAL  
**CVSS 3.1:** 7.5 (CVSS:3.1/AV:N/AC:H/PR:N/UI:N/S:U/C:N/I:H/A:H)

#### Description
The `swap_last_online_at` RPC function in migration `018_swap_last_online_at_lock_fix.sql` has a critical bug - it returns the NEW value instead of the OLD value:

```sql
-- 20260617135202_018_swap_last_online_at_lock_fix.sql
CREATE OR REPLACE FUNCTION swap_last_online_at(p_telegram_id bigint, p_new_time timestamptz)
RETURNS timestamptz AS $$
  WITH locked AS (
    SELECT last_online_at FROM game_progress WHERE telegram_id = p_telegram_id FOR UPDATE
  ),
  updated AS (
    UPDATE game_progress SET last_online_at = p_new_time
    WHERE telegram_id = p_telegram_id
  )
  SELECT last_online_at FROM locked;  -- ⚠️ Returns value AFTER lock, not BEFORE
$$ LANGUAGE sql SECURITY DEFINER;
```

#### Proof of Concept
```typescript
// Two concurrent requests both read the NEW value
// Both calculate offline income from the same timestamp
// Both grant full offline rewards

// Request 1: swap_last_online_at(telegram_id, NOW)
// Request 2: swap_last_online_at(telegram_id, NOW)  -- Same timestamp!

// Both receive identical swapData = "2026-07-02T10:30:00Z"
// Both calculate 8 hours of offline income
// Player receives DOUBLE offline rewards
```

#### Impact
- **Duplicate offline income**: Race condition allows double-claim
- **Financial loss**: Real currency value if game has monetization
- **Economy manipulation**: Unearned currency in circulation

#### Remediation
```sql
CREATE OR REPLACE FUNCTION swap_last_online_at(p_telegram_id bigint, p_new_time timestamptz)
RETURNS timestamptz AS $$
  UPDATE game_progress 
  SET last_online_at = p_new_time
  WHERE telegram_id = p_telegram_id
  RETURNING last_online_at - (p_new_time - last_online_at);  -- Calculate old time from new
$$ LANGUAGE sql SECURITY DEFINER;
```

Or use PostgreSQL advisory locks for proper atomic swap.

---

### V004: Client-Side Direct DB Updates Bypass Server Logic

**Severity:** 🟠 HIGH  
**CVSS 3.1:** 7.5 (CVSS:3.1/AV:N/AC:H/PR:N/UI:N/S:U/C:H/I:H/A:N)

#### Description
The `saveRemoteState()` function in `src/lib/storage.ts` directly upserts game state to the database:

```typescript
// src/lib/storage.ts:156-160
const { error } = await supabase
  .from('game_progress')
  .upsert({ ...payload, telegram_id: telegramId }, { onConflict: 'telegram_id' });
```

This bypasses all server-side validation logic in edge functions.

#### Proof of Concept
```typescript
// Attacker can directly set any game value
const maliciousPayload = {
  telegram_id: targetUserId,
  currency: 999999999,
  level: 999,
  total_xp: 999999999
};

await supabase.from('game_progress').upsert(maliciousPayload);
```

#### Impact
- **Unlimited currency**: Set balance to any value
- **Max level**: Instantly reach prestige requirements
- **Complete state manipulation**: Modify any game parameter

#### Remediation
- Implement server-authoritative state saves
- Remove direct client-to-database writes for critical fields
- Use edge functions with initData validation for all state mutations

---

### V005: AdsGram Reward Secret Hardcoded in Source

**Severity:** 🟠 HIGH  
**CVSS 3.1:** 8.2 (CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:N)

#### Description
The AdsGram reward secret is hardcoded in `adsgram-reward/index.ts`:

```typescript
// adsgram-reward/index.ts:11-12
const ADSGRAM_BLOCK_ID = '36787';
const ADSGRAM_SECRET = 'e73dc047768d42dba4d64432274c05c1';  // ⚠️ HARDCODED
```

#### Impact
- **Anyone with source code access** can claim rewards for any user
- **Source code leakage** (via git, npm packages, etc.) exposes the secret
- **No secret rotation** possible without code changes

#### Remediation
Move to environment variable:
```typescript
const ADSGRAM_SECRET = Deno.env.get("ADSGRAM_SECRET") ?? "";
```

---

### V006: No Rate Limiting on Edge Functions

**Severity:** 🟠 HIGH  
**CVSS 3.1:** 7.5 (CVSS:3.1/AV:N/AC:H/PR:N/UI:N/S:U/C:N/I:H/A:H)

#### Description
No rate limiting is implemented on any edge function endpoint.

#### Proof of Concept
```bash
# Script to spam ad rewards
for i in {1..1000}; do
  curl -X POST https://[project].supabase.co/functions/v1/claim-ad-reward \
    -H "Content-Type: application/json" \
    -d '{"telegram_id": 123456789, "reward_type": "energy_restore"}'
done
```

#### Impact
- **Resource exhaustion**: Multiple simultaneous requests
- **Reward abuse**: Claim rewards faster than intended
- **DoS potential**: Overwhelm database with requests

#### Remediation
Implement rate limiting using Supabase's built-in features or custom middleware:
```typescript
// Example: Simple in-function rate limiting
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const RATE_LIMIT_MAX = 10;

const rateLimitKey = `rate:${telegramId}:${Math.floor(Date.now() / RATE_LIMIT_WINDOW)}`;
// Check Redis/memory cache for request count
// Reject if exceeds RATE_LIMIT_MAX
```

---

### V007: AdsGram POST Endpoint Accepts userid Without Verification

**Severity:** 🟠 HIGH  
**CVSS 3.1:** 8.6 (CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:N)

#### Description
The `handlePostCallback` function in `adsgram-reward/index.ts` accepts `userid` from the POST body without any verification:

```typescript
// adsgram-reward/index.ts:241-251
async function handlePostCallback(body: { userid?: string; ad_id?: string; reward_type?: string }) {
  const { userid, ad_id, reward_type } = body;
  // ... no verification that this userid is legitimate
  const telegramId = parseInt(userid, 10);  // Attacker-controlled!
```

#### Proof of Concept
```bash
# Claim XP boost for any user
curl -X POST https://[project].supabase.co/functions/v1/adsgram-reward \
  -d '{"userid": "123456789", "ad_id": "fake_ad_123"}'
```

#### Impact
- **Unauthorized rewards**: Claim boosts for any user
- **Boost farming**: Accumulate unlimited boosts

#### Remediation
Require initData validation for POST endpoint:
```typescript
// Add validation
const init_data = getInitDataFromRequest(req); // Extract from headers
const validation = validateInitData(init_data);
if (!validation.valid || validation.userId !== telegramId) {
  return jsonResponse({ error: "Unauthorized" }, 403);
}
```

---

### V008: HTML Injection in Push Notification

**Severity:** 🟡 MEDIUM  
**CVSS 3.1:** 6.1 (CVSS:3.1/AV:N/AC:L/PR:N/UI:R/S:C/C:L/I:H/A:N)

#### Description
The `push-notification/index.ts` function uses user-provided `title` and `message` directly in HTML without sanitization:

```typescript
// push-notification/index.ts:47-48
const fullMessage = `<b>${title}</b>\n\n${message}`;  // ⚠️ XSS via title/message
```

#### Proof of Concept
```json
{
  "action": "send",
  "telegram_id": 123456789,
  "title": "<img src=x onerror=alert('XSS')>",
  "message": "Click me!"
}
```

#### Impact
- **XSS in Telegram client**: Execute JavaScript in user's Telegram
- **Phishing**: Redirect users to malicious sites via inline keyboard

#### Remediation
```typescript
// Sanitize HTML entities
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

const fullMessage = `<b>${escapeHtml(title)}</b>\n\n${escapeHtml(message)}`;
```

---

### V009: Generator Purchase Validation Not Implemented

**Severity:** 🟡 MEDIUM  
**CVSS 3.1:** 5.3 (CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:N/I:H/A:N)

#### Description
The `buyGenerator` function in `game-action/index.ts` is not implemented:

```typescript
// game-action/index.ts:62-78
async function buyGenerator(supabase, telegramId, generatorId) {
  // Generator lookup — TODO: server-side generator definitions
  return { ok: false, error: "buy_generator: cost validation requires server-side generator definitions — coming soon" };
}
```

#### Impact
- **Client-side only validation**: Cost calculations are in client code
- **Cheat potential**: Modified client can buy generators without checking balance

#### Remediation
Implement server-side generator definitions:
```typescript
const GENERATORS = {
  // Define all generators with costs
};

async function buyGenerator(supabase, telegramId, generatorId) {
  const generator = GENERATORS[generatorId];
  if (!generator) return { ok: false, error: "Unknown generator" };
  
  const cost = calculateCost(generator, ownedLevel);
  // ... verify balance, deduct, add generator
}
```

---

### V010: Overly Permissive CORS Policy

**Severity:** 🟡 MEDIUM  
**CVSS 3.1:** 5.3 (CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:L/I:N/A:N)

#### Description
All edge functions use wildcard CORS:

```typescript
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",  // ⚠️ Allows any origin
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};
```

#### Impact
- **CSRF vulnerability**: Any website can make requests on behalf of users
- **Data exfiltration**: External sites can read responses

#### Remediation
Restrict to Telegram domains:
```typescript
const ALLOWED_ORIGINS = [
  'https://t.me',
  'https://*.t.me',
  'https://web.telegram.org'
];

function getCorsHeaders(origin: string) {
  if (ALLOWED_ORIGINS.some(o => matchOrigin(origin, o))) {
    return { "Access-Control-Allow-Origin": origin };
  }
  return {};
}
```

---

### V011-V013: Low Severity Issues

#### V011: No Explicit HTTPS Enforcement
- Supabase Edge Functions automatically use HTTPS
- Document this in deployment checklist

#### V012: Device ID Tracking
- Non-Telegram users tracked via localStorage device_id
- Device ID can be spoofed
- Acceptable for non-critical game data

#### V013: No CSRF Token Protection
- Relies on CORS for protection
- Consider implementing for critical actions

---

## Attack Vectors Summary

| Attack Vector | Vulnerabilities | Max Impact |
|--------------|-----------------|------------|
| Reward Farming | V001, V006, V007 | Unlimited free rewards |
| Currency Cheat | V001, V002, V004 | Unlimited in-game currency |
| Account Takeover | V001, V002, V004 | Full account control |
| Privacy Breach | V002 | Expose all player data |
| Economy Manipulation | V001, V003 | Duplicate rewards |

---

## Recommended Priority Actions

### Immediate (Critical)
1. Add initData validation to all edge functions (V001)
2. Fix RLS policies (V002)
3. Fix swap_last_online_at function (V003)

### Short-term (High)
4. Remove hardcoded AdsGram secret (V005)
5. Implement rate limiting (V006)
6. Add validation to AdsGram POST (V007)

### Medium-term (Medium)
7. Sanitize push notification inputs (V008)
8. Implement generator server-side logic (V009)
9. Restrict CORS to Telegram domains (V010)

---

## Testing Checklist

- [ ] Verify initData validation on all endpoints
- [ ] Test RLS with different telegram_ids
- [ ] Race condition testing for offline income
- [ ] SQL injection testing on all inputs
- [ ] XSS testing on push notification
- [ ] Rate limit testing
- [ ] CSRF testing
- [ ] Privacy data leak testing

---

## Appendix: File References

| File | Lines | Vulnerability |
|------|-------|---------------|
| supabase/functions/claim-ad-reward/index.ts | 28-29, 121-122 | V001, V006 |
| supabase/functions/open-chest/index.ts | 33-34, 235-236 | V001, V006 |
| supabase/functions/perform-prestige/index.ts | 45-46, 96-97 | V001, V006 |
| supabase/functions/claim-offline-income/index.ts | 24-25, 46-47 | V001, V003, V006 |
| supabase/functions/track-session/index.ts | 25-26, 47-48 | V001, V006 |
| supabase/functions/push-notification/index.ts | 152, 47-48 | V001, V008 |
| supabase/functions/adsgram-reward/index.ts | 241-251, 11-12 | V005, V007 |
| supabase/functions/telegram-payments/index.ts | 265-269 | V001 |
| supabase/migrations/20260614122943_007_fix_rls_and_level_cap.sql | 36-51 | V002 |
| supabase/migrations/20260617135202_018_swap_last_online_at_lock_fix.sql | 1-13 | V003 |
| src/lib/storage.ts | 156-160 | V004 |

---

**Report Generated:** 2026-07-02  
**Next Review:** After implementing V001-V003 fixes  
**Contact:** security@aastudios.dev
