# Virtual Museum Tapper Game — Production Roadmap
## Jolt Time (Україна Крізь Час) | v1.6.6

**Document Version:** 1.0  
**Date:** 2026-07-02  
**Classification:** CONFIDENTIAL — AAA STUDIO PRODUCTION STANDARDS  
**Prepared By:** Executive Producer  
**Last Updated:** 2026-07-02  

---

## Executive Overview

This production roadmap is based on the comprehensive audit reports (23 audit documents) that assessed the Virtual Museum Tapper Game at **5.2/10 — ALPHA** readiness. The roadmap spans **30 development phases** designed to evolve the game incrementally toward AAA production quality over a 12-16 week period.

### Current State Assessment
| Metric | Score | Assessment |
|--------|-------|------------|
| Overall Production Score | 5.2/10 | ALPHA |
| Security | 2/10 | CRITICAL — 9+ vulnerabilities |
| Economy | 4/10 | Broken post-prestige |
| Game Design | 4/10 | Missing engagement |
| Frontend | 6/10 | Functional, needs polish |
| Backend | 6/10 | Good architecture, weak security |
| QA | 3/10 | No test coverage |
| LiveOps | 4/10 | No event system |
| Monetization | 5/10 | Undermonetized |

### Critical Blockers (Must Fix First)
1. **Security vulnerabilities** (CRITICAL) — 9+ critical issues, CVSS 9-10
2. **Economy broken** — Generators pay back in under 1 minute, infinite inflation
3. **No engagement architecture** — No milestones, achievements, or urgency
4. **Zero CI/CD** — Manual deployments, no rollback capability
5. **No test coverage** — Cannot safely deploy changes

---

## Roadmap Philosophy

### Principles
1. **Security First** — No revenue, engagement, or polish matters if the game is exploitable
2. **Incremental Improvement** — Never rewrite, always evolve
3. **No Gameplay Breaking Changes** — Every phase maintains playable state
4. **Data-Driven** — Analytics infrastructure enables informed decisions
5. **Production Quality** — Apply Supercell, Dream Games, Playrix standards

### Phase Ordering Rationale
- **Phases 1-5**: Security hardening (no game value without trust)
- **Phases 6-10**: Economy stabilization (broken economy destroys retention)
- **Phases 11-15**: Foundation building (CI/CD, testing, analytics)
- **Phases 16-20**: Engagement systems (achievements, milestones, events)
- **Phases 21-25**: Monetization (Battle Pass, IAP expansion)
- **Phases 26-30**: Polish & scale (performance, social, internationalization)

---

## 30-Phase Development Roadmap

### PHASE 1: Critical Security Remediation — HMAC Validation

**Phase Name:** Critical Security Remediation — HMAC Validation  
**Objective:** Add Telegram initData HMAC-SHA256 validation to all edge functions  
**Business Value:** Eliminates identity spoofing attacks, protects revenue, enables secure expansion  
**Player Value:** Fair gameplay, protected accounts  
**Production Priority:** P0 — CRITICAL  
**Estimated Complexity:** Medium (3-5 hours)  
**Estimated Risk:** Low (follows existing pattern)  
**Dependencies:** None (can start immediately)  
**Required Agents:** Backend Architect, Security Engineer, Anti-Cheat Engineer

**Why This Phase Exists:**
- 8 of 10 edge functions accept `telegram_id` from request body without validation
- Any attacker can target any user to claim rewards, force prestige, steal offline income
- This is the #1 blocker for any production launch

**Why It Comes Before Phase 2:**
- Cannot build economy on an exploitable foundation
- Revenue losses begin immediately upon public launch

**Why It Should Not Be Skipped:**
- Without this, the game cannot be trusted with real money
- Telegram Mini App reputation is at stake

**Expected Deliverables:**
- Shared `validateRequest()` middleware for all edge functions
- HMAC validation added to: `open-chest`, `perform-prestige`, `claim-ad-reward`, `claim-offline-income`, `adsgram-reward`, `track-session`, `push-notification`
- Validation utility in `/supabase/functions/_shared/validate-init-data.ts`

**Files Likely Affected:**
- `supabase/functions/_shared/` (new directory)
- `supabase/functions/open-chest/index.ts`
- `supabase/functions/perform-prestige/index.ts`
- `supabase/functions/claim-ad-reward/index.ts`
- `supabase/functions/claim-offline-income/index.ts`
- `supabase/functions/adsgram-reward/index.ts`
- `supabase/functions/track-session/index.ts`
- `supabase/functions/push-notification/index.ts`

**Testing Requirements:**
- Unit test for HMAC validation utility
- Integration tests for each modified endpoint
- Security penetration test for identity spoofing attempts

**Rollback Strategy:**
- Feature flag to disable new validation temporarily
- Previous version of edge functions in Git history

**Definition of Done:**
- [ ] All 8 edge functions validate HMAC signature
- [ ] Unauthorized requests return 401/403
- [ ] telegram_id from body is compared against validated userId
- [ ] No regression in existing functionality

**Production Acceptance Criteria:**
- 100% of edge functions validate Telegram initData
- Zero identity spoofing vulnerabilities in security scan
- All existing test cases pass

---

### PHASE 2: Critical Security Remediation — RLS Policies

**Phase Name:** Critical Security Remediation — Row Level Security  
**Objective:** Fix broken RLS policies that allow universal read/write access  
**Business Value:** Prevents full player data breach, protects privacy compliance  
**Player Value:** Secure personal data  
**Production Priority:** P0 — CRITICAL  
**Estimated Complexity:** Medium (2-3 hours)  
**Estimated Risk:** Medium (RLS changes require careful migration)  
**Dependencies:** Phase 1  
**Required Agents:** Database Architect, Security Engineer

**Why This Phase Exists:**
- Current RLS policies use `USING (true)` — allows ANY user to read/write ANY player's data
- Complete data breach possible — all player states exposed

**Why It Comes Before Phase 3:**
- RLS is fundamental database security
- All other security work is undermined if DB access is unconstrained

**Why It Should Not Be Skipped:**
- GDPR compliance requires proper data isolation
- Public disclosure of RLS vulnerability would destroy trust

**Expected Deliverables:**
- Proper RLS policies using telegram_id from JWT claims
- All table access routed through edge functions
- Migration script to apply changes safely

**Files Likely Affected:**
- `supabase/migrations/` (new migration)
- `supabase/functions/_shared/validate-init-data.ts`

**Testing Requirements:**
- Verify user A cannot read user B's data
- Verify user A cannot write to user B's data
- Test edge function access still works

**Rollback Strategy:**
- Previous migration to restore old policies
- Feature flag to bypass RLS for emergency fixes

**Definition of Done:**
- [x] RLS policies properly restrict to authenticated user only ✅
- [x] No direct table access from client ✅
- [x] All game_progress access through edge functions ✅

---

### PHASE 3: Critical Security Remediation — Race Condition Fix

**Phase Name:** Critical Security Remediation — Race Condition Fix  
**Objective:** Fix `swap_last_online_at` RPC that returns wrong value causing double-claim  
**Business Value:** Prevents duplicate offline income exploitation, protects economy  
**Player Value:** Fair offline rewards  
**Production Priority:** P0 — CRITICAL  
**Estimated Complexity:** Medium (2-3 hours)  
**Estimated Risk:** Medium (fixes production data)  
**Dependencies:** Phase 1, Phase 2  
**Required Agents:** Backend Architect, Database Architect

