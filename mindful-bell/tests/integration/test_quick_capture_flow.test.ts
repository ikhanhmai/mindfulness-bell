/**
 * Integration tests for Quick Capture flow
 * Testing the end-to-end flow from HomeScreen Quick Capture to ObservationsScreen display
 */

import { ObservationService } from '../../src/services/ObservationService';
import { DatabaseService } from '../../src/services/DatabaseService';
import { Observation, ObservationType } from '../../src/types';

describe('Quick Capture Flow Integration Tests', () => {
  let observationService: ObservationService;
  let databaseService: DatabaseService;

  beforeAll(async () => {
    databaseService = DatabaseService.getInstance();
    await databaseService.initialize();
    observationService = ObservationService.getInstance();
  });

  describe('Step 1-3: HomeScreen Quick Capture to Database Save', () => {
    it('should create and save observation through ObservationService', async () => {
      // Arrange
      const observationType: ObservationType = 'lesson';
      const content = 'Test observation from Quick Capture';
      const tags = ['test', 'quick-capture'];

      // Act - Simulate what ObservationForm does when user clicks Save
      const savedObservation = await observationService.createObservation(
        observationType,
        content,
        tags
      );

      // Assert
      expect(savedObservation).toBeDefined();
      expect(savedObservation.id).toBeDefined();
      expect(savedObservation.type).toBe(observationType);
      expect(savedObservation.content).toBe(content);
      expect(savedObservation.tags).toEqual(expect.arrayContaining(tags));
      expect(savedObservation.createdAt).toBeInstanceOf(Date);
      expect(savedObservation.updatedAt).toBeInstanceOf(Date);

      console.log('✅ Step 1-3: Observation saved successfully:', savedObservation);
    });

    it('should extract hashtags from content during save', async () => {
      // Arrange
      const content = 'Feeling grateful for #family and #health today';
      
      // Act
      const savedObservation = await observationService.createObservation(
        'lesson',
        content,
        ['manual-tag']
      );

      // Assert
      expect(savedObservation.tags).toEqual(
        expect.arrayContaining(['manual-tag', 'family', 'health'])
      );

      console.log('✅ Hashtag extraction working:', savedObservation.tags);
    });
  });

  describe('Step 4: HomeScreen Success Callback', () => {
    it('should return complete observation object for success display', async () => {
      // Arrange
      const testContent = 'This is a test observation for success display';
      
      // Act - Simulate the save operation that triggers the success callback
      const savedObservation = await observationService.createObservation(
        'desire',
        testContent,
        ['success-test']
      );

      // Assert - Verify the observation has all data needed for success message
      expect(savedObservation.type).toBe('desire');
      expect(savedObservation.content).toBe(testContent);
      expect(savedObservation.content.substring(0, 50)).toBe(testContent);
      
      // Simulate what HomeScreen success handler does
      const successMessage = `Observation saved successfully!\n\nType: ${savedObservation.type}\nContent: ${savedObservation.content.substring(0, 50)}...`;
      expect(successMessage).toContain('desire');
      expect(successMessage).toContain(testContent);

      console.log('✅ Step 4: Success callback data complete:', {
        type: savedObservation.type,
        contentPreview: savedObservation.content.substring(0, 50)
      });
    });
  });

  describe('Step 5: ObservationsScreen Display', () => {
    it('should retrieve saved observations from database', async () => {
      // Arrange - Create multiple test observations
      const observation1 = await observationService.createObservation(
        'fear',
        'First test observation',
        ['test1']
      );
      
      const observation2 = await observationService.createObservation(
        'lesson',
        'Second test observation',
        ['test2']
      );

      // Act - Simulate what ObservationsScreen does to load observations
      const result = await observationService.getObservations({ limit: 100 });
      const allObservations = result.observations;

      // Assert
      expect(allObservations).toBeDefined();
      expect(allObservations.length).toBeGreaterThanOrEqual(2);
      
      // Check that our test observations are in the results
      const observation1Found = allObservations.find((obs: Observation) => obs.id === observation1.id);
      const observation2Found = allObservations.find((obs: Observation) => obs.id === observation2.id);
      
      expect(observation1Found).toBeDefined();
      expect(observation2Found).toBeDefined();
      expect(observation1Found?.content).toBe('First test observation');
      expect(observation2Found?.content).toBe('Second test observation');

      console.log('✅ Step 5: Observations retrieved successfully:', {
        totalCount: allObservations.length,
        foundObservation1: !!observation1Found,
        foundObservation2: !!observation2Found
      });
    });

    it('should handle empty observations list gracefully', async () => {
      // Act - Get observations when database might be empty
      const result = await observationService.getObservations({ limit: 10 });
      const observations = result.observations;

      // Assert - Should return empty array, not throw error
      expect(Array.isArray(observations)).toBe(true);
      
      console.log('✅ Empty observations list handled gracefully:', observations.length);
    });
  });

  describe('End-to-End Flow Verification', () => {
    it('should complete full Quick Capture to Display flow', async () => {
      // Step 1-3: Create observation (simulating HomeScreen Quick Capture)
      const testObservation = await observationService.createObservation(
        'affliction',
        'End-to-end test observation with #e2e tag',
        ['integration-test']
      );

      console.log('✅ E2E Step 1-3: Observation created:', testObservation.id);

      // Step 4: Verify success callback data (simulating HomeScreen success handler)
      expect(testObservation.type).toBe('affliction');
      expect(testObservation.content).toContain('End-to-end test');
      expect(testObservation.tags).toContain('e2e');
      expect(testObservation.tags).toContain('integration-test');

      console.log('✅ E2E Step 4: Success callback verified');

      // Step 5: Verify observation appears in list (simulating ObservationsScreen)
      const result = await observationService.getObservations({ limit: 100 });
      const allObservations = result.observations;
      const foundObservation = allObservations.find((obs: Observation) => obs.id === testObservation.id);

      expect(foundObservation).toBeDefined();
      expect(foundObservation?.content).toBe(testObservation.content);
      expect(foundObservation?.type).toBe(testObservation.type);

      console.log('✅ E2E Step 5: Observation found in list');
      console.log('🎉 Full E2E flow completed successfully!');
    });
  });
});
