/**
 * Virtual Museum Tapper Game — Event System Data
 * Production-ready event configurations for LiveOps
 */

import type {
  EventConfig,
  EventType,
  EventRewardMultipliers,
} from '../types/liveops';

// Helper to create event reward multipliers
function multipliers(values: EventRewardMultipliers): EventRewardMultipliers {
  return values;
}

// ============================================================================
// WEEKEND EVENTS
// ============================================================================

export const WEEKEND_BONUS_EVENT: EventConfig = {
  id: 'weekend_bonus_standard',
  type: 'weekend_bonus',
  name: {
    ua: '🎉 Вихідні бонуси!',
    en: '🎉 Weekend Bonuses!',
  },
  description: {
    ua: 'Отримуй подвійні нагороди кожні вихідні!',
    en: 'Get double rewards every weekend!',
  },
  startDate: '2026-01-01T00:00:00Z',
  endDate: '2026-12-31T23:59:59Z',
  isActive: true,
  rewardMultipliers: multipliers({ currency: 2.0, xp: 1.5 }),
  analytics: {
    eventCode: 'WEEKEND_BONUS_STD',
    cohortTag: 'weekend_v1',
  },
};

export const WEEKEND_GACHA_BOOST_EVENT: EventConfig = {
  id: 'weekend_gacha_boost',
  type: 'weekend_bonus',
  name: {
    ua: '🎰 Вихідні зі скриньками!',
    en: '🎰 Weekend Gacha Time!',
  },
  description: {
    ua: 'Підвищений шанс рідкісних артефактів на вихідних!',
    en: 'Increased rare artifact chances on weekends!',
  },
  startDate: '2026-01-01T00:00:00Z',
  endDate: '2026-12-31T23:59:59Z',
  isActive: true,
  rewardMultipliers: multipliers({ gacha_rate: 1.5 }),
  analytics: {
    eventCode: 'WEEKEND_GACHA',
    cohortTag: 'weekend_gacha_v1',
  },
};

// ============================================================================
// HOLIDAY EVENTS
// ============================================================================

export const UKRAINE_INDEPENDENCE_DAY: EventConfig = {
  id: 'ukraine_independence_2026',
  type: 'holiday',
  name: {
    ua: '🇺🇦 День Незалежності України',
    en: '🇺🇦 Ukraine Independence Day',
  },
  description: {
    ua: 'Святкуймо разом! Спеціальні нагороди до Дня Незалежності!',
    en: 'Lets celebrate together! Special rewards for Independence Day!',
  },
  startDate: '2026-08-22T00:00:00Z',
  endDate: '2026-08-25T23:59:59Z',
  isActive: true,
  rewardMultipliers: multipliers({ currency: 2.0, xp: 2.0, passive: 1.5 }),
  featuredEpochs: ['independence'],
  analytics: {
    eventCode: 'UA_INDEPENDENCE_2026',
    cohortTag: 'holiday_ua_v1',
  },
};

export const NEW_YEAR_2027: EventConfig = {
  id: 'new_year_2027',
  type: 'holiday',
  name: {
    ua: '🎄 Новий Рік 2027',
    en: '🎄 New Year 2027',
  },
  description: {
    ua: 'З новим роком! Особливі новорічні нагороди чекають!',
    en: 'Happy New Year! Special New Year rewards await!',
  },
  startDate: '2026-12-28T00:00:00Z',
  endDate: '2027-01-08T23:59:59Z',
  isActive: true,
  rewardMultipliers: multipliers({ currency: 2.5, xp: 2.0, gacha_rate: 1.25 }),
  analytics: {
    eventCode: 'NEW_YEAR_2027',
    cohortTag: 'holiday_ny_v1',
  },
};

export const CHRISTMAS_2026: EventConfig = {
  id: 'christmas_2026',
  type: 'holiday',
  name: {
    ua: '🎄 Різдво 2026',
    en: '🎄 Christmas 2026',
  },
  description: {
    ua: 'Різдвяні подарунки та бонуси!',
    en: 'Christmas gifts and bonuses!',
  },
  startDate: '2026-12-19T00:00:00Z',
  endDate: '2026-12-27T23:59:59Z',
  isActive: true,
  rewardMultipliers: multipliers({ currency: 2.0, xp: 1.5 }),
  analytics: {
    eventCode: 'CHRISTMAS_2026',
    cohortTag: 'holiday_xmas_v1',
  },
};

