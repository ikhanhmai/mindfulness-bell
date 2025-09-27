/**
 * Build Artifacts model with lifecycle management
 * Tracks build outputs and submission files
 */

export interface BuildArtifactsData {
  buildId: string;
  artifactUrl: string;
  buildNumber: string;
  size: number;
  createdAt: Date;
  expiresAt: Date;
  sourceMaps: string[];
  buildLogs: string;
}

export class BuildArtifacts {
  private _data: BuildArtifactsData;

  constructor(data: BuildArtifactsData) {
    this._data = { ...data };
  }

  get buildId(): string { return this._data.buildId; }
  get artifactUrl(): string { return this._data.artifactUrl; }
  get size(): number { return this._data.size; }
  get isExpired(): boolean { return new Date() > this._data.expiresAt; }
  get data(): Readonly<BuildArtifactsData> { return { ...this._data }; }

  public validate(): boolean {
    return this._data.buildId.length > 0 &&
           this._data.artifactUrl.startsWith('https://') &&
           this._data.size > 0 &&
           this._data.size < 4 * 1024 * 1024 * 1024; // 4GB limit
  }

  public static createFromEASResponse(easResponse: any): BuildArtifacts {
    const retentionDays = easResponse.profile === 'development' ? 30 : 365;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + retentionDays);

    return new BuildArtifacts({
      buildId: easResponse.id,
      artifactUrl: easResponse.artifacts?.applicationArchiveUrl || '',
      buildNumber: easResponse.buildNumber || '1',
      size: easResponse.artifacts?.size || 0,
      createdAt: new Date(easResponse.createdAt),
      expiresAt,
      sourceMaps: easResponse.artifacts?.sourceMaps || [],
      buildLogs: easResponse.artifacts?.buildLogs || ''
    });
  }
}