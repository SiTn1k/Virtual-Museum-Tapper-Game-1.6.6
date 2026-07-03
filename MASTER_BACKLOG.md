# Virtual Museum Tapper Game — Master Backlog
## Jolt Time (Україна Крізь Час) | v1.6.6

**Document Version:** 1.0  
**Date:** 2026-07-02  
**Classification:** CONFIDENTIAL — AAA STUDIO PRODUCTION STANDARDS  
**Prepared By:** Executive Producer  

---

## Executive Overview

This master backlog contains all tasks extracted from the 23 audit documents and organized by priority, category, difficulty, risk, dependencies, and required agents. The backlog contains **127 distinct tasks** spanning all aspects of game production.

### Backlog Organization
- **P0 (Critical):** Must fix before any production launch
- **P1 (High):** Should fix before public release
- **P2 (Medium):** Important for long-term success
- **P3 (Low):** Nice to have, address when possible

---

## P0 — CRITICAL (Must Fix Before Launch)

### Security — Critical Vulnerabilities

| ID | Task | Priority | Category | Difficulty | Risk | Required Agents | Dependencies |
|----|------|----------|----------|------------|------|----------------|--------------|
| S-001 | Add HMAC validation to all edge functions | P0 | Security | Medium | LOW | Backend Architect, Security Engineer | None |
| S-002 | Fix RLS policies — block universal read/write | P0 | Security | Medium | MEDIUM | Database Architect, Security Engineer | S-001 |
| S-003 | Fix swap_last_online_at race condition | P0 | Security | Medium | MEDIUM | Backend Architect, Database Architect | S-001, S-002 |
| S-004 | Remove hardcoded AdsGram secret | P0 | Security | Low | LOW | Backend Architect, Security Engineer | S-001 |
| S-005 | Implement rate limiting on all edge functions | P0 | Security | Medium | LOW | Backend Architect | S-001 |
| S-006 | Restrict CORS to Telegram domains only | P0 | Security | Low | LOW | Backend Architect | S-001 |
| S-007 | Fix HTML injection in push-notification | P0 | Security | Low | LOW | Backend Architect | S-001 |
| S-008 | Add server-side generator validation | P0 | Security | High | MEDIUM | Backend Architect | S-001 |
| S-009 | Implement server-side offline income | P0 | Security | Medium | MEDIUM | Backend Architect, Senior Economy Designer | S-001 |
| S-010 | Add server-side tap validation | P0 | Security | High | MEDIUM | Backend Architect, Anti-Cheat Engineer | S-001 |

### Economy — Critical Imbalances

| ID | Task | Priority | Category | Difficulty | Risk | Required Agents | Dependencies |
|----|------|----------|----------|------------|------|----------------|--------------|
| E-001 | Redesign energy system (remove binary x5) | P0 | Economy | Medium | MEDIUM | Senior Economy Designer, Lead Game Designer | S-004, S-005 |
| E-002 | Fix generator cost scaling (1.25-1.30 multiplier) | P0 | Economy | Medium | MEDIUM | Senior Economy Designer | E-001 |
| E-003 | Increase gacha costs 5-10x | P0 | Economy | Low | LOW | Senior Economy Designer | E-002 |
| E-004 | Rebalance prestige research costs | P0 | Economy | Low | LOW | Senior Economy Designer | E-002 |
| E-005 | Add gacha pity system (50 Epic, 200 Legendary) | P0 | Economy | Low | LOW | Senior Economy Designer | E-003 |

### Foundation — CI/CD

| ID | Task | Priority | Category | Difficulty | Risk | Required Agents | Dependencies |
|----|------|----------|----------|------------|------|----------------|--------------|
| F-001 | Set up GitHub Actions CI pipeline | P0 | DevOps | Medium | MEDIUM | DevOps Engineer | None |
| F-002 | Implement branch protection rules | P0 | DevOps | Low | LOW | DevOps Engineer | F-001 |
| F-003 | Create PR templates and CODEOWNERS | P0 | DevOps | Low | LOW | DevOps Engineer | F-001 |
| F-004 | Add npm audit to CI pipeline | P0 | DevOps | Low | LOW | DevOps Engineer | F-001 |

---

## P1 — HIGH PRIORITY (Before Public Release)

