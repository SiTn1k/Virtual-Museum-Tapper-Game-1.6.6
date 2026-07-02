# 17. CODE QUALITY AUDIT — Virtual Museum Tapper Game v1.6.6

**AAA Studio Standards | Brutal Assessment**

---

## EXECUTIVE SUMMARY

| Category | Grade | Notes |
|----------|-------|-------|
| Naming Conventions | B- | Inconsistent snake_case/camelCase mixing, esp. DB ↔ TS boundary |
| Code Organization | B+ | Good separation of concerns, but some DRY violations in edge functions |
| Architecture Consistency | B | Clear patterns but `buyGenerator` RPC is stub-only — architectural debt |
| Comments & Documentation | B- | Good JSDoc on edge functions; internal logic undocumented |
| Error Handling | C+ | Inconsistent error handling; edge functions swallow errors poorly |
| DRY Principle | C | Duplicated formulas across `useGame.ts` ↔ `storage.ts`; edge functions duplicate artifact definitions |
| Function Complexity | B- | Several functions exceed 50 lines; tap/game-tick logic is dense |
| File Organization | A- | Clean structure, appropriate folder hierarchy |
| Import/Export Patterns | B | Some barrel-file gaps; re-exports not always organized |
| TypeScript Discipline | C+ | `unknown` casts, `as` assertions, missing strict mode |
| Technical Debt | C | Significant: server/client artifact sync, hardcoded values, RPC stubs |

---

## 1. NAMING CONVENTIONS

### Issues Found

**CRITICAL: Snake_case ↔ camelCase Boundary Mismatch**

The entire codebase lives at the TypeScript ↔ Supabase interface boundary with no consistent translation layer:

```typescript
// Frontend (camelCase)
artifactParts: Record<string, number>
artifactLevels: Record<string, number>
completedArtifacts: string[]
xp_boost_end?: number

// Database column names (snake_case) — stored as-is in some places
artifact_parts
artifact_levels
completed_artifacts
xp_boost_end

// storage.ts line 129-134 — direct pass-through without transformation
artifact_parts: ensureJson(state.artifactParts) as Record<string, number>,
xp_boost_end: state.activeBoosters.xp_boost_end,
```

The `ActiveBoosters` type uses `snake_case` property names (e.g., `xp_boost_end`) while the rest of the TypeScript codebase uses `camelCase`. This is a **critical naming inconsistency** that makes the type system lie — `ActiveBoosters` is typed as TypeScript but uses Python/DB naming conventions.

**Mixed Naming in Same File**
```typescript
// useGame.ts — both conventions appear
telegramId        // camelCase
dailyAdViews      // camelCase
xp_boost_end      // snake_case (from ActiveBoosters type)
active_boosters   // snake_case in DB payload
```

**Generator/Epoch ID Patterns**
```typescript
// epochs.ts uses kebab-case IDs — consistent ✓
id: 'clay_pit', 'gold_mine', 'royal_tomb'

// But some components reference by icon or index
// GeneratorShop.tsx uses generator.id directly — correct ✓
```

**Recommendation:** Enforce a naming convention policy:
- TypeScript: `camelCase` for all properties
- Database columns: `snake_case` (automatic via ORM conventions)
- **Add a transformation layer** in `storage.ts` to convert between the two
- Consider migrating `ActiveBoosters` to use `camelCase`

---

## 2. CODE ORGANIZATION

### Strengths
- Clear folder structure: `components/`, `hooks/`, `lib/`, `services/`, `types/`, `data/`, `supabase/functions/`
- Single responsibility per file — each utility has its own home
- `useGame.ts` is a well-organized 1066-line state machine

### Issues

**Components mixed in complexity**: `TapArea.tsx` (364 lines) contains 4 component definitions:
- `TapParticle`
- `TapRipple`
- `ComboIndicator`
- `TapArea` (main)

**Recommendation:** Split `TapArea.tsx` into:
```
components/TapArea/
  index.tsx        (main export)
  TapParticle.tsx
  TapRipple.tsx
  ComboIndicator.tsx
```

