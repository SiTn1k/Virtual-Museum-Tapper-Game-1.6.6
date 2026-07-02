# Virtual Museum Tapper Game — Refactoring Audit

**Audit Date:** 2026-07-02  
**Auditor:** Refactoring Specialist  
**Project:** Virtual Museum Tapper Game v1.6.6  
**Standards Applied:** AAA Studio Quality Standards

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Codebase Overview](#codebase-overview)
3. [🚫 NEVER TOUCH — Absolute禁区](#never-touch)
4. [HIGH-RISK Modules](#high-risk-modules)
5. [SAFE Refactoring Opportunities](#safe-refactoring-opportunities)
6. [Technical Debt Hotspots](#technical-debt-hotspots)
7. [Component Extraction Candidates](#component-extraction-candidates)
8. [Hook Abstraction Opportunities](#hook-abstraction-opportunities)
9. [State Management Improvements](#state-management-improvements)
10. [API Layer Improvements](#api-layer-improvements)
11. [Database Query Optimizations](#database-query-optimizations)
12. [Priority Roadmap](#priority-roadmap)

---

## Executive Summary

| Category | Count | Risk Level |
|----------|-------|------------|
| Never Touch | 8 items | CRITICAL |
| High-Risk Modules | 5 modules | HIGH |
| Safe Opportunities | 12 items | LOW-MEDIUM |
| Technical Debt | 7 hotspots | MEDIUM |
| Component Candidates | 6 components | LOW |
| Hook Candidates | 4 hooks | LOW |

**Overall Code Quality:** B+ — Well-structured game with good separation of concerns, but suffers from code duplication between frontend and backend, monolithic hooks, and missing abstraction layers.

---

## Codebase Overview

### File Structure

```
src/
├── App.tsx                    # 457 lines — Monolithic main component
├── main.tsx                  # Entry point
├── hooks/
│   └── useGame.ts            # 482 lines — God hook (primary state container)
├── components/
│   ├── TapArea.tsx           # 363 lines — UI heavy (particles, combos)
│   ├── GeneratorShop.tsx     # 75 lines — Clean, focused
│   ├── GachaModal.tsx        # 405 lines — Complex modal with animation
│   ├── AdSystem.tsx          # 476 lines — Multiple modals + hooks
│   ├── PrestigeSystem.tsx    # 315 lines — Prestige UI + Laboratory
│   ├── StatsPanel.tsx        # 64 lines — Simple, clean
│   ├── DailyTasksPanel.tsx   # 170 lines — Task display
│   ├── DailyStreakModal.tsx  # 133 lines — Streak celebration
│   ├── DailyRewards.tsx      # Small modal
│   ├── TutorialModal.tsx     # Tutorial flow
│   ├── OfflineRewardModal.tsx
│   ├── AdsGramButton.tsx
│   ├── ReferralsTab.tsx
│   ├── RebirthSystem.tsx
│   └── SitStudio/
│       └── index.tsx         # Easter egg feature
├── lib/
│   ├── storage.ts            # 455 lines — DB sync + localStorage
│   ├── telegram.ts           # 156 lines — Telegram SDK wrapper
│   ├── supabase.ts           # 13 lines — Client initialization
│   ├── rpc.ts                # 140 lines — Server action helpers
│   └── utils.ts              # 8 lines — formatNumber only
├── services/
│   └── adsgram.ts            # 211 lines — Ad SDK integration
├── types/
│   └── game.ts               # 299 lines — All type definitions
└── data/
    ├── epochs.ts              # 183 lines — Epoch/generator definitions
    └── tasks.ts              # 92 lines — Task pool + helpers

supabase/functions/           # 10 Edge Functions
├── open-chest/               # Server-authoritative chest RNG
├── perform-prestige/          # Server-authoritative rebirth
├── game-action/              # HMAC-verified actions
├── telegram-payments/         # Stars integration
├── claim-ad-reward/          # Ad reward processing
├── adsgram-reward/            # AdsGram callback
├── claim-offline-income/     # Offline progress
├── track-session/             # Analytics
├── push-notification/         # FCM integration
└── validate-init-data/        # initData verification

supabase/migrations/          # Database schema
```

---

## 🚫 NEVER TOUCH — Absolute 禁区

These areas contain **critical business logic, anti-cheat mechanisms, or economic balance formulas** that could break game economy or enable exploits if modified incorrectly.

### 1. XP Curve Calculation (`useGame.ts` + `storage.ts`)

**Files:** `src/hooks/useGame.ts:45-86`, `src/lib/storage.ts:28-56`

```typescript
// THIS EXACT FORMULA MUST MATCH IN BOTH FILES
function calculateXpToLevel(level: number): number {
  // Epoch-based progression timing
  // Epoch 1: 60s → 300s (5 min)
  // Epoch 2: 60s → 480s (8 min)
  // Epoch 3+: 120s → 900s (15 min)
}
```

**Why:** Any drift between frontend and backend XP calculations causes desync and potential exploit vectors.

### 2. Gacha Probability Tables (`open-chest/index.ts`)

**File:** `supabase/functions/open-chest/index.ts:1-163`

```typescript
// Rarity chances — DO NOT MODIFY
// Common: 60%, Rare: 25%, Epic: 10%, Legendary: 4%, Secret: 1%
const RARITY_WEIGHTS = { common: 0.60, rare: 0.25, epic: 0.10, legendary: 0.04, secret: 0.01 };
```

**Why:** Server-authoritative RNG prevents client manipulation. Changing probabilities affects real-money purchases.

### 3. Tap Cost Formula (`useGame.ts:432`)

```typescript
const rawTapCost = 25 * Math.pow(1.8, state.tapPower - 1);
```

**Why:** Economic balance critical. Any change cascades through entire economy.

### 4. Generator Cost Formula (`epochs.ts:143-144`)

```typescript
export function getGeneratorCost(generator: Generator, currentLevel: number): number {
  return Math.floor(generator.baseCost * Math.pow(generator.costMultiplier, currentLevel));
}
```

**Why:** Core progression pacing. `costMultiplier: 1.15` across all generators is intentional.

### 5. Prestige Point Calculation (`perform-prestige/index.ts`)

**File:** `supabase/functions/perform-prestige/index.ts:49-56`

```typescript
function calculatePrestigePoints(totalXp: number, level: number): number {
  const xpPoints = Math.floor(totalXp / 100000);
  const levelBonus = Math.floor((level - 950) / 50);
  return Math.max(1, xpPoints + levelBonus);
}
```

**Why:** Server-authoritative prestige calculation. Changing affects currency economy permanently.

### 6. HMAC-SHA256 Validation (`game-action/index.ts`, `validate-init-data/index.ts`)

**Files:** All functions using `initData` validation

```typescript
// HMAC validation MUST remain identical across all edge functions
function validateInitData(initData: string): { valid: boolean; userId: number | null }
```

**Why:** Security critical — prevents user identity spoofing and action forgery.

### 7. Artifact Data Duplication (`epochs.ts` ↔ `open-chest/index.ts`)

**Files:** `src/data/epochs.ts`, `supabase/functions/open-chest/index.ts`

```typescript
// ARTIFACTS array is DUPLICATED between frontend and backend
// Any change MUST be applied to BOTH files
const ARTIFACTS = [
  // Ukrainian artifacts
  { id: "trypillia_vase", epoch: "trypillia", rarity: "common", ... },
  // ... ALL artifacts must match exactly
];
```

**Why:** Critical data consistency. Mismatches cause frontend/backend desync.

### 8. Energy System Formulas (`useGame.ts:391-418`)

```typescript
const REGEN_INTERVAL_MS = 2 * 60 * 1000; // 2 minutes
const REGEN_AMOUNT = 2;
const MAX_ENERGY = 1000;
```

**Why:** Prestige economy balance. Changes affect end-game progression.

---

## HIGH-RISK Modules

These modules have **tight coupling, critical business logic, or complex state dependencies** that make refactoring risky without extensive testing.

### 1. `useGame.ts` — The God Hook (482 lines)

**Risk Level:** 🔴 CRITICAL

**Problems:**
- Contains ALL game state (50+ properties)
- Duplicates XP calculation logic from `storage.ts`
- Mixes UI state (modals, tabs) with game state
- Multiple intervals (`tickRef`, `localSaveRef`, `remoteSaveRef`)
- Energy regeneration side effects

**Refactoring Risk:** Any change could break save/load, prestige, or energy systems.

**Recommendation:** 
- Extract energy logic → `useEnergy.ts`
- Extract offline gains → `useOfflineGains.ts`
- Extract save/load → `usePersistence.ts`
- Keep `useGame.ts` as thin orchestration layer

**Time Estimate:** 3-4 days

### 2. `storage.ts` — State Persistence Layer (455 lines)

**Risk Level:** 🔴 CRITICAL

**Problems:**
- Duplicate `calculateXpToLevel` from `useGame.ts`
- Complex state hydration/dehydration logic
- Device ID ↔ Telegram ID merge logic
- Dual localStorage + Supabase sync

**Refactoring Risk:** Breaking this causes permanent player progress loss.

**Recommendation:**
- Create shared `gameCalculations.ts` module
- Add comprehensive migration path for state schema changes
- Add state version tracking

**Time Estimate:** 2-3 days

### 3. `open-chest/index.ts` — Server Chest RNG (300+ lines)

**Risk Level:** 🔴 CRITICAL

**Problems:**
- Duplicates full `ARTIFACTS` array from frontend
- Complex probability-weighted random selection
- Database write for artifact state
- Comment shows TODOs for future chest types

**Refactoring Risk:** Any change affects real-money gacha purchases.

**Recommendation:**
- Create shared `artifactDefinitions.ts` package
- Strict type validation between frontend/backend
- Add comprehensive integration tests

**Time Estimate:** 4-5 days (requires schema migration testing)

### 4. `App.tsx` — Monolithic Root Component (457 lines)

**Risk Level:** 🟠 HIGH

**Problems:**
- 70+ useGame destructured properties
- Complex tab/modal state management
- Direct API calls mixed with UI logic
- Inline helper components (`TabButton`, `StatCard`, `BoosterCard`, `ActiveBoosterBadge`)

**Refactoring Risk:** UI regression likely without full testing suite.

**Recommendation:**
- Extract inline components → individual files
- Create `useAppState.ts` for UI-only state
- Consider React Context for related state groups

**Time Estimate:** 2-3 days

### 5. `AdSystem.tsx` — Ad Integration (476 lines)

**Risk Level:** 🟠 HIGH

**Problems:**
- Three ad modal variants (`SessionAdModal`, `ChestAdModal`, `EnergyRestoreAdButton`)
- Two custom hooks (`useSessionAdTrigger`, `useChestAdTrigger`)
- Hardcoded ad intervals (20 min session, 10 chest interval)
- Server reward claiming mixed with UI

**Refactoring Risk:** Affects revenue — ads are monetization critical.

**Recommendation:**
- Extract hooks to `hooks/useAdTriggers.ts`
- Create `AdRewardService` for server communication
- Add ad state machine type definitions

**Time Estimate:** 2 days

---

## SAFE Refactoring Opportunities

These items have **high benefit, low risk** — clear wins with minimal chance of regression.

### Priority 1: Quick Wins (1-2 hours each)

#### 1. Extract Inline Components from `App.tsx`

**Files:** `src/App.tsx:359-455`

```typescript
// Extract these from App.tsx:
function TabButton({ active, onClick, icon, label, badge }) { ... }
function StatCard({ label, value }) { ... }
function BoosterCard({ icon, name, description, price, loading, onBuy }) { ... }
function ActiveBoosterBadge({ label, endTime, color }) { ... }
```

**To:**
```
src/components/
├── TabButton.tsx
├── StatCard.tsx
├── BoosterCard.tsx
└── ActiveBoosterBadge.tsx
```

**Benefit:** Cleaner code, better testability, IDE support  
**Risk:** LOW — Pure presentational components

#### 2. Move `formatNumber` to Own Module with Tests

**File:** `src/lib/utils.ts`

```typescript
// Current: 8 lines
// Add: formatNumber tests, edge case handling, locale support
```

**Benefit:** Better testability, potential locale formatting  
**Risk:** LOW — Pure utility function

#### 3. Add Constants File for Magic Numbers

**Files:** Multiple files have hardcoded numbers

```typescript
// src/constants/game.ts
export const TAP_POWER_BASE_COST = 25;
export const TAP_POWER_COST_MULTIPLIER = 1.8;
export const GENERATOR_COST_MULTIPLIER = 1.15;
export const MAX_LEVEL = 999;
export const PRESTIGE_REQUIRED_LEVEL = 950;
export const PRESTIGE_POINTS_PER_LEVEL = 50;
```

**Benefit:** Single source of truth, easier tuning  
**Risk:** LOW — Numbers only, no logic changes

### Priority 2: Medium Effort (1-2 days)

#### 4. Extract Custom Hooks from `AdSystem.tsx`

**File:** `src/components/AdSystem.tsx:399-475`

```typescript
// Extract to:
src/hooks/
├── useSessionAdTrigger.ts
└── useChestAdTrigger.ts
```

**Benefit:** Reusable, testable hooks  
**Risk:** LOW — Pure logic extraction

#### 5. Create Shared Game Calculations Module

**Files:** `src/hooks/useGame.ts`, `src/lib/storage.ts`

```typescript
// src/calculations/gameMath.ts
export function calculateXpToLevel(level: number): number { ... }
export function estimatePassiveForEpoch(epoch: Epoch, levelInEpoch: number): number { ... }
export function getGeneratorCost(generator: Generator, level: number): number { ... }
export function getGeneratorProduction(generator: Generator, level: number): number { ... }
```

**Then:**
- Update `useGame.ts` to import from `gameMath.ts`
- Update `storage.ts` to import from `gameMath.ts`
- Delete duplicates

**Benefit:** Single source of truth, easier testing  
**Risk:** MEDIUM — Must verify all calculations match exactly

#### 6. Extract Particle/Effect Components from `TapArea.tsx`

**File:** `src/components/TapArea.tsx`

```typescript
// Extract:
src/components/
├── TapParticle.tsx      // Lines 22-66
├── TapRipple.tsx        // Lines 69-102
└── ComboIndicator.tsx  // Lines 105-132
```

**Benefit:** Cleaner TapArea, reusable effects  
**Risk:** LOW — Presentational components only

### Priority 3: Architectural (1 week)

#### 7. Create API Service Layer

**Current:** Direct `fetch` calls scattered in components

```typescript
// src/services/api.ts
export class GameApiService {
  constructor(private supabase: SupabaseClient) {}
  
  async claimAdReward(telegramId: number, rewardType: string): Promise<AdRewardResponse> { ... }
  async performPrestige(telegramId: number): Promise<PrestigeResponse> { ... }
  async openChest(telegramId: number, epochId: string): Promise<ChestResponse> { ... }
  async upgradeTap(initData: string): Promise<TapUpgradeResponse> { ... }
}
```

**Benefit:** Centralized API, easier error handling, retry logic  
**Risk:** MEDIUM — Requires updating all call sites

#### 8. Create Game State Context

**Current:** `useGame.ts` returns 40+ properties

```typescript
// src/contexts/GameContext.tsx
interface GameContextValue {
  state: GameState;
  actions: {
    tap: (x: number, y: number) => void;
    buyGenerator: (id: string) => boolean;
    upgradeTap: () => boolean;
    // ... all actions
  };
  computed: {
    epoch: Epoch;
    artifactMultipliers: ArtifactMultipliers;
    boosterMultipliers: BoosterMultipliers;
    // ...
  };
}
```

**Benefit:** Better typing, easier component access, cleaner API  
**Risk:** MEDIUM — Large refactor, significant testing needed

---

## Technical Debt Hotspots

### 1. **Artifact Data Duplication** 🔴 CRITICAL

**Location:** `src/data/epochs.ts` ↔ `supabase/functions/open-chest/index.ts`

**Problem:** The full `ARTIFACTS` array is duplicated between frontend and backend. Any change requires manual sync.

**Debt Impact:** 
- High: Feature freeze on adding artifacts (too risky to maintain)
- Bugs: Subtle mismatches cause player confusion

**Solution:**
```bash
# Create shared package
packages/
└── game-data/
    ├── package.json
    ├── src/
    │   ├── artifacts.ts    # ARTIFACTS array
    │   ├── epochs.ts       # EPOCHS array
    │   ├── generators.ts   # Generator configs
    │   └── index.ts
    └── dist/              # Built JS for edge functions
```

**Effort:** 1 week

### 2. **Duplicate XP Calculation** 🟠 HIGH

**Location:** `src/hooks/useGame.ts:45-86` = `src/lib/storage.ts:28-56`

**Problem:** Identical `calculateXpToLevel` function in two files. Drift could cause save/load desync.

**Solution:** Extract to `src/calculations/xp.ts`, import in both.

**Effort:** 2 hours

### 3. **No State Schema Versioning** 🟠 HIGH

**Location:** `src/lib/storage.ts`

**Problem:** If game state schema changes (adding new fields), old saves won't migrate properly.

**Solution:**
```typescript
const CURRENT_STATE_VERSION = 2;

interface SavedGameState {
  version: number;
  state: GameState;
}

function migrateState(saved: any): GameState {
  if (saved.version === CURRENT_STATE_VERSION) return saved.state;
  
  // Migration paths
  if (saved.version < 2) {
    // Add new fields for v2
  }
  // ...
}
```

**Effort:** 4 hours

### 4. **No Unit Tests on Core Logic** 🟡 MEDIUM

**Location:** All calculation functions

**Problem:** `calculateXpToLevel`, `getGeneratorCost`, etc. have no test coverage.

**Solution:** Add Vitest/Jest tests

```typescript
// src/calculations/__tests__/xp.test.ts
describe('calculateXpToLevel', () => {
  it('should return at least 50 for level 1', () => { ... });
  it('should scale with epoch progression', () => { ... });
});
```

**Effort:** 1 day to set up, ongoing

### 5. **Large Bundle Size** 🟡 MEDIUM

**Location:** All source files

**Problem:** No lazy loading, entire app loads upfront.

**Solution:**
```typescript
// App.tsx
const GachaModal = lazy(() => import('./components/GachaModal'));
const PrestigeSystem = lazy(() => import('./components/PrestigeSystem'));
```

**Effort:** 2 hours

### 6. **Hardcoded Magic Numbers** 🟡 MEDIUM

**Locations:**
- `SESSION_AD_INTERVAL_MS = 20 * 60 * 1000` (AdSystem.tsx)
- `ROLL_STEPS = 18`, `ROLL_INTERVAL_MS = 60` (GachaModal.tsx)
- `NEW_PLAYER_LEVEL_THRESHOLD = 10` (AdSystem.tsx)

**Solution:** Extract to `src/constants/game.ts`

**Effort:** 2 hours

### 7. **No Error Boundary** 🟡 MEDIUM

**Location:** App.tsx

**Problem:** Any component crash kills entire app.

**Solution:**
```typescript
// src/components/ErrorBoundary.tsx
class ErrorBoundary extends React.Component {
  componentDidCatch(error, errorInfo) {
    // Report to analytics, show fallback UI
  }
}
```

**Effort:** 1 hour

---

## Component Extraction Candidates

| Component | Current Location | Lines | Complexity | Extract Priority |
|-----------|-----------------|-------|------------|------------------|
| `TabButton` | App.tsx | 26 | LOW | P1 |
| `StatCard` | App.tsx | 7 | LOW | P1 |
| `BoosterCard` | App.tsx | 29 | LOW | P1 |
| `ActiveBoosterBadge` | App.tsx | 28 | LOW | P1 |
| `TapParticle` | TapArea.tsx | 45 | LOW | P2 |
| `TapRipple` | TapArea.tsx | 34 | LOW | P2 |
| `ComboIndicator` | TapArea.tsx | 28 | LOW | P2 |
| `RarityBadge` | GachaModal.tsx | N/A | MEDIUM | P3 |
| `SessionAdModal` | AdSystem.tsx | 120 | MEDIUM | P3 |
| `ChestAdModal` | AdSystem.tsx | 80 | MEDIUM | P3 |
| `EnergyRestoreAdButton` | AdSystem.tsx | 160 | MEDIUM | P3 |

---

## Hook Abstraction Opportunities

### 1. `useAdTriggers.ts` — Extract from AdSystem.tsx

**Current:** Two hooks (`useSessionAdTrigger`, `useChestAdTrigger`) in component file

```typescript
// src/hooks/useAdTriggers.ts
export function useSessionAdTrigger(level, sessionStartAt, lastSessionAdAt) { ... }
export function useChestAdTrigger() { ... }
```

**Benefits:**
- Reusable if other games need similar triggers
- Easier to test in isolation
- Cleaner component files

### 2. `useTimer.ts` — Extract Timer Logic

**Current:** Timer logic repeated in `ActiveBoosterBadge` and energy display

```typescript
// src/hooks/useTimer.ts
export function useTimer(endTime: number | null) {
  const [remaining, setRemaining] = useState('');
  // ... countdown logic
  return { formatted: remaining, isExpired: remaining === '0:00' };
}
```

### 3. `useLocalStorage.ts` — Generic Persistence Hook

**Current:** Storage logic embedded in useGame.ts

```typescript
// src/hooks/useLocalStorage.ts
export function useLocalStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() => {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : initialValue;
  });
  // ...
}
```

### 4. `useOnlineStatus.ts` — Network Detection

**Current:** Online/offline detection in useGame.ts:214-232

```typescript
// src/hooks/useOnlineStatus.ts
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  // ... event listeners
  return { isOnline, status: isOnline ? 'synced' : 'offline' };
}
```

---

## State Management Improvements

### Current Architecture

```
useGame.ts (482 lines)
├── useState for all game state (30+ states)
├── useEffect for persistence (local + remote)
├── useEffect for energy regeneration
├── useEffect for tick/game loop
├── useEffect for visibility changes
└── useCallback for all actions (20+)
```

### Problems

1. **Monolithic hook** — 482 lines is too large
2. **Mixed concerns** — UI state (modals) with game state
3. **No computed memoization** — `artifactMultipliers`, `boosterMultipliers` recalculated on every render
4. **No state history** — Can't implement undo/replay

### Proposed Architecture

```typescript
// Context Providers
<GameProvider>
  <StateProvider>
    {/* Pure game state */}
  </StateProvider>
  <PersistenceProvider>
    {/* Save/load logic */}
  </PersistenceProvider>
  <UIProvider>
    {/* Modals, tabs, UI state */}
  </UIProvider>
</GameProvider>
```

### Step-by-Step Migration

**Phase 1:** Create context skeleton (no logic changes)
- Extract interfaces to types
- Create Context with same API as useGame returns
- Wrap in Provider, verify no breaking changes

**Phase 2:** Extract persistence (2-3 hours)
- Move save/load logic to `usePersistence.ts`
- Add `usePersistence` hook
- Keep in same file, verify works

**Phase 3:** Extract energy system (2 hours)
- Move to `useEnergy.ts`
- Add hook
- Keep in same file, verify works

**Phase 4:** Extract offline gains (1 hour)
- Move to `useOfflineGains.ts`
- Add hook

**Phase 5:** Extract UI state (2 hours)
- Create `useAppState.ts`
- Move modal states, tab states

---

## API Layer Improvements

### Current State

```typescript
// Scattered across components
// App.tsx:303-319 — Session ad reward
// App.tsx:331-350 — Chest ad reward
// AdSystem.tsx:308-316 — Energy ad reward
// useGame.ts:274-338 — Prestige
```

### Problems

1. No centralized error handling
2. No retry logic
3. No loading state management
4. Different patterns per call

### Proposed: GameApiService

```typescript
// src/services/api/GameApiService.ts
export class GameApiService {
  constructor(private supabase: SupabaseClient) {}
  
  // ─── Ad Rewards ───────────────────────────────
  async claimAdReward(
    telegramId: number, 
    rewardType: 'energy_restore' | 'session_ad' | 'chest_bonus'
  ): Promise<ApiResult<{ success: boolean; new_value?: number }>>
  
  // ─── Prestige ─────────────────────────────────
  async performPrestige(telegramId: number): Promise<ApiResult<PrestigeResponse>>
  
  // ─── Chest ─────────────────────────────────────
  async openChest(
    telegramId: number, 
    epochId: string, 
    type: 'daily' | 'skychest'
  ): Promise<ApiResult<ChestRewards>>
  
  // ─── Game Actions ──────────────────────────────
  async upgradeTap(initData: string): Promise<ApiResult<TapUpgradeResponse>>
  async buyGenerator(initData: string, generatorId: string): Promise<ApiResult>
  async switchEpoch(initData: string, epochId: string): Promise<ApiResult>
  
  // ─── Session Tracking ──────────────────────────
  async trackSession(telegramId: number, event: 'start' | 'end' | 'activity'): Promise<void>
}
```

### Error Handling Pattern

```typescript
async claimAdReward(...) {
  try {
    const response = await fetch(...);
    const data = await response.json();
    
    if (!response.ok) {
      throw new GameApiError('AD_REWARD_FAILED', data.error);
    }
    
    return { success: true, data };
  } catch (e) {
    if (e instanceof GameApiError) throw e;
    throw new GameApiError('NETWORK_ERROR', String(e));
  }
}
```

---

## Database Query Optimizations

### Current Issues

#### 1. Leaderboard Fetch — Full Table Scan

**File:** `src/lib/storage.ts:413-432`

```typescript
// Current: Fetches ALL players, sorts in memory
const { data } = await supabase
  .from('game_progress')
  .select(...)
  .order(...)
  .order(...)
  .limit(1000);
```

**Problem:** Fetches up to 1000 rows for simple rank lookup.

**Solution:** Use PostgreSQL window function

```typescript
// Server-side function: get-user-rank
const { data } = await supabase.rpc('get_user_rank', { 
  p_telegram_id: telegramId 
});
```

**Or:** Add `rank` column, update on save (eventual consistency)

#### 2. Redundant State Reads

**File:** `useGame.ts`

```typescript
// On prestige: Fetch fresh boosters
const fresh = await fetchActiveBoosters(telegramIdLocal);

// Then: Save entire state (includes boosters)
await saveRemoteState(state);
```

**Problem:** Multiple DB round trips per action.

**Solution:** Batch operations, use transactions.

#### 3. No Indexed Queries

**Hypothesized:** Without `EXPLAIN ANALYZE`, query efficiency unknown.

**Recommendation:** Add `supabase/migrations/` for index creation

```sql
-- Migration: add_leaderboard_indexes
CREATE INDEX CONCURRENTLY idx_game_progress_prestige_level 
  ON game_progress(prestige_level DESC, level DESC, total_xp DESC);

CREATE INDEX CONCURRENTLY idx_game_progress_telegram_id 
  ON game_progress(telegram_id) UNIQUE;
```

---

## Priority Roadmap

### Phase 1: Quick Wins (Week 1)

| # | Task | Effort | Risk | Benefit |
|---|------|--------|------|---------|
| 1 | Extract inline components from App.tsx | 2h | LOW | High readability |
| 2 | Move formatNumber to utils | 1h | LOW | Testability |
| 3 | Create constants file | 2h | LOW | Maintainability |
| 4 | Add ErrorBoundary | 1h | LOW | Reliability |
| 5 | Lazy load modals | 2h | LOW | Performance |

### Phase 2: Medium Refactoring (Weeks 2-3)

| # | Task | Effort | Risk | Benefit |
|---|------|--------|------|---------|
| 6 | Extract Ad hooks | 3h | LOW | Testability |
| 7 | Extract TapArea effects | 2h | LOW | Clean code |
| 8 | Create shared calculations module | 4h | MEDIUM | Consistency |
| 9 | Add state versioning | 4h | MEDIUM | Migration safety |
| 10 | Extract energy logic | 4h | MEDIUM | Modular |

### Phase 3: Architectural (Weeks 4-6)

| # | Task | Effort | Risk | Benefit |
|---|------|--------|------|---------|
| 11 | Create shared game-data package | 1 week | HIGH | Eliminating duplication |
| 12 | Create API service layer | 3 days | MEDIUM | Centralization |
| 13 | Create Game Context | 3 days | MEDIUM | Cleaner architecture |
| 14 | Add unit tests | Ongoing | LOW | Quality |
| 15 | Optimize DB queries | 2 days | MEDIUM | Performance |

---

## Summary

This codebase is **well-structured for a game of its complexity**. Key strengths:

✅ Good separation of game logic from UI  
✅ Server-authoritative for critical operations  
✅ TypeScript throughout  
✅ React hooks architecture

Key areas needing attention:

⚠️ Code duplication (artifacts, XP calc)  
⚠️ Monolithic `useGame.ts` hook  
⚠️ No test coverage on core logic  
⚠️ No lazy loading  
⚠️ Scattered API calls

**Recommended approach:** Start with Phase 1 (quick wins), then tackle Phase 2 while features are being developed. Phase 3 should be planned as dedicated sprint work with full regression testing.

---

*Document Version: 1.0*  
*Last Updated: 2026-07-02*