export const VALENTINE_2027: EventConfig = {
  id: 'valentine_2027',
  type: 'holiday',
  name: {
    ua: '💝 День Святого Валентина',
    en: '💝 Valentines Day',
  },
  description: {
    ua: 'Любов та артефакти! Подвійні нагороди!',
    en: 'Love and artifacts! Double rewards!',
  },
  startDate: '2027-02-10T00:00:00Z',
  endDate: '2027-02-15T23:59:59Z',
  isActive: true,
  rewardMultipliers: multipliers({ currency: 2.0, xp: 1.5, gacha_rate: 1.3 }),
  analytics: {
    eventCode: 'VALENTINE_2027',
    cohortTag: 'holiday_val_v1',
  },
};

export const VICTORY_DAY_2027: EventConfig = {
  id: 'victory_day_2027',
  type: 'holiday',
  name: {
    ua: '🏆 День Перемоги',
    en: '🏆 Victory Day',
  },
  description: {
    ua: 'Вшануймо історію! Особливі нагороди до Дня Перемоги!',
    en: 'Honor history! Special rewards for Victory Day!',
  },
  startDate: '2027-05-05T00:00:00Z',
  endDate: '2027-05-11T23:59:59Z',
  isActive: true,
  rewardMultipliers: multipliers({ currency: 2.0, xp: 2.0 }),
  featuredEpochs: ['kyiv_rus', 'cossack', 'hetmanate'],
  analytics: {
    eventCode: 'VICTORY_DAY_2027',
    cohortTag: 'holiday_vday_v1',
  },
};

// ============================================================================
// ARTIFACT EVENTS
// ============================================================================

export const ARTIFACT_HUNT_SUMMER_2026: EventConfig = {
  id: 'artifact_hunt_summer_2026',
  type: 'artifact_hunt',
  name: {
    ua: '🏺 Літнє полювання за артефактами',
    en: '🏺 Summer Artifact Hunt',
  },
  description: {
    ua: 'Знаходь унікальні артефакти з підвищеним шансом!',
    en: 'Find unique artifacts with increased drop rates!',
  },
  startDate: '2026-06-01T00:00:00Z',
  endDate: '2026-08-31T23:59:59Z',
  isActive: true,
  rewardMultipliers: multipliers({ gacha_rate: 1.75 }),
  eventCurrency: {
    id: 'artifact_shards',
    name: { ua: 'Уламки артефактів', en: 'Artifact Shards' },
    icon: '💎',
  },
  analytics: {
    eventCode: 'ARTIFACT_HUNT_SUM_2026',
    cohortTag: 'artifact_hunt_v1',
  },
};

export const LEGENDARY_ARTIFACT_WEEK: EventConfig = {
  id: 'legendary_artifact_week',
  type: 'artifact_hunt',
  name: {
    ua: '🌟 Тиждень легендарних артефактів',
    en: '🌟 Legendary Artifact Week',
  },
  description: {
    ua: 'Легендарні артефакти випадають частіше!',
    en: 'Legendary artifacts drop more often!',
  },
  startDate: '2026-09-01T00:00:00Z',
  endDate: '2026-09-07T23:59:59Z',
  isActive: true,
  rewardMultipliers: multipliers({ gacha_rate: 2.0 }),
  analytics: {
    eventCode: 'LEGENDARY_WEEK',
    cohortTag: 'artifact_legendary_v1',
  },
};

// ============================================================================
// EPOCH WARS / FEATURED EPOCH EVENTS
// ============================================================================

export const ANCIENT_EPOCHS_WEEK: EventConfig = {
  id: 'ancient_epochs_week',
  type: 'seasonal',
  name: {
    ua: '🏛️ Тиждень Стародавніх Епох',
    en: '🏛️ Ancient Epochs Week',
  },
  description: {
    ua: 'Подвійні нагороди за епохи Трипілля, скіфів та античності!',
    en: 'Double rewards for Trypillia, Scythia, and Antiquity epochs!',
  },
  startDate: '2026-07-01T00:00:00Z',
  endDate: '2026-07-07T23:59:59Z',
  isActive: true,
  rewardMultipliers: multipliers({ currency: 2.0, xp: 1.5 }),
  featuredEpochs: ['trypillia', 'scythia', 'antiquity'],
  analytics: {
    eventCode: 'ANCIENT_EPOCHS',
    cohortTag: 'epoch_ancient_v1',
  },
};

export const MEDIEVAL_EPOCHS_WEEK: EventConfig = {
  id: 'medieval_epochs_week',
  type: 'seasonal',
  name: {
    ua: '⚔️ Тиждень Середньовіччя',
    en: '⚔️ Medieval Epochs Week',
  },
  description: {
    ua: 'Бонуси за Київську Русь, Галицько-Волинську та Польсько-Литовську епохи!',
    en: 'Bonuses for Kyiv Rus, Halych-Volhynia, and Polish-Lithuanian epochs!',
  },
  startDate: '2026-10-01T00:00:00Z',
  endDate: '2026-10-07T23:59:59Z',
  isActive: true,
  rewardMultipliers: multipliers({ currency: 2.0, xp: 1.5, passive: 1.25 }),
  featuredEpochs: ['kyiv_rus', 'halych_volhynia', 'polish_lithuanian'],
  analytics: {
    eventCode: 'MEDIEVAL_EPOCHS',
    cohortTag: 'epoch_medieval_v1',
  },
};

