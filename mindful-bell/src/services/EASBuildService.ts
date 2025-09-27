/**
 * EAS Build API service integration
 * Handles communication with EAS Build API for build operations
 */

import { EASBuildRequest, EASBuildResponse, EASError } from '../types/eas-types';
import { getEnvironmentConfig } from '../config/environment';

export class EASBuildService {
  private readonly baseUrl = 'https://api.expo.dev';
  private readonly timeout = 30000;

  async initiateBuild(request: EASBuildRequest): Promise<EASBuildResponse> {
    const config = getEnvironmentConfig();
    const projectId = config.EAS_PROJECT_ID;

    const response = await this.makeRequest(
      'POST',
      `/v2/projects/${projectId}/builds`,
      request
    );

    return response;
  }

  async getBuildStatus(projectId: string, buildId: string): Promise<EASBuildResponse> {
    const response = await this.makeRequest(
      'GET',
      `/v2/projects/${projectId}/builds/${buildId}`
    );

    return response;
  }

  async pollBuildStatus(
    projectId: string,
    buildId: string,
    timeoutMs: number = 600000
  ): Promise<EASBuildResponse> {
    const startTime = Date.now();
    const pollInterval = 30000; // 30 seconds

    while (Date.now() - startTime < timeoutMs) {
      const status = await this.getBuildStatus(projectId, buildId);

      if (status.status === 'finished' || status.status === 'errored') {
        return status;
      }

      await this.sleep(pollInterval);
    }

    throw new Error(`Build polling timeout after ${timeoutMs}ms`);
  }

  private async makeRequest(
    method: 'GET' | 'POST',
    path: string,
    body?: any
  ): Promise<any> {
    const url = `${this.baseUrl}${path}`;

    try {
      // In a real implementation, this would use fetch or axios
      // For now, we'll simulate the API call structure
      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${this.getAuthToken()}`,
          'Content-Type': 'application/json',
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: AbortSignal.timeout(this.timeout)
      });

      if (!response.ok) {
        throw new Error(`EAS API error: ${response.status} ${response.statusText}`);
      }

      return response.json();
    } catch (error) {
      throw this.handleError(error);
    }
  }

  private getAuthToken(): string {
    // In real implementation, this would get the EAS auth token
    return process.env.EAS_AUTH_TOKEN || '';
  }

  private handleError(error: any): EASError {
    const easError = new Error(error.message || 'EAS Build API error') as EASError;
    easError.name = 'EASError';
    easError.code = error.code || 'UNKNOWN_ERROR';
    easError.statusCode = error.status || 500;
    return easError;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}