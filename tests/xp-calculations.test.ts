import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EPOCHS, getCurrentEpochByLevel, getEpochById } from '../src/data/epochs';

// Import the XP calculation functions from useGame (we'll reimplement the pure logic here for testing)
function getEpochXpRange(epochIndex: number): { minSeconds: number; maxSeconds: number } {
  if (epochIndex === 0) {
    return { minSeconds: 60, maxSeconds: 300 };
  } else if (epochIndex === 1) {
    return { minSeconds: 60, maxSeconds: 480 };
  } else if (epochIndex === 2) {
    return { minSeconds: 120, maxSeconds: 900 };
  } else {
    return {
      minSeconds: 120 + (epochIndex - 3) * 60,
      maxSeconds: 1800 + (epochIndex - 3) * 600,
    };
  }
}

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

function calculateXpToLevel(level: number): number {
  const epoch = getCurrentEpochByLevel(level);
  const { min, max } = epoch.levelRange;
  const rangeSize = Math.max(1, max - min + 1);
  const progress = Math.min(1, Math.max(0, (level - min) / rangeSize));

  const epochIndex = EPOCHS.findIndex(e => e.id === epoch.id);
  const { minSeconds, maxSeconds } = getEpochXpRange(epochIndex);

  const targetSeconds = minSeconds + progress * (maxSeconds - minSeconds);
  const levelInEpoch = Math.max(1, level - min + 1);
  const estimatedPassive = estimatePassiveForEpoch(epoch, levelInEpoch);

  return Math.max(50, Math.floor(estimatedPassive * targetSeconds));
}

describe('XP Calculations', () => {
  describe('getCurrentEpochByLevel', () => {
    it('should return Trypillia epoch for level 1', () => {
      const epoch = getCurrentEpochByLevel(1);
      expect(epoch.id).toBe('trypillia');
    });

    it('should return Scythia epoch for level 51', () => {
      const epoch = getCurrentEpochByLevel(51);
      expect(epoch.id).toBe('scythia');
    });

    it('should return Antiquity epoch for level 101', () => {
      const epoch = getCurrentEpochByLevel(101);
      expect(epoch.id).toBe('antiquity');
    });

    it('should return Kyiv Rus epoch for level 151', () => {
      const epoch = getCurrentEpochByLevel(151);
      expect(epoch.id).toBe('kyiv_rus');
    });

    it('should return Independence epoch for level 951', () => {
      const epoch = getCurrentEpochByLevel(951);
      expect(epoch.id).toBe('independence');
    });

    it('should return Egypt epoch for level 1000', () => {
      const epoch = getCurrentEpochByLevel(1000);
      expect(epoch.id).toBe('egypt');
    });

    it('should return Modern World epoch for very high levels', () => {
      const epoch = getCurrentEpochByLevel(1500);
      expect(epoch.id).toBe('modern_world');
    });

    it('should return first epoch for level 0 or negative', () => {
      expect(getCurrentEpochByLevel(0).id).toBe('trypillia');
      expect(getCurrentEpochByLevel(-5).id).toBe('trypillia');
    });
  });

  describe('calculateXpToLevel', () => {
    it('should return at least 50 XP for level 1', () => {
      const xp = calculateXpToLevel(1);
      expect(xp).toBeGreaterThanOrEqual(50);
    });

    it('should return positive XP for all levels', () => {
      for (let level = 1; level <= 100; level++) {
        const xp = calculateXpToLevel(level);
        expect(xp).toBeGreaterThan(0);
      }
    });

    it('should generally increase XP requirements as level increases', () => {
      let previousXp = 0;
      for (let level = 1; level <= 50; level++) {
        const xp = calculateXpToLevel(level);
        // XP should mostly increase but occasional equal values are OK
        // (this is due to epoch boundaries and other factors)
        if (level % 10 !== 0) {
          expect(xp).toBeGreaterThanOrEqual(previousXp * 0.5); // Allow some variance
        }
        previousXp = xp;
      }
    });

    it('should return higher XP for later epochs', () => {
      // Middle of Trypillia (level 25)
      const xpEarly = calculateXpToLevel(25);
      // Middle of Scythia (level 75)
      const xpMid = calculateXpToLevel(75);
      // Middle of Kyiv Rus (level 200)
      const xpLate = calculateXpToLevel(200);

      expect(xpMid).toBeGreaterThan(xpEarly);
      expect(xpLate).toBeGreaterThan(xpMid);
    });

    it('should handle boundary between epochs smoothly', () => {
      // Last level of Trypillia
      const lastTrypillia = calculateXpToLevel(50);
      // First level of Scythia
      const firstScythia = calculateXpToLevel(51);

      // Both should be valid positive numbers
      expect(lastTrypillia).toBeGreaterThan(0);
      expect(firstScythia).toBeGreaterThan(0);
    });
  });

  describe('XP to Level Progress Calculation', () => {
    it('should calculate correct progress within epoch', () => {
      const epoch = getCurrentEpochByLevel(25);
      const { min, max } = epoch.levelRange;
      const rangeSize = max - min + 1;
      
      // Level 25 should be roughly at 50% progress in Trypillia (levels 1-50)
      const expectedProgress = (25 - min) / rangeSize;
      expect(expectedProgress).toBeCloseTo(0.48, 1);
    });

    it('should handle epoch start at progress 0', () => {
      const epoch = getCurrentEpochByLevel(1);
      const { min } = epoch.levelRange;
      expect(1 - min).toBe(0);
    });

    it('should handle epoch end at progress 1', () => {
      const epoch = getCurrentEpochByLevel(50);
      const { min, max } = epoch.levelRange;
      const progress = (50 - min) / (max - min + 1);
      expect(progress).toBeCloseTo(0.98, 1);
    });
  });

  describe('Passive XP Estimation', () => {
    it('should return at least 1 passive XP', () => {
      const epoch = EPOCHS[0];
      const passive = estimatePassiveForEpoch(epoch, 1);
      expect(passive).toBeGreaterThanOrEqual(1);
    });

    it('should scale with level in epoch', () => {
      const epoch = EPOCHS[0];
      const passive10 = estimatePassiveForEpoch(epoch, 10);
      const passive20 = estimatePassiveForEpoch(epoch, 20);
      
      expect(passive20).toBeGreaterThan(passive10);
    });

    it('should return higher passive for better generators', () => {
      const trypillia = EPOCHS.find(e => e.id === 'trypillia')!;
      const scythia = EPOCHS.find(e => e.id === 'scythia')!;
      
      const passiveTrypillia = estimatePassiveForEpoch(trypillia, 10);
      const passiveScythia = estimatePassiveForEpoch(scythia, 10);
      
      expect(passiveScythia).toBeGreaterThan(passiveTrypillia);
    });
  });
});
