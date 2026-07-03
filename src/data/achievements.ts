/**
 * Virtual Museum Tapper Game — Achievement System Data
 * 60+ achievements across multiple categories for long-term engagement
 */

import type {
  AchievementDef,
  AchievementCategory,
} from '../types/liveops';

// ============================================================================
// LEVELING ACHIEVEMENTS
// ============================================================================

const LEVELING_ACHIEVEMENTS: AchievementDef[] = [
  { id: 'reach_level_5', category: 'progression', name: { ua: 'Перші Кроки', en: 'First Steps' }, description: { ua: 'Досягни 5-го рівня', en: 'Reach level 5' }, icon: '🌱', requirement: { type: 'level', target: 5 }, reward: { type: 'currency', amount: 50 } },
  { id: 'reach_level_10', category: 'progression', name: { ua: 'Початківець', en: 'Beginner' }, description: { ua: 'Досягни 10-го рівня', en: 'Reach level 10' }, icon: '🌿', requirement: { type: 'level', target: 10 }, reward: { type: 'currency', amount: 100 } },
  { id: 'reach_level_25', category: 'progression', name: { ua: 'Зростання', en: 'Growing' }, description: { ua: 'Досягни 25-го рівня', en: 'Reach level 25' }, icon: '🪴', requirement: { type: 'level', target: 25 }, reward: { type: 'currency', amount: 300 } },
  { id: 'reach_level_50', category: 'progression', name: { ua: 'Досвідчений', en: 'Experienced' }, description: { ua: 'Досягни 50-го рівня', en: 'Reach level 50' }, icon: '🌳', requirement: { type: 'level', target: 50 }, reward: { type: 'currency', amount: 800 } },
  { id: 'reach_level_100', category: 'progression', name: { ua: 'Ветеран', en: 'Veteran' }, description: { ua: 'Досягни 100-го рівня', en: 'Reach level 100' }, icon: '⭐', requirement: { type: 'level', target: 100 }, reward: { type: 'currency', amount: 2000 } },
  { id: 'reach_level_250', category: 'progression', name: { ua: 'Майстер Тапання', en: 'Tap Master' }, description: { ua: 'Досягни 250-го рівня', en: 'Reach level 250' }, icon: '💫', requirement: { type: 'level', target: 250 }, reward: { type: 'artifact_fragment', amount: 5, rarity: 'rare' } },
  { id: 'reach_level_500', category: 'progression', name: { ua: 'Легенда Тапання', en: 'Tap Legend' }, description: { ua: 'Досягни 500-го рівня', en: 'Reach level 500' }, icon: '🌟', requirement: { type: 'level', target: 500 }, reward: { type: 'artifact_fragment', amount: 10, rarity: 'epic' } },
  { id: 'reach_level_750', category: 'progression', name: { ua: 'Король Тапання', en: 'Tap King' }, description: { ua: 'Досягни 750-го рівня', en: 'Reach level 750' }, icon: '👑', requirement: { type: 'level', target: 750 }, reward: { type: 'artifact_fragment', amount: 15, rarity: 'epic' } },
  { id: 'reach_level_950', category: 'progression', name: { ua: 'Тапа-Олімп', en: 'Tap Olympus' }, description: { ua: 'Досягни 950-го рівня', en: 'Reach level 950' }, icon: '🏔️', requirement: { type: 'level', target: 950 }, reward: { type: 'artifact_fragment', amount: 20, rarity: 'legendary' } },
  { id: 'reach_level_999', category: 'progression', name: { ua: 'Максимум', en: 'Maximum Power' }, description: { ua: 'Досягни максимального 999-го рівня', en: 'Reach the maximum level 999' }, icon: '🚀', requirement: { type: 'level', target: 999 }, reward: { type: 'artifact_fragment', amount: 25, rarity: 'legendary' } },
];

// ============================================================================
// TAPPING ACHIEVEMENTS
// ============================================================================

const TAPPING_ACHIEVEMENTS: AchievementDef[] = [
  { id: 'tap_100', category: 'combat', name: { ua: 'Перший Тап', en: 'First Tap' }, description: { ua: 'Натисни 100 разів', en: 'Tap 100 times' }, icon: '👆', requirement: { type: 'tap_count', target: 100 }, reward: { type: 'currency', amount: 25 } },
  { id: 'tap_1000', category: 'combat', name: { ua: 'Тапа-Початківець', en: 'Tap Beginner' }, description: { ua: 'Натисни 1,000 разів', en: 'Tap 1,000 times' }, icon: '✌️', requirement: { type: 'tap_count', target: 1000 }, reward: { type: 'currency', amount: 100 } },
  { id: 'tap_10000', category: 'combat', name: { ua: 'Тапа-Марафонець', en: 'Tap Marathoner' }, description: { ua: 'Натисни 10,000 разів', en: 'Tap 10,000 times' }, icon: '🏃', requirement: { type: 'tap_count', target: 10000 }, reward: { type: 'currency', amount: 500 } },
  { id: 'tap_50000', category: 'combat', name: { ua: '50К Тапання', en: '50K Taps' }, description: { ua: 'Натисни 50,000 разів', en: 'Tap 50,000 times' }, icon: '💪', requirement: { type: 'tap_count', target: 50000 }, reward: { type: 'artifact_fragment', amount: 3, rarity: 'rare' } },
  { id: 'tap_100000', category: 'combat', name: { ua: '100К Тапання', en: '100K Taps' }, description: { ua: 'Натисни 100,000 разів', en: 'Tap 100,000 times' }, icon: '🔥', requirement: { type: 'tap_count', target: 100000 }, reward: { type: 'artifact_fragment', amount: 5, rarity: 'rare' } },
  { id: 'tap_500000', category: 'combat', name: { ua: '500К Тапання', en: '500K Taps' }, description: { ua: 'Натисни 500,000 разів', en: 'Tap 500,000 times' }, icon: '⚡', requirement: { type: 'tap_count', target: 500000 }, reward: { type: 'artifact_fragment', amount: 8, rarity: 'epic' } },
  { id: 'tap_1m', category: 'combat', name: { ua: 'Мільйон Тапів', en: 'Million Taps' }, description: { ua: 'Натисни 1,000,000 разів', en: 'Tap 1,000,000 times' }, icon: '🎯', requirement: { type: 'tap_count', target: 1000000 }, reward: { type: 'artifact_fragment', amount: 10, rarity: 'epic' } },
  { id: 'tap_5m', category: 'combat', name: { ua: '5Мільйонів Тапів', en: '5 Million Taps' }, description: { ua: 'Натисни 5,000,000 разів', en: 'Tap 5,000,000 times' }, icon: '💎', requirement: { type: 'tap_count', target: 5000000 }, reward: { type: 'artifact_fragment', amount: 15, rarity: 'epic' } },
  { id: 'tap_10m', category: 'combat', name: { ua: 'Тапа-Легенда', en: 'Tap Legend' }, description: { ua: 'Натисни 10,000,000 разів', en: 'Tap 10,000,000 times' }, icon: '🌟', requirement: { type: 'tap_count', target: 10000000 }, reward: { type: 'artifact_fragment', amount: 20, rarity: 'legendary' } },
  { id: 'tap_50m', category: 'combat', name: { ua: 'Тапа-Бог', en: 'Tap God' }, description: { ua: 'Натисни 50,000,000 разів', en: 'Tap 50,000,000 times' }, icon: '🙏', requirement: { type: 'tap_count', target: 50000000 }, reward: { type: 'artifact_fragment', amount: 30, rarity: 'legendary' }, isSecret: true },
];

