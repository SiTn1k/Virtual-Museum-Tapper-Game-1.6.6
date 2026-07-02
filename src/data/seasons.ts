/**
 * Virtual Museum Tapper Game — Season/Battle Pass Data
 * Production-ready season configurations for LiveOps
 */

import type {
  SeasonConfig,
  SeasonReward,
  SeasonChallenge,
} from '../types/liveops';

// ============================================================================
// SEASON 1: SUMMER 2026
// ============================================================================

const SUMMER_2026_FREE_REWARDS: SeasonReward[] = [
  { tier: 1, xpRequired: 0, freeReward: { type: 'currency', amount: 500 } },
  { tier: 2, xpRequired: 100, freeReward: { type: 'currency', amount: 750 } },
  { tier: 3, xpRequired: 250, freeReward: { type: 'xp', amount: 1000 } },
  { tier: 4, xpRequired: 450, freeReward: { type: 'currency', amount: 1000 } },
  { tier: 5, xpRequired: 700, freeReward: { type: 'booster', amount: 1, duration: 3600000 } },
  { tier: 6, xpRequired: 1000, freeReward: { type: 'currency', amount: 1500 } },
  { tier: 7, xpRequired: 1350, freeReward: { type: 'xp', amount: 2000 } },
  { tier: 8, xpRequired: 1750, freeReward: { type: 'currency', amount: 2000 } },
  { tier: 9, xpRequired: 2200, freeReward: { type: 'gacha_ticket', amount: 1 } },
  { tier: 10, xpRequired: 2700, freeReward: { type: 'currency', amount: 3000 } },
  { tier: 11, xpRequired: 3250, freeReward: { type: 'xp', amount: 3000 } },
  { tier: 12, xpRequired: 3850, freeReward: { type: 'currency', amount: 3500 } },
  { tier: 13, xpRequired: 4500, freeReward: { type: 'artifact_fragment', amount: 5, rarity: 'rare' } },
  { tier: 14, xpRequired: 5200, freeReward: { type: 'currency', amount: 4000 } },
  { tier: 15, xpRequired: 6000, freeReward: { type: 'booster', amount: 1, duration: 7200000 } },
  { tier: 16, xpRequired: 6900, freeReward: { type: 'xp', amount: 5000 } },
  { tier: 17, xpRequired: 7900, freeReward: { type: 'currency', amount: 5000 } },
  { tier: 18, xpRequired: 9000, freeReward: { type: 'artifact_fragment', amount: 5, rarity: 'epic' } },
  { tier: 19, xpRequired: 10200, freeReward: { type: 'currency', amount: 6000 } },
  { tier: 20, xpRequired: 11500, freeReward: { type: 'xp', amount: 8000 } },
  { tier: 21, xpRequired: 13000, freeReward: { type: 'currency', amount: 8000 } },
  { tier: 22, xpRequired: 14700, freeReward: { type: 'gacha_ticket', amount: 2 } },
  { tier: 23, xpRequired: 16600, freeReward: { type: 'artifact_fragment', amount: 10, rarity: 'rare' } },
  { tier: 24, xpRequired: 18700, freeReward: { type: 'currency', amount: 10000 } },
  { tier: 25, xpRequired: 21000, freeReward: { type: 'booster', amount: 1, duration: 14400000 } },
  { tier: 26, xpRequired: 23500, freeReward: { type: 'xp', amount: 10000 } },
  { tier: 27, xpRequired: 26200, freeReward: { type: 'currency', amount: 12000 } },
  { tier: 28, xpRequired: 29100, freeReward: { type: 'artifact_fragment', amount: 10, rarity: 'epic' } },
  { tier: 29, xpRequired: 32200, freeReward: { type: 'currency', amount: 15000 } },
  { tier: 30, xpRequired: 35500, freeReward: { type: 'currency', amount: 20000 } },
];

