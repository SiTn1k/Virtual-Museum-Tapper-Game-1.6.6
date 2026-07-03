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
  // Events
  EventConfig,
  EventType,
  EventRewardMultipliers,
  PlayerEventState,
  // Seasons
  SeasonConfig,
  SeasonReward,
  SeasonChallenge,
  PlayerSeasonState,
  // Achievements
  AchievementDef,
  AchievementCategory,
  PlayerAchievementState,
  // Missions
  MissionDef,
  MissionType,
  MissionFrequency,
  PlayerMissionState,
  // Notifications
  NotificationTemplate,
  NotificationType,
  ScheduledNotification,
} from './liveops';

// Re-export constants
export { EPOCHS, ARTIFACTS } from '../data/epochs';
export { ALL_ACHIEVEMENTS } from '../data/achievements';
export { ALL_MILESTONES } from '../data/collectionMilestones';
export { ALL_EVENTS } from '../data/events';
export { ALL_SEASONS } from '../data/seasons';
export { TASKS } from '../data/tasks';

// Re-export hook utilities
export { getBoosterMultipliers, getArtifactMultipliers } from '../hooks/useGame';