// ============================================================================
// TAP POWER UPGRADE ACHIEVEMENTS
// ============================================================================

const TAP_POWER_ACHIEVEMENTS: AchievementDef[] = [
  { id: 'tap_power_5', category: 'combat', name: { ua: 'Легкий Удар', en: 'Light Tap' }, description: { ua: 'Покращи силу тапу до 5', en: 'Upgrade tap power to 5' }, icon: '✏️', requirement: { type: 'tap_power', target: 5 }, reward: { type: 'currency', amount: 500 } },
  { id: 'tap_power_10', category: 'combat', name: { ua: 'Сила Удару', en: 'Punch Power' }, description: { ua: 'Покращи силу тапу до 10', en: 'Upgrade tap power to 10' }, icon: '⚡', requirement: { type: 'tap_power', target: 10 }, reward: { type: 'currency', amount: 1500 } },
  { id: 'tap_power_25', category: 'combat', name: { ua: 'Мега-Тап', en: 'Mega Tap' }, description: { ua: 'Покращи силу тапу до 25', en: 'Upgrade tap power to 25' }, icon: '⚡⚡', requirement: { type: 'tap_power', target: 25 }, reward: { type: 'artifact_fragment', amount: 3, rarity: 'rare' } },
  { id: 'tap_power_50', category: 'combat', name: { ua: 'Гіга-Тап', en: 'Giga Tap' }, description: { ua: 'Покращи силу тапу до 50', en: 'Upgrade tap power to 50' }, icon: '⚡⚡⚡', requirement: { type: 'tap_power', target: 50 }, reward: { type: 'artifact_fragment', amount: 5, rarity: 'epic' } },
  { id: 'tap_power_100', category: 'combat', name: { ua: 'Тера-Тап', en: 'Tera Tap' }, description: { ua: 'Покращи силу тапу до 100', en: 'Upgrade tap power to 100' }, icon: '💥', requirement: { type: 'tap_power', target: 100 }, reward: { type: 'artifact_fragment', amount: 10, rarity: 'epic' } },
  { id: 'tap_power_250', category: 'combat', name: { ua: 'Пета-Тап', en: 'Peta Tap' }, description: { ua: 'Покращи силу тапу до 250', en: 'Upgrade tap power to 250' }, icon: '💫', requirement: { type: 'tap_power', target: 250 }, reward: { type: 'artifact_fragment', amount: 15, rarity: 'legendary' } },
];

// ============================================================================
// UKRAINIAN EPOCH COMPLETION ACHIEVEMENTS
// ============================================================================

const UKRAINIAN_EPOCH_ACHIEVEMENTS: AchievementDef[] = [
  { id: 'epoch_trypillia', category: 'progression', name: { ua: 'Трипілля', en: 'Trypillia' }, description: { ua: 'Пройди епоху Трипілля', en: 'Complete Trypillia epoch' }, icon: '🏺', requirement: { type: 'epoch_complete', target: 1 }, reward: { type: 'currency', amount: 200 } },
  { id: 'epoch_scythia', category: 'progression', name: { ua: 'Скіфія', en: 'Scythia' }, description: { ua: 'Пройди епоху скіфів', en: 'Complete Scythia epoch' }, icon: '⚔️', requirement: { type: 'epoch_complete', target: 2 }, reward: { type: 'currency', amount: 400 } },
  { id: 'epoch_antiquity', category: 'progression', name: { ua: 'Античність', en: 'Antiquity' }, description: { ua: 'Пройди епоху античності', en: 'Complete Antiquity epoch' }, icon: '🏛️', requirement: { type: 'epoch_complete', target: 3 }, reward: { type: 'currency', amount: 600 } },
  { id: 'epoch_kyiv_rus', category: 'progression', name: { ua: 'Київська Русь', en: 'Kyiv Rus' }, description: { ua: 'Пройди епоху Київської Русі', en: 'Complete Kyiv Rus epoch' }, icon: '⛪', requirement: { type: 'epoch_complete', target: 4 }, reward: { type: 'artifact_fragment', amount: 3, rarity: 'common' } },
  { id: 'epoch_halych', category: 'progression', name: { ua: 'Галицько-Волинська', en: 'Halych-Volynia' }, description: { ua: 'Пройди епоху Галицько-Волинської держави', en: 'Complete Halych-Volynia epoch' }, icon: '🛡️', requirement: { type: 'epoch_complete', target: 5 }, reward: { type: 'artifact_fragment', amount: 3, rarity: 'common' } },
  { id: 'epoch_polish_lithuanian', category: 'progression', name: { ua: 'Русь Унійна', en: 'Union Rus' }, description: { ua: 'Пройди епоху Польсько-Литовської доби', en: 'Complete Polish-Lithuanian epoch' }, icon: '🗼', requirement: { type: 'epoch_complete', target: 6 }, reward: { type: 'artifact_fragment', amount: 4, rarity: 'rare' } },
  { id: 'epoch_cossack', category: 'progression', name: { ua: 'Козацтво', en: 'Cossack Era' }, description: { ua: 'Пройди епоху козацтва', en: 'Complete Cossack era' }, icon: '🗡️', requirement: { type: 'epoch_complete', target: 7 }, reward: { type: 'artifact_fragment', amount: 5, rarity: 'rare' } },
  { id: 'epoch_hetmanate', category: 'progression', name: { ua: 'Гетьманщина', en: 'Hetmanate' }, description: { ua: 'Пройди епоху Гетьманщини', en: 'Complete Hetmanate epoch' }, icon: '🎖️', requirement: { type: 'epoch_complete', target: 8 }, reward: { type: 'artifact_fragment', amount: 5, rarity: 'rare' } },
  { id: 'epoch_empire', category: 'progression', name: { ua: 'Російська Імперія', en: 'Russian Empire' }, description: { ua: 'Пройди епоху Російської Імперії', en: 'Complete Imperial epoch' }, icon: '🏰', requirement: { type: 'epoch_complete', target: 9 }, reward: { type: 'artifact_fragment', amount: 6, rarity: 'epic' } },
  { id: 'epoch_revolution', category: 'progression', name: { ua: 'Революція', en: 'Revolution' }, description: { ua: 'Пройди епоху Революції', en: 'Complete Revolution epoch' }, icon: '🔴', requirement: { type: 'epoch_complete', target: 10 }, reward: { type: 'artifact_fragment', amount: 8, rarity: 'epic' } },
  { id: 'epoch_soviet', category: 'progression', name: { ua: 'Радянська Доба', en: 'Soviet Era' }, description: { ua: 'Пройди епоху Радянського Союзу', en: 'Complete Soviet epoch' }, icon: '⭐', requirement: { type: 'epoch_complete', target: 11 }, reward: { type: 'artifact_fragment', amount: 10, rarity: 'epic' } },
  { id: 'epoch_independence', category: 'progression', name: { ua: 'Незалежність', en: 'Independence' }, description: { ua: 'Пройди епоху Незалежності', en: 'Complete Independence epoch' }, icon: '🇺🇦', requirement: { type: 'epoch_complete', target: 12 }, reward: { type: 'artifact_fragment', amount: 15, rarity: 'legendary' } },
  { id: 'all_ua_epochs', category: 'progression', name: { ua: 'Історіограф', en: 'Historiographer' }, description: { ua: 'Пройди всі 12 українських епох', en: 'Complete all 12 Ukrainian epochs' }, icon: '📜', requirement: { type: 'epoch_complete', target: 12, secondaryTarget: 12 }, reward: { type: 'artifact_fragment', amount: 25, rarity: 'legendary' } },
];

