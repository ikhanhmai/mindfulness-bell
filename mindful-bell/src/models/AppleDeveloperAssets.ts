/**
 * Apple Developer Assets model with security handling
 * Manages authentication and signing credentials
 */

import { z } from 'zod';

const AppleDeveloperAssetsSchema = z.object({
  teamId: z.string().min(10, 'Apple Developer Team ID required'),
  ascApiKeyId: z.string().min(10, 'App Store Connect API Key ID required'),
  ascApiKeyIssuerId: z.string().uuid('API Key Issuer ID must be valid UUID'),
  ascApiKeyPath: z.string().min(1, 'Path to private key file required'),
  certificateType: z.enum(['development', 'distribution']),
  provisioningProfile: z.string().optional(),
});

export interface AppleDeveloperAssetsData {
  teamId: string;
  ascApiKeyId: string;
  ascApiKeyIssuerId: string;
  ascApiKeyPath: string;
  certificateType: 'development' | 'distribution';
  provisioningProfile?: string;
}

export class AppleDeveloperAssets {
  private _data: AppleDeveloperAssetsData;
  private _validated: boolean = false;

  constructor(data: AppleDeveloperAssetsData) {
    this._data = { ...data };
  }

  get teamId(): string { return this._data.teamId; }
  get ascApiKeyId(): string { return this._data.ascApiKeyId; }
  get ascApiKeyIssuerId(): string { return this._data.ascApiKeyIssuerId; }
  get certificateType(): string { return this._data.certificateType; }
  get data(): Readonly<AppleDeveloperAssetsData> { return { ...this._data }; }

  public validate(): boolean {
    try {
      AppleDeveloperAssetsSchema.parse(this._data);
      this._validated = true;
      return true;
    } catch {
      this._validated = false;
      return false;
    }
  }

  public isValid(): boolean {
    return this._validated;
  }

  public static createDefault(): AppleDeveloperAssets {
    return new AppleDeveloperAssets({
      teamId: process.env.APPLE_TEAM_ID || '',
      ascApiKeyId: process.env.ASC_API_KEY_ID || '',
      ascApiKeyIssuerId: process.env.ASC_API_KEY_ISSUER_ID || '',
      ascApiKeyPath: process.env.ASC_API_KEY_PATH || '',
      certificateType: 'distribution'
    });
  }
}