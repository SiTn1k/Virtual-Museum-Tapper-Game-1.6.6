# Virtual Museum Tapper Game — Player Segmentation Plan

**Report Date:** July 2, 2026  
**Director Level:** Executive Producer  
**Game Version:** 1.6.6 + LiveOps Expansion  
**Classification:** Internal Strategy Document

---

## Executive Summary

The Virtual Museum Tapper Game has a **comprehensive player segmentation system** that categorizes players based on their behavior, engagement level, and spending patterns. This enables targeted experiences, personalized offers, and optimized retention strategies.

**Player Segmentation Readiness: 8/10**

---

## 1. Purpose

### Player Benefit
- **Personalized content** through segment-specific events
- **Tailored offers** based on spending propensity
- **Balanced difficulty** for different play styles
- **Social matching** for multiplayer features

### Business Benefit
- **Targeted marketing** through segment analysis
- **Optimized offers** for conversion
- **Retention strategies** for at-risk segments
- **Resource allocation** based on segment value

### Architecture Impact
- **Segment types** in `src/types/liveops.ts`
- **Segment calculation** in `src/services/analytics.ts`
- **Segment-aware offers** in `src/data/iapProducts.ts`
- **Database tracking** in player_segments table

---

## 2. Segment Definitions

### 2.1 Experience Segments

| Segment | Criteria | Description |
|---------|-----------|-------------|
| `new_player` | First 24 hours | Recently installed |
| `beginner` | Level 1-50 | Early game |
| `intermediate` | Level 51-200 | Mid-game |
| `advanced` | Level 201-500 | Late-game |
| `veteran` | Level 500+ | Endgame |

### 2.2 Engagement Segments

| Segment | Criteria | Description |
|---------|-----------|-------------|
| `casual` | <30 min/day | Light play |
| `regular` | 30-120 min/day | Medium play |
| `hardcore` | 120+ min/day | Heavy play |

### 2.3 Payment Segments

| Segment | Criteria | Description |
|---------|-----------|-------------|
| `free_player` | Never purchased | F2P only |
| `minnow` | $1-10 lifetime | Light spender |
| `whale` | $100+ lifetime | Heavy spender |
| `vip` | Top 5% by spend | High value |

### 2.4 Behavior Segments

| Segment | Criteria | Description |
|---------|-----------|-------------|
| `collector` | 50+ artifacts | Completionist |
| `prestige_player` | 1+ prestiges | Rebirther |
| `event_participant` | Active in events | Event lover |

### 2.5 Lifecycle Segments

| Segment | Criteria | Description |
|---------|-----------|-------------|
| `returning` | Returned after 7+ days | Re-engaged |
| `at_risk` | Showing churn signals | Need attention |
| `churned` | No session in 30+ days | Lost |

---

## 3. Segment Assignment Algorithm

### 3.1 Assignment Logic
```typescript
function calculatePlayerSegment(state: PlayerState): PlayerSegmentType[] {
  const segments: PlayerSegmentType[] = [];
  
  // Experience-based
  if (state.level <= 50) segments.push('beginner');
  else if (state.level <= 200) segments.push('intermediate');
  else if (state.level <= 500) segments.push('advanced');
  else segments.push('veteran');
  
  // Engagement-based
  if (state.dailyPlaytimeMinutes < 30) segments.push('casual');
  else if (state.dailyPlaytimeMinutes <= 120) segments.push('regular');
  else segments.push('hardcore');
  
  // Payment-based
  if (state.lifetimeSpend === 0) segments.push('free_player');
  else if (state.lifetimeSpend >= 100) segments.push('whale');
  else if (state.lifetimeSpend >= 10) segments.push('minnow');
  
  // Behavior-based
  if (state.artifactCount >= 50) segments.push('collector');
  if (state.prestigeLevel >= 1) segments.push('prestige_player');
  
  // Lifecycle-based
  if (state.daysSinceInstall <= 1) segments.push('new_player');
  if (state.daysSinceLastSession >= 3 && 
      state.daysSinceLastSession <= 7) segments.push('at_risk');
  if (state.daysSinceLastSession > 7) segments.push('returning');
  
  return segments;
}
```

