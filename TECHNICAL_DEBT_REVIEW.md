# Technical Debt Review — Virtual Museum Tapper Game v1.6.6

**Project:** Virtual Museum Tapper Game  
**Version:** 1.6.6  
**Review Date:** 2026-07-02  
**Standards Applied:** AAA Mobile Game Studio Quality Standards  
**Reviewer:** Refactoring Specialist

---

## Executive Summary

This comprehensive technical debt review analyzes the Virtual Museum Tapper Game codebase across 5 dimensions: code maintainability, technical debt identification, pattern standardization, architectural refactoring needs, and long-term maintainability.

### Overall Assessment

| Dimension | Grade | Key Issues |
|-----------|-------|------------|
| Code Maintainability | B- | Monolithic hooks, duplication, magic numbers |
| Technical Debt | C+ | 23 identified issues, 5 critical |
| Pattern Standardization | B | Good separation, inconsistent error handling |
| Architectural Refactoring | B- | Solid foundation, needs context/state split |
| Long-term Maintainability | B | Well-structured, needs testing infrastructure |

**Overall Code Quality Score:** B (78/100)  
**Technical Debt Severity Breakdown:** Critical: 5 | High: 8 | Medium: 6 | Low: 4

---

## Table of Contents

1. [Critical Priority Issues](#critical-priority-issues)
2. [High Priority Issues](#high-priority-issues)
3. [Medium Priority Issues](#medium-priority-issues)
4. [Low Priority Issues](#low-priority-issues)
5. [Code Maintainability Analysis](#code-maintainability-analysis)
6. [Pattern Standardization Issues](#pattern-standardization-issues)
7. [Architectural Refactoring Needs](#architectural-refactoring-needs)
8. [Long-term Maintainability Concerns](#long-term-maintainability-concerns)
9. [Priority Implementation Roadmap](#priority-implementation-roadmap)
10. [Risk Assessment Matrix](#risk-assessment-matrix)

---

## Critical Priority Issues

### TD-001: Duplicate XP Calculation Logic

| Field | Value |
|-------|-------|
| **Severity** | 🔴 CRITICAL |
| **Type** | Code Duplication / Data Integrity |
| **Affected Files** | `src/hooks/useGame.ts:45-86`, `src/lib/storage.ts:29-57` |

**Description:**  
The `calculateXpToLevel()` function is duplicated identically in two files. Any modification to the XP curve must be applied in both locations to prevent desynchronization between local and server storage.

```typescript
// useGame.ts (line 45-86)
function calculateXpToLevel(level: number): number {
  const epoch = getCurrentEpochByLevel(level);
  const { min, max } = epoch.levelRange;
  const rangeSize = Math.max(1, max - min + 1);
  const progress = Math.min(1, Math.max(0, (level - min) / rangeSize));
  // ... epoch-based timing calculations
}

// storage.ts (line 29-57) — IDENTICAL IMPLEMENTATION
function calculateXpToLevel(level: number): number {
  const epoch = getCurrentEpochByLevel(level);
  const { min, max } = epoch.levelRange;
  const rangeSize = Math.max(1, max - min + 1);
  const progress = Math.min(1, Math.max(0, (level - min) / rangeSize));
  // ... IDENTICAL epoch-based timing calculations
}
```

**Why This Matters:**  
- Game balance changes require synchronized updates in both files
- If only one location is updated, players will experience inconsistent XP calculations
- Risk of data corruption when loading saves between localStorage and database

**Potential Impact:**  
- Player confusion from inconsistent XP display
- Exploits possible if formulas diverge between client and server
- Testing complexity increases significantly

**Risk if Ignored:**  
HIGH — Will cause state inconsistency and potential exploits as game scales

**Recommended Solution:**  
Extract to shared utility module `/src/lib/game-calculations.ts`:
```typescript
// src/lib/game-calculations.ts
export function calculateXpToLevel(level: number): number { /* ... */ }
export function estimatePassiveForEpoch(epoch: Epoch, levelInEpoch: number): number { /* ... */ }
```

**Estimated Implementation Effort:** 30 minutes  
**Responsible Agent:** Frontend Developer

---

### TD-002: Generator Purchases Not Server-Authoritative

| Field | Value |
|-------|-------|
| **Severity** | 🔴 CRITICAL |
| **Type** | Security / Anti-Cheat |
| **Affected Files** | `supabase/functions/game-action/index.ts:62-79` |

**Description:**  
The `buy_generator` action in the game-action edge function returns a hardcoded error:
```typescript
// game-action/index.ts line 78
return { ok: false, error: "buy_generator: cost validation requires server-side generator definitions — coming soon" };
```

All generator purchases are currently handled client-side only, allowing users to manipulate game state via DevTools to obtain unlimited generators.

**Why This Matters:**  
- Complete game economy exploit is possible
- Players can bypass all progression gates
- Real-money purchases (via Telegram Stars) become worthless

**Potential Impact:**  
- Revenue loss from currency exploits
- Player trust erosion
- Game economy collapse

**Risk if Ignored:**  
CRITICAL — Direct threat to game economy and revenue

**Recommended Solution:**  
1. Create `generators` database table with all generator definitions
2. Implement server-side cost calculation in `buy_generator`
3. Add HMAC-validated transaction with balance verification

**Estimated Implementation Effort:** 4-6 hours  
**Responsible Agent:** Backend Developer

---

### TD-003: Inconsistent initData Validation Across Edge Functions

| Field | Value |
|-------|-------|
| **Severity** | 🔴 CRITICAL |
| **Type** | Security |
| **Affected Files** | `supabase/functions/open-chest/index.ts`, `supabase/functions/claim-ad-reward/index.ts`, `supabase/functions/claim-offline-income/index.ts`, `supabase/functions/adsgram-reward/index.ts` |

**Description:**  
While `validate-init-data` function exists and is properly implemented, most edge functions don't validate `init_data`:

| Edge Function | initData Validation |
|---------------|---------------------|
| `game-action` | ✅ Implemented |
| `validate-init-data` | ✅ Implemented |
| `open-chest` | ✅ Implemented |
| `claim-ad-reward` | ✅ Implemented |
| `perform-prestige` | ✅ Implemented |
| `save-game-state` | ✅ Implemented |
| `load-game-state` | ✅ Implemented |
| `claim-offline-income` | ❌ NOT checked |
| `adsgram-reward` | ❌ NOT checked |

**Why This Matters:**  
Users could potentially forge requests with arbitrary `telegram_ids`, enabling:
- Claim rewards for other users
- Modify other players' game state
- Bypass payment verification

**Potential Impact:**  
- Account takeover via ID forgery
- Revenue loss from fraudulent claims
- Reputation damage

**Risk if Ignored:**  
HIGH — Potential for account compromise and revenue fraud

**Recommended Solution:**  
Create shared validation middleware and apply to all functions:
```typescript
// supabase/functions/_shared/require-auth.ts
export async function requireAuth(request: Request): Promise<{ userId: number; error?: never } | { userId?: never; error: string }> {
  const validation = validateRequest(/* extract init_data */);
  if (!validation.valid) return { error: validation.error };
  return { userId: validation.userId };
}
```

**Estimated Implementation Effort:** 3-4 hours  
**Responsible Agent:** Backend Developer + Security Engineer

---

### TD-004: Duplicate Artifact Definitions

| Field | Value |
|-------|-------|
| **Severity** | 🔴 CRITICAL |
| **Type** | Data Integrity |
| **Affected Files** | `src/data/epochs.ts:88-120`, `supabase/functions/open-chest/index.ts:58-123` |

**Description:**  
The `ARTIFACTS` array is duplicated between frontend and backend:
- Frontend: `src/data/epochs.ts` (lines 88-120) — Used for UI display
- Backend: `supabase/functions/open-chest/index.ts` (lines 58-123) — Used for RNG

**Why This Matters:**  
- Must manually sync artifact definitions between frontend and backend
- Divergence causes visual mismatch with actual drops
- New artifacts require coordinated deployments
- Testing requires updates in two locations

**Potential Impact:**  
- Player confusion when UI shows different artifacts than actual drops
- Difficulty adding new content
- Bug risk from synchronization failures

**Risk if Ignored:**  
MEDIUM — Creates technical debt and future maintenance burden

**Recommended Solution:**  
1. Store artifacts in `artifacts` database table
2. Fetch artifact data via API on app initialization
3. OR create shared npm package with artifact definitions

**Estimated Implementation Effort:** 4 hours  
**Responsible Agent:** Full-stack Developer

---

### TD-005: Missing Idempotency on Critical Operations

| Field | Value |
|-------|-------|
| **Severity** | 🔴 CRITICAL |
| **Type** | Race Conditions |
| **Affected Files** | `supabase/functions/claim-ad-reward/index.ts`, `supabase/functions/open-chest/index.ts`, `supabase/functions/claim-offline-income/index.ts` |

**Description:**  
Several operations lack idempotency protection:
- `claim-ad-reward`: Uses daily counters but doesn't prevent concurrent claims
- `open-chest`: Could be called multiple times rapidly (double-click)
- `claim-offline-income`: Race condition protection via RPC but not for concurrent sessions

**Why This Matters:**  
Users can exploit rapid double-clicks or race conditions to:
- Claim ad rewards multiple times
- Open multiple chests from single purchase
- Receive duplicate offline income

**Potential Impact:**  
- Revenue loss from duplicated ad rewards
- Currency inflation from duplicate claims
- Unfair advantage for exploiters

**Risk if Ignored:**  
HIGH — Direct revenue impact from reward duplication

**Recommended Solution:**  
1. Add client-side debouncing (300ms minimum)
2. Add server-side idempotency keys with TTL
3. Implement database-level locking for critical operations

**Estimated Implementation Effort:** 2-3 hours  
**Responsible Solution:** Backend Developer

---

## High Priority Issues

### TD-006: Zero Test Coverage

| Field | Value |
|-------|-------|
| **Severity** | 🟠 HIGH |
| **Type** | Quality Assurance |
| **Affected Files** | `/src/**/*.test.ts` — does not exist |

**Description:**  
No automated tests exist for any component or utility function.

**Why This Matters:**  
- Any refactoring risks breaking existing functionality
- Cannot safely deploy changes
- Production bugs discovered by users, not tests
- Technical debt compounds with each change

**Potential Impact:**  
- Slower feature development due to manual testing
- Higher bug rates in production
- Developer confidence issues

**Risk if Ignored:**  
HIGH — Technical debt compounds, quality degrades over time

**Recommended Solution:**  
Implement Vitest for unit tests:
```typescript
// src/lib/game-calculations.test.ts
describe('calculateXpToLevel', () => {
  it('should return minimum 50 XP', () => {
    expect(calculateXpToLevel(1)).toBeGreaterThanOrEqual(50);
  });
});
```

**Estimated Implementation Effort:** 1-2 weeks  
**Responsible Agent:** QA Engineer + Frontend Developer

---

### TD-007: Hardcoded Supabase URL Construction

| Field | Value |
|-------|-------|
| **Severity** | 🟠 HIGH |
| **Type** | Code Quality |
| **Affected Files** | `src/App.tsx:303-307`, `src/components/AdSystem.tsx:308-315`, `src/services/adsgram.ts:25-26` |

**Description:**  
Direct URL construction instead of using centralized API client:
```typescript
// App.tsx lines 303-307
fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/claim-ad-reward`, ...)

// AdSystem.tsx lines 308-315
fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/claim-ad-reward`, ...)

// adsgram.ts lines 25-26
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
return `${supabaseUrl}/functions/v1/adsgram-reward`;
```

**Why This Matters:**  
- Code duplication increases risk of typos
- Inconsistent error handling
- No centralized API client for monitoring/logging
- Difficult to add request interceptors

**Potential Impact:**  
- Inconsistent API behavior
- Difficult debugging
- No centralized error handling

**Risk if Ignored:**  
MEDIUM — Maintainability and debugging challenges

**Recommended Solution:**  
Create `/src/lib/api.ts` with typed wrapper functions:
```typescript
// src/lib/api.ts
export const API = {
  claimAdReward: (data: ClaimAdRewardRequest) => 
    fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/claim-ad-reward`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),
};
```

**Estimated Implementation Effort:** 2 hours  
**Responsible Agent:** Frontend Developer

---

### TD-008: No Rate Limiting on Edge Functions

| Field | Value |
|-------|-------|
| **Severity** | 🟠 HIGH |
| **Type** | Security / Performance |
| **Affected Files** | All `/supabase/functions/*/index.ts` |

**Description:**  
No rate limiting is implemented on any edge function.

**Why This Matters:**  
- API abuse is possible
- Spam clicking could overwhelm database
- DDoS vulnerability
- Revenue impact from API abuse

**Potential Impact:**  
- Database performance degradation
- Potential for DoS attacks
- Increased infrastructure costs

**Risk if Ignored:**  
MEDIUM — Potential for abuse and infrastructure strain

**Recommended Solution:**  
1. Use Supabase's built-in rate limiting
2. Add `pg_auth` for request throttling
3. Implement client-side throttling with exponential backoff

**Estimated Implementation Effort:** 2 hours  
**Responsible Agent:** DevOps Engineer

---

### TD-009: Session Tracking Relies on Client Timestamps

| Field | Value |
|-------|-------|
| **Severity** | 🟠 HIGH |
| **Type** | Anti-Cheat |
| **Affected Files** | `src/hooks/useGame.ts:391-418`, `supabase/functions/claim-offline-income/index.ts` |

**Description:**  
`lastOnlineAt` and `sessionStartAt` are:
1. Set client-side initially
2. Sent to server in save payloads
3. Used for offline income calculation

**Why This Matters:**  
Device clock manipulation could inflate offline rewards, allowing cheaters to gain unfair advantages.

**Potential Impact:**  
- Cheaters can exploit offline income
- Economy imbalance
- Fair player frustration

**Risk if Ignored:**  
MEDIUM — Cheating potential affecting game balance

**Recommended Solution:**  
1. Make `lastOnlineAt` server-authoritative
2. Set timestamp ONLY in edge functions
3. Add client timestamp validation (±5 minute tolerance)

**Estimated Implementation Effort:** 3 hours  
**Responsible Agent:** Backend Developer

---

### TD-010: Heavy Type Assertions in Edge Functions

| Field | Value |
|-------|-------|
| **Severity** | 🟠 HIGH |
| **Type** | Type Safety |
| **Affected Files** | All edge functions |

**Description:**  
Heavy use of `as` type assertions without validation:
```typescript
// game-action/index.ts
const tapPower = (row.tap_power as number) ?? 1;
const currency = (row.currency as number) ?? 0;

// open-chest/index.ts
const artifact = ARTIFACTS.find((a) => a.id === reward.id);
```

**Why This Matters:**  
- Runtime errors from malformed data
- No compile-time safety
- Potential for type-related bugs
- Security vulnerabilities from unexpected data

**Potential Impact:**  
- Runtime crashes
- Data corruption
- Security vulnerabilities

**Risk if Ignored:**  
MEDIUM — Quality and security concerns

**Recommended Solution:**  
Implement Zod validation schemas:
```typescript
import { z } from 'zod';

const GameProgressSchema = z.object({
  tap_power: z.number().int().positive().default(1),
  currency: z.number().int().nonnegative().default(0),
});

type GameProgress = z.infer<typeof GameProgressSchema>;
```

**Estimated Implementation Effort:** 6-8 hours  
**Responsible Agent:** Full-stack Developer

---

### TD-011: Monolithic useGame Hook (482 lines)

| Field | Value |
|-------|-------|
| **Severity** | 🟠 HIGH |
| **Type** | Architecture |
| **Affected Files** | `src/hooks/useGame.ts` |

**Description:**  
The `useGame` hook is a 482-line "god hook" containing:
- 30+ useState declarations
- 5+ useEffect hooks
- Multiple intervals (tick, localSave, remoteSave)
- Energy regeneration logic
- Online/offline detection
- 20+ useCallback functions

**Why This Matters:**  
- Impossible to test individual features
- Code navigation is difficult
- High coupling causes fragile changes
- Slows down feature development

**Potential Impact:**  
- Slower development velocity
- Higher bug rates
- Developer frustration
- Onboarding difficulty

**Risk if Ignored:**  
MEDIUM — Technical debt compounds, velocity decreases

**Recommended Solution:**  
Phase-by-phase extraction:
1. `useEnergy.ts` — Energy regeneration logic
2. `useOfflineGains.ts` — Offline progress calculation
3. `usePersistence.ts` — Save/load logic
4. `useOnlineStatus.ts` — Network detection

**Estimated Implementation Effort:** 3-4 days  
**Responsible Agent:** Frontend Developer

---

### TD-012: Inconsistent Naming Conventions

| Field | Value |
|-------|-------|
| **Severity** | 🟠 HIGH |
| **Type** | Code Quality |
| **Affected Files** | Throughout codebase |

**Description:**  
Inconsistent naming patterns throughout:
- `telegram_id` vs `telegramId` (snake_case vs camelCase)
- `epoch_id` vs `epochId`
- `daily_ad_views` vs `dailyAdViews`
- Mixed language: English function names with Ukrainian comments

**Why This Matters:**  
- Cognitive load when reading code
- Increased translation overhead
- Confusion for new developers
- Error-prone refactoring

**Potential Impact:**  
- Developer confusion
- Slower onboarding
- Higher bug rates from naming errors

**Risk if Ignored:**  
LOW — Works but creates friction

**Recommended Solution:**  
1. Create naming convention document
2. Apply consistent camelCase for all JavaScript/TypeScript
3. Add linting rules for naming enforcement

**Estimated Implementation Effort:** 8-10 hours (gradual refactor)  
**Responsible Agent:** All Developers

---

## Medium Priority Issues

### TD-013: Magic Numbers Throughout Codebase

| Field | Value |
|-------|-------|
| **Severity** | 🟡 MEDIUM |
| **Type** | Code Quality |
| **Affected Files** | Multiple files |

**Description:**  
Hardcoded numeric values without explanation:
- `15 * 60 * 1000` — 15 minutes
- `100 * Math.max(1, (epoch_index || 0) + 1)` — chest cost
- `25 * Math.pow(1.8, state.tapPower - 1)` — tap upgrade cost
- `SESSION_AD_INTERVAL_MS = 20 * 60 * 1000` — session ad timing

**Why This Matters:**  
- Unclear what values represent
- Difficult to adjust game balance
- Risk of typos in complex expressions

**Potential Impact:**  
- Slower game tuning
- Risk of configuration errors
- Developer confusion

**Risk if Ignored:**  
LOW — Maintainability concern

**Recommended Solution:**  
Extract to `/src/constants/game.ts`:
```typescript
export const GAME_CONSTANTS = {
  SESSION_AD_INTERVAL_MS: 20 * 60 * 1000,
  TAP_UPGRADE_BASE_COST: 25,
  TAP_UPGRADE_COST_MULTIPLIER: 1.8,
  CHEST_BASE_COST: 100,
  // ...
} as const;
```

**Estimated Implementation Effort:** 3-4 hours  
**Responsible Agent:** Frontend Developer

---

### TD-014: Dead Code — Commented Epoch Generators

| Field | Value |
|-------|-------|
| **Severity** | 🟡 MEDIUM |
| **Type** | Code Quality |
| **Affected Files** | `src/data/epochs.ts` |

**Description:**  
Large blocks of commented code in epochs.ts (lines 87-88 and potentially others).

**Why This Matters:**  
- Increases file size
- Confuses developers
- No version history for commented code
- Cluttered codebase

**Potential Impact:**  
- Slower code navigation
- Developer confusion
- Risk of accidental uncommenting

**Risk if Ignored:**  
LOW — Code clutter

**Recommended Solution:**  
Remove commented code or move to separate archive file with version history.

**Estimated Implementation Effort:** 30 minutes  
**Responsible Agent:** Frontend Developer

---

### TD-015: Missing Loading States for Some Operations

| Field | Value |
|-------|-------|
| **Severity** | 🟡 MEDIUM |
| **Type** | User Experience |
| **Affected Files** | `GeneratorShop.tsx`, `PrestigeSystem.tsx` |

**Description:**  
Some UI actions don't show loading indicators while awaiting server response.

**Why This Matters:**  
- Poor UX — users may click multiple times
- Confusion about whether action succeeded
- Potential for double-purchases

**Potential Impact:**  
- User frustration
- Potential duplicate transactions
- Support ticket increase

**Risk if Ignored:**  
LOW — UX issue

**Recommended Solution:**  
Add loading state to all async operations:
```typescript
const [isLoading, setIsLoading] = useState(false);

const handlePurchase = async () => {
  setIsLoading(true);
  try {
    await purchaseGenerator();
  } finally {
    setIsLoading(false);
  }
};
```

**Estimated Implementation Effort:** 2 hours  
**Responsible Agent:** Frontend Developer

---

### TD-016: No Offline Detection for Critical Saves

| Field | Value |
|-------|-------|
| **Severity** | 🟡 MEDIUM |
| **Type** | Data Integrity |
| **Affected Files** | `src/lib/storage.ts:102-193` |

**Description:**  
`saveRemoteState` silently fails when offline without retry queue.

**Why This Matters:**  
Progress may be lost when network recovers without proper sync.

**Potential Impact:**  
- Data loss possible
- User frustration
- Support tickets

**Risk if Ignored:**  
MEDIUM — Potential data loss

**Recommended Solution:**  
Implement IndexedDB queue for offline saves:
```typescript
// Queue saves when offline, sync on reconnect
const saveQueue = new IndexedDBQueue();
saveQueue.enqueue(state);
window.addEventListener('online', () => saveQueue.flush());
```

**Estimated Implementation Effort:** 3 hours  
**Responsible Agent:** Frontend Developer

---

### TD-017: Inefficient Leaderboard Query

| Field | Value |
|-------|-------|
| **Severity** | 🟡 MEDIUM |
| **Type** | Performance |
| **Affected Files** | `src/lib/storage.ts:413-432` |

**Description:**  
`getUserRank` fetches ALL users then finds index in JavaScript:
```typescript
// storage.ts line 422
.limit(1000); // ...then finds index
```

**Why This Matters:**  
- O(n) operation
- Won't scale past 1000 users
- Increased database load

**Potential Impact:**  
- Performance degradation at scale
- Increased latency
- Database strain

**Risk if Ignored:**  
MEDIUM — Performance at scale

**Recommended Solution:**  
Use PostgreSQL window functions:
```sql
-- Migration: add_leaderboard_indexes
CREATE INDEX CONCURRENTLY idx_game_progress_prestige_level 
  ON game_progress(prestige_level DESC, level DESC, total_xp DESC);
```

**Estimated Implementation Effort:** 1 hour  
**Responsible Agent:** Backend Developer

---

### TD-018: No Request Timeout Configuration

| Field | Value |
|-------|-------|
| **Severity** | 🟡 MEDIUM |
| **Type** | User Experience |
| **Affected Files** | All API calls in App.tsx, AdSystem.tsx |

**Description:**  
Fetch calls have no timeout, could hang indefinitely.

**Why This Matters:**  
- Poor UX on slow networks
- No timeout handling
- User confusion

**Potential Impact:**  
- Bad UX on slow connections
- Confused users
- Potential memory leaks

**Risk if Ignored:**  
LOW — UX issue

**Recommended Solution:**  
Add 30-second timeout to all fetch calls:
```typescript
const controller = new AbortController();
setTimeout(() => controller.abort(), 30000);

fetch(url, { signal: controller.signal });
```

**Estimated Implementation Effort:** 1 hour  
**Responsible Agent:** Frontend Developer

---

## Low Priority Issues

### TD-019: No API Versioning

| Field | Value |
|-------|-------|
| **Severity** | 🟢 LOW |
| **Type** | Architecture |
| **Affected Files** | All frontend API calls |

**Recommended Solution:**  
Consider versioned endpoints for future-proofing: `/functions/v1/` → `/functions/v2/`

**Estimated Implementation Effort:** 2 hours

---

### TD-020: Missing Performance Monitoring

| Field | Value |
|-------|-------|
| **Severity** | 🟢 LOW |
| **Type** | Operations |
| **Affected Files** | N/A — not implemented |

**Recommended Solution:**  
Add Sentry for frontend and edge function error tracking.

**Estimated Implementation Effort:** 1 hour

---

### TD-021: No Documentation for Edge Function APIs

| Field | Value |
|-------|-------|
| **Severity** | 🟢 LOW |
| **Type** | Documentation |
| **Affected Files** | `/supabase/functions/*/index.ts` |

**Recommended Solution:**  
Add JSDoc comments with request/response examples.

**Estimated Implementation Effort:** 4 hours

---

### TD-022: Duplicate Daily Reset Logic

| Field | Value |
|-------|-------|
| **Severity** | 🟢 LOW |
| **Type** | Code Quality |
| **Affected Files** | Multiple files |

**Description:**  
Daily ad limits reset in multiple places:
- `claim-ad-reward/index.ts:78-90` — `resetIfNewDay()`
- Client-side in `useGame.ts` and `AdSystem.tsx`

**Recommended Solution:**  
Centralize daily reset logic in single utility.

**Estimated Implementation Effort:** 2 hours

---

### TD-023: No SEO/Meta Tags for Web Preview

| Field | Value |
|-------|-------|
| **Severity** | 🟢 LOW |
| **Type** | Marketing |
| **Affected Files** | `/index.html` |

**Recommended Solution:**  
Add OpenGraph and Twitter card meta tags for sharing.

**Estimated Implementation Effort:** 30 minutes

---

## Code Maintainability Analysis

### Strengths ✅

1. **Good Separation of Concerns**
   - Game logic separated from UI components
   - Storage layer abstracted from game state
   - Server-authoritative critical operations

2. **TypeScript Throughout**
   - Strong typing on frontend
   - Proper use of interfaces for game entities
   - Type definitions centralized in `types/game.ts`

3. **React Hooks Architecture**
   - Functional components throughout
   - Proper use of useState/useCallback/useMemo
   - Clean component composition

4. **Server-Authoritative Design**
   - HMAC validation for critical operations
   - Edge functions for game state mutations
   - Proper security boundaries

### Weaknesses ⚠️

1. **Monolithic Hooks**
   - `useGame.ts` is 482 lines of single responsibility violation
   - Mixed concerns: game state, UI state, persistence, timers

2. **Inconsistent Error Handling**
   - Some places use try-catch, others ignore errors
   - No centralized error handling strategy
   - Inconsistent user-facing error messages

3. **Missing Abstraction Layers**
   - Direct API URL construction
   - No centralized state management beyond useState
   - No service layer abstraction

4. **Magic Numbers**
   - 30+ hardcoded numeric values
   - No constants file
   - Complex expressions without explanation

---

## Pattern Standardization Issues

### 1. API Call Patterns

**Current Inconsistency:**
```typescript
// Pattern A — Direct fetch
fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/claim-ad-reward`, ...)

// Pattern B — RPC wrapper
const result = await rpcLoadGameState(telegramId);

// Pattern C — Supabase client
supabase.functions.invoke('game-action', { body: {...} });
```

**Standard Pattern:**
```typescript
// Centralized API client
export const GameAPI = {
  async claimAdReward(data: ClaimRequest): Promise<ClaimResponse> {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/claim-ad-reward`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleApiResponse(response);
  },
};
```

### 2. Error Handling Patterns

**Current Inconsistency:**
```typescript
// Pattern A — Silent failure
} catch (e) {
  console.error('Failed:', e);
}

// Pattern B — User notification
} catch (err) {
  setConnectionError('Проблеми зі з\'єднанням');
}

// Pattern C — Silent with flag
} catch (e) {
  // silently fail
}
```

**Standard Pattern:**
```typescript
// Pattern A — Silent failure with logging
} catch (e) {
  logger.error('Feature failed', { feature: 'action', error: e });
  return { success: false, error: 'Operation failed' };
}

// Pattern B — User notification with recovery
} catch (err) {
  logger.error('Network error', { error: err });
  setConnectionError('Проблеми зі з\'єднанням. Прогрес збережеться локально');
  setSyncStatus('error');
}
```

### 3. Naming Convention Violations

| Pattern | Current | Standard |
|---------|---------|----------|
| Database columns | `telegram_id`, `epoch_id` | `telegram_id`, `epoch_id` ✅ |
| TypeScript interfaces | `GameState`, `EpochId` | `GameState`, `EpochId` ✅ |
| JavaScript variables | `telegramId`, `epochId` | camelCase ✅ |
| Constants | `LOCAL_SAVE_INTERVAL` | UPPER_SNAKE_CASE ✅ |
| Functions | Mixed ( Ukrainian comments, English names) | English throughout |

---

## Architectural Refactoring Needs

### 1. State Management Architecture

**Current:**
```
useGame.ts (482 lines)
├── ALL game state (30+ properties)
├── ALL UI state (modals, tabs)
├── ALL effects (timers, persistence)
└── ALL callbacks (actions)
```

**Proposed (Context-based):**
```
<GameProvider>
  <GameStateContext>
    {/* Pure game state only */}
  </GameStateContext>
  <PersistenceContext>
    {/* Save/load logic */}
  </PersistenceContext>
  <UIContext>
    {/* Modals, tabs, UI state */}
  </UIContext>
  <NetworkContext>
    {/* Online status, sync */}
  </NetworkContext>
