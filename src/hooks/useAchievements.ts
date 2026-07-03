/**
 * Virtual Museum Tapper Game — useAchievements Hook
 * Manages achievement tracking, progress updates, and notifications
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { ALL_ACHIEVEMENTS, getAchievementById } from '../data/achievements';
import type { AchievementDef, PlayerAchievementState, AchievementCategory } from '../types/liveops';
import type { GameState } from '../types/game';

export interface AchievementProgress {
  achievement: AchievementDef;
  state: PlayerAchievementState;
  isComplete: boolean;
  canEarn: boolean;
  progressPercent: number;
  currentValue?: number;
  targetValue?: number;
}

export interface AchievementNotification {
  achievement: AchievementDef;
  isNew: boolean;
}

interface UseAchievementsReturn {
  achievements: AchievementProgress[];
  completedCount: number;
  totalCount: number;
  recentUnlocks: AchievementNotification[];
  checkAchievements: (gameState: GameState) => AchievementNotification[];
  claimAchievement: (achievementId: string) => boolean;
  getAchievementsByCategory: (category: AchievementCategory) => AchievementProgress[];
  getNextAchievement: (category?: AchievementCategory) => AchievementProgress | null;
  clearNotification: (achievementId: string) => void;
  claimReward: (achievementId: string) => AchievementDef['reward'] | null;
  getProgress: (achievementId: string) => { current: number; target: number } | null;
}

const STORAGE_KEY = 'achievement_state';
const RECENT_UNLOCKS_MAX = 5;

// Extended GameState for tracking additional stats
interface ExtendedGameState extends GameState {
  totalTaps?: number;
  totalCurrencySpent?: number;
  totalAdsWatched?: number;
  totalGachaOpened?: number;
  totalGachaLegendary?: number;
  totalShares?: number;
  streakDays?: number;
  dailyCheckins?: number;
  generatorsOfType?: Record<number, number>;
  energyDepleted?: number;
  tapsWithoutEnergy?: number;
  offlineEarnings?: number;
  achievementsRevealed?: number;
}

// Ukrainian epochs (1-12)
const UKRAINIAN_EPOCHS = [
  'trypillia', 'scythia', 'antiquity', 'kyiv_rus', 'halych_volhynia',
  'polish_lithuanian', 'cossack', 'hetmanate', 'empire', 'revolution',
  'soviet', 'independence'
];

// World epochs (13-20)
const WORLD_EPOCHS = [
  'egypt', 'greece', 'rome', 'medieval', 'renaissance',
  'enlightenment', 'victorian', 'modern_world'
];

/**
 * Check if prerequisites are met for an achievement
 */
function checkPrerequisites(achievement: AchievementDef, completedIds: Set<string>): boolean {
  if (!achievement.prerequisites || achievement.prerequisites.length === 0) {
    return true;
  }
  return achievement.prerequisites.every(prereqId => completedIds.has(prereqId));
}

/**
 * Count completed Ukrainian epochs
 */
function countUkrainianEpochs(unlockedEpochs: string[]): number {
  return unlockedEpochs.filter(e => UKRAINIAN_EPOCHS.includes(e as typeof UKRAINIAN_EPOCHS[number])).length;
}

/**
 * Count completed world epochs
 */
function countWorldEpochs(unlockedEpochs: string[]): number {
  return unlockedEpochs.filter(e => WORLD_EPOCHS.includes(e as typeof WORLD_EPOCHS[number])).length;
}

/**
 * Count generators purchased
 */
function countGenerators(ownedGenerators: GameState['ownedGenerators']): number {
  return ownedGenerators?.reduce((sum, gen) => sum + 1, 0) || 0;
}

/**
 * Calculate achievement progress based on game state
 */