// ============================================================================
// WORLD EPOCH ACHIEVEMENTS
// ============================================================================

const WORLD_EPOCH_ACHIEVEMENTS: AchievementDef[] = [
  { id: 'world_epoch_egypt', category: 'progression', name: { ua: 'Стародавній Єгипет', en: 'Ancient Egypt' }, description: { ua: 'Відвідай Стародавній Єгипет', en: 'Visit Ancient Egypt epoch' }, icon: '🐫', requirement: { type: 'world_epochs_visited', target: 1 }, reward: { type: 'artifact_fragment', amount: 5, rarity: 'rare' }, prerequisites: ['first_prestige'] },
  { id: 'world_epoch_greece', category: 'progression', name: { ua: 'Стародавня Греція', en: 'Ancient Greece' }, description: { ua: 'Відвідай Стародавню Грецію', en: 'Visit Ancient Greece epoch' }, icon: '🏺', requirement: { type: 'world_epochs_visited', target: 2 }, reward: { type: 'artifact_fragment', amount: 5, rarity: 'rare' }, prerequisites: ['first_prestige'] },
  { id: 'world_epoch_rome', category: 'progression', name: { ua: 'Стародавній Рим', en: 'Ancient Rome' }, description: { ua: 'Відвідай Стародавній Рим', en: 'Visit Ancient Rome epoch' }, icon: '🦅', requirement: { type: 'world_epochs_visited', target: 3 }, reward: { type: 'artifact_fragment', amount: 5, rarity: 'rare' }, prerequisites: ['prestige_2'] },
  { id: 'world_epoch_medieval', category: 'progression', name: { ua: 'Середньовіччя', en: 'Medieval Europe' }, description: { ua: 'Відвідай Європейське Середньовіччя', en: 'Visit Medieval Europe epoch' }, icon: '🏰', requirement: { type: 'world_epochs_visited', target: 4 }, reward: { type: 'artifact_fragment', amount: 8, rarity: 'epic' }, prerequisites: ['prestige_2'] },
  { id: 'world_epoch_renaissance', category: 'progression', name: { ua: 'Ренесанс', en: 'Renaissance' }, description: { ua: 'Відвідай епоху Ренесансу', en: 'Visit Renaissance epoch' }, icon: '🎨', requirement: { type: 'world_epochs_visited', target: 5 }, reward: { type: 'artifact_fragment', amount: 8, rarity: 'epic' }, prerequisites: ['prestige_3'] },
  { id: 'world_epoch_enlightenment', category: 'progression', name: { ua: 'Просвітництво', en: 'Enlightenment' }, description: { ua: 'Відвідай епоху Просвітництва', en: 'Visit Enlightenment epoch' }, icon: '📚', requirement: { type: 'world_epochs_visited', target: 6 }, reward: { type: 'artifact_fragment', amount: 10, rarity: 'epic' }, prerequisites: ['prestige_3'] },
  { id: 'world_epoch_victorian', category: 'progression', name: { ua: 'Вікторіанська Ера', en: 'Victorian Era' }, description: { ua: 'Відвідай Вікторіанську епоху', en: 'Visit Victorian epoch' }, icon: '🎩', requirement: { type: 'world_epochs_visited', target: 7 }, reward: { type: 'artifact_fragment', amount: 12, rarity: 'epic' }, prerequisites: ['prestige_4'] },
  { id: 'all_world_epochs', category: 'progression', name: { ua: 'Мандрівник Часом', en: 'Time Traveler' }, description: { ua: 'Відвідай всі 8 світових епох', en: 'Visit all 8 world epochs' }, icon: '🌍', requirement: { type: 'world_epochs_visited', target: 8 }, reward: { type: 'artifact_fragment', amount: 30, rarity: 'legendary' }, prerequisites: ['prestige_5'] },
];

