/**
 * Environment configuration management for EAS build and App Store Connect
 * Handles secure loading and validation of API keys and configuration
 */

import { z } from 'zod';

// Validation schema for environment variables
const envSchema = z.object({
  // App Store Connect API
  ASC_API_KEY_ID: z.string().min(10, 'App Store Connect API Key ID is required'),
  ASC_API_KEY_ISSUER_ID: z.string().uuid('App Store Connect API Key Issuer ID must be a valid UUID'),
  ASC_API_KEY_PATH: z.string().min(1, 'Path to App Store Connect API private key is required'),
  ASC_APP_ID: z.string().min(1, 'App Store Connect App ID is required'),

  // Apple Developer
  APPLE_TEAM_ID: z.string().min(10, 'Apple Developer Team ID is required'),
  APPLE_DEVELOPER_EMAIL: z.string().email('Valid Apple Developer email is required'),

  // EAS Configuration
  EAS_PROJECT_ID: z.string().min(1, 'EAS Project ID is required'),
  EAS_BUILD_PROFILE: z.enum(['development', 'preview', 'production']).default('production'),

  // App Metadata
  APP_NAME: z.string().min(1, 'App name is required'),
  APP_BUNDLE_IDENTIFIER: z.string().regex(/^[a-zA-Z0-9.-]+$/, 'Bundle identifier must be valid'),
  APP_VERSION: z.string().regex(/^\d+\.\d+\.\d+$/, 'App version must follow semantic versioning'),
  APP_BUILD_NUMBER: z.string().min(1, 'Build number is required'),
  APP_CATEGORY: z.string().default('Health & Fitness'),
  APP_PRIVACY_POLICY_URL: z.string().url('Privacy policy URL must be valid'),

  // Build Settings
  NODE_ENV: z.enum(['development', 'staging', 'production']).default('production'),
  EXPO_PUBLIC_API_URL: z.string().url('API URL must be valid').optional(),
  EXPO_PUBLIC_ANALYTICS_ENABLED: z.string().transform(val => val === 'true').default('false'),
  EXPO_PUBLIC_DEBUG_MODE: z.string().transform(val => val === 'true').default('false'),

  // Wellness app compliance
  EXPO_PUBLIC_WELLNESS_DISCLAIMER: z.string().transform(val => val === 'true').default('true'),
  EXPO_PUBLIC_MEDICAL_DISCLAIMER: z.string().default('This app is for general wellness purposes only and is not intended for medical diagnosis or treatment.'),

  // Performance settings
  BUILD_TIMEOUT_MINUTES: z.string().transform(val => parseInt(val, 10)).default('15'),
  SUBMISSION_TIMEOUT_MINUTES: z.string().transform(val => parseInt(val, 10)).default('10'),
  RETRY_ATTEMPTS: z.string().transform(val => parseInt(val, 10)).default('3'),
  RETRY_DELAY_SECONDS: z.string().transform(val => parseInt(val, 10)).default('30'),
});

// Environment configuration type
export type EnvironmentConfig = z.infer<typeof envSchema>;

/**
 * Load and validate environment configuration
 * @returns Validated environment configuration
 * @throws Error if validation fails
 */
