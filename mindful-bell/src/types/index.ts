// Core entity types
export type ObservationType = 'desire' | 'fear' | 'affliction' | 'lesson';

export type BellDensity = 'low' | 'medium' | 'high';

export interface TimeWindow {
  start: string; // Format: "HH:MM"
  end: string;   // Format: "HH:MM"
}

// Bell Event entity
export interface BellEvent {
  id: string;
  scheduledTime: Date;
  firedAt?: Date;
  acknowledgedAt?: Date;
  status: 'scheduled' | 'triggered' | 'acknowledged' | 'missed';
}

// Observation entity
export interface Observation {
  id: string;
  type: ObservationType;
  content: string;
  tags: string[];
  bellEventId?: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

// Settings entity
export interface Settings {
  id: string;
  activeWindows: TimeWindow[];
  quietHours: TimeWindow[];
  bellDensity: BellDensity;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  soundFile?: string;
  updatedAt: Date;
}

// Stats entity
export interface Stats {
  period: 'day' | 'week' | 'month';
  bellsScheduled: number;
  bellsAcknowledged: number;
  acknowledgeRate: number;
  entriesCreated: number;
  entriesByType: {
    desire: number;
    fear: number;
    affliction: number;
    lesson: number;
  };
}

// API Request/Response types
export interface CreateObservationRequest {
  type: ObservationType;
  content: string;
  tags?: string[];
  bellEventId?: string;
}

export interface UpdateObservationRequest {
  content: string;
  tags?: string[];
}

export interface ListObservationsRequest {
  type?: ObservationType[];
  search?: string;
  tags?: string;
  dateFrom?: Date;
  dateTo?: Date;
  limit?: number;
  offset?: number;
  sortBy?: 'created_at' | 'updated_at' | 'relevance';
  sortOrder?: 'asc' | 'desc';
  includeDeleted?: boolean;
}

export interface ListObservationsResponse {
  observations: Observation[];
  pagination: Pagination;
  searchMetadata?: SearchMetadata;
}

export interface Pagination {
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

export interface SearchMetadata {
  query: string;
  totalMatches: number;
  executionTimeMs: number;
}

export interface DeleteObservationResponse {
  deleted: boolean;
  undoTimeoutSeconds?: number;
}

// Bell Scheduler types
export interface GenerateScheduleRequest {
  date: Date;
  density: BellDensity;
  activeWindows: TimeWindow[];
  quietHours: TimeWindow[];
  minimumInterval?: number;
}

export interface ValidateScheduleParamsRequest {
  density: BellDensity;
  activeWindows: TimeWindow[];
  quietHours: TimeWindow[];
  minimumInterval?: number;
}

export interface ValidateScheduleParamsResponse {
  valid: boolean;
  estimatedBellsPerDay: number;
  availableMinutesPerDay: number;
  warnings: string[];
}

// Settings types
export interface UpdateSettingsRequest {
  activeWindows?: TimeWindow[];
  quietHours?: TimeWindow[];
  bellDensity?: BellDensity;
  soundEnabled?: boolean;
  vibrationEnabled?: boolean;
  soundFile?: string;
}

export interface ValidateSettingsResponse {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

// Navigation types
export type RootTabParamList = {
  Home: undefined;
  Observations: undefined;
  Stats: undefined;
  Settings: undefined;
};