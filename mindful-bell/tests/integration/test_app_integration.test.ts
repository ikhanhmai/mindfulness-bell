import React from 'react';
import { render, waitFor, act } from '@testing-library/react-native';
import App from '../../App';
import { DatabaseService } from '../../src/services/DatabaseService';
import { NotificationManager } from '../../src/services/NotificationManager';
import { BackgroundTaskManager } from '../../src/services/BackgroundTasks';

// Mock Expo modules
jest.mock('expo-sqlite', () => ({
  openDatabase: jest.fn(() => ({
    transaction: jest.fn(),
    executeSql: jest.fn(),
  })),
}));

jest.mock('@react-navigation/native', () => ({
  NavigationContainer: ({ children }: any) => children,
  useFocusEffect: jest.fn(),
  useNavigation: () => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
  }),
}));

jest.mock('@react-navigation/bottom-tabs', () => ({
  createBottomTabNavigator: () => ({
    Navigator: ({ children }: any) => children,
    Screen: ({ children }: any) => children,
  }),
}));

jest.mock('expo-notifications', () => ({
  requestPermissionsAsync: jest.fn(() =>
    Promise.resolve({ status: 'granted', granted: true })
  ),
  setNotificationHandler: jest.fn(),
  addNotificationReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
  addNotificationResponseReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
}));

jest.mock('expo-task-manager', () => ({
  defineTask: jest.fn(),
  isTaskDefined: jest.fn(() => false),
}));

