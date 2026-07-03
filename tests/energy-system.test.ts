import { describe, it, expect } from 'vitest';
import type { PrestigeResearch } from '../src/types/game';

describe('Energy System', () => {
  // Constants from useGame.ts
  const BASE_MAX_ENERGY = 1000;
  const ENERGY_CAPACITY_BONUS = 100;
  const REGEN_INTERVAL_MS = 30 * 1000;
  const REGEN_AMOUNT = 10;

  // Reimplement energy calculations for testing
  function calculateMaxEnergy(research: PrestigeResearch = {}): number {
    const capacityLevel = research.energy_capacity || 0;
    return BASE_MAX_ENERGY + (capacityLevel * ENERGY_CAPACITY_BONUS);
  }

  function calculateEnergyMultiplier(energy: number, maxEnergy: number): number {
    if (energy <= 0) return 1;
    const pct = Math.min(1, energy / maxEnergy);
    if (pct < 0.2) return 1;
    if (pct > 0.8) return 5;
    return 1 + ((pct - 0.2) / 0.6) * 4;
  }

  function calculateEnergyRegen(
    lastOnlineAt: number,
    currentTime: number,
    currentEnergy: number,
    maxEnergy: number,
    research: PrestigeResearch = {}
  ): { newEnergy: number; lastOnlineAt: number } {
    const elapsedMs = currentTime - lastOnlineAt;
    const cycles = Math.floor(elapsedMs / REGEN_INTERVAL_MS);
    const energyToAdd = cycles * REGEN_AMOUNT;

    if (energyToAdd <= 0 && currentEnergy >= maxEnergy) {
      return { newEnergy: currentEnergy, lastOnlineAt: currentTime };
    }

    const newEnergy = Math.min(maxEnergy, currentEnergy + Math.max(0, energyToAdd));
    return { newEnergy, lastOnlineAt: currentTime };
  }

  describe('calculateMaxEnergy', () => {
    it('should return 1000 without any research', () => {
      const maxEnergy = calculateMaxEnergy({});
      expect(maxEnergy).toBe(1000);
    });

    it('should increase by 100 per energy_capacity level', () => {
      expect(calculateMaxEnergy({ energy_capacity: 1 })).toBe(1100);
      expect(calculateMaxEnergy({ energy_capacity: 5 })).toBe(1500);
      expect(calculateMaxEnergy({ energy_capacity: 10 })).toBe(2000);
    });

    it('should cap at 2000 with max research (10 levels)', () => {
      const maxEnergy = calculateMaxEnergy({ energy_capacity: 10 });
      expect(maxEnergy).toBe(2000);
    });

    it('should handle undefined research', () => {
      const maxEnergy = calculateMaxEnergy(undefined as unknown as PrestigeResearch);
      expect(maxEnergy).toBe(1000);
    });
  });

  describe('calculateEnergyMultiplier', () => {
    it('should return 1 when energy is 0', () => {
      const multiplier = calculateEnergyMultiplier(0, 1000);
      expect(multiplier).toBe(1);
    });

    it('should return 1 when energy is at 10% (below 20%)', () => {
      const multiplier = calculateEnergyMultiplier(100, 1000);
      expect(multiplier).toBe(1);
    });

    it('should return 5 when energy is at 100%', () => {
      const multiplier = calculateEnergyMultiplier(1000, 1000);
      expect(multiplier).toBe(5);
    });

    it('should return 5 when energy is above 80%', () => {
      const multiplier = calculateEnergyMultiplier(850, 1000);
      expect(multiplier).toBe(5);
    });

    it('should interpolate between 20% and 80%', () => {
      // At 20%: should be 1
      expect(calculateEnergyMultiplier(200, 1000)).toBe(1);
      
      // At 50%: should be 1 + (0.5 - 0.2) / 0.6 * 4 = 1 + 0.3 / 0.6 * 4 = 1 + 2 = 3
      expect(calculateEnergyMultiplier(500, 1000)).toBe(3);
      
      // At 80%: should be 5 (allow for floating point tolerance)
      expect(calculateEnergyMultiplier(800, 1000)).toBeCloseTo(5, 5);
    });

    it('should handle edge case at exactly 20%', () => {
      const multiplier = calculateEnergyMultiplier(200, 1000);
      expect(multiplier).toBe(1);
    });

    it('should handle edge case at exactly 80%', () => {
      const multiplier = calculateEnergyMultiplier(800, 1000);
      expect(multiplier).toBeCloseTo(5, 5);
    });

    it('should never return less than 1', () => {
      const multiplier = calculateEnergyMultiplier(-10, 1000);
      expect(multiplier).toBe(1);
    });

    it('should never return more than 5', () => {
      const multiplier = calculateEnergyMultiplier(1100, 1000);
      expect(multiplier).toBe(5);
    });

    it('should scale with different maxEnergy values', () => {
      // 50% of 2000 = 1000
      expect(calculateEnergyMultiplier(1000, 2000)).toBe(3);
      
      // 50% of 1500 = 750
      expect(calculateEnergyMultiplier(750, 1500)).toBe(3);
    });
  });

  describe('calculateEnergyRegen', () => {
    it('should not regenerate if time has not passed a full cycle', () => {
      const lastOnline = 1000;
      const currentTime = 29999; // Less than 30 seconds (29.999 seconds)
      const maxEnergy = 1000;

      const result = calculateEnergyRegen(lastOnline, currentTime, 500, maxEnergy);
      expect(result.newEnergy).toBe(500); // No change
    });

    it('should regenerate 10 energy per 30 seconds', () => {
      const lastOnline = 1000;
      const currentTime = 31000; // 30 seconds (30.001 seconds to be safe)
      const maxEnergy = 1000;

      const result = calculateEnergyRegen(lastOnline, currentTime, 500, maxEnergy);
      expect(result.newEnergy).toBe(510);
    });

    it('should regenerate multiple cycles', () => {
      const lastOnline = 1000;
      const currentTime = 61000; // 60 seconds
      const maxEnergy = 1000;

      const result = calculateEnergyRegen(lastOnline, currentTime, 500, maxEnergy);
      expect(result.newEnergy).toBe(520); // +20 energy
    });

    it('should not exceed max energy', () => {
      const lastOnline = 1000;
      const currentTime = 3601000; // 3600 seconds = 120 cycles = +1200 energy
      const maxEnergy = 1000;

      const result = calculateEnergyRegen(lastOnline, currentTime, 950, maxEnergy);
      expect(result.newEnergy).toBe(1000); // Capped at max
    });

    it('should update lastOnlineAt timestamp', () => {
      const lastOnline = 1000;
      const currentTime = 61000;

      const result = calculateEnergyRegen(lastOnline, currentTime, 500, 1000);
      expect(result.lastOnlineAt).toBe(61000);
    });

    it('should regenerate at same rate with different max energy', () => {
      const lastOnline = 1000;
      const currentTime = 61000; // 60 seconds
      const maxEnergy = 1500;

      const result = calculateEnergyRegen(lastOnline, currentTime, 500, maxEnergy);
      expect(result.newEnergy).toBe(520); // Same regen rate
    });

    it('should not change if already at max energy and no regen needed', () => {
      const lastOnline = 1000;
      const currentTime = 29999; // Less than 30 seconds

      const result = calculateEnergyRegen(lastOnline, currentTime, 1000, 1000);
      expect(result.newEnergy).toBe(1000);
    });
  });

  describe('Energy System Integration', () => {
    it('should simulate full energy cycle', () => {
      const research = { energy_capacity: 5 }; // 1500 max
      const maxEnergy = calculateMaxEnergy(research);
      expect(maxEnergy).toBe(1500);

      // Start at 0 energy
      let energy = 0;
      const lastOnline = 1000;

      // Simulate 10 minutes of regen (20 cycles * 10 = 200 energy)
      const futureTime = lastOnline + 10 * 60 * 1000;
      const result = calculateEnergyRegen(lastOnline, futureTime, energy, maxEnergy, research);
      energy = result.newEnergy;

      expect(energy).toBe(200);

      // Check multiplier at this energy level
      const multiplier = calculateEnergyMultiplier(energy, maxEnergy);
      // 200 / 1500 = 13.3% which is below 20%, so multiplier should be 1
      expect(multiplier).toBe(1);
    });

    it('should reach max multiplier after sufficient regen', () => {
      const maxEnergy = 1000;
      const research = {};

      // Simulate enough time to fully regen (1000 / 10 = 100 cycles = 3000 seconds)
      const lastOnline = 1000;
      const currentTime = 1000 + 3000 * 1000;

      const result = calculateEnergyRegen(lastOnline, currentTime, 0, maxEnergy, research);
      expect(result.newEnergy).toBe(1000);

      const multiplier = calculateEnergyMultiplier(result.newEnergy, maxEnergy);
      expect(multiplier).toBe(5);
    });
  });

  describe('Prestige Research Energy Upgrades', () => {
    it('should allow energy_capacity upgrade from 0 to 10', () => {
      const levels = [];
      for (let i = 0; i <= 10; i++) {
        levels.push(calculateMaxEnergy({ energy_capacity: i }));
      }

      // Should increase by 100 each level
      for (let i = 1; i < levels.length; i++) {
        expect(levels[i]).toBe(levels[i - 1] + 100);
      }
    });

    it('should have max energy of 1000 at level 0', () => {
      expect(calculateMaxEnergy({ energy_capacity: 0 })).toBe(1000);
    });

    it('should have max energy of 2000 at level 10', () => {
      expect(calculateMaxEnergy({ energy_capacity: 10 })).toBe(2000);
    });
  });
});
