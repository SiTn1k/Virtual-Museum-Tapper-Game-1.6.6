# Virtual Museum Tapper Game — A/B Test Plan

**Report Date:** July 2, 2026  
**Director Level:** Executive Producer  
**Game Version:** 1.6.6 + LiveOps Expansion  
**Classification:** Internal Strategy Document

---

## Executive Summary

The Virtual Museum Tapper Game has an **A/B testing framework** that enables systematic experimentation across all game systems. This plan outlines the testing roadmap for optimizing retention, monetization, and player experience.

**A/B Test Readiness: 8/10**

---

## 1. Purpose

### Player Benefit
- **Better experience** through continuous optimization
- **Balanced gameplay** through data-driven tuning
- **Personalized content** through variant testing
- **Reduced frustration** through optimal difficulty

### Business Benefit
- **Evidence-based decisions** through statistical rigor
- **Risk mitigation** through controlled rollouts
- **Continuous improvement** through testing culture
- **ROI optimization** through systematic experimentation

### Architecture Impact
- **A/B test framework** in `src/types/liveops.ts`
- **Variant assignment** in `src/services/analytics.ts`
- **Database tables** for test configuration
- **Assignment tracking** for conversion

---

## 2. A/B Testing Framework

### 2.1 Test Configuration
```typescript
interface ABTestConfig {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'paused' | 'completed';
  variants: ABTestVariant[];
  primaryMetric: string;
  minimumSampleSize?: number;
}
```

### 2.2 Variant Structure
```typescript
interface ABTestVariant {
  id: string;
  name: string;
  weight: number; // 0-100 traffic allocation
  config: Record<string, unknown>; // Variant-specific settings
}
```

### 2.3 Assignment Logic
- Deterministic hashing by telegram_id + test_id
- Consistent assignment across sessions
- Traffic allocation respected
- Override capability for QA

---

## 3. Economy Experiments

### 3.1 Daily Reward Amounts
```
Test ID: economy_daily_reward_v1
Hypothesis: Higher daily rewards improve D1 retention
Control: 500 currency/day
Treatment A: 750 currency/day
Treatment B: 1000 currency/day
Primary Metric: D1 retention
Minimum Sample: 1,000 per variant
Expected Impact: +5% D1 retention
```

### 3.2 Generator Cost Scaling
```
Test ID: economy_generator_cost_v1
Hypothesis: Faster generator progression increases engagement
Control: 1.15x cost multiplier
Treatment A: 1.12x cost multiplier
Treatment B: 1.10x cost multiplier
Primary Metric: Generators purchased per session
Minimum Sample: 2,000 per variant
Expected Impact: +15% generator purchases
```

### 3.3 Gacha Rates
```
Test ID: economy_gacha_rates_v1
Hypothesis: Better rates increase spending
Control: Standard rates (60/25/10/4/1)
Treatment A: Better rates (65/25/8/2)
Treatment B: Pity system added
Primary Metric: IAP conversion
Minimum Sample: 5,000 per variant
Expected Impact: +10% conversion
```

### 3.4 Prestige Requirements
```
Test ID: economy_prestige_req_v1
Hypothesis: Lower requirements increase prestige frequency
Control: Level 950 + Epoch 12
Treatment A: Level 800 + Epoch 10
Treatment B: Level 700 + Epoch 8
Primary Metric: Prestige per user
Minimum Sample: 3,000 per variant
Expected Impact: +50% prestige rate
```

---

## 4. Reward Experiments

### 4.1 Daily Task Rewards
```
Test ID: reward_task_amount_v1
Hypothesis: Better task rewards increase completion
Control: 30-400 currency rewards
Treatment A: 50-600 currency rewards
Treatment B: 30-400 + occasional fragments
Primary Metric: Task completion rate
Minimum Sample: 2,000 per variant
Expected Impact: +10% completion
```

### 4.2 Achievement Rewards
```
Test ID: reward_achievement_v1
Hypothesis: Better rewards increase achievement pursuit
Control: Standard rewards
Treatment A: +50% currency rewards
Treatment B: +100% currency rewards
Primary Metric: Achievements per user
Minimum Sample: 3,000 per variant
Expected Impact: +20% achievement hunting
```

### 4.3 Season Pass Premium Value
```
Test ID: reward_season_premium_v1
Hypothesis: More value in premium increases conversion
Control: Standard premium track
Treatment A: +1 legendary fragment per 10 tiers
Treatment B: +50% more fragments overall
Primary Metric: Battle Pass conversion
Minimum Sample: 5,000 per variant
Expected Impact: +15% conversion
```

---

## 5. UI/UX Experiments

### 5.1 Ad Placement
```
Test ID: ui_ad_placement_v1
Hypothesis: Better ad placement improves experience
Control: Bottom of screen after session
Treatment A: Modal overlay mid-session
Treatment B: Side panel persistent
Primary Metric: Ad completion rate
Minimum Sample: 2,000 per variant
Expected Impact: +5% completion
```

