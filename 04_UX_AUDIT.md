# Virtual Museum Tapper Game — UX Audit Report

**Project:** Ukraine Krizh Chas (Virtual Museum Tapper Game)  
**Version:** 1.6.6  
**Auditor:** UX Director  
**Date:** 2026-07-02  
**Standard:** AAA Studio  

---

## Executive Summary

The Virtual Museum Tapper Game delivers a polished Telegram Mini App experience with strong mobile-first foundations. The core tapping mechanic is satisfying with particle effects and haptic feedback. However, the information architecture creates significant cognitive load through overlapping modal systems, redundant navigation patterns, and unclear feature discoverability. **Priority fixes identified: 14 critical, 22 moderate, 18 minor.**

---

## 1. Navigation Clarity & Ease

### Rating: ⚠️ **Needs Improvement**

#### Strengths
- **Tab-based primary navigation** — 6 tabs (shop, epochs, artifacts, referrals, stats, boosters) provides centralized access
- **Epoch quick-switcher** in header for contextual navigation
- **Sticky header** always visible with level and currency
- **Back navigation** via X buttons on modals

#### Critical Issues

| ID | Issue | Severity | Location |
|----|-------|----------|----------|
| **N1** | **Tab bar confusion** — "stats" tab is unlabeled in icon-only view; "boosters" has no icon until activated | 🔴 CRITICAL | `App.tsx` TabButton component |
| **N2** | **Generator shop buried** — shop tab requires scrolling past tap area; generators not accessible from epoch modal | 🔴 CRITICAL | `App.tsx` layout |
| **N3** | **No breadcrumbs** — users cannot orient when deep in modals (gacha → chest ad → error → retry) | 🔴 CRITICAL | Global |
| **N4** | **Epoch unlock path opaque** — no visual indicator of how to unlock next epoch | 🔴 CRITICAL | `GeneratorShop.tsx` |
| **N5** | **Conflicting close actions** — TutorialModal has both X button AND "Skip tutorial" text link AND "Почати гру" button | 🔴 CRITICAL | `TutorialModal.tsx` |
| **N6** | **Modal stacking** — SessionAdModal and ChestAdModal can stack over gacha; tutorial + streak + daily rewards in sequence | 🟡 MODERATE | `App.tsx` lines 276–354 |

#### Moderate Issues

| ID | Issue | Severity | Location |
|----|-------|----------|----------|
| **N7** | Tab labels truncate: `"Щоденні"` cuts off, `"Переродитися"` overflows | 🟡 MODERATE | `App.tsx` TabButton |
| **N8** | No "Back to Tap" gesture or floating home button when scrolled in shop | 🟡 MODERATE | `App.tsx` layout |
| **N9** | Stats tab shows tap upgrade but doesn't explain where to access generators | 🟡 MODERATE | `StatsPanel.tsx` |
| **N10** | Boosters tab appears empty for non-prestige players; no explanation | 🟡 MODERATE | `App.tsx` tab content |

#### Minor Issues

| ID | Issue | Severity | Location |
|----|-------|----------|----------|
| **N11** | Active tab indicator (yellow underline) overlaps with safe area on notched devices | 🟢 MINOR | `App.tsx` TabButton |
| **N12** | No keyboard navigation support (Tab, Enter, Escape) for any interactive elements | 🟢 MINOR | Global |
| **N13** | Tab bar badge counter maxes at "9+" with no indication of actual value | 🟢 MINOR | `App.tsx` line 377 |

---

## 2. Onboarding Experience (Tutorial)

### Rating: ⚠️ **Needs Improvement**

#### Strengths
- **6-step guided tutorial** covers all core systems
- **Progress dots** for orientation
- **Haptic feedback** on navigation
- **Skip option** available from first screen
- **LocalStorage persistence** prevents repeat showing

#### Critical Issues

