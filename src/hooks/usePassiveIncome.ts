/**
 * Virtual Museum Tapper Game — usePassiveIncome
 * Utility functions for passive XP calculation, generation, and validation
 */

import type { OwnedGenerator, EpochId, GameState, ActiveBoosters } from '../types/game';
import { EPOCHS, getEpochById, getGeneratorProduction, getCurrentEpochByLevel } from '../data/epochs';
import { getArtifactMultipliers, getBoosterMultipliers } from './useGame';
import { rpcValidatePassiveXp } from '../lib/rpc';
import { getTelegramUserId } from '../lib/storage';

const MAX_LEVEL = 999;

export interface PassiveIncomeConfig {
  ownedGenerators: OwnedGenerator[];
  unlockedEpochs: EpochId[];
  completedArtifacts?: string[];
  artifactDupes?: Record<string, number>;
  activeBoosters?: ActiveBoosters;
  prestigeResearch?: Record<string, number>;
}

/**
 * Calculate XP required for a specific level
 * Tuned for ~15 hours to reach Epoch 3 (level 100)
 */
export function calculateXpToLevel(level: number): number {
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

/**
 * Estimate passive XP/s for a given epoch and level
 */
function estimatePassiveForEpoch(epoch: { generators: Array<{ baseProduction: number }> }, levelInEpoch: number): number {
  const tierWeights = [1, 0.5, 0.25, 0.1, 0.03];
  let total = 0;
  for (let i = 0; i < epoch.generators.length && i < tierWeights.length; i++) {
    const g = epoch.generators[i];
    const owned = Math.max(1, Math.floor(levelInEpoch * tierWeights[i]));
    total += g.baseProduction * owned;
  }
  return Math.max(1, total);
}

/**
 * Calculate base passive XP from owned generators
 */
export function calculatePassiveXp(
  owned: OwnedGenerator[],
  unlockedEpochs: EpochId[]
): number {
  return owned.reduce((total, og) => {
    for (const epochId of unlockedEpochs) {
      const epochData = getEpochById(epochId);
      const generator = epochData.generators.find(g => g.id === og.generatorId);
      if (generator) {
        return total + getGeneratorProduction(generator, og.level);
      }
    }
    return total;
  }, 0);
}

/**
 * Calculate effective passive XP with all multipliers applied
 */
export function calculateEffectivePassiveXp(config: PassiveIncomeConfig): number {
  const { ownedGenerators, unlockedEpochs, completedArtifacts = [], artifactDupes = {}, activeBoosters = {}, prestigeResearch = {} } = config;

  const basePassiveXp = calculatePassiveXp(ownedGenerators, unlockedEpochs);
  const { passive: passMult } = getArtifactMultipliers(completedArtifacts, artifactDupes);
  const { xp: boostXpMult } = getBoosterMultipliers(activeBoosters);
  const prestigeBonus = 1 + ((prestigeResearch?.passive_income || 0) * 0.10);

  return basePassiveXp * passMult * boostXpMult * prestigeBonus;
}

/**
 * Apply a passive XP tick and return state updates
 */
export function applyPassiveTick(state: GameState): Partial<GameState> {
  const { ownedGenerators = [], unlockedEpochs: currentUnlockedEpochs = [], completedArtifacts = [], artifactDupes = {}, activeBoosters = {}, prestigeResearch = {} } = state;

  const basePassiveXp = calculatePassiveXp(ownedGenerators, currentUnlockedEpochs);
  const { passive: passMult, currency: artCurrMult } = getArtifactMultipliers(completedArtifacts, artifactDupes);
  const { xp: boostXpMult, currency: boostCurrMult } = getBoosterMultipliers(activeBoosters);
  const effectivePassiveXp = basePassiveXp * passMult * boostXpMult * (1 + ((prestigeResearch?.passive_income || 0) * 0.10));

  const xpGainThisTick = effectivePassiveXp / 10; // 100ms tick = 1/10 of per-second rate
  let xp = state.xp + xpGainThisTick;
  const newTotalXp = state.totalXp + xpGainThisTick;

  const currMult = artCurrMult * boostCurrMult;
  let newLevel = state.level;
  let xpToNext = state.xpToNextLevel;
  let newCurrency = state.currency;
  let newTotalCurrency = state.totalCurrencyEarned;
  let newUnlocked: string[] | null = null;

  while (xp >= xpToNext && newLevel < MAX_LEVEL) {
    xp -= xpToNext;
    newLevel++;
    xpToNext = calculateXpToLevel(newLevel);
    const levelReward = Math.round(newLevel * 50 * currMult);
    newCurrency += levelReward;
    newTotalCurrency += levelReward;

    EPOCHS.forEach(e => {
      if (e.unlockLevel === newLevel && !currentUnlockedEpochs.includes(e.id)) {
        if (!newUnlocked) newUnlocked = [...currentUnlockedEpochs];
        if (!newUnlocked.includes(e.id)) newUnlocked.push(e.id);
      }
    });
  }

  const unlockedEpochs = newUnlocked ?? currentUnlockedEpochs;
  const newEpochUnlocked = newUnlocked !== null;
  const epochId = newEpochUnlocked
    ? getCurrentEpochByLevel(newLevel).id
    : state.epochId;

  return {
    xp,
    totalXp: newTotalXp,
    level: newLevel,
    xpToNextLevel: xpToNext,
    epochId,
    passiveXpPerSecond: effectivePassiveXp,
    currency: newCurrency,
    totalCurrencyEarned: newTotalCurrency,
    unlockedEpochs,
  };
}

/**
 * Validate passive XP against server
 */
export async function validatePassiveXp(): Promise<void> {
  const telegramIdLocal = getTelegramUserId();
  if (!telegramIdLocal) return;

  try {
    const result = await rpcValidatePassiveXp(telegramIdLocal);
    if (result.success && !result.is_valid && result.expected_passive_xp !== undefined) {
      console.warn('Passive XP discrepancy detected:', {
        expected: result.expected_passive_xp,
        current: result.current_passive_xp,
        discrepancy: result.discrepancy,
      });
    }
  } catch (e) {
    console.debug('Passive XP validation failed:', e);
  }
}

/**
 * Calculate offline gains for a period
 */
export function calculateOfflineGains(
  lastOnlineAt: number,
  lastSavedAt: number,
  passiveXpPerSecond: number,
  prestigeLevel: number,
  level: number = 1
): { xp: number; currency: number } {
  const serverNow = lastOnlineAt || Date.now();
  const offlineMs = Math.max(0, serverNow - lastSavedAt);
  const offlineCap = prestigeLevel > 0 ? 6 * 3600 : 8 * 3600;
  const offlineSec = Math.min(offlineMs / 1000, offlineCap);

  const offlineXp = passiveXpPerSecond * offlineSec;
  const offlineCurrency = (level * 50) * (offlineSec / 60);

  return { xp: offlineXp, currency: offlineCurrency };
}

/**
 * Hook for managing passive income calculations
 * Wraps utility functions in a hook for component usage
 */
export function usePassiveIncome(): {
  calculatePassiveXp: typeof calculatePassiveXp;
  calculateEffectivePassiveXp: typeof calculateEffectivePassiveXp;
  applyPassiveTick: typeof applyPassiveTick;
  validatePassiveXp: typeof validatePassiveXp;
  calculateXpToLevel: typeof calculateXpToLevel;
  calculateOfflineGains: typeof calculateOfflineGains;
} {
  return {
    calculatePassiveXp,
    calculateEffectivePassiveXp,
    applyPassiveTick,
    validatePassiveXp,
    calculateXpToLevel,
    calculateOfflineGains,
  };
}

export default usePassiveIncome;
