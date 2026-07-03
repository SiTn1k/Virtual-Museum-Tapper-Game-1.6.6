import { useState, useEffect, useCallback, useRef } from 'react';
import { GameState, EpochId, OwnedGenerator, TapEvent, LeaderboardEntry, Epoch, ARTIFACT_PARTS_PER_LEVEL } from '../types/game';
import {
  EPOCHS,
  ARTIFACTS,
  getEpochById,
  getGeneratorCost,
} from '../data/epochs';
import {
  getTodayDateStr,
  getYesterdayDateStr,
  makeFreshDailyTasks,
  getStreakReward,
  getTaskById,
  type StreakReward,
} from '../data/tasks';
import {
  saveLocalState,
  saveRemoteState,
  loadGameState,
  getTelegramUserId,
  getLeaderboard,
  getUserRank,
  fetchActiveBoosters,
} from '../lib/storage';
import { rpcClaimOfflineIncome, rpcBuyGenerator, rpcUpgradeTap, rpcRecordTaps } from '../lib/rpc';
import { hapticNotification, hapticImpact } from '../lib/telegram';
import { initSessionManager, onDuplicateDetected, stopSessionManager } from '../lib/sessionManager';
import type { ActiveBoosters } from '../types/game';
import { useTaps } from './useTaps';
import {
  calculatePassiveXp,
  calculateXpToLevel,
  applyPassiveTick,
  validatePassiveXp,
} from './usePassiveIncome';
import { useDailyContent } from './useDailyContent';

const LOCAL_SAVE_INTERVAL = 2000;
const REMOTE_SAVE_INTERVAL = 15000;
const MAX_LEVEL = 999;

export interface ArtifactMultipliers {
  xp: number;
  currency: number;
  passive: number;
}

export interface BoosterMultipliers {
  xp: number;
  currency: number;
}

export function getBoosterMultipliers(boosters: ActiveBoosters): BoosterMultipliers {
  const now = Date.now();
  let xp = 1;
  let currency = 1;

  if (boosters.xp_boost_end && boosters.xp_boost_end > now) {
    xp = Math.max(xp, boosters.xp_boost_mult ?? 2);
  }
  if (boosters.currency_boost_end && boosters.currency_boost_end > now) {
    currency = Math.max(currency, boosters.currency_boost_mult ?? 2);
  }
  if (boosters.super_boost_end && boosters.super_boost_end > now) {
    const m = boosters.super_boost_mult ?? 3;
    xp = Math.max(xp, m);
    currency = Math.max(currency, m);
  }
  if (boosters.offline_boost_end && boosters.offline_boost_end > now) {
    xp = Math.max(xp, 2);
    currency = Math.max(currency, 2);
  }

  return { xp, currency };
}

export function getArtifactMultipliers(completedArtifacts: string[], artifactDupes?: Record<string, number>): ArtifactMultipliers {
  let xp = 1;
  let currency = 1;
  let passive = 1;
  for (const id of completedArtifacts) {
    const art = ARTIFACTS.find(a => a.id === id);
    if (!art) continue;
    // Each duplicate adds +10% of the base bonus (stacks additively, then multiplied)
    const dupeCount = artifactDupes?.[id] || 0;
    const effectiveValue = art.bonus.value + (art.bonus.value - 1) * 0.1 * dupeCount;
    if (art.bonus.type === 'xp_multiplier') xp *= effectiveValue;
    if (art.bonus.type === 'currency_multiplier') currency *= effectiveValue;
    if (art.bonus.type === 'passive_boost') passive *= effectiveValue;
  }
  return { xp, currency, passive };
}

const INITIAL_STATE: GameState = {
  epochId: 'trypillia',
  level: 1,
  xp: 0,
  xpToNextLevel: calculateXpToLevel(1),
  totalXp: 0,
  currency: 20,
  totalCurrencyEarned: 20,
  ownedGenerators: [],
  tapPower: 1,
  passiveXpPerSecond: 0,
  unlockedEpochs: ['trypillia'],
  artifactParts: {},
  artifactLevels: {},
  completedArtifacts: [],
  artifactDupes: {},
  lastSavedAt: Date.now(),
  referrerId: null,
  referralsCount: 0,
  referralEarnings: 0,
  activeBoosters: {},
  dailyStreak: 0,
  bestStreak: 0,
  lastLoginDate: null,
  dailyTasksState: null,
  lastCheckIn: null,
  checkInStreak: 0,
  // Phase 2: Prestige System
  prestigeLevel: 0,
  prestigePoints: 0,
  prestigeResearch: {},
  // Phase 2: Energy System (only after Prestige 1+)
  // Note: maxEnergy formula is 1000 + (prestigeResearch.energy_capacity * 100)
  // Initial state has no research, so 1000
  energy: 1000,
  maxEnergy: 1000,
  lastOnlineAt: Date.now(),
  sessionStartAt: Date.now(),
  lastSessionAdAt: 0,
  dailyAdViews: {},
};

export type SyncStatus = 'synced' | 'syncing' | 'offline' | 'error';

