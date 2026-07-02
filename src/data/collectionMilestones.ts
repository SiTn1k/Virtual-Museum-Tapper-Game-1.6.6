/**
 * Virtual Museum Tapper Game — Collection Milestones Data
 * Progress rewards for completing collections
 */

import type {
  CollectionMilestone,
} from '../types/liveops';

// ============================================================================
// ARTIFACT COLLECTION MILESTONES
// ============================================================================

const ARTIFACT_MILESTONES: CollectionMilestone[] = [
  {
    id: 'artifacts_5',
    name: { ua: 'Початківець Колекціонер', en: 'Beginner Collector' },
    description: { ua: 'Збери 5 артефактів', en: 'Collect 5 artifacts' },
    collectionType: 'artifact',
    target: 5,
    reward: { type: 'currency', amount: 500 },
    icon: '🗃️',
    tier: 1,
  },
  {
    id: 'artifacts_10',
    name: { ua: 'Колекціонер', en: 'Collector' },
    description: { ua: 'Збери 10 артефактів', en: 'Collect 10 artifacts' },
    collectionType: 'artifact',
    target: 10,
    reward: { type: 'artifact_fragment', amount: 3, rarity: 'rare' },
    icon: '🗃️',
    tier: 2,
  },
  {
    id: 'artifacts_25',
    name: { ua: 'Захоплений Колекціонер', en: 'Avid Collector' },
    description: { ua: 'Збери 25 артефактів', en: 'Collect 25 artifacts' },
    collectionType: 'artifact',
    target: 25,
    reward: { type: 'artifact_fragment', amount: 5, rarity: 'epic' },
    icon: '📚',
    tier: 3,
  },
  {
    id: 'artifacts_50',
    name: { ua: 'Музейний Зберігач', en: 'Museum Keeper' },
    description: { ua: 'Збери 50 артефактів', en: 'Collect 50 artifacts' },
    collectionType: 'artifact',
    target: 50,
    reward: { type: 'artifact_fragment', amount: 10, rarity: 'legendary' },
    icon: '🏛️',
    tier: 4,
  },
  {
    id: 'artifacts_100',
    name: { ua: 'Великий Колекціонер', en: 'Grand Collector' },
    description: { ua: 'Збери 100 артефактів', en: 'Collect 100 artifacts' },
    collectionType: 'artifact',
    target: 100,
    reward: { type: 'artifact_fragment', amount: 20, rarity: 'legendary' },
    icon: '👑',
    tier: 5,
  },
];

// ============================================================================
// EPOCH COLLECTION MILESTONES
// ============================================================================

const EPOCH_MILESTONES: CollectionMilestone[] = [
  {
    id: 'epochs_3',
    name: { ua: 'Мандрівник', en: 'Explorer' },
    description: { ua: 'Відвідай 3 епохи', en: 'Visit 3 epochs' },
    collectionType: 'epoch',
    target: 3,
    reward: { type: 'currency', amount: 300 },
    icon: '🗺️',
    tier: 1,
  },
  {
    id: 'epochs_6',
    name: { ua: 'Дослідник', en: 'Adventurer' },
    description: { ua: 'Відвідай 6 епох', en: 'Visit 6 epochs' },
    collectionType: 'epoch',
    target: 6,
    reward: { type: 'currency', amount: 800 },
    icon: '🧭',
    tier: 2,
  },
  {
    id: 'epochs_9',
    name: { ua: 'Історіограф', en: 'Historian' },
    description: { ua: 'Відвідай 9 епох', en: 'Visit 9 epochs' },
    collectionType: 'epoch',
    target: 9,
    reward: { type: 'artifact_fragment', amount: 5, rarity: 'rare' },
    icon: '📜',
    tier: 3,
  },
  {
    id: 'epochs_12',
    name: { ua: 'Магістр Історії', en: 'Master of History' },
    description: { ua: 'Відвідай всі 12 українських епох', en: 'Visit all 12 Ukrainian epochs' },
    collectionType: 'epoch',
    target: 12,
    reward: { type: 'artifact_fragment', amount: 10, rarity: 'epic' },
    icon: '🎓',
    tier: 4,
  },
  {
    id: 'epochs_world',
    name: { ua: 'Мандрівник Часом', en: 'Time Traveler' },
    description: { ua: 'Відвідай світові епохи', en: 'Visit world epochs' },
    collectionType: 'epoch',
    target: 20,
    reward: { type: 'artifact_fragment', amount: 20, rarity: 'legendary' },
    icon: '🌍',
    tier: 5,
  },
];

