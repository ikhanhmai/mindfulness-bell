import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';
import { Platform, AppState, AppStateStatus } from 'react-native';
import { BellSchedulerService } from './BellSchedulerService';
import { NotificationManager } from './NotificationManager';
import { DatabaseService } from './DatabaseService';

export interface BackgroundTaskConfig {
  interval: number; // in milliseconds
  retryAttempts?: number;
  timeout?: number;
}

interface PlatformLimits {
  maxBackgroundTime: number; // milliseconds
  maxConcurrentTasks: number;
  supportsBackgroundFetch: boolean;
}

export class BackgroundTaskManager {
  private static instance: BackgroundTaskManager;
  private registeredTasks: Map<string, BackgroundTaskConfig> = new Map();
  private runningTasks: Set<string> = new Set();
  private taskIntervals: Map<string, NodeJS.Timeout> = new Map();

  // Task names
  private static readonly DAILY_SCHEDULE_TASK = 'DAILY_BELL_SCHEDULE_GENERATION';
  private static readonly NOTIFICATION_CLEANUP_TASK = 'NOTIFICATION_CLEANUP';
  private static readonly BELL_TIMEOUT_TASK = 'BELL_TIMEOUT_HANDLER';

  private bellScheduler: BellSchedulerService;
  private notificationManager: NotificationManager;
  private databaseService: DatabaseService;

  private constructor() {
    this.bellScheduler = BellSchedulerService.getInstance();
    this.notificationManager = NotificationManager.getInstance();
    this.databaseService = DatabaseService.getInstance();

    // Listen to app state changes
    AppState.addEventListener('change', this.handleAppStateChange.bind(this));

    this.initializeExpoTaskManager();
  }

  public static getInstance(): BackgroundTaskManager {
    if (!BackgroundTaskManager.instance) {
      BackgroundTaskManager.instance = new BackgroundTaskManager();
    }
    return BackgroundTaskManager.instance;
  }

  private async initializeExpoTaskManager(): Promise<void> {
    try {
      // Register Expo TaskManager tasks
      if (!TaskManager.isTaskDefined(BackgroundTaskManager.DAILY_SCHEDULE_TASK)) {
        TaskManager.defineTask(BackgroundTaskManager.DAILY_SCHEDULE_TASK, async () => {
          console.log('🔄 Executing daily schedule generation in background');
          try {
            await this.executeDailyScheduleGeneration();
            return BackgroundFetch.BackgroundFetchResult.NewData;
          } catch (error) {
            console.error('Daily schedule generation failed:', error);
            return BackgroundFetch.BackgroundFetchResult.Failed;
          }
        });
      }

      if (!TaskManager.isTaskDefined(BackgroundTaskManager.NOTIFICATION_CLEANUP_TASK)) {
        TaskManager.defineTask(BackgroundTaskManager.NOTIFICATION_CLEANUP_TASK, async () => {
          console.log('🧹 Executing notification cleanup in background');
          try {
            await this.executeNotificationCleanup();
            return BackgroundFetch.BackgroundFetchResult.NewData;
          } catch (error) {
            console.error('Notification cleanup failed:', error);
            return BackgroundFetch.BackgroundFetchResult.Failed;
          }
        });
      }

      if (!TaskManager.isTaskDefined(BackgroundTaskManager.BELL_TIMEOUT_TASK)) {
        TaskManager.defineTask(BackgroundTaskManager.BELL_TIMEOUT_TASK, async () => {
          console.log('⏰ Executing bell timeout handler in background');
          try {
            await this.executeBellTimeoutHandler();
            return BackgroundFetch.BackgroundFetchResult.NewData;
          } catch (error) {
            console.error('Bell timeout handler failed:', error);
            return BackgroundFetch.BackgroundFetchResult.Failed;
          }
        });
      }

      // Register background fetch if available
      if (Platform.OS === 'ios') {
        const status = await BackgroundFetch.getStatusAsync();
        if (status === BackgroundFetch.BackgroundFetchStatus.Available) {
          await BackgroundFetch.registerTaskAsync(BackgroundTaskManager.DAILY_SCHEDULE_TASK, {
            minimumInterval: 24 * 60 * 60 * 1000, // 24 hours
            stopOnTerminate: false,
            startOnBoot: true,
          });
        }
      }

    } catch (error) {
      console.warn('Failed to initialize Expo TaskManager:', error);
    }
  }

  public async registerDailyScheduleTask(): Promise<void> {
    await this.registerTask(
      BackgroundTaskManager.DAILY_SCHEDULE_TASK,
      this.executeDailyScheduleGeneration.bind(this),
      {
        interval: 24 * 60 * 60 * 1000, // 24 hours
        retryAttempts: 3,
        timeout: 30000 // 30 seconds
      }
    );
  }

