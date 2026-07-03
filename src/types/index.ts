/**
 * Virtual Museum Tapper Game — Types Index
 * Re-exports all types for cleaner imports
 */

// Game types
export type {
  GameState,
  Epoch,
  EpochId,
  Generator,
  OwnedGenerator,
  DailyCounters,
  TapEvent,
  LeaderboardEntry,
  ActiveBoosters,
  DailyTasksState,
} from './game';

// LiveOps types
export type {
  AnalyticsEvent,
  AnalyticsEventType,
  PlayerSegmentType,
} from './liveops';

// Re-export constants
export { EPOCHS, ARTIFACTS } from '../data/epochs';

// Re-export hook utilities
export { getBoosterMultipliers, getArtifactMultipliers } from '../hooks/useGame';
