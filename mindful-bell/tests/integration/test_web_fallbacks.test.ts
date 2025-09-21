import { Platform } from 'react-native';
import { NotificationManager } from '../../src/services/NotificationManager';
import { DatabaseService } from '../../src/services/DatabaseService';

// Mock Platform to simulate web environment
jest.mock('react-native', () => ({
  Platform: {
    OS: 'web'
  }
}));

// Mock expo-notifications for web environment
jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(() => {
    throw new Error('Notifications.setNotificationHandler is not available on web');
  }),
  getPermissionsAsync: jest.fn(() => {
    throw new Error('Notifications.getPermissionsAsync is not available on web');
  }),
  requestPermissionsAsync: jest.fn(() => {
    throw new Error('Notifications.requestPermissionsAsync is not available on web');
  }),
  scheduleNotificationAsync: jest.fn(() => {
    throw new Error('Notifications.scheduleNotificationAsync is not available on web');
  }),
  getAllScheduledNotificationsAsync: jest.fn(() => {
    throw new Error('Notifications.getAllScheduledNotificationsAsync is not available on web');
  }),
  cancelScheduledNotificationAsync: jest.fn(() => {
    throw new Error('Notifications.cancelScheduledNotificationAsync is not available on web');
  }),
  setNotificationCategoryAsync: jest.fn(() => {
    throw new Error('Notifications.setNotificationCategoryAsync is not available on web');
  })
}));