const SUMMER_2026_PREMIUM_REWARDS: SeasonReward[] = [
  { tier: 1, xpRequired: 0, freeReward: { type: 'currency', amount: 500 }, premiumReward: { type: 'artifact_fragment', amount: 5, rarity: 'rare' } },
  { tier: 2, xpRequired: 100, freeReward: { type: 'currency', amount: 750 }, premiumReward: { type: 'cosmetic', cosmeticId: 'summer_frame_1' } },
  { tier: 3, xpRequired: 250, freeReward: { type: 'xp', amount: 1000 }, premiumReward: { type: 'artifact_fragment', amount: 5, rarity: 'rare' } },
  { tier: 4, xpRequired: 450, freeReward: { type: 'currency', amount: 1000 }, premiumReward: { type: 'currency', amount: 1000 } },
  { tier: 5, xpRequired: 700, freeReward: { type: 'booster', amount: 1, duration: 3600000 }, premiumReward: { type: 'gacha_ticket', amount: 1 } },
  { tier: 6, xpRequired: 1000, freeReward: { type: 'currency', amount: 1500 }, premiumReward: { type: 'artifact_fragment', amount: 10, rarity: 'epic' } },
  { tier: 7, xpRequired: 1350, freeReward: { type: 'xp', amount: 2000 }, premiumReward: { type: 'cosmetic', cosmeticId: 'summer_badge_1' } },
  { tier: 8, xpRequired: 1750, freeReward: { type: 'currency', amount: 2000 }, premiumReward: { type: 'artifact_fragment', amount: 5, rarity: 'legendary' } },
  { tier: 9, xpRequired: 2200, freeReward: { type: 'gacha_ticket', amount: 1 }, premiumReward: { type: 'currency', amount: 3000 } },
  { tier: 10, xpRequired: 2700, freeReward: { type: 'currency', amount: 3000 }, premiumReward: { type: 'artifact_fragment', amount: 10, rarity: 'epic' } },
  { tier: 11, xpRequired: 3250, freeReward: { type: 'xp', amount: 3000 }, premiumReward: { type: 'cosmetic', cosmeticId: 'summer_title_1' } },
  { tier: 12, xpRequired: 3850, freeReward: { type: 'currency', amount: 3500 }, premiumReward: { type: 'artifact_fragment', amount: 15, rarity: 'rare' } },
  { tier: 13, xpRequired: 4500, freeReward: { type: 'artifact_fragment', amount: 5, rarity: 'rare' }, premiumReward: { type: 'artifact_fragment', amount: 10, rarity: 'epic' } },
  { tier: 14, xpRequired: 5200, freeReward: { type: 'currency', amount: 4000 }, premiumReward: { type: 'gacha_ticket', amount: 2 } },
  { tier: 15, xpRequired: 6000, freeReward: { type: 'booster', amount: 1, duration: 7200000 }, premiumReward: { type: 'artifact_fragment', amount: 5, rarity: 'legendary' } },
  { tier: 16, xpRequired: 6900, freeReward: { type: 'xp', amount: 5000 }, premiumReward: { type: 'cosmetic', cosmeticId: 'summer_avatar_1' } },
  { tier: 17, xpRequired: 7900, freeReward: { type: 'currency', amount: 5000 }, premiumReward: { type: 'artifact_fragment', amount: 15, rarity: 'epic' } },
  { tier: 18, xpRequired: 9000, freeReward: { type: 'artifact_fragment', amount: 5, rarity: 'epic' }, premiumReward: { type: 'artifact_fragment', amount: 10, rarity: 'legendary' } },
  { tier: 19, xpRequired: 10200, freeReward: { type: 'currency', amount: 6000 }, premiumReward: { type: 'gacha_ticket', amount: 3 } },
  { tier: 20, xpRequired: 11500, freeReward: { type: 'xp', amount: 8000 }, premiumReward: { type: 'artifact_fragment', amount: 20, rarity: 'epic' } },
  { tier: 21, xpRequired: 13000, freeReward: { type: 'currency', amount: 8000 }, premiumReward: { type: 'cosmetic', cosmeticId: 'summer_frame_2' } },
  { tier: 22, xpRequired: 14700, freeReward: { type: 'gacha_ticket', amount: 2 }, premiumReward: { type: 'artifact_fragment', amount: 10, rarity: 'legendary' } },
  { tier: 23, xpRequired: 16600, freeReward: { type: 'artifact_fragment', amount: 10, rarity: 'rare' }, premiumReward: { type: 'artifact_fragment', amount: 15, rarity: 'epic' } },
  { tier: 24, xpRequired: 18700, freeReward: { type: 'currency', amount: 10000 }, premiumReward: { type: 'gacha_ticket', amount: 5 } },
  { tier: 25, xpRequired: 21000, freeReward: { type: 'booster', amount: 1, duration: 14400000 }, premiumReward: { type: 'artifact_fragment', amount: 5, rarity: 'legendary' } },
  { tier: 26, xpRequired: 23500, freeReward: { type: 'xp', amount: 10000 }, premiumReward: { type: 'cosmetic', cosmeticId: 'summer_badge_2' } },
  { tier: 27, xpRequired: 26200, freeReward: { type: 'currency', amount: 12000 }, premiumReward: { type: 'artifact_fragment', amount: 20, rarity: 'epic' } },
  { tier: 28, xpRequired: 29100, freeReward: { type: 'artifact_fragment', amount: 10, rarity: 'epic' }, premiumReward: { type: 'artifact_fragment', amount: 15, rarity: 'legendary' } },
  { tier: 29, xpRequired: 32200, freeReward: { type: 'currency', amount: 15000 }, premiumReward: { type: 'gacha_ticket', amount: 5 } },
  { tier: 30, xpRequired: 35500, freeReward: { type: 'currency', amount: 20000 }, premiumReward: { type: 'artifact_fragment', amount: 20, rarity: 'legendary' } },
];

