# Virtual Museum Tapper Game — Release Strategy
## Jolt Time (Україна Крізь Час) | v1.6.6

**Document Version:** 1.0  
**Date:** 2026-07-02  
**Classification:** CONFIDENTIAL — AAA STUDIO PRODUCTION STANDARDS  
**Prepared By:** Executive Producer, Git Release Manager  

---

## Executive Overview

This release strategy defines the complete launch plan for the Virtual Museum Tapper Game, covering internal testing through production launch and ongoing LiveOps. The strategy ensures a controlled, data-driven release process that minimizes risk while maximizing learning.

**Target Production Launch:** Week 14 (after all 30 roadmap phases)  
**Minimum Viable Launch:** Week 8 (with security fixed, economy balanced, basic Battle Pass)

---

## 1. RELEASE PHASES OVERVIEW

### 1.1 Phase Timeline

```
Week 1-2: Security Hardening → Internal Alpha
Week 3-4: Economy Stabilization + CI/CD → Closed Alpha
Week 5-6: Foundation + Engagement → Closed Beta
Week 7-8: Monetization MVP → Open Beta
Week 9-10: Social Features → Soft Launch Prep
Week 11-12: Polish + Performance → Soft Launch
Week 13-14: Final QA + Launch → PRODUCTION LAUNCH
Ongoing: LiveOps → Continuous Improvement
```

### 1.2 Release Environment Strategy

| Environment | Purpose | Audience | Data |
|-------------|---------|----------|------|
| **Development** | Local development | Developers | Mock data |
| **CI/CD** | Automated testing | Automated | Clean state |
| **Staging** | Pre-release testing | Internal team | Anonymized prod |
| **Beta (Closed)** | Limited external testing | Selected testers | Isolated |
| **Beta (Open)** | Wide testing | Public volunteers | Isolated |
| **Production** | Live game | All users | Real data |

---

## 2. INTERNAL ALPHA (Weeks 1-2)

### 2.1 Objectives
- Validate security fixes
- Establish CI/CD pipeline
- Test core gameplay loop
- Identify critical bugs

### 2.2 Exit Criteria
- [ ] All security vulnerabilities resolved
- [ ] CI/CD pipeline functional
- [ ] All critical bugs fixed
- [ ] Core gameplay stable

### 2.3 Scope
- Internal team only (5-10 users)
- Focus on security and stability
- No new features

### 2.4 Environment
```
URL: https://staging.jolttime.internal
Access: Team members only
Data: Mock data, reset weekly
```

### 2.5 Testing Focus
| Area | Priority | Success Criteria |
|------|---------|-----------------|
| HMAC Validation | P0 | All endpoints secure |
| RLS Policies | P0 | No cross-user access |
| Race Conditions | P0 | Offline income works |
| CI/CD | P0 | All checks pass |
| Core Taps | P0 | Taps register correctly |

### 2.6 Timeline
| Milestone | Target | Status |
|-----------|--------|--------|
| Security fixes complete | Week 1 | IN PROGRESS |
| CI/CD pipeline deployed | Week 2 | IN PROGRESS |
| Internal Alpha begins | Week 2 | PLANNED |

---

## 3. CLOSED ALPHA (Weeks 3-4)

### 3.1 Objectives
- Validate economy rebalancing
- Test all core systems
- Establish baseline metrics
- Gather qualitative feedback

### 3.2 Exit Criteria
- [ ] Economy balanced (no exploits)
- [ ] All P0/P1 bugs fixed
- [ ] Baseline metrics established
- [ ] 50+ hours of testing logged

### 3.3 Scope
- Expanded internal team (10-20 users)
- Friends and family (50-100 users)
- Focus on economy and progression

### 3.4 Environment
```
URL: https://alpha.jolttime.com
Access: Invited users only
Data: Isolated, reset monthly
Features: All Phase 1-10 features
```

### 3.5 Testing Focus
| Area | Priority | Success Criteria |
|------|---------|-----------------|
| Energy System | P0 | Binary x5 removed |
| Generator Scaling | P0 | Costs balanced |
| Gacha Balance | P1 | Pity system works |
| Offline Income | P0 | Server-side calculation |
| Prestige Balance | P1 | Points valuable |

