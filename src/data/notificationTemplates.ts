/**
 * Virtual Museum Tapper Game — Notification Templates
 * Production-ready notification templates for re-engagement and retention
 */

import type {
  NotificationTemplate,
  NotificationType,
} from '../types/liveops';

// ============================================================================
// DAILY REMINDER NOTIFICATIONS
// ============================================================================

const DAILY_REMINDER_TEMPLATES: NotificationTemplate[] = [
  {
    id: 'daily_reminder_morning',
    type: 'daily_reminder',
    priority: 'normal',
    channels: ['telegram', 'ingame'],
    title: {
      ua: '☀️ Доброго ранку, історику!',
      en: '☀️ Good morning, historian!',
    },
    body: {
      ua: 'Твоя подорож крізь історію чекає! Не забудь отримати сьогоднішню нагороду!',
      en: 'Your journey through history awaits! Dont forget to claim your daily reward!',
    },
    actionUrl: 'game://daily',
    actionText: {
      ua: 'Отримати нагороду',
      en: 'Claim reward',
    },
    conditions: {
      hoursSinceLastSession: 4,
    },
    scheduling: {
      type: 'recurring',
      timeWindows: [
        { hour: 9, minute: 0 },
        { hour: 10, minute: 0 },
      ],
    },
    isEnabled: true,
  },
  {
    id: 'daily_reminder_evening',
    type: 'daily_reminder',
    priority: 'normal',
    channels: ['telegram', 'ingame'],
    title: {
      ua: '🌙 Вечірнє нагадування',
      en: '🌙 Evening reminder',
    },
    body: {
      ua: 'Твій щоденний бонус очікує! Повертайся і продовж свою колекцію артефактів.',
      en: 'Your daily bonus is waiting! Come back and continue your artifact collection.',
    },
    actionUrl: 'game://daily',
    actionText: {
      ua: 'Грати зараз',
      en: 'Play now',
    },
    conditions: {
      hoursSinceLastSession: 12,
    },
    scheduling: {
      type: 'recurring',
      timeWindows: [
        { hour: 18, minute: 0 },
        { hour: 19, minute: 0 },
      ],
    },
    isEnabled: true,
  },
];

// ============================================================================
// STREAK WARNING NOTIFICATIONS
// ============================================================================

const STREAK_WARNING_TEMPLATES: NotificationTemplate[] = [
  {
    id: 'streak_warning_6pm',
    type: 'streak_warning',
    priority: 'high',
    channels: ['telegram', 'ingame'],
    title: {
      ua: '🔥 Твоя серія під загрозою!',
      en: '🔥 Your streak is at risk!',
    },
    body: {
      ua: 'Ти маєш {streak}-денну серію! Зайди сьогодні, щоб не втратити її!',
      en: 'You have a {streak}-day streak! Log in today to keep it!',
    },
    actionUrl: 'game://home',
    actionText: {
      ua: 'Зберегти серію',
      en: 'Keep streak',
    },
    conditions: {
      hasStreak: true,
      hoursSinceLastSession: 20,
    },
    scheduling: {
      type: 'recurring',
      timeWindows: [
        { hour: 18, minute: 0 },
      ],
    },
    isEnabled: true,
  },
  {
    id: 'streak_warning_morning',
    type: 'streak_warning',
    priority: 'high',
    channels: ['telegram', 'ingame'],
    title: {
      ua: '🔥 Не втрачай серію!',
      en: '🔥 Dont lose your streak!',
    },
    body: {
      ua: 'Твоя {streak}-денна серія очікує! Всього одне натискання щоб її врятувати.',
      en: 'Your {streak}-day streak is waiting! Just one tap to save it.',
    },
    actionUrl: 'game://home',
    actionText: {
      ua: 'Відкрити гру',
      en: 'Open game',
    },
    conditions: {
      hasStreak: true,
      streakAtRisk: true,
    },
    scheduling: {
      type: 'recurring',
      timeWindows: [
        { hour: 10, minute: 0 },
      ],
    },
    isEnabled: true,
  },
  {
    id: 'streak_broken',
    type: 'streak_broken',
    priority: 'low',
    channels: ['telegram'],
    title: {
      ua: '😢 Серія втрачена',
      en: '😢 Streak broken',
    },
    body: {
      ua: 'Твоя {streak}-денна серія закінчилася. Але новий початок - це теж добре! Повертайся і почни нову серію!',
      en: 'Your {streak}-day streak ended. But a fresh start is good too! Come back and start a new one!',
    },
    actionUrl: 'game://home',
    actionText: {
      ua: 'Почати знову',
      en: 'Start again',
    },
    conditions: {
      hasStreak: false,
    },
    scheduling: {
      type: 'immediate',
    },
    isEnabled: true,
  },
];

