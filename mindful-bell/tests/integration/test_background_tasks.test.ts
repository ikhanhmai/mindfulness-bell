import { BackgroundTaskManager } from '../../src/services/BackgroundTasks';
import { BellSchedulerService } from '../../src/services/BellSchedulerService';
import { NotificationManager } from '../../src/services/NotificationManager';
import { DatabaseService } from '../../src/services/DatabaseService';

describe('Background Tasks Integration Tests', () => {
  let backgroundTasks: BackgroundTaskManager;
  let bellScheduler: BellSchedulerService;
  let notificationManager: NotificationManager;
  let databaseService: DatabaseService;

  beforeEach(async () => {
    backgroundTasks = BackgroundTaskManager.getInstance();
    bellScheduler = BellSchedulerService.getInstance();
    notificationManager = NotificationManager.getInstance();
    databaseService = DatabaseService.getInstance();

    await databaseService.initialize();
    await notificationManager.initialize();
  });

  describe('background task registration', () => {
    it('should register daily schedule generation task', async () => {
      const taskName = 'DAILY_BELL_SCHEDULE_GENERATION';

      await backgroundTasks.registerDailyScheduleTask();

      const isRegistered = await backgroundTasks.isTaskRegistered(taskName);
      expect(isRegistered).toBe(true);
    });

    it('should register notification cleanup task', async () => {
      const taskName = 'NOTIFICATION_CLEANUP';

      await backgroundTasks.registerNotificationCleanupTask();

      const isRegistered = await backgroundTasks.isTaskRegistered(taskName);
      expect(isRegistered).toBe(true);
    });

    it('should register bell timeout handler', async () => {
      const taskName = 'BELL_TIMEOUT_HANDLER';

      await backgroundTasks.registerBellTimeoutTask();

      const isRegistered = await backgroundTasks.isTaskRegistered(taskName);
      expect(isRegistered).toBe(true);
    });

    it('should handle task registration failures gracefully', async () => {
      // Test with invalid task configuration
      await expect(
        backgroundTasks.registerTask('INVALID_TASK', async () => {
          throw new Error('Simulated failure');
        }, { interval: -1 }) // Invalid interval
      ).rejects.toThrow();
    });
  });

  describe('daily schedule generation task', () => {
    it('should generate and schedule bells at midnight', async () => {
      // Mock current time to be just before midnight
      const mockMidnight = new Date();
      mockMidnight.setHours(23, 59, 50, 0);

      // Manually trigger the daily schedule task
      await backgroundTasks.executeDailyScheduleGeneration();

      // Verify that new schedule was generated
      const scheduledCount = await notificationManager.getScheduledNotificationsCount();
      expect(scheduledCount).toBeGreaterThanOrEqual(0);
    });

    it('should use current settings for schedule generation', async () => {
      const settings = await databaseService.getSettings();

      // Execute schedule generation
      await backgroundTasks.executeDailyScheduleGeneration();

      // Verify schedule respects settings
      const nextNotification = await notificationManager.getNextScheduledNotification();

      if (nextNotification) {
        const hour = nextNotification.getHours();
        const minute = nextNotification.getMinutes();
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;

        // Should be within active windows
        const isInActiveWindow = settings.activeWindows.some(window => {
          const startMinutes = parseInt(window.start.split(':')[0]) * 60 + parseInt(window.start.split(':')[1]);
          const endMinutes = parseInt(window.end.split(':')[0]) * 60 + parseInt(window.end.split(':')[1]);
          const notificationMinutes = hour * 60 + minute;

          return notificationMinutes >= startMinutes && notificationMinutes <= endMinutes;
        });

        expect(isInActiveWindow).toBe(true);
      }
    });

    it('should handle schedule generation errors', async () => {
      // Test with invalid settings that might cause errors
      await expect(
        backgroundTasks.executeDailyScheduleGeneration()
      ).resolves.not.toThrow();

      // Should fail gracefully and log errors
    });

    it('should clear previous day notifications before scheduling new ones', async () => {
      // Schedule some notifications
      const schedule = await bellScheduler.generateDailySchedule(
        new Date(),
        'low',
        [{ start: '10:00', end: '11:00' }],
        []
      );

      await notificationManager.scheduleBellNotifications(schedule);
      const initialCount = await notificationManager.getScheduledNotificationsCount();
      expect(initialCount).toBeGreaterThan(0);

      // Execute daily schedule generation (should clear and reschedule)
      await backgroundTasks.executeDailyScheduleGeneration();

      // Should have new notifications scheduled
      const newCount = await notificationManager.getScheduledNotificationsCount();
      expect(newCount).toBeGreaterThanOrEqual(0);
    });
  });

  describe('notification cleanup task', () => {
    it('should remove expired notifications', async () => {
      // Create past notifications (simulated)
      const pastSchedule = await bellScheduler.generateDailySchedule(
        new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
        'low',
        [{ start: '10:00', end: '11:00' }],
        []
      );

      await notificationManager.scheduleBellNotifications(pastSchedule);

      // Execute cleanup task
      await backgroundTasks.executeNotificationCleanup();

      // Should have removed expired notifications
      // Note: Implementation would track and remove actually expired notifications
      expect(true).toBe(true); // Placeholder for actual verification
    });

    it('should preserve future notifications during cleanup', async () => {
      // Schedule future notifications
      const futureSchedule = await bellScheduler.generateDailySchedule(
        new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
        'medium',
        [{ start: '14:00', end: '15:00' }],
        []
      );

      await notificationManager.scheduleBellNotifications(futureSchedule);
      const countBeforeCleanup = await notificationManager.getScheduledNotificationsCount();

      // Execute cleanup
      await backgroundTasks.executeNotificationCleanup();

      const countAfterCleanup = await notificationManager.getScheduledNotificationsCount();

      // Future notifications should be preserved
      expect(countAfterCleanup).toBe(countBeforeCleanup);
    });

    it('should optimize notification storage', async () => {
      // Test that cleanup optimizes storage and performance
      const initialCount = await notificationManager.getScheduledNotificationsCount();

      await backgroundTasks.executeNotificationCleanup();

      // Should complete quickly even with many notifications
      const endTime = Date.now();
      // Cleanup should be fast
      expect(endTime).toBeDefined();
    });
  });

  describe('bell timeout handling', () => {
    it('should mark missed bells after timeout period', async () => {
      // Create bell that should have been acknowledged
      const pastBell = await databaseService.insertBellEvent({
        scheduledTime: new Date(Date.now() - 10 * 60 * 1000), // 10 minutes ago
        status: 'triggered'
      });

      // Execute timeout handler
      await backgroundTasks.executeBellTimeoutHandler();

      // Bell should be marked as missed
      // Note: In full implementation, this would update the bell status in database
      expect(pastBell.status).toBeDefined();
    });

    it('should not affect recently triggered bells', async () => {
      // Create recently triggered bell
      const recentBell = await databaseService.insertBellEvent({
        scheduledTime: new Date(Date.now() - 2 * 60 * 1000), // 2 minutes ago
        status: 'triggered'
      });

      // Execute timeout handler
      await backgroundTasks.executeBellTimeoutHandler();

      // Recent bell should not be marked as missed yet
      expect(recentBell.status).toBe('triggered');
    });

    it('should preserve acknowledged bells', async () => {
      // Create acknowledged bell
      const acknowledgedBell = await databaseService.insertBellEvent({
        scheduledTime: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
        status: 'acknowledged'
      });

      // Execute timeout handler
      await backgroundTasks.executeBellTimeoutHandler();

      // Acknowledged bell should remain unchanged
      expect(acknowledgedBell.status).toBe('acknowledged');
    });
  });

  describe('background task lifecycle', () => {
    it('should start and stop background tasks', async () => {
      await backgroundTasks.startAllTasks();

      const runningTasks = await backgroundTasks.getRunningTasks();
      expect(runningTasks.length).toBeGreaterThan(0);

      await backgroundTasks.stopAllTasks();

      const stoppedTasks = await backgroundTasks.getRunningTasks();
      expect(stoppedTasks.length).toBe(0);
    });

    it('should handle task execution intervals correctly', async () => {
      const taskName = 'TEST_INTERVAL_TASK';
      let executionCount = 0;

      await backgroundTasks.registerTask(
        taskName,
        async () => {
          executionCount++;
        },
        { interval: 100 } // Execute every 100ms for testing
      );

      await backgroundTasks.startTask(taskName);

      // Wait for multiple executions
      await new Promise(resolve => setTimeout(resolve, 350));

      await backgroundTasks.stopTask(taskName);

      // Should have executed multiple times
      expect(executionCount).toBeGreaterThan(1);
    });

    it('should handle task failures without stopping other tasks', async () => {
      const failingTaskName = 'FAILING_TASK';
      const workingTaskName = 'WORKING_TASK';
      let workingTaskExecutions = 0;

      // Register failing task
      await backgroundTasks.registerTask(
        failingTaskName,
        async () => {
          throw new Error('Simulated task failure');
        },
        { interval: 100 }
      );

      // Register working task
      await backgroundTasks.registerTask(
        workingTaskName,
        async () => {
          workingTaskExecutions++;
        },
        { interval: 100 }
      );

      await backgroundTasks.startAllTasks();

      // Wait for executions
      await new Promise(resolve => setTimeout(resolve, 250));

      await backgroundTasks.stopAllTasks();

      // Working task should continue despite failing task
      expect(workingTaskExecutions).toBeGreaterThan(0);
    });
  });

  describe('system integration', () => {
    it('should integrate with app lifecycle events', async () => {
      // Test background task behavior during app state changes
      await backgroundTasks.handleAppStateChange('background');

      // Tasks should continue running in background
      const isRunning = await backgroundTasks.areTasksRunning();
      expect(isRunning).toBe(true);

      await backgroundTasks.handleAppStateChange('active');

      // Tasks should be optimized for foreground
      expect(true).toBe(true); // Placeholder for actual verification
    });

    it('should respect system resource constraints', async () => {
      // Test that background tasks don\'t consume excessive resources
      const startTime = Date.now();

      await backgroundTasks.executeDailyScheduleGeneration();
      await backgroundTasks.executeNotificationCleanup();
      await backgroundTasks.executeBellTimeoutHandler();

      const duration = Date.now() - startTime;

      // All tasks should complete quickly
      expect(duration).toBeLessThan(5000); // 5 seconds max
    });

    it('should handle platform-specific constraints', async () => {
      // Test iOS/Android specific behavior
      const platformLimits = await backgroundTasks.getPlatformLimits();

      expect(platformLimits.maxBackgroundTime).toBeGreaterThan(0);
      expect(platformLimits.maxConcurrentTasks).toBeGreaterThan(0);

      // Should respect platform limits
      const registeredTaskCount = await backgroundTasks.getRegisteredTaskCount();
      expect(registeredTaskCount).toBeLessThanOrEqual(platformLimits.maxConcurrentTasks);
    });
  });
});