export const MODERN_EPOCHS_WEEK: EventConfig = {
  id: 'modern_epochs_week',
  type: 'seasonal',
  name: {
    ua: '🏭 Тиждень Сучасної Історії',
    en: '🏭 Modern History Week',
  },
  description: {
    ua: 'Вшануймо сучасну Україну! Особливі бонуси за епохи 19-20 століть!',
    en: 'Honor modern Ukraine! Special bonuses for 19-20th century epochs!',
  },
  startDate: '2026-11-01T00:00:00Z',
  endDate: '2026-11-07T23:59:59Z',
  isActive: true,
  rewardMultipliers: multipliers({ currency: 2.0, xp: 2.0 }),
  featuredEpochs: ['empire', 'revolution', 'soviet', 'independence'],
  analytics: {
    eventCode: 'MODERN_EPOCHS',
    cohortTag: 'epoch_modern_v1',
  },
};

// ============================================================================
// MARATHON / PLAYTIME EVENTS
// ============================================================================

export const SPRING_MARATHON_2027: EventConfig = {
  id: 'spring_marathon_2027',
  type: 'marathon',
  name: {
    ua: '🌸 Весняний Марафон',
    en: '🌸 Spring Marathon',
  },
  description: {
    ua: 'Грай більше - отримуй більше! Накопичувальні нагороди за ігровий час!',
    en: 'Play more - get more! Cumulative rewards for playtime!',
  },
  startDate: '2027-03-15T00:00:00Z',
  endDate: '2027-03-31T23:59:59Z',
  isActive: true,
  rewardMultipliers: multipliers({ xp: 1.5, currency: 1.5 }),
  analytics: {
    eventCode: 'SPRING_MARATHON_2027',
    cohortTag: 'marathon_spring_v1',
  },
};

export const SUMMER_CHALLENGE_2026: EventConfig = {
  id: 'summer_challenge_2026',
  type: 'marathon',
  name: {
    ua: '☀️ Літній Виклик',
    en: '☀️ Summer Challenge',
  },
  description: {
    ua: 'Літній виклик для найактивніших гравців!',
    en: 'Summer challenge for the most active players!',
  },
  startDate: '2026-07-15T00:00:00Z',
  endDate: '2026-08-31T23:59:59Z',
  isActive: true,
  rewardMultipliers: multipliers({ xp: 2.0, gacha_rate: 1.5 }),
  analytics: {
    eventCode: 'SUMMER_CHALLENGE_2026',
    cohortTag: 'marathon_summer_v1',
  },
};

// ============================================================================
// FLASH SALES
// ============================================================================

export const FLASH_SALE_WEEKLY: EventConfig = {
  id: 'flash_sale_weekly',
  type: 'flash_sale',
  name: {
    ua: '⚡ Тижневий ФлешSale!',
    en: '⚡ Weekly Flash Sale!',
  },
  description: {
    ua: 'Обмежена пропозиція! Тільки цього тижня!',
    en: 'Limited offer! Only this week!',
  },
  startDate: '2026-01-01T00:00:00Z',
  endDate: '2026-12-31T23:59:59Z',
  isActive: true,
  rewardMultipliers: multipliers({ currency: 1.5 }),
  analytics: {
    eventCode: 'FLASH_SALE_WEEKLY',
    cohortTag: 'flash_sale_v1',
  },
};

// ============================================================================
// COMEBACK EVENTS
// ============================================================================

export const COMEBACK_CAMPAIGN_STANDARD: EventConfig = {
  id: 'comeback_standard',
  type: 'comeback',
  name: {
    ua: '👋 З поверненням!',
    en: '👋 Welcome Back!',
  },
  description: {
    ua: 'Ми сумуємо за тобою! Повертайся і отримуй подарунки!',
    en: 'We missed you! Come back and get rewards!',
  },
  startDate: '2026-01-01T00:00:00Z',
  endDate: '2026-12-31T23:59:59Z',
  isActive: true,
  rewardMultipliers: multipliers({ currency: 2.0, xp: 1.5 }),
  analytics: {
    eventCode: 'COMEBACK_STD',
    cohortTag: 'comeback_v1',
  },
};

// ============================================================================
// COMMUNITY EVENTS
// ============================================================================