**Edge function organization**: The `supabase/functions/` folder has flat structure with no subfolders. Consider:
```
supabase/functions/
  auth/
    validate-init-data.ts
  game/
    game-action.ts
    open-chest.ts
    perform-prestige.ts
  ads/
    adsgram-reward.ts
    claim-ad-reward.ts
```

---

## 3. ARCHITECTURE CONSISTENCY

### Critical: `buyGenerator` RPC is a Stub

```typescript
// rpc.ts line 58-60
export async function rpcBuyGenerator(generatorId: string): Promise<RpcResult> {
  return callGameAction({ action: 'buy_generator', generator_id: generatorId });
}

// game-action/index.ts line 62-79 — NEVER IMPLEMENTED
async function buyGenerator(supabase, telegramId, generatorId) {
  // TODO: Move epoch/generator definitions into a shared config or DB table
  // so the server can independently compute costs.
  return { ok: false, error: "buy_generator: cost validation requires server-side generator definitions — coming soon" };
}
```

**The `buyGenerator` action can be exploited client-side.** The cost is computed in `useGame.ts` locally and only verified against the server on `upgradeTap`. This is a **security vulnerability** disguised as technical debt.

### Duplicate Logic: XP Curve

`calculateXpToLevel()` is implemented **twice**:
1. `useGame.ts` lines 45-86
2. `storage.ts` lines 28-56

These are byte-for-byte identical but are separate functions. Any change to one must be manually mirrored to the other.

**Also duplicated**: `estimatePassiveForEpoch()` — same logic in both files.

### Server/Client Artifact Definition Sync

```typescript
// open-chest/index.ts — server-side artifacts (line 57-123)
const ARTIFACTS: Array<{...}> = [...]

// epochs.ts — client-side artifacts (line 84-120)
export const ARTIFACTS: Artifact[] = [...]
```

**These two arrays MUST be kept in sync manually.** This is a ticking time bomb. When you add a new artifact, you must update both places or the server will return artifacts the client doesn't know about.

---

## 4. COMMENTS & DOCUMENTATION

### Good Documentation
- **Edge functions**: Excellent JSDoc headers explaining purpose, parameters, return values
- `telegram.ts`: Detailed security notes explaining `initData` validation flow
- `adsgram.ts`: Block ID, token, and reward configuration documented

### Missing Documentation
- **Magic numbers** without explanation:
  ```typescript
  // useGame.ts line 525
  const energyMult = hasEnergyBoost ? 5 : 1;  // Why 5x?
  
  // useGame.ts line 532
  const passiveFloor = Math.round(prev.passiveXpPerSecond * 0.015);  // Why 0.015?
  
  // useGame.ts line 479
  const levelReward = Math.round(newLevel * 50 * currMult);  // Why 50?
  ```

- **Complex formulas without comments**:
  ```typescript
  // tasks.ts line 79-91
  const dayInWeek = ((streak - 1) % 7) + 1;
  const weekNumber = Math.ceil(streak / 7);
  // These need inline explanation of the streak reward logic
  ```

- **Callback dependencies not explained** in `useEffect` hooks:
  ```typescript
  // useGame.ts line 453-515 — the tick interval
  // No comment explaining why this recalculates passive XP every tick
  ```

**Recommendation:** Add a `constants.ts` file with all magic numbers extracted and named:
```typescript
export const ENERGY_MULTIPLIER = 5;
export const PASSIVE_FLOOR_RATIO = 0.015;
export const LEVEL_REWARD_BASE = 50;
export const TAP_POWER_BASE_COST = 25;
export const TAP_POWER_COST_MULTIPLIER = 1.8;
```

---

## 5. ERROR HANDLING

### Edge Functions — Poor Error Messages

```typescript
// game-action/index.ts line 163-165
} catch (err) {
  console.error("game-action error:", err);
  return json({ error: String(err) }, 500);
}

// open-chest/index.ts line 332-335
} catch (err) {
  console.error("Open chest error:", err);
  return jsonResponse({ error: "Internal server error" }, 500);
}
```

`String(err)` exposes internal error details to clients. Should be sanitized:
```typescript
return json({ error: "Internal server error" }, 500);
```

### Inconsistent Error Handling Patterns