// ============================================================================
// GENERATOR COLLECTION MILESTONES
// ============================================================================

const GENERATOR_MILESTONES: CollectionMilestone[] = [
  {
    id: 'generators_10',
    name: { ua: 'Початківець Підприємець', en: 'Startup Entrepreneur' },
    description: { ua: 'Купи 10 генераторів', en: 'Purchase 10 generators' },
    collectionType: 'generator',
    target: 10,
    reward: { type: 'currency', amount: 200 },
    icon: '🏗️',
    tier: 1,
  },
  {
    id: 'generators_50',
    name: { ua: 'Бізнесмен', en: 'Business Owner' },
    description: { ua: 'Купи 50 генераторів', en: 'Purchase 50 generators' },
    collectionType: 'generator',
    target: 50,
    reward: { type: 'currency', amount: 1000 },
    icon: '🏭',
    tier: 2,
  },
  {
    id: 'generators_100',
    name: { ua: 'Промисловець', en: 'Industrialist' },
    description: { ua: 'Купи 100 генераторів', en: 'Purchase 100 generators' },
    collectionType: 'generator',
    target: 100,
    reward: { type: 'artifact_fragment', amount: 5, rarity: 'rare' },
    icon: '⚙️',
    tier: 3,
  },
  {
    id: 'generators_250',
    name: { ua: 'Генеральний Директор', en: 'CEO' },
    description: { ua: 'Купи 250 генераторів', en: 'Purchase 250 generators' },
    collectionType: 'generator',
    target: 250,
    reward: { type: 'artifact_fragment', amount: 10, rarity: 'epic' },
    icon: '🎩',
    tier: 4,
  },
  {
    id: 'generators_500',
    name: { ua: 'Магнат', en: 'Magnate' },
    description: { ua: 'Купи 500 генераторів', en: 'Purchase 500 generators' },
    collectionType: 'generator',
    target: 500,
    reward: { type: 'artifact_fragment', amount: 20, rarity: 'legendary' },
    icon: '💎',
    tier: 5,
  },
];

// ============================================================================
// ACHIEVEMENT MILESTONES
// ============================================================================

const ACHIEVEMENT_MILESTONES: CollectionMilestone[] = [
  {
    id: 'achievements_5',
    name: { ua: 'Шукач Досягнень', en: 'Achievement Hunter' },
    description: { ua: 'Здобудь 5 досягнень', en: 'Earn 5 achievements' },
    collectionType: 'achievement',
    target: 5,
    reward: { type: 'currency', amount: 200 },
    icon: '🏅',
    tier: 1,
  },
  {
    id: 'achievements_15',
    name: { ua: 'Досягатор', en: 'Achiever' },
    description: { ua: 'Здобудь 15 досягнень', en: 'Earn 15 achievements' },
    collectionType: 'achievement',
    target: 15,
    reward: { type: 'artifact_fragment', amount: 3, rarity: 'rare' },
    icon: '🎖️',
    tier: 2,
  },
  {
    id: 'achievements_30',
    name: { ua: 'Майстер Досягнень', en: 'Achievement Master' },
    description: { ua: 'Здобудь 30 досягнень', en: 'Earn 30 achievements' },
    collectionType: 'achievement',
    target: 30,
    reward: { type: 'artifact_fragment', amount: 10, rarity: 'epic' },
    icon: '⭐',
    tier: 3,
  },
  {
    id: 'achievements_50',
    name: { ua: 'Легенда Досягнень', en: 'Achievement Legend' },
    description: { ua: 'Здобудь 50 досягнень', en: 'Earn 50 achievements' },
    collectionType: 'achievement',
    target: 50,
    reward: { type: 'artifact_fragment', amount: 15, rarity: 'legendary' },
    icon: '👑',
    tier: 4,
  },
];

