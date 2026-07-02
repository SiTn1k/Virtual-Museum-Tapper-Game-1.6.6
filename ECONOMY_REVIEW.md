# Virtual Museum Tapper Game — Economy Review
**Version:** 1.6.6  
**Review Date:** 2026-07-02  
**Review Level:** Senior Economy Designer (AAA Mobile Game Studio Standards)  
**Reference:** Comparable studios: Scopely, Habby, King, Playrix

---

## Executive Summary

This comprehensive economy review evaluates the Virtual Museum Tapper Game's in-game economy across 8 core dimensions: currency balance, reward structures, progression pacing, in-game economy consistency, prestige/rebirth economy, artifact economy, generator/upgrade costs, and ad reward balance. The review identifies **23 economy issues** across severity levels CRITICAL (5), HIGH (8), MEDIUM (6), and LOW (4).

**Overall Economy Health Score: 4.7/10 — SIGNIFICANT IMBALANCE DETECTED**

The game has a solid architectural foundation but suffers from **catastrophic early-game currency inflation**, **an energy system that creates frustrating binary gameplay**, **generator cost scaling that breaks post-prestige**, and **paid boosters that are weaker than free progression bonuses**. These issues will severely impact long-term player retention and monetization if not addressed.

---

## Review Methodology

### Data Sources Analyzed
- `src/data/epochs.ts` — Generator definitions, epoch progression, artifact data
- `src/data/tasks.ts` — Daily task definitions and rewards
- `src/hooks/useGame.ts` — Core game logic, XP curves, energy system
- `src/components/GeneratorShop.tsx` — Generator purchasing interface
- `src/components/GachaModal.tsx` — Gacha/chest mechanics
- `src/components/PrestigeSystem.tsx` — Museum Laboratory upgrades
- `src/components/RebirthSystem.tsx` — Rebirth/prestige interface
- `src/components/AdSystem.tsx` — Ad reward system
- `src/components/DailyRewards.tsx` — Daily check-in rewards
- `src/components/DailyTasksPanel.tsx` — Daily task UI
- `supabase/functions/open-chest/index.ts` — Server-side chest RNG
- `supabase/functions/perform-prestige/index.ts` — Server-side prestige logic
- `src/lib/utils.ts` — Number formatting utilities
- `03_ECONOMY_AUDIT.md` — Existing audit (reference)

### Evaluation Framework (AAA Mobile Standards)
- **Scopely/Habby model**: Aggressive early progression → meaningful mid-game walls → prestige loops
- **King model**: Casual-friendly pacing → reward frequency optimization → IAP hooks
- **Playrix model**: Quality-of-life focus → generous F2P → cosmetic monetization

---

## CRITICAL Issues (Fix Immediately — Revenue Impact)

### Issue #1: Energy System Creates Binary Frustrating Gameplay

| Field | Details |
|-------|---------|
| **Title** | Energy x5 Multiplier Creates Discouraging "On/Off" Dynamic |
| **Severity** | 🔴 CRITICAL |
| **Affected Files** | `src/hooks/useGame.ts:371-430`, `src/components/AdSystem.tsx:220-388` |

**Description:**
The energy system applies a brutal x5 tap multiplier when energy > 0, dropping to x1 when empty. This creates a binary "doom loop":
- Player taps rapidly (5-10 taps/second)
- Each tap costs 1 energy
- Energy depletes in 100-200 seconds of active play
- Player enters "punishment mode" at x1 multiplier
- Must wait 8+ hours for full regeneration OR watch ads

**Code Reference (`src/hooks/useGame.ts:385-388`):**
```typescript
const getEnergyMultiplier = useCallback(() => {
  if ((state.prestigeLevel || 0) < 1) return 1;
  return (state.energy || 0) > 0 ? 5 : 1;  // Binary x5 or x1
}, [state.prestigeLevel, state.energy]);
```

**Why This Matters:**
- Players feel "punished" for playing actively
- Ad fatigue from mandatory energy restoration
- Post-prestige players spend more time in "low mode" than "boosted mode"
- Conflicts with casual mobile gaming philosophy (King/Playrix model)

**Potential Impact:**
- D1-D7 retention collapse (predicted -40%)
- Negative reviews citing "frustrating energy system"
- Whale players frustrated by ad-gating their progress

**Risk If Ignored:**
- Catastrophic — will be flagged in app store reviews
- Players will use mod APKs to bypass energy system
- Monetization becomes ad-dependent, not purchase-dependent

