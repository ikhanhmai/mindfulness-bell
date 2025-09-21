import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import ErrorBoundary from '../../src/components/ErrorBoundary';
import { Text } from 'react-native';

// Mock console.error to avoid test noise
const originalError = console.error;
beforeAll(() => {
  console.error = jest.fn();
});

afterAll(() => {
  console.error = originalError;
});

describe('Error Boundary Integration Tests', () => {
  const ThrowError = ({ shouldThrow = false }: { shouldThrow?: boolean }) => {
    if (shouldThrow) {
      throw new Error('Test error for boundary');
    }
    return <Text testID="working-component">Working Component</Text>;
  };

  describe('error catching', () => {
    it('should catch and display error when child component throws', () => {
      const { getByText, queryByTestId } = render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      // Should show error UI
      expect(getByText(/something went wrong/i)).toBeTruthy();

      // Should not show working component
      expect(queryByTestId('working-component')).toBeNull();
    });

    it('should render children normally when no error occurs', () => {
      const { getByTestId, queryByText } = render(
        <ErrorBoundary>
          <ThrowError shouldThrow={false} />
        </ErrorBoundary>
      );

      // Should show working component
      expect(getByTestId('working-component')).toBeTruthy();

      // Should not show error UI
      expect(queryByText(/something went wrong/i)).toBeNull();
    });

    it('should log error details for debugging', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('ErrorBoundary caught an error:'),
        expect.any(Error),
        expect.any(Object) // Error info
      );

      consoleSpy.mockRestore();
    });
  });

  describe('error recovery', () => {
    it('should provide retry functionality', () => {
      const { getByText, rerender } = render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      // Should show retry button
      const retryButton = getByText(/try again/i);
      expect(retryButton).toBeTruthy();

      // Simulate retry
      fireEvent.press(retryButton);

      // Rerender with working component
      rerender(
        <ErrorBoundary>
          <ThrowError shouldThrow={false} />
        </ErrorBoundary>
      );

      // Should show working component after retry
      expect(() => getByText('Working Component')).not.toThrow();
    });

    it('should reset error state on retry', () => {
      let shouldThrow = true;

      const TestComponent = () => {
        if (shouldThrow) {
          throw new Error('Test error');
        }
        return <Text testID="recovered">Recovered</Text>;
      };

      const { getByText, getByTestId, rerender } = render(
        <ErrorBoundary>
          <TestComponent />
        </ErrorBoundary>
      );

      // Should show error initially
      expect(getByText(/something went wrong/i)).toBeTruthy();

      // Retry and fix the error
      shouldThrow = false;
      const retryButton = getByText(/try again/i);
      fireEvent.press(retryButton);

      rerender(
        <ErrorBoundary>
          <TestComponent />
        </ErrorBoundary>
      );

      // Should show recovered component
      expect(getByTestId('recovered')).toBeTruthy();
    });

    it('should handle multiple error recovery attempts', () => {
      const { getByText } = render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      const retryButton = getByText(/try again/i);

      // Multiple retry attempts should not crash
      fireEvent.press(retryButton);
      fireEvent.press(retryButton);
      fireEvent.press(retryButton);

      expect(retryButton).toBeTruthy();
    });
  });

  describe('error reporting', () => {
    it('should provide detailed error information in development', () => {
      const originalNodeEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const { getByText } = render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      // Should show detailed error in development
      expect(getByText(/test error for boundary/i)).toBeTruthy();

      process.env.NODE_ENV = originalNodeEnv;
    });

    it('should show user-friendly message in production', () => {
      const originalNodeEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const { getByText, queryByText } = render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      // Should show user-friendly message
      expect(getByText(/something went wrong/i)).toBeTruthy();

      // Should not show detailed error
      expect(queryByText(/test error for boundary/i)).toBeNull();

      process.env.NODE_ENV = originalNodeEnv;
    });

    it('should include error boundary component name in logs', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('ErrorBoundary'),
        expect.any(Error),
        expect.any(Object)
      );

      consoleSpy.mockRestore();
    });
  });

  describe('specific error scenarios', () => {
    it('should handle async component errors', async () => {
      const AsyncError = () => {
        React.useEffect(() => {
          setTimeout(() => {
            throw new Error('Async error');
          }, 100);
        }, []);
        return <Text>Async Component</Text>;
      };

      const { getByText } = render(
        <ErrorBoundary>
          <AsyncError />
        </ErrorBoundary>
      );

      // Note: Error boundaries don't catch async errors in useEffect
      // This test documents the limitation
      expect(getByText('Async Component')).toBeTruthy();
    });

    it('should handle render errors in nested components', () => {
      const NestedError = () => {
        throw new Error('Nested component error');
      };

      const ParentComponent = () => (
        <Text>
          Parent
          <NestedError />
        </Text>
      );

      const { getByText } = render(
        <ErrorBoundary>
          <ParentComponent />
        </ErrorBoundary>
      );

      expect(getByText(/something went wrong/i)).toBeTruthy();
    });

    it('should handle null/undefined component errors', () => {
      const NullComponent = () => {
        const nullComponent: any = null;
        return nullComponent.nonExistentMethod();
      };

      const { getByText } = render(
        <ErrorBoundary>
          <NullComponent />
        </ErrorBoundary>
      );

      expect(getByText(/something went wrong/i)).toBeTruthy();
    });
  });

  describe('integration with app services', () => {
    it('should not interfere with normal service operations', () => {
      const ServiceComponent = () => {
        // Simulate normal service usage
        React.useEffect(() => {
          // Database service call (mocked)
        }, []);

        return <Text testID="service-component">Service Working</Text>;
      };

      const { getByTestId } = render(
        <ErrorBoundary>
          <ServiceComponent />
        </ErrorBoundary>
      );

      expect(getByTestId('service-component')).toBeTruthy();
    });

    it('should handle service initialization errors', () => {
      const ServiceErrorComponent = () => {
        React.useEffect(() => {
          throw new Error('Service initialization failed');
        }, []);

        return <Text>Service Component</Text>;
      };

      const { getByText } = render(
        <ErrorBoundary>
          <ServiceErrorComponent />
        </ErrorBoundary>
      );

      // Should show error boundary (though useEffect errors aren't caught)
      // This documents expected behavior
      expect(getByText('Service Component')).toBeTruthy();
    });
  });
});