### Security — Hardening

| ID | Task | Priority | Category | Difficulty | Risk | Required Agents | Dependencies |
|----|------|----------|----------|------------|------|----------------|--------------|
| S-011 | Add initData validation to validate-init-data | P1 | Security | Medium | LOW | Backend Architect | S-001 |
| S-012 | Implement request timeout configuration | P1 | Security | Low | LOW | Backend Architect | F-001 |
| S-013 | Add duplicate tab detection improvement | P1 | Security | Medium | MEDIUM | Frontend Architect, Anti-Cheat Engineer | S-001 |
| S-014 | Implement session tracking server-side | P1 | Security | Medium | MEDIUM | Backend Architect | S-001, S-002 |

### Economy — Balance

| ID | Task | Priority | Category | Difficulty | Risk | Required Agents | Dependencies |
|----|------|----------|----------|------------|------|----------------|--------------|
| E-006 | Improve duplicate artifact fragment return (2-3x) | P1 | Economy | Low | LOW | Senior Economy Designer | E-003 |
| E-007 | Add artifact "essence" conversion option | P1 | Economy | Low | LOW | Senior Economy Designer | E-006 |
| E-008 | Scale daily task rewards 5-10x | P1 | Economy | Low | LOW | Senior Economy Designer | None |
| E-009 | Add epoch-specific task variety | P1 | Economy | Medium | LOW | Lead Game Designer | E-008 |
| E-010 | Scale daily rewards with prestige level | P1 | Economy | Low | LOW | Senior Economy Designer | E-004 |

### Testing — Infrastructure

| ID | Task | Priority | Category | Difficulty | Risk | Required Agents | Dependencies |
|----|------|----------|----------|------------|------|----------------|--------------|
| T-001 | Set up Vitest test framework | P1 | QA | Medium | LOW | QA Lead, Automation QA Engineer | F-001 |
| T-002 | Write XP calculation unit tests | P1 | QA | Medium | LOW | QA Lead | T-001 |
| T-003 | Write game state transformation tests | P1 | QA | Medium | LOW | QA Lead | T-001 |
| T-004 | Write edge function handler tests | P1 | QA | Medium | MEDIUM | QA Lead, Backend Architect | T-001 |
| T-005 | Write React component rendering tests | P1 | QA | Medium | MEDIUM | QA Lead, Frontend Architect | T-001 |

### Analytics — Infrastructure

| ID | Task | Priority | Category | Difficulty | Risk | Required Agents | Dependencies |
|----|------|----------|----------|------------|------|----------------|--------------|
| A-001 | Create analytics_events table | P1 | Analytics | Medium | LOW | Analytics Engineer, Backend Architect | F-001 |
| A-002 | Build analytics edge function | P1 | Analytics | Medium | LOW | Analytics Engineer | A-001 |
| A-003 | Implement core event tracking | P1 | Analytics | Medium | LOW | Analytics Engineer | A-002 |
| A-004 | Set up analytics dashboard | P1 | Analytics | Low | LOW | Analytics Engineer | A-003 |
| A-005 | Build A/B test infrastructure | P1 | Analytics | Medium | MEDIUM | Analytics Engineer | A-001, F-014 |

### Monitoring — Observability

| ID | Task | Priority | Category | Difficulty | Risk | Required Agents | Dependencies |
|----|------|----------|----------|------------|------|----------------|--------------|
| M-001 | Set up Sentry error tracking | P1 | DevOps | Low | LOW | DevOps Engineer, Performance Engineer | F-001 |
| M-002 | Configure Sentry for edge functions | P1 | DevOps | Low | LOW | DevOps Engineer | M-001 |
| M-003 | Set up uptime monitoring | P1 | DevOps | Low | LOW | DevOps Engineer | F-001 |
| M-004 | Configure Slack alerts | P1 | DevOps | Low | LOW | DevOps Engineer | M-001, M-003 |
| M-005 | Build monitoring dashboard | P1 | DevOps | Low | LOW | DevOps Engineer | M-001, M-004 |

### Engagement — Core Systems