// ============================================================================
// ENERGY NOTIFICATIONS
// ============================================================================

const ENERGY_NOTIFICATIONS: NotificationTemplate[] = [
  {
    id: 'energy_full',
    type: 'energy_full',
    priority: 'normal',
    channels: ['ingame'],
    title: {
      ua: '⚡ Енергія відновлена!',
      en: '⚡ Energy restored!',
    },
    body: {
      ua: 'Твоя енергія повністю відновлена! Час для тапання з максимальним множником!',
      en: 'Your energy is fully restored! Time to tap with maximum multiplier!',
    },
    actionUrl: 'game://home',
    actionText: {
      ua: 'Тапати!',
      en: 'Tap!',
    },
    conditions: {
      minPrestige: 1,
    },
    scheduling: {
      type: 'triggered',
      triggerEvent: 'energy_full',
    },
    isEnabled: true,
  },
  {
    id: 'energy_low',
    type: 'daily_reminder',
    priority: 'low',
    channels: ['ingame'],
    title: {
      ua: '🔋 Енергія закінчується',
      en: '🔋 Energy running low',
    },
    body: {
      ua: 'Твоя енергія закінчується. Але генератори продовжують працювати!',
      en: 'Your energy is running low. But your generators keep working!',
    },
    conditions: {
      minPrestige: 1,
    },
    scheduling: {
      type: 'triggered',
      triggerEvent: 'energy_low',
    },
    isEnabled: true,
  },
];

// ============================================================================
// EVENT NOTIFICATIONS
// ============================================================================

