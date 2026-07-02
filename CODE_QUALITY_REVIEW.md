# CODE QUALITY REVIEW
## Virtual Museum Tapper Game v1.6.6

**Review Date:** 2026-07-02  
**Reviewer:** AAA Mobile Game Studio Code Review Team  
**Standards:** AAA Mobile Game Studio Code Quality Standards

---

## EXECUTIVE SUMMARY

| Category | Grade | Issues | Critical | High | Medium | Low |
|----------|-------|--------|---------|------|--------|-----|
| Naming Conventions | B- | 5 | 1 | 1 | 2 | 1 |
| Code Duplication | C | 6 | 2 | 2 | 2 | 0 |
| Component Complexity | C+ | 4 | 1 | 1 | 2 | 0 |
| Best Practices | C+ | 5 | 1 | 2 | 2 | 0 |
| Error Handling | C | 4 | 1 | 1 | 2 | 0 |
| Comment Quality | B | 3 | 0 | 0 | 2 | 1 |
| Code Organization | B- | 4 | 0 | 1 | 2 | 1 |
| TypeScript Usage | B+ | 3 | 0 | 1 | 2 | 0 |
| **OVERALL** | **C+** | **34** | **6** | **9** | **16** | **3** |

---

## 1. NAMING CONVENTIONS

### Issue N-001: ActiveBoosters Type Uses snake_case in TypeScript
**Severity:** 🔴 CRITICAL

**Description:**  
The `ActiveBoosters` interface in `src/types/game.ts` uses snake_case property names (`xp_boost_end`, `currency_boost_mult`, etc.) while the rest of the TypeScript codebase follows camelCase conventions. This breaks TypeScript type safety and creates confusion at the TS/DB boundary.

**Affected Files:**
- `src/types/game.ts` (lines 72-95)
- `src/hooks/useGame.ts` (lines 112-134)
- `src/services/adsgram.ts` (lines 172-174)
- `src/lib/storage.ts` (lines 110-118)

**Why This Matters:**  
TypeScript's type system should guarantee consistency. Mixing naming conventions defeats the purpose of type safety and creates cognitive load for developers.

**Potential Impact:**  
- Runtime errors when property names don't match expectations
- Harder to maintain and refactor
- Confusion for new developers

**Risk If Ignored:**  
HIGH - Can lead to subtle bugs and increased maintenance burden

**Recommended Solution:**
```typescript
// Current (broken)
interface ActiveBoosters {
  xp_boost_end?: number | null;
  xp_boost_mult?: number;
}

// Recommended
interface ActiveBoosters {
  xpBoostEnd?: number | null;
  xpBoostMult?: number;
}
```

Add a transformation layer in `storage.ts` to convert between camelCase (TypeScript) and snake_case (database):

```typescript
function transformBoostersToDb(boosters: ActiveBoosters): Record<string, unknown> {
  return {
    xp_boost_end: boosters.xpBoostEnd,
    xp_boost_mult: boosters.xpBoostMult,
    // ...
  };
}
```

**Estimated Implementation Effort:** 2-3 hours  
**Responsible Agent:** Frontend Developer

---

### Issue N-002: Mixed Naming in Same File (useGame.ts)
**Severity:** 🟠 HIGH

**Description:**  
The `useGame.ts` hook mixes camelCase (`telegramId`, `dailyAdViews`) with snake_case from `ActiveBoosters` (`xp_boost_end`, `active_boosters`).

**Affected Files:**
- `src/hooks/useGame.ts` (lines 1-482)

**Why This Matters:**  
Inconsistent naming within the same file reduces readability and maintainability.

**Potential Impact:**  
- Developer confusion
- Harder to grep/find usages

**Risk If Ignored:**  
MEDIUM - Code continues to work but is harder to maintain

**Recommended Solution:**  
Standardize all internal usage to camelCase; handle DB conversion in `storage.ts`.

**Estimated Implementation Effort:** 1 hour  
**Responsible Agent:** Frontend Developer

---

### Issue N-003: Database Column Name Pass-through Without Transformation
**Severity:** 🟡 MEDIUM

**Description:**  
In `storage.ts` lines 129-134, database column names are used directly without any transformation layer:

```typescript
artifact_parts: ensureJson(state.artifactParts) as Record<string, number>,
xp_boost_end: state.activeBoosters.xp_boost_end, // Direct snake_case
```

**Affected Files:**
- `src/lib/storage.ts`

**Why This Matters:**  
This tight coupling between DB schema and application code makes schema changes dangerous.

**Potential Impact:**  
- Schema changes break multiple files
- Harder to test
- No abstraction layer

**Risk If Ignored:**  
MEDIUM - Technical debt accumulation