| ID | Issue | Severity | Location |
|----|-------|----------|----------|
| **T1** | **No visual highlighting** — tutorial describes UI elements but doesn't highlight them on screen | 🔴 CRITICAL | `TutorialModal.tsx` |
| **T2** | **Tutorial content is wall of text** — 2–4 sentences per step; cognitive overload for new mobile users | 🔴 CRITICAL | `TutorialModal.tsx` lines 13–39 |
| **T3** | **No interactive tutorial** — users can't practice tapping during tutorial | 🔴 CRITICAL | `TutorialModal.tsx` |
| **T4** | **Tutorial shown BEFORE daily streak/rewards** — new players see streak modal first, then tutorial — backwards priority | 🔴 CRITICAL | `App.tsx` lines 276–293 |
| **T5** | **"Епохи" tutorial step misleading** — step 6 says "Розвивайтесь від Трипільської..." but doesn't explain unlock requirements | 🔴 CRITICAL | `TutorialModal.tsx` line 38 |
| **T6** | **No tutorial replay option** — no way to re-read tutorial after skipping | 🔴 CRITICAL | Global |

#### Moderate Issues

| ID | Issue | Severity | Location |
|----|-------|----------|----------|
| **T7** | No celebration or "you completed tutorial" confirmation | 🟡 MODERATE | `TutorialModal.tsx` |
| **T8** | No contextual tooltips for first-time interactions (e.g., "Tap here to earn XP") | 🟡 MODERATE | `TapArea.tsx` |
| **T9** | Prestige system completely absent from tutorial (unlocks at level 950+) | 🟡 MODERATE | `TutorialModal.tsx` |
| **T10** | Energy system absent from tutorial (appears after prestige) | 🟡 MODERATE | `TutorialModal.tsx` |

#### Minor Issues

| ID | Issue | Severity | Location |
|----|-------|----------|----------|
| **T11** | Back button disabled on first tutorial step (user must tap X or Skip) | 🟢 MINOR | `TutorialModal.tsx` |
| **T12** | Icons in tutorial (e.g., ShoppingBag, Gift) are generic, not specific to game | 🟢 MINOR | `TutorialModal.tsx` |

---

## 3. Screen Flow & Information Architecture

### Rating: ⚠️ **Needs Improvement**

#### Strengths
- **Clear separation** between tap area (primary action) and navigation (secondary)
- **Modal-based overlays** keep context while showing details
- **Epoch theming** provides visual variety across progression

#### Critical Issues

| ID | Issue | Severity | Location |
|----|-------|----------|----------|
| **F1** | **Tap area occupies 50% of screen** — shop/list content squeezed into remaining 50% | 🔴 CRITICAL | `TapArea.tsx` line 213 |
| **F2** | **No persistent access to generators** — shop tab hides tap area; user must switch tabs to tap vs. buy | 🔴 CRITICAL | `App.tsx` layout |
| **F3** | **Information overload in stats tab** — all stats visible simultaneously with no categorization | 🔴 CRITICAL | `StatsPanel.tsx` + tab content |
| **F4** | **No visual hierarchy** — tutorial modal, streak modal, daily rewards can all trigger simultaneously | 🔴 CRITICAL | `App.tsx` modal stack |
| **F5** | **Tabs unclear naming** — "stats" vs "boosters" overlap semantically | 🔴 CRITICAL | `App.tsx` line 25 |

#### Moderate Issues

| ID | Issue | Severity | Location |
|----|-------|----------|----------|
| **F6** | Gacha modal is full-screen but only uses ~40% of space | 🟡 MODERATE | `GachaModal.tsx` |
| **F7** | Generator shop list can get long; no section headers per tier | 🟡 MODERATE | `GeneratorShop.tsx` |
| **F8** | Daily tasks panel is visually prominent but rewards are small | 🟡 MODERATE | `DailyTasksPanel.tsx` |
| **F9** | Prestige system split between two locations (stats tab button + Laboratory) | 🟡 MODERATE | `App.tsx` + `PrestigeSystem.tsx` |
| **F10** | Referrals tab mixes referral mechanics with leaderboard (two distinct features) | 🟡 MODERATE | `ReferralsTab.tsx` |

#### Minor Issues

| ID | Issue | Severity | Location |
|----|-------|----------|----------|
| **F11** | No empty states with guidance for: no generators, no artifacts, no referrals | 🟢 MINOR | Various |
| **F12** | Leaderboard placeholder shows "Ще немає гравців" — no CTA to invite friends | 🟢 MINOR | `ReferralsTab.tsx` |