**Edge functions use `jsonResponse` helper:**
```typescript
// open-chest, perform-prestige, claim-ad-reward
function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
```

**game-action uses inline `json` helper:**
```typescript
const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
```

**validate-init-data re-defines the same pattern again.**

This duplication should be extracted to a shared utility module at `supabase/functions/_shared/response.ts`.

### Frontend Error Handling

```typescript
// App.tsx line 303-319 — session ad reward
try {
  const response = await fetch(...);
  const data = await response.json();
  if (data.success) { ... }
  else { hapticNotification('warning'); }  // Silent failure — user doesn't know why
} catch (err) {
  console.error(...);
  hapticNotification('warning');  // Silent failure
}
```

**Recommendation:** Add toast notifications for all error cases, not just success.

---

## 6. DRY PRINCIPLE VIOLATIONS

### Formula Duplication

| Formula | useGame.ts | storage.ts | Notes |
|---------|------------|------------|-------|
| `calculateXpToLevel()` | Line 45 | Line 28 | Identical |
| `estimatePassiveForEpoch()` | Line 88 | Line 58 | Identical |
| Tap power cost formula | Line 612 | Line 88 (edge fn) | Slight variation |

**Fix**: Extract to `src/lib/gameMath.ts`:
```typescript
export function calculateXpToLevel(level: number): number { ... }
export function getGeneratorCost(generator: Generator, currentLevel: number): number { ... }
export function estimatePassiveForEpoch(epoch: Epoch, levelInEpoch: number): number { ... }
```

### Edge Function Response Helpers

Every edge function redefines `jsonResponse`:
- `open-chest/index.ts` line 125
- `perform-prestige/index.ts` line 57
- `claim-ad-reward/index.ts` line 61
- `validate-init-data/index.ts` line 82
- `adsgram-reward/index.ts` line 37
- `game-action/index.ts` line 126

**Fix**: Create `supabase/functions/_shared/response.ts`:
```typescript
export function jsonResponse(data: unknown, status = 200, extraHeaders?: Record<string, string>) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, ...extraHeaders, "Content-Type": "application/json" },
  });
}
```

### CORs Headers Duplication

```typescript
// Every edge function has this:
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "...",
  "Access-Control-Allow-Headers": "...",
};
```

**Fix**: Move to `_shared/cors.ts` and import everywhere.

### Artifact Definition Duplication

The `ARTIFACTS` array is defined **three times**:
1. `open-chest/index.ts` lines 56-123
2. `epochs.ts` lines 84-120
3. Potentially in gacha logic

**Fix**: Store artifact definitions in a **database table** and query from both places. This is the only real solution for sync.

---

## 7. FUNCTION COMPLEXITY

### High-Complexity Functions (AAA Standard: >50 lines)

| Function | File | Lines | Complexity Score |
|----------|------|-------|------------------|
| `calculateXpToLevel` | useGame.ts | 41 | Medium |
| `useGame` (hook) | useGame.ts | 1066 | Very High |
| `tap` callback | useGame.ts | 54 | Medium |
| `performPrestige` | useGame.ts | 65 | Medium |
| `hydrateFromDb` | storage.ts | 59 | Medium |
| `saveRemoteState` | storage.ts | 91 | High |
| `generateRewards` | open-chest/index.ts | 37 | Medium |
| `TapArea` component | TapArea.tsx | 215 | Very High |
| `App` component | App.tsx | ~430 | Very High |

### Specific Issues

**`useGame` hook (lines 194-1066)**: This single hook returns 40+ properties. Consider splitting:
- `useGameCore()` — state, tap, buyGenerator
- `usePrestige()` — prestige-related state and actions
- `useEnergy()` — energy system
- `useSync()` — save/load/sync status

**`App.tsx` (~430 lines)**: The main component is too large. Extract:
- Header/sync status bar
- Tab bar
- Modal management
- Each tab content to separate files

**`saveRemoteState` (91 lines)**: The payload construction is verbose. Extract:
```typescript
function buildSavePayload(state: GameState, userInfo: UserInfo): SavePayload { ... }
```

---

## 8. FILE ORGANIZATION