// ============================================================================
// PRESTIGE ACHIEVEMENTS
// ============================================================================

const PRESTIGE_ACHIEVEMENTS: AchievementDef[] = [
  { id: 'first_prestige', category: 'progression', name: { ua: 'Відродження', en: 'Rebirth' }, description: { ua: 'Здійсни своє перше відродження', en: 'Perform your first prestige' }, icon: '🔄', requirement: { type: 'prestige_count', target: 1 }, reward: { type: 'currency', amount: 5000 } },
  { id: 'prestige_2', category: 'progression', name: { ua: 'Двічі Відроджений', en: 'Twice Reborn' }, description: { ua: 'Здійсни 2 відродження', en: 'Perform 2 prestiges' }, icon: '🌱', requirement: { type: 'prestige_count', target: 2 }, reward: { type: 'artifact_fragment', amount: 5, rarity: 'rare' } },
  { id: 'prestige_3', category: 'progression', name: { ua: 'Тричі Відроджений', en: 'Thrice Reborn' }, description: { ua: 'Здійсни 3 відродження', en: 'Perform 3 prestiges' }, icon: '🌟', requirement: { type: 'prestige_count', target: 3 }, reward: { type: 'artifact_fragment', amount: 10, rarity: 'epic' } },
  { id: 'prestige_5', category: 'progression', name: { ua: 'П\'ятиразовий', en: 'Fifth Time Lucky' }, description: { ua: 'Здійсни 5 відроджень', en: 'Perform 5 prestiges' }, icon: '💎', requirement: { type: 'prestige_count', target: 5 }, reward: { type: 'artifact_fragment', amount: 15, rarity: 'epic' } },
  { id: 'prestige_10', category: 'progression', name: { ua: 'Маестро Відродження', en: 'Prestige Maestro' }, description: { ua: 'Здійсни 10 відроджень', en: 'Perform 10 prestiges' }, icon: '🎭', requirement: { type: 'prestige_count', target: 10 }, reward: { type: 'artifact_fragment', amount: 25, rarity: 'legendary' } },
  { id: 'prestige_25', category: 'progression', name: { ua: 'Вічне Коло', en: 'Eternal Cycle' }, description: { ua: 'Здійсни 25 відроджень', en: 'Perform 25 prestiges' }, icon: '☯️', requirement: { type: 'prestige_count', target: 25 }, reward: { type: 'artifact_fragment', amount: 35, rarity: 'legendary' }, isSecret: true },
];

// ============================================================================
// GENERATOR ACHIEVEMENTS
// ============================================================================

const GENERATOR_ACHIEVEMENTS: AchievementDef[] = [
  { id: 'buy_generator_1', category: 'economy', name: { ua: 'Перший Бізнес', en: 'First Business' }, description: { ua: 'Купи свій перший генератор', en: 'Purchase your first generator' }, icon: '🏪', requirement: { type: 'generators_purchased', target: 1 }, reward: { type: 'currency', amount: 100 } },
  { id: 'buy_generator_10', category: 'economy', name: { ua: 'Інвестор', en: 'Investor' }, description: { ua: 'Купи 10 генераторів', en: 'Purchase 10 generators' }, icon: '🏗️', requirement: { type: 'generators_purchased', target: 10 }, reward: { type: 'currency', amount: 500 } },
  { id: 'buy_generator_50', category: 'economy', name: { ua: 'Меценат', en: 'Patron' }, description: { ua: 'Купи 50 генераторів', en: 'Purchase 50 generators' }, icon: '🏭', requirement: { type: 'generators_purchased', target: 50 }, reward: { type: 'artifact_fragment', amount: 3, rarity: 'rare' } },
  { id: 'buy_generator_100', category: 'economy', name: { ua: 'Будівельник Імперії', en: 'Empire Builder' }, description: { ua: 'Купи 100 генераторів', en: 'Purchase 100 generators' }, icon: '🏢', requirement: { type: 'generators_purchased', target: 100 }, reward: { type: 'artifact_fragment', amount: 8, rarity: 'epic' } },
  { id: 'buy_generator_250', category: 'economy', name: { ua: 'Генеральний Директор', en: 'CEO' }, description: { ua: 'Купи 250 генераторів', en: 'Purchase 250 generators' }, icon: '🎩', requirement: { type: 'generators_purchased', target: 250 }, reward: { type: 'artifact_fragment', amount: 12, rarity: 'epic' } },
  { id: 'buy_generator_500', category: 'economy', name: { ua: 'Магнат', en: 'Magnate' }, description: { ua: 'Купи 500 генераторів', en: 'Purchase 500 generators' }, icon: '💼', requirement: { type: 'generators_purchased', target: 500 }, reward: { type: 'artifact_fragment', amount: 20, rarity: 'legendary' } },
  { id: 'buy_generator_1000', category: 'economy', name: { ua: 'Промисловий Барон', en: 'Industrial Baron' }, description: { ua: 'Купи 1000 генераторів', en: 'Purchase 1000 generators' }, icon: '👑', requirement: { type: 'generators_purchased', target: 1000 }, reward: { type: 'artifact_fragment', amount: 30, rarity: 'legendary' } },
];

// ============================================================================
// GENERATOR TYPE ACHIEVEMENTS (Own X of a specific type)
// ============================================================================

const GENERATOR_TYPE_ACHIEVEMENTS: AchievementDef[] = [
  { id: 'own_10_basic', category: 'economy', name: { ua: 'Маленький Магазин', en: 'Small Shop' }, description: { ua: 'Володій 10 базовими генераторами', en: 'Own 10 basic generators' }, icon: '🏠', requirement: { type: 'generator_type_owned', target: 10, secondaryTarget: 1 }, reward: { type: 'currency', amount: 300 } },
  { id: 'own_25_basic', category: 'economy', name: { ua: 'Мережа Магазинів', en: 'Shop Network' }, description: { ua: 'Володій 25 базовими генераторами', en: 'Own 25 basic generators' }, icon: '🏪', requirement: { type: 'generator_type_owned', target: 25, secondaryTarget: 1 }, reward: { type: 'artifact_fragment', amount: 3, rarity: 'rare' } },
  { id: 'own_10_advanced', category: 'economy', name: { ua: 'Фабрика', en: 'Factory' }, description: { ua: 'Володій 10 advanced генераторами', en: 'Own 10 advanced generators' }, icon: '🏭', requirement: { type: 'generator_type_owned', target: 10, secondaryTarget: 2 }, reward: { type: 'artifact_fragment', amount: 5, rarity: 'rare' } },
  { id: 'own_10_premium', category: 'economy', name: { ua: 'Корпорація', en: 'Corporation' }, description: { ua: 'Володій 10 premium генераторами', en: 'Own 10 premium generators' }, icon: '🏢', requirement: { type: 'generator_type_owned', target: 10, secondaryTarget: 3 }, reward: { type: 'artifact_fragment', amount: 8, rarity: 'epic' } },
];

