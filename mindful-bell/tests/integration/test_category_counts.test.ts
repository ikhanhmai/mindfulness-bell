import { useObservations } from '../../src/hooks/useObservations';
import { Observation, ObservationType } from '../../src/types';
import { renderHook, act } from '@testing-library/react-native';

// Mock the DatabaseContext to provide a mocked observation service
const mockObservationService = {
  getObservations: jest.fn(),
  createObservation: jest.fn(),
  updateObservation: jest.fn(),
  deleteObservation: jest.fn(),
  getObservationById: jest.fn(),
  getObservationStats: jest.fn(),
};

jest.mock('../../src/hooks/DatabaseContext', () => ({
  useObservationService: () => mockObservationService,
}));

describe('Category Counts Integration Tests', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('useObservations hook category counts', () => {
    it('should calculate correct category counts for mixed observations', async () => {
      // Arrange - Create sample observations with different types
      const mockObservations: Observation[] = [
        {
          id: '1',
          type: 'desire' as ObservationType,
          content: 'First desire',
          tags: [],
          createdAt: new Date('2023-01-01'),
          updatedAt: new Date('2023-01-01')
        },
        {
          id: '2',
          type: 'desire' as ObservationType,
          content: 'Second desire',
          tags: [],
          createdAt: new Date('2023-01-02'),
          updatedAt: new Date('2023-01-02')
        },
        {
          id: '3',
          type: 'fear' as ObservationType,
          content: 'First fear',
          tags: [],
          createdAt: new Date('2023-01-03'),
          updatedAt: new Date('2023-01-03')
        },
        {
          id: '4',
          type: 'affliction' as ObservationType,
          content: 'First affliction',
          tags: [],
          createdAt: new Date('2023-01-04'),
          updatedAt: new Date('2023-01-04')
        },
        {
          id: '5',
          type: 'lesson' as ObservationType,
          content: 'First lesson',
          tags: [],
          createdAt: new Date('2023-01-05'),
          updatedAt: new Date('2023-01-05')
        },
        {
          id: '6',
          type: 'lesson' as ObservationType,
          content: 'Second lesson',
          tags: [],
          createdAt: new Date('2023-01-06'),
          updatedAt: new Date('2023-01-06')
        }
      ];

      mockObservationService.getObservations.mockResolvedValue({
        observations: mockObservations,
        pagination: { total: mockObservations.length, offset: 0, limit: 1000 },
        searchMetadata: { executionTimeMs: 10 }
      });

      // Act - Render the hook and wait for it to load
      const { result } = renderHook(() => useObservations());

      // Wait for the hook to finish loading
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      // Assert - Check that category counts are calculated correctly
      expect(result.current.categoryCounts).toBeDefined();
      expect(result.current.categoryCounts.all).toBe(6);
      expect(result.current.categoryCounts.desire).toBe(2);
      expect(result.current.categoryCounts.fear).toBe(1);
      expect(result.current.categoryCounts.affliction).toBe(1);
      expect(result.current.categoryCounts.lesson).toBe(2);
    });

    it('should return zero counts when no observations exist', async () => {
      // Arrange - Mock empty observations
      mockObservationService.getObservations.mockResolvedValue({
        observations: [],
        pagination: { total: 0, offset: 0, limit: 1000 },
        searchMetadata: { executionTimeMs: 10 }
      });

      // Act - Render the hook and wait for it to load
      const { result } = renderHook(() => useObservations());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      // Assert - All counts should be zero
      expect(result.current.categoryCounts).toBeDefined();
      expect(result.current.categoryCounts.all).toBe(0);
      expect(result.current.categoryCounts.desire).toBe(0);
      expect(result.current.categoryCounts.fear).toBe(0);
      expect(result.current.categoryCounts.affliction).toBe(0);
      expect(result.current.categoryCounts.lesson).toBe(0);
    });

    it('should update category counts when observations are added', async () => {
      // Arrange - Start with some observations
      const initialObservations: Observation[] = [
        {
          id: '1',
          type: 'desire' as ObservationType,
          content: 'Initial desire',
          tags: [],
          createdAt: new Date('2023-01-01'),
          updatedAt: new Date('2023-01-01')
        }
      ];

      const updatedObservations: Observation[] = [
        ...initialObservations,
        {
          id: '2',
          type: 'fear' as ObservationType,
          content: 'New fear',
          tags: [],
          createdAt: new Date('2023-01-02'),
          updatedAt: new Date('2023-01-02')
        }
      ];

      // Mock multiple calls as the hook makes two requests (filtered and all observations)
      mockObservationService.getObservations
        .mockResolvedValueOnce({
          observations: initialObservations,
          pagination: { total: initialObservations.length, offset: 0, limit: 1000 },
          searchMetadata: { executionTimeMs: 10 }
        })
        .mockResolvedValueOnce({
          observations: initialObservations,
          pagination: { total: initialObservations.length, offset: 0, limit: 1000 },
          searchMetadata: { executionTimeMs: 10 }
        });

      // Act - Initial render
      const { result } = renderHook(() => useObservations());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      // Verify initial counts
      expect(result.current.categoryCounts.all).toBe(1);
      expect(result.current.categoryCounts.desire).toBe(1);
      expect(result.current.categoryCounts.fear).toBe(0);

      // Mock the updated observations and refresh (again, two calls)
      mockObservationService.getObservations
        .mockResolvedValueOnce({
          observations: updatedObservations,
          pagination: { total: updatedObservations.length, offset: 0, limit: 1000 },
          searchMetadata: { executionTimeMs: 10 }
        })
        .mockResolvedValueOnce({
          observations: updatedObservations,
          pagination: { total: updatedObservations.length, offset: 0, limit: 1000 },
          searchMetadata: { executionTimeMs: 10 }
        });

      await act(async () => {
        await result.current.refresh();
      });

      // Assert - Counts should be updated
      expect(result.current.categoryCounts.all).toBe(2);
      expect(result.current.categoryCounts.desire).toBe(1);
      expect(result.current.categoryCounts.fear).toBe(1);
    });

    it('should handle observations with only one type', async () => {
      // Arrange - Create observations all of the same type
      const mockObservations: Observation[] = [
        {
          id: '1',
          type: 'lesson' as ObservationType,
          content: 'First lesson',
          tags: [],
          createdAt: new Date('2023-01-01'),
          updatedAt: new Date('2023-01-01')
        },
        {
          id: '2',
          type: 'lesson' as ObservationType,
          content: 'Second lesson',
          tags: [],
          createdAt: new Date('2023-01-02'),
          updatedAt: new Date('2023-01-02')
        },
        {
          id: '3',
          type: 'lesson' as ObservationType,
          content: 'Third lesson',
          tags: [],
          createdAt: new Date('2023-01-03'),
          updatedAt: new Date('2023-01-03')
        }
      ];

      mockObservationService.getObservations.mockResolvedValue({
        observations: mockObservations,
        pagination: { total: mockObservations.length, offset: 0, limit: 1000 },
        searchMetadata: { executionTimeMs: 10 }
      });

      // Act
      const { result } = renderHook(() => useObservations());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      // Assert - Only lesson count should be non-zero
      expect(result.current.categoryCounts.all).toBe(3);
      expect(result.current.categoryCounts.desire).toBe(0);
      expect(result.current.categoryCounts.fear).toBe(0);
      expect(result.current.categoryCounts.affliction).toBe(0);
      expect(result.current.categoryCounts.lesson).toBe(3);
    });

    it('should recalculate counts after observation deletion', async () => {
      // Arrange - Start with multiple observations
      const initialObservations: Observation[] = [
        {
          id: '1',
          type: 'desire' as ObservationType,
          content: 'Desire 1',
          tags: [],
          createdAt: new Date('2023-01-01'),
          updatedAt: new Date('2023-01-01')
        },
        {
          id: '2',
          type: 'desire' as ObservationType,
          content: 'Desire 2',
          tags: [],
          createdAt: new Date('2023-01-02'),
          updatedAt: new Date('2023-01-02')
        },
        {
          id: '3',
          type: 'fear' as ObservationType,
          content: 'Fear 1',
          tags: [],
          createdAt: new Date('2023-01-03'),
          updatedAt: new Date('2023-01-03')
        }
      ];

      const afterDeletionObservations: Observation[] = [
        {
          id: '1',
          type: 'desire' as ObservationType,
          content: 'Desire 1',
          tags: [],
          createdAt: new Date('2023-01-01'),
          updatedAt: new Date('2023-01-01')
        },
        {
          id: '3',
          type: 'fear' as ObservationType,
          content: 'Fear 1',
          tags: [],
          createdAt: new Date('2023-01-03'),
          updatedAt: new Date('2023-01-03')
        }
      ];

      // Mock multiple calls as the hook makes two requests (filtered and all observations)
      mockObservationService.getObservations
        .mockResolvedValueOnce({
          observations: initialObservations,
          pagination: { total: initialObservations.length, offset: 0, limit: 1000 },
          searchMetadata: { executionTimeMs: 10 }
        })
        .mockResolvedValueOnce({
          observations: initialObservations,
          pagination: { total: initialObservations.length, offset: 0, limit: 1000 },
          searchMetadata: { executionTimeMs: 10 }
        });

      // Act - Initial render
      const { result } = renderHook(() => useObservations());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      // Verify initial counts
      expect(result.current.categoryCounts.all).toBe(3);
      expect(result.current.categoryCounts.desire).toBe(2);
      expect(result.current.categoryCounts.fear).toBe(1);

      // Simulate deletion by mocking new observation list (again, two calls)
      mockObservationService.getObservations
        .mockResolvedValueOnce({
          observations: afterDeletionObservations,
          pagination: { total: afterDeletionObservations.length, offset: 0, limit: 1000 },
          searchMetadata: { executionTimeMs: 10 }
        })
        .mockResolvedValueOnce({
          observations: afterDeletionObservations,
          pagination: { total: afterDeletionObservations.length, offset: 0, limit: 1000 },
          searchMetadata: { executionTimeMs: 10 }
        });

      await act(async () => {
        await result.current.refresh();
      });

      // Assert - Counts should reflect the deletion
      expect(result.current.categoryCounts.all).toBe(2);
      expect(result.current.categoryCounts.desire).toBe(1);
      expect(result.current.categoryCounts.fear).toBe(1);
    });
  });

  describe('Category count data structure', () => {
    it('should provide categoryCounts as an object with expected structure', async () => {
      // Arrange
      mockObservationService.getObservations.mockResolvedValue({
        observations: [],
        pagination: { total: 0, offset: 0, limit: 1000 },
        searchMetadata: { executionTimeMs: 10 }
      });

      // Act
      const { result } = renderHook(() => useObservations());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      // Assert - Check the structure of categoryCounts
      expect(result.current.categoryCounts).toEqual({
        all: expect.any(Number),
        desire: expect.any(Number),
        fear: expect.any(Number),
        affliction: expect.any(Number),
        lesson: expect.any(Number)
      });
    });

    it('should maintain count accuracy with large numbers of observations', async () => {
      // Arrange - Create a large number of observations
      const mockObservations: Observation[] = [];
      const typeCounts = { desire: 0, fear: 0, affliction: 0, lesson: 0 };
      const types: ObservationType[] = ['desire', 'fear', 'affliction', 'lesson'];

      // Create 100 observations with random types
      for (let i = 0; i < 100; i++) {
        const type = types[i % 4]; // Distribute evenly
        typeCounts[type]++;

        mockObservations.push({
          id: `${i}`,
          type,
          content: `Test ${type} ${i}`,
          tags: [],
          createdAt: new Date(`2023-01-${String(i % 30 + 1).padStart(2, '0')}`),
          updatedAt: new Date(`2023-01-${String(i % 30 + 1).padStart(2, '0')}`)
        });
      }

      mockObservationService.getObservations.mockResolvedValue({
        observations: mockObservations,
        pagination: { total: mockObservations.length, offset: 0, limit: 1000 },
        searchMetadata: { executionTimeMs: 10 }
      });

      // Act
      const { result } = renderHook(() => useObservations());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      // Assert - Verify counts match expected distribution
      expect(result.current.categoryCounts.all).toBe(100);
      expect(result.current.categoryCounts.desire).toBe(25);
      expect(result.current.categoryCounts.fear).toBe(25);
      expect(result.current.categoryCounts.affliction).toBe(25);
      expect(result.current.categoryCounts.lesson).toBe(25);
    });
  });
});