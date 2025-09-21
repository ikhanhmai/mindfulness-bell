import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { BellEvent } from '../types';
import { useNotificationManager, useBellScheduler, useSettingsService } from './DatabaseContext';
import { NotificationScheduleResult, BellNotificationResult } from '../services/NotificationManager';
import * as Notifications from 'expo-notifications';

interface NotificationContextType {
  // Permission state
  hasPermissions: boolean;
  isRequestingPermissions: boolean;
  permissionError: string | null;

  // Schedule state
  scheduledNotifications: number;
  nextNotification: Date | null;
  isScheduling: boolean;
  scheduleError: string | null;

  // Methods
  requestPermissions: () => Promise<boolean>;
  scheduleNotifications: (bellEvents: BellEvent[]) => Promise<NotificationScheduleResult>;
  clearAllNotifications: () => Promise<void>;
  testNotification: () => Promise<void>;
  refreshScheduleStatus: () => Promise<void>;

  // Badge management
  badgeCount: number;
  setBadgeCount: (count: number) => Promise<void>;
  clearBadge: () => Promise<void>;

  // Notification handling
  handleNotificationReceived: (notification: Notifications.Notification) => void;
  handleNotificationResponse: (response: Notifications.NotificationResponse) => Promise<BellNotificationResult>;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [hasPermissions, setHasPermissions] = useState(false);
  const [isRequestingPermissions, setIsRequestingPermissions] = useState(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);

  const [scheduledNotifications, setScheduledNotifications] = useState(0);
  const [nextNotification, setNextNotification] = useState<Date | null>(null);
  const [isScheduling, setIsScheduling] = useState(false);
  const [scheduleError, setScheduleError] = useState<string | null>(null);

  const [badgeCount, setBadgeCountState] = useState(0);

  const notificationManager = useNotificationManager();
  const bellScheduler = useBellScheduler();
  const settingsService = useSettingsService();

  const checkPermissions = useCallback(async () => {
    try {
      const { status } = await Notifications.getPermissionsAsync();
      setHasPermissions(status === 'granted');
      setPermissionError(null);
    } catch (error) {
      console.error('Failed to check notification permissions:', error);
      setPermissionError('Failed to check permissions');
    }
  }, []);

  const requestPermissions = useCallback(async (): Promise<boolean> => {
    try {
      setIsRequestingPermissions(true);
      setPermissionError(null);

      const granted = await notificationManager.requestPermissions();
      setHasPermissions(granted);

      if (!granted) {
        setPermissionError('Notification permissions denied');
      }

      return granted;
    } catch (error) {
      console.error('Failed to request notification permissions:', error);
      setPermissionError(error instanceof Error ? error.message : 'Permission request failed');
      return false;
    } finally {
      setIsRequestingPermissions(false);
    }
  }, [notificationManager]);

  const scheduleNotifications = useCallback(async (bellEvents: BellEvent[]): Promise<NotificationScheduleResult> => {
    try {
      setIsScheduling(true);
      setScheduleError(null);

      const result = await notificationManager.scheduleBellNotifications(bellEvents);

      // Update local state
      await refreshScheduleStatus();

      return result;
    } catch (error) {
      console.error('Failed to schedule notifications:', error);
      setScheduleError(error instanceof Error ? error.message : 'Failed to schedule notifications');
      throw error;
    } finally {
      setIsScheduling(false);
    }
  }, [notificationManager]);

  const clearAllNotifications = useCallback(async () => {
    try {
      setScheduleError(null);
      await notificationManager.clearBellNotifications();
      await refreshScheduleStatus();
    } catch (error) {
      console.error('Failed to clear notifications:', error);
      setScheduleError(error instanceof Error ? error.message : 'Failed to clear notifications');
    }
  }, [notificationManager]);

  const testNotification = useCallback(async () => {
    try {
      setScheduleError(null);
      await notificationManager.testNotification();
    } catch (error) {
      console.error('Failed to send test notification:', error);
      setScheduleError(error instanceof Error ? error.message : 'Failed to send test notification');
    }
  }, [notificationManager]);

  const refreshScheduleStatus = useCallback(async () => {
    try {
      const [count, next, badge] = await Promise.all([
        notificationManager.getScheduledNotificationsCount(),
        notificationManager.getNextScheduledNotification(),
        notificationManager.getBadgeCount()
      ]);

      setScheduledNotifications(count);
      setNextNotification(next);
      setBadgeCountState(badge);
    } catch (error) {
      console.error('Failed to refresh schedule status:', error);
    }
  }, [notificationManager]);

