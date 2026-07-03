/**
 * Virtual Museum Tapper Game — useSeasonalEvents Hook
 * Manages seasonal events and event-based multipliers
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import {
  getActiveEvents,
  getUpcomingEvents,
  getCombinedEventMultipliers,
  getFeaturedEpochBonus as getFeaturedEpochBonusFromEvents,
  isWeekend as checkIsWeekend,
} from '../data/events';
import type { EventConfig, EventRewardMultipliers } from '../types/liveops';
import {
  getCurrentSeason,
} from '../data/seasons';
import type { SeasonConfig, PlayerSeasonState } from '../types/liveops';

interface ActiveEvent extends EventConfig {
  timeRemaining: {
    days: number;
    hours: number;
    minutes: number;
    expired: boolean;
  };
}

interface UseSeasonalEventsReturn {
  // Events
  activeEvents: ActiveEvent[];
  upcomingEvents: EventConfig[];
  isWeekend: boolean;
  weekendBonus: boolean;
  getEventMultipliers: () => EventRewardMultipliers;
  getFeaturedEpochBonus: (epochId: string) => EventRewardMultipliers;
  
  // Season/Battle Pass
  currentSeason: SeasonConfig | null;
  seasonState: PlayerSeasonState | null;
  updateSeasonState: (state: PlayerSeasonState) => void;
  claimSeasonReward: (tier: number, isPremium: boolean) => boolean;
  getSeasonProgress: () => {
    currentTier: number;
    xpInTier: number;
    xpToNextTier: number;
    progressPercent: number;
    premiumPurchased: boolean;
  };
  
  // Quick status helpers
  hasActiveEvent: boolean;
  hasWeekendBonus: boolean;
  hasActiveSeason: boolean;
}

const STORAGE_KEY_SEASON = 'season_state';
const CLAIM_COOLDOWN_MS = 1000;

function getTimeRemaining(endDateStr: string): { days: number; hours: number; minutes: number; expired: boolean } {
  const target = new Date(endDateStr);
  const now = new Date();
  const diffMs = Math.max(0, target.getTime() - now.getTime());
  
  if (diffMs <= 0) {
    return { days: 0, hours: 0, minutes: 0, expired: true };
  }
  
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  
  return { days, hours, minutes, expired: false };
}

export function useSeasonalEvents(): UseSeasonalEventsReturn {
  const [seasonState, setSeasonState] = useState<PlayerSeasonState | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SEASON);
      if (saved) {
        return JSON.parse(saved) as PlayerSeasonState;
      }
    } catch (e) {
      console.error('Failed to load season state:', e);
    }
    return null;
  });
  
  const [lastClaimTime, setLastClaimTime] = useState<number>(0);
  
  // Get current season
  const currentSeason = useMemo(() => getCurrentSeason() || null, []);
  
  // Initialize season state if needed
  useEffect(() => {
    if (!currentSeason) return;
    
    // If no saved state or different season, initialize
    if (!seasonState || seasonState.seasonId !== currentSeason.id) {
      const newState: PlayerSeasonState = {
        seasonId: currentSeason.id,
        currentTier: 0,
        totalXp: 0,
        claimedTiers: [],
        premiumPurchased: false,
        challenges: {},
        startedAt: new Date().toISOString(),
      };
      
      setSeasonState(newState);
      localStorage.setItem(STORAGE_KEY_SEASON, JSON.stringify(newState));
    }
  }, [currentSeason, seasonState]);
  
  // Save season state when it changes
  useEffect(() => {
    if (seasonState) {
      try {
        localStorage.setItem(STORAGE_KEY_SEASON, JSON.stringify(seasonState));
      } catch (e) {
        console.error('Failed to save season state:', e);
      }
    }
  }, [seasonState]);
  
  // Get active events with time remaining
  const activeEvents = useMemo((): ActiveEvent[] => {
    const events = getActiveEvents();
    
    return events.map(event => ({
      ...event,
      timeRemaining: getTimeRemaining(event.endDate),
    }));
  }, []);
  
  // Get upcoming events (next 7 days)
  const upcomingEvents = useMemo(() => getUpcomingEvents(7), []);
  
  // Weekend check
  const isWeekend = useMemo(() => checkIsWeekend(), []);
  const weekendBonus = useMemo(() => {
    // Check if weekend bonus event is active
    return activeEvents.some(e => e.type === 'weekend_bonus');
  }, [activeEvents]);
  
  /**
   * Get combined reward multipliers from all active events
   */
  const getEventMultipliers = useCallback((): EventRewardMultipliers => {
    return getCombinedEventMultipliers();
  }, [activeEvents]);
  
  /**
   * Get bonus for a specific epoch from featured events
   */
  const getFeaturedEpochBonus = useCallback((epochId: string): EventRewardMultipliers => {
    return getFeaturedEpochBonusFromEvents(epochId);
  }, []);
  
  /**
   * Update season state
   */
  const updateSeasonState = useCallback((state: PlayerSeasonState) => {
    setSeasonState(state);
  }, []);
  
  // Note: addSeasonXp is not currently exported but can be added if needed
  // The season XP tracking would need to be integrated with the main game loop
  
  /**
   * Claim a season reward
   */
  const claimSeasonReward = useCallback((tier: number, isPremium: boolean): boolean => {
    if (!seasonState || !currentSeason) return false;
    
    // Cooldown check
    const now = Date.now();
    if (now - lastClaimTime < CLAIM_COOLDOWN_MS) {
      return false;
    }
    
    // Check if already claimed
    const claimKey = isPremium ? `premium_${tier}` : `free_${tier}`;
    if (seasonState.claimedTiers.includes(claimKey)) {
      return false;
    }
    
    // Check if tier is unlocked
    if (tier > seasonState.currentTier) {
      return false;
    }
    
    // Check premium requirement
    if (isPremium && !seasonState.premiumPurchased) {
      return false;
    }
    
    // Claim the reward
    setSeasonState(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        claimedTiers: [...prev.claimedTiers, claimKey],
      };
    });
    
    setLastClaimTime(now);
    return true;
  }, [seasonState, currentSeason, lastClaimTime]);
  
  /**
   * Get season progress info
   */
  const getSeasonProgress = useCallback(() => {
    if (!seasonState || !currentSeason) {
      return {
        currentTier: 0,
        xpInTier: 0,
        xpToNextTier: 1,
        progressPercent: 0,
        premiumPurchased: false,
      };
    }
    
    const { currentTier, totalXp, premiumPurchased } = seasonState;
    const currentReward = currentSeason.freeRewards.find(r => r.tier === currentTier);
    const nextReward = currentSeason.freeRewards.find(r => r.tier === currentTier + 1);
    
    const tierStartXp = currentReward?.xpRequired || 0;
    const tierEndXp = nextReward?.xpRequired || tierStartXp + currentSeason.xpPerLevel;
    const xpInTier = Math.max(0, totalXp - tierStartXp);
    const xpToNextTier = tierEndXp - tierStartXp;
    const progressPercent = xpToNextTier > 0 ? Math.min(100, Math.round((xpInTier / xpToNextTier) * 100)) : 100;
    
    return {
      currentTier,
      xpInTier,
      xpToNextTier,
      progressPercent,
      premiumPurchased,
    };
  }, [seasonState, currentSeason]);
  
  // Quick status helpers
  const hasActiveEvent = activeEvents.length > 0;
  const hasWeekendBonus = isWeekend && weekendBonus;
  const hasActiveSeason = currentSeason !== null;
  
  return {
    // Events
    activeEvents,
    upcomingEvents,
    isWeekend,
    weekendBonus,
    getEventMultipliers,
    getFeaturedEpochBonus,
    
    // Season/Battle Pass
    currentSeason,
    seasonState,
    updateSeasonState,
    claimSeasonReward,
    getSeasonProgress,
    
    // Quick status
    hasActiveEvent,
    hasWeekendBonus,
    hasActiveSeason,
  };
}

export default useSeasonalEvents;
