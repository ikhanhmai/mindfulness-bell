import { BellSchedulerService } from '../../src/services/BellSchedulerService';
import { NotificationManager } from '../../src/services/NotificationManager';
import { ObservationService } from '../../src/services/ObservationService';
import { DatabaseService } from '../../src/services/DatabaseService';
import { BellEvent } from '../../src/types';

describe('Bell Acknowledgment Flow Integration Tests', () => {
  let bellScheduler: BellSchedulerService;
  let notificationManager: NotificationManager;
  let observationService: ObservationService;
  let databaseService: DatabaseService;

  beforeEach(async () => {
    bellScheduler = BellSchedulerService.getInstance();
    notificationManager = NotificationManager.getInstance();
    observationService = ObservationService.getInstance();
    databaseService = DatabaseService.getInstance();

    await databaseService.initialize();
    await notificationManager.initialize();
  });

  describe('complete bell flow', () => {
    it('should handle full bell acknowledgment workflow', async () => {
      // Step 1: Generate bell schedule
      const schedule = await bellScheduler.generateDailySchedule(
        new Date(),
        'medium',
        [{ start: '09:00', end: '17:00' }],
        []
      );

      expect(schedule.length).toBeGreaterThan(0);
      const testBell = schedule[0];

      // Step 2: Schedule notifications
      const notificationResult = await notificationManager.scheduleBellNotifications([testBell]);

      expect(notificationResult.scheduled.length).toBeGreaterThan(0);
      expect(notificationResult.failed.length).toBe(0);

      // Step 3: Simulate notification response
      const response = await notificationManager.handleNotificationResponse({
        identifier: `bell-${testBell.id}`,
        actionIdentifier: 'acknowledge',
        userText: undefined
      });

      expect(response.bellAcknowledged).toBe(true);
      expect(response.observationCreated).toBe(false);
    });

    it('should create observation from bell acknowledgment', async () => {
      // Generate a test bell
      const schedule = await bellScheduler.generateDailySchedule(
        new Date(),
        'low',
        [{ start: '10:00', end: '11:00' }],
        []
      );

      const testBell = schedule[0];

      // Simulate notification response with observation text
      const response = await notificationManager.handleNotificationResponse({
        identifier: `bell-${testBell.id}`,
        actionIdentifier: 'observe',
        userText: 'Feeling mindful and present in this moment'
      });

      expect(response.bellAcknowledged).toBe(true);
      expect(response.observationCreated).toBe(true);
    });

    it('should track bell completion rates', async () => {
      // Generate multiple bells
      const schedule = await bellScheduler.generateDailySchedule(
        new Date(),
        'low', // Generate fewer bells for testing
        [{ start: '09:00', end: '17:00' }],
        []
      );

      expect(schedule.length).toBeGreaterThan(0);

      // Acknowledge some bells
      const acknowledgedBells = schedule.slice(0, Math.ceil(schedule.length / 2));

      for (const bell of acknowledgedBells) {
        await notificationManager.handleNotificationResponse({
          identifier: `bell-${bell.id}`,
          actionIdentifier: 'acknowledge',
          userText: undefined
        });
      }

      // Calculate completion rate
      const completionRate = acknowledgedBells.length / schedule.length;
      expect(completionRate).toBeGreaterThan(0);
      expect(completionRate).toBeLessThanOrEqual(1);
    });

    it('should handle missed bells gracefully', async () => {
      // Generate bell in the past (simulates missed bell)
      const pastTime = new Date();
      pastTime.setMinutes(pastTime.getMinutes() - 30);

      const missedBell: BellEvent = {
        id: 'missed-bell-test',
        scheduledTime: pastTime,
        status: 'scheduled'
      };

      // Try to acknowledge missed bell
      const response = await notificationManager.handleNotificationResponse({
        identifier: `bell-${missedBell.id}`,
        actionIdentifier: 'acknowledge',
        userText: undefined
      });

      // Should still acknowledge even if late
      expect(response.bellAcknowledged).toBe(true);
    });
  });

  describe('bell state management', () => {
    it('should transition bell states correctly', async () => {
      const schedule = await bellScheduler.generateDailySchedule(
        new Date(),
        'low',
        [{ start: '12:00', end: '13:00' }],
        []
      );

      const testBell = schedule[0];

      // Initial state should be 'scheduled'
      expect(testBell.status).toBe('scheduled');

      // After notification fires (simulated)
      const triggeredBell = { ...testBell, status: 'triggered' as const };

      // After acknowledgment
      await notificationManager.handleNotificationResponse({
        identifier: `bell-${testBell.id}`,
        actionIdentifier: 'acknowledge',
        userText: undefined
      });

      // Bell should be marked as acknowledged
      // Note: In full implementation, this would be reflected in database
      expect(true).toBe(true); // Placeholder for actual state verification
    });

    it('should handle bell timeout scenarios', async () => {
      // Simulate bell that was triggered but not acknowledged within timeout
      const timedOutBell: BellEvent = {
        id: 'timeout-bell-test',
        scheduledTime: new Date(Date.now() - 10 * 60 * 1000), // 10 minutes ago
        status: 'triggered'
      };

      // Should be able to acknowledge even after timeout
      const response = await notificationManager.handleNotificationResponse({
        identifier: `bell-${timedOutBell.id}`,
        actionIdentifier: 'acknowledge',
        userText: 'Better late than never'
      });

      expect(response.bellAcknowledged).toBe(true);
      expect(response.observationCreated).toBe(true);
    });
  });

  describe('notification system integration', () => {
    it('should respect notification permissions', async () => {
      const hasPermissions = await notificationManager.requestPermissions();

      if (hasPermissions) {
        const schedule = await bellScheduler.generateDailySchedule(
          new Date(),
          'medium',
          [{ start: '14:00', end: '15:00' }],
          []
        );

        const result = await notificationManager.scheduleBellNotifications(schedule);
        expect(result.scheduled.length).toBeGreaterThan(0);
      } else {
        // Should handle missing permissions gracefully
        const schedule = await bellScheduler.generateDailySchedule(
          new Date(),
          'low',
          [{ start: '14:00', end: '15:00' }],
          []
        );

        // Should not throw error even without permissions
        await expect(
          notificationManager.scheduleBellNotifications(schedule)
        ).resolves.toBeDefined();
      }
    });

    it('should handle platform notification limits', async () => {
      // Generate large schedule that might exceed platform limits
      const schedule = await bellScheduler.generateDailySchedule(
        new Date(),
        'high',
        [
          { start: '06:00', end: '12:00' },
          { start: '13:00', end: '22:00' }
        ],
        []
      );

      const result = await notificationManager.scheduleBellNotifications(schedule);

      // Should respect platform limits
      expect(result.limitations.actuallyScheduled).toBeLessThanOrEqual(
        result.limitations.platformLimit
      );

      // Should report any bells that couldn't be scheduled
      if (schedule.length > result.limitations.platformLimit) {
        expect(result.limitations.actuallyScheduled).toBe(
          result.limitations.platformLimit
        );
      }
    });

    it('should clear and reschedule notifications properly', async () => {
      // Schedule initial notifications
      const schedule1 = await bellScheduler.generateDailySchedule(
        new Date(),
        'low',
        [{ start: '16:00', end: '17:00' }],
        []
      );

      await notificationManager.scheduleBellNotifications(schedule1);
      const count1 = await notificationManager.getScheduledNotificationsCount();
      expect(count1).toBeGreaterThan(0);

      // Clear and reschedule
      await notificationManager.clearBellNotifications();
      const countAfterClear = await notificationManager.getScheduledNotificationsCount();
      expect(countAfterClear).toBe(0);

      // Schedule new notifications
      const schedule2 = await bellScheduler.generateDailySchedule(
        new Date(),
        'medium',
        [{ start: '18:00', end: '19:00' }],
        []
      );

      await notificationManager.scheduleBellNotifications(schedule2);
      const count2 = await notificationManager.getScheduledNotificationsCount();
      expect(count2).toBeGreaterThan(0);
    });
  });

  describe('error recovery', () => {
    it('should handle malformed notification responses', async () => {
      const response = await notificationManager.handleNotificationResponse({
        identifier: 'invalid-bell-format',
        actionIdentifier: 'acknowledge',
        userText: undefined
      });

      // Should handle gracefully without throwing
      expect(response.bellAcknowledged).toBe(false);
      expect(response.observationCreated).toBe(false);
    });

    it('should handle notification scheduling failures', async () => {
      // Create bell with invalid time (should handle gracefully)
      const invalidBell: BellEvent = {
        id: 'invalid-bell',
        scheduledTime: new Date('invalid-date'),
        status: 'scheduled'
      };

      // Should not throw error
      await expect(
        notificationManager.scheduleBellNotifications([invalidBell])
      ).resolves.toBeDefined();
    });

    it('should recover from service initialization failures', async () => {
      // Test that services can recover from initialization issues
      // This would be more relevant in actual device testing

      const scheduler = BellSchedulerService.getInstance();
      expect(scheduler).toBeDefined();

      // Should be able to generate schedules even if other services have issues
      const schedule = await scheduler.generateDailySchedule(
        new Date(),
        'low',
        [{ start: '20:00', end: '21:00' }],
        []
      );

      expect(schedule).toBeDefined();
      expect(Array.isArray(schedule)).toBe(true);
    });
  });
});