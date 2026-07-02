/**
 * Virtual Museum Tapper Game — Achievement System Data
 * 50+ achievements across multiple categories for long-term engagement
 */

import type {
  AchievementDef,
  AchievementCategory,
} from '../types/liveops';

// ============================================================================
// PROGRESSION ACHIEVEMENTS
// ============================================================================

const PROGRESSION_ACHIEVEMENTS: AchievementDef[] = [
  {
    id: 'reach_level_10',
    category: 'progression',
    name: { ua: 'Початківець', en: 'Beginner' },
    description: { ua: 'Досягни 10-го рівня', en: 'Reach level 10' },
    icon: '🌱',
    requirement: { type: 'level', target: 10 },
    reward: { type: 'currency', amount: 100 },
  },
  {
    id: 'reach_level_50',
    category: 'progression',
    name: { ua: 'Розвиток', en: 'Growing' },
    description: { ua: 'Досягни 50-го рівня', en: 'Reach level 50' },
    icon: '🌿',
    requirement: { type: 'level', target: 50 },
    reward: { type: 'currency', amount: 500 },
  },
  {
    id: 'reach_level_100',
    category: 'progression',
    name: { ua: 'Досвідчений', en: 'Experienced' },
    description: { ua: 'Досягни 100-го рівня', en: 'Reach level 100' },
    icon: '🌳',
    requirement: { type: 'level', target: 100 },
    reward: { type: 'currency', amount: 1500 },
  },
  {
    id: 'reach_level_250',
    category: 'progression',
    name: { ua: 'Майстер Тапання', en: 'Tap Master' },
    description: { ua: 'Досягни 250-го рівня', en: 'Reach level 250' },
    icon: '⭐',
    requirement: { type: 'level', target: 250 },
    reward: { type: 'currency', amount: 5000 },
  },
  {
    id: 'reach_level_500',
    category: 'progression',
    name: { ua: 'Легенда Тапання', en: 'Tap Legend' },
    description: { ua: 'Досягни 500-го рівня', en: 'Reach level 500' },
    icon: '💫',
    requirement: { type: 'level', target: 500 },
    reward: { type: 'artifact_fragment', amount: 5, rarity: 'rare' },
  },
  {
    id: 'reach_level_750',
    category: 'progression',
    name: { ua: 'Король Тапання', en: 'Tap King' },
    description: { ua: 'Досягни 750-го рівня', en: 'Reach level 750' },
    icon: '👑',
    requirement: { type: 'level', target: 750 },
    reward: { type: 'artifact_fragment', amount: 10, rarity: 'epic' },
  },
  {
    id: 'reach_level_999',
    category: 'progression',
    name: { ua: 'Тапа-Олімп', en: 'Tap Olympus' },
    description: { ua: 'Досягни максимального 999-го рівня', en: 'Reach the maximum level 999' },
    icon: '🏔️',
    requirement: { type: 'level', target: 999 },
    reward: { type: 'artifact_fragment', amount: 20, rarity: 'legendary' },
  },
];

// ============================================================================
// EPOCH ACHIEVEMENTS
// ============================================================================