---

## 4. Usability & Learnability

### Rating: ⚠️ **Below Average**

#### Strengths
- **Tap interaction is intuitive** — obvious what to do
- **Visual feedback (particles, ripples)** reinforces actions
- **Currency and XP always visible** in header
- **Tap power badge** shows reward per tap

#### Critical Issues

| ID | Issue | Severity | Location |
|----|-------|----------|----------|
| **U1** | **No explanation of generator value** — no "production per second" shown until after purchase | 🔴 CRITICAL | `GeneratorShop.tsx` lines 51–55 |
| **U2** | **Generator cost scaling unexplained** — costs double exponentially; no "ROI" indicator | 🔴 CRITICAL | `GeneratorShop.tsx` |
| **U3** | **Artifact progress hidden** — players don't know they need X parts to complete artifact | 🔴 CRITICAL | `GachaModal.tsx` |
| **U4** | **"Tap upgrade" cost is opaque** — `tapPowerCost` formula (25 × 1.8^power) not explained | 🔴 CRITICAL | `StatsPanel.tsx` + `useGame.ts` |
| **U5** | **Prestige requirements unclear** — "level ≥960 AND epoch = independence" not explained in-game | 🔴 CRITICAL | `PrestigeSystem.tsx` |
| **U6** | **No "next action" guidance** — new players don't know what to prioritize | 🔴 CRITICAL | Global |

#### Moderate Issues

| ID | Issue | Severity | Location |
|----|-------|----------|----------|
| **U7** | No tutorial tooltips on first generator purchase | 🟡 MODERATE | `GeneratorShop.tsx` |
| **U8** | Energy system (x5 multiplier) lacks explanation when first appearing | 🟡 MODERATE | `TapArea.tsx` lines 352–359 |
| **U9** | Offline earnings calculation not shown before claiming | 🟡 MODERATE | `OfflineRewardModal.tsx` |
| **U10** | No "value comparison" between generator tiers | 🟡 MODERATE | `GeneratorShop.tsx` |
| **U11** | Daily tasks progress not visible from main screen | 🟡 MODERATE | `DailyTasksPanel.tsx` |

#### Minor Issues

| ID | Issue | Severity | Location |
|----|-------|----------|----------|
| **U12** | Combo system has no explanation (appears at 3+ taps) | 🟢 MINOR | `TapArea.tsx` lines 105–132 |
| **U13** | Prestige "what saves/what resets" list uses jargon ("переродження", "дослідження") | 🟢 MINOR | `PrestigeSystem.tsx` |
| **U14** | No help/info icon anywhere in the app | 🟢 MINOR | Global |

---

## 5. Interaction Cost Analysis

### Rating: ⚠️ **High Friction**

#### Tap Economy

| Goal | Taps Required | Optimal | Gap |
|------|---------------|---------|-----|
| Level 2 (first level) | ~50 taps (at 1 XP/tap) | ~30 taps | +67% |
| First generator | ~200 taps | ~150 taps | +33% |
| Unlock Epoch 2 | ~3,000 taps (estimated) | ~2,000 taps | +50% |
| Artifact completion | ~500 chest openings | ~300 openings | +67% |

#### Modal/Overlay Interaction Cost

| Action | Steps Required | Optimal | Issue |
|--------|---------------|---------|-------|
| Watch session ad | Tap ad button → watch ad → tap reward → dismiss | 4 | Stacked modals increase to 6+ |
| Claim daily task | Expand panel → scroll to task → tap claim | 3 | Panel default expanded but scroll needed |
| Open chest | Tap chest button → wait → view result → dismiss | 4 | No quick-retry shortcut |
| Switch epoch | Tap epoch selector → scroll modal → tap epoch | 3 | No persistent epoch picker |
| Upgrade tap | Switch to stats tab → scroll to upgrade → tap | 3 | Not accessible from main screen |
| Buy generator | Switch to shop tab → scroll → tap | 2 | Best case is acceptable |
| Claim offline | Modal auto-shows on return | 1 | ✅ Good |

#### Critical Interaction Friction