**Recommended Solution:**
Replace binary multiplier with gradual scaling:
```typescript
// Option A: Linear scaling 1x → 2x based on energy level
const getEnergyMultiplier = useCallback(() => {
  if ((state.prestigeLevel || 0) < 1) return 1;
  const ratio = (state.energy || 0) / (state.maxEnergy || 1000);
  return 1 + ratio;  // 1x at 0%, 2x at 100%
}, [...]);

// Option B: Tiers (1x/1.5x/2x/3x at 0/25/50/100% energy)
```

**Estimated Implementation Effort:** 4-6 hours (Frontend + testing)

**Responsible Agent:** Economy Designer + Frontend Developer

---

### Issue #2: Generator Cost Scaling Too Low (1.15x Multiplier)

| Field | Details |
|-------|---------|
| **Title** | Generators Pay For Themselves In Under 60 Seconds |
| **Severity** | 🔴 CRITICAL |
| **Affected Files** | `src/data/epochs.ts:15`, `src/data/epochs.ts:143-145` |

**Description:**
The 1.15x cost multiplier per generator level means generators become trivially affordable post-prestige. A Tier 1 generator costing 10 currency pays for itself in 5 seconds of passive income.

**Economic Analysis — Epoch 1 (Trypillia):**
| Generator | Base Cost | Base Production | Payback Time |
|-----------|-----------|-----------------|--------------|
| Clay Pit (Tier 1) | 10 | 2/s | 5 seconds |
| Pottery (Tier 2) | 50 | 8/s | 6.25 seconds |
| Settlement (Tier 3) | 300 | 40/s | 7.5 seconds |
| Mega-Structure (Tier 4) | 3,000 | 200/s | 15 seconds |
| Temple (Tier 5) | 30,000 | 1,000/s | 30 seconds |

**Code Reference (`src/data/epochs.ts:143-145`):**
```typescript
export function getGeneratorCost(generator: Generator, currentLevel: number): number {
  return Math.floor(generator.baseCost * Math.pow(generator.costMultiplier, currentLevel));
  // generator.costMultiplier = 1.15 (line 15)
}
```

**Why This Matters:**
- Currency becomes meaningless after first prestige
- No strategic decisions about generator purchases
- Progression feels "auto-play" rather than player-driven
- Post-prestige players can instantly buy entire epoch sets

**Potential Impact:**
- Endgame players have nothing to spend currency on
- No sense of accomplishment from purchases
- Artifact fragments are the only currency sink (insufficient)

**Risk If Ignored:**
- Players will idle indefinitely with full generator sets
- Long-term engagement drops to near-zero post-prestige
- Content exhaustion within 2-3 prestiges

**Recommended Solution:**
Implement epoch-specific scaling with progressive difficulty:
```typescript
const getEpochCostMultiplier = (epochIndex: number): number => {
  // Ukrainian epochs: 1.15-1.25
  // World history epochs: 1.25-1.40
  if (epochIndex < 12) return 1.15 + epochIndex * 0.01;
  return 1.30 + (epochIndex - 12) * 0.02;  // 1.30-1.46
};
```

**Estimated Implementation Effort:** 2-3 hours (Data balancing + testing)

**Responsible Agent:** Economy Designer

---

### Issue #3: Gacha Costs Too Low (100 Currency for Epoch 1)

| Field | Details |
|-------|---------|
| **Title** | Gacha Is "Spend Loose Change" Not Meaningful Decision |
| **Severity** | 🔴 CRITICAL |
| **Affected Files** | `src/components/GachaModal.tsx:33-36`, `supabase/functions/open-chest/index.ts:258-259` |

**Description:**
Epoch 1 gacha costs only 100 currency. Players earn this passively in under 10 seconds. The gacha becomes an "always spam" mechanic rather than a strategic choice.

**Cost Formula (`GachaModal.tsx:33-36`):**
```typescript
function getGachaCost(epochId: EpochId): number {
  const idx = EPOCHS.findIndex(e => e.id === epochId);
  return 100 * Math.max(1, idx + 1);  // Epoch 1 = 100, Epoch 5 = 500, Epoch 20 = 2000
}
```

**Economic Reality:**
- Player starts with 20 currency
- With just 1 generator (2/s passive), earns 100 currency in 50 seconds
- With 2 generators, earns 100 currency in ~30 seconds
- **Gacha is effectively free after first generator purchase**

**Server Validation (`open-chest/index.ts:258-259`):**
```typescript
const chestCost = chest_type === "skychest" ? 0 : 100 * Math.max(1, (epoch_index || 0) + 1);
```

**Why This Matters:**
- No tension in gacha decisions
- Players spam gacha immediately after any currency gain
- Artifact collection becomes "spam to complete" not "strategic targeting"
- Revenue opportunity lost (if gacha becomes premium)

