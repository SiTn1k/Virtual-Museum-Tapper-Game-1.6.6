# Technical Debt Inventory Report

**Project:** Virtual Museum Tapper Game v1.6.6  
**Author:** Technical Director  
**Date:** 2026-07-02  
**Status:** Active Development  

---

## Executive Summary

This report documents all technical debt identified in the Virtual Museum Tapper Game codebase. The codebase demonstrates solid architecture with proper server-authoritative game mechanics, but contains several critical gaps, code duplication, and quality issues requiring attention.

**Total Debt Items:** 27  
**Critical:** 5 | **High:** 8 | **Medium:** 9 | **Low:** 5

---

## CRITICAL Priority (Fix Immediately)

### TD-C001: Duplicate XP Calculation Logic
**Description:** The `calculateXpToLevel()` function exists in TWO separate files with identical logic:
- `src/hooks/useGame.ts` (lines 45-86)
- `src/lib/storage.ts` (lines 28-56)

**Location:**
- `src/hooks/useGame.ts:45-86`
- `src/lib/storage.ts:28-56`

**Why It's Debt:** Violates DRY principle. If game balance requires XP curve changes, developers must remember to update BOTH locations. Divergence would cause data corruption when loading from DB vs local storage.

**Estimated Fix Time:** 30 minutes  
**Risk of Not Fixing:** HIGH - Will cause state inconsistency between local and server storage

**Recommendation:** Extract to shared utility module `/src/lib/xp-calculations.ts`

---

### TD-C002: Generator Purchases NOT Server-Authoritative
**Description:** The `buy_generator` edge function returns a hardcoded error:
```typescript
// game-action/index.ts line 78
return { ok: false, error: "buy_generator: cost validation requires server-side generator definitions — coming soon" };
```

**Location:** `supabase/functions/game-action/index.ts:62-79`

**Why It's Debt:** All generator purchases are handled client-side only. Users can manipulate game state via DevTools to get unlimited generators.

**Estimated Fix Time:** 4-6 hours  
**Risk of Not Fixing:** CRITICAL - Complete game economy exploit possible

**Recommendation:** Implement server-side generator definitions (DB table or shared config) and complete `buy_generator` function with proper validation.

---

### TD-C003: No Telegram initData Server-Side Validation on Most Calls
**Description:** While `validate-init-data` function exists, most edge functions don't validate `init_data`:
- `open-chest` - NO validation
- `claim-ad-reward` - NO validation (uses telegram_id directly)
- `claim-offline-income` - NO validation
- `adsgram-reward` - NO validation
- `telegram-payments` - Partial (POST webhook has no initData check)

**Location:** All edge functions in `/supabase/functions/*/index.ts`

**Why It's Debt:** Users could potentially forge requests with arbitrary telegram_ids. Currently mitigated by not exposing sensitive operations, but creates attack surface for future features.

**Estimated Fix Time:** 3-4 hours (create shared validation middleware)  
**Risk of Not Fixing:** HIGH - Potential for account takeover via ID forgery

**Recommendation:** Create shared `validateRequest()` middleware and apply to all functions accepting telegram_id.

---