const SUMMER_2026_CHALLENGES: SeasonChallenge[] = [
  // Daily challenges
  { id: 'summer_daily_tap_100', name: { ua: 'Тапай 100', en: 'Tap 100 times' }, description: { ua: 'Натисни 100 разів', en: 'Tap 100 times' }, type: 'tap', target: 100, reward: { type: 'season_xp', amount: 50 }, icon: '👆', isDaily: true },
  { id: 'summer_daily_tap_500', name: { ua: 'Тапай 500', en: 'Tap 500 times' }, description: { ua: 'Натисни 500 разів', en: 'Tap 500 times' }, type: 'tap', target: 500, reward: { type: 'season_xp', amount: 150 }, icon: '👆', isDaily: true },
  { id: 'summer_daily_xp_1000', name: { ua: 'Зароби 1000 XP', en: 'Earn 1000 XP' }, description: { ua: 'Зароби 1000 XP тапами', en: 'Earn 1000 XP through taps' }, type: 'earn_xp', target: 1000, reward: { type: 'season_xp', amount: 75 }, icon: '⭐', isDaily: true },
  { id: 'summer_daily_xp_5000', name: { ua: 'Зароби 5000 XP', en: 'Earn 5000 XP' }, description: { ua: 'Зароби 5000 XP тапами', en: 'Earn 5000 XP through taps' }, type: 'earn_xp', target: 5000, reward: { type: 'season_xp', amount: 200 }, icon: '⭐', isDaily: true },
  { id: 'summer_daily_buy_gen', name: { ua: 'Купи генератор', en: 'Buy a generator' }, description: { ua: 'Придбай один генератор', en: 'Purchase one generator' }, type: 'buy_generator', target: 1, reward: { type: 'season_xp', amount: 50 }, icon: '🏛️', isDaily: true },
  { id: 'summer_daily_gacha', name: { ua: 'Відкрий скриню', en: 'Open a chest' }, description: { ua: 'Відкрий скриню артефактів', en: 'Open an artifact chest' }, type: 'open_gacha', target: 1, reward: { type: 'season_xp', amount: 75 }, icon: '🎁', isDaily: true },
  { id: 'summer_daily_ad', name: { ua: 'Подивись рекламу', en: 'Watch an ad' }, description: { ua: 'Переглянь рекламу для нагороди', en: 'Watch an ad for a reward' }, type: 'watch_ad', target: 1, reward: { type: 'season_xp', amount: 25 }, icon: '📺', isDaily: true },
  { id: 'summer_daily_claim', name: { ua: 'Отримай нагороду', en: 'Claim a reward' }, description: { ua: 'Отримай щоденну нагороду', en: 'Claim your daily reward' }, type: 'claim_reward', target: 1, reward: { type: 'season_xp', amount: 50 }, icon: '🎁', isDaily: true },
  
  // Weekly challenges
  { id: 'summer_weekly_tap_5000', name: { ua: 'Тиждень: 5000 тапів', en: 'Week: 5000 taps' }, description: { ua: 'Натисни 5000 разів за тиждень', en: 'Tap 5000 times this week' }, type: 'tap', target: 5000, reward: { type: 'currency', amount: 5000 }, icon: '🏆', isWeekly: true },
  { id: 'summer_weekly_xp_50000', name: { ua: 'Тиждень: 50K XP', en: 'Week: 50K XP' }, description: { ua: 'Зароби 50,000 XP за тиждень', en: 'Earn 50,000 XP this week' }, type: 'earn_xp', target: 50000, reward: { type: 'season_xp', amount: 500 }, icon: '⭐', isWeekly: true },
  { id: 'summer_weekly_buy_gen_10', name: { ua: 'Тиждень: 10 генераторів', en: 'Week: 10 generators' }, description: { ua: 'Придбай 10 генераторів', en: 'Purchase 10 generators' }, type: 'buy_generator', target: 10, reward: { type: 'artifact_fragment', amount: 10, rarity: 'rare' }, icon: '🏛️', isWeekly: true },
  { id: 'summer_weekly_gacha_20', name: { ua: 'Тиждень: 20 скринь', en: 'Week: 20 chests' }, description: { ua: 'Відкрий 20 скринь артефактів', en: 'Open 20 artifact chests' }, type: 'open_gacha', target: 20, reward: { type: 'gacha_ticket', amount: 3 }, icon: '🎁', isWeekly: true },
  { id: 'summer_weekly_level_100', name: { ua: 'Тиждень: Рівень 100', en: 'Week: Level 100' }, description: { ua: 'Досягни рівня 100', en: 'Reach level 100' }, type: 'earn_xp', target: 100, reward: { type: 'currency', amount: 10000 }, icon: '📊', isWeekly: true },
  { id: 'summer_weekly_watch_ads', name: { ua: 'Тиждень: 50 реклам', en: 'Week: 50 ads' }, description: { ua: 'Переглянь 50 реклам', en: 'Watch 50 ads' }, type: 'watch_ad', target: 50, reward: { type: 'season_xp', amount: 750 }, icon: '📺', isWeekly: true },
];

export const SEASON_SUMMER_2026: SeasonConfig = {
  id: 'summer_2026',
  seasonNumber: 1,
  name: {
    ua: '☀️ Літо 2026',
    en: '☀️ Summer 2026',
  },
  description: {
    ua: 'Перший сезон гри! Заробляй нагороди, виконуй виклики!',
    en: 'First season of the game! Earn rewards, complete challenges!',
  },
  theme: 'summer',
  startDate: '2026-06-01T00:00:00Z',
  endDate: '2026-08-31T23:59:59Z',
  durationDays: 91,
  levelCount: 30,
  xpPerLevel: 1000,
  freeRewards: SUMMER_2026_FREE_REWARDS,
  premiumRewards: SUMMER_2026_PREMIUM_REWARDS,
  challenges: SUMMER_2026_CHALLENGES,
  premiumPrice: 300, // Telegram Stars (~$3)
  bonusXpPerLevel: 100,
};

// ============================================================================
// SEASON 2: AUTUMN 2026
// ============================================================================

const AUTUMN_2026_FREE_REWARDS: SeasonReward[] = [
  { tier: 1, xpRequired: 0, freeReward: { type: 'currency', amount: 600 } },
  { tier: 2, xpRequired: 120, freeReward: { type: 'currency', amount: 800 } },
  { tier: 3, xpRequired: 300, freeReward: { type: 'xp', amount: 1200 } },
  { tier: 4, xpRequired: 550, freeReward: { type: 'currency', amount: 1200 } },
  { tier: 5, xpRequired: 850, freeReward: { type: 'booster', amount: 1, duration: 3600000 } },
  { tier: 6, xpRequired: 1200, freeReward: { type: 'currency', amount: 1800 } },
  { tier: 7, xpRequired: 1600, freeReward: { type: 'xp', amount: 2400 } },
  { tier: 8, xpRequired: 2100, freeReward: { type: 'currency', amount: 2500 } },
  { tier: 9, xpRequired: 2650, freeReward: { type: 'gacha_ticket', amount: 1 } },
  { tier: 10, xpRequired: 3250, freeReward: { type: 'currency', amount: 3500 } },
  { tier: 11, xpRequired: 3900, freeReward: { type: 'xp', amount: 3500 } },
  { tier: 12, xpRequired: 4600, freeReward: { type: 'currency', amount: 4000 } },
  { tier: 13, xpRequired: 5400, freeReward: { type: 'artifact_fragment', amount: 5, rarity: 'rare' } },
  { tier: 14, xpRequired: 6300, freeReward: { type: 'currency', amount: 5000 } },
  { tier: 15, xpRequired: 7300, freeReward: { type: 'booster', amount: 1, duration: 7200000 } },
  { tier: 16, xpRequired: 8400, freeReward: { type: 'xp', amount: 6000 } },
  { tier: 17, xpRequired: 9600, freeReward: { type: 'currency', amount: 6000 } },
  { tier: 18, xpRequired: 10900, freeReward: { type: 'artifact_fragment', amount: 5, rarity: 'epic' } },
  { tier: 19, xpRequired: 12300, freeReward: { type: 'currency', amount: 7500 } },
  { tier: 20, xpRequired: 13800, freeReward: { type: 'xp', amount: 10000 } },
  { tier: 21, xpRequired: 15500, freeReward: { type: 'currency', amount: 10000 } },
  { tier: 22, xpRequired: 17300, freeReward: { type: 'gacha_ticket', amount: 2 } },
  { tier: 23, xpRequired: 19200, freeReward: { type: 'artifact_fragment', amount: 10, rarity: 'rare' } },
  { tier: 24, xpRequired: 21300, freeReward: { type: 'currency', amount: 12000 } },
  { tier: 25, xpRequired: 23500, freeReward: { type: 'booster', amount: 1, duration: 14400000 } },
  { tier: 26, xpRequired: 25900, freeReward: { type: 'xp', amount: 12000 } },
  { tier: 27, xpRequired: 28500, freeReward: { type: 'currency', amount: 15000 } },
  { tier: 28, xpRequired: 31300, freeReward: { type: 'artifact_fragment', amount: 10, rarity: 'epic' } },
  { tier: 29, xpRequired: 34300, freeReward: { type: 'currency', amount: 18000 } },
  { tier: 30, xpRequired: 37500, freeReward: { type: 'currency', amount: 25000 } },
];