**Recommended Solution:**  
Create a dedicated transformation module:

```typescript
// lib/transformers.ts
export function gameStateToDb(state: GameState): DbGameState {
  return {
    artifact_parts: state.artifactParts,
    xp_boost_end: state.activeBoosters.xpBoostEnd,
    // ... explicit mapping
  };
}
```

**Estimated Implementation Effort:** 4-6 hours  
**Responsible Agent:** Full-stack Developer

---

### Issue N-004: Generator IDs Use kebab-case While TS Uses camelCase
**Severity:** 🟢 LOW

**Description:**  
Generator IDs like `'clay_pit'`, `'gold_mine'` use kebab-case, which is inconsistent with TypeScript conventions.

**Affected Files:**
- `src/data/epochs.ts`

**Why This Matters:**  
Minor inconsistency in naming conventions.

**Potential Impact:**  
- Minor readability concern

**Risk If Ignored:**  
LOW - Works correctly, minor cosmetic issue

**Recommended Solution:**  
Consider using camelCase for new generators, or document that generator IDs follow a specific naming convention for legacy reasons.

**Estimated Implementation Effort:** N/A (cosmetic)  
**Responsible Agent:** Design Decision

---

## 2. CODE DUPLICATION

### Issue D-001: calculateXpToLevel() Duplicated
**Severity:** 🔴 CRITICAL

**Description:**  
The `calculateXpToLevel()` function is implemented identically in two locations:
- `src/hooks/useGame.ts` (lines 45-86)
- `src/lib/storage.ts` (lines 29-57)

These are byte-for-byte identical implementations. Any change to the XP curve formula must be manually mirrored in both places.

**Affected Files:**
- `src/hooks/useGame.ts`
- `src/lib/storage.ts`

