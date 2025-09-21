import { Observation, ObservationType } from '../types';
import { DatabaseService } from './DatabaseService';

export class ObservationService {
  private static instance: ObservationService;
  private db: DatabaseService;

  private constructor() {
    this.db = DatabaseService.getInstance();
  }

  public static getInstance(): ObservationService {
    if (!ObservationService.instance) {
      ObservationService.instance = new ObservationService();
    }
    return ObservationService.instance;
  }

  public async createObservation(
    type: ObservationType,
    content: string,
    tags: string[] = [],
    bellEventId?: string
  ): Promise<Observation> {
    this.validateObservationData(type, content);

    return await this.db.insertObservation({
      type,
      content: content.trim(),
      tags,
      bellEventId
    });
  }

  public async updateObservation(
    id: string,
    updates: Partial<Pick<Observation, 'content' | 'tags'>>
  ): Promise<Observation> {
    if (updates.content !== undefined) {
      this.validateContent(updates.content);
      updates.content = updates.content.trim();
    }

    return await this.db.updateObservation(id, updates);
  }

  public async getObservationById(id: string): Promise<Observation> {
    return await this.db.getObservationById(id);
  }

  public async getObservationsByType(
    type: ObservationType,
    limit?: number,
    offset?: number
  ): Promise<Observation[]> {
    // This would be implemented with a proper query method in DatabaseService
    // For now, we'll create a placeholder implementation
    return [];
  }

  public async getRecentObservations(
    limit: number = 20,
    offset: number = 0
  ): Promise<Observation[]> {
    // This would be implemented with a proper query method in DatabaseService
    // For now, we'll create a placeholder implementation
    return [];
  }

  public async searchObservations(
    query: string,
    limit: number = 20
  ): Promise<Observation[]> {
    // This would use the FTS functionality in DatabaseService
    // For now, we'll create a placeholder implementation
    return [];
  }

  public async getObservationsByDateRange(
    startDate: Date,
    endDate: Date
  ): Promise<Observation[]> {
    // This would be implemented with a proper query method in DatabaseService
    // For now, we'll create a placeholder implementation
    return [];
  }

  public async getObservationStats(): Promise<{
    totalCount: number;
    typeBreakdown: Record<ObservationType, number>;
    recentCount: number;
  }> {
    // This would be implemented with aggregate queries in DatabaseService
    // For now, we'll create a placeholder implementation
    return {
      totalCount: 0,
      typeBreakdown: {
        desire: 0,
        fear: 0,
        affliction: 0,
        lesson: 0
      },
      recentCount: 0
    };
  }

  public async deleteObservation(id: string): Promise<void> {
    // Soft delete by setting deleted_at timestamp
    await this.db.updateObservation(id, { deletedAt: new Date() });
  }

  private validateObservationData(type: ObservationType, content: string): void {
    this.validateType(type);
    this.validateContent(content);
  }

  private validateType(type: ObservationType): void {
    const validTypes: ObservationType[] = ['desire', 'fear', 'affliction', 'lesson'];
    if (!validTypes.includes(type)) {
      throw new Error(`Invalid observation type: ${type}. Must be one of: ${validTypes.join(', ')}`);
    }
  }

  private validateContent(content: string): void {
    if (!content || typeof content !== 'string') {
      throw new Error('Content is required and must be a string');
    }

    const trimmedContent = content.trim();
    if (trimmedContent.length === 0) {
      throw new Error('Content cannot be empty');
    }

    if (trimmedContent.length > 5000) {
      throw new Error('Content cannot exceed 5000 characters');
    }

    if (trimmedContent.length < 3) {
      throw new Error('Content must be at least 3 characters long');
    }
  }

  public validateTags(tags: string[]): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!Array.isArray(tags)) {
      errors.push('Tags must be an array');
      return { valid: false, errors };
    }

    if (tags.length > 10) {
      errors.push('Cannot have more than 10 tags');
    }

    for (const tag of tags) {
      if (typeof tag !== 'string') {
        errors.push('All tags must be strings');
        continue;
      }

      const trimmedTag = tag.trim();
      if (trimmedTag.length === 0) {
        errors.push('Tags cannot be empty');
        continue;
      }

      if (trimmedTag.length > 50) {
        errors.push('Tags cannot exceed 50 characters');
        continue;
      }

      if (!/^[a-zA-Z0-9\s\-_]+$/.test(trimmedTag)) {
        errors.push('Tags can only contain letters, numbers, spaces, hyphens, and underscores');
        continue;
      }
    }

    // Check for duplicate tags
    const uniqueTags = new Set(tags.map(tag => tag.trim().toLowerCase()));
    if (uniqueTags.size !== tags.length) {
      errors.push('Duplicate tags are not allowed');
    }

    return { valid: errors.length === 0, errors };
  }
}