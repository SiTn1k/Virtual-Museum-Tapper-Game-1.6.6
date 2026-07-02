/**
 * Virtual Museum Tapper Game — Mission System Data
 * Daily, Weekly, and Monthly missions for long-term engagement
 */

import type {
  MissionDef,
  MissionFrequency,
} from '../types/liveops';

// ============================================================================
// DAILY MISSIONS
// ============================================================================

const DAILY_MISSIONS: MissionDef[] = [
  // Tap missions
  {
    id: 'daily_tap_100',
    name: { ua: 'Легкий Тап', en: 'Light Tap' },
    description: { ua: 'Натисни 100 разів', en: 'Tap 100 times' },
    type: 'tap',
    frequency: 'daily',
    target: 100,
    reward: { currency: 100 },
    icon: '👆',
  },
  {
    id: 'daily_tap_500',
    name: { ua: 'Середній Тап', en: 'Medium Tap' },
    description: { ua: 'Натисни 500 разів', en: 'Tap 500 times' },
    type: 'tap',
    frequency: 'daily',
    target: 500,
    reward: { currency: 300 },
    icon: '👆',
  },
  {
    id: 'daily_tap_1000',
    name: { ua: 'Важкий Тап', en: 'Hard Tap' },
    description: { ua: 'Натисни 1,000 разів', en: 'Tap 1,000 times' },
    type: 'tap',
    frequency: 'daily',
    target: 1000,
    reward: { currency: 600, xp: 200 },
    icon: '👆',
  },
  // XP missions
  {
    id: 'daily_xp_1000',
    name: { ua: 'Легкий XP', en: 'Light XP' },
    description: { ua: 'Зароби 1,000 XP', en: 'Earn 1,000 XP' },
    type: 'earn_xp',
    frequency: 'daily',
    target: 1000,
    reward: { currency: 100 },
    icon: '⭐',
  },
  {
    id: 'daily_xp_5000',
    name: { ua: 'Середній XP', en: 'Medium XP' },
    description: { ua: 'Зароби 5,000 XP', en: 'Earn 5,000 XP' },
    type: 'earn_xp',
    frequency: 'daily',
    target: 5000,
    reward: { currency: 350 },
    icon: '⭐',
  },
  {
    id: 'daily_xp_15000',
    name: { ua: 'Важкий XP', en: 'Hard XP' },
    description: { ua: 'Зароби 15,000 XP', en: 'Earn 15,000 XP' },
    type: 'earn_xp',
    frequency: 'daily',
    target: 15000,
    reward: { currency: 800, xp: 500 },
    icon: '⭐',
  },
  // Generator missions
  {
    id: 'daily_gen_1',
    name: { ua: 'Перший Крок', en: 'First Step' },
    description: { ua: 'Купи 1 генератор', en: 'Buy 1 generator' },
    type: 'buy_generator',
    frequency: 'daily',
    target: 1,
    reward: { currency: 150 },
    icon: '🏛️',
  },
  {
    id: 'daily_gen_3',
    name: { ua: 'Розширення', en: 'Expansion' },
    description: { ua: 'Купи 3 генератори', en: 'Buy 3 generators' },
    type: 'buy_generator',
    frequency: 'daily',
    target: 3,
    reward: { currency: 400 },
    icon: '🏛️',
  },
  {
    id: 'daily_gen_5',
    name: { ua: 'Будівельник', en: 'Builder' },
    description: { ua: 'Купи 5 генераторів', en: 'Buy 5 generators' },
    type: 'buy_generator',
    frequency: 'daily',
    target: 5,
    reward: { currency: 700, xp: 300 },
    icon: '🏛️',
  },
  // Gacha missions
  {
    id: 'daily_gacha_1',
    name: { ua: 'Шанс', en: 'Chance' },
    description: { ua: 'Відкрий 1 скриню', en: 'Open 1 chest' },
    type: 'open_gacha',
    frequency: 'daily',
    target: 1,
    reward: { currency: 200 },
    icon: '🎁',
  },
  {
    id: 'daily_gacha_3',
    name: { ua: 'Колекціонер', en: 'Collector' },
    description: { ua: 'Відкрий 3 скрині', en: 'Open 3 chests' },
    type: 'open_gacha',
    frequency: 'daily',
    target: 3,
    reward: { currency: 500 },
    icon: '🎁',
  },
  // Tap upgrade missions
  {
    id: 'daily_upgrade_1',
    name: { ua: 'Покращення', en: 'Upgrade' },
    description: { ua: 'Покращи силу тапу 1 раз', en: 'Upgrade tap power 1 time' },
    type: 'upgrade_tap',
    frequency: 'daily',
    target: 1,
    reward: { currency: 200, xp: 100 },
    icon: '⚡',
  },
  {
    id: 'daily_upgrade_3',
    name: { ua: 'Сила', en: 'Power' },
    description: { ua: 'Покращи силу тапу 3 рази', en: 'Upgrade tap power 3 times' },
    type: 'upgrade_tap',
    frequency: 'daily',
    target: 3,
    reward: { currency: 500, xp: 300 },
    icon: '⚡',
  },
  // Ad watching missions
  {
    id: 'daily_ad_1',
    name: { ua: 'Допомога', en: 'Help' },
    description: { ua: 'Подивись 1 рекламу', en: 'Watch 1 ad' },
    type: 'watch_ad',
    frequency: 'daily',
    target: 1,
    reward: { currency: 50 },
    icon: '📺',
  },
  {
    id: 'daily_ad_5',
    name: { ua: 'Рекламний Переглядач', en: 'Ad Viewer' },
    description: { ua: 'Подивись 5 реклам', en: 'Watch 5 ads' },
    type: 'watch_ad',
    frequency: 'daily',
    target: 5,
    reward: { currency: 300, xp: 200 },
    icon: '📺',
  },
  // Daily reward missions
  {
    id: 'daily_claim',
    name: { ua: 'Щоденна Нагорода', en: 'Daily Reward' },
    description: { ua: 'Отримай щоденну нагороду', en: 'Claim your daily reward' },
    type: 'claim_daily',
    frequency: 'daily',
    target: 1,
    reward: { currency: 100 },
    icon: '🎁',
  },
];