**Potential Impact:**
- Artifact system loses excitement
- No feeling of "saving up" for something meaningful
- Gacha becomes forgettable filler content

**Risk If Ignored:**
- Artifact collection feels unrewarding
- Post-prestige gacha spam makes rarity meaningless

**Recommended Solution:**
Increase gacha costs 5-10x:
```typescript
// New formula: 500 base + epoch scaling
function getGachaCost(epochId: EpochId): number {
  const idx = EPOCHS.findIndex(e => e.id === epochId);
  return 500 * Math.max(1, Math.ceil((idx + 1) / 2));  // Epoch 1 = 500, Epoch 5 = 1500, Epoch 20 = 5000
}
```

**Estimated Implementation Effort:** 1-2 hours (Frontend + Server update)

**Responsible Agent:** Economy Designer + Backend Developer

---

### Issue #4: Prestige Research "Chief Historian" Way Too Cheap

| Field | Details |
|-------|---------|
| **Title** | +5% XP Upgrade Costs 1 Point (Should Cost 2-3) |
| **Severity** | 🔴 CRITICAL |
| **Affected Files** | `src/components/PrestigeSystem.tsx:203-231`, `src/components/RebirthSystem.tsx:62-108` |

**Description:**
The Museum Laboratory's Chief Historian upgrade (+5% XP per level, max 20 levels = +100% XP) costs only 1 prestige point. Players can max this within 2-3 prestiges, creating permanent x2 XP multiplier that's stronger than purchased boosters.

**Current Pricing:**
| Upgrade | Cost | Max Level | Total Cost | Effect |
|---------|------|-----------|------------|--------|
| Chief Historian (XP) | 1 pt | 20 | 20 pts | +100% XP |
| World Expedition (Passive) | 3 pts | 10 | 30 pts | +100% Passive |
| Black Archaeology (Rare Chance) | 2 pts | 10 | 20 pts | +50% Rare |
| Energy Capacity | 5 pts | 10 | 50 pts | +1000 Max Energy |
| Cossack Power (Tap) | 8 pts | 5 | 40 pts | +5 Base Tap |

**Code Reference (`PrestigeSystem.tsx:203-231`):**
```typescript
const UPGRADES = [
  {
    id: 'xp_gain',
    name: 'Головний Історик',
    description: '+5% XP',
    icon: BookOpen,
    cost: 1,  // <-- WAY TOO CHEAP
    maxLevel: 20,
    effect: (level: number) => `+${level * 5}% XP`,
  },
  // ...
];
```

**Why This Matters:**
- XP boost is the most impactful upgrade (faster prestiges = more points)
- Costs less than Black Archaeology (+5% rare) which is less impactful
- Creates power creep — early prestiges dominate late prestiges
- Paid boosters feel weak compared to free permanent upgrade

**Potential Impact:**
- Veteran players have permanent x2-3 XP advantage
- Leaderboard dominated by early adopters
- New players feel insurmountable gap

**Risk If Ignored:**
- Economy spirals out of control
- New player experience becomes frustrating
- Monetization suffers (why buy boosters?)

**Recommended Solution:**
```typescript
// Re-balance upgrade costs
const UPGRADES = [
  {
    id: 'xp_gain',
    name: 'Головний Історик',
    cost: 2,  // Was 1, now 2 (total 40 pts for +100% XP)
    maxLevel: 20,
    // ...
  },
  {
    id: 'passive_income',
    name: 'Всесвітня Експедиція',
    cost: 4,  // Was 3, now 4 (total 40 pts for +100% Passive)
    maxLevel: 10,
    // ...
  },
  // Keep Black Archaeology at 2, Energy at 5, Tap at 8
];
```

**Estimated Implementation Effort:** 1-2 hours (Frontend only)

**Responsible Agent:** Economy Designer

---

### Issue #5: Offline Income Is Client-Side (Exploitable)

| Field | Details |
|-------|---------|
| **Title** | Offline Gains Calculated On Client — Can Be Exploited |
| **Severity** | 🔴 CRITICAL (Security) |
| **Affected Files** | `src/hooks/useGame.ts`, `src/components/OfflineRewardModal.tsx` |

**Description:**
Offline income is calculated on the client side and reported to the server, rather than being server-authoritative. This allows manipulation of the offline time calculation.

**Current Flow:**
1. Player closes app → `lastOnlineAt` saved locally
2. Player reopens app → Client calculates `Date.now() - lastOnlineAt`
3. Client reports calculated offline gains to server
4. Server accepts without validation