export const COMMUNITY_TAP_CHALLENGE: EventConfig = {
  id: 'community_tap_challenge',
  type: 'community_goal',
  name: {
    ua: '🤝 Museum Builders Challenge',
    en: '🤝 Museum Builders Challenge',
  },
  description: {
    ua: 'Разом досягнемо мети! Колективна нагорода чекає!',
    en: 'Together well reach the goal! Collective reward awaits!',
  },
  startDate: '2026-01-01T00:00:00Z',
  endDate: '2026-12-31T23:59:59Z',
  isActive: true,
  rewardMultipliers: multipliers({ currency: 1.5, xp: 1.25 }),
  analytics: {
    eventCode: 'COMMUNITY_TAP',
    cohortTag: 'community_v1',
  },
};

// ============================================================================
// EVENT REGISTRY
// ============================================================================

export const ALL_EVENTS: EventConfig[] = [
  // Weekend events
  WEEKEND_BONUS_EVENT,
  WEEKEND_GACHA_BOOST_EVENT,
  
  // Holiday events
  UKRAINE_INDEPENDENCE_DAY,
  NEW_YEAR_2027,
  CHRISTMAS_2026,
  VALENTINE_2027,
  VICTORY_DAY_2027,
  
  // Artifact events
  ARTIFACT_HUNT_SUMMER_2026,
  LEGENDARY_ARTIFACT_WEEK,
  
  // Epoch/Seasonal events
  ANCIENT_EPOCHS_WEEK,
  MEDIEVAL_EPOCHS_WEEK,
  MODERN_EPOCHS_WEEK,
  
  // Marathon events
  SPRING_MARATHON_2027,
  SUMMER_CHALLENGE_2026,
  
  // Flash sales
  FLASH_SALE_WEEKLY,
  
  // Comeback
  COMEBACK_CAMPAIGN_STANDARD,
  
  // Community
  COMMUNITY_TAP_CHALLENGE,
];

/**
 * Get currently active events
 */
export function getActiveEvents(): EventConfig[] {
  const now = new Date();
  return ALL_EVENTS.filter(event => {
    if (!event.isActive) return false;
    const start = new Date(event.startDate);
    const end = new Date(event.endDate);
    return now >= start && now <= end;
  });
}

/**
 * Check if a specific event type is active
 */
export function isEventTypeActive(type: EventType): boolean {
  return getActiveEvents().some(e => e.type === type);
}

/**
 * Check if we're in a weekend (Saturday-Sunday)
 */
export function isWeekend(): boolean {
  const day = new Date().getUTCDay();
  return day === 0 || day === 6; // Sunday or Saturday
}

/**
 * Check if a specific epoch is featured in any active event
 */
export function getFeaturedEpochBonus(epochId: string): EventRewardMultipliers {
  const activeEvents = getActiveEvents();
  const multipliers: EventRewardMultipliers = {};
  
  for (const event of activeEvents) {
    if (event.featuredEpochs?.includes(epochId)) {
      if (event.rewardMultipliers.currency) {
        multipliers.currency = (multipliers.currency || 1) * event.rewardMultipliers.currency;
      }
      if (event.rewardMultipliers.xp) {
        multipliers.xp = (multipliers.xp || 1) * event.rewardMultipliers.xp;
      }
      if (event.rewardMultipliers.gacha_rate) {
        multipliers.gacha_rate = (multipliers.gacha_rate || 1) * event.rewardMultipliers.gacha_rate;
      }
      if (event.rewardMultipliers.passive) {
        multipliers.passive = (multipliers.passive || 1) * event.rewardMultipliers.passive;
      }
    }
  }
  
  return multipliers;
}

/**
 * Calculate combined reward multipliers from all active events
 */
export function getCombinedEventMultipliers(): EventRewardMultipliers {
  const activeEvents = getActiveEvents();
  const combined: EventRewardMultipliers = {};
  
  for (const event of activeEvents) {
    const mult = event.rewardMultipliers;
    if (mult.currency) combined.currency = (combined.currency || 1) * mult.currency;
    if (mult.xp) combined.xp = (combined.xp || 1) * mult.xp;
    if (mult.gacha_rate) combined.gacha_rate = (combined.gacha_rate || 1) * mult.gacha_rate;
    if (mult.passive) combined.passive = (combined.passive || 1) * mult.passive;
  }
  
  return combined;
}

/**
 * Get upcoming events (within next N days)
 */
export function getUpcomingEvents(daysAhead: number = 7): EventConfig[] {
  const now = new Date();
  const futureDate = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);
  
  return ALL_EVENTS.filter(event => {
    const start = new Date(event.startDate);
    return start > now && start <= futureDate && event.isActive;
  }).sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
}

/**
 * Get event by ID
 */
export function getEventById(eventId: string): EventConfig | undefined {
  return ALL_EVENTS.find(e => e.id === eventId);
}