export function useGame() {
  const [isLoading, setIsLoading] = useState(true);
  const [state, setState] = useState<GameState>(INITIAL_STATE);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [userRank, setUserRank] = useState<number | null>(null);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);
  const [offlineGains, setOfflineGains] = useState<{ xp: number; currency: number } | null>(null);
  const [duplicateTab, setDuplicateTab] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('synced');
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [showDailyRewards, setShowDailyRewards] = useState(false);
  const tickRef = useRef<number | null>(null);
  const localSaveRef = useRef<number | null>(null);
  const remoteSaveRef = useRef<number | null>(null);
  const isInitialized = useRef(false);
  const dirtyRef = useRef(false);
  const isOnlineRef = useRef(true);

  // ── Server-side tap validation (Phase 4) ─────────────────────────────
  // Batch taps locally, flush to server periodically
  const pendingTapsRef = useRef(0);
  const serverSyncXpRef = useRef(0); // XP tracked server-side
  const lastFlushRef = useRef(Date.now());
  const TAP_FLUSH_INTERVAL = 1500; // ms between server sync
  const MAX_TAPS_PER_BATCH = 10; // Server rate limit
  const tapFlushTimerRef = useRef<number | null>(null);
  const isSyncingRef = useRef(false);

  // ── Battle Pass XP Tracking ───────────────────────────────────────────
  // Callback to notify battle pass system when XP is earned
  const battlePassXpCallbackRef = useRef<((xp: number) => void) | null>(null);

  /**
   * Register a callback to be called when XP is earned
   * Used by Battle Pass system to track season progress
   */
  const registerBattlePassXpCallback = useCallback((callback: ((xp: number) => void) | null) => {
    battlePassXpCallbackRef.current = callback;
  }, []);

  // Helper to notify battle pass of XP earned
  const notifyBattlePassXp = useCallback((xp: number) => {
    if (battlePassXpCallbackRef.current) {
      battlePassXpCallbackRef.current(xp);
    }
  }, []);

  // Use sub-hooks for focused functionality
  const { tapEvents, recordTap, getTapValue, getEnergyMultiplier } = useTaps();
  const { dailyTasksState, streakModal, dismissStreakModal } = useDailyContent();

  // ── Online/offline detection ────────────────────────────────────────
  useEffect(() => {
    const goOffline = () => {
      isOnlineRef.current = false;
      setSyncStatus('offline');
      setConnectionError('Проблеми зі з\'єднанням. Прогрес збережеться локально');
    };
    const goOnline = () => {
      isOnlineRef.current = true;
      setSyncStatus('synced');
      setConnectionError(null);
    };

    // Initial state
    isOnlineRef.current = navigator.onLine;
    if (!navigator.onLine) goOffline();

    window.addEventListener('offline', goOffline);
    window.addEventListener('online', goOnline);

    return () => {
      window.removeEventListener('offline', goOffline);
      window.removeEventListener('online', goOnline);
    };
  }, []);

  // Multiple tab detection using improved session manager
  useEffect(() => {
    // Initialize the session manager
    initSessionManager();

    // Register callback for duplicate detection
    const unsubscribe = onDuplicateDetected((isDuplicate, source) => {
      setDuplicateTab(isDuplicate);
    });

    // Cleanup on unmount
    return () => {
      unsubscribe();
      stopSessionManager();
    };
  }, []);

  // Use the player's selected epoch (state.epochId) if available
  // Fall back to level-based epoch only for new players
  const epoch = getEpochById(state.epochId);

  useEffect(() => {
    if (isInitialized.current) return;
    isInitialized.current = true;

    (async () => {
      let saved: GameState | null = null;
      try {
        saved = await loadGameState();
      } catch (e) {
        console.error('Failed to load game state:', e);
        setSyncStatus('error');
        setConnectionError('Не вдалося завантажити прогрес. Гратимете з локальної копії.');
        // Try localStorage fallback
        try {
          const raw = localStorage.getItem('ukraine_tap_game_state');
          if (raw) saved = JSON.parse(raw) as GameState;
        } catch {
          // No fallback available — start fresh
        }
      }
      if (saved) {
        const basePassiveXp = calculatePassiveXp(saved.ownedGenerators, saved.unlockedEpochs);
        // Apply passive_income research bonus: +10% per level
        const passiveResearchBonus = 1 + ((saved.prestigeResearch?.passive_income || 0) * 0.10);
        const passiveXp = basePassiveXp * passiveResearchBonus;

        // Phase 3: Use server-side offline income calculation
        // This prevents device clock manipulation and double-claim exploits
        // The Edge Function atomically swaps last_online_at and calculates rewards
        const telegramId = getTelegramUserId();
        let offlineXp = 0;
        let offlineCurrency = 0;

        if (telegramId) {
          try {
            const claimResult = await rpcClaimOfflineIncome(telegramId, false);
            if (claimResult.success && claimResult.xp !== undefined) {
              offlineXp = claimResult.xp;
              offlineCurrency = claimResult.currency || 0;
              
              // Show offline rewards modal if there were significant gains
              if (offlineXp > 100 || offlineCurrency > 10) {
                setOfflineGains({ xp: offlineXp, currency: offlineCurrency });
              }
            }
          } catch (err) {
            console.error('Failed to claim offline income:', err);
            // Fallback to local calculation if server fails
            const serverNow = saved.lastOnlineAt || Date.now();
            const offlineMs = Math.max(0, serverNow - saved.lastSavedAt);
            const prestigeLevel = saved.prestigeLevel || 0;
            const offlineCap = prestigeLevel > 0 ? 6 * 3600 : 8 * 3600;
            const offlineSec = Math.min(offlineMs / 1000, offlineCap);
            offlineXp = passiveXp * offlineSec;
            offlineCurrency = (saved.level * 50) * (offlineSec / 60);
          }
        } else {
          // Non-Telegram users: use local calculation (less critical for non-production)
          const serverNow = saved.lastOnlineAt || Date.now();
          const offlineMs = Math.max(0, serverNow - saved.lastSavedAt);
          const prestigeLevel = saved.prestigeLevel || 0;
          const offlineCap = prestigeLevel > 0 ? 6 * 3600 : 8 * 3600;
          const offlineSec = Math.min(offlineMs / 1000, offlineCap);
          offlineXp = passiveXp * offlineSec;
          offlineCurrency = (saved.level * 50) * (offlineSec / 60);
        }

        // ── Daily streak check ────────────────────────────────────────
        const today = getTodayDateStr();
        const yesterday = getYesterdayDateStr();
        let newStreak = saved.dailyStreak || 0;
        let newBestStreak = saved.bestStreak || 0;
        let newLastLoginDate = saved.lastLoginDate;

        if (saved.lastLoginDate !== today) {
          if (!saved.lastLoginDate) {
            // Brand new player
            newStreak = 1;
          } else if (saved.lastLoginDate === yesterday) {
            newStreak = (saved.dailyStreak || 0) + 1;
          } else {
            // Missed at least one day → reset streak
            newStreak = 1;
          }
          newBestStreak = Math.max(newStreak, saved.bestStreak || 0);
          newLastLoginDate = today;

          // Add streak reward to offline gains so it's shown in the same batch
          const reward = getStreakReward(newStreak);
          offlineXp += reward.xp;
          offlineCurrency += reward.currency;
          setStreakModal({ streak: newStreak, reward });
        }

        // ── Daily tasks: refresh if new day ──────────────────────────
        let dailyTasksState = saved.dailyTasksState;
        if (!dailyTasksState || dailyTasksState.date !== today) {
          dailyTasksState = makeFreshDailyTasks(today);
        }

        // ── Daily check-in: show reward modal if player hasn't claimed today ──
        const checkInToday = getTodayDateStr();
        if (saved.lastCheckIn !== checkInToday) {
          setShowDailyRewards(true);
        }

        setState({
          ...saved,
          xp: saved.xp + offlineXp,
          totalXp: saved.totalXp + offlineXp,
          currency: saved.currency + offlineCurrency,
          totalCurrencyEarned: saved.totalCurrencyEarned + offlineCurrency,
          passiveXpPerSecond: passiveXp,
          lastSavedAt: Date.now(),
          dailyStreak: newStreak,
          bestStreak: newBestStreak,
          lastLoginDate: newLastLoginDate,
          dailyTasksState,
        });
      }
      setIsLoading(false);
    })();
  }, []);

  // Use a stable ref for save so we don't recreate the interval on every state update
  const stateRef = useRef(state);
  stateRef.current = state;

  // ── Dual-layer save: local (fast) + remote (throttled) ──────────────
  // Mark state as dirty whenever it changes — the intervals check this flag
  // to avoid redundant writes when nothing changed.
  useEffect(() => {
    if (isLoading) return;
    dirtyRef.current = true;
  }, [state, isLoading]);

  useEffect(() => {
    if (isLoading) return;

    // Local save: every 2s (cheap, synchronous)
    localSaveRef.current = window.setInterval(() => {
      if (dirtyRef.current) {
        saveLocalState(stateRef.current);
        dirtyRef.current = false;
      }
    }, LOCAL_SAVE_INTERVAL);

    // Remote save: every 15s (expensive, throttled to avoid race conditions)
    remoteSaveRef.current = window.setInterval(async () => {
      if (!isOnlineRef.current) return;
      try {
        setSyncStatus('syncing');
        await saveRemoteState(stateRef.current);
        setSyncStatus('synced');
        // Clear connection error on successful save
        setConnectionError(null);
      } catch (e) {
        console.error('Remote save failed:', e);
        setSyncStatus('error');
        setConnectionError('Проблеми зі з\'єднанням. Прогрес збережеться локально');
      }
    }, REMOTE_SAVE_INTERVAL);

    // Flush both on unmount / tab close
    const flush = async () => {
      saveLocalState(stateRef.current);
      saveRemoteState(stateRef.current);
      // Flush pending taps to server
      if (pendingTapsRef.current > 0) {
        const tapsToFlush = Math.min(pendingTapsRef.current, MAX_TAPS_PER_BATCH);
        if (import.meta.env.DEV) {
          console.log(`[TapSync] Flushing ${tapsToFlush} pending taps on unload`);
        }
        // Fire and forget - don't await to not block page close
        rpcRecordTaps(tapsToFlush).catch(e => {
          console.error('[TapSync] Failed to flush on unload:', e);
        });
      }
    };

    window.addEventListener('beforeunload', flush);

    return () => {
      if (localSaveRef.current) clearInterval(localSaveRef.current);
      if (remoteSaveRef.current) clearInterval(remoteSaveRef.current);
      if (tapFlushTimerRef.current) clearInterval(tapFlushTimerRef.current);
      window.removeEventListener('beforeunload', flush);
      flush();
    };
  }, [isLoading]);

  useEffect(() => {
    if (isLoading) return;

    // Reduced tick interval from 100ms to 250ms (4fps instead of 10fps)
    // This significantly reduces CPU usage while maintaining smooth visual updates
    // For passive income games, 4fps is more than sufficient
    tickRef.current = window.setInterval(() => {
      setState(prev => applyPassiveTick(prev));
    }, 250);

    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, [isLoading]);

  // Phase 8: Periodic passive XP validation
  // Validates that client calculation matches server authoritative value
  useEffect(() => {
    if (isLoading) return;

    // Initial validation after 5 seconds
    const timeout = setTimeout(validatePassiveXp, 5000);

    // Validate passive XP every 60 seconds
    const interval = setInterval(validatePassiveXp, 60000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [isLoading]);

  // Record a tap - uses useTaps hook for visual feedback
  const handleTap = useCallback((x: number, y: number) => {
    const { value, updatedTasks } = recordTap(x, y, state.tapPower, state.passiveXpPerSecond, {
      completedArtifacts: state.completedArtifacts,
      artifactDupes: state.artifactDupes,
      activeBoosters: state.activeBoosters,
      prestigeLevel: state.prestigeLevel,
      prestigeResearch: state.prestigeResearch,
      energy: state.energy,
      dailyTasksState: state.dailyTasksState,
    });

    setState(prev => ({
      ...prev,
      xp: prev.xp + value,
      totalXp: prev.totalXp + value,
      dailyTasksState: updatedTasks,
    }));

    // Notify Battle Pass system of XP earned
    notifyBattlePassXp(value);

    // ── Server-side tap validation (Phase 4) ─────────────────────────────
    // Increment pending tap counter for batched server sync
    pendingTapsRef.current += 1;
    serverSyncXpRef.current += value;

    // Debug logging (shows in browser console)
    if (import.meta.env.DEV && pendingTapsRef.current % 10 === 0) {
      console.log(`[TapSync] Pending: ${pendingTapsRef.current} taps, ~${serverSyncXpRef.current} XP`);
    }

    hapticImpact('light');
  }, [state, recordTap, notifyBattlePassXp]);

  // Backward-compatible alias
  const tap = handleTap;

  // ── Flush pending taps to server ───────────────────────────────────
  const flushPendingTaps = useCallback(async () => {
    if (pendingTapsRef.current === 0) return;
    if (isSyncingRef.current) {
      console.log('[TapSync] Skipping flush - sync already in progress');
      return;
    }
    if (!isOnlineRef.current) {
      console.log('[TapSync] Skipping flush - offline');
      return;
    }

    // Get current pending taps
    const tapsToSync = Math.min(pendingTapsRef.current, MAX_TAPS_PER_BATCH);
    pendingTapsRef.current -= tapsToSync;
    lastFlushRef.current = Date.now();
    isSyncingRef.current = true;

    try {
      const result = await rpcRecordTaps(tapsToSync);
      if (result.ok) {
        if (import.meta.env.DEV) {
          console.log(`[TapSync] ✓ Synced ${tapsToSync} taps, server XP: ${result.xp_gained}`);
        }
      } else {
        // Re-add taps on failure (except if rate limited)
        if (!result.error?.includes('rate') && !result.error?.includes('Rate')) {
          pendingTapsRef.current += tapsToSync;
          console.warn('[TapSync] Failed to sync, re-queued:', result.error);
        } else {
          console.warn('[TapSync] Rate limited, skipping re-queue');
        }
      }
    } catch (e) {
      pendingTapsRef.current += tapsToSync;
      console.error('[TapSync] Error syncing taps:', e);
    } finally {
      isSyncingRef.current = false;
    }
  }, []);

  // Periodic flush of pending taps to server
  useEffect(() => {
    if (isLoading) return;

    const flushInterval = setInterval(() => {
      if (pendingTapsRef.current > 0) {
        flushPendingTaps();
      }
    }, TAP_FLUSH_INTERVAL);

    // Also flush on page unload (best effort)
    const handleBeforeUnload = () => {
      if (pendingTapsRef.current > 0) {
        // Use sendBeacon if available for reliable delivery
        const data = JSON.stringify({ action: 'record_tap', tap_count: Math.min(pendingTapsRef.current, MAX_TAPS_PER_BATCH) });
        if (navigator.sendBeacon) {
          navigator.sendBeacon('/functions/v1/game-action', data);
        }
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      clearInterval(flushInterval);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isLoading, flushPendingTaps]);

  const buyGenerator = useCallback((generatorId: string) => {
    const generator = epoch.generators.find(g => g.id === generatorId);
    if (!generator) return false;

    const currentOwned = state.ownedGenerators.find(og => og.generatorId === generatorId);
    const currentLevel = currentOwned?.level || 0;
    const cost = getGeneratorCost(generator, currentLevel);

    if (state.currency < cost) return false;

    // Phase 4: Use server-side validation for generator purchases
    // Server validates balance, deducts currency, and returns new state
    const telegramId = getTelegramUserId();
    if (telegramId) {
      // Call server-side validation (async, don't wait for response for optimistic update)
      rpcBuyGenerator(generatorId, epoch.id).then(result => {
        if (!result.ok) {
          console.error('Generator purchase failed:', result.error);
          // On failure, state will be out of sync - will be corrected on next load
        }
      }).catch(err => {
        console.error('rpcBuyGenerator error:', err);
      });
    }

    // Optimistic local update (matches expected server state)
    setState(prev => {
      const existing = prev.ownedGenerators.find(og => og.generatorId === generatorId);
      const newOwned = existing
        ? prev.ownedGenerators.map(og =>
            og.generatorId === generatorId ? { ...og, level: og.level + 1 } : og
          )
        : [...prev.ownedGenerators, { generatorId, level: 1 }];

      const { passive: passMult } = getArtifactMultipliers(prev.completedArtifacts || [], prev.artifactDupes || {});
      const newPassiveXp = calculatePassiveXp(newOwned, prev.unlockedEpochs) * passMult;

      const tasks = prev.dailyTasksState;
      const updatedTasks = tasks
        ? { ...tasks, counters: { ...tasks.counters, buy_generator: tasks.counters.buy_generator + 1 } }
        : tasks;

      return {
        ...prev,
        currency: prev.currency - cost,
        ownedGenerators: newOwned,
        passiveXpPerSecond: newPassiveXp,
        dailyTasksState: updatedTasks,
      };
    });

    return true;
  }, [epoch.generators, epoch.id, state.currency, state.ownedGenerators]);

  const upgradeTapPower = useCallback(() => {
    const rawCost = 25 * Math.pow(1.8, state.tapPower - 1);
    // Guard against floating-point overflow at very high tap power levels
    const cost = Number.isFinite(rawCost) ? Math.floor(rawCost) : Number.MAX_SAFE_INTEGER;
    if (state.currency < cost) return false;

    // Phase 4: Use server-side validation for tap upgrades
    const telegramId = getTelegramUserId();
    if (telegramId) {
      // Call server-side validation (async)
      rpcUpgradeTap().then(result => {
        if (!result.ok) {
          console.error('Tap upgrade failed:', result.error);
        }
      }).catch(err => {
        console.error('rpcUpgradeTap error:', err);
      });
    }

    setState(prev => {
      const tasks = prev.dailyTasksState;
      const updatedTasks = tasks
        ? { ...tasks, counters: { ...tasks.counters, upgrade_tap: tasks.counters.upgrade_tap + 1 } }
        : tasks;
      return {
        ...prev,
        currency: prev.currency - cost,
        tapPower: prev.tapPower + 1,
        dailyTasksState: updatedTasks,
      };
    });

    return true;
  }, [state.currency, state.tapPower]);

  const addArtifactPart = useCallback((artifactId: string, isFull: boolean) => {
    const artifact = ARTIFACTS.find(a => a.id === artifactId);

    setState(prev => {
      const newParts = { ...prev.artifactParts };
      const newCompleted = [...(prev.completedArtifacts || [])];
      const newDupes = { ...prev.artifactDupes };
      const newLevels = { ...prev.artifactLevels };

      // Track completions within this operation using a Set to prevent race conditions
      const newlyCompletedInThisOp = new Set<string>();

      // Check if already completed (either in prev state or already added in this op)
      const isAlreadyCompleted = newCompleted.includes(artifactId) || newlyCompletedInThisOp.has(artifactId);

      if (isFull) {
        if (isAlreadyCompleted) {
          // Duplicate of a completed artifact → add fragments for upgrades
          newParts[artifactId] = (newParts[artifactId] || 0) + (artifact?.parts || 10);
        } else {
          // New artifact completion
          newCompleted.push(artifactId);
          newlyCompletedInThisOp.add(artifactId);
          newLevels[artifactId] = 1;
        }
      } else {
        // Add part(s)
        newParts[artifactId] = (newParts[artifactId] || 0) + 1;

        // Auto-complete when all parts collected (only if not already completed)
        if (!isAlreadyCompleted && artifact && newParts[artifactId] >= artifact.parts) {
          newCompleted.push(artifactId);
          newlyCompletedInThisOp.add(artifactId);
          newLevels[artifactId] = 1;
        }
      }

      return { ...prev, artifactParts: newParts, completedArtifacts: newCompleted, artifactDupes: newDupes, artifactLevels: newLevels };
    });
  }, []);

  // Process server-determined chest rewards (server already updated DB)
  const processServerRewards = useCallback((rewards: Array<{ id: string; parts_granted: number }>) => {
    setState(prev => {
      const newParts = { ...prev.artifactParts };
      const newCompleted = [...(prev.completedArtifacts || [])];
      const newLevels = { ...prev.artifactLevels };

      // Track completions within this operation using a Set to prevent race conditions
      const newlyCompletedInThisOp = new Set<string>();

      for (const reward of rewards) {
        const artifact = ARTIFACTS.find(a => a.id === reward.id);

        // Skip if already completed in previous state or already added in this op
        const isAlreadyCompleted = newCompleted.includes(reward.id) || newlyCompletedInThisOp.has(reward.id);
        if (isAlreadyCompleted) continue;

        newParts[reward.id] = (newParts[reward.id] || 0) + reward.parts_granted;

        // Auto-complete if enough parts collected (matches server logic)
        if (artifact && newParts[reward.id] >= artifact.parts) {
          newCompleted.push(reward.id);
          newlyCompletedInThisOp.add(reward.id);
          newLevels[reward.id] = 1;
        }
      }

      return { ...prev, artifactParts: newParts, completedArtifacts: newCompleted, artifactLevels: newLevels };
    });
  }, []);

  // Upgrade artifact level (consume parts for bonus increase)
  const upgradeArtifactLevel = useCallback((artifactId: string) => {
    setState(prev => {
      const currentLevel = prev.artifactLevels?.[artifactId] || 1;
      if (currentLevel >= 4) return prev; // Max level

      const partsRequired = ARTIFACT_PARTS_PER_LEVEL[currentLevel + 1] || 10;
      const currentParts = prev.artifactParts?.[artifactId] || 0;

      if (currentParts < partsRequired) return prev;

      const newParts = { ...prev.artifactParts };
      const newLevels = { ...prev.artifactLevels };

      newParts[artifactId] = currentParts - partsRequired;
      newLevels[artifactId] = currentLevel + 1;

      return { ...prev, artifactParts: newParts, artifactLevels: newLevels };
    });
  }, []);

  const deductGachaCost = useCallback((cost: number): boolean => {
    if (state.currency < cost) return false;
    setState(prev => ({ ...prev, currency: Math.max(0, prev.currency - cost) }));
    return true;
  }, [state.currency]);

  // Refund gacha cost on failure (rollback optimistic deduction)
  const refundGachaCost = useCallback((cost: number) => {
    setState(prev => ({ ...prev, currency: prev.currency + cost }));
  }, []);

  const recordGachaOpen = useCallback(() => {
    setState(prev => {
      const tasks = prev.dailyTasksState;
      if (!tasks) return prev;
      return {
        ...prev,
        dailyTasksState: {
          ...tasks,
          counters: { ...tasks.counters, open_gacha: tasks.counters.open_gacha + 1 },
        },
      };
    });
  }, []);

  // Record when session ad was watched (for session ad timing)
  const recordSessionAdWatched = useCallback(() => {
    setState(prev => ({ ...prev, lastSessionAdAt: Date.now() }));
  }, []);

  const claimDailyTask = useCallback((taskId: string) => {
    const task = getTaskById(taskId);
    if (!task) return;

    setState(prev => {
      const tasks = prev.dailyTasksState;
      if (!tasks || tasks.claimed.includes(taskId)) return prev;
      if (tasks.counters[task.type] < task.target) return prev;

      const reward = task.reward;
      return {
        ...prev,
        currency: prev.currency + (reward.currency || 0),
        totalCurrencyEarned: prev.totalCurrencyEarned + (reward.currency || 0),
        xp: prev.xp + (reward.xp || 0),
        totalXp: prev.totalXp + (reward.xp || 0),
        dailyTasksState: {
          ...tasks,
          claimed: [...tasks.claimed, taskId],
        },
      };
    });
  }, []);

  const dismissConnectionError = useCallback(() => setConnectionError(null), []);

  const claimDailyReward = useCallback(() => {
    const today = getTodayDateStr();
    const yesterday = getYesterdayDateStr();

    let earnedXp = 0;

    setState(prev => {
      if (prev.lastCheckIn === today) return prev; // already claimed today

      let newStreak: number;
      if (!prev.lastCheckIn) {
        newStreak = 1;
      } else if (prev.lastCheckIn === yesterday) {
        newStreak = prev.checkInStreak + 1;
      } else {
        newStreak = 1; // missed a day — reset
      }

      // Import dynamically to avoid circular — but since it's a pure data module, import at top
      const dayInWeek = ((newStreak - 1) % 7) + 1;
      // Inline reward lookup to avoid importing component code here
      const REWARDS = [
        { day: 1, currency: 500,  xp: 0 },
        { day: 2, currency: 1000, xp: 200 },
        { day: 3, currency: 1500, xp: 400 },
        { day: 4, currency: 2000, xp: 600 },
        { day: 5, currency: 3000, xp: 800 },
        { day: 6, currency: 4000, xp: 1000 },
        { day: 7, currency: 5000, xp: 1500 },
      ];
      const reward = REWARDS.find(r => r.day === dayInWeek) || REWARDS[0];

      // For day 7 special: grant a gacha ticket by adding 100 currency equivalent
      const bonusCurrency = reward.currency + (dayInWeek === 7 ? 100 : 0);
      earnedXp = reward.xp;

      return {
        ...prev,
        lastCheckIn: today,
        checkInStreak: newStreak,
        currency: prev.currency + bonusCurrency,
        totalCurrencyEarned: prev.totalCurrencyEarned + bonusCurrency,
        xp: prev.xp + reward.xp,
        totalXp: prev.totalXp + reward.xp,
      };
    });

    // Notify Battle Pass system
    if (earnedXp > 0) {
      notifyBattlePassXp(earnedXp);
    }

    setShowDailyRewards(false);
  }, [notifyBattlePassXp]);

  const switchEpoch = useCallback((epochId: EpochId) => {
    if (!state.unlockedEpochs.includes(epochId)) return;
    setState(prev => ({ ...prev, epochId }));
    // Force immediate remote save for important state change
    saveRemoteState({ ...state, epochId }).catch(e => {
      console.error('switchEpoch remote save failed:', e);
      setSyncStatus('error');
      setConnectionError('Проблеми зі з\'єднанням. Прогрес збережеться локально');
    });
  }, [state.unlockedEpochs, state]);

  const loadLeaderboard = useCallback(async () => {
    setLeaderboardLoading(true);
    try {
      const data = await getLeaderboard(50);
      setLeaderboard(data);

      const telegramId = getTelegramUserId();
      if (telegramId) {
        const rank = await getUserRank(telegramId);
        setUserRank(rank);
      }
    } catch (e) {
      console.error('Failed to load leaderboard:', e);
      setConnectionError('Не вдалося завантажити таблицю лідерів');
    }
    setLeaderboardLoading(false);
  }, []);

  const dismissOfflineGains = useCallback(() => setOfflineGains(null), []);

  // Called after a successful Telegram Stars purchase to pull fresh boosters from DB
  const refreshBoosters = useCallback(async () => {
    const telegramIdLocal = getTelegramUserId();
    if (!telegramIdLocal) return;
    try {
      const fresh = await fetchActiveBoosters(telegramIdLocal);
      setState(prev => ({ ...prev, activeBoosters: fresh }));
    } catch (e) {
      console.error('Failed to refresh boosters:', e);
      setConnectionError('Не вдалося оновити бустери');
    }
  }, []);

  // ═══════════════════════════════════════════════════════════════════════
  // PRESTIGE SYSTEM
  // ═══════════════════════════════════════════════════════════════════════

  // Check if player can prestige (level >= 950, epoch = independence)
  const canPrestige = state.level >= 950 && state.epochId === 'independence';

  // Perform prestige (rebirth) - SERVER AUTHORITATIVE
  const performPrestige = useCallback(async () => {
    if (!canPrestige) return false;

    const telegramIdLocal = getTelegramUserId();
    if (!telegramIdLocal) return false;

    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/perform-prestige`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telegram_id: telegramIdLocal }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        console.error('Prestige failed:', data.error);
        return false;
      }

      // Update local state with server response
      setState(prev => ({
        ...prev,
        // RESET:
        level: 1,
        xp: 0,
        xpToNextLevel: calculateXpToLevel(1),
        totalXp: 0,
        currency: 20,
        totalCurrencyEarned: 20,
        ownedGenerators: [],
        epochId: 'trypillia',
        unlockedEpochs: ['trypillia'],
        tapPower: 1,
        passiveXpPerSecond: 0,
        activeBoosters: {},
        artifactParts: {},
        artifactDupes: {},
        // PRESERVE:
        completedArtifacts: prev.completedArtifacts,
        artifactLevels: prev.artifactLevels,
        dailyStreak: prev.dailyStreak,
        bestStreak: prev.bestStreak,
        lastLoginDate: prev.lastLoginDate,
        referralsCount: prev.referralsCount,
        referralEarnings: prev.referralEarnings,
        prestigeResearch: prev.prestigeResearch,
        // INCREMENT:
        prestigeLevel: data.prestige_level,
        prestigePoints: data.total_prestige_points,
        // Energy reset to full (respecting energy_capacity upgrade)
        energy: 1000 + ((prev.prestigeResearch?.energy_capacity || 0) * 100),
        maxEnergy: 1000 + ((prev.prestigeResearch?.energy_capacity || 0) * 100),
        lastSavedAt: Date.now(),
        lastOnlineAt: Date.now(),
        sessionStartAt: Date.now(),
        lastSessionAdAt: 0,
      }));

      hapticNotification('success');
      return true;
    } catch (err) {
      console.error('Prestige error:', err);
      return false;
    }
  }, [canPrestige]);

  // ═══════════════════════════════════════════════════════════════════════
  // MUSEUM LABORATORY (Prestige Shop)
  // ═══════════════════════════════════════════════════════════════════════

  const buyPrestigeUpgrade = useCallback((upgradeId: string, cost: number, maxLevel: number) => {
    setState(prev => {
      const currentPoints = prev.prestigePoints || 0;
      const currentResearch = prev.prestigeResearch || {};
      const currentLevel = currentResearch[upgradeId as keyof typeof currentResearch] || 0;

      if (currentPoints < cost) return prev;
      if (currentLevel >= maxLevel) return prev;

      return {
        ...prev,
        prestigePoints: currentPoints - cost,
        prestigeResearch: {
          ...currentResearch,
          [upgradeId]: currentLevel + 1,
        },
      };
    });

    hapticNotification('success');
    return true;
  }, []);

  // ═══════════════════════════════════════════════════════════════════════
  // ENERGY SYSTEM (Only after Prestige 1+)
  // ═══════════════════════════════════════════════════════════════════════

  // Use energy on tap (only for prestige 1+)
  const useEnergy = useCallback(() => {
    if ((state.prestigeLevel || 0) < 1) return false;

    setState(prev => {
      if (prev.energy <= 0) return prev;
      return { ...prev, energy: prev.energy - 1 };
    });

    hapticImpact('light');
    return true;
  }, [state.prestigeLevel, state.energy]);

  // Regenerate energy: +10 energy per 30 seconds (20/minute total)
  // Phase 6: Faster regeneration for better gameplay feel
  const regenerateEnergy = useCallback(() => {
    if ((state.prestigeLevel || 0) < 1) return;

    const now = Date.now();
    const lastOnline = state.lastOnlineAt || now;
    const elapsedMs = now - lastOnline;
    const REGEN_INTERVAL_MS = 30 * 1000; // 30 seconds
    const REGEN_AMOUNT = 10; // 10 energy per 30 seconds = 20/minute
    const MAX_ENERGY = 1000 + ((state.prestigeResearch?.energy_capacity || 0) * 100);

    // Calculate how many regen cycles have passed
    const cycles = Math.floor(elapsedMs / REGEN_INTERVAL_MS);
    const energyToAdd = cycles * REGEN_AMOUNT;

    if (energyToAdd > 0 || (state.energy || 0) < MAX_ENERGY) {
      setState(prev => {
        const currentEnergy = prev.energy || 0;
        const maxE = 1000 + ((prev.prestigeResearch?.energy_capacity || 0) * 100);
        if (currentEnergy >= maxE && energyToAdd <= 0) return prev;

        const newEnergy = Math.min(maxE, currentEnergy + Math.max(0, energyToAdd));
        return {
          ...prev,
          energy: newEnergy,
          lastOnlineAt: now,
        };
      });
    }
  }, [state.prestigeLevel, state.lastOnlineAt, state.energy, state.prestigeResearch]);

  // Energy regeneration interval - check every 30 seconds
  useEffect(() => {
    if ((state.prestigeLevel || 0) < 1) return;
    if (isLoading) return;

    // Initial regeneration check
    regenerateEnergy();

    const interval = setInterval(regenerateEnergy, 30 * 1000); // Every 30 seconds
    return () => clearInterval(interval);
  }, [state.prestigeLevel, isLoading, regenerateEnergy]);

  const rawTapCost = 25 * Math.pow(1.8, state.tapPower - 1);
  const tapPowerCost = Number.isFinite(rawTapCost) ? Math.floor(rawTapCost) : Number.MAX_SAFE_INTEGER;
  const telegramId = getTelegramUserId();
  const artifactMultipliers = getArtifactMultipliers(state.completedArtifacts || [], state.artifactDupes || {});
  const boosterMultipliers = getBoosterMultipliers(state.activeBoosters || {});

  return {
    state,
    epoch,
    tapEvents,
    tap,
    buyGenerator,
    upgradeTapPower,
    switchEpoch,
    tapPowerCost,
    addArtifactPart,
    processServerRewards,
    upgradeArtifactLevel,
    deductGachaCost,
    refundGachaCost,
    recordGachaOpen,
    claimDailyTask,
    isLoading,
    telegramId,
    leaderboard,
    userRank,
    leaderboardLoading,
    loadLeaderboard,
    artifactMultipliers,
    boosterMultipliers,
    refreshBoosters,
    offlineGains,
    dismissOfflineGains,
    duplicateTab,
    streakModal,
    dismissStreakModal,
    syncStatus,
    connectionError,
    dismissConnectionError,
    recordSessionAdWatched,
    showDailyRewards,
    claimDailyReward,
    skipDailyRewards: useCallback(() => setShowDailyRewards(false), []),
    // Prestige System
    canPrestige,
    performPrestige,
    buyPrestigeUpgrade,
    // Energy System
    useEnergy,
    getEnergyMultiplier,
    regenerateEnergy,
    // Battle Pass Integration
    registerBattlePassXpCallback,
  };
}
