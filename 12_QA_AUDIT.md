# Virtual Museum Tapper Game — QA Audit Report

**Project:** Virtual Museum Tapper Game (Ukraine Kriz Chas)
**Version:** 1.6.6
**Auditor:** QA Lead
**Date:** 2026-07-02
**Standard:** AAA Studio Standards

---

## Executive Summary

This is a React-based Telegram Mini App idle/incremental game. The codebase shows good architectural patterns (server-authoritative actions, offline-first localStorage with remote sync) but lacks systematic testing infrastructure. Multiple potential bugs, edge cases, and compatibility gaps were identified.

**Overall Health Score:** 5.5/10

---

## 1. Testing Infrastructure Assessment

### 1.1 Missing Test Files

| Test Type | Status | Files Expected |
|-----------|--------|----------------|
| Unit Tests | ❌ NONE | 0 of ~20 required |
| Integration Tests | ❌ NONE | 0 of ~8 required |
| E2E Tests | ❌ NONE | 0 of ~5 required |

**Findings:**
- `package.json` has no test dependencies (`vitest`, `@testing-library/react`, `playwright` are absent)
- No `__tests__` or `.test.ts` files exist anywhere in the codebase
- No `tests/` directory exists
- ESLint is configured but no pre-commit hooks exist

### 1.2 Test Coverage Recommendations

**Unit Tests Needed For:**
```
src/hooks/useGame.ts           - Core game state logic (tap, buyGenerator, level-up, prestige)
src/lib/utils.ts               - formatNumber(), edge cases (NaN, Infinity)
src/lib/storage.ts             - State save/load, sanitize functions
src/data/epochs.ts             - XP calculation, generator cost formulas
src/data/tasks.ts              - Task completion logic, streak calculations
src/lib/rpc.ts                 - API response handling
src/components/GachaModal.tsx - Rarity rolls, animation state machine
```

**Integration Tests Needed For:**
```
- Full game initialization flow (load → render → interact)
- Server sync scenarios (offline → online, conflict resolution)
- Prestige flow (requirements → server call → state reset → UI update)
- Ad reward flow (watch → server claim → local state update)
```

**E2E Tests Needed For:**
```
- New user onboarding (tutorial → first tap → first purchase)
- Full gameplay loop (tapping → level up → epoch switch)
- Gacha flow (buy → roll → reward claim)
- Offline return (close → reopen → claim offline gains)
```

---

## 2. Potential Bugs & Edge Cases

### 2.1 Critical Bugs

#### BUG-001: Race Condition in Multi-Tab/Parallel Saves
**Severity:** HIGH
**File:** `src/hooks/useGame.ts` (lines 2000ms local, 15000ms remote intervals)

**Issue:** Two separate save intervals run independently:
- `localSaveRef` fires every 2 seconds
- `remoteSaveRef` fires every 15 seconds

If a prestige or purchase action modifies state and a save fires immediately after, the save may capture intermediate state. No mutex or queue mechanism exists.

**Impact:** Currency loss, duplicate purchases, lost progress
**Recommendation:** Add dirty flag check before saves; queue save operations

#### BUG-002: Optimistic UI in GachaModal Without Rollback
**Severity:** HIGH  
**File:** `src/components/GachaModal.tsx` (lines 75-96)

```typescript
// Deduct currency optimistically
if (!onRoll(gachaCost)) return;
```

The `onRoll` callback deducts currency locally, but if the server call fails (`result.ok === false`), there's NO ROLLBACK mechanism. The currency is lost. The error message shows but the user has less currency.

**Impact:** Player can lose currency on network failure
**Recommendation:** Store previous currency, revert on server error

#### BUG-003: Tap Events Memory Leak
**Severity:** MEDIUM
**File:** `src/hooks/useGame.ts`

```typescript
const [tapEvents, setTapEvents] = useState<TapEvent[]>([]);
// tapEvents grows unbounded — never trimmed
```

Every tap creates a `TapEvent` object that's appended to state. After thousands of taps, this array consumes significant memory and causes React re-render slowdown. The array is passed to TapArea for particle rendering but the array itself is never pruned.

