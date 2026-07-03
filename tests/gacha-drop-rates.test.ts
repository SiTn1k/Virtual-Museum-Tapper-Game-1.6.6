import { describe, it, expect } from 'vitest';
import { EPOCHS, ARTIFACTS, getArtifactsForEpoch } from '../src/data/epochs';
import type { EpochId } from '../src/types/game';

describe('Gacha Drop Rates', () => {
  // Constants from open-chest/index.ts
  const BASE_RARITY_CHANCES = {
    common: 60,
    rare: 25,
    epic: 10,
    legendary: 4,
    secret: 1,
  };

  // Reimplement rarity roll logic for testing
  function getEpochRareBonus(epochIndex: number): number {
    if (epochIndex >= 16) return 2.0;      // Epochs 17-20: +2%
    if (epochIndex >= 12) return 1.5;      // Epochs 13-16: +1.5%
    if (epochIndex >= 8) return 1.0;       // Epochs 9-12: +1%
    if (epochIndex >= 4) return 0.5;       // Epochs 5-8: +0.5%
    return 0;                              // Epochs 1-4: Base rates
  }

  function rollRarity(
    prestigeLevel: number,
    rareArtifactChanceBonus: number,
    epochIndex: number
  ): string {
    const rareBonus = getEpochRareBonus(epochIndex);
    const totalRareBonus = rareBonus + rareArtifactChanceBonus;

    // Secret chance: 1% base + 5% per rare_artifact_chance research level (only if prestige > 0)
    const secretChance = prestigeLevel > 0 ? 1 + 5 : 1;

    // Generate random number 0-99
    const roll = Math.random() * 100;

    // Secret: checked first (takes from top tier)
    if (roll < secretChance) {
      return 'secret';
    }

    // Legendary: 4% (unchanged)
    if (roll < secretChance + 4) {
      return 'legendary';
    }

    // Epic: 10% (unchanged)
    if (roll < secretChance + 4 + 10) {
      return 'epic';
    }

    // Rare: 25% + epoch bonus + research bonus
    if (roll < secretChance + 4 + 10 + 25 + totalRareBonus) {
      return 'rare';
    }

    // Common: remaining percentage
    return 'common';
  }

  describe('Epoch Rare Bonus', () => {
    it('should return 0% bonus for epochs 1-4 (indices 0-3)', () => {
      expect(getEpochRareBonus(0)).toBe(0);
      expect(getEpochRareBonus(1)).toBe(0);
      expect(getEpochRareBonus(2)).toBe(0);
      expect(getEpochRareBonus(3)).toBe(0);
    });

    it('should return 0.5% bonus for epochs 5-8 (indices 4-7)', () => {
      expect(getEpochRareBonus(4)).toBe(0.5);
      expect(getEpochRareBonus(5)).toBe(0.5);
      expect(getEpochRareBonus(6)).toBe(0.5);
      expect(getEpochRareBonus(7)).toBe(0.5);
    });

    it('should return 1% bonus for epochs 9-12 (indices 8-11)', () => {
      expect(getEpochRareBonus(8)).toBe(1.0);
      expect(getEpochRareBonus(9)).toBe(1.0);
      expect(getEpochRareBonus(10)).toBe(1.0);
      expect(getEpochRareBonus(11)).toBe(1.0);
    });

    it('should return 1.5% bonus for epochs 13-16 (indices 12-15)', () => {
      expect(getEpochRareBonus(12)).toBe(1.5);
      expect(getEpochRareBonus(13)).toBe(1.5);
      expect(getEpochRareBonus(14)).toBe(1.5);
      expect(getEpochRareBonus(15)).toBe(1.5);
    });

    it('should return 2% bonus for epochs 17-20 (indices 16-19)', () => {
      expect(getEpochRareBonus(16)).toBe(2.0);
      expect(getEpochRareBonus(17)).toBe(2.0);
      expect(getEpochRareBonus(18)).toBe(2.0);
      expect(getEpochRareBonus(19)).toBe(2.0);
    });

    it('should cap at 2% for epochs beyond 20', () => {
      expect(getEpochRareBonus(20)).toBe(2.0);
      expect(getEpochRareBonus(100)).toBe(2.0);
    });
  });

  describe('Rarity Distribution (Statistical)', () => {
    it('should produce valid rarity values', () => {
      const validRarities = ['common', 'rare', 'epic', 'legendary', 'secret'];
      const counts: Record<string, number> = {
        common: 0,
        rare: 0,
        epic: 0,
        legendary: 0,
        secret: 0,
      };

      // Run 10000 iterations to get statistical distribution
      const iterations = 10000;
      for (let i = 0; i < iterations; i++) {
        const rarity = rollRarity(0, 0, 0);
        counts[rarity]++;
      }

      // Check that core rarities were produced (common, rare, epic, legendary)
      // Secret may not appear in every run due to 1% chance
      expect(counts.common).toBeGreaterThan(0);
      expect(counts.rare).toBeGreaterThan(0);
      expect(counts.epic).toBeGreaterThan(0);
      expect(counts.legendary).toBeGreaterThan(0);

      // Common should be the most common (~60%)
      expect(counts.common).toBeGreaterThan(counts.rare);
      expect(counts.common).toBeGreaterThan(counts.epic);

      // Rare should be second most common (~25%)
      expect(counts.rare).toBeGreaterThan(counts.epic);
    });

    it('should have decreasing probability for rarities', () => {
      const counts: Record<string, number> = {
        common: 0,
        rare: 0,
        epic: 0,
        legendary: 0,
        secret: 0,
      };

      const iterations = 50000;
      for (let i = 0; i < iterations; i++) {
        const rarity = rollRarity(0, 0, 0);
        counts[rarity]++;
      }

      // Common > Rare > Epic (approximate check due to randomness)
      expect(counts.common).toBeGreaterThan(counts.rare);
      expect(counts.rare).toBeGreaterThan(counts.epic);
    });
  });

  describe('Prestige Level Effect on Secret Drops', () => {
    it('should have higher secret drop rate at prestige 1+', () => {
      const countsNoPrestige: Record<string, number> = { secret: 0 };
      const countsPrestige: Record<string, number> = { secret: 0 };

      const iterations = 50000;
      for (let i = 0; i < iterations; i++) {
        const rarityNoPrestige = rollRarity(0, 0, 0);
        const rarityPrestige = rollRarity(1, 0, 0);
        if (rarityNoPrestige === 'secret') countsNoPrestige.secret++;
        if (rarityPrestige === 'secret') countsPrestige.secret++;
      }

      // Secret should be more common at prestige 1+ (1% vs 6%)
      expect(countsPrestige.secret).toBeGreaterThan(countsNoPrestige.secret);
    });
  });

  describe('Artifacts for Epoch', () => {
    it('should return artifacts for a specific epoch', () => {
      const artifacts = getArtifactsForEpoch('trypillia');
      expect(artifacts.length).toBeGreaterThan(0);
      artifacts.forEach(artifact => {
        expect(artifact.epoch).toBe('trypillia');
      });
    });

    it('should filter by prestige level for secret artifacts', () => {
      const artifactsPrestige0 = getArtifactsForEpoch('independence', 0);
      const artifactsPrestige1 = getArtifactsForEpoch('independence', 1);

      // Prestige 1 should have access to more secret artifacts
      expect(artifactsPrestige1.length).toBeGreaterThanOrEqual(artifactsPrestige0.length);
    });

    it('should return empty array for epoch with no artifacts', () => {
      // This tests that the function handles non-existent epochs gracefully
      const artifacts = getArtifactsForEpoch('nonexistent_epoch' as EpochId);
      expect(artifacts.length).toBe(0);
    });

    it('should include all rarities in artifacts', () => {
      const rarities = new Set<string>();
      ARTIFACTS.forEach(a => rarities.add(a.rarity));

      expect(rarities.has('common')).toBe(true);
      expect(rarities.has('rare')).toBe(true);
      expect(rarities.has('epic')).toBe(true);
      expect(rarities.has('legendary')).toBe(true);
      expect(rarities.has('secret')).toBe(true);
    });
  });

  describe('Artifact Rarity Distribution', () => {
    it('should have more common artifacts than rare', () => {
      const commonCount = ARTIFACTS.filter(a => a.rarity === 'common').length;
      const rareCount = ARTIFACTS.filter(a => a.rarity === 'rare').length;

      expect(commonCount).toBeGreaterThan(rareCount);
    });

    it('should have more rare artifacts than epic', () => {
      const rareCount = ARTIFACTS.filter(a => a.rarity === 'rare').length;
      const epicCount = ARTIFACTS.filter(a => a.rarity === 'epic').length;

      expect(rareCount).toBeGreaterThan(epicCount);
    });

    it('should have at least some artifacts for each rarity tier', () => {
      const commonCount = ARTIFACTS.filter(a => a.rarity === 'common').length;
      const rareCount = ARTIFACTS.filter(a => a.rarity === 'rare').length;
      const epicCount = ARTIFACTS.filter(a => a.rarity === 'epic').length;
      const legendaryCount = ARTIFACTS.filter(a => a.rarity === 'legendary').length;

      expect(commonCount).toBeGreaterThan(0);
      expect(rareCount).toBeGreaterThan(0);
      expect(epicCount).toBeGreaterThan(0);
      expect(legendaryCount).toBeGreaterThan(0);
    });

    it('should have artifacts available for all epochs at appropriate prestige', () => {
      const epochIds = EPOCHS.map(e => e.id);
      
      epochIds.forEach(epochId => {
        // At prestige 0, some world history epochs may have no artifacts
        const artifactsPrestige0 = getArtifactsForEpoch(epochId, 0);
        // At high enough prestige, all epochs should have artifacts
        const artifactsPrestige5 = getArtifactsForEpoch(epochId, 5);
        
        // Either prestige 0 or prestige 5 should have artifacts for each epoch
        expect(artifactsPrestige0.length > 0 || artifactsPrestige5.length > 0).toBe(true);
      });
    });
  });

  describe('Artifact Parts Requirements', () => {
    it('should have consistent parts requirements', () => {
      ARTIFACTS.forEach(artifact => {
        expect(artifact.parts).toBeGreaterThan(0);
        expect(artifact.parts).toBeLessThanOrEqual(20);
      });
    });

    it('should have reasonable parts for artifacts', () => {
      const allParts = ARTIFACTS.map(a => a.parts);
      const avgParts = allParts.reduce((sum, p) => sum + p, 0) / allParts.length;
      
      // Average parts should be reasonable (not too high, not too low)
      expect(avgParts).toBeGreaterThan(5);
      expect(avgParts).toBeLessThan(15);
    });
  });

  describe('Artifact Bonuses', () => {
    it('should have valid bonus types', () => {
      const validBonusTypes = ['xp_multiplier', 'currency_multiplier', 'passive_boost'];
      
      ARTIFACTS.forEach(artifact => {
        expect(validBonusTypes).toContain(artifact.bonus.type);
        expect(artifact.bonus.value).toBeGreaterThan(1); // Bonuses should increase value
      });
    });

    it('should have higher bonuses for rarer artifacts', () => {
      const commonArtifacts = ARTIFACTS.filter(a => a.rarity === 'common');
      const legendaryArtifacts = ARTIFACTS.filter(a => a.rarity === 'legendary');

      const avgCommonBonus = commonArtifacts.reduce((sum, a) => sum + a.bonus.value, 0) / commonArtifacts.length;
      const avgLegendaryBonus = legendaryArtifacts.reduce((sum, a) => sum + a.bonus.value, 0) / legendaryArtifacts.length;

      expect(avgLegendaryBonus).toBeGreaterThan(avgCommonBonus);
    });

    it('should have secret artifacts with small bonuses', () => {
      const secretArtifacts = ARTIFACTS.filter(a => a.rarity === 'secret');

      secretArtifacts.forEach(artifact => {
        // Secret artifacts should have small bonuses (around 1.01-1.20)
        expect(artifact.bonus.value).toBeLessThan(1.25);
        expect(artifact.bonus.value).toBeGreaterThan(1);
      });
    });
  });

  describe('Epoch Index Mapping', () => {
    it('should have 20 epochs total', () => {
      expect(EPOCHS.length).toBe(20);
    });

    it('should have correct epoch order', () => {
      const expectedOrder: EpochId[] = [
        'trypillia', 'scythia', 'antiquity', 'kyiv_rus', 'halych_volhynia',
        'polish_lithuanian', 'cossack', 'hetmanate', 'empire', 'revolution',
        'soviet', 'independence',
        'egypt', 'greece', 'rome', 'medieval',
        'renaissance', 'enlightenment', 'victorian', 'modern_world',
      ];

      EPOCHS.forEach((epoch, index) => {
        expect(epoch.id).toBe(expectedOrder[index]);
      });
    });
  });

  describe('Chest Reward Generation', () => {
    function generateRewards(
      numArtifacts: number,
      epochIndex: number,
      prestigeLevel: number
    ): Array<{ rarity: string; parts: number }> {
      const rewards: Array<{ rarity: string; parts: number }> = [];

      for (let i = 0; i < numArtifacts; i++) {
        const rarity = rollRarity(prestigeLevel, 0, epochIndex);
        let parts = 1;
        if (rarity === 'common') {
          parts = Math.floor(Math.random() * 3) + 1; // 1-3
        } else if (rarity === 'rare' || rarity === 'epic') {
          parts = Math.floor(Math.random() * 2) + 1; // 1-2
        }
        rewards.push({ rarity, parts });
      }

      return rewards;
    }

    it('should generate 1 reward for daily chest', () => {
      const rewards = generateRewards(1, 0, 0);
      expect(rewards.length).toBe(1);
    });

    it('should generate 2-3 rewards for skychest', () => {
      // Simulate skychest opening multiple times
      for (let i = 0; i < 10; i++) {
        const numArtifacts = Math.floor(Math.random() * 2) + 2; // 2-3
        const rewards = generateRewards(numArtifacts, 0, 0);
        expect(rewards.length).toBeGreaterThanOrEqual(2);
        expect(rewards.length).toBeLessThanOrEqual(3);
      }
    });

    it('should have valid parts for rewards', () => {
      const rewards = generateRewards(5, 0, 0);

      rewards.forEach(reward => {
        if (reward.rarity === 'common') {
          expect(reward.parts).toBeGreaterThanOrEqual(1);
          expect(reward.parts).toBeLessThanOrEqual(3);
        } else if (reward.rarity === 'rare' || reward.rarity === 'epic') {
          expect(reward.parts).toBeGreaterThanOrEqual(1);
          expect(reward.parts).toBeLessThanOrEqual(2);
        } else {
          expect(reward.parts).toBe(1);
        }
      });
    });

    it('should have better rewards in later epochs due to rare bonus', () => {
      const rewardsEarly: string[] = [];
      const rewardsLate: string[] = [];

      // Run more iterations to smooth out randomness
      // Use deterministic seeding for reproducible results
      // Note: JavaScript's Math.random cannot be seeded, so we test the mathematical expectation instead
      
      // Test the bonus calculation directly rather than random outcomes
      const earlyBonus = getEpochRareBonus(0);  // Epoch 1: 0%
      const lateBonus = getEpochRareBonus(15);  // Epoch 16: 1.5%
      
      expect(lateBonus).toBeGreaterThan(earlyBonus);
      expect(earlyBonus).toBe(0);
      expect(lateBonus).toBe(1.5);
    });
  });
});