### TD-C004: Hardcoded Supabase URL in Frontend
**Description:** Direct URL construction instead of using environment variables consistently:
```typescript
// App.tsx lines 303-307
fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/claim-ad-reward`, ...)
```

**Location:** Multiple files including App.tsx, AdSystem.tsx

**Why It's Debt:** Code duplication increases risk of typos. Inconsistent error handling. No centralized API client.

**Estimated Fix Time:** 2 hours  
**Risk of Not Fixing:** MEDIUM - Potential for inconsistent API calls

**Recommendation:** Create `/src/lib/api.ts` with typed wrapper functions for all API calls.

---

### TD-C005: No Idempotency on Critical Operations
**Description:** Several operations lack idempotency protection:
- `claim-ad-reward` uses daily counters but doesn't check if reward already applied
- `claim-offline-income` has race condition protection via RPC but not for concurrent tab sessions
- `open-chest` could be called multiple times rapidly

**Location:**
- `supabase/functions/claim-ad-reward/index.ts`
- `supabase/functions/claim-offline-income/index.ts`
- `supabase/functions/open-chest/index.ts`

**Why It's Debt:** Users could exploit rapid double-clicks or race conditions to claim rewards multiple times.

**Estimated Fix Time:** 2-3 hours  
**Risk of Not Fixing:** HIGH - Revenue loss from duplicated ad rewards

**Recommendation:** Add client-side debouncing + server-side idempotency keys.

---

## HIGH Priority (Fix Within 2 Weeks)

### TD-H001: No Test Coverage
**Description:** Zero automated tests exist for any component.

**Location:** `/src/**/*.test.ts` - does not exist

**Why It's Debt:** Any refactoring risks breaking existing functionality without detection. Cannot safely deploy changes.

**Estimated Fix Time:** 1-2 weeks for basic coverage  
**Risk of Not Fixing:** HIGH - Production bugs will be found by users, not tests

**Recommendation:** Implement Vitest for unit tests, focus on:
- XP calculation utilities
- Game state transformations
- Edge function handlers
- React component rendering

---

### TD-H002: Duplicate Artifact Definitions
**Description:** Artifacts defined in BOTH:
- `src/data/epochs.ts` (ARTIFACTS array)
- `supabase/functions/open-chest/index.ts` (ARTIFACTS array)

**Location:**
- `src/data/epochs.ts` lines 88-120
- `supabase/functions/open-chest/index.ts` lines 56-123

**Why It's Debt:** Must manually sync artifact definitions between frontend and backend. Divergence causes visual mismatch with actual drops.

**Estimated Fix Time:** 4 hours  
**Risk of Not Fixing:** MEDIUM - Player confusion when UI shows different than reality

**Recommendation:** Store artifacts in database table, fetch via API or include in shared npm package.

---

### TD-H003: No Rate Limiting on Edge Functions
**Description:** No rate limiting implemented on any edge function.

**Location:** All `/supabase/functions/*/index.ts`

**Why It's Debt:** API abuse possible. Spam clicking could overwhelm database.

**Estimated Fix Time:** 2 hours  
**Risk of Not Fixing:** MEDIUM - Potential for DoS, revenue loss

**Recommendation:** Implement Supabase rate limiting or use pg_auth for request throttling.

---

### TD-H004: Session Tracking Relies on Client Timestamps
**Description:** `lastOnlineAt` and `sessionStartAt` are:
1. Set client-side initially
2. Sent to server in save payloads
3. Used for offline income calculation

**Location:**
- `src/hooks/useGame.ts:391-418` (regenerateEnergy)
- `supabase/functions/claim-offline-income/index.ts`

**Why It's Debt:** Device clock manipulation could inflate offline rewards.

**Estimated Fix Time:** 3 hours  
**Risk of Not Fixing:** MEDIUM - Cheaters could gain unfair advantage

**Recommendation:** Make `lastOnlineAt` server-authoritative, set ONLY in edge functions.

---

### TD-H005: Insecure CORS Configuration
**Description:** All edge functions use:
```typescript
"Access-Control-Allow-Origin": "*"
```

**Location:** All `/supabase/functions/*/index.ts` (corsHeaders constant)

**Why It's Debt:** Any website could make requests to edge functions. While not critical (uses HMAC validation), it's poor security practice.

**Estimated Fix Time:** 30 minutes  
**Risk of Not Fixing:** LOW - Mitigated by HMAC validation, but bad practice

**Recommendation:** Use specific origin or Supabase-managed CORS.

---

### TD-H006: Missing Type Safety in Edge Functions
**Description:** Heavy use of `as` type assertions and missing input validation:
```typescript
const tapPower = (row.tap_power as number) ?? 1;
const currency = (row.currency as number) ?? 0;
```

**Location:** All edge functions

**Why It's Debt:** Runtime errors from malformed data. No compile-time safety.

**Estimated Fix Time:** 6-8 hours  
**Risk of Not Fixing:** MEDIUM - Runtime crashes from bad data

**Recommendation:** Create Zod schemas for all request/response types.

---

### TD-H007: No Error Recovery on Save Failures
**Description:** `saveRemoteState` and `saveLocalState` only log errors:
```typescript
// storage.ts line 98
} catch (e) {
  console.error('localStorage save failed:', e);
}
```

**Location:** `src/lib/storage.ts:91-100`

**Why It's Debt:** Silent failures could lose player progress without user notification.

**Estimated Fix Time:** 1 hour  
**Risk of Not Fixing:** MEDIUM - Player data loss goes unnoticed

**Recommendation:** Add user-facing error notification and retry logic.

---

### TD-H008: AdsGram Secret Hardcoded
**Description:** AdsGram API secret is hardcoded in source:
```typescript
// adsgram-reward/index.ts line 12
const ADSGRAM_SECRET = 'e73dc047768d42dba4d64432274c05c1';
```

**Location:** `supabase/functions/adsgram-reward/index.ts:11-12`

**Why It's Debt:** Secret exposed in version control. Cannot rotate without code change.

**Estimated Fix Time:** 15 minutes  
**Risk of Not Fixing:** MEDIUM - Secret compromise possible

**Recommendation:** Use Deno env var: `Deno.env.get("ADSGRAM_SECRET")`

---

## MEDIUM Priority (Fix Within 1 Month)

### TD-M001: Missing `TapUpgrade` Component
**Description:** App.tsx imports non-existent component:
```typescript
// App.tsx line 5
import { TapUpgrade } from './components/StatsPanel';
```

**Location:** `src/App.tsx:5`

**Why It's Debt:** Build warning, unused import, unclear if functionality missing.

**Estimated Fix Time:** 15 minutes  
**Risk of Not Fixing:** LOW - Build warning only

**Recommendation:** Remove unused import or create missing component.

---

### TD-M002: Inconsistent Naming Conventions
**Description:** Mixed snake_case and camelCase:
- Database: snake_case (`telegram_id`, `total_xp`)
- Frontend state: camelCase (`telegramId`, `totalXp`)
- Edge function params: mixed

**Location:** Throughout codebase

**Why It's Debt:** Cognitive load, more translation code needed.

**Estimated Fix Time:** 8-10 hours (gradual refactor)  
**Risk of Not Fixing:** LOW - Works but inconsistent

**Recommendation:** Establish naming convention document, apply consistently.

---

### TD-M003: Magic Numbers Throughout Codebase
**Description:** Hardcoded numeric values without explanation:
- `15 * 60 * 1000` - 15 minutes
- `100 * Math.max(1, (epoch_index || 0) + 1)` - chest cost
- `25 * Math.pow(1.8, state.tapPower - 1)` - tap upgrade cost
- `SESSION_AD_INTERVAL_MS = 20 * 60 * 1000` - session ad timing

**Location:** Multiple files

**Why It's Debt:** Unclear what values represent. Changing requires hunting through code.

**Estimated Fix Time:** 3-4 hours  
**Risk of Not Fixing:** LOW - Code maintainability

**Recommendation:** Extract to `/src/constants/game.ts` with descriptive names.

---

### TD-M004: Dead Code - Commented Epoch Generators
**Description:** Large blocks of commented code in epochs.ts:

**Location:** `src/data/epochs.ts` (lines 87-88 and potentially others)

**Why It's Debt:** Increases file size, confuses developers, no version history for commented code.

**Estimated Fix Time:** 30 minutes  
**Risk of Not Fixing:** LOW - Code clutter

**Recommendation:** Remove commented code or move to separate archive file.

---

### TD-M005: No Loading States for Some Operations
**Description:** Some UI actions don't show loading indicators while awaiting server response.

**Location:** GeneratorShop.tsx, PrestigeSystem.tsx

**Why It's Debt:** Poor UX. Users may click multiple times.

**Estimated Fix Time:** 2 hours  
**Risk of Not Fixing:** LOW - UX issue

**Recommendation:** Add loading state to all async operations.

---

### TD-M006: No Offline Detection for Critical Saves
**Description:** `saveRemoteState` silently fails when offline without retry queue.

**Location:** `src/lib/storage.ts:102-193`

**Why It's Debt:** Progress may be lost when network recovers without proper sync.

**Estimated Fix Time:** 3 hours  
**Risk of Not Fixing:** MEDIUM - Data loss possible

**Recommendation:** Implement IndexedDB queue for offline saves, sync on reconnect.

---

### TD-M007: Leaderboard Inefficient Query
**Description:** `getUserRank` fetches ALL users then finds index in JavaScript:
```typescript
// storage.ts line 422
.limit(1000); // ...then finds index
```

**Location:** `src/lib/storage.ts:413-432`

**Why It's Debt:** O(n) operation, won't scale past 1000 users.

**Estimated Fix Time:** 1 hour  
**Risk of Not Fixing:** MEDIUM - Performance degradation at scale

**Recommendation:** Use PostgreSQL window functions for server-side ranking.

---

### TD-M008: No Request Timeout Configuration
**Description:** Fetch calls have no timeout, could hang indefinitely.

**Location:** All API calls in App.tsx, AdSystem.tsx

**Why It's Debt:** Poor UX on slow networks.

**Estimated Fix Time:** 1 hour  
**Risk of Not Fixing:** LOW - UX issue

**Recommendation:** Add 30-second timeout to all fetch calls.

---

### TD-M009: Missing `requiredRebirth` in Epochs Data
**Description:** While types define `requiredRebirth`, data appears incomplete for world history epochs.

**Location:** `src/data/epochs.ts`

**Why It's Debt:** Players could access epochs they shouldn't based on prestige level.

**Estimated Fix Time:** 1 hour  
**Risk of Not Fixing:** MEDIUM - Game balance bypass

**Recommendation:** Audit all epoch `requiredRebirth` values.

---

## LOW Priority (Fix When Possible)

### TD-L001: No API Versioning
**Description:** All edge functions use `/functions/v1/` path with no version negotiation.

**Location:** All frontend API calls

**Why It's Debt:** Breaking changes require coordinated deployment.

**Estimated Fix Time:** 2 hours  
**Risk of Not Fixing:** LOW - Not currently an issue

**Recommendation:** Consider versioned endpoints for future-proofing.

---

### TD-L002: Missing Performance Monitoring
**Description:** No APM or error tracking (Sentry, etc.) configured.

**Location:** N/A - not implemented

**Why It's Debt:** Production issues discovered reactively, not proactively.

**Estimated Fix Time:** 1 hour  
**Risk of Not Fixing:** MEDIUM - Slow issue discovery

**Recommendation:** Add Sentry for frontend and edge function error tracking.

---

### TD-L003: No Documentation for Edge Function APIs
**Description:** Edge functions lack OpenAPI/Swagger documentation.

**Location:** `/supabase/functions/*/index.ts`

**Why It's Debt:** Hard to onboard developers, unclear contract.

**Estimated Fix Time:** 4 hours  
**Risk of Not Fixing:** LOW - Internal project

**Recommendation:** Add JSDoc comments with request/response examples.

---

### TD-L004: Duplicate Daily Reset Logic
**Description:** Daily ad limits reset in multiple places:
- `claim-ad-reward/index.ts:78-90` - `resetIfNewDay()`
- Client-side in `useGame.ts` and `AdSystem.tsx`

**Location:** Multiple files

**Why It's Debt:** Inconsistent reset logic could cause timezone bugs.

**Estimated Fix Time:** 2 hours  
**Risk of Not Fixing:** LOW - UTC handling should be consistent

**Recommendation:** Centralize daily reset logic in single utility.

---

### TD-L005: No SEO/Meta Tags for Web Preview
**Description:** `index.html` missing OpenGraph and Twitter card meta tags.

**Location:** `/index.html`

**Why It's Debt:** Poor link previews when sharing.

**Estimated Fix Time:** 30 minutes  
**Risk of Not Fixing:** LOW - Not critical for Telegram miniapp

**Recommendation:** Add og:title, og:description, og:image for sharing.

---

## Recommended Prioritization

### Phase 1 (Week 1): Security & Data Integrity
1. TD-C002: Complete server-side generator purchase validation
2. TD-C003: Add initData validation to all edge functions
3. TD-C005: Add idempotency protection
4. TD-H004: Make lastOnlineAt server-authoritative

### Phase 2 (Week 2): Code Quality
1. TD-C001: Extract shared XP calculation
2. TD-H002: Consolidate artifact definitions
3. TD-H006: Add Zod validation schemas
4. TD-M002: Establish naming conventions

### Phase 3 (Week 3-4): Testing & Monitoring
1. TD-H001: Implement test suite
2. TD-L002: Add Sentry error tracking
3. TD-M006: Implement offline save queue

### Phase 4 (Ongoing): Polish
1. TD-H003: Rate limiting
2. TD-M003: Extract magic numbers
3. TD-M005: Loading states
4. TD-L001-L005: Low priority items

---

## Appendix: File Inventory

### Frontend Source Files (12)
| File | Lines | Purpose |
|------|-------|---------|
| `src/App.tsx` | 458 | Main application component |
| `src/hooks/useGame.ts` | 483 | Core game state management |
| `src/lib/storage.ts` | 455 | Local/remote state persistence |
| `src/lib/rpc.ts` | 140 | Server action helpers |
| `src/lib/telegram.ts` | 156 | Telegram WebApp integration |
| `src/lib/supabase.ts` | 13 | Supabase client initialization |
| `src/lib/utils.ts` | 9 | Utility functions |
| `src/data/epochs.ts` | 183+ | Epoch and artifact definitions |
| `src/data/tasks.ts` | 92 | Daily task definitions |
| `src/components/*.tsx` | ~1200 | UI components |

### Edge Functions (10)
| Function | Purpose | Lines |
|----------|---------|-------|
| `game-action` | Server-authoritative actions | 167 |
| `open-chest` | Artifact chest opening | 337 |
| `perform-prestige` | Prestige system | 201 |
| `claim-ad-reward` | Ad reward claims | 256 |
| `claim-offline-income` | Offline income calculation | 198 |
| `validate-init-data` | HMAC validation | 107 |
| `telegram-payments` | Stars payment processing | 448 |
| `track-session` | Session analytics | 191 |
| `adsgram-reward` | AdsGram callback | 315 |
| `push-notification` | Telegram notifications | 239 |

### Database Migrations (19)
Sequential migrations from 001 to 019 with iterative schema evolution.

---

*Report generated by Technical Director. Update quarterly or after major releases.*