/**
 * Virtual Museum Tapper Game — LiveOps Type Definitions
 * Production-ready infrastructure for long-term live service operations
 * Supports: Events, Seasons, Achievements, Missions, Analytics, A/B Testing, Player Segmentation
 */

// ============================================================================
// EVENT SYSTEM
// ============================================================================

export type EventType =
  | 'weekend_bonus'      // Weekend 2x rewards
  | 'holiday'            // Holiday-themed events
  | 'artifact_hunt'      // Special artifact events
  | 'epoch_wars'         // Featured epoch voting
  | 'marathon'           // Playtime-based events
  | 'collection'         // Collection completion events
  | 'flash_sale'         // Limited-time shop sales
  | 'comeback'           // Re-engagement campaigns
  | 'seasonal'           // Seasonal content rotations
  | 'community_goal';    // Collective community events

export interface EventRewardMultipliers {
  currency?: number;      // e.g., 2.0 for 2x currency
  xp?: number;           // e.g., 1.5 for 1.5x XP
  gacha_rate?: number;    // e.g., 1.25 for +25% rare chance
  passive?: number;       // e.g., 2.0 for 2x passive income
}

export interface EventShopItem {
  id: string;
  name: { ua: string; en: string };
  description: { ua: string; en: string };
  cost: number;          // Event currency cost
  currencyType: 'event' | 'premium' | 'mix';
  icon: string;
  category: 'artifact' | 'booster' | 'currency' | 'cosmetic' | 'consumable';
  rarity?: 'common' | 'rare' | 'epic' | 'legendary';
  quantity?: number;
  purchaseLimit?: number; // Per event limit
  requiredLevel?: number; // Minimum level to purchase
}

export interface EventConfig {
  id: string;
  type: EventType;
  name: { ua: string; en: string };
  description: { ua: string; en: string };
  startDate: string;     // ISO8601
  endDate: string;       // ISO8601
  isActive: boolean;
  rewardMultipliers: EventRewardMultipliers;
  featuredEpochs?: string[];  // Epoch IDs with bonus drops
  bonusTasks?: string[];      // Task IDs with bonus rewards
  eventCurrency?: {
    id: string;
    name: { ua: string; en: string };
    icon: string;
  };
  shopItems?: EventShopItem[];
  prerequisites?: {
    minLevel?: number;
    maxLevel?: number;
    minPrestige?: number;
    previousEventId?: string;
  };
  analytics: {
    eventCode: string;   // For tracking
    cohortTag?: string;  // For A/B testing
  };
}

export interface PlayerEventState {
  eventId: string;
  eventCurrency: number;
  purchaseHistory: Record<string, number>; // itemId -> count
  progress: Record<string, number>;         // Arbitrary progress tracking
  startedAt?: string;
  completedAt?: string;
  rewardsClaimed: string[];
}

// ============================================================================
// SEASON / BATTLE PASS SYSTEM
// ============================================================================

export interface SeasonReward {
  tier: number;
  xpRequired: number;
  freeReward: {
    type: 'currency' | 'xp' | 'booster' | 'artifact_fragment' | 'cosmetic' | 'gacha_ticket';
    amount?: number;
    rarity?: 'common' | 'rare' | 'epic' | 'legendary';
    duration?: number; // For boosters, in milliseconds
  };
  premiumReward?: {
    type: 'currency' | 'xp' | 'booster' | 'artifact_fragment' | 'cosmetic' | 'gacha_ticket';
    amount?: number;
    rarity?: 'common' | 'rare' | 'epic' | 'legendary';
    duration?: number;
  };
}

export interface SeasonChallenge {
  id: string;
  name: { ua: string; en: string };
  description: { ua: string; en: string };
  type: 'tap' | 'earn_xp' | 'buy_generator' | 'open_gacha' | 'upgrade_tap' | 'epoch_complete' | 'prestige' | 'watch_ad' | 'claim_reward';
  target: number;
  reward: {
    type: 'season_xp' | 'currency' | 'artifact_fragment';
    amount: number;
    rarity?: 'common' | 'rare' | 'epic' | 'legendary';
  };
  icon: string;
  isWeekly?: boolean;      // Resets weekly
  isDaily?: boolean;       // Resets daily
  exclusivity?: 'free' | 'premium' | 'both';
}