const EPOCH_ACHIEVEMENTS: AchievementDef[] = [
  {
    id: 'epoch_1_complete',
    category: 'progression',
    name: { ua: 'Трипілля', en: 'Trypillia' },
    description: { ua: 'Пройди епоху Трипілля', en: 'Complete Trypillia epoch' },
    icon: '🏺',
    requirement: { type: 'epoch_complete', target: 1 },
    reward: { type: 'currency', amount: 200 },
  },
  {
    id: 'epoch_2_complete',
    category: 'progression',
    name: { ua: 'Скіфія', en: 'Scythia' },
    description: { ua: 'Пройди епоху скіфів', en: 'Complete Scythia epoch' },
    icon: '⚔️',
    requirement: { type: 'epoch_complete', target: 2 },
    reward: { type: 'currency', amount: 400 },
  },
  {
    id: 'epoch_3_complete',
    category: 'progression',
    name: { ua: 'Античність', en: 'Antiquity' },
    description: { ua: 'Пройди епоху античності', en: 'Complete Antiquity epoch' },
    icon: '🏛️',
    requirement: { type: 'epoch_complete', target: 3 },
    reward: { type: 'currency', amount: 800 },
  },
  {
    id: 'epoch_4_complete',
    category: 'progression',
    name: { ua: 'Київська Русь', en: 'Kyiv Rus' },
    description: { ua: 'Пройди епоху Київської Русі', en: 'Complete Kyiv Rus epoch' },
    icon: '⛪',
    requirement: { type: 'epoch_complete', target: 4 },
    reward: { type: 'artifact_fragment', amount: 5, rarity: 'common' },
  },
  {
    id: 'epoch_7_complete',
    category: 'progression',
    name: { ua: 'Козацтво', en: 'Cossack Era' },
    description: { ua: 'Пройди епоху козацтва', en: 'Complete Cossack era' },
    icon: '🗡️',
    requirement: { type: 'epoch_complete', target: 7 },
    reward: { type: 'artifact_fragment', amount: 5, rarity: 'rare' },
  },
  {
    id: 'epoch_12_complete',
    category: 'progression',
    name: { ua: 'Незалежність', en: 'Independence' },
    description: { ua: 'Пройди епоху Незалежності', en: 'Complete Independence epoch' },
    icon: '🇺🇦',
    requirement: { type: 'epoch_complete', target: 12 },
    reward: { type: 'artifact_fragment', amount: 10, rarity: 'epic' },
  },
  {
    id: 'all_ua_epochs',
    category: 'progression',
    name: { ua: 'Історіограф', en: 'Historiographer' },
    description: { ua: 'Пройди всі 12 українських епох', en: 'Complete all 12 Ukrainian epochs' },
    icon: '📜',
    requirement: { type: 'epoch_complete', target: 12, secondaryTarget: 12 },
    reward: { type: 'artifact_fragment', amount: 15, rarity: 'legendary' },
  },
];

// ============================================================================
// PRESTIGE ACHIEVEMENTS
// ============================================================================

const PRESTIGE_ACHIEVEMENTS: AchievementDef[] = [
  {
    id: 'first_prestige',
    category: 'progression',
    name: { ua: 'Відродження', en: 'Rebirth' },
    description: { ua: 'Здійсни своє перше відродження', en: 'Perform your first prestige' },
    icon: '🔄',
    requirement: { type: 'prestige_count', target: 1 },
    reward: { type: 'currency', amount: 5000 },
  },
  {
    id: 'prestige_3',
    category: 'progression',
    name: { ua: 'Тричі Відроджений', en: 'Thrice Reborn' },
    description: { ua: 'Здійсни 3 відродження', en: 'Perform 3 prestiges' },
    icon: '🌟',
    requirement: { type: 'prestige_count', target: 3 },
    reward: { type: 'artifact_fragment', amount: 10, rarity: 'epic' },
  },
  {
    id: 'prestige_5',
    category: 'progression',
    name: { ua: 'П\'ятиразовий', en: 'Fifth Time Lucky' },
    description: { ua: 'Здійсни 5 відроджень', en: 'Perform 5 prestiges' },
    icon: '💎',
    requirement: { type: 'prestige_count', target: 5 },
    reward: { type: 'artifact_fragment', amount: 15, rarity: 'legendary' },
  },
  {
    id: 'prestige_10',
    category: 'progression',
    name: { ua: 'Маестро Відродження', en: 'Prestige Maestro' },
    description: { ua: 'Здійсни 10 відроджень', en: 'Perform 10 prestiges' },
    icon: '🎭',
    requirement: { type: 'prestige_count', target: 10 },
    reward: { type: 'artifact_fragment', amount: 25, rarity: 'legendary' },
  },
];

// ============================================================================
// COLLECTION ACHIEVEMENTS
// ============================================================================