### 3.6 Metrics to Capture
| Metric | Target | Notes |
|--------|--------|-------|
| Session Length | >5 min avg | Engagement indicator |
| D1 Retention | >50% | Early stickiness |
| Bug Reports | <20/week | Quality indicator |
| Security Issues | 0 | Showstopper |

### 3.7 Timeline
| Milestone | Target | Status |
|-----------|--------|--------|
| Economy fixes complete | Week 3 | PLANNED |
| Closed Alpha begins | Week 3 | PLANNED |
| Economy validated | Week 4 | PLANNED |
| Exit Closed Alpha | Week 4 | PLANNED |

---

## 4. CLOSED BETA (Weeks 5-6)

### 4.1 Objectives
- Validate engagement systems
- Test achievement system
- Build event infrastructure
- Establish analytics baseline

### 4.2 Exit Criteria
- [ ] Achievement system functional
- [ ] Event system infrastructure ready
- [ ] Analytics pipeline working
- [ ] Engagement metrics meeting targets

### 4.3 Scope
- Selected community members (200-500 users)
- Focus on engagement and retention
- Include Battle Pass design tests

### 4.4 Environment
```
URL: https://beta.jolttime.com
Access: Beta testers (application)
Data: Isolated, reset per sprint
Features: Phases 1-20
```

### 4.5 Testing Focus
| Area | Priority | Success Criteria |
|------|---------|-----------------|
| Achievement System | P0 | 50+ achievements |
| Milestones | P1 | Level celebrations work |
| Daily Tasks | P1 | Rewards meaningful |
| Event System | P2 | Flash events work |
| Analytics | P1 | Events tracked |

### 4.6 Metrics to Capture
| Metric | Target | Notes |
|--------|--------|-------|
| D7 Retention | >20% | Week 1 stickiness |
| Session Count | >3/day avg | Engagement |
| Achievement Unlocks | >10/user | Progression |
| Level 50 reached | >30% | Mid-game access |

### 4.7 Timeline
| Milestone | Target | Status |
|-----------|--------|--------|
| Achievements live | Week 5 | PLANNED |
| Closed Beta begins | Week 5 | PLANNED |
| Battle Pass MVP | Week 6 | PLANNED |
| Exit Closed Beta | Week 6 | PLANNED |

---

## 5. OPEN BETA (Weeks 7-8)

### 5.1 Objectives
- Broad audience testing
- Monetization validation
- Platform testing (iOS/Android)
- Community building

### 5.2 Exit Criteria
- [ ] Battle Pass functional
- [ ] IAP purchases working
- [ ] D7 retention >15%
- [ ] Platform bugs <20 open

### 5.3 Scope
- Public open beta (1,000-5,000 users)
- Telegram channel promotion
- Focus on monetization and platform

### 5.4 Environment
```
URL: https://beta.jolttime.com
Access: Open to Telegram users
Data: Isolated per test group
Features: All planned features
Monetization: Real payments (test mode)
```

### 5.5 Testing Focus
| Area | Priority | Success Criteria |
|------|---------|-----------------|
| Battle Pass | P0 | Purchase flow works |
| IAP System | P0 | Payments processed |
| Telegram Mini App | P0 | Platform stable |
| Notifications | P1 | Push working |
| LTO System | P2 | Flash sales work |

### 5.6 Metrics to Capture
| Metric | Target | Notes |
|--------|--------|-------|
| User Count | 1,000+ | Beta traction |
| D7 Retention | >15% | Retention health |
| Battle Pass Sales | >5% conversion | Monetization |
| ARPDAU | >$0.01 | Revenue potential |
| Bug Reports | <50 open | Quality |

### 5.7 Telegram Promotion
- Create beta tester channel
- Announce open beta to Ukrainian gaming communities
- Offer exclusive beta badge
- Collect feedback via bot

### 5.8 Timeline
| Milestone | Target | Status |
|-----------|--------|--------|
| Battle Pass live | Week 7 | PLANNED |
| Open Beta begins | Week 7 | PLANNED |
| IAP validated | Week 8 | PLANNED |
| Open Beta ends | Week 8 | PLANNED |

---

## 6. SOFT LAUNCH (Weeks 9-12)