const AUTUMN_2026_PREMIUM_REWARDS: SeasonReward[] = [
  { tier: 1, xpRequired: 0, freeReward: { type: 'currency', amount: 600 }, premiumReward: { type: 'artifact_fragment', amount: 5, rarity: 'rare' } },
  { tier: 2, xpRequired: 120, freeReward: { type: 'currency', amount: 800 }, premiumReward: { type: 'cosmetic', cosmeticId: 'autumn_frame_1' } },
  { tier: 3, xpRequired: 300, freeReward: { type: 'xp', amount: 1200 }, premiumReward: { type: 'artifact_fragment', amount: 5, rarity: 'rare' } },
  { tier: 4, xpRequired: 550, freeReward: { type: 'currency', amount: 1200 }, premiumReward: { type: 'currency', amount: 1200 } },
  { tier: 5, xpRequired: 850, freeReward: { type: 'booster', amount: 1, duration: 3600000 }, premiumReward: { type: 'gacha_ticket', amount: 1 } },
  { tier: 6, xpRequired: 1200, freeReward: { type: 'currency', amount: 1800 }, premiumReward: { type: 'artifact_fragment', amount: 10, rarity: 'epic' } },
  { tier: 7, xpRequired: 1600, freeReward: { type: 'xp', amount: 2400 }, premiumReward: { type: 'cosmetic', cosmeticId: 'autumn_badge_1' } },
  { tier: 8, xpRequired: 2100, freeReward: { type: 'currency', amount: 2500 }, premiumReward: { type: 'artifact_fragment', amount: 5, rarity: 'legendary' } },
  { tier: 9, xpRequired: 2650, freeReward: { type: 'gacha_ticket', amount: 1 }, premiumReward: { type: 'currency', amount: 3500 } },
  { tier: 10, xpRequired: 3250, freeReward: { type: 'currency', amount: 3500 }, premiumReward: { type: 'artifact_fragment', amount: 10, rarity: 'epic' } },
  { tier: 11, xpRequired: 3900, freeReward: { type: 'xp', amount: 3500 }, premiumReward: { type: 'cosmetic', cosmeticId: 'autumn_title_1' } },
  { tier: 12, xpRequired: 4600, freeReward: { type: 'currency', amount: 4000 }, premiumReward: { type: 'artifact_fragment', amount: 15, rarity: 'rare' } },
  { tier: 13, xpRequired: 5400, freeReward: { type: 'artifact_fragment', amount: 5, rarity: 'rare' }, premiumReward: { type: 'artifact_fragment', amount: 10, rarity: 'epic' } },
  { tier: 14, xpRequired: 6300, freeReward: { type: 'currency', amount: 5000 }, premiumReward: { type: 'gacha_ticket', amount: 2 } },
  { tier: 15, xpRequired: 7300, freeReward: { type: 'booster', amount: 1, duration: 7200000 }, premiumReward: { type: 'artifact_fragment', amount: 5, rarity: 'legendary' } },
  { tier: 16, xpRequired: 8400, freeReward: { type: 'xp', amount: 6000 }, premiumReward: { type: 'cosmetic', cosmeticId: 'autumn_avatar_1' } },
  { tier: 17, xpRequired: 9600, freeReward: { type: 'currency', amount: 6000 }, premiumReward: { type: 'artifact_fragment', amount: 15, rarity: 'epic' } },
  { tier: 18, xpRequired: 10900, freeReward: { type: 'artifact_fragment', amount: 5, rarity: 'epic' }, premiumReward: { type: 'artifact_fragment', amount: 10, rarity: 'legendary' } },
  { tier: 19, xpRequired: 12300, freeReward: { type: 'currency', amount: 7500 }, premiumReward: { type: 'gacha_ticket', amount: 3 } },
  { tier: 20, xpRequired: 13800, freeReward: { type: 'xp', amount: 10000 }, premiumReward: { type: 'artifact_fragment', amount: 20, rarity: 'epic' } },
  { tier: 21, xpRequired: 15500, freeReward: { type: 'currency', amount: 10000 }, premiumReward: { type: 'cosmetic', cosmeticId: 'autumn_frame_2' } },
  { tier: 22, xpRequired: 17300, freeReward: { type: 'gacha_ticket', amount: 2 }, premiumReward: { type: 'artifact_fragment', amount: 10, rarity: 'legendary' } },
  { tier: 23, xpRequired: 19200, freeReward: { type: 'artifact_fragment', amount: 10, rarity: 'rare' }, premiumReward: { type: 'artifact_fragment', amount: 15, rarity: 'epic' } },
  { tier: 24, xpRequired: 21300, freeReward: { type: 'currency', amount: 12000 }, premiumReward: { type: 'gacha_ticket', amount: 5 } },
  { tier: 25, xpRequired: 23500, freeReward: { type: 'booster', amount: 1, duration: 14400000 }, premiumReward: { type: 'artifact_fragment', amount: 5, rarity: 'legendary' } },
  { tier: 26, xpRequired: 25900, freeReward: { type: 'xp', amount: 12000 }, premiumReward: { type: 'cosmetic', cosmeticId: 'autumn_badge_2' } },
  { tier: 27, xpRequired: 28500, freeReward: { type: 'currency', amount: 15000 }, premiumReward: { type: 'artifact_fragment', amount: 20, rarity: 'epic' } },
  { tier: 28, xpRequired: 31300, freeReward: { type: 'artifact_fragment', amount: 10, rarity: 'epic' }, premiumReward: { type: 'artifact_fragment', amount: 15, rarity: 'legendary' } },
  { tier: 29, xpRequired: 34300, freeReward: { type: 'currency', amount: 18000 }, premiumReward: { type: 'gacha_ticket', amount: 5 } },
  { tier: 30, xpRequired: 37500, freeReward: { type: 'currency', amount: 25000 }, premiumReward: { type: 'artifact_fragment', amount: 20, rarity: 'legendary' } },
];