const COLLECTION_ACHIEVEMENTS: AchievementDef[] = [
  {
    id: 'collect_10_artifacts',
    category: 'collection',
    name: { ua: 'Колекціонер', en: 'Collector' },
    description: { ua: 'Збери 10 артефактів', en: 'Collect 10 artifacts' },
    icon: '🗃️',
    requirement: { type: 'artifact_collected', target: 10 },
    reward: { type: 'currency', amount: 1000 },
  },
  {
    id: 'collect_25_artifacts',
    category: 'collection',
    name: { ua: 'Архівіст', en: 'Archivist' },
    description: { ua: 'Збери 25 артефактів', en: 'Collect 25 artifacts' },
    icon: '📚',
    requirement: { type: 'artifact_collected', target: 25 },
    reward: { type: 'artifact_fragment', amount: 5, rarity: 'rare' },
  },
  {
    id: 'collect_50_artifacts',
    category: 'collection',
    name: { ua: 'Музейний Зберігач', en: 'Museum Keeper' },
    description: { ua: 'Збери 50 артефактів', en: 'Collect 50 artifacts' },
    icon: '🏛️',
    requirement: { type: 'artifact_collected', target: 50 },
    reward: { type: 'artifact_fragment', amount: 10, rarity: 'epic' },
  },
  {
    id: 'complete_epoch_artifacts',
    category: 'collection',
    name: { ua: 'Повний Набір', en: 'Complete Set' },
    description: { ua: 'Збери всі артефакти однієї епохи', en: 'Collect all artifacts from one epoch' },
    icon: '✅',
    requirement: { type: 'epoch_artifacts_complete', target: 1 },
    reward: { type: 'artifact_fragment', amount: 5, rarity: 'rare' },
  },
  {
    id: 'legendary_artifact',
    category: 'collection',
    name: { ua: 'Рідкісна Знахідка', en: 'Rare Find' },
    description: { ua: 'Отримай легендарний артефакт', en: 'Obtain a legendary artifact' },
    icon: '🌟',
    requirement: { type: 'rarity_collected', target: 1, secondaryTarget: 4 }, // 4 = legendary
    reward: { type: 'artifact_fragment', amount: 10, rarity: 'legendary' },
  },
  {
    id: 'secret_artifact',
    category: 'collection',
    name: { ua: 'Таємниця Розкрита', en: 'Secret Revealed' },
    description: { ua: 'Отримай секретний артефакт', en: 'Obtain a secret artifact' },
    icon: '🔮',
    requirement: { type: 'rarity_collected', target: 1, secondaryTarget: 5 }, // 5 = secret
    reward: { type: 'artifact_fragment', amount: 15, rarity: 'legendary' },
    isSecret: true,
  },
  {
    id: 'artifact_max_level',
    category: 'collection',
    name: { ua: 'Вдосконалення', en: 'Perfection' },
    description: { ua: 'Максимально покращи один артефакт', en: 'Max level one artifact' },
    icon: '⬆️',
    requirement: { type: 'artifact_max_level', target: 1 },
    reward: { type: 'artifact_fragment', amount: 5, rarity: 'epic' },
  },
];

// ============================================================================
// ENGAGEMENT ACHIEVEMENTS
// ============================================================================