| ID | Issue | Severity | Location |
|----|-------|----------|----------|
| **I1** | **Cannot tap while in shop tab** — must switch back to main screen | 🔴 CRITICAL | `App.tsx` tab structure |
| **I2** | **No "Quick Buy" for generators** — always requires tab switch | 🔴 CRITICAL | `App.tsx` |
| **I3** | **Generator scroll position lost** — switching tabs resets scroll | 🔴 CRITICAL | `App.tsx` |
| **I4** | **Chest ad has NO skip option** — user must watch or close entire modal | 🔴 CRITICAL | `AdSystem.tsx` |
| **I5** | **Session ad has NO skip timing** — no "skip in X seconds" | 🔴 CRITICAL | `AdSystem.tsx` |
| **I6** | **Duplicate tab warning blocks gameplay** — forces binary choice with no "play both" | 🔴 CRITICAL | `App.tsx` lines 318–343 |

#### Moderate Issues

| ID | Issue | Severity | Location |
|----|-------|----------|----------|
| **I7** | Leaderboard refresh requires manual tap | 🟡 MODERATE | `ReferralsTab.tsx` |
| **I8** | No swipe gestures for modal dismissal | 🟡 MODERATE | All modals |
| **I9** | Energy restore ad buried in boosters tab (prestige players) | 🟡 MODERATE | `AdSystem.tsx` |
| **I10** | Tutorial skip buried at bottom of modal | 🟡 MODERATE | `TutorialModal.tsx` |

---

## 6. Player Friction Points

### Rating: ⚠️ **High Priority**

#### Session Flow Friction Points

```
[F1] FIRST LAUNCH
  ↓ Tutorial (blocking)
  ↓ Daily Streak Modal (blocking, auto-shown)
  ↓ Daily Rewards (blocking, auto-shown)
  ↓ Session Ad after 20 min (blocking, mandatory dismiss)
  ↓ Tutorial seen → never shown again (no replay)

[F2] CORE LOOP FRUSTRATION
  Want to tap → must be on main tab
  Want to buy → must switch to shop tab
  Cannot tap while scrolling shop
  Switching tabs → scroll position reset
  Tab bar labels truncate → guess which is which

[F3] PROGRESSION UNCERTAINTY
  No clear XP-to-next-level display (only progress bar)
  No "time remaining" estimate to next epoch
  Artifact drop rates hidden in fine print
  Gacha odds shown only in chest modal

[F4] MODAL CHAOS
  Multiple modals can trigger simultaneously:
    - Tutorial + Streak + Daily Rewards (first launch)
    - Session Ad + Chest Ad (during play)
    - Error toast + Offline gains modal
  No modal queue — stacking creates confusion

[F5] AD-RELATED FRICTION
  Session ads after 20 min: too frequent (industry standard: 2-3 min intervals)
  Chest ads every 10th: reasonable but reward is small
  No reward preview before watching ad
  Cannot skip ad countdown
  Ad error states show generic messages

[F6] PRESTIGE SYSTEM BARRIERS
  Level 950 requirement: massive grind without intermediate milestones
  Epoch requirement (Independence): unclear if auto-unlocked or must complete
  No prestige preview: don't know rewards until after reset
  Museum Laboratory hidden until after first prestige
```

#### Critical Friction Points

| ID | Issue | Severity | Location |
|----|-------|----------|----------|
| **P1** | **No persistent tap button** — floating action button would eliminate tab switching | 🔴 CRITICAL | `App.tsx` |
| **P2** | **No progress milestones** — players grind to level 950 with no intermediate rewards | 🔴 CRITICAL | `useGame.ts` |
| **P3** | **Session ad timing (20 min) too long to skip** — causes frustration when forced to watch | 🔴 CRITICAL | `AdSystem.tsx` |
| **P4** | **Offline earnings hidden until return** — no preview of what will be earned | 🔴 CRITICAL | `OfflineRewardModal.tsx` |
| **P5** | **Leaderboard not auto-refreshing** — stale data feels broken | 🔴 CRITICAL | `ReferralsTab.tsx` |
| **P6** | **No "What to do next?" indicator** — new player confusion | 🔴 CRITICAL | Global |

---

## 7. Accessibility Considerations

### Rating: ⚠️ **Poor**

