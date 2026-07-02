# Bug Report - Production Bug Hunt

**Date:** 2026-07-02  
**Repository:** Virtual-Museum-Tapper-Game-1.6.6  
**Branch:** fix/xp-boost-grace-period-artifacts-sync  
**Total Bugs Found:** 126

---

## Executive Summary

This bug report documents all production issues discovered during a comprehensive bug hunt of the Virtual Museum Tapper Game codebase. Bugs were found across 7 categories: Frontend/React, Gameplay/Logic, Backend/Supabase, Security/Anti-Cheat, Performance, Economy/Ads, and Telegram Integration.

---

## Bug Distribution by Category

| Category | Critical | High | Medium | Low | Total |
|----------|----------|------|--------|-----|-------|
| Frontend/React | 5 | 5 | 7 | 6 | 23 |
| Gameplay/Logic | 0 | 2 | 4 | 4 | 10 |
| Backend/Supabase | 4 | 8 | 8 | 0 | 20 |
| Security/Anti-Cheat | 5 | 5 | 5 | 3 | 18 |
| Performance | 1 | 5 | 9 | 8 | 23 |
| Economy/Ads | 4 | 4 | 5 | 4 | 17 |
| Telegram Integration | 3 | 7 | 3 | 2 | 15 |
| **TOTAL** | **22** | **36** | **41** | **27** | **126** |

---

## Critical Severity Bugs

### Frontend/React (5)

1. **Energy Regeneration Logic is Broken**
   - File: `src/hooks/useGame.ts` lines 556-561
   - Energy never regenerates during active play when x5 boost is inactive

2. **GachaModal Currency Deduction Race Condition**
   - File: `src/components/GachaModal.tsx` lines 80-96
   - Currency deducted before server call; not refunded on failure

3. **Tap Area Background Particles Regenerate on Every Render**
   - File: `src/components/TapArea.tsx` lines 285-296
   - Math.random() in render causes visual jitter

4. **Session Ad Trigger Uses Wrong Time Reference**
   - File: `src/components/AdSystem.tsx` lines 416, 424
   - Uses lastOnlineAt instead of sessionStartAt for ad timing

5. **Offline Rewards Modal Never Shows on New Day**
   - File: `src/hooks/useGame.ts` lines 370-372
   - !isNewDay condition prevents offline rewards display

### Backend/Supabase (4)

6. **Race Condition in swap_last_online_at RPC**
   - File: `supabase/migrations/20260617135202_018_swap_last_online_at_lock_fix.sql`
   - Returns stale timestamp for concurrent requests

7. **Data Type Mismatch for owned_generators**
   - Files: Multiple edge functions
   - Database defaults to array `[]` but code expects JSONB object `{}`

8. **Weak RLS Policy Migration Dependencies**
   - Files: `019_notifications_system.sql`, `020_fix_rls_policies.sql`
   - Migration order conflicts

### Security/Anti-Cheat (5)

9. **Client-Authoritative Tap System**
   - File: `src/hooks/useGame.ts` lines 517-571
   - XP modification happens entirely on client

10. **Client-Authoritative Generator Purchase**
    - File: `src/hooks/useGame.ts` lines 573-609
    - No server validation of costs or currency

11. **Client-Authoritative Tap Power Upgrade**
    - File: `src/hooks/useGame.ts` lines 611-631
    - No server validation

12. **Client-Authoritative Daily Tasks**
    - File: `src/hooks/useGame.ts` lines 543-554
    - Task completion tracked entirely on client

13. **Client-Authoritative Artifact Collection**
    - File: `src/hooks/useGame.ts` lines 633-667
    - No server validation

### Economy/Ads (4)

14. **XP Boost Grace Period Logic Inverted**
    - File: `supabase/functions/adsgram-reward/index.ts` line 74
    - Cannot refresh boost when about to expire

15. **Chest Ad Bonus Reward Never Applied**
    - File: `supabase/functions/claim-ad-reward/index.ts` lines 196-200
    - chest_bonus only tracks limit, doesn't apply bonus

