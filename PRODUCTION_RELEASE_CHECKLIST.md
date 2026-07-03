# 🎬 JOLT TIME — PRODUCTION RELEASE CHECKLIST v1.6.7

**Version:** 1.6.7  
**Date:** 2026-07-03  
**Target:** 10,000 concurrent users  
**Platform:** Telegram Mini App

---

## ✅ PRE-RELEASE VERIFICATION

### 1. Security Hardening ✅

| Item | Status | Notes |
|------|--------|-------|
| HMAC validation in open-chest | ✅ DONE | Full HMAC-SHA256 validation |
| HMAC validation in perform-prestige | ✅ DONE | Full HMAC-SHA256 validation |
| HMAC validation in claim-ad-reward | ✅ DONE | Full HMAC-SHA256 validation |
| HMAC validation in claim-offline-income | ✅ DONE | Full HMAC-SHA256 validation |
| HMAC validation in claim-season-reward | ✅ DONE | **ADDED in this release** |
| HMAC validation in telegram-payments | ✅ DONE | **ADDED in this release** |
| HMAC validation in get-active-event | ✅ DONE | **ADDED in this release** |
| RLS policies | ✅ DONE | fix_rls_policies.sql applied |
| Rate limiting | ⚠️ NEEDS_SETUP | Add via Supabase Edge Functions |
| AdsGram secret exposure | ⚠️ NEEDS_FIX | Move to server-side only |

### 2. Performance ✅

| Metric | Target | Current | Status |
|--------|--------|---------|--------|
| Initial bundle size | < 400 KB | 337 KB | ✅ |
| Tick rate | < 250ms | 250ms | ✅ |
| Code splitting | 8+ chunks | 8 lazy chunks | ✅ |
| First contentful paint | < 2s | TBD | ⚠️ |
| Time to interactive | < 3s | TBD | ⚠️ |

### 3. UI/UX ✅

| Item | Status | Notes |
|------|--------|-------|
| Tap area size | < 40vh | **FIXED: 40vh with max 280px** |
| Level celebrations | ✅ DONE | LevelUpCelebration component |
| Combo indicators | ✅ DONE | ComboIndicator in TapArea |
| Achievement system | ✅ DONE | 8 categories, 20+ achievements |
| Mobile optimization | ✅ DONE | Touch-manipulation, safe-area |

### 4. Telegram Integration ✅

| Item | Status | Notes |
|------|--------|-------|
| SDK loading | ✅ DONE | Preconnect + async |
| BackButton | ✅ DONE | Full modal integration |
| MainButton | ✅ DONE | Utility functions added |
| ready() deferral | ✅ DONE | requestAnimationFrame |
| Haptic feedback | ✅ DONE | Implemented |

### 5. Database & Backend ✅

| Item | Status | Notes |
|------|--------|-------|
| RLS policies | ✅ DONE | Service role only |
| Index optimization | ⚠️ NEEDS_REVIEW | Check missing indexes |
| Connection pooling | ⚠️ NEEDS_CONFIG | Supabase Pro needed |
| Backup verification | ⚠️ NEEDS_SETUP | Manual verification |
| Health checks | ⚠️ NEEDS_SETUP | Add to edge functions |

### 6. Error Handling ✅

| Item | Status | Notes |
|------|--------|-------|
| React ErrorBoundary | ✅ DONE | ErrorBoundary.tsx created |
| Sentry integration | ✅ DONE | Already in main.tsx |
| Network error recovery | ✅ DONE | connectionError state |
| Duplicate tab handling | ✅ DONE | Implemented |

---

## 🚀 DEPLOYMENT STEPS

### 1. Database Migration
```bash
# Apply RLS policies (if not already applied)
psql $DATABASE_URL -f supabase/fix_rls_policies.sql
```

### 2. Edge Functions Deploy
```bash
# Deploy all edge functions
supabase functions deploy --no-verify-jwt
```

### 3. Frontend Build
```bash
npm run build
# Deploy dist/ to hosting
```

### 4. Environment Variables (Supabase Secrets)
- [ ] `TELEGRAM_BOT_TOKEN` - Bot token for HMAC validation
- [ ] `VITE_SENTRY_DSN` - Sentry DSN (optional)
- [ ] `VITE_SUPABASE_URL` - Supabase URL
- [ ] `VITE_SUPABASE_ANON_KEY` - Supabase anon key

---

## 📊 CAPACITY PLANNING

### Expected Load at 10,000 Users

| Resource | Est. Usage | Notes |
|----------|-----------|-------|
| Database connections | ~100-200 | With pooling |
| Edge function invocations | ~50-100/sec peak | Tap events |
| Bandwidth | ~500 Mbps peak | CDN recommended |
| Storage growth | ~1 GB/month | Player data |

### Supabase Tier Recommendation
- **< 1,000 users:** Free tier
- **1,000-10,000 users:** Pro tier ($25/month)
- **> 10,000 users:** Enterprise tier

---

## 🐛 KNOWN ISSUES

1. **AdsGram secret in frontend** - Currently exposed, should move to server
2. **No rate limiting** - Edge functions vulnerable to abuse
3. **Generator cost scaling** - 1.15x is too easy, should increase
4. **Energy system binary** - x5 multiplier is cliff, not curve

---

## 📋 POST-LAUNCH CHECKLIST

- [ ] Monitor error rates in Sentry
- [ ] Monitor database connection usage
- [ ] Monitor edge function latency
- [ ] Set up alerts for > 1% error rate
- [ ] Prepare hotfix deployment process
- [ ] Set up player support channel

---

## 📈 SUCCESS METRICS

| Metric | Target | Day 1 | Day 7 | Day 30 |
|--------|--------|-------|-------|--------|
| DAU | 5,000 | - | - | - |
| Retention D1 | > 40% | - | - | - |
| Retention D7 | > 15% | - | - | - |
| Sessions/user | > 5 | - | - | - |
| Revenue/user | > $0.10 | - | - | - |

---

*Document Version: 1.0*  
*Classification: CONFIDENTIAL*  
*Last Updated: 2026-07-03*
