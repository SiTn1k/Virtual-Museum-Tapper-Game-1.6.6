# Virtual Museum Tapper Game - Risk Register

**Document Version:** 1.0  
**Date:** 2026-07-02  
**Prepared By:** Technical Director  
**Review Cycle:** Monthly  
**Classification:** Internal - AAA Studio Standards

---

## Executive Summary

This Risk Register documents all identified risks for the Virtual Museum Tapper Game, a Telegram Mini App idle clicker game built on React + Supabase. The register covers security vulnerabilities, performance bottlenecks, business model risks, technical architecture concerns, third-party dependencies, operational challenges, and market factors.

**Total Risks Identified:** 68  
**Critical:** 8 | **High:** 15 | **Medium:** 28 | **Low:** 17

---

## Risk Matrix

| Severity ↓ / Probability → | Very Likely | Likely | Possible | Unlikely |
|------------------------------|-------------|--------|----------|----------|
| **Critical** | R-001, R-002 | R-003, R-015 | R-004, R-024 | - |
| **High** | R-005, R-006 | R-007, R-008, R-016, R-017, R-025 | R-009, R-010, R-018, R-019, R-026 | R-020 |
| **Medium** | R-011, R-012, R-027 | R-013, R-014, R-021, R-028, R-029, R-036 | R-022, R-030, R-037, R-038, R-045 | R-023, R-031 |
| **Low** | R-032, R-039 | R-033, R-040, R-046 | R-034, R-041, R-047, R-048, R-053 | R-035, R-042, R-043, R-044, R-049, R-050, R-051, R-052, R-054 |

---

## 1. SECURITY RISKS

### R-001: Client-Side State Manipulation via DevTools

**Description:** Players can modify game state (currency, XP, energy) directly in browser DevTools or via localStorage manipulation. Although `rpcUpgradeTap` and `rpcBuyGenerator` are server-authoritative, most state changes occur client-side before syncing.

**Category:** Security  
**Severity:** Critical  
**Probability:** Very Likely  
**Impact:** Severe  

**Affected Components:**
- `src/hooks/useGame.ts` - All state mutations (tap, buyGenerator, passive income)
- `src/lib/storage.ts` - localStorage save/load operations
- `src/components/GeneratorShop.tsx` - Client-side currency validation

**Evidence:**
```typescript
// src/hooks/useGame.ts:434
const handleBuy = (generatorId: string): boolean => {
  const ok = buyGenerator(generatorId); // Client-side validation first
  if (ok) hapticNotification('success');
  return ok;
};
```

**Mitigation Strategy:**
1. Implement server-authoritative state for ALL game actions (not just tap upgrades)
2. Move generator purchases, passive income calculations, and XP gains to edge functions
3. Add server-side rate limiting per telegram_id
4. Implement server-side validation for epoch switching and artifact operations

**Owner:** Backend Agent, Security Agent  
**Status:** Open  
**Target Resolution:** Sprint 4

---

### R-002: HMAC Validation Bypass in Edge Functions

**Description:** While `validate-init-data` and `game-action` functions validate HMAC-SHA256 signatures, several edge functions do not validate initData, allowing potential identity spoofing.

**Category:** Security  
**Severity:** Critical  
**Probability:** Very Likely  
**Impact:** Severe  

**Affected Components:**
- `supabase/functions/claim-ad-reward/index.ts` - No initData validation
- `supabase/functions/claim-offline-income/index.ts` - No initData validation
- `supabase/functions/open-chest/index.ts` - No initData validation
- `supabase/functions/push-notification/index.ts` - No initData validation
- `supabase/functions/track-session/index.ts` - No initData validation

**Evidence:**
```typescript
// supabase/functions/claim-ad-reward/index.ts:121-126
const body: ClaimAdRewardRequest = await req.json();
const { telegram_id, reward_type } = body;
// No HMAC validation - telegram_id comes from client directly!
```

**Mitigation Strategy:**
1. Create shared HMAC validation utility
2. Apply to all edge functions accepting telegram_id
3. Use validated telegram_id from HMAC, not client-supplied value
4. Add rate limiting per validated telegram_id

**Owner:** Backend Agent, Security Agent  
**Status:** Open  
**Target Resolution:** Sprint 3

---

### R-003: Race Condition in Offline Income Calculation

**Description:** The `swap_last_online_at` RPC is designed to prevent race conditions, but the fallback path (`claim-offline-income/index.ts:64-82`) does not use atomic operations, allowing double-claim exploits.

**Category:** Security  
**Severity:** High  
**Probability:** Likely  
**Impact:** Severe  

**Evidence:**
```typescript
// supabase/functions/claim-offline-income/index.ts:59-82
// If RPC fails, falls back to non-atomic fetch+update
const { data: player, error: fetchError } = await supabase
  .from("game_progress")
  .select("...");
return await processClaim(supabase, telegram_id, player, now, x2_boost);
```

**Mitigation Strategy:**
1. Ensure `swap_last_online_at` RPC is deployed and reliable
2. Remove fallback path or implement atomic transaction
3. Add server-side idempotency keys for offline claims

**Owner:** Backend Agent  
**Status:** Open  
**Target Resolution:** Sprint 2

---

### R-004: AdsGram Secret Key Exposure in Frontend

**Description:** The AdsGram secret token is hardcoded in `src/services/adsgram.ts` and `src/components/AdsGramButton.tsx`, exposing it to all users.

**Category:** Security  
**Severity:** Critical  
**Probability:** Possible  
**Impact:** Severe  

**Evidence:**
```typescript
// src/services/adsgram.ts:17
export const ADSGRAM_SECRET = 'e73dc047768d42dba4d64432274c05c1';
```

**Mitigation Strategy:**
1. Move AdsGram secret to environment variable (build-time)
2. Use backend verification endpoint instead of client-side secret
3. Implement server-side AdsGram callback validation only

**Owner:** Frontend Agent, Backend Agent  
**Status:** Open  
**Target Resolution:** Sprint 2

---