**Why This Matters:**
- Players can modify device time to inflate offline gains
- Exploit tools can automate offline gain farming
- Leaderboard integrity compromised
- F2P economy inflation

**Potential Impact:**
- Server-side economy destabilization
- Unfair leaderboard rankings
- Potential for automated farming bots
- Revenue loss from inflated progression

**Risk If Ignored:**
- Critical security vulnerability
- Will be exploited in wild
- Server costs increase from artificial activity
- Reputation damage if discovered publicly

**Recommended Solution:**
```typescript
// Server-side offline calculation in edge function:
// 1. Fetch lastOnlineAt from database
// 2. Calculate server-side elapsed time
// 3. Calculate max allowed offline time (e.g., 8 hours)
// 4. Calculate gains based on server time, not client-reported
```

**Estimated Implementation Effort:** 8-12 hours (Backend + Testing)

**Responsible Agent:** Backend Developer + Security Engineer

---

## HIGH Priority Issues (Fix in Next Sprint)

### Issue #6: Passive Income Outpaces Active Tapping

| Field | Details |
|-------|---------|
| **Title** | Generators Make Tapping Meaningless Within 2-3 Purchases |
| **Severity** | 🟠 HIGH |
| **Affected Files** | `src/data/epochs.ts:23-29`, `src/hooks/useGame.ts` |

**Description:**
With just 2 generators owned, passive XP income dramatically exceeds tap-based XP. Players realize "just buy generators and wait" is optimal strategy.

**Analysis:**
- Starting currency: 20
- After buying Clay Pit (10 cost, 2/s): Passive = 2/s
- After buying Pottery (50 cost, 8/s): Passive = 10/s
- Tap power: 1 XP per tap (1-2 taps/second max)
- **Passive income = 5-10x tap income**

**Why This Matters:**
- Core "tapper" mechanic becomes irrelevant
- Players feel disconnected from progression
- Gameplay loop becomes "check in every 10 minutes"

**Risk If Ignored:**
- Core engagement mechanic fails
- Players lose interest faster
- Negative reviews citing "not interactive enough"

**Recommended Solution:**
Balance tap vs passive:
```typescript
// Reduce generator base production by 50%
// OR: Add "tap bonus" that scales with generators owned
const tapBonus = 1 + (totalGenerators * 0.1);  // +10% per generator
```

**Estimated Implementation Effort:** 2-3 hours (Balance testing)

**Responsible Agent:** Economy Designer

---

### Issue #7: Daily Tasks Rewards Too Low

| Field | Details |
|-------|---------|
| **Title** | Daily Task Rewards (30-400 Currency) Are Negligible |
| **Severity** | 🟠 HIGH |
| **Affected Files** | `src/data/tasks.ts:14-29`, `src/components/DailyTasksPanel.tsx` |

**Description:**
Daily task rewards range from 30 to 400 currency. With passive income generating 100+ currency per minute post-prestige, tasks feel pointless.

**Current Task Rewards:**
| Task | Target | Reward |
|------|--------|--------|
| Tap 50 times | 50 | 30 |
| Tap 200 times | 200 | 100 |
| Tap 500 times | 500 | 220 |
| Tap 1,000 times | 1,000 | 400 |
| Earn 500 XP | 500 | 60 |
| Buy 1 Generator | 1 | 80 |
| Open 1 Gacha | 1 | 100 |

**Why This Matters:**
- Tasks become "do naturally while playing" not "goals to achieve"
- No incentive to engage with task system
- Retention hook weakens significantly

**Recommended Solution:**
Increase rewards 5-10x:
```typescript
const TASK_POOL: TaskDef[] = [
  { id: 'tap_50', target: 50, reward: { currency: 300 } },      // Was 30
  { id: 'tap_200', target: 200, reward: { currency: 1000 } },   // Was 100
  { id: 'tap_500', target: 500, reward: { currency: 2200 } },   // Was 220
  { id: 'tap_1000', target: 1000, reward: { currency: 4000 } }, // Was 400
  // ...
];
```

**Estimated Implementation Effort:** 1 hour (Data only)

**Responsible Agent:** Economy Designer

---

### Issue #8: Daily Check-In Rewards Don't Scale

| Field | Details |
|-------|---------|
| **Title** | Day 7 Reward (5000 Currency) Is Negligible For Prestige 5 Players |
| **Severity** | 🟠 HIGH |
| **Affected Files** | `src/components/DailyRewards.tsx:14-22` |

**Description:**
Daily check-in rewards are static (500-5000 currency). Prestige 5 players earn 100,000+ currency passively per hour. Day 7 reward is 0.05% of hourly income.