export interface SeasonConfig {
  id: string;
  seasonNumber: number;
  name: { ua: string; en: string };
  description: { ua: string; en: string };
  theme: string;          // Visual theme identifier
  startDate: string;
  endDate: string;
  durationDays: number;
  levelCount: number;    // Number of reward tiers
  xpPerLevel: number;    // XP required per level
  freeRewards: SeasonReward[];
  premiumRewards: SeasonReward[];
  challenges: SeasonChallenge[];
  premiumPrice?: number;  // Telegram Stars
  bonusXpPerLevel?: number; // Bonus XP for premium track
}

export interface PlayerSeasonState {
  seasonId: string;
  currentTier: number;
  totalXp: number;
  claimedTiers: number[];
  premiumPurchased: boolean;
  challenges: Record<string, {
    progress: number;
    completed: boolean;
    claimed: boolean;
    lastResetAt?: string;
  }>;
  startedAt?: string;
  endedAt?: string;
}

// ============================================================================
// ACHIEVEMENT SYSTEM
// ============================================================================

export type AchievementCategory =
  | 'progression'    // Level, prestige milestones
  | 'collection'    // Artifacts, epochs
  | 'engagement'    // Daily login, streaks
  | 'social'        // Referrals, leaderboard
  | 'economy'       // Currency earned, spent
  | 'combat'        // Taps, damage
  | 'special';      // Hidden, easter eggs

export interface AchievementReward {
  type: 'currency' | 'xp' | 'artifact_fragment' | 'cosmetic' | 'title' | 'gacha_ticket' | 'premium_currency';
  amount?: number;
  rarity?: 'common' | 'rare' | 'epic' | 'legendary';
  cosmeticId?: string;
}

export interface AchievementDef {
  id: string;
  category: AchievementCategory;
  name: { ua: string; en: string };
  description: { ua: string; en: string };
  icon: string;
  requirement: {
    type: string;           // Achievement type identifier
    target: number;         // Target value
    secondaryTarget?: number; // Optional secondary target
  };
  reward: AchievementReward;
  isSecret?: boolean;       // Hidden until earned
  isLegacy?: boolean;       // Can no longer be earned
  limitedTime?: {           // For time-limited achievements
    startDate: string;
    endDate: string;
  };
  prerequisites?: string[]; // Other achievement IDs
}

export interface PlayerAchievementState {
  id: string;
  progress: number;
  completed: boolean;
  earnedAt?: string;
  notified: boolean;        // Player has been notified
}

// ============================================================================
// MISSION SYSTEM (Daily/Weekly/Monthly)
// ============================================================================

export type MissionType =
  | 'tap' | 'earn_xp' | 'buy_generator' | 'open_gacha' | 'upgrade_tap'
  | 'epoch_complete' | 'prestige' | 'watch_ad' | 'claim_reward'
  | 'claim_daily' | 'claim_weekly' | 'collect_artifact' | 'spend_currency';

export type MissionFrequency = 'daily' | 'weekly' | 'monthly';

export interface MissionReward {
  currency?: number;
  xp?: number;
  gachaTicket?: boolean;
  booster?: { type: string; duration: number };
}

export interface MissionDef {
  id: string;
  name: { ua: string; en: string };
  description: { ua: string; en: string };
  type: MissionType;
  frequency: MissionFrequency;
  target: number;
  reward: MissionReward;
  icon: string;
  exclusivity?: 'free' | 'premium' | 'event';
  eventId?: string;         // Associated event if any
}

export interface PlayerMissionState {
  missionId: string;
  progress: number;
  completed: boolean;
  claimed: boolean;
  assignedAt: string;
  expiresAt: string;        // When this mission expires
  claimedAt?: string;
}

// ============================================================================
// COLLECTION PROGRESS SYSTEM
// ============================================================================

export interface CollectionMilestone {
  id: string;
  name: { ua: string; en: string };
  description: { ua: string; en: string };
  collectionType: 'artifact' | 'epoch' | 'generator' | 'achievement' | 'season';
  target: number;          // Collection count to reach
  reward: AchievementReward;
  icon: string;
  tier?: number;          // For multi-tier milestones
}

export interface PlayerCollectionProgress {
  collectionType: string;
  currentCount: number;
  milestonesCompleted: string[];
  lastUpdated: string;
}

// ============================================================================
// ANALYTICS SYSTEM
// ============================================================================