// ============================================================================
// COLLECTION / ARTIFACT ACHIEVEMENTS
// ============================================================================

const COLLECTION_ACHIEVEMENTS: AchievementDef[] = [
  { id: 'collect_5_artifacts', category: 'collection', name: { ua: 'Початок Колекції', en: 'Collection Start' }, description: { ua: 'Збери 5 артефактів', en: 'Collect 5 artifacts' }, icon: '📦', requirement: { type: 'artifact_collected', target: 5 }, reward: { type: 'currency', amount: 500 } },
  { id: 'collect_10_artifacts', category: 'collection', name: { ua: 'Колекціонер', en: 'Collector' }, description: { ua: 'Збери 10 артефактів', en: 'Collect 10 artifacts' }, icon: '🗃️', requirement: { type: 'artifact_collected', target: 10 }, reward: { type: 'currency', amount: 1500 } },
  { id: 'collect_25_artifacts', category: 'collection', name: { ua: 'Архівіст', en: 'Archivist' }, description: { ua: 'Збери 25 артефактів', en: 'Collect 25 artifacts' }, icon: '📚', requirement: { type: 'artifact_collected', target: 25 }, reward: { type: 'artifact_fragment', amount: 5, rarity: 'rare' } },
  { id: 'collect_50_artifacts', category: 'collection', name: { ua: 'Музейний Зберігач', en: 'Museum Keeper' }, description: { ua: 'Збери 50 артефактів', en: 'Collect 50 artifacts' }, icon: '🏛️', requirement: { type: 'artifact_collected', target: 50 }, reward: { type: 'artifact_fragment', amount: 10, rarity: 'epic' } },
  { id: 'collect_100_artifacts', category: 'collection', name: { ua: 'Маестро Колекції', en: 'Collection Maestro' }, description: { ua: 'Збери 100 артефактів', en: 'Collect 100 artifacts' }, icon: '👑', requirement: { type: 'artifact_collected', target: 100 }, reward: { type: 'artifact_fragment', amount: 20, rarity: 'legendary' } },
  { id: 'epoch_artifacts_1', category: 'collection', name: { ua: 'Повний Набір', en: 'Complete Set' }, description: { ua: 'Збери всі артефакти однієї епохи', en: 'Collect all artifacts from one epoch' }, icon: '✅', requirement: { type: 'epoch_artifacts_complete', target: 1 }, reward: { type: 'artifact_fragment', amount: 5, rarity: 'rare' } },
  { id: 'epoch_artifacts_3', category: 'collection', name: { ua: 'Колекціонер Епох', en: 'Epoch Collector' }, description: { ua: 'Збери всі артефакти 3 епох', en: 'Collect all artifacts from 3 epochs' }, icon: '🎖️', requirement: { type: 'epoch_artifacts_complete', target: 3 }, reward: { type: 'artifact_fragment', amount: 10, rarity: 'epic' } },
  { id: 'legendary_artifact', category: 'collection', name: { ua: 'Рідкісна Знахідка', en: 'Rare Find' }, description: { ua: 'Отримай легендарний артефакт', en: 'Obtain a legendary artifact' }, icon: '🌟', requirement: { type: 'rarity_collected', target: 1, secondaryTarget: 4 }, reward: { type: 'artifact_fragment', amount: 10, rarity: 'legendary' } },
  { id: 'secret_artifact', category: 'collection', name: { ua: 'Таємниця Розкрита', en: 'Secret Revealed' }, description: { ua: 'Отримай секретний артефакт', en: 'Obtain a secret artifact' }, icon: '🔮', requirement: { type: 'rarity_collected', target: 1, secondaryTarget: 5 }, reward: { type: 'artifact_fragment', amount: 15, rarity: 'legendary' }, isSecret: true },
  { id: 'artifact_max_level', category: 'collection', name: { ua: 'Вдосконалення', en: 'Perfection' }, description: { ua: 'Максимально покращи один артефакт', en: 'Max level one artifact' }, icon: '⬆️', requirement: { type: 'artifact_max_level', target: 1 }, reward: { type: 'artifact_fragment', amount: 5, rarity: 'epic' } },
  { id: 'artifact_master', category: 'collection', name: { ua: 'Майстер Артефактів', en: 'Artifact Master' }, description: { ua: 'Максимально покращи 5 артефактів', en: 'Max level 5 artifacts' }, icon: '🏆', requirement: { type: 'artifact_max_level', target: 5 }, reward: { type: 'artifact_fragment', amount: 15, rarity: 'legendary' } },
];

// ============================================================================
// GACHA / CHEST ACHIEVEMENTS
// ============================================================================

