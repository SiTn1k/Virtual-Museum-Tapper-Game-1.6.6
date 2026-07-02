# 🎮 Jolt Time — Virtual Museum Tapper Game
## Comprehensive Project Overview & Audit

**Version:** 1.6.6  
**Platform:** Telegram Mini App  
**Primary Market:** Ukraine (Ukrainian localization)  
**Date:** 2026-07-02

---

## 1. GAME GENRE ANALYSIS

### Classification
- **Primary Genre:** Idle/Clicker (Тапалка)
- **Secondary Genre:** Collection/Progression RPG
- **Tertiary Genre:** Educational Historical Simulator
- **Monetization Model:** Hybrid Freemium (Ads + IAP via Telegram Stars)

### Genre Definition
"Jolt Time" is a **historical idle-clicker** that combines:
- Traditional tap-to-earn mechanics (tap area + generators)
- Gacha-based artifact collection system
- Prestige/NG+ progression loop
- Educational narrative through 20 historical epochs

---

## 2. CORE GAMEPLAY LOOP

### 2.1 Primary Loop (Session)

```
[TAP] → Earn XP/Currency → [LEVEL UP] → Unlock Epochs/Features
     ↓
[BUY GENERATORS] → Passive XP Income → Accelerate Progression
     ↓
[OPEN GACHA] → Collect Artifacts → Increase Multipliers
     ↓
[DAILY TASKS] → Bonus Rewards → Sustain Engagement
     ↓
[WATCH ADS] → Resource Recovery → Monetization Touchpoint
```

### 2.2 Progression Loop (Long-term)

```
[REACH LEVEL 960 + EPOCH 12] → [PRESTIGE] → Reset with Permanent Bonuses
     ↓
[UNLOCK WORLD EPOCHS (13-20)] → New Content + Higher Difficulty
     ↓
[COLLECT SECRET ARTIFACTS] → Competitive Endgame Multipliers
     ↓
[REPEAT WITH x5 ENERGY BUFF]
```

### 2.3 Session Structure

| Phase | Duration | Player Action |
|-------|----------|---------------|
| Onboarding | 0-5 min | Tutorial, First taps |
| Early Game | 5-30 min | Epoch 1-2 Progression |
| Mid Game | 30-120 min | Epoch 3-8 Progression |
| Late Game | 2-8 hours | Epoch 9-12, Prestige Prep |
| Endgame | 8+ hours | Prestige Cycles, Collection |

---

## 3. PROGRESSION SYSTEMS

### 3.1 Epoch System (20 Epochs)

#### Ukrainian History (Epochs 1-12)
| Epoch | Name | Level Range | Theme |
|-------|------|-------------|-------|
| 1 | Trypillia | 1-50 | Neolithic Ukraine |
| 2 | Scythia | 51-100 | Ancient Nomads |
| 3 | Antiquity | 101-150 | Greek Colonies |
| 4 | Kyiv Rus | 151-250 | Medieval Kingdom |
| 5 | Halych-Volhynia | 251-320 | Principality |
| 6 | Polish-Lithuanian | 321-420 | Commonwealth |
| 7 | Cossack Era | 421-550 | Zaporizhian Sich |
| 8 | Hetmanate | 551-650 | Cossack State |
| 9 | Imperial Era | 651-780 | Russian Empire |
| 10 | Revolution | 781-850 | UNR Period |
| 11 | Soviet Era | 851-950 | USSR |
| 12 | Independence | 951-999 | Modern Ukraine |

#### World History (Epochs 13-20, unlocked via Prestige)
| Epoch | Unlock Requirement |
|-------|---------------------|
| 13-14 | Prestige 1 |
| 15-16 | Prestige 2 |
| 17-18 | Prestige 3 |
| 19 | Prestige 4 |
| 20 | Prestige 5 |

### 3.2 Generator System

Each epoch contains 5 generator tiers:

```
Tier 1 (Cheap): Base Cost 10, Production 2-40/sec
Tier 2: Base Cost 50, Production 8-160/sec  
Tier 3: Base Cost 300, Production 40-800/sec
Tier 4: Base Cost 3,000, Production 200-4,000/sec
Tier 5 (Expensive): Base Cost 30,000, Production 1,000-20,000/sec
```

**Cost Scaling:** `baseCost * 1.15^ownedLevel`

### 3.3 XP Curve

| Epoch | XP/Level (Early) | XP/Level (Late) | Est. Time/Epoch |
|-------|------------------|-----------------|-----------------|
| 1 | 60s | 300s | ~2.5 hours |
| 2 | 60s | 480s | ~3.75 hours |
| 3 | 120s | 900s | ~7 hours |
| 4+ | +60s/lvl | +600s/lvl | Progressive |