const ENGAGEMENT_ACHIEVEMENTS: AchievementDef[] = [
  {
    id: 'streak_3',
    category: 'engagement',
    name: { ua: 'Початок Шляху', en: 'Getting Started' },
    description: { ua: 'Триденна серія входів', en: '3-day login streak' },
    icon: '🔥',
    requirement: { type: 'streak_days', target: 3 },
    reward: { type: 'currency', amount: 200 },
  },
  {
    id: 'streak_7',
    category: 'engagement',
    name: { ua: 'Тиждень Відданості', en: 'Week of Dedication' },
    description: { ua: 'Семиденна серія входів', en: '7-day login streak' },
    icon: '🔥',
    requirement: { type: 'streak_days', target: 7 },
    reward: { type: 'currency', amount: 800 },
  },
  {
    id: 'streak_14',
    category: 'engagement',
    name: { ua: 'Два Тижні', en: 'Two Weeks Strong' },
    description: { ua: '14-денна серія входів', en: '14-day login streak' },
    icon: '🔥',
    requirement: { type: 'streak_days', target: 14 },
    reward: { type: 'artifact_fragment', amount: 5, rarity: 'rare' },
  },
  {
    id: 'streak_30',
    category: 'engagement',
    name: { ua: 'Місяць Безперервно', en: 'Month Unbroken' },
    description: { ua: '30-денна серія входів', en: '30-day login streak' },
    icon: '🔥',
    requirement: { type: 'streak_days', target: 30 },
    reward: { type: 'artifact_fragment', amount: 10, rarity: 'epic' },
  },
  {
    id: 'streak_60',
    category: 'engagement',
    name: { ua: 'Два Місяці', en: 'Two Months Strong' },
    description: { ua: '60-денна серія входів', en: '60-day login streak' },
    icon: '🔥',
    requirement: { type: 'streak_days', target: 60 },
    reward: { type: 'artifact_fragment', amount: 15, rarity: 'epic' },
  },
  {
    id: 'streak_100',
    category: 'engagement',
    name: { ua: 'Сторіччя', en: 'Century' },
    description: { ua: '100-денна серія входів', en: '100-day login streak' },
    icon: '💯',
    requirement: { type: 'streak_days', target: 100 },
    reward: { type: 'artifact_fragment', amount: 20, rarity: 'legendary' },
  },
  {
    id: 'daily_checkin_7',
    category: 'engagement',
    name: { ua: 'Тиждень Нагород', en: 'Reward Week' },
    description: { ua: 'Отримай 7 щоденних нагород', en: 'Claim 7 daily check-in rewards' },
    icon: '📅',
    requirement: { type: 'daily_checkin_count', target: 7 },
    reward: { type: 'gacha_ticket', amount: 1 },
  },
  {
    id: 'daily_checkin_30',
    category: 'engagement',
    name: { ua: 'Місяць Нагород', en: 'Reward Month' },
    description: { ua: 'Отримай 30 щоденних нагород', en: 'Claim 30 daily check-in rewards' },
    icon: '📅',
    requirement: { type: 'daily_checkin_count', target: 30 },
    reward: { type: 'artifact_fragment', amount: 10, rarity: 'rare' },
  },
];

// ============================================================================
// SOCIAL ACHIEVEMENTS
// ============================================================================