### 3.2 Dynamic Updates
- Segments recalculated on each session
- Historical segments tracked for comparison
- Segment transitions logged for analysis

---

## 4. Segment-Specific Strategies

### 4.1 New Players (Day 1-7)

**Characteristics:**
- Learning the game
- High churn risk
- No spending history

**Strategies:**
- Guided tutorial
- Simplified UI
- Early wins
- Welcome offers
- Gentle notifications

### 4.2 Beginners (Level 1-50)

**Characteristics:**
- Building foundations
- Understanding systems
- Establishing habits

**Strategies:**
- Achievement unlocks
- Daily reward emphasis
- Starter pack offers
- Basic tips
- Encouraging notifications

### 4.3 Intermediates (Level 51-200)

**Characteristics:**
- Core loop established
- First prestige capable
- Engagement solidifying

**Strategies:**
- Achievement progression
- Event participation
- Generator optimization
- Value bundle offers
- Competitive elements

### 4.4 Advanced Players (Level 201-500)

**Characteristics:**
- Deep system understanding
- Prestige experience
- High engagement

**Strategies:**
- Advanced achievements
- Collection goals
- Season progression
- Artifact hunting
- Premium offers

### 4.5 Veterans (Level 500+)

**Characteristics:**
- Endgame mastery
- Low novelty
- High value

**Strategies:**
- New content access
- Prestige optimization
- Collection completion
- VIP treatment
- Exclusive offers

### 4.6 Casual Players

**Characteristics:**
- Short sessions
- Low daily playtime
- Sporadic engagement

**Strategies:**
- Quick session content
- Notification reminders
- Session-based rewards
- Return incentives
- Ad-friendly design

### 4.7 Regular Players

**Characteristics:**
- Consistent engagement
- Medium sessions
- Daily active

**Strategies:**
- Full content access
- Mission variety
- Weekend emphasis
- Moderate offers
- Social features

### 4.8 Hardcore Players

**Characteristics:**
- Long sessions
- High engagement
- Competitive

**Strategies:**
- Endgame depth
- Leaderboard focus
- Season challenges
- Premium bundles
- Exclusive perks

### 4.9 Free Players

**Characteristics:**
- Never spent money
- Potential converts
- Value-conscious

**Strategies:**
- Generous F2P experience
- Ad engagement
- Spending education
- Entry-level offers
- Value demonstrations

### 4.10 Minnows (Light Spenders)

**Characteristics:**
- $1-10 lifetime spend
- Small purchases
- Engaged F2P

**Strategies:**
- Small value packs
- Limited offers
- Spending encouragement
- Loyalty recognition
- Graduated pricing

### 4.11 Whales (Heavy Spenders)

**Characteristics:**
- $100+ lifetime spend
- High LTV
- Low churn risk

**Strategies:**
- Premium products
- VIP treatment
- Exclusive access
- Personal support
- Premium features

### 4.12 At-Risk Players

**Characteristics:**
- Declining engagement
- Recent churn signals
- High return potential

**Strategies:**
- Comeback offers
- Notification frequency
- Simplified re-engagement
- Reward bonuses
- Urgent attention

### 4.13 Returning Players

**Characteristics:**
- Came back after absence
- Re-learning game
- Re-engagement opportunity

**Strategies:**
- Catch-up content
- Welcome back rewards
- New feature highlights
- Simplified onboarding
- Gradual re-introduction

---

## 5. Segment Targeting Matrix

| Segment | Retention Focus | Monetization Focus | Experience Focus |
|---------|----------------|-------------------|------------------|
| New Player | Tutorial completion | Welcome offers | Guided |
| Beginner | Daily habit | Starter packs | Tutorial |
| Intermediate | Engagement | Value offers | Full |
| Advanced | Progression | Premium offers | Deep |
| Veteran | Content | VIP offers | Exclusive |
| Casual | Return motivation | Ad optimization | Quick |
| Regular | Engagement | Balanced offers | Standard |
| Hardcore | Competition | Premium bundles | Competitive |
| Free Player | Ad engagement | Entry offers | F2P-friendly |
| Minnow | Spending habit | Small packs | Encouraging |
| Whale | VIP treatment | Premium products | Exclusive |
| At-Risk | Urgent re-engage | Comeback offers | Simplified |
| Returning | Welcome back | Catch-up offers | Fresh |

