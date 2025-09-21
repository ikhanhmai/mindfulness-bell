import { BellEvent, BellDensity, TimeWindow, GenerateScheduleRequest, ValidateScheduleParamsRequest, ValidateScheduleParamsResponse } from '../types';

export class BellSchedulerService {
  private static instance: BellSchedulerService;

  public static getInstance(): BellSchedulerService {
    if (!BellSchedulerService.instance) {
      BellSchedulerService.instance = new BellSchedulerService();
    }
    return BellSchedulerService.instance;
  }

  public async generateDailySchedule(
    date: Date,
    density: BellDensity,
    activeWindows: TimeWindow[],
    quietHours: TimeWindow[],
    minimumInterval: number = 45
  ): Promise<BellEvent[]> {
    const availableMinutes = this.calculateAvailableMinutes(date, activeWindows, quietHours);
    const targetBellCount = this.getBellCountForDensity(density);

    if (availableMinutes < targetBellCount * minimumInterval) {
      // Not enough time for all bells with minimum interval
      const maxPossibleBells = Math.floor(availableMinutes / minimumInterval);
      return this.generateBellTimes(date, Math.min(targetBellCount, maxPossibleBells), activeWindows, quietHours, minimumInterval);
    }

    return this.generateBellTimes(date, targetBellCount, activeWindows, quietHours, minimumInterval);
  }

  private getBellCountForDensity(density: BellDensity): number {
    switch (density) {
      case 'low': return 4;
      case 'medium': return 8;
      case 'high': return 12;
      default: return 8;
    }
  }

  private calculateAvailableMinutes(date: Date, activeWindows: TimeWindow[], quietHours: TimeWindow[]): number {
    let totalMinutes = 0;

    for (const window of activeWindows) {
      const startMinutes = this.timeStringToMinutes(window.start);
      const endMinutes = this.timeStringToMinutes(window.end);
      let windowMinutes = endMinutes - startMinutes;

      // Subtract quiet hours that overlap with this active window
      for (const quietHour of quietHours) {
        const quietStart = this.timeStringToMinutes(quietHour.start);
        const quietEnd = this.timeStringToMinutes(quietHour.end);

        // Handle overnight quiet hours (e.g., 22:00-07:00)
        if (quietEnd < quietStart) {
          // Quiet hour spans midnight
          const overlapBefore = Math.max(0, Math.min(endMinutes, 24 * 60) - Math.max(startMinutes, quietStart));
          const overlapAfter = Math.max(0, Math.min(endMinutes, quietEnd) - Math.max(startMinutes, 0));
          windowMinutes -= (overlapBefore + overlapAfter);
        } else {
          // Regular quiet hour within same day
          const overlapStart = Math.max(startMinutes, quietStart);
          const overlapEnd = Math.min(endMinutes, quietEnd);
          if (overlapStart < overlapEnd) {
            windowMinutes -= (overlapEnd - overlapStart);
          }
        }
      }

      totalMinutes += Math.max(0, windowMinutes);
    }

    return totalMinutes;
  }

  private generateBellTimes(
    date: Date,
    bellCount: number,
    activeWindows: TimeWindow[],
    quietHours: TimeWindow[],
    minimumInterval: number
  ): BellEvent[] {
    const bellTimes: Date[] = [];

    // Create available time slots
    const timeSlots = this.createTimeSlots(date, activeWindows, quietHours);

    for (let i = 0; i < bellCount && timeSlots.length > 0; i++) {
      let attempts = 0;
      let bellTime: Date | null = null;

      while (attempts < 100 && !bellTime) {
        const randomSlot = timeSlots[Math.floor(Math.random() * timeSlots.length)];
        const candidateTime = new Date(randomSlot.start.getTime() +
          Math.random() * (randomSlot.end.getTime() - randomSlot.start.getTime()));

        // Check minimum interval constraint
        const tooClose = bellTimes.some(existingTime =>
          Math.abs(candidateTime.getTime() - existingTime.getTime()) < minimumInterval * 60 * 1000
        );

        if (!tooClose) {
          bellTime = candidateTime;
          bellTimes.push(bellTime);

          // Remove time around this bell from available slots to maintain minimum interval
          this.removeTimeAroundBell(timeSlots, bellTime, minimumInterval);
        }

        attempts++;
      }
    }

    // Sort by time and create BellEvent objects
    bellTimes.sort((a, b) => a.getTime() - b.getTime());

    return bellTimes.map(time => ({
      id: this.generateUUID(),
      scheduledTime: time,
      status: 'scheduled' as const
    }));
  }