### R-005: Insufficient Rate Limiting on Ad Rewards

**Description:** Daily ad limits are enforced client-side in `claim-ad-reward/index.ts` but lack server-side deduplication beyond basic counting. Multiple concurrent requests could bypass limits.

**Category:** Security  
**Severity:** High  
**Probability:** Very Likely  
**Impact:** Significant  

**Evidence:**
```typescript
// supabase/functions/claim-ad-reward/index.ts:150-162
// Check happens after fetch, not atomic
const dailyAdViews = resetIfNewDay((player.daily_ad_views as DailyAdViews) || {});
const currentCount = dailyAdViews[adCountKey] || 0;
if (currentCount >= dailyLimit) { ... }
```

**Mitigation Strategy:**
1. Use database constraints for atomic increment
2. Add unique index on (telegram_id, reward_type, date) for ad views
3. Implement exponential backoff on client

**Owner:** Backend Agent  
**Status:** Open  
**Target Resolution:** Sprint 3

---

### R-006: CORS Policy Allows Unrestricted Cross-Origin Access

**Description:** All edge functions use `Access-Control-Allow-Origin: *` which allows any website to make requests to the backend.

**Category:** Security  
**Severity:** High  
**Probability:** Very Likely  
**Impact:** Significant  

**Evidence:**
```typescript
// All edge functions include:
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  ...
};
```

**Mitigation Strategy:**
1. Validate Telegram initData for all authenticated requests
2. Restrict CORS to Telegram domains only
3. Add API key validation for internal endpoints

**Owner:** Backend Agent  
**Status:** Open  
**Target Resolution:** Sprint 3

---

### R-007: Bot Token Exposure via GET Request Parameters

**Description:** The `telegram-payments/index.ts` status page exposes system configuration via GET parameters and HTML responses.

**Category:** Security  
**Severity:** High  
**Probability:** Likely  
**Impact:** Significant  

**Evidence:**
```typescript
// supabase/functions/telegram-payments/index.ts:107-201
if (req.method === "GET") {
  const action = url.searchParams.get("action");
  // Status page reveals webhook info, token status
}
```

**Mitigation Strategy:**
1. Move status page to separate admin endpoint
2. Require authentication for status endpoints
3. Remove sensitive info from GET responses

**Owner:** Backend Agent  
**Status:** Open  
**Target Resolution:** Sprint 2

---

### R-008: No Input Sanitization on Artifact IDs

**Description:** Artifact IDs from client are directly used in database queries without sanitization.

**Category:** Security  
**Severity:** High  
**Probability:** Likely  
**Impact:** Significant  

**Evidence:**
```typescript
// supabase/functions/open-chest/index.ts:168-180
const eligible = ARTIFACTS.filter((a) => {
  if (a.epoch !== epochId) return false;
  // epochId from client not validated against enum
  ...
});
```

**Mitigation Strategy:**
1. Validate all enum values against allowed set
2. Use parameterized queries
3. Add schema validation layer

**Owner:** Backend Agent  
**Status:** Open  
**Target Resolution:** Sprint 3

---

### R-009: Telegram Webhook Security

**Description:** Webhook endpoint accepts all Telegram updates without verifying message origin.

**Category:** Security  
**Severity:** High  
**Probability:** Possible  
**Impact:** Significant  

**Evidence:**
```typescript
// supabase/functions/telegram-payments/index.ts:207-262
// Accepts any message with successful_payment
if (body.message?.successful_payment) {
  const msg = body.message;
  // No verification that this came from Telegram
}
```

**Mitigation Strategy:**
1. Verify Telegram API secret hash for all webhooks
2. Add IP whitelist for Telegram servers
3. Implement request timestamp validation

**Owner:** Backend Agent  
**Status:** Open  
**Target Resolution:** Sprint 4

---

### R-010: localStorage Data Tampering

**Description:** Client state stored in localStorage can be modified to gain advantages before sync.

**Category:** Security  
**Severity:** High  
**Probability:** Possible  
**Impact:** Significant  

**Evidence:**
```typescript
// src/lib/storage.ts:91-100
export function saveLocalState(state: GameState): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({
      ...state,
      lastSavedAt: Date.now(),
    }));
  }
  // No integrity checking
}
```

**Mitigation Strategy:**
1. Add HMAC signature to localStorage data
2. Verify signature on load
3. Treat localStorage as untrusted cache only

**Owner:** Frontend Agent  
**Status:** Open  
**Target Resolution:** Sprint 4

---

### R-011: Duplicate Session Tracking

**Description:** `track-session/index.ts` creates multiple sessions for same user without proper cleanup.

**Category:** Security  
**Severity:** Medium  
**Probability:** Likely  
**Impact:** Moderate  

**Evidence:**
```typescript
// supabase/functions/track-session/index.ts:61-84
case "start": {
  // Only closes existing sessions if data exists
  if (openSessions && openSessions.length > 0) { ... }
  // But concurrent requests could create duplicates
}
```

**Mitigation Strategy:**
1. Use unique constraint on open sessions per user
2. Implement session locking
3. Add cleanup job for orphaned sessions

**Owner:** Backend Agent  
**Status:** Open  
**Target Resolution:** Sprint 3

---

### R-012: No CAPTCHA/Anti-Bot Protection on Registration

**Description:** New user registration and referral bonus application have no bot detection.

**Category:** Security  
**Severity:** Medium  
**Probability:** Likely  
**Impact:** Moderate  

**Evidence:**
```typescript
// src/lib/storage.ts:368-381
async function applyReferralBonus(newUserId: number, referrerId: number): Promise<void> {
  // No verification that newUserId is legitimate
  await supabase.from("game_progress").update({ ... }).eq("telegram_id", referrerId);
}
```

**Mitigation Strategy:**
1. Implement Telegram Mini App validation on signup
2. Add rate limiting per IP/device
3. Require minimum session duration before referral

**Owner:** Backend Agent, Anti-Cheat Agent  
**Status:** Open  
**Target Resolution:** Sprint 4

---

