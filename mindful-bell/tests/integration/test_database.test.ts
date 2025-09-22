import { DatabaseService } from '../../src/services/DatabaseService';
import { BellSchedulerService } from '../../src/services/BellSchedulerService';
import { ObservationService } from '../../src/services/ObservationService';
import { SettingsService } from '../../src/services/SettingsService';

describe.skip('Database Integration Tests', () => {
  let databaseService: DatabaseService;
  let bellScheduler: BellSchedulerService;
  let observationService: ObservationService;
  let settingsService: SettingsService;

  beforeEach(() => {
    databaseService = DatabaseService.getInstance();
    bellScheduler = BellSchedulerService.getInstance();
    observationService = ObservationService.getInstance();
    settingsService = SettingsService.getInstance();
  });

  describe('database initialization', () => {
    it('should initialize database and create tables', async () => {
      await databaseService.initialize();

      // Database should be accessible
      const db = databaseService.getDatabase();
      expect(db).toBeDefined();
    });

    it('should create default settings on first run', async () => {
      await databaseService.initialize();

      const settings = await databaseService.getSettings();

      expect(settings).toBeDefined();
      expect(settings.id).toBe('default');
      expect(settings.activeWindows).toBeDefined();
      expect(settings.quietHours).toBeDefined();
      expect(settings.bellDensity).toBe('medium');
      expect(settings.soundEnabled).toBe(true);
      expect(settings.vibrationEnabled).toBe(true);
    });

    it('should handle migration scenarios', async () => {
      await databaseService.initialize();

      // Should not throw on subsequent initializations
      await expect(databaseService.initialize()).resolves.not.toThrow();
    });
  });

  describe('cross-service integration', () => {
    beforeEach(async () => {
      await databaseService.initialize();
    });

    it('should create observation and link to bell event', async () => {
      // Create a bell event
      const bellEvent = await databaseService.insertBellEvent({
        scheduledTime: new Date(),
        status: 'scheduled'
      });

      // Create observation linked to bell event
      const observation = await observationService.createObservation(
        'lesson',
        'Integration test observation',
        ['test'],
        bellEvent.id
      );

      expect(observation.bellEventId).toBe(bellEvent.id);
    });

    it('should generate schedule based on settings', async () => {
      const settings = await settingsService.getSettings();

      const schedule = await bellScheduler.generateDailySchedule(
        new Date(),
        settings.bellDensity,
        settings.activeWindows,
        settings.quietHours
      );

      expect(schedule).toBeDefined();
      expect(Array.isArray(schedule)).toBe(true);

      // Should respect bell density settings
      if (settings.bellDensity === 'medium') {
        expect(schedule.length).toBeLessThanOrEqual(8);
      }
    });

    it('should maintain data consistency across services', async () => {
      // Update settings
      const updatedSettings = await settingsService.updateBellDensity('high');
      expect(updatedSettings.bellDensity).toBe('high');

      // Settings should be reflected in database
      const dbSettings = await databaseService.getSettings();
      expect(dbSettings.bellDensity).toBe('high');

      // Should affect schedule generation
      const schedule = await bellScheduler.generateDailySchedule(
        new Date(),
        dbSettings.bellDensity,
        dbSettings.activeWindows,
        dbSettings.quietHours
      );

      // High density should generate more bells
      expect(schedule.length).toBeGreaterThan(8);
    });
  });

  describe('data persistence', () => {
    beforeEach(async () => {
      await databaseService.initialize();
    });

    it('should persist observations across sessions', async () => {
      const observation = await observationService.createObservation(
        'fear',
        'Persistent test observation',
        ['persistence', 'test']
      );

      // Retrieve observation
      const retrieved = await observationService.getObservationById(observation.id);

      expect(retrieved.id).toBe(observation.id);
      expect(retrieved.content).toBe('Persistent test observation');
      expect(retrieved.tags).toEqual(['persistence', 'test']);
    });

    it('should handle concurrent operations', async () => {
      const promises = [];

      // Create multiple observations concurrently
      for (let i = 0; i < 5; i++) {
        promises.push(
          observationService.createObservation(
            'lesson',
            `Concurrent observation ${i}`,
            [`test-${i}`]
          )
        );
      }

      const observations = await Promise.all(promises);

      expect(observations).toHaveLength(5);

      // All should have unique IDs
      const ids = observations.map(obs => obs.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(5);
    });
  });

  describe('error handling', () => {
    beforeEach(async () => {
      await databaseService.initialize();
    });

    it('should handle invalid observation data', async () => {
      await expect(
        observationService.createObservation(
          'invalid-type' as any,
          'Test content',
          []
        )
      ).rejects.toThrow();
    });

    it('should handle missing observations gracefully', async () => {
      await expect(
        observationService.getObservationById('non-existent-id')
      ).rejects.toThrow('Observation not found');
    });

    it('should validate settings updates', async () => {
      await expect(
        settingsService.updateActiveWindows([
          { start: '17:00', end: '09:00' } // Invalid: end before start
        ])
      ).rejects.toThrow();
    });
  });

  describe('performance requirements', () => {
    beforeEach(async () => {
      await databaseService.initialize();
    });

    it('should initialize database quickly', async () => {
      const startTime = Date.now();
      await databaseService.initialize();
      const duration = Date.now() - startTime;

      // Should initialize within 2 seconds
      expect(duration).toBeLessThan(2000);
    });

    it('should perform local operations quickly', async () => {
      const startTime = Date.now();

      await observationService.createObservation(
        'lesson',
        'Performance test observation',
        ['performance']
      );

      const duration = Date.now() - startTime;

      // Should complete within 200ms
      expect(duration).toBeLessThan(200);
    });

    it('should handle large datasets efficiently', async () => {
      // Create multiple observations
      const promises = [];
      for (let i = 0; i < 20; i++) {
        promises.push(
          observationService.createObservation(
            'lesson',
            `Performance observation ${i}`,
            [`perf-${i}`]
          )
        );
      }

      await Promise.all(promises);

      const startTime = Date.now();
      const result = await observationService.getObservations({ limit: 10 });
      const duration = Date.now() - startTime;

      expect(result.observations).toHaveLength(10);
      expect(duration).toBeLessThan(200);
    });
  });
});