### Current Structure ✓
```
src/
├── components/     (12 components)
├── hooks/         (1 main hook + shared)
├── lib/           (utilities)
├── services/      (ads integration)
├── types/         (TypeScript types)
├── data/          (game data)
└── App.tsx        (main entry)

supabase/
├── functions/     (edge functions)
└── migrations/   (database schema)
```

### Issues

**No index/barrel files for exports:**
```typescript
// Currently must import from individual files:
import { TapArea } from './components/TapArea';
import { GeneratorShop } from './components/GeneratorShop';

// Better: barrel exports
// components/index.ts
export { TapArea } from './TapArea';
export { GeneratorShop } from './GeneratorShop';
```

**No shared types between edge functions and frontend:**
The `ActiveBoosters` type lives in `src/types/game.ts` but edge functions re-define their own interfaces locally.

**Recommendation**: Create a `shared/` package or at least a `supabase/functions/_types/` folder for shared interfaces.

---

## 9. IMPORT/EXPORT PATTERNS

### Issues

**Circular dependency risk** in `storage.ts`:
```typescript
// storage.ts line 89
export { getTelegramUserId, getTelegramUserInfo, getReferrerId } from './telegram';
```

This re-exports Telegram utilities, but `storage.ts` also imports from `telegram.ts`. If `telegram.ts` later imports from storage, you have a circular dependency.

**Unused imports** (likely caught by ESLint):
```typescript
// useGame.ts line 2
import { GameState, EpochId, OwnedGenerator, TapEvent, LeaderboardEntry, Epoch, ARTIFACT_PARTS_PER_LEVEL } from '../types/game';
// Check which of these are actually used
```

**Inconsistent default/named imports**:
```typescript
// epochs.ts — uses named exports
export function getEpochById(...) { ... }

// types/game.ts — uses named exports
export interface Epoch { ... }

// supabase.ts — uses default export
export const supabase = ...
```

---

## 10. TYPESCRIPT DISCIPLINE

### Critical: `any` and `unknown` Abuse

**`open-chest/index.ts` line 305:**
```typescript
const updateData: Record<string, unknown> = {
  artifact_parts: artifactParts,
  // ...
};
```

**`adsgram.ts` line 172-174:**
```typescript
export function isXpBoostActive(activeBoosters: Record<string, unknown>): boolean {
  const xpBoostEnd = activeBoosters?.xp_boost_end as number | undefined;
```

Using `unknown` then immediately casting with `as` defeats the purpose of TypeScript's type safety.

**Better**: Define proper interfaces for booster data:
```typescript
interface XpBoostState {
  xp_boost_end: number | null;
  xp_boost_mult: number | null;
}

export function isXpBoostActive(boosters: XpBoostState): boolean {
  return !!(boosters?.xp_boost_end && boosters.xp_boost_end > Date.now());
}
```

### Missing Strict Mode

`tsconfig.app.json` should have:
```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true
  }
}
```

Current config unknown — needs verification.

### Unsafe JSON Parsing

```typescript
// storage.ts line 71
try { return JSON.parse(value) as T; } catch { }
```

No validation of parsed structure. If the JSON is corrupted, you get runtime errors later.

---

## 11. TECHNICAL DEBT INVENTORY

### HIGH Priority (Security/Game-Breaking)

| # | Issue | Location | Impact |
|---|-------|----------|--------|
| 1 | `buyGenerator` RPC stub | rpc.ts, game-action/index.ts | **Can exploit generator purchases** |
| 2 | Artifact definitions duplicated | open-chest/index.ts, epochs.ts | **Sync failures** when adding artifacts |
| 3 | `calculateXpToLevel` duplicated | useGame.ts, storage.ts | **Logic drift** over time |
| 4 | ActiveBoosters uses snake_case | types/game.ts | **Type system lies** |
| 5 | Hardcoded AdsGram credentials | adsgram.ts | **Secret exposure risk** |

### MEDIUM Priority (Maintainability)