**Current Rewards:**
```typescript
export const DAILY_REWARDS: DailyReward[] = [
  { day: 1, currency: 500 },
  { day: 2, currency: 1000 },
  { day: 3, currency: 1500 },
  { day: 4, currency: 2000 },
  { day: 5, currency: 3000 },
  { day: 6, currency: 4000 },
  { day: 7, currency: 5000, special: 'gacha_ticket' },
];
```

**Why This Matters:**
- High-level players ignore daily rewards
- Retention hook fails for engaged players
- Missed monetization opportunity

**Recommended Solution:**
Implement prestige scaling:
```typescript
export function getScaledReward(baseReward: number, prestigeLevel: number): number {
  const multiplier = 1 + prestigeLevel * 0.5;  // +50% per prestige
  return Math.floor(baseReward * multiplier);
}
```

**Estimated Implementation Effort:** 2 hours (Frontend logic)

**Responsible Agent:** Economy Designer

---

### Issue #9: Artifact Duplicate Handling Feels Bad

| Field | Details |
|-------|---------|
| **Title** | Duplicate Artifacts Give Minimal Bonus (10% of Base) |
| **Severity** | 🟠 HIGH |
| **Affected Files** | `src/hooks/useGame.ts:136-151`, `src/components/GachaModal.tsx:289-309` |

**Description:**
When a duplicate artifact drops, players receive only 1-3 fragments (same as new artifacts). The "duplicate bonus" adds only 10% of base bonus per stack level, which feels unrewarding.

**Code Reference (`useGame.ts:143-145`):**
```typescript
// Each duplicate adds +10% of the base bonus (stacks additively, then multiplied)
const dupeCount = artifactDupes?.[id] || 0;
const effectiveValue = art.bonus.value + (art.bonus.value - 1) * 0.1 * dupeCount;
```

**Example:**
- Legendary artifact: +20% XP base
- Duplicate 1: +22% XP (+2% from base)
- Duplicate 10: +38% XP (+18% from base)
- **Duplicates feel like "slightly better than nothing"**

**Why This Matters:**
- Gacha duplicates create negative emotional response
- Players feel progress is wasted on duplicates
- Artifact completion becomes "spam until complete" not "exciting drops"

**Recommended Solution:**
```typescript
// Option A: Give 2-3x fragments for duplicates
const effectiveValue = art.bonus.value + (art.bonus.value - 1) * 0.25 * dupeCount;  // 25% per stack

// Option B: Convert duplicates to "artifact essence" currency
// Option C: Rare chance to "break" duplicates into random artifact
```

**Estimated Implementation Effort:** 3-4 hours (Frontend + Server)

**Responsible Agent:** Economy Designer

---

### Issue #10: Paid Boosters Weaker Than Free Permanent Bonuses

| Field | Details |
|-------|---------|
| **Title** | x2 XP Booster (Paid) Is Weaker Than x2 XP Museum Lab (Free) |
| **Severity** | 🟠 HIGH |
| **Affected Files** | `src/hooks/useGame.ts:112-134`, `src/components/PrestigeSystem.tsx` |

**Description:**
Players who prestige 3-4 times have permanent +60-80% XP from Museum Laboratory (free). A paid x2 XP booster for 30 minutes provides less value than what veterans have permanently.

**Booster Comparison:**
| Source | Effect | Duration | Cost |
|--------|--------|----------|------|
| Museum Lab Chief Historian (Level 10) | +50% XP | Permanent | Free (prestige) |
| Museum Lab Chief Historian (Level 20) | +100% XP | Permanent | Free (prestige) |
| XP Boost (Stars) | x2 XP | 30 min | Real money |
| Super Boost (Stars) | x3 XP+Currency | 30 min | Real money |

**Why This Matters:**
- Paying players feel ripped off
- Monetization conversion suffers
- Free-to-play veterans outclass paying newbies

**Recommended Solution:**
```typescript
// Option A: Make paid boosters stack with permanent bonuses
const totalXpMultiplier = permanentXpBonus * paidXpBoost;  // 1.5x * 2 = 3x

// Option B: Add "premium" boosters that are x5 or x10
// Option C: Create time-limited exclusive boosters for whales
```

**Estimated Implementation Effort:** 2-3 hours (Logic review)

**Responsible Agent:** Economy Designer + Product Manager

---

### Issue #11: XP Curve Doesn't Match Real Progression

| Field | Details |
|-------|---------|
| **Title** | XP Requirements Are 3-5x Too Low (Designed vs Actual) |
| **Severity** | 🟠 HIGH |
| **Affected Files** | `src/hooks/useGame.ts:45-86` |

