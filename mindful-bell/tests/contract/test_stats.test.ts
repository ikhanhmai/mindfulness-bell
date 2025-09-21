import { StatsService } from '../../src/services/StatsService';
import { Stats } from '../../src/types';

describe('StatsService Contract Tests', () => {
  let statsService: StatsService;

  beforeEach(() => {
    statsService = new StatsService();
  });

  describe('getStats', () => {
    it('should return daily statistics', async () => {
      const stats = await statsService.getStats('day');

      expect(stats).toBeDefined();
      expect(stats.period).toBe('day');
      expect(typeof stats.bellsScheduled).toBe('number');
      expect(typeof stats.bellsAcknowledged).toBe('number');
      expect(typeof stats.acknowledgeRate).toBe('number');
      expect(typeof stats.entriesCreated).toBe('number');
      expect(stats.entriesByType).toBeDefined();
      expect(typeof stats.entriesByType.desire).toBe('number');
      expect(typeof stats.entriesByType.fear).toBe('number');
      expect(typeof stats.entriesByType.affliction).toBe('number');
      expect(typeof stats.entriesByType.lesson).toBe('number');
    });

    it('should calculate acknowledge rate correctly', async () => {
      const stats = await statsService.getStats('week');

      expect(stats.acknowledgeRate).toBeGreaterThanOrEqual(0);
      expect(stats.acknowledgeRate).toBeLessThanOrEqual(1);

      if (stats.bellsScheduled > 0) {
        const expectedRate = stats.bellsAcknowledged / stats.bellsScheduled;
        expect(stats.acknowledgeRate).toBeCloseTo(expectedRate, 2);
      }
    });

    it('should return month statistics', async () => {
      const stats = await statsService.getStats('month');

      expect(stats.period).toBe('month');
      expect(stats.bellsScheduled).toBeGreaterThanOrEqual(0);
      expect(stats.bellsAcknowledged).toBeGreaterThanOrEqual(0);
      expect(stats.entriesCreated).toBeGreaterThanOrEqual(0);
    });
  });

  describe('getBellStats', () => {
    it('should return bell-specific statistics', async () => {
      const bellStats = await statsService.getBellStats('week');

      expect(bellStats).toBeDefined();
      expect(bellStats.totalScheduled).toBeGreaterThanOrEqual(0);
      expect(bellStats.totalAcknowledged).toBeGreaterThanOrEqual(0);
      expect(bellStats.totalMissed).toBeGreaterThanOrEqual(0);
      expect(bellStats.averageResponseTime).toBeGreaterThanOrEqual(0);
    });

    it('should track bell timing accuracy', async () => {
      const bellStats = await statsService.getBellStats('day');

      expect(bellStats.timingAccuracy).toBeDefined();
      expect(bellStats.timingAccuracy.averageDelay).toBeGreaterThanOrEqual(0);
      expect(bellStats.timingAccuracy.maxDelay).toBeGreaterThanOrEqual(0);
    });
  });

  describe('getObservationStats', () => {
    it('should return observation creation trends', async () => {
      const obsStats = await statsService.getObservationStats('month');

      expect(obsStats).toBeDefined();
      expect(obsStats.totalObservations).toBeGreaterThanOrEqual(0);
      expect(obsStats.observationsByType).toBeDefined();
      expect(obsStats.dailyAverage).toBeGreaterThanOrEqual(0);
    });

    it('should identify most common observation types', async () => {
      const obsStats = await statsService.getObservationStats('week');

      const types = ['desire', 'fear', 'affliction', 'lesson'];
      types.forEach(type => {
        expect(obsStats.observationsByType[type]).toBeGreaterThanOrEqual(0);
      });
    });
  });

  describe('getProgressIndicators', () => {
    it('should calculate practice consistency', async () => {
      const progress = await statsService.getProgressIndicators();

      expect(progress).toBeDefined();
      expect(progress.practiceStreak).toBeGreaterThanOrEqual(0);
      expect(progress.consistencyScore).toBeGreaterThanOrEqual(0);
      expect(progress.consistencyScore).toBeLessThanOrEqual(1);
      expect(progress.improvementTrend).toBeDefined();
    });

    it('should track mindfulness growth metrics', async () => {
      const progress = await statsService.getProgressIndicators();

      expect(progress.mindfulnessScore).toBeGreaterThanOrEqual(0);
      expect(progress.mindfulnessScore).toBeLessThanOrEqual(1);
      expect(progress.weeklyGrowth).toBeDefined();
    });
  });
});