const GACHA_ACHIEVEMENTS: AchievementDef[] = [
  { id: 'first_gacha', category: 'special', name: { ua: 'Удача Починається', en: 'Fortune Begins' }, description: { ua: 'Відкрий свою першу скриню', en: 'Open your first chest' }, icon: '🎁', requirement: { type: 'gacha_opened', target: 1 }, reward: { type: 'currency', amount: 50 } },
  { id: 'gacha_10', category: 'special', name: { ua: 'Шукач Удачі', en: 'Luck Seeker' }, description: { ua: 'Відкрий 10 скринь', en: 'Open 10 chests' }, icon: '🎰', requirement: { type: 'gacha_opened', target: 10 }, reward: { type: 'currency', amount: 200 } },
  { id: 'gacha_50', category: 'special', name: { ua: 'Шукач Скарбів', en: 'Treasure Hunter' }, description: { ua: 'Відкрий 50 скринь', en: 'Open 50 chests' }, icon: '💎', requirement: { type: 'gacha_opened', target: 50 }, reward: { type: 'artifact_fragment', amount: 5, rarity: 'rare' } },
  { id: 'gacha_100', category: 'special', name: { ua: 'Команда Скарбів', en: 'Treasure Team' }, description: { ua: 'Відкрий 100 скринь', en: 'Open 100 chests' }, icon: '💰', requirement: { type: 'gacha_opened', target: 100 }, reward: { type: 'artifact_fragment', amount: 8, rarity: 'rare' } },
  { id: 'gacha_250', category: 'special', name: { ua: 'Грабунковий Барон', en: 'Plundering Baron' }, description: { ua: 'Відкрий 250 скринь', en: 'Open 250 chests' }, icon: '🏰', requirement: { type: 'gacha_opened', target: 250 }, reward: { type: 'artifact_fragment', amount: 12, rarity: 'epic' } },
  { id: 'gacha_500', category: 'special', name: { ua: 'Король Скарбів', en: 'Treasure King' }, description: { ua: 'Відкрий 500 скринь', en: 'Open 500 chests' }, icon: '👑', requirement: { type: 'gacha_opened', target: 500 }, reward: { type: 'artifact_fragment', amount: 20, rarity: 'legendary' } },
  { id: 'gacha_legendary', category: 'special', name: { ua: 'Легендарна Удача', en: 'Legendary Luck' }, description: { ua: 'Отримай легендарний предмет з гачі', en: 'Get a legendary item from gacha' }, icon: '🍀', requirement: { type: 'gacha_legendary', target: 1 }, reward: { type: 'artifact_fragment', amount: 15, rarity: 'legendary' } },
];

// ============================================================================
// ENGAGEMENT / STREAK ACHIEVEMENTS
// ============================================================================

const ENGAGEMENT_ACHIEVEMENTS: AchievementDef[] = [
  { id: 'streak_3', category: 'engagement', name: { ua: 'Початок Шляху', en: 'Getting Started' }, description: { ua: 'Триденна серія входів', en: '3-day login streak' }, icon: '🔥', requirement: { type: 'streak_days', target: 3 }, reward: { type: 'currency', amount: 200 } },
  { id: 'streak_7', category: 'engagement', name: { ua: 'Тиждень Відданості', en: 'Week of Dedication' }, description: { ua: 'Семиденна серія входів', en: '7-day login streak' }, icon: '🔥', requirement: { type: 'streak_days', target: 7 }, reward: { type: 'currency', amount: 800 } },
  { id: 'streak_14', category: 'engagement', name: { ua: 'Два Тижні', en: 'Two Weeks Strong' }, description: { ua: '14-денна серія входів', en: '14-day login streak' }, icon: '🔥', requirement: { type: 'streak_days', target: 14 }, reward: { type: 'artifact_fragment', amount: 5, rarity: 'rare' } },
  { id: 'streak_30', category: 'engagement', name: { ua: 'Місяць Безперервно', en: 'Month Unbroken' }, description: { ua: '30-денна серія входів', en: '30-day login streak' }, icon: '🔥', requirement: { type: 'streak_days', target: 30 }, reward: { type: 'artifact_fragment', amount: 10, rarity: 'epic' } },
  { id: 'streak_60', category: 'engagement', name: { ua: 'Два Місяці', en: 'Two Months Strong' }, description: { ua: '60-денна серія входів', en: '60-day login streak' }, icon: '🔥', requirement: { type: 'streak_days', target: 60 }, reward: { type: 'artifact_fragment', amount: 15, rarity: 'epic' } },
  { id: 'streak_100', category: 'engagement', name: { ua: 'Сторіччя', en: 'Century' }, description: { ua: '100-денна серія входів', en: '100-day login streak' }, icon: '💯', requirement: { type: 'streak_days', target: 100 }, reward: { type: 'artifact_fragment', amount: 25, rarity: 'legendary' } },
  { id: 'streak_365', category: 'engagement', name: { ua: 'Річниця', en: 'Anniversary' }, description: { ua: '365-денна серія входів', en: '365-day login streak' }, icon: '🎊', requirement: { type: 'streak_days', target: 365 }, reward: { type: 'artifact_fragment', amount: 50, rarity: 'legendary' }, isSecret: true },
  { id: 'daily_checkin_7', category: 'engagement', name: { ua: 'Тиждень Нагород', en: 'Reward Week' }, description: { ua: 'Отримай 7 щоденних нагород', en: 'Claim 7 daily check-in rewards' }, icon: '📅', requirement: { type: 'daily_checkin_count', target: 7 }, reward: { type: 'gacha_ticket', amount: 1 } },
  { id: 'daily_checkin_30', category: 'engagement', name: { ua: 'Місяць Нагород', en: 'Reward Month' }, description: { ua: 'Отримай 30 щоденних нагород', en: 'Claim 30 daily check-in rewards' }, icon: '📅', requirement: { type: 'daily_checkin_count', target: 30 }, reward: { type: 'artifact_fragment', amount: 10, rarity: 'rare' } },
  { id: 'daily_checkin_100', category: 'engagement', name: { ua: 'Сто Днів Нагород', en: 'Hundred Reward Days' }, description: { ua: 'Отримай 100 щоденних нагород', en: 'Claim 100 daily check-in rewards' }, icon: '🏆', requirement: { type: 'daily_checkin_count', target: 100 }, reward: { type: 'artifact_fragment', amount: 20, rarity: 'legendary' } },
];

// ============================================================================
// SOCIAL ACHIEVEMENTS
// ============================================================================