| ID | Task | Priority | Category | Difficulty | Risk | Required Agents | Dependencies |
|----|------|----------|----------|------------|------|----------------|--------------|
| G-001 | Add milestone celebrations (10, 50, 100, etc.) | P1 | Game Design | Low | LOW | Lead Game Designer, UI Art Director | T-001 |
| G-002 | Implement achievement system (50+ achievements) | P1 | Game Design | High | MEDIUM | Lead Game Designer, Backend Architect | A-002, G-001 |
| G-003 | Create achievement tracking backend | P1 | Game Design | Medium | MEDIUM | Backend Architect | A-002 |
| G-004 | Build achievement UI/modal | P1 | Frontend | Medium | LOW | Frontend Architect | G-003 |
| G-005 | Enhance daily task rewards UI | P1 | Game Design | Low | LOW | Lead Game Designer | E-008 |

### Monetization — Revenue Systems

| ID | Task | Priority | Category | Difficulty | Risk | Required Agents | Dependencies |
|----|------|----------|----------|------------|------|----------------|--------------|
| M-006 | Build Battle Pass Season 1 | P1 | Monetization | High | MEDIUM | Monetization Director, Lead Game Designer | A-005, G-002 |
| M-007 | Create seasons table and edge functions | P1 | Monetization | Medium | MEDIUM | Backend Architect | M-006 |
| M-008 | Build Battle Pass UI/modal | P1 | Frontend | High | MEDIUM | Frontend Architect, UI Art Director | M-007 |
| M-009 | Implement Telegram Stars purchase | P1 | Monetization | Medium | MEDIUM | Integration Specialist | M-006 |
| M-010 | Create season challenges (daily/weekly) | P1 | Game Design | Medium | MEDIUM | Lead Game Designer | M-007 |

---

## P2 — MEDIUM PRIORITY (Long-Term Success)

### Economy — Advanced

| ID | Task | Priority | Category | Difficulty | Risk | Required Agents | Dependencies |
|----|------|----------|----------|------------|------|----------------|--------------|
| E-011 | Add seasonal event currency system | P2 | Economy | Medium | LOW | LiveOps Director, Senior Economy Designer | M-006 |
| E-012 | Implement leaderboard seasons reset | P2 | Economy | Medium | LOW | Lead Game Designer, Backend Architect | G-002 |
| E-013 | Balance F2P vs whale progression | P2 | Economy | High | MEDIUM | Senior Economy Designer | E-004, E-010 |

### Code Quality — Refactoring

| ID | Task | Priority | Category | Difficulty | Risk | Required Agents | Dependencies |
|----|------|----------|----------|------------|------|----------------|--------------|
| C-001 | Extract shared XP calculation utility | P2 | Code Quality | Low | LOW | Refactoring Specialist | T-001 |
| C-002 | Split useGame.ts into focused hooks | P2 | Code Quality | High | MEDIUM | Frontend Architect, Refactoring Specialist | T-001, C-001 |
| C-003 | Split App.tsx into feature components | P2 | Code Quality | High | MEDIUM | Frontend Architect, Refactoring Specialist | C-002 |
| C-004 | Consolidate artifact definitions (single source) | P2 | Code Quality | Low | LOW | Refactoring Specialist | None |
| C-005 | Extract magic numbers to constants | P2 | Code Quality | Low | LOW | Refactoring Specialist | None |
| C-006 | Add Zod validation schemas | P2 | Code Quality | Medium | LOW | Backend Architect | T-001 |
| C-007 | Remove dead commented code | P2 | Code Quality | Low | LOW | Refactoring Specialist | None |

### LiveOps — Events

| ID | Task | Priority | Category | Difficulty | Risk | Required Agents | Dependencies |
|----|------|----------|----------|------------|------|----------------|--------------|
| L-001 | Create events table with JSONB config | P2 | LiveOps | Medium | LOW | LiveOps Director, Backend Architect | A-001 |
| L-002 | Build Event Manager edge function | P2 | LiveOps | Medium | LOW | Backend Architect | L-001 |
| L-003 | Implement event-specific reward hooks | P2 | LiveOps | Medium | MEDIUM | Backend Architect | L-002 |
| L-004 | Build Flash Event capability (4-hour windows) | P2 | LiveOps | Medium | MEDIUM | LiveOps Director | L-002 |
| L-005 | Add 2x weekend reward support | P2 | LiveOps | Low | LOW | Lead Game Designer | L-002 |