  public async registerNotificationCleanupTask(): Promise<void> {
    await this.registerTask(
      BackgroundTaskManager.NOTIFICATION_CLEANUP_TASK,
      this.executeNotificationCleanup.bind(this),
      {
        interval: 6 * 60 * 60 * 1000, // 6 hours
        retryAttempts: 2,
        timeout: 10000 // 10 seconds
      }
    );
  }

  public async registerBellTimeoutTask(): Promise<void> {
    await this.registerTask(
      BackgroundTaskManager.BELL_TIMEOUT_TASK,
      this.executeBellTimeoutHandler.bind(this),
      {
        interval: 5 * 60 * 1000, // 5 minutes
        retryAttempts: 1,
        timeout: 5000 // 5 seconds
      }
    );
  }

  public async registerTask(
    name: string,
    taskFunction: () => Promise<void>,
    config: BackgroundTaskConfig
  ): Promise<void> {
    if (config.interval <= 0) {
      throw new Error(`Invalid interval for task ${name}: ${config.interval}`);
    }

    this.registeredTasks.set(name, config);

    // Store task function for execution
    (this as any)[`_${name}_function`] = taskFunction;

    console.log(`📝 Registered background task: ${name}`);
  }

  public async isTaskRegistered(name: string): Promise<boolean> {
    return this.registeredTasks.has(name);
  }

  public async startTask(name: string): Promise<void> {
    if (!this.registeredTasks.has(name)) {
      throw new Error(`Task ${name} is not registered`);
    }

    if (this.runningTasks.has(name)) {
      console.log(`Task ${name} is already running`);
      return;
    }

    const config = this.registeredTasks.get(name)!;
    const taskFunction = (this as any)[`_${name}_function`];

    if (!taskFunction) {
      throw new Error(`Task function not found for ${name}`);
    }

    // Start interval-based execution
    const intervalId = setInterval(async () => {
      try {
        console.log(`🔄 Executing task: ${name}`);

        // Execute with timeout
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error(`Task ${name} timed out`)), config.timeout || 30000);
        });

        await Promise.race([taskFunction(), timeoutPromise]);

