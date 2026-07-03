/**
 * Virtual Museum Tapper Game — useDailyChallenges Hook
 * Manages daily and weekly challenges with rotating tasks
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import type { PlayerMissionState } from '../types/liveops';
import type { GameState } from '../types/game';
import { TASK_POOL, getTaskById, type TaskDef } from '../data/tasks';

const STORAGE_KEY_DAILY = 'daily_challenges_state';
const STORAGE_KEY_WEEKLY = 'weekly_challenges_state';
const CLAIM_COOLDOWN_MS = 2000; // 2 second cooldown to prevent double claims

// Challenge with extended task info
interface ChallengeTask extends TaskDef {
  frequency: 'daily' | 'weekly';
  name: { ua: string; en: string };
}

interface ChallengeState extends PlayerMissionState {
  taskId: string;
}

interface DailyChallenge {
  task: ChallengeTask;
  state: ChallengeState;
  progress: number;
  progressPercent: number;
  isComplete: boolean;
  isWeekly: boolean;
}

interface UseDailyChallengesReturn {
  dailyChallenges: DailyChallenge[];
  weeklyChallenges: DailyChallenge[];
  claimChallenge: (challengeId: string) => boolean;
  refreshChallenges: () => void;
  completedToday: number;
  totalDaily: number;
  completedThisWeek: number;
  totalWeekly: number;
  checkProgress: (gameState: GameState) => void;
}

function getDateStr(date: Date): string {
  return date.toISOString().split('T')[0];
}

function getWeekStr(date: Date): string {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - d.getDay());
  return d.toISOString().split('T')[0];
}

// Extended task pool with frequency and localized names
const CHALLENGE_TASKS: ChallengeTask[] = [
  // Daily tasks
  { ...getTaskById('tap_50')!, frequency: 'daily', name: { ua: 'Тапай 50', en: 'Tap 50' } },
  { ...getTaskById('tap_200')!, frequency: 'daily', name: { ua: 'Тапай 200', en: 'Tap 200' } },
  { ...getTaskById('xp_500')!, frequency: 'daily', name: { ua: 'Зароби 500 XP', en: 'Earn 500 XP' } },
  { ...getTaskById('gen_1')!, frequency: 'daily', name: { ua: 'Купи генератор', en: 'Buy a generator' } },
  { ...getTaskById('gacha_1')!, frequency: 'daily', name: { ua: 'Відкрий скриню', en: 'Open a chest' } },
  // Weekly tasks (using existing task pool)
  { ...getTaskById('tap_1000')!, frequency: 'weekly', name: { ua: 'Тиждень: 1000 тапів', en: 'Week: 1000 taps' } },
  { ...getTaskById('xp_8000')!, frequency: 'weekly', name: { ua: 'Тиждень: 8000 XP', en: 'Week: 8000 XP' } },
  { ...getTaskById('gen_5')!, frequency: 'weekly', name: { ua: 'Тиждень: 5 генераторів', en: 'Week: 5 generators' } },
];

/**
 * Generate daily challenges for the current day
 */
function generateDailyChallenges(savedDate: string, existingState: ChallengeState[]): {
  challenges: ChallengeState[];
  newDate: string;
} {
  const today = getDateStr(new Date());
  
  if (savedDate === today && existingState.length > 0) {
    return { challenges: existingState, newDate: today };
  }
  
  // Select 3 random daily tasks
  const availableTasks = CHALLENGE_TASKS.filter(t => t.frequency === 'daily');
  const shuffled = [...availableTasks].sort(() => Math.random() - 0.5);
  const selectedTasks = shuffled.slice(0, 3);
  
  const expiresAt = new Date(today);
  expiresAt.setDate(expiresAt.getDate() + 1);
  
  const challenges: ChallengeState[] = selectedTasks.map(task => ({
    missionId: `${task.id}_${today}`,
    progress: 0,
    completed: false,
    claimed: false,
    assignedAt: new Date().toISOString(),
    expiresAt: expiresAt.toISOString(),
    taskId: task.id,
  }));
  
  return { challenges, newDate: today };
}

/**
 * Generate weekly challenges for the current week
 */