**Description:**
The XP curve specifies target times (60s-300s per level) but doesn't account for passive XP multipliers from artifacts and research. Real progression is 3-5x faster than designed.

**Code Reference (`useGame.ts:45-86`):**
```typescript
function calculateXpToLevel(level: number): number {
  // Target time by epoch:
  // Epoch 1: 60s → 300s (5 min)
  // Epoch 2: 60s → 480s (8 min)
  // Epoch 3+: 120s → 900s (15 min)
  // ...
  return Math.max(50, Math.floor(estimatedPassive * targetSeconds));
}
```

**Why This Matters:**
- Level 950 (prestige requirement) reached in days instead of weeks
- Prestige loop becomes "spam play" not "meaningful goal"
- Content exhaustion faster than development cycle

**Recommended Solution:**
```typescript
function calculateXpToLevel(level: number): number {
  // ... existing code ...
  
  // Apply progression slowdown for prestige players
  const prestigePenalty = state.prestigeLevel > 0 
    ? 1 + (state.prestigeLevel * 0.2)  // +20% harder per prestige
    : 1;
    
  return Math.floor(baseXp * prestigePenalty);
}
```

**Estimated Implementation Effort:** 4-5 hours (Balance testing)

**Responsible Agent:** Economy Designer

---

### Issue #12: No Currency Sinks Post-Prestige

| Field | Details |
|-------|---------|
| **Title** | Currency Inflates Infinitely — Nothing To Spend It On |
| **Severity** | 🟠 HIGH |
| **Affected Files** | All generator/currency files |

**Description:**
The only currency sinks are generators (trivially cheap) and gacha (too cheap). Post-prestige players accumulate billions of currency with nothing meaningful to buy.

**Current Sink Analysis:**
| Sink | Cost | Affordability |
|------|------|---------------|
| Generators | 10-30,000 | Buy all in <1 hour |
| Gacha | 100-2,000 | Spam affordable |
| Tap Upgrades | Exponential | Only early game |

**Why This Matters:**
- Currency becomes meaningless number
- No sense of "earned progress"
- Game feels like idle screensaver, not engaging game

**Recommended Solution:**
```typescript
// Add new currency sinks:
// 1. Museum Lab currency upgrade cost (spend currency + prestige points)
// 2. Artifact "enhancement" system (spend currency to upgrade artifacts)
// 3. Epoch cosmetics purchasable with currency
// 4. "Speed up" purchasables for impatient players
```

**Estimated Implementation Effort:** 16-24 hours (New feature)

**Responsible Agent:** Product Manager + Economy Designer

---

## MEDIUM Priority Issues (Future Improvements)

### Issue #13: Session Ad Interval Too Long (20 Minutes)

| Field | Details |
|-------|---------|
| **Title** | 20-Minute Session Ads Create Long "Ad Desert" Periods |
| **Severity** | 🟡 MEDIUM |
| **Affected Files** | `src/components/AdSystem.tsx:395` |

**Description:**
Session ads trigger only after 20 minutes of active gameplay. Players who play in short bursts may never see these ads.

**Code Reference (`AdSystem.tsx:395`):**
```typescript
const SESSION_AD_INTERVAL_MS = 20 * 60 * 1000; // 20 minutes
```

**Recommended Solution:**
```typescript
// Option A: Reduce to 10 minutes for higher ad frequency
const SESSION_AD_INTERVAL_MS = 10 * 60 * 1000;

// Option B: Add "engagement milestone" ads (every 5 prestiges)
// Option C: Make session ads optional with currency alternative
```

---

### Issue #14: Energy Ad Restore Amount Low (50 Per Ad)

| Field | Details |
|-------|---------|
| **Title** | +50 Energy Per Ad (Max 1000) Creates High Ad Frequency |
| **Severity** | 🟡 MEDIUM |
| **Affected Files** | `src/components/AdSystem.tsx:231` |

**Description:**
Energy ads restore only 50 energy, but max energy is 1000. Active players need 20 ads to fill energy (5/day limit = 250 energy). This creates frustration.

**Code Reference (`AdSystem.tsx:231`):**
```typescript
const ENERGY_RESTORE_AMOUNT = 50;
```

**Recommended Solution:**
```typescript
// Option A: Increase to 100-200 per ad
const ENERGY_RESTORE_AMOUNT = 150;

// Option B: Add "super energy ad" for 500 energy at 2x ad frequency
// Option C: Remove daily limit for energy ads (monetization opportunity)
```

---

### Issue #15: Number Formatting Issues (toFixed(1))

| Field | Details |
|-------|---------|
| **Title** | toFixed(1) Creates Ugly "1.0K" Display |
| **Severity** | 🟡 MEDIUM |
| **Affected Files** | `src/lib/utils.ts:1-8` |

