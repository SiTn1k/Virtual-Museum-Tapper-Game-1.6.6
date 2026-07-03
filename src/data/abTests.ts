/**
 * Virtual Museum Tapper Game — A/B Test Configurations
 * Production-ready experiment definitions
 */

import type { ABTestConfig } from '../lib/abTest';

// ============================================================================
// TEST CONFIGURATIONS
// ============================================================================

/**
 * Energy Multiplier Test
 * Hypothesis: Gradual energy regen keeps players engaged longer than binary system
 * Primary Metric: Session length, return rate
 */
export const ENERGY_MULTIPLIER_TEST: ABTestConfig = {
  id: 'energy_multiplier_test',
  name: 'Energy Regeneration System',
  description: 'Test gradual vs binary energy regeneration for player engagement',
  status: 'active',
  variantA: {
    type: 'binary',
    maxEnergy: 100,
    regenRate: 0, // No passive regen
    energyPerTap: 1,
    description: 'Binary system - energy depletes fully before regen starts',
  },
  variantB: {
    type: 'gradual',
    maxEnergy: 100,
    regenRate: 2, // 2 energy per second
    energyPerTap: 1,
    regenDelay: 3000, // Start regen 3s after last tap
    description: 'Gradual regen - small amounts while playing',
  },
  trafficSplit: 50,
  startDate: '2026-07-01T00:00:00Z',
  endDate: '2026-07-31T23:59:59Z',
};

/**
 * Generator Cost Test
 * Hypothesis: Lower cost scaling increases generator purchases and engagement
 * Primary Metric: Generators purchased per session
 */
export const GENERATOR_COST_TEST: ABTestConfig = {
  id: 'generator_cost_test',
  name: 'Generator Cost Scaling',
  description: 'Test different generator cost multipliers for progression balance',
  status: 'active',
  variantA: {
    costMultiplier: 1.15,
    description: 'Current cost scaling (1.15x per level)',
    expectedPurchases: 'baseline',
  },
  variantB: {
    costMultiplier: 1.25,
    description: 'Higher cost scaling (1.25x per level)',
    expectedPurchases: 'reduced',
  },
  trafficSplit: 50,
  startDate: '2026-07-01T00:00:00Z',
  endDate: '2026-07-31T23:59:59Z',
};

/**
 * Gacha Cost Test
 * Hypothesis: Testing price sensitivity for gacha system
 * Primary Metric: Gacha open rate, IAP conversion
 */
export const GACHA_COST_TEST: ABTestConfig = {
  id: 'gacha_cost_test',
  name: 'Gacha Pricing Sensitivity',
  description: 'Test gacha cost elasticity for monetization optimization',
  status: 'active',
  variantA: {
    chestPrices: {
      common: 100,
      rare: 300,
      epic: 1000,
      legendary: 5000,
    },
    description: 'Current pricing',
    multiplier: 1,
  },
  variantB: {
    chestPrices: {
      common: 1000,  // 10x
      rare: 3000,    // 10x
      epic: 10000,   // 10x
      legendary: 50000, // 10x
    },
    description: '10x higher pricing',
    multiplier: 10,
  },
  trafficSplit: 50,
  startDate: '2026-07-01T00:00:00Z',
  endDate: '2026-07-31T23:59:59Z',
};

/**
 * Daily Reward Test
 * Hypothesis: Higher daily rewards improve D1 retention
 * Primary Metric: D1 retention, session frequency
 */
export const DAILY_REWARD_TEST: ABTestConfig = {
  id: 'daily_reward_test',
  name: 'Daily Reward Amount',
  description: 'Test different daily reward amounts for retention optimization',
  status: 'active',
  variantA: {
    baseReward: 500,
    streakMultiplier: 1.0, // No streak bonus
    maxReward: 500,
    description: 'Standard reward (500 currency/day)',
  },
  variantB: {
    baseReward: 1000,
    streakMultiplier: 1.0,
    maxReward: 1000,
    description: 'Doubled reward (1000 currency/day)',
  },
  trafficSplit: 50,
  startDate: '2026-07-01T00:00:00Z',
  endDate: '2026-07-31T23:59:59Z',
};

// ============================================================================
// TEST REGISTRY
// ============================================================================

export const AB_TESTS: Record<string, ABTestConfig> = {
  energy_multiplier_test: ENERGY_MULTIPLIER_TEST,
  generator_cost_test: GENERATOR_COST_TEST,
  gacha_cost_test: GACHA_COST_TEST,
  daily_reward_test: DAILY_REWARD_TEST,
};

/**
 * Get all active tests
 */
export function getActiveABTests(): ABTestConfig[] {
  return Object.values(AB_TESTS).filter(test => test.status === 'active');
}

/**
 * Get test config by ID
 */
export function getABTestConfig(testId: string): ABTestConfig | undefined {
  return AB_TESTS[testId];
}

/**
 * Get variant parameters for a test
 */
export function getVariantParams(
  testId: string,
  variant: 'A' | 'B'
): Record<string, unknown> | undefined {
  const config = AB_TESTS[testId];
  if (!config) return undefined;
  return variant === 'A' ? config.variantA : config.variantB;
}

// ============================================================================
// LEGACY TEST COMPATIBILITY
// ============================================================================

/**
 * Legacy format for backward compatibility with analytics.ts
 */
export const LEGACY_AB_VARIANTS: Record<string, { A: Record<string, unknown>; B: Record<string, unknown> }> = {
  energy_multiplier_test: {
    A: ENERGY_MULTIPLIER_TEST.variantA,
    B: ENERGY_MULTIPLIER_TEST.variantB,
  },
  generator_cost_test: {
    A: GENERATOR_COST_TEST.variantA,
    B: GENERATOR_COST_TEST.variantB,
  },
  gacha_cost_test: {
    A: GACHA_COST_TEST.variantA,
    B: GACHA_COST_TEST.variantB,
  },
  daily_reward_test: {
    A: DAILY_REWARD_TEST.variantA,
    B: DAILY_REWARD_TEST.variantB,
  },
};

/**
 * Quick accessor for energy test params
 */
export function getEnergyTestParams(variant: 'A' | 'B'): Record<string, unknown> {
  return variant === 'A' ? ENERGY_MULTIPLIER_TEST.variantA : ENERGY_MULTIPLIER_TEST.variantB;
}

/**
 * Quick accessor for generator cost params
 */
export function getGeneratorCostParams(variant: 'A' | 'B'): Record<string, unknown> {
  return variant === 'A' ? GENERATOR_COST_TEST.variantA : GENERATOR_COST_TEST.variantB;
}

/**
 * Quick accessor for gacha cost params
 */
export function getGachaCostParams(variant: 'A' | 'B'): Record<string, unknown> {
  return variant === 'A' ? GACHA_COST_TEST.variantA : GACHA_COST_TEST.variantB;
}

/**
 * Quick accessor for daily reward params
 */
export function getDailyRewardParams(variant: 'A' | 'B'): Record<string, unknown> {
  return variant === 'A' ? DAILY_REWARD_TEST.variantA : DAILY_REWARD_TEST.variantB;
}