</GameProvider>
```

### 2. API Layer Architecture

**Current:**
```
App.tsx ──┬──► fetch() (direct)
          ├──► rpc.ts (partial wrapper)
          └──► supabase.functions.invoke()
          
AdSystem.tsx ──► fetch() (direct)
GachaModal.tsx ──► rpcOpenChest()
```

**Proposed:**
```
/src/api/
├── client.ts          # Base fetch wrapper with timeout/logging
├── endpoints/
│   ├── game.ts        # Game state endpoints
│   ├── ad.ts          # Ad reward endpoints  
│   └── session.ts     # Session tracking
└── types.ts           # API request/response types

// Usage
import { GameAPI } from '@/api';
await GameAPI.claimAdReward({ telegramId, rewardType });
```

### 3. Shared Data Package

**Current Problem:**
```
src/data/epochs.ts ──┐
                      ├──► ARTIFACTS (duplicated)
supabase/functions/  │
open-chest/index.ts ──┘
```

**Proposed Solution:**
```
/packages/game-data/
├── src/
│   ├── epochs.ts
│   ├── artifacts.ts
│   ├── tasks.ts
│   └── constants.ts
├── package.json
└── tsconfig.json

// Frontend
import { ARTIFACTS } from '@museum-tapper/game-data';

// Backend
import { ARTIFACTS } from 'game-data:artifacts';
```

---

## Long-term Maintainability Concerns

### 1. Testing Infrastructure

**Current State:** Zero test coverage

**Concern:**  
Without tests, the codebase becomes increasingly fragile with each feature addition. Refactoring becomes high-risk, and bugs are discovered in production.

**Recommendation:**  
1. Set up Vitest + React Testing Library
2. Add unit tests for game calculations (XP curve, costs, multipliers)
3. Add integration tests for API layer
4. Add component tests for critical UI flows

### 2. Documentation

**Current State:**  
- No README with setup instructions
- No architecture documentation
- Edge functions lack API documentation
- No contribution guidelines

**Concern:**  
Onboarding new developers takes longer, knowledge is not shared, and institutional knowledge is lost when team members leave.

**Recommendation:**  
1. Create comprehensive README with setup instructions
2. Add architecture decision records (ADR)
3. Document edge function APIs with examples
4. Create style guide for code contributions

### 3. Monitoring & Observability

**Current State:** No APM or error tracking

**Concern:**  
Production issues are discovered reactively (user reports) rather than proactively. Mean time to resolution (MTTR) is higher.

**Recommendation:**  
1. Add Sentry for frontend error tracking
2. Add Sentry for edge function error tracking
3. Add database query performance monitoring
4. Create dashboards for key metrics

### 4. Technical Debt Accumulation Rate

**Current State:**  
- 23 technical debt items identified
- 5 critical issues
- Estimated 20+ days of work to address all issues

**Concern:**  
Without dedicated time for technical debt reduction, velocity will continue to decrease, and the codebase will become increasingly difficult to maintain.

**Recommendation:**  
1. Allocate 20% of sprint capacity to technical debt
2. Create technical debt backlog with estimates
3. Prioritize critical issues for immediate attention
4. Track technical debt metrics over time

---

## Priority Implementation Roadmap

### Phase 1: Critical Security (Week 1)

| # | Issue | Effort | Priority |
|---|-------|--------|----------|
| 1 | Complete server-side generator purchase validation (TD-002) | 4-6h | Critical |
| 2 | Add initData validation to all edge functions (TD-003) | 3-4h | Critical |
| 3 | Add idempotency protection (TD-005) | 2-3h | Critical |
| 4 | Consolidate artifact definitions (TD-004) | 4h | Critical |

### Phase 2: Quick Wins (Week 2)

| # | Issue | Effort | Priority |
|---|-------|--------|----------|
| 5 | Extract XP calculation to shared module (TD-001) | 30m | Critical |
| 6 | Create centralized API client (TD-007) | 2h | High |
| 7 | Extract magic numbers to constants (TD-013) | 3-4h | Medium |
| 8 | Add request timeouts (TD-018) | 1h | Medium |

### Phase 3: Architecture (Weeks 3-4)

| # | Issue | Effort | Priority |
|---|-------|--------|----------|
| 9 | Refactor useGame hook (TD-011) | 3-4 days | High |
| 10 | Add rate limiting (TD-008) | 2h | High |
| 11 | Implement offline save queue (TD-016) | 3h | Medium |
| 12 | Add server-authoritative timestamps (TD-009) | 3h | High |

### Phase 4: Quality (Weeks 5-6)

| # | Issue | Effort | Priority |
|---|-------|--------|----------|
| 13 | Set up test infrastructure (TD-006) | 1-2 weeks | High |
| 14 | Add Zod validation (TD-010) | 6-8h | High |
| 15 | Optimize leaderboard query (TD-017) | 1h | Medium |
| 16 | Add loading states (TD-015) | 2h | Medium |

### Phase 5: Polish (Ongoing)

| # | Issue | Effort | Priority |
|---|-------|--------|----------|
| 17 | Standardize naming conventions (TD-012) | 8-10h | High |
| 18 | Add performance monitoring (TD-020) | 1h | Low |
| 19 | Document edge function APIs (TD-021) | 4h | Low |
| 20 | Remove dead code (TD-014) | 30m | Medium |

---

## Risk Assessment Matrix

| Issue | Probability | Impact | Risk Score | Mitigation |
|-------|-------------|--------|------------|------------|
| TD-002: Generator exploit | HIGH | CRITICAL | 🔴 CRITICAL | Immediate fix |
| TD-003: ID forgery | MEDIUM | HIGH | 🟠 HIGH | Add validation |
| TD-005: Reward duplication | MEDIUM | HIGH | 🟠 HIGH | Add idempotency |
| TD-001: XP desync | MEDIUM | HIGH | 🟠 HIGH | Extract shared module |
| TD-004: Artifact mismatch | LOW | MEDIUM | 🟡 MEDIUM | Shared data package |
| TD-011: Code complexity | MEDIUM | MEDIUM | 🟡 MEDIUM | Refactor hook |
| TD-006: No tests | HIGH | MEDIUM | 🟠 HIGH | Add test infrastructure |

---

## Appendix: File Inventory

### Frontend Source Files (14)
| File | Lines | Purpose | Debt Items |
|------|-------|---------|------------|
| `src/App.tsx` | 458 | Main application | TD-007, TD-015 |
| `src/hooks/useGame.ts` | 483 | Core game state | TD-001, TD-011 |
| `src/lib/storage.ts` | 420 | Persistence | TD-001, TD-016, TD-017 |
| `src/lib/rpc.ts` | 316 | Server actions | TD-007 |
| `src/lib/utils.ts` | 9 | Utilities | — |
| `src/types/game.ts` | 299 | Type definitions | TD-012 |
| `src/data/epochs.ts` | 183+ | Epoch/generator data | TD-004, TD-014 |
| `src/data/tasks.ts` | 92 | Task definitions | — |
| `src/components/*.tsx` | ~1500 | UI components | TD-015 |
| `src/services/adsgram.ts` | 211 | Ad SDK | TD-007 |

### Edge Functions (10)
| Function | Lines | Purpose | Debt Items |
|----------|-------|---------|------------|
| `game-action` | 167 | Server-authoritative | TD-002, TD-010 |
| `open-chest` | 349 | Chest RNG | TD-003, TD-004, TD-005, TD-010 |
| `perform-prestige` | 217 | Rebirth | TD-003, TD-010 |
| `claim-ad-reward` | 272 | Ad rewards | TD-003, TD-005, TD-010 |
| `claim-offline-income` | 198 | Offline progress | TD-003, TD-005, TD-009 |
| `validate-init-data` | 107 | HMAC validation | — |
| `telegram-payments` | 448 | Stars payments | TD-003 |
| `track-session` | 191 | Analytics | TD-009 |
| `adsgram-reward` | 315 | AdsGram callback | TD-003 |
| `push-notification` | 239 | FCM | TD-003 |

### Shared Utilities
| File | Lines | Purpose | Debt Items |
|------|-------|---------|------------|
| `supabase/functions/_shared/validate-init-data.ts` | 77 | Auth middleware | TD-003 |

---

## Conclusion

The Virtual Museum Tapper Game codebase demonstrates solid architectural foundations with proper server-authoritative game mechanics. However, critical technical debt issues pose immediate risks to game economy, security, and long-term maintainability.

**Key Recommendations:**

1. **Immediate Action (Week 1):** Fix critical security issues (TD-002, TD-003, TD-005)

2. **Short-term (Weeks 2-4):** Address high-priority debt (TD-001, TD-007, TD-008, TD-011)

3. **Medium-term (Weeks 5-6):** Establish quality infrastructure (TD-006, TD-010, TD-012)

4. **Long-term (Ongoing):** Allocate 20% capacity to technical debt reduction

**Success Metrics:**
- Critical issues: 0 by end of Week 1
- High-priority issues: Reduced by 50% by end of Week 4
- Test coverage: 50%+ by end of Week 6
- Technical debt items: Reduced by 50% by end of Month 2

---

*Document Version: 1.0*  
*Last Updated: 2026-07-02*  
*Next Review: 2026-08-01*