export type AnalyticsEventType =
  // Session events
  | 'session_start' | 'session_end' | 'session_heartbeat'
  // Progression events
  | 'level_up' | 'epoch_unlock' | 'prestige' | 'tap_power_upgrade'
  // Economy events
  | 'currency_earned' | 'currency_spent' | 'generator_purchase'
  | 'gacha_opened' | 'artifact_collected' | 'artifact_upgraded'
  // Engagement events
  | 'daily_claimed' | 'streak_continued' | 'streak_broken'
  | 'ad_watched' | 'ad_skipped' | 'offer_viewed' | 'offer_purchased'
  | 'mission_completed' | 'achievement_earned' | 'season_tier_reached'
  // Social events
  | 'referral_sent' | 'referral_completed' | 'leaderboard_viewed'
  | 'share_clicked'
  // LiveOps events
  | 'event_started' | 'event_completed' | 'event_reward_claimed'
  | 'season_started' | 'season_purchased' | 'season_challenge_completed'
  | 'comeback_reward_claimed' | 'notification_clicked'
  // Commerce events
  | 'iap_started' | 'iap_completed' | 'purchase_failed'
  // Error/Funnel events
  | 'error_occurred' | 'tutorial_completed' | 'ftue_completed'
  | 'settings_changed' | 'notification_settings_changed';

export interface AnalyticsEvent {
  eventType: AnalyticsEventType;
  timestamp: string;      // ISO8601
  sessionId: string;
  telegramId: number;
  properties: Record<string, unknown>;
  value?: number;         // Numeric value for revenue tracking
  abTestVariant?: string;  // A/B test assignment
}

export interface RetentionMetrics {
  d1: number;             // Day 1 retention %
  d3: number;             // Day 3 retention %
  d7: number;             // Day 7 retention %
  d14: number;           // Day 14 retention %
  d30: number;           // Day 30 retention %
  sessionsPerDay: number;
  avgSessionLength: number;
  avgDailyPlaytime: number;
}

export interface EconomyMetrics {
  totalCurrencyInCirculation: number;
  totalCurrencySinks: number;
  avgCurrencyPerSession: number;
  purchaseConversionRate: number;
  arpdau: number;
  ltv: number;
}

// ============================================================================
// A/B TESTING SYSTEM
// ============================================================================

export type ABTestStatus = 'active' | 'paused' | 'completed' | 'archived';

export interface ABTestVariant {
  id: string;
  name: string;
  weight: number;         // Traffic allocation (0-100)
  config: Record<string, unknown>; // Variant-specific config
}

export interface ABTestConfig {
  id: string;
  name: string;
  description: string;
  status: ABTestStatus;
  startDate?: string;
  endDate?: string;
  targetSegment?: PlayerSegmentType[]; // Which segments to include
  variants: ABTestVariant[];
  primaryMetric: string;   // Metric to optimize
  minimumSampleSize?: number;
  currentEnrollment?: number;
}

export interface PlayerABTestAssignment {
  testId: string;
  variantId: string;
  assignedAt: string;
  converted?: boolean;
  conversionAt?: string;
}

// ============================================================================
// PLAYER SEGMENTATION
// ============================================================================

export type PlayerSegmentType =
  | 'new_player'           // First 24 hours
  | 'beginner'              // Level 1-50
  | 'intermediate'          // Level 51-200
  | 'advanced'              // Level 201-500
  | 'veteran'               // Level 501+
  | 'casual'                // <30 min/day average
  | 'regular'               // 30-120 min/day average
  | 'hardcore'              // 120+ min/day average
  | 'whale'                 // High IAP spenders
  | 'minnow'                // Low IAP spenders
  | 'free_player'           // Never purchased
  | 'returning'             // Churned then returned
  | 'at_risk'               // Showing churn signals
  | 'collector'             // High artifact completion
  | 'prestige_player'       // Has prestiged at least once
  | 'event_participant'     // Active in current event
  | 'vip';                  // High value players

export interface PlayerSegment {
  type: PlayerSegmentType;
  priority: number;       // Higher = more important for targeting
  criteria: {
    minLevel?: number;
    maxLevel?: number;
    minPrestige?: number;
    maxPrestige?: number;
    minPlaytime?: number;  // Minutes per day
    maxPlaytime?: number;
    minSpend?: number;
    maxSpend?: number;
    daysSinceInstall?: number;
    daysSinceLastSession?: number;
    minCollection?: number; // Artifact/achievement count
    isPaying?: boolean;
    segments?: PlayerSegmentType[]; // Compound segment
  };
  description: { ua: string; en: string };
  tags?: string[];
}