const SOCIAL_ACHIEVEMENTS: AchievementDef[] = [
  { id: 'first_referral', category: 'social', name: { ua: 'Перший Друг', en: 'First Friend' }, description: { ua: 'Запроси одного друга', en: 'Refer one friend' }, icon: '👤', requirement: { type: 'referral_count', target: 1 }, reward: { type: 'currency', amount: 500 } },
  { id: 'referral_5', category: 'social', name: { ua: 'Друзі', en: 'Social Butterfly' }, description: { ua: 'Запроси 5 друзів', en: 'Refer 5 friends' }, icon: '👥', requirement: { type: 'referral_count', target: 5 }, reward: { type: 'artifact_fragment', amount: 5, rarity: 'rare' } },
  { id: 'referral_10', category: 'social', name: { ua: 'Компанія Друзів', en: 'Circle of Friends' }, description: { ua: 'Запроси 10 друзів', en: 'Refer 10 friends' }, icon: '🎉', requirement: { type: 'referral_count', target: 10 }, reward: { type: 'artifact_fragment', amount: 8, rarity: 'epic' } },
  { id: 'referral_25', category: 'social', name: { ua: 'Амбасадор', en: 'Ambassador' }, description: { ua: 'Запроси 25 друзів', en: 'Refer 25 friends' }, icon: '🎖️', requirement: { type: 'referral_count', target: 25 }, reward: { type: 'artifact_fragment', amount: 15, rarity: 'epic' } },
  { id: 'referral_50', category: 'social', name: { ua: 'Мережевий Лідер', en: 'Network Leader' }, description: { ua: 'Запроси 50 друзів', en: 'Refer 50 friends' }, icon: '🌟', requirement: { type: 'referral_count', target: 50 }, reward: { type: 'artifact_fragment', amount: 20, rarity: 'legendary' } },
  { id: 'referral_100', category: 'social', name: { ua: 'Легендарний Амбасадор', en: 'Legendary Ambassador' }, description: { ua: 'Запроси 100 друзів', en: 'Refer 100 friends' }, icon: '🏅', requirement: { type: 'referral_count', target: 100 }, reward: { type: 'artifact_fragment', amount: 30, rarity: 'legendary' } },
  { id: 'share_game', category: 'social', name: { ua: 'Поширювач', en: 'Spreader' }, description: { ua: 'Поділися грою з друзями', en: 'Share the game with friends' }, icon: '📤', requirement: { type: 'share_count', target: 1 }, reward: { type: 'currency', amount: 100 } },
  { id: 'share_game_10', category: 'social', name: { ua: 'Вірусний', en: 'Viral' }, description: { ua: 'Поділися грою 10 разів', en: 'Share the game 10 times' }, icon: '🦠', requirement: { type: 'share_count', target: 10 }, reward: { type: 'artifact_fragment', amount: 5, rarity: 'rare' } },
  { id: 'leaderboard_top_100', category: 'social', name: { ua: 'Топ 100', en: 'Top 100' }, description: { ua: 'Потрап у топ-100 таблиці лідерів', en: 'Reach top 100 on leaderboard' }, icon: '🏆', requirement: { type: 'leaderboard_rank', target: 100 }, reward: { type: 'artifact_fragment', amount: 10, rarity: 'rare' } },
  { id: 'leaderboard_top_10', category: 'social', name: { ua: 'Топ 10', en: 'Top 10' }, description: { ua: 'Потрап у топ-10 таблиці лідерів', en: 'Reach top 10 on leaderboard' }, icon: '🥇', requirement: { type: 'leaderboard_rank', target: 10 }, reward: { type: 'artifact_fragment', amount: 15, rarity: 'epic' } },
  { id: 'leaderboard_1', category: 'social', name: { ua: 'Перший', en: 'Number One' }, description: { ua: 'Посідай перше місце в таблиці лідерів', en: 'Reach #1 on leaderboard' }, icon: '👑', requirement: { type: 'leaderboard_rank', target: 1 }, reward: { type: 'artifact_fragment', amount: 30, rarity: 'legendary' }, isSecret: true },
];

// ============================================================================
// ECONOMY ACHIEVEMENTS
// ============================================================================

const ECONOMY_ACHIEVEMENTS: AchievementDef[] = [
  { id: 'earn_10k', category: 'economy', name: { ua: 'Перші Заощадження', en: 'First Savings' }, description: { ua: 'Зароби 10,000 валюти всього', en: 'Earn 10,000 total currency' }, icon: '💵', requirement: { type: 'total_currency_earned', target: 10000 }, reward: { type: 'currency', amount: 100 } },
  { id: 'earn_100k', category: 'economy', name: { ua: 'Перші Гроші', en: 'First Earnings' }, description: { ua: 'Зароби 100,000 валюти всього', en: 'Earn 100,000 total currency' }, icon: '💰', requirement: { type: 'total_currency_earned', target: 100000 }, reward: { type: 'currency', amount: 500 } },
  { id: 'earn_1m', category: 'economy', name: { ua: 'Мільйонер', en: 'Millionaire' }, description: { ua: 'Зароби 1,000,000 валюти всього', en: 'Earn 1,000,000 total currency' }, icon: '💎', requirement: { type: 'total_currency_earned', target: 1000000 }, reward: { type: 'artifact_fragment', amount: 5, rarity: 'rare' } },
  { id: 'earn_10m', category: 'economy', name: { ua: 'Банкір', en: 'Banker' }, description: { ua: 'Зароби 10,000,000 валюти всього', en: 'Earn 10,000,000 total currency' }, icon: '🏦', requirement: { type: 'total_currency_earned', target: 10000000 }, reward: { type: 'artifact_fragment', amount: 10, rarity: 'epic' } },
  { id: 'earn_100m', category: 'economy', name: { ua: 'Економічний Титан', en: 'Economic Titan' }, description: { ua: 'Зароби 100,000,000 валюти всього', en: 'Earn 100,000,000 total currency' }, icon: '💫', requirement: { type: 'total_currency_earned', target: 100000000 }, reward: { type: 'artifact_fragment', amount: 20, rarity: 'legendary' } },
  { id: 'earn_1b', category: 'economy', name: { ua: 'Біліардник', en: 'Billionaire' }, description: { ua: 'Зароби 1,000,000,000 валюти всього', en: 'Earn 1,000,000,000 total currency' }, icon: '🌍', requirement: { type: 'total_currency_earned', target: 1000000000 }, reward: { type: 'artifact_fragment', amount: 30, rarity: 'legendary' } },
  { id: 'spend_50k', category: 'economy', name: { ua: 'Шалена Купівля', en: 'Shopping Spree' }, description: { ua: 'Витрать 50,000 валюти', en: 'Spend 50,000 currency' }, icon: '🛒', requirement: { type: 'currency_spent', target: 50000 }, reward: { type: 'artifact_fragment', amount: 3, rarity: 'rare' } },
  { id: 'spend_500k', category: 'economy', name: { ua: 'Великий Витратник', en: 'Big Spender' }, description: { ua: 'Витрать 500,000 валюти', en: 'Spend 500,000 currency' }, icon: '💳', requirement: { type: 'currency_spent', target: 500000 }, reward: { type: 'artifact_fragment', amount: 8, rarity: 'epic' } },
];