const AUTUMN_2026_CHALLENGES: SeasonChallenge[] = [
  // Daily challenges
  { id: 'autumn_daily_tap_100', name: { ua: 'Тапай 100', en: 'Tap 100 times' }, description: { ua: 'Натисни 100 разів', en: 'Tap 100 times' }, type: 'tap', target: 100, reward: { type: 'season_xp', amount: 50 }, icon: '👆', isDaily: true },
  { id: 'autumn_daily_tap_1000', name: { ua: 'Тапай 1000', en: 'Tap 1000 times' }, description: { ua: 'Натисни 1000 разів', en: 'Tap 1000 times' }, type: 'tap', target: 1000, reward: { type: 'season_xp', amount: 250 }, icon: '👆', isDaily: true },
  { id: 'autumn_daily_xp_2000', name: { ua: 'Зароби 2000 XP', en: 'Earn 2000 XP' }, description: { ua: 'Зароби 2000 XP тапами', en: 'Earn 2000 XP through taps' }, type: 'earn_xp', target: 2000, reward: { type: 'season_xp', amount: 100 }, icon: '⭐', isDaily: true },
  { id: 'autumn_daily_buy_gen', name: { ua: 'Купи генератор', en: 'Buy a generator' }, description: { ua: 'Придбай один генератор', en: 'Purchase one generator' }, type: 'buy_generator', target: 1, reward: { type: 'season_xp', amount: 50 }, icon: '🏛️', isDaily: true },
  { id: 'autumn_daily_gacha', name: { ua: 'Відкрий скриню', en: 'Open a chest' }, description: { ua: 'Відкрий скриню артефактів', en: 'Open an artifact chest' }, type: 'open_gacha', target: 1, reward: { type: 'season_xp', amount: 75 }, icon: '🎁', isDaily: true },
  { id: 'autumn_daily_upgrade', name: { ua: 'Покращи тап', en: 'Upgrade tap' }, description: { ua: 'Покращи силу тапу', en: 'Upgrade tap power' }, type: 'upgrade_tap', target: 1, reward: { type: 'season_xp', amount: 100 }, icon: '⚡', isDaily: true },
  { id: 'autumn_daily_claim', name: { ua: 'Отримай нагороду', en: 'Claim a reward' }, description: { ua: 'Отримай щоденну нагороду', en: 'Claim your daily reward' }, type: 'claim_reward', target: 1, reward: { type: 'season_xp', amount: 50 }, icon: '🎁', isDaily: true },
  
  // Weekly challenges
  { id: 'autumn_weekly_tap_10000', name: { ua: 'Тиждень: 10000 тапів', en: 'Week: 10000 taps' }, description: { ua: 'Натисни 10000 разів за тиждень', en: 'Tap 10000 times this week' }, type: 'tap', target: 10000, reward: { type: 'currency', amount: 10000 }, icon: '🏆', isWeekly: true },
  { id: 'autumn_weekly_xp_100000', name: { ua: 'Тиждень: 100K XP', en: 'Week: 100K XP' }, description: { ua: 'Зароби 100,000 XP за тиждень', en: 'Earn 100,000 XP this week' }, type: 'earn_xp', target: 100000, reward: { type: 'season_xp', amount: 1000 }, icon: '⭐', isWeekly: true },
  { id: 'autumn_weekly_buy_gen_20', name: { ua: 'Тиждень: 20 генераторів', en: 'Week: 20 generators' }, description: { ua: 'Придбай 20 генераторів', en: 'Purchase 20 generators' }, type: 'buy_generator', target: 20, reward: { type: 'artifact_fragment', amount: 15, rarity: 'rare' }, icon: '🏛️', isWeekly: true },
  { id: 'autumn_weekly_epoch', name: { ua: 'Тиждень: Нова епоха', en: 'Week: New epoch' }, description: { ua: 'Перейди на нову епоху', en: 'Advance to a new epoch' }, type: 'epoch_complete', target: 1, reward: { type: 'artifact_fragment', amount: 10, rarity: 'epic' }, icon: '🏛️', isWeekly: true },
  { id: 'autumn_weekly_gacha_30', name: { ua: 'Тиждень: 30 скринь', en: 'Week: 30 chests' }, description: { ua: 'Відкрий 30 скринь артефактів', en: 'Open 30 artifact chests' }, type: 'open_gacha', target: 30, reward: { type: 'gacha_ticket', amount: 5 }, icon: '🎁', isWeekly: true },
  { id: 'autumn_weekly_watch_ads', name: { ua: 'Тиждень: 70 реклам', en: 'Week: 70 ads' }, description: { ua: 'Переглянь 70 реклам', en: 'Watch 70 ads' }, type: 'watch_ad', target: 70, reward: { type: 'season_xp', amount: 1000 }, icon: '📺', isWeekly: true },
];

export const SEASON_AUTUMN_2026: SeasonConfig = {
  id: 'autumn_2026',
  seasonNumber: 2,
  name: {
    ua: '🍂 Осінь 2026',
    en: '🍂 Autumn 2026',
  },
  description: {
    ua: 'Другий сезон! Нові виклики та нагороди!',
    en: 'Second season! New challenges and rewards!',
  },
  theme: 'autumn',
  startDate: '2026-09-01T00:00:00Z',
  endDate: '2026-11-30T23:59:59Z',
  durationDays: 91,
  levelCount: 30,
  xpPerLevel: 1200,
  freeRewards: AUTUMN_2026_FREE_REWARDS,
  premiumRewards: AUTUMN_2026_PREMIUM_REWARDS,
  challenges: AUTUMN_2026_CHALLENGES,
  premiumPrice: 300,
  bonusXpPerLevel: 100,
};