### R-013: Weak Referral ID Validation

**Description:** Referral ID from start_param is not validated server-side before applying bonuses.

**Category:** Security  
**Severity:** Medium  
**Probability:** Likely  
**Impact:** Moderate  

**Evidence:**
```typescript
// src/lib/telegram.ts:129-136
export function getReferrerId(): number | null {
  const startParam = getParsedInitData().startParam;
  if (startParam?.startsWith('ref_')) {
    const refId = parseInt(startParam.replace('ref_', ''), 10);
    return isNaN(refId) ? null : refId;
  }
  // No server-side validation before use
}
```

**Mitigation Strategy:**
1. Validate referrer exists in database
2. Check referrer is not self
3. Implement referral cooldown period

**Owner:** Backend Agent  
**Status:** Open  
**Target Resolution:** Sprint 3

---

### R-014: No Encryption of Sensitive Data at Rest

**Description:** Player data stored in Supabase is not encrypted at the application level.

**Category:** Security  
**Severity:** Medium  
**Probability:** Likely  
**Impact:** Moderate  

**Evidence:**
- `game_progress` table contains telegram_id, username, photo_url
- No field-level encryption visible in migrations

**Mitigation Strategy:**
1. Enable Supabase database encryption
2. Encrypt sensitive fields (telegram_id hash, referral links)
3. Implement data retention policies

**Owner:** DevOps Agent  
**Status:** Open  
**Target Resolution:** Sprint 4

---

### R-015: Missing Authentication on Public Endpoints

**Description:** Several edge functions accept requests without requiring authentication.

**Category:** Security  
**Severity:** Critical  
**Probability:** Likely  
**Impact:** Severe  

**Evidence:**
```typescript
// supabase/functions/adsgram-reward/index.ts:285-311
// POST requests from frontend don't validate initData
async function handlePostCallback(body: { userid?: string; ... }) {
  // Accepts any userid without verification
}
```

**Mitigation Strategy:**
1. Require initData validation for all authenticated endpoints
2. Implement JWT/session tokens
3. Add API gateway authentication layer

**Owner:** Backend Agent  
**Status:** Open  
**Target Resolution:** Sprint 2

---

## 2. PERFORMANCE RISKS

### R-016: No Pagination on Leaderboard Queries

**Description:** `getUserRank` loads up to 1000 players to find single user rank.

**Category:** Performance  
**Severity:** High  
**Probability:** Likely  
**Impact:** Significant  

**Evidence:**
```typescript
// src/lib/storage.ts:413-431
export async function getUserRank(telegramId: number): Promise<number | null> {
  const { data } = await supabase
    .from("game_progress")
    .select(...)
    .order(...)
    .limit(1000); // Full table scan for rank!
  const index = data.findIndex(row => row.telegram_id === telegramId);
}
```

**Mitigation Strategy:**
1. Create materialized view with pre-computed ranks
2. Add window function for rank calculation
3. Cache leaderboard with 5-minute TTL

**Owner:** Backend Agent, Database Agent  
**Status:** Open  
**Target Resolution:** Sprint 2

---

### R-017: No Query Indexing Strategy

**Description:** No explicit indexes defined for frequently queried columns (telegram_id, level, prestige_level).

**Category:** Performance  
**Severity:** High  
**Probability:** Likely  
**Impact:** Significant  

**Evidence:**
```typescript
// Checked migrations - no explicit CREATE INDEX statements
// Primary key exists, but composite indexes missing
```

**Mitigation Strategy:**
1. Add composite index on (prestige_level, level, total_xp)
2. Index telegram_id (should exist as primary)
3. Add partial index for active sessions

**Owner:** Database Agent, DevOps Agent  
**Status:** Open  
**Target Resolution:** Sprint 1

---

### R-018: Expensive Passive Income Calculation

**Description:** Passive XP calculation happens client-side with complex estimation algorithm, causing potential UI lag.

**Category:** Performance  
**Severity:** High  
**Probability:** Possible  
**Impact:** Significant  

**Evidence:**
```typescript
// src/hooks/useGame.ts:88-99
function estimatePassiveForEpoch(epoch: Epoch, levelInEpoch: number): number {
  // Complex calculation with multiple iterations
  for (let i = 0; i < epoch.generators.length && i < tierWeights.length; i++) { ... }
}
```

**Mitigation Strategy:**
1. Pre-compute passive income on server
2. Cache calculation results
3. Use Web Workers for heavy computation

**Owner:** Frontend Agent  
**Status:** Open  
**Target Resolution:** Sprint 3

---

### R-019: localStorage I/O Blocking

**Description:** Synchronous localStorage operations in `saveLocalState` can block main thread.

**Category:** Performance  
**Severity:** High  
**Probability:** Possible  
**Impact:** Significant  

**Evidence:**
```typescript
// src/lib/storage.ts:91-100
export function saveLocalState(state: GameState): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({...})); // Sync!
  }
}
```

**Mitigation Strategy:**
1. Use async storage wrapper
2. Batch save operations
3. Debounce frequent updates

**Owner:** Frontend Agent  
**Status:** Open  
**Target Resolution:** Sprint 3

---

### R-020: Missing Connection Pool Configuration

**Description:** No explicit Supabase connection pooling configuration; default settings may be insufficient under load.

**Category:** Performance  
**Severity:** Medium  
**Probability:** Unlikely  
**Impact:** Significant  

**Evidence:**
```typescript
// src/lib/supabase.ts
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
// No connection pool settings
```

**Mitigation Strategy:**
1. Configure connection pool size based on expected load
2. Implement request queuing
3. Add connection health checks

**Owner:** DevOps Agent  
**Status:** Open  
**Target Resolution:** Sprint 4

---

### R-021: No Cache Layer

**Description:** No caching strategy for frequently accessed data (leaderboard, user rank, epoch data).

**Category:** Performance  
**Severity:** Medium  
**Probability:** Likely  
**Impact:** Moderate  

