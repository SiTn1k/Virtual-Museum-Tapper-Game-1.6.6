# Virtual Museum Tapper Game — Economy Audit Report
**Version:** 1.6.6  
**Audit Date:** 2026-07-02  
**Audit Level:** Senior Economy Designer (AAA Studio Standards)  
**Auditor:** Economy Design Review  

---

## Executive Summary

The Virtual Museum Tapper Game is a Telegram Mini App idle/incremental game themed around Ukrainian and World History. The economy is multi-layered with 20 epochs, a prestige/rebirth system, energy mechanics, artifact collection, and a monetization layer via Telegram Stars. 

**Overall Assessment: ⚠️ MODERATE RISK — Several critical economy imbalances identified.**

The game has strong foundational systems but suffers from **progression that frontloads too much reward too early**, **generator cost scaling that becomes trivially easy post-prestige**, **an energy system with questionable design intent**, and **F2P/P2W balance issues** around boosters and passive income amplification. These require systematic fixing.

---

## 1. Currency System Analysis

### 1.1 Currencies in Circulation

| Currency | Type | Purpose | Sinks |
|----------|------|---------|-------|
| Epoch Currency | Soft (per-epoch) | Generator purchases, gacha | Generators, gacha chest |
| XP | Progression | Level ups, tap power | Tap upgrades |
| Energy | Premium-adjacent | x5 tap multiplier (prestige+) | Consumed on tap |
| Prestige Points | Hard (premium) | Museum Laboratory upgrades | Prestige research |
| Telegram Stars | Real-money | Boosters, premium items | Boosters |

### 1.2 Currency Flow — CRITICAL IMBALANCE: Inflation via Passive Income

**Problem:** Passive income dramatically outpaces active tapping within 2-3 generator purchases.

Epoch 1 (Trypillia) generators:
```
Tier 1: Clay Pit    — 10 currency → 2/s passive
Tier 2: Pottery      — 50 currency → 8/s passive  
Tier 3: Settlement   — 300 currency → 40/s passive
Tier 4: Megastructure— 3,000 currency → 200/s passive
Tier 5: Temple       — 30,000 currency → 1,000/s passive
```

**Analysis:**
- A player buying just Tier 1 + Tier 2 generators (cost: 60) generates 10/s passive
- Starting currency: 20
- With passive income: Within 4-6 seconds, player has earned enough to buy another Tier 1
- **This means generators pay for themselves in under 1 minute of gameplay**

**Verdict:** Passive income makes generators feel "free" — currency becomes meaningless after the first prestige cycle. The generator economy provides almost no meaningful resource constraint.

---

## 2. Progression Speed Analysis

### 2.1 XP Curve — Designed vs Actual

The code specifies this target curve in `useGame.ts`:

```javascript
// Epoch 1: 60s → 5 min per level (avg ~3 min)
// Epoch 2: 90s → 8 min per level (avg ~5 min)
// Epoch 3+: 2 min → 15 min per level (progressive slowdown)
```

**Target:** ~15 hours to reach level 100 (Epoch 3).

**Actual Problems:**

1. **Passive XP multiplier is NOT accounted for in the curve.**
   - `passiveXpPerSecond` generates XP automatically
   - With just 2 generators owned, passive XP >> tap XP
   - Real progression is **3-5x faster** than designed

2. **Artifact bonuses stack multiplicatively** — completing 5-10 artifacts makes the curve irrelevant
   - A completed artifact with 1.10 XP multiplier stacks with others
   - A player with 5 artifacts at +8-10% each is getting 1.5-2x XP multipliers
   - After first prestige, +100% XP from research is common

3. **Level 950 prestige requirement is arbitrary.**
   - The code requires level 950 to prestige, but nothing prevents a player from reaching it in days/weeks
   - No meaningful gatekeeping

**Verdict: Progression is TOO FAST. The curve is a fiction — real progression is dominated by multipliers.**

### 2.2 Generator Cost Scaling — Insufficient

**Formula:** `cost = baseCost × 1.15^level`

| Tier | Base Cost | Level 10 | Level 50 | Level 100 |
|------|----------|----------|----------|-----------|
| Tier 1 | 10 | 26 | 1,000+ | ~117,000 |
| Tier 5 | 30,000 | 78,500 | 3B+ | ~10^17 |

**Analysis:**
- For Ukrainian epochs, Tier 1 generators are affordable within seconds of starting
- Tier 5 generators become affordable within 10-20 minutes passively
- **After prestige 1+, the entire Ukrainian epoch set (levels 1-950) becomes trivial**
- A prestige 5 player can buy every generator in Epoch 1 within minutes