// ============================================================================
// SEASON 3: WINTER 2026-2027
// ============================================================================

const WINTER_2026_FREE_REWARDS: SeasonReward[] = [
  { tier: 1, xpRequired: 0, freeReward: { type: 'currency', amount: 700 } },
  { tier: 2, xpRequired: 150, freeReward: { type: 'currency', amount: 900 } },
  { tier: 3, xpRequired: 350, freeReward: { type: 'xp', amount: 1500 } },
  { tier: 4, xpRequired: 650, freeReward: { type: 'currency', amount: 1500 } },
  { tier: 5, xpRequired: 1000, freeReward: { type: 'booster', amount: 1, duration: 3600000 } },
  { tier: 6, xpRequired: 1450, freeReward: { type: 'currency', amount: 2000 } },
  { tier: 7, xpRequired: 1950, freeReward: { type: 'xp', amount: 3000 } },
  { tier: 8, xpRequired: 2500, freeReward: { type: 'currency', amount: 3000 } },
  { tier: 9, xpRequired: 3100, freeReward: { type: 'gacha_ticket', amount: 1 } },
  { tier: 10, xpRequired: 3800, freeReward: { type: 'currency', amount: 4000 } },
  { tier: 11, xpRequired: 4550, freeReward: { type: 'xp', amount: 4000 } },
  { tier: 12, xpRequired: 5350, freeReward: { type: 'currency', amount: 5000 } },
  { tier: 13, xpRequired: 6250, freeReward: { type: 'artifact_fragment', amount: 5, rarity: 'rare' } },
  { tier: 14, xpRequired: 7250, freeReward: { type: 'currency', amount: 6000 } },
  { tier: 15, xpRequired: 8350, freeReward: { type: 'booster', amount: 1, duration: 7200000 } },
  { tier: 16, xpRequired: 9550, freeReward: { type: 'xp', amount: 7000 } },
  { tier: 17, xpRequired: 10850, freeReward: { type: 'currency', amount: 7500 } },
  { tier: 18, xpRequired: 12250, freeReward: { type: 'artifact_fragment', amount: 5, rarity: 'epic' } },
  { tier: 19, xpRequired: 13750, freeReward: { type: 'currency', amount: 9000 } },
  { tier: 20, xpRequired: 15350, freeReward: { type: 'xp', amount: 12000 } },
  { tier: 21, xpRequired: 17100, freeReward: { type: 'currency', amount: 12000 } },
  { tier: 22, xpRequired: 19000, freeReward: { type: 'gacha_ticket', amount: 2 } },
  { tier: 23, xpRequired: 21000, freeReward: { type: 'artifact_fragment', amount: 10, rarity: 'rare' } },
  { tier: 24, xpRequired: 23150, freeReward: { type: 'currency', amount: 15000 } },
  { tier: 25, xpRequired: 25400, freeReward: { type: 'booster', amount: 1, duration: 14400000 } },
  { tier: 26, xpRequired: 27800, freeReward: { type: 'xp', amount: 15000 } },
  { tier: 27, xpRequired: 30350, freeReward: { type: 'currency', amount: 18000 } },
  { tier: 28, xpRequired: 33050, freeReward: { type: 'artifact_fragment', amount: 10, rarity: 'epic' } },
  { tier: 29, xpRequired: 35900, freeReward: { type: 'currency', amount: 22000 } },
  { tier: 30, xpRequired: 38900, freeReward: { type: 'currency', amount: 30000 } },
];