const SOCIAL_ACHIEVEMENTS: AchievementDef[] = [
  {
    id: 'first_referral',
    category: 'social',
    name: { ua: 'Перший Друг', en: 'First Friend' },
    description: { ua: 'Запроси одного друга', en: 'Refer one friend' },
    icon: '👤',
    requirement: { type: 'referral_count', target: 1 },
    reward: { type: 'currency', amount: 500 },
  },
  {
    id: 'referral_5',
    category: 'social',
    name: { ua: 'Друзі', en: 'Social Butterfly' },
    description: { ua: 'Запроси 5 друзів', en: 'Refer 5 friends' },
    icon: '👥',
    requirement: { type: 'referral_count', target: 5 },
    reward: { type: 'artifact_fragment', amount: 5, rarity: 'rare' },
  },
  {
    id: 'referral_25',
    category: 'social',
    name: { ua: 'Амбасадор', en: 'Ambassador' },
    description: { ua: 'Запроси 25 друзів', en: 'Refer 25 friends' },
    icon: '🎖️',
    requirement: { type: 'referral_count', target: 25 },
    reward: { type: 'artifact_fragment', amount: 15, rarity: 'epic' },
  },
  {
    id: 'referral_100',
    category: 'social',
    name: { ua: 'Легендарний Амбасадор', en: 'Legendary Ambassador' },
    description: { ua: 'Запроси 100 друзів', en: 'Refer 100 friends' },
    icon: '🏅',
    requirement: { type: 'referral_count', target: 100 },
    reward: { type: 'artifact_fragment', amount: 25, rarity: 'legendary' },
  },
  {
    id: 'leaderboard_top_100',
    category: 'social',
    name: { ua: 'Топ 100', en: 'Top 100' },
    description: { ua: 'Потрап у топ-100 таблиці лідерів', en: 'Reach top 100 on leaderboard' },
    icon: '🏆',
    requirement: { type: 'leaderboard_rank', target: 100 },
    reward: { type: 'artifact_fragment', amount: 10, rarity: 'rare' },
  },
  {
    id: 'leaderboard_top_10',
    category: 'social',
    name: { ua: 'Топ 10', en: 'Top 10' },
    description: { ua: 'Потрап у топ-10 таблиці лідерів', en: 'Reach top 10 on leaderboard' },
    icon: '🥇',
    requirement: { type: 'leaderboard_rank', target: 10 },
    reward: { type: 'artifact_fragment', amount: 15, rarity: 'epic' },
  },
  {
    id: 'leaderboard_1',
    category: 'social',
    name: { ua: 'Перший', en: 'Number One' },
    description: { ua: 'Посідай перше місце в таблиці лідерів', en: 'Reach #1 on leaderboard' },
    icon: '👑',
    requirement: { type: 'leaderboard_rank', target: 1 },
    reward: { type: 'artifact_fragment', amount: 25, rarity: 'legendary' },
    isSecret: true,
  },
];

// ============================================================================
// ECONOMY ACHIEVEMENTS
// ============================================================================

const ECONOMY_ACHIEVEMENTS: AchievementDef[] = [
  {
    id: 'earn_100k',
    category: 'economy',
    name: { ua: 'Перші Гроші', en: 'First Earnings' },
    description: { ua: 'Зароби 100,000 валюти всього', en: 'Earn 100,000 total currency' },
    icon: '💰',
    requirement: { type: 'total_currency_earned', target: 100000 },
    reward: { type: 'currency', amount: 500 },
  },
  {
    id: 'earn_1m',
    category: 'economy',
    name: { ua: 'Мільйонер', en: 'Millionaire' },
    description: { ua: 'Зароби 1,000,000 валюти всього', en: 'Earn 1,000,000 total currency' },
    icon: '💎',
    requirement: { type: 'total_currency_earned', target: 1000000 },
    reward: { type: 'artifact_fragment', amount: 5, rarity: 'rare' },
  },
  {
    id: 'earn_10m',
    category: 'economy',
    name: { ua: 'Банкір', en: 'Banker' },
    description: { ua: 'Зароби 10,000,000 валюти всього', en: 'Earn 10,000,000 total currency' },
    icon: '🏦',
    requirement: { type: 'total_currency_earned', target: 10000000 },
    reward: { type: 'artifact_fragment', amount: 10, rarity: 'epic' },
  },
  {
    id: 'earn_100m',
    category: 'economy',
    name: { ua: 'Економічний Титан', en: 'Economic Titan' },
    description: { ua: 'Зароби 100,000,000 валюти всього', en: 'Earn 100,000,000 total currency' },
    icon: '💫',
    requirement: { type: 'total_currency_earned', target: 100000000 },
    reward: { type: 'artifact_fragment', amount: 20, rarity: 'legendary' },
  },
  {
    id: 'buy_10_generators',
    category: 'economy',
    name: { ua: 'Інвестор', en: 'Investor' },
    description: { ua: 'Купи 10 генераторів', en: 'Purchase 10 generators' },
    icon: '🏗️',
    requirement: { type: 'generators_purchased', target: 10 },
    reward: { type: 'currency', amount: 300 },
  },
  {
    id: 'buy_100_generators',
    category: 'economy',
    name: { ua: 'Будівельник Імперії', en: 'Empire Builder' },
    description: { ua: 'Купи 100 генераторів', en: 'Purchase 100 generators' },
    icon: '🏭',
    requirement: { type: 'generators_purchased', target: 100 },
    reward: { type: 'artifact_fragment', amount: 5, rarity: 'rare' },
  },
  {
    id: 'buy_500_generators',
    category: 'economy',
    name: { ua: 'Генеральний Директор', en: 'CEO' },
    description: { ua: 'Купи 500 генераторів', en: 'Purchase 500 generators' },
    icon: '🎩',
    requirement: { type: 'generators_purchased', target: 500 },
    reward: { type: 'artifact_fragment', amount: 15, rarity: 'epic' },
  },
];