16. **Artifact Part Addition Unreachable Code**
    - File: `src/hooks/useGame.ts` lines 651-656
    - if-else chain broken, duplicate tracking doesn't execute

17. **Artifact Completion Tracking Race Condition**
    - File: `src/hooks/useGame.ts` lines 638-664
    - Same artifact could be completed twice in same tick

### Telegram Integration (3)

18. **Missing init_data in rpcTrackSession**
    - File: `src/lib/rpc.ts` lines 102-116
    - Session tracking unauthenticated

19. **init_data Missing in rpcOpenChest**
    - File: `src/lib/rpc.ts` lines 66-97
    - Chest opening unauthenticated

20. **init_data Not Passed in claim-ad-reward**
    - File: `src/App.tsx` lines 296-306, 1125-1137, 1155-1167
    - Ad rewards can be claimed for any user

---

## High Severity Bugs

### Frontend/React (5)

21. **useCallback Missing Dependencies (Buy Generator)**
22. **setSyncStatus with Inverted Logic**
23. **Multiple Tab Detection Race Condition**
24. **Tap Power Calculation Logic Mismatch**
25. **Missing useEffect Dependencies**

### Gameplay/Logic (2)

26. **Passive XP Not Applied to Offline Calculations**
27. **Prestige Upgrade tap_power Not Implemented**
28. **Prestige Upgrade energy_capacity Not Implemented**

### Backend/Supabase (8)

29. **Duplicate HMAC Validation Code** (3 locations)
30. **Non-Atomic Read-Modify-Write in game-action**
31. **Unchecked JSONB Type Casting**
32. **Missing Input Validation in telegram-payments**
33. **Duplicate Payment Idempotency Issues**
34. **validateRequest Doesn't Extract User**

### Security (5)

35. **Race Condition in Offline Income Claims**
36. **AdsGram Secret Exposed in Frontend**
37. **fetch-active-boosters Lacks HMAC Validation**
38. **AdsGram GET Endpoint No Rate Limiting**
39. **Leaderboard Lacks Bot/Fraud Detection**

### Performance (5)

40. **Multiple Tab Detection Polling Too Aggressive** (1s interval)
41. **Game Tick Interval Causes Excessive State Updates** (100ms)
42. **Tap Events Array Grows Unbounded**
43. **Vite optimizeDeps Excludes lucide-react**
44. **JSON.stringify on Large State Every Remote Save**

### Economy/Ads (4)

45. **Generator Purchase Not Server-Validated**
46. **Offline Currency Rewards Without Passive Income**
47. **AdsGram Secret Exposed in Frontend**
48. **AdsGram Secret Also in Edge Function**

### Telegram Integration (7)

49. **init_data Missing in rpcFetchActiveBoosters**
50. **init_data Missing in rpcGetUserRank**
51. **init_data Missing in rpcGetLeaderboard**
52. **fetch-active-boosters Doesn't Validate init_data**
53. **Payment Webhook Race Condition**
54. **Session Tracking with Unvalidated User ID**
55. **HMAC Validation Code Duplicated (3 locations)**

---

## Medium & Low Severity Bugs

For full details of Medium (41) and Low (27) severity bugs, see individual category reports in the repository audit files.

---

## Top Priority Fixes Required

1. **Immediate:** Fix client-authoritative game mechanics (Security)
2. **Immediate:** Add init_data HMAC validation to all RPC calls (Security)
3. **High:** Implement server-side generator purchase validation (Economy)
4. **High:** Fix XP boost grace period logic (Economy)
5. **High:** Implement chest ad bonus reward (Economy)
6. **Medium:** Fix energy regeneration logic (Gameplay)
7. **Medium:** Implement prestige upgrade effects (Gameplay)
8. **Low:** Optimize tap area particle rendering (Performance)

---

## Conclusion

The codebase has significant production issues requiring attention. Critical bugs span authentication, economy integrity, and core gameplay mechanics. A phased fix approach is recommended with security-critical issues addressed first.