const EVENT_NOTIFICATIONS: NotificationTemplate[] = [
  {
    id: 'event_starting_soon',
    type: 'event_starting',
    priority: 'high',
    channels: ['telegram', 'ingame'],
    title: {
      ua: '🎉 Подія скоро почнеться!',
      en: '🎉 Event starting soon!',
    },
    body: {
      ua: '{event_name} почнеться через {hours} годин! Підготуйся до подвійних нагород!',
      en: '{event_name} starts in {hours} hours! Get ready for double rewards!',
    },
    actionUrl: 'game://events',
    actionText: {
      ua: 'Переглянути',
      en: 'View',
    },
    scheduling: {
      type: 'recurring',
      timeWindows: [
        { hour: 12, minute: 0 },
      ],
    },
    isEnabled: true,
  },
  {
    id: 'event_started',
    type: 'event_starting',
    priority: 'high',
    channels: ['telegram', 'ingame'],
    title: {
      ua: '🎊 {event_name} розпочато!',
      en: '🎊 {event_name} has begun!',
    },
    body: {
      ua: 'Заробляй {multiplier} нагород прямо зараз! Подія триватиме до {end_date}.',
      en: 'Earn {multiplier} rewards right now! Event runs until {end_date}.',
    },
    actionUrl: 'game://events',
    actionText: {
      ua: 'Участвувати',
      en: 'Participate',
    },
    scheduling: {
      type: 'immediate',
    },
    isEnabled: true,
  },
  {
    id: 'event_ending_soon',
    type: 'event_ending',
    priority: 'high',
    channels: ['telegram', 'ingame'],
    title: {
      ua: '⏰ {event_name} закінчується!',
      en: '⏰ {event_name} ending soon!',
    },
    body: {
      ua: 'Залишилося {hours} годин! Встигни отримати нагороди!',
      en: 'Only {hours} hours left! Hurry to get the rewards!',
    },
    actionUrl: 'game://events',
    actionText: {
      ua: 'Встигнути!',
      en: 'Hurry!',
    },
    conditions: {
      eventActive: 'any',
    },
    scheduling: {
      type: 'recurring',
      timeWindows: [
        { hour: 10, minute: 0 },
        { hour: 16, minute: 0 },
      ],
    },
    isEnabled: true,
  },
  {
    id: 'event_ended',
    type: 'event_ending',
    priority: 'normal',
    channels: ['telegram'],
    title: {
      ua: '📢 {event_name} завершено',
      en: '📢 {event_name} has ended',
    },
    body: {
      ua: 'Дякуємо за участь! Скоро буде нова подія. Слідкуй за оновленнями!',
      en: 'Thanks for participating! A new event is coming soon. Stay tuned!',
    },
    actionUrl: 'game://home',
    actionText: {
      ua: 'Продовжити гру',
      en: 'Continue playing',
    },
    scheduling: {
      type: 'immediate',
    },
    isEnabled: true,
  },
  {
    id: 'weekend_start',
    type: 'event_starting',
    priority: 'normal',
    channels: ['telegram', 'ingame'],
    title: {
      ua: '🎉 Вихідні з бонусами!',
      en: '🎉 Weekend bonuses!',
    },
    body: {
      ua: 'Насолоджуйся подвійними нагородами цього тижня!',
      en: 'Enjoy double rewards this weekend!',
    },
    actionUrl: 'game://home',
    actionText: {
      ua: 'Грати',
      en: 'Play',
    },
    conditions: {
      hoursSinceLastSession: 24,
    },
    scheduling: {
      type: 'recurring',
      timeWindows: [
        { hour: 0, minute: 0 }, // Saturday midnight
      ],
    },
    isEnabled: true,
  },
];

// ============================================================================
// ACHIEVEMENT NOTIFICATIONS
// ============================================================================

const ACHIEVEMENT_NOTIFICATIONS: NotificationTemplate[] = [
  {
    id: 'achievement_unlocked',
    type: 'achievement_unlocked',
    priority: 'normal',
    channels: ['telegram', 'ingame'],
    title: {
      ua: '🏆 Нове досягнення!',
      en: '🏆 New achievement!',
    },
    body: {
      ua: 'Вітаємо! Ти отримав "{achievement_name}"! Твоя нагорода: {reward}',
      en: 'Congratulations! You earned "{achievement_name}"! Your reward: {reward}',
    },
    actionUrl: 'game://achievements',
    actionText: {
      ua: 'Переглянути',
      en: 'View',
    },
    scheduling: {
      type: 'triggered',
      triggerEvent: 'achievement_earned',
    },
    isEnabled: true,
  },
  {
    id: 'secret_achievement_unlocked',
    type: 'achievement_unlocked',
    priority: 'high',
    channels: ['telegram', 'ingame'],
    title: {
      ua: '🔮 Секретне досягнення розкрито!',
      en: '🔮 Secret achievement revealed!',
    },
    body: {
      ua: 'Ти відкрив секретне досягнення! Це дуже особливий момент!',
      en: 'You revealed a secret achievement! This is a very special moment!',
    },
    actionUrl: 'game://achievements',
    actionText: {
      ua: 'Переглянути',
      en: 'View',
    },
    conditions: {},
    scheduling: {
      type: 'triggered',
      triggerEvent: 'achievement_earned',
    },
    isEnabled: true,
  },
];

// ============================================================================
// SEASON / BATTLE PASS NOTIFICATIONS
// ============================================================================

