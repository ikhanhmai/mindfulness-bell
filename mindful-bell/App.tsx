import React, { useEffect, useState } from 'react';
import { Platform, AppState as RNAppState, AppStateStatus, Linking } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import * as Notifications from 'expo-notifications';

// Components
import ErrorBoundary from './src/components/ErrorBoundary';
import HomeScreen from './src/screens/HomeScreen';
import ObservationsScreen from './src/screens/ObservationsScreen';
import StatsScreen from './src/screens/StatsScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';
import LoadingScreen from './src/screens/LoadingScreen';

// Context Providers
import { DatabaseProvider } from './src/hooks/DatabaseContext';
import { SettingsProvider } from './src/hooks/SettingsContext';
import { NotificationProvider } from './src/hooks/NotificationContext';

// Services
import { DatabaseService } from './src/services/DatabaseService';
import { NotificationManager } from './src/services/NotificationManager';
import { BackgroundTaskManager } from './src/services/BackgroundTasks';

// Types

const Tab = createBottomTabNavigator();

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

interface AppState {
  isLoading: boolean;
  isFirstLaunch: boolean;
  initializationError: string | null;
  servicesReady: boolean;
}

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>({
    isLoading: true,
    isFirstLaunch: false,
    initializationError: null,
    servicesReady: false
  });

  // Service instances
  const databaseService = DatabaseService.getInstance();
  const notificationManager = NotificationManager.getInstance();
  const backgroundTasks = BackgroundTaskManager.getInstance();

  useEffect(() => {
    initializeApp();
    setupAppStateListener();
    setupNotificationListeners();
    setupDeepLinking();

    return () => {
      cleanupApp();
    };
  }, []);

  const initializeApp = async () => {
    try {
      console.log('🚀 Initializing Mindful Bell App...');

      // Step 1: Initialize database
      await databaseService.initialize();
      console.log('✅ Database initialized');

      // Step 2: Check if first launch
      const settings = await databaseService.getSettings();
      const isFirstLaunch = !settings;

      if (isFirstLaunch) {
        console.log('👋 First launch detected');
        await setupDefaultSettings();
      }

      // Step 3: Initialize notification system
      await notificationManager.initialize();
      const hasPermissions = await notificationManager.requestPermissions();

      if (!hasPermissions) {
        console.warn('⚠️ Notification permissions not granted');
      }
      console.log('✅ Notifications initialized');

      // Step 4: Initialize background tasks
      await backgroundTasks.initialize();
      console.log('✅ Background tasks initialized');

      // Step 5: Health check all services
      const servicesHealthy = await checkServicesHealth();

      setAppState({
        isLoading: false,
        isFirstLaunch,
        initializationError: null,
        servicesReady: servicesHealthy
      });

      console.log('🎉 App initialization complete');

    } catch (error) {
      console.error('❌ App initialization failed:', error);
      setAppState({
        isLoading: false,
        isFirstLaunch: false,
        initializationError: error instanceof Error ? error.message : 'Unknown error',
        servicesReady: false
      });
    }
  };

  const setupDefaultSettings = async () => {
    try {
      const defaultSettings = {
        bellDensity: 'medium' as const,
        activeWindows: [
          { start: '09:00', end: '12:00' },
          { start: '14:00', end: '17:00' },
          { start: '19:00', end: '21:00' }
        ],
        quietHours: [
          { start: '22:00', end: '07:00' }
        ]
      };

      await databaseService.updateSettings(defaultSettings);
      console.log('✅ Default settings configured');
    } catch (error) {
      console.error('❌ Failed to setup default settings:', error);
    }
  };

  const checkServicesHealth = async (): Promise<boolean> => {
    try {
      // Check database health
      const dbHealthy = await databaseService.isHealthy();
      if (!dbHealthy) {
        console.warn('⚠️ Database service unhealthy');
        return false;
      }

      // Check notification manager health
      const notificationHealthy = await notificationManager.getInitializationStatus();
      if (!notificationHealthy) {
        console.warn('⚠️ Notification service unhealthy');
        return false;
      }

      // Check background tasks
      const backgroundHealthy = await backgroundTasks.areTasksRunning();
      if (!backgroundHealthy) {
        console.warn('⚠️ Background tasks not running');
        // Try to restart
        await backgroundTasks.startAllTasks();
      }

      return true;
    } catch (error) {
      console.error('❌ Service health check failed:', error);
      return false;
    }
  };

  const setupAppStateListener = () => {
    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      console.log(`📱 App state changed to: ${nextAppState}`);

      try {
        await backgroundTasks.handleAppStateChange(nextAppState);

        if (nextAppState === 'active') {
          // App became active - check service health
          const healthy = await checkServicesHealth();
          if (!healthy) {
            console.log('🔄 Attempting service recovery...');
            await initializeApp();
          }
        }
      } catch (error) {
        console.error('❌ App state change handling failed:', error);
      }
    };

    RNAppState.addEventListener('change', handleAppStateChange);
  };

  const setupNotificationListeners = () => {
    // Handle notification responses
    const responseSubscription = Notifications.addNotificationResponseReceivedListener(
      async (response) => {
        try {
          console.log('🔔 Notification response received:', response.actionIdentifier);

          // Convert Expo NotificationResponse to our interface
          const convertedResponse = {
            identifier: response.notification.request.identifier,
            actionIdentifier: response.actionIdentifier,
            userText: response.userText,
            notification: response.notification
          };

          await notificationManager.handleNotificationResponse(convertedResponse);
        } catch (error) {
          console.error('❌ Notification response handling failed:', error);
        }
      }
    );

    // Handle notifications received while app is open
    const notificationSubscription = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log('🔔 Notification received while app open:', notification.request.identifier);
      }
    );

    return () => {
      responseSubscription.remove();
      notificationSubscription.remove();
    };
  };

  const setupDeepLinking = () => {
    const handleDeepLink = (url: string) => {
      console.log('🔗 Deep link received:', url);

      // Parse URL and handle bell acknowledgment deep links
      if (url.includes('/bell/acknowledge/')) {
        const bellId = url.split('/').pop();
        if (bellId) {
          // Navigate to bell acknowledgment
          console.log('🔔 Navigating to bell acknowledgment for:', bellId);
        }
      }
    };

    // Handle initial URL if app was opened from deep link
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink(url);
      }
    });

    // Handle subsequent deep links
    const linkingSubscription = Linking.addEventListener('url', (event) => {
      handleDeepLink(event.url);
    });

    return () => {
      linkingSubscription?.remove();
    };
  };

  const cleanupApp = async () => {
    try {
      console.log('🧹 Cleaning up app resources...');
      await backgroundTasks.shutdown();
      console.log('✅ App cleanup complete');
    } catch (error) {
      console.error('❌ App cleanup failed:', error);
    }
  };

  const handleOnboardingComplete = async () => {
    try {
      setAppState(prev => ({ ...prev, isFirstLaunch: false }));

      // Ensure background tasks are running after onboarding
      await backgroundTasks.startAllTasks();

      console.log('✅ Onboarding completed');
    } catch (error) {
      console.error('❌ Onboarding completion failed:', error);
    }
  };

  const MainApp = () => (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            paddingBottom: Platform.OS === 'ios' ? 20 : 5,
            height: Platform.OS === 'ios' ? 80 : 60,
          }
        }}
      >
        <Tab.Screen
          name="Home"
          component={HomeScreen}
          options={{
            tabBarLabel: 'Home'
          }}
        />
        <Tab.Screen
          name="Observations"
          component={ObservationsScreen}
          options={{
            tabBarLabel: 'Observations'
          }}
        />
        <Tab.Screen
          name="Stats"
          component={StatsScreen}
          options={{
            tabBarLabel: 'Stats'
          }}
        />
        <Tab.Screen
          name="Settings"
          component={SettingsScreen}
          options={{
            tabBarLabel: 'Settings'
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );

  if (appState.isLoading) {
    return (
      <ErrorBoundary>
        <LoadingScreen />
      </ErrorBoundary>
    );
  }

  if (appState.initializationError) {
    return (
      <ErrorBoundary>
        <LoadingScreen
          error={appState.initializationError}
          onRetry={initializeApp}
        />
      </ErrorBoundary>
    );
  }

  if (appState.isFirstLaunch) {
    return (
      <ErrorBoundary>
        <DatabaseProvider>
          <SettingsProvider>
            <NotificationProvider>
              <OnboardingScreen onComplete={handleOnboardingComplete} />
            </NotificationProvider>
          </SettingsProvider>
        </DatabaseProvider>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <DatabaseProvider>
        <SettingsProvider>
          <NotificationProvider>
            <MainApp />
          </NotificationProvider>
        </SettingsProvider>
      </DatabaseProvider>
    </ErrorBoundary>
  );
};

export default App;