function generateWeeklyChallenges(savedWeek: string, existingState: ChallengeState[]): {
  challenges: ChallengeState[];
  newWeek: string;
} {
  const thisWeek = getWeekStr(new Date());
  
  if (savedWeek === thisWeek && existingState.length > 0) {
    return { challenges: existingState, newWeek: thisWeek };
  }
  
  // Select 2 weekly tasks
  const availableTasks = CHALLENGE_TASKS.filter(t => t.frequency === 'weekly');
  const shuffled = [...availableTasks].sort(() => Math.random() - 0.5);
  const selectedTasks = shuffled.slice(0, 2);
  
  const weekEnd = new Date(thisWeek);
  weekEnd.setDate(weekEnd.getDate() + 7);
  
  const challenges: ChallengeState[] = selectedTasks.map(task => ({
    missionId: `${task.id}_${thisWeek}`,
    progress: 0,
    completed: false,
    claimed: false,
    assignedAt: new Date().toISOString(),
    expiresAt: weekEnd.toISOString(),
    taskId: task.id,
  }));
  
  return { challenges, newWeek: thisWeek };
}

export function useDailyChallenges(): UseDailyChallengesReturn {
  // Load saved state
  const loadSavedState = <T>(key: string, defaultValue: T): T => {
    try {
      const saved = localStorage.getItem(key);
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed as T;
      }
    } catch (e) {
      console.error(`Failed to load ${key}:`, e);
    }
    return defaultValue;
  };
  
  const [dailyState, setDailyState] = useState<{
    date: string;
    challenges: ChallengeState[];
  }>(() => loadSavedState(STORAGE_KEY_DAILY, { date: '', challenges: [] }));
  
  const [weeklyState, setWeeklyState] = useState<{
    week: string;
    challenges: ChallengeState[];
  }>(() => loadSavedState(STORAGE_KEY_WEEKLY, { week: '', challenges: [] }));
  
  const lastClaimRef = useRef<Record<string, number>>({});
  
  // Initialize daily challenges
  useEffect(() => {
    const { challenges, newDate } = generateDailyChallenges(dailyState.date, dailyState.challenges);
    if (challenges !== dailyState.challenges || newDate !== dailyState.date) {
      setDailyState({ date: newDate, challenges });
    }
  }, [dailyState.date, dailyState.challenges]);
  
  // Initialize weekly challenges
  useEffect(() => {
    const { challenges, newWeek } = generateWeeklyChallenges(weeklyState.week, weeklyState.challenges);
    if (challenges !== weeklyState.challenges || newWeek !== weeklyState.week) {
      setWeeklyState({ week: newWeek, challenges });
    }
  }, [weeklyState.week, weeklyState.challenges]);
  
  // Save daily state
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_DAILY, JSON.stringify(dailyState));
    } catch (e) {
      console.error('Failed to save daily challenges:', e);
    }
  }, [dailyState]);
  
  // Save weekly state
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_WEEKLY, JSON.stringify(weeklyState));
    } catch (e) {
      console.error('Failed to save weekly challenges:', e);
    }
  }, [weeklyState]);
  
  /**
   * Check and update challenge progress based on game state
   */
  const updateChallengeProgress = useCallback((
    challenge: ChallengeState,
    gameState: GameState
  ): number => {
    const task = CHALLENGE_TASKS.find(t => t.id === challenge.taskId);
    if (!task) return 0;
    
    let currentProgress = 0;
    
    switch (task.type) {
      case 'tap':
        currentProgress = gameState.level || 0; // Use level as proxy for taps
        break;
      case 'earn_xp':
        currentProgress = gameState.totalXp || 0;
        break;
      case 'buy_generator':
        currentProgress = gameState.ownedGenerators?.length || 0;
        break;
      case 'upgrade_tap':
        currentProgress = gameState.tapPower || 1;
        break;
      case 'open_gacha':
        currentProgress = gameState.artifactParts ? Object.keys(gameState.artifactParts).length : 0;
        break;
      default:
        currentProgress = 0;
    }
    
    return Math.min(1, currentProgress / task.target);
  }, []);
  
  /**
   * Check and update all challenges based on game state
   */
  const checkProgress = useCallback((gameState: GameState) => {
    // Update daily challenges
    setDailyState(prev => {
      let hasChanges = false;
      const updated = prev.challenges.map(challenge => {
        const progress = updateChallengeProgress(challenge, gameState);
        const isComplete = progress >= 1;
        
        if (progress !== challenge.progress || isComplete !== challenge.completed) {
          hasChanges = true;
          return {
            ...challenge,
            progress,
            completed: challenge.completed || isComplete,
          };
        }
        return challenge;
      });
      
      return hasChanges ? { ...prev, challenges: updated } : prev;
    });
    
    // Update weekly challenges
    setWeeklyState(prev => {
      let hasChanges = false;
      const updated = prev.challenges.map(challenge => {
        const progress = updateChallengeProgress(challenge, gameState);
        const isComplete = progress >= 1;
        
        if (progress !== challenge.progress || isComplete !== challenge.completed) {
          hasChanges = true;
          return {
            ...challenge,
            progress,
            completed: challenge.completed || isComplete,
          };
        }
        return challenge;
      });
      
      return hasChanges ? { ...prev, challenges: updated } : prev;
    });
  }, [updateChallengeProgress]);
  
  /**
   * Claim a challenge reward
   */
  const claimChallenge = useCallback((challengeId: string): boolean => {
    const now = Date.now();
    const lastClaim = lastClaimRef.current[challengeId] || 0;
    
    if (now - lastClaim < CLAIM_COOLDOWN_MS) {
      return false;
    }
    
    lastClaimRef.current[challengeId] = now;
    
    // Check daily challenges
    const dailyIndex = dailyState.challenges.findIndex(c => c.missionId === challengeId);
    if (dailyIndex >= 0) {
      const challenge = dailyState.challenges[dailyIndex];
      if (!challenge.completed || challenge.claimed) {
        return false;
      }
      
      setDailyState(prev => {
        const updated = [...prev.challenges];
        updated[dailyIndex] = { ...updated[dailyIndex], claimed: true };
        return { ...prev, challenges: updated };
      });
      
      return true;
    }
    
    // Check weekly challenges
    const weeklyIndex = weeklyState.challenges.findIndex(c => c.missionId === challengeId);
    if (weeklyIndex >= 0) {
      const challenge = weeklyState.challenges[weeklyIndex];
      if (!challenge.completed || challenge.claimed) {
        return false;
      }
      
      setWeeklyState(prev => {
        const updated = [...prev.challenges];
        updated[weeklyIndex] = { ...updated[weeklyIndex], claimed: true };
        return { ...prev, challenges: updated };
      });
      
      return true;
    }
    
    return false;
  }, [dailyState.challenges, weeklyState.challenges]);
  
  /**
   * Refresh challenges
   */
  const refreshChallenges = useCallback(() => {
    const { challenges: newDaily, newDate } = generateDailyChallenges('', []);
    setDailyState({ date: newDate, challenges: newDaily });
    
    const { challenges: newWeekly, newWeek } = generateWeeklyChallenges('', []);
    setWeeklyState({ week: newWeek, challenges: newWeekly });
  }, []);
  
  // Build daily challenges with full info
  const dailyChallenges: DailyChallenge[] = dailyState.challenges.map(challenge => {
    const task = CHALLENGE_TASKS.find(t => t.id === challenge.taskId);
    return {
      task: task || CHALLENGE_TASKS[0],
      state: challenge,
      progress: challenge.progress,
      progressPercent: Math.round(challenge.progress * 100),
      isComplete: challenge.completed,
      isWeekly: false,
    };
  });
  
  // Build weekly challenges with full info
  const weeklyChallenges: DailyChallenge[] = weeklyState.challenges.map(challenge => {
    const task = CHALLENGE_TASKS.find(t => t.id === challenge.taskId);
    return {
      task: task || CHALLENGE_TASKS[0],
      state: challenge,
      progress: challenge.progress,
      progressPercent: Math.round(challenge.progress * 100),
      isComplete: challenge.completed,
      isWeekly: true,
    };
  });
  
  const completedToday = dailyChallenges.filter(c => c.isComplete).length;
  const totalDaily = dailyChallenges.length;
  const completedThisWeek = weeklyChallenges.filter(c => c.isComplete).length;
  const totalWeekly = weeklyChallenges.length;
  
  return {
    dailyChallenges,
    weeklyChallenges,
    claimChallenge,
    refreshChallenges,
    completedToday,
    totalDaily,
    completedThisWeek,
    totalWeekly,
    checkProgress,
  };
}

export default useDailyChallenges;