const SEASON_NOTIFICATIONS: NotificationTemplate[] = [
  {
    id: 'season_starting',
    type: 'season_starting',
    priority: 'high',
    channels: ['telegram', 'ingame'],
    title: {
      ua: '🏆 Новий сезон розпочато!',
      en: '🏆 New season has begun!',
    },
    body: {
      ua: 'Сезон {season_name} розпочато! Заробляй XP та розблоковуй нагороди!',
      en: 'Season {season_name} has begun! Earn XP and unlock rewards!',
    },
    actionUrl: 'game://season',
    actionText: {
      ua: 'Переглянути сезон',
      en: 'View season',
    },
    scheduling: {
      type: 'immediate',
    },
    isEnabled: true,
  },
  {
    id: 'season_tier_reached',
    type: 'achievement_unlocked',
    priority: 'normal',
    channels: ['ingame'],
    title: {
      ua: '⭐ Новий рівень сезону!',
      en: '⭐ New season level!',
    },
    body: {
      ua: 'Ти досяг рівня {tier} сезону! Перевір свої нагороди!',
      en: 'You reached season level {tier}! Check your rewards!',
    },
    actionUrl: 'game://season',
    actionText: {
      ua: 'Отримати нагороди',
      en: 'Claim rewards',
    },
    scheduling: {
      type: 'triggered',
      triggerEvent: 'season_tier_reached',
    },
    isEnabled: true,
  },
  {
    id: 'season_ending_soon',
    type: 'event_ending',
    priority: 'high',
    channels: ['telegram', 'ingame'],
    title: {
      ua: '⏰ Сезон {season_name} закінчується!',
      en: '⏰ Season {season_name} ending soon!',
    },
    body: {
      ua: 'Залишилося {days} днів! Встигни отримати всі нагороди сезону!',
      en: 'Only {days} days left! Hurry to get all season rewards!',
    },
    actionUrl: 'game://season',
    actionText: {
      ua: 'Встигнути',
      en: 'Hurry',
    },
    scheduling: {
      type: 'recurring',
      timeWindows: [
        { hour: 10, minute: 0 },
      ],
    },
    isEnabled: true,
  },
  {
    id: 'season_ended',
    type: 'event_ending',
    priority: 'normal',
    channels: ['telegram', 'ingame'],
    title: {
      ua: '🏆 Сезон {season_name} завершено!',
      en: '🏆 Season {season_name} has ended!',
    },
    body: {
      ua: 'Дякуємо за участь! Новий сезон незабаром. Твої нагороди очікують!',
      en: 'Thanks for playing! New season coming soon. Your rewards await!',
    },
    actionUrl: 'game://season',
    actionText: {
      ua: 'Переглянути нагороди',
      en: 'View rewards',
    },
    scheduling: {
      type: 'immediate',
    },
    isEnabled: true,
  },
];

// ============================================================================
// LEADERBOARD NOTIFICATIONS
// ============================================================================

const LEADERBOARD_NOTIFICATIONS: NotificationTemplate[] = [
  {
    id: 'leaderboard_position_up',
    type: 'leaderboard_reminder',
    priority: 'normal',
    channels: ['telegram'],
    title: {
      ua: '📊 Ти піднявся в рейтингу!',
      en: '📊 You moved up in rankings!',
    },
    body: {
      ua: 'Тепер ти на {rank} місці! Продовжуй грати, щоб досягти вершини!',
      en: 'You are now rank {rank}! Keep playing to reach the top!',
    },
    actionUrl: 'game://leaderboard',
    actionText: {
      ua: 'Таблиця лідерів',
      en: 'Leaderboard',
    },
    conditions: {},
    scheduling: {
      type: 'triggered',
      triggerEvent: 'leaderboard_rank_up',
    },
    isEnabled: true,
  },
  {
    id: 'leaderboard_top_10',
    type: 'leaderboard_reminder',
    priority: 'high',
    channels: ['telegram'],
    title: {
      ua: '🥇 Ти в топ-10!',
      en: '🥇 You are in top 10!',
    },
    body: {
      ua: 'Неймовірно! Ти посідаєш {rank} місце в таблиці лідерів!',
      en: 'Incredible! You are rank {rank} on the leaderboard!',
    },
    actionUrl: 'game://leaderboard',
    actionText: {
      ua: 'Переглянути',
      en: 'View',
    },
    conditions: {},
    scheduling: {
      type: 'triggered',
      triggerEvent: 'leaderboard_top_10',
    },
    isEnabled: true,
  },
];