// ============================================================================
// COMBAT / TAP ACHIEVEMENTS
// ============================================================================

const COMBAT_ACHIEVEMENTS: AchievementDef[] = [
  {
    id: 'tap_1000',
    category: 'combat',
    name: { ua: 'Перші 1000', en: 'First Thousand' },
    description: { ua: 'Натисни 1000 разів', en: 'Tap 1000 times' },
    icon: '👆',
    requirement: { type: 'tap_count', target: 1000 },
    reward: { type: 'currency', amount: 100 },
  },
  {
    id: 'tap_10000',
    category: 'combat',
    name: { ua: 'Тапа-Марафонець', en: 'Tap Marathon' },
    description: { ua: 'Натисни 10,000 разів', en: 'Tap 10,000 times' },
    icon: '🏃',
    requirement: { type: 'tap_count', target: 10000 },
    reward: { type: 'currency', amount: 500 },
  },
  {
    id: 'tap_100000',
    category: 'combat',
    name: { ua: '100К Тапання', en: '100K Taps' },
    description: { ua: 'Натисни 100,000 разів', en: 'Tap 100,000 times' },
    icon: '💪',
    requirement: { type: 'tap_count', target: 100000 },
    reward: { type: 'artifact_fragment', amount: 5, rarity: 'rare' },
  },
  {
    id: 'tap_1m',
    category: 'combat',
    name: { ua: 'Мільйон Тапів', en: 'Million Taps' },
    description: { ua: 'Натисни 1,000,000 разів', en: 'Tap 1,000,000 times' },
    icon: '🎯',
    requirement: { type: 'tap_count', target: 1000000 },
    reward: { type: 'artifact_fragment', amount: 10, rarity: 'epic' },
  },
  {
    id: 'tap_10m',
    category: 'combat',
    name: { ua: 'Тапа-Легенда', en: 'Tap Legend' },
    description: { ua: 'Натисни 10,000,000 разів', en: 'Tap 10,000,000 times' },
    icon: '🌟',
    requirement: { type: 'tap_count', target: 10000000 },
    reward: { type: 'artifact_fragment', amount: 20, rarity: 'legendary' },
  },
  {
    id: 'tap_power_10',
    category: 'combat',
    name: { ua: 'Сила Удару', en: 'Punch Power' },
    description: { ua: 'Покращи силу тапу до 10', en: 'Upgrade tap power to 10' },
    icon: '⚡',
    requirement: { type: 'tap_power', target: 10 },
    reward: { type: 'currency', amount: 2000 },
  },
  {
    id: 'tap_power_50',
    category: 'combat',
    name: { ua: 'Мега-Тап', en: 'Mega Tap' },
    description: { ua: 'Покращи силу тапу до 50', en: 'Upgrade tap power to 50' },
    icon: '⚡⚡',
    requirement: { type: 'tap_power', target: 50 },
    reward: { type: 'artifact_fragment', amount: 5, rarity: 'epic' },
  },
  {
    id: 'tap_power_100',
    category: 'combat',
    name: { ua: 'Гіга-Тап', en: 'Giga Tap' },
    description: { ua: 'Покращи силу тапу до 100', en: 'Upgrade tap power to 100' },
    icon: '⚡⚡⚡',
    requirement: { type: 'tap_power', target: 100 },
    reward: { type: 'artifact_fragment', amount: 15, rarity: 'legendary' },
  },
];