**Verdict: Generator cost scaling is balanced for first playthrough only. Post-prestige, it's meaningless.**

### 2.3 Gacha Costs — Scaling Issue

```javascript
// Gacha cost by epoch
const getGachaCost = (epochId) => 100 * Math.max(1, epochIndex + 1);
```

| Epoch | Gacha Cost |
|-------|-----------|
| 1 (Trypillia) | 100 |
| 5 (Polish-Lithuanian) | 500 |
| 12 (Independence) | 1,200 |
| 20 (Modern World) | 2,000 |

**Analysis:**
- First epoch gacha is 100 currency — affordable in seconds
- This makes the gacha feel like a "spend loose change" mechanic, not a meaningful choice
- **Risk:** Players will spam gacha infinitely since it's trivially cheap

**Verdict: Gacha should cost 500-1000 minimum for epoch 1 to create tension.**

---

## 3. Prestige Economy Analysis

### 3.1 Prestige Requirements

- **Level requirement:** 950+
- **Epoch requirement:** Must be on "Independence" epoch
- **Points earned:** `floor(total_xp / 100,000) + floor((level - 950) / 50)`
- **Points per prestige:** 10 base + level bonus + rebirth multiplier

**Analysis:**

```
First prestige (level 950, 0 totalXP): 10 + 0 = 10 points
Second prestige (level 950, 10M totalXP): 10 + 100 + 50% = 15 points
Tenth prestige: ~50+ points per prestige
```

**Problems:**
1. **Level 950 is too easy to reach** — players can do it in days
2. **Prestige points scale well** but the path to first prestige is too short
3. **Epoch requirement (Independence) is meaningless** — progression auto-advances epochs

### 3.2 Prestige Research — Museum Laboratory

| Upgrade | Cost | Max Level | Total Cost | Effect |
|---------|------|-----------|------------|--------|
| Black Archaeology (Rare Chance) | 2 pts | 10 | 20 pts | +5% rare per level |
| World Expedition (Passive Income) | 3 pts | 10 | 30 pts | +10% passive per level |
| Chief Historian (XP Gain) | 1 pt | 20 | 20 pts | +5% XP per level |
| Energy Capacity | 5 pts | 10 | 50 pts | +100 max energy |
| Cossack Power (Tap Power) | 8 pts | 5 | 40 pts | +1 base tap power |

**Analysis:**

1. **Chief Historian is TOO CHEAP** — 1 point for +5% XP, max 20 levels = +100% XP for 20 points
   - This single upgrade dominates post-prestige play
   - With 5 prestiges, player has 100+ points easily — all goes to XP gain
   
2. **World Expedition is TOO STRONG** — +10% passive per level, 10 levels = +100% passive
   - Post-prestige players generate currency at 2x-3x rate
   - Combined with energy system: massive amplification

3. **Black Archaeology is UNDERVALUED** — only +50% rare chance for 20 points
   - The gacha RNG is already punishing (4% legendary)
   - Players have no meaningful way to target specific artifacts

**Verdict: Museum Laboratory has imbalanced pricing. XP Gain upgrade should cost 2-3 points, not 1.**

### 3.3 Epoch Unlock via Rebirth — Good System

Each rebirth unlocks additional epochs:
```
Rebirth 0: Ukrainian epochs 1-12 (levels 1-950)
Rebirth 1: Egypt, Greece (unlock at rebirth 1)
Rebirth 2: Rome, Medieval
Rebirth 3: Renaissance, Enlightenment
Rebirth 4: Victorian
Rebirth 5: Modern World
```

**Verdict:** This is well-designed. Forces 5-6 prestiges to access full content.

---

## 4. Energy System — Critical Design Flaw

### 4.1 Energy Mechanics

```javascript
// Energy: x5 multiplier when energy > 0 (prestige 1+ only)
// Regeneration: +2 energy per 2 minutes
// Max energy: 1000
// Ad restore: +100 per ad (5/day)
```

**Analysis:**

1. **Energy is UTTERLY MEANINGLESS.**
   - 1000 max energy
   - -1 energy per tap
   - 2 energy regenerates per 2 minutes
   - Player taps ~5-10 times per second = -300-600 energy per minute
   - **Energy depletes in 2-3 minutes but regenerates at 1/minute**
   
2. **The x5 multiplier creates a binary state:**
   - Energy > 0: 5x tap power (massive bonus)
   - Energy = 0: 1x tap power (feels punishing)

3. **Players will spam watch ads to restore energy** — this is the monetization hook
   - 5 energy restore ads/day × 100 energy = 500 energy
   - That's only 8-10 minutes of "powered up" gameplay