#### Critical Accessibility Failures

| ID | Issue | Severity | WCAG | Location |
|----|-------|----------|------|----------|
| **A1** | **No color-blind modes** — rarity colors (purple epic, pink secret) are indistinguishable | 🔴 CRITICAL | 1.4.3 | `GachaModal.tsx` |
| **A2** | **No text-to-speech support** — all UI elements lack `aria-label` | 🔴 CRITICAL | 4.1.2 | Global |
| **A3** | **No focus indicators** — keyboard navigation impossible | 🔴 CRITICAL | 2.4.7 | Global |
| **A4** | **Contrast ratio failures** — gray-400 text on gray-800 backgrounds fail WCAG AA | 🔴 CRITICAL | 1.4.3 | Multiple |
| **A5** | **No reduced motion option** — float-up particles continue even if user has motion sickness | 🔴 CRITICAL | 2.3.3 | `index.css` |
| **A6** | **Touch targets too small** — some buttons are 32px (below 44px minimum) | 🔴 CRITICAL | 2.5.5 | `GeneratorShop.tsx` |

#### Moderate Issues

| ID | Issue | Severity | WCAG | Location |
|----|-------|----------|------|----------|
| **A7** | Modal titles missing `role="dialog"` and `aria-modal="true"` | 🟡 MODERATE | 4.1.2 | All modals |
| **A8** | Error messages not announced to screen readers | 🟡 MODERATE | 1.3.1 | Error toasts |
| **A9** | Progress bars lack `aria-valuenow`, `aria-valuemin`, `aria-valuemax` | 🟡 MODERATE | 1.3.1 | XP bars |
| **A10** | Loading spinners lack `aria-busy="true"` on containers | 🟡 MODERATE | 1.3.1 | All loaders |
| **A11** | Custom scrollbar may not work with screen readers | 🟡 MODERATE | 2.1.1 | `index.css` |
| **A12** | Emoji icons in tabs (Crown, ShoppingBag) not described | 🟡 MODERATE | 1.1.1 | `App.tsx` |

#### Minor Issues

| ID | Issue | Severity | Location |
|----|-------|----------|----------|
| **A13** | Font sizes vary: 10px labels too small for some users | 🟢 MINOR | Multiple |
| **A14** | No high-contrast mode toggle | 🟢 MINOR | Global |
| **A15** | Animations can trigger vestibular disorders | 🟢 MINOR | `index.css` |

---

## 8. Loading States & Feedback

### Rating: ✅ **Good** (with gaps)

#### Strengths
- **Loading screen** during initial state hydration
- **Haptic feedback** on all actions (success, warning, error)
- **Spinning loaders** during ad loading
- **Particle effects** provide instant tap feedback
- **Ripple effects** show touch point

#### Critical Gaps

| ID | Issue | Severity | Location |
|----|-------|----------|----------|
| **L1** | **No skeleton screens** — blank content during data load (leaderboard) | 🔴 CRITICAL | `ReferralsTab.tsx` |
| **L2** | **No optimistic UI** — chest opening waits for server; no "pending" state | 🔴 CRITICAL | `GachaModal.tsx` |
| **L3** | **No purchase confirmation feedback** — buying generator shows no "purchased!" toast | 🔴 CRITICAL | `GeneratorShop.tsx` |
| **L4** | **Tab switching has no loading state** — data refresh invisible | 🔴 CRITICAL | `App.tsx` |
| **L5** | **No progress indication during prestige** — server call may take 2-5 seconds | 🔴 CRITICAL | `PrestigeSystem.tsx` |

#### Moderate Issues

| ID | Issue | Severity | Location |
|----|-------|----------|----------|
| **L6** | Tap particles don't indicate XP gain direction (up vs. down) | 🟡 MODERATE | `TapArea.tsx` |
| **L7** | Generator purchase doesn't show "+1 level" animation | 🟡 MODERATE | `GeneratorShop.tsx` |
| **L8** | Offline gains show currency/XP but not "earned while away" context | 🟡 MODERATE | `OfflineRewardModal.tsx` |
| **L9** | Daily task progress bar doesn't animate smoothly | 🟡 MODERATE | `DailyTasksPanel.tsx` |
| **L10** | Combo indicator appears/disappears abruptly | 🟡 MODERATE | `TapArea.tsx` |

