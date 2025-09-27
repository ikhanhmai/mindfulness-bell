/**
 * Build Configuration model with validation
 * Manages EAS build settings and environment configurations
 */

import { z } from 'zod';

// Validation schemas
const BuildProfileSchema = z.enum(['development', 'preview', 'production']);
const PlatformSchema = z.enum(['ios', 'android']);
const ResourceClassSchema = z.enum(['small', 'medium', 'large']);
const DistributionSchema = z.enum(['internal', 'store']);

const EnvironmentVariablesSchema = z.record(z.string(), z.string());

const BuildConfigurationSchema = z.object({
  profile: BuildProfileSchema,
  platform: PlatformSchema,
  resourceClass: ResourceClassSchema.optional(),
  image: z.string().optional(),
  node: z.string().optional(),
  environment: EnvironmentVariablesSchema.optional(),
  distribution: DistributionSchema.optional(),
  gitCommitHash: z.string().optional(),
  simulator: z.boolean().optional(),
  buildNumber: z.string().optional(),
  appVersion: z.string().regex(/^\d+\.\d+\.\d+$/, 'Version must follow semantic versioning').optional(),
});

// Validation states enum
export enum ValidationState {
  CREATED = 'created',
  VALIDATED = 'validated',
  BUILDING = 'building',
  COMPLETE = 'complete',
  FAILED = 'failed'
}

// Type definitions
export type BuildProfile = z.infer<typeof BuildProfileSchema>;
export type Platform = z.infer<typeof PlatformSchema>;
export type ResourceClass = z.infer<typeof ResourceClassSchema>;
export type Distribution = z.infer<typeof DistributionSchema>;
export type EnvironmentVariables = z.infer<typeof EnvironmentVariablesSchema>;

export interface BuildConfigurationData {
  profile: BuildProfile;
  platform: Platform;
  resourceClass?: ResourceClass;
  image?: string;
  node?: string;
  environment?: EnvironmentVariables;
  distribution?: Distribution;
  gitCommitHash?: string;
  simulator?: boolean;
  buildNumber?: string;
  appVersion?: string;
}

export interface BuildConfigurationMetadata {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  state: ValidationState;
  validationErrors?: string[];
}

/**
 * Build Configuration model class
 */
export class BuildConfiguration {
  private _data: BuildConfigurationData;
  private _metadata: BuildConfigurationMetadata;

  constructor(data: BuildConfigurationData, id?: string) {
    this._data = { ...data };
    this._metadata = {
      id: id || this.generateId(),
      createdAt: new Date(),
      updatedAt: new Date(),
      state: ValidationState.CREATED,
    };
  }

  // Getters
  get id(): string {
    return this._metadata.id;
  }

  get profile(): BuildProfile {
    return this._data.profile;
  }

  get platform(): Platform {
    return this._data.platform;
  }

  get resourceClass(): ResourceClass | undefined {
    return this._data.resourceClass;
  }

  get distribution(): Distribution | undefined {
    return this._data.distribution;
  }

  get environment(): EnvironmentVariables | undefined {
    return this._data.environment;
  }

  get simulator(): boolean | undefined {
    return this._data.simulator;
  }

  get state(): ValidationState {
    return this._metadata.state;
  }

  get createdAt(): Date {
    return this._metadata.createdAt;
  }

  get updatedAt(): Date {
    return this._metadata.updatedAt;
  }

  get data(): Readonly<BuildConfigurationData> {
    return { ...this._data };
  }

  get metadata(): Readonly<BuildConfigurationMetadata> {
    return { ...this._metadata };
  }

  // Validation methods
  public validate(): boolean {
    try {
      // Basic schema validation
      BuildConfigurationSchema.parse(this._data);

      // Business rule validations
      const errors: string[] = [];

      // Rule: Production builds require 'store' distribution
      if (this._data.profile === 'production' && this._data.distribution !== 'store') {
        errors.push('Production builds must have distribution set to "store"');
      }

      // Rule: Development builds can be internal or simulator
      if (this._data.profile === 'development' && this._data.distribution === 'store') {
        errors.push('Development builds cannot have distribution set to "store"');
      }

      // Rule: Resource class must align with build complexity
      if (this._data.profile === 'production' && this._data.resourceClass === 'small') {
        errors.push('Production builds should use medium or large resource class');
      }

      // Rule: iOS builds require specific image if specified
      if (this._data.platform === 'ios' && this._data.image && !this._data.image.includes('macos')) {
        errors.push('iOS builds require macOS build environment');
      }

      // Rule: Wellness app environment variables validation
      if (this._data.environment) {
        this.validateWellnessAppEnvironment(this._data.environment, errors);
      }

      if (errors.length > 0) {
        this._metadata.validationErrors = errors;
        this._metadata.state = ValidationState.FAILED;
        this.updateTimestamp();
        return false;
      }

      this._metadata.state = ValidationState.VALIDATED;
      this._metadata.validationErrors = undefined;
      this.updateTimestamp();
      return true;

    } catch (error) {
      if (error instanceof z.ZodError) {
        const zodErrors = error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
        this._metadata.validationErrors = zodErrors;
      } else {
        this._metadata.validationErrors = [error instanceof Error ? error.message : 'Unknown validation error'];
      }
      this._metadata.state = ValidationState.FAILED;
      this.updateTimestamp();
      return false;
    }
  }