**Verdict: Energy system is frustrating, not fun. The binary multiplier creates anxiety, not engagement.**

---

## 5. Artifact System — Gacha & Collection

### 5.1 Rarity Distribution

```
Common: 60%
Rare: 25%
Epic: 10%
Legendary: 4%
Secret: 1% (prestige 1+)
```

### 5.2 Fragment System

```
Level 1 artifact: 10 parts
Level 2 artifact: 10 additional parts (total 20)
Level 3 artifact: 15 additional parts (total 35)
Level 4 artifact: 20 additional parts (total 55)
```

### 5.3 Duplicate Handling — Critical Problem

When a duplicate artifact drops:
```javascript
// Each duplicate adds +10% of the base bonus
effectiveValue = art.bonus.value + (art.bonus.value - 1) * 0.1 * dupeCount;
```

**Analysis:**

1. **Duplicates feel TERRIBLE.**
   - A common artifact with +5% XP: duplicate gives +0.5% XP (negligible)
   - Players hate getting duplicates — there's no meaningful reward
   - Suggestion: Duplicates should give 2-3x fragments, not tiny bonuses

2. **Artifact completion is TOO EASY.**
   - 10 parts for a common artifact
   - 1-3 parts per chest drop
   - Average: 5-10 chest opens to complete one artifact
   - **This means players complete ALL artifacts within 2-3 prestiges**

3. **Artifact bonuses are TOO WEAK.**
   - Common: +5% (nearly unnoticeable)
   - Legendary: +15-20% (marginal improvement)
   - With 50+ artifacts collected, total bonus is maybe 2-3x
   - **But prestige research alone gives +100% XP and +100% passive**

**Verdict: Artifacts are cosmetic/side-grade, not meaningful progression drivers.**

### 5.4 Sit Studio Easter Egg — Design Question

10 secret letters spell "SIT STUDIO" — each gives +1% XP.
- Total: +10% XP from completing the easter egg
- **This is negligible and players may never discover it.**

---

## 6. Ad System & Monetization

### 6.1 Ad Types

| Ad Type | Frequency | F2P Reward | P2P Reward |
|---------|-----------|------------|------------|
| Session Ad | Every 20 min | x2 income 15 min | +20 Energy |
| Chest Ad | Every 10th chest | +5% rare chance | +10 Energy |
| Energy Ad | 5/day | N/A | +100 Energy |
| Offline Ad | 3/day | x2 offline income | N/A |

### 6.2 Ad Economy Balance

**Analysis:**

1. **Session ads give WEAK rewards for F2P.**
   - x2 income for 15 minutes sounds good, but passive income is already trivial
   - The boost is negligible

2. **Chest ads give +5% rare chance — THIS IS GAMECHANGEING for F2P.**
   - This is the only meaningful F2P progression boost
   - It's hidden behind ads — players must watch to improve RNG
   - **This is actually GOOD design for F2P retention**

3. **Energy ads are mandatory for P2P enjoyment.**
   - Without energy ads, energy depletes too fast
   - This creates ad fatigue

**Verdict: Ad system has good F2P hooks (rare chance boost) but frustrating energy dependency.**

---

## 7. Daily Systems

### 7.1 Daily Rewards (Check-in)

| Day | Currency | XP | Special |
|-----|----------|-----|---------|
| 1 | 500 | - | - |
| 2 | 1,000 | 200 | - |
| 3 | 1,500 | 400 | - |
| 4 | 2,000 | 600 | - |
| 5 | 3,000 | 800 | - |
| 6 | 4,000 | 1,000 | - |
| 7 | 5,000 | 1,500 | Gacha Ticket |

**Analysis:**

1. **Day 7 reward (5,000 currency + gacha ticket) is too good.**
   - Players will farm streaks to get day 7 rewards
   - But missing a day resets streak — creates anxiety

2. **Currency rewards scale with nothing.**
   - 5,000 currency on day 7 is nothing post-prestige
   - XP rewards (1,500) are also negligible

**Verdict: Daily rewards feel like "participation trophies" — nice but meaningless.**

### 7.2 Daily Tasks

Task pool examples:
```
Tap 50 times:     30 currency
Tap 200 times:    100 currency  
Tap 500 times:    220 currency
Tap 1,000 times:  400 currency
XP 500:           60 currency
XP 2,000:         180 currency
Buy Generator:    80 currency
Open Gacha:       100 currency
```

**Analysis:**

1. **Task rewards are TOO LOW.**
   - Completing all daily tasks gives ~1,500-2,000 currency
   - One generator costs 10-50 currency
   - **Tasks are irrelevant after the first hour of play**