**Impact:** Memory bloat, potential crash on long sessions
**Recommendation:** Limit tapEvents to last 50 entries

#### BUG-004: Invalid Telegram User ID Handling
**Severity:** HIGH
**Files:** `src/lib/telegram.ts`, `src/lib/storage.ts`

```typescript
// telegram.ts line 107
export function getTelegramUserId(): number | null {
  return getParsedInitData().user?.id ?? null;
}

// No validation that this is a positive finite integer
```

Multiple components assume `telegramId` is valid:
- `ReferralsTab.tsx` line 32: `Number.isFinite(telegramId)` guard exists (GOOD)
- `storage.ts`: Uses unsanitized ID in database queries
- `useGame.ts`: Passes ID directly to server functions without validation

**Impact:** Server-side queries may fail or return wrong data
**Recommendation:** Add `sanitizeTelegramId()` helper and use everywhere

### 2.2 Medium Severity Bugs

#### BUG-005: XP Overflow at High Levels
**Severity:** MEDIUM
**File:** `src/lib/utils.ts` (formatNumber)

```typescript
export function formatNumber(n: number): string {
  if (!Number.isFinite(n) || isNaN(n)) return '0';  // GOOD
  if (n >= 1e12) return (n / 1e12).toFixed(1) + 'T';
  // ...
}
```

However, `calculateXpToLevel()` uses `Math.pow()` and `Math.floor()` which can produce Infinity for extremely large levels. Level 999+ with multipliers could overflow. The game has `MAX_LEVEL = 999` but `xpToNextLevel` is calculated based on exponential formulas.

**Recommendation:** Add overflow guards in XP calculations

#### BUG-006: Energy System Inconsistency
**Severity:** MEDIUM
**File:** `src/hooks/useGame.ts` (lines 371-418)

The energy regeneration uses `state.lastOnlineAt` timestamp but:
1. `lastOnlineAt` is updated on EVERY state save (every 2 seconds)
2. When user returns from offline, energy is calculated from last save, not actual close time
3. If app crashes or is force-closed, `beforeunload` may not fire

**Impact:** Users may get less energy than expected on return
**Recommendation:** Use separate `lastClosedAt` timestamp that's only set on actual close

#### BUG-007: Duplicate Tab Detection Uses Tab ID
**Severity:** MEDIUM
**File:** `src/hooks/useGame.ts` (line 33)

