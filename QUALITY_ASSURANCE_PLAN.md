# Virtual Museum Tapper Game — Quality Assurance Plan
## Jolt Time (Україна Крізь Час) | v1.6.6

**Document Version:** 1.0  
**Date:** 2026-07-02  
**Classification:** CONFIDENTIAL — AAA STUDIO PRODUCTION STANDARDS  
**Prepared By:** Executive Producer, QA Lead  

---

## Executive Overview

This Quality Assurance Plan defines the testing strategy for the Virtual Museum Tapper Game, ensuring that all features meet production quality standards before release. The plan covers automated testing, manual QA, regression testing, smoke testing, pre-release validation, and quality metrics.

**Current QA Maturity:** 3/10 — NO AUTOMATED TESTS  
**Target QA Maturity:** 8/10 — COMPREHENSIVE AUTOMATION

---

## 1. TESTING STRATEGY OVERVIEW

### 1.1 Testing Pyramid

```
                        ┌─────────────┐
                        │     E2E     │     10% - Critical user journeys
                        │    Tests    │
                       ┌┴─────────────┴┐
                       │  Integration  │     30% - API contracts, component
                       │    Tests      │        integration
                      ┌┴───────────────┴┐
                      │     Unit        │     60% - Pure functions, utilities
                      │     Tests       │
                     ┌┴─────────────────┴┐
                     │    All Tests      │
                     │  Must Pass in CI  │
                     └───────────────────┘
```

### 1.2 Test Coverage Targets

| Layer | Current | Target | Priority |
|-------|---------|--------|----------|
| Unit Tests | 0% | 70% | P0 |
| Integration Tests | 0% | 50% | P1 |
| E2E Tests | 0% | 20% | P2 |
| Security Tests | 0% | 100% | P0 |
| Performance Tests | 0% | Critical paths | P1 |

### 1.3 Test Environment Strategy

| Environment | Purpose | Data | Stability |
|-------------|---------|------|-----------|
| **Local Dev** | Development | Mock data | Unstable |
| **CI/CD** | Automated testing | Clean state | Stable |
| **Staging** | Pre-release testing | Anonymized prod | Stable |
| **Production** | Live monitoring | Real user data | Stable |

---

## 2. AUTOMATED TESTING

### 2.1 Test Framework Setup

**Framework:** Vitest (for React/TypeScript)  
**Location:** `/src/**/*.test.ts`, `/supabase/functions/**/*.test.ts`

#### 2.1.1 Unit Test Coverage Targets

| Module | Current Coverage | Target Coverage | Critical Files |
|--------|----------------|----------------|----------------|
| XP Calculations | 0% | 90% | `src/lib/xp-calculations.ts` |
| Game State | 0% | 80% | `src/hooks/useGame.ts` |
| Number Formatting | 0% | 90% | `src/lib/utils.ts` |
| Epoch Data | 0% | 80% | `src/data/epochs.ts` |
| Task Data | 0% | 80% | `src/data/tasks.ts` |
| Edge Functions | 0% | 70% | `supabase/functions/*/index.ts` |

#### 2.1.2 Required Unit Tests

```typescript
// XP Calculation Tests
describe('calculateXpToLevel', () => {
  test('calculates correct XP for level 1');
  test('calculates correct XP for level 50');
  test('calculates correct XP for level 100');
  test('handles edge cases (level 0, negative)');
  test('epoch multiplier affects XP curve');
});

describe('formatNumber', () => {
  test('formats thousands correctly (K)');
  test('formats millions correctly (M)');
  test('formats billions correctly (B)');
  test('formats trillions correctly (T)');
  test('handles numbers under 1000');
  test('handles max safe integer');
});

// Game State Tests
describe('calculateTapXp', () => {
  test('calculates base XP per tap');
  test('applies tap power multiplier');
  test('applies artifact bonuses');
  test('applies energy multiplier');
  test('applies prestige multiplier');
});

describe('calculatePassiveXp', () => {
  test('sums all generator XP');
  test('applies generator efficiency');
  test('applies epoch multiplier');
  test('handles zero generators');
});

describe('buyGenerator', () => {
  test('validates sufficient currency');
  test('applies correct cost scaling');
  test('adds generator to inventory');
  test('deducts currency correctly');
});
```