// ============================================================================
// WEEKLY MISSIONS
// ============================================================================

const WEEKLY_MISSIONS: MissionDef[] = [
  // Tap missions
  {
    id: 'weekly_tap_5000',
    name: { ua: 'Тижневий Тапінг', en: 'Weekly Tapping' },
    description: { ua: 'Натисни 5,000 разів за тиждень', en: 'Tap 5,000 times this week' },
    type: 'tap',
    frequency: 'weekly',
    target: 5000,
    reward: { currency: 2000, xp: 500 },
    icon: '👆',
  },
  {
    id: 'weekly_tap_20000',
    name: { ua: 'Марафонець', en: 'Marathon' },
    description: { ua: 'Натисни 20,000 разів за тиждень', en: 'Tap 20,000 times this week' },
    type: 'tap',
    frequency: 'weekly',
    target: 20000,
    reward: { currency: 8000, xp: 2000 },
    icon: '🏃',
  },
  // XP missions
  {
    id: 'weekly_xp_50000',
    name: { ua: 'Тижневий XP', en: 'Weekly XP' },
    description: { ua: 'Зароби 50,000 XP за тиждень', en: 'Earn 50,000 XP this week' },
    type: 'earn_xp',
    frequency: 'weekly',
    target: 50000,
    reward: { currency: 3000, xp: 1000 },
    icon: '⭐',
  },
  {
    id: 'weekly_xp_200000',
    name: { ua: 'XP Марафонець', en: 'XP Marathon' },
    description: { ua: 'Зароби 200,000 XP за тиждень', en: 'Earn 200,000 XP this week' },
    type: 'earn_xp',
    frequency: 'weekly',
    target: 200000,
    reward: { currency: 12000, xp: 5000 },
    icon: '💫',
  },
  // Generator missions
  {
    id: 'weekly_gen_15',
    name: { ua: 'Тижневий Інвестор', en: 'Weekly Investor' },
    description: { ua: 'Купи 15 генераторів за тиждень', en: 'Buy 15 generators this week' },
    type: 'buy_generator',
    frequency: 'weekly',
    target: 15,
    reward: { currency: 5000, xp: 2000 },
    icon: '🏛️',
  },
  {
    id: 'weekly_gen_50',
    name: { ua: 'Будівельна Імперія', en: 'Building Empire' },
    description: { ua: 'Купи 50 генераторів за тиждень', en: 'Buy 50 generators this week' },
    type: 'buy_generator',
    frequency: 'weekly',
    target: 50,
    reward: { currency: 15000, xp: 5000 },
    icon: '🏭',
  },
  // Gacha missions
  {
    id: 'weekly_gacha_20',
    name: { ua: 'Тижневий Шукач', en: 'Weekly Hunter' },
    description: { ua: 'Відкрий 20 скринь за тиждень', en: 'Open 20 chests this week' },
    type: 'open_gacha',
    frequency: 'weekly',
    target: 20,
    reward: { currency: 4000, gachaTicket: true },
    icon: '🎁',
  },
  {
    id: 'weekly_gacha_50',
    name: { ua: 'Колекціонер Скарбів', en: 'Treasure Collector' },
    description: { ua: 'Відкрий 50 скринь за тиждень', en: 'Open 50 chests this week' },
    type: 'open_gacha',
    frequency: 'weekly',
    target: 50,
    reward: { currency: 10000, gachaTicket: true, booster: { type: 'xp_boost', duration: 7200000 } },
    icon: '💎',
  },
  // Epoch missions
  {
    id: 'weekly_epoch_1',
    name: { ua: 'Епоха', en: 'Epoch' },
    description: { ua: 'Перейди на нову епоху за тиждень', en: 'Advance to a new epoch this week' },
    type: 'epoch_complete',
    frequency: 'weekly',
    target: 1,
    reward: { currency: 5000, xp: 2000 },
    icon: '🏛️',
  },
  // Prestige missions
  {
    id: 'weekly_prestige',
    name: { ua: 'Відродження', en: 'Rebirth' },
    description: { ua: 'Здійсни відродження', en: 'Perform a prestige' },
    type: 'prestige',
    frequency: 'weekly',
    target: 1,
    reward: { currency: 10000, xp: 5000 },
    icon: '🔄',
  },
  // Ad missions
  {
    id: 'weekly_ad_30',
    name: { ua: 'Рекламний Тиждень', en: 'Ad Week' },
    description: { ua: 'Подивись 30 реклам за тиждень', en: 'Watch 30 ads this week' },
    type: 'watch_ad',
    frequency: 'weekly',
    target: 30,
    reward: { currency: 2000, xp: 1000 },
    icon: '📺',
  },
  // Claim missions
  {
    id: 'weekly_claim_daily_7',
    name: { ua: 'Тиждень Нагород', en: 'Week of Rewards' },
    description: { ua: 'Отримай 7 щоденних нагород за тиждень', en: 'Claim 7 daily rewards this week' },
    type: 'claim_daily',
    frequency: 'weekly',
    target: 7,
    reward: { currency: 3000, gachaTicket: true },
    icon: '📅',
  },
];