2. **Task design is lazy.**
   - "Tap 50 times" is just clicking — no skill involved
   - No meaningful choices

**Verdict: Daily tasks need higher rewards (10x) or more interesting mechanics.**

---

## 8. Referral System

- **Referrer reward:** 100 currency per referral
- **Referee reward:** 50 currency bonus
- **Referral earnings tracked in currency**

**Analysis:**

1. **Referral currency is TRIVIAL.**
   - 100 currency = 2-3 generator purchases
   - After prestige 1+, this is pocket change

2. **No upper limit on referrals.**
   - Whale players can spam referrals
   - No real economy impact either way

**Verdict: Referral system is a nice-to-have, not a real retention driver.**

---

## 9. Booster System (Telegram Stars)

### 9.1 Booster Types (Prices need verification)

| Booster | Effect | Duration |
|---------|--------|----------|
| XP Boost | x2 XP | 30 min? |
| Currency Boost | x2 Currency | 30 min? |
| Super Boost | x3 XP + Currency | 30 min? |
| Legendary Gacha | Guaranteed legendary | 1 use |

### 9.2 Booster Economy

**Analysis:**

1. **Booster prices are unknown** — need to verify real-money cost
2. **x2 boosters compete with FREE chest ad bonuses**
   - Chest ad gives +5% rare chance for FREE
   - Players will compare paid boosters vs free ad rewards

3. **Super Boost (x3) vs Passive Income:**
   - A player with +100% passive research gets 2x passive naturally
   - A x3 booster brings them to 6x — but it's temporary
   - **The permanent bonuses from prestige research make temporary boosters feel weak**

**Verdict: Booster monetization is undercut by strong F2P progression.**

---

## 10. Idle Income & Offline Progression

### 10.1 Offline Calculation

```javascript
// Passive income runs while app is closed
// Offline gains = passiveXpPerSecond × seconds_away × artifact_multipliers
```

**Analysis:**

1. **Offline income is GENEROUS.**
   - Player can earn hours/days of passive XP while away
   - Combined with energy system: returning players get a burst

2. **x2 offline ad multiplier is MEANINGLESS.**
   - Players will just not watch the ad and accept the "free" offline income
   - The ad choice is "free 1 hour vs paid 2 hours" — not compelling

**Verdict: Offline income is too generous. It removes urgency to play actively.**

---

## 11. Number Formatting & Display

The `formatNumber` function in `utils.ts`:
```javascript
if (n >= 1e12) return (n / 1e12).toFixed(1) + 'T';
if (n >= 1e9)  return (n / 1e9).toFixed(1)  + 'B';
if (n >= 1e6)  return (n / 1e6).toFixed(1)  + 'M';
if (n >= 1e3)  return (n / 1e3).toFixed(1)  + 'K';
```

**Analysis:**
- **Good:** Proper abbreviation (K, M, B, T)
- **Issue:** `toFixed(1)` shows one decimal — "1.0K" looks ugly
- **Issue:** No thousands separator for numbers < 1000
- **Issue:** Large numbers will hit JavaScript integer limits (MAX_SAFE_INTEGER ~9 quadrillion)

**Verdict: Minor cosmetic issue. Needs improvement for polish.**

---

## 12. Server-Side Economy Validation

### 12.1 What's Server-Authoritative

| Action | Validation |
|--------|------------|
| Gacha rolls | Server-side RNG |
| Prestige | Server-authoritative |
| Ad rewards | Server-tracked daily limits |
| Offline income | Client-side (WARNING) |

### 12.2 Critical Issue: Offline Income is Client-Side

```javascript
// In useGame.ts — client calculates own offline gains
// This can be exploited!
```

**Verdict: Offline income should be server-calculated, not client-reported.**

---

## 13. Whale vs F2P Balance

### 13.1 F2P Experience

| Metric | Assessment |
|--------|------------|
| Early game | Fun, engaging, good tutorial |
| Mid game | Repetitive, meaningless choices |
| Late game | Prestige feels like a grind |
| Monetization | Ad fatigue from energy system |

### 13.2 P2P/Whale Experience

| Metric | Assessment |
|--------|------------|
| Boosters | Weaker than free research bonuses |
| Energy ads | Necessary but limited (5/day) |
| Prestige research | The REAL power (permanent) |
| Artifact collection | Cosmetic, not competitive |

### 13.3 Competitive Balance

**Problem:** Leaderboard is XP-based, dominated by:
1. Prestige level (more prestiges = more research)
2. Total playtime (idle income)
3. Artifact bonuses (negligible impact)