const WINTER_2026_PREMIUM_REWARDS: SeasonReward[] = [
  { tier: 1, xpRequired: 0, freeReward: { type: 'currency', amount: 700 }, premiumReward: { type: 'artifact_fragment', amount: 5, rarity: 'rare' } },
  { tier: 2, xpRequired: 150, freeReward: { type: 'currency', amount: 900 }, premiumReward: { type: 'cosmetic', cosmeticId: 'winter_frame_1' } },
  { tier: 3, xpRequired: 350, freeReward: { type: 'xp', amount: 1500 }, premiumReward: { type: 'artifact_fragment', amount: 5, rarity: 'rare' } },
  { tier: 4, xpRequired: 650, freeReward: { type: 'currency', amount: 1500 }, premiumReward: { type: 'currency', amount: 1500 } },
  { tier: 5, xpRequired: 1000, freeReward: { type: 'booster', amount: 1, duration: 3600000 }, premiumReward: { type: 'gacha_ticket', amount: 1 } },
  { tier: 6, xpRequired: 1450, freeReward: { type: 'currency', amount: 2000 }, premiumReward: { type: 'artifact_fragment', amount: 10, rarity: 'epic' } },
  { tier: 7, xpRequired: 1950, freeReward: { type: 'xp', amount: 3000 }, premiumReward: { type: 'cosmetic', cosmeticId: 'winter_badge_1' } },
  { tier: 8, xpRequired: 2500, freeReward: { type: 'currency', amount: 3000 }, premiumReward: { type: 'artifact_fragment', amount: 5, rarity: 'legendary' } },
  { tier: 9, xpRequired: 3100, freeReward: { type: 'gacha_ticket', amount: 1 }, premiumReward: { type: 'currency', amount: 4000 } },
  { tier: 10, xpRequired: 3800, freeReward: { type: 'currency', amount: 4000 }, premiumReward: { type: 'artifact_fragment', amount: 10, rarity: 'epic' } },
  { tier: 11, xpRequired: 4550, freeReward: { type: 'xp', amount: 4000 }, premiumReward: { type: 'cosmetic', cosmeticId: 'winter_title_1' } },
  { tier: 12, xpRequired: 5350, freeReward: { type: 'currency', amount: 5000 }, premiumReward: { type: 'artifact_fragment', amount: 15, rarity: 'rare' } },
  { tier: 13, xpRequired: 6250, freeReward: { type: 'artifact_fragment', amount: 5, rarity: 'rare' }, premiumReward: { type: 'artifact_fragment', amount: 10, rarity: 'epic' } },
  { tier: 14, xpRequired: 7250, freeReward: { type: 'currency', amount: 6000 }, premiumReward: { type: 'gacha_ticket', amount: 2 } },
  { tier: 15, xpRequired: 8350, freeReward: { type: 'booster', amount: 1, duration: 7200000 }, premiumReward: { type: 'artifact_fragment', amount: 5, rarity: 'legendary' } },
  { tier: 16, xpRequired: 9550, freeReward: { type: 'xp', amount: 7000 }, premiumReward: { type: 'cosmetic', cosmeticId: 'winter_avatar_1' } },
  { tier: 17, xpRequired: 10850, freeReward: { type: 'currency', amount: 7500 }, premiumReward: { type: 'artifact_fragment', amount: 15, rarity: 'epic' } },
  { tier: 18, xpRequired: 12250, freeReward: { type: 'artifact_fragment', amount: 5, rarity: 'epic' }, premiumReward: { type: 'artifact_fragment', amount: 10, rarity: 'legendary' } },
  { tier: 19, xpRequired: 13750, freeReward: { type: 'currency', amount: 9000 }, premiumReward: { type: 'gacha_ticket', amount: 3 } },
  { tier: 20, xpRequired: 15350, freeReward: { type: 'xp', amount: 12000 }, premiumReward: { type: 'artifact_fragment', amount: 20, rarity: 'epic' } },
  { tier: 21, xpRequired: 17100, freeReward: { type: 'currency', amount: 12000 }, premiumReward: { type: 'cosmetic', cosmeticId: 'winter_frame_2' } },
  { tier: 22, xpRequired: 19000, freeReward: { type: 'gacha_ticket', amount: 2 }, premiumReward: { type: 'artifact_fragment', amount: 10, rarity: 'legendary' } },
  { tier: 23, xpRequired: 21000, freeReward: { type: 'artifact_fragment', amount: 10, rarity: 'rare' }, premiumReward: { type: 'artifact_fragment', amount: 15, rarity: 'epic' } },
  { tier: 24, xpRequired: 23150, freeReward: { type: 'currency', amount: 15000 }, premiumReward: { type: 'gacha_ticket', amount: 5 } },
  { tier: 25, xpRequired: 25400, freeReward: { type: 'booster', amount: 1, duration: 14400000 }, premiumReward: { type: 'artifact_fragment', amount: 5, rarity: 'legendary' } },
  { tier: 26, xpRequired: 27800, freeReward: { type: 'xp', amount: 15000 }, premiumReward: { type: 'cosmetic', cosmeticId: 'winter_badge_2' } },
  { tier: 27, xpRequired: 30350, freeReward: { type: 'currency', amount: 18000 }, premiumReward: { type: 'artifact_fragment', amount: 20, rarity: 'epic' } },
  { tier: 28, xpRequired: 33050, freeReward: { type: 'artifact_fragment', amount: 10, rarity: 'epic' }, premiumReward: { type: 'artifact_fragment', amount: 15, rarity: 'legendary' } },
  { tier: 29, xpRequired: 35900, freeReward: { type: 'currency', amount: 22000 }, premiumReward: { type: 'gacha_ticket', amount: 5 } },
  { tier: 30, xpRequired: 38900, freeReward: { type: 'currency', amount: 30000 }, premiumReward: { type: 'artifact_fragment', amount: 20, rarity: 'legendary' } },
];

const WINTER_2026_CHALLENGES: SeasonChallenge[] = [
  // Daily challenges
  { id: 'winter_daily_tap_200', name: { ua: 'Тапай 200', en: 'Tap 200 times' }, description: { ua: 'Натисни 200 разів', en: 'Tap 200 times' }, type: 'tap', target: 200, reward: { type: 'season_xp', amount: 75 }, icon: '👆', isDaily: true },
  { id: 'winter_daily_tap_2000', name: { ua: 'Тапай 2000', en: 'Tap 2000 times' }, description: { ua: 'Натисни 2000 разів', en: 'Tap 2000 times' }, type: 'tap', target: 2000, reward: { type: 'season_xp', amount: 400 }, icon: '👆', isDaily: true },
  { id: 'winter_daily_xp_5000', name: { ua: 'Зароби 5000 XP', en: 'Earn 5000 XP' }, description: { ua: 'Зароби 5000 XP тапами', en: 'Earn 5000 XP through taps' }, type: 'earn_xp', target: 5000, reward: { type: 'season_xp', amount: 200 }, icon: '⭐', isDaily: true },
  { id: 'winter_daily_buy_gen_3', name: { ua: 'Купи 3 генератори', en: 'Buy 3 generators' }, description: { ua: 'Придбай три генератори', en: 'Purchase three generators' }, type: 'buy_generator', target: 3, reward: { type: 'season_xp', amount: 150 }, icon: '🏛️', isDaily: true },
  { id: 'winter_daily_gacha', name: { ua: 'Відкрий скриню', en: 'Open a chest' }, description: { ua: 'Відкрий скриню артефактів', en: 'Open an artifact chest' }, type: 'open_gacha', target: 1, reward: { type: 'season_xp', amount: 75 }, icon: '🎁', isDaily: true },
  { id: 'winter_daily_upgrade_2', name: { ua: 'Покращи тап 2 рази', en: 'Upgrade tap 2x' }, description: { ua: 'Покращи силу тапу двічі', en: 'Upgrade tap power twice' }, type: 'upgrade_tap', target: 2, reward: { type: 'season_xp', amount: 150 }, icon: '⚡', isDaily: true },
  { id: 'winter_daily_claim', name: { ua: 'Отримай нагороду', en: 'Claim a reward' }, description: { ua: 'Отримай щоденну нагороду', en: 'Claim your daily reward' }, type: 'claim_reward', target: 1, reward: { type: 'season_xp', amount: 50 }, icon: '🎁', isDaily: true },
  
  // Weekly challenges
  { id: 'winter_weekly_tap_20000', name: { ua: 'Тиждень: 20000 тапів', en: 'Week: 20000 taps' }, description: { ua: 'Натисни 20000 разів за тиждень', en: 'Tap 20000 times this week' }, type: 'tap', target: 20000, reward: { type: 'currency', amount: 15000 }, icon: '🏆', isWeekly: true },
  { id: 'winter_weekly_xp_200000', name: { ua: 'Тиждень: 200K XP', en: 'Week: 200K XP' }, description: { ua: 'Зароби 200,000 XP за тиждень', en: 'Earn 200,000 XP this week' }, type: 'earn_xp', target: 200000, reward: { type: 'season_xp', amount: 1500 }, icon: '⭐', isWeekly: true },
  { id: 'winter_weekly_buy_gen_30', name: { ua: 'Тиждень: 30 генераторів', en: 'Week: 30 generators' }, description: { ua: 'Придбай 30 генераторів', en: 'Purchase 30 generators' }, type: 'buy_generator', target: 30, reward: { type: 'artifact_fragment', amount: 20, rarity: 'rare' }, icon: '🏛️', isWeekly: true },
  { id: 'winter_weekly_prestige', name: { ua: 'Тиждень: Відродження', en: 'Week: Prestige' }, description: { ua: 'Здійсни відродження', en: 'Perform a prestige' }, type: 'prestige', target: 1, reward: { type: 'artifact_fragment', amount: 15, rarity: 'legendary' }, icon: '🔄', isWeekly: true },
  { id: 'winter_weekly_gacha_50', name: { ua: 'Тиждень: 50 скринь', en: 'Week: 50 chests' }, description: { ua: 'Відкрий 50 скринь артефактів', en: 'Open 50 artifact chests' }, type: 'open_gacha', target: 50, reward: { type: 'gacha_ticket', amount: 7 }, icon: '🎁', isWeekly: true },
  { id: 'winter_weekly_watch_ads', name: { ua: 'Тиждень: 100 реклам', en: 'Week: 100 ads' }, description: { ua: 'Переглянь 100 реклам', en: 'Watch 100 ads' }, type: 'watch_ad', target: 100, reward: { type: 'season_xp', amount: 1500 }, icon: '📺', isWeekly: true },
];