### 6.1 Objectives
- Controlled production launch
- Limited geography (Ukraine)
- Validate LiveOps
- Build initial community

### 6.2 Exit Criteria
- [ ] Production stable (<1% crash rate)
- [ ] D30 retention >5%
- [ ] Revenue >$0.005 ARPDAU
- [ ] Community established (5,000+ users)

### 6.3 Scope
- Production environment
- Ukraine only (Telegram geofilter)
- Full feature set
- Real monetization

### 6.4 Environment
```
URL: https://app.jolttime.com
Access: Ukraine Telegram users
Data: Real production data
Features: All launched features
Monetization: Full (real payments)
```

### 6.5 Testing Focus
| Area | Priority | Success Criteria |
|------|---------|-----------------|
| Production Stability | P0 | Crash <1% |
| LiveOps | P1 | Events work |
| Leaderboards | P1 | Rankings accurate |
| Guild System | P2 | Social works |
| Push Notifications | P1 | Re-engagement |

### 6.6 Metrics to Capture
| Metric | Target | Soft Launch | Production |
|--------|--------|-------------|------------|
| DAU | 2,000 | Week 9 | Week 12 |
| D1 Retention | >40% | Week 9 | Week 12 |
| D7 Retention | >15% | Week 9 | Week 12 |
| D30 Retention | >5% | Week 9 | Week 12 |
| ARPDAU | >$0.005 | Week 9 | Week 12 |
| MAU | 10,000 | Week 12 | Week 14 |
| Revenue | >$50/day | Week 12 | Week 14 |

### 6.7 Soft Launch Success Criteria
If all metrics met by Week 12:
- Proceed to full production launch

If metrics not met:
- Extend soft launch 4 weeks
- Focus on retention improvements
- Re-evaluate monetization

### 6.8 Timeline
| Milestone | Target | Status |
|-----------|--------|--------|
| Guild system live | Week 9 | PLANNED |
| Soft Launch begins | Week 9 | PLANNED |
| Leaderboard seasons | Week 10 | PLANNED |
| First seasonal event | Week 11 | PLANNED |
| Soft Launch review | Week 12 | PLANNED |

---

## 7. PRODUCTION LAUNCH (Week 13-14)

### 7.1 Objectives
- Full production launch
- International expansion
- Full marketing push
- Community growth

### 7.2 Pre-Launch Checklist
- [ ] All P0/P1 bugs resolved
- [ ] Production score >7.5/10
- [ ] Soft launch metrics met
- [ ] Marketing assets ready
- [ ] Community team ready
- [ ] Support team trained

### 7.3 Scope
- Production environment
- Global (Telegram available)
- Full feature set
- Full marketing

### 7.4 Environment
```
URL: https://app.jolttime.com
Access: Global Telegram users
Features: All features
Monetization: Full
Support: Full team
```

### 7.5 Launch Checklist

#### Two Weeks Before Launch
- [ ] Feature freeze
- [ ] Final QA pass
- [ ] Load testing complete
- [ ] Rollback plan ready
- [ ] On-call rotation established

#### One Week Before Launch
- [ ] Marketing assets deployed
- [ ] Telegram bot announcements ready
- [ ] Support documentation ready
- [ ] Analytics dashboards live
- [ ] Marketing campaign scheduled

#### Launch Day
- [ ] All systems green
- [ ] On-call team standing by
- [ ] Rollback ready
- [ ] Marketing push begins
- [ ] Community engagement ready

#### Post-Launch
- [ ] Hour 1: Monitor metrics
- [ ] Hour 4: First metric review
- [ ] Day 1: Post-launch report
- [ ] Day 3: Bug triage
- [ ] Day 7: Week 1 report
- [ ] Day 14: Week 2 report

### 7.8 Timeline
| Milestone | Target | Status |
|-----------|--------|--------|
| Feature freeze | Week 12 | PLANNED |
| Final QA | Week 12 | PLANNED |
| Production Launch | Week 13 | PLANNED |
| International expansion | Week 14 | PLANNED |
| Full marketing push | Week 14 | PLANNED |

---

## 8. LIVEOPS STRATEGY

### 8.1 Ongoing Release Cadence

