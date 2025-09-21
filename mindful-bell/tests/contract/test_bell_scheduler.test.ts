import { BellSchedulerService } from '../../src/services/BellSchedulerService';
import { BellDensity, TimeWindow } from '../../src/types';

describe('BellSchedulerService Contract Tests', () => {
  let bellScheduler: BellSchedulerService;

  beforeEach(() => {
    bellScheduler = new BellSchedulerService();
  });

  describe('generateDailySchedule', () => {
    it('should generate schedule for given date and density', async () => {
      const date = new Date('2025-01-15');
      const density: BellDensity = 'medium';
      const activeWindows: TimeWindow[] = [
        { start: '09:00', end: '17:00' }
      ];
      const quietHours: TimeWindow[] = [];

      const schedule = await bellScheduler.generateDailySchedule(
        date,
        density,
        activeWindows,
        quietHours
      );

      expect(schedule).toBeDefined();
      expect(Array.isArray(schedule)).toBe(true);
      expect(schedule.length).toBeGreaterThan(0);
      expect(schedule.length).toBeLessThanOrEqual(12); // Max for medium density
    });

    it('should respect active windows constraint', async () => {
      const date = new Date('2025-01-15');
      const activeWindows: TimeWindow[] = [
        { start: '09:00', end: '12:00' },
        { start: '14:00', end: '17:00' }
      ];

      const schedule = await bellScheduler.generateDailySchedule(
        date,
        'high',
        activeWindows,
        []
      );

      schedule.forEach(bellEvent => {
        const time = bellEvent.scheduledTime.toTimeString().slice(0, 5);
        const withinWindow = activeWindows.some(window =>
          time >= window.start && time <= window.end
        );
        expect(withinWindow).toBe(true);
      });
    });

    it('should exclude quiet hours', async () => {
      const date = new Date('2025-01-15');
      const activeWindows: TimeWindow[] = [
        { start: '08:00', end: '18:00' }
      ];
      const quietHours: TimeWindow[] = [
        { start: '12:00', end: '13:00' }
      ];

      const schedule = await bellScheduler.generateDailySchedule(
        date,
        'medium',
        activeWindows,
        quietHours
      );

      schedule.forEach(bellEvent => {
        const time = bellEvent.scheduledTime.toTimeString().slice(0, 5);
        const inQuietHours = quietHours.some(window =>
          time >= window.start && time <= window.end
        );
        expect(inQuietHours).toBe(false);
      });
    });

    it('should enforce minimum interval between bells', async () => {
      const date = new Date('2025-01-15');
      const activeWindows: TimeWindow[] = [
        { start: '09:00', end: '17:00' }
      ];

      const schedule = await bellScheduler.generateDailySchedule(
        date,
        'high',
        activeWindows,
        []
      );

      // Sort by time to check intervals
      const sortedSchedule = schedule.sort((a, b) =>
        a.scheduledTime.getTime() - b.scheduledTime.getTime()
      );

      for (let i = 1; i < sortedSchedule.length; i++) {
        const prevTime = sortedSchedule[i - 1].scheduledTime;
        const currentTime = sortedSchedule[i].scheduledTime;
        const intervalMinutes = (currentTime.getTime() - prevTime.getTime()) / (1000 * 60);

        expect(intervalMinutes).toBeGreaterThanOrEqual(45); // Minimum 45 minutes
      }
    });
  });

  describe('validateScheduleParams', () => {
    it('should validate correct parameters', async () => {
      const params = {
        density: 'medium' as BellDensity,
        activeWindows: [{ start: '09:00', end: '17:00' }],
        quietHours: [],
        minimumInterval: 45
      };

      const result = await bellScheduler.validateScheduleParams(params);

      expect(result.valid).toBe(true);
      expect(result.estimatedBellsPerDay).toBeGreaterThan(0);
      expect(result.availableMinutesPerDay).toBeGreaterThan(0);
    });

    it('should detect invalid time windows', async () => {
      const params = {
        density: 'medium' as BellDensity,
        activeWindows: [{ start: '17:00', end: '09:00' }], // Invalid: end before start
        quietHours: [],
        minimumInterval: 45
      };

      const result = await bellScheduler.validateScheduleParams(params);

      expect(result.valid).toBe(false);
      expect(result.warnings).toContain('Invalid time window: end time before start time');
    });
  });
});