**Why This Phase Exists:**
- RPC returns NEW timestamp instead of OLD, causing race condition
- Players can claim offline income twice via concurrent requests
- Economy inflation from unearned currency

**Why It Comes Before Phase 4:**
- Offline income is a core retention mechanic
- Exploits in this system undermine player trust

**Why It Should Not Be Skipped:**
- Active exploit already possible in production
- Every day without fix adds inflation to economy

**Expected Deliverables:**
- Fixed `swap_last_online_at` RPC with proper atomic swap
- PostgreSQL advisory locks for concurrent request handling
- Migration to deploy fix

**Files Likely Affected:**
- `supabase/migrations/018_swap_last_online_at_lock_fix.sql`
- `supabase/functions/claim-offline-income/index.ts`

**Testing Requirements:**
- Concurrent request test for double-claim prevention
- Verify offline income calculated correctly
- Load test with 100+ concurrent users

**Rollback Strategy:**
- Revert migration to previous version
- Emergency RPC update if needed

**Definition of Done:**
- [ ] RPC returns OLD value, not NEW
- [ ] Concurrent requests cannot double-claim
- [ ] Offline income calculation is accurate

---

### PHASE 4: Security Hardening — Secrets & Rate Limiting

**Phase Name:** Security Hardening — Secrets & Rate Limiting  
**Objective:** Remove hardcoded secrets, implement rate limiting on all edge functions  
**Business Value:** Prevents revenue fraud, DoS attacks  
**Player Value:** Consistent service availability  
**Production Priority:** P1 — HIGH  
**Estimated Complexity:** Medium (4-6 hours)  
**Estimated Risk:** Low  
**Dependencies:** Phase 1, Phase 2, Phase 3  
**Required Agents:** Backend Architect, Security Engineer, DevOps Engineer

**Why This Phase Exists:**
- AdsGram secret exposed in frontend code
- No rate limiting on any endpoint — spam/flooding possible
- CORS allows all origins — CSRF vector

**Why It Comes Before Phase 5:**
- Completes the security foundation
- Enables safe external integration

**Why It Should Not Be Skipped:**
- Secrets exposure allows unlimited ad reward farming
- Rate limiting prevents DoS that would block legitimate users

**Expected Deliverables:**
- Secrets moved to environment variables
- Rate limiting middleware for all edge functions
- CORS restricted to Telegram domains only
- HTML sanitization in push-notification function

**Files Likely Affected:**
- `src/services/adsgram.ts`
- `supabase/functions/*/index.ts` (all)
- Environment configuration files

**Testing Requirements:**
- Verify secret not accessible from frontend
- Rate limit test: 100 rapid requests should be throttled
- CORS test: external domains should be rejected

**Rollback Strategy:**
- Feature flags for rate limiting
- Emergency secret rotation procedure

**Definition of Done:**
- [ ] No hardcoded secrets in source code
- [ ] Rate limiting active on all endpoints
- [ ] CORS restricted to Telegram domains

---

### PHASE 5: Economy Stabilization — Energy System Redesign

**Phase Name:** Economy Stabilization — Energy System Redesign  
**Objective:** Replace binary x5 energy multiplier with gradual curve  
**Business Value:** Creates meaningful energy management, improves engagement  
**Player Value:** Strategic decisions, satisfying energy management  
**Production Priority:** P1 — HIGH  
**Estimated Complexity:** Medium (3-5 hours)  
**Estimated Risk:** Medium (changes core mechanic)  
**Dependencies:** Phase 4  
**Required Agents:** Senior Economy Designer, Lead Game Designer

**Why This Phase Exists:**
- Current energy: `energy > 0 ? 5 : 1` — cliff function, not a curve
- Energy is meaningless: 1000 max, -1 per tap, regens slowly
- Players tap 5-10/second, draining energy instantly

**Why It Comes Before Phase 6:**
- Energy is core to tap/boost loop
- Must be balanced before scaling systems

**Why It Should Not Be Skipped:**
- Without meaningful energy, there's no strategic depth
- Passive income already dominates — energy makes it worse

**Expected Deliverables:**
- Gradual energy multiplier curve (e.g., 0 energy = 1x, 100 = 2x, 500 = 3x, 1000 = 5x)
- Adjusted regeneration rate
- New energy cost per tap formula
- UI showing multiplier clearly

**Files Likely Affected:**
- `src/hooks/useGame.ts` (energy calculations)
- UI components showing energy status

**Testing Requirements:**
- Verify multiplier scales correctly with energy
- Test energy drain rate matches design
- Balance test: active vs idle play styles

**Rollback Strategy:**
- Feature flag for gradual vs binary curve
- Configuration-driven multiplier

**Definition of Done:**
- [ ] Energy has meaningful multiplier curve
- [ ] Players make strategic decisions about energy use
- [ ] Active play is rewarded vs pure idle

---

### PHASE 6: Economy Stabilization — Generator Cost Scaling

**Phase Name:** Economy Stabilization — Generator Cost Scaling  
**Objective:** Fix generator cost scaling that becomes trivial post-prestige  
**Business Value:** Creates meaningful progression, extends game lifespan  
**Player Value:** Satisfying progression, strategic generator choices  
**Production Priority:** P1 — HIGH  
**Estimated Complexity:** Medium (3-4 hours)  
**Estimated Risk:** Medium (economy changes)  
**Dependencies:** Phase 5  
**Required Agents:** Senior Economy Designer, Lead Game Designer

**Why This Phase Exists:**
- Current formula: `cost = baseCost × 1.15^level`
- Generators pay for themselves in under 1 minute
- Post-prestige, entire Epoch 1 becomes trivial

**Why It Comes Before Phase 7:**
- Generator economy must be stable before prestige expansion
- Currency must have meaning

**Why It Should Not Be Skipped:**
- Without meaningful generator costs, currency is worthless
- Players hit end-game too quickly

**Expected Deliverables:**
- Epoch-specific cost scaling (1.25-1.30 for later epochs)
- Progressive cost multipliers per epoch tier
- Balanced generator production rates

**Files Likely Affected:**
- `src/data/epochs.ts` (generator definitions)
- `src/components/GeneratorShop.tsx`

**Testing Requirements:**
- Verify early epoch generators are accessible
- Verify late epoch generators require significant investment
- Post-prestige economy test

**Rollback Strategy:**
- Configuration-driven cost formulas
- Feature flag for new vs old scaling

**Definition of Done:**
- [ ] Generators provide meaningful progression curve
- [ ] Post-prestige Epoch 1 still requires investment
- [ ] No "free generators" exploit possible

---

### PHASE 7: Economy Stabilization — Gacha & Artifact Balance

**Phase Name:** Economy Stabilization — Gacha & Artifact Balance  
**Objective:** Balance gacha costs, improve duplicate artifact experience  
**Business Value:** Better monetization, reduced frustration  
**Player Value:** Meaningful gacha pulls, satisfying collection  
**Production Priority:** P1 — HIGH  
**Estimated Complexity:** Medium (4-6 hours)  
**Estimated Risk:** Medium  
**Dependencies:** Phase 6  
**Required Agents:** Senior Economy Designer, Lead Game Designer