**Total time to Prestige:** ~15-20 hours for dedicated player

### 3.4 Prestige System

**Requirements:**
- Level ≥ 950
- Epoch = Independence (12)
- Reward: 10 Prestige Points per cycle

**Resets:**
- Level, Currency, Generators, Epoch
- Tap Power

**Preserves:**
- Artifacts (all progress)
- Prestige Research
- Referrals
- Daily Streaks

### 3.5 Museum Laboratory (Prestige Upgrades)

| Upgrade | Cost | Max | Effect |
|---------|------|-----|--------|
| Black Archaeology | 2 pts | 10 | +5% Rare Artifact Chance/level |
| World Expedition | 3 pts | 10 | +10% Passive Income/level |
| Chief Historian | 1 pt | 20 | +5% XP Gain/level |

### 3.6 Energy System (Post-Prestige 1)

- **Max Energy:** 1,000
- **Consumption:** -1 per tap
- **Regeneration:** +2 per 2 minutes (offline-capable)
- **Boost:** x5 XP multiplier when energy > 0

### 3.7 Artifact System

**Rarity Distribution:**
| Rarity | Drop Rate | Bonus | Stackable? |
|--------|-----------|-------|------------|
| Common | 60% | +5-8% | Yes (+10%/dupe) |
| Rare | 25% | +10-12% | Yes |
| Epic | 10% | +15% | Yes |
| Legendary | 4% | +20% | Yes |
| Secret | 1% | +15-20% | Yes |

**Levels:** 1-4 (10 → 20 → 35 → 55 total parts)

**Bonus Types:**
- XP Multiplier
- Currency Multiplier
- Passive Boost

### 3.8 Gacha System

**Costs:** 100 × (epochIndex + 1) currency

**Chests:** Server-authoritative RNG (Supabase Edge Function)

**Sit Studio Easter Egg:**
- 10 secret letters (S-I-T-[space]-S-T-U-D-I-O)
- 0.1% drop chance per chest
- Reward: x2 XP permanently

### 3.9 Daily Systems

**Daily Check-in:**
- 7-day cycle with escalating rewards
- Day 7: Special Gacha Ticket
- 500 → 5,000 currency progression

**Daily Tasks (3/day):**
- Deterministic selection (seeded by date)
- Tap counts, XP earning, purchases
- Currency rewards: 30-400

**Session Ads:**
- Trigger: 20 minutes of play
- Reward: x2 Income (pre-prestige) or +20 Energy (post-prestige)

**Chest Ads:**
- Trigger: Every 10th chest opened
- Reward: +5% rare chance or +10 energy

**Energy Restore Ads:**
- 5 per day limit
- +50 energy per ad

---

## 4. STRENGTHS

### 4.1 Unique Value Proposition
✅ **Educational + Entertainment hybrid** — Players learn Ukrainian history while playing  
✅ **Strong thematic cohesion** — Epochs tell chronological narrative  
✅ **Culturally authentic** — Localized content resonates with target audience  

### 4.2 Progression Design
✅ **Multi-layered systems** — Tap, generators, artifacts, prestige create depth  
✅ **Clear goals** — Level 960 + Epoch 12 = prestige unlock  
✅ **NG+ satisfaction** — Prestige feels rewarding, not punishing  
✅ **Dual progression** — Currency AND XP create parallel advancement tracks  

### 4.3 Monetization Integration
✅ **Non-intrusive ads** — Session/chest-based, respects player flow  
✅ **Premium option** — Telegram Stars for boosters  
✅ **Limit awareness** — Daily caps prevent fatigue  

### 4.4 Technical Architecture
✅ **Server-authoritative RNG** — Prevents cheat manipulation  
✅ **Dual storage** — Local (offline) + Remote (sync)  
✅ **React 18 + TypeScript** — Modern stack, maintainable  
✅ **Supabase backend** — Scalable, cost-effective  

### 4.5 Polish & UX
✅ **Haptic feedback** — Telegram HapticFeedback API integration  
✅ **Particle effects** — TapArea visual feedback  
✅ **Combo system** — 3+ rapid taps trigger combo indicator  
✅ **Offline gains** — Calculates passive income while away  
✅ **Daily streak protection** — Graceful streak management  

---

## 5. WEAKNESSES & RISKS

### 5.1 CRITICAL ISSUES

#### ⚠️ No Retention Mechanics Beyond Daily
**Problem:** Players who complete daily tasks have no incentive to return until next day  
**Impact:** D1/D7 retention will suffer  
**Fix Required:** Add限时 events, weekly goals, or seasonal content

