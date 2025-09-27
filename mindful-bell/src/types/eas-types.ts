/**
 * TypeScript definitions for EAS Build and App Store Connect APIs
 * Based on the contract specifications in /specs/002-create-the-specification/contracts/
 */

// EAS Build API Types
export interface EASBuildRequest {
  platform: 'ios' | 'android';
  profile: 'development' | 'preview' | 'production';
  gitCommitHash?: string;
  metadata?: EASBuildMetadata;
}

export interface EASBuildMetadata {
  buildNumber?: string;
  appVersion?: string;
  distribution?: 'internal' | 'store';
}

export interface EASBuildResponse {
  id: string;
  status: 'queued' | 'in-progress' | 'finished' | 'errored';
  platform: 'ios' | 'android';
  createdAt: string;
  updatedAt: string;
  artifacts?: {
    buildUrl?: string;
    applicationArchiveUrl?: string;
  };
  error?: {
    message: string;
    errorCode: string;
  };
}

// App Store Connect API Types
export interface AppStoreConnectBuildUpload {
  data: {
    type: 'builds';
    attributes: AppStoreConnectBuildAttributes;
    relationships: AppStoreConnectBuildRelationships;
  };
}

export interface AppStoreConnectBuildAttributes {
  version: string;
  uploadedDate: string;
  expirationDate?: string;
  expired?: boolean;
  minOsVersion?: string;
  processingState?: 'PROCESSING' | 'FAILED' | 'INVALID' | 'VALID';
  iconAssetToken?: string;
  usesNonExemptEncryption?: boolean;
}

export interface AppStoreConnectBuildRelationships {
  app?: {
    data: {
      type: 'apps';
      id: string;
    };
  };
}

export interface AppStoreVersionRequest {
  data: {
    type: 'appStoreVersions';
    attributes: AppStoreVersionAttributes;
    relationships: AppStoreVersionRelationships;
  };
}

export interface AppStoreVersionAttributes {
  platform: 'IOS';
  versionString: string;
  copyright?: string;
  releaseType?: 'AFTER_APPROVAL' | 'MANUAL';
  earliestReleaseDate?: string;
  appStoreState?: 'READY_FOR_SALE' | 'PROCESSING_FOR_APP_STORE' | 'PENDING_APPLE_RELEASE' | 'PENDING_DEVELOPER_RELEASE';
  createdDate?: string;
}

export interface AppStoreVersionRelationships {
  app: {
    data: {
      type: 'apps';
      id: string;
    };
  };
}

export interface AppStoreSubmissionRequest {
  data: {
    type: 'appStoreVersionSubmissions';
    relationships: {
      appStoreVersion: {
        data: {
          type: 'appStoreVersions';
          id: string;
        };
      };
    };
  };
}

export interface AppStoreSubmissionResponse {
  data: {
    type: 'appStoreVersionSubmissions';
    id: string;
    attributes: {
      state: 'WAITING_FOR_REVIEW' | 'IN_REVIEW' | 'REJECTED' | 'ACCEPTED';
      submittedDate: string;
    };
  };
}

// JWT Authentication Types
export interface JWTPayload {
  iss: string; // Issuer ID
  aud: string; // Audience
  exp: number; // Expiration time
}

export interface JWTHeader {
  kid: string; // Key ID
  typ: 'JWT';
  alg: 'ES256';
}

// API Response wrapper types
export interface APIResponse<T> {
  data?: T;
  error?: {
    message: string;
    code: string;
    details?: Record<string, unknown>;
  };
}

export interface PaginatedResponse<T> {
  data: T[];
  meta?: {
    paging?: {
      total: number;
      limit: number;
    };
  };
  links?: {
    self?: string;
    first?: string;
    next?: string;
  };
}

// Error handling types
export interface EASError extends Error {
  code?: string;
  statusCode?: number;
  response?: {
    data?: unknown;
    status: number;
    statusText: string;
  };
}

export interface AppStoreConnectError extends Error {
  code?: string;
  statusCode?: number;
  detail?: string;
  source?: {
    pointer?: string;
    parameter?: string;
  };
}