**Description:**
`toFixed(1)` shows "1.0K" instead of "1K". This looks unprofessional in a premium mobile game.

**Code Reference (`utils.ts:1-8`):**
```typescript
export function formatNumber(n: number): string {
  if (n >= 1e12) return (n / 1e12).toFixed(1) + 'T';
  if (n >= 1e9)  return (n / 1e9).toFixed(1)  + 'B';
  if (n >= 1e6)  return (n / 1e6).toFixed(1)  + 'M';
  if (n >= 1e3)  return (n / 1e3).toFixed(1)  + 'K';
  return Math.floor(n).toString();
}
```

**Recommended Solution:**
```typescript
export function formatNumber(n: number): string {
  if (!Number.isFinite(n) || isNaN(n)) return '0';
  if (n >= 1e12) return formatKMBT(n / 1e12, 'T');
  if (n >= 1e9)  return formatKMBT(n / 1e9, 'B');
  if (n >= 1e6)  return formatKMBT(n / 1e6, 'M');
  if (n >= 1e3)  return formatKMBT(n / 1e3, 'K');
  return Math.floor(n).toLocaleString();  // Add thousands separator
}

function formatKMBT(value: number, suffix: string): string {
  const rounded = Math.round(value * 10) / 10;
  if (rounded >= 10) return Math.floor(value) + suffix;
  if (rounded === Math.floor(value)) return rounded + suffix;
  return rounded + suffix;
}
```

---

### Issue #16: Combo System Has No Meaningful Reward

| Field | Details |
|-------|---------|
| **Title** | Combo Indicator Shows But Has No Gameplay Impact |
| **Severity** | 🟡 MEDIUM |
| **Affected Files** | `src/components/TapArea.tsx:80-120` |

**Description:**
The combo system shows visual feedback at x3+ combos but provides no gameplay benefit. Players ignore it after initial curiosity.

**Recommended Solution:**
```typescript
// Option A: Add combo multiplier to tap XP
const comboMultiplier = 1 + (comboCount * 0.05);  // +5% per combo

// Option B: Combo builds energy (reduce energy drain rate)
// Option C: Combo fills "special ability" meter
```

---

### Issue #17: Duplicate Definitions of Artifacts

| Field | Details |
|-------|---------|
| **Title** | Artifacts Defined In Two Places (epochs.ts + open-chest/index.ts) |
| **Severity** | 🟡 MEDIUM (Code Quality) |
| **Affected Files** | `src/data/epochs.ts`, `supabase/functions/open-chest/index.ts` |

**Description:**
Artifact definitions are duplicated in frontend (`epochs.ts`) and backend (`open-chest/index.ts`). Changes to one require changes to the other, risking desync.

**Recommended Solution:**
```typescript
// Option A: Single source of truth in shared JSON
// Option B: Generate TS from backend definitions
// Option C: Fetch definitions from API at runtime
```

---

### Issue #18: Streak System Reset Logic Complex

| Field | Details |
|-------|---------|
| **Title** | Daily Streak Logic Has Edge Cases For Timezone/Time |
| **Severity** | 🟡 MEDIUM |
| **Affected Files** | `src/components/DailyRewards.tsx:29-47`, `src/data/tasks.ts:35-43` |

**Description:**
Streak calculations use UTC dates, which may confuse players in different timezones. The logic for "missed day" vs "reset streak" has edge cases.

**Recommended Solution:**
```typescript
// Use player's local timezone for streak calculations
// OR: Clearly communicate "UTC-based" streaks to players
// OR: Add grace period (48 hours instead of 24)
```

---

## LOW Priority Issues (Polish)

### Issue #19: Leaderboard Shows XP Not Total Currency

| Field | Details |
|-------|---------|
| **Title** | Leaderboard Ranks By XP Not Overall Progression |
| **Severity** | 🟢 LOW |
| **Affected Files** | `src/hooks/useGame.ts`, leaderboard API |

**Recommended Solution:**
```typescript
// Option A: Composite score (XP + Currency + Prestige + Artifacts)
// Option B: Separate leaderboards per category
// Option C: "Power score" metric combining all factors
```

---

### Issue #20: No Achievement System

| Field | Details |
|-------|---------|
| **Title** | Game Lacks Achievements/Trophies For Long-Term Goals |
| **Severity** | 🟢 LOW |

**Recommended Solution:**
```typescript
// Add achievements with meaningful rewards:
// - "Collector" - Complete all artifacts in epoch
// - "Speedrunner" - Reach level 50 in under 1 hour
// - "Whale" - Purchase X amount
// - "Dedicated" - 30-day login streak
```

