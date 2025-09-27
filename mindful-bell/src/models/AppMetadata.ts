/**
 * App Metadata model with App Store requirements
 * Stores App Store submission information and app details
 */

import { z } from 'zod';

// Validation schemas
const BundleIdentifierSchema = z.string().regex(
  /^[a-zA-Z0-9.-]+$/,
  'Bundle identifier must contain only alphanumeric characters, dots, and hyphens'
);

const SemanticVersionSchema = z.string().regex(
  /^\d+\.\d+\.\d+$/,
  'Version must follow semantic versioning (x.y.z)'
);

const BuildNumberSchema = z.string().regex(
  /^\d+$/,
  'Build number must be numeric'
);

const DescriptionSchema = z.string()
  .min(170, 'Description must be at least 170 characters')
  .max(4000, 'Description must not exceed 4000 characters');

const KeywordsSchema = z.array(z.string())
  .refine(
    (keywords) => keywords.join(',').length <= 100,
    'Keywords total length must not exceed 100 characters'
  );

const UrlSchema = z.string().url('Must be a valid URL');

const AppCategorySchema = z.enum([
  'Health & Fitness',
  'Lifestyle',
  'Medical',
  'Utilities',
  'Productivity',
  'Entertainment'
]);

const ScreenshotSchema = z.object({
  deviceType: z.enum(['iPhone', 'iPad']),
  size: z.enum(['6.5"', '5.5"', '12.9"', '6.7"']),
  url: z.string().url(),
  order: z.number().min(1).max(10)
});

const AppMetadataSchema = z.object({
  name: z.string().min(1).max(50, 'App name must not exceed 50 characters'),
  bundleIdentifier: BundleIdentifierSchema,
  version: SemanticVersionSchema,
  buildNumber: BuildNumberSchema,
  description: DescriptionSchema,
  keywords: KeywordsSchema,
  category: AppCategorySchema,
  privacyPolicyUrl: UrlSchema,
  screenshots: z.array(ScreenshotSchema).min(1).max(10),
  copyright: z.string().optional(),
  supportUrl: UrlSchema.optional(),
  marketingUrl: UrlSchema.optional(),
  ageRating: z.enum(['4+', '9+', '12+', '17+']).default('4+'),
  contentAdvisory: z.string().optional(),
});

// Type definitions
export type AppCategory = z.infer<typeof AppCategorySchema>;
export type Screenshot = z.infer<typeof ScreenshotSchema>;
export type AgeRating = '4+' | '9+' | '12+' | '17+';

export interface AppMetadataData {
  name: string;
  bundleIdentifier: string;
  version: string;
  buildNumber: string;
  description: string;
  keywords: string[];
  category: AppCategory;
  privacyPolicyUrl: string;
  screenshots: Screenshot[];
  copyright?: string;
  supportUrl?: string;
  marketingUrl?: string;
  ageRating?: AgeRating;
  contentAdvisory?: string;
}

export interface AppMetadataValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  compliance: {
    wellnessApp: boolean;
    privacyCompliant: boolean;
    contentAppropriate: boolean;
    metadataComplete: boolean;
  };
}

/**
 * App Metadata model class
 */
export class AppMetadata {
  private _data: AppMetadataData;
  private _lastValidation?: AppMetadataValidation;
  private _updatedAt: Date;

  constructor(data: AppMetadataData) {
    this._data = { ...data };
    this._updatedAt = new Date();
  }

  // Getters
  get name(): string {
    return this._data.name;
  }

  get bundleIdentifier(): string {
    return this._data.bundleIdentifier;
  }

  get version(): string {
    return this._data.version;
  }

  get buildNumber(): string {
    return this._data.buildNumber;
  }

  get description(): string {
    return this._data.description;
  }

  get keywords(): string[] {
    return [...this._data.keywords];
  }

  get category(): AppCategory {
    return this._data.category;
  }

  get privacyPolicyUrl(): string {
    return this._data.privacyPolicyUrl;
  }

  get screenshots(): Screenshot[] {
    return [...this._data.screenshots];
  }

  get ageRating(): AgeRating {
    return this._data.ageRating || '4+';
  }

  get data(): Readonly<AppMetadataData> {
    return { ...this._data };
  }

