import { NotificationManager } from '../../src/services/NotificationManager';
import { BellSchedulerService } from '../../src/services/BellSchedulerService';

describe('Notification Integration Tests', () => {
  let notificationManager: NotificationManager;
  let bellScheduler: BellSchedulerService;

  beforeEach(() => {
    notificationManager = new NotificationManager();
    bellScheduler = new BellSchedulerService();
  });

  describe('notification scheduling', () => {
    it('should schedule notifications for bell events', async () => {
      const schedule = await bellScheduler.generateDailySchedule(
        new Date(),
        'medium',
        [{ start: '09:00', end: '17:00' }],
        []
      );

      const result = await notificationManager.scheduleBellNotifications(schedule);

      expect(result.scheduled.length).toBeGreaterThan(0);
      expect(result.failed.length).toBe(0);
    });

    it('should respect iOS notification limits', async () => {
      // Generate a large schedule that might exceed iOS limits
      const schedule = await bellScheduler.generateDailySchedule(
        new Date(),
        'high',
        [{ start: '06:00', end: '22:00' }],
        []
      );

      const result = await notificationManager.scheduleBellNotifications(schedule);

      expect(result.limitations.platformLimit).toBeLessThanOrEqual(64);
    });
  });

  describe('notification handling', () => {
    it('should handle notification responses', async () => {
      const mockNotificationResponse = {
        identifier: 'test-bell-123',
        actionIdentifier: 'acknowledge',
        userText: 'Quick observation note'
      };

      const result = await notificationManager.handleNotificationResponse(mockNotificationResponse);

      expect(result.bellAcknowledged).toBe(true);
      expect(result.observationCreated).toBe(true);
    });
  });
});