| Release Type | Frequency | Scope | Example |
|-------------|-----------|-------|---------|
| Hotfix | As needed | P0 bugs only | Emergency fixes |
| Patch | Weekly | Bug fixes, small features | Bug fixes |
| Minor | Bi-weekly | Features, improvements | New achievements |
| Major | Monthly | Large features, events | Battle Pass season |
| Seasonal | Quarterly | Major content | New epoch |

### 8.2 LiveOps Calendar

```
Q3 2026 (Launch & Growth)
├── July: Launch Month
│   └── First Battle Pass Season
├── August: Engagement Push
│   ├── Summer Event
│   └── Achievement expansion
└── September: Content Update
    ├── New epoch content
    └── Guild features

Q4 2026 (Scale)
├── October: Halloween Event
├── November: Anniversary Event
└── December: Holiday Season

Q1 2027 (International)
├── January: New Year Event
├── February: Content expansion
└── March: Anniversary celebration
```

### 8.3 Event Pipeline

| Event Type | Frequency | Planning Lead Time | Examples |
|------------|-----------|-------------------|----------|
| Flash Event | Weekly | 1 week | 2x currency weekends |
| Limited Event | Monthly | 4 weeks | Holiday events |
| Major Season | Quarterly | 8 weeks | Battle Pass seasons |
| Anniversary | Annual | 12 weeks | Special celebrations |

### 8.4 Battle Pass Seasons

| Season | Duration | Theme | Start Date |
|--------|----------|-------|-----------|
| Season 1 | 30 days | Launch Celebration | Week 13 |
| Season 2 | 30 days | Summer Fun | Week 19 |
| Season 3 | 30 days | Back to School | Week 24 |
| Season 4 | 60 days | Holiday Special | Week 29 |

---

## 9. VERSIONING STRATEGY

### 9.1 Version Number Format

```
MAJOR.MINOR.PATCH[-PRERELEASE][+BUILD]

MAJOR: Major releases (new epochs, major features)
MINOR: Feature additions, significant changes
PATCH: Bug fixes, hotfixes
PRERELEASE: alpha, beta, rc (pre-launch versions)
BUILD: CI build number
```

### 9.2 Version Examples

| Version | Meaning |
|---------|---------|
| 1.6.6 | Current production version |
| 1.7.0 | Minor release with new features |
| 2.0.0 | Major release (new epochs) |
| 2.0.0-beta.1 | Beta release |
| 2.0.0-rc.1 | Release candidate |

### 9.3 Release Branches

```
main
├── releases/
│   ├── v1.7.0/
│   ├── v1.8.0/
│   └── v2.0.0/
├── develop
│   └── (integration branch)
└── feature/
    ├── feature-xyz/
    └── bugfix/abc/
```

---

## 10. ROLLBACK STRATEGY

### 10.1 Rollback Triggers

| Severity | Trigger | Response Time |
|----------|---------|---------------|
| P0 | Production crash >1% | Immediate (<15 min) |
| P0 | Security vulnerability | Immediate (<15 min) |
| P1 | Major feature broken | <1 hour |
| P2 | Minor feature broken | <4 hours |
| P3 | Cosmetic issues | Next release |

### 10.2 Rollback Procedures

#### Feature Flag Rollback (Preferred)
```
1. Open admin panel
2. Navigate to Feature Flags
3. Disable affected feature
4. Verify fix in production
```

#### Code Rollback (If needed)
```bash
# Revert to previous version
git revert HEAD
git push origin main
# CI/CD automatically deploys

# Or rollback to specific version
git checkout v1.6.5
git push origin main --force
```

#### Database Rollback
```sql
-- If migration needed
SELECT * FROM migrations ORDER BY id DESC LIMIT 5;
-- Identify bad migration
psql -f rollback_migration_018.sql
```

### 10.3 Rollback Decision Tree

```
Is the issue P0 (crash/security)?
├── YES → Is feature flag available?
│   ├── YES → Disable flag immediately
│   └── NO → Rollback code immediately
└── NO → Can it wait for next release?
    ├── YES → Schedule fix for next release
    └── NO → Is feature flag available?
        ├── YES → Disable flag
        └── NO → Plan hotfix
```

### 10.4 Communication Plan