// ============================================================================
// AD WATCHING ACHIEVEMENTS
// ============================================================================

const AD_ACHIEVEMENTS: AchievementDef[] = [
  { id: 'watch_ad_1', category: 'special', name: { ua: 'Перший Перегляд', en: 'First View' }, description: { ua: 'Подивись 1 рекламу', en: 'Watch 1 ad' }, icon: '📺', requirement: { type: 'ads_watched', target: 1 }, reward: { type: 'currency', amount: 25 } },
  { id: 'watch_ad_10', category: 'special', name: { ua: 'Рекламний Переглядач', en: 'Ad Viewer' }, description: { ua: 'Подивись 10 реклам', en: 'Watch 10 ads' }, icon: '📺', requirement: { type: 'ads_watched', target: 10 }, reward: { type: 'currency', amount: 200 } },
  { id: 'watch_ad_50', category: 'special', name: { ua: 'Рекламний Ентузіаст', en: 'Ad Enthusiast' }, description: { ua: 'Подивись 50 реклам', en: 'Watch 50 ads' }, icon: '📺', requirement: { type: 'ads_watched', target: 50 }, reward: { type: 'artifact_fragment', amount: 3, rarity: 'rare' } },
  { id: 'watch_ad_100', category: 'special', name: { ua: 'Рекламний Фанатик', en: 'Ad Fanatic' }, description: { ua: 'Подивись 100 реклам', en: 'Watch 100 ads' }, icon: '📺', requirement: { type: 'ads_watched', target: 100 }, reward: { type: 'artifact_fragment', amount: 5, rarity: 'rare' } },
  { id: 'watch_ad_500', category: 'special', name: { ua: 'Рекламна Легенда', en: 'Ad Legend' }, description: { ua: 'Подивись 500 реклам', en: 'Watch 500 ads' }, icon: '🏆', requirement: { type: 'ads_watched', target: 500 }, reward: { type: 'artifact_fragment', amount: 15, rarity: 'legendary' } },
];

// ============================================================================
// SPECIAL / EASTER EGG ACHIEVEMENTS
// ============================================================================

const SPECIAL_ACHIEVEMENTS: AchievementDef[] = [
  { id: 'sit_studio_complete', category: 'special', name: { ua: '???', en: '???' }, description: { ua: 'Знайди всі секретні літери', en: 'Find all secret letters' }, icon: '❓', requirement: { type: 'sit_studio_complete', target: 1 }, reward: { type: 'xp', amount: 99999 }, isSecret: true },
  { id: 'first_energy_empty', category: 'special', name: { ua: 'Вчіться на Помилках', en: 'Learn From Mistakes' }, description: { ua: 'Дозволь енергії закінчитися', en: 'Let your energy run out' }, icon: '🔋', requirement: { type: 'energy_depleted', target: 1 }, reward: { type: 'currency', amount: 100 }, isSecret: true },
  { id: 'tap_100_no_energy', category: 'special', name: { ua: 'Витривалість', en: 'Endurance' }, description: { ua: 'Натисни 100 разів без енергії', en: 'Tap 100 times without energy' }, icon: '💪', requirement: { type: 'tap_no_energy', target: 100 }, reward: { type: 'artifact_fragment', amount: 3, rarity: 'rare' }, isSecret: true },
  { id: 'offline_earnings_1m', category: 'special', name: { ua: 'Офлайн Заробіток', en: 'Offline Earner' }, description: { ua: 'Зароби 1М офлайн', en: 'Earn 1M offline' }, icon: '🌙', requirement: { type: 'offline_earnings', target: 1000000 }, reward: { type: 'artifact_fragment', amount: 5, rarity: 'rare' } },
  { id: 'all_achievements_visible', category: 'special', name: { ua: 'Шукач Досягнень', en: 'Achievement Hunter' }, description: { ua: 'Відкрий всі досягнення', en: 'Reveal all achievements' }, icon: '🔍', requirement: { type: 'achievements_revealed', target: 60 }, reward: { type: 'artifact_fragment', amount: 10, rarity: 'legendary' }, isSecret: true },
];

// ============================================================================
// LIMITED TIME ACHIEVEMENTS (Events)
// ============================================================================

const LIMITED_TIME_ACHIEVEMENTS: AchievementDef[] = [
  { id: 'summer_2026_active', category: 'special', name: { ua: '☀️ Літній Учасник', en: '☀️ Summer Participant' }, description: { ua: 'Беріть участь у Літньому марафоні 2026', en: 'Participate in Summer Marathon 2026' }, icon: '☀️', requirement: { type: 'event_participation', target: 1, secondaryTarget: 1 }, reward: { type: 'cosmetic', cosmeticId: 'summer_badge_2026' }, limitedTime: { startDate: '2026-06-01T00:00:00Z', endDate: '2026-08-31T23:59:59Z' } },
  { id: 'independence_2026', category: 'special', name: { ua: '🇺🇦 Патріот', en: '🇺🇦 Patriot' }, description: { ua: 'Святкуй День Незалежності 2026', en: 'Celebrate Independence Day 2026' }, icon: '🇺🇦', requirement: { type: 'event_participation', target: 1, secondaryTarget: 2 }, reward: { type: 'cosmetic', cosmeticId: 'independence_badge_2026' }, limitedTime: { startDate: '2026-08-22T00:00:00Z', endDate: '2026-08-25T23:59:59Z' } },
];

// ============================================================================
// ACHIEVEMENT REGISTRY
// ============================================================================

export const ALL_ACHIEVEMENTS: AchievementDef[] = [
  ...LEVELING_ACHIEVEMENTS,
  ...TAPPING_ACHIEVEMENTS,
  ...TAP_POWER_ACHIEVEMENTS,
  ...UKRAINIAN_EPOCH_ACHIEVEMENTS,
  ...WORLD_EPOCH_ACHIEVEMENTS,
  ...PRESTIGE_ACHIEVEMENTS,
  ...GENERATOR_ACHIEVEMENTS,
  ...GENERATOR_TYPE_ACHIEVEMENTS,
  ...COLLECTION_ACHIEVEMENTS,
  ...GACHA_ACHIEVEMENTS,
  ...ENGAGEMENT_ACHIEVEMENTS,
  ...SOCIAL_ACHIEVEMENTS,
  ...ECONOMY_ACHIEVEMENTS,
  ...AD_ACHIEVEMENTS,
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