function calculateProgress(
  achievement: AchievementDef, 
  gameState: ExtendedGameState
): { progress: number; current: number; target: number } {
  const { requirement } = achievement;
  let current = 0;
  let target = requirement.target;

  switch (requirement.type) {
    case 'level':
      current = gameState.level;
      return { progress: Math.min(1, current / target), current, target };
    
    case 'tap_count':
      current = gameState.totalTaps || 0;
      return { progress: Math.min(1, current / target), current, target };
    
    case 'tap_power':
      current = gameState.tapPower;
      return { progress: Math.min(1, current / target), current, target };
    
    case 'prestige_count':
      current = gameState.prestigeLevel;
      return { progress: Math.min(1, current / target), current, target };
    
    case 'epoch_complete':
      // Count Ukrainian epochs
      current = countUkrainianEpochs(gameState.unlockedEpochs);
      return { progress: Math.min(1, current / target), current, target };
    
    case 'world_epochs_visited':
      // Count world epochs
      current = countWorldEpochs(gameState.unlockedEpochs);
      return { progress: Math.min(1, current / target), current, target };
    
    case 'artifact_collected':
      current = gameState.completedArtifacts?.length || 0;
      return { progress: Math.min(1, current / target), current, target };
    
    case 'generators_purchased':
      current = countGenerators(gameState.ownedGenerators);
      return { progress: Math.min(1, current / target), current, target };
    
    case 'generator_type_owned': {
      const typeOwned = gameState.generatorsOfType?.[requirement.secondaryTarget || 0] || 0;
      current = typeOwned;
      target = requirement.target;
      return { progress: Math.min(1, current / target), current, target };
    }
    
    case 'total_currency_earned':
      current = gameState.totalCurrencyEarned;
      return { progress: Math.min(1, current / target), current, target };
    
    case 'currency_spent':
      current = gameState.totalCurrencySpent || 0;
      return { progress: Math.min(1, current / target), current, target };
    
    case 'referral_count':
      current = gameState.referralsCount;
      return { progress: Math.min(1, current / target), current, target };
    
    case 'share_count':
      current = gameState.totalShares || 0;
      return { progress: Math.min(1, current / target), current, target };
    
    case 'streak_days':
      current = gameState.streakDays || gameState.dailyStreak;
      return { progress: Math.min(1, current / target), current, target };
    
    case 'daily_checkin_count':
      current = gameState.dailyCheckins || gameState.checkInStreak;
      return { progress: Math.min(1, current / target), current, target };
    
    case 'gacha_opened':
      current = gameState.totalGachaOpened || 0;
      return { progress: Math.min(1, current / target), current, target };
    
    case 'gacha_legendary':
      current = gameState.totalGachaLegendary || 0;
      return { progress: Math.min(1, current / target), current, target };
    
    case 'ads_watched':
      current = gameState.totalAdsWatched || 0;
      return { progress: Math.min(1, current / target), current, target };
    
    case 'leaderboard_rank':
      // This requires leaderboard API - return 0 for now
      return { progress: 0, current: 0, target };
    
    case 'epoch_artifacts_complete': {
      // Count epochs where all artifacts are collected
      const artifactLevels = gameState.artifactLevels || {};
      const collectedPerEpoch: Record<string, number> = {};
      for (const [artifactId, level] of Object.entries(artifactLevels)) {
        if (level > 0) {
          // Group by epoch prefix
          const epochKey = artifactId.split('_')[0];
          collectedPerEpoch[epochKey] = (collectedPerEpoch[epochKey] || 0) + 1;
        }
      }
      current = Object.keys(collectedPerEpoch).length;
      return { progress: Math.min(1, current / target), current, target };
    }
    
    case 'rarity_collected': {
      // secondaryTarget is rarity level (1=common, 2=rare, 3=epic, 4=legendary, 5=secret)
      const artifactLevels = gameState.artifactLevels || {};
      const requiredRarity = requirement.secondaryTarget || 4;
      // This is simplified - in reality you'd need to track rarity of each artifact
      const count = Object.values(artifactLevels).filter(l => l > 0).length;
      current = count >= requiredRarity ? 1 : 0;
      return { progress: current, current, target: 1 };
    }
    
    case 'artifact_max_level': {
      const artifactLevels = gameState.artifactLevels || {};
      current = Object.values(artifactLevels).filter(l => l >= 4).length;
      return { progress: Math.min(1, current / target), current, target };
    }
    
    case 'energy_capacity': {
      const capacityResearch = gameState.prestigeResearch?.energy_capacity || 0;
      const maxEnergy = 1000 + (capacityResearch * 100);
      current = maxEnergy;
      return { progress: Math.min(1, current / target), current, target };
    }
    
    case 'sit_studio_complete':
      current = gameState.sitStudioCompleted ? 1 : 0;
      return { progress: current, current, target: 1 };
    
    case 'energy_depleted':
      current = gameState.energyDepleted || 0;
      return { progress: Math.min(1, current / target), current, target };
    
    case 'tap_no_energy':
      current = gameState.tapsWithoutEnergy || 0;
      return { progress: Math.min(1, current / target), current, target };
    
    case 'offline_earnings':
      current = gameState.offlineEarnings || 0;
      return { progress: Math.min(1, current / target), current, target };
    
    case 'achievements_revealed':
      current = gameState.achievementsRevealed || 0;
      return { progress: Math.min(1, current / target), current, target };
    
    case 'event_participation':
      // Event participation tracked separately
      return { progress: 0, current: 0, target };
    
    default:
      return { progress: 0, current: 0, target };
  }
}

