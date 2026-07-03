import { describe, it, expect } from 'vitest';
import {
  getTodayDateStr,
  getYesterdayDateStr,
  getDailyTaskIds,
  makeFreshDailyTasks,
  isTaskComplete,
  getStreakReward,
  getTaskById,
  TASK_POOL,
} from '../src/data/tasks';

describe('Daily Tasks System', () => {
  describe('Date Functions', () => {
    it('should return date string in correct format', () => {
      const dateStr = getTodayDateStr();
      expect(dateStr).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('should return yesterday date string in correct format', () => {
      const dateStr = getYesterdayDateStr();
      expect(dateStr).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('should return different dates for today and yesterday', () => {
      const today = getTodayDateStr();
      const yesterday = getYesterdayDateStr();
      expect(today).not.toBe(yesterday);
    });

    it('should be consistent when called multiple times on same day', () => {
      const date1 = getTodayDateStr();
      const date2 = getTodayDateStr();
      expect(date1).toBe(date2);
    });
  });

  describe('Daily Task Selection', () => {
    it('should return exactly 3 task IDs', () => {
      const tasks = getDailyTaskIds('2024-01-15');
      expect(tasks.length).toBe(3);
    });

    it('should return unique task IDs', () => {
      const tasks = getDailyTaskIds('2024-01-15');
      const uniqueTasks = new Set(tasks);
      expect(uniqueTasks.size).toBe(3);
    });

    it('should return valid task IDs from the pool', () => {
      const tasks = getDailyTaskIds('2024-01-15');
      tasks.forEach(taskId => {
        expect(getTaskById(taskId)).toBeDefined();
      });
    });

    it('should return same tasks for same date (deterministic)', () => {
      const tasks1 = getDailyTaskIds('2024-01-15');
      const tasks2 = getDailyTaskIds('2024-01-15');
      expect(tasks1).toEqual(tasks2);
    });

    it('should return different tasks for different dates', () => {
      const tasks1 = getDailyTaskIds('2024-01-15');
      const tasks2 = getDailyTaskIds('2024-01-16');
      expect(tasks1).not.toEqual(tasks2);
    });

    it('should use date string for selection', () => {
      // Should work with any valid date format
      const tasks = getDailyTaskIds('2024-12-31');
      expect(tasks.length).toBe(3);
    });
  });

  describe('Task Pool', () => {
    it('should have tasks for all required types', () => {
      const types = new Set(TASK_POOL.map(t => t.type));
      expect(types.has('tap')).toBe(true);
      expect(types.has('earn_xp')).toBe(true);
      expect(types.has('buy_generator')).toBe(true);
      expect(types.has('open_gacha')).toBe(true);
      expect(types.has('upgrade_tap')).toBe(true);
    });

    it('should have valid task definitions', () => {
      TASK_POOL.forEach(task => {
        expect(task.id).toBeDefined();
        expect(task.type).toBeDefined();
        expect(task.target).toBeGreaterThan(0);
        expect(task.reward).toBeDefined();
      });
    });

    it('should have increasing targets for same type', () => {
      const tapTasks = TASK_POOL.filter(t => t.type === 'tap');
      tapTasks.sort((a, b) => a.target - b.target);
      
      for (let i = 1; i < tapTasks.length; i++) {
        expect(tapTasks[i].target).toBeGreaterThan(tapTasks[i - 1].target);
      }
    });
  });

  describe('Task Completion', () => {
    it('should correctly identify incomplete tasks', () => {
      const task = TASK_POOL[0]; // First task with some target
      const counters = { tap: 0, earn_xp: 0, buy_generator: 0, open_gacha: 0, upgrade_tap: 0 };
      
      expect(isTaskComplete(task, counters)).toBe(false);
    });

    it('should correctly identify complete tasks', () => {
      const tapTasks = TASK_POOL.filter(t => t.type === 'tap');
      const easyTask = tapTasks[0]; // Task with smallest target
      
      const counters = { tap: easyTask.target, earn_xp: 0, buy_generator: 0, open_gacha: 0, upgrade_tap: 0 };
      expect(isTaskComplete(easyTask, counters)).toBe(true);
    });

    it('should correctly identify partially complete tasks', () => {
      const tapTasks = TASK_POOL.filter(t => t.type === 'tap');
      const easyTask = tapTasks[0];
      
      const counters = { tap: Math.floor(easyTask.target / 2), earn_xp: 0, buy_generator: 0, open_gacha: 0, upgrade_tap: 0 };
      expect(isTaskComplete(easyTask, counters)).toBe(false);
    });
  });

  describe('Fresh Daily Tasks Creation', () => {
    it('should create tasks with correct date', () => {
      const dateStr = '2024-01-15';
      const tasks = makeFreshDailyTasks(dateStr);
      
      expect(tasks.date).toBe(dateStr);
    });

    it('should initialize all counters to 0', () => {
      const tasks = makeFreshDailyTasks('2024-01-15');
      
      expect(tasks.counters.tap).toBe(0);
      expect(tasks.counters.earn_xp).toBe(0);
      expect(tasks.counters.buy_generator).toBe(0);
      expect(tasks.counters.open_gacha).toBe(0);
      expect(tasks.counters.upgrade_tap).toBe(0);
    });

    it('should start with empty claimed array', () => {
      const tasks = makeFreshDailyTasks('2024-01-15');
      expect(tasks.claimed).toEqual([]);
    });

    it('should have 3 unique task IDs', () => {
      const tasks = makeFreshDailyTasks('2024-01-15');
      expect(tasks.taskIds.length).toBe(3);
      
      const uniqueIds = new Set(tasks.taskIds);
      expect(uniqueIds.size).toBe(3);
    });
  });
});

describe('Streak Reward System', () => {
  describe('Daily Rewards', () => {
    it('should return correct reward for day 1', () => {
      const reward = getStreakReward(1);
      
      expect(reward.currency).toBe(60);
      expect(reward.xp).toBe(0);
      expect(reward.label).toBe('День 1');
      expect(reward.isWeekly).toBe(false);
    });

    it('should increase daily currency reward', () => {
      const day1 = getStreakReward(1);
      const day3 = getStreakReward(3);
      const day6 = getStreakReward(6);
      
      expect(day3.currency).toBeGreaterThan(day1.currency);
      expect(day6.currency).toBeGreaterThan(day3.currency);
    });

    it('should give 200 XP on day 3+ (non-weekly)', () => {
      const day3 = getStreakReward(3);
      expect(day3.xp).toBe(200);
      
      const day5 = getStreakReward(5);
      expect(day5.xp).toBe(200);
    });

    it('should cap currency at 1500', () => {
      const day30 = getStreakReward(30);
      expect(day30.currency).toBeLessThanOrEqual(1500);
    });

    it('should return correct label format', () => {
      const day1 = getStreakReward(1);
      expect(day1.label).toContain('День');
      
      const day7 = getStreakReward(7);
      expect(day7.label).toContain('Тиждень');
    });
  });

  describe('Weekly Rewards', () => {
    it('should identify day 7 as weekly', () => {
      const day7 = getStreakReward(7);
      expect(day7.isWeekly).toBe(true);
    });

    it('should give higher base reward on weekly day', () => {
      const day6 = getStreakReward(6);
      const day7 = getStreakReward(7);
      
      expect(day7.currency).toBeGreaterThan(day6.currency);
    });

    it('should give XP on weekly reward', () => {
      const day7 = getStreakReward(7);
      expect(day7.xp).toBeGreaterThan(0);
    });

    it('should calculate correct week number', () => {
      const day7 = getStreakReward(7);
      expect(day7.label).toContain('Тиждень 1');
      
      const day14 = getStreakReward(14);
      expect(day14.label).toContain('Тиждень 2');
    });

    it('should increase weekly XP by week number', () => {
      const week1 = getStreakReward(7);
      const week2 = getStreakReward(14);
      
      expect(week2.xp).toBeGreaterThan(week1.xp);
    });
  });

  describe('Streak Continuity', () => {
    it('should calculate week number correctly', () => {
      expect(getStreakReward(1).label).toContain('День 1');
      expect(getStreakReward(7).label).toContain('Тиждень 1');
      expect(getStreakReward(8).label).toContain('День 8');
      expect(getStreakReward(14).label).toContain('Тиждень 2');
      expect(getStreakReward(21).label).toContain('Тиждень 3');
    });

    it('should have increasing bonus for later weeks', () => {
      const week1 = getStreakReward(7);
      const week3 = getStreakReward(21);
      
      expect(week3.currency).toBeGreaterThan(week1.currency);
    });

    it('should handle very long streaks', () => {
      const day100 = getStreakReward(100);
      
      expect(day100.currency).toBeGreaterThan(0);
      // Day 100 = week 15 (100/7 = 14 remainder 2), so day 100 is not weekly
      // Week 15 starts at day 99 (14*7 + 1), week 16 starts at day 106
      // Day 100 is in week 15, not weekly
    });
  });

  describe('Edge Cases', () => {
    it('should handle streak of 0', () => {
      const reward = getStreakReward(0);
      
      expect(reward.currency).toBeDefined();
      expect(reward.xp).toBeDefined();
    });

    it('should handle streak of 1', () => {
      const reward = getStreakReward(1);
      
      expect(reward.isWeekly).toBe(false);
      expect(reward.xp).toBe(0);
    });

    it('should handle streak of 7', () => {
      const reward = getStreakReward(7);
      
      expect(reward.isWeekly).toBe(true);
      expect(reward.xp).toBeGreaterThan(0);
    });

    it('should handle streak of 8', () => {
      const reward = getStreakReward(8);
      
      expect(reward.isWeekly).toBe(false);
    });
  });
});

describe('Task Rewards', () => {
  describe('Reward Values', () => {
    it('should have currency rewards for all tasks', () => {
      TASK_POOL.forEach(task => {
        expect(task.reward.currency).toBeDefined();
        expect(task.reward.currency).toBeGreaterThan(0);
      });
    });

    it('should have increasing rewards for harder tasks', () => {
      const tapTasks = TASK_POOL.filter(t => t.type === 'tap');
      tapTasks.sort((a, b) => a.target - b.target);
      
      for (let i = 1; i < tapTasks.length; i++) {
        expect(tapTasks[i].reward.currency!).toBeGreaterThan(tapTasks[i - 1].reward.currency!);
      }
    });

    it('should have reasonable reward-to-target ratio for repeatable tasks', () => {
      // Only check tap tasks which are the most common repeatable tasks
      const tapTasks = TASK_POOL.filter(task => task.type === 'tap');
      tapTasks.forEach(task => {
        const ratio = task.reward.currency! / task.target;
        // Currency per tap should be reasonable
        expect(ratio).toBeGreaterThan(0.3);
        expect(ratio).toBeLessThan(0.8);
      });
    });

    it('should have reasonable reward-to-target ratio across all tasks', () => {
      // Some tasks (like buying generators) have naturally higher ratios
      // because they're harder to complete. Just ensure no task has extreme ratios.
      TASK_POOL.forEach(task => {
        const ratio = task.reward.currency! / task.target;
        // All ratios should be positive and reasonable (not negative or astronomically high)
        expect(ratio).toBeGreaterThan(0);
        expect(ratio).toBeLessThan(200);
      });
    });
  });
});
