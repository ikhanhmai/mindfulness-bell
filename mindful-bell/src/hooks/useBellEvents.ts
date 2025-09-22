import { useState, useEffect, useCallback } from 'react';
import { BellEvent, BellDensity, TimeWindow } from '../types';
import { useBellScheduler, useSettingsService, useNotificationManager } from './DatabaseContext';
import { useSettings } from './SettingsContext';
import { useNotifications } from './NotificationContext';

interface UseBellScheduleResult {
  // Current schedule
  todaysSchedule: BellEvent[];
  nextBell: BellEvent | null;
  completedBells: BellEvent[];
  upcomingBells: BellEvent[];

  // State
  isLoading: boolean;
  isGenerating: boolean;
  error: string | null;

  // Actions
  generateTodaysSchedule: () => Promise<BellEvent[]>;
  generateScheduleForDate: (date: Date) => Promise<BellEvent[]>;
  regenerateSchedule: () => Promise<BellEvent[]>;
  acknowledgeCurrentBell: () => Promise<void>;

  // Schedule validation
  validateScheduleParams: (
    density: BellDensity,
    activeWindows: TimeWindow[],
    quietHours: TimeWindow[]
  ) => Promise<{
    valid: boolean;
    estimatedBellsPerDay: number;
    availableMinutesPerDay: number;
    warnings: string[];
  }>;

  // Statistics
  getScheduleStats: () => {
    totalPlanned: number;
    completed: number;
    missed: number;
    upcoming: number;
    completionRate: number;
  };
}

export const useBellSchedule = (): UseBellScheduleResult => {
  const [todaysSchedule, setTodaysSchedule] = useState<BellEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const bellScheduler = useBellScheduler();
  const settingsService = useSettingsService();
  const { settings } = useSettings();
  const { scheduleNotifications } = useNotifications();

  const generateTodaysSchedule = useCallback(async (): Promise<BellEvent[]> => {
    try {
      setIsGenerating(true);
      setError(null);

      const currentSettings = settings || await settingsService.getSettings();
      const today = new Date();

      const schedule = await bellScheduler.generateDailySchedule(
        today,
        currentSettings.bellDensity,
        currentSettings.activeWindows,
        currentSettings.quietHours
      );

      setTodaysSchedule(schedule);

      // Schedule notifications for these bells
      if (schedule.length > 0) {
        await scheduleNotifications(schedule);
      }

      return schedule;
    } catch (err) {
      console.error('Failed to generate schedule:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate schedule');
      return [];
    } finally {
      setIsGenerating(false);
    }
  }, [bellScheduler, settingsService, settings, scheduleNotifications]);

  const generateScheduleForDate = useCallback(async (date: Date): Promise<BellEvent[]> => {
    try {
      setError(null);

      const currentSettings = settings || await settingsService.getSettings();

      const schedule = await bellScheduler.generateDailySchedule(
        date,
        currentSettings.bellDensity,
        currentSettings.activeWindows,
        currentSettings.quietHours
      );

      return schedule;
    } catch (err) {
      console.error('Failed to generate schedule for date:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate schedule');
      return [];
    }
  }, [bellScheduler, settingsService, settings]);

  const regenerateSchedule = useCallback(async (): Promise<BellEvent[]> => {
    return await generateTodaysSchedule();
  }, [generateTodaysSchedule]);

  const acknowledgeCurrentBell = useCallback(async () => {
    try {
      setError(null);

      const now = new Date();
      const currentBell = todaysSchedule.find(bell =>
        bell.status === 'triggered' ||
        (bell.status === 'scheduled' && Math.abs(bell.scheduledTime.getTime() - now.getTime()) < 5 * 60 * 1000) // Within 5 minutes
      );

      if (currentBell) {
        // Update bell status to acknowledged
        const updatedSchedule = todaysSchedule.map(bell =>
          bell.id === currentBell.id
            ? { ...bell, status: 'acknowledged' as const, acknowledgedAt: now }
            : bell
        );

        setTodaysSchedule(updatedSchedule);
      }
    } catch (err) {
      console.error('Failed to acknowledge bell:', err);
      setError(err instanceof Error ? err.message : 'Failed to acknowledge bell');
    }
  }, [todaysSchedule]);

  const validateScheduleParams = useCallback(async (
    density: BellDensity,
    activeWindows: TimeWindow[],
    quietHours: TimeWindow[]
  ) => {
    try {
      return await bellScheduler.validateScheduleParams({
        density,
        activeWindows,
        quietHours,
        minimumInterval: 45
      });
    } catch (err) {
      console.error('Failed to validate schedule params:', err);
      return {
        valid: false,
        estimatedBellsPerDay: 0,
        availableMinutesPerDay: 0,
        warnings: [err instanceof Error ? err.message : 'Validation failed']
      };
    }
  }, [bellScheduler]);

  const getScheduleStats = useCallback(() => {
    const now = new Date();
    const completed = todaysSchedule.filter(bell => bell.status === 'acknowledged').length;
    const missed = todaysSchedule.filter(bell =>
      bell.status === 'scheduled' && bell.scheduledTime < now
    ).length;
    const upcoming = todaysSchedule.filter(bell =>
      bell.status === 'scheduled' && bell.scheduledTime > now
    ).length;

    return {
      totalPlanned: todaysSchedule.length,
      completed,
      missed,
      upcoming,
      completionRate: todaysSchedule.length > 0 ? completed / todaysSchedule.length : 0
    };
  }, [todaysSchedule]);

  // Load today's schedule on mount and when settings change
  useEffect(() => {
    const loadSchedule = async () => {
      setIsLoading(true);
      await generateTodaysSchedule();
      setIsLoading(false);
    };

    loadSchedule();
  }, [generateTodaysSchedule]);

  // Computed values
  const now = new Date();
  const nextBell = todaysSchedule
    .filter(bell => bell.status === 'scheduled' && bell.scheduledTime > now)
    .sort((a, b) => a.scheduledTime.getTime() - b.scheduledTime.getTime())[0] || null;

  const completedBells = todaysSchedule.filter(bell => bell.status === 'acknowledged');
  const upcomingBells = todaysSchedule.filter(bell =>
    bell.status === 'scheduled' && bell.scheduledTime > now
  );

  return {
    // Current schedule
    todaysSchedule,
    nextBell,
    completedBells,
    upcomingBells,

    // State
    isLoading,
    isGenerating,
    error,

    // Actions
    generateTodaysSchedule,
    generateScheduleForDate,
    regenerateSchedule,
    acknowledgeCurrentBell,

    // Schedule validation
    validateScheduleParams,

    // Statistics
    getScheduleStats
  };
};