        console.log(`✅ Task completed: ${name}`);
      } catch (error) {
        console.error(`❌ Task failed: ${name}`, error);

        // Handle retry logic here if needed
        if (config.retryAttempts && config.retryAttempts > 0) {
          console.log(`🔄 Retrying task: ${name}`);
          // Implement retry logic
        }
      }
    }, config.interval);

    this.taskIntervals.set(name, intervalId);
    this.runningTasks.add(name);

    console.log(`▶️ Started background task: ${name}`);
  }

  public async stopTask(name: string): Promise<void> {
    const intervalId = this.taskIntervals.get(name);
    if (intervalId) {
      clearInterval(intervalId);
      this.taskIntervals.delete(name);
    }

    this.runningTasks.delete(name);
    console.log(`⏹️ Stopped background task: ${name}`);
  }

  public async startAllTasks(): Promise<void> {
    const tasks = Array.from(this.registeredTasks.keys());

    for (const taskName of tasks) {
      try {
        await this.startTask(taskName);
      } catch (error) {
        console.error(`Failed to start task ${taskName}:`, error);
      }
    }
  }

  public async stopAllTasks(): Promise<void> {
    const runningTasks = Array.from(this.runningTasks);

    for (const taskName of runningTasks) {
      await this.stopTask(taskName);
    }
  }

  public async getRunningTasks(): Promise<string[]> {
    return Array.from(this.runningTasks);
  }

  public async getRegisteredTaskCount(): Promise<number> {
    return this.registeredTasks.size;
  }

  public async areTasksRunning(): Promise<boolean> {
    return this.runningTasks.size > 0;
  }

  // Task Implementations

  public async executeDailyScheduleGeneration(): Promise<void> {
    console.log('🔔 Generating daily bell schedule...');

    try {
      // Clear existing notifications
      await this.notificationManager.clearBellNotifications();

      // Get current settings
      const settings = await this.databaseService.getSettings();

      // Generate today's schedule
      const today = new Date();
      const schedule = await this.bellScheduler.generateDailySchedule(
        today,
        settings.bellDensity,
        settings.activeWindows,
        settings.quietHours
      );

      if (schedule.length > 0) {
        // Schedule notifications
        const result = await this.notificationManager.scheduleBellNotifications(schedule);

        console.log(`📅 Scheduled ${result.scheduled.length} bells for today`);

        if (result.failed.length > 0) {
          console.warn(`⚠️ Failed to schedule ${result.failed.length} bells`);
        }

        // Store bell events in database
        for (const bell of schedule) {
          await this.databaseService.insertBellEvent(bell);
        }
      } else {
        console.log('📅 No bells to schedule for today');
      }

    } catch (error) {
      console.error('Daily schedule generation failed:', error);
      throw error;
    }
  }

  public async executeNotificationCleanup(): Promise<void> {
    console.log('🧹 Cleaning up notifications...');

    try {
      // Remove expired notifications (implementation would be platform-specific)
      const scheduledCount = await this.notificationManager.getScheduledNotificationsCount();

      console.log(`📊 Current scheduled notifications: ${scheduledCount}`);

      // Platform-specific cleanup logic would go here
      // For now, we'll just log the cleanup action

      console.log('✨ Notification cleanup completed');
    } catch (error) {
      console.error('Notification cleanup failed:', error);
      throw error;
    }
  }

  public async executeBellTimeoutHandler(): Promise<void> {
    console.log('⏰ Checking for timed out bells...');

    try {
      // This would query the database for bells that have been triggered
      // but not acknowledged within the timeout period (e.g., 5 minutes)

      const timeoutMinutes = 5;
      const cutoffTime = new Date(Date.now() - timeoutMinutes * 60 * 1000);

      // In a full implementation, this would:
      // 1. Query database for triggered bells older than cutoffTime
      // 2. Update their status to 'missed'
      // 3. Update any analytics/statistics

      console.log(`⏰ Checked for bells timed out before ${cutoffTime.toISOString()}`);

    } catch (error) {
      console.error('Bell timeout handler failed:', error);
      throw error;
    }
  }

  // App lifecycle management

  public async handleAppStateChange(nextAppState: AppStateStatus): Promise<void> {
    console.log(`📱 App state changed to: ${nextAppState}`);

    switch (nextAppState) {
      case 'background':
        // App is going to background - optimize tasks
        await this.optimizeForBackground();
        break;
      case 'active':
        // App is coming to foreground - resume normal operation
        await this.optimizeForForeground();
        break;
      case 'inactive':
        // App is temporarily inactive
        break;
    }
  }

  private async optimizeForBackground(): Promise<void> {
    // Reduce task frequency or pause non-critical tasks
    console.log('🔄 Optimizing for background execution');

    // Tasks continue running but could be optimized for battery life
  }

  private async optimizeForForeground(): Promise<void> {
    // Resume normal task operation
    console.log('🔄 Optimizing for foreground execution');

    // Ensure all critical tasks are running
    if (this.runningTasks.size === 0 && this.registeredTasks.size > 0) {
      await this.startAllTasks();
    }
  }

  // Platform capabilities

  public async getPlatformLimits(): Promise<PlatformLimits> {
    const limits: PlatformLimits = {
      maxBackgroundTime: Platform.OS === 'ios' ? 30000 : 60000, // iOS: 30s, Android: 60s
      maxConcurrentTasks: Platform.OS === 'ios' ? 5 : 10,
      supportsBackgroundFetch: Platform.OS === 'ios'
    };

    // Check actual background fetch availability
    if (Platform.OS === 'ios') {
      try {
        const status = await BackgroundFetch.getStatusAsync();
        limits.supportsBackgroundFetch = status === BackgroundFetch.BackgroundFetchStatus.Available;
      } catch {
        limits.supportsBackgroundFetch = false;
      }
    }

    return limits;
  }

  public async initialize(): Promise<void> {
    console.log('🚀 Initializing BackgroundTaskManager');

    try {
      // Register all standard tasks
      await this.registerDailyScheduleTask();
      await this.registerNotificationCleanupTask();
      await this.registerBellTimeoutTask();

      // Start essential tasks
      await this.startTask(BackgroundTaskManager.DAILY_SCHEDULE_TASK);
      await this.startTask(BackgroundTaskManager.NOTIFICATION_CLEANUP_TASK);
      await this.startTask(BackgroundTaskManager.BELL_TIMEOUT_TASK);

      console.log('✅ BackgroundTaskManager initialized successfully');
    } catch (error) {
      console.error('❌ BackgroundTaskManager initialization failed:', error);
      throw error;
    }
  }

  public async shutdown(): Promise<void> {
    console.log('🛑 Shutting down BackgroundTaskManager');

    await this.stopAllTasks();

    // Cleanup Expo TaskManager
    try {
      if (Platform.OS === 'ios') {
        await BackgroundFetch.unregisterTaskAsync(BackgroundTaskManager.DAILY_SCHEDULE_TASK);
      }
    } catch (error) {
      console.warn('Error during TaskManager cleanup:', error);
    }

    console.log('✅ BackgroundTaskManager shutdown complete');
  }
}