// ============================================================================
// MONTHLY MISSIONS
// ============================================================================

const MONTHLY_MISSIONS: MissionDef[] = [
  // Progression missions
  {
    id: 'monthly_level_100',
    name: { ua: 'Місячний Рівень', en: 'Monthly Level' },
    description: { ua: 'Досягни 100-го рівня за місяць', en: 'Reach level 100 this month' },
    type: 'earn_xp',
    frequency: 'monthly',
    target: 100,
    reward: { currency: 10000, xp: 5000 },
    icon: '📊',
  },
  {
    id: 'monthly_level_300',
    name: { ua: 'Амбітний Рівень', en: 'Ambitious Level' },
    description: { ua: 'Досягни 300-го рівня за місяць', en: 'Reach level 300 this month' },
    type: 'earn_xp',
    frequency: 'monthly',
    target: 300,
    reward: { currency: 30000, xp: 15000 },
    icon: '⭐',
  },
  {
    id: 'monthly_level_500',
    name: { ua: 'Елітний Рівень', en: 'Elite Level' },
    description: { ua: 'Досягни 500-го рівня за місяць', en: 'Reach level 500 this month' },
    type: 'earn_xp',
    frequency: 'monthly',
    target: 500,
    reward: { currency: 50000, xp: 25000, gachaTicket: true },
    icon: '💫',
  },
  // Tap missions
  {
    id: 'monthly_tap_100000',
    name: { ua: 'Місячний Тапінг', en: 'Monthly Tapping' },
    description: { ua: 'Натисни 100,000 разів за місяць', en: 'Tap 100,000 times this month' },
    type: 'tap',
    frequency: 'monthly',
    target: 100000,
    reward: { currency: 20000, xp: 10000 },
    icon: '👆',
  },
  {
    id: 'monthly_tap_500000',
    name: { ua: 'Тапінг Марафонець', en: 'Tapping Marathon' },
    description: { ua: 'Натисни 500,000 разів за місяць', en: 'Tap 500,000 times this month' },
    type: 'tap',
    frequency: 'monthly',
    target: 500000,
    reward: { currency: 80000, xp: 40000 },
    icon: '🏃',
  },
  // XP missions
  {
    id: 'monthly_xp_500000',
    name: { ua: 'Місячний XP', en: 'Monthly XP' },
    description: { ua: 'Зароби 500,000 XP за місяць', en: 'Earn 500,000 XP this month' },
    type: 'earn_xp',
    frequency: 'monthly',
    target: 500000,
    reward: { currency: 30000, xp: 15000 },
    icon: '⭐',
  },
  {
    id: 'monthly_xp_2m',
    name: { ua: 'XP Чемпіон', en: 'XP Champion' },
    description: { ua: 'Зароби 2,000,000 XP за місяць', en: 'Earn 2,000,000 XP this month' },
    type: 'earn_xp',
    frequency: 'monthly',
    target: 2000000,
    reward: { currency: 100000, xp: 50000, gachaTicket: true },
    icon: '💫',
  },
  // Generator missions
  {
    id: 'monthly_gen_100',
    name: { ua: 'Місячний Інвестор', en: 'Monthly Investor' },
    description: { ua: 'Купи 100 генераторів за місяць', en: 'Buy 100 generators this month' },
    type: 'buy_generator',
    frequency: 'monthly',
    target: 100,
    reward: { currency: 40000, xp: 20000 },
    icon: '🏛️',
  },
  // Gacha missions
  {
    id: 'monthly_gacha_100',
    name: { ua: 'Місячний Шукач', en: 'Monthly Hunter' },
    description: { ua: 'Відкрий 100 скринь за місяць', en: 'Open 100 chests this month' },
    type: 'open_gacha',
    frequency: 'monthly',
    target: 100,
    reward: { currency: 25000, gachaTicket: true },
    icon: '🎁',
  },
  // Epoch missions
  {
    id: 'monthly_epochs_3',
    name: { ua: 'Місячний Дослідник', en: 'Monthly Explorer' },
    description: { ua: 'Пройди 3 нові епохи за місяць', en: 'Complete 3 new epochs this month' },
    type: 'epoch_complete',
    frequency: 'monthly',
    target: 3,
    reward: { currency: 30000, xp: 15000 },
    icon: '🗺️',
  },
  {
    id: 'monthly_epoch_12',
    name: { ua: 'Незалежність Досягнута', en: 'Independence Achieved' },
    description: { ua: 'Досягни епохи Незалежності за місяць', en: 'Reach Independence epoch this month' },
    type: 'epoch_complete',
    frequency: 'monthly',
    target: 12,
    reward: { currency: 50000, xp: 25000, gachaTicket: true },
    icon: '🇺🇦',
  },
  // Prestige missions
  {
    id: 'monthly_prestige_1',
    name: { ua: 'Місячне Відродження', en: 'Monthly Rebirth' },
    description: { ua: 'Здійсни відродження за місяць', en: 'Perform a prestige this month' },
    type: 'prestige',
    frequency: 'monthly',
    target: 1,
    reward: { currency: 50000, xp: 25000 },
    icon: '🔄',
  },
  // Ad missions
  {
    id: 'monthly_ad_100',
    name: { ua: 'Рекламний Місяць', en: 'Ad Month' },
    description: { ua: 'Подивись 100 реклам за місяць', en: 'Watch 100 ads this month' },
    type: 'watch_ad',
    frequency: 'monthly',
    target: 100,
    reward: { currency: 10000, xp: 5000 },
    icon: '📺',
  },
  // Daily claim missions
  {
    id: 'monthly_claim_daily_30',
    name: { ua: 'Місяць Нагород', en: 'Month of Rewards' },
    description: { ua: 'Отримай 30 щоденних нагород за місяць', en: 'Claim 30 daily rewards this month' },
    type: 'claim_daily',
    frequency: 'monthly',
    target: 30,
    reward: { currency: 20000, gachaTicket: true, booster: { type: 'super_boost', duration: 14400000 } },
    icon: '📅',
  },
  // Artifact missions
  {
    id: 'monthly_artifact_10',
    name: { ua: 'Артефакт Колекціонер', en: 'Artifact Collector' },
    description: { ua: 'Збери 10 нових артефактів за місяць', en: 'Collect 10 new artifacts this month' },
    type: 'collect_artifact',
    frequency: 'monthly',
    target: 10,
    reward: { currency: 15000, gachaTicket: true },
    icon: '🏺',
  },
  // Spend currency missions
  {
    id: 'monthly_spend_50000',
    name: { ua: 'Економний Витратник', en: 'Frugal Spender' },
    description: { ua: 'Витрати 50,000 валюти за місяць', en: 'Spend 50,000 currency this month' },
    type: 'spend_currency',
    frequency: 'monthly',
    target: 50000,
    reward: { currency: 10000, xp: 5000 },
    icon: '💰',
  },
  {
    id: 'monthly_spend_200000',
    name: { ua: 'Великий Витратник', en: 'Big Spender' },
    description: { ua: 'Витрати 200,000 валюти за місяць', en: 'Spend 200,000 currency this month' },
    type: 'spend_currency',
    frequency: 'monthly',
    target: 200000,
    reward: { currency: 40000, xp: 20000 },
    icon: '💎',
  },
];