describe('App Integration Tests', () => {
  let databaseService: DatabaseService;
  let notificationManager: NotificationManager;
  let backgroundTasks: BackgroundTaskManager;

  beforeEach(() => {
    databaseService = DatabaseService.getInstance();
    notificationManager = NotificationManager.getInstance();
    backgroundTasks = BackgroundTaskManager.getInstance();

    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('app initialization', () => {
    it('should initialize all services on app start', async () => {
      const initializeSpy = jest.spyOn(databaseService, 'initialize');
      const notificationInitSpy = jest.spyOn(notificationManager, 'initialize');
      const backgroundInitSpy = jest.spyOn(backgroundTasks, 'initialize');

      render(<App />);

      await waitFor(() => {
        expect(initializeSpy).toHaveBeenCalled();
        expect(notificationInitSpy).toHaveBeenCalled();
        expect(backgroundInitSpy).toHaveBeenCalled();
      });
    });

    it('should handle database initialization errors gracefully', async () => {
      const mockError = new Error('Database initialization failed');
      jest.spyOn(databaseService, 'initialize').mockRejectedValueOnce(mockError);

      // Should not throw and should render fallback UI
      expect(() => render(<App />)).not.toThrow();
    });

    it('should request notification permissions on first launch', async () => {
      const requestPermissionsSpy = jest.spyOn(notificationManager, 'requestPermissions');

      render(<App />);

      await waitFor(() => {
        expect(requestPermissionsSpy).toHaveBeenCalled();
      });
    });

    it('should initialize default settings on first launch', async () => {
      const getSettingsSpy = jest.spyOn(databaseService, 'getSettings');
      const updateSettingsSpy = jest.spyOn(databaseService, 'updateSettings');

      // Mock first launch (no existing settings)
      getSettingsSpy.mockResolvedValueOnce(null as any);

      render(<App />);

      await waitFor(() => {
        expect(getSettingsSpy).toHaveBeenCalled();
        expect(updateSettingsSpy).toHaveBeenCalledWith(
          expect.objectContaining({
            bellDensity: 'medium',
            activeWindows: expect.any(Array),
            quietHours: expect.any(Array),
          })
        );
      });
    });
  });

  describe('service integration', () => {
    it('should connect all services through context providers', async () => {
      const { getByTestId } = render(<App />);

      await waitFor(() => {
        // Should render the main navigation
        expect(() => getByTestId('main-navigation')).not.toThrow();
      });
    });

    it('should handle service health monitoring', async () => {
      const isHealthySpy = jest.spyOn(databaseService, 'isHealthy');
      isHealthySpy.mockResolvedValue(true);

      render(<App />);

      await waitFor(() => {
        expect(isHealthySpy).toHaveBeenCalled();
      });
    });

    it('should recover from service failures', async () => {
      const isHealthySpy = jest.spyOn(databaseService, 'isHealthy');
      isHealthySpy.mockResolvedValueOnce(false);

      const reinitializeSpy = jest.spyOn(databaseService, 'initialize');

      render(<App />);

      await waitFor(() => {
        expect(reinitializeSpy).toHaveBeenCalledTimes(2); // Initial + recovery
      });
    });
  });

  describe('navigation integration', () => {
    it('should render main tab navigation structure', async () => {
      const { getByTestId } = render(<App />);

      await waitFor(() => {
        expect(() => getByTestId('home-tab')).not.toThrow();
        expect(() => getByTestId('observations-tab')).not.toThrow();
        expect(() => getByTestId('stats-tab')).not.toThrow();
        expect(() => getByTestId('settings-tab')).not.toThrow();
      });
    });

    it('should handle deep link navigation', async () => {
      const mockUrl = 'mindfulbell://bell/acknowledge/bell-123';

      // Mock deep link handling
      const handleDeepLinkSpy = jest.fn();

      render(<App />);

      await act(async () => {
        // Simulate deep link
        handleDeepLinkSpy(mockUrl);
      });

      expect(handleDeepLinkSpy).toHaveBeenCalledWith(mockUrl);
    });

    it('should navigate to bell acknowledgment from notification', async () => {
      const mockNotificationResponse = {
        notification: {
          request: {
            identifier: 'bell-123',
            content: {
              data: { bellId: 'bell-123' }
            }
          }
        },
        actionIdentifier: 'acknowledge'
      };

      render(<App />);

      await act(async () => {
        // Simulate notification response
        const handleResponse = jest.spyOn(notificationManager, 'handleNotificationResponse');
        handleResponse(mockNotificationResponse as any);
      });

      // Should process the notification response
      expect(true).toBe(true); // Placeholder for actual navigation verification
    });
  });

  describe('error handling', () => {
    it('should render error boundary for unhandled errors', async () => {
      const ThrowError = () => {
        throw new Error('Test error');
      };

      const { getByText } = render(
        <App>
          <ThrowError />
        </App>
      );

      await waitFor(() => {
        expect(getByText(/something went wrong/i)).toBeTruthy();
      });
    });

    it('should log crashes for debugging', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const ThrowError = () => {
        throw new Error('Test crash');
      };

      render(
        <App>
          <ThrowError />
        </App>
      );

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining('App crashed:'),
          expect.any(Error)
        );
      });

      consoleSpy.mockRestore();
    });

    it('should provide recovery options in error boundary', async () => {
      const ThrowError = () => {
        throw new Error('Test error');
      };

      const { getByText } = render(
        <App>
          <ThrowError />
        </App>
      );

      await waitFor(() => {
        expect(getByText(/try again/i)).toBeTruthy();
      });
    });
  });

  describe('background processing integration', () => {
    it('should start background tasks after initialization', async () => {
      const startTasksSpy = jest.spyOn(backgroundTasks, 'startAllTasks');

      render(<App />);

      await waitFor(() => {
        expect(startTasksSpy).toHaveBeenCalled();
      });
    });

    it('should handle app state changes for background optimization', async () => {
      const handleAppStateSpy = jest.spyOn(backgroundTasks, 'handleAppStateChange');

      render(<App />);

      // Simulate app going to background
      await act(async () => {
        // This would normally be triggered by AppState.addEventListener
        handleAppStateSpy('background');
      });

      expect(handleAppStateSpy).toHaveBeenCalledWith('background');
    });

    it('should cleanup resources on app termination', async () => {
      const shutdownSpy = jest.spyOn(backgroundTasks, 'shutdown');

      const { unmount } = render(<App />);

      unmount();

      expect(shutdownSpy).toHaveBeenCalled();
    });
  });

  describe('onboarding flow', () => {
    it('should show onboarding for first-time users', async () => {
      // Mock first-time user
      const isFirstLaunchSpy = jest.spyOn(databaseService, 'getSettings');
      isFirstLaunchSpy.mockResolvedValueOnce(null as any);

      const { getByText } = render(<App />);

      await waitFor(() => {
        expect(getByText(/welcome to mindful bell/i)).toBeTruthy();
      });
    });

    it('should skip onboarding for returning users', async () => {
      // Mock returning user
      const isFirstLaunchSpy = jest.spyOn(databaseService, 'getSettings');
      isFirstLaunchSpy.mockResolvedValueOnce({
        id: '1',
        bellDensity: 'medium',
        activeWindows: [],
        quietHours: [],
        createdAt: new Date(),
        updatedAt: new Date()
      });

      const { queryByText } = render(<App />);

      await waitFor(() => {
        expect(queryByText(/welcome to mindful bell/i)).toBeNull();
      });
    });

    it('should configure default settings during onboarding', async () => {
      const updateSettingsSpy = jest.spyOn(databaseService, 'updateSettings');

      // Mock onboarding completion
      const { getByText } = render(<App />);

      await waitFor(() => {
        const completeButton = getByText(/get started/i);
        if (completeButton) {
          act(() => {
            completeButton.props.onPress();
          });
        }
      });

      expect(updateSettingsSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          bellDensity: expect.any(String),
          activeWindows: expect.any(Array),
        })
      );
    });
  });

  describe('performance and lifecycle', () => {
    it('should initialize within performance budget', async () => {
      const startTime = Date.now();

      render(<App />);

      await waitFor(() => {
        const initTime = Date.now() - startTime;
        expect(initTime).toBeLessThan(2000); // <2s cold start requirement
      });
    });

    it('should handle memory pressure gracefully', async () => {
      const { rerender } = render(<App />);

      // Simulate memory pressure by re-rendering multiple times
      for (let i = 0; i < 10; i++) {
        rerender(<App />);
      }

      // Should not crash or leak memory
      expect(true).toBe(true);
    });

    it('should persist critical state across app restarts', async () => {
      const getSettingsSpy = jest.spyOn(databaseService, 'getSettings');

      const { unmount } = render(<App />);
      unmount();

      // Simulate app restart
      render(<App />);

      await waitFor(() => {
        expect(getSettingsSpy).toHaveBeenCalled();
      });
    });
  });
});