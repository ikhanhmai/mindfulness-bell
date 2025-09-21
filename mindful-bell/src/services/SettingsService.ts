import { Settings, BellDensity, TimeWindow } from '../types';
import { DatabaseService } from './DatabaseService';
import { BellSchedulerService } from './BellSchedulerService';

export class SettingsService {
  private static instance: SettingsService;
  private db: DatabaseService;
  private bellScheduler: BellSchedulerService;

  constructor() {
    this.db = DatabaseService.getInstance();
    this.bellScheduler = BellSchedulerService.getInstance();
  }

  public static getInstance(): SettingsService {
    if (!SettingsService.instance) {
      SettingsService.instance = new SettingsService();
    }
    return SettingsService.instance;
  }

  public async getSettings(): Promise<Settings> {
    return await this.db.getSettings();
  }

  public async updateBellDensity(density: BellDensity): Promise<Settings> {
    this.validateBellDensity(density);
    return await this.db.updateSettings({ bellDensity: density });
  }

  public async updateActiveWindows(activeWindows: TimeWindow[]): Promise<Settings> {
    const validation = this.validateTimeWindows(activeWindows);
    if (!validation.valid) {
      throw new Error(`Invalid active windows: ${validation.errors.join(', ')}`);
    }

    return await this.db.updateSettings({ activeWindows });
  }

  public async updateQuietHours(quietHours: TimeWindow[]): Promise<Settings> {
    const validation = this.validateTimeWindows(quietHours, true);
    if (!validation.valid) {
      throw new Error(`Invalid quiet hours: ${validation.errors.join(', ')}`);
    }

    return await this.db.updateSettings({ quietHours });
  }

  public async updateSoundSettings(
    soundEnabled: boolean,
    soundFile?: string
  ): Promise<Settings> {
    const updates: Partial<Settings> = { soundEnabled };
    if (soundFile !== undefined) {
      updates.soundFile = soundFile;
    }

    return await this.db.updateSettings(updates);
  }

  public async updateVibrationSettings(vibrationEnabled: boolean): Promise<Settings> {
    return await this.db.updateSettings({ vibrationEnabled });
  }

  public async updateSettings(settings: Partial<Settings>): Promise<Settings> {
    return this.updateAllSettings(settings);
  }

  public async updateAllSettings(settings: Partial<Settings>): Promise<Settings> {
    // Validate all settings before updating
    if (settings.bellDensity) {
      this.validateBellDensity(settings.bellDensity);
    }

    if (settings.activeWindows) {
      const validation = this.validateTimeWindows(settings.activeWindows);
      if (!validation.valid) {
        throw new Error(`Invalid active windows: ${validation.errors.join(', ')}`);
      }
    }

    if (settings.quietHours) {
      const validation = this.validateTimeWindows(settings.quietHours, true);
      if (!validation.valid) {
        throw new Error(`Invalid quiet hours: ${validation.errors.join(', ')}`);
      }
    }

    // Validate the overall schedule if both time windows are provided
    if (settings.activeWindows && settings.quietHours && settings.bellDensity) {
      const scheduleValidation = await this.bellScheduler.validateScheduleParams({
        density: settings.bellDensity,
        activeWindows: settings.activeWindows,
        quietHours: settings.quietHours,
        minimumInterval: 45
      });

      if (!scheduleValidation.valid) {
        throw new Error(`Schedule validation failed: ${scheduleValidation.warnings.join(', ')}`);
      }
    }

    return await this.db.updateSettings(settings);
  }

  public async resetToDefaults(): Promise<Settings> {
    const defaultSettings: Partial<Settings> = {
      activeWindows: [{ start: '09:00', end: '17:00' }],
      quietHours: [{ start: '22:00', end: '07:00' }],
      bellDensity: 'medium',
      soundEnabled: true,
      vibrationEnabled: true,
      soundFile: undefined
    };

    return await this.db.updateSettings(defaultSettings);
  }

  public async validateSettings(settings: Partial<Settings>): Promise<{
    valid: boolean;
    errors: string[];
    warnings: string[];
  }> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate bell density
    if (settings.bellDensity) {
      try {
        this.validateBellDensity(settings.bellDensity);
      } catch (error) {
        errors.push((error as Error).message);
      }
    }

    // Validate active windows
    if (settings.activeWindows) {
      const validation = this.validateTimeWindows(settings.activeWindows);
      if (!validation.valid) {
        errors.push(...validation.errors);
      }
    }

    // Validate quiet hours
    if (settings.quietHours) {
      const validation = this.validateTimeWindows(settings.quietHours, true);
      if (!validation.valid) {
        errors.push(...validation.errors);
      }
    }

