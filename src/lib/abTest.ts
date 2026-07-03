/**
 * Virtual Museum Tapper Game — A/B Testing Infrastructure
 * Production-ready framework for experiment management
 */

import { supabase } from './supabase';

// ============================================================================
// TYPES
// ============================================================================

export interface ABTest {
  id: string;
  variant: 'A' | 'B';
  params: Record<string, unknown>;
}

export interface ABTestConfig {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'paused' | 'completed';
  variantA: Record<string, unknown>;
  variantB: Record<string, unknown>;
  trafficSplit: number; // 0-100, percentage for variant A
  startDate?: string;
  endDate?: string;
}

export interface ABTestAssignment {
  testId: string;
  variant: 'A' | 'B';
  assignedAt: string;
  params: Record<string, unknown>;
}

// ============================================================================
// STORAGE KEYS
// ============================================================================

const AB_ASSIGNMENTS_KEY = 'ab_test_assignments';
const AB_USER_HASH_KEY = 'ab_user_hash';

// ============================================================================
// HASH FUNCTION (Deterministic variant assignment)
// ============================================================================

/**
 * Generate deterministic hash for consistent variant assignment
 * Uses FNV-1a algorithm for good distribution
 */
function generateHash(input: string): number {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

/**
 * Generate user-specific hash for A/B test assignment
 */
function getUserHash(telegramId: number): string {
  const storedHash = localStorage.getItem(AB_USER_HASH_KEY);
  if (storedHash) {
    return storedHash;
  }
  const newHash = `${telegramId}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  localStorage.setItem(AB_USER_HASH_KEY, newHash);
  return newHash;
}

// ============================================================================
// CORE A/B TESTING FUNCTIONS
// ============================================================================

/**
 * Get A/B test assignment for a specific test
 * Checks localStorage first, then assigns if not found
 */
export function getABTest(
  testId: string,
  variants: Record<string, unknown>,
  telegramId: number
): ABTest {
  const storageKey = `${AB_ASSIGNMENTS_KEY}_${testId}_${telegramId}`;
  
  // Check localStorage for existing assignment
  const stored = localStorage.getItem(storageKey);
  if (stored) {
    try {
      const assignment: ABTestAssignment = JSON.parse(stored);
      const variantKey = assignment.variant === 'A' ? 'A' : 'B';
      return {
        id: testId,
        variant: assignment.variant,
        params: assignment.params || variants[variantKey] as Record<string, unknown>,
      };
    } catch {
      // Invalid JSON, reassign
    }
  }
  
  // Assign new variant using deterministic hashing
  const userHash = getUserHash(telegramId);
  const hash = generateHash(`${userHash}_${testId}`);
  const variant = hash % 100 < 50 ? 'A' : 'B'; // 50/50 split by default
  
  const variantKey = variant as 'A' | 'B';
  const assignment: ABTestAssignment = {
    testId,
    variant,
    assignedAt: new Date().toISOString(),
    params: variants[variantKey] as Record<string, unknown>,
  };
  
  // Store assignment
  localStorage.setItem(storageKey, JSON.stringify(assignment));
  
  return {
    id: testId,
    variant,
    params: assignment.params,
  };
}

/**
 * Get all test assignments for a user
 */
export function getAllABTestAssignments(telegramId: number): ABTestAssignment[] {
  const assignments: ABTestAssignment[] = [];
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(AB_ASSIGNMENTS_KEY) && key.includes(`_${telegramId}`)) {
      const stored = localStorage.getItem(key);
      if (stored) {
        try {
          assignments.push(JSON.parse(stored));
        } catch {
          // Skip invalid entries
        }
      }
    }
  }
  
  return assignments;
}

/**
 * Override a test assignment (for QA/testing)
 */
export function overrideABTest(
  testId: string,
  variant: 'A' | 'B',
  params: Record<string, unknown>,
  telegramId: number
): ABTest {
  const storageKey = `${AB_ASSIGNMENTS_KEY}_${testId}_${telegramId}`;
  
  const assignment: ABTestAssignment = {
    testId,
    variant,
    assignedAt: new Date().toISOString(),
    params,
  };
  
  localStorage.setItem(storageKey, JSON.stringify(assignment));
  
  return {
    id: testId,
    variant,
    params,
  };
}

/**
 * Clear a specific test assignment
 */
export function clearABTestAssignment(testId: string, telegramId: number): void {
  const storageKey = `${AB_ASSIGNMENTS_KEY}_${testId}_${telegramId}`;
  localStorage.removeItem(storageKey);
}

/**
 * Clear all test assignments (for testing/reset)
 */
export function clearAllABTestAssignments(telegramId: number): void {
  const keysToRemove: string[] = [];
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(AB_ASSIGNMENTS_KEY) && key.includes(`_${telegramId}`)) {
      keysToRemove.push(key);
    }
  }
  
  keysToRemove.forEach(key => localStorage.removeItem(key));
}

// ============================================================================
// SERVER SYNC FUNCTIONS
// ============================================================================

/**
 * Sync A/B test assignments to Supabase for analytics
 */
export async function syncABTestAssignmentsToServer(telegramId: number): Promise<void> {
  if (!supabase) {
    console.warn('[A/B Testing] Supabase not available, skipping server sync');
    return;
  }
  
  const assignments = getAllABTestAssignments(telegramId);
  
  if (assignments.length === 0) {
    return;
  }
  
  const { error } = await supabase.from('ab_test_assignments').upsert(
    assignments.map(a => ({
      telegram_id: telegramId,
      test_id: a.testId,
      variant: a.variant,
      assigned_at: a.assignedAt,
      params: a.params,
      updated_at: new Date().toISOString(),
    })),
    { onConflict: 'telegram_id,test_id' }
  );
  
  if (error) {
    console.error('[A/B Testing] Failed to sync assignments:', error);
  }
}

/**
 * Get assignments from server (for cross-device sync)
 */
export async function getServerAssignments(
  telegramId: number
): Promise<ABTestAssignment[]> {
  if (!supabase) {
    return [];
  }
  
  const { data, error } = await supabase
    .from('ab_test_assignments')
    .select('*')
    .eq('telegram_id', telegramId);
  
  if (error) {
    console.error('[A/B Testing] Failed to fetch assignments:', error);
    return [];
  }
  
  return (data || []).map(row => ({
    testId: row.test_id,
    variant: row.variant as 'A' | 'B',
    assignedAt: row.assigned_at,
    params: row.params || {},
  }));
}

/**
 * Merge server assignments with local (prefer local for consistency)
 */
export async function mergeServerAssignments(
  telegramId: number,
  tests: Record<string, { A: Record<string, unknown>; B: Record<string, unknown> }>
): Promise<void> {
  const serverAssignments = await getServerAssignments(telegramId);
  
  for (const serverAssign of serverAssignments) {
    const localKey = `${AB_ASSIGNMENTS_KEY}_${serverAssign.testId}_${telegramId}`;
    const localExists = localStorage.getItem(localKey);
    
    if (!localExists) {
      // Apply server assignment locally if not exists
      const variantKey = serverAssign.variant as 'A' | 'B';
      const testConfig = tests[serverAssign.testId];
      
      if (testConfig) {
        const assignment: ABTestAssignment = {
          testId: serverAssign.testId,
          variant: serverAssign.variant,
          assignedAt: serverAssign.assignedAt,
          params: serverAssign.params || testConfig[variantKey],
        };
        localStorage.setItem(localKey, JSON.stringify(assignment));
      }
    }
  }
}

// ============================================================================
// TEST STATUS CHECKS
// ============================================================================

/**
 * Check if a test is currently active based on dates
 */
export function isTestActive(config: ABTestConfig): boolean {
  if (config.status !== 'active') {
    return false;
  }
  
  const now = new Date();
  
  if (config.startDate) {
    const start = new Date(config.startDate);
    if (now < start) {
      return false;
    }
  }
  
  if (config.endDate) {
    const end = new Date(config.endDate);
    if (now > end) {
      return false;
    }
  }
  
  return true;
}

/**
 * Get active tests from configuration
 */
export function getActiveTests(configs: ABTestConfig[]): ABTestConfig[] {
  return configs.filter(isTestActive);
}

// ============================================================================
// ANALYTICS HELPERS
// ============================================================================

/**
 * Get experiment participation data for analytics
 */
export function getExperimentParticipation(telegramId: number): {
  testId: string;
  variant: 'A' | 'B';
  participatedAt: string;
}[] {
  const assignments = getAllABTestAssignments(telegramId);
  
  return assignments.map(a => ({
    testId: a.testId,
    variant: a.variant,
    participatedAt: a.assignedAt,
  }));
}

/**
 * Format variant for analytics tracking
 */
export function formatVariantForAnalytics(testId: string, variant: 'A' | 'B'): string {
  return `${testId}_${variant}`;
}
