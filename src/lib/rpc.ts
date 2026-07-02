import { supabase } from './supabase';
import { getRawInitData, getTelegramUserId } from './telegram';

/**
 * Client-side helper for server-authoritative game actions.
 *
 * Every call sends the raw `initData` string to the edge function, which
 * validates it via HMAC-SHA256 before executing the action.  This prevents
 * users from manipulating game state via DevTools.
 *
 * Currently implemented server-side:
 *   - upgrade_tap   — deducts currency and increments tap_power
 *   - switch_epoch  — verifies epoch is unlocked, updates epoch_id
 *
 * Future (requires server-side generator definitions):
 *   - buy_generator — verify balance, deduct cost, add generator
 */

interface RpcResult {
  ok: boolean;
  error?: string;
  [key: string]: unknown;
}

async function callGameAction(payload: Record<string, unknown>): Promise<RpcResult> {
  if (!supabase) return { ok: false, error: 'No Supabase connection' };

  const init_data = getRawInitData();
  if (!init_data) return { ok: false, error: 'Not running in Telegram' };

  const telegramId = getTelegramUserId();
  if (!telegramId) return { ok: false, error: 'No Telegram user ID' };

  try {
    const { data, error } = await supabase.functions.invoke('game-action', {
      body: { ...payload, init_data },
    });

    if (error) {
      return { ok: false, error: error.message || 'Edge function error' };
    }

    return data as RpcResult;
  } catch (e) {
    console.error('callGameAction error:', e);
    return { ok: false, error: String(e) };
  }
}

export async function rpcUpgradeTap(): Promise<RpcResult> {
  return callGameAction({ action: 'upgrade_tap' });
}

export async function rpcSwitchEpoch(epochId: string): Promise<RpcResult> {
  return callGameAction({ action: 'switch_epoch', epoch_id: epochId });
}

export async function rpcBuyGenerator(generatorId: string): Promise<RpcResult> {
  return callGameAction({ action: 'buy_generator', generator_id: generatorId });
}

/**
 * Open chest server-side. Returns artifact rewards determined by server RNG.
 * The server updates artifact_parts/artifact_levels/completed_artifacts in DB.
 */
export async function rpcOpenChest(
  telegramId: number,
  epochId: string,
  chestType: 'daily' | 'skychest' = 'daily',
  epochIndex: number = 0,
): Promise<{
  ok: boolean;
  error?: string;
  rewards?: Array<{
    id: string;
    epoch: string;
    rarity: string;
    parts_granted: number;
    icon: string;
    name: { ua: string; en: string };
  }>;
}> {
  if (!supabase) return { ok: false, error: 'No Supabase connection' };

  const init_data = getRawInitData();
  if (!init_data) return { ok: false, error: 'Not running in Telegram' };

  try {
    const { data, error } = await supabase.functions.invoke('open-chest', {
      body: { init_data, telegram_id: telegramId, epoch_id: epochId, chest_type: chestType, epoch_index: epochIndex },
    });

    if (error) return { ok: false, error: error.message || 'Edge function error' };

    return { ok: true, rewards: data?.rewards || [] };
  } catch (e) {
    console.error('rpcOpenChest error:', e);
    return { ok: false, error: String(e) };
  }
}

/**
 * Track session start/end for analytics.
 */
export async function rpcTrackSession(
  telegramId: number,
  event: 'start' | 'activity' | 'end',
): Promise<{ ok: boolean }> {
  if (!supabase) return { ok: false };

  const init_data = getRawInitData();
  if (!init_data) return { ok: false };

  try {
    await supabase.functions.invoke('track-session', {
      body: { init_data, telegram_id: telegramId, event },
    });
    return { ok: true };
  } catch {
    return { ok: false };
  }
}

/**
 * Validate initData on the server. Returns { valid, user_id } or error.
 * Useful for one-shot validation at app startup or before critical actions.
 */
export async function rpcValidateInitData(): Promise<{ valid: boolean; user_id?: number; error?: string }> {
  if (!supabase) return { valid: false, error: 'No Supabase connection' };

  const init_data = getRawInitData();
  if (!init_data) return { valid: false, error: 'Not running in Telegram' };

  try {
    const { data, error } = await supabase.functions.invoke('validate-init-data', {
      body: { init_data },
    });

    if (error) return { valid: false, error: error.message };
    return data as { valid: boolean; user_id?: number; error?: string };
  } catch (e) {
    console.error('rpcValidateInitData error:', e);
    return { valid: false, error: String(e) };
  }
}

/**
 * Save game state server-side via edge function (Phase 2 RLS fix).
 * This routes through HMAC-validated edge function instead of direct Supabase access.
 */