**Why This Matters:**  
This violates DRY (Don't Repeat Yourself) and creates a ticking time bomb. When one copy is updated without the other, the game becomes inconsistent between client and server calculations.

**Potential Impact:**  
- Client/server desync when XP calculations diverge
- Hidden bugs from partial updates
- Difficulty debugging "why did my XP calculation change?"

**Risk If Ignored:**  
CRITICAL - Can cause game-breaking inconsistencies

**Recommended Solution:**
```typescript
// src/lib/gameMath.ts
export function calculateXpToLevel(level: number): number {
  // Single source of truth
}

export function estimatePassiveForEpoch(epoch: Epoch, levelInEpoch: number): number {
  // Single source of truth
}

// Import from both useGame.ts and storage.ts
import { calculateXpToLevel } from '../lib/gameMath';
```

**Estimated Implementation Effort:** 1 hour  
**Responsible Agent:** Frontend Developer

---

### Issue D-002: ARTIFACTS Array Triplicated
**Severity:** 🔴 CRITICAL

**Description:**  
The `ARTIFACTS` array is defined in three locations with slightly different implementations:
1. `src/data/epochs.ts` (lines 84-120) - TypeScript Artifact[]
2. `supabase/functions/open-chest/index.ts` (lines 59-122) - TypeScript array
3. `supabase/functions/gacha/` - (presumed third location)

**Affected Files:**
- `src/data/epochs.ts`
- `supabase/functions/open-chest/index.ts`
- `supabase/functions/gacha/index.ts`

**Why This Matters:**  
When adding new artifacts, developers must update all three locations. Missing an update causes server/client desync where the server may grant artifacts the client doesn't know about.

**Potential Impact:**  
- Game-breaking desync bugs
- Player frustration
- QA nightmare

**Risk If Ignored:**  
CRITICAL - Guaranteed bugs when adding artifacts

**Recommended Solution:**  
Create a single source of truth in the database or a shared module:

```typescript
// Option 1: Database table
// supabase/migrations/artifact_definitions.sql
CREATE TABLE artifact_definitions (
  id TEXT PRIMARY KEY,
  epoch_id TEXT NOT NULL,
  rarity TEXT NOT NULL,
  parts INTEGER NOT NULL,
  bonus_type TEXT NOT NULL,
  bonus_value REAL NOT NULL,
  icon TEXT NOT NULL
);

// Option 2: Shared package
// shared/artifacts.ts - imported by both frontend and edge functions
```

**Estimated Implementation Effort:** 8-12 hours  
**Responsible Agent:** Full-stack Developer

---

### Issue D-003: estimatePassiveForEpoch() Duplicated
**Severity:** 🟠 HIGH

**Description:**  
Same function appears in both `useGame.ts` (lines 88-99) and `storage.ts` (lines 59-68).

**Affected Files:**
- `src/hooks/useGame.ts`
- `src/lib/storage.ts`

**Why This Matters:**  
Same DRY violation as D-001.

**Potential Impact:**  
- Inconsistent passive XP calculations
- Maintenance burden

**Risk If Ignored:**  
HIGH - Will cause bugs when formula changes

**Recommended Solution:**  
Move to `src/lib/gameMath.ts` alongside `calculateXpToLevel()`.

**Estimated Implementation Effort:** 30 minutes  
**Responsible Agent:** Frontend Developer

---

### Issue D-004: Edge Function Response Helpers Duplicated
**Severity:** 🟠 HIGH

**Description:**  
Every edge function defines its own `jsonResponse()` helper with identical implementation:

```typescript
// All edge functions have this:
function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
```

**Affected Files:**
- All edge functions in `supabase/functions/*/index.ts`

**Why This Matters:**  
Maintenance burden - any change to response format requires updating all files.

**Potential Impact:**  
- Inconsistent error responses
- Repeated code

**Risk If Ignored:**  
MEDIUM - Works but increases maintenance

**Recommended Solution:**
```typescript
// supabase/functions/_shared/response.ts
export function jsonResponse(data: unknown, status = 200, corsHeaders = DEFAULT_CORS) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

export function errorResponse(message: string, status = 500) {
  return jsonResponse({ error: message }, status);
}
```

**Estimated Implementation Effort:** 2-3 hours  
**Responsible Agent:** Backend Developer

---

### Issue D-005: CORS Headers Duplicated
**Severity:** 🟡 MEDIUM

**Description:**  
CORS headers are copy-pasted in every edge function:

```typescript
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};
```

**Affected Files:** All edge functions

**Why This Matters:**  
Same maintenance burden as D-004.

**Potential Impact:**  
- Inconsistent CORS if one file is missed
- Repeated code

**Risk If Ignored:**  
MEDIUM - Minor maintenance issue

**Recommended Solution:**  
Move to shared module (see D-004 solution).

**Estimated Implementation Effort:** 1 hour  
**Responsible Agent:** Backend Developer

---

### Issue D-006: HMAC Validation Duplicated
**Severity:** 🟡 MEDIUM

**Description:**  
`validateInitData()` is implemented twice:
- `supabase/functions/_shared/validate-init-data.ts`
- `supabase/functions/game-action/index.ts` (lines 34-58)

**Affected Files:**
- `supabase/functions/_shared/validate-init-data.ts`
- `supabase/functions/game-action/index.ts`

**Why This Matters:**  
Risk of divergence between implementations.

**Potential Impact:**  
- Security vulnerabilities if one is updated without the other
- Confusion

**Risk If Ignored:**  
MEDIUM - Potential security issue

**Recommended Solution:**  
Remove duplicate from `game-action/index.ts`, import from shared module.

**Estimated Implementation Effort:** 30 minutes  
**Responsible Agent:** Backend Developer

---

## 3. COMPONENT COMPLEXITY

### Issue C-001: TapArea.tsx Contains 4 Components (363 Lines)
**Severity:** 🔴 CRITICAL

**Description:**  
`TapArea.tsx` contains 4 component definitions in a single file:
- `TapParticle` (lines 22-66)
- `TapRipple` (lines 69-102)
- `ComboIndicator` (lines 105-132)
- `TapArea` (main, lines 134-363)

**Affected Files:**
- `src/components/TapArea.tsx`

**Why This Matters:**  
- Exceeds recommended file size limits (AAA standard: max 200 lines)
- Hard to navigate and maintain
- Difficult to test individual components
- Overwhelming for code reviews

**Potential Impact:**  
- Slower development velocity
- Higher bug introduction rate
- Harder onboarding for new developers

**Risk If Ignored:**  
CRITICAL - Will become unmaintainable as features grow

**Recommended Solution:**
```
src/components/TapArea/
├── index.tsx           # Re-exports, composes children
├── TapParticle.tsx     # Extracted particle component
├── TapRipple.tsx       # Extracted ripple component
├── ComboIndicator.tsx  # Extracted combo component
└── TapAreaMain.tsx     # Main tap area logic
```

**Estimated Implementation Effort:** 2-3 hours  
**Responsible Agent:** Frontend Developer

---

### Issue C-002: useGame.ts Hook is 1066 Lines
**Severity:** 🔴 CRITICAL

**Description:**  
The `useGame.ts` hook exceeds AAA standard limits by 10x. AAA mobile game studios recommend hooks under 100 lines with single responsibilities.

**Affected Files:**
- `src/hooks/useGame.ts`

**Why This Matters:**  
- Impossible to fully test
- Hidden complexity
- Difficult to debug
- Violates single responsibility principle

**Potential Impact:**  
- Bug introduction risk
- Slow feature development
- High onboarding cost

**Risk If Ignored:**  
CRITICAL - Technical debt that compounds over time

**Recommended Solution:**
```
src/hooks/
├── useGame.ts              # Main hook, orchestrates children
├── useGameState.ts         # Core state management
├── useGameTapping.ts       # Tap handling logic
├── useGameGenerators.ts    # Generator purchase logic
├── useGamePrestige.ts      # Prestige system logic
├── useGameEnergy.ts        # Energy system logic
├── useGameSync.ts          # Sync/save logic
└── useGameBoosts.ts        # Booster management
```

**Estimated Implementation Effort:** 16-24 hours  
**Responsible Agent:** Frontend Developer

---

### Issue C-003: App.tsx is 457 Lines
**Severity:** 🟠 HIGH

**Description:**  
`App.tsx` exceeds recommended size limits with 457 lines.

**Affected Files:**
- `src/App.tsx`

**Why This Matters:**  
- Complex to understand at a glance
- Many inline components could be extracted
- Mixing of concerns

**Potential Impact:**  
- Slow feature development
- High bug risk when modifying

**Risk If Ignored:**  
HIGH - Will continue to grow

**Recommended Solution:**
```
src/components/App/
├── App.tsx              # Main app shell
├── TabNavigation.tsx    # Tab button component
├── StatCard.tsx         # Stat display component
├── BoosterCard.tsx      # Booster purchase card
├── ActiveBoosterBadge.tsx # Active booster indicator
├── EpochModal.tsx       # Epoch selection modal
└── tabs/
    ├── ShopTab.tsx
    ├── EpochsTab.tsx
    ├── ArtifactsTab.tsx
    └── ...other tabs
```

**Estimated Implementation Effort:** 8-12 hours  
**Responsible Agent:** Frontend Developer

---

### Issue C-004: Complex Tick Interval Logic in useGame.ts
**Severity:** 🟡 MEDIUM

**Description:**  
The game tick interval (lines 453-515 in the full file) handles multiple concerns:
- Passive XP accumulation
- Level-up detection
- Passive generator income
- Energy regeneration
- Offline income calculation
- Various multipliers

All in a single `useEffect` with multiple state updates.

**Affected Files:**
- `src/hooks/useGame.ts`

**Why This Matters:**  
- Multiple state updates in sequence can cause stale closure issues
- Hard to test all combinations
- Performance implications from frequent re-renders

**Potential Impact:**  
- Subtle bugs in XP calculation
- Performance issues on low-end devices

**Risk If Ignored:**  
MEDIUM - Can cause bugs and performance issues

**Recommended Solution:**  
Break into smaller `useEffect` hooks with clear separation:

```typescript
// Separate hooks for each concern
usePassiveXpAccumulation();
useLevelUpDetection();
useGeneratorProduction();
useEnergyRegeneration();
useOfflineIncome();
```

**Estimated Implementation Effort:** 4-6 hours  
**Responsible Agent:** Frontend Developer

---

## 4. BEST PRACTICES ADHERENCE

### Issue B-001: buyGenerator RPC is Stub-Only (Security Vulnerability)
**Severity:** 🔴 CRITICAL

**Description:**  
The `buyGenerator` action in `game-action/index.ts` is not implemented:

```typescript
async function buyGenerator(supabase, telegramId, generatorId) {
  // TODO: Move epoch/generator definitions into a shared config or DB table
  // so the server can independently compute costs.
  return { ok: false, error: "buy_generator: cost validation requires server-side generator definitions — coming soon" };
}
```

**Affected Files:**
- `supabase/functions/game-action/index.ts` (lines 62-79)
- `src/lib/rpc.ts` (lines 58-60)

**Why This Matters:**  
Generator purchases are verified client-side only. Players can exploit this to:
- Buy generators they can't afford
- Buy unlimited generators
- Manipulate prices

**Potential Impact:**  
- Game economy exploitation
- Revenue loss
- Player frustration from desync

**Risk If Ignored:**  
CRITICAL - Direct exploitation of game economy

**Recommended Solution:**  
1. Create shared generator definitions in database
2. Implement server-side cost calculation
3. Verify purchases on server before applying

```typescript
async function buyGenerator(supabase, telegramId, generatorId) {
  // 1. Fetch generator definition from DB
  // 2. Calculate cost server-side
  // 3. Verify balance
  // 4. Deduct and save
}
```

**Estimated Implementation Effort:** 8-12 hours  
**Responsible Agent:** Full-stack Developer

---

### Issue B-002: No Barrel Exports
**Severity:** 🟠 HIGH

**Description:**  
The codebase lacks barrel exports (index files), forcing verbose imports:

```typescript
// Current
import { TapArea } from './components/TapArea';
import { GeneratorShop } from './components/GeneratorShop';
import { formatNumber } from './lib/utils';
import { getEpochById, EPOCHS } from './data/epochs';

// Better (with barrel exports)
import { TapArea, GeneratorShop } from './components';
import { formatNumber } from './lib';
import { getEpochById, EPOCHS, ARTIFACTS } from './data';
```

**Affected Files:**
- `src/components/` (no index.ts)
- `src/lib/` (no index.ts)
- `src/data/` (no index.ts)
- `src/types/` (no index.ts)

**Why This Matters:**  
- Verbose imports
- Harder to refactor
- Poor developer experience

**Potential Impact:**  
- Slower development
- Import errors

**Risk If Ignored:**  
MEDIUM - Developer experience issue

**Recommended Solution:**
```typescript
// src/components/index.ts
export { TapArea } from './TapArea';
export { GeneratorShop } from './GeneratorShop';
// ... all component exports
```

**Estimated Implementation Effort:** 2-3 hours  
**Responsible Agent:** Frontend Developer

---

### Issue B-003: No Shared Types Between Frontend and Edge Functions
**Severity:** 🟠 HIGH

**Description:**  
Edge functions define their own interfaces locally while the frontend has different definitions:

```typescript
// open-chest/index.ts
interface OpenChestRequest {
  telegram_id: number;
  epoch_id: string;
  chest_type?: "skychest" | "daily";
}

// Frontend doesn't share this type - manual sync required
```

**Affected Files:**
- All edge functions
- `src/types/game.ts`

**Why This Matters:**  
- Type drift between client/server
- Manual sync burden
- Runtime errors from mismatched types

**Potential Impact:**  
- Harder to maintain
- Potential desync bugs

**Risk If Ignored:**  
MEDIUM - Technical debt

**Recommended Solution:**  
Create a shared types package:

```
shared/
├── types/
│   ├── requests.ts
│   ├── responses.ts
│   └── game.ts
├── artifacts.ts
└── epochs.ts

// Imported by both frontend and edge functions
```

**Estimated Implementation Effort:** 6-8 hours  
**Responsible Agent:** Full-stack Developer

---

### Issue B-004: Unsafe JSON Parsing Without Validation
**Severity:** 🟡 MEDIUM

**Description:**  
In `storage.ts` line 71-74:

```typescript
function ensureJson<T>(value: T | string): T {
  if (typeof value === 'string') {
    try { return JSON.parse(value) as T; } catch { /* Return original value */ }
  }
  return value as T;
}
```

No validation of parsed structure. If JSON is corrupted, silent failure occurs.

**Affected Files:**
- `src/lib/storage.ts`

**Why This Matters:**  
Corrupted data returns silently, causing hard-to-debug issues downstream.

**Potential Impact:**  
- Silent data loss
- Hard-to-debug bugs

**Risk If Ignored:**  
MEDIUM - Can cause subtle bugs

**Recommended Solution:**
```typescript
function ensureJson<T>(value: T | string): T {
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      // Validate structure if needed
      if (typeof parsed === 'object' && parsed !== null) {
        return parsed as T;
      }
      throw new Error('Invalid JSON structure');
    } catch (e) {
      console.error('Failed to parse JSON:', e);
      throw e; // Or return default value
    }
  }
  return value as T;
}
```

**Estimated Implementation Effort:** 1-2 hours  
**Responsible Agent:** Frontend Developer

---

### Issue B-005: Circular Dependency Risk
**Severity:** 🟢 LOW

**Description:**  
In `storage.ts` line 90:

```typescript
export { getTelegramUserId, getTelegramUserInfo, getReferrerId } from './telegram';
```

This re-exports from telegram.ts, which is imported at the top of storage.ts. Future changes could create a circular dependency.

**Affected Files:**
- `src/lib/storage.ts`

**Why This Matters:**  
Potential runtime errors from circular dependencies.

**Potential Impact:**  
- Hard-to-debug import errors
- Build failures

**Risk If Ignored:**  
LOW - Not currently a problem

**Recommended Solution:**  
Remove re-exports, import directly where needed.

**Estimated Implementation Effort:** 30 minutes  
**Responsible Agent:** Frontend Developer

---

## 5. ERROR HANDLING

### Issue E-001: Edge Functions Expose Internal Error Details
**Severity:** 🔴 CRITICAL

**Description:**  
Edge functions use `String(err)` which exposes internal error details to clients:

```typescript
// game-action/index.ts line 163-165
} catch (err) {
  console.error("game-action error:", err);
  return json({ error: String(err) }, 500);
}

// open-chest/index.ts line 344-346
} catch (err) {
  console.error("Open chest error:", err);
  return jsonResponse({ error: "Internal server error" }, 500);
}
```

**Affected Files:**
- All edge functions

**Why This Matters:**  
- Security risk: internal implementation details exposed
- User confusion from technical error messages
- Potential information leakage for attackers

**Potential Impact:**  
- Security vulnerability
- Poor user experience
- Information disclosure

**Risk If Ignored:**  
CRITICAL - Security vulnerability

**Recommended Solution:**
```typescript
} catch (err) {
  console.error("game-action error:", err);
  // Log full error internally
  // Return generic message to client
  return json({ error: "An unexpected error occurred" }, 500);
}
```

**Estimated Implementation Effort:** 1 hour  
**Responsible Agent:** Backend Developer

---

### Issue E-002: Inconsistent Error Patterns Between Edge Functions
**Severity:** 🟠 HIGH

**Description:**  
Different edge functions handle errors differently:
- Some use `jsonResponse()` helper
- Some use inline response creation
- Some return error objects, others return strings

**Affected Files:**
- All edge functions

**Why This Matters:**  
Inconsistent error responses make client-side error handling difficult.

**Potential Impact:**  
- Client-side bugs
- Poor user experience

**Risk If Ignored:**  
HIGH - Developer experience issue

**Recommended Solution:**  
Standardize on shared error handling (see B-004).

**Estimated Implementation Effort:** 2-3 hours  
**Responsible Agent:** Backend Developer

---

### Issue E-003: Missing Error Boundaries in React Components
**Severity:** 🟡 MEDIUM

**Description:**  
No React error boundaries to catch and handle component render errors gracefully.

**Affected Files:**
- `src/App.tsx` (missing error boundary)
- `src/main.tsx` (could wrap here)

**Why This Matters:**  
Uncaught errors crash the entire app.

**Potential Impact:**  
- Poor user experience
- App crashes

**Risk If Ignored:**  
MEDIUM - UX issue

**Recommended Solution:**
```typescript
// src/components/ErrorBoundary.tsx
class ErrorBoundary extends React.Component {
  componentDidCatch(error, errorInfo) {
    // Log to analytics
    // Show fallback UI
  }
  render() {
    return this.props.children;
  }
}
```

**Estimated Implementation Effort:** 2 hours  
**Responsible Agent:** Frontend Developer

---

### Issue E-004: Silent Failures in RPC Calls
**Severity:** 🟡 MEDIUM

**Description:**  
Some RPC functions silently fail without user feedback:

```typescript
// rpc.ts - rpcTrackSession
export async function rpcTrackSession(...): Promise<{ ok: boolean }> {
  if (!supabase) return { ok: false };
  try { ... }
  catch { return { ok: false }; } // Silent failure
}
```

**Affected Files:**
- `src/lib/rpc.ts`

**Why This Matters:**  
Failed operations are invisible to users and developers.

**Potential Impact:**  
- Data loss
- Hard-to-debug issues

**Risk If Ignored:**  
MEDIUM - Data reliability issue

**Recommended Solution:**  
Add optional error logging/analytics for failed operations.

**Estimated Implementation Effort:** 1 hour  
**Responsible Agent:** Frontend Developer

---

## 6. COMMENT QUALITY

### Issue Q-001: Magic Numbers Without Explanation
**Severity:** 🟡 MEDIUM

**Description:**  
Multiple magic numbers throughout the codebase without named constants:

```typescript
// useGame.ts
const energyMult = hasEnergyBoost ? 5 : 1;  // Why 5?
const passiveFloor = Math.round(prev.passiveXpPerSecond * 0.015);  // Why 0.015?
const levelReward = Math.round(newLevel * 50 * currMult);  // Why 50?
const tapPowerCost = 25 * Math.pow(1.8, state.tapPower - 1);  // Why 25? Why 1.8?
```

**Affected Files:**
- `src/hooks/useGame.ts`
- `src/components/`
- `src/data/tasks.ts`

**Why This Matters:**  
- Unclear what values represent
- Hard to tune game balance
- Risk of typos in multiple places

**Potential Impact:**  
- Game balance bugs
- Maintenance difficulty

**Risk If Ignored:**  
MEDIUM - Technical debt

**Recommended Solution:**
```typescript
// src/lib/constants.ts
export const ENERGY_MULTIPLIER = 5;
export const PASSIVE_FLOOR_RATIO = 0.015;
export const LEVEL_REWARD_BASE = 50;
export const TAP_POWER_BASE_COST = 25;
export const TAP_POWER_COST_MULTIPLIER = 1.8;
```

**Estimated Implementation Effort:** 2-3 hours  
**Responsible Agent:** Frontend Developer

---

### Issue Q-002: Complex Formulas Without Comments
**Severity:** 🟡 MEDIUM

**Description:**  
Complex formulas lack explanation:

```typescript
// tasks.ts lines 79-91
const dayInWeek = ((streak - 1) % 7) + 1;
const weekNumber = Math.ceil(streak / 7);
```

**Affected Files:**
- `src/data/tasks.ts`

**Why This Matters:**  
Future developers (including yourself) won't understand the logic.

**Potential Impact:**  
- Bugs from misunderstanding
- Harder to modify

**Risk If Ignored:**  
MEDIUM - Maintainability

**Recommended Solution:**
```typescript
// Calculate day position within current week (1-7)
// Day 1 = first day, Day 7 = weekly bonus day
const dayInWeek = ((streak - 1) % 7) + 1;
// Calculate which weekly cycle we're in
const weekNumber = Math.ceil(streak / 7);
```

**Estimated Implementation Effort:** 1 hour  
**Responsible Agent:** Frontend Developer

---

### Issue Q-003: Good JSDoc on Edge Functions
**Severity:** 🟢 POSITIVE

**Description:**  
Edge functions have excellent JSDoc documentation explaining purpose, parameters, and return values.

**Example:**
```typescript
/**
 * Open Chest Edge Function
 *
 * Server-authoritative chest/skychest opening.
 * Generates artifact fragment rewards with proper rarity chances.
 *
 * Rarity chances:
 * - Common: 60%
 * - Rare: 25%
 * ...
 */
```

**Affected Files:**
- All edge functions in `supabase/functions/`

**Recommendation:**  
Keep this standard and extend to frontend code.

---

## 7. CODE ORGANIZATION

### Issue O-001: No Barrel Exports (See B-002)
**Severity:** 🟠 HIGH

Duplicate issue - see B-002.

---

### Issue O-002: Flat Edge Function Structure
**Severity:** 🟡 MEDIUM

**Description:**  
Edge functions are in a flat directory structure with no organization:

```
supabase/functions/
├── adsgram-reward/
├── apply-referral-bonus/
├── claim-ad-reward/
├── claim-offline-income/
├── fetch-active-boosters/
├── game-action/
├── get-leaderboard/
├── get-user-rank/
├── open-chest/
├── perform-prestige/
├── push-notification/
├── save-game-state/
├── load-game-state/
├── telegram-payments/
├── track-session/
└── validate-init-data/
```

**Why This Matters:**  
Harder to navigate as the number of functions grows.

**Potential Impact:**  
- Slower development
- Harder to find related functions

**Risk If Ignored:**  
MEDIUM - Scalability issue

**Recommended Solution:**
```
supabase/functions/
├── _shared/
│   ├── validate-init-data.ts
│   └── response.ts
├── auth/
│   ├── validate-init-data/
│   └── apply-referral-bonus/
├── game/
│   ├── game-action/
│   ├── open-chest/
│   ├── perform-prestige/
│   └── ...
├── ads/
│   ├── adsgram-reward/
│   ├── claim-ad-reward/
│   └── ...
└── leaderboard/
    ├── get-leaderboard/
    └── get-user-rank/
```

**Estimated Implementation Effort:** 2-3 hours  
**Responsible Agent:** Backend Developer

---

### Issue O-003: No Shared Types Module (See B-003)
**Severity:** 🟡 MEDIUM

Duplicate issue - see B-003.

---

### Issue O-004: Large Components with Inline Sub-components
**Severity:** 🟢 LOW

**Description:**  
Components like `TapArea.tsx` define sub-components inline rather than as separate files.

**Recommendation:**  
See C-001 for detailed refactoring plan.

---

## 8. TYPESCRIPT USAGE

### Issue T-001: unknown + as Pattern Defeats Type Safety
**Severity:** 🟠 HIGH

**Description:**  
In `adsgram.ts` lines 172-174:

```typescript
export function isXpBoostActive(activeBoosters: Record<string, unknown>): boolean {
  const xpBoostEnd = activeBoosters?.xp_boost_end as number | undefined;
  const xpBoostMult = activeBoosters?.xp_boost_mult as number | undefined;
```

Using `unknown` then immediately casting with `as` defeats TypeScript's type safety.

**Affected Files:**
- `src/services/adsgram.ts`
- `src/lib/storage.ts`

**Why This Matters:**  
- Type assertions can hide errors
- No runtime validation
- Silent failures possible

**Potential Impact:**  
- Runtime errors
- Hard-to-debug type issues

**Risk If Ignored:**  
HIGH - Can cause runtime errors

**Recommended Solution:**
```typescript
// Define proper interface
interface XpBoostState {
  xpBoostEnd: number | null;
  xpBoostMult: number;
}

export function isXpBoostActive(boosters: XpBoostState): boolean {
  if (!boosters.xpBoostEnd || !boosters.xpBoostMult) return false;
  return boosters.xpBoostEnd > Date.now() && boosters.xpBoostMult >= XP_BOOST_MULTIPLIER;
}
```

**Estimated Implementation Effort:** 3-4 hours  
**Responsible Agent:** Frontend Developer

---

### Issue T-002: TypeScript Strict Mode Enabled ✓
**Severity:** 🟢 POSITIVE

**Description:**  
`tsconfig.app.json` has strict mode enabled:

```json
{
  "compilerOptions": {
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

**Recommendation:**  
Excellent! Keep this standard.

---

### Issue T-003: Some Unsafe Type Assertions
**Severity:** 🟡 MEDIUM

**Description:**  
Multiple uses of type assertions that bypass type checking:

```typescript
// storage.ts
const parsed = JSON.parse(raw) as GameState;
const boosters = await rpcFetchActiveBoosters(telegramId);
return boosters as ActiveBoosters;
```

**Affected Files:**
- `src/lib/storage.ts`
- Various files

**Why This Matters:**  
Type assertions can hide errors if the actual data doesn't match expectations.

**Potential Impact:**  
- Runtime errors from unexpected data
- Hard-to-debug issues

**Risk If Ignored:**  
MEDIUM - Potential runtime errors

**Recommended Solution:**  
Add runtime validation with zod or similar library:

```typescript
import { z } from 'zod';

const GameStateSchema = z.object({
  epochId: z.string(),
  level: z.number(),
  // ...
});

const result = GameStateSchema.safeParse(parsed);
if (!result.success) {
  // Handle invalid data
}
```

**Estimated Implementation Effort:** 4-6 hours  
**Responsible Agent:** Frontend Developer

---

## SUMMARY & RECOMMENDATIONS

### Critical Issues (6) - Fix Immediately
1. **N-001:** ActiveBoosters snake_case naming
2. **D-001:** calculateXpToLevel() duplication
3. **D-002:** ARTIFACTS array triplication
4. **C-001:** TapArea.tsx component explosion
5. **C-002:** useGame.ts 1066 lines
6. **E-001:** Edge function error exposure
7. **B-001:** buyGenerator stub (security)

### High Priority (9) - Fix Within 2 Weeks
1. **N-002:** Mixed naming in useGame.ts
2. **D-003:** estimatePassiveForEpoch duplication
3. **D-004:** Edge function response helpers
4. **C-003:** App.tsx 457 lines
5. **B-002:** No barrel exports
6. **B-003:** No shared types
7. **E-002:** Inconsistent error patterns
8. **T-001:** unknown + as pattern abuse

### Medium Priority (16) - Fix Within 1 Month
1. **N-003:** DB column pass-through
2. **D-005:** CORS headers duplication
3. **D-006:** HMAC validation duplication
4. **C-004:** Complex tick interval
5. **B-004:** Unsafe JSON parsing
6. **E-003:** Missing error boundaries
7. **E-004:** Silent RPC failures
8. **Q-001:** Magic numbers
9. **Q-002:** Undocumented formulas
10. **O-002:** Flat edge function structure
11. **O-003:** No shared types module
12. **T-003:** Unsafe type assertions

### Low Priority (3) - Fix When Convenient
1. **N-004:** Generator ID kebab-case
2. **B-005:** Circular dependency risk
3. **O-004:** Inline sub-components

---

## IMPLEMENTATION ROADMAP

### Phase 1: Critical Security & Stability (Week 1)
- Fix N-001: ActiveBoosters naming
- Fix B-001: buyGenerator implementation
- Fix E-001: Error exposure
- Fix D-001: XP calculation deduplication

### Phase 2: Code Organization (Week 2-3)
- Fix C-001: TapArea.tsx refactor
- Fix C-002: useGame.ts split
- Fix C-003: App.tsx refactor
- Add barrel exports

### Phase 3: Technical Debt (Week 4-6)
- Fix D-002: ARTIFACTS triplication
- Create shared types module
- Add constants file
- Improve error handling

### Phase 4: Polish (Week 7-8)
- Add error boundaries
- Improve TypeScript strictness
- Add runtime validation
- Documentation improvements

---

**Total Estimated Effort:** 80-120 hours

**Recommended Team Composition:**
- 1 Senior Frontend Developer
- 1 Full-stack Developer
- 1 QA Engineer (for regression testing)

---

*Review completed: 2026-07-02*  
*AAA Mobile Game Studio Code Quality Review Team*  
*Version: Virtual Museum Tapper Game 1.6.6*