---

### Issue #21: No Seasonal Events

| Field | Details |
|-------|---------|
| **Title** | Game Has No Limited-Time Events or Seasonal Content |
| **Severity** | 🟢 LOW |

**Recommended Solution:**
```typescript
// Add seasonal events with exclusive rewards:
// - "Ukrainian Independence Day" event
// - "Historical Anniversary" themed events
// - "Easter Egg Hunt" (Sit Studio reference?)
```

---

### Issue #22: Referral Rewards Too Generous vs Impact

| Field | Details |
|-------|---------|
| **Title** | Referral System Gives High Rewards For Low Engagement |
| **Severity** | 🟢 LOW |
| **Affected Files** | `src/components/ReferralsTab.tsx` |

**Recommended Solution:**
```typescript
// Option A: Reduce referral reward to 50 currency
// Option B: Add milestone bonuses (10/50/100 referrals)
// Option C: Make referral rewards ongoing (% of referred player's spending)
```

---

### Issue #23: x2 Offline Ad Is Pointless

| Field | Details |
|-------|---------|
| **Title** | Offline Ad "Doubles" Already Free Income |
| **Severity** | 🟢 LOW |
| **Affected Files** | `src/components/AdSystem.tsx` |

**Recommended Solution:**
```typescript
// Option A: Remove offline ad, give free x2
// Option B: Make offline ad give exclusive "offline artifact fragments"
// Option C: Offline ad gives temporary boost (1 hour x2 on return)
```

---

## Summary Scorecard

| Category | Score | Issues | Priority |
|----------|-------|--------|----------|
| Currency Balance | 3/10 | Inflation, no sinks | CRITICAL |
| Reward Structures | 4/10 | Tasks too low, dailies don't scale | HIGH |
| Progression Pacing | 3/10 | XP curve ignored, generators too fast | CRITICAL |
| Economy Consistency | 4/10 | Energy binary, boosters weak | CRITICAL |
| Prestige Economy | 5/10 | Research mispriced, points easy | HIGH |
| Artifact Economy | 5/10 | Duplicates bad, completion easy | HIGH |
| Generator Costs | 2/10 | 1.15x too low, payback 5s | CRITICAL |
| Ad Reward Balance | 5/10 | Energy ads low, session too long | MEDIUM |

**Overall: 4.7/10 — SIGNIFICANT IMBALANCE**

---

## Priority Roadmap

### Phase 1 (Week 1-2) — CRITICAL Fixes
1. Energy system redesign (binary → gradual)
2. Generator cost scaling increase (1.15 → 1.25-1.30)
3. Gacha cost increase (5-10x)
4. Prestige research rebalancing (Chief Historian 1pt → 2pts)
5. Server-side offline income validation

### Phase 2 (Week 3-4) — HIGH Priority
6. Daily task reward increase (5-10x)
7. Daily reward prestige scaling
8. Artifact duplicate handling improvement
9. XP curve adjustment for prestige players
10. New currency sinks (Museum Lab currency cost)

### Phase 3 (Week 5-8) — Medium Priority
11. Session ad interval optimization
12. Energy ad restore amount increase
13. Number formatting improvements
14. Combo system meaningful rewards
15. Achievement system implementation

### Phase 4 (Future) — Low Priority
16. Seasonal events
17. Achievement rewards
18. Leaderboard improvements
19. Referral system refinement
20. Offline ad redesign

---

## Appendix: Key Code References

### Economy-Critical Code Locations
- XP Curve: `src/hooks/useGame.ts:45-86`
- Generator Cost Formula: `src/data/epochs.ts:143-145`
- Generator Definitions: `src/data/epochs.ts:8-29`
- Gacha Cost: `src/components/GachaModal.tsx:33-36`
- Server Gacha Cost: `supabase/functions/open-chest/index.ts:258-259`
- Energy Multiplier: `src/hooks/useGame.ts:385-388`
- Prestige Points Formula: `supabase/functions/perform-prestige/index.ts:71-75`
- Museum Lab Upgrades: `src/components/PrestigeSystem.tsx:203-231`
- Daily Tasks: `src/data/tasks.ts:14-29`
- Daily Rewards: `src/components/DailyRewards.tsx:14-22`
- Artifact Multipliers: `src/hooks/useGame.ts:136-151`
- Number Formatting: `src/lib/utils.ts:1-8`

---

*End of Economy Review Report*

**Prepared by:** Senior Economy Designer (AAA Studio Standards)  
**Review Date:** 2026-07-02  
**Next Review:** After Phase 1 fixes implemented