### 2.2 Integration Testing

#### 2.2.1 API Contract Tests

```typescript
describe('game-action API', () => {
  test('POST /game-action validates HMAC signature');
  test('POST /game-action rejects invalid initData');
  test('POST /game-action handles tap action correctly');
  test('POST /game-action handles generator purchase');
  test('POST /game-action enforces rate limits');
});

describe('open-chest API', () => {
  test('POST /open-chest validates user');
  test('POST /open-chest respects daily limits');
  test('POST /open-chest returns correct rarity');
  test('POST /open-chest handles pity system');
});
```

#### 2.2.2 Database Integration Tests

```typescript
describe('game_progress operations', () => {
  test('saveRemoteState upserts correctly');
  test('loadRemoteState retrieves correctly');
  test('RLS prevents cross-user access');
  test('concurrent updates handled correctly');
});
```

### 2.3 End-to-End Testing

**Framework:** Playwright  
**Location:** `/e2e/**/*.spec.ts`

#### 2.3.1 Critical User Journeys

| Journey | Steps | Priority |
|---------|-------|----------|
| New User First Tap | Launch → Tap → See XP increase | P0 |
| Complete Daily Check-in | Launch → Check-in → Claim reward | P0 |
| Perform Gacha Roll | Launch → Gacha → See result | P0 |
| Purchase Generator | Launch → Buy Generator → See production | P0 |
| Complete Prestige | Launch → Reach level 950 → Prestige | P1 |
| Claim Offline Income | Close app → Reopen → Claim income | P1 |
| Watch Ad Reward | Launch → Watch ad → Receive reward | P1 |

#### 2.3.2 E2E Test Examples

```typescript
test('new user can complete first tap and see XP increase', async ({ page }) => {
  await page.goto('/');
  await page.waitForSelector('.tap-area');
  const initialXP = await page.locator('.xp-display').textContent();
  await page.click('.tap-area');
  await page.waitForTimeout(100);
  const newXP = await page.locator('.xp-display').textContent();
  expect(parseXP(newXP)).toBeGreaterThan(parseXP(initialXP));
});

test('daily check-in grants reward', async ({ page }) => {
  await loginAsTestUser(page, { daysSinceLastCheckIn: 1 });
  await page.goto('/');
  await page.click('.check-in-button');
  await expect(page.locator('.reward-modal')).toBeVisible();
  await expect(page.locator('.reward-amount')).toContainText('+');
});
```

---

## 3. REGRESSION TESTING

### 3.1 Regression Test Suites

| Suite | Coverage | Frequency | Duration |
|-------|----------|-----------|----------|
| **Core Gameplay** | Taps, generators, XP, levels | Every PR | ~5 min |
| **Economy** | Currency, purchases, costs | Every PR | ~10 min |
| **Persistence** | Save/load, offline | Every PR | ~15 min |
| **Security** | Auth, RLS, rate limits | Every PR | ~10 min |
| **Full Regression** | All features | Daily | ~60 min |

### 3.2 Core Gameplay Regression Tests

```typescript
describe('Regression: Core Gameplay', () => {
  test('tap increases XP by correct amount');
  test('energy drains on tap');
  test('energy regenerates over time');
  test('passive XP accumulates correctly');
  test('generators produce XP as expected');
  test('level up triggers at correct XP');
  test('epoch progression works');
});
```

### 3.3 Economy Regression Tests

```typescript
describe('Regression: Economy', () => {
  test('generator costs scale correctly');
  test('currency deducts on purchase');
  test('gacha costs correct amount');
  test('duplicate artifacts give fragments');
  test('prestige costs correct XP');
  test('prestige resets progress correctly');
  test('museum research costs correct points');
});
```

### 3.4 Persistence Regression Tests

```typescript
describe('Regression: Persistence', () => {
  test('game state saves to localStorage');
  test('game state loads from localStorage');
  test('remote sync works on reconnect');
  test('offline progress calculates correctly');
  test('daily reset happens at midnight UTC');
  test('streak tracking works correctly');
});
```