// ============================================================================
// SEASON MILESTONES
// ============================================================================

const SEASON_MILESTONES: CollectionMilestone[] = [
  {
    id: 'seasons_1_complete',
    name: { ua: 'Перший Сезон', en: 'First Season' },
    description: { ua: 'Заверши перший сезон', en: 'Complete your first season' },
    collectionType: 'season',
    target: 1,
    reward: { type: 'artifact_fragment', amount: 10, rarity: 'epic' },
    icon: '🏆',
    tier: 1,
  },
  {
    id: 'seasons_3_complete',
    name: { ua: 'Сезонний Ветера', en: 'Seasoned Veteran' },
    description: { ua: 'Заверши 3 сезони', en: 'Complete 3 seasons' },
    collectionType: 'season',
    target: 3,
    reward: { type: 'artifact_fragment', amount: 20, rarity: 'legendary' },
    icon: '🎖️',
    tier: 2,
  },
  {
    id: 'seasons_5_complete',
    name: { ua: 'Сезонна Легенда', en: 'Season Legend' },
    description: { ua: 'Заверши 5 сезонів', en: 'Complete 5 seasons' },
    collectionType: 'season',
    target: 5,
    reward: { type: 'artifact_fragment', amount: 30, rarity: 'legendary' },
    icon: '👑',
    tier: 3,
  },
];

// ============================================================================
// MILESTONE REGISTRY
// ============================================================================

export const ALL_MILESTONES: CollectionMilestone[] = [
  ...ARTIFACT_MILESTONES,
  ...EPOCH_MILESTONES,
  ...GENERATOR_MILESTONES,
  ...ACHIEVEMENT_MILESTONES,
  ...SEASON_MILESTONES,
];

// Build lookup map
const MILESTONE_MAP: Record<string, CollectionMilestone> = {};
for (const m of ALL_MILESTONES) {
  MILESTONE_MAP[m.id] = m;
}
export function getMilestoneById(id: string): CollectionMilestone | undefined {
  return MILESTONE_MAP[id];
}

export function getMilestonesByType(type: CollectionMilestone['collectionType']): CollectionMilestone[] {
  return ALL_MILESTONES.filter(m => m.collectionType === type);
}

// Get current milestone progress for a collection type
export function getMilestoneProgress(
  collectionType: CollectionMilestone['collectionType'],
  currentCount: number
): { completed: CollectionMilestone[]; current: CollectionMilestone | null; next: CollectionMilestone | null } {
  const milestones = getMilestonesByType(collectionType).sort((a, b) => a.target - b.target);
  
  const completed: CollectionMilestone[] = [];
  let current: CollectionMilestone | null = null;
  let next: CollectionMilestone | null = null;
  
  for (const milestone of milestones) {
    if (currentCount >= milestone.target) {
      completed.push(milestone);
    } else if (!current) {
      current = milestone;
      const currentIndex = milestones.indexOf(milestone);
      if (currentIndex < milestones.length - 1) {
        next = milestones[currentIndex + 1];
      }
    }
  }
  
  return { completed, current, next };
}

// Get total reward from completing all milestones of a type
export function getTotalMilestoneRewards(type: CollectionMilestone['collectionType']): { currency: number; fragments: number } {
  const milestones = getMilestonesByType(type);
  let currency = 0;
  let fragments = 0;
  
  for (const m of milestones) {
    if (m.reward.type === 'currency' && m.reward.amount) {
      currency += m.reward.amount;
    }
    if (m.reward.type === 'artifact_fragment' && m.reward.amount) {
      fragments += m.reward.amount;
    }
  }
  
  return { currency, fragments };
}