#### ⚠️ Prestige is 15-20 Hour Grind
**Problem:** First prestige requires ~20 hours of active play  
**Impact:** Casual players will never experience world epochs (13-20)  
**Fix Required:** Either reduce requirement OR add early prestige options

#### ⚠️ Energy System Unbalanced
**Problem:** x5 multiplier with 1,000 energy allows 1,000 taps at 5x = 5,000 "free" levels  
**Impact:** Post-prestige feels disconnected from pre-prestige balance  
**Risk:** Economy inflation

#### ⚠️ Generator Costs Not Epoch-Scaled
**Problem:** Epoch 1 and Epoch 12 use same base costs  
**Impact:** Mid-game (epochs 4-8) becomes boring "farm epoch 1" loop  
**Fix Required:** Scale generator costs/rewards by epoch progression

### 5.2 MAJOR ISSUES

#### 🔸 Artifact Collection Feels Random/Frustrating
**Problem:** No pity system, no spark/guarantee system  
**Impact:** Players may never complete full collection  
**Fix Required:** Add pity counter or "universal fragments"

#### 🔸 No Social Features Beyond Referrals
**Problem:** No guilds, no co-op, no competitive events  
**Impact:** Limited viral growth, low LTV  
**Fix Required:** Add weekly leaderboards with rewards

#### 🔸 Sit Studio Easter Egg is Mathematically Impossible
**Problem:** 10 letters × 0.1% = 0.001^10 chance = effectively 0  
**Impact:** Easter egg exists but will never be found  
**Fix Required:** Either increase drop rate OR reduce letters needed

#### 🔸 No IAP Beyond Telegram Stars
**Problem:** No direct currency packs, no bundles  
**Impact:** Monetization ceiling is low  
**Fix Required:** Add starter packs, currency bundles

### 5.3 MINOR ISSUES

#### • Tutorial is Generic
**Problem:** TutorialModal exists but doesn't teach generator efficiency  
**Impact:** New players make suboptimal choices  
**Fix:** Add contextual tooltips

#### • No Sound/Haptic Settings
**Problem:** Haptics can't be disabled  
**Impact:** Accessibility issue  
**Fix:** Add settings panel

#### • Epoch Switching has No Cost/Cooldown
**Problem:** Players can farm lowest epoch forever  
**Impact:** Breaks epoch progression intent  
**Fix:** Add cooldown or level-locked switching

#### • Daily Tasks are Deterministic
**Problem:** All players get same tasks on same day  
**Impact:** No variety, exploits possible  
**Fix:** Add randomization seed per player

#### • Leaderboard Shows Only XP
**Problem:** Doesn't reflect prestige level or total playtime  
**Impact:** Unfair comparison for prestige players  
**Fix:** Add weighted scoring system

### 5.4 TECHNICAL DEBT

| Issue | Severity | Description |
|-------|----------|-------------|
| No test coverage | HIGH | Zero unit/integration tests |
| No error boundaries | MEDIUM | App crashes on edge cases |
| State not persisted properly | MEDIUM | Duplicate tab detection flaky |
| No analytics | HIGH | Can't measure retention cohorts |
| No A/B testing | MEDIUM | Can't optimize conversion |
| No crash reporting | MEDIUM | Sentry not configured |

---

## 6. PRODUCTION READINESS ASSESSMENT

### 6.1 Feature Completeness

| Feature | Status | Notes |
|---------|--------|-------|
| Core Tap Loop | ✅ Complete | Works, needs balance tuning |
| Generators | ✅ Complete | Functional but not epoch-scaled |
| Gacha System | ✅ Complete | Server-authoritative |
| Prestige System | ✅ Complete | 2-phase implementation |
| Energy System | ⚠️ Unbalanced | Needs rebalancing |
| Daily Systems | ⚠️ Incomplete | Missing retention hooks |
| Referral System | ✅ Complete | Basic implementation |
| Leaderboard | ✅ Complete | Functional |
| Ads Integration | ✅ Complete | AdsGram SDK |
| Telegram Payments | ✅ Complete | Stars integration |
| Offline Gains | ✅ Complete | Basic implementation |

### 6.2 Scalability Concerns

| Area | Current | Risk | Recommendation |
|------|---------|------|----------------|
| Database | Supabase Free | MEDIUM | Monitor usage, plan migration |
| Edge Functions | Serverless | LOW | Auto-scales |
| Client State | React local | LOW | OK for current scope |
| Storage | localStorage + Supabase | MEDIUM | Add size limits |

### 6.3 Security Assessment