export function loadEnvironmentConfig(): EnvironmentConfig {
  // In React Native/Expo, environment variables are handled differently
  // This is a placeholder for the validation logic
  const rawEnv = {
    ASC_API_KEY_ID: process.env.ASC_API_KEY_ID || '',
    ASC_API_KEY_ISSUER_ID: process.env.ASC_API_KEY_ISSUER_ID || '',
    ASC_API_KEY_PATH: process.env.ASC_API_KEY_PATH || '',
    ASC_APP_ID: process.env.ASC_APP_ID || '',
    APPLE_TEAM_ID: process.env.APPLE_TEAM_ID || '',
    APPLE_DEVELOPER_EMAIL: process.env.APPLE_DEVELOPER_EMAIL || '',
    EAS_PROJECT_ID: process.env.EAS_PROJECT_ID || '',
    EAS_BUILD_PROFILE: process.env.EAS_BUILD_PROFILE || 'production',
    APP_NAME: process.env.APP_NAME || 'Mindful Bell',
    APP_BUNDLE_IDENTIFIER: process.env.APP_BUNDLE_IDENTIFIER || 'com.mindfulness.bell',
    APP_VERSION: process.env.APP_VERSION || '1.0.0',
    APP_BUILD_NUMBER: process.env.APP_BUILD_NUMBER || '1',
    APP_CATEGORY: process.env.APP_CATEGORY || 'Health & Fitness',
    APP_PRIVACY_POLICY_URL: process.env.APP_PRIVACY_POLICY_URL || 'https://example.com/privacy',
    NODE_ENV: process.env.NODE_ENV || 'production',
    EXPO_PUBLIC_API_URL: process.env.EXPO_PUBLIC_API_URL,
    EXPO_PUBLIC_ANALYTICS_ENABLED: process.env.EXPO_PUBLIC_ANALYTICS_ENABLED || 'false',
    EXPO_PUBLIC_DEBUG_MODE: process.env.EXPO_PUBLIC_DEBUG_MODE || 'false',
    EXPO_PUBLIC_WELLNESS_DISCLAIMER: process.env.EXPO_PUBLIC_WELLNESS_DISCLAIMER || 'true',
    EXPO_PUBLIC_MEDICAL_DISCLAIMER: process.env.EXPO_PUBLIC_MEDICAL_DISCLAIMER || 'This app is for general wellness purposes only and is not intended for medical diagnosis or treatment.',
    BUILD_TIMEOUT_MINUTES: process.env.BUILD_TIMEOUT_MINUTES || '15',
    SUBMISSION_TIMEOUT_MINUTES: process.env.SUBMISSION_TIMEOUT_MINUTES || '10',
    RETRY_ATTEMPTS: process.env.RETRY_ATTEMPTS || '3',
    RETRY_DELAY_SECONDS: process.env.RETRY_DELAY_SECONDS || '30',
  };

  try {
    return envSchema.parse(rawEnv);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors.map(err => `${err.path.join('.')}: ${err.message}`).join('\n');
      throw new Error(`Environment configuration validation failed:\n${errorMessages}`);
    }
    throw error;
  }
}

/**
 * Get environment configuration with caching
 */
let cachedConfig: EnvironmentConfig | null = null;

export function getEnvironmentConfig(): EnvironmentConfig {
  if (!cachedConfig) {
    cachedConfig = loadEnvironmentConfig();
  }
  return cachedConfig;
}

/**
 * Validate that all required API keys are present
 * @param config Environment configuration
 * @returns True if all keys are present
 */
export function validateApiKeys(config: EnvironmentConfig): boolean {
  const requiredKeys = [
    config.ASC_API_KEY_ID,
    config.ASC_API_KEY_ISSUER_ID,
    config.ASC_API_KEY_PATH,
    config.ASC_APP_ID,
    config.APPLE_TEAM_ID,
  ];

  return requiredKeys.every(key => key && key.length > 0);
}

/**
 * Check if running in development mode
 */
export function isDevelopment(): boolean {
  return getEnvironmentConfig().NODE_ENV === 'development';
}

/**
 * Check if running in production mode
 */
export function isProduction(): boolean {
  return getEnvironmentConfig().NODE_ENV === 'production';
}

/**
 * Get build timeout in milliseconds
 */
export function getBuildTimeoutMs(): number {
  return getEnvironmentConfig().BUILD_TIMEOUT_MINUTES * 60 * 1000;
}

/**
 * Get submission timeout in milliseconds
 */
export function getSubmissionTimeoutMs(): number {
  return getEnvironmentConfig().SUBMISSION_TIMEOUT_MINUTES * 60 * 1000;
}