  get lastValidation(): AppMetadataValidation | undefined {
    return this._lastValidation ? { ...this._lastValidation } : undefined;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  // Validation methods
  public validate(): AppMetadataValidation {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Schema validation
      AppMetadataSchema.parse(this._data);

      // Wellness app specific validations
      this.validateWellnessAppRequirements(errors, warnings);

      // Privacy compliance validation
      this.validatePrivacyCompliance(errors, warnings);

      // Content appropriateness validation
      this.validateContentAppropriateness(errors, warnings);

      // Metadata completeness validation
      this.validateMetadataCompleteness(errors, warnings);

      const validation: AppMetadataValidation = {
        isValid: errors.length === 0,
        errors,
        warnings,
        compliance: {
          wellnessApp: this.isWellnessAppCompliant(),
          privacyCompliant: this.isPrivacyCompliant(),
          contentAppropriate: this.isContentAppropriate(),
          metadataComplete: this.isMetadataComplete()
        }
      };

      this._lastValidation = validation;
      return validation;

    } catch (error) {
      if (error instanceof z.ZodError) {
        const zodErrors = error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
        errors.push(...zodErrors);
      } else {
        errors.push(error instanceof Error ? error.message : 'Unknown validation error');
      }

      const validation: AppMetadataValidation = {
        isValid: false,
        errors,
        warnings,
        compliance: {
          wellnessApp: false,
          privacyCompliant: false,
          contentAppropriate: false,
          metadataComplete: false
        }
      };

      this._lastValidation = validation;
      return validation;
    }
  }

  private validateWellnessAppRequirements(errors: string[], warnings: string[]): void {
    // Health & Fitness category specific requirements
    if (this._data.category === 'Health & Fitness') {
      // Must include wellness disclaimer in description
      if (!this._data.description.toLowerCase().includes('wellness') &&
          !this._data.description.toLowerCase().includes('general purposes only')) {
        errors.push('Health & Fitness apps must include wellness disclaimer in description');
      }

      // Should not make medical claims
      const medicalClaims = ['cure', 'treat', 'diagnose', 'therapy', 'medical treatment'];
      const hasmedicalClaims = medicalClaims.some(claim =>
        this._data.description.toLowerCase().includes(claim)
      );
      if (hasmedicalClaims) {
        errors.push('Wellness apps should not make medical claims');
      }

      // Age rating should be appropriate
      if (this._data.ageRating && this._data.ageRating !== '4+') {
        warnings.push('Wellness apps typically use 4+ age rating');
      }
    }

    // Mindfulness-specific keyword validation
    const mindfulnessKeywords = ['mindfulness', 'meditation', 'wellness', 'bell'];
    const hasMindfulnessKeywords = mindfulnessKeywords.some(keyword =>
      this._data.keywords.some(k => k.toLowerCase().includes(keyword))
    );
    if (!hasMindfulnessKeywords) {
      warnings.push('Consider including mindfulness-related keywords for better discoverability');
    }
  }

  private validatePrivacyCompliance(errors: string[], warnings: string[]): void {
    // Privacy policy URL is required
    if (!this._data.privacyPolicyUrl) {
      errors.push('Privacy policy URL is required');
    }

    // Support URL recommended for wellness apps
    if (!this._data.supportUrl) {
      warnings.push('Support URL is recommended for wellness apps');
    }

    // Description should mention privacy practices
    if (!this._data.description.toLowerCase().includes('privacy')) {
      warnings.push('Consider mentioning privacy practices in app description');
    }
  }

  private validateContentAppropriateness(errors: string[], warnings: string[]): void {
    // Check for inappropriate content in description
    const inappropriateWords = ['addiction', 'self-harm', 'suicide'];
    const hasInappropriateContent = inappropriateWords.some(word =>
      this._data.description.toLowerCase().includes(word)
    );
    if (hasInappropriateContent) {
      errors.push('App description contains potentially inappropriate content for wellness app');
    }

    // Validate age rating alignment with content
    if (this._data.contentAdvisory && this._data.ageRating === '4+') {
      warnings.push('Content advisory present but age rating is 4+ - verify appropriateness');
    }
  }

