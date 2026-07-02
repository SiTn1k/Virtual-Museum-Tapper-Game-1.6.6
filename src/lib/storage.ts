import { supabase } from './supabase';
import { GameState, EpochId, OwnedGenerator, LeaderboardEntry, ActiveBoosters, DailyTasksState, PrestigeResearch, DailyAdViews, Epoch } from '../types/game';
import { getTelegramUserId, getTelegramUserInfo, getReferrerId } from './telegram';
import { getCurrentEpochByLevel, EPOCHS } from '../data/epochs';
import { rpcSaveGameState, rpcLoadGameState, rpcGetLeaderboard, rpcApplyReferralBonus, rpcGetUserRank, rpcFetchActiveBoosters } from './rpc';

const LOCAL_STORAGE_KEY = 'ukraine_tap_game_state';
const DEVICE_ID_KEY = 'ukraine_tap_device_id';

export const REFERRER_BONUS = 100;
export const NEW_USER_BONUS = 50;

// Offline income caps
export const OFFLINE_CAP_PRESTIGE_0 = 8 * 3600; // 8 hours in seconds
export const OFFLINE_CAP_PRESTIGE_1 = 6 * 3600; // 6 hours in seconds

// Ensure unlockedEpochs includes all epochs the player has reached
function fixUnlockedEpochs(saved: EpochId[], level: number, currentEpochId: EpochId): EpochId[] {
  const result = new Set<EpochId>(saved);
  result.add(currentEpochId);
  for (const epoch of EPOCHS) {
    if (epoch.unlockLevel <= level) {
      result.add(epoch.id as EpochId);
    }
  }
  return [...result];
}

function calculateXpToLevel(level: number): number {
  const epoch = getCurrentEpochByLevel(level);
  const { min, max } = epoch.levelRange;
  const rangeSize = Math.max(1, max - min + 1);
  const progress = Math.min(1, Math.max(0, (level - min) / rangeSize));

  const epochIndex = EPOCHS.findIndex(e => e.id === epoch.id);
  let minSeconds: number;
  let maxSeconds: number;

  if (epochIndex === 0) {
    minSeconds = 60;
    maxSeconds = 300;
  } else if (epochIndex === 1) {
    minSeconds = 60;
    maxSeconds = 480;
  } else if (epochIndex === 2) {
    minSeconds = 120;
    maxSeconds = 900;
  } else {
    minSeconds = 120 + (epochIndex - 3) * 60;
    maxSeconds = 1800 + (epochIndex - 3) * 600;
  }

  const targetSeconds = minSeconds + progress * (maxSeconds - minSeconds);
  const levelInEpoch = Math.max(1, level - min + 1);
  const estimatedPassive = estimatePassiveForEpoch(epoch, levelInEpoch);
  return Math.max(50, Math.floor(estimatedPassive * targetSeconds));
}

function estimatePassiveForEpoch(epoch: Epoch, levelInEpoch: number): number {
  const tierWeights = [1, 0.5, 0.25, 0.1, 0.03];
  let total = 0;
  for (let i = 0; i < epoch.generators.length && i < tierWeights.length; i++) {
    const g = epoch.generators[i];
    const owned = Math.max(1, Math.floor(levelInEpoch * tierWeights[i]));
    total += g.baseProduction * owned;
  }
  return Math.max(1, total);
}

function ensureJson<T>(value: T | string): T {
  if (typeof value === 'string') {
    try { return JSON.parse(value) as T; } catch { /* Return original value */ }
  }
  return value as T;
}

function sanitizeId(value: number | null | undefined): number | null {
  return value && value > 0 ? value : null;
}

function getDeviceId(): string {
  let id = localStorage.getItem(DEVICE_ID_KEY);
  if (!id) {
    id = 'dev_' + crypto.randomUUID();
    localStorage.setItem(DEVICE_ID_KEY, id);
  }
  return id;
}

export { getTelegramUserId, getTelegramUserInfo, getReferrerId } from './telegram';

export function saveLocalState(state: GameState): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({
      ...state,
      lastSavedAt: Date.now(),
    }));
  } catch (e) {
    console.error('localStorage save failed:', e);
  }
}

