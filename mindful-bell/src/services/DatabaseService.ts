import * as SQLite from 'expo-sqlite';
import { Observation, BellEvent, Settings } from '../types';

export class DatabaseService {
  private db: SQLite.SQLiteDatabase | null = null;
  private static instance: DatabaseService;

  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  public async initialize(): Promise<void> {
    this.db = await SQLite.openDatabaseAsync('mindful_bell.db');
    await this.createTables();
    await this.runMigrations();
  }

  private async createTables(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    // Create entries table (observations)
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS entries (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL CHECK (type IN ('desire', 'fear', 'affliction', 'lesson')),
        content TEXT NOT NULL,
        encrypted_content BLOB,
        tags TEXT, -- JSON array
        bell_event_id TEXT,
        created_at DATETIME NOT NULL,
        updated_at DATETIME NOT NULL,
        deleted_at DATETIME NULL,
        FOREIGN KEY (bell_event_id) REFERENCES bell_events(id)
      );
    `);

    // Create bell_events table
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS bell_events (
        id TEXT PRIMARY KEY,
        scheduled_at DATETIME NOT NULL,
        fired_at DATETIME NULL,
        acknowledged_at DATETIME NULL,
        status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'triggered', 'acknowledged', 'missed'))
      );
    `);

    // Create settings table
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS settings (
        id TEXT PRIMARY KEY DEFAULT 'default',
        active_windows TEXT NOT NULL, -- JSON array
        quiet_hours TEXT NOT NULL, -- JSON array
        density TEXT NOT NULL DEFAULT 'medium' CHECK (density IN ('low', 'medium', 'high')),
        sound_enabled BOOLEAN NOT NULL DEFAULT 1,
        vibration_enabled BOOLEAN NOT NULL DEFAULT 1,
        sound_file TEXT NULL,
        updated_at DATETIME NOT NULL
      );
    `);

    // Create indexes for performance
    await this.db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_entries_type ON entries(type);
      CREATE INDEX IF NOT EXISTS idx_entries_created_at ON entries(created_at);
      CREATE INDEX IF NOT EXISTS idx_entries_deleted_at ON entries(deleted_at);
      CREATE INDEX IF NOT EXISTS idx_bell_events_scheduled_at ON bell_events(scheduled_at);
      CREATE INDEX IF NOT EXISTS idx_bell_events_status ON bell_events(status);
    `);

    // Create full-text search table for observations
    await this.db.execAsync(`
      CREATE VIRTUAL TABLE IF NOT EXISTS entries_fts USING fts5(
        content, tags,
        content='entries',
        content_rowid='rowid'
      );
    `);

    // Create triggers to keep FTS table in sync
    await this.db.execAsync(`
      CREATE TRIGGER IF NOT EXISTS entries_fts_insert AFTER INSERT ON entries BEGIN
        INSERT INTO entries_fts(rowid, content, tags) VALUES (new.rowid, new.content, new.tags);
      END;
    `);

    await this.db.execAsync(`
      CREATE TRIGGER IF NOT EXISTS entries_fts_delete AFTER DELETE ON entries BEGIN
        INSERT INTO entries_fts(entries_fts, rowid, content, tags) VALUES('delete', old.rowid, old.content, old.tags);
      END;
    `);

    await this.db.execAsync(`
      CREATE TRIGGER IF NOT EXISTS entries_fts_update AFTER UPDATE ON entries BEGIN
        INSERT INTO entries_fts(entries_fts, rowid, content, tags) VALUES('delete', old.rowid, old.content, old.tags);
        INSERT INTO entries_fts(rowid, content, tags) VALUES (new.rowid, new.content, new.tags);
      END;
    `);
  }

  private async runMigrations(): Promise<void> {
    // Schema version tracking
    await this.db?.execAsync(`
      CREATE TABLE IF NOT EXISTS schema_version (
        version INTEGER PRIMARY KEY,
        applied_at DATETIME NOT NULL
      );
    `);

    const currentVersion = await this.getCurrentSchemaVersion();

    // Run migrations if needed
    if (currentVersion < 1) {
      // Initial schema is version 1
      await this.db?.execAsync(`
        INSERT OR REPLACE INTO schema_version (version, applied_at)
        VALUES (1, datetime('now'));
      `);
    }

    // Future migrations would go here
    // if (currentVersion < 2) { ... }
  }

  private async getCurrentSchemaVersion(): Promise<number> {
    if (!this.db) return 0;

    try {
      const result = await this.db.getFirstAsync<{ version: number }>(`
        SELECT version FROM schema_version ORDER BY version DESC LIMIT 1;
      `);
      return result?.version || 0;
    } catch {
      return 0;
    }
  }

  public async insertObservation(observation: Omit<Observation, 'id' | 'createdAt' | 'updatedAt'>): Promise<Observation> {
    if (!this.db) throw new Error('Database not initialized');

    const id = this.generateUUID();
    const now = new Date().toISOString();

    await this.db.runAsync(`
      INSERT INTO entries (id, type, content, tags, bell_event_id, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      id,
      observation.type,
      observation.content,
      JSON.stringify(observation.tags),
      observation.bellEventId || null,
      now,
      now
    ]);

    return {
      id,
      ...observation,
      createdAt: new Date(now),
      updatedAt: new Date(now)
    };
  }

  public async updateObservation(id: string, updates: Partial<Observation>): Promise<Observation> {
    if (!this.db) throw new Error('Database not initialized');

    const now = new Date().toISOString();

    await this.db.runAsync(`
      UPDATE entries
      SET content = COALESCE(?, content),
          tags = COALESCE(?, tags),
          updated_at = ?
      WHERE id = ? AND deleted_at IS NULL
    `, [
      updates.content || null,
      updates.tags ? JSON.stringify(updates.tags) : null,
      now,
      id
    ]);

    return this.getObservationById(id);
  }

  public async getObservationById(id: string): Promise<Observation> {
    if (!this.db) throw new Error('Database not initialized');

    const result = await this.db.getFirstAsync<any>(`
      SELECT * FROM entries WHERE id = ? AND deleted_at IS NULL
    `, [id]);

    if (!result) throw new Error('Observation not found');

    return this.mapRowToObservation(result);
  }

  public async insertBellEvent(bellEvent: Omit<BellEvent, 'id'>): Promise<BellEvent> {
    if (!this.db) throw new Error('Database not initialized');

    const id = this.generateUUID();

    await this.db.runAsync(`
      INSERT INTO bell_events (id, scheduled_at, fired_at, acknowledged_at, status)
      VALUES (?, ?, ?, ?, ?)
    `, [
      id,
      bellEvent.scheduledTime.toISOString(),
      bellEvent.firedAt?.toISOString() || null,
      bellEvent.acknowledgedAt?.toISOString() || null,
      bellEvent.status
    ]);

    return { id, ...bellEvent };
  }

  public async getSettings(): Promise<Settings> {
    if (!this.db) throw new Error('Database not initialized');

    let result = await this.db.getFirstAsync<any>(`
      SELECT * FROM settings WHERE id = 'default'
    `);

    if (!result) {
      // Create default settings
      const defaultSettings = {
        id: 'default',
        activeWindows: [{ start: '09:00', end: '17:00' }],
        quietHours: [{ start: '22:00', end: '07:00' }],
        bellDensity: 'medium' as const,
        soundEnabled: true,
        vibrationEnabled: true,
        updatedAt: new Date()
      };

      await this.db.runAsync(`
        INSERT INTO settings (id, active_windows, quiet_hours, density, sound_enabled, vibration_enabled, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [
        'default',
        JSON.stringify(defaultSettings.activeWindows),
        JSON.stringify(defaultSettings.quietHours),
        defaultSettings.bellDensity,
        defaultSettings.soundEnabled ? 1 : 0,
        defaultSettings.vibrationEnabled ? 1 : 0,
        defaultSettings.updatedAt.toISOString()
      ]);

      return defaultSettings;
    }

    return this.mapRowToSettings(result);
  }

  public async updateSettings(updates: Partial<Settings>): Promise<Settings> {
    if (!this.db) throw new Error('Database not initialized');

    const now = new Date().toISOString();

    const updateFields = [];
    const values = [];

    if (updates.activeWindows) {
      updateFields.push('active_windows = ?');
      values.push(JSON.stringify(updates.activeWindows));
    }
    if (updates.quietHours) {
      updateFields.push('quiet_hours = ?');
      values.push(JSON.stringify(updates.quietHours));
    }
    if (updates.bellDensity) {
      updateFields.push('density = ?');
      values.push(updates.bellDensity);
    }
    if (updates.soundEnabled !== undefined) {
      updateFields.push('sound_enabled = ?');
      values.push(updates.soundEnabled ? 1 : 0);
    }
    if (updates.vibrationEnabled !== undefined) {
      updateFields.push('vibration_enabled = ?');
      values.push(updates.vibrationEnabled ? 1 : 0);
    }
    if (updates.soundFile !== undefined) {
      updateFields.push('sound_file = ?');
      values.push(updates.soundFile);
    }

    updateFields.push('updated_at = ?');
    values.push(now);
    values.push('default');

    await this.db.runAsync(`
      UPDATE settings SET ${updateFields.join(', ')} WHERE id = ?
    `, values);

    return this.getSettings();
  }

  private mapRowToObservation(row: any): Observation {
    return {
      id: row.id,
      type: row.type,
      content: row.content,
      tags: JSON.parse(row.tags || '[]'),
      bellEventId: row.bell_event_id,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      deletedAt: row.deleted_at ? new Date(row.deleted_at) : undefined
    };
  }

  private mapRowToSettings(row: any): Settings {
    return {
      id: row.id,
      activeWindows: JSON.parse(row.active_windows),
      quietHours: JSON.parse(row.quiet_hours),
      bellDensity: row.density,
      soundEnabled: Boolean(row.sound_enabled),
      vibrationEnabled: Boolean(row.vibration_enabled),
      soundFile: row.sound_file,
      updatedAt: new Date(row.updated_at)
    };
  }

  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  public getDatabase(): SQLite.SQLiteDatabase | null {
    return this.db;
  }
}