**Why This Phase Exists:**
- Gacha costs 100 currency for Epoch 1 — trivially cheap
- Duplicates feel bad — no meaningful fragment return
- No pity system for rare drops

**Why It Comes Before Phase 8:**
- Gacha is a core engagement loop
- Must be balanced before adding rewards/events

**Why It Should Not Be Skipped:**
- Spam gacha reduces its excitement
- Duplicate frustration drives churn

**Expected Deliverables:**
- Increased gacha costs (500-1000 for Epoch 1)
- Pity system (50 chest for Epic+, 200 for Legendary)
- Improved duplicate fragment return (2-3x)
- Artifact "essence" conversion option

**Files Likely Affected:**
- `src/components/GachaModal.tsx`
- `src/data/epochs.ts` (artifact definitions)
- `supabase/functions/open-chest/index.ts`

**Testing Requirements:**
- Gacha probability verification
- Pity counter tracking test
- Duplicate handling test

**Rollback Strategy:**
- Configuration-driven gacha prices
- Database flag to disable pity temporarily

**Definition of Done:**
- [ ] Gacha creates tension and excitement
- [ ] Pity system prevents pure frustration
- [ ] Duplicates provide meaningful progress

---

### PHASE 8: Economy Stabilization — Server-Side Offline Income

**Phase Name:** Economy Stabilization — Server-Side Offline Income  
**Objective:** Move offline income calculation to server, prevent exploitation  
**Business Value:** Economy integrity, fair play  
**Player Value:** Reliable offline rewards  
**Production Priority:** P1 — HIGH  
**Estimated Complexity:** Medium (4-6 hours)  
**Estimated Risk:** Medium  
**Dependencies:** Phase 4  
**Required Agents:** Backend Architect, Senior Economy Designer

**Why This Phase Exists:**
- Offline income currently calculated client-side
- Device clock manipulation possible
- Exploitable via DevTools

**Why It Comes Before Phase 9:**
- Must have server-authoritative offline income before adding more rewards
- All passive income should be server-tracked

**Why It Should Not Be Skipped:**
- Client-side offline income undermines entire economy
- Active exploit in production

**Expected Deliverables:**
- Server-side offline income calculation in edge function
- Server-authoritative `lastOnlineAt` timestamp
- Removal of client-side offline calculation

**Files Likely Affected:**
- `src/hooks/useGame.ts`
- `src/lib/storage.ts`
- `supabase/functions/claim-offline-income/index.ts`

**Testing Requirements:**
- Offline income calculation accuracy test
- Device clock manipulation test
- Multiple device/offline session test

**Rollback Strategy:**
- Emergency flag to use client-side calculation
- Server-side feature flag

**Definition of Done:**
- [ ] Offline income calculated server-side only
- [ ] Client cannot manipulate offline gains
- [ ] Offline income matches active play equivalent

---

### PHASE 9: Economy Stabilization — Prestige Research Rebalancing

**Phase Name:** Economy Stabilization — Prestige Research Rebalancing  
**Objective:** Fix prestige research costs that are underpriced  
**Business Value:** Better whale/F2P balance, sustainable prestige loop  
**Player Value:** Meaningful prestige decisions  
**Production Priority:** P2 — MEDIUM  
**Estimated Complexity:** Low (2-3 hours)  
**Estimated Risk:** Low  
**Dependencies:** Phase 8  
**Required Agents:** Senior Economy Designer

**Why This Phase Exists:**
- Chief Historian costs 1 point for +5% XP — too cheap
- World Expedition costs 3 points for +10% passive — too strong
- Post-prestige players get 2-3x production easily

**Why It Comes Before Phase 10:**
- Prestige is the core endgame loop
- Must be balanced before expanding content

**Why It Should Not Be Skipped:**
- Overpowered prestige research trivializes content
- Revenue potential from prestige is lost

**Expected Deliverables:**
- Chief Historian: 2-3 points per level (was 1)
- World Expedition: 4-5 points per level (was 3)
- Balance formula for all prestige upgrades

**Files Likely Affected:**
- `src/data/epochs.ts` (prestige research definitions)
- `src/components/RebirthSystem.tsx`

**Testing Requirements:**
- New player prestige progression test
- Veteran player power curve test
- F2P vs whale balance test

**Rollback Strategy:**
- Configuration-driven prestige costs
- Database flag for old/new values

**Definition of Done:**
- [ ] Prestige research requires meaningful investment
- [ ] F2P can compete with spending via time
- [ ] Prestige points feel valuable

---

### PHASE 10: Foundation — CI/CD Pipeline Setup

**Phase Name:** Foundation — CI/CD Pipeline Setup  
**Objective:** Establish automated CI/CD pipeline with GitHub Actions  
**Business Value:** Safe deployments, reduced human error, faster iteration  
**Player Value:** Faster bug fixes, more features  
**Production Priority:** P1 — HIGH  
**Estimated Complexity:** Medium (6-8 hours)  
**Estimated Risk:** Medium  
**Dependencies:** None (can parallel with Phases 1-9)  
**Required Agents:** DevOps Engineer, Backend Architect

**Why This Phase Exists:**
- Zero DevOps infrastructure — manual deployments only
- No rollback capability — broken deployments require manual fixes
- No automated testing — bugs reach production

**Why It Comes Before Phase 11:**
- All future work requires safe deployment infrastructure
- Cannot maintain quality without automated checks

**Why It Should Not Be Skipped:**
- Manual deployments are error-prone
- Cannot scale development without CI/CD

**Expected Deliverables:**
- GitHub Actions workflow for CI
- Automated lint, typecheck, build stages
- Branch protection rules
- PR templates

**Files Likely Affected:**
- `.github/workflows/ci.yml` (new)
- `.github/CODEOWNERS` (new)
- `.github/PULL_REQUEST_TEMPLATE.md` (new)
- `package.json` (new scripts)

**Testing Requirements:**
- Verify CI pipeline runs on PR
- Verify branch protection enforced
- Verify all checks required for merge

**Rollback Strategy:**
- Disable GitHub Actions temporarily
- Manual deployment fallback

**Definition of Done:**
- [ ] CI pipeline runs automatically
- [ ] All checks required for merge
- [ ] Build artifacts stored

---

### PHASE 11: Foundation — Automated Testing Infrastructure

**Phase Name:** Foundation — Automated Testing Infrastructure  
**Objective:** Implement test framework with core unit tests  
**Business Value:** Confidence in deployments, bug prevention  
**Player Value:** More stable gameplay  
**Production Priority:** P1 — HIGH  
**Estimated Complexity:** Medium (8-12 hours)  
**Estimated Risk:** Low  
**Dependencies:** Phase 10  
**Required Agents:** QA Lead, Automation QA Engineer

**Why This Phase Exists:**
- Zero automated tests exist
- Refactoring risks breaking functionality
- Cannot safely deploy without tests

**Why It Comes Before Phase 12:**
- Tests are prerequisite for all code changes
- Enables confident refactoring

**Why It Should Not Be Skipped:**
- Each bug in production is lost revenue/players
- Technical debt grows without regression prevention