**Evidence:**
```typescript
// Leaderboard fetched fresh every time
const data = await getLeaderboard(50);
// No cache headers or CDN
```

**Mitigation Strategy:**
1. Implement Redis cache for leaderboard
2. Add edge caching for static epoch data
3. Use SWR/React Query for client-side caching

**Owner:** Backend Agent, Frontend Agent  
**Status:** Open  
**Target Resolution:** Sprint 4

---

### R-022: Large State Serialization

**Description:** Game state object grows with artifact parts, boosters, generators - serialization cost increases.

**Category:** Performance  
**Severity:** Medium  
**Probability:** Possible  
**Impact:** Moderate  

**Evidence:**
```typescript
// src/types/game.ts - ActiveBoosters can contain unlimited purchase_log
interface ActiveBoosters {
  purchase_log?: Array<{ id: string; charge_id: string; purchased_at: string }>;
  // Grows indefinitely
}
```

**Mitigation Strategy:**
1. Implement purchase log archival
2. Compress state before storage
3. Prune old booster data

**Owner:** Frontend Agent, Backend Agent  
**Status:** Open  
**Target Resolution:** Sprint 4

---

### R-023: No Lazy Loading of Epoch Data

**Description:** All 20 epochs loaded into memory even if player only needs current epoch.

**Category:** Performance  
**Severity:** Low  
**Probability:** Unlikely  
**Impact:** Minor  

**Evidence:**
```typescript
// src/data/epochs.ts
export const EPOCHS = [ /* 20 epoch definitions */ ];
// Loaded entirely on app start
```

**Mitigation Strategy:**
1. Implement code splitting per epoch
2. Use dynamic imports
3. Load epoch data on-demand

**Owner:** Frontend Agent  
**Status:** Open  
**Target Resolution:** Backlog

---

### R-024: No Database Query Timeouts

**Description:** Supabase queries have no explicit timeout configuration.

**Category:** Performance  
**Severity:** Critical  
**Probability:** Possible  
**Impact:** Severe  

**Evidence:**
```typescript
// All supabase calls use default timeout (usually 60s)
// No .timeout() configuration visible
```

**Mitigation Strategy:**
1. Set explicit query timeouts
2. Implement circuit breaker pattern
3. Add request cancellation support

**Owner:** Backend Agent  
**Status:** Open  
**Target Resolution:** Sprint 2

---

## 3. BUSINESS MODEL RISKS

### R-025: Overpowered Boosters Erode Game Economy

**Description:** Current booster multipliers (x3 XP, x2 currency) combined with artifact bonuses create runaway progression.

**Category:** Business  
**Severity:** High  
**Probability:** Likely  
**Impact:** Significant  

**Evidence:**
```typescript
// src/hooks/useGame.ts:177-181
const effectiveTapPower = Math.max(1,
  Math.round(state.tapPower * artifactMultipliers.xp * boosterMultipliers.xp * energyMultiplier * prestigeXpBonus),
);
// Multipliers stack multiplicatively: 1 * 1.1 * 3 * 5 * 1.3 = 21.45x base!
```

**Mitigation Strategy:**
1. Implement diminishing returns formula
2. Cap maximum multiplier combinations
3. Monitor economy metrics and adjust

**Owner:** Game Design Agent  
**Status:** Open  
**Target Resolution:** Sprint 3

---

### R-026: Pay-to-Win Perception

**Description:** Telegram Stars purchases provide significant advantages over free players.

**Category:** Business  
**Severity:** High  
**Probability:** Possible  
**Impact:** Significant  

**Evidence:**
```typescript
// supabase/functions/telegram-payments/index.ts:23-76
const BOOSTERS: Record<string, BoosterDef> = {
  super_boost_30m: { price: 100, effect: "super_x3" }, // x3 for all
  legendary_gacha: { price: 200, effect: "legendary_next" }, // Guaranteed rare
  great_patron: { price: 25, effect: "permanent_benefit" }, // +50% offline
};
```

**Mitigation Strategy:**
1. Focus on convenience vs. power differences
2. Implement cosmetic-only premium features
3. Create fair competitive leaderboards (boosters vs. no-boosters)

**Owner:** Product Manager, Game Design Agent  
**Status:** Open  
**Target Resolution:** Sprint 4

---

### R-027: Insufficient Monetization Touchpoints

**Description:** Only 2 monetization options (Stars boosters, AdsGram ads) with limited engagement.

**Category:** Business  
**Severity:** Medium  
**Probability:** Very Likely  
**Impact:** Moderate  

**Evidence:**
- No in-app purchase tiers
- Limited ad frequency caps
- No battle pass or season pass
- No cosmetics store

**Mitigation Strategy:**
1. Implement seasonal content passes
2. Add cosmetic customization store
3. Create limited-time offers
4. Develop affiliate program

**Owner:** Product Manager  
**Status:** Open  
**Target Resolution:** Sprint 5

---

### R-028: Currency Deflation Risk

**Description:** Passive currency generation combined with limited sinks causes inflation.

**Category:** Business  
**Severity:** Medium  
**Probability:** Likely  
**Impact:** Moderate  

**Evidence:**
```typescript
// src/hooks/useGame.ts:passiveXpPerSecond
// Currency earned passively while offline
// Limited sinks: generators, tap upgrades, chests
```

**Mitigation Strategy:**
1. Add more currency sinks (skins, titles, effects)
2. Implement prestige-locked cosmetics
3. Create time-limited offers
4. Regular economy balancing patches

**Owner:** Game Design Agent, Economy Agent  
**Status:** Open  
**Target Resolution:** Ongoing

---

### R-029: Low User Retention

**Description:** No engagement loops beyond daily login streak - players may churn after initial sessions.

**Category:** Business  
**Severity:** Medium  
**Probability:** Likely  
**Impact:** Moderate  

**Evidence:**
- Daily tasks system implemented but minimal rewards
- No push notification strategy (only basic functionality)
- No social features beyond referrals
- No events or time-limited content

**Mitigation Strategy:**
1. Implement push notification campaigns
2. Add weekly/monthly events
3. Create social features (clans, chat)
4. Develop achievement system