| Scenario | Internal | External |
|----------|----------|----------|
| P0 crash | Slack #incident | Status page + Telegram |
| P0 security | Slack #security | No public (silent fix) |
| P1 major | Slack #releases | In-app notice |
| P2 minor | Slack #releases | Next changelog |
| Scheduled maintenance | #announcements | 48hr notice |

---

## 11. POST-LAUNCH SUPPORT

### 11.1 Support Cadence

| Support Type | Availability | Response Time |
|--------------|-------------|----------------|
| Bug Reports | 24/7 | <4 hours (P0), <24h (P1) |
| Feature Requests | Business hours | <1 week |
| General Inquiries | 24/7 | <48 hours |
| VIP Support | 24/7 | <1 hour |

### 11.2 Support Channels

| Channel | Purpose | Priority |
|---------|---------|----------|
| Telegram Bot | Bug reports, feedback | P1 |
| Email support | Formal issues | P2 |
| Discord | Community support | P3 |
| In-game | Quick questions | P3 |

### 11.3 On-Call Rotation

| Role | Name | Contact | Hours |
|------|------|---------|-------|
| Primary On-Call | TBD | TBD | Weekdays |
| Secondary On-Call | TBD | TBD | Evenings |
| Emergency Escalation | EP | TBD | 24/7 |

### 11.4 Incident Response

1. **Detect:** Monitoring alert / user report
2. **Triage:** Assess severity (<5 min)
3. **Communicate:** Notify stakeholders (<15 min)
4. **Mitigate:** Apply fix or rollback (<1 hour)
5. **Resolve:** Verify fix in production
6. **Review:** Post-mortem within 48 hours

---

## 12. RELEASE CHECKLISTS

### 12.1 Pre-Release Checklist

#### Code
- [ ] All tests passing
- [ ] Lint clean
- [ ] TypeScript clean
- [ ] No console.log left
- [ ] No TODO comments
- [ ] Code review approved

#### Security
- [ ] Security scan clean
- [ ] No secrets in code
- [ ] HMAC validation on all endpoints
- [ ] Rate limiting active
- [ ] Input validation complete

#### Testing
- [ ] Unit tests >70%
- [ ] Integration tests passing
- [ ] E2E tests passing
- [ ] Smoke tests passing
- [ ] Load tests passed

#### Documentation
- [ ] Changelog updated
- [ ] Release notes ready
- [ ] API docs updated
- [ ] Runbook updated

#### Communication
- [ ] Marketing ready
- [ ] Community informed
- [ ] Support trained
- [ ] Stakeholders notified

### 12.2 Post-Release Checklist

#### Monitoring
- [ ] Error rates normal
- [ ] Performance normal
- [ ] Revenue tracking
- [ ] User feedback monitored

#### Follow-up
- [ ] 24-hour check
- [ ] Week 1 metrics review
- [ ] Bug triage
- [ ] Lesson learned doc

---

## 13. LAUNCH SUCCESS CRITERIA

### 13.1 Soft Launch Success (Week 12)

| Metric | Target | Must Have |
|--------|--------|-----------|
| Users | 5,000 | 2,000 |
| D1 Retention | 40% | 35% |
| D7 Retention | 15% | 10% |
| D30 Retention | 5% | 3% |
| ARPDAU | $0.01 | $0.005 |
| Crash Rate | <1% | <2% |

### 13.2 Production Launch Success (Week 14)

| Metric | Target | Must Have |
|--------|--------|-----------|
| Users | 20,000 | 10,000 |
| DAU | 5,000 | 2,000 |
| D1 Retention | 45% | 40% |
| D7 Retention | 20% | 15% |
| D30 Retention | 8% | 5% |
| ARPDAU | $0.02 | $0.01 |
| Revenue/month | $10,000 | $3,000 |

### 13.3 6-Month Success (Q2 2027)

| Metric | Target |
|--------|--------|
| MAU | 100,000 |
| DAU | 30,000 |
| D30 Retention | 10% |
| ARPDAU | $0.05 |
| Revenue/month | $50,000 |

---

*Document Version: 1.0*  
*Classification: CONFIDENTIAL*  
*Distribution: Internal AI Studio Agents Only*  
*Prepared by: Executive Producer, Git Release Manager*  
*Date: 2026-07-02*