// ============================================================================
// REFERRAL NOTIFICATIONS
// ============================================================================

const REFERRAL_NOTIFICATIONS: NotificationTemplate[] = [
  {
    id: 'referral_reminder',
    type: 'referral_reminder',
    priority: 'normal',
    channels: ['telegram'],
    title: {
      ua: '👥 Запроси друзів!',
      en: '👥 Invite friends!',
    },
    body: {
      ua: 'Запроси друга і ви отримаєте по 500 валюти! Твоє посилання чекає!',
      en: 'Invite a friend and both of you get 500 currency! Your link is waiting!',
    },
    actionUrl: 'game://referrals',
    actionText: {
      ua: 'Запросити',
      en: 'Invite',
    },
    conditions: {},
    scheduling: {
      type: 'recurring',
      timeWindows: [
        { hour: 12, minute: 0 },
        { hour: 18, minute: 0 },
      ],
    },
    isEnabled: true,
  },
  {
    id: 'referral_completed',
    type: 'referral_reminder',
    priority: 'normal',
    channels: ['telegram'],
    title: {
      ua: '🎉 Новий друг приєднався!',
      en: '🎉 New friend joined!',
    },
    body: {
      ua: 'Твій друг {friend_name} почав грати! Ви обоє отримали нагороду!',
      en: 'Your friend {friend_name} started playing! You both got a reward!',
    },
    actionUrl: 'game://home',
    actionText: {
      ua: 'Грати разом',
      en: 'Play together',
    },
    scheduling: {
      type: 'triggered',
      triggerEvent: 'referral_completed',
    },
    isEnabled: true,
  },
];

// ============================================================================
// LEVEL UP NOTIFICATIONS
// ============================================================================

const LEVEL_UP_NOTIFICATIONS: NotificationTemplate[] = [
  {
    id: 'level_milestone',
    type: 'level_up',
    priority: 'normal',
    channels: ['ingame'],
    title: {
      ua: '🎊 Рівень {level}!',
      en: '🎊 Level {level}!',
    },
    body: {
      ua: 'Вітаємо з новим рівнем! Ти досягнув {epoch_name}!',
      en: 'Congratulations on your new level! You reached {epoch_name}!',
    },
    actionUrl: 'game://home',
    actionText: {
      ua: 'Продовжити',
      en: 'Continue',
    },
    conditions: {},
    scheduling: {
      type: 'triggered',
      triggerEvent: 'level_up',
    },
    isEnabled: true,
  },
];

// ============================================================================
// COMEBACK NOTIFICATIONS
// ============================================================================

const COMEBACK_NOTIFICATIONS: NotificationTemplate[] = [
  {
    id: 'comeback_offer',
    type: 'comeback_offer',
    priority: 'high',
    channels: ['telegram'],
    title: {
      ua: '👋 Ми сумуємо за тобою!',
      en: '👋 We missed you!',
    },
    body: {
      ua: 'Повертайся і отримай особливу нагороду за повернення!',
      en: 'Come back and get a special comeback reward!',
    },
    actionUrl: 'game://home',
    actionText: {
      ua: 'Повернутися',
      en: 'Come back',
    },
    conditions: {
      hoursSinceLastSession: 72,
    },
    scheduling: {
      type: 'immediate',
    },
    isEnabled: true,
  },
  {
    id: 'comeback_offer_big',
    type: 'comeback_offer',
    priority: 'high',
    channels: ['telegram'],
    title: {
      ua: '🎁 Особливий подарунок чекає!',
      en: '🎁 Special gift waiting!',
    },
    body: {
      ua: 'Ти відсутній вже {days} днів! Повертайся і отримай щедру нагороду!',
      en: 'You have been away for {days} days! Come back and get a generous reward!',
    },
    actionUrl: 'game://home',
    actionText: {
      ua: 'Забрати подарунок',
      en: 'Claim gift',
    },
    conditions: {
      hoursSinceLastSession: 168,
    },
    scheduling: {
      type: 'immediate',
    },
    isEnabled: true,
  },
];