export interface PlayerSegmentState {
  segments: PlayerSegmentType[];
  firstSessionAt?: string;
  lastSessionAt?: string;
  totalPlaytimeMinutes: number;
  lastSegmentUpdate: string;
  vipLevel?: number;
  lifetimeSpend: number;
  lifetimePurchases: number;
}

// ============================================================================
// NOTIFICATION SYSTEM
// ============================================================================

export type NotificationType =
  | 'daily_reminder'        // Come back to play
  | 'streak_warning'        // Streak about to break
  | 'streak_broken'         // Streak was broken
  | 'energy_full'            // Energy is fully regenerated
  | 'event_starting'         // Event about to start
  | 'event_ending'          // Event ending soon
  | 'new_content'           // New epochs, artifacts, etc.
  | 'achievement_unlocked'   // Achievement earned
  | 'leaderboard_reminder'   // Check your ranking
  | 'referral_reminder'      // Invite friends
  | 'season_starting'        // New season beginning
  | 'comeback_offer'         // Return player offer
  | 'daily_reward_ready'     // Check-in available
  | 'mission_complete'       // Mission completed
  | 'level_up'              // Level milestone
  | 'custom';               // Custom message

export interface NotificationTemplate {
  id: string;
  type: NotificationType;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  channels: ('telegram' | 'ingame' | 'push')[];
  title: { ua: string; en: string };
  body: { ua: string; en: string };
  actionUrl?: string;
  actionText?: { ua: string; en: string };
  imageUrl?: string;
  conditions?: {
    minLevel?: number;
    maxLevel?: number;
    minPrestige?: number;
    segments?: PlayerSegmentType[];
    hoursSinceLastSession?: number;
    daysSinceInstall?: number;
    hasStreak?: boolean;
    streakAtRisk?: boolean;
    eventActive?: string;   // Event ID
  };
  scheduling?: {
    type: 'immediate' | 'scheduled' | 'triggered' | 'recurring';
    timeWindows?: { hour: number; minute: number }[];
    delayMinutes?: number;
    triggerEvent?: AnalyticsEventType;
  };
  isEnabled: boolean;
  abTestVariants?: {
    variantId: string;
    title?: { ua: string; en: string };
    body?: { ua: string; en: string };
  }[];
}

export interface ScheduledNotification {
  id: string;
  telegramId: number;
  templateId: string;
  scheduledFor: string;    // ISO8601
  sentAt?: string;
  clickedAt?: string;
  status: 'pending' | 'sent' | 'clicked' | 'failed' | 'cancelled';
  variantId?: string;       // A/B test variant if applicable
}

// ============================================================================
// MONETIZATION SYSTEM
// ============================================================================

export type OfferType =
  | 'starter_pack'          // New player welcome
  | 'value_pack'            // Best value for money
  | 'currency_bundle'       // Direct currency purchase
  | 'energy_pack'           // Energy refills
  | 'artifact_pack'         // Artifact fragments
  | 'booster_bundle'        // XP/Currency boosters
  | 'limited_offer'         // Time-limited deals
  | 'season_pass'           // Battle pass
  | 'subscription'          // Recurring benefits
  | 'bundle';              // Mixed items

export interface IAPProduct {
  id: string;
  type: OfferType;
  name: { ua: string; en: string };
  description: { ua: string; en: string };
  priceStars: number;
  priceUSD: number;
  items: {
    type: 'currency' | 'energy' | 'artifact_fragment' | 'booster' | 'gacha_ticket' | 'season_pass' | 'cosmetic';
    amount: number;
    rarity?: 'common' | 'rare' | 'epic' | 'legendary';
    duration?: number; // For consumables
  }[];
  isLimited?: boolean;
  limitedQuantity?: number;
  startDate?: string;
  endDate?: string;
  displayConditions?: {
    minLevel?: number;
    maxLevel?: number;
    minPrestige?: number;
    segments?: PlayerSegmentType[];
    firstPurchaseOnly?: boolean;
    afterEventId?: string;
  };
  sortOrder: number;
  isFeatured?: boolean;
  analyticsId: string;
}

export interface PlayerOfferState {
  offerId: string;
  viewCount: number;
  purchaseCount: number;
  lastViewedAt?: string;
  purchasedAt?: string;
  dismissed: boolean;
  dismissedAt?: string;
}