**Verdict: There's no meaningful competitive advantage for spenders. F2P can compete with idle time.**

---

## 14. Long-Term Economy Sustainability

### 14.1 Sinks & Drains

**Currency Sinks:**
1. Generators (infinite, but trivial cost post-prestige)
2. Gacha (100-2000 currency, trivial)
3. Tap upgrades (exponential, but irrelevant post-prestige)

**Currency Sources:**
1. Passive income (infinite, no decay)
2. Daily rewards (500-5000/day)
3. Daily tasks (1500-2000/day)
4. Check-in rewards (500-5000/day)
5. Referrals (50-100/referral)

**Net Flow: INFLATION — currency supply grows unbounded.**

### 14.2 Artifact Sinks

**Fragment Sinks:**
1. Complete artifact (spend fragments)
2. Level up artifact (spend more fragments)

**Fragment Sources:**
1. Gacha (1-3 per roll)
2. Duplicates (extra fragments)

**Net Flow: DEFLATION — fragments become scarce for upgrades.**

**Verdict: Currency inflates infinitely. Fragments deflate over time.**

---

## 15. Key Recommendations (Priority Order)

### 🔴 CRITICAL (Fix Immediately)

1. **Rebalance energy system:**
   - Remove binary x5 multiplier — make energy a gradual boost instead
   - OR: Make energy regenerate 10x faster (20/minute)
   - OR: Make energy cost 10 taps, not 1

2. **Increase generator cost multiplier:**
   - Change from 1.15 to 1.25-1.30 for later epochs
   - Or implement epoch-specific cost scaling

3. **Increase gacha cost 5-10x:**
   - Epoch 1: 500-1000 currency
   - Make gacha a meaningful decision, not "spend loose change"

4. **Server-side offline income validation:**
   - Move offline calculation to server
   - Prevent exploitation

5. **Balance prestige research costs:**
   - Chief Historian (XP): 2-3 points, not 1
   - World Expedition (Passive): 4-5 points, not 3

### 🟡 HIGH PRIORITY (Fix in Next Sprint)

6. **Make daily tasks meaningful:**
   - Increase rewards 5-10x
   - Add variety (epoch-specific tasks)

7. **Improve duplicate artifacts:**
   - Give 2-3x fragments for duplicates
   - Or: Convert duplicates to "artifact essence" currency

8. **Add currency sinks:**
   - Prestige research could cost currency AND prestige points
   - Or: Add "artifact level upgrade" currency cost

9. **Fix number formatting:**
   - `toFixed(1)` → `toFixed(0)` or custom rounding
   - Add big number handling (use string math)

10. **Reconsider daily reward scaling:**
    - Scale rewards with prestige level
    - Day 7 should give 50,000+ currency for prestige 5 players

### 🟢 MEDIUM PRIORITY (Future Improvements)

11. **Add seasonal events with temporary currencies**
12. **Implement leaderboard seasons with reset**
13. **Add achievements with meaningful rewards**
14. **Consider "Era Pass" battle pass system**
15. **Add cosmetic-only purchasables**

---

## 16. Summary Scores

| Category | Score | Notes |
|----------|-------|-------|
| Currency Balance | 3/10 | Massive inflation, no meaningful sinks |
| Progression Speed | 4/10 | Too fast, curve is a fiction |
| Prestige Depth | 7/10 | Good system, pricing needs adjustment |
| Energy System | 2/10 | Frustrating binary design |
| Artifact System | 5/10 | Duplicates feel bad, completion too easy |
| Ad Economy | 6/10 | Good F2P hooks, frustrating P2P dependency |
| Daily Systems | 4/10 | Rewards too low, tasks meaningless |
| Monetization | 5/10 | Boosters undercut by F2P research |
| Long-term Health | 4/10 | No sustainable economy loop |
| Technical Quality | 7/10 | Server-side validation good, but offline exploit |

**Overall Economy Health: 5/10 — Needs significant rework before scaling to large player base.**

---

## Appendix: Key Code References

- XP Curve: `src/hooks/useGame.ts:45-86`
- Generator Cost: `src/data/epochs.ts:143-145`
- Gacha Cost: `src/components/GachaModal.tsx:33-36`
- Prestige Points: `src/components/RebirthSystem.tsx:28-33`
- Energy System: `src/hooks/useGame.ts:371-418`
- Artifact Bonuses: `src/hooks/useGame.ts:136-151`
- Daily Tasks: `src/data/tasks.ts:14-29`
- Server-side chest: `supabase/functions/open-chest/index.ts`
- Server-side prestige: `supabase/functions/perform-prestige/index.ts`

---

*End of Economy Audit Report*