describe('Web Platform Fallbacks TDD', () => {
  let notificationManager: NotificationManager;
  let databaseService: DatabaseService;

  beforeAll(async () => {
    // Initialize services for web environment
    databaseService = DatabaseService.getInstance();
    await databaseService.initialize();
    
    notificationManager = NotificationManager.getInstance();
  });

  describe('TDD: NotificationManager Web Fallbacks', () => {
    it('should handle initialization failure gracefully on web', async () => {
      // Arrange - NotificationManager on web platform
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      // Act - Try to initialize (should fail gracefully)
      let initializationError: Error | null = null;
      try {
        await notificationManager.initialize();
      } catch (error) {
        initializationError = error as Error;
      }

      // Assert - Should not throw, should handle gracefully
      expect(initializationError).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Notifications not available on web platform')
      );
      
      consoleSpy.mockRestore();
    });

    it('should return false for initialization status on web', async () => {
      // Act - Check initialization status
      const isInitialized = await notificationManager.getInitializationStatus();

      // Assert - Should be false on web
      expect(isInitialized).toBe(false);
    });

    it('should return false for permission requests on web', async () => {
      // Act - Try to request permissions
      const hasPermissions = await notificationManager.requestPermissions();

      // Assert - Should return false (no permissions available on web)
      expect(hasPermissions).toBe(false);
    });

    it('should return empty schedule result when scheduling fails on web', async () => {
      // Arrange - Mock bell events
      const mockBellEvents = [
        {
          id: 'bell-1',
          scheduledTime: new Date(Date.now() + 60000),
          status: 'scheduled' as const
        },
        {
          id: 'bell-2', 
          scheduledTime: new Date(Date.now() + 120000),
          status: 'scheduled' as const
        }
      ];

      // Act - Try to schedule notifications
      const result = await notificationManager.scheduleBellNotifications(mockBellEvents);

      // Assert - Should return empty/failed result
      expect(result.scheduled).toHaveLength(0);
      expect(result.failed).toHaveLength(2);
      expect(result.limitations.actuallyScheduled).toBe(0);
    });

    it('should return 0 for scheduled notifications count on web', async () => {
      // Act - Get scheduled notifications count
      const count = await notificationManager.getScheduledNotificationsCount();

      // Assert - Should be 0 on web
      expect(count).toBe(0);
    });

    it('should return null for next scheduled notification on web', async () => {
      // Act - Get next scheduled notification
      const nextNotification = await notificationManager.getNextScheduledNotification();

      // Assert - Should be null on web
      expect(nextNotification).toBeNull();
    });

    it('should handle test notification gracefully on web', async () => {
      // Act - Try to send test notification
      let testResult: string | null = null;
      let testError: Error | null = null;
      
      try {
        testResult = await notificationManager.testNotification();
      } catch (error) {
        testError = error as Error;
      }

      // Assert - Should either return empty string or handle gracefully
      expect(testError).toBeNull();
      expect(testResult).toBe('');
    });
  });

  describe('TDD: DatabaseService Web Compatibility', () => {
    it('should work properly on web platform', async () => {
      // Act - Check if database is healthy on web
      const isHealthy = await databaseService.isHealthy();

      // Assert - Should be healthy (using mock storage)
      expect(isHealthy).toBe(true);
    });

    it('should create observations using mock storage on web', async () => {
      // Arrange - Observation data
      const observationData = {
        type: 'lesson' as const,
        content: 'Web platform test observation',
        tags: ['web-test', 'fallback']
      };

      // Act - Create observation
      const observation = await databaseService.insertObservation(observationData);

      // Assert - Should create successfully using mock storage
      expect(observation.id).toBeDefined();
      expect(observation.type).toBe('lesson');
      expect(observation.content).toBe('Web platform test observation');
      expect(observation.tags).toEqual(['web-test', 'fallback']);
    });

    it('should retrieve observations using mock storage on web', async () => {
      // Arrange - Create test observations
      await databaseService.insertObservation({
        type: 'desire',
        content: 'First web observation',
        tags: ['web-1']
      });
      
      await databaseService.insertObservation({
        type: 'fear',
        content: 'Second web observation', 
        tags: ['web-2']
      });

      // Act - Retrieve observations
      const result = await databaseService.getObservations({ limit: 10 });

      // Assert - Should retrieve from mock storage
      expect(result.observations.length).toBeGreaterThanOrEqual(2);
      expect(result.totalCount).toBeGreaterThanOrEqual(2);
      
      const webObs1 = result.observations.find(obs => obs.content === 'First web observation');
      const webObs2 = result.observations.find(obs => obs.content === 'Second web observation');
      
      expect(webObs1).toBeDefined();
      expect(webObs2).toBeDefined();
    });
  });

  describe('TDD: Service Integration Web Fallbacks', () => {
    it('should handle service initialization failures gracefully', async () => {
      // Arrange - Mock console to capture warnings
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      // Act - Try to initialize services that might fail on web
      let initError: Error | null = null;
      try {
        const nm = NotificationManager.getInstance();
        await nm.initialize();
      } catch (error) {
        initError = error as Error;
      }

      // Assert - Should handle gracefully without throwing
      expect(initError).toBeNull();
      expect(consoleSpy).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });

    it('should provide web-compatible alternatives for native features', async () => {
      // Act - Test web alternatives
      const dbHealthy = await databaseService.isHealthy();
      const notificationPermissions = await notificationManager.requestPermissions();
      const scheduledCount = await notificationManager.getScheduledNotificationsCount();

      // Assert - Web alternatives should work
      expect(dbHealthy).toBe(true); // Mock storage works
      expect(notificationPermissions).toBe(false); // No permissions on web
      expect(scheduledCount).toBe(0); // No scheduled notifications on web
    });

    it('should maintain core functionality without native dependencies', async () => {
      // Arrange - Core app functionality test
      const observationData = {
        type: 'lesson' as const,
        content: 'Core functionality test on web',
        tags: ['core-test']
      };

      // Act - Test core observation flow
      const savedObservation = await databaseService.insertObservation(observationData);
      const retrievedObservations = await databaseService.getObservations({ limit: 1 });

      // Assert - Core functionality should work on web
      expect(savedObservation.id).toBeDefined();
      expect(retrievedObservations.observations.length).toBeGreaterThan(0);
      
      const foundObservation = retrievedObservations.observations.find(
        obs => obs.id === savedObservation.id
      );
      expect(foundObservation).toBeDefined();
      expect(foundObservation?.content).toBe('Core functionality test on web');
    });
  });
});
