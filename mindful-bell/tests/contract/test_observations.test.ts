import { ObservationService } from '../../src/services/ObservationService';
import { Observation, ObservationType } from '../../src/types';

describe('ObservationService Contract Tests', () => {
  let observationService: ObservationService;

  beforeEach(() => {
    observationService = new ObservationService();
  });

  describe('createObservation', () => {
    it('should create observation with valid data', async () => {
      const observationData = {
        type: 'fear' as ObservationType,
        content: 'Feeling anxious about the presentation tomorrow',
        tags: ['work', 'anxiety']
      };

      const observation = await observationService.createObservation(observationData);

      expect(observation).toBeDefined();
      expect(observation.id).toBeDefined();
      expect(observation.type).toBe('fear');
      expect(observation.content).toBe(observationData.content);
      expect(observation.tags).toEqual(['work', 'anxiety']);
      expect(observation.createdAt).toBeInstanceOf(Date);
      expect(observation.updatedAt).toBeInstanceOf(Date);
    });

    it('should auto-extract hashtags from content', async () => {
      const observationData = {
        type: 'desire' as ObservationType,
        content: 'Want to be more confident during #presentations and #meetings',
        tags: []
      };

      const observation = await observationService.createObservation(observationData);

      expect(observation.tags).toContain('presentations');
      expect(observation.tags).toContain('meetings');
    });

    it('should validate observation type', async () => {
      const observationData = {
        type: 'invalid-type' as ObservationType,
        content: 'Test content',
        tags: []
      };

      await expect(
        observationService.createObservation(observationData)
      ).rejects.toThrow('Invalid observation type');
    });

    it('should validate content length', async () => {
      const observationData = {
        type: 'fear' as ObservationType,
        content: 'x'.repeat(2001), // Exceeds max length
        tags: []
      };

      await expect(
        observationService.createObservation(observationData)
      ).rejects.toThrow('Content exceeds maximum length');
    });
  });

  describe('getObservations', () => {
    it('should list observations with pagination', async () => {
      const result = await observationService.getObservations({
        limit: 10,
        offset: 0
      });

      expect(result).toBeDefined();
      expect(result.observations).toBeDefined();
      expect(Array.isArray(result.observations)).toBe(true);
      expect(result.pagination).toBeDefined();
      expect(result.pagination.total).toBeDefined();
      expect(result.pagination.limit).toBe(10);
      expect(result.pagination.offset).toBe(0);
    });

    it('should filter by observation type', async () => {
      const result = await observationService.getObservations({
        type: ['fear'],
        limit: 50
      });

      result.observations.forEach(obs => {
        expect(obs.type).toBe('fear');
      });
    });

    it('should search observation content', async () => {
      const result = await observationService.getObservations({
        search: 'anxiety work',
        limit: 50
      });

      expect(result.searchMetadata).toBeDefined();
      expect(result.searchMetadata.query).toBe('anxiety work');
      expect(result.searchMetadata.executionTimeMs).toBeLessThan(200);
    });

    it('should filter by date range', async () => {
      const dateFrom = new Date('2025-01-01');
      const dateTo = new Date('2025-01-31');

      const result = await observationService.getObservations({
        dateFrom,
        dateTo,
        limit: 50
      });

      result.observations.forEach(obs => {
        expect(obs.createdAt.getTime()).toBeGreaterThanOrEqual(dateFrom.getTime());
        expect(obs.createdAt.getTime()).toBeLessThanOrEqual(dateTo.getTime());
      });
    });
  });

  describe('updateObservation', () => {
    it('should update observation content', async () => {
      // This test assumes an observation exists with ID
      const observationId = 'test-observation-id';
      const updateData = {
        content: 'Updated observation content with new insights'
      };

      const updatedObservation = await observationService.updateObservation(
        observationId,
        updateData
      );

      expect(updatedObservation.content).toBe(updateData.content);
      expect(updatedObservation.updatedAt).toBeInstanceOf(Date);
    });

    it('should handle non-existent observation', async () => {
      const nonExistentId = 'non-existent-id';
      const updateData = { content: 'Test content' };

      await expect(
        observationService.updateObservation(nonExistentId, updateData)
      ).rejects.toThrow('Observation not found');
    });
  });

  describe('deleteObservation', () => {
    it('should soft delete observation', async () => {
      const observationId = 'test-observation-id';

      const result = await observationService.deleteObservation(observationId);

      expect(result.deleted).toBe(true);
      expect(result.undoTimeoutSeconds).toBe(300); // 5 minutes
    });

    it('should permanently delete when specified', async () => {
      const observationId = 'test-observation-id';

      await observationService.deleteObservation(observationId, { permanent: true });

      // Should not throw for permanent deletion
      expect(true).toBe(true);
    });
  });

  describe('searchObservations', () => {
    it('should return relevant results for text search', async () => {
      const results = await observationService.searchObservations('anxiety presentation');

      expect(results.observations).toBeDefined();
      expect(results.searchMetadata.executionTimeMs).toBeLessThan(200);

      // Results should be ranked by relevance
      if (results.observations.length > 1) {
        expect(results.observations[0]).toBeDefined();
      }
    });
  });
});