export async function rpcSaveGameState(
  telegramId: number,
  data: Record<string, unknown>,
  deviceId?: string,
): Promise<{ success: boolean; error?: string }> {
  if (!supabase) return { success: false, error: 'No Supabase connection' };

  const init_data = getRawInitData();
  if (!init_data) return { success: false, error: 'Not running in Telegram' };

  try {
    const { error } = await supabase.functions.invoke('save-game-state', {
      body: { init_data, data: { ...data, telegram_id: telegramId, device_id: deviceId } },
    });

    if (error) {
      console.error('rpcSaveGameState error:', error);
      return { success: false, error: error.message || 'Edge function error' };
    }

    return { success: true };
  } catch (e) {
    console.error('rpcSaveGameState error:', e);
    return { success: false, error: String(e) };
  }
}

/**
 * Load game state server-side via edge function (Phase 2 RLS fix).
 * This routes through HMAC-validated edge function instead of direct Supabase access.
 */
export async function rpcLoadGameState(
  telegramId?: number,
  deviceId?: string,
): Promise<{ data: Record<string, unknown> | null; error?: string }> {
  if (!supabase) return { data: null, error: 'No Supabase connection' };

  // For loading, we don't require init_data if using device_id (non-Telegram users)
  // But if using telegram_id, we need init_data for HMAC validation
  const init_data = telegramId ? getRawInitData() : undefined;

  try {
    const { data: result, error } = await supabase.functions.invoke('load-game-state', {
      body: { init_data, telegram_id: telegramId, device_id: deviceId },
    });

    if (error) {
      console.error('rpcLoadGameState error:', error);
      return { data: null, error: error.message || 'Edge function error' };
    }

    return { data: result?.data || null };
  } catch (e) {
    console.error('rpcLoadGameState error:', e);
    return { data: null, error: String(e) };
  }
}

/**
 * Get leaderboard via edge function (Phase 2 RLS fix).
 * Uses service_role access to fetch leaderboard data.
 */
export async function rpcGetLeaderboard(
  limit: number = 50,
): Promise<Array<{
  telegram_id: number;
  first_name: string | null;
  username: string | null;
  level: number;
  total_xp: number;
  prestige_level: number;
  referrals_count: number;
  rank: number;
}>> {
  if (!supabase) return [];

  const init_data = getRawInitData();

  try {
    const { data, error } = await supabase.functions.invoke('get-leaderboard', {
      body: { init_data, limit },
    });

    if (error) {
      console.error('rpcGetLeaderboard error:', error);
      return [];
    }

    return data?.data || [];
  } catch (e) {
    console.error('rpcGetLeaderboard error:', e);
    return [];
  }
}

/**
 * Apply referral bonus via edge function (Phase 2 RLS fix).
 * Uses HMAC validation to ensure only legitimate referrer updates.
 */
export async function rpcApplyReferralBonus(
  referrerId: number,
): Promise<{ success: boolean; error?: string }> {
  if (!supabase) return { success: false, error: 'No Supabase connection' };

  const init_data = getRawInitData();
  if (!init_data) return { success: false, error: 'Not running in Telegram' };

  try {
    const { error } = await supabase.functions.invoke('apply-referral-bonus', {
      body: { init_data, referrer_id: referrerId },
    });

    if (error) {
      console.error('rpcApplyReferralBonus error:', error);
      return { success: false, error: error.message || 'Edge function error' };
    }

    return { success: true };
  } catch (e) {
    console.error('rpcApplyReferralBonus error:', e);
    return { success: false, error: String(e) };
  }
}

/**
 * Get user's rank via edge function (Phase 2 RLS fix).
 */
export async function rpcGetUserRank(
  telegramId: number,
): Promise<number | null> {
  if (!supabase) return null;

  const init_data = getRawInitData();
  if (!init_data) return null;

  try {
    const { data, error } = await supabase.functions.invoke('get-user-rank', {
      body: { init_data, telegram_id: telegramId },
    });

    if (error) {
      console.error('rpcGetUserRank error:', error);
      return null;
    }

    return data?.rank ?? null;
  } catch (e) {
    console.error('rpcGetUserRank error:', e);
    return null;
  }
}

/**
 * Fetch active boosters via edge function (Phase 2 RLS fix).
 */
export async function rpcFetchActiveBoosters(
  telegramId: number,
): Promise<Record<string, unknown>> {
  if (!supabase) return {};

  const init_data = getRawInitData();
  if (!init_data) return {};

  try {
    const { data, error } = await supabase.functions.invoke('fetch-active-boosters', {
      body: { init_data, telegram_id: telegramId },
    });

    if (error) {
      console.error('rpcFetchActiveBoosters error:', error);
      return {};
    }

    return data?.boosters ?? {};
  } catch (e) {
    console.error('rpcFetchActiveBoosters error:', e);
    return {};
  }
}
