/**
 * Virtual Museum Tapper Game — useDailyContent Hook
 * Manages daily tasks, check-in rewards, and streak system
 */

import { useState, useCallback, useEffect } from 'react';
import type { GameState } from '../types/game';
import {
  getTodayDateStr,
  getYesterdayDateStr,
  makeFreshDailyTasks,
  getStreakReward,
  getTaskById,
  type StreakReward,
} from '../data/tasks';

export interface UseDailyContentConfig {
  dailyTasksState: GameState['dailyTasksState'];
  lastLoginDate: string | null;
  dailyStreak: number;
  bestStreak: number;
  lastCheckIn: string | null;
  checkInStreak: number;
}

export interface UseDailyContentReturn {
  // Daily tasks
  dailyTasksState: GameState['dailyTasksState'];
  claimDailyTask: (taskId: string) => { claimed: boolean; rewards?: { xp: number; currency: number } };
  getDailyTasksState: () => GameState['dailyTasksState'];
  refreshDailyTasks: () => void;
  
  // Daily check-in
  checkInStreak: number;
  shouldShowCheckIn: boolean;
  claimDailyReward: () => { currency: number; xp: number; newStreak: number };
  
  // Streak management
  dailyStreak: number;
  bestStreak: number;
  lastLoginDate: string | null;
  getStreakReward: (streak: number) => StreakReward;
  
  // Modal states
  streakModal: { streak: number; reward: StreakReward } | null;
  dismissStreakModal: () => void;
  
  // Initialization helpers
  initializeDailyContent: (savedState: Partial<UseDailyContentConfig>) => {
    dailyTasksState: GameState['dailyTasksState'];
    dailyStreak: number;
    bestStreak: number;
    lastLoginDate: string;
    showCheckIn: boolean;
    streakReward: StreakReward | null;
  };
}

const DAILY_REWARDS = [
  { day: 1, currency: 500,  xp: 0 },
  { day: 2, currency: 1000, xp: 200 },
  { day: 3, currency: 1500, xp: 400 },
  { day: 4, currency: 2000, xp: 600 },
  { day: 5, currency: 3000, xp: 800 },
  { day: 6, currency: 4000, xp: 1000 },
  { day: 7, currency: 5000, xp: 1500 },
] as const;

/**
 * Hook for managing daily tasks, check-in rewards, and streak system
 */
