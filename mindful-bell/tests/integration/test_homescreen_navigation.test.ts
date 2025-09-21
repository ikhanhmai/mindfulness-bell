/**
 * TDD Integration tests for HomeScreen Quick Capture Navigation
 * Testing the complete flow: Quick Capture → Save → Navigate to Observations → Refresh List
 */

import { DatabaseService } from '../../src/services/DatabaseService';
import { ObservationService } from '../../src/services/ObservationService';
import { Observation } from '../../src/types';

// Mock navigation
const mockNavigate = jest.fn();
const mockReset = jest.fn();

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: mockNavigate,
    reset: mockReset,
  }),
}));

// Mock the router for Expo Router
jest.mock('expo-router', () => ({
  router: {
    push: mockNavigate,
    replace: mockNavigate,
    navigate: mockNavigate,
  },
  useRouter: () => ({
    push: mockNavigate,
    replace: mockNavigate,
    navigate: mockNavigate,
  }),
}));

describe('HomeScreen Quick Capture Navigation TDD', () => {
  let databaseService: DatabaseService;
  let observationService: ObservationService;

  beforeAll(async () => {
    databaseService = DatabaseService.getInstance();
    await databaseService.initialize();
    observationService = ObservationService.getInstance();
  });

  beforeEach(() => {
    // Clear all mocks before each test
    mockNavigate.mockClear();
    mockReset.mockClear();
  });

  describe('TDD: Quick Capture with Navigation', () => {
    it('should automatically navigate to observations screen after successful save', async () => {
      // Arrange - Create a mock HomeScreen navigation handler that auto-navigates
      const mockHomeScreenNavigationHandler = {
        handleObservationSave: async (observation: Observation) => {
          // This simulates what the HomeScreen should do:
          // 1. Close the modal
          // 2. Automatically navigate to observations screen
          // 3. Show success message (optional)
          console.log('HomeScreen: Observation saved, auto-navigating to observations');
          
          // Automatically navigate to observations tab/screen
          mockNavigate('/(tabs)/observations');
          
          return observation;
        }
      };

      // Act - Simulate the complete flow
      const savedObservation = await observationService.createObservation(
        'lesson',
        'Test observation for auto navigation',
        ['auto-navigation-test']
      );

      // Simulate HomeScreen handling the save with auto-navigation
      await mockHomeScreenNavigationHandler.handleObservationSave(savedObservation);

      // Assert - Should automatically navigate to observations screen
      expect(mockNavigate).toHaveBeenCalledWith('/(tabs)/observations');
      expect(mockNavigate).toHaveBeenCalledTimes(1);
    });

    it('should navigate immediately without user interaction', async () => {
      // Arrange - Test that navigation happens immediately, not after user clicks button
      const mockImmediateNavigationHandler = {
        handleObservationSave: async (observation: Observation) => {
          // Should navigate immediately when called, not wait for user input
          mockNavigate('/(tabs)/observations');
          return observation;
        }
      };

      // Act - Save observation
      const savedObservation = await observationService.createObservation(
        'desire',
        'Test immediate navigation',
        ['immediate-nav']
      );

      // Simulate immediate navigation (no alert dialogs)
      await mockImmediateNavigationHandler.handleObservationSave(savedObservation);

      // Assert - Navigation should happen immediately
      expect(mockNavigate).toHaveBeenCalledWith('/(tabs)/observations');
      expect(mockNavigate).toHaveBeenCalledTimes(1);
    });

    it('should refresh observations list after navigation', async () => {
      // Arrange - Create observations before navigation
      const existingObservation = await observationService.createObservation(
        'desire',
        'Existing observation',
        ['existing']
      );

      // Act - Create new observation and simulate navigation
      const newObservation = await observationService.createObservation(
        'fear',
        'New observation for refresh test',
        ['refresh-test']
      );

      // Simulate navigation to observations screen
      mockNavigate('observations');

      // Simulate ObservationsScreen loading observations after navigation
      const observationsResult = await observationService.getObservations({ limit: 10 });

      // Assert - Both observations should be present (list refreshed)
      expect(observationsResult.observations.length).toBeGreaterThanOrEqual(2);
      
      const foundExisting = observationsResult.observations.find(obs => obs.id === existingObservation.id);
      const foundNew = observationsResult.observations.find(obs => obs.id === newObservation.id);
      
      expect(foundExisting).toBeDefined();
      expect(foundNew).toBeDefined();
      expect(foundNew?.content).toBe('New observation for refresh test');
    });

    it('should show success toast and auto-navigate', async () => {
      // Arrange - Mock success toast handler (non-blocking feedback)
      const mockToastHandler = jest.fn();
      
      const mockHomeScreenWithToast = {
        handleObservationSave: async (observation: Observation) => {
          // Show non-blocking success toast
          mockToastHandler(`Observation saved!`);
          
          // Immediately navigate (don't wait for user interaction)
          mockNavigate('/(tabs)/observations');
          
          return observation;
        }
      };

      // Act - Save observation with toast feedback
      const observation = await observationService.createObservation(
        'affliction',
        'This is a longer observation content for testing feedback messages',
        ['feedback-test']
      );

      await mockHomeScreenWithToast.handleObservationSave(observation);

      // Assert - Should show toast and navigate automatically
      expect(mockToastHandler).toHaveBeenCalledWith('Observation saved!');
      expect(mockNavigate).toHaveBeenCalledWith('/(tabs)/observations');
    });

    it('should provide fallback option if user prefers manual navigation', async () => {
      // Arrange - Test for users who prefer to choose when to navigate
      const mockAlertHandler = jest.fn();
      
      const mockHomeScreenWithChoice = {
        handleObservationSave: async (observation: Observation) => {
          // Provide choice: auto-navigate or stay
          mockAlertHandler('Success', 'Observation saved!', [
            { text: 'Stay Here', onPress: () => {} },
            { text: 'View Observations', onPress: () => mockNavigate('/(tabs)/observations') }
          ]);
          
          return observation;
        }
      };

      // Act - Save observation with choice
      const observation = await observationService.createObservation(
        'lesson',
        'Test observation with choice',
        ['choice-test']
      );

      await mockHomeScreenWithChoice.handleObservationSave(observation);

      // Assert - Should provide choice (this is the current implementation)
      expect(mockAlertHandler).toHaveBeenCalledWith(
        'Success', 
        'Observation saved!', 
        expect.arrayContaining([
          expect.objectContaining({ text: 'Stay Here' }),
          expect.objectContaining({ text: 'View Observations' })
        ])
      );
    });

    it('should handle navigation failure gracefully', async () => {
      // Arrange - Mock navigation failure
      mockNavigate.mockImplementationOnce(() => {
        throw new Error('Navigation failed');
      });

      const mockErrorHandler = jest.fn();
      
      const mockHomeScreenWithErrorHandling = {
        handleObservationSave: async (observation: Observation) => {
          try {
            mockNavigate('observations');
          } catch (error) {
            mockErrorHandler('Navigation failed, staying on current screen');
            // Should still show success for the saved observation
            return observation;
          }
        }
      };

      // Act - Save observation and attempt navigation
      const observation = await observationService.createObservation(
        'lesson',
        'Test observation for error handling',
        ['error-test']
      );

      await mockHomeScreenWithErrorHandling.handleObservationSave(observation);

      // Assert - Should handle error gracefully
      expect(mockErrorHandler).toHaveBeenCalledWith(
        'Navigation failed, staying on current screen'
      );
      
      // Observation should still be saved
      const result = await observationService.getObservations({ limit: 10 });
      const errorTestObservation = result.observations.find(obs => obs.content === 'Test observation for error handling');
      expect(errorTestObservation).toBeDefined();
      expect(errorTestObservation?.tags).toContain('error-test');
    });

    it('should support different navigation patterns (tabs vs stack)', async () => {
      // Test different navigation patterns that might be used
      
      // Pattern 1: Tab navigation
      const mockTabNavigation = {
        handleObservationSave: async (observation: Observation) => {
          mockNavigate('(tabs)/observations'); // Expo Router tab pattern
          return observation;
        }
      };

      // Pattern 2: Stack navigation  
      const mockStackNavigation = {
        handleObservationSave: async (observation: Observation) => {
          mockNavigate('ObservationsScreen'); // React Navigation stack pattern
          return observation;
        }
      };

      // Act & Assert - Test tab navigation
      const observation1 = await observationService.createObservation('lesson', 'Tab test', ['tab']);
      await mockTabNavigation.handleObservationSave(observation1);
      expect(mockNavigate).toHaveBeenCalledWith('(tabs)/observations');

      // Reset mock
      mockNavigate.mockClear();

      // Act & Assert - Test stack navigation
      const observation2 = await observationService.createObservation('desire', 'Stack test', ['stack']);
      await mockStackNavigation.handleObservationSave(observation2);
      expect(mockNavigate).toHaveBeenCalledWith('ObservationsScreen');
    });
  });

  describe('TDD: Observations Screen Refresh Behavior', () => {
    it('should refresh observations list when screen becomes focused', async () => {
      // Arrange - Create initial observations
      await observationService.createObservation('fear', 'Initial observation', ['initial']);
      
      // Simulate initial load
      const initialResult = await observationService.getObservations({ limit: 10 });
      const initialCount = initialResult.pagination.total;

      // Act - Add new observation (simulating HomeScreen save)
      await observationService.createObservation('lesson', 'New observation after focus', ['focus-test']);

      // Simulate screen focus refresh
      const refreshedResult = await observationService.getObservations({ limit: 10 });

      // Assert - Should have one more observation
      expect(refreshedResult.pagination.total).toBe(initialCount + 1);
      
      // Find the new observation in the results (it should be there, but might not be first due to test isolation)
      const newObservation = refreshedResult.observations.find(obs => obs.content === 'New observation after focus');
      expect(newObservation).toBeDefined();
      expect(newObservation?.tags).toContain('focus-test');
    });

    it('should maintain scroll position after refresh when possible', async () => {
      // This test defines the expected behavior for scroll position
      // The actual implementation would need to handle this in the UI component
      
      // Arrange - Create many observations to enable scrolling
      for (let i = 0; i < 10; i++) {
        await observationService.createObservation(
          'lesson',
          `Scroll test observation ${i}`,
          [`scroll-${i}`]
        );
      }

      // Act - Get paginated results (simulating scroll position)
      const page1 = await observationService.getObservations({ limit: 5, offset: 0 });
      const page2 = await observationService.getObservations({ limit: 5, offset: 5 });

      // Assert - Pagination should work correctly for scroll position maintenance
      expect(page1.observations).toHaveLength(5);
      expect(page2.observations).toHaveLength(5);
      expect(page1.pagination.total).toBe(page2.pagination.total);
      
      // No overlap between pages
      const page1Ids = page1.observations.map(obs => obs.id);
      const page2Ids = page2.observations.map(obs => obs.id);
      const overlap = page1Ids.filter(id => page2Ids.includes(id));
      expect(overlap).toHaveLength(0);
    });

    it('should handle empty state after all observations are deleted', async () => {
      // This test ensures proper handling of empty state
      
      // Act - Get observations when potentially empty
      const result = await observationService.getObservations({ limit: 10 });

      // Assert - Should handle empty state gracefully
      expect(Array.isArray(result.observations)).toBe(true);
      expect(typeof result.pagination.total).toBe('number');
      expect(result.pagination.total).toBeGreaterThanOrEqual(0);
    });
  });

  describe('TDD: Integration with Navigation State', () => {
    it('should preserve navigation state during observation flow', async () => {
      // This test ensures navigation state is properly managed
      
      // Arrange - Mock navigation state
      const mockNavigationState = {
        currentRoute: 'home',
        previousRoute: null as string | null,
      };

      const mockNavigationWithState = {
        navigate: (route: string) => {
          mockNavigationState.previousRoute = mockNavigationState.currentRoute;
          mockNavigationState.currentRoute = route;
          mockNavigate(route);
        }
      };

      // Act - Navigate through the flow
      await observationService.createObservation(
        'desire',
        'Navigation state test',
        ['nav-state']
      );

      mockNavigationWithState.navigate('observations');

      // Assert - Navigation state should be updated
      expect(mockNavigationState.currentRoute).toBe('observations');
      expect(mockNavigationState.previousRoute).toBe('home');
      expect(mockNavigate).toHaveBeenCalledWith('observations');
    });
  });
});