// ============================================================================
// MISSION COMPLETION NOTIFICATIONS
// ============================================================================

const MISSION_NOTIFICATIONS: NotificationTemplate[] = [
  {
    id: 'daily_missions_ready',
    type: 'mission_complete',
    priority: 'normal',
    channels: ['ingame'],
    title: {
      ua: '📋 Нові щоденні місії!',
      en: '📋 New daily missions!',
    },
    body: {
      ua: 'Перевір нові щоденні місії та отримай нагороди!',
      en: 'Check new daily missions and claim rewards!',
    },
    actionUrl: 'game://missions',
    actionText: {
      ua: 'Переглянути',
      en: 'View',
    },
    conditions: {},
    scheduling: {
      type: 'recurring',
      timeWindows: [
        { hour: 0, minute: 0 },
      ],
    },
    isEnabled: true,
  },
  {
    id: 'mission_all_complete',
    type: 'mission_complete',
    priority: 'normal',
    channels: ['ingame'],
    title: {
      ua: '✨ Всі місії виконано!',
      en: '✨ All missions complete!',
    },
    body: {
      ua: 'Ти молодець! Отримай всі нагороди за місії!',
      en: 'Great job! Claim all your mission rewards!',
    },
    actionUrl: 'game://missions',
    actionText: {
      ua: 'Отримати нагороди',
      en: 'Claim rewards',
    },
    conditions: {},
    scheduling: {
      type: 'triggered',
      triggerEvent: 'mission_completed',
    },
    isEnabled: true,
  },
];

// ============================================================================
// TEMPLATE REGISTRY
// ============================================================================

export const ALL_NOTIFICATION_TEMPLATES: NotificationTemplate[] = [
  ...DAILY_REMINDER_TEMPLATES,
  ...STREAK_WARNING_TEMPLATES,
  ...ENERGY_NOTIFICATIONS,
  ...EVENT_NOTIFICATIONS,
  ...ACHIEVEMENT_NOTIFICATIONS,
  ...SEASON_NOTIFICATIONS,
  ...LEADERBOARD_NOTIFICATIONS,
  ...REFERRAL_NOTIFICATIONS,
  ...LEVEL_UP_NOTIFICATIONS,
  ...COMEBACK_NOTIFICATIONS,
  ...MISSION_NOTIFICATIONS,
];

// Build lookup map
const TEMPLATE_MAP: Record<string, NotificationTemplate> = {};
for (const t of ALL_NOTIFICATION_TEMPLATES) {
  TEMPLATE_MAP[t.id] = t;
}
export function getTemplateById(id: string): NotificationTemplate | undefined {
  return TEMPLATE_MAP[id];
}

export function getTemplatesByType(type: NotificationType): NotificationTemplate[] {
  return ALL_NOTIFICATION_TEMPLATES.filter(t => t.type === type);
}

export function getTemplatesByChannel(channel: 'telegram' | 'ingame' | 'push'): NotificationTemplate[] {
  return ALL_NOTIFICATION_TEMPLATES.filter(t => t.channels.includes(channel));
}

export function getEnabledTemplates(): NotificationTemplate[] {
  return ALL_NOTIFICATION_TEMPLATES.filter(t => t.isEnabled);
}

// ============================================================================
// TEMPLATE PROCESSING
// ============================================================================

export interface ProcessedNotification {
  title: string;
  body: string;
  actionUrl?: string;
  actionText?: string;
  imageUrl?: string;
}

/**
 * Process a notification template with player data
 */