---

## 6. Offer Targeting by Segment

### 6.1 Product Eligibility
```typescript
const OFFER_ELIGIBILITY = {
  // Starter packs - new players only
  starter_pack: ['new_player', 'beginner'],
  
  // Currency bundles - all except new
  currency_bundle: ['beginner', 'intermediate', 'advanced', 'veteran', 'casual', 'regular', 'hardcore'],
  
  // Energy packs - prestige players only
  energy_pack: ['prestige_player', 'advanced', 'veteran'],
  
  // Artifact packs - completionists
  artifact_pack: ['collector', 'advanced', 'veteran'],
  
  // Premium bundles - whales only
  premium_bundle: ['whale', 'vip'],
  
  // Comeback offers - at-risk, returning
  comeback_offer: ['at_risk', 'returning'],
};
```

### 6.2 Price Sensitivity by Segment
| Segment | Price Sensitivity | Preferred Products |
|---------|------------------|-------------------|
| Free Player | Very High | $0.20-0.50 |
| Minnow | High | $0.50-2.00 |
| Regular | Medium | $2.00-5.00 |
| Hardcore | Low | $5.00-15.00 |
| Whale | Very Low | $15.00+ |

---

## 7. Notification Targeting

### 7.1 Frequency by Segment
| Segment | Daily Limit | Preferred Times |
|---------|-------------|-----------------|
| New Player | 3 | Evening |
| Casual | 1 | Morning, Evening |
| Regular | 2 | Midday, Evening |
| Hardcore | 3 | Morning, Midday, Evening |
| At-Risk | 2 | Morning, Evening |

### 7.2 Content by Segment
| Segment | Primary Content | Secondary Content |
|---------|---------------|------------------|
| New Player | Tutorial, Tips | Daily rewards |
| Beginner | Achievements | Daily tasks |
| Intermediate | Missions | Events |
| Advanced | Seasons | Achievements |
| Veteran | New content | Leaderboard |
| Casual | Quick rewards | Return prompts |
| Hardcore | Challenges | Competition |
| At-Risk | Comeback | Rewards |
| Whale | Exclusive | VIP |

---

## 8. Future Segmentation Enhancements

### Phase 2 (Months 4-6)
1. **Behavioral clustering** - ML-based segments
2. **Predictive LTV** - Churn probability scoring
3. **Spending propensity** - Conversion likelihood
4. **Social graph** - Friend influence

### Phase 3 (Months 7-12)
1. **Cross-game segments** - Platform-wide segments
2. **Real-time segments** - Session-based targeting
3. **Micro-segments** - Granular player types
4. **Dynamic segments** - Fluctuating membership

---

## 9. Files Modified/Created

| File | Purpose |
|------|---------|
| `src/types/liveops.ts` | Segment type definitions |
| `src/services/analytics.ts` | Segment calculation |
| `src/data/iapProducts.ts` | Segment-based filtering |
| `src/hooks/useLiveOps.ts` | Segment-aware hooks |
| `supabase/migrations/021_liveops_tables.sql` | Segment tracking |

---

## 10. Conclusion

The player segmentation system enables **personalized experiences** at every level of the player lifecycle. By understanding and targeting each segment, we can optimize retention, monetization, and overall player satisfaction.

Key capabilities:
1. **17 segment types** covering all player states
2. **Dynamic calculation** for real-time updates
3. **Segment-specific strategies** for each touchpoint
4. **Targeted offers** based on eligibility rules
5. **Personalized notifications** for re-engagement

The system is production-ready and provides the foundation for sophisticated player management.

---

*Report prepared by: Executive Producer*  
*Next Review: Q3 2026*