**Owner:** Product Manager, LiveOps Agent  
**Status:** Open  
**Target Resolution:** Sprint 4

---

### R-030: Revenue Concentration Risk

**Description:** Over-reliance on single monetization channel (Telegram Stars).

**Category:** Business  
**Severity:** High  
**Probability:** Possible  
**Impact:** Significant  

**Evidence:**
- No premium version
- No cross-platform monetization
- AdsGram only ad partner
- No merchandise

**Mitigation Strategy:**
1. Diversify payment methods
2. Implement Web App monetization
3. Develop merchandise store
4. Create enterprise/education licensing

**Owner:** Product Manager  
**Status:** Open  
**Target Resolution:** Sprint 6

---

### R-031: Ukraine-Centric Market Limitation

**Description:** Game content and localization primarily Ukrainian limits global expansion.

**Category:** Business  
**Severity:** Low  
**Probability:** Unlikely  
**Impact:** Minor  

**Evidence:**
```typescript
// src/data/epochs.ts
// Ukrainian epochs: Trypillia, Scythia, Kyiv Rus, Cossack, etc.
// Limited English content
// Currency names, descriptions primarily Ukrainian
```

**Mitigation Strategy:**
1. Expand English content
2. Add world history epochs (already partially implemented)
3. Create regional content packs
4. Localize for multiple languages

**Owner:** Product Manager, Localization Agent  
**Status:** Open  
**Target Resolution:** Sprint 6

---

### R-032: Competitive Landscape Pressure

**Description:** Tapper game market is saturated; differentiation is critical.

**Category:** Business  
**Severity:** Medium  
**Probability:** Very Likely  
**Impact:** Moderate  

**Evidence:**
- Multiple Telegram tapper games exist
- Similar gameplay mechanics
- Limited unique selling proposition

**Mitigation Strategy:**
1. Emphasize historical education angle
2. Develop unique art/artifact collection system
3. Create community-driven content
4. Partner with museums/cultural institutions

**Owner:** Product Manager, Marketing Agent  
**Status:** Open  
**Target Resolution:** Ongoing

---

### R-033: Platform Policy Risk

**Description:** Telegram policies may change, affecting Mini App availability or monetization.

**Category:** Business  
**Severity:** Medium  
**Probability:** Likely  
**Impact:** Moderate  

**Evidence:**
- Dependence on Telegram platform
- Stars payment API is Telegram-controlled
- Mini App guidelines subject to change

**Mitigation Strategy:**
1. Maintain web version as fallback
2. Develop standalone mobile apps
3. Build community outside Telegram
4. Monitor policy changes

**Owner:** Product Manager, DevOps Agent  
**Status:** Open  
**Target Resolution:** Sprint 5

---

## 4. TECHNICAL ARCHITECTURE RISKS

### R-034: Code Duplication Between Frontend and Backend

**Description:** Epoch data, artifact definitions, and game formulas duplicated in frontend and edge functions.

**Category:** Technical  
**Severity:** Medium  
**Probability:** Possible  
**Impact:** Moderate  

**Evidence:**
```typescript
// src/data/epochs.ts - Artifact definitions
// supabase/functions/open-chest/index.ts - Same artifacts duplicated
const ARTIFACTS: Array<{ ... }> = [ /* Same data */ ];
```

**Mitigation Strategy:**
1. Create shared game configuration package
2. Load definitions from database at runtime
3. Implement schema validation for consistency

**Owner:** Frontend Agent, Backend Agent  
**Status:** Open  
**Target Resolution:** Sprint 4

---

### R-035: No TypeScript Strict Mode

**Description:** TypeScript configuration may not enforce strict type checking.

**Category:** Technical  
**Severity:** Low  
**Probability:** Unlikely  
**Impact:** Minor  

**Evidence:**
```typescript
// tsconfig.app.json - needs verification
// "strict": true not visible in viewed config
```

**Mitigation Strategy:**
1. Enable strict mode in tsconfig
2. Add eslint rules for type safety
3. Implement runtime type validation

**Owner:** Frontend Agent  
**Status:** Open  
**Target Resolution:** Sprint 2

---

### R-036: No Error Boundary in React Components

**Description:** Unhandled component errors can crash entire application.

**Category:** Technical  
**Severity:** Medium  
**Probability:** Likely  
**Impact:** Moderate  

**Evidence:**
```typescript
// No error boundaries visible in component tree
// Single component failure crashes App.tsx
```

**Mitigation Strategy:**
1. Implement ErrorBoundary components
2. Add try-catch around async operations
3. Create fallback UI components

**Owner:** Frontend Agent  
**Status:** Open  
**Target Resolution:** Sprint 2

---

### R-037: Missing Unit Test Coverage

**Description:** No automated tests for critical game logic.

**Category:** Technical  
**Severity:** Medium  
**Probability:** Possible  
**Impact:** Moderate  

**Evidence:**
- No test files found
- No Jest/Vitest configuration
- Critical calculations untested

**Mitigation Strategy:**
1. Set up Vitest testing framework
2. Add tests for game calculations
3. Implement E2E tests for critical flows
4. Target 80% coverage on core logic

**Owner:** QA Agent, Frontend Agent  
**Status:** Open  
**Target Resolution:** Sprint 3

---

### R-038: No API Versioning Strategy

**Description:** Edge functions have no versioning; breaking changes affect all users.

**Category:** Technical  
**Severity:** Medium  
**Probability:** Possible  
**Impact:** Moderate  

**Evidence:**
```typescript
// supabase/functions/telegram-payments/index.ts
// No /v1/, /v2/ versioning
// Changes deployed directly
```

**Mitigation Strategy:**
1. Implement /functions/v1/ pattern
2. Maintain backward compatibility
3. Add deprecation notices
4. Use feature flags

**Owner:** Backend Agent  
**Status:** Open  
**Target Resolution:** Sprint 4

---

### R-039: Environment Variable Validation Missing