  private createTimeSlots(date: Date, activeWindows: TimeWindow[], quietHours: TimeWindow[]): Array<{start: Date, end: Date}> {
    const slots: Array<{start: Date, end: Date}> = [];

    for (const window of activeWindows) {
      const startTime = this.createDateFromTimeString(date, window.start);
      const endTime = this.createDateFromTimeString(date, window.end);

      let currentSlotStart = startTime;

      // Split window by quiet hours
      for (const quietHour of quietHours) {
        const quietStart = this.createDateFromTimeString(date, quietHour.start);
        const quietEnd = this.createDateFromTimeString(date, quietHour.end);

        // Handle overnight quiet hours
        if (quietEnd < quietStart) {
          // Quiet hour spans midnight - handle as two separate periods
          const endOfDay = new Date(date);
          endOfDay.setHours(23, 59, 59, 999);

          const startOfDay = new Date(date);
          startOfDay.setHours(0, 0, 0, 0);

          // Before midnight
          if (currentSlotStart < quietStart && quietStart <= endTime) {
            slots.push({ start: currentSlotStart, end: quietStart });
            currentSlotStart = endOfDay;
          }

          // After midnight
          if (startOfDay < quietEnd && quietEnd <= endTime) {
            if (currentSlotStart <= startOfDay) {
              currentSlotStart = quietEnd;
            }
          }
        } else {
          // Regular quiet hour
          if (currentSlotStart < quietStart && quietStart <= endTime) {
            slots.push({ start: currentSlotStart, end: quietStart });
            currentSlotStart = currentSlotStart.getTime() > quietEnd.getTime() ? currentSlotStart : quietEnd;
          }
        }
      }

      // Add remaining time in window
      if (currentSlotStart < endTime) {
        slots.push({ start: currentSlotStart, end: endTime });
      }
    }

    return slots.filter(slot => slot.end.getTime() - slot.start.getTime() > 0);
  }

  private removeTimeAroundBell(timeSlots: Array<{start: Date, end: Date}>, bellTime: Date, intervalMinutes: number): void {
    const intervalMs = intervalMinutes * 60 * 1000;
    const bufferStart = new Date(bellTime.getTime() - intervalMs);
    const bufferEnd = new Date(bellTime.getTime() + intervalMs);

    for (let i = timeSlots.length - 1; i >= 0; i--) {
      const slot = timeSlots[i];

      if (slot.start <= bufferEnd && slot.end >= bufferStart) {
        // Slot overlaps with buffer zone
        timeSlots.splice(i, 1);

        // Add back non-overlapping parts
        if (slot.start < bufferStart) {
          timeSlots.push({ start: slot.start, end: bufferStart });
        }
        if (slot.end > bufferEnd) {
          timeSlots.push({ start: bufferEnd, end: slot.end });
        }
      }
    }
  }

  private timeStringToMinutes(timeString: string): number {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
  }

  private createDateFromTimeString(date: Date, timeString: string): Date {
    const [hours, minutes] = timeString.split(':').map(Number);
    const result = new Date(date);
    result.setHours(hours, minutes, 0, 0);
    return result;
  }

  public async validateScheduleParams(params: ValidateScheduleParamsRequest): Promise<ValidateScheduleParamsResponse> {
    const warnings: string[] = [];
    let valid = true;

    // Validate time windows
    for (const window of params.activeWindows) {
      if (!this.isValidTimeFormat(window.start) || !this.isValidTimeFormat(window.end)) {
        valid = false;
        warnings.push('Invalid time format in active windows');
        continue;
      }

      const startMinutes = this.timeStringToMinutes(window.start);
      const endMinutes = this.timeStringToMinutes(window.end);

      if (endMinutes <= startMinutes) {
        valid = false;
        warnings.push('Invalid time window: end time before start time');
      }
    }

    // Validate quiet hours
    for (const quietHour of params.quietHours) {
      if (!this.isValidTimeFormat(quietHour.start) || !this.isValidTimeFormat(quietHour.end)) {
        valid = false;
        warnings.push('Invalid time format in quiet hours');
      }
    }

    // Calculate estimates
    const availableMinutes = this.calculateAvailableMinutes(new Date(), params.activeWindows, params.quietHours);
    const estimatedBells = this.getBellCountForDensity(params.density);

    // Check if there's enough time for minimum intervals
    const minimumRequiredTime = estimatedBells * (params.minimumInterval || 45);
    if (availableMinutes < minimumRequiredTime) {
      warnings.push(`Not enough available time for all bells with minimum interval. Consider reducing density or increasing active windows.`);
    }

    return {
      valid,
      estimatedBellsPerDay: estimatedBells,
      availableMinutesPerDay: availableMinutes,
      warnings
    };
  }

  private isValidTimeFormat(timeString: string): boolean {
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return timeRegex.test(timeString);
  }

  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
}