// ============================================================================
// SPECIAL / EASTER EGG ACHIEVEMENTS
// ============================================================================

const SPECIAL_ACHIEVEMENTS: AchievementDef[] = [
  {
    id: 'sit_studio_complete',
    category: 'special',
    name: { ua: '???', en: '???' },
    description: { ua: 'Знайди всі секретні літери', en: 'Find all secret letters' },
    icon: '❓',
    requirement: { type: 'sit_studio_complete', target: 1 },
    reward: { type: 'xp', amount: 99999 },
    isSecret: true,
  },
  {
    id: 'all_epochs_world',
    category: 'special',
    name: { ua: 'Мандрівник Часом', en: 'Time Traveler' },
    description: { ua: 'Відвідай всі світові епохи', en: 'Visit all world epochs' },
    icon: '🌍',
    requirement: { type: 'world_epochs_visited', target: 8 },
    reward: { type: 'artifact_fragment', amount: 20, rarity: 'legendary' },
    prerequisites: ['prestige_3'],
  },
  {
    id: 'first_gacha',
    category: 'special',
    name: { ua: 'Удача Починається', en: 'Fortune Begins' },
    description: { ua: 'Відкрий свою першу скриню', en: 'Open your first chest' },
    icon: '🎁',
    requirement: { type: 'gacha_opened', target: 1 },
    reward: { type: 'currency', amount: 50 },
  },
  {
    id: 'gacha_100',
    category: 'special',
    name: { ua: 'Шукач Скарбів', en: 'Treasure Hunter' },
    description: { ua: 'Відкрий 100 скринь', en: 'Open 100 chests' },
    icon: '💎',
    requirement: { type: 'gacha_opened', target: 100 },
    reward: { type: 'artifact_fragment', amount: 10, rarity: 'rare' },
  },
  {
    id: 'gacha_500',
    category: 'special',
    name: { ua: 'Грабунковий Барон', en: 'Plundering Baron' },
    description: { ua: 'Відкрий 500 скринь', en: ' Open 500 chests' },
    icon: '🏰',
    requirement: { type: 'gacha_opened', target: 500 },
    reward: { type: 'artifact_fragment', amount: 15, rarity: 'epic' },
  },
  {
    id: 'watch_ad_10',
    category: 'special',
    name: { ua: 'Рекламний Переглядач', en: 'Ad Viewer' },
    description: { ua: 'Подивись 10 реклам', en: 'Watch 10 ads' },
    icon: '📺',
    requirement: { type: 'ads_watched', target: 10 },
    reward: { type: 'currency', amount: 200 },
  },
  {
    id: 'watch_ad_100',
    category: 'special',
    name: { ua: 'Рекламний Ентузіаст', en: 'Ad Enthusiast' },
    description: { ua: 'Подивись 100 реклам', en: 'Watch 100 ads' },
    icon: '📺',
    requirement: { type: 'ads_watched', target: 100 },
    reward: { type: 'artifact_fragment', amount: 5, rarity: 'rare' },
  },
];

// ============================================================================
// LIMITED TIME ACHIEVEMENTS
// ============================================================================

const LIMITED_TIME_ACHIEVEMENTS: AchievementDef[] = [
  {
    id: 'summer_2026_active',
    category: 'special',
    name: { ua: '☀️ Літній Учасник', en: '☀️ Summer Participant' },
    description: { ua: 'Беріть участь у Літньму марафоні 2026', en: 'Participate in Summer Marathon 2026' },
    icon: '☀️',
    requirement: { type: 'event_participation', target: 1, secondaryTarget: 1 }, // summer marathon
    reward: { type: 'cosmetic', cosmeticId: 'summer_badge_2026' },
    limitedTime: {
      startDate: '2026-06-01T00:00:00Z',
      endDate: '2026-08-31T23:59:59Z',
    },
  },
  {
    id: 'independence_2026',
    category: 'special',
    name: { ua: '🇺🇦 Патріот', en: '🇺🇦 Patriot' },
    description: { ua: 'Святкуй День Незалежності 2026', en: 'Celebrate Independence Day 2026' },
    icon: '🇺🇦',
    requirement: { type: 'event_participation', target: 1, secondaryTarget: 2 }, // independence day
    reward: { type: 'cosmetic', cosmeticId: 'independence_badge_2026' },
    limitedTime: {
      startDate: '2026-08-22T00:00:00Z',
      endDate: '2026-08-25T23:59:59Z',
    },
  },
];