```typescript
const TAB_ID = `tab_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
```

Each browser tab generates a unique TAB_ID on initialization. The duplicate tab detection logic is present but checks for existing `localStorage` keys. However:
1. TAB_ID is created fresh on every mount
2. The duplicate check runs after initialization
3. Race condition exists if both tabs initialize simultaneously

**Impact:** Duplicate tab warning may not trigger reliably
**Recommendation:** Use `BroadcastChannel` API or `navigator.storage.estimate()` for reliable detection

#### BUG-008: Date/Timezone Edge Cases
**Severity:** MEDIUM
**Files:** `src/data/tasks.ts`, `src/lib/storage.ts`

```typescript
// tasks.ts line 35
export function getTodayDateStr(): string {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
}
```

Uses UTC consistently (GOOD), but the `lastCheckIn` comparison in `DailyRewards.tsx` could have issues around midnight UTC:
- Player checks in at 23:59 UTC
- Server saves `lastCheckIn` as current date
- Player opens app at 00:01 UTC (new day)
- Logic must handle this correctly

**Verified:** `shouldShowCheckIn()` function has correct UTC handling. This is OK.

### 2.3 Minor Bugs

#### BUG-009: Particle Animation Cleanup on Rapid Taps
**Severity:** LOW
**File:** `src/components/TapArea.tsx`

```typescript
// line 175-180
setParticles(prev => [...prev, { id: particleId, x, y, value: tapPower }]);
setRipples(prev => [...prev, { id: rippleId, x, y }]);
```

On rapid tapping, multiple particles accumulate before animation completes. If user rapidly taps 100 times, 100 particles are queued. Each animation runs for 40 frames via `requestAnimationFrame`. This could cause:
- Memory bloat from orphaned particles
- Performance degradation on low-end devices

**Recommendation:** Cap particles at 20, skip oldest if exceeded

#### BUG-010: Combo System Reset Logic
**Severity:** LOW
**File:** `src/components/TapArea.tsx` (lines 182-196)

```typescript
if (now - lastTapTime.current < 500) {
  setCombo(prev => prev + 1);
} else {
  setCombo(1);  // Reset to 1, not 0
}
```

Combo resets to 1 instead of 0. So user sees "COMBO x1" briefly even when starting fresh. Minor visual issue.

**Recommendation:** Reset to 0, show combo only when > 2

#### BUG-011: Supabase Client May Be Null
**Severity:** LOW
**File:** `src/lib/supabase.ts`

```typescript
export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;
```

Every file that uses `supabase` must check `if (!supabase) return`. This is handled in most places but a comprehensive audit of all RPC calls is needed. Found in:
- `rpc.ts`: ✅ Checks `if (!supabase)`
- `storage.ts`: ✅ Checks at function level
- `AdSystem.tsx`: ✅ Checks exist before calling

---

## 3. Error Boundary & Loading States

### 3.1 Error Boundary Coverage

**Status:** ❌ NO ERROR BOUNDARIES

**Finding:** No `ErrorBoundary` component wraps the application. Any unhandled exception will:
1. Show React's opaque error overlay
2. Leave the user with a broken UI
3. Provide no recovery mechanism

**Recommendation:** Add hierarchical error boundaries:
```
<App>
  <ErrorBoundary name="App">
    <GameErrorBoundary name="Game">
      <TapArea />
      <Shop />
    </GameErrorBoundary>
    <ModalErrorBoundary name="Modals">
      <GachaModal />
      <TutorialModal />
    </ModalErrorBoundary>
  </ErrorBoundary>