**Expected Deliverables:**
- Vitest test framework setup
- XP calculation unit tests
- Game state transformation tests
- Edge function handler tests
- React component rendering tests

**Files Likely Affected:**
- `src/**/*.test.ts` (new)
- `supabase/functions/**/*.test.ts` (new)
- `package.json` (test dependencies)
- `vite.config.ts` (test configuration)

**Testing Requirements:**
- All new tests pass
- Minimum 70% coverage on utility functions
- CI/CD integration

**Rollback Strategy:**
- Disable test requirement in CI temporarily
- Revert test files

**Definition of Done:**
- [ ] Test framework functional
- [ ] Core XP calculations tested
- [ ] Game state logic tested
- [ ] CI/CD runs tests automatically

---

### PHASE 12: Foundation — Analytics Infrastructure

**Phase Name:** Foundation — Analytics Infrastructure  
**Objective:** Build event tracking pipeline and analytics tables  
**Business Value:** Data-driven decisions, retention optimization  
**Player Value:** Better game based on data  
**Production Priority:** P1 — HIGH  
**Estimated Complexity:** Medium (6-8 hours)  
**Estimated Risk:** Low  
**Dependencies:** Phase 10  
**Required Agents:** Analytics Engineer, Backend Architect

**Why This Phase Exists:**
- Flying blind — no analytics infrastructure
- Cannot measure retention, engagement, revenue
- No A/B testing capability

**Why It Comes Before Phase 13:**
- All future features need analytics hooks
- Cannot optimize without measurement

**Why It Should Not Be Skipped:**
- Data-driven development requires data
- Optimization impossible without metrics

**Expected Deliverables:**
- `analytics_events` table in Supabase
- Analytics edge function for batch event ingestion
- Core events: session_start, level_up, purchase_completed, ad_viewed, gacha_opened, churned
- Analytics dashboard setup

**Files Likely Affected:**
- `supabase/migrations/` (new)
- `supabase/functions/track-analytics/index.ts` (new)
- `src/lib/analytics.ts` (new)
- `src/hooks/useGame.ts` (event tracking)

**Testing Requirements:**
- Event tracking accuracy test
- Analytics edge function load test
- Dashboard data verification

**Rollback Strategy:**
- Disable event tracking feature flag
- Continue without analytics temporarily

**Definition of Done:**
- [ ] Core events tracked automatically
- [ ] Analytics dashboard shows key metrics
- [ ] A/B test infrastructure ready

---

### PHASE 13: Foundation — Error Tracking & Monitoring

**Phase Name:** Foundation — Error Tracking & Monitoring  
**Objective:** Set up Sentry error tracking and uptime monitoring  
**Business Value:** Proactive issue discovery, faster resolution  
**Player Value:** Fewer crashes, smoother experience  
**Production Priority:** P2 — MEDIUM  
**Estimated Complexity:** Low (2-3 hours)  
**Estimated Risk:** Low  
**Dependencies:** Phase 10  
**Required Agents:** DevOps Engineer, Performance Engineer

**Why This Phase Exists:**
- No error tracking — issues discovered reactively
- No uptime monitoring — outages unknown until players complain

**Why It Comes Before Phase 14:**
- Must have observability for all future work
- Cannot maintain quality without monitoring

**Why It Should Not Be Skipped:**
- Player-facing bugs without visibility
- Revenue loss during undetected downtime

**Expected Deliverables:**
- Sentry SDK integration (frontend + edge functions)
- UptimeRobot or similar monitoring
- Slack alerts for errors and downtime
- Monitoring dashboard

**Files Likely Affected:**
- `src/main.tsx` (Sentry init)
- Edge functions (Sentry integration)
- `index.html` (error boundary)

**Testing Requirements:**
- Error captured in Sentry
- Alert triggers correctly
- Dashboard accessible

**Rollback Strategy:**
- Disable Sentry SDK temporarily
- Manual monitoring fallback

**Definition of Done:**
- [ ] Errors captured in Sentry
- [ ] Uptime monitoring active
- [ ] Alerts configured and tested

---

### PHASE 14: Foundation — Feature Flag System

**Phase Name:** Foundation — Feature Flag System  
**Objective:** Implement feature flag infrastructure for controlled rollouts  
**Business Value:** Safe deployments, A/B testing, instant rollbacks  
**Player Value:** Stable experience, faster improvements  
**Production Priority:** P2 — MEDIUM  
**Estimated Complexity:** Medium (4-6 hours)  
**Estimated Risk:** Low  
**Dependencies:** Phase 12  
**Required Agents:** Backend Architect, DevOps Engineer

**Why This Phase Exists:**
- No way to disable features quickly
- Cannot do A/B tests safely
- Rollbacks require full re-deploy

**Why It Comes Before Phase 15:**
- Enables safe experimentation
- Prerequisite for LiveOps features

**Why It Should Not Be Skipped:**
- Production without feature flags is brittle
- Cannot iterate quickly without rollback capability

**Expected Deliverables:**
- Feature flag table in Supabase
- Feature flag edge function
- Frontend SDK for flag checking
- Admin UI for flag management

**Files Likely Affected:**
- `supabase/migrations/` (new)
- `supabase/functions/feature-flags/index.ts` (new)
- `src/lib/flags.ts` (new)
- `src/hooks/useFlags.ts` (new)

**Testing Requirements:**
- Flag toggle propagation test
- Fallback value test
- Admin UI functionality test

**Rollback Strategy:**
- Disable flag via admin UI
- Immediate effect without deployment

**Definition of Done:**
- [ ] Flags stored in database
- [ ] Frontend SDK checks flags
- [ ] Admin UI functional
- [ ] Flags propagate within 1 minute

---

### PHASE 15: Foundation — Code Quality & Refactoring

**Phase Name:** Foundation — Code Quality & Refactoring  
**Objective:** Address critical technical debt, improve code organization  
**Business Value:** Maintainability, faster development, fewer bugs  
**Player Value:** Indirect (better game stability)  
**Production Priority:** P2 — MEDIUM  
**Estimated Complexity:** Medium (8-12 hours)  
**Estimated Risk:** Medium (refactoring)  
**Dependencies:** Phase 11 (tests)  
**Required Agents:** Refactoring Specialist, Code Reviewer

**Why This Phase Exists:**
- Critical technical debt: duplicate XP calculations, monolithic files
- `useGame.ts` is 480+ lines handling 45+ state variables
- `App.tsx` is 650+ lines with multiple concerns

**Why It Comes Before Phase 16:**
- Must clean up before adding new features
- Technical debt slows all future development

**Why It Should Not Be Skipped:**
- Each day with debt adds more debt
- Onboarding new developers is harder
- Bug probability increases

**Expected Deliverables:**
- Shared XP calculation utility
- React Context for state management
- Split App.tsx into feature components
- Split useGame.ts into focused hooks
- Remove duplicate artifact definitions

**Files Likely Affected:**
- `src/hooks/useGame.ts` (refactored)
- `src/App.tsx` (refactored)
- `src/lib/xp-calculations.ts` (new)
- `src/contexts/GameContext.tsx` (new)

**Testing Requirements:**
- All existing tests pass
- Manual gameplay test
- No regression in functionality

**Rollback Strategy:**
- Git revert of refactoring
- Feature flags for new structure