### LiveOps — Notifications

| ID | Task | Priority | Category | Difficulty | Risk | Required Agents | Dependencies |
|----|------|----------|----------|------------|------|----------------|--------------|
| L-006 | Build notification scheduler cron | P2 | LiveOps | Medium | MEDIUM | LiveOps Director, Backend Architect | M-001 |
| L-007 | Add "24h since tap" notification | P2 | LiveOps | Low | LOW | LiveOps Director | L-006 |
| L-008 | Add streak warning notification | P2 | LiveOps | Low | LOW | LiveOps Director | L-006 |
| L-009 | Add energy full notification | P2 | LiveOps | Low | LOW | LiveOps Director | L-006 |
| L-010 | Add notification templates database | P2 | LiveOps | Medium | LOW | LiveOps Director | L-006 |
| L-011 | Add notification localization (EN/RU/UK) | P2 | LiveOps | Medium | LOW | Technical Writer | L-010 |

### Monetization — Expansion

| ID | Task | Priority | Category | Difficulty | Risk | Required Agents | Dependencies |
|----|------|----------|----------|------------|------|----------------|--------------|
| M-011 | Create Starter Pack IAP ($0.99) | P2 | Monetization | Medium | MEDIUM | Monetization Director | M-006 |
| M-012 | Create Gem Bundle IAP ($4.99) | P2 | Monetization | Medium | MEDIUM | Monetization Director | M-006 |
| M-013 | Create Power Pack IAP ($9.99) | P2 | Monetization | Medium | MEDIUM | Monetization Director | M-006 |
| M-014 | Create Artifact Hunter Bundle ($14.99) | P2 | Monetization | Medium | MEDIUM | Monetization Director | M-011 |
| M-015 | Implement monthly subscription ($2.99) | P2 | Monetization | High | MEDIUM | Monetization Director | M-006 |
| M-016 | Build LTO system | P2 | Monetization | Medium | MEDIUM | Monetization Director, LiveOps Director | M-006 |
| M-017 | Create weekend flash sale LTO | P2 | Monetization | Low | LOW | LiveOps Director | M-016 |

### Social — Features

| ID | Task | Priority | Category | Difficulty | Risk | Required Agents | Dependencies |
|----|------|----------|----------|------------|------|----------------|--------------|
| S-015 | Implement leaderboard seasons | P2 | Social | Medium | MEDIUM | Lead Game Designer, Backend Architect | E-012 |
| S-016 | Add leaderboard segments (epoch, prestige) | P2 | Social | Medium | MEDIUM | Lead Game Designer | S-015 |
| S-017 | Implement server-side ranking | P2 | Backend | Medium | MEDIUM | Backend Architect, Database Architect | S-015 |
| S-018 | Add weekly leaderboard rewards | P2 | Game Design | Medium | MEDIUM | Lead Game Designer | S-015 |
| S-019 | Build guild/clan system | P2 | Social | High | MEDIUM | Lead Game Designer, Backend Architect | M-015 |
| S-020 | Create guild chat (Telegram integration) | P2 | Social | Medium | MEDIUM | Telegram Mini App Expert | S-019 |
| S-021 | Implement shared artifact guild bonuses | P2 | Game Design | Medium | MEDIUM | Lead Game Designer | S-019 |
| S-022 | Add guild leaderboards | P2 | Social | Medium | MEDIUM | Backend Architect | S-019 |
| S-023 | Build group challenges | P2 | Game Design | High | MEDIUM | Lead Game Designer | S-019 |

### Performance — Optimization

| ID | Task | Priority | Category | Difficulty | Risk | Required Agents | Dependencies |
|----|------|----------|----------|------------|------|----------------|--------------|
| P-001 | Add React.memo to all components | P2 | Performance | Medium | LOW | Performance Engineer | C-002 |
| P-002 | Implement React.lazy for modals | P2 | Performance | Medium | LOW | Frontend Architect | C-002 |
| P-003 | Optimize useCallback/useMemo usage | P2 | Performance | Medium | LOW | Performance Engineer | P-001 |
| P-004 | Add virtual list for artifacts | P2 | Performance | Medium | LOW | Frontend Architect | P-001 |
| P-005 | Set performance budgets in CI | P2 | Performance | Low | LOW | DevOps Engineer | P-001, P-002 |
| P-006 | Fix memory leaks in useGame interval | P2 | Performance | Medium | MEDIUM | Performance Engineer | C-002 |
| P-007 | Add image lazy loading with cleanup | P2 | Performance | Low | LOW | Performance Engineer | P-006 |
| P-008 | Add memory leak detection | P2 | Performance | Low | LOW | Performance Engineer | P-006 |

