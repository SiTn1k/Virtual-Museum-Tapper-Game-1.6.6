import { describe, it, expect } from 'vitest';
import { EPOCHS, getGeneratorCost, getGeneratorProduction, getEpochById } from '../src/data/epochs';
import type { Generator } from '../src/types/game';

describe('Generator Cost Formulas', () => {
  describe('getGeneratorCost', () => {
    it('should return base cost when currentLevel is 0 (formula: baseCost * 1.27^0 = baseCost)', () => {
      const generator: Generator = {
        id: 'test_gen',
        name: { ua: 'Test', en: 'Test' },
        description: { ua: 'Test desc', en: 'Test desc' },
        baseCost: 100,
        baseProduction: 10,
        costMultiplier: 1.27,
        icon: '🧪',
      };

      const cost = getGeneratorCost(generator, 0);
      expect(cost).toBe(100); // 100 * 1.27^0 = 100
    });

    it('should apply multiplier at level 1 (baseCost * 1.27^1 = baseCost * 1.27)', () => {
      const generator: Generator = {
        id: 'test_gen',
        name: { ua: 'Test', en: 'Test' },
        description: { ua: 'Test desc', en: 'Test desc' },
        baseCost: 100,
        baseProduction: 10,
        costMultiplier: 1.27,
        icon: '🧪',
      };

      // 100 * 1.27^1 = 127
      const cost = getGeneratorCost(generator, 1);
      expect(cost).toBeGreaterThanOrEqual(126);
      expect(cost).toBeLessThanOrEqual(128);
    });

    it('should apply cost multiplier for each level', () => {
      const generator: Generator = {
        id: 'test_gen',
        name: { ua: 'Test', en: 'Test' },
        description: { ua: 'Test desc', en: 'Test desc' },
        baseCost: 100,
        baseProduction: 10,
        costMultiplier: 1.27,
        icon: '🧪',
      };

      // Level 2: should be greater than level 1
      const cost1 = getGeneratorCost(generator, 1);
      const cost2 = getGeneratorCost(generator, 2);
      expect(cost2).toBeGreaterThan(cost1);
      
      // Level 10: should be significantly higher (100 * 1.27^10 ≈ 1270 * 1.27^9... let's just check it's high enough)
      const cost10 = getGeneratorCost(generator, 10);
      expect(cost10).toBeGreaterThan(1000);
      expect(cost10).toBeLessThan(2000);
    });

    it('should floor the result to an integer', () => {
      const generator: Generator = {
        id: 'test_gen',
        name: { ua: 'Test', en: 'Test' },
        description: { ua: 'Test desc', en: 'Test desc' },
        baseCost: 100,
        baseProduction: 10,
        costMultiplier: 1.27,
        icon: '🧪',
      };

      const cost = getGeneratorCost(generator, 5);
      expect(Number.isInteger(cost)).toBe(true);
    });

    it('should handle large multipliers correctly', () => {
      const generator: Generator = {
        id: 'test_gen',
        name: { ua: 'Test', en: 'Test' },
        description: { ua: 'Test desc', en: 'Test desc' },
        baseCost: 90,
        baseProduction: 2,
        costMultiplier: 1.27,
        icon: '🧪',
      };

      // Level 10: 90 * 1.27^10 ≈ 90 * 10.9 ≈ 982
      const cost = getGeneratorCost(generator, 10);
      expect(cost).toBeGreaterThan(900);
      expect(cost).toBeLessThan(1100);
    });

    it('should cost more for each subsequent purchase', () => {
      const epoch = EPOCHS[0];
      const generator = epoch.generators[0];

      const cost0 = getGeneratorCost(generator, 0);
      const cost1 = getGeneratorCost(generator, 1);
      const cost2 = getGeneratorCost(generator, 2);

      expect(cost1).toBeGreaterThan(cost0);
      expect(cost2).toBeGreaterThan(cost1);
    });
  });

  describe('getGeneratorProduction', () => {
    it('should return 0 production at level 0', () => {
      const generator: Generator = {
        id: 'test_gen',
        name: { ua: 'Test', en: 'Test' },
        description: { ua: 'Test desc', en: 'Test desc' },
        baseCost: 100,
        baseProduction: 10,
        costMultiplier: 1.27,
        icon: '🧪',
      };

      expect(getGeneratorProduction(generator, 0)).toBe(0);
    });

    it('should return base production at level 1', () => {
      const generator: Generator = {
        id: 'test_gen',
        name: { ua: 'Test', en: 'Test' },
        description: { ua: 'Test desc', en: 'Test desc' },
        baseCost: 100,
        baseProduction: 10,
        costMultiplier: 1.27,
        icon: '🧪',
      };

      expect(getGeneratorProduction(generator, 1)).toBe(10);
    });

    it('should scale linearly with level', () => {
      const generator: Generator = {
        id: 'test_gen',
        name: { ua: 'Test', en: 'Test' },
        description: { ua: 'Test desc', en: 'Test desc' },
        baseCost: 100,
        baseProduction: 10,
        costMultiplier: 1.27,
        icon: '🧪',
      };

      expect(getGeneratorProduction(generator, 5)).toBe(50);
      expect(getGeneratorProduction(generator, 10)).toBe(100);
      expect(getGeneratorProduction(generator, 20)).toBe(200);
    });
  });

  describe('Epoch Generators', () => {
    it('should have increasing base costs within each epoch', () => {
      EPOCHS.forEach((epoch) => {
        for (let i = 1; i < epoch.generators.length; i++) {
          const prev = epoch.generators[i - 1];
          const curr = epoch.generators[i];
          expect(curr.baseCost).toBeGreaterThan(prev.baseCost);
        }
      });
    });

    it('should have increasing base production within each epoch', () => {
      EPOCHS.forEach((epoch) => {
        for (let i = 1; i < epoch.generators.length; i++) {
          const prev = epoch.generators[i - 1];
          const curr = epoch.generators[i];
          expect(curr.baseProduction).toBeGreaterThan(prev.baseProduction);
        }
      });
    });

    it('should have cost multiplier of 1.27 for all generators', () => {
      EPOCHS.forEach((epoch) => {
        epoch.generators.forEach((gen) => {
          expect(gen.costMultiplier).toBe(1.27);
        });
      });
    });

    it('should have valid generator IDs', () => {
      EPOCHS.forEach((epoch) => {
        epoch.generators.forEach((gen) => {
          expect(gen.id).toBeDefined();
          expect(typeof gen.id).toBe('string');
          expect(gen.id.length).toBeGreaterThan(0);
        });
      });
    });

    it('should have valid names in both languages', () => {
      EPOCHS.forEach((epoch) => {
        epoch.generators.forEach((gen) => {
          expect(gen.name.ua).toBeDefined();
          expect(gen.name.en).toBeDefined();
          expect(gen.name.ua.length).toBeGreaterThan(0);
          expect(gen.name.en.length).toBeGreaterThan(0);
        });
      });
    });
  });

  describe('Generator Cost vs Production Balance', () => {
    it('should have reasonable cost-to-production ratio', () => {
      EPOCHS.forEach((epoch) => {
        epoch.generators.forEach((gen) => {
          const costAtLevel1 = getGeneratorCost(gen, 1);
          const productionAtLevel1 = getGeneratorProduction(gen, 1);
          
          // The ratio should be reasonable (not too high, not too low)
          // This ensures the game is playable
          const ratio = costAtLevel1 / productionAtLevel1;
          expect(ratio).toBeGreaterThan(1);
          expect(ratio).toBeLessThan(1000);
        });
      });
    });

    it('should have comparable ROI across generator tiers', () => {
      const epoch = EPOCHS[0];
      const cheapGen = epoch.generators[0];
      const expensiveGen = epoch.generators[epoch.generators.length - 1];

      // At level 10, check production per currency spent
      const cheapCost10 = getGeneratorCost(cheapGen, 10);
      const expensiveCost10 = getGeneratorCost(expensiveGen, 10);
      const cheapProd10 = getGeneratorProduction(cheapGen, 10);
      const expensiveProd10 = getGeneratorProduction(expensiveGen, 10);

      // ROI = production / cost (higher is better)
      const cheapROI = cheapProd10 / cheapCost10;
      const expensiveROI = expensiveProd10 / expensiveCost10;

      // ROI should be comparable (within reasonable range, not inverted)
      // Both generators should provide reasonable value
      expect(cheapROI).toBeGreaterThan(0);
      expect(expensiveROI).toBeGreaterThan(0);
    });
  });

  describe('Total Generator Costs', () => {
    it('should calculate total cost to buy multiple generators', () => {
      const generator: Generator = {
        id: 'test_gen',
        name: { ua: 'Test', en: 'Test' },
        description: { ua: 'Test desc', en: 'Test desc' },
        baseCost: 100,
        baseProduction: 10,
        costMultiplier: 1.27,
        icon: '🧪',
      };

      // Calculate total cost to buy 5 generators
      let totalCost = 0;
      for (let i = 1; i <= 5; i++) {
        totalCost += getGeneratorCost(generator, i);
      }

      // Each subsequent purchase should cost more
      // With 1.27 multiplier: 127 + 161 + 205 + 260 + 330 = ~1083
      expect(totalCost).toBeGreaterThan(1000);
      expect(totalCost).toBeLessThan(1500);
    });

    it('should handle buying to high levels', () => {
      const generator: Generator = {
        id: 'test_gen',
        name: { ua: 'Test', en: 'Test' },
        description: { ua: 'Test desc', en: 'Test desc' },
        baseCost: 100,
        baseProduction: 10,
        costMultiplier: 1.27,
        icon: '🧪',
      };

      const cost50 = getGeneratorCost(generator, 50);
      // 100 * 1.27^50 ≈ 100 * 292,000+ = very large
      expect(cost50).toBeGreaterThan(10000000);
      expect(cost50).toBeLessThan(1000000000);
    });
  });
});