// Hook for bell event history
export const useBellHistory = (days: number = 7) => {
  const [history, setHistory] = useState<{
    date: Date;
    schedule: BellEvent[];
    stats: {
      planned: number;
      completed: number;
      missed: number;
      completionRate: number;
    };
  }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const bellScheduler = useBellScheduler();
  const settingsService = useSettingsService();

  const loadHistory = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const settings = await settingsService.getSettings();
      const historyData = [];

      for (let i = 0; i < days; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);

        const schedule = await bellScheduler.generateDailySchedule(
          date,
          settings.bellDensity,
          settings.activeWindows,
          settings.quietHours
        );

        // For historical data, we would normally load actual completion data from database
        // For now, simulate some completion data
        const completedCount = Math.floor(schedule.length * (0.6 + Math.random() * 0.3));
        const completed = schedule.slice(0, completedCount).map(bell => ({
          ...bell,
          status: 'acknowledged' as const,
          acknowledgedAt: new Date(bell.scheduledTime.getTime() + Math.random() * 30 * 60 * 1000)
        }));

        const missed = schedule.slice(completedCount).map(bell => ({
          ...bell,
          status: 'missed' as const
        }));

        const daySchedule = [...completed, ...missed];

        historyData.push({
          date,
          schedule: daySchedule,
          stats: {
            planned: schedule.length,
            completed: completed.length,
            missed: missed.length,
            completionRate: schedule.length > 0 ? completed.length / schedule.length : 0
          }
        });
      }

      setHistory(historyData);
    } catch (err) {
      console.error('Failed to load bell history:', err);
      setError(err instanceof Error ? err.message : 'Failed to load bell history');
    } finally {
      setIsLoading(false);
    }
  }, [bellScheduler, settingsService, days]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  return {
    history,
    isLoading,
    error,
    reload: loadHistory
  };
};

// Hook for real-time bell status
export const useCurrentBell = () => {
  const [currentBell, setCurrentBell] = useState<BellEvent | null>(null);
  const [timeUntilNext, setTimeUntilNext] = useState<number | null>(null);
  const [timeSinceScheduled, setTimeSinceScheduled] = useState<number | null>(null);

  const { todaysSchedule, nextBell } = useBellSchedule();

  useEffect(() => {
    const updateCurrentBell = () => {
      const now = new Date();

      // Find active bell (within 5 minutes of scheduled time)
      const activeBell = todaysSchedule.find(bell =>
        bell.status === 'triggered' ||
        (bell.status === 'scheduled' && Math.abs(bell.scheduledTime.getTime() - now.getTime()) < 5 * 60 * 1000)
      );

      setCurrentBell(activeBell || null);

      // Calculate time until next bell
      if (nextBell) {
        setTimeUntilNext(nextBell.scheduledTime.getTime() - now.getTime());
      } else {
        setTimeUntilNext(null);
      }

      // Calculate time since current bell was scheduled
      if (activeBell) {
        setTimeSinceScheduled(now.getTime() - activeBell.scheduledTime.getTime());
      } else {
        setTimeSinceScheduled(null);
      }
    };

    // Update immediately
    updateCurrentBell();

    // Update every minute
    const interval = setInterval(updateCurrentBell, 60 * 1000);

    return () => clearInterval(interval);
  }, [todaysSchedule, nextBell]);

  return {
    currentBell,
    nextBell,
    timeUntilNext,
    timeSinceScheduled,
    hasActiveBell: currentBell !== null,
    isOverdue: timeSinceScheduled !== null && timeSinceScheduled > 0
  };
};
