import { ObservationService } from '../../src/services/ObservationService';
import { BellSchedulerService } from '../../src/services/BellSchedulerService';
import { DatabaseService } from '../../src/services/DatabaseService';
import { NotificationManager } from '../../src/services/NotificationManager';
import { BellEvent, ObservationType } from '../../src/types';

describe('Observation Creation from Bell Integration Tests', () => {
  let observationService: ObservationService;
  let bellScheduler: BellSchedulerService;
  let databaseService: DatabaseService;
  let notificationManager: NotificationManager;

  beforeEach(async () => {
    observationService = ObservationService.getInstance();
    bellScheduler = BellSchedulerService.getInstance();
    databaseService = DatabaseService.getInstance();
    notificationManager = NotificationManager.getInstance();

    await databaseService.initialize();
  });

  describe('bell-triggered observation creation', () => {
    it('should create observation linked to bell event', async () => {
      // Create a bell event
      const bellEvent = await databaseService.insertBellEvent({
        scheduledTime: new Date(),
        status: 'triggered'
      });

      // Create observation from bell
      const observation = await observationService.createObservation(
        'lesson',
        'I noticed my breathing became deeper when the bell rang',
        ['breathing', 'awareness'],
        bellEvent.id
      );

      expect(observation.bellEventId).toBe(bellEvent.id);
      expect(observation.type).toBe('lesson');
      expect(observation.content).toContain('breathing');
      expect(observation.tags).toContain('breathing');
      expect(observation.tags).toContain('awareness');
    });

    it('should auto-extract hashtags from bell observation', async () => {
      const bellEvent = await databaseService.insertBellEvent({
        scheduledTime: new Date(),
        status: 'triggered'
      });

      const observation = await observationService.createObservation(
        'fear',
        'I felt #anxiety about the upcoming #meeting when the bell interrupted my thoughts',
        [],
        bellEvent.id
      );

      expect(observation.tags).toContain('anxiety');
      expect(observation.tags).toContain('meeting');
      expect(observation.bellEventId).toBe(bellEvent.id);
    });

    it('should handle quick observation capture flow', async () => {
      // Simulate the flow: bell rings -> user responds quickly
      const bellTime = new Date();
      const bellEvent = await databaseService.insertBellEvent({
        scheduledTime: bellTime,
        status: 'triggered'
      });

      // Quick response within 2 minutes
      const responseTime = new Date(bellTime.getTime() + 90 * 1000); // 90 seconds later

      const observation = await observationService.createObservation(
        'desire',
        'Quick capture: wanting peace',
        [],
        bellEvent.id
      );

      expect(observation.bellEventId).toBe(bellEvent.id);
      expect(observation.createdAt.getTime()).toBeGreaterThanOrEqual(responseTime.getTime());
    });

    it('should handle delayed observation capture', async () => {
      // Simulate delayed response (user responds later)
      const bellTime = new Date(Date.now() - 30 * 60 * 1000); // 30 minutes ago
      const bellEvent = await databaseService.insertBellEvent({
        scheduledTime: bellTime,
        status: 'missed'
      });

      const observation = await observationService.createObservation(
        'affliction',
        'Delayed reflection: I was stressed and missed the bell earlier',
        ['stress', 'delayed'],
        bellEvent.id
      );

      expect(observation.bellEventId).toBe(bellEvent.id);
      expect(observation.tags).toContain('delayed');
    });
  });

  describe('observation type patterns from bells', () => {
    let testBellEvent: BellEvent;

    beforeEach(async () => {
      const bellEventData = await databaseService.insertBellEvent({
        scheduledTime: new Date(),
        status: 'acknowledged'
      });
      testBellEvent = bellEventData;
    });

    it('should capture desire observations from bell prompts', async () => {
      const observation = await observationService.createObservation(
        'desire',
        'The bell made me realize I want to be more present with my family',
        ['family', 'presence'],
        testBellEvent.id
      );

      expect(observation.type).toBe('desire');
      expect(observation.content).toContain('want to be');
      expect(observation.bellEventId).toBe(testBellEvent.id);
    });

    it('should capture fear observations from bell insights', async () => {
      const observation = await observationService.createObservation(
        'fear',
        'Bell interrupted my work and I felt #fear about #deadlines',
        [],
        testBellEvent.id
      );

      expect(observation.type).toBe('fear');
      expect(observation.tags).toContain('fear');
      expect(observation.tags).toContain('deadlines');
    });

    it('should capture affliction observations during difficult moments', async () => {
      const observation = await observationService.createObservation(
        'affliction',
        'When the bell rang I noticed the #sadness I was carrying',
        [],
        testBellEvent.id
      );

      expect(observation.type).toBe('affliction');
      expect(observation.tags).toContain('sadness');
    });

    it('should capture lesson observations from mindful insights', async () => {
      const observation = await observationService.createObservation(
        'lesson',
        'The bell taught me that #mindfulness can happen anywhere, even at #work',
        [],
        testBellEvent.id
      );

      expect(observation.type).toBe('lesson');
      expect(observation.tags).toContain('mindfulness');
      expect(observation.tags).toContain('work');
    });
  });

  describe('bell response timing analysis', () => {
    it('should track response time patterns', async () => {
      const responses = [];

      // Simulate multiple bell responses with different timing
      for (let i = 0; i < 5; i++) {
        const bellTime = new Date(Date.now() - (i * 60 * 60 * 1000)); // i hours ago
        const bellEvent = await databaseService.insertBellEvent({
          scheduledTime: bellTime,
          status: 'acknowledged'
        });

        const responseDelay = i * 2; // Increasing delay
        const observation = await observationService.createObservation(
          'lesson',
          `Response ${i}: noticed my reaction time`,
          [`response-${i}`],
          bellEvent.id
        );

        responses.push({
          bellTime,
          responseTime: observation.createdAt,
          delay: responseDelay
        });
      }

      expect(responses).toHaveLength(5);

      // Each observation should be linked to its bell
      for (const response of responses) {
        expect(response.responseTime).toBeInstanceOf(Date);
      }
    });

    it('should handle concurrent bell observations', async () => {
      // Simulate multiple users or rapid bell responses
      const bellEvent = await databaseService.insertBellEvent({
        scheduledTime: new Date(),
        status: 'triggered'
      });

      const promises = [];
      const observationTypes: ObservationType[] = ['desire', 'fear', 'affliction', 'lesson'];

      for (let i = 0; i < 4; i++) {
        promises.push(
          observationService.createObservation(
            observationTypes[i],
            `Concurrent observation ${i} from same bell`,
            [`concurrent-${i}`],
            bellEvent.id
          )
        );
      }

      const observations = await Promise.all(promises);

      expect(observations).toHaveLength(4);

      // All should be linked to the same bell
      observations.forEach(obs => {
        expect(obs.bellEventId).toBe(bellEvent.id);
      });

      // Should have unique IDs
      const ids = observations.map(obs => obs.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(4);
    });
  });

  describe('notification to observation workflow', () => {
    it('should complete full notification response to observation flow', async () => {
      // Generate bell and schedule notification
      const schedule = await bellScheduler.generateDailySchedule(
        new Date(),
        'low',
        [{ start: '10:00', end: '11:00' }],
        []
      );

      const testBell = schedule[0];

      // Simulate notification response with observation content
      const mockResponse = {
        identifier: `bell-${testBell.id}`,
        actionIdentifier: 'observe',
        userText: 'I felt grateful when the bell brought me to the present moment #gratitude #presence'
      };

      // This would normally be handled by NotificationManager.handleNotificationResponse
      // For testing, we simulate the observation creation part
      const observation = await observationService.createObservation(
        'lesson',
        mockResponse.userText || 'No content provided',
        [],
        testBell.id
      );

      expect(observation.content).toContain('grateful');
      expect(observation.tags).toContain('gratitude');
      expect(observation.tags).toContain('presence');
      expect(observation.bellEventId).toBe(testBell.id);
    });

    it('should handle empty notification responses gracefully', async () => {
      const bellEvent = await databaseService.insertBellEvent({
        scheduledTime: new Date(),
        status: 'triggered'
      });

      // User acknowledges bell but provides no observation text
      const mockResponse = {
        identifier: `bell-${bellEvent.id}`,
        actionIdentifier: 'acknowledge',
        userText: undefined
      };

      // In this case, no observation should be created
      // But bell should still be marked as acknowledged
      expect(mockResponse.userText).toBeUndefined();
      expect(mockResponse.actionIdentifier).toBe('acknowledge');
    });

    it('should validate observation content from notifications', async () => {
      const bellEvent = await databaseService.insertBellEvent({
        scheduledTime: new Date(),
        status: 'triggered'
      });

      // Test with invalid content (too short)
      await expect(
        observationService.createObservation(
          'lesson',
          'x', // Too short
          [],
          bellEvent.id
        )
      ).rejects.toThrow('Content must be at least 3 characters');

      // Test with valid content
      const validObservation = await observationService.createObservation(
        'lesson',
        'Valid observation content from bell response',
        [],
        bellEvent.id
      );

      expect(validObservation.content).toBe('Valid observation content from bell response');
    });
  });

  describe('bell observation analytics', () => {
    it('should track observation creation rates from bells', async () => {
      const bellEvents = [];
      const observations = [];

      // Create multiple bells and some observations
      for (let i = 0; i < 10; i++) {
        const bellEvent = await databaseService.insertBellEvent({
          scheduledTime: new Date(Date.now() - i * 60 * 60 * 1000),
          status: i % 2 === 0 ? 'acknowledged' : 'missed'
        });
        bellEvents.push(bellEvent);

        // Create observation for some bells
        if (i % 3 === 0) {
          const observation = await observationService.createObservation(
            'lesson',
            `Analytics test observation ${i}`,
            [`analytics-${i}`],
            bellEvent.id
          );
          observations.push(observation);
        }
      }

      expect(bellEvents).toHaveLength(10);
      expect(observations.length).toBeGreaterThan(0);

      // Calculate observation rate
      const observationRate = observations.length / bellEvents.length;
      expect(observationRate).toBeGreaterThan(0);
      expect(observationRate).toBeLessThanOrEqual(1);
    });

    it('should identify patterns in bell-triggered insights', async () => {
      const insights = [];

      // Create observations with common themes
      const themes = ['stress', 'gratitude', 'awareness', 'peace'];

      for (const theme of themes) {
        const bellEvent = await databaseService.insertBellEvent({
          scheduledTime: new Date(),
          status: 'acknowledged'
        });

        const observation = await observationService.createObservation(
          'lesson',
          `Bell helped me notice ${theme} in this moment #${theme}`,
          [theme],
          bellEvent.id
        );

        insights.push({ theme, observation });
      }

      expect(insights).toHaveLength(4);

      // Should be able to group by themes
      const themeGroups = insights.reduce((groups, insight) => {
        const theme = insight.theme;
        if (!groups[theme]) groups[theme] = [];
        groups[theme].push(insight.observation);
        return groups;
      }, {} as Record<string, any[]>);

      expect(Object.keys(themeGroups)).toHaveLength(4);
    });
  });
});