export function useAchievements(initialState?: PlayerAchievementState[]): UseAchievementsReturn {
  const [playerAchievements, setPlayerAchievements] = useState<PlayerAchievementState[]>(() => {
    if (initialState) return initialState;
    
    // Try to load from localStorage
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved) as PlayerAchievementState[];
      }
    } catch (e) {
      console.error('Failed to load achievements:', e);
    }
    
    // Initialize with empty state for all achievements
    return ALL_ACHIEVEMENTS.map(ach => ({
      id: ach.id,
      progress: 0,
      completed: false,
      notified: false,
    }));
  });
  
  const [recentUnlocks, setRecentUnlocks] = useState<AchievementNotification[]>([]);
  const completedIdsRef = useRef(new Set<string>());
  
  // Save to localStorage when state changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(playerAchievements));
    } catch (e) {
      console.error('Failed to save achievements:', e);
    }
  }, [playerAchievements]);
  
  // Update completedIdsRef when playerAchievements changes
  useEffect(() => {
    completedIdsRef.current = new Set(
      playerAchievements.filter(pa => pa.completed).map(pa => pa.id)
    );
  }, [playerAchievements]);
  
  // Build achievement progress map
  const achievementMap = new Map(
    playerAchievements.map(pa => [pa.id, pa])
  );
  
  // Calculate full achievement progress list (memoized - use game state for live updates)
  const [achievements, setAchievements] = useState<AchievementProgress[]>(() => {
    return ALL_ACHIEVEMENTS.map(achievement => {
      const state = achievementMap.get(achievement.id) || {
        id: achievement.id,
        progress: 0,
        completed: false,
        notified: false,
      };
      
      const canEarn = checkPrerequisites(achievement, completedIdsRef.current);
      const isComplete = state.completed;
      const progressPercent = isComplete ? 100 : Math.round(state.progress * 100);
      
      return {
        achievement,
        state,
        isComplete,
        canEarn,
        progressPercent,
      };
    });
  });
  
  const completedCount = playerAchievements.filter(pa => pa.completed).length;
  const totalCount = ALL_ACHIEVEMENTS.length;
  
  /**
   * Check achievements against current game state
   * Returns newly unlocked achievements
   */
  const checkAchievements = useCallback((gameState: GameState): AchievementNotification[] => {
    const newUnlocks: AchievementNotification[] = [];
    const now = new Date().toISOString();
    const extendedState = gameState as ExtendedGameState;
    
    setPlayerAchievements(prev => {
      const updated = [...prev];
      let hasChanges = false;
      
      for (const achievement of ALL_ACHIEVEMENTS) {
        // Skip if already completed
        const existingState = updated.find(s => s.id === achievement.id);
        if (existingState?.completed) continue;
        
        // Check if limited-time and currently active
        if (achievement.limitedTime) {
          const nowDate = new Date();
          const start = new Date(achievement.limitedTime.startDate);
          const end = new Date(achievement.limitedTime.endDate);
          if (nowDate < start || nowDate > end) continue;
        }
        
        // Check prerequisites
        if (!checkPrerequisites(achievement, completedIdsRef.current)) continue;
        
        // Calculate progress
        const { progress, current, target } = calculateProgress(achievement, extendedState);
        
        // Check if completed
        const isNowComplete = progress >= 1;
        
        // Update state
        const index = updated.findIndex(s => s.id === achievement.id);
        if (index >= 0) {
          const wasComplete = updated[index].completed;
          const wasNotified = updated[index].notified;
          
          updated[index] = {
            ...updated[index],
            progress: Math.max(updated[index].progress, progress),
            completed: updated[index].completed || isNowComplete,
            notified: wasNotified || (isNowComplete && !wasNotified),
            earnedAt: isNowComplete && !wasComplete ? now : updated[index].earnedAt,
          };
          
          // Check for new unlock
          if (isNowComplete && !wasNotified) {
            newUnlocks.push({
              achievement,
              isNew: true,
            });
          }
          
          if (updated[index] !== prev[index]) {
            hasChanges = true;
          }
        } else {
          // New achievement entry
          updated.push({
            id: achievement.id,
            progress,
            completed: isNowComplete,
            notified: isNowComplete,
            earnedAt: isNowComplete ? now : undefined,
          });
          hasChanges = true;
          
          if (isNowComplete) {
            newUnlocks.push({
              achievement,
              isNew: true,
            });
          }
        }
      }
      
      return hasChanges ? updated : prev;
    });
    
    // Update recent unlocks
    if (newUnlocks.length > 0) {
      setRecentUnlocks(prev => {
        const combined = [...newUnlocks, ...prev];
        return combined.slice(0, RECENT_UNLOCKS_MAX);
      });
    }
    
    return newUnlocks;
  }, []);
  
  /**
   * Claim an achievement reward (mark as acknowledged)
   */
  const claimAchievement = useCallback((achievementId: string): boolean => {
    const achievement = getAchievementById(achievementId);
    if (!achievement) return false;
    
    setPlayerAchievements(prev => {
      const index = prev.findIndex(s => s.id === achievementId);
      if (index < 0 || !prev[index].completed) return prev;
      
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        notified: true,
      };
      
      return updated;
    });
    
    // Remove from recent unlocks
    setRecentUnlocks(prev => prev.filter(u => u.achievement.id !== achievementId));
    
    return true;
  }, []);
  
  /**
   * Get achievement reward for claiming
   */
  const claimReward = useCallback((achievementId: string): AchievementDef['reward'] | null => {
    const achievement = getAchievementById(achievementId);
    if (!achievement) return null;
    
    const state = achievementMap.get(achievementId);
    if (!state?.completed) return null;
    
    return achievement.reward;
  }, []);
  
  /**
   * Get progress for a specific achievement
   */
  const getProgress = useCallback((achievementId: string): { current: number; target: number } | null => {
    const achievement = getAchievementById(achievementId);
    if (!achievement) return null;
    
    // Return target info - current progress is tracked in state
    return {
      current: 0,
      target: achievement.requirement.target,
    };
  }, []);
  
  /**
   * Get achievements filtered by category
   */
  const getAchievementsByCategory = useCallback((category: AchievementCategory): AchievementProgress[] => {
    return achievements.filter(a => a.achievement.category === category);
  }, [achievements]);
  
  /**
   * Get the next unearned achievement, optionally filtered by category
   */
  const getNextAchievement = useCallback((category?: AchievementCategory): AchievementProgress | null => {
    const filtered = category 
      ? achievements.filter(a => a.achievement.category === category && !a.isComplete && a.canEarn)
      : achievements.filter(a => !a.isComplete && a.canEarn);
    
    if (filtered.length === 0) return null;
    
    // Sort by progress (closest to complete first)
    filtered.sort((a, b) => b.progressPercent - a.progressPercent);
    
    return filtered[0];
  }, [achievements]);
  
  /**
   * Clear a notification for an achievement
   */
  const clearNotification = useCallback((achievementId: string) => {
    setRecentUnlocks(prev => prev.filter(u => u.achievement.id !== achievementId));
  }, []);
  
  return {
    achievements,
    completedCount,
    totalCount,
    recentUnlocks,
    checkAchievements,
    claimAchievement,
    claimReward,
    getAchievementsByCategory,
    getNextAchievement,
    clearNotification,
    getProgress,
  };
}

export default useAchievements;
