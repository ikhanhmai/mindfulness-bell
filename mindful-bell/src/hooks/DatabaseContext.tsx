import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { DatabaseService } from '../services/DatabaseService';
import { BellSchedulerService } from '../services/BellSchedulerService';
import { NotificationManager } from '../services/NotificationManager';
import { ObservationService } from '../services/ObservationService';
import { SettingsService } from '../services/SettingsService';
import { StatsService } from '../services/StatsService';

interface DatabaseContextType {
  // Service instances
  database: DatabaseService;
  bellScheduler: BellSchedulerService;
  notificationManager: NotificationManager;
  observationService: ObservationService;
  settingsService: SettingsService;
  statsService: StatsService;

  // Initialization state
  isInitialized: boolean;
  isInitializing: boolean;
  initializationError: string | null;

  // Methods
  reinitialize: () => Promise<void>;
  getServiceHealth: () => Promise<ServiceHealthStatus>;
}

interface ServiceHealthStatus {
  database: boolean;
  notifications: boolean;
  overall: boolean;
  errors: string[];
}

const DatabaseContext = createContext<DatabaseContextType | null>(null);

interface DatabaseProviderProps {
  children: ReactNode;
}

export const DatabaseProvider: React.FC<DatabaseProviderProps> = ({ children }) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [initializationError, setInitializationError] = useState<string | null>(null);

  // Service instances (singletons)
  const database = DatabaseService.getInstance();
  const bellScheduler = BellSchedulerService.getInstance();
  const notificationManager = NotificationManager.getInstance();
  const observationService = ObservationService.getInstance();
  const settingsService = SettingsService.getInstance();
  const statsService = StatsService.getInstance();

  const initializeServices = async (): Promise<void> => {
    setIsInitializing(true);
    setInitializationError(null);

    try {
      // Initialize database first
      await database.initialize();
      console.log('✅ Database initialized');

      // Initialize notification manager
      await notificationManager.initialize();
      console.log('✅ Notifications initialized');

      // Set up notification categories
      await notificationManager.setupNotificationCategories();
      console.log('✅ Notification categories configured');

      setIsInitialized(true);
      console.log('✅ All services initialized successfully');
    } catch (error) {
      console.error('❌ Service initialization failed:', error);
      setInitializationError(error instanceof Error ? error.message : 'Unknown initialization error');
    } finally {
      setIsInitializing(false);
    }
  };

  const reinitialize = async (): Promise<void> => {
    setIsInitialized(false);
    await initializeServices();
  };

  const getServiceHealth = async (): Promise<ServiceHealthStatus> => {
    const errors: string[] = [];
    let databaseHealthy = true;
    let notificationsHealthy = true;

    try {
      // Check database health
      const testSettings = await database.getSettings();
      if (!testSettings) {
        databaseHealthy = false;
        errors.push('Database: Unable to read settings');
      }
    } catch (error) {
      databaseHealthy = false;
      errors.push(`Database: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    try {
      // Check notification permissions
      const hasPermissions = await notificationManager.requestPermissions();
      if (!hasPermissions) {
        notificationsHealthy = false;
        errors.push('Notifications: Permission denied');
      }
    } catch (error) {
      notificationsHealthy = false;
      errors.push(`Notifications: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return {
      database: databaseHealthy,
      notifications: notificationsHealthy,
      overall: databaseHealthy && notificationsHealthy,
      errors
    };
  };

  // Initialize services on mount
  useEffect(() => {
    initializeServices();
  }, []);

  const contextValue: DatabaseContextType = {
    database,
    bellScheduler,
    notificationManager,
    observationService,
    settingsService,
    statsService,
    isInitialized,
    isInitializing,
    initializationError,
    reinitialize,
    getServiceHealth
  };

  return (
    <DatabaseContext.Provider value={contextValue}>
      {children}
    </DatabaseContext.Provider>
  );
};

export const useDatabase = (): DatabaseContextType => {
  const context = useContext(DatabaseContext);
  if (!context) {
    throw new Error('useDatabase must be used within a DatabaseProvider');
  }
  return context;
};

// Individual service hooks for convenience
export const useDatabaseService = (): DatabaseService => {
  const { database } = useDatabase();
  return database;
};

export const useBellScheduler = (): BellSchedulerService => {
  const { bellScheduler } = useDatabase();
  return bellScheduler;
};

export const useNotificationManager = (): NotificationManager => {
  const { notificationManager } = useDatabase();
  return notificationManager;
};

export const useObservationService = (): ObservationService => {
  const { observationService } = useDatabase();
  return observationService;
};

export const useSettingsService = (): SettingsService => {
  const { settingsService } = useDatabase();
  return settingsService;
};

export const useStatsService = (): StatsService => {
  const { statsService } = useDatabase();
  return statsService;
};