**Definition of Done:**
- [ ] XP calculation in single location
- [ ] useGame.ts under 200 lines
- [ ] App.tsx under 300 lines
- [ ] All tests pass

---

### PHASE 16: Engagement Systems — Milestone Celebrations

**Phase Name:** Engagement Systems — Milestone Celebrations  
**Objective:** Add milestone celebrations for level-ups  
**Business Value:** Increased retention, emotional engagement  
**Player Value:** Dopamine hits, sense of achievement  
**Production Priority:** P2 — MEDIUM  
**Estimated Complexity:** Low (4-6 hours)  
**Estimated Risk:** Low  
**Dependencies:** Phase 15  
**Required Agents:** Lead Game Designer, UI Art Director, Frontend Architect

**Why This Phase Exists:**
- Level-ups are silent events with zero fanfare
- Missing key engagement/dopamine moments
- Players need celebration of progress

**Why It Comes Before Phase 17:**
- Foundation for all celebration systems
- Milestones are core to achievement feel

**Why It Should Not Be Skipped:**
- Every level-up is wasted opportunity for joy
- Player satisfaction significantly impacts retention

**Expected Deliverables:**
- Level 10, 50, 100, 250, 500, 950 milestone popups
- Celebration animations and effects
- Sound effects integration
- Milestone rewards (bonus currency/XP)

**Files Likely Affected:**
- `src/hooks/useGame.ts` (milestone detection)
- `src/components/MilestonePopup.tsx` (new)
- `src/components/LevelUpAnimation.tsx` (new)
- `src/data/animations.ts` (new)

**Testing Requirements:**
- Each milestone triggers correctly
- Animation plays fully
- Rewards granted accurately

**Rollback Strategy:**
- Disable milestone popup feature flag
- Show level-up without celebration

**Definition of Done:**
- [ ] Level 10, 50, 100, 250, 500, 950 milestones active
- [ ] Celebrations are satisfying
- [ ] No performance impact from animations

---

### PHASE 17: Engagement Systems — Achievement System

**Phase Name:** Engagement Systems — Achievement System  
**Objective:** Implement achievement system with 50+ achievements  
**Business Value:** Long-term engagement, collection satisfaction  
**Player Value:** Goals, rewards, collection completion  
**Production Priority:** P2 — MEDIUM  
**Estimated Complexity:** Medium (8-12 hours)  
**Estimated Risk:** Low  
**Dependencies:** Phase 16  
**Required Agents:** Lead Game Designer, Backend Architect, Frontend Architect

**Why This Phase Exists:**
- No achievement system exists
- Players need goals beyond prestige
- Collection/metagame layer is missing

**Why It Comes Before Phase 18:**
- Achievements drive long-term engagement
- Prerequisite for Battle Pass

**Why It Should Not Be Skipped:**
- Major retention driver in idle games
- Completionists will play for months for 100%

**Expected Deliverables:**
- `achievements` table with 50+ achievements
- Achievement tracking in backend
- Achievement UI/modal
- Achievement rewards (currency, XP, artifacts)
- Progress indicators

**Files Likely Affected:**
- `supabase/migrations/` (new)
- `supabase/functions/evaluate-achievements/index.ts` (new)
- `src/components/AchievementsModal.tsx` (new)
- `src/hooks/useAchievements.ts` (new)

**Testing Requirements:**
- Achievement unlock test
- Progress tracking accuracy
- Reward granting test
- Achievement modal navigation

**Rollback Strategy:**
- Disable new achievements via feature flag
- Continue with existing content

**Definition of Done:**
- [ ] 50+ achievements defined
- [ ] Progress tracking accurate
- [ ] Rewards granted correctly
- [ ] UI shows all achievements

---

### PHASE 18: Engagement Systems — Daily Task System Enhancement

**Phase Name:** Engagement Systems — Daily Task System Enhancement  
**Objective:** Improve daily tasks with better rewards and variety  
**Business Value:** Daily engagement, retention hooks  
**Player Value:** Clear goals, meaningful rewards  
**Production Priority:** P2 — MEDIUM  
**Estimated Complexity:** Low (3-4 hours)  
**Estimated Risk:** Low  
**Dependencies:** Phase 17  
**Required Agents:** Lead Game Designer, Senior Economy Designer

**Why This Phase Exists:**
- Current tasks have trivial rewards (1500-2000 currency)
- Tasks are repetitive with no variety
- Need more engagement hooks

**Why It Comes Before Phase 19:**
- Tasks are daily touchpoint
- Better tasks improve retention

**Why It Should Not Be Skipped:**
- Lost daily engagement opportunity
- Players have no reason to return daily

**Expected Deliverables:**
- Increased task rewards (5-10x)
- Epoch-specific tasks
- Variety in task types
- Task completion animations
- Weekly bonus tasks

**Files Likely Affected:**
- `src/data/tasks.ts` (enhanced)
- `src/components/DailyTasks.tsx` (enhanced)
- `src/lib/task-tracking.ts` (new)

**Testing Requirements:**
- Task completion tracking test
- Reward calculation accuracy
- Reset handling at midnight UTC

**Rollback Strategy:**
- Feature flag for new task values
- Database configuration

**Definition of Done:**
- [ ] Tasks provide meaningful daily goals
- [ ] Rewards feel worthwhile
- [ ] Variety across epochs

---

### PHASE 19: Engagement Systems — Seasonal Events Infrastructure

**Phase Name:** Engagement Systems — Seasonal Events Infrastructure  
**Objective:** Build server-side event configuration system  
**Business Value:** Fresh content, engagement spikes, retention  
**Player Value:** New experiences, limited rewards  
**Production Priority:** P2 — MEDIUM  
**Estimated Complexity:** Medium (8-10 hours)  
**Estimated Risk:** Medium  
**Dependencies:** Phase 14 (feature flags), Phase 18  
**Required Agents:** LiveOps Director, Backend Architect

**Why This Phase Exists:**
- No formal event system — events hardcoded
- Cannot run limited-time content
- Missed engagement opportunities

**Why It Comes Before Phase 20:**
- Infrastructure for all event types
- Prerequisite for Battle Pass events

**Why It Should Not Be Skipped:**
- Events drive engagement spikes
- Competitors run weekly events

**Expected Deliverables:**
- `events` table with JSONB config
- Event Manager edge function
- Event-specific reward hooks
- Flash event capability (4-hour windows)
- 2x reward weekend support

**Files Likely Affected:**
- `supabase/migrations/` (new)
- `supabase/functions/get-active-event/index.ts` (new)
- `src/lib/events.ts` (new)
- `src/hooks/useEvent.ts` (new)

**Testing Requirements:**
- Event activation/deactivation test
- Reward multiplier verification
- Timezone handling test

**Rollback Strategy:**
- Disable event via database flag
- Default to no active event

**Definition of Done:**
- [ ] Events stored in database
- [ ] Active event returned via API
- [ ] Reward multipliers apply correctly
- [ ] Flash events functional

---

### PHASE 20: Engagement Systems — Push Notification System