**Description:** No validation that required environment variables are set.

**Category:** Technical  
**Severity:** Medium  
**Probability:** Very Likely  
**Impact:** Moderate  

**Evidence:**
```typescript
// src/lib/supabase.ts:6-8
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials not configured. Using local storage only.');
}
// Only warning, no build failure
```

**Mitigation Strategy:**
1. Validate env vars at build time
2. Use zod for runtime validation
3. Fail fast with clear error messages

**Owner:** Frontend Agent, DevOps Agent  
**Status:** Open  
**Target Resolution:** Sprint 2

---

### R-040: No Monitoring/Observability

**Description:** No logging, metrics, or alerting infrastructure.

**Category:** Technical  
**Severity:** Medium  
**Probability:** Likely  
**Impact:** Moderate  

**Evidence:**
```typescript
// Basic console.log used throughout
console.error('localStorage save failed:', e);
console.log(`Session started: user=${telegram_id}`);
```

**Mitigation Strategy:**
1. Implement structured logging (Loki/CloudWatch)
2. Add Prometheus metrics
3. Configure alerts for error rates
4. Set up APM (Application Performance Monitoring)

**Owner:** DevOps Agent  
**Status:** Open  
**Target Resolution:** Sprint 3

---

### R-041: No CI/CD Pipeline

**Description:** Manual deployment process increases risk of errors.

**Category:** Technical  
**Severity:** Medium  
**Probability:** Possible  
**Impact:** Moderate  

**Evidence:**
- No GitHub Actions workflows visible
- Manual build/deploy process
- No staging environment

**Mitigation Strategy:**
1. Set up GitHub Actions for CI/CD
2. Implement staging environment
3. Add automated testing in pipeline
4. Configure rollback mechanism

**Owner:** DevOps Agent  
**Status:** Open  
**Target Resolution:** Sprint 3

---

### R-042: Single Point of Failure - Supabase

**Description:** Entire application depends on Supabase availability.

**Category:** Technical  
**Severity:** Low  
**Probability:** Unlikely  
**Impact:** Significant  

**Evidence:**
- No fallback to alternative backend
- Local storage only works when previously synced
- No data redundancy

**Mitigation Strategy:**
1. Implement graceful degradation
2. Add read replicas
3. Create data backup strategy
4. Document disaster recovery plan

**Owner:** DevOps Agent  
**Status:** Open  
**Target Resolution:** Sprint 4

---

### R-043: No Database Migration Strategy

**Description:** SQL migrations may fail in production without rollback capability.

**Category:** Technical  
**Severity:** Low  
**Probability:** Unlikely  
**Impact:** Moderate  

**Evidence:**
```sql
-- supabase/migrations/*.sql
-- No down migrations
-- No migration testing
```

**Mitigation Strategy:**
1. Implement migration testing in CI
2. Create down migrations
3. Use migration versioning tool
4. Manual review for destructive changes

**Owner:** Database Agent, DevOps Agent  
**Status:** Open  
**Target Resolution:** Sprint 3

---

### R-044: Memory Leaks from Event Listeners

**Description:** Multiple setInterval calls without cleanup in useGame hook.

**Category:** Technical  
**Severity:** Low  
**Probability:** Unlikely  
**Impact:** Minor  

**Evidence:**
```typescript
// src/hooks/useGame.ts
useEffect(() => {
  const interval = setInterval(regenerateEnergy, 2 * 60 * 1000);
  return () => clearInterval(interval);
}, [...]);
// Multiple intervals in single component
```

**Mitigation Strategy:**
1. Consolidate intervals
2. Add useEffect cleanup verification
3. Use AbortController for cleanup
4. Add memory leak detection in testing

**Owner:** Frontend Agent  
**Status:** Open  
**Target Resolution:** Sprint 2

---

## 5. THIRD-PARTY DEPENDENCY RISKS

### R-045: Supabase Dependency Risk

**Description:** Application tightly coupled to Supabase; migration would be expensive.

**Category:** Operational  
**Severity:** High  
**Probability:** Possible  
**Impact:** Significant  

**Evidence:**
- All data storage via Supabase
- Edge functions use Supabase SDK
- Auth tied to Supabase Auth

**Mitigation Strategy:**
1. Abstract data access layer
2. Implement interface for storage operations
3. Document migration path
4. Maintain alternative options

**Owner:** Backend Agent, DevOps Agent  
**Status:** Open  
**Target Resolution:** Sprint 5

---

### R-046: Telegram Platform API Changes

**Description:** Breaking changes to Telegram Mini App API could break functionality.

**Category:** Operational  
**Severity:** Medium  
**Probability:** Likely  
**Impact:** Moderate  

**Evidence:**
```typescript
// src/lib/telegram.ts
// Depends on window.Telegram.WebApp API
tg.openInvoice(data.invoice_url, async (status) => { ... });
```

**Mitigation Strategy:**
1. Version pin Telegram SDK calls
2. Implement feature detection
3. Maintain fallback for deprecated features
4. Monitor Telegram changelog

**Owner:** Frontend Agent  
**Status:** Open  
**Target Resolution:** Ongoing

---

### R-047: AdsGram SDK Availability

**Description:** Dependence on third-party ad SDK for revenue.

**Category:** Operational  
**Severity:** Medium  
**Probability:** Possible  
**Impact:** Moderate  

**Evidence:**
```typescript
// src/services/adsgram.ts
declare global {
  interface Window {
    Adsgram?: { init: ... };
  }
}
```

**Mitigation Strategy:**
1. Implement ad SDK abstraction
2. Maintain multiple ad networks
3. Have fallback monetization ready
4. Monitor SDK performance

**Owner:** Frontend Agent, Product Manager  
**Status:** Open  
**Target Resolution:** Sprint 4

---

### R-048: npm Package Vulnerability Exposure

**Description:** Dependencies may contain security vulnerabilities.

**Category:** Security  
**Severity:** Medium  
**Probability:** Possible  
**Impact:** Moderate  

