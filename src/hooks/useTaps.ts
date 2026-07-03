/**
 * Virtual Museum Tapper Game — useTaps Hook
 * Handles tap events, combo system, and tap power calculations
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import type { TapEvent, GameState, ActiveBoosters } from '../types/game';
import { getArtifactMultipliers, type ArtifactMultipliers } from './useGame';
import { getBoosterMultipliers } from './useGame';
import { hapticImpact } from '../lib/telegram';

export interface UseTapsConfig {
  initialTapPower?: number;
  passiveXpPerSecond?: number;
  completedArtifacts?: string[];
  artifactDupes?: Record<string, number>;
  activeBoosters?: ActiveBoosters;
  prestigeLevel?: number;
  prestigeResearch?: Record<string, number>;
  energy?: number;
  dailyTasksState?: GameState['dailyTasksState'];
}

export interface UseTapsReturn {
  tapEvents: TapEvent[];
  recordTap: (x: number, y: number, tapPower: number, passiveXpPerSecond: number, gameState: Partial<GameState>) => {
    value: number;
    updatedTasks: GameState['dailyTasksState'];
  };
  getTapValue: (tapPower: number, passiveXpPerSecond: number, gameState: Partial<GameState>) => number;
  getEnergyMultiplier: (prestigeLevel: number, energy: number, prestigeResearch: Record<string, number> | undefined) => number;
}

const TAP_TIMEOUT_MS = 1000;
const MAX_TAP_EVENTS = 10;

/**
 * Hook for managing tap events and calculating tap values
 */
export function useTaps(): UseTapsReturn {
  const [tapEvents, setTapEvents] = useState<TapEvent[]>([]);

  /**
   * Calculate energy multiplier based on current energy percentage
   * Gradual curve: 1x at 0 energy, 5x at max energy
   * Formula: multiplier = 1 + (4 * energy/maxEnergy)
   */
  const getEnergyMultiplier = useCallback((
    prestigeLevel: number,
    energy: number,
    prestigeResearch: Record<string, number> | undefined
  ): number => {
    if ((prestigeLevel || 0) < 1) return 1;
    const maxEnergy = 1000 + ((prestigeResearch?.energy_capacity || 0) * 100);
    if (maxEnergy <= 0) return 1;
    // Gradual curve: 1x at 0 energy, 5x at max energy
    const pct = Math.min(1, Math.max(0, energy / maxEnergy));
    return 1 + (4 * pct);
  }, []);

  /**
   * Calculate the value of a single tap
   */
  const getTapValue = useCallback((
    tapPower: number,
    passiveXpPerSecond: number,
    gameState: Partial<GameState>
  ): number => {
    const { completedArtifacts = [], artifactDupes = {}, activeBoosters = {}, prestigeLevel = 0, prestigeResearch = {}, energy = 1000 } = gameState;

    const { xp: artXpMult } = getArtifactMultipliers(completedArtifacts, artifactDupes);
    const { xp: boostXpMult } = getBoosterMultipliers(activeBoosters);
    const energyMult = getEnergyMultiplier(prestigeLevel, energy, prestigeResearch);

    // Apply prestige research XP bonus: +5% per level
    const prestigeXpBonus = 1 + ((prestigeResearch?.xp_gain || 0) * 0.05);
    // Apply tap_power bonus: +1 base tap power per level
    const tapPowerBonus = prestigeResearch?.tap_power || 0;

    const baseTap = Math.max(1, Math.round((tapPower + tapPowerBonus) * artXpMult * boostXpMult * energyMult * prestigeXpBonus));
    const passiveFloor = Math.round(passiveXpPerSecond * 0.015);
    return Math.max(baseTap, passiveFloor);
  }, [getEnergyMultiplier]);

  /**
   * Record a tap event and return the calculated value
   */
  const recordTap = useCallback((
    x: number,
    y: number,
    tapPower: number,
    passiveXpPerSecond: number,
    gameState: Partial<GameState>
  ): { value: number; updatedTasks: GameState['dailyTasksState'] } => {
    const eventId = Math.random().toString(36).substr(2, 9);
    const value = getTapValue(tapPower, passiveXpPerSecond, gameState);

    // Add tap event for visual feedback
    const newEvent: TapEvent = {
      id: eventId,
      x,
      y,
      value,
      createdAt: Date.now(),
    };

    setTapEvents(te => [...te.slice(-(MAX_TAP_EVENTS - 1)), newEvent]);

    // Remove event after timeout
    setTimeout(() => {
      setTapEvents(te => te.filter(e => e.id !== eventId));
    }, TAP_TIMEOUT_MS);

    // Update daily task counters
    const { dailyTasksState = null } = gameState;
    const updatedTasks = dailyTasksState
      ? {
          ...dailyTasksState,
          counters: {
            ...dailyTasksState.counters,
            tap: (dailyTasksState.counters.tap || 0) + 1,
            earn_xp: (dailyTasksState.counters.earn_xp || 0) + value,
          },
        }
      : dailyTasksState;

    return { value, updatedTasks };
  }, [getTapValue]);

  return {
    tapEvents,
    recordTap,
    getTapValue,
    getEnergyMultiplier,
  };
}

/**
 * Hook for managing tap cooldown (combo system if needed in future)
 */
export function useTapCooldown(initialCooldown: number = 0) {
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  const cooldownRef = useRef<NodeJS.Timeout | null>(null);

  const startCooldown = useCallback((duration: number) => {
    if (cooldownRef.current) {
      clearInterval(cooldownRef.current);
    }
    setCooldownRemaining(duration);

    const interval = setInterval(() => {
      setCooldownRemaining(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          cooldownRef.current = null;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    cooldownRef.current = interval;
  }, []);

  const clearCooldown = useCallback(() => {
    if (cooldownRef.current) {
      clearInterval(cooldownRef.current);
      cooldownRef.current = null;
    }
    setCooldownRemaining(0);
  }, []);

  useEffect(() => {
    return () => {
      if (cooldownRef.current) {
        clearInterval(cooldownRef.current);
      }
    };
  }, []);

  return {
    cooldownRemaining,
    isOnCooldown: cooldownRemaining > 0,
    startCooldown,
    clearCooldown,
  };
}

export default useTaps;