// ============================================================================
// MISSION REGISTRY
// ============================================================================

export const ALL_MISSIONS: MissionDef[] = [
  ...DAILY_MISSIONS,
  ...WEEKLY_MISSIONS,
  ...MONTHLY_MISSIONS,
];

// Build lookup maps
const MISSION_MAP: Record<string, MissionDef> = {};
for (const m of ALL_MISSIONS) {
  MISSION_MAP[m.id] = m;
}
export function getMissionById(id: string): MissionDef | undefined {
  return MISSION_MAP[id];
}

export function getMissionsByFrequency(frequency: MissionFrequency): MissionDef[] {
  return ALL_MISSIONS.filter(m => m.frequency === frequency);
}

export function getDailyMissions(): MissionDef[] {
  return getMissionsByFrequency('daily');
}

export function getWeeklyMissions(): MissionDef[] {
  return getMissionsByFrequency('weekly');
}

export function getMonthlyMissions(): MissionDef[] {
  return getMissionsByFrequency('monthly');
}

// ============================================================================
// MISSION GENERATION
// ============================================================================

/**
 * Get daily missions for today (3 random from pool)
 */
export function getDailyMissionsForPlayer(dateStr: string, count: number = 3): MissionDef[] {
  // Deterministic selection based on date
  let seed = dateStr.split('').reduce((acc, c) => Math.imul(acc, 31) + c.charCodeAt(0) | 0, 0);
  seed = Math.abs(seed);
  
  const dailyPool = getDailyMissions();
  const indices = new Set<number>();
  let s = seed;
  
  while (indices.size < Math.min(count, dailyPool.length)) {
    indices.add(s % dailyPool.length);
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
  }
  
  return [...indices].map(i => dailyPool[i]);
}