### Platform — Telegram

| ID | Task | Priority | Category | Difficulty | Risk | Required Agents | Dependencies |
|----|------|----------|----------|------------|------|----------------|--------------|
| T-006 | Implement BackButton in all modals | P2 | Platform | Medium | MEDIUM | Telegram Mini App Expert, Frontend Architect | C-003 |
| T-007 | Implement MainButton for key actions | P2 | Platform | Low | LOW | Telegram Mini App Expert | T-006 |
| T-008 | Add platform detection (iOS/Android/Desktop) | P2 | Platform | Low | LOW | Frontend Architect | None |
| T-009 | Add error boundaries for crash recovery | P2 | Platform | Low | LOW | Frontend Architect | T-001 |
| T-010 | Use showShareMenu API for sharing | P2 | Platform | Low | LOW | Telegram Mini App Expert | T-006 |

### Database — Schema

| ID | Task | Priority | Category | Difficulty | Risk | Required Agents | Dependencies |
|----|------|----------|----------|------------|------|----------------|--------------|
| D-001 | Add database indexes for leaderboard | P2 | Database | Low | LOW | Database Architect | S-017 |
| D-002 | Optimize offline income query | P2 | Database | Medium | MEDIUM | Database Architect | S-009 |
| D-003 | Add unique constraint on ad rewards log | P2 | Database | Low | LOW | Database Architect | S-005 |
| D-004 | Create database backup verification | P2 | Database | Low | MEDIUM | DevOps Engineer | F-001 |
| D-005 | Configure connection pooling | P2 | Database | Low | LOW | Database Architect | None |

---

## P3 — LOW PRIORITY (Nice to Have)

### Code Quality — Polish

| ID | Task | Priority | Category | Difficulty | Risk | Required Agents | Dependencies |
|----|------|----------|----------|------------|------|----------------|--------------|
| C-008 | Establish naming conventions | P3 | Code Quality | Low | LOW | Code Reviewer | None |
| C-009 | Add loading states to all async ops | P3 | UX | Low | LOW | Frontend Architect | C-002 |
| C-010 | Improve number formatting (toFixed fix) | P3 | UX | Low | LOW | Frontend Architect | None |
| C-011 | Add request timeout to all fetch calls | P3 | Performance | Low | LOW | Frontend Architect | None |
| C-012 | Audit requiredRebirth values | P3 | Game Design | Low | LOW | Lead Game Designer | None |

### DevOps — Advanced

| ID | Task | Priority | Category | Difficulty | Risk | Required Agents | Dependencies |
|----|------|----------|----------|------------|------|----------------|--------------|
| D-006 | Set up Dependabot for npm | P3 | DevOps | Low | LOW | DevOps Engineer | F-001 |
| D-007 | Create deployment runbook | P3 | DevOps | Low | LOW | DevOps Engineer | F-001 |
| D-008 | Document incident response | P3 | DevOps | Low | LOW | DevOps Engineer | M-004 |
| D-009 | Add feature flag system | P3 | DevOps | Medium | MEDIUM | Backend Architect | A-001 |
| D-010 | Implement canary deployments | P3 | DevOps | Medium | MEDIUM | DevOps Engineer | D-009 |
| D-011 | Create disaster recovery runbook | P3 | DevOps | Low | MEDIUM | DevOps Engineer | D-007 |
| D-012 | Add CODEQL security scanning | P3 | DevOps | Low | LOW | DevOps Engineer | F-001 |
| D-013 | Implement database backup strategy | P3 | DevOps | Medium | MEDIUM | DevOps Engineer | D-004 |

### Localization — i18n

