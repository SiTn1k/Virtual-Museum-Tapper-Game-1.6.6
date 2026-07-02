/**
 * Virtual Museum Tapper Game — LiveOps Hook
 * Production-ready LiveOps integration for retention and monetization
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type {
  EventConfig,
  SeasonConfig,
  PlayerSeasonState,
  PlayerAchievementState,
  MissionDef,
  PlayerMissionState,
  LiveOpsState,
  PlayerSegmentType,
  EventRewardMultipliers,
} from '../types/liveops';
import {
  getActiveEvents,
  getCombinedEventMultipliers,
  getFeaturedEpochBonus,
  isWeekend,
} from '../data/events';
import {
  getCurrentSeason,
  getCurrentTierForXp,
  getSeasonXpProgress,
} from '../data/seasons';
import { getDailyMissionsForPlayer, getWeeklyMissionsForPlayer, getMonthlyMissionsForPlayer } from '../data/missions';
import * as Analytics from '../services/analytics';

// ============================================================================
// STATE TYPES
// ============================================================================

interface LiveOpsHookState extends LiveOpsState {
  activeEvents: EventConfig[];
  currentSeason: SeasonConfig | null;
  seasonState: PlayerSeasonState | null;
  achievements: PlayerAchievementState[];
  dailyMissions: MissionDef[];
  weeklyMissions: MissionDef[];
  monthlyMissions: MissionDef[];
  playerMissions: {
    daily: PlayerMissionState[];
    weekly: PlayerMissionState[];
    monthly: PlayerMissionState[];
  };
  eventMultipliers: EventRewardMultipliers;
  isWeekend: boolean;
  playerSegments: PlayerSegmentType[];
}

// ============================================================================
// INITIAL STATE
// ============================================================================

const INITIAL_LIVEOPS_STATE: LiveOpsState = {
  activeEvents: [],
  eventHistory: [],
  currentSeason: null,
  seasonHistory: [],
  achievements: [],
  currentDailyMissions: [],
  currentWeeklyMissions: [],
  currentMonthlyMissions: [],
  missionHistory: [],
  collectionProgress: [],
  playerSegments: {
    segments: [],
    totalPlaytimeMinutes: 0,
    lastSegmentUpdate: new Date().toISOString(),
    lifetimeSpend: 0,
    lifetimePurchases: 0,
  },
  offerState: {},
  activeComebackCampaigns: [],
  notificationPreferences: {
    daily_reminder: true,
    streak_warning: true,
    event_alerts: true,
    achievement_unlocked: true,
  },
  lastNotificationSent: {},
  abTestAssignments: [],
  lastFullSync: new Date().toISOString(),
  lastDailyReset: getDateString(),
  lastWeeklyReset: getWeekString(),
  lastMonthlyReset: getMonthString(),
};

function getDateString(): string {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
}

function getWeekString(): string {
  const d = new Date();
  const startOfYear = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const days = Math.floor((d.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
  const weekNum = Math.ceil((days + startOfYear.getUTCDay() + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNum).padStart(2, '0')}`;
}

function getMonthString(): string {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

// ============================================================================
// HOOK
// ============================================================================

export function useLiveOps(gameState: {
  level: number;
  prestigeLevel: number;
  currency: number;
  totalXp: number;
  artifactCount: number;
  epochId: string;
  dailyStreak: number;
  checkInStreak: number;
  referralsCount: number;
  tapCount: number;
  generatorsOwned: number;
  gachaOpened: number;
  dailyAdViews: number;
  totalCurrencyEarned: number;
}) {
  const [state, setState] = useState<LiveOpsHookState>({
    ...INITIAL_LIVEOPS_STATE,
    activeEvents: getActiveEvents(),
    currentSeason: getCurrentSeason() || null,
    seasonState: null,
    achievements: [],
    dailyMissions: [],
    weeklyMissions: [],
    monthlyMissions: [],
    playerMissions: { daily: [], weekly: [], monthly: [] },
    eventMultipliers: {},
    isWeekend: isWeekend(),
    playerSegments: [],
  });
  
  const initialized = useRef(false);
  const saveTimeoutRef = useRef<number | null>(null);
  
  // =========================================================================
  // INITIALIZATION
  // =========================================================================
  
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    
    loadLiveOpsState();
    initializeMissions();
    initializeSeasonState();
  }, []);
  
  // =========================================================================
  // DAILY/WEEKLY/MONTHLY RESET CHECKS
  // =========================================================================
  
  useEffect(() => {
    const checkResets = () => {
      const now = new Date().toISOString();
      const today = getDateString();
      const thisWeek = getWeekString();
      const thisMonth = getMonthString();
      
      setState(prev => {
        let needsUpdate = false;
        const updates: Partial<LiveOpsHookState> = {};
        
        // Daily reset
        if (prev.lastDailyReset !== today) {
          needsUpdate = true;
          updates.lastDailyReset = today;
          updates.playerMissions = {
            ...prev.playerMissions,
            daily: [],
          };
          // Refresh daily missions
          const newDailyMissions = getDailyMissionsForPlayer(today);
          const newDailyPlayerMissions: PlayerMissionState[] = newDailyMissions.map(m => ({
            missionId: m.id,
            progress: 0,
            completed: false,
            claimed: false,
            assignedAt: now,
            expiresAt: getTomorrowDate(),
          }));
          updates.playerMissions!.daily = newDailyPlayerMissions;
          updates.dailyMissions = newDailyMissions;
        }
        
        // Weekly reset
        if (prev.lastWeeklyReset !== thisWeek) {
          needsUpdate = true;
          updates.lastWeeklyReset = thisWeek;
          updates.playerMissions = {
            ...prev.playerMissions,
            weekly: [],
          };
          const newWeeklyMissions = getWeeklyMissionsForPlayer(thisWeek);
          const newWeeklyPlayerMissions: PlayerMissionState[] = newWeeklyMissions.map(m => ({
            missionId: m.id,
            progress: 0,
            completed: false,
            claimed: false,
            assignedAt: now,
            expiresAt: getNextWeekDate(),
          }));
          updates.playerMissions!.weekly = newWeeklyPlayerMissions;
          updates.weeklyMissions = newWeeklyMissions;
        }
        
        // Monthly reset
        if (prev.lastMonthlyReset !== thisMonth) {
          needsUpdate = true;
          updates.lastMonthlyReset = thisMonth;
          updates.playerMissions = {
            ...prev.playerMissions,
            monthly: [],
          };
          const newMonthlyMissions = getMonthlyMissionsForPlayer(thisMonth);
          const newMonthlyPlayerMissions: PlayerMissionState[] = newMonthlyMissions.map(m => ({
            missionId: m.id,
            progress: 0,
            completed: false,
            claimed: false,
            assignedAt: now,
            expiresAt: getNextMonthDate(),
          }));
          updates.playerMissions!.monthly = newMonthlyPlayerMissions;
          updates.monthlyMissions = newMonthlyMissions;
        }
        
        return needsUpdate ? { ...prev, ...updates } : prev;
      });
    };
    
    // Check on mount and every minute
    checkResets();
    const interval = setInterval(checkResets, 60000);
    return () => clearInterval(interval);
  }, []);
  
  // =========================================================================
  // EVENT MULTIPLIERS UPDATE
  // =========================================================================
  
  useEffect(() => {
    const updateMultipliers = () => {
      const multipliers = getCombinedEventMultipliers();
      setState(prev => ({
        ...prev,
        activeEvents: getActiveEvents(),
        eventMultipliers: multipliers,
        isWeekend: isWeekend(),
      }));
    };
    
    updateMultipliers();
    const interval = setInterval(updateMultipliers, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);
  
  // =========================================================================
  // PLAYER SEGMENTATION UPDATE
  // =========================================================================
  
  useEffect(() => {
    const segments = Analytics.calculatePlayerSegment({
      level: gameState.level,
      prestigeLevel: gameState.prestigeLevel,
      totalPlaytimeMinutes: 0, // Would come from actual tracking
      dailyPlaytimeMinutes: 0,
      lifetimeSpend: state.playerSegments.lifetimeSpend,
      daysSinceInstall: 0, // Would come from player profile
      daysSinceLastSession: 0,
      isPaying: state.playerSegments.lifetimePurchases > 0,
      artifactCount: gameState.artifactCount,
      achievementCount: state.achievements.filter(a => a.completed).length,
    });
    
    setState(prev => ({
      ...prev,
      playerSegments: segments,
      playerSegments: {
        ...prev.playerSegments,
        segments,
        lastSegmentUpdate: new Date().toISOString(),
      },
    }));
  }, [gameState.level, gameState.prestigeLevel, gameState.artifactCount]);
  
  // =========================================================================
  // PERSISTENCE
  // =========================================================================
  
  const saveState = useCallback(() => {
    const storageKey = 'liveops_state';
    const stateToSave: LiveOpsState = {
      activeEvents: [], // Only store IDs on save
      eventHistory: state.eventHistory,
      currentSeason: state.seasonState ? { seasonId: state.seasonState.seasonId } : null,
      seasonHistory: state.seasonHistory,
      achievements: state.achievements,
      currentDailyMissions: state.playerMissions.daily,
      currentWeeklyMissions: state.playerMissions.weekly,
      currentMonthlyMissions: state.playerMissions.monthly,
      missionHistory: state.missionHistory,
      collectionProgress: state.collectionProgress,
      playerSegments: state.playerSegments,
      offerState: state.offerState,
      activeComebackCampaigns: state.activeComebackCampaigns,
      notificationPreferences: state.notificationPreferences,
      lastNotificationSent: state.lastNotificationSent,
      abTestAssignments: state.abTestAssignments,
      lastFullSync: new Date().toISOString(),
      lastDailyReset: state.lastDailyReset,
      lastWeeklyReset: state.lastWeeklyReset,
      lastMonthlyReset: state.lastMonthlyReset,
    };
    localStorage.setItem(storageKey, JSON.stringify(stateToSave));
  }, [state]);
  
  // Auto-save with debounce
  useEffect(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = window.setTimeout(saveState, 5000);
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [state, saveState]);
  
  // =========================================================================
  // LOAD STATE
  // =========================================================================
  
  function loadLiveOpsState() {
    const storageKey = 'liveops_state';
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setState(prev => ({
          ...prev,
          ...parsed,
          activeEvents: getActiveEvents(),
          currentSeason: getCurrentSeason() ?? null,
        }));
      } catch (err) {
        console.error('Failed to load LiveOps state:', err);
      }
    }
  }
  
  // =========================================================================
  // MISSION INITIALIZATION
  // =========================================================================
  
  function initializeMissions() {
    const today = getDateString();
    const thisWeek = getWeekString();
    const thisMonth = getMonthString();
    const now = new Date().toISOString();
    
    // Daily missions
    const dailyMissions = getDailyMissionsForPlayer(today);
    const dailyPlayerMissions: PlayerMissionState[] = dailyMissions.map(m => ({
      missionId: m.id,
      progress: 0,
      completed: false,
      claimed: false,
      assignedAt: now,
      expiresAt: getTomorrowDate(),
    }));
    
    // Weekly missions
    const weeklyMissions = getWeeklyMissionsForPlayer(thisWeek);
    const weeklyPlayerMissions: PlayerMissionState[] = weeklyMissions.map(m => ({
      missionId: m.id,
      progress: 0,
      completed: false,
      claimed: false,
      assignedAt: now,
      expiresAt: getNextWeekDate(),
    }));
    
    // Monthly missions
    const monthlyMissions = getMonthlyMissionsForPlayer(thisMonth);
    const monthlyPlayerMissions: PlayerMissionState[] = monthlyMissions.map(m => ({
      missionId: m.id,
      progress: 0,
      completed: false,
      claimed: false,
      assignedAt: now,
      expiresAt: getNextMonthDate(),
    }));
    
    setState(prev => ({
      ...prev,
      dailyMissions,
      weeklyMissions,
      monthlyMissions,
      playerMissions: {
        daily: dailyPlayerMissions,
        weekly: weeklyPlayerMissions,
        monthly: monthlyPlayerMissions,
      },
    }));
  }
  
  function initializeSeasonState() {
    const currentSeason = getCurrentSeason();
    if (!currentSeason) return;
    
    const storageKey = `season_${currentSeason.id}`;
    const saved = localStorage.getItem(storageKey);
    
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setState(prev => ({
          ...prev,
          seasonState: parsed,
        }));
      } catch {
        // Create new season state
        createNewSeasonState(currentSeason);
      }
    } else {
      createNewSeasonState(currentSeason);
    }
  }
  
  function createNewSeasonState(season: SeasonConfig) {
    const seasonState: PlayerSeasonState = {
      seasonId: season.id,
      currentTier: 0,
      totalXp: 0,
      claimedTiers: [],
      premiumPurchased: false,
      challenges: {},
      startedAt: new Date().toISOString(),
    };
    
    setState(prev => ({
      ...prev,
      seasonState,
    }));
  }
  
  // =========================================================================
  // MISSION PROGRESS UPDATE
  // =========================================================================
  
  const updateMissionProgress = useCallback((
    type: 'tap' | 'earn_xp' | 'buy_generator' | 'open_gacha' | 'upgrade_tap' | 'watch_ad' | 'claim_daily' | 'epoch_complete' | 'prestige',
    amount: number = 1
  ) => {
    setState(prev => {
      const updates = { ...prev };
      
      // Update daily missions
      updates.playerMissions = {
        ...prev.playerMissions,
        daily: prev.playerMissions.daily.map(m => {
          const mission = prev.dailyMissions.find(dm => dm.id === m.missionId);
          if (!mission || m.completed || m.claimed) return m;
          if (mission.type === type) {
            const newProgress = m.progress + amount;
            return {
              ...m,
              progress: newProgress,
              completed: newProgress >= mission.target,
            };
          }
          return m;
        }),
      };
      
      // Update weekly missions
      updates.playerMissions = {
        ...updates.playerMissions,
        weekly: prev.playerMissions.weekly.map(m => {
          const mission = prev.weeklyMissions.find(wm => wm.id === m.missionId);
          if (!mission || m.completed || m.claimed) return m;
          if (mission.type === type) {
            const newProgress = m.progress + amount;
            return {
              ...m,
              progress: newProgress,
              completed: newProgress >= mission.target,
            };
          }
          return m;
        }),
      };
      
      // Update monthly missions
      updates.playerMissions = {
        ...updates.playerMissions,
        monthly: prev.playerMissions.monthly.map(m => {
          const mission = prev.monthlyMissions.find(mm => mm.id === m.missionId);
          if (!mission || m.completed || m.claimed) return m;
          if (mission.type === type) {
            const newProgress = m.progress + amount;
            return {
              ...m,
              progress: newProgress,
              completed: newProgress >= mission.target,
            };
          }
          return m;
        }),
      };
      
      return updates;
    });
  }, []);
  
  // =========================================================================
  // CLAIM MISSION REWARD
  // =========================================================================
  
  const claimMissionReward = useCallback((
    frequency: 'daily' | 'weekly' | 'monthly',
    missionId: string
  ): { success: boolean; rewards: { currency?: number; xp?: number } } => {
    let reward = { currency: 0, xp: 0 };
    
    setState(prev => {
      const missions = prev[frequency === 'daily' ? 'dailyMissions' : frequency === 'weekly' ? 'weeklyMissions' : 'monthlyMissions'] as MissionDef[];
      const mission = missions.find(m => m.id === missionId);
      if (!mission) return prev;
      
      const playerMission = prev.playerMissions[frequency].find(m => m.missionId === missionId);
      if (!playerMission || !playerMission.completed || playerMission.claimed) return prev;
      
      // Track analytics
      Analytics.trackMissionCompleted(missionId, frequency);
      
      // Get reward
      reward = { currency: mission.reward.currency || 0, xp: mission.reward.xp || 0 };
      
      return {
        ...prev,
        playerMissions: {
          ...prev.playerMissions,
          [frequency]: prev.playerMissions[frequency].map(m =>
            m.missionId === missionId ? { ...m, claimed: true, claimedAt: new Date().toISOString() } : m
          ),
        },
      };
    });
    
    return { success: true, rewards: reward };
  }, []);
  
  // =========================================================================
  // SEASON XP
  // =========================================================================
  
  const addSeasonXp = useCallback((amount: number) => {
    setState(prev => {
      if (!prev.seasonState || !prev.currentSeason) return prev;
      
      const newTotalXp = prev.seasonState.totalXp + amount;
      const newTier = getCurrentTierForXp(prev.currentSeason, newTotalXp);
      
      // Track if tier changed
      if (newTier > prev.seasonState.currentTier) {
        Analytics.trackSeasonTierReached(prev.currentSeason.id, newTier);
      }
      
      return {
        ...prev,
        seasonState: {
          ...prev.seasonState,
          totalXp: newTotalXp,
          currentTier: newTier,
        },
      };
    });
  }, []);
  
  // =========================================================================
  // CLAIM SEASON REWARD
  // =========================================================================
  
  const claimSeasonReward = useCallback((tier: number, isPremium: boolean): boolean => {
    if (!state.currentSeason || !state.seasonState) return false;
    if (state.seasonState.claimedTiers.includes(tier)) return false;
    if (isPremium && !state.seasonState.premiumPurchased) return false;
    
    const reward = isPremium
      ? state.currentSeason.premiumRewards.find(r => r.tier === tier)
      : state.currentSeason.freeRewards.find(r => r.tier === tier);
    
    if (!reward) return false;
    
    setState(prev => ({
      ...prev,
      seasonState: {
        ...prev.seasonState!,
        claimedTiers: [...prev.seasonState!.claimedTiers, tier],
      },
    }));
    
    Analytics.trackEventRewardClaimed(
      `season_${state.currentSeason.id}`,
      reward.freeReward.type,
      reward.freeReward.amount || 0
    );
    
    return true;
  }, [state.currentSeason, state.seasonState]);
  
  // =========================================================================
  // EPOCH BONUS
  // =========================================================================
  
  const getEpochBonus = useCallback((epochId: string): EventRewardMultipliers => {
    return getFeaturedEpochBonus(epochId);
  }, []);
  
  // =========================================================================
  // NOTIFICATION PREFERENCES
  // =========================================================================
  
  const updateNotificationPreference = useCallback((type: string, enabled: boolean) => {
    setState(prev => ({
      ...prev,
      notificationPreferences: {
        ...prev.notificationPreferences,
        [type]: enabled,
      },
    }));
  }, []);
  
  // =========================================================================
  // RETURN
  // =========================================================================
  
  return {
    // State
    activeEvents: state.activeEvents,
    currentSeason: state.currentSeason,
    seasonState: state.seasonState,
    achievements: state.achievements,
    dailyMissions: state.dailyMissions,
    weeklyMissions: state.weeklyMissions,
    monthlyMissions: state.monthlyMissions,
    playerMissions: state.playerMissions,
    eventMultipliers: state.eventMultipliers,
    isWeekend: state.isWeekend,
    playerSegments: state.playerSegments.segments,
    
    // Season progress helpers
    seasonProgress: state.currentSeason && state.seasonState
      ? getSeasonXpProgress(state.currentSeason, state.seasonState.totalXp)
      : null,
    
    // Actions
    updateMissionProgress,
    claimMissionReward,
    addSeasonXp,
    claimSeasonReward,
    getEpochBonus,
    updateNotificationPreference,
    
    // Notification preferences
    notificationPreferences: state.notificationPreferences,
  };
}

// ============================================================================
// DATE HELPERS
// ============================================================================

function getTomorrowDate(): string {
  const d = new Date(Date.now() + 86400000);
  return d.toISOString();
}

function getNextWeekDate(): string {
  const d = new Date(Date.now() + 7 * 86400000);
  return d.toISOString();
}

function getNextMonthDate(): string {
  const d = new Date();
  d.setUTCMonth(d.getUTCMonth() + 1);
  return d.toISOString();
}

// ============================================================================
// EXPORTED TYPES
// ============================================================================

export type { LiveOpsHookState };