// ============================================================================
// REWARD SYSTEM
// ============================================================================

export interface RewardDefinition {
  type: 'currency' | 'xp' | 'energy' | 'artifact_fragment' | 'booster' | 'gacha_ticket' | 'cosmetic' | 'premium_currency' | 'season_xp';
  amount?: number;
  currencyType?: string;
  rarity?: 'common' | 'rare' | 'epic' | 'legendary';
  duration?: number;       // For time-limited rewards (ms)
  artifactId?: string;     // For specific artifact fragments
  boosterType?: 'xp_boost' | 'currency_boost' | 'super_boost';
  cosmeticId?: string;
}

export interface RewardClaimResult {
  success: boolean;
  rewards: RewardDefinition[];
  message?: string;
  error?: string;
}

// ============================================================================
// COMEBACK / RE-ENGAGEMENT SYSTEM
// ============================================================================

export interface ComebackCampaign {
  id: string;
  name: { ua: string; en: string };
  description: { ua: string; en: string };
  targetSegments: PlayerSegmentType[];
  conditions: {
    daysSinceLastSession: number;
    minLevel?: number;
    maxLevel?: number;
    maxTotalPurchases?: number;
  };
  startDate: string;
  endDate: string;
  rewards: {
    day1?: RewardDefinition[];
    day3?: RewardDefinition[];
    day7?: RewardDefinition[];
  };
  requirements?: {
    watchAd?: boolean;
    reachLevel?: number;
    playSessionMinutes?: number;
  };
  isActive: boolean;
}

export interface PlayerComebackState {
  campaignId: string;
  startedAt: string;
  lastClaimedDay?: number;
  totalPlaytimeMinutes: number;
  currentDay: number;     // Which day of the campaign they're on
  completed: boolean;
  rewardsClaimed: number[];
}

// ============================================================================
// STORAGE SCHEMA TYPES (for local/remote sync)
// ============================================================================

export interface LiveOpsState {
  // Current events
  activeEvents: PlayerEventState[];
  eventHistory: PlayerEventState[];
  
  // Season/Battle Pass
  currentSeason: PlayerSeasonState | null;
  seasonHistory: PlayerSeasonState[];
  
  // Achievements
  achievements: PlayerAchievementState[];
  
  // Missions
  currentDailyMissions: PlayerMissionState[];
  currentWeeklyMissions: PlayerMissionState[];
  currentMonthlyMissions: PlayerMissionState[];
  missionHistory: PlayerMissionState[];
  
  // Collection progress
  collectionProgress: PlayerCollectionProgress[];
  
  // Analytics
  playerSegments: PlayerSegmentState;
  
  // Offers
  offerState: Record<string, PlayerOfferState>;
  
  // Comeback
  activeComebackCampaigns: PlayerComebackState[];
  
  // Notifications
  notificationPreferences: Record<string, boolean>;
  lastNotificationSent: Record<string, string>;
  
  // A/B Tests
  abTestAssignments: PlayerABTestAssignment[];
  
  // Timestamps
  lastFullSync: string;
  lastDailyReset: string;
  lastWeeklyReset: string;
  lastMonthlyReset: string;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export type Language = 'ua' | 'en';

export interface LocalizedString {
  ua: string;
  en: string;
}

export function getLocalizedString(str: LocalizedString, lang: Language = 'ua'): string {
  return str[lang] || str.ua;
}

export function isEventActive(event: EventConfig): boolean {
  if (!event.isActive) return false;
  const now = new Date();
  const start = new Date(event.startDate);
  const end = new Date(event.endDate);
  return now >= start && now <= end;
}

export function getDaysUntil(dateStr: string): number {
  const target = new Date(dateStr);
  const now = new Date();
  const diffMs = target.getTime() - now.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

export function getHoursUntil(dateStr: string): number {
  const target = new Date(dateStr);
  const now = new Date();
  const diffMs = target.getTime() - now.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60));
}

export function getTimeRemaining(dateStr: string): { days: number; hours: number; minutes: number; expired: boolean } {
  const target = new Date(dateStr);
  const now = new Date();
  const diffMs = Math.max(0, target.getTime() - now.getTime());
  
  if (diffMs <= 0) {
    return { days: 0, hours: 0, minutes: 0, expired: true };
  }
  
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  
  return { days, hours, minutes, expired: false };
}
