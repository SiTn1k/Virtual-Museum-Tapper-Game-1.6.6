/**
 * Virtual Museum Tapper Game — Battle Pass / Season Hook
 * Manages season progress, XP tracking, and reward claims
 */

import { useState, useCallback, useMemo, useEffect } from 'react';
import type { SeasonConfig, PlayerSeasonState, SeasonReward } from '../types/liveops';
import { getCurrentSeason, getSeasonXpProgress, getCurrentTierForXp } from '../data/seasons';

export interface SeasonProgress {
  currentTier: number;
  xpInTier: number;
  xpToNextTier: number;
  progressPercent: number;
  totalXp: number;
  premiumPurchased: boolean;
  daysRemaining: number;
  season: SeasonConfig | null;
}

export interface ClaimResult {
  success: boolean;
  reward: SeasonReward | null;
  tier: number;
  isPremium: boolean;
  message: string;
}

const STORAGE_KEY = 'ukraine_tap_battle_pass_state';

/**
 * Initialize empty season state
 */
function createEmptySeasonState(seasonId: string): PlayerSeasonState {
  return {
    seasonId,
    currentTier: 0,
    totalXp: 0,
    claimedTiers: [],
    premiumPurchased: false,
    challenges: {},
    startedAt: new Date().toISOString(),
  };
}

/**
 * Load season state from localStorage
 */
function loadSeasonState(seasonId: string): PlayerSeasonState | null {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const data = JSON.parse(saved);
      if (data.seasonId === seasonId) {
        return data;
      }
    }
  } catch (e) {
    console.error('Failed to load season state:', e);
  }
  return null;
}

/**
 * Save season state to localStorage
 */
function saveSeasonState(state: PlayerSeasonState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('Failed to save season state:', e);
  }
}

export function useBattlePass() {
  const [seasonState, setSeasonState] = useState<PlayerSeasonState | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Get current active season
  const currentSeason = useMemo(() => getCurrentSeason(), []);

  // Initialize season state when season changes
  useEffect(() => {
    if (!currentSeason) {
      setSeasonState(null);
      setIsInitialized(true);
      return;
    }

    const saved = loadSeasonState(currentSeason.id);
    if (saved) {
      setSeasonState(saved);
    } else {
      const newState = createEmptySeasonState(currentSeason.id);
      setSeasonState(newState);
      saveSeasonState(newState);
    }
    setIsInitialized(true);
  }, [currentSeason]);

  // Calculate days remaining in season
  const daysRemaining = useMemo(() => {
    if (!currentSeason) return 0;
    const end = new Date(currentSeason.endDate);
    const now = new Date();
    const diffMs = end.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
  }, [currentSeason]);

  // Get current season progress
  const seasonProgress = useMemo((): SeasonProgress => {
    if (!currentSeason || !seasonState) {
      return {
        currentTier: 0,
        xpInTier: 0,
        xpToNextTier: 1,
        progressPercent: 0,
        totalXp: 0,
        premiumPurchased: false,
        daysRemaining: 0,
        season: null,
      };
    }

    const progress = getSeasonXpProgress(currentSeason, seasonState.totalXp);

    return {
      currentTier: seasonState.currentTier,
      xpInTier: progress.xpInTier,
      xpToNextTier: progress.xpToNextTier,
      progressPercent: Math.round(progress.progress * 100),
      totalXp: seasonState.totalXp,
      premiumPurchased: seasonState.premiumPurchased,
      daysRemaining,
      season: currentSeason,
    };
  }, [currentSeason, seasonState, daysRemaining]);

  // Add season XP
  const addSeasonXp = useCallback((amount: number): void => {
    if (!currentSeason || !seasonState) return;

    const newTotalXp = seasonState.totalXp + amount;
    const newTier = getCurrentTierForXp(currentSeason, newTotalXp);
    const tierChanged = newTier > seasonState.currentTier;

    const updatedState: PlayerSeasonState = {
      ...seasonState,
      totalXp: newTotalXp,
      currentTier: Math.max(seasonState.currentTier, newTier),
    };

    setSeasonState(updatedState);
    saveSeasonState(updatedState);

    // Return info if tier changed for potential notifications
    if (tierChanged) {
      console.log(`🎉 Season tier up! Now tier ${newTier}`);
    }
  }, [currentSeason, seasonState]);

  // Claim tier reward
  const claimTierReward = useCallback((tier: number, isPremium: boolean): ClaimResult => {
    if (!currentSeason || !seasonState) {
      return { success: false, reward: null, tier, isPremium, message: 'No active season' };
    }

    // Check if tier is unlocked
    if (tier > seasonState.currentTier) {
      return { success: false, reward: null, tier, isPremium, message: 'Tier not unlocked' };
    }

    // Check if already claimed
    const claimKey = isPremium ? `premium_${tier}` : `free_${tier}`;
    if (seasonState.claimedTiers.includes(claimKey)) {
      return { success: false, reward: null, tier, isPremium, message: 'Already claimed' };
    }

    // Check premium requirement
    if (isPremium && !seasonState.premiumPurchased) {
      return { success: false, reward: null, tier, isPremium, message: 'Premium not purchased' };
    }

    // Get reward
    const rewards = isPremium ? currentSeason.premiumRewards : currentSeason.freeRewards;
    const reward = rewards.find(r => r.tier === tier);
    if (!reward) {
      return { success: false, reward: null, tier, isPremium, message: 'Reward not found' };
    }

    // Update state
    const updatedState: PlayerSeasonState = {
      ...seasonState,
      claimedTiers: [...seasonState.claimedTiers, claimKey],
    };

    setSeasonState(updatedState);
    saveSeasonState(updatedState);

    return {
      success: true,
      reward,
      tier,
      isPremium,
      message: 'Reward claimed!',
    };
  }, [currentSeason, seasonState]);

  // Purchase premium pass
  const purchasePremium = useCallback((): boolean => {
    if (!currentSeason || !seasonState) return false;
    if (seasonState.premiumPurchased) return false;

    const updatedState: PlayerSeasonState = {
      ...seasonState,
      premiumPurchased: true,
    };

    setSeasonState(updatedState);
    saveSeasonState(updatedState);

    return true;
  }, [currentSeason, seasonState]);

  // Check if tier is claimable
  const canClaimTier = useCallback((tier: number, isPremium: boolean): boolean => {
    if (!seasonState) return false;
    if (tier > seasonState.currentTier) return false;

    const claimKey = isPremium ? `premium_${tier}` : `free_${tier}`;
    if (seasonState.claimedTiers.includes(claimKey)) return false;
    if (isPremium && !seasonState.premiumPurchased) return false;

    return true;
  }, [seasonState]);

  // Get unclaimed tiers
  const getUnclaimedTiers = useCallback((): number[] => {
    if (!seasonState) return [];
    const unclaimed: number[] = [];

    for (let tier = 1; tier <= seasonState.currentTier; tier++) {
      const claimKey = `free_${tier}`;
      if (!seasonState.claimedTiers.includes(claimKey)) {
        unclaimed.push(tier);
      }
    }

    return unclaimed;
  }, [seasonState]);

  return {
    currentSeason,
    seasonState,
    seasonProgress,
    isInitialized,
    addSeasonXp,
    claimTierReward,
    purchasePremium,
    canClaimTier,
    getUnclaimedTiers,
  };
}