export function useDailyContent(): UseDailyContentReturn {
  const [dailyTasksState, setDailyTasksState] = useState<GameState['dailyTasksState']>(null);
  const [dailyStreak, setDailyStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [lastLoginDate, setLastLoginDate] = useState<string | null>(null);
  const [checkInStreak, setCheckInStreak] = useState(0);
  const [streakModal, setStreakModal] = useState<{ streak: number; reward: StreakReward } | null>(null);

  /**
   * Get the check-in rewards for the current day
   */
  const getDailyReward = useCallback((dayInWeek: number) => {
    return DAILY_REWARDS.find(r => r.day === dayInWeek) || DAILY_REWARDS[0];
  }, []);

  /**
   * Calculate if player should show check-in modal
   */
  const shouldShowCheckIn = lastLoginDate !== getTodayDateStr() && lastCheckIn !== getTodayDateStr();

  /**
   * Claim a daily task reward
   */
  const claimDailyTask = useCallback((taskId: string): { claimed: boolean; rewards?: { xp: number; currency: number } } => {
    const task = getTaskById(taskId);
    if (!task) return { claimed: false };

    let result: { claimed: boolean; rewards?: { xp: number; currency: number } } = { claimed: false };

    setDailyTasksState(prev => {
      if (!prev || prev.claimed.includes(taskId)) return prev;
      if (prev.counters[task.type] < task.target) return prev;

      result = {
        claimed: true,
        rewards: {
          xp: task.reward.xp || 0,
          currency: task.reward.currency || 0,
        },
      };

      return {
        ...prev,
        claimed: [...prev.claimed, taskId],
      };
    });

    return result;
  }, []);

  /**
   * Get current daily tasks state
   */
  const getDailyTasksState = useCallback((): GameState['dailyTasksState'] => {
    return dailyTasksState;
  }, [dailyTasksState]);

  /**
   * Refresh daily tasks for a new day
   */
  const refreshDailyTasks = useCallback(() => {
    const today = getTodayDateStr();
    setDailyTasksState(makeFreshDailyTasks(today));
  }, []);

  /**
   * Claim daily check-in reward
   */
  const claimDailyReward = useCallback((): { currency: number; xp: number; newStreak: number } => {
    const today = getTodayDateStr();
    const yesterday = getYesterdayDateStr();

    let result = { currency: 0, xp: 0, newStreak: 0 };

    setDailyTasksState(prev => {
      let newStreak: number;
      let newBestStreak = bestStreak;

      // Calculate new check-in streak
      if (!lastCheckIn) {
        newStreak = 1;
      } else if (lastCheckIn === yesterday) {
        newStreak = checkInStreak + 1;
      } else {
        newStreak = 1; // Missed a day — reset
      }

      const dayInWeek = ((newStreak - 1) % 7) + 1;
      const reward = getDailyReward(dayInWeek);
      const bonusCurrency = reward.currency + (dayInWeek === 7 ? 100 : 0); // Day 7 bonus

      result = { currency: bonusCurrency, xp: reward.xp, newStreak };

      setCheckInStreak(newStreak);

      return prev; // Return unchanged, caller handles state update
    });

    return result;
  }, [lastCheckIn, checkInStreak, bestStreak, getDailyReward]);

  /**
   * Update check-in streak
   */
  const updateCheckInStreak = useCallback((streak: number) => {
    setCheckInStreak(streak);
  }, []);

  /**
   * Dismiss streak modal
   */
  const dismissStreakModal = useCallback(() => {
    setStreakModal(null);
  }, []);

  /**
   * Get streak reward for a given streak count
   */
  const getStreakRewardForGame = useCallback((streak: number): StreakReward => {
    return getStreakReward(streak);
  }, []);

  /**
   * Initialize daily content from saved game state
   * Returns the initialized values for the caller to apply
   */
  const initializeDailyContent = useCallback((
    savedState: Partial<UseDailyContentConfig>
  ): {
    dailyTasksState: GameState['dailyTasksState'];
    dailyStreak: number;
    bestStreak: number;
    lastLoginDate: string;
    showCheckIn: boolean;
    streakReward: StreakReward | null;
  } => {
    const today = getTodayDateStr();
    const yesterday = getYesterdayDateStr();
    
    const savedTasks = savedState.dailyTasksState;
    const savedLastLogin = savedState.lastLoginDate;
    const savedStreak = savedState.dailyStreak || 0;
    const savedBestStreak = savedState.bestStreak || 0;

    // Daily tasks: refresh if new day
    let newDailyTasksState = savedTasks;
    if (!savedTasks || savedTasks.date !== today) {
      newDailyTasksState = makeFreshDailyTasks(today);
    }

    // Streak management
    let newStreak = savedStreak;
    let newBestStreak = savedBestStreak;
    let newLastLoginDate = savedLastLogin;
    let showCheckIn = false;
    let streakReward: StreakReward | null = null;

    if (savedLastLogin !== today) {
      if (!savedLastLogin) {
        newStreak = 1;
      } else if (savedLastLogin === yesterday) {
        newStreak = savedStreak + 1;
      } else {
        newStreak = 1;
      }
      newBestStreak = Math.max(newStreak, savedBestStreak);
      newLastLoginDate = today;

      // Get streak reward
      streakReward = getStreakReward(newStreak);
      showCheckIn = true;
    }

    // Update state
    setDailyTasksState(newDailyTasksState);
    setDailyStreak(newStreak);
    setBestStreak(newBestStreak);
    setLastLoginDate(newLastLoginDate);
    if (streakReward) {
      setStreakModal({ streak: newStreak, reward: streakReward });
    }

    return {
      dailyTasksState: newDailyTasksState,
      dailyStreak: newStreak,
      bestStreak: newBestStreak,
      lastLoginDate: newLastLoginDate!,
      showCheckIn,
      streakReward,
    };
  }, []);

  return {
    // Daily tasks
    dailyTasksState,
    claimDailyTask,
    getDailyTasksState,
    refreshDailyTasks,
    
    // Daily check-in
    checkInStreak,
    shouldShowCheckIn,
    claimDailyReward,
    
    // Streak management
    dailyStreak,
    bestStreak,
    lastLoginDate,
    getStreakReward: getStreakRewardForGame,
    
    // Modal states
    streakModal,
    dismissStreakModal,
    
    // Initialization helpers
    initializeDailyContent,
  };
}

/**
 * Hook for managing daily check-in modal visibility
 */
export function useCheckInModal(initialVisible: boolean = false) {
  const [showDailyRewards, setShowDailyRewards] = useState(initialVisible);

  const skipDailyRewards = useCallback(() => {
    setShowDailyRewards(false);
  }, []);

  const showDailyRewardsModal = useCallback(() => {
    setShowDailyRewards(true);
  }, []);

  return {
    showDailyRewards,
    skipDailyRewards,
    showDailyRewardsModal,
  };
}

export default useDailyContent;
