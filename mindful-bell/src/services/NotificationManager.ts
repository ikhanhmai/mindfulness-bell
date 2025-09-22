import { Platform } from 'react-native';
import { BellEvent } from '../types';
import { DatabaseService } from './DatabaseService';

// Conditionally import Notifications only on native platforms
let Notifications: any = null;
if (Platform.OS !== 'web') {
  try {
    Notifications = require('expo-notifications'); // eslint-disable-line @typescript-eslint/no-require-imports
  } catch (error) {
    console.warn('Expo notifications not available:', error);
  }
}

export interface NotificationScheduleResult {
  scheduled: string[];
  failed: string[];
  limitations: {
    platformLimit: number;
    requested: number;
    actuallyScheduled: number;
  };
}

export interface NotificationResponse {
  identifier: string;
  actionIdentifier: string;
  userText?: string;
}

export interface BellNotificationResult {
  bellAcknowledged: boolean;
  observationCreated: boolean;
  bellEventId?: string;
}

export class NotificationManager {
  private static instance: NotificationManager;
  private db: DatabaseService;
  private isInitialized: boolean = false;
  private isWeb: boolean;

  constructor() {
    this.db = DatabaseService.getInstance();
    this.isWeb = Platform.OS === 'web';
  }

  public static getInstance(): NotificationManager {
    if (!NotificationManager.instance) {
      NotificationManager.instance = new NotificationManager();
    }
    return NotificationManager.instance;
  }

