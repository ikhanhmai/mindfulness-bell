import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { BellEvent } from '../types';
import { DatabaseService } from './DatabaseService';

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

  constructor() {
    this.db = DatabaseService.getInstance();
  }

  public static getInstance(): NotificationManager {
    if (!NotificationManager.instance) {
      NotificationManager.instance = new NotificationManager();
    }
    return NotificationManager.instance;
  }

  public async initialize(): Promise<void> {
    if (this.isInitialized) return;

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
  }

  public async requestPermissions(): Promise<boolean> {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    return finalStatus === 'granted';
  }

  public async scheduleBellNotifications(
    bellEvents: BellEvent[]
  ): Promise<NotificationScheduleResult> {
    const result: NotificationScheduleResult = {
      scheduled: [],
      failed: [],
      limitations: {
        platformLimit: Platform.OS === 'ios' ? 64 : 500,
        requested: bellEvents.length,
        actuallyScheduled: 0
      }
    };

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

    return result;
  }

  private async scheduleSingleBellNotification(bellEvent: BellEvent): Promise<string> {
    const settings = await this.db.getSettings();

    const notificationContent: Notifications.NotificationContentInput = {
      title: '🔔 Mindful Bell',
      body: 'Take a moment to be present',
      data: {
        bellEventId: bellEvent.id,
        type: 'bell'
      },
      sound: settings.soundEnabled ? true : false,
      priority: Notifications.AndroidNotificationPriority.HIGH,
      categoryIdentifier: 'BELL_CATEGORY'
    };

    const trigger: Notifications.DateTriggerInput = {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: bellEvent.scheduledTime,
    };

    return await Notifications.scheduleNotificationAsync({
      content: notificationContent,
      trigger,
      identifier: `bell-${bellEvent.id}`
    });
  }

  public async clearBellNotifications(): Promise<void> {
    const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();

    const bellNotificationIds = scheduledNotifications
      .filter(notification =>
        notification.identifier.startsWith('bell-') ||
        notification.content.data?.type === 'bell'
      )
      .map(notification => notification.identifier);

    if (bellNotificationIds.length > 0) {
      for (const id of bellNotificationIds) {
        await Notifications.cancelScheduledNotificationAsync(id);
      }
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
    if (response.identifier.startsWith('bell-')) {
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
  }

  public async getScheduledNotificationsCount(): Promise<number> {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    return scheduled.filter(n =>
      n.identifier.startsWith('bell-') ||
      n.content.data?.type === 'bell'
    ).length;
  }

  public async getNextScheduledNotification(): Promise<Date | null> {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    const bellNotifications = scheduled.filter(n =>
      n.identifier.startsWith('bell-') ||
      n.content.data?.type === 'bell'
    );

    if (bellNotifications.length === 0) return null;

    const nextNotification = bellNotifications
      .map(n => n.trigger)
      .filter(trigger => trigger && 'date' in trigger && trigger.date)
      .map(trigger => new Date((trigger as any).date))
      .sort((a, b) => a.getTime() - b.getTime())[0];

    return nextNotification || null;
  }

  public async testNotification(): Promise<string> {
    const settings = await this.db.getSettings();

    return await Notifications.scheduleNotificationAsync({
      content: {
        title: '🔔 Test Bell',
        body: 'This is a test notification',
        sound: settings.soundEnabled,
        data: { type: 'test' }
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: 1,
      },
    });
  }

  public async cancelAllNotifications(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }

  public async getBadgeCount(): Promise<number> {
    return await Notifications.getBadgeCountAsync();
  }

  public async setBadgeCount(count: number): Promise<void> {
    await Notifications.setBadgeCountAsync(count);
  }

  public async clearBadge(): Promise<void> {
    await Notifications.setBadgeCountAsync(0);
  }
}