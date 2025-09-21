import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Settings, BellDensity, TimeWindow } from '../types';
import { useSettingsService } from './DatabaseContext';

interface SettingsContextType {
  // Current settings
  settings: Settings | null;
  isLoading: boolean;
  error: string | null;

  // Settings operations
  updateBellDensity: (density: BellDensity) => Promise<void>;
  updateActiveWindows: (windows: TimeWindow[]) => Promise<void>;
  updateQuietHours: (hours: TimeWindow[]) => Promise<void>;
  updateSoundSettings: (enabled: boolean, soundFile?: string) => Promise<void>;
  updateVibrationSettings: (enabled: boolean) => Promise<void>;
  updateAllSettings: (updates: Partial<Settings>) => Promise<void>;
  resetToDefaults: () => Promise<void>;
  reloadSettings: () => Promise<void>;

  // Validation
  validateSettings: (settings: Partial<Settings>) => Promise<{
    valid: boolean;
    errors: string[];
    warnings: string[];
  }>;

  // Schedule validation
  validateCurrentSchedule: () => Promise<{
    valid: boolean;
    warnings: string[];
    estimatedBellsPerDay: number;
    availableMinutesPerDay: number;
  }>;
}

const SettingsContext = createContext<SettingsContextType | null>(null);

interface SettingsProviderProps {
  children: ReactNode;
}

export const SettingsProvider: React.FC<SettingsProviderProps> = ({ children }) => {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const settingsService = useSettingsService();

  const loadSettings = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const currentSettings = await settingsService.getSettings();
      setSettings(currentSettings);
    } catch (err) {
      console.error('Failed to load settings:', err);
      setError(err instanceof Error ? err.message : 'Failed to load settings');
    } finally {
      setIsLoading(false);
    }
  }, [settingsService]);

  const updateBellDensity = useCallback(async (density: BellDensity) => {
    try {
      setError(null);
      const updatedSettings = await settingsService.updateBellDensity(density);
      setSettings(updatedSettings);
    } catch (err) {
      console.error('Failed to update bell density:', err);
      setError(err instanceof Error ? err.message : 'Failed to update bell density');
      throw err;
    }
  }, [settingsService]);

  const updateActiveWindows = useCallback(async (windows: TimeWindow[]) => {
    try {
      setError(null);
      const updatedSettings = await settingsService.updateActiveWindows(windows);
      setSettings(updatedSettings);
    } catch (err) {
      console.error('Failed to update active windows:', err);
      setError(err instanceof Error ? err.message : 'Failed to update active windows');
      throw err;
    }
  }, [settingsService]);

  const updateQuietHours = useCallback(async (hours: TimeWindow[]) => {
    try {
      setError(null);
      const updatedSettings = await settingsService.updateQuietHours(hours);
      setSettings(updatedSettings);
    } catch (err) {
      console.error('Failed to update quiet hours:', err);
      setError(err instanceof Error ? err.message : 'Failed to update quiet hours');
      throw err;
    }
  }, [settingsService]);

  const updateSoundSettings = useCallback(async (enabled: boolean, soundFile?: string) => {
    try {
      setError(null);
      const updatedSettings = await settingsService.updateSoundSettings(enabled, soundFile);
      setSettings(updatedSettings);
    } catch (err) {
      console.error('Failed to update sound settings:', err);
      setError(err instanceof Error ? err.message : 'Failed to update sound settings');
      throw err;
    }
  }, [settingsService]);

  const updateVibrationSettings = useCallback(async (enabled: boolean) => {
    try {
      setError(null);
      const updatedSettings = await settingsService.updateVibrationSettings(enabled);
      setSettings(updatedSettings);
    } catch (err) {
      console.error('Failed to update vibration settings:', err);
      setError(err instanceof Error ? err.message : 'Failed to update vibration settings');
      throw err;
    }
  }, [settingsService]);

  const updateAllSettings = useCallback(async (updates: Partial<Settings>) => {
    try {
      setError(null);
      const updatedSettings = await settingsService.updateAllSettings(updates);
      setSettings(updatedSettings);
    } catch (err) {
      console.error('Failed to update settings:', err);
      setError(err instanceof Error ? err.message : 'Failed to update settings');
      throw err;
    }
  }, [settingsService]);

  const resetToDefaults = useCallback(async () => {
    try {
      setError(null);
      const defaultSettings = await settingsService.resetToDefaults();
      setSettings(defaultSettings);
    } catch (err) {
      console.error('Failed to reset settings:', err);
      setError(err instanceof Error ? err.message : 'Failed to reset settings');
      throw err;
    }
  }, [settingsService]);

  const reloadSettings = useCallback(async () => {
    await loadSettings();
  }, [loadSettings]);

  const validateSettings = useCallback(async (settingsToValidate: Partial<Settings>) => {
    try {
      return await settingsService.validateSettings(settingsToValidate);
    } catch (err) {
      console.error('Failed to validate settings:', err);
      return {
        valid: false,
        errors: [err instanceof Error ? err.message : 'Validation failed'],
        warnings: []
      };
    }
  }, [settingsService]);

  const validateCurrentSchedule = useCallback(async () => {
    try {
      return await settingsService.validateCurrentSettings();
    } catch (err) {
      console.error('Failed to validate schedule:', err);
      return {
        valid: false,
        warnings: [err instanceof Error ? err.message : 'Schedule validation failed'],
        estimatedBellsPerDay: 0,
        availableMinutesPerDay: 0
      };
    }
  }, [settingsService]);

  // Load settings on mount
  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const contextValue: SettingsContextType = {
    settings,
    isLoading,
    error,
    updateBellDensity,
    updateActiveWindows,
    updateQuietHours,
    updateSoundSettings,
    updateVibrationSettings,
    updateAllSettings,
    resetToDefaults,
    reloadSettings,
    validateSettings,
    validateCurrentSchedule
  };

  return (
    <SettingsContext.Provider value={contextValue}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = (): SettingsContextType => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

// Convenience hooks for specific settings
export const useBellDensity = () => {
  const { settings, updateBellDensity } = useSettings();
  return {
    density: settings?.bellDensity || 'medium',
    updateDensity: updateBellDensity
  };
};

export const useTimeWindows = () => {
  const { settings, updateActiveWindows, updateQuietHours } = useSettings();
  return {
    activeWindows: settings?.activeWindows || [],
    quietHours: settings?.quietHours || [],
    updateActiveWindows,
    updateQuietHours
  };
};

export const useNotificationSettings = () => {
  const { settings, updateSoundSettings, updateVibrationSettings } = useSettings();
  return {
    soundEnabled: settings?.soundEnabled || false,
    vibrationEnabled: settings?.vibrationEnabled || false,
    soundFile: settings?.soundFile,
    updateSoundSettings,
    updateVibrationSettings
  };
};