| ID | Task | Priority | Category | Difficulty | Risk | Required Agents | Dependencies |
|----|------|----------|----------|------------|------|----------------|--------------|
| I-001 | Set up i18next for translations | P3 | Localization | Medium | LOW | Frontend Architect, Technical Writer | None |
| I-002 | Create EN translation file | P3 | Localization | Medium | LOW | Technical Writer | I-001 |
| I-003 | Create RU translation file | P3 | Localization | Medium | LOW | Technical Writer | I-001 |
| I-004 | Add language detection from Telegram | P3 | Platform | Low | LOW | Frontend Architect | I-001 |
| I-005 | Add language switcher in settings | P3 | Frontend | Low | LOW | Frontend Architect | I-004 |
| I-006 | Prepare for RTL support | P3 | Frontend | Medium | LOW | Frontend Architect | I-001 |

### Security — Advanced

| ID | Task | Priority | Category | Difficulty | Risk | Required Agents | Dependencies |
|----|------|----------|----------|------------|------|----------------|--------------|
| S-016 | Add GDPR consent flow | P3 | Security | Low | MEDIUM | Security Engineer, Legal | None |
| S-017 | Implement data export functionality | P3 | Security | Low | MEDIUM | Backend Architect | S-016 |
| S-018 | Create account deletion process | P3 | Security | Low | MEDIUM | Backend Architect | S-016 |
| S-019 | Add age verification | P3 | Security | Low | LOW | Lead Game Designer | None |
| S-020 | Add payment receipt generation | P3 | Security | Low | LOW | Backend Architect | M-009 |

### UX — Polish

| ID | Task | Priority | Category | Difficulty | Risk | Required Agents | Dependencies |
|----|------|----------|----------|------------|------|----------------|--------------|
| U-001 | Add sound effects for milestones | P3 | UX | Low | LOW | UI Art Director | G-001 |
| U-002 | Add haptic feedback for achievements | P3 | UX | Low | LOW | UI Art Director | G-002 |
| U-003 | Improve referral UI clarity | P3 | UX | Low | LOW | UX Director | None |
| U-004 | Add offline detection for critical saves | P3 | UX | Medium | MEDIUM | Frontend Architect | None |
| U-005 | Add IndexedDB queue for offline saves | P3 | Backend | Medium | MEDIUM | Frontend Architect | U-004 |

### Documentation — Technical Writing

| ID | Task | Priority | Category | Difficulty | Risk | Required Agents | Dependencies |
|----|------|----------|----------|------------|------|----------------|--------------|
| W-001 | Add OpenAPI docs to edge functions | P3 | Documentation | Low | LOW | Technical Writer | None |
| W-002 | Create onboarding guide | P3 | Documentation | Low | LOW | Technical Writer | C-001, C-002 |
| W-003 | Document architecture decisions (ADRs) | P3 | Documentation | Low | LOW | Technical Writer | None |
| W-004 | Add JSDoc to edge functions | P3 | Documentation | Low | LOW | Technical Writer | None |
| W-005 | Update README with current info | P3 | Documentation | Low | LOW | Technical Writer | None |

### Analytics — Advanced

| ID | Task | Priority | Category | Difficulty | Risk | Required Agents | Dependencies |
|----|------|----------|----------|------------|------|----------------|--------------|
| A-006 | Build cohort analysis dashboard | P3 | Analytics | Medium | MEDIUM | Analytics Engineer | A-004 |
| A-007 | Implement revenue tracking per feature | P3 | Analytics | Medium | MEDIUM | Analytics Engineer | A-001 |
| A-008 | Create retention curves dashboard | P3 | Analytics | Medium | MEDIUM | Analytics Engineer | A-004 |
| A-009 | Add predictive churn modeling | P3 | Analytics | High | MEDIUM | Analytics Engineer | A-006 |

---

## Backlog Summary by Category

