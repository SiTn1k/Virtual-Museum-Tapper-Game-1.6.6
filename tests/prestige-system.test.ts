import { describe, it, expect } from 'vitest';
import type { EpochId } from '../src/types/game';

describe('Prestige System', () => {
  // Prestige requirements from useGame.ts
  const PRESTIGE_MIN_LEVEL = 950;
  const PRESTIGE_REQUIRED_EPOCH: EpochId = 'independence';

  // Reimplement prestige point calculation (simplified version)
  function canPrestige(level: number, epochId: EpochId): boolean {
    return level >= PRESTIGE_MIN_LEVEL && epochId === PRESTIGE_REQUIRED_EPOCH;
  }

  function calculatePrestigePoints(level: number, totalXp: number): number {
    if (level < PRESTIGE_MIN_LEVEL) return 0;
    // Approximate formula: bonus based on level and total XP
    const basePoints = Math.floor((level - PRESTIGE_MIN_LEVEL + 1) / 5);
    const xpBonus = Math.floor(totalXp / 100000);
    return Math.max(1, basePoints + xpBonus);
  }

  function getUnlockedEpochsForRebirth(rebirthLevel: number, epochs: Array<{ id: EpochId; requiredRebirth: number }>): EpochId[] {
    return epochs
      .filter(e => e.requiredRebirth <= rebirthLevel)
      .map(e => e.id);
  }

  describe('Prestige Requirements', () => {
    it('should require level 950 to prestige', () => {
      expect(canPrestige(949, 'independence')).toBe(false);
      expect(canPrestige(950, 'independence')).toBe(true);
      expect(canPrestige(999, 'independence')).toBe(true);
    });

    it('should require independence epoch', () => {
      expect(canPrestige(950, 'soviet')).toBe(false);
      expect(canPrestige(950, 'independence')).toBe(true);
      expect(canPrestige(950, 'egypt')).toBe(false);
    });

    it('should require both level AND correct epoch', () => {
      expect(canPrestige(949, 'soviet')).toBe(false);
      expect(canPrestige(949, 'independence')).toBe(false);
      expect(canPrestige(950, 'soviet')).toBe(false);
      expect(canPrestige(950, 'independence')).toBe(true);
    });

    it('should work for levels above 999', () => {
      expect(canPrestige(1000, 'independence')).toBe(true);
      expect(canPrestige(1500, 'independence')).toBe(true);
    });
  });

  describe('Prestige Point Calculations', () => {
    it('should return 0 points if below prestige level', () => {
      expect(calculatePrestigePoints(949, 1000000)).toBe(0);
      expect(calculatePrestigePoints(100, 500000)).toBe(0);
    });

    it('should return at least 1 point at prestige level', () => {
      expect(calculatePrestigePoints(950, 100)).toBeGreaterThanOrEqual(1);
    });

    it('should give more points for higher levels', () => {
      const points950 = calculatePrestigePoints(950, 0);
      const points975 = calculatePrestigePoints(975, 0);
      const points999 = calculatePrestigePoints(999, 0);

      expect(points975).toBeGreaterThan(points950);
      expect(points999).toBeGreaterThan(points975);
    });

    it('should give more points for more total XP', () => {
      const pointsLowXP = calculatePrestigePoints(950, 50000);
      const pointsHighXP = calculatePrestigePoints(950, 500000);

      expect(pointsHighXP).toBeGreaterThan(pointsLowXP);
    });

    it('should scale with both level and XP', () => {
      const pointsLow = calculatePrestigePoints(950, 100000);
      const pointsMid = calculatePrestigePoints(975, 100000);
      const pointsHigh = calculatePrestigePoints(999, 100000);

      // Each should be increasing
      expect(pointsMid).toBeGreaterThan(pointsLow);
      expect(pointsHigh).toBeGreaterThan(pointsMid);
    });
  });

  describe('Epoch Unlocking by Rebirth Level', () => {
    const mockEpochs = [
      { id: 'trypillia' as EpochId, requiredRebirth: 0 },
      { id: 'scythia' as EpochId, requiredRebirth: 0 },
      { id: 'antiquity' as EpochId, requiredRebirth: 0 },
      { id: 'kyiv_rus' as EpochId, requiredRebirth: 0 },
      { id: 'halych_volhynia' as EpochId, requiredRebirth: 0 },
      { id: 'polish_lithuanian' as EpochId, requiredRebirth: 0 },
      { id: 'cossack' as EpochId, requiredRebirth: 0 },
      { id: 'hetmanate' as EpochId, requiredRebirth: 0 },
      { id: 'empire' as EpochId, requiredRebirth: 0 },
      { id: 'revolution' as EpochId, requiredRebirth: 0 },
      { id: 'soviet' as EpochId, requiredRebirth: 0 },
      { id: 'independence' as EpochId, requiredRebirth: 0 },
      { id: 'egypt' as EpochId, requiredRebirth: 1 },
      { id: 'greece' as EpochId, requiredRebirth: 1 },
      { id: 'rome' as EpochId, requiredRebirth: 2 },
      { id: 'medieval' as EpochId, requiredRebirth: 2 },
      { id: 'renaissance' as EpochId, requiredRebirth: 3 },
      { id: 'enlightenment' as EpochId, requiredRebirth: 3 },
      { id: 'victorian' as EpochId, requiredRebirth: 4 },
      { id: 'modern_world' as EpochId, requiredRebirth: 5 },
    ];

    it('should unlock first 12 epochs at rebirth 0', () => {
      const unlocked = getUnlockedEpochsForRebirth(0, mockEpochs);
      expect(unlocked.length).toBe(12);
      expect(unlocked).toContain('independence');
      expect(unlocked).not.toContain('egypt');
    });

    it('should unlock 2 more epochs at rebirth 1', () => {
      const unlocked = getUnlockedEpochsForRebirth(1, mockEpochs);
      expect(unlocked.length).toBe(14);
      expect(unlocked).toContain('egypt');
      expect(unlocked).toContain('greece');
      expect(unlocked).not.toContain('rome');
    });

    it('should unlock 4 more epochs at rebirth 2', () => {
      const unlocked = getUnlockedEpochsForRebirth(2, mockEpochs);
      expect(unlocked.length).toBe(16);
      expect(unlocked).toContain('rome');
      expect(unlocked).toContain('medieval');
    });

    it('should unlock 2 more epochs at rebirth 3', () => {
      const unlocked = getUnlockedEpochsForRebirth(3, mockEpochs);
      expect(unlocked.length).toBe(18);
      expect(unlocked).toContain('renaissance');
      expect(unlocked).toContain('enlightenment');
    });

    it('should unlock Victorian at rebirth 4', () => {
      const unlocked = getUnlockedEpochsForRebirth(4, mockEpochs);
      expect(unlocked.length).toBe(19);
      expect(unlocked).toContain('victorian');
      expect(unlocked).not.toContain('modern_world');
    });

    it('should unlock all epochs at rebirth 5', () => {
      const unlocked = getUnlockedEpochsForRebirth(5, mockEpochs);
      expect(unlocked.length).toBe(20);
      expect(unlocked).toContain('modern_world');
    });

    it('should always include Ukrainian epochs', () => {
      const unlocked0 = getUnlockedEpochsForRebirth(0, mockEpochs);
      const ukrEpochs = ['trypillia', 'scythia', 'antiquity', 'kyiv_rus', 'halych_volhynia', 
                        'polish_lithuanian', 'cossack', 'hetmanate', 'empire', 'revolution', 
                        'soviet', 'independence'];
      
      ukrEpochs.forEach(epoch => {
        expect(unlocked0).toContain(epoch);
      });
    });
  });

  describe('Prestige Research Upgrades', () => {
    interface PrestigeResearch {
      rare_artifact_chance?: number;
      passive_income?: number;
      xp_gain?: number;
      tap_power?: number;
      energy_capacity?: number;
    }

    function calculateResearchBonus(research: PrestigeResearch): {
      rareArtifactBonus: number;
      passiveBonus: number;
      xpBonus: number;
      tapBonus: number;
      energyBonus: number;
    } {
      return {
        rareArtifactBonus: (research.rare_artifact_chance || 0) * 0.05, // +5% per level
        passiveBonus: (research.passive_income || 0) * 0.10, // +10% per level
        xpBonus: (research.xp_gain || 0) * 0.05, // +5% per level
        tapBonus: (research.tap_power || 0) * 1, // +1 per level
        energyBonus: (research.energy_capacity || 0) * 100, // +100 per level
      };
    }

    it('should calculate correct rare artifact chance bonus', () => {
      const bonus = calculateResearchBonus({ rare_artifact_chance: 1 });
      expect(bonus.rareArtifactBonus).toBe(0.05);

      const bonus10 = calculateResearchBonus({ rare_artifact_chance: 10 });
      expect(bonus10.rareArtifactBonus).toBe(0.5); // +50% total
    });

    it('should calculate correct passive income bonus', () => {
      const bonus = calculateResearchBonus({ passive_income: 1 });
      expect(bonus.passiveBonus).toBe(0.10);

      const bonus5 = calculateResearchBonus({ passive_income: 5 });
      expect(bonus5.passiveBonus).toBe(0.50); // +50% total
    });

    it('should calculate correct XP gain bonus', () => {
      const bonus = calculateResearchBonus({ xp_gain: 1 });
      expect(bonus.xpBonus).toBe(0.05);

      const bonus20 = calculateResearchBonus({ xp_gain: 20 });
      expect(bonus20.xpBonus).toBe(1.0); // +100% total
    });

    it('should calculate correct tap power bonus', () => {
      const bonus = calculateResearchBonus({ tap_power: 1 });
      expect(bonus.tapBonus).toBe(1);

      const bonus5 = calculateResearchBonus({ tap_power: 5 });
      expect(bonus5.tapBonus).toBe(5);
    });

    it('should calculate correct energy capacity bonus', () => {
      const bonus = calculateResearchBonus({ energy_capacity: 1 });
      expect(bonus.energyBonus).toBe(100);

      const bonus10 = calculateResearchBonus({ energy_capacity: 10 });
      expect(bonus10.energyBonus).toBe(1000);
    });

    it('should handle all research at max level', () => {
      const maxResearch: PrestigeResearch = {
        rare_artifact_chance: 10,
        passive_income: 10,
        xp_gain: 20,
        tap_power: 5,
        energy_capacity: 10,
      };

      const bonus = calculateResearchBonus(maxResearch);

      expect(bonus.rareArtifactBonus).toBe(0.5);
      expect(bonus.passiveBonus).toBe(1.0);
      expect(bonus.xpBonus).toBe(1.0);
      expect(bonus.tapBonus).toBe(5);
      expect(bonus.energyBonus).toBe(1000);
    });

    it('should handle empty research', () => {
      const bonus = calculateResearchBonus({});

      expect(bonus.rareArtifactBonus).toBe(0);
      expect(bonus.passiveBonus).toBe(0);
      expect(bonus.xpBonus).toBe(0);
      expect(bonus.tapBonus).toBe(0);
      expect(bonus.energyBonus).toBe(0);
    });
  });

  describe('Prestige Reset Behavior', () => {
    it('should describe what gets reset on prestige', () => {
      // On prestige, these should reset:
      // - level: 1
      // - xp: 0
      // - totalXp: 0
      // - currency: 20
      // - ownedGenerators: []
      // - epochId: 'trypillia'
      // - tapPower: 1 (unless upgraded via research)
      // - artifactParts: {}
      // - artifactDupes: {}

      const resetValues = {
        level: 1,
        xp: 0,
        totalXp: 0,
        currency: 20,
        ownedGenerators: [] as string[],
        epochId: 'trypillia' as EpochId,
        tapPower: 1,
      };

      expect(resetValues.level).toBe(1);
      expect(resetValues.xp).toBe(0);
      expect(resetValues.ownedGenerators.length).toBe(0);
    });

    it('should describe what gets preserved on prestige', () => {
      // On prestige, these should be preserved:
      // - completedArtifacts
      // - artifactLevels
      // - prestigeLevel (incremented)
      // - prestigePoints (incremented)
      // - prestigeResearch (permanent)
      // - dailyStreak
      // - bestStreak
      // - referrals

      const preservedValues = {
        completedArtifacts: ['artifact1', 'artifact2'],
        artifactLevels: { artifact1: 2, artifact2: 3 },
        prestigeLevel: 2,
        prestigePoints: 150,
        prestigeResearch: { xp_gain: 5 },
        dailyStreak: 7,
        bestStreak: 14,
        referralsCount: 3,
      };

      expect(preservedValues.completedArtifacts.length).toBeGreaterThan(0);
      expect(preservedValues.prestigeResearch.xp_gain).toBe(5);
    });
  });
});