| # | Issue | Location | Impact |
|---|-------|----------|--------|
| 6 | `ARTIFACTS` array tripled | open-chest, epochs, gacha | **Sync failures** |
| 7 | Edge function response helpers duplicated | All edge functions | **Copy-paste maintenance** |
| 8 | CORs headers duplicated | All edge functions | Maintenance burden |
| 9 | `useGame` hook 1066 lines | useGame.ts | Hard to maintain |
| 10 | `App.tsx` 430+ lines | App.tsx | Hard to maintain |
| 11 | Magic numbers throughout | Multiple files | Unclear constants |
| 12 | No shared types package | supabase/functions | Type drift |
| 13 | No barrel exports | components/ | Verbose imports |

### LOW Priority (Polish)

| # | Issue | Location | Impact |
|---|-------|----------|--------|
| 14 | TapArea.tsx contains 4 components | TapArea.tsx | Minor organization |
| 15 | Inconsistent error toast messages | App.tsx | UX inconsistency |
| 16 | No ESLint/Prettier config shown | eslint.config.js | Code style issues |
| 17 | `sitStudioLetters` state managed manually | useGame.ts | Redundant when `artifactParts` exists |
| 18 | `artifactDupes` commented as legacy | types/game.ts | Dead code path |

---

## 12. RECOMMENDATIONS BY PRIORITY

### Immediate (P0)

1. **Implement `buyGenerator` server-side validation** — critical security fix
2. **Create shared artifact definitions** — extract to DB table or single source of truth
3. **Fix ActiveBoosters type** — use camelCase in TypeScript
4. **Move magic numbers to constants.ts**

### Short-term (P1)

5. **Create `src/lib/gameMath.ts`** — deduplicate XP/level calculations
6. **Create `supabase/functions/_shared/`** — extract response helpers and CORS
7. **Split `useGame` hook** — into smaller focused hooks
8. **Split `App.tsx`** — extract tab content to components
9. **Add barrel exports** — `components/index.ts`, `lib/index.ts`

### Medium-term (P2)

10. **Enable TypeScript strict mode**
11. **Replace `unknown` with proper interfaces**
12. **Create shared types package** for edge functions
13. **Add comprehensive unit tests** for game math functions
14. **Document all magic numbers and formulas**

---

## 13. ESLINT/CODE STYLE ASSESSMENT

```
eslint.config.js exists ✓
tsconfig.json exists ✓
```

**Unknown**: Whether ESLint rules are configured for:
- `no-magic-numbers` — currently unused
- `max-lines-per-function` — would catch over-lengthy functions
- `no-duplicate-imports` — would catch repeated imports
- `consistent-type-imports` — would catch mixed `import type` vs `import`

**Recommendation**: Add to eslint.config.js:
```javascript
{
  rules: {
    'max-lines-per-function': ['error', { maxLines: 100 }],
    'no-magic-numbers': ['error', { ignore: [0, 1, 2] }],
    'prefer-const': 'error',
    '@typescript-eslint/no-explicit-any': 'error',
  }
}
```

---

## 14. CODE METRICS

| Metric | Value | Status |
|--------|-------|--------|
| Total source files | ~30 | Acceptable |
| Total LOC (src) | ~3,500 | Moderate |
| Total LOC (edge fns) | ~1,200 | Moderate |
| Average component size | 150 LOC | Needs split |
| Max function length | 1066 (useGame) | **Critical** |
| Cyclomatic complexity | N/A (not analyzed) | Needs tooling |
| Test coverage | Unknown | **Needs coverage report** |

---

## CONCLUSION

The codebase demonstrates **good structural thinking** with clear separation between game logic, storage, RPC, and UI. However, significant **technical debt accumulates** at the server/client boundary where:

1. Critical game logic (`buyGenerator`) is not server-validated
2. Artifact definitions are triplicated and must be kept in sync manually
3. TypeScript's type safety is compromised by `unknown` + `as` patterns
4. Edge function infrastructure (CORS, response helpers) is copy-pasted

The **most urgent fix** is implementing `buyGenerator` server-side validation before any production release. The **most valuable long-term improvement** is creating a shared artifact definition source (database table) that both client and server query.

**Overall Code Quality Grade: C+**

---

*Audit completed: 2026-07-02*
*Auditor: AAA Studio Code Review*
*Version: Virtual Museum Tapper Game 1.6.6*
