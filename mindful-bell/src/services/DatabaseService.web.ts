// Web-compatible mock of DatabaseService for development
import { Observation, BellEvent, Settings } from '../types';

export class DatabaseService {
  private static instance: DatabaseService;
  private mockObservations: Observation[] = []; // Mock storage for web

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
      id: this.generateUUID(),
      type: data.type as any,
      content: data.content,
      tags: data.tags,
      bellEventId: data.bellEventId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    // Store in mock storage
    this.mockObservations.push(mockObservation);
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

  async getObservations(options: {
    limit?: number;
    offset?: number;
    type?: string[];
    dateFrom?: Date;
    dateTo?: Date;
  } = {}): Promise<{ observations: Observation[]; totalCount: number }> {
    const { limit = 20, offset = 0, type, dateFrom, dateTo } = options;
    
    let filteredObservations = [...this.mockObservations];
    
    // Apply type filter
    if (type && type.length > 0) {
      filteredObservations = filteredObservations.filter(obs => type.includes(obs.type));
    }
    
    // Apply date filters
    if (dateFrom) {
      filteredObservations = filteredObservations.filter(obs => obs.createdAt >= dateFrom);
    }
    
    if (dateTo) {
      filteredObservations = filteredObservations.filter(obs => obs.createdAt <= dateTo);
    }
    
    // Sort by creation date (newest first)
    filteredObservations.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    
    // Apply pagination
    const paginatedObservations = filteredObservations.slice(offset, offset + limit);
    
    console.log(`Mock: Retrieved ${paginatedObservations.length} observations (total: ${filteredObservations.length})`);
    
    return {
      observations: paginatedObservations,
      totalCount: filteredObservations.length
    };
  }

  public getDatabase(): any {
    return null; // No actual database in web version
  }

  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
}