**Phase Name:** Engagement Systems — Push Notification System  
**Objective:** Implement automated push notification triggers  
**Business Value:** Re-engagement, retention improvement  
**Player Value:** Reminders, personalized content  
**Production Priority:** P2 — MEDIUM  
**Estimated Complexity:** Medium (6-8 hours)  
**Estimated Risk:** Low  
**Dependencies:** Phase 12 (analytics), Phase 13 (monitoring)  
**Required Agents:** LiveOps Director, Backend Architect

**Why This Phase Exists:**
- Push notification infrastructure exists but underutilized
- No automated triggers
- Missed re-engagement opportunities

**Why It Comes Before Phase 21:**
- Notifications drive daily engagement
- Must be working before Battle Pass launch

**Why It Should Not Be Skipped:**
- Critical retention tool
- Players need reminders to return

**Expected Deliverables:**
- Notification scheduler cron job
- Engagement-based triggers:
  - "24h since last tap" warning
  - Streak at risk notification
  - Energy full notification
  - Prestige ready notification
- Notification templates in database
- Localization (Ukrainian/Russian/English)

**Files Likely Affected:**
- `supabase/functions/send-notifications/index.ts` (new)
- `supabase/migrations/` (notification templates)
- `src/lib/notifications.ts` (enhanced)

**Testing Requirements:**
- Notification delivery test
- Template rendering test
- Unsubscribe handling test

**Rollback Strategy:**
- Disable scheduler
- Manual notification only

**Definition of Done:**
- [ ] Automated notifications sent
- [ ] Triggers fire correctly
- [ ] Templates localized

---

### PHASE 21: Monetization — Battle Pass MVP

**Phase Name:** Monetization — Battle Pass MVP  
**Objective:** Build Season 1 Battle Pass with free/premium tracks  
**Business Value:** Primary revenue driver (30-50% of F2P revenue)  
**Player Value:** Goals, exclusive rewards, progression  
**Production Priority:** P1 — HIGH  
**Estimated Complexity:** High (12-16 hours)  
**Estimated Risk:** Medium  
**Dependencies:** Phase 19 (events), Phase 20 (notifications)  
**Required Agents:** Monetization Director, Lead Game Designer, Frontend Architect

**Why This Phase Exists:**
- Battle Pass is the #1 mobile F2P revenue driver
- Currently not implemented — massive revenue loss
- Engagement loop for dedicated players

**Why It Comes Before Phase 22:**
- Battle Pass is immediate revenue
- Must launch before major marketing push

**Why It Should Not Be Skipped:**
- $15k-30k/month potential at 100k DAU
- Major retention driver
- Industry standard feature

**Expected Deliverables:**
- `seasons` table with 30-day seasons
- Battle Pass UI/modal with free + premium tracks
- Season XP from gameplay
- Premium purchase via Telegram Stars ($4.99)
- Exclusive season rewards
- Season challenges (daily/weekly tasks)

**Files Likely Affected:**
- `supabase/migrations/` (new)
- `supabase/functions/claim-season-reward/index.ts` (new)
- `src/components/BattlePassModal.tsx` (new)
- `src/hooks/useBattlePass.ts` (new)
- `src/data/seasons.ts` (new)

**Testing Requirements:**
- Season progression test
- Premium unlock test
- Reward claim test
- Season expiration handling

**Rollback Strategy:**
- Disable premium track
- Continue free season
- Feature flag for season

**Definition of Done:**
- [ ] Season 1 Battle Pass live
- [ ] Free + premium tracks functional
- [ ] Telegram Stars purchase working
- [ ] Challenges tracked correctly

---

### PHASE 22: Monetization — IAP Expansion

**Phase Name:** Monetization — IAP Expansion  
**Objective:** Expand in-app purchase offerings beyond boosters  
**Business Value:** Multiple revenue streams, whale capture  
**Player Value:** Purchase options for all budgets  
**Production Priority:** P2 — MEDIUM  
**Estimated Complexity:** Medium (8-10 hours)  
**Estimated Risk:** Medium  
**Dependencies:** Phase 21  
**Required Agents:** Monetization Director, Integration Specialist

**Why This Phase Exists:**
- Limited IAP (boosters only)
- Missing major revenue: starter packs, bundles, subscriptions
- Whale players have no meaningful purchases

**Why It Comes Before Phase 23:**
- IAP is direct revenue
- Build on Battle Pass success

**Why It Should Not Be Skipped:**
- Leaving money on table
- Competitors offer full IAP suite

**Expected Deliverables:**
- Starter Pack ($0.99) — 500 currency + Gacha ticket
- Gem Bundle ($4.99) — 500 Stars
- Power Pack ($9.99) — 1000 Stars + 3-day x2 boost
- Artifact Hunter Bundle ($14.99)
- Monthly subscription ($2.99) — daily bonus + exclusive perks

**Files Likely Affected:**
- `src/components/ShopModal.tsx` (enhanced)
- `src/data/products.ts` (new)
- `supabase/functions/telegram-payments/index.ts` (enhanced)

**Testing Requirements:**
- Purchase flow test
- Receipt validation
- Purchase restoration
- Refund handling

**Rollback Strategy:**
- Disable new products via feature flag
- Continue with existing products

**Definition of Done:**
- [ ] 4+ IAP products available
- [ ] Purchase flow works end-to-end
- [ ] Telegram Stars integration stable

---

### PHASE 23: Monetization — Limited-Time Offers

**Phase Name:** Monetization — Limited-Time Offers  
**Objective:** Implement LTO system for flash sales  
**Business Value:** Revenue spikes, urgency monetization  
**Player Value:** Exclusive deals, FOMO engagement  
**Production Priority:** P2 — MEDIUM  
**Estimated Complexity:** Medium (6-8 hours)  
**Estimated Risk:** Low  
**Dependencies:** Phase 22  
**Required Agents:** Monetization Director, LiveOps Director

**Why This Phase Exists:**
- No LTO infrastructure exists
- Missed revenue from weekend sales, anniversary events
- Urgency drives impulse purchases

**Why It Comes Before Phase 24:**
- Revenue optimization
- Uses existing IAP infrastructure

**Why It Should Not Be Skipped:**
- Competitors run constant LTOs
- Revenue opportunity cost

**Expected Deliverables:**
- `offers` table with LTO configurations
- Countdown timer component
- Offer dismissed tracking
- LTO calendar: Weekend Flash Sale (48h), Anniversary Bundle (7d)

**Files Likely Affected:**
- `supabase/migrations/` (new)
- `src/components/LimitedOfferModal.tsx` (new)
- `src/hooks/useOffers.ts` (new)

**Testing Requirements:**
- Offer expiration test
- Countdown accuracy
- Purchase limit enforcement

**Rollback Strategy:**
- Disable LTO via database flag
- Clear active offers

**Definition of Done:**
- [ ] LTOs display with countdown
- [ ] Purchase limits enforced
- [ ] Analytics tracking active

---

### PHASE 24: Social Systems — Leaderboard Enhancement

**Phase Name:** Social Systems — Leaderboard Enhancement  
**Objective:** Improve leaderboard with seasons and segments  
**Business Value:** Competition drives engagement  
**Player Value:** Ranked progression, fair competition  
**Production Priority:** P2 — MEDIUM  
**Estimated Complexity:** Medium (6-8 hours)  
**Estimated Risk:** Low  
**Dependencies:** Phase 15  
**Required Agents:** Lead Game Designer, Backend Architect

