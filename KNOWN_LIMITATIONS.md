# Known Limitations - Production Bug Hunt

**Date:** 2026-07-02  
**Repository:** Virtual-Museum-Tapper-Game-1.6.6  
**Branch:** fix/xp-boost-grace-period-artifacts-sync

---

## Executive Summary

This document outlines known limitations that require future development but are outside the scope of this bug hunt (feature work, architectural changes, or issues requiring significant refactoring).

---

## 1. Client-Authoritative Core Mechanics

### Issue
The core game mechanics (tapping, generator purchases, upgrades, tasks, artifacts) are entirely client-side with no server validation.

### Impact
- Complete economy manipulation possible via DevTools
- Cheaters can inject arbitrary XP/currency
- Leaderboard manipulation possible

### Resolution Required
**Architectural Change** - Move all game logic to server-side Edge Functions with proper validation. This is a significant undertaking requiring:
- Shared game logic between client and server
- Real-time sync mechanism
- Rate limiting and anti-cheat detection

### Status
**Acknowledged - Not Fixed** (requires feature development)

---

## 2. Generator Purchase Server Validation

### Issue
The `buy_generator` action in `game-action/index.ts` always returns an error:
```
"buy_generator: cost validation requires server-side generator definitions — coming soon"
```

### Impact
- All generator purchases are client-side only
- Currency manipulation exploits possible

### Resolution Required
**Feature Work** - Implement server-side generator definitions and validation. Requires:
- Moving generator data to shared config
- Server-side cost calculation
- Transactional purchase handling

### Status
**Acknowledged - Not Fixed** (requires feature development)

---

## 3. AdsGram Secret Hardcoded

### Issue
The AdsGram API secret is hardcoded in two locations:
- `src/services/adsgram.ts` line 28
- `supabase/functions/adsgram-reward/index.ts` line 21

### Impact
- Secret visible in client-side JavaScript bundle
- Increased attack surface if AdsGram validation is bypassed

### Resolution Required
**Environment Variable Migration**
```
Frontend: VITE_ADSGRAM_SECRET
Backend: ADSGRAM_SECRET
```

### Status
**Acknowledged - Documented** (requires DevOps changes)

---

## 4. HMAC Validation Code Duplication

### Issue
The same HMAC validation logic is duplicated in three locations:
- `supabase/functions/_shared/validate-init-data.ts`
- `supabase/functions/game-action/index.ts`
- `supabase/functions/validate-init-data/index.ts`

### Impact
- Maintenance burden
- Risk of inconsistent implementations
- Harder to audit

### Resolution Required
**Refactoring** - Consolidate to single shared implementation

### Status
**Acknowledged - Not Fixed** (requires refactoring sprint)

---

## 5. RLS Policy Migration Conflicts

### Issue
Migration `019_notifications_system.sql` creates JWT-based policies that conflict with migration `020_fix_rls_policies.sql`.

### Impact
- Potential RLS inconsistency during re-deployment
- Conflicting row-level security policies

### Resolution Required
**Migration Cleanup** - Consolidate and clean up migration order

### Status
**Acknowledged - Not Fixed** (requires database migration review)

---

## 6. Leaderboard Rank Tie Handling

### Issue
Leaderboard ranks are calculated as `index + 1` without handling ties. Users at the same XP should share a rank.

### Impact
- Incorrect ranking display
- Players at same level get different ranks

### Resolution Required
**Feature Enhancement** - Implement proper tie-breaking logic

### Status
**Low Priority** - Cosmetic issue

---

## 7. User Rank Limit

### Issue
`get-user-rank` limits to 1000 users. Users ranked beyond 1000 get `null`.

### Impact
- Players outside top 1000 don't see their rank
- May discourage mid-tier players

### Resolution Required
**Query Optimization** - Implement cursor-based pagination or separate rank lookup table

### Status
**Low Priority** - Most players are in top 1000

---

## 8. ads_rewards_log UNIQUE Constraint

### Issue
UNIQUE constraint is on `(telegram_id, ad_id)` but `ad_id` is nullable. Multiple rewards can be claimed with same null `ad_id`.

### Impact
- Limited duplicate rewards possible
- Only affects cases where ad_id is null

### Resolution Required
**Schema Change** - Add non-null constraint or change to `(telegram_id)` only with timestamp

### Status
**Low Priority** - Edge case only

---

## 9. Session Tracking Race Condition

### Issue
`track-session` edge function has TOCTOU race between checking for open sessions and inserting new session.

### Impact
- Potential duplicate sessions for concurrent start events
- Session tracking inaccuracy

### Resolution Required
**Database Transaction** - Use INSERT with ON CONFLICT or FOR UPDATE SKIP LOCKED

### Status
**Medium Priority** - Session tracking is for analytics, not game logic

---

## 10. Energy Ad Amount Mismatch

### Issue
UI displays "+50 Energy" but server grants +100.

### Impact
- Player expectation mismatch
- Players receive MORE than advertised (not a loss)

### Resolution Required
**UI Consistency** - Update UI to show +100 or update server to +50

### Status
**Low Priority** - Players benefit, not harmed

---

## 11. Booster Stacking

### Issue
Using `Math.max()` for XP boost multipliers means only the HIGHEST active boost applies, not multiplicative stacking.

### Impact
- Limited booster value
- May discourage multiple booster purchases

### Resolution Required
**Game Design Decision** - Determine if stacking is intended

### Status
**Design Decision** - May be intentional

---

## 12. Offline Cap Inconsistency

### Issue
Prestige 0 players have 8-hour offline cap, but Prestige 1+ have 6-hour cap.

### Impact
- Counterintuitive - prestige players get LESS offline time
- New players have more generous offline income

### Resolution Required
**Game Design Review** - Verify if this is intentional

### Status
**Design Issue** - May be intentional

---

## 13. Telegram Platform Detection

### Issue
`getTelegramWebApp()` only checks for `window.Telegram?.WebApp` existence with no platform-specific handling.

### Impact
- Platform-specific bugs may go undetected
- iOS vs Android vs Desktop differences not handled

### Resolution Required
**Feature Enhancement** - Add platform detection and handling

### Status
**Low Priority** - Current API is consistent across platforms

---

## 14. React StrictMode Double-Invocation

### Issue
React StrictMode double-invokes effects in development, creating duplicate intervals.

### Impact
- Race conditions in development
- Higher resource usage

### Resolution Required
**Development Only** - This is expected React behavior

### Status
**Acknowledged** - Not a production issue

---

## 15. No Code Splitting

### Issue
All components imported at module load time. Modal components could be lazy-loaded.

### Impact
- Larger initial bundle size
- Users download modal code they'll never see

### Resolution Required
**Performance Optimization** - Implement React.lazy for modals

### Status
**Performance Enhancement** - Bundle size acceptable

---

## Priority Matrix

| Limitation | Impact | Effort | Priority |
|------------|--------|--------|----------|
| Client-Authoritative Mechanics | Critical | Very High | Future |
| Generator Server Validation | High | High | Future |
| AdsGram Secret | Medium | Low | Soon |
| HMAC Duplication | Medium | Medium | Medium |
| RLS Conflicts | High | Medium | Medium |
| Session Race Condition | Medium | Medium | Medium |
| Rank Ties | Low | Low | Low |
| User Rank Limit | Low | High | Low |
| Ad UNIQUE | Low | Low | Low |

---

## Conclusion

These limitations are acknowledged and documented for future development planning. They do not block the current release but should be addressed in subsequent development cycles based on priority and resource availability.