**Evidence:**
```json
// package.json - some packages not recently updated
"@supabase/supabase-js": "^2.57.4",
"lucide-react": "^0.344.0",
"react": "^18.3.1"
```

**Mitigation Strategy:**
1. Run npm audit regularly
2. Use Snyk/Dependabot for alerts
3. Pin critical dependencies
4. Regular dependency updates

**Owner:** DevOps Agent, Security Agent  
**Status:** Open  
**Target Resolution:** Ongoing

---

### R-049: React 18 Compatibility Issues

**Description:** Using latest React features may have edge cases with Telegram WebApp.

**Category:** Technical  
**Severity:** Low  
**Probability:** Unlikely  
**Impact:** Minor  

**Evidence:**
```json
"react": "^18.3.1",
"react-dom": "^18.3.1"
```

**Mitigation Strategy:**
1. Test on all Telegram-supported platforms
2. Monitor React 18 compatibility
3. Use stable, well-tested patterns

**Owner:** Frontend Agent  
**Status:** Open  
**Target Resolution:** Ongoing

---

### R-050: Vite Build Toolchain Risk

**Description:** Dependence on Vite for builds; alternative may be needed.

**Category:** Technical  
**Severity:** Low  
**Probability:** Unlikely  
**Impact:** Minor  

**Evidence:**
```json
"vite": "^5.4.2"
```

**Mitigation Strategy:**
1. Lock Vite version
2. Document build process
3. Maintain webpack fallback knowledge

**Owner:** Frontend Agent  
**Status:** Open  
**Target Resolution:** Backlog

---

## 6. OPERATIONAL RISKS

### R-051: No Data Backup Strategy

**Description:** No documented backup/restore procedures for game data.

**Category:** Operational  
**Severity:** Medium  
**Probability:** Unlikely  
**Impact:** Moderate  

**Evidence:**
- No backup scripts found
- Relying on Supabase defaults
- No disaster recovery plan

**Mitigation Strategy:**
1. Configure Supabase point-in-time recovery
2. Document backup procedures
3. Test restore process quarterly
4. Create incident response plan

**Owner:** DevOps Agent  
**Status:** Open  
**Target Resolution:** Sprint 2

---

### R-052: No Incident Response Plan

**Description:** No defined process for handling production incidents.

**Category:** Operational  
**Severity:** Medium  
**Probability:** Unlikely  
**Impact:** Moderate  

**Evidence:**
- No runbooks found
- No on-call rotation
- No escalation paths documented

**Mitigation Strategy:**
1. Create incident response playbook
2. Set up monitoring alerts
3. Define on-call rotation
4. Document communication templates

**Owner:** DevOps Agent, Product Manager  
**Status:** Open  
**Target Resolution:** Sprint 3

---

### R-053: Technical Debt Accumulation

**Description:** Multiple TODO comments and known shortcuts in codebase.

**Category:** Technical  
**Severity:** Medium  
**Probability:** Very Likely  
**Impact:** Moderate  

**Evidence:**
```typescript
// supabase/functions/game-action/index.ts:71-78
// TODO: Move epoch/generator definitions into a shared config
// TODO: so the server can independently compute costs.
```

**Mitigation Strategy:**
1. Create technical debt backlog
2. Allocate 20% sprint capacity to debt
3. Track debt metrics
4. Review during retrospectives

**Owner:** All Agents  
**Status:** Open  
**Target Resolution:** Ongoing

---

### R-054: No Capacity Planning

**Description:** No analysis of expected user load and scaling requirements.

**Category:** Operational  
**Severity:** Low  
**Probability:** Unlikely  
**Impact:** Minor  

**Evidence:**
- No load testing performed
- No user projections documented
- Supabase tier not optimized

**Mitigation Strategy:**
1. Define user growth projections
2. Conduct load testing
3. Plan scaling strategy
4. Budget for growth

**Owner:** Product Manager, DevOps Agent  
**Status:** Open  
**Target Resolution:** Sprint 4

---

## 7. COMPLIANCE RISKS

### R-055: GDPR Compliance - Data Collection

**Description:** Player data (Telegram ID, username, photo) may require consent mechanisms.

**Category:** Compliance  
**Severity:** High  
**Probability:** Possible  
**Impact:** Significant  

**Evidence:**
```typescript
// src/lib/storage.ts
username: userInfo?.username || null,
first_name: userInfo?.first_name || null,
photo_url: userInfo?.photo_url || null,
```

**Mitigation Strategy:**
1. Add privacy policy
2. Implement data consent flow
3. Add data export functionality
4. Create deletion request process

**Owner:** Legal, Product Manager  
**Status:** Open  
**Target Resolution:** Sprint 3

---

### R-056: Payment Processing Compliance

**Description:** Telegram Stars integration may require payment processing compliance.

**Category:** Compliance  
**Severity:** High  
**Probability:** Possible  
**Impact:** Significant  

**Evidence:**
```typescript
// supabase/functions/telegram-payments/index.ts
// Handles successful_payment webhook
// No PCI compliance documentation
```

**Mitigation Strategy:**
1. Verify Telegram Stars compliance
2. Document payment flow
3. Add receipt generation
4. Implement refund policy

**Owner:** Legal, Product Manager  
**Status:** Open  
**Target Resolution:** Sprint 3

---

### R-057: Telegram Platform Terms Compliance

**Description:** Must comply with Telegram Mini App policies.

**Category:** Compliance  
**Severity:** Medium  
**Probability:** Likely  
**Impact:** Moderate  

**Evidence:**
- Monetization via Stars
- User data collection
- Ad integration

**Mitigation Strategy:**
1. Review Telegram policies regularly
2. Implement compliant features
3. Monitor for policy changes
4. Maintain compliance documentation

**Owner:** Legal, Product Manager  
**Status:** Open  
**Target Resolution:** Ongoing

---

### R-058: Age Verification Missing

**Description:** No age gate or content rating system.

**Category:** Compliance  
**Severity:** Medium  
**Probability:** Possible  
**Impact:** Moderate  