**Why This Phase Exists:**
- Current leaderboard is global, by total XP only
- No seasons, no segments
- Dominated by idle time, not skill

**Why It Comes Before Phase 25:**
- Leaderboard drives competition
- Social features need ranked content

**Why It Should Not Be Skipped:**
- Competition is core engagement driver
- Endgame content needs ranking

**Expected Deliverables:**
- Leaderboard seasons (30-day resets)
- Segmented leaderboards (epoch, prestige level)
- Weekly rewards for top ranks
- Player position change notifications
- Efficient server-side ranking (PostgreSQL window functions)

**Files Likely Affected:**
- `supabase/functions/get-leaderboard/index.ts` (enhanced)
- `src/components/Leaderboard.tsx` (enhanced)
- `src/hooks/useLeaderboard.ts` (enhanced)

**Testing Requirements:**
- Ranking accuracy test
- Season reset test
- Pagination performance

**Rollback Strategy:**
- Disable seasons, use perpetual
- Feature flag for segments

**Definition of Done:**
- [ ] Seasons reset correctly
- [ ] Ranking is accurate
- [ ] Performance acceptable (1000+ concurrent queries)

---

### PHASE 25: Social Systems — Guild/Clan System

**Phase Name:** Social Systems — Guild/Clan System  
**Objective:** Build guild system with shared goals  
**Business Value:** Community retention, social network effects  
**Player Value:** Social belonging, group goals  
**Production Priority:** P2 — MEDIUM  
**Estimated Complexity:** High (12-16 hours)  
**Estimated Risk:** Medium  
**Dependencies:** Phase 24  
**Required Agents:** Lead Game Designer, Backend Architect, Frontend Architect

**Why This Phase Exists:**
- No social features beyond referrals
- Players have no community
- Missed retention through social bonds

**Why It Comes Before Phase 26:**
- Guilds are major retention driver
- Social features need time to grow

**Why It Should Not Be Skipped:**
- Social bonds are strongest retention mechanism
- Competitors have robust guild systems

**Expected Deliverables:**
- `clans` table with member management
- Guild chat (Telegram group integration)
- Shared artifact bonuses
- Guild leaderboards
- Group challenges
- Guild creation/promotion system

**Files Likely Affected:**
- `supabase/migrations/` (new)
- `supabase/functions/clan-actions/index.ts` (new)
- `src/components/ClanModal.tsx` (new)
- `src/hooks/useClan.ts` (new)

**Testing Requirements:**
- Member management test
- Shared bonus calculation
- Leaderboard accuracy

**Rollback Strategy:**
- Disable guild features
- Migration to remove guild data

**Definition of Done:**
- [ ] Guilds can be created
- [ ] Members join/leave correctly
- [ ] Shared bonuses apply
- [ ] Guild leaderboard functional

---

### PHASE 26: Performance — Frontend Optimization

**Phase Name:** Performance — Frontend Optimization  
**Objective:** Optimize React rendering, implement code splitting  
**Business Value:** User experience, retention on low-end devices  
**Player Value:** Smooth gameplay, faster load times  
**Production Priority:** P2 — MEDIUM  
**Estimated Complexity:** Medium (6-8 hours)  
**Estimated Risk:** Low  
**Dependencies:** Phase 15  
**Required Agents:** Performance Engineer, Frontend Architect

**Why This Phase Exists:**
- Full re-renders on every state change
- No React.memo usage
- No code splitting — all code loaded eagerly
- 5/10 performance score

**Why It Comes Before Phase 27:**
- Performance impacts all features
- Must optimize before scaling users

**Why It Should Not Be Skipped:**
- Low-end device users will churn
- First impressions matter

**Expected Deliverables:**
- React.memo on all components
- React.lazy for modal components
- Optimized useCallback/useMemo usage
- Virtual list for long artifact lists
- Performance budgets in CI

**Files Likely Affected:**
- `src/components/*.tsx` (optimized)
- `src/App.tsx` (code splitting)
- `vite.config.ts` (bundle analysis)

**Testing Requirements:**
- Performance profiling
- Bundle size verification
- Render count analysis

**Rollback Strategy:**
- Disable code splitting temporarily
- Revert component optimizations

**Definition of Done:**
- [ ] Bundle size under 500KB
- [ ] First paint under 2 seconds
- [ ] No unnecessary re-renders

---

### PHASE 27: Performance — Memory Optimization

**Phase Name:** Performance — Memory Optimization  
**Objective:** Fix memory leaks, optimize resource management  
**Business Value:** Stable long sessions, reduced crashes  
**Player Value:** No memory issues on long play  
**Production Priority:** P2 — MEDIUM  
**Estimated Complexity:** Medium (4-6 hours)  
**Estimated Risk:** Low  
**Dependencies:** Phase 26  
**Required Agents:** Performance Engineer

**Why This Phase Exists:**
- Potential memory leaks in interval timers
- No cleanup on unmount
- Image/resource cleanup missing

**Why It Comes Before Phase 28:**
- Memory issues cause crashes
- Must be stable for users

**Why It Should Not Be Skipped:**
- Long session players will crash
- Memory leaks compound over time

**Expected Deliverables:**
- Proper cleanup in useGame interval
- Image lazy loading with cleanup
- Memory leak detection (DevTools integration)
- Performance monitoring dashboard

**Files Likely Affected:**
- `src/hooks/useGame.ts` (cleanup)
- `src/components/*.tsx` (optimization)

**Testing Requirements:**
- Memory profiling over 30-minute session
- Leak detection test
- Long session stability

**Rollback Strategy:**
- Identify specific leak via revert
- Incremental fix approach

**Definition of Done:**
- [ ] No memory leaks detected
- [ ] Memory stable over 1-hour session
- [ ] Crash rate reduced

---

### PHASE 28: Platform — Telegram Integration Enhancement

**Phase Name:** Platform — Telegram Integration Enhancement  
**Objective:** Implement native Telegram UX patterns  
**Business Value:** Better UX, Telegram platform alignment  
**Player Value:** Familiar navigation, native feel  
**Production Priority:** P2 — MEDIUM  
**Estimated Complexity:** Medium (4-6 hours)  
**Estimated Risk:** Low  
**Dependencies:** Phase 15  
**Required Agents:** Telegram Mini App Expert, UI Art Director

**Why This Phase Exists:**
- BackButton not implemented — modal navigation broken
- MainButton not used
- Platform detection missing
- 5/10 Telegram integration score

**Why It Comes Before Phase 29:**
- Core UX patterns
- Affects entire app navigation

**Why It Should Not Be Skipped:**
- Poor Telegram UX hurts retention
- Platform best practices not followed

**Expected Deliverables:**
- BackButton implementation in all modals
- MainButton for key actions
- Platform detection (iOS/Android/Desktop)
- Haptic feedback optimization
- Error boundaries for crash recovery
- `showShareMenu` API for sharing

**Files Likely Affected:**
- `src/App.tsx` (navigation)
- `src/components/Modal.tsx` (base modal)
- `src/lib/telegram.ts` (enhanced)

**Testing Requirements:**
- BackButton navigation test
- MainButton interaction test
- Platform-specific behavior verification

