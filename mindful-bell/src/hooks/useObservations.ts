import { useState, useEffect, useCallback, useMemo } from 'react';
import { Observation, ObservationType } from '../types';
import { useObservationService } from './DatabaseContext';

interface UseObservationsOptions {
  limit?: number;
  offset?: number;
  type?: ObservationType[];
  dateFrom?: Date;
  dateTo?: Date;
  search?: string;
  autoLoad?: boolean;
}

interface CategoryCounts {
  all: number;
  desire: number;
  fear: number;
  affliction: number;
  lesson: number;
}

interface UseObservationsResult {
  // Data
  observations: Observation[];
  totalCount: number;
  hasMore: boolean;
  categoryCounts: CategoryCounts;

  // State
  isLoading: boolean;
  isLoadingMore: boolean;
  error: string | null;

  // Actions
  loadObservations: () => Promise<void>;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
  createObservation: (
    type: ObservationType,
    content: string,
    tags?: string[],
    bellEventId?: string
  ) => Promise<Observation>;
  updateObservation: (
    id: string,
    updates: Partial<Pick<Observation, 'content' | 'tags'>>
  ) => Promise<Observation>;
  deleteObservation: (id: string, permanent?: boolean) => Promise<void>;

  // Search and filtering
  searchObservations: (query: string) => Promise<void>;
  filterByType: (type: ObservationType | 'all') => void;
  filterByDateRange: (from: Date, to: Date) => void;
  clearFilters: () => void;

  // Pagination
  currentPage: number;
  totalPages: number;
  goToPage: (page: number) => Promise<void>;
}