**Evidence:**
- Historical content includes sensitive periods
- No age verification
- No content warnings

**Mitigation Strategy:**
1. Add age verification on first launch
2. Implement content warnings
3. Add parental controls
4. Rate content appropriately

**Owner:** Legal, Product Manager  
**Status:** Open  
**Target Resolution:** Sprint 4

---

## 8. MARKET RISKS

### R-059: User Acquisition Cost Too High

**Description:** Cost per install may exceed revenue per user.

**Category:** Market  
**Severity:** High  
**Probability:** Likely  
**Impact:** Significant  

**Evidence:**
- Limited marketing budget
- No documented CAC metrics
- Unknown LTV calculations

**Mitigation Strategy:**
1. Track CAC/LTV ratio
2. Optimize referral program
3. Focus on organic growth
4. Test multiple acquisition channels

**Owner:** Marketing Agent, Product Manager  
**Status:** Open  
**Target Resolution:** Ongoing

---

### R-060: Low Viral Coefficient

**Description:** Referral program may not generate sufficient organic growth.

**Category:** Market  
**Severity:** Medium  
**Probability:** Likely  
**Impact:** Moderate  

**Evidence:**
```typescript
// REFERRER_BONUS = 100, NEW_USER_BONUS = 50
// May not be compelling enough
```

**Mitigation Strategy:**
1. A/B test referral rewards
2. Add social sharing features
3. Create influencer program
4. Implement achievement sharing

**Owner:** Marketing Agent, Product Manager  
**Status:** Open  
**Target Resolution:** Sprint 4

---

### R-061: Seasonality Impact

**Description:** User activity may drop during certain periods.

**Category:** Market  
**Severity:** Medium  
**Probability:** Possible  
**Impact:** Moderate  

**Evidence:**
- Historical games show summer decline
- Holiday competition
- Back-to-school periods

**Mitigation Strategy:**
1. Plan seasonal events
2. Adjust marketing spend
3. Create year-round engagement
4. Monitor seasonal metrics

**Owner:** Marketing Agent, LiveOps Agent  
**Status:** Open  
**Target Resolution:** Ongoing

---

### R-062: Negative App Reviews

**Description:** User complaints about bugs, economy, or features could harm growth.

**Category:** Market  
**Severity:** Medium  
**Probability:** Possible  
**Impact:** Moderate  

**Evidence:**
- No review monitoring
- No response strategy
- Bug reports may go unaddressed

**Mitigation Strategy:**
1. Monitor app reviews
2. Respond to feedback
3. Implement beta testing
4. Create community feedback channel

**Owner:** Product Manager, Community Manager  
**Status:** Open  
**Target Resolution:** Sprint 2

---

## Risk Summary by Category

| Category | Critical | High | Medium | Low | Total |
|----------|----------|------|--------|-----|-------|
| Security | 4 | 6 | 5 | 0 | 15 |
| Performance | 1 | 4 | 4 | 2 | 11 |
| Business | 1 | 4 | 5 | 1 | 11 |
| Technical | 0 | 1 | 6 | 4 | 11 |
| Third-Party | 0 | 0 | 4 | 3 | 7 |
| Operational | 0 | 0 | 3 | 2 | 5 |
| Compliance | 0 | 2 | 2 | 0 | 4 |
| Market | 0 | 1 | 3 | 0 | 4 |
| **TOTAL** | **6** | **18** | **32** | **12** | **68** |

---

## Top 10 Priority Risks

| Priority | Risk ID | Risk Title | Severity | Probability | Owner |
|----------|---------|------------|----------|-------------|-------|
| 1 | R-001 | Client-Side State Manipulation | Critical | Very Likely | Backend Agent |
| 2 | R-002 | HMAC Validation Bypass | Critical | Very Likely | Backend Agent |
| 3 | R-004 | AdsGram Secret Key Exposure | Critical | Possible | Frontend Agent |
| 4 | R-015 | Missing Authentication | Critical | Likely | Backend Agent |
| 5 | R-003 | Race Condition in Offline Income | High | Likely | Backend Agent |
| 6 | R-005 | Insufficient Rate Limiting | High | Very Likely | Backend Agent |
| 7 | R-006 | CORS Policy Too Permissive | High | Very Likely | Backend Agent |
| 8 | R-016 | No Pagination on Leaderboard | High | Likely | Backend Agent |
| 9 | R-017 | No Query Indexing Strategy | High | Likely | Database Agent |
| 10 | R-025 | Overpowered Boosters | High | Likely | Game Design Agent |

---

## Appendix A: Risk Tracking Legend

### Severity Levels
- **Critical**: Game-breaking, immediate action required
- **High**: Significant impact, should be addressed soon
- **Medium**: Moderate impact, schedule for resolution
- **Low**: Minor impact, address when convenient

### Probability Levels
- **Very Likely**: Expected to occur frequently (>70%)
- **Likely**: Expected to occur occasionally (40-70%)
- **Possible**: Might occur at some point (20-40%)
- **Unlikely**: May occur but rare (<20%)

### Impact Levels
- **Severe**: Complete service outage or data loss
- **Significant**: Major functionality affected
- **Moderate**: Partial functionality affected
- **Minor**: Minimal user impact

---

## Appendix B: Control Owners

| Control Area | Primary Owner | Secondary Owner |
|--------------|---------------|-----------------|
| Security | Security Agent | Backend Agent |
| Performance | Frontend Agent | Backend Agent |
| Business | Product Manager | Game Design Agent |
| Technical | Tech Lead | All Agents |
| Third-Party | DevOps Agent | Backend Agent |
| Operational | DevOps Agent | Product Manager |
| Compliance | Legal | Product Manager |
| Market | Marketing Agent | Product Manager |

---

## Appendix C: Review History

| Date | Version | Reviewer | Changes |
|------|---------|----------|---------|
| 2026-07-02 | 1.0 | Technical Director | Initial creation |

---

*This document is confidential and intended for internal use only. Distribution outside the organization requires explicit approval from the Technical Director.*