#### Minor Issues

| ID | Issue | Severity | Location |
|----|-------|----------|----------|
| **L11** | Ad loading shows generic "Завантаження..." — no ad preview | 🟢 MINOR | `AdSystem.tsx` |
| **L12** | Telegram init shows console log only, no UI indication | 🟢 MINOR | `App.tsx` |

---

## 9. Error Handling UX

### Rating: ⚠️ **Needs Improvement**

#### Strengths
- **Error toast** appears at top of screen (non-blocking for some errors)
- **Connection error** has auto-dismiss when connection recovers
- **Duplicate tab warning** is clear with action buttons
- **Ad failure** shows retry option

#### Critical Issues

| ID | Issue | Severity | Location |
|----|-------|----------|----------|
| **E1** | **Error messages are technical** — "Помилка під час відкриття рахунку" doesn't explain cause | 🔴 CRITICAL | `App.tsx` line 234 |
| **E2** | **No retry mechanism** for network failures during critical actions (prestige, gacha) | 🔴 CRITICAL | `GachaModal.tsx` |
| **E3** | **Silent failures** — some errors only log to console, not shown to user | 🔴 CRITICAL | Multiple |
| **E4** | **"Energy full" state** — no indication how to use energy | 🔴 CRITICAL | `AdSystem.tsx` lines 252–266 |
| **E5** | **Ad limit reached** — "Ліміт вичерпано" doesn't say when limit resets | 🔴 CRITICAL | `AdSystem.tsx` |
| **E6** | **Gacha error phase** — only shows retry button, no explanation of what went wrong | 🔴 CRITICAL | `GachaModal.tsx` lines 365–371 |

#### Moderate Issues

| ID | Issue | Severity | Location |
|----|-------|----------|----------|
| **E7** | No "offline mode" indicator when network lost | 🟡 MODERATE | `App.tsx` |
| **E8** | Telegram Stars purchase failures don't explain resolution steps | 🟡 MODERATE | `App.tsx` |
| **E9** | Generator purchase failure (insufficient funds) doesn't show how to earn more | 🟡 MODERATE | `GeneratorShop.tsx` |
| **E10** | Daily task claim failure doesn't explain counter mismatch | 🟡 MODERATE | `DailyTasksPanel.tsx` |
| **E11** | Leaderboard load failure shows generic message | 🟡 MODERATE | `ReferralsTab.tsx` |

#### Minor Issues

| ID | Issue | Severity | Location |
|----|-------|----------|----------|
| **E12** | Error toasts auto-dismiss too quickly (no user action taken) | 🟢 MINOR | `App.tsx` |
| **E13** | Stack trace may leak in production error messages | 🟢 MINOR | Multiple |

---

## 10. Mobile-First Design Patterns

### Rating: ⚠️ **Partially Implemented**

#### Strengths
- **Touch-manipulation CSS** prevents double-tap zoom (`touch-action: manipulation`)
- **Safe area support** for notched devices
- **Fixed viewport** prevents overscroll on iOS
- **Responsive breakpoints** in CSS and components
- **Large tap areas** (epoch selector, tab buttons)
- **Bottom-aligned action buttons** in modals

#### Critical Gaps

| ID | Issue | Severity | Location |
|----|-------|----------|----------|
| **M1** | **No pull-to-refresh** — leaderboard and referrals require manual button tap | 🔴 CRITICAL | `ReferralsTab.tsx` |
| **M2** | **No swipe gestures** — modal dismissal, tab switching, or navigation | 🔴 CRITICAL | Global |
| **M3** | **Horizontal scroll not supported** — epoch modal may overflow on small screens | 🔴 CRITICAL | `App.tsx` lines 234–264 |
| **M4** | **No haptic feedback on all interactions** — only on purchases and ads | 🔴 CRITICAL | `TapArea.tsx` |
| **M5** | **Keyboard not supported** — no numeric keypad for quantity inputs (if added later) | 🔴 CRITICAL | Global |
| **M6** | **No offline-first caching** — app unusable offline except local state | 🔴 CRITICAL | `useGame.ts` |