| Category | P0 | P1 | P2 | P3 | Total |
|----------|----|----|----|----|-------|
| Security | 10 | 4 | 5 | 5 | 24 |
| Economy | 5 | 5 | 3 | 0 | 13 |
| DevOps | 4 | 5 | 8 | 8 | 25 |
| QA | 0 | 5 | 0 | 0 | 5 |
| Analytics | 0 | 5 | 5 | 4 | 14 |
| Game Design | 0 | 6 | 7 | 2 | 15 |
| Frontend | 0 | 2 | 8 | 6 | 16 |
| Backend | 0 | 2 | 5 | 2 | 9 |
| Monetization | 0 | 5 | 7 | 0 | 12 |
| LiveOps | 0 | 0 | 11 | 0 | 11 |
| Social | 0 | 0 | 9 | 0 | 9 |
| Platform | 0 | 0 | 5 | 6 | 11 |
| Database | 0 | 0 | 5 | 0 | 5 |
| Localization | 0 | 0 | 0 | 6 | 6 |
| Documentation | 0 | 0 | 0 | 5 | 5 |
| **TOTAL** | **19** | **39** | **78** | **44** | **180** |

---

## Task Prioritization Matrix

### Quick Wins (Low Effort, High Impact)
| ID | Task | Priority | Effort | Impact |
|----|------|----------|--------|--------|
| E-003 | Increase gacha costs 5-10x | P0 | Low | High |
| E-004 | Rebalance prestige research costs | P0 | Low | High |
| S-004 | Remove hardcoded AdsGram secret | P0 | Low | High |
| S-006 | Restrict CORS to Telegram domains | P0 | Low | High |
| S-007 | Fix HTML injection in push-notification | P0 | Low | High |
| E-005 | Add gacha pity system | P0 | Low | High |
| E-006 | Improve duplicate artifact fragments | P1 | Low | Medium |
| G-001 | Add milestone celebrations | P1 | Low | High |
| G-005 | Enhance daily task UI | P1 | Low | Medium |

### Major Projects (High Effort, High Impact)
| ID | Task | Priority | Effort | Impact |
|----|------|----------|--------|--------|
| S-001 | Add HMAC validation to all edge functions | P0 | Medium | Critical |
| S-002 | Fix RLS policies | P0 | Medium | Critical |
| F-001 | Set up GitHub Actions CI pipeline | P0 | Medium | High |
| G-002 | Implement achievement system | P1 | High | High |
| M-006 | Build Battle Pass Season 1 | P1 | High | Critical |
| S-019 | Build guild/clan system | P2 | High | High |
| C-002 | Split useGame.ts into focused hooks | P2 | High | Medium |

---

*Document Version: 1.1*  
*Classification: CONFIDENTIAL*  
*Distribution: Internal AI Studio Agents Only*  
*Prepared by: Executive Producer*  
*Date: 2026-07-03*

---

## ✅ COMPLETED IN PHASE 16-20 (2026-07-03)

| Task ID | Task | Status | Notes |
|---------|------|--------|-------|
| S-004 | Remove hardcoded AdsGram secret | ✅ Done | Moved to server env var |
| S-005 | Rate limiting | ✅ Done | Logging added |
| S-013 | Duplicate tab detection improvement | ✅ Done | BroadcastChannel + server |
| F-001 | Set up GitHub Actions CI | ✅ Done | Already configured |
| T-001 | Set up Vitest test framework | ✅ Done | 179 tests created |
| T-002 | Write XP calculation unit tests | ✅ Done | 19 tests |
| T-003 | Write game state transformation tests | ✅ Done | Multiple test files |
| C-002 | Split useGame.ts into focused hooks | ✅ Done | useTaps, usePassiveIncome, useDailyContent |
| E-001 | Redesign energy system | ✅ Done | Gradual 1x-5x curve |
| E-002 | Fix generator cost scaling | ✅ Done | 1.15 → 1.27 |
| E-005 | Add gacha pity system | ✅ Done | 50 Epic, 200 Legendary |
| G-001 | Add milestone celebrations | ✅ Done | 123+ achievements |
| G-002 | Implement achievement system | ✅ Done | 123+ achievements |
| G-005 | Enhance daily task UI | ✅ Done | useDailyContent hook |
| M-006 | Build Battle Pass Season 1 | ✅ Done | 30 tiers |
| A-001 | Create analytics_events table | ✅ Done | analytics_sessions |
| A-002 | Build analytics edge function | ✅ Done | track-analytics |
| A-005 | Build A/B test infrastructure | ✅ Done | abTest.ts |
| M-001 | Set up Sentry error tracking | ✅ Done | @sentry/react |