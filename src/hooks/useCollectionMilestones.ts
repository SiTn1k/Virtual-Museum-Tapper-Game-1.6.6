/**
 * Virtual Museum Tapper Game — useCollectionMilestones Hook
 * Tracks artifact collection progress with milestone rewards
 */

import { useState, useCallback, useEffect } from 'react';
import { 
  ALL_MILESTONES, 
  getMilestoneById, 
  getMilestonesByType,
  getMilestoneProgress,
  type CollectionMilestone 
} from '../data/collectionMilestones';
import type { GameState } from '../types/game';

export interface MilestoneProgress {
  milestone: CollectionMilestone;
  isComplete: boolean;
  isClaimed: boolean;
  currentProgress: number;
  progressPercent: number;
}

interface UseCollectionMilestonesReturn {
  artifactMilestones: MilestoneProgress[];
  epochMilestones: MilestoneProgress[];
  generatorMilestones: MilestoneProgress[];
  achievementMilestones: MilestoneProgress[];
  seasonMilestones: MilestoneProgress[];
  totalClaimed: number;
  totalMilestones: number;
  checkMilestones: (gameState: GameState) => void;
  claimMilestone: (milestoneId: string) => boolean;
  getNextMilestone: (type: CollectionMilestone['collectionType']) => MilestoneProgress | null;
}

const STORAGE_KEY = 'collection_milestones_claimed';

function getCurrentCount(type: CollectionMilestone['collectionType'], gameState: GameState): number {
  switch (type) {
    case 'artifact':
      return gameState.completedArtifacts?.length || 0;
    case 'epoch':
      return gameState.unlockedEpochs?.length || 0;
    case 'generator':
      return gameState.ownedGenerators?.length || 0;
    case 'achievement':
      return 0; // Would need achievement count from achievements hook
    case 'season':
      return 0; // Would need season count from season hook
    default:
      return 0;
  }
}

export function useCollectionMilestones(): UseCollectionMilestonesReturn {
  const [claimedMilestones, setClaimedMilestones] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return new Set(JSON.parse(saved) as string[]);
      }
    } catch (e) {
      console.error('Failed to load milestones:', e);
    }
    return new Set();
  });
  
  // Save when claimed milestones change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...claimedMilestones]));
    } catch (e) {
      console.error('Failed to save milestones:', e);
    }
  }, [claimedMilestones]);
  
  /**
   * Build milestone progress for a collection type
   */
  const buildMilestoneProgress = useCallback((
    collectionType: CollectionMilestone['collectionType'],
    gameState: GameState
  ): MilestoneProgress[] => {
    const milestones = getMilestonesByType(collectionType);
    const currentCount = getCurrentCount(collectionType, gameState);
    
    return milestones.map(milestone => {
      const isComplete = currentCount >= milestone.target;
      const isClaimed = claimedMilestones.has(milestone.id);
      const progressPercent = Math.min(100, Math.round((currentCount / milestone.target) * 100));
      
      return {
        milestone,
        isComplete,
        isClaimed,
        currentProgress: Math.min(currentCount, milestone.target),
        progressPercent,
      };
    });
  }, [claimedMilestones]);
  
  /**
   * Check and update milestone completion based on game state
   */
  const checkMilestones = useCallback((gameState: GameState) => {
    // This would be called periodically or on state changes
    // The actual progress is calculated when rendering
    // This hook just tracks what's been claimed
  }, [claimedMilestones]);
  
  /**
   * Claim a milestone reward
   */
  const claimMilestone = useCallback((milestoneId: string): boolean => {
    const milestone = getMilestoneById(milestoneId);
    if (!milestone) return false;
    
    // Can't claim if not complete
    // Note: We don't have current game state here, so this should be called
    // after checking completion
    
    if (claimedMilestones.has(milestoneId)) {
      return false; // Already claimed
    }
    
    setClaimedMilestones(prev => {
      const updated = new Set(prev);
      updated.add(milestoneId);
      return updated;
    });
    
    return true;
  }, [claimedMilestones]);
  
  /**
   * Get the next unclaimed milestone for a type
   */
  const getNextMilestone = useCallback((
    type: CollectionMilestone['collectionType']
  ): MilestoneProgress | null => {
    const milestones = getMilestonesByType(type);
    
    for (const milestone of milestones) {
      if (!claimedMilestones.has(milestone.id)) {
        return {
          milestone,
          isComplete: false, // We don't have current state here
          isClaimed: false,
          currentProgress: 0,
          progressPercent: 0,
        };
      }
    }
    
    return null;
  }, [claimedMilestones]);
  
  // These will be populated when checkMilestones is called with game state
  // For now, return empty arrays that can be populated externally
  const artifactMilestones: MilestoneProgress[] = [];
  const epochMilestones: MilestoneProgress[] = [];
  const generatorMilestones: MilestoneProgress[] = [];
  const achievementMilestones: MilestoneProgress[] = [];
  const seasonMilestones: MilestoneProgress[] = [];
  
  const totalClaimed = claimedMilestones.size;
  const totalMilestones = ALL_MILESTONES.length;
  
  return {
    artifactMilestones,
    epochMilestones,
    generatorMilestones,
    achievementMilestones,
    seasonMilestones,
    totalClaimed,
    totalMilestones,
    checkMilestones,
    claimMilestone,
    getNextMilestone,
  };
}

export default useCollectionMilestones;