// ============================================================================
// ACHIEVEMENT REGISTRY
// ============================================================================

export const ALL_ACHIEVEMENTS: AchievementDef[] = [
  ...PROGRESSION_ACHIEVEMENTS,
  ...EPOCH_ACHIEVEMENTS,
  ...PRESTIGE_ACHIEVEMENTS,
  ...COLLECTION_ACHIEVEMENTS,
  ...ENGAGEMENT_ACHIEVEMENTS,
  ...SOCIAL_ACHIEVEMENTS,
  ...ECONOMY_ACHIEVEMENTS,
  ...COMBAT_ACHIEVEMENTS,
  ...SPECIAL_ACHIEVEMENTS,
  ...LIMITED_TIME_ACHIEVEMENTS,
];

// Build lookup map
const ACHIEVEMENT_MAP: Record<string, AchievementDef> = {};
for (const ach of ALL_ACHIEVEMENTS) {
  ACHIEVEMENT_MAP[ach.id] = ach;
}
export function getAchievementById(id: string): AchievementDef | undefined {
  return ACHIEVEMENT_MAP[id];
}

// Get achievements by category
export function getAchievementsByCategory(category: AchievementCategory): AchievementDef[] {
  return ALL_ACHIEVEMENTS.filter(a => a.category === category);
}

// Get secret achievements
export function getSecretAchievements(): AchievementDef[] {
  return ALL_ACHIEVEMENTS.filter(a => a.isSecret);
}

// Get active time-limited achievements
export function getActiveLimitedAchievements(): AchievementDef[] {
  const now = new Date();
  return ALL_ACHIEVEMENTS.filter(a => {
    if (!a.limitedTime) return false;
    const start = new Date(a.limitedTime.startDate);
    const end = new Date(a.limitedTime.endDate);
    return now >= start && now <= end;
  });
}

// Get achievement prerequisites
export function getAchievementPrerequisites(achievementId: string): AchievementDef[] {
  const achievement = getAchievementById(achievementId);
  if (!achievement?.prerequisites) return [];
  return achievement.prerequisites
    .map(id => getAchievementById(id))
    .filter((a): a is AchievementDef => a !== undefined);
}

// Calculate total achievement rewards for display
export function getTotalAchievementRewards(): { currency: number; fragments: number } {
  let currency = 0;
  let fragments = 0;
  
  for (const ach of ALL_ACHIEVEMENTS) {
    if (ach.reward.type === 'currency' && ach.reward.amount) {
      currency += ach.reward.amount;
    }
    if (ach.reward.type === 'artifact_fragment' && ach.reward.amount) {
      fragments += ach.reward.amount;
    }
  }
  
  return { currency, fragments };
}

// Get achievement statistics
export function getAchievementStats(): { total: number; byCategory: Record<AchievementCategory, number>; secretCount: number; limitedCount: number } {
  const byCategory: Record<AchievementCategory, number> = {
    progression: 0,
    collection: 0,
    engagement: 0,
    social: 0,
    economy: 0,
    combat: 0,
    special: 0,
  };
  
  let secretCount = 0;
  let limitedCount = 0;
  
  for (const ach of ALL_ACHIEVEMENTS) {
    byCategory[ach.category]++;
    if (ach.isSecret) secretCount++;
    if (ach.limitedTime) limitedCount++;
  }
  
  return {
    total: ALL_ACHIEVEMENTS.length,
    byCategory,
    secretCount,
    limitedCount,
  };
}