export async function saveRemoteState(state: GameState): Promise<void> {
  if (!supabase) return;

  const telegramId = getTelegramUserId();
  const userInfo = getTelegramUserInfo();
  const deviceId = getDeviceId();

  const boostersWithDaily: ActiveBoosters = {
    ...state.activeBoosters,
    _daily: {
      streak: state.dailyStreak || 0,
      best: state.bestStreak || 0,
      lastDate: state.lastLoginDate || null,
      tasks: state.dailyTasksState || null,
    },
  };

  const payload = {
    epoch_id: state.epochId,
    level: state.level,
    xp: state.xp,
    xp_to_next_level: state.xpToNextLevel,
    total_xp: state.totalXp,
    currency: state.currency,
    total_currency_earned: state.totalCurrencyEarned,
    tap_power: state.tapPower,
    passive_xp_per_second: state.passiveXpPerSecond,
    owned_generators: ensureJson(state.ownedGenerators) as OwnedGenerator[],
    unlocked_epochs: ensureJson(state.unlockedEpochs) as string[],
    artifact_parts: ensureJson(state.artifactParts || {}) as Record<string, number>,
    artifact_levels: ensureJson(state.artifactLevels || {}) as Record<string, number>,
    completed_artifacts: ensureJson(state.completedArtifacts || []) as string[],
    artifact_dupes: ensureJson(state.artifactDupes || {}) as Record<string, number>,
    referrer_id: sanitizeId(state.referrerId),
    referrals_count: state.referralsCount || 0,
    referral_earnings: state.referralEarnings || 0,
    username: userInfo?.username || null,
    first_name: userInfo?.first_name || null,
    photo_url: userInfo?.photo_url || null,
    last_saved_at: new Date().toISOString(),
    active_boosters: boostersWithDaily,
    last_check_in: state.lastCheckIn || null,
    current_streak: state.checkInStreak || 0,
    // Phase 2 fields
    prestige_level: state.prestigeLevel || 0,
    prestige_points: state.prestigePoints || 0,
    prestige_research: ensureJson(state.prestigeResearch || {}) as PrestigeResearch,
    energy: state.energy ?? 1000,
    max_energy: state.maxEnergy ?? 1000,
    last_online_at: new Date().toISOString(),
    session_start_at: new Date(state.sessionStartAt || Date.now()).toISOString(),
    daily_ad_views: ensureJson(state.dailyAdViews || {}) as DailyAdViews,
  };

  try {
    // Use edge function for Telegram users (HMAC validated)
    if (telegramId) {
      const result = await rpcSaveGameState(telegramId, payload, deviceId);
      if (!result.success) {
        console.error('Edge function save failed:', result.error);
      }
    }
    // For non-Telegram users, skip remote save (they don't have init_data)
    // This is a fallback - the localStorage save still works
  } catch (e) {
    console.error('Remote save failed:', e);
  }
}