export const useObservations = (options: UseObservationsOptions = {}): UseObservationsResult => {
  const {
    limit = 20,
    offset = 0,
    type,
    dateFrom,
    dateTo,
    search,
    autoLoad = true
  } = options;

  const [observations, setObservations] = useState<Observation[]>([]);
  const [allObservations, setAllObservations] = useState<Observation[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentOffset, setCurrentOffset] = useState(offset);

  // Filters
  const [currentType, setCurrentType] = useState<ObservationType[] | undefined>(type);
  const [currentDateFrom, setCurrentDateFrom] = useState<Date | undefined>(dateFrom);
  const [currentDateTo, setCurrentDateTo] = useState<Date | undefined>(dateTo);
  const [currentSearch, setCurrentSearch] = useState<string | undefined>(search);

  const observationService = useObservationService();

  // Load all observations for category counts (without filters)
  const loadAllObservations = useCallback(async () => {
    try {
      const result = await observationService.getObservations({
        limit: 1000, // Get a large number to ensure we get all
        offset: 0
        // No filters to get all observations for counts
      });
      setAllObservations(result.observations);
    } catch (err) {
      console.error('Failed to load all observations for category counts:', err);
    }
  }, [observationService]);

  const loadObservations = useCallback(async (append = false) => {
    try {
      if (append) {
        setIsLoadingMore(true);
      } else {
        setIsLoading(true);
        setError(null);
      }

      const result = await observationService.getObservations({
        limit,
        offset: append ? currentOffset : 0,
        type: currentType,
        dateFrom: currentDateFrom,
        dateTo: currentDateTo,
        search: currentSearch
      });

      if (append) {
        setObservations(prev => [...prev, ...result.observations]);
      } else {
        setObservations(result.observations);
        setCurrentOffset(limit);
      }

      setTotalCount(result.pagination.total);

      // Load all observations for category counts if not appending
      if (!append) {
        await loadAllObservations();
      }
    } catch (err) {
      console.error('Failed to load observations:', err);
      setError(err instanceof Error ? err.message : 'Failed to load observations');
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [
    observationService,
    limit,
    currentOffset,
    currentType,
    currentDateFrom,
    currentDateTo,
    currentSearch,
    loadAllObservations
  ]);

  const loadMore = useCallback(async () => {
    if (isLoadingMore || observations.length >= totalCount) return;

    setCurrentOffset(prev => prev + limit);
    await loadObservations(true);
  }, [isLoadingMore, observations.length, totalCount, limit, loadObservations]);

  const refresh = useCallback(async () => {
    setCurrentOffset(0);
    await loadObservations(false);
  }, [loadObservations]);

  const createObservation = useCallback(async (
    type: ObservationType,
    content: string,
    tags?: string[],
    bellEventId?: string
  ): Promise<Observation> => {
    try {
      setError(null);
      const newObservation = await observationService.createObservation(
        type,
        content,
        tags,
        bellEventId
      );

      // Add to the beginning of the list
      setObservations(prev => [newObservation, ...prev]);
      setAllObservations(prev => [newObservation, ...prev]);
      setTotalCount(prev => prev + 1);

      return newObservation;
    } catch (err) {
      console.error('Failed to create observation:', err);
      setError(err instanceof Error ? err.message : 'Failed to create observation');
      throw err;
    }
  }, [observationService]);

  const updateObservation = useCallback(async (
    id: string,
    updates: Partial<Pick<Observation, 'content' | 'tags'>>
  ): Promise<Observation> => {
    try {
      setError(null);
      const updatedObservation = await observationService.updateObservation(id, updates);

      // Update in the list
      setObservations(prev =>
        prev.map(obs => obs.id === id ? updatedObservation : obs)
      );
      setAllObservations(prev =>
        prev.map(obs => obs.id === id ? updatedObservation : obs)
      );

      return updatedObservation;
    } catch (err) {
      console.error('Failed to update observation:', err);
      setError(err instanceof Error ? err.message : 'Failed to update observation');
      throw err;
    }
  }, [observationService]);

  const deleteObservation = useCallback(async (id: string, permanent = false) => {
    try {
      setError(null);
      await observationService.deleteObservation(id, { permanent });

      // Remove from the list
      setObservations(prev => prev.filter(obs => obs.id !== id));
      setAllObservations(prev => prev.filter(obs => obs.id !== id));
      setTotalCount(prev => prev - 1);
    } catch (err) {
      console.error('Failed to delete observation:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete observation');
      throw err;
    }
  }, [observationService]);

  const searchObservations = useCallback(async (query: string) => {
    setCurrentSearch(query);
    setCurrentOffset(0);
    await loadObservations(false);
  }, [loadObservations]);

  const filterByType = useCallback((type: ObservationType | 'all') => {
    setCurrentType(type === 'all' ? undefined : [type]);
    setCurrentOffset(0);
  }, []);

  const filterByDateRange = useCallback((from: Date, to: Date) => {
    setCurrentDateFrom(from);
    setCurrentDateTo(to);
    setCurrentOffset(0);
  }, []);

  const clearFilters = useCallback(() => {
    setCurrentType(undefined);
    setCurrentDateFrom(undefined);
    setCurrentDateTo(undefined);
    setCurrentSearch(undefined);
    setCurrentOffset(0);
  }, []);

  const goToPage = useCallback(async (page: number) => {
    const newOffset = (page - 1) * limit;
    setCurrentOffset(newOffset);
    await loadObservations(false);
  }, [limit, loadObservations]);

  // Load observations when filters change
  useEffect(() => {
    if (autoLoad) {
      loadObservations(false);
    }
  }, [autoLoad, currentType, currentDateFrom, currentDateTo, currentSearch]); // eslint-disable-line react-hooks/exhaustive-deps

  // Computed values
  const hasMore = observations.length < totalCount;
  const currentPage = Math.floor(currentOffset / limit) + 1;
  const totalPages = Math.ceil(totalCount / limit);

  // Calculate category counts from all observations
  const categoryCounts: CategoryCounts = useMemo(() => {
    const counts = {
      all: allObservations.length,
      desire: 0,
      fear: 0,
      affliction: 0,
      lesson: 0
    };

    allObservations.forEach(observation => {
      if (observation.type === 'desire') counts.desire++;
      else if (observation.type === 'fear') counts.fear++;
      else if (observation.type === 'affliction') counts.affliction++;
      else if (observation.type === 'lesson') counts.lesson++;
    });

    return counts;
  }, [allObservations]);

  return {
    // Data
    observations,
    totalCount,
    hasMore,
    categoryCounts,

    // State
    isLoading,
    isLoadingMore,
    error,

    // Actions
    loadObservations: () => loadObservations(false),
    loadMore,
    refresh,
    createObservation,
    updateObservation,
    deleteObservation,

    // Search and filtering
    searchObservations,
    filterByType,
    filterByDateRange,
    clearFilters,

    // Pagination
    currentPage,
    totalPages,
    goToPage
  };
};

// Hook for individual observation
export const useObservation = (id: string) => {
  const [observation, setObservation] = useState<Observation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const observationService = useObservationService();

  const loadObservation = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const obs = await observationService.getObservationById(id);
      setObservation(obs);
    } catch (err) {
      console.error('Failed to load observation:', err);
      setError(err instanceof Error ? err.message : 'Failed to load observation');
    } finally {
      setIsLoading(false);
    }
  }, [observationService, id]);

  useEffect(() => {
    if (id) {
      loadObservation();
    }
  }, [id, loadObservation]);

  return {
    observation,
    isLoading,
    error,
    reload: loadObservation
  };
};

// Hook for observation statistics
export const useObservationStats = () => {
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const observationService = useObservationService();

  const loadStats = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const observationStats = await observationService.getObservationStats();
      setStats(observationStats);
    } catch (err) {
      console.error('Failed to load observation stats:', err);
      setError(err instanceof Error ? err.message : 'Failed to load observation stats');
    } finally {
      setIsLoading(false);
    }
  }, [observationService]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  return {
    stats,
    isLoading,
    error,
    reload: loadStats
  };
};