    // Validate schedule if complete settings provided
    if (settings.activeWindows && settings.quietHours && settings.bellDensity) {
      try {
        const scheduleValidation = await this.bellScheduler.validateScheduleParams({
          density: settings.bellDensity,
          activeWindows: settings.activeWindows,
          quietHours: settings.quietHours,
          minimumInterval: 45
        });
        warnings.push(...scheduleValidation.warnings);
      } catch (error) {
        errors.push((error as Error).message);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  public async validateCurrentSettings(): Promise<{
    valid: boolean;
    warnings: string[];
    estimatedBellsPerDay: number;
    availableMinutesPerDay: number;
  }> {
    const settings = await this.getSettings();

    return await this.bellScheduler.validateScheduleParams({
      density: settings.bellDensity,
      activeWindows: settings.activeWindows,
      quietHours: settings.quietHours,
      minimumInterval: 45
    });
  }

  private validateBellDensity(density: BellDensity): void {
    const validDensities: BellDensity[] = ['low', 'medium', 'high'];
    if (!validDensities.includes(density)) {
      throw new Error(`Invalid bell density: ${density}. Must be one of: ${validDensities.join(', ')}`);
    }
  }

  public validateTimeWindows(
    windows: TimeWindow[],
    allowOvernight: boolean = false
  ): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!Array.isArray(windows)) {
      errors.push('Time windows must be an array');
      return { valid: false, errors };
    }

    if (windows.length === 0) {
      errors.push('At least one time window is required');
      return { valid: false, errors };
    }

    if (windows.length > 10) {
      errors.push('Cannot have more than 10 time windows');
    }

    for (let i = 0; i < windows.length; i++) {
      const window = windows[i];
      const windowErrors = this.validateSingleTimeWindow(window, allowOvernight);
      if (windowErrors.length > 0) {
        errors.push(`Window ${i + 1}: ${windowErrors.join(', ')}`);
      }
    }

    // Check for overlapping windows
    const overlaps = this.findOverlappingWindows(windows);
    if (overlaps.length > 0) {
      errors.push(`Overlapping time windows found: ${overlaps.join(', ')}`);
    }

    return { valid: errors.length === 0, errors };
  }

  private validateSingleTimeWindow(
    window: TimeWindow,
    allowOvernight: boolean
  ): string[] {
    const errors: string[] = [];

    if (!window || typeof window !== 'object') {
      errors.push('Time window must be an object');
      return errors;
    }

    if (!window.start || !window.end) {
      errors.push('Time window must have start and end times');
      return errors;
    }

    // Validate time format
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(window.start)) {
      errors.push(`Invalid start time format: ${window.start}`);
    }
    if (!timeRegex.test(window.end)) {
      errors.push(`Invalid end time format: ${window.end}`);
    }

    if (errors.length > 0) {
      return errors;
    }

    // Parse times
    const startMinutes = this.timeStringToMinutes(window.start);
    const endMinutes = this.timeStringToMinutes(window.end);

    // Validate time relationship
    if (!allowOvernight && endMinutes <= startMinutes) {
      errors.push('End time must be after start time');
    }

    if (allowOvernight && endMinutes === startMinutes) {
      errors.push('Start and end times cannot be the same');
    }

    // Check minimum duration (15 minutes)
    const duration = allowOvernight && endMinutes < startMinutes
      ? (24 * 60 - startMinutes) + endMinutes  // Overnight duration
      : endMinutes - startMinutes;

    if (duration < 15) {
      errors.push('Time window must be at least 15 minutes long');
    }

    return errors;
  }

  private findOverlappingWindows(windows: TimeWindow[]): string[] {
    const overlaps: string[] = [];

    for (let i = 0; i < windows.length; i++) {
      for (let j = i + 1; j < windows.length; j++) {
        const window1 = windows[i];
        const window2 = windows[j];

        if (this.timeWindowsOverlap(window1, window2)) {
          overlaps.push(`${window1.start}-${window1.end} and ${window2.start}-${window2.end}`);
        }
      }
    }

    return overlaps;
  }

  private timeWindowsOverlap(window1: TimeWindow, window2: TimeWindow): boolean {
    const start1 = this.timeStringToMinutes(window1.start);
    const end1 = this.timeStringToMinutes(window1.end);
    const start2 = this.timeStringToMinutes(window2.start);
    const end2 = this.timeStringToMinutes(window2.end);

    // Simple overlap check for same-day windows
    return start1 < end2 && start2 < end1;
  }

  private timeStringToMinutes(timeString: string): number {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
  }
}