export const SEASON_WINTER_2026: SeasonConfig = {
  id: 'winter_2026_2027',
  seasonNumber: 3,
  name: {
    ua: '❄️ Зима 2026-2027',
    en: '❄️ Winter 2026-2027',
  },
  description: {
    ua: 'Третій сезон! Зимові свята та особливі нагороди!',
    en: 'Third season! Winter holidays and special rewards!',
  },
  theme: 'winter',
  startDate: '2026-12-01T00:00:00Z',
  endDate: '2027-02-28T23:59:59Z',
  durationDays: 91,
  levelCount: 30,
  xpPerLevel: 1500,
  freeRewards: WINTER_2026_FREE_REWARDS,
  premiumRewards: WINTER_2026_PREMIUM_REWARDS,
  challenges: WINTER_2026_CHALLENGES,
  premiumPrice: 300,
  bonusXpPerLevel: 100,
};

// ============================================================================
// SEASON REGISTRY
// ============================================================================

export const ALL_SEASONS: SeasonConfig[] = [
  SEASON_SUMMER_2026,
  SEASON_AUTUMN_2026,
  SEASON_WINTER_2026,
];

/**
 * Get the current active season
 */
export function getCurrentSeason(): SeasonConfig | undefined {
  const now = new Date();
  return ALL_SEASONS.find(season => {
    const start = new Date(season.startDate);
    const end = new Date(season.endDate);
    return now >= start && now <= end;
  });
}

/**
 * Get a season by ID
 */
export function getSeasonById(seasonId: string): SeasonConfig | undefined {
  return ALL_SEASONS.find(s => s.id === seasonId);
}

/**
 * Get upcoming seasons
 */
export function getUpcomingSeasons(): SeasonConfig[] {
  const now = new Date();
  return ALL_SEASONS
    .filter(season => new Date(season.startDate) > now)
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
}

/**
 * Get season by date
 */
export function getSeasonForDate(date: Date): SeasonConfig | undefined {
  return ALL_SEASONS.find(season => {
    const start = new Date(season.startDate);
    const end = new Date(season.endDate);
    return date >= start && date <= end;
  });
}

/**
 * Get total XP required for a season tier
 */
export function getSeasonTierXp(season: SeasonConfig, tier: number): number {
  const reward = season.freeRewards.find(r => r.tier === tier);
  return reward?.xpRequired || 0;
}

/**
 * Get current tier for a given XP amount
 */
export function getCurrentTierForXp(season: SeasonConfig, totalXp: number): number {
  let currentTier = 0;
  for (const reward of season.freeRewards) {
    if (totalXp >= reward.xpRequired) {
      currentTier = reward.tier;
    } else {
      break;
    }
  }
  return currentTier;
}

/**
 * Calculate XP progress within current tier
 */
export function getSeasonXpProgress(season: SeasonConfig, totalXp: number): { currentTier: number; xpInTier: number; xpToNextTier: number; progress: number } {
  const currentTier = getCurrentTierForXp(season, totalXp);
  const currentReward = season.freeRewards.find(r => r.tier === currentTier);
  const nextReward = season.freeRewards.find(r => r.tier === currentTier + 1);
  
  const tierStartXp = currentReward?.xpRequired || 0;
  const tierEndXp = nextReward?.xpRequired || tierStartXp + season.xpPerLevel;
  const xpInTier = totalXp - tierStartXp;
  const xpToNextTier = tierEndXp - tierStartXp;
  
  return {
    currentTier,
    xpInTier: Math.max(0, xpInTier),
    xpToNextTier: Math.max(1, xpToNextTier),
    progress: xpToNextTier > 0 ? Math.min(1, xpInTier / xpToNextTier) : 1,
  };
}