**Rollback Strategy:**
- Disable BackButton via feature flag
- Fallback to custom back buttons

**Definition of Done:**
- [ ] BackButton works in all modals
- [ ] MainButton used appropriately
- [ ] Platform detection accurate

---

### PHASE 29: Platform — Internationalization Preparation

**Phase Name:** Platform — Internationalization Preparation  
**Objective:** Set up i18n infrastructure for multiple languages  
**Business Value:** Market expansion, localization capability  
**Player Value:** Native language support  
**Production Priority:** P3 — LOW  
**Estimated Complexity:** Medium (6-8 hours)  
**Estimated Risk:** Low  
**Dependencies:** Phase 28  
**Required Agents:** Technical Writer, Frontend Architect

**Why This Phase Exists:**
- Currently Ukrainian language only
- English/Russian markets untapped
- Cannot scale internationally without i18n

**Why It Comes Before Phase 30:**
- Infrastructure for all text
- Prerequisite for global launch

**Why It Should Not Be Skipped:**
- 95% of potential users outside Ukraine
- Competition has multi-language support

**Expected Deliverables:**
- i18n library integration (i18next)
- Translation files for EN, UK, RU
- Language detection from Telegram
- Language switcher in settings
- RTL support preparation

**Files Likely Affected:**
- `src/i18n/` (new directory)
- `src/components/**/*.tsx` (translated text)
- `src/hooks/useTranslation.ts` (new)

**Testing Requirements:**
- Language switching test
- Translation completeness verification
- RTL layout test

**Rollback Strategy:**
- Disable language switcher
- Default to Ukrainian

**Definition of Done:**
- [ ] EN and RU translations complete
- [ ] Language detection works
- [ ] All UI text externalized

---

### PHASE 30: Polish — Production Readiness Verification

**Phase Name:** Polish — Production Readiness Verification  
**Objective:** Final production readiness audit and soft launch preparation  
**Business Value:** Confidence for production launch  
**Player Value:** Stable, polished experience  
**Production Priority:** P0 — CRITICAL  
**Estimated Complexity:** Medium (8-12 hours)  
**Estimated Risk:** Low  
**Dependencies:** All previous phases  
**Required Agents:** All Agents (coordinated)

**Why This Phase Exists:**
- Need formal production readiness check
- Final polish pass
- Soft launch preparation

**Why It Comes at the End:**
- Builds on all previous phases
- Consolidates all improvements

**Why It Should Not Be Skipped:**
- Cannot launch without verification
- Risk of missing critical issues

**Expected Deliverables:**
- Full production score re-audit (target 7.5+/10)
- Security penetration test
- Load testing (1000 concurrent users)
- Final bug bash
- Soft launch go/no-go decision
- Launch runbook
- On-call rotation established

**Files Likely Affected:**
- All files (final review)

**Testing Requirements:**
- Security scan (all vulnerabilities fixed)
- Load test (database, edge functions)
- Regression test (all critical paths)
- Localization completeness check

**Rollback Strategy:**
- Soft launch can be paused
- Feature flags to disable any feature
- Rollback to previous version available

**Definition of Done:**
- [ ] Production score 7.5+/10
- [ ] All critical security issues resolved
- [ ] Load test passes
- [ ] On-call team ready
- [ ] Launch runbook complete

---

## Roadmap Summary

### Phase Timeline

| Phase Group | Phases | Timeline | Focus |
|-------------|--------|----------|-------|
| Security Foundation | 1-4 | Week 1 | Critical security vulnerabilities |
| Economy Stabilization | 5-9 | Week 2-3 | Economy balance and integrity |
| Development Foundation | 10-15 | Week 3-4 | CI/CD, testing, analytics, code quality |
| Engagement Systems | 16-20 | Week 5-6 | Achievements, events, notifications |
| Monetization | 21-23 | Week 7-8 | Battle Pass, IAP, LTO |
| Social Features | 24-25 | Week 9-10 | Leaderboards, guilds |
| Performance & Polish | 26-29 | Week 11-12 | Optimization, i18n |
| Production Verification | 30 | Week 13-14 | Final audit, soft launch |

### Resource Requirements

| Role | FTE | Duration | Phases |
|------|-----|----------|--------|
| Backend Architect | 1.0 | 14 weeks | 1-4, 8, 10, 12, 14, 19, 21, 24-25 |
| Frontend Architect | 0.8 | 14 weeks | 10, 15-17, 21, 24-28 |
| Senior Economy Designer | 0.5 | 10 weeks | 5-9, 18, 21-23 |
| Lead Game Designer | 0.5 | 10 weeks | 5-9, 16-18, 21, 24-25 |
| Security Engineer | 0.5 | 3 weeks | 1-4 |
| DevOps Engineer | 0.5 | 6 weeks | 10, 13-14 |
| QA Lead | 0.5 | 8 weeks | 11, 15, 30 |
| Analytics Engineer | 0.3 | 4 weeks | 12-13 |
| Performance Engineer | 0.3 | 4 weeks | 26-27 |
| LiveOps Director | 0.3 | 6 weeks | 19-20, 23 |
| Monetization Director | 0.3 | 6 weeks | 21-23 |
| UI Art Director | 0.2 | 4 weeks | 16, 28 |
| **Total** | **~5.2 FTE** | **14 weeks** | |

### Target Production Readiness

| Milestone | Target Week | Production Score |
|-----------|-------------|------------------|
| Security Hardened | Week 1 | 5.8/10 |
| Economy Balanced | Week 3 | 6.5/10 |
| Foundation Built | Week 4 | 7.0/10 |
| Engagement Active | Week 6 | 7.4/10 |
| Monetization Live | Week 8 | 7.8/10 |
| Social Enabled | Week 10 | 8.0/10 |
| Polished | Week 12 | 8.2/10 |
| **PRODUCTION READY** | **Week 14** | **8.5+/10** |

---

## Appendix: Phase Dependencies Map

```
Phase 1 ──┬── Phase 2 ─── Phase 3 ──┬── Phase 4
           │                          │
           └──────────────────────────┴── Phase 5 ── Phase 6 ── Phase 7 ── Phase 8 ── Phase 9
                                              │                                        │
Phase 10 ────────────────────────────────────┘                                        │
      │                                                                            │
      ├─ Phase 11 ── Phase 15 ──────────────────────────────────────────────────────┤
      │                                                                            │
      ├─ Phase 12 ── Phase 13 ── Phase 14 ────────────────────────────────────────┤
      │                                                                            │
      └─────────────────────────────────────────────────────────────────────────────┘
                                              │
Phase 16 ── Phase 17 ── Phase 18 ── Phase 19 ── Phase 20 ── Phase 21 ── Phase 22 ── Phase 23
                                                                            │
Phase 24 ── Phase 25 ───────────────────────────────────────────────────────┘
      │
Phase 26 ── Phase 27 ── Phase 28 ── Phase 29 ── Phase 30
```

---

*Document Version: 1.0*  
*Classification: CONFIDENTIAL*  
*Distribution: Internal AI Studio Agents Only*  
*Prepared by: Executive Producer*  
*Date: 2026-07-02*

**FINAL NOTE: This roadmap is based on the completed audit. Execute phase-by-phase. Never skip phases. Never rush security. Never break existing gameplay.**