/**
 * Get weekly missions for this week (3 random from pool)
 */
export function getWeeklyMissionsForPlayer(weekStr: string, count: number = 3): MissionDef[] {
  // Deterministic selection based on week
  let seed = weekStr.split('').reduce((acc, c) => Math.imul(acc, 31) + c.charCodeAt(0) | 0, 0);
  seed = Math.abs(seed);
  
  const weeklyPool = getWeeklyMissions();
  const indices = new Set<number>();
  let s = seed;
  
  while (indices.size < Math.min(count, weeklyPool.length)) {
    indices.add(s % weeklyPool.length);
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
  }
  
  return [...indices].map(i => weeklyPool[i]);
}

/**
 * Get monthly missions for this month (3 random from pool)
 */
export function getMonthlyMissionsForPlayer(monthStr: string, count: number = 3): MissionDef[] {
  // Deterministic selection based on month
  let seed = monthStr.split('').reduce((acc, c) => Math.imul(acc, 31) + c.charCodeAt(0) | 0, 0);
  seed = Math.abs(seed);
  
  const monthlyPool = getMonthlyMissions();
  const indices = new Set<number>();
  let s = seed;
  
  while (indices.size < Math.min(count, monthlyPool.length)) {
    indices.add(s % monthlyPool.length);
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
  }
  
  return [...indices].map(i => monthlyPool[i]);
}

