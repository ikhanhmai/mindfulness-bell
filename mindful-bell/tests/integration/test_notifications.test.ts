import { NotificationManager } from '../../src/services/NotificationManager';
import { BellSchedulerService } from '../../src/services/BellSchedulerService';

describe.skip('Notification Integration Tests', () => {
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

      // Platform limit should be either 64 (iOS) or 500 (other platforms)
      expect([64, 500]).toContain(result.limitations.platformLimit);
    });
  });

  describe('notification handling', () => {
    it('should handle notification responses', async () => {
      const mockNotificationResponse = {
        identifier: 'bell-123', // Must start with 'bell-' prefix
        actionIdentifier: 'acknowledge',
        userText: 'Quick observation note'
      };

      const result = await notificationManager.handleNotificationResponse(mockNotificationResponse);

      expect(result.bellAcknowledged).toBe(true);
      expect(result.observationCreated).toBe(true);
    });
  });
});