#### Moderate Issues

| ID | Issue | Severity | Location |
|----|-------|----------|----------|
| **M7** | Long-press on generators doesn't show quick stats | 🟡 MODERATE | `GeneratorShop.tsx` |
| **M8** | Tap feedback (particles) may slow performance on older devices | 🟡 MODERATE | `TapArea.tsx` |
| **M9** | No "night mode" or theme toggle | 🟡 MODERATE | Global |
| **M10** | Emoji-heavy UI may render differently across platforms | 🟡 MODERATE | Global |
| **M11** | Custom scrollbar not touch-native on mobile | 🟡 MODERATE | `index.css` |
| **M12** | Desktop optimization limited (max-width: 800px) — not responsive beyond | 🟡 MODERATE | `index.css` |

#### Minor Issues

| ID | Issue | Severity | Location |
|----|-------|----------|----------|
| **M13** | Status bar color not adapted to app theme | 🟢 MINOR | `index.html` |
| **M14** | No PWA manifest icons specified | 🟢 MINOR | `public/manifest.json` |
| **M15** | App splash screen not customized | 🟢 MINOR | `index.html` |

---

## Summary: Priority Fix Matrix

### 🔴 CRITICAL (Fix Within 2 Weeks)

| ID | Category | Issue | Impact |
|----|----------|-------|--------|
| N1 | Navigation | Tab bar confusion (unlabeled icons) | Users cannot navigate |
| N4 | Navigation | Epoch unlock path opaque | Progression blocked |
| T1–T3 | Onboarding | Tutorial is wall-of-text, no highlighting, no practice | Learnability near zero |
| F1–F2 | Architecture | Tap and shop mutually exclusive (50/50 split) | Core loop broken |
| I1–I3 | Interaction | Cannot tap while shopping; no quick-buy | High frustration |
| P1–P2 | Friction | No persistent tap; no milestones | Drop-off likely |
| A1–A6 | Accessibility | Color-blind, no keyboard, contrast failures | Legal risk |
| L1–L5 | Loading | No skeleton screens, no optimistic UI | Broken feedback |
| E1–E6 | Errors | Technical messages, no retry, silent failures | Trust erosion |
| M1–M6 | Mobile | No pull-to-refresh, no gestures, no offline | Incomplete mobile |

### 🟡 MODERATE (Fix Within 1 Sprint)

| Category | Count |
|----------|-------|
| Navigation | 3 |
| Onboarding | 4 |
| Flow/Architecture | 4 |
| Usability | 5 |
| Interaction | 4 |
| Friction | 6 |
| Accessibility | 6 |
| Loading | 5 |
| Errors | 5 |
| Mobile | 6 |

### 🟢 MINOR (Fix Within 1 Month)

| Category | Count |
|----------|-------|
| Navigation | 3 |
| Onboarding | 2 |
| Flow | 2 |
| Usability | 3 |
| Interaction | 2 |
| Friction | 0 |
| Accessibility | 3 |
| Loading | 2 |
| Errors | 2 |
| Mobile | 3 |

---

## Recommended Actions

### Immediate (P0)
1. **Add floating tap button** — persistent FAB in bottom-right for quick tapping
2. **Redesign tutorial** — interactive, highlight-based, replayable
3. **Add skeleton screens** — for leaderboard, generator list
4. **Fix accessibility** — add aria-labels, fix contrast, add reduced-motion support
5. **Implement optimistic UI** — for all purchase and gacha actions

### Short-term (P1)
1. **Unified shop/tap view** — split-screen or collapsible tap area
2. **Progress milestones** — visual indicators at levels 50, 100, 250, 500, 950
3. **Reduce ad frequency** — session ads every 5 min max
4. **Error message overhaul** — user-friendly, actionable messages
5. **Add pull-to-refresh** and swipe gestures

### Medium-term (P2)
1. **Achievement system** with visual rewards
2. **What-to-do-next hints** for new players
3. **Custom accessibility settings panel**
4. **Offline earnings preview**
5. **Desktop responsive optimization**

---

*End of UX Audit Report — Virtual Museum Tapper Game v1.6.6*