  private validateWellnessAppEnvironment(env: EnvironmentVariables, errors: string[]): void {
    // Wellness app specific validations
    if (env.EXPO_PUBLIC_WELLNESS_DISCLAIMER !== 'true') {
      errors.push('Wellness apps must have EXPO_PUBLIC_WELLNESS_DISCLAIMER set to "true"');
    }

    if (!env.EXPO_PUBLIC_MEDICAL_DISCLAIMER) {
      errors.push('Wellness apps must include EXPO_PUBLIC_MEDICAL_DISCLAIMER');
    }

    // Analytics must be explicitly controlled
    if (env.EXPO_PUBLIC_ANALYTICS_ENABLED === undefined) {
      errors.push('Analytics setting must be explicitly defined for wellness apps');
    }
  }

  // State management
  public markBuilding(): void {
    if (this._metadata.state !== ValidationState.VALIDATED) {
      throw new Error('Cannot start building: configuration must be validated first');
    }
    this._metadata.state = ValidationState.BUILDING;
    this.updateTimestamp();
  }

  public markComplete(): void {
    if (this._metadata.state !== ValidationState.BUILDING) {
      throw new Error('Cannot mark complete: configuration must be in building state');
    }
    this._metadata.state = ValidationState.COMPLETE;
    this.updateTimestamp();
  }

  public markFailed(errors: string[]): void {
    this._metadata.state = ValidationState.FAILED;
    this._metadata.validationErrors = errors;
    this.updateTimestamp();
  }

  // Utility methods
  public isValid(): boolean {
    return this._metadata.state === ValidationState.VALIDATED || this._metadata.state === ValidationState.COMPLETE;
  }

  public canBuild(): boolean {
    return this._metadata.state === ValidationState.VALIDATED;
  }

  public getValidationErrors(): string[] {
    return this._metadata.validationErrors || [];
  }

  public update(updates: Partial<BuildConfigurationData>): void {
    this._data = { ...this._data, ...updates };
    this._metadata.state = ValidationState.CREATED; // Reset state after update
    this.updateTimestamp();
  }

  public clone(): BuildConfiguration {
    return new BuildConfiguration(this._data);
  }

  // Serialization
  public toJSON(): object {
    return {
      data: this._data,
      metadata: this._metadata,
    };
  }

  public static fromJSON(json: any): BuildConfiguration {
    const config = new BuildConfiguration(json.data, json.metadata.id);
    config._metadata = {
      ...json.metadata,
      createdAt: new Date(json.metadata.createdAt),
      updatedAt: new Date(json.metadata.updatedAt),
    };
    return config;
  }

  // Static factory methods
  public static createDevelopment(platform: Platform): BuildConfiguration {
    return new BuildConfiguration({
      profile: 'development',
      platform,
      distribution: 'internal',
      resourceClass: 'medium',
      simulator: platform === 'ios',
      environment: {
        NODE_ENV: 'development',
        EXPO_PUBLIC_DEBUG_MODE: 'true',
        EXPO_PUBLIC_ANALYTICS_ENABLED: 'false',
        EXPO_PUBLIC_WELLNESS_DISCLAIMER: 'true',
        EXPO_PUBLIC_MEDICAL_DISCLAIMER: 'This app is for development testing only'
      }
    });
  }

  public static createProduction(platform: Platform, appVersion: string): BuildConfiguration {
    return new BuildConfiguration({
      profile: 'production',
      platform,
      distribution: 'store',
      resourceClass: 'large',
      appVersion,
      environment: {
        NODE_ENV: 'production',
        EXPO_PUBLIC_DEBUG_MODE: 'false',
        EXPO_PUBLIC_ANALYTICS_ENABLED: 'true',
        EXPO_PUBLIC_WELLNESS_DISCLAIMER: 'true',
        EXPO_PUBLIC_MEDICAL_DISCLAIMER: 'This app is for general wellness purposes only and is not intended for medical diagnosis or treatment.'
      }
    });
  }

  private generateId(): string {
    return `build-config-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private updateTimestamp(): void {
    this._metadata.updatedAt = new Date();
  }
}