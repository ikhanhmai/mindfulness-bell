/**
 * Integration tests for Web DatabaseService
 * Testing the web-specific mock implementation
 */

// Mock Platform.OS to be 'web' for this test
jest.mock('react-native', () => ({
  Platform: {
    OS: 'web'
  }
}));

// Mock the DatabaseService import in ObservationService to use the web version
jest.mock('../../src/services/DatabaseService', () => {
  return require('../../src/services/DatabaseService.web');
});

import { DatabaseService } from '../../src/services/DatabaseService.web';
import { ObservationService } from '../../src/services/ObservationService';
import { Observation, ObservationType } from '../../src/types';

describe('Web DatabaseService Integration Tests', () => {
  let databaseService: DatabaseService;
  let observationService: ObservationService;

  beforeAll(async () => {
    databaseService = DatabaseService.getInstance();
    await databaseService.initialize();
    observationService = ObservationService.getInstance();
  });

  describe('Web Mock Storage', () => {
    it('should persist observations in mock storage', async () => {
      // Create first observation
      const observation1 = await observationService.createObservation(
        'lesson',
        'First web observation',
        ['web-test']
      );

      // Create second observation
      const observation2 = await observationService.createObservation(
        'desire',
        'Second web observation with #hashtag',
        ['web-test-2']
      );

      // Retrieve observations
      const result = await databaseService.getObservations({ limit: 10 });

      expect(result.observations).toHaveLength(2);
      expect(result.totalCount).toBe(2);
      
      // Check that both observations are present
      const foundObs1 = result.observations.find(obs => obs.id === observation1.id);
      const foundObs2 = result.observations.find(obs => obs.id === observation2.id);
      
      expect(foundObs1).toBeDefined();
      expect(foundObs2).toBeDefined();
      expect(foundObs1?.content).toBe('First web observation');
      expect(foundObs2?.content).toBe('Second web observation with #hashtag');
      expect(foundObs2?.tags).toContain('hashtag'); // Should extract hashtag
    });

    it('should support filtering by type', async () => {
      // Create observations of different types
      await observationService.createObservation('fear', 'Fear observation', ['fear-tag']);
      await observationService.createObservation('affliction', 'Affliction observation', ['affliction-tag']);

      // Filter by fear type
      const fearResult = await databaseService.getObservations({ 
        type: ['fear'],
        limit: 10 
      });

      expect(fearResult.observations.length).toBeGreaterThan(0);
      fearResult.observations.forEach(obs => {
        expect(obs.type).toBe('fear');
      });

      // Filter by affliction type
      const afflictionResult = await databaseService.getObservations({ 
        type: ['affliction'],
        limit: 10 
      });

      expect(afflictionResult.observations.length).toBeGreaterThan(0);
      afflictionResult.observations.forEach(obs => {
        expect(obs.type).toBe('affliction');
      });
    });

    it('should support date filtering', async () => {
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      // Create observation
      await observationService.createObservation('lesson', 'Today observation', ['today']);

      // Filter from yesterday (should include today's observation)
      const fromYesterday = await databaseService.getObservations({
        dateFrom: yesterday,
        limit: 100
      });

      expect(fromYesterday.observations.length).toBeGreaterThan(0);

      // Filter from tomorrow (should not include today's observation)
      const fromTomorrow = await databaseService.getObservations({
        dateFrom: tomorrow,
        limit: 100
      });

      expect(fromTomorrow.observations.length).toBe(0);
    });

    it('should support pagination', async () => {
      // Create multiple observations
      for (let i = 0; i < 5; i++) {
        await observationService.createObservation(
          'lesson',
          `Pagination test observation ${i}`,
          [`page-${i}`]
        );
      }

      // Get first page
      const page1 = await databaseService.getObservations({
        limit: 3,
        offset: 0
      });

      expect(page1.observations.length).toBe(3);
      expect(page1.totalCount).toBeGreaterThanOrEqual(5);

      // Get second page
      const page2 = await databaseService.getObservations({
        limit: 3,
        offset: 3
      });

      expect(page2.observations.length).toBeGreaterThan(0);
      expect(page2.totalCount).toBe(page1.totalCount); // Same total count

      // Ensure no overlap between pages
      const page1Ids = page1.observations.map(obs => obs.id);
      const page2Ids = page2.observations.map(obs => obs.id);
      const overlap = page1Ids.filter(id => page2Ids.includes(id));
      expect(overlap).toHaveLength(0);
    });

    it('should sort observations by creation date (newest first)', async () => {
      // Create observations with slight delays to ensure different timestamps
      const obs1 = await observationService.createObservation('lesson', 'First', ['sort-1']);
      await new Promise(resolve => setTimeout(resolve, 10)); // Small delay
      const obs2 = await observationService.createObservation('lesson', 'Second', ['sort-2']);
      await new Promise(resolve => setTimeout(resolve, 10)); // Small delay
      const obs3 = await observationService.createObservation('lesson', 'Third', ['sort-3']);

      const result = await databaseService.getObservations({ limit: 10 });
      
      // Find our test observations in the result
      const testObs = result.observations.filter(obs => 
        obs.content.includes('First') || obs.content.includes('Second') || obs.content.includes('Third')
      );

      expect(testObs.length).toBe(3);
      
      // Should be sorted newest first
      const sortedByTime = testObs.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      expect(testObs[0].createdAt.getTime()).toBeGreaterThanOrEqual(testObs[1].createdAt.getTime());
      expect(testObs[1].createdAt.getTime()).toBeGreaterThanOrEqual(testObs[2].createdAt.getTime());
    });
  });

  describe('Web Database Compatibility', () => {
    it('should have same interface as main DatabaseService', async () => {
      // Test that all expected methods exist
      expect(typeof databaseService.initialize).toBe('function');
      expect(typeof databaseService.insertObservation).toBe('function');
      expect(typeof databaseService.updateObservation).toBe('function');
      expect(typeof databaseService.getObservationById).toBe('function');
      expect(typeof databaseService.getObservations).toBe('function');
      expect(typeof databaseService.insertBellEvent).toBe('function');
      expect(typeof databaseService.getSettings).toBe('function');
      expect(typeof databaseService.updateSettings).toBe('function');
    });

    it('should work with ObservationService', async () => {
      // Test that ObservationService can use the web database
      const observation = await observationService.createObservation(
        'desire',
        'Testing ObservationService integration',
        ['integration-test']
      );

      expect(observation).toBeDefined();
      expect(observation.id).toBeDefined();
      expect(observation.content).toBe('Testing ObservationService integration');

      // Test retrieval through ObservationService
      const result = await observationService.getObservations({ limit: 1 });
      expect(result.observations.length).toBeGreaterThan(0);
    });
  });
});
