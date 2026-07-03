/**
 * Virtual Museum Tapper Game — useAchievements Hook
 * Manages achievement tracking, progress updates, and notifications
 */

import { useState, useCallback, useEffect } from 'react';
import { ALL_ACHIEVEMENTS, getAchievementById } from '../data/achievements';
import type { AchievementDef, PlayerAchievementState, AchievementCategory } from '../types/liveops';
import type { GameState } from '../types/game';

export interface AchievementProgress {
  achievement: AchievementDef;
  state: PlayerAchievementState;
  isComplete: boolean;
  canEarn: boolean;
  progressPercent: number;
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
}

const STORAGE_KEY = 'achievement_state';
const RECENT_UNLOCKS_MAX = 5;

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
 * Calculate achievement progress based on game state
 */
function calculateProgress(achievement: AchievementDef, gameState: GameState): number {
  const { requirement } = achievement;
  
  switch (requirement.type) {
    case 'level':
      return Math.min(1, gameState.level / requirement.target);
    
    case 'currency_earned':
      return Math.min(1, gameState.totalCurrencyEarned / requirement.target);
    
    case 'prestige_count':
      return Math.min(1, gameState.prestigeLevel / requirement.target);
    
    case 'tap_count':
      return Math.min(1, (gameState.totalXp || 0) / requirement.target);
    
    case 'epoch_complete': {
      const epochCount = gameState.unlockedEpochs?.length || 0;
      return Math.min(1, epochCount / requirement.target);
    }
    
    case 'artifact_collected': {
      const artifactCount = gameState.completedArtifacts?.length || 0;
      return Math.min(1, artifactCount / requirement.target);
    }
    
    case 'tap_power':
      return Math.min(1, gameState.tapPower / requirement.target);
    
    case 'energy_capacity': {
      const capacityResearch = gameState.prestigeResearch?.energy_capacity || 0;
      const maxEnergy = 1000 + (capacityResearch * 100);
      return Math.min(1, maxEnergy / requirement.target);
    }
    
    case 'gacha_opened': {
      // Track gacha opens via artifact parts collected
      const artifactCount = gameState.completedArtifacts?.length || 0;
      return Math.min(1, artifactCount / requirement.target);
    }
    
    case 'ads_watched': {
      // Use dailyAdViews as proxy for ads watched
      const adsCount = gameState.dailyAdViews ? Object.keys(gameState.dailyAdViews).length : 0;
      return Math.min(1, adsCount / requirement.target);
    }
    
    case 'generator_count': {
      const genCount = gameState.ownedGenerators?.length || 0;
      return Math.min(1, genCount / requirement.target);
    }
    
    case 'world_epochs_visited': {
      const worldEpochs = ['mesopotamia', 'ancient_egypt', 'roman_empire', 'greek_civilization', 
                           'medieval_europe', 'renaissance', 'colonial_era', 'industrial_revolution'];
      const visitedWorld = worldEpochs.filter(e => gameState.unlockedEpochs?.includes(e)).length;
      return Math.min(1, visitedWorld / requirement.target);
    }
    
    case 'sit_studio_complete': {
      // This is tracked separately in SitStudio - use placeholder
      return 0;
    }
    
    case 'event_participation': {
      // Event participation tracked separately
      return 0;
    }
    
    default:
      return 0;
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
  
  // Save to localStorage when state changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(playerAchievements));
    } catch (e) {
      console.error('Failed to save achievements:', e);
    }
  }, [playerAchievements]);
  
  // Build completed set for prerequisite checking
  const completedIds = new Set(
    playerAchievements.filter(pa => pa.completed).map(pa => pa.id)
  );
  
  // Build achievement progress map
  const achievementMap = new Map(
    playerAchievements.map(pa => [pa.id, pa])
  );
  
  // Calculate full achievement progress list
  const achievements: AchievementProgress[] = ALL_ACHIEVEMENTS.map(achievement => {
    const state = achievementMap.get(achievement.id) || {
      id: achievement.id,
      progress: 0,
      completed: false,
      notified: false,
    };
    
    const canEarn = checkPrerequisites(achievement, completedIds);
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
  
  const completedCount = playerAchievements.filter(pa => pa.completed).length;
  const totalCount = ALL_ACHIEVEMENTS.length;
  
  /**
   * Check achievements against current game state
   * Returns newly unlocked achievements
   */
  const checkAchievements = useCallback((gameState: GameState): AchievementNotification[] => {
    const newUnlocks: AchievementNotification[] = [];
    const now = new Date().toISOString();
    
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
        if (!checkPrerequisites(achievement, completedIds)) continue;
        
        // Calculate progress
        const progress = calculateProgress(achievement, gameState);
        
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
  }, [completedIds]);
  
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
    getAchievementsByCategory,
    getNextAchievement,
    clearNotification,
  };
}

export default useAchievements;