export async function loadGameState(): Promise<GameState | null> {
  const telegramId = getTelegramUserId();
  const referrerId = getReferrerId();
  const deviceId = getDeviceId();

  if (supabase) {
    try {
      // Use edge function for Telegram users (HMAC validated)
      if (telegramId) {
        const result = await rpcLoadGameState(telegramId);
        if (result.data) {
          localStorage.removeItem(LOCAL_STORAGE_KEY);
          return hydrateFromDb(result.data);
        }
        
        // New user - create record via edge function
        const userInfo = getTelegramUserInfo();
        let bonus = 20;

        if (referrerId && referrerId !== telegramId) {
          await applyReferralBonus(telegramId, referrerId);
          bonus = 20 + NEW_USER_BONUS;
        }

        const newRow = {
          telegram_id: telegramId,
          epoch_id: 'trypillia',
          level: 1,
          xp: 0,
          xp_to_next_level: 100,
          total_xp: 0,
          currency: bonus,
          total_currency_earned: bonus,
          tap_power: 1,
          passive_xp_per_second: 0,
          owned_generators: [],
          unlocked_epochs: ['trypillia'],
          artifact_parts: {},
          artifact_levels: {},
          completed_artifacts: [],
          artifact_dupes: {},
          referrer_id: referrerId && referrerId !== telegramId ? sanitizeId(referrerId) : null,
          referrals_count: 0,
          referral_earnings: 0,
          active_boosters: {},
          username: userInfo?.username ?? null,
          first_name: userInfo?.first_name ?? null,
          photo_url: userInfo?.photo_url ?? null,
          last_saved_at: new Date().toISOString(),
          prestige_level: 0,
          prestige_points: 0,
          prestige_research: {},
          energy: 1000,
          max_energy: 1000,
          last_online_at: new Date().toISOString(),
          session_start_at: new Date().toISOString(),
          daily_ad_views: {},
          device_id: deviceId,
        };

        // Save via edge function
        await rpcSaveGameState(telegramId, newRow);

        const hasRef = Boolean(referrerId && referrerId !== telegramId);
        return {
          epochId: 'trypillia',
          level: 1,
          xp: 0,
          xpToNextLevel: calculateXpToLevel(1),
          totalXp: 0,
          currency: bonus,
          totalCurrencyEarned: bonus,
          tapPower: 1,
          passiveXpPerSecond: 0,
          ownedGenerators: [],
          unlockedEpochs: ['trypillia'],
          artifactParts: {},
          artifactLevels: {},
          completedArtifacts: [],
          artifactDupes: {},
          lastSavedAt: Date.now(),
          referrerId: hasRef ? sanitizeId(referrerId) : null,
          referralsCount: 0,
          referralEarnings: 0,
          activeBoosters: {},
          dailyStreak: 0,
          bestStreak: 0,
          lastLoginDate: null,
          dailyTasksState: null,
          lastCheckIn: null,
          checkInStreak: 0,
          prestigeLevel: 0,
          prestigePoints: 0,
          prestigeResearch: {},
          energy: 1000,
          maxEnergy: 1000,
          lastOnlineAt: Date.now(),
          sessionStartAt: Date.now(),
          dailyAdViews: {},
        };
      }
    } catch (e) {
      console.error('Supabase load failed:', e);
    }
  }

  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as GameState;
    return sanitizeLoadedState(parsed);
  } catch (e) {
    console.error('localStorage load failed:', e);
    return null;
  }
}

function hydrateFromDb(data: Record<string, unknown>): GameState {
  const rawDate = data.last_saved_at as string | null;
  const parsedTime = rawDate ? new Date(rawDate).getTime() : NaN;
  const lastSavedAt = Number.isFinite(parsedTime) ? parsedTime : Date.now();
  const level = (data.level as number) || 1;

  const rawBoosters = (data.active_boosters as ActiveBoosters) || {};
  const daily = rawBoosters._daily;
  const { _daily: _ignored, ...activeBoosters } = rawBoosters;
  void _ignored;

  // Parse last_online_at and session_start_at
  const lastOnlineRaw = data.last_online_at as string | null;
  const lastOnlineAt = lastOnlineRaw ? new Date(lastOnlineRaw).getTime() : Date.now();

  const sessionStartRaw = data.session_start_at as string | null;
  const sessionStartAt = sessionStartRaw ? new Date(sessionStartRaw).getTime() : Date.now();

  return {
    epochId: (data.epoch_id as EpochId) || 'trypillia',
    level,
    xp: (data.xp as number) || 0,
    xpToNextLevel: (data.xp_to_next_level as number) || calculateXpToLevel(level),
    totalXp: (data.total_xp as number) || 0,
    currency: (data.currency as number) || 0,
    totalCurrencyEarned: (data.total_currency_earned as number) || 0,
    tapPower: (data.tap_power as number) || 1,
    passiveXpPerSecond: (data.passive_xp_per_second as number) || 0,
    ownedGenerators: (data.owned_generators as OwnedGenerator[]) || [],
    unlockedEpochs: fixUnlockedEpochs(
      ((data.unlocked_epochs as string[]) || ['trypillia']) as EpochId[],
      level,
      (data.epoch_id as EpochId) || 'trypillia',
    ),
    artifactParts: (data.artifact_parts as Record<string, number>) || {},
    artifactLevels: (data.artifact_levels as Record<string, number>) || {},
    completedArtifacts: (data.completed_artifacts as string[]) || [],
    artifactDupes: (data.artifact_dupes as Record<string, number>) || {},
    lastSavedAt,
    referrerId: sanitizeId(data.referrer_id as number),
    referralsCount: (data.referrals_count as number) || 0,
    referralEarnings: (data.referral_earnings as number) || 0,
    activeBoosters,
    dailyStreak: daily?.streak || 0,
    bestStreak: daily?.best || 0,
    lastLoginDate: daily?.lastDate || null,
    dailyTasksState: (daily?.tasks as DailyTasksState) || null,
    lastCheckIn: (data.last_check_in as string) || null,
    checkInStreak: (data.current_streak as number) || 0,
    // Phase 2 fields with defaults for backward compatibility
    prestigeLevel: (data.prestige_level as number) || 0,
    prestigePoints: (data.prestige_points as number) || 0,
    prestigeResearch: (data.prestige_research as PrestigeResearch) || {},
    energy: (data.energy as number) ?? 1000,
    maxEnergy: (data.max_energy as number) ?? 1000,
    lastOnlineAt,
    sessionStartAt,
    dailyAdViews: (data.daily_ad_views as DailyAdViews) || {},
  };
}