---

## 4. SMOKE TESTING

### 4.1 Pre-Deployment Smoke Tests

Run before every deployment to production:

| Test | Expected Result | Blocker If Failed |
|------|-----------------|-------------------|
| App loads without crash | White screen < 3s | YES |
| Tap area responds | XP increases | YES |
| Save/load works | State persists | YES |
| Edge functions respond | 200 OK | YES |
| Database accessible | Query succeeds | YES |
| Telegram SDK loads | User info present | NO |

### 4.2 Smoke Test Script

```bash
#!/bin/bash
# smoke-test.sh

echo "Running smoke tests..."

# 1. Check app loads
response=$(curl -s -o /dev/null -w "%{http_code}" https://app.jolttime.com)
if [ "$response" != "200" ]; then
  echo "FAIL: App not accessible"
  exit 1
fi

# 2. Check edge function responds
response=$(curl -s -o /dev/null -w "%{http_code}" \
  -X POST https://xxx.supabase.co/functions/v1/game-action \
  -H "Content-Type: application/json" \
  -d '{"action":"health_check"}')
if [ "$response" != "200" ]; then
  echo "FAIL: Edge function not responding"
  exit 1
fi

# 3. Check database connection
# (via Supabase dashboard or pg_isready)

echo "All smoke tests passed"
```

### 4.3 Post-Deployment Smoke Tests

| Test | Method | Pass Criteria |
|------|--------|---------------|
| Load app | Manual | No crash, UI renders |
| Test tap | Manual | XP increases |
| Check console | DevTools | No errors |
| Test save | Manual | State persists on reload |
| Check metrics | Dashboard | No error spikes |

---

## 5. MANUAL QA

### 5.1 Manual QA Checklist

#### Pre-Release Checklist
- [ ] All automated tests pass
- [ ] No console errors in production build
- [ ] Performance acceptable (Lighthouse >80)
- [ ] Security scan passes
- [ ] Accessibility audit complete
- [ ] Localization complete for target markets
- [ ] All audit findings resolved
- [ ] Load test passed
- [ ] Smoke tests pass
- [ ] Regression tests pass

#### Feature-Specific QA Checklist
- [ ] Feature works as designed
- [ ] Edge cases handled
- [ ] Error states display correctly
- [ ] Loading states present
- [ ] Offline behavior correct
- [ ] Performance acceptable
- [ ] Localization complete
- [ ] Accessibility compliant
- [ ] Telemetry captured correctly
- [ ] Rollback tested

### 5.2 Manual QA Test Cases

#### Gameplay QA
| Test Case | Steps | Expected Result | Priority |
|-----------|-------|-----------------|----------|
| Tap feedback | Tap rapidly 50 times | Each tap registers, haptic fires | P0 |
| Energy drain | Tap until energy < 100 | Energy decreases, multiplier changes | P0 |
| Energy regen | Wait 2 minutes | Energy increases by 2 | P0 |
| Generator buy | Tap buy on generator | Currency deducts, count increases | P0 |
| Level up | Tap until level 2 | Level up celebration, XP resets | P0 |
| Gacha roll | Tap gacha button | Random artifact received | P0 |
| Prestige | Reach level 950, tap prestige | Points awarded, progress resets | P1 |
| Offline return | Close app 1 hour, reopen | Offline income modal appears | P1 |

#### Platform QA
| Test Case | Platform | Expected Result | Priority |
|-----------|----------|-----------------|----------|
| Launch | iOS Safari | App loads correctly | P0 |
| Launch | Android Chrome | App loads correctly | P0 |
| Launch | Desktop Chrome | App loads correctly | P1 |
| Haptics | iOS | Vibration on tap | P1 |
| Share | Any | Share menu opens | P2 |
| Back button | iOS/Android | Modal closes | P0 |

### 5.3 Bug Reporting Template