  const setBadgeCount = useCallback(async (count: number) => {
    try {
      await notificationManager.setBadgeCount(count);
      setBadgeCountState(count);
    } catch (error) {
      console.error('Failed to set badge count:', error);
    }
  }, [notificationManager]);

  const clearBadge = useCallback(async () => {
    try {
      await notificationManager.clearBadge();
      setBadgeCountState(0);
    } catch (error) {
      console.error('Failed to clear badge:', error);
    }
  }, [notificationManager]);

  const handleNotificationReceived = useCallback((notification: Notifications.Notification) => {
    console.log('Notification received:', notification);

    // Update badge count if it's a bell notification
    if (notification.request.content.data?.type === 'bell') {
      setBadgeCountState(prev => prev + 1);
    }
  }, []);

  const handleNotificationResponse = useCallback(async (response: Notifications.NotificationResponse): Promise<BellNotificationResult> => {
    try {
      console.log('Notification response received:', response);

      const result = await notificationManager.handleNotificationResponse({
        identifier: response.notification.request.identifier,
        actionIdentifier: response.actionIdentifier,
        userText: response.userText
      });

      // Clear badge if bell was acknowledged
      if (result.bellAcknowledged) {
        await clearBadge();
      }

      return result;
    } catch (error) {
      console.error('Failed to handle notification response:', error);
      return {
        bellAcknowledged: false,
        observationCreated: false
      };
    }
  }, [notificationManager, clearBadge]);

  // Set up notification listeners
  useEffect(() => {
    const receivedSubscription = Notifications.addNotificationReceivedListener(handleNotificationReceived);
    const responseSubscription = Notifications.addNotificationResponseReceivedListener(handleNotificationResponse);

    return () => {
      receivedSubscription.remove();
      responseSubscription.remove();
    };
  }, [handleNotificationReceived, handleNotificationResponse]);

  // Check permissions and refresh status on mount
  useEffect(() => {
    const initialize = async () => {
      await checkPermissions();
      await refreshScheduleStatus();
    };

    initialize();
  }, [checkPermissions, refreshScheduleStatus]);

  // Auto-schedule notifications when settings change
  useEffect(() => {
    const autoSchedule = async () => {
      if (!hasPermissions) return;

      try {
        const settings = await settingsService.getSettings();
        const today = new Date();

        const schedule = await bellScheduler.generateDailySchedule(
          today,
          settings.bellDensity,
          settings.activeWindows,
          settings.quietHours
        );

        if (schedule.length > 0) {
          await scheduleNotifications(schedule);
        }
      } catch (error) {
        console.error('Failed to auto-schedule notifications:', error);
      }
    };

    // Schedule notifications daily at midnight
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const timeUntilMidnight = tomorrow.getTime() - now.getTime();
    const scheduleTimer = setTimeout(() => {
      autoSchedule();

      // Set up daily interval
      const dailyInterval = setInterval(autoSchedule, 24 * 60 * 60 * 1000);

      return () => clearInterval(dailyInterval);
    }, timeUntilMidnight);

    return () => clearTimeout(scheduleTimer);
  }, [hasPermissions, settingsService, bellScheduler, scheduleNotifications]);

  const contextValue: NotificationContextType = {
    hasPermissions,
    isRequestingPermissions,
    permissionError,
    scheduledNotifications,
    nextNotification,
    isScheduling,
    scheduleError,
    requestPermissions,
    scheduleNotifications,
    clearAllNotifications,
    testNotification,
    refreshScheduleStatus,
    badgeCount,
    setBadgeCount,
    clearBadge,
    handleNotificationReceived,
    handleNotificationResponse
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

// Convenience hooks
export const useNotificationPermissions = () => {
  const { hasPermissions, isRequestingPermissions, permissionError, requestPermissions } = useNotifications();
  return {
    hasPermissions,
    isRequestingPermissions,
    permissionError,
    requestPermissions
  };
};

export const useNotificationSchedule = () => {
  const {
    scheduledNotifications,
    nextNotification,
    isScheduling,
    scheduleError,
    scheduleNotifications,
    clearAllNotifications,
    refreshScheduleStatus
  } = useNotifications();

  return {
    scheduledNotifications,
    nextNotification,
    isScheduling,
    scheduleError,
    scheduleNotifications,
    clearAllNotifications,
    refreshScheduleStatus
  };
};