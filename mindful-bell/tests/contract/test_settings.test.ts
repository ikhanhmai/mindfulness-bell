import { SettingsService } from '../../src/services/SettingsService';
import { Settings, BellDensity, TimeWindow } from '../../src/types';

describe('SettingsService Contract Tests', () => {
  let settingsService: SettingsService;

  beforeEach(() => {
    settingsService = new SettingsService();
  });

  describe('getSettings', () => {
    it('should return current user settings', async () => {
      const settings = await settingsService.getSettings();

      expect(settings).toBeDefined();
      expect(settings.activeWindows).toBeDefined();
      expect(Array.isArray(settings.activeWindows)).toBe(true);
      expect(settings.bellDensity).toBeDefined();
      expect(['low', 'medium', 'high']).toContain(settings.bellDensity);
      expect(typeof settings.soundEnabled).toBe('boolean');
      expect(typeof settings.vibrationEnabled).toBe('boolean');
    });

    it('should have valid default settings', async () => {
      const settings = await settingsService.getSettings();

      // Should have at least one active window
      expect(settings.activeWindows.length).toBeGreaterThan(0);

      // Default active window should be reasonable (e.g., 9AM-5PM)
      const firstWindow = settings.activeWindows[0];
      expect(firstWindow.start).toMatch(/^\d{2}:\d{2}$/);
      expect(firstWindow.end).toMatch(/^\d{2}:\d{2}$/);

      // Default density should be medium
      expect(settings.bellDensity).toBe('medium');
    });
  });

  describe('updateSettings', () => {
    it('should update bell density', async () => {
      const newDensity: BellDensity = 'high';

      const updatedSettings = await settingsService.updateSettings({
        bellDensity: newDensity
      });

      expect(updatedSettings.bellDensity).toBe('high');
    });

    it('should update active windows', async () => {
      const newActiveWindows: TimeWindow[] = [
        { start: '08:00', end: '12:00' },
        { start: '14:00', end: '18:00' }
      ];

      const updatedSettings = await settingsService.updateSettings({
        activeWindows: newActiveWindows
      });

      expect(updatedSettings.activeWindows).toEqual(newActiveWindows);
    });

    it('should update quiet hours', async () => {
      const quietHours: TimeWindow[] = [
        { start: '12:00', end: '13:00' }, // Lunch break
        { start: '22:00', end: '07:00' }  // Sleep time
      ];

      const updatedSettings = await settingsService.updateSettings({
        quietHours
      });

      expect(updatedSettings.quietHours).toEqual(quietHours);
    });

    it('should validate time window format', async () => {
      const invalidActiveWindows = [
        { start: '25:00', end: '12:00' } // Invalid hour
      ];

      await expect(
        settingsService.updateSettings({
          activeWindows: invalidActiveWindows as TimeWindow[]
        })
      ).rejects.toThrow('Invalid active windows');
    });

    it('should validate time window logic', async () => {
      const invalidActiveWindows: TimeWindow[] = [
        { start: '18:00', end: '08:00' } // End before start (same day)
      ];

      await expect(
        settingsService.updateSettings({
          activeWindows: invalidActiveWindows
        })
      ).rejects.toThrow('End time must be after start time');
    });

    it('should update sound preferences', async () => {
      const updatedSettings = await settingsService.updateSettings({
        soundEnabled: false,
        vibrationEnabled: true,
        soundFile: 'custom-bell.mp3'
      });

      expect(updatedSettings.soundEnabled).toBe(false);
      expect(updatedSettings.vibrationEnabled).toBe(true);
      expect(updatedSettings.soundFile).toBe('custom-bell.mp3');
    });
  });

  describe('resetToDefaults', () => {
    it('should restore default settings', async () => {
      // First modify settings
      await settingsService.updateSettings({
        bellDensity: 'low',
        soundEnabled: false
      });

      // Then reset
      const defaultSettings = await settingsService.resetToDefaults();

      expect(defaultSettings.bellDensity).toBe('medium');
      expect(defaultSettings.soundEnabled).toBe(true);
      expect(defaultSettings.activeWindows.length).toBeGreaterThan(0);
    });
  });

  describe('validateSettings', () => {
    it('should validate complete settings object', async () => {
      const validSettings: Partial<Settings> = {
        activeWindows: [{ start: '09:00', end: '17:00' }],
        quietHours: [{ start: '22:00', end: '07:00' }],
        bellDensity: 'medium',
        soundEnabled: true,
        vibrationEnabled: true
      };

      const result = await settingsService.validateSettings(validSettings);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate schedule parameters and return warnings when needed', async () => {
      const settingsWithLimitedTime: Partial<Settings> = {
        activeWindows: [{ start: '09:00', end: '09:30' }], // Very short window
        quietHours: [{ start: '12:00', end: '13:00' }],
        bellDensity: 'high' // High density with limited time should generate warning
      };

      const result = await settingsService.validateSettings(settingsWithLimitedTime);
      // Should have warnings about not enough time for bells
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.valid).toBe(true); // Still valid, just with warnings
    });
  });
});