```markdown
## Bug Report: [Brief Title]

**Severity:** [P0/P1/P2/P3]
**Priority:** [Critical/High/Medium/Low]
**Environment:** [Browser, OS, Device]
**Version:** [App version]

**Steps to Reproduce:**
1. Go to '...'
2. Click on '...'
3. See error

**Expected Behavior:**
[What should happen]

**Actual Behavior:**
[What happens instead]

**Screenshots/Videos:**
[Attach if applicable]

**Console Errors:**
```
[paste console errors here]
```

**Frequency:**
[Occasional/Consistent/Always]

**Additional Context:**
[Any other relevant information]
```

---

## 6. PRE-RELEASE VALIDATION

### 6.1 Pre-Release Gate Criteria

| Category | Metric | Target | Blocker |
|----------|--------|--------|---------|
| **Security** | Critical vulnerabilities | 0 | YES |
| **Security** | High vulnerabilities | 0 | YES |
| **Security** | Medium vulnerabilities | <5 | NO |
| **Performance** | Lighthouse Score | >80 | YES |
| **Performance** | First Contentful Paint | <2s | YES |
| **Performance** | Time to Interactive | <5s | YES |
| **Quality** | Test coverage | >60% | NO |
| **Quality** | Tests passing | 100% | YES |
| **Quality** | Open P0 bugs | 0 | YES |
| **Quality** | Open P1 bugs | <3 | NO |

### 6.2 Pre-Release Checklist

#### Code Quality
- [ ] Lint passes with no errors
- [ ] TypeScript compilation clean
- [ ] No commented-out code
- [ ] No TODO comments in PR
- [ ] Code review approved
- [ ] No debug code left in

#### Security
- [ ] Security scan clean
- [ ] No secrets in code
- [ ] HMAC validation on all endpoints
- [ ] RLS policies correct
- [ ] Rate limiting active
- [ ] Input validation complete

#### Performance
- [ ] Bundle size < 500KB
- [ ] No memory leaks
- [ ] Smooth 60fps animations
- [ ] <100ms response times
- [ ] Efficient re-renders

#### Functionality
- [ ] All acceptance criteria met
- [ ] Edge cases handled
- [ ] Error states work
- [ ] Loading states present
- [ ] Offline behavior correct

#### Localization
- [ ] All text externalized
- [ ] No hardcoded strings
- [ ] RTL languages work
- [ ] Date/number formatting local

### 6.3 Release Approval Process

```
1. Developer: All tests pass, PR ready
2. Code Reviewer: Review complete, approved
3. QA Lead: Manual QA complete, approved
4. Security: Security review complete, approved
5. DevOps: CI/CD green, deployment ready
6. EP: Final approval, release authorized
```

---

## 7. CONTINUOUS QUALITY

### 7.1 Quality Gates in CI/CD

```yaml
# .github/workflows/ci.yml
stages:
  - lint
  - typecheck
  - test
  - build
  - security-scan
  - deploy-staging
  - smoke-test

lint:
  script:
    - npm run lint
  allow_failure: false

typecheck:
  script:
    - npm run typecheck
  allow_failure: false

test:
  script:
    - npm test -- --coverage
  coverage_greater_than: 60
  allow_failure: false

security-scan:
  script:
    - npm audit --audit-level=high
    - trufflehog scan .
  allow_failure: false

smoke-test:
  script:
    - ./smoke-test.sh
  allow_failure: false
```

### 7.2 Quality Metrics Dashboard

| Metric | Current | Target | Alert Threshold |
|--------|---------|--------|-----------------|
| Test Coverage | 0% | 70% | <50% |
| Lint Warnings | Unknown | 0 | >10 |
| Type Errors | Unknown | 0 | >0 |
| Bundle Size | Unknown | <500KB | >600KB |
| Lighthouse Score | Unknown | >80 | <70 |
| Bug Escape Rate | Unknown | <5% | >10% |

### 7.3 Quality Review Cadence

| Review | Frequency | Participants | Output |
|--------|-----------|-------------|--------|
| Daily Standup | Daily | Dev team | Blockers identified |
| PR Review | Per PR | 1+ reviewer | Approved/Changes |
| Weekly QA Sync | Weekly | QA + Dev leads | Bug triage |
| Sprint Review | Bi-weekly | Full team | Quality report |
| Monthly Audit | Monthly | QA Lead + EP | Comprehensive review |

---

## 8. TEST AUTOMATION ROADMAP