</App>
```

### 3.2 Loading State Coverage

| Component | Loading State | Empty State | Error State |
|-----------|--------------|-------------|-------------|
| App (initial) | ✅ Shows loading | N/A | ⚠️ Minimal |
| TapArea | ✅ Passes props | N/A | N/A |
| GeneratorShop | ⚠️ Just opacity | N/A | N/A |
| Leaderboard | ✅ Full spinner | ✅ "No players" | ⚠️ Toast only |
| DailyTasksPanel | ⚠️ "Loading..." text | N/A | N/A |
| ReferralsTab | ✅ Full spinner | ✅ "No players" | ⚠️ Toast only |

**Issues:**
1. `GeneratorShop` shows `opacity-60` when can't afford, but no visual loading indicator
2. Leaderboard/Referrals error states use `setConnectionError` which shows a toast, but if loading fails silently, user sees empty list with no explanation

---

## 4. Offline Handling

### 4.1 Current Offline Implementation

| Feature | Local Storage | Server Sync | Recovery |
|---------|--------------|-------------|----------|
| Game State | ✅ Yes | ✅ Every 15s | ✅ Load from local |
| Currency | ✅ Yes | ✅ With state | ✅ Correct |
| XP/Level | ✅ Yes | ✅ With state | ✅ Correct |
| Generators | ✅ Yes | ✅ With state | ✅ Correct |
| Ad Limits | ⚠️ Partial | ❌ No sync | ⚠️ May reset |
| Energy | ⚠️ Timestamp | ❌ Not synced | ⚠️ Drift |
| Daily Tasks | ⚠️ Local only | ❌ Not synced | ⚠️ May conflict |

### 4.2 Offline Issues

#### OFFLINE-001: Daily Task Counters Not Synced
**Severity:** MEDIUM
**File:** `src/hooks/useGame.ts`

Daily task counters (`tap: number`, `buy_generator: number`) are stored locally but never synced to the server. If user plays offline:
1. Taps 500 times offline
2. Opens gacha and completes "buy generator" task
3. Closes app
4. On reopen, server state may have different counter values

**Impact:** Task completion may not persist across sessions
**Recommendation:** Sync counters to server every 60 seconds

#### OFFLINE-002: Offline Gains Calculation on Tab Close
**Severity:** MEDIUM
**File:** `src/components/OfflineRewardModal.tsx`

```typescript
// Based on passiveXpPerSecond and time since lastOnlineAt
const elapsedSeconds = (Date.now() - state.lastOnlineAt) / 1000;
```

But `lastOnlineAt` is updated on every save (2-second interval). So offline gains are calculated from last save, not actual close time. A user who:
1. Plays for 10 minutes (last save 2 seconds ago)
2. Closes app
3. Waits 8 hours

Gets offline gains for ~8 hours + 2 seconds, which is correct. BUT if the tab is force-closed:
- `beforeunload` may not fire
- `lastOnlineAt` has old value
- Offline gains may be MORE than expected (good for user, bad for economy)

**Recommendation:** Implement periodic save (every 30s) but don't update `lastOnlineAt` every time; update it only on explicit close or every 5 minutes

#### OFFLINE-003: Network Failure Recovery
**Severity:** HIGH
**File:** `src/lib/storage.ts`

```typescript
try {
  const { error } = await supabase...;
  if (error) throw error;
} catch (e) {
  console.error('Supabase save failed:', e);
  // State is NOT reverted - localStorage save happens separately
}
```

When remote save fails:
1. Error is logged
2. Local save still happens (GOOD)
3. But no retry mechanism
4. `syncStatus` may not update correctly
5. User sees no feedback that sync failed

**Recommendation:** Add retry queue with exponential backoff; update UI to show "pending sync" status

---

## 5. State Recovery After Crash

### 5.1 Current Recovery Mechanisms

| Scenario | Recovery Method | Reliability |
|----------|----------------|-------------|
| Browser crash | localStorage | ✅ High |
| Tab force close | `beforeunload` beacon | ⚠️ Unreliable |
| Telegram background | Visibility API | ✅ Good |
| App update/refresh | localStorage + server | ✅ High |
| Device change | Server + Telegram ID | ✅ High |

### 5.2 Recovery Issues

#### RECOVERY-001: `beforeunload` Beacon May Fail
**Severity:** MEDIUM
**File:** `src/App.tsx` (lines 133-138)

```typescript
const handleUnload = () => {
  navigator.sendBeacon?.(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/track-session`,
    JSON.stringify({ telegram_id: userId, event: 'end' })
  );
};
```

Issues:
1. `sendBeacon` has no confirmation mechanism
2. Server may not receive the beacon
3. No fallback to regular `fetch` with `keepalive: true`
4. Session tracking is for analytics, not game state

**Impact:** Analytics may have gaps; game state is saved via intervals, so this is OK for recovery

#### RECOVERY-002: Server State Could Override Local
**Severity:** MEDIUM
**File:** `src/lib/storage.ts` (lines 200-219)

```typescript
if (telegramId) {
  localStorage.removeItem(LOCAL_STORAGE_KEY);  // ⚠️ OVERWRITES local
  return hydrateFromDb(data);
}
```

When server has data (logged in via Telegram), localStorage is DELETED. If server data is stale or corrupted:
1. User loses local progress
2. No backup of local state
3. No conflict resolution UI

**Recommendation:** Keep local backup for 24 hours; offer manual conflict resolution

---

## 6. Browser Compatibility

### 6.1 Compatibility Matrix

| Feature | Chrome | Firefox | Safari | Edge | iOS Safari |
|---------|--------|---------|--------|------|------------|
| React 18 | ✅ | ✅ | ✅ | ✅ | ✅ |
| CSS Grid | ✅ | ✅ | ✅ | ✅ | ✅ |
| Flexbox | ✅ | ✅ | ✅ | ✅ | ✅ |
| CSS Variables | ✅ | ✅ | ✅ | ✅ | ✅ |
| `navigator.onLine` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `navigator.sendBeacon` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `navigator.clipboard` | ✅ | ✅ | ⚠️ HTTPS | ✅ | ⚠️ HTTPS |
| `crypto.randomUUID` | ✅ 93+ | ✅ 90+ | ✅ 15.4+ | ✅ 93+ | ✅ 15.4+ |
| `localStorage` | ✅ | ✅ | ✅ | ✅ | ✅ |
| Telegram WebApp SDK | ✅ | ✅ | ⚠️ Partial | ✅ | ⚠️ Partial |

### 6.2 Compatibility Issues

#### COMPAT-001: `crypto.randomUUID` Fallback Missing
**Severity:** LOW
**File:** `src/lib/storage.ts` (line 83)

```typescript
id = 'dev_' + crypto.randomUUID();
```

Safari versions before 15.4 don't support `crypto.randomUUID()`. While iOS Safari 15.4+ has support, some users may be on older versions.

**Recommendation:** Add polyfill:
```typescript
const getUUID = () => {
  if (crypto.randomUUID) return crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
};
```

#### COMPAT-002: Telegram WebApp Not Available Outside Telegram
**Severity:** INFO
**File:** Multiple files check for Telegram

The game is designed for Telegram Mini App. Outside Telegram:
- `getTelegramUserId()` returns `null`
- Many features show errors or fall back gracefully
- But no explicit "This game works best in Telegram" message

**Recommendation:** Add feature detection banner when not in Telegram

#### COMPAT-003: iOS Safari Backdrop Filter Performance
**Severity:** MEDIUM
**File:** Multiple components use `backdrop-blur`

```typescript
className="... backdrop-blur-sm"
```

iOS Safari has performance issues with `backdrop-filter`. On older devices, this causes:
1. Janky scrolling
2. High GPU usage
3. Battery drain

**Recommendation:** Use `@supports (backdrop-filter: blur(1px))` or disable for low-end devices

---

## 7. Mobile Device Compatibility

### 7.1 Touch Handling

| Component | Touch Events | Gesture Handling | iOS Safari |
|-----------|-------------|------------------|------------|
| TapArea | ✅ `onTouchStart` | ⚠️ Basic | ⚠️ 300ms delay |
| Generators | ⚠️ `onClick` | ❌ No | ✅ Works |
| Buttons | ✅ Standard | ✅ Native | ✅ Works |
| Modals | ✅ Click outside | ⚠️ Basic | ⚠️ Scroll lock |

### 7.2 Mobile Issues

#### MOBILE-001: Tap Area Double-Firing
**Severity:** HIGH
**File:** `src/components/TapArea.tsx` (lines 274-281)

```typescript
onClick={handleTap}
onTouchStart={handleTap}
```

Both handlers are attached. On iOS Safari:
1. User touches the tap area
2. `onTouchStart` fires → `preventDefault()` called
3. But if `e.preventDefault()` doesn't fully work, `onClick` may also fire
4. Result: Double tap registered

**Evidence:** The code calls `e.preventDefault()` inside `handleTap` for touch events, but this may not prevent synthetic click events.

**Recommendation:** Use `onPointerDown` instead, or add guard:
```typescript
const lastTouchRef = useRef<number>(0);
if ('touches' in e) {
  e.preventDefault();
  if (Date.now() - lastTouchRef.current < 100) return; // Debounce
  lastTouchRef.current = Date.now();
}
```

#### MOBILE-002: Viewport Height Issues
**Severity:** MEDIUM
**File:** `src/App.tsx`

```typescript
style={{ height: `calc(50vh - ${topOffset}px)` }}
```

`vh` units on mobile browsers include/exclude the address bar inconsistently:
- Chrome Android: `100vh` includes address bar initially
- iOS Safari: `100vh` excludes address bar
- After scroll: Behavior changes

**Recommendation:** Use `dvh` (dynamic viewport height) with fallback:
```css
.tap-area {
  height: 50vh; /* Fallback */
  height: 50dvh; /* Modern */
}
```

#### MOBILE-003: Safe Area Handling
**Severity:** MEDIUM
**File:** `src/index.css`

No safe area insets for notched devices (iPhone X+). The UI may be obscured by:
- Top notch
- Bottom home indicator
- Status bar

**Recommendation:** Add to `index.css`:
```css
body {
  padding: env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left);
}
```

#### MOBILE-004: Passive Event Listeners
**Severity:** LOW
**File:** `src/App.tsx` (lines 123-140)

```typescript
document.addEventListener('visibilitychange', handleVisibilityChange);
window.addEventListener('beforeunload', handleUnload);
```

These are not passive, which may cause scroll jank on mobile. Not critical for this app since there's no heavy scroll content, but good practice.

---

## 8. Additional Quality Issues

### 8.1 Type Safety Gaps

#### TYPES-001: Incomplete Type Definitions
**File:** `src/types/game.ts`

Missing types for:
- `GameState.prestigeResearch` - typed but some fields may be undefined
- `LeaderboardEntry` - some fields nullable without null checks
- RPC response types - generic `RpcResult` used everywhere

#### TYPES-002: Magic Numbers
**Files:** Multiple

| Location | Value | Should Be |
|----------|-------|-----------|
| `useGame.ts:30` | `2000` | `LOCAL_SAVE_INTERVAL` |
| `useGame.ts:31` | `15000` | `REMOTE_SAVE_INTERVAL` |
| `useGame.ts:32` | `999` | `MAX_LEVEL` |
| `AdSystem.tsx:230` | `5` | `MAX_ENERGY_ADS_PER_DAY` |
| `AdSystem.tsx:231` | `50` | `ENERGY_RESTORE_AMOUNT` |
| `GachaModal.tsx:38` | `18` | `ROLL_STEPS` |
| `GachaModal.tsx:39` | `60` | `ROLL_INTERVAL_MS` |

All magic numbers should be extracted to named constants.

### 8.2 Performance Concerns

#### PERF-001: Large Component Re-renders
**File:** `src/App.tsx`

The main `App` component receives many props from `useGame()`. Any state change causes re-render of the entire component tree. Consider:
- Memoizing `ownedLevels` calculation (done)
- Splitting App into smaller components
- Using React.memo for child components

#### PERF-002: No Virtualization for Long Lists
**Files:** `ReferralsTab.tsx`, `Leaderboard`

The leaderboard renders all 20 entries at once. If expanded to 100+ entries, this could cause jank. Same for generator list if epochs expand.

**Recommendation:** Use `@tanstack/react-virtual` for long lists

### 8.3 Accessibility Gaps

#### A11Y-001: Missing ARIA Labels
**Files:** Multiple components

Buttons and interactive elements lack `aria-label`:
```typescript
// Example - should have aria-label
<button onClick={handleTap}>Tap!</button>
```

#### A11Y-002: Focus Management in Modals
**Severity:** MEDIUM
**Files:** `GachaModal.tsx`, `TutorialModal.tsx`, etc.

Modals don't trap focus or return focus on close. Screen reader users may:
1. Tab into modal
2. Tab again and exit modal
3. Be confused about context

#### A11Y-003: Color Contrast
**Files:** UI components

Some text/background combinations may not meet WCAG AA contrast ratio (4.5:1). Particularly:
- Gray-400 text on gray-800 background: ~3.2:1 (FAIL)
- Gray-500 text on gray-700: ~3.8:1 (FAIL)

---

## 9. Security Considerations

### 9.1 Already Documented (see 09_SECURITY_AUDIT.md)

The codebase already has good security practices:
- Server-side validation of `initData` via HMAC
- Server-authoritative game actions
- Secret tokens not exposed to client

### 9.2 Additional Security Notes

#### SEC-001: Client-Side Currency Validation
**Severity:** INFO
**File:** `src/components/GeneratorShop.tsx`

The shop shows "can afford" state but doesn't validate on click. The actual validation happens in `useGame.ts` before state mutation. This is acceptable since the click handler checks `currency >= cost` before calling `buyGenerator`.

#### SEC-002: No Rate Limiting Client-Side
**Severity:** INFO

The game doesn't implement client-side rate limiting for:
- Tap events (no max taps/second check)
- Purchase events (no debounce)
- Server sync calls

This is acceptable since server is authoritative, but could lead to:
- Unnecessary API calls
- Battery drain from rapid state updates
- UI stuttering on slow devices

---

## 10. Recommendations Summary

### Priority 1 (Critical - Fix Immediately)

1. **Add Error Boundaries** - Wrap App with hierarchical error boundaries
2. **Fix Gacha Rollback** - Implement transaction-style handling for gacha purchases
3. **Add unit tests** - At minimum for `useGame.ts`, `utils.ts`, `tasks.ts`
4. **Fix tap double-fire** - Use pointer events or add debounce guard
5. **Implement retry queue** - For failed server saves

### Priority 2 (High - Fix Before Launch)

6. **Add integration tests** - Game flow tests with mocked server
7. **Limit tapEvents array** - Cap at 50 entries
8. **Fix duplicate tab detection** - Use BroadcastChannel API
9. **Add safe area CSS** - For notched devices
10. **Server-side task sync** - Sync daily counters periodically

### Priority 3 (Medium - Improve Before Launch)

11. **Add E2E tests** - Playwright tests for critical flows
12. **Fix mobile viewport** - Use `dvh` units
13. **Add accessibility attributes** - ARIA labels, focus management
14. **Fix iOS backdrop-filter** - Conditional CSS
15. **Add UUID polyfill** - For older Safari

### Priority 4 (Nice to Have)

16. **Virtualize long lists** - Leaderboard, generators
17. **Extract magic numbers** - Named constants
18. **Add performance monitoring** - React DevTools profiling setup
19. **Improve color contrast** - WCAG AA compliance
20. **Add crash recovery UI** - Conflict resolution screen

---

## Appendix: Test Cases to Implement

### Unit Test Examples

```typescript
// utils.test.ts
describe('formatNumber', () => {
  test('handles NaN', () => expect(formatNumber(NaN)).toBe('0'));
  test('handles Infinity', () => expect(formatNumber(Infinity)).toBe('0'));
  test('formats millions', () => expect(formatNumber(1500000)).toBe('1.5M'));
  test('formats thousands', () => expect(formatNumber(1500)).toBe('1.5K'));
  test('formats negative numbers', () => expect(formatNumber(-100)).toBe('0'));
});

// tasks.test.ts
describe('getStreakReward', () => {
  test('day 1 returns correct reward', () => {
    const reward = getStreakReward(1);
    expect(reward.currency).toBe(60);
  });
  test('week 1 (day 7) returns weekly reward', () => {
    const reward = getStreakReward(7);
    expect(reward.isWeekly).toBe(true);
  });
  test('caps at 1500 currency', () => {
    const reward = getStreakReward(100);
    expect(reward.currency).toBeLessThanOrEqual(1500);
  });
});

// epochs.test.ts
describe('calculateXpToLevel', () => {
  test('level 1 returns reasonable XP', () => {
    const xp = calculateXpToLevel(1);
    expect(xp).toBeGreaterThan(0);
    expect(xp).toBeLessThan(1000);
  });
  test('higher levels require more XP', () => {
    const xp50 = calculateXpToLevel(50);
    const xp100 = calculateXpToLevel(100);
    expect(xp100).toBeGreaterThan(xp50);
  });
});
```

### Integration Test Examples

```typescript
// game.test.tsx
describe('Game Flow', () => {
  test('tap increases XP', async () => {
    render(<App />);
    const tapArea = screen.getByTestId('tap-area');
    fireEvent.click(tapArea);
    // Check XP increased
  });
  
  test('buy generator deducts currency', async () => {
    // Setup with currency
    render(<App />);
    const buyButton = screen.getByText('Buy Generator');
    fireEvent.click(buyButton);
    // Check currency decreased
  });
});
```

---

## Conclusion

The Virtual Museum Tapper Game has a solid architectural foundation with server-authoritative design and good offline handling. However, the lack of testing infrastructure is a significant risk. The codebase would benefit from:

1. **Immediate:** Add test framework and write critical unit tests
2. **Before launch:** Fix identified bugs, especially race conditions and mobile issues
3. **Post-launch:** Improve accessibility, performance, and add E2E tests

The game shows good attention to UX (haptic feedback, animations, modals) but needs QA hardening to ensure reliability across the diverse ecosystem of Telegram users and devices.