### 5.2 Boost Indicator Position
```
Test ID: ui_boost_indicator_v1
Hypothesis: More visible boosts increase awareness
Control: Top-right corner
Treatment A: Center-top banner
Treatment B: Below tap area
Primary Metric: Boost usage rate
Minimum Sample: 3,000 per variant
Expected Impact: +10% boost activation
```

### 5.3 Daily Reward Modal Timing
```
Test ID: ui_daily_modal_v1
Hypothesis: Earlier rewards increase session length
Control: Shown on first tap
Treatment A: Auto-shown on login
Treatment B: After 30 seconds
Primary Metric: Session length
Minimum Sample: 2,000 per variant
Expected Impact: +5% session length
```

### 5.4 Tutorial Flow
```
Test ID: ui_tutorial_v1
Hypothesis: Shorter tutorial increases completion
Control: 10-step tutorial
Treatment A: 7-step tutorial
Treatment B: 5-step tutorial
Primary Metric: FTUE completion
Minimum Sample: 1,000 per variant
Expected Impact: +15% completion
```

---

## 6. Offer Experiments

### 6.1 Starter Pack Pricing
```
Test ID: offer_starter_price_v1
Hypothesis: Lower price increases conversion
Control: $0.50 (50 stars)
Treatment A: $0.30 (30 stars)
Treatment B: $0.20 (20 stars)
Primary Metric: Starter pack conversion
Minimum Sample: 5,000 per variant
Expected Impact: +20% conversion
```

### 6.2 Offer Presentation
```
Test ID: offer_presentation_v1
Hypothesis: Value-focused presentation increases conversion
Control: Price prominently displayed
Treatment A: "Best Value" badge
Treatment B: Original price crossed out
Primary Metric: Offer conversion
Minimum Sample: 3,000 per variant
Expected Impact: +10% conversion
```

### 6.3 Offer Timing
```
Test ID: offer_timing_v1
Hypothesis: Better timing increases conversion
Control: Day 1 offer shown
Treatment A: Day 3 offer shown
Treatment B: Day 7 offer shown
Primary Metric: Offer conversion
Minimum Sample: 5,000 per variant
Expected Impact: +15% conversion
```

---

## 7. Retention Experiments

### 7.1 Notification Frequency
```
Test ID: retention_notification_freq_v1
Hypothesis: Optimal frequency increases return
Control: 2 notifications/day
Treatment A: 1 notification/day
Treatment B: 3 notifications/day
Primary Metric: D7 retention
Minimum Sample: 3,000 per variant
Expected Impact: +5% D7 retention
```

### 7.2 Streak Protection
```
Test ID: retention_streak_rescue_v1
Hypothesis: Streak rescue increases long-term retention
Control: No rescue option
Treatment A: Watch ad to rescue once/week
Treatment B: Watch ad to rescue unlimited
Primary Metric: D30 retention
Minimum Sample: 5,000 per variant
Expected Impact: +10% D30 retention
```

### 7.3 Comeback Rewards
```
Test ID: retention_comeback_v1
Hypothesis: Better comeback rewards increase return
Control: Standard comeback rewards
Treatment A: +50% more rewards
Treatment B: +100% more rewards
Primary Metric: Return rate after 3+ days
Minimum Sample: 3,000 per variant
Expected Impact: +20% return rate
```

---

## 8. Testing Process

### 8.1 Test Lifecycle
1. **Proposal** - Define hypothesis and metrics
2. **Design** - Create variants and traffic allocation
3. **Review** - Cross-functional approval
4. **Launch** - Deploy to % of traffic
5. **Monitor** - Track metrics daily
6. **Analyze** - Statistical significance check
7. **Decide** - Ship winner or iterate
8. **Archive** - Document learnings

### 8.2 Statistical Requirements
- **Minimum sample size** for each variant
- **Statistical significance** of 95% (p < 0.05)
- **Minimum runtime** of 7 days
- **Segment analysis** for heterogeneous effects

### 8.3 Decision Framework
```
IF p-value < 0.05 AND effect > 5%:
  → Ship winning variant
ELIF p-value > 0.05 AND runtime > 14 days:
  → Archive test, no significant effect
ELSE:
  → Continue running or increase traffic
```

---

## 9. Files Modified/Created

| File | Purpose |
|------|---------|
| `src/types/liveops.ts` | A/B test type definitions |
| `src/services/analytics.ts` | Variant tracking functions |
| `supabase/migrations/021_liveops_tables.sql` | A/B test tables |

---

## 10. Validation Performed

### Framework Testing
- [x] Variant assignment deterministic
- [x] Traffic allocation respected
- [x] Analytics tracking integrated
- [x] Override capability working

### Integration Testing
- [x] Config loading from database
- [x] Variant application to game
- [x] Conversion tracking
- [x] Reporting ready

---

## 11. Conclusion

The A/B testing framework enables **systematic experimentation** across all game systems. By following this testing roadmap, we can continuously optimize the player experience and business metrics with data-driven confidence.

Key principles:
1. **Hypothesis-driven** - Every test has clear hypothesis
2. **Metric-focused** - Primary metric defined upfront
3. **Statistical rigor** - 95% significance required
4. **Learnings documented** - Archive all test results

---

*Report prepared by: Executive Producer*  
*Next Review: Q3 2026*