### Phase 1: Foundation (Week 4)
- [ ] Set up Vitest
- [ ] Write XP calculation tests
- [ ] Write game state tests
- [ ] Write utility function tests
- [ ] Integrate with CI/CD

### Phase 2: Expansion (Week 6)
- [ ] Write API integration tests
- [ ] Write component tests
- [ ] Write edge function tests
- [ ] Achieve 50% coverage

### Phase 3: E2E (Week 8)
- [ ] Set up Playwright
- [ ] Write critical journey tests
- [ ] Write smoke tests
- [ ] Achieve 60% total coverage

### Phase 4: Continuous (Ongoing)
- [ ] Maintain coverage >70%
- [ ] Add tests for new features
- [ ] Performance regression tests
- [ ] Security scanning

---

## 9. APPENDIX: TEST TEMPLATES

### 9.1 Unit Test Template

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { functionUnderTest } from './module';

describe('ModuleName', () => {
  describe('functionUnderTest', () => {
    beforeEach(() => {
      // Reset state if needed
    });

    it('should [expected behavior]', () => {
      // Arrange
      const input = 'test value';
      
      // Act
      const result = functionUnderTest(input);
      
      // Assert
      expect(result).toBe('expected output');
    });

    it('should handle [edge case]', () => {
      // Arrange
      const input = 'edge case';
      
      // Act
      const result = functionUnderTest(input);
      
      // Assert
      expect(result).toBeDefined();
    });
  });
});
```

### 9.2 Integration Test Template

```typescript
import { describe, it, expect } from 'vitest';
import { supabase } from './supabase';
import { createTestUser, cleanupTestUser } from './helpers';

describe('API Integration: feature-name', () => {
  let testUser: TestUser;

  beforeEach(async () => {
    testUser = await createTestUser();
  });

  afterEach(async () => {
    await cleanupTestUser(testUser);
  });

  it('should [expected behavior]', async () => {
    // Arrange
    const request = { param: 'value' };
    
    // Act
    const response = await fetch('/functions/v1/endpoint', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...request, telegram_id: testUser.id }),
    });
    
    // Assert
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
  });
});
```

### 9.3 QA Sign-off Template

```markdown
## QA Sign-off: [Feature Name]

**Version:** [Version number]
**Date:** [Date]
**QA Tester:** [Name]

### Test Results

| Test Type | Result | Notes |
|-----------|--------|-------|
| Unit Tests | PASS/FAIL | [Notes] |
| Integration Tests | PASS/FAIL | [Notes] |
| Manual Testing | PASS/FAIL | [Notes] |
| Smoke Tests | PASS/FAIL | [Notes] |

### Known Issues

| Issue | Severity | Status | Notes |
|-------|----------|--------|-------|
| [Issue 1] | P1 | Open | [Notes] |
| [Issue 2] | P2 | Open | [Notes] |

### Approval

- [ ] All P0/P1 issues resolved
- [ ] Performance acceptable
- [ ] Security review passed
- [ ] Ready for release

**QA Lead Approval:** __________________  
**Date:** __________________
```

---

## 10. QUALITY STANDARDS

### 10.1 AAA Studio Quality Benchmarks

| Aspect | Industry Standard | Our Target |
|--------|-------------------|------------|
| Test Coverage | 70-80% | 70% minimum |
| Build Success Rate | 100% | 100% |
| Bug Escape Rate | <5% | <5% |
| Crash Rate | <0.1% | <0.1% |
| Performance Score | >85 | >80 |
| Security Vulns | 0 Critical | 0 Critical |

### 10.2 Definition of Done

A feature is "Done" when:
- [ ] All acceptance criteria met
- [ ] Unit tests written and passing
- [ ] Integration tests written and passing
- [ ] Manual QA signed off
- [ ] Code review approved
- [ ] Security review passed
- [ ] Performance acceptable
- [ ] Accessibility compliant
- [ ] Documentation updated

---

*Document Version: 1.0*  
*Classification: CONFIDENTIAL*  
*Distribution: Internal AI Studio Agents Only*  
*Prepared by: Executive Producer, QA Lead*  
*Date: 2026-07-02*