export function processTemplate(
  template: NotificationTemplate,
  playerData: {
    streak?: number;
    eventName?: string;
    hours?: number;
    days?: number;
    multiplier?: number;
    endDate?: string;
    achievementName?: string;
    reward?: string;
    rank?: number;
    friendName?: string;
    level?: number;
    epochName?: string;
    seasonName?: string;
    tier?: number;
  }
): ProcessedNotification {
  let title = template.title.ua;
  let body = template.body.ua;
  
  // Replace placeholders
  const placeholders: Record<string, string | number> = {
    '{streak}': playerData.streak || 0,
    '{event_name}': playerData.eventName || '',
    '{hours}': playerData.hours || 0,
    '{days}': playerData.days || 0,
    '{multiplier}': playerData.multiplier || 1,
    '{end_date}': playerData.endDate || '',
    '{achievement_name}': playerData.achievementName || '',
    '{reward}': playerData.reward || '',
    '{rank}': playerData.rank || 0,
    '{friend_name}': playerData.friendName || '',
    '{level}': playerData.level || 0,
    '{epoch_name}': playerData.epochName || '',
    '{season_name}': playerData.seasonName || '',
    '{tier}': playerData.tier || 0,
  };
  
  for (const [key, value] of Object.entries(placeholders)) {
    title = title.replace(new RegExp(key.replace(/[{}]/g, '\\$&'), 'g'), String(value));
    body = body.replace(new RegExp(key.replace(/[{}]/g, '\\$&'), 'g'), String(value));
  }
  
  return {
    title,
    body,
    actionUrl: template.actionUrl,
    actionText: template.actionText?.ua,
    imageUrl: template.imageUrl,
  };
}

// ============================================================================
// NOTIFICATION SCHEDULING HELPERS
// ============================================================================

/**
 * Check if a notification should be sent based on conditions
 */
export function shouldSendNotification(
  template: NotificationTemplate,
  playerState: {
    streak?: number;
    lastSessionAt?: string;
    isPaying?: boolean;
    level?: number;
    prestigeLevel?: number;
    segments?: string[];
  }
): boolean {
  const conditions = template.conditions;
  if (!conditions) return true;
  
  // Check level conditions
  if (conditions.minLevel && (playerState.level || 0) < conditions.minLevel) {
    return false;
  }
  if (conditions.maxLevel && (playerState.level || 0) > conditions.maxLevel) {
    return false;
  }
  
  // Check prestige conditions
  if (conditions.minPrestige && (playerState.prestigeLevel || 0) < conditions.minPrestige) {
    return false;
  }
  
  // Check segment conditions
  if (conditions.segments && conditions.segments.length > 0) {
    const hasSegment = conditions.segments.some(s => playerState.segments?.includes(s));
    if (!hasSegment) return false;
  }
  
  // Check streak conditions
  if (conditions.hasStreak && !playerState.streak) {
    return false;
  }
  
  // Check hours since last session
  if (conditions.hoursSinceLastSession && playerState.lastSessionAt) {
    const hoursSince = (Date.now() - new Date(playerState.lastSessionAt).getTime()) / (1000 * 60 * 60);
    if (hoursSince < conditions.hoursSinceLastSession) {
      return false;
    }
  }
  
  return true;
}

/**
 * Get notifications scheduled for a specific time
 */
export function getNotificationsForTime(
  hour: number,
  playerState: {
    streak?: number;
    lastSessionAt?: string;
    isPaying?: boolean;
    level?: number;
    prestigeLevel?: number;
    segments?: string[];
  }
): NotificationTemplate[] {
  return getEnabledTemplates().filter(template => {
    if (template.scheduling?.type !== 'recurring') return false;
    if (!template.scheduling.timeWindows) return false;
    
    const matchesTime = template.scheduling.timeWindows.some(
      tw => tw.hour === hour
    );
    
    if (!matchesTime) return false;
    
    return shouldSendNotification(template, playerState);
  });
}
