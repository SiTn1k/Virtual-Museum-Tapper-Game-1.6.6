/**
 * Virtual Museum Tapper Game — Analytics Service
 * Production-ready analytics tracking for LiveOps optimization
 */

import { supabase } from './supabase';
import type {
  AnalyticsEvent,
  AnalyticsEventType,
  PlayerSegmentType,
} from '../types/liveops';
import {
  getAllABTestAssignments,
  syncABTestAssignmentsToServer,
  formatVariantForAnalytics,
} from '../lib/abTest';

// ============================================================================
// ANALYTICS CONFIGURATION
// ============================================================================

const ANALYTICS_FUNCTION_URL = 'track-analytics';
const BATCH_SIZE = 10;
const FLUSH_INTERVAL = 5000; // 5 seconds

// Event queue for batching
let eventQueue: AnalyticsEvent[] = [];
let flushTimer: number | null = null;
let sessionId: string = '';
let telegramId: number = 0;

// Remote logging endpoint (optional)
const USE_REMOTE_LOGGING = !import.meta.env.DEV;

// ============================================================================
// SESSION MANAGEMENT
// ============================================================================

/**
 * Initialize analytics session
 */
export function initAnalytics(tgId: number): void {
  telegramId = tgId;
  sessionId = `${tgId}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  eventQueue = [];
  
  // Start flush timer
  if (flushTimer === null) {
    flushTimer = window.setInterval(flushEvents, FLUSH_INTERVAL);
  }
  
  // Sync A/B test assignments to server
  syncABTestAssignmentsToServer(tgId).catch(err => {
    console.warn('[Analytics] Failed to sync A/B test assignments:', err);
  });
  
  // Track session start
  trackEvent('session_start', {
    session_id: sessionId,
    platform: 'telegram_miniapp',
    timestamp: new Date().toISOString(),
  });
  
  // Track session heartbeat every 30 seconds
  window.setInterval(() => {
    trackEvent('session_heartbeat', {
      session_id: sessionId,
    });
  }, 30000);
  
  // Track session end on page unload
  window.addEventListener('beforeunload', () => {
    trackEvent('session_end', {
      session_id: sessionId,
      duration_ms: Date.now() - parseInt(sessionId.split('_')[1] || '0', 10),
    });
    flushEvents();
  });
}

/**
 * Get current session ID
 */
export function getSessionId(): string {
  return sessionId;
}

// ============================================================================
// EVENT TRACKING
// ============================================================================

/**
 * Track a game event
 */
export function trackEvent(
  eventType: AnalyticsEventType,
  properties: Record<string, unknown> = {},
  value?: number
): void {
  if (!sessionId || !telegramId) {
    console.warn('Analytics not initialized');
    return;
  }
  
  // Get all experiment participations for tracking
  const abAssignments = getAllABTestAssignments(telegramId);
  const experimentParticipations = abAssignments.map(a => formatVariantForAnalytics(a.testId, a.variant));
  
  const event: AnalyticsEvent = {
    eventType,
    timestamp: new Date().toISOString(),
    sessionId,
    telegramId,
    properties: {
      ...properties,
      ab_test_variant: getCurrentABVariant(),
      ab_experiments: experimentParticipations,
      ab_experiment_count: experimentParticipations.length,
    },
    value,
  };
  
  eventQueue.push(event);
  
  // Log for debugging in development
  if (import.meta.env.DEV) {
    console.log('[Analytics]', eventType, properties);
  }
  
  // Flush if batch size reached
  if (eventQueue.length >= BATCH_SIZE) {
    flushEvents();
  }
}

/**
 * Flush events to server (Phase 12: Enhanced to use edge function)
 */
export async function flushEvents(): Promise<void> {
  if (eventQueue.length === 0) return;
  
  const eventsToSend = [...eventQueue];
  eventQueue = [];
  
  try {
    // Always store locally for debugging/backup
    const storageKey = `analytics_${telegramId}`;
    const existing = localStorage.getItem(storageKey);
    const existingEvents = existing ? JSON.parse(existing) : [];
    localStorage.setItem(storageKey, JSON.stringify([...existingEvents, ...eventsToSend]));
    
    if (import.meta.env.DEV) {
      console.log('[Analytics] Flushed', eventsToSend.length, 'events');
    }
    
    // Send to edge function (Phase 12 enhancement)
    if (USE_REMOTE_LOGGING && supabase) {
      const { data, error } = await supabase.functions.invoke(ANALYTICS_FUNCTION_URL, {
        body: { 
          events: eventsToSend,
          telegram_id: telegramId,
        },
      });
      
      if (error) {
        console.error('[Analytics] Edge function error:', error);
        // Re-queue events on failure
        eventQueue = [...eventsToSend, ...eventQueue];
      } else if (import.meta.env.DEV) {
        console.log('[Analytics] Remote flush successful:', data);
      }
    }
  } catch (error) {
    // Re-queue events on failure
    eventQueue = [...eventsToSend, ...eventQueue];
    console.error('[Analytics] Failed to flush events:', error);
  }
}

// ============================================================================
// PROGRESSION TRACKING
// ============================================================================

export function trackLevelUp(level: number, epochId: string): void {
  trackEvent('level_up', {
    level,
    epoch_id: epochId,
  }, level);
}

export function trackEpochUnlock(epochId: string, epochIndex: number): void {
  trackEvent('epoch_unlock', {
    epoch_id: epochId,
    epoch_index: epochIndex,
  });
}

export function trackPrestige(prestigeLevel: number, totalPrestigePoints: number): void {
  trackEvent('prestige', {
    prestige_level: prestigeLevel,
    total_prestige_points: totalPrestigePoints,
  });
}

export function trackTapPowerUpgrade(newPower: number, cost: number): void {
  trackEvent('tap_power_upgrade', {
    new_power: newPower,
    cost,
  });
}

// ============================================================================
// ECONOMY TRACKING
// ============================================================================

export function trackCurrencyEarned(amount: number, source: string, epochId: string): void {
  trackEvent('currency_earned', {
    amount,
    source,
    epoch_id: epochId,
  }, amount);
}

export function trackCurrencySpent(amount: number, destination: string): void {
  trackEvent('currency_spent', {
    amount,
    destination,
  }, amount);
}

export function trackGeneratorPurchase(generatorId: string, cost: number, epochId: string): void {
  trackEvent('generator_purchase', {
    generator_id: generatorId,
    cost,
    epoch_id: epochId,
  }, cost);
}

export function trackGachaOpened(chestType: string, cost: number, result: string): void {
  trackEvent('gacha_opened', {
    chest_type: chestType,
    cost,
    result,
  });
}

export function trackArtifactCollected(artifactId: string, rarity: string, epochId: string): void {
  trackEvent('artifact_collected', {
    artifact_id: artifactId,
    rarity,
    epoch_id: epochId,
  });
}

export function trackArtifactUpgraded(artifactId: string, newLevel: number): void {
  trackEvent('artifact_upgraded', {
    artifact_id: artifactId,
    new_level: newLevel,
  });
}

// ============================================================================
// ENGAGEMENT TRACKING
// ============================================================================

export function trackDailyClaimed(streak: number, reward: number): void {
  trackEvent('daily_claimed', {
    streak,
    reward,
  }, reward);
}

export function trackStreakContinued(streak: number): void {
  trackEvent('streak_continued', {
    streak,
  });
}

export function trackStreakBroken(previousStreak: number): void {
  trackEvent('streak_broken', {
    previous_streak: previousStreak,
  });
}

export function trackAdWatched(adType: string, reward: number): void {
  trackEvent('ad_watched', {
    ad_type: adType,
  }, reward);
}

export function trackAdSkipped(adType: string): void {
  trackEvent('ad_skipped', {
    ad_type: adType,
  });
}

export function trackMissionCompleted(missionId: string, frequency: string): void {
  trackEvent('mission_completed', {
    mission_id: missionId,
    frequency,
  });
}

export function trackAchievementEarned(achievementId: string, category: string): void {
  trackEvent('achievement_earned', {
    achievement_id: achievementId,
    category,
  });
}

export function trackSeasonTierReached(seasonId: string, tier: number): void {
  trackEvent('season_tier_reached', {
    season_id: seasonId,
    tier,
  }, tier);
}

// ============================================================================
// LIVE OPS TRACKING
// ============================================================================

export function trackEventStarted(eventId: string, eventType: string): void {
  trackEvent('event_started', {
    event_id: eventId,
    event_type: eventType,
  });
}

export function trackEventCompleted(eventId: string): void {
  trackEvent('event_completed', {
    event_id: eventId,
  });
}

export function trackEventRewardClaimed(eventId: string, rewardType: string, amount: number): void {
  trackEvent('event_reward_claimed', {
    event_id: eventId,
    reward_type: rewardType,
  }, amount);
}

export function trackSeasonStarted(seasonId: string): void {
  trackEvent('season_started', {
    season_id: seasonId,
  });
}

export function trackSeasonPurchased(seasonId: string, price: number): void {
  trackEvent('season_purchased', {
    season_id: seasonId,
  }, price);
}

export function trackSeasonChallengeCompleted(challengeId: string, seasonId: string): void {
  trackEvent('season_challenge_completed', {
    challenge_id: challengeId,
    season_id: seasonId,
  });
}

export function trackComebackRewardClaimed(campaignId: string, day: number): void {
  trackEvent('comeback_reward_claimed', {
    campaign_id: campaignId,
    day,
  });
}

export function trackNotificationClicked(notificationType: string): void {
  trackEvent('notification_clicked', {
    notification_type: notificationType,
  });
}

// ============================================================================
// COMMERCE TRACKING
// ============================================================================

export function trackOfferViewed(offerId: string, offerType: string): void {
  trackEvent('offer_viewed', {
    offer_id: offerId,
    offer_type: offerType,
  });
}

export function trackOfferPurchased(offerId: string, offerType: string, price: number): void {
  trackEvent('offer_purchased', {
    offer_id: offerId,
    offer_type: offerType,
  }, price);
}

export function trackIAPStarted(productId: string): void {
  trackEvent('iap_started', {
    product_id: productId,
  });
}

export function trackIAPCompleted(productId: string, amount: number): void {
  trackEvent('iap_completed', {
    product_id: productId,
  }, amount);
}

export function trackPurchaseFailed(productId: string, reason: string): void {
  trackEvent('purchase_failed', {
    product_id: productId,
    reason,
  });
}

// ============================================================================
// SOCIAL TRACKING
// ============================================================================

export function trackReferralSent(): void {
  trackEvent('referral_sent', {});
}

export function trackReferralCompleted(referrerId: number): void {
  trackEvent('referral_completed', {
    referrer_id: referrerId,
  });
}

export function trackLeaderboardViewed(playerRank: number): void {
  trackEvent('leaderboard_viewed', {
    player_rank: playerRank,
  });
}

export function trackShareClicked(shareType: string): void {
  trackEvent('share_clicked', {
    share_type: shareType,
  });
}

// ============================================================================
// FUNNEL TRACKING
// ============================================================================

export function trackTutorialCompleted(step: number): void {
  trackEvent('tutorial_completed', {
    step,
    ftue_step: step,
  });
}

export function trackFTUECompleted(): void {
  trackEvent('ftue_completed', {});
}

export function trackErrorOccurred(errorType: string, errorMessage: string): void {
  trackEvent('error_occurred', {
    error_type: errorType,
    error_message: errorMessage,
  });
}

export function trackSettingsChanged(setting: string, value: unknown): void {
  trackEvent('settings_changed', {
    setting,
    value,
  });
}

// ============================================================================
// A/B TESTING HELPERS
// ============================================================================

// Store current AB variant
let currentABVariant: string | null = null;

/**
 * Set current AB test variant
 */
export function setABVariant(variant: string): void {
  currentABVariant = variant;
}

/**
 * Get current AB test variant
 */
export function getCurrentABVariant(): string | null {
  return currentABVariant;
}

/**
 * Get variant for specific test
 */
export function getTestVariant(testId: string): string | null {
  const storageKey = `ab_test_${telegramId}_${testId}`;
  return localStorage.getItem(storageKey);
}

/**
 * Set variant for specific test
 */
export function setTestVariant(testId: string, variantId: string): void {
  const storageKey = `ab_test_${telegramId}_${testId}`;
  localStorage.setItem(storageKey, variantId);
  currentABVariant = variantId;
}

// ============================================================================
// RETENTION METRICS HELPERS
// ============================================================================

/**
 * Track player retention cohort
 */
export function trackRetentionCohort(installDate: string): void {
  const storageKey = `cohort_${telegramId}`;
  const existing = localStorage.getItem(storageKey);
  
  if (!existing) {
    localStorage.setItem(storageKey, JSON.stringify({
      install_date: installDate,
      first_session: new Date().toISOString(),
    }));
  }
}

/**
 * Get retention data for analytics
 */
export function getRetentionData(): Record<string, unknown> {
  const cohortKey = `cohort_${telegramId}`;
  const cohort = localStorage.getItem(cohortKey);
  
  return {
    cohort: cohort ? JSON.parse(cohort) : null,
    last_session: localStorage.getItem(`last_session_${telegramId}`),
    total_sessions: parseInt(localStorage.getItem(`sessions_${telegramId}`) || '0', 10),
  };
}

// ============================================================================
// PLAYER SEGMENTATION HELPERS
// ============================================================================

/**
 * Calculate player segment based on their state
 */
export function calculatePlayerSegment(state: {
  level: number;
  prestigeLevel: number;
  totalPlaytimeMinutes: number;
  dailyPlaytimeMinutes: number;
  lifetimeSpend: number;
  daysSinceInstall: number;
  daysSinceLastSession: number;
  isPaying: boolean;
  artifactCount: number;
  achievementCount: number;
}): PlayerSegmentType[] {
  const segments: PlayerSegmentType[] = [];
  
  // Experience-based segments
  if (state.level <= 50) {
    segments.push('beginner');
  } else if (state.level <= 200) {
    segments.push('intermediate');
  } else if (state.level <= 500) {
    segments.push('advanced');
  } else {
    segments.push('veteran');
  }
  
  // Time-based segments
  if (state.daysSinceInstall <= 1) {
    segments.push('new_player');
  }
  
  if (state.daysSinceInstall >= 7 && state.daysSinceLastSession <= 7) {
    segments.push('returning');
  }
  
  if (state.daysSinceLastSession >= 3 && state.daysSinceLastSession <= 7) {
    segments.push('at_risk');
  }
  
  // Engagement segments
  if (state.dailyPlaytimeMinutes < 30) {
    segments.push('casual');
  } else if (state.dailyPlaytimeMinutes <= 120) {
    segments.push('regular');
  } else {
    segments.push('hardcore');
  }
  
  // Payment segments
  if (state.isPaying || state.lifetimeSpend > 0) {
    if (state.lifetimeSpend >= 100) {
      segments.push('whale');
    } else if (state.lifetimeSpend >= 10) {
      segments.push('minnow');
    }
  } else {
    segments.push('free_player');
  }
  
  // Collection segments
  if (state.artifactCount >= 50) {
    segments.push('collector');
  }
  
  // Prestige segments
  if (state.prestigeLevel >= 1) {
    segments.push('prestige_player');
  }
  
  return segments;
}

// ============================================================================
// ECONOMY HEALTH METRICS
// ============================================================================

/**
 * Track economy health metrics
 */
export function trackEconomyHealth(metrics: {
  currencyInCirculation: number;
  currencySinks: number;
  averageSessionEarnings: number;
}): void {
  // Store for backend sync
  const storageKey = `economy_health_${telegramId}`;
  localStorage.setItem(storageKey, JSON.stringify({
    ...metrics,
    timestamp: new Date().toISOString(),
  }));
}

/**
 * Get session statistics
 */
export function getSessionStats(): {
  sessionCount: number;
  totalPlaytimeMinutes: number;
  averageSessionMinutes: number;
  lastSessionAt: string | null;
} {
  return {
    sessionCount: parseInt(localStorage.getItem(`sessions_${telegramId}`) || '0', 10),
    totalPlaytimeMinutes: parseInt(localStorage.getItem(`playtime_${telegramId}`) || '0', 10),
    averageSessionMinutes: parseInt(localStorage.getItem(`avg_session_${telegramId}`) || '0', 10),
    lastSessionAt: localStorage.getItem(`last_session_${telegramId}`),
  };
}

// ============================================================================
// A/B TEST CONVERSION TRACKING
// ============================================================================

/**
 * Track a conversion event for A/B test analysis
 * Call this when a player completes a target action (e.g., purchase, level up)
 */
export function trackABTestConversion(
  testId: string,
  conversionEvent: AnalyticsEventType,
  properties: Record<string, unknown> = {}
): void {
  // Record the conversion event with A/B test context
  trackEvent(conversionEvent, {
    ...properties,
    ab_test_converted: true,
    ab_test_id: testId,
  });
  
  // Sync conversion to server
  if (supabase) {
    supabase.rpc('record_ab_test_conversion', {
      p_telegram_id: telegramId,
      p_test_id: testId,
      p_conversion_event: conversionEvent,
    }).catch(err => {
      console.warn('[Analytics] Failed to record A/B conversion:', err);
    });
  }
  
  if (import.meta.env.DEV) {
    console.log(`[A/B Testing] Conversion tracked for ${testId}:`, conversionEvent);
  }
}

/**
 * Get summary of all A/B test participations
 */
export function getABTestParticipationSummary(): {
  testId: string;
  variant: string;
  assignedAt: string;
}[] {
  const assignments = getAllABTestAssignments(telegramId);
  return assignments.map(a => ({
    testId: a.testId,
    variant: a.variant,
    assignedAt: a.assignedAt,
  }));
}