function sanitizeLoadedState(parsed: GameState): GameState {
  const rawBoosters = parsed.activeBoosters || {};
  const daily = rawBoosters._daily;
  const { _daily: _ignored, ...cleanBoosters } = rawBoosters;
  void _ignored;

  return {
    ...parsed,
    artifactParts: parsed.artifactParts || {},
    artifactLevels: parsed.artifactLevels || {},
    completedArtifacts: parsed.completedArtifacts || [],
    artifactDupes: parsed.artifactDupes || {},
    referrerId: sanitizeId(parsed.referrerId),
    referralsCount: parsed.referralsCount || 0,
    referralEarnings: parsed.referralEarnings || 0,
    activeBoosters: cleanBoosters,
    lastSavedAt: Number.isFinite(parsed.lastSavedAt) ? parsed.lastSavedAt : Date.now(),
    dailyStreak: parsed.dailyStreak || daily?.streak || 0,
    bestStreak: parsed.bestStreak || daily?.best || 0,
    lastLoginDate: parsed.lastLoginDate || daily?.lastDate || null,
    dailyTasksState: parsed.dailyTasksState || daily?.tasks || null,
    // Phase 2 defaults
    prestigeLevel: parsed.prestigeLevel || 0,
    prestigePoints: parsed.prestigePoints || 0,
    prestigeResearch: parsed.prestigeResearch || {},
    energy: parsed.energy ?? 1000,
    maxEnergy: parsed.maxEnergy ?? 1000,
    lastOnlineAt: parsed.lastOnlineAt || Date.now(),
    sessionStartAt: parsed.sessionStartAt || Date.now(),
    dailyAdViews: parsed.dailyAdViews || {},
  };
}

async function applyReferralBonus(newUserId: number, referrerId: number): Promise<void> {
  // Use edge function for HMAC-validated referral bonus
  const result = await rpcApplyReferralBonus(referrerId);
  if (!result.success) {
    console.error('Failed to apply referral bonus:', result.error);
  }
}

export async function getLeaderboard(limit = 50): Promise<LeaderboardEntry[]> {
  // Use edge function for leaderboard (Phase 2 RLS fix)
  const data = await rpcGetLeaderboard(limit);
  return data.map((row) => ({
    telegram_id: row.telegram_id,
    first_name: row.first_name,
    username: row.username,
    level: row.level,
    total_xp: row.total_xp,
    prestige_level: row.prestige_level || 0,
    referrals_count: row.referrals_count || 0,
    rank: row.rank,
  }));
}

export async function getUserRank(telegramId: number): Promise<number | null> {
  // Use edge function for user rank (Phase 2 RLS fix)
  return rpcGetUserRank(telegramId);
}

export async function fetchActiveBoosters(telegramId: number): Promise<ActiveBoosters> {
  // Use edge function for active boosters (Phase 2 RLS fix)
  const boosters = await rpcFetchActiveBoosters(telegramId);
  return boosters as ActiveBoosters;
}

export function calculateOfflineCap(prestigeLevel: number): number {
  return prestigeLevel > 0 ? OFFLINE_CAP_PRESTIGE_1 : OFFLINE_CAP_PRESTIGE_0;
}