  public async initialize(): Promise<void> {
    if (this.isInitialized) return;

    // Web fallback: Skip notification setup
    if (this.isWeb || !Notifications) {
      console.warn('Notifications not available on web platform');
      this.isInitialized = false; // Keep as false for web
      return;
    }

    try {
      // Configure notification behavior
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: false,
          shouldShowBanner: true,
          shouldShowList: true,
        }),
      });

      // Request permissions
      await this.requestPermissions();

      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize notifications:', error);
      this.isInitialized = false;
    }
  }

  public async getInitializationStatus(): Promise<boolean> {
    return this.isInitialized;
  }

  public async requestPermissions(): Promise<boolean> {
    // Web fallback: No permissions available
    if (this.isWeb || !Notifications) {
      return false;
    }

    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      return finalStatus === 'granted';
    } catch (error) {
      console.error('Failed to request permissions:', error);
      return false;
    }
  }

  public async scheduleBellNotifications(
    bellEvents: BellEvent[]
  ): Promise<NotificationScheduleResult> {
    const result: NotificationScheduleResult = {
      scheduled: [],
      failed: [],
      limitations: {
        platformLimit: this.isWeb ? 0 : (Platform.OS === 'ios' ? 64 : 500),
        requested: bellEvents.length,
        actuallyScheduled: 0
      }
    };

    // Web fallback: Cannot schedule notifications
    if (this.isWeb || !Notifications) {
      result.failed = bellEvents.map(event => event.id);
      return result;
    }

    try {
      // Clear existing bell notifications first
      await this.clearBellNotifications();

      // Sort by scheduled time
      const sortedEvents = bellEvents.sort((a, b) =>
        a.scheduledTime.getTime() - b.scheduledTime.getTime()
      );

      // Apply platform limits
      const eventsToSchedule = sortedEvents.slice(0, result.limitations.platformLimit);

      for (const bellEvent of eventsToSchedule) {
        try {
          const notificationId = await this.scheduleSingleBellNotification(bellEvent);
          result.scheduled.push(notificationId);
        } catch (error) {
          console.error('Failed to schedule notification:', error);
          result.failed.push(bellEvent.id);
        }
      }

      result.limitations.actuallyScheduled = result.scheduled.length;
    } catch (error) {
      console.error('Failed to schedule bell notifications:', error);
      result.failed = bellEvents.map(event => event.id);
    }

    return result;
  }

  private async scheduleSingleBellNotification(bellEvent: BellEvent): Promise<string> {
    // Web fallback: Cannot schedule individual notifications
    if (this.isWeb || !Notifications) {
      throw new Error('Notifications not available on web platform');
    }

    const settings = await this.db.getSettings();

    const notificationContent: any = {
      title: '🔔 Mindful Bell',
      body: 'Take a moment to be present',
      data: {
        bellEventId: bellEvent.id,
        type: 'bell'
      },
      sound: settings.soundEnabled ? true : false,
      priority: Notifications.AndroidNotificationPriority?.HIGH,
      categoryIdentifier: 'BELL_CATEGORY'
    };

    const trigger: any = {
      type: Notifications.SchedulableTriggerInputTypes?.DATE,
      date: bellEvent.scheduledTime,
    };

    return await Notifications.scheduleNotificationAsync({
      content: notificationContent,
      trigger,
      identifier: `bell-${bellEvent.id}`
    });
  }

  public async clearBellNotifications(): Promise<void> {
    // Web fallback: No notifications to clear
    if (this.isWeb || !Notifications) {
      return;
    }

    try {
      const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();

      const bellNotificationIds = scheduledNotifications
        .filter((notification: any) =>
          notification.identifier.startsWith('bell-') ||
          notification.content.data?.type === 'bell'
        )
        .map((notification: any) => notification.identifier);

      if (bellNotificationIds.length > 0) {
        for (const id of bellNotificationIds) {
          await Notifications.cancelScheduledNotificationAsync(id);
        }
      }
    } catch (error) {
      console.error('Failed to clear bell notifications:', error);
    }
  }

  public async handleNotificationResponse(
    response: NotificationResponse
  ): Promise<BellNotificationResult> {
    const result: BellNotificationResult = {
      bellAcknowledged: false,
      observationCreated: false
    };

    // Extract bell event ID from notification identifier
    if (response.identifier && response.identifier.startsWith('bell-')) {
      const bellEventId = response.identifier.replace('bell-', '');
      result.bellEventId = bellEventId;

      try {
        // Mark bell as acknowledged in database
        await this.acknowledgeBell(bellEventId);
        result.bellAcknowledged = true;

        // If user provided text, create an observation
        if (response.userText && response.userText.trim().length > 0) {
          await this.createObservationFromBell(bellEventId, response.userText.trim());
          result.observationCreated = true;
        }
      } catch (error) {
        console.error('Failed to handle notification response:', error);
      }
    }

    return result;
  }

  private async acknowledgeBell(bellEventId: string): Promise<void> {
    // This would update the bell_events table to mark as acknowledged
    // For now, we'll create a placeholder implementation
    console.log(`Acknowledging bell: ${bellEventId}`);
  }

  private async createObservationFromBell(
    bellEventId: string,
    content: string
  ): Promise<void> {
    // This would create an observation linked to the bell event
    // For now, we'll create a placeholder implementation
    console.log(`Creating observation for bell ${bellEventId}: ${content}`);
  }

  public async setupNotificationCategories(): Promise<void> {
    // Web fallback: No notification categories
    if (this.isWeb || !Notifications) {
      return;
    }

    try {
      // Define notification categories with actions
      await Notifications.setNotificationCategoryAsync('BELL_CATEGORY', [
        {
          identifier: 'acknowledge',
          buttonTitle: 'Acknowledge',
          options: {
            opensAppToForeground: false,
          },
        },
        {
          identifier: 'observe',
          buttonTitle: 'Quick Note',
          textInput: {
            submitButtonTitle: 'Save',
            placeholder: 'What did you observe?'
          },
          options: {
            opensAppToForeground: false,
          },
        },
      ]);
    } catch (error) {
      console.error('Failed to setup notification categories:', error);
    }
  }

  public async getScheduledNotificationsCount(): Promise<number> {
    // Web fallback: No scheduled notifications
    if (this.isWeb || !Notifications) {
      return 0;
    }

    try {
      const scheduled = await Notifications.getAllScheduledNotificationsAsync();
      return scheduled.filter((n: any) =>
        n.identifier.startsWith('bell-') ||
        n.content.data?.type === 'bell'
      ).length;
    } catch (error) {
      console.error('Failed to get scheduled notifications count:', error);
      return 0;
    }
  }

  public async getNextScheduledNotification(): Promise<Date | null> {
    // Web fallback: No scheduled notifications
    if (this.isWeb || !Notifications) {
      return null;
    }

    try {
      const scheduled = await Notifications.getAllScheduledNotificationsAsync();
      const bellNotifications = scheduled.filter((n: any) =>
        n.identifier.startsWith('bell-') ||
        n.content.data?.type === 'bell'
      );

      if (bellNotifications.length === 0) return null;

      const nextNotification = bellNotifications
        .map((n: any) => n.trigger)
        .filter((trigger: any) => trigger && 'date' in trigger && trigger.date)
        .map((trigger: any) => new Date(trigger.date))
        .sort((a: any, b: any) => a.getTime() - b.getTime())[0];

      return nextNotification || null;
    } catch (error) {
      console.error('Failed to get next scheduled notification:', error);
      return null;
    }
  }

  public async testNotification(): Promise<string> {
    // Web fallback: Cannot send test notifications
    if (this.isWeb || !Notifications) {
      return '';
    }

    try {
      const settings = await this.db.getSettings();

      return await Notifications.scheduleNotificationAsync({
        content: {
          title: '🔔 Test Bell',
          body: 'This is a test notification',
          sound: settings.soundEnabled,
          data: { type: 'test' }
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes?.TIME_INTERVAL,
          seconds: 1,
        },
      });
    } catch (error) {
      console.error('Failed to send test notification:', error);
      return '';
    }
  }

  public async cancelAllNotifications(): Promise<void> {
    // Web fallback: No notifications to cancel
    if (this.isWeb || !Notifications) {
      return;
    }

    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Failed to cancel all notifications:', error);
    }
  }

  public async getBadgeCount(): Promise<number> {
    // Web fallback: No badge support
    if (this.isWeb || !Notifications) {
      return 0;
    }

    try {
      return await Notifications.getBadgeCountAsync();
    } catch (error) {
      console.error('Failed to get badge count:', error);
      return 0;
    }
  }

  public async setBadgeCount(count: number): Promise<void> {
    // Web fallback: No badge support
    if (this.isWeb || !Notifications) {
      return;
    }

    try {
      await Notifications.setBadgeCountAsync(count);
    } catch (error) {
      console.error('Failed to set badge count:', error);
    }
  }

  public async clearBadge(): Promise<void> {
    // Web fallback: No badge support
    if (this.isWeb || !Notifications) {
      return;
    }

    try {
      await Notifications.setBadgeCountAsync(0);
    } catch (error) {
      console.error('Failed to clear badge:', error);
    }
  }
}