| Issue | Status | Mitigation |
|-------|--------|------------|
| Client-side state | ⚠️ Partial trust | Server validates purchases |
| Ad rewards | ⚠️ Client-triggered | Server-side verification needed |
| Leaderboard | ⚠️ Spoofable | Add server-side score validation |
| Telegram auth | ✅ Secure | initData validation |

### 6.4 Competitive Analysis

**Direct Competitors:** None for Ukrainian historical tapper

**Indirect Competitors:**
| Game | Strength | Jolt Time Gap |
|------|----------|---------------|
| Travel Town | Retention loops | No events |
| Merge Mines | Progression pacing | Energy system broken |
| Royal Match | Level design | Generators need variety |
| AdCap | Monetization | No IAP depth |

### 6.5 Launch Readiness Score

| Category | Score | Weight | Weighted |
|----------|-------|--------|----------|
| Core Gameplay | 7/10 | 30% | 2.1 |
| Progression | 6/10 | 25% | 1.5 |
| Monetization | 5/10 | 20% | 1.0 |
| Retention | 4/10 | 15% | 0.6 |
| Technical | 6/10 | 10% | 0.6 |
| **TOTAL** | | | **5.8/10** |

**Assessment:** Pre-Alpha playable, needs 40% more work for soft launch

---

## 7. STRATEGIC RECOMMENDATIONS

### 7.1 Immediate Priorities (Pre-Launch)

1. **Rebalance Energy System**
   - Reduce multiplier to x2-3
   - OR increase energy cost per tap
   - Goal: Smooth transition between pre/post prestige

2. **Add Pity System to Gacha**
   - 50 chest pity for Epic+
   - 200 chest pity for Legendary
   - Prevents frustration

3. **Implement Analytics**
   - Mixpanel or Amplitude integration
   - Track D1/D7/D30 retention
   - Measure ad view completion rates

4. **Add Tutorial 2.0**
   - Explain generator synergies
   - Show "optimal" early game path
   - Reduce early confusion

### 7.2 Short-term (Post-Launch Month 1)

1. **Weekly Events**
   - Weekend 2x Currency
   - Themed epochs with bonus artifacts
   - Limited-time generators

2. **Guild System**
   - Shared artifact collection
   - Group challenges
   - Social retention

3. **Battle Pass**
   - Season 1: 30-day cycle
   - Premium track with Telegram Stars
   - Exclusive artifacts/rewards

### 7.3 Medium-term (Month 2-3)

1. **Worldwide Expansion**
   - English localization
   - Regional epochs (Poland, Russia, Hungary)
   - Cultural sensitivity review

2. **Competitive Mode**
   - Weekly leaderboard with rewards
   - Artifact-powered tournaments
   - Ranked prestige races

3. **IAP Store Expansion**
   - Starter packs
   - Currency bundles
   - Artifact packs

---

## 8. TECHNICAL NOTES

### 8.1 Architecture Summary

```
Frontend: React 18 + TypeScript + TailwindCSS
Build: Vite 5
Backend: Supabase (Postgres + Edge Functions)
Ads: AdsGram React SDK
Payments: Telegram Stars API
Auth: Telegram Mini App initData
Storage: localStorage (offline) + Supabase (sync)
```

### 8.2 File Structure Assessment

```
src/
├── components/    ✅ Well-organized by feature
├── hooks/         ⚠️ useGame.ts too large (500+ lines)
├── data/          ✅ Clean separation of epochs/tasks
├── types/         ✅ TypeScript-first design
├── lib/           ⚠️ Needs utils organization
├── services/     ✅ Service layer for external APIs
└── App.tsx        ⚠️ Too large (600+ lines)
```

### 8.3 Performance Considerations

- TapArea uses requestAnimationFrame for particles ✅
- Passive income calculated on interval ✅
- No virtualization for long lists ⚠️
- No lazy loading for modals ⚠️
- Bundle size not measured ⚠️

---

## 9. SUMMARY

**Jolt Time** is a well-architected, thematically cohesive tapper game with solid technical foundations. The progression systems show depth and the educational angle is genuinely unique.

**Key Strengths:**
- Strong Ukrainian history theme
- Multi-layered prestige loop
- Server-authoritative game logic
- Telegram platform integration

**Critical Gaps:**
- Retention mechanics underdeveloped
- Energy system balance issues
- No pity/rarity guarantees
- Missing social features

**Verdict:** The game is ready for **closed beta** with select Telegram community. Not ready for public soft launch without addressing retention and balance issues.

---

*Audit conducted by: Lead Game Designer*  
*Next document: 02_BALANCE_AUDIT.md*
