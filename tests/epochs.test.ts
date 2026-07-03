import { describe, it, expect } from 'vitest';
import { EPOCHS } from '../src/data/epochs';

describe('EPOCHS Data', () => {
  it('should have epochs defined', () => {
    expect(EPOCHS).toBeDefined();
    expect(Array.isArray(EPOCHS)).toBe(true);
    expect(EPOCHS.length).toBeGreaterThan(0);
  });

  it('should have valid epoch IDs', () => {
    EPOCHS.forEach((epoch) => {
      expect(epoch.id).toBeDefined();
      expect(typeof epoch.id).toBe('string');
      expect(epoch.id.length).toBeGreaterThan(0);
    });
  });

  it('should have valid Ukrainian names', () => {
    EPOCHS.forEach((epoch) => {
      expect(epoch.name.ua).toBeDefined();
      expect(typeof epoch.name.ua).toBe('string');
      expect(epoch.name.ua.length).toBeGreaterThan(0);
    });
  });

  it('should have valid English names', () => {
    EPOCHS.forEach((epoch) => {
      expect(epoch.name.en).toBeDefined();
      expect(typeof epoch.name.en).toBe('string');
      expect(epoch.name.en.length).toBeGreaterThan(0);
    });
  });

  it('should have valid descriptions', () => {
    EPOCHS.forEach((epoch) => {
      expect(epoch.description.ua).toBeDefined();
      expect(epoch.description.en).toBeDefined();
    });
  });

  it('should have valid period info', () => {
    EPOCHS.forEach((epoch) => {
      expect(epoch.period.ua).toBeDefined();
      expect(epoch.period.en).toBeDefined();
    });
  });

  it('should have valid level ranges', () => {
    EPOCHS.forEach((epoch) => {
      expect(epoch.levelRange.min).toBeLessThan(epoch.levelRange.max);
      expect(epoch.unlockLevel).toBeGreaterThan(0);
    });
  });

  it('should have valid generators array', () => {
    EPOCHS.forEach((epoch) => {
      expect(Array.isArray(epoch.generators)).toBe(true);
      expect(epoch.generators.length).toBeGreaterThan(0);
    });
  });

  it('should have valid generator structure', () => {
    EPOCHS.forEach((epoch) => {
      epoch.generators.forEach((gen) => {
        expect(gen.id).toBeDefined();
        expect(gen.name.ua).toBeDefined();
        expect(gen.name.en).toBeDefined();
        expect(typeof gen.baseCost).toBe('number');
        expect(typeof gen.baseProduction).toBe('number');
        expect(gen.costMultiplier).toBeDefined();
      });
    });
  });

  it('should have valid currency and icon', () => {
    EPOCHS.forEach((epoch) => {
      expect(typeof epoch.currency).toBe('string');
      expect(epoch.currency.length).toBeGreaterThan(0);
      expect(typeof epoch.currencyIcon).toBe('string');
      expect(epoch.currencyIcon.length).toBeGreaterThan(0);
    });
  });

  it('should have valid color and bgGradient', () => {
    EPOCHS.forEach((epoch) => {
      expect(typeof epoch.color).toBe('string');
      expect(typeof epoch.bgGradient).toBe('string');
    });
  });

  it('should have valid requiredRebirth values', () => {
    EPOCHS.forEach((epoch) => {
      expect(typeof epoch.requiredRebirth).toBe('number');
      expect(epoch.requiredRebirth).toBeGreaterThanOrEqual(0);
    });
  });
});

describe('Epoch Index Calculations', () => {
  it('should find epoch by ID', () => {
    const firstEpoch = EPOCHS[0];
    const epoch = EPOCHS.find((e) => e.id === firstEpoch.id);
    expect(epoch).toBeDefined();
    expect(epoch?.id).toBe(firstEpoch.id);
  });

  it('should calculate correct index for epoch', () => {
    const middleEpoch = EPOCHS[Math.floor(EPOCHS.length / 2)];
    const index = EPOCHS.findIndex((e) => e.id === middleEpoch.id);
    expect(index).toBeGreaterThanOrEqual(0);
    expect(EPOCHS[index].id).toBe(middleEpoch.id);
  });
});

describe('Epoch Progression', () => {
  it('should have generators with increasing base costs', () => {
    EPOCHS.forEach((epoch) => {
      for (let i = 1; i < epoch.generators.length; i++) {
        expect(epoch.generators[i].baseCost).toBeGreaterThan(epoch.generators[i - 1].baseCost);
      }
    });
  });

  it('should have generators with increasing production', () => {
    EPOCHS.forEach((epoch) => {
      for (let i = 1; i < epoch.generators.length; i++) {
        expect(epoch.generators[i].baseProduction).toBeGreaterThan(epoch.generators[i - 1].baseProduction);
      }
    });
  });

  it('should have proper unlock levels', () => {
    // Unlock levels should be in ascending order
    for (let i = 1; i < EPOCHS.length; i++) {
      expect(EPOCHS[i].unlockLevel).toBeGreaterThanOrEqual(EPOCHS[i - 1].unlockLevel);
    }
  });
});

describe('Epoch Bonuses (Phase 9)', () => {
  // These match the server-side implementation in open-chest/index.ts
  function getEpochRareBonus(epochIndex: number): number {
    if (epochIndex >= 16) return 2.0;      // Epochs 17-20: +2%
    if (epochIndex >= 12) return 1.5;      // Epochs 13-16: +1.5%
    if (epochIndex >= 8) return 1.0;       // Epochs 9-12: +1%
    if (epochIndex >= 4) return 0.5;       // Epochs 5-8: +0.5%
    return 0;                              // Epochs 1-4: Base rates
  }

  it('should have no bonus for epochs 1-4', () => {
    expect(getEpochRareBonus(0)).toBe(0);
    expect(getEpochRareBonus(1)).toBe(0);
    expect(getEpochRareBonus(2)).toBe(0);
    expect(getEpochRareBonus(3)).toBe(0);
  });

  it('should have +0.5% bonus for epochs 5-8', () => {
    expect(getEpochRareBonus(4)).toBe(0.5);
    expect(getEpochRareBonus(5)).toBe(0.5);
    expect(getEpochRareBonus(6)).toBe(0.5);
    expect(getEpochRareBonus(7)).toBe(0.5);
  });

  it('should have +1% bonus for epochs 9-12', () => {
    expect(getEpochRareBonus(8)).toBe(1.0);
    expect(getEpochRareBonus(9)).toBe(1.0);
    expect(getEpochRareBonus(10)).toBe(1.0);
    expect(getEpochRareBonus(11)).toBe(1.0);
  });

  it('should have +1.5% bonus for epochs 13-16', () => {
    expect(getEpochRareBonus(12)).toBe(1.5);
    expect(getEpochRareBonus(13)).toBe(1.5);
    expect(getEpochRareBonus(14)).toBe(1.5);
    expect(getEpochRareBonus(15)).toBe(1.5);
  });

  it('should have +2% bonus for epochs 17-20', () => {
    expect(getEpochRareBonus(16)).toBe(2.0);
    expect(getEpochRareBonus(17)).toBe(2.0);
    expect(getEpochRareBonus(18)).toBe(2.0);
    expect(getEpochRareBonus(19)).toBe(2.0);
  });
});
