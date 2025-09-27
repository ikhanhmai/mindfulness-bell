/**
 * Release Workflow model with state transitions
 * Orchestrates the build and submission process
 */

import { BuildConfiguration } from './BuildConfiguration';
import { AppMetadata } from './AppMetadata';
import { BuildArtifacts } from './BuildArtifacts';

export enum WorkflowStatus {
  INITIATED = 'initiated',
  BUILDING = 'building',
  BUILD_COMPLETE = 'build_complete',
  SUBMITTING = 'submitting',
  SUBMITTED = 'submitted',
  FAILED = 'failed'
}

export enum ReviewStatus {
  WAITING_FOR_REVIEW = 'waiting_for_review',
  IN_REVIEW = 'in_review',
  REJECTED = 'rejected',
  APPROVED = 'approved',
  READY_FOR_SALE = 'ready_for_sale'
}

export interface ReleaseWorkflowData {
  workflowId: string;
  status: WorkflowStatus;
  buildConfiguration: BuildConfiguration;
  appMetadata: AppMetadata;
  buildArtifact?: BuildArtifacts;
  submissionId?: string;
  reviewStatus?: ReviewStatus;
  createdAt: Date;
  updatedAt: Date;
}

export class ReleaseWorkflow {
  private _data: ReleaseWorkflowData;

  constructor(
    buildConfiguration: BuildConfiguration,
    appMetadata: AppMetadata,
    workflowId?: string
  ) {
    this._data = {
      workflowId: workflowId || this.generateWorkflowId(),
      status: WorkflowStatus.INITIATED,
      buildConfiguration,
      appMetadata,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  get workflowId(): string { return this._data.workflowId; }
  get status(): WorkflowStatus { return this._data.status; }
  get buildConfiguration(): BuildConfiguration { return this._data.buildConfiguration; }
  get appMetadata(): AppMetadata { return this._data.appMetadata; }
  get buildArtifact(): BuildArtifacts | undefined { return this._data.buildArtifact; }
  get reviewStatus(): ReviewStatus | undefined { return this._data.reviewStatus; }

  // State transitions
  public startBuilding(): void {
    if (this._data.status !== WorkflowStatus.INITIATED) {
      throw new Error('Can only start building from initiated state');
    }
    this._data.status = WorkflowStatus.BUILDING;
    this.updateTimestamp();
  }

  public completeBuild(buildArtifact: BuildArtifacts): void {
    if (this._data.status !== WorkflowStatus.BUILDING) {
      throw new Error('Can only complete build from building state');
    }
    this._data.status = WorkflowStatus.BUILD_COMPLETE;
    this._data.buildArtifact = buildArtifact;
    this.updateTimestamp();
  }

  public startSubmission(): void {
    if (this._data.status !== WorkflowStatus.BUILD_COMPLETE) {
      throw new Error('Can only start submission after build is complete');
    }
    this._data.status = WorkflowStatus.SUBMITTING;
    this.updateTimestamp();
  }

  public completeSubmission(submissionId: string): void {
    if (this._data.status !== WorkflowStatus.SUBMITTING) {
      throw new Error('Can only complete submission from submitting state');
    }
    this._data.status = WorkflowStatus.SUBMITTED;
    this._data.submissionId = submissionId;
    this._data.reviewStatus = ReviewStatus.WAITING_FOR_REVIEW;
    this.updateTimestamp();
  }

  public markFailed(error: string): void {
    this._data.status = WorkflowStatus.FAILED;
    this.updateTimestamp();
  }

  public updateReviewStatus(status: ReviewStatus): void {
    this._data.reviewStatus = status;
    this.updateTimestamp();
  }

  // Validation
  public validate(): boolean {
    return this._data.buildConfiguration.validate() &&
           this._data.appMetadata.validate().isValid;
  }

  public canProceedToSubmission(): boolean {
    return this._data.status === WorkflowStatus.BUILD_COMPLETE &&
           this._data.buildArtifact !== undefined &&
           this._data.appMetadata.isValid();
  }

  private generateWorkflowId(): string {
    return `workflow-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private updateTimestamp(): void {
    this._data.updatedAt = new Date();
  }

  public static createDevelopmentWorkflow(platform: 'ios' | 'android'): ReleaseWorkflow {
    const buildConfig = BuildConfiguration.createDevelopment(platform);
    const appMetadata = AppMetadata.createMindfulBellApp();
    return new ReleaseWorkflow(buildConfig, appMetadata);
  }

  public static createProductionWorkflow(platform: 'ios' | 'android', version: string): ReleaseWorkflow {
    const buildConfig = BuildConfiguration.createProduction(platform, version);
    const appMetadata = AppMetadata.createMindfulBellApp(version);
    return new ReleaseWorkflow(buildConfig, appMetadata);
  }
}