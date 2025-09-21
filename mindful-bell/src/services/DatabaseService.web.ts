// Web-compatible mock of DatabaseService for development
import { Observation, BellEvent, Settings } from '../types';

export class DatabaseService {
  private static instance: DatabaseService;

  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  async initialize(): Promise<void> {
    console.log('DatabaseService initialized for web (mock)');
  }

  async insertObservation(data: {
    type: string;
    content: string;
    tags: string[];
    bellEventId?: string;
  }): Promise<Observation> {
    const mockObservation: Observation = {
      id: Math.random().toString(36).substr(2, 9),
      type: data.type as any,
      content: data.content,
      tags: data.tags,
      bellEventId: data.bellEventId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    console.log('Mock: Created observation', mockObservation);
    return mockObservation;
  }

  async updateObservation(id: string, updates: Partial<Observation>): Promise<Observation> {
    const mockObservation: Observation = {
      id,
      type: 'lesson',
      content: updates.content || 'Updated content',
      tags: updates.tags || [],
      createdAt: new Date(),
      updatedAt: new Date(),
      ...updates,
    };
    console.log('Mock: Updated observation', mockObservation);
    return mockObservation;
  }

  async getObservationById(id: string): Promise<Observation> {
    const mockObservation: Observation = {
      id,
      type: 'lesson',
      content: 'Mock observation content',
      tags: ['mock'],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    return mockObservation;
  }

  async insertBellEvent(event: Omit<BellEvent, 'id'>): Promise<BellEvent> {
    const mockEvent: BellEvent = {
      id: Math.random().toString(36).substr(2, 9),
      ...event,
    };
    console.log('Mock: Created bell event', mockEvent);
    return mockEvent;
  }

  async updateBellEvent(id: string, updates: Partial<BellEvent>): Promise<BellEvent> {
    const mockEvent: BellEvent = {
      id,
      scheduledTime: new Date(),
      status: 'scheduled',
      ...updates,
    };
    console.log('Mock: Updated bell event', mockEvent);
    return mockEvent;
  }

  async getBellEventById(id: string): Promise<BellEvent> {
    return {
      id,
      scheduledTime: new Date(),
      status: 'scheduled',
    };
  }

  async getTodaysBellEvents(): Promise<BellEvent[]> {
    // Return some mock bell events for today
    const now = new Date();
    const mockEvents: BellEvent[] = [
      {
        id: '1',
        scheduledTime: new Date(now.getTime() + 30 * 60 * 1000), // 30 minutes from now
        status: 'scheduled',
      },
      {
        id: '2',
        scheduledTime: new Date(now.getTime() + 2 * 60 * 60 * 1000), // 2 hours from now
        status: 'scheduled',
      },
    ];
    return mockEvents;
  }

  async getSettings(): Promise<Settings> {
    return {
      id: 'default',
      activeWindows: [{ start: '09:00', end: '17:00' }],
      quietHours: [{ start: '22:00', end: '07:00' }],
      bellDensity: 'medium',
      soundEnabled: true,
      vibrationEnabled: true,
      updatedAt: new Date(),
    };
  }

  async updateSettings(updates: Partial<Settings>): Promise<Settings> {
    const currentSettings = await this.getSettings();
    const updatedSettings = {
      ...currentSettings,
      ...updates,
      updatedAt: new Date(),
    };
    console.log('Mock: Updated settings', updatedSettings);
    return updatedSettings;
  }
}