  private validateMetadataCompleteness(errors: string[], warnings: string[]): void {
    // Screenshots validation
    if (this._data.screenshots.length < 3) {
      warnings.push('Consider providing at least 3 screenshots for better App Store presentation');
    }

    // Check for iPhone and iPad screenshots
    const hasIPhoneScreenshots = this._data.screenshots.some(s => s.deviceType === 'iPhone');
    const hasIPadScreenshots = this._data.screenshots.some(s => s.deviceType === 'iPad');

    if (!hasIPhoneScreenshots) {
      errors.push('At least one iPhone screenshot is required');
    }

    if (!hasIPadScreenshots) {
      warnings.push('iPad screenshots recommended for universal apps');
    }

    // Marketing URL recommended
    if (!this._data.marketingUrl) {
      warnings.push('Marketing URL recommended for professional app presentation');
    }

    // Copyright notice
    if (!this._data.copyright) {
      warnings.push('Copyright notice recommended');
    }
  }

  // Compliance checks
  private isWellnessAppCompliant(): boolean {
    return this._data.category === 'Health & Fitness' &&
           this._data.description.toLowerCase().includes('wellness') &&
           !this._data.description.toLowerCase().includes('cure') &&
           !this._data.description.toLowerCase().includes('treat');
  }

  private isPrivacyCompliant(): boolean {
    return !!this._data.privacyPolicyUrl;
  }

  private isContentAppropriate(): boolean {
    const inappropriateWords = ['addiction', 'self-harm', 'suicide'];
    return !inappropriateWords.some(word =>
      this._data.description.toLowerCase().includes(word)
    );
  }

  private isMetadataComplete(): boolean {
    return this._data.screenshots.length >= 1 &&
           this._data.screenshots.some(s => s.deviceType === 'iPhone') &&
           !!this._data.privacyPolicyUrl;
  }

  // Update methods
  public updateDescription(description: string): void {
    this._data.description = description;
    this._updatedAt = new Date();
    this._lastValidation = undefined; // Reset validation
  }

  public updateKeywords(keywords: string[]): void {
    this._data.keywords = [...keywords];
    this._updatedAt = new Date();
    this._lastValidation = undefined;
  }

  public addScreenshot(screenshot: Screenshot): void {
    this._data.screenshots.push(screenshot);
    this._updatedAt = new Date();
    this._lastValidation = undefined;
  }

  public updateVersion(version: string, buildNumber?: string): void {
    this._data.version = version;
    if (buildNumber) {
      this._data.buildNumber = buildNumber;
    }
    this._updatedAt = new Date();
    this._lastValidation = undefined;
  }

  public update(updates: Partial<AppMetadataData>): void {
    this._data = { ...this._data, ...updates };
    this._updatedAt = new Date();
    this._lastValidation = undefined;
  }

  // Utility methods
  public isValid(): boolean {
    if (!this._lastValidation) {
      this.validate();
    }
    return this._lastValidation?.isValid || false;
  }

  public getValidationErrors(): string[] {
    if (!this._lastValidation) {
      this.validate();
    }
    return this._lastValidation?.errors || [];
  }

  public getValidationWarnings(): string[] {
    if (!this._lastValidation) {
      this.validate();
    }
    return this._lastValidation?.warnings || [];
  }

  // Serialization
  public toJSON(): object {
    return {
      data: this._data,
      lastValidation: this._lastValidation,
      updatedAt: this._updatedAt.toISOString(),
    };
  }

  public static fromJSON(json: any): AppMetadata {
    const metadata = new AppMetadata(json.data);
    metadata._lastValidation = json.lastValidation;
    metadata._updatedAt = new Date(json.updatedAt);
    return metadata;
  }

  // Static factory methods
  public static createMindfulBellApp(version: string = '1.0.0'): AppMetadata {
    return new AppMetadata({
      name: 'Mindful Bell',
      bundleIdentifier: 'com.mindfulness.bell',
      version,
      buildNumber: '1',
      description: 'A mindfulness bell app for meditation practice. This app is designed for general wellness purposes only and is not intended for medical diagnosis or treatment. Practice mindful awareness with customizable bell sounds and meditation timers.',
      keywords: ['mindfulness', 'meditation', 'bell', 'wellness', 'mental health'],
      category: 'Health & Fitness',
      privacyPolicyUrl: 'https://mindfulness-app.com/privacy',
      screenshots: [
        {
          deviceType: 'iPhone',
          size: '6.7"',
          url: 'https://example.com/screenshot-iphone-1.png',
          order: 1
        }
      ],
      copyright: '2025 Mindful Bell App',
      ageRating: '4+',
      contentAdvisory: 'None - Wellness application for meditation support'
    });
  }
}