/**
 * Get current date string in YYYY-MM format for monthly missions
 */
export function getCurrentMonthStr(): string {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

/**
 * Get current week string in YYYY-Www format
 */
export function getCurrentWeekStr(): string {
  const d = new Date();
  const startOfYear = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const days = Math.floor((d.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
  const weekNum = Math.ceil((days + startOfYear.getUTCDay() + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNum).padStart(2, '0')}`;
}

// ============================================================================
// MISSION HELPERS
// ============================================================================

/**
 * Check if a mission is complete based on progress
 */
export function isMissionComplete(mission: MissionDef, progress: number): boolean {
  return progress >= mission.target;
}

/**
 * Get progress percentage for a mission
 */
export function getMissionProgress(mission: MissionDef, progress: number): number {
  return Math.min(1, progress / mission.target);
}

/**
 * Format mission reward for display
 */
export function formatMissionReward(reward: MissionDef['reward']): string {
  const parts: string[] = [];
  
  if (reward.currency) {
    parts.push(`${reward.currency} 💰`);
  }
  if (reward.xp) {
    parts.push(`${reward.xp} ⭐`);
  }
  if (reward.gachaTicket) {
    parts.push('🎁');
  }
  if (reward.booster) {
    const minutes = Math.round(reward.booster.duration / 60000);
    parts.push(`⏱️${minutes}хв`);
  }
  
  return parts.join(' + ');
}

/**
 * Calculate total daily mission rewards
 */
export function getTotalDailyReward(): { currency: number; xp: number } {
  let currency = 0;
  let xp = 0;
  
  for (const m of getDailyMissions()) {
    if (m.reward.currency) currency += m.reward.currency;
    if (m.reward.xp) xp += m.reward.xp;
  }
  
  return { currency, xp };
}

/**
 * Calculate total weekly mission rewards
 */
export function getTotalWeeklyReward(): { currency: number; xp: number } {
  let currency = 0;
  let xp = 0;
  
  for (const m of getWeeklyMissions()) {
    if (m.reward.currency) currency += m.reward.currency;
    if (m.reward.xp) xp += m.reward.xp;
  }
  
  return { currency, xp };
}
