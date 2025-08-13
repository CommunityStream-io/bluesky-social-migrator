import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatStepperModule } from '@angular/material/stepper';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FormGroup } from '@angular/forms';
import { Subscription } from 'rxjs';

import { MigrationStateService } from '../../services/migration-state.service';
import { MigrationState, StepState } from '../../models/migration-state.interface';
import { ContentUploadComponent } from '../steps/content-upload/content-upload.component';
import { BlueskyAuthComponent } from '../steps/bluesky-auth/bluesky-auth.component';
import { MigrationConfigComponent } from '../steps/migration-config/migration-config.component';
import { MigrationExecutionComponent } from '../steps/migration-execution/migration-execution.component';
import { CompletionComponent } from '../steps/completion/completion.component';

/**
 * Main component for the migration workflow
 * 
 * Orchestrates the 5-step migration process using Angular Material stepper.
 * Manages step navigation, state persistence, and overall workflow coordination.
 */
@Component({
  selector: 'app-migration-stepper',
  standalone: true,
  imports: [
    CommonModule,
    MatStepperModule,
    MatButtonModule,
    MatCardModule,
    MatProgressBarModule,
    MatIconModule,
    MatProgressSpinnerModule,
    ContentUploadComponent,
    BlueskyAuthComponent,
    MigrationConfigComponent,
    MigrationExecutionComponent,
    CompletionComponent
  ],
  templateUrl: './migration-stepper.component.html',
  styleUrls: ['./migration-stepper.component.scss']
})
export class MigrationStepperComponent implements OnInit, OnDestroy {
  /** Current migration state */
  migrationState: MigrationState | null = null;
  
  /** Current step index */
  currentStepIndex = 0;
  
  /** Whether the current step can proceed */
  canProceed = false;
  
  /** Whether the current step can go back */
  canGoBack = false;
  
  /** Loading state for step transitions */
  isLoading = false;
  
  /** Subscription to state changes */
  private stateSubscription: Subscription | null = null;

  constructor(private migrationStateService: MigrationStateService) {}

  ngOnInit(): void {
    this.stateSubscription = this.migrationStateService.state$.subscribe(state => {
      this.migrationState = state;
      this.currentStepIndex = state.currentStep;
      this.canProceed = this.canProceedToNext();
      this.canGoBack = this.canGoBackToPrevious();
    });
  }

  ngOnDestroy(): void {
    if (this.stateSubscription) {
      this.stateSubscription.unsubscribe();
    }
  }

  /** Advances to the next step */
  nextStep(): void {
    if (this.canProceed) {
      this.isLoading = true;
      this.migrationStateService.nextStep();
      this.isLoading = false;
    }
  }

  /** Returns to the previous step */
  previousStep(): void {
    if (this.canGoBack) {
      this.isLoading = true;
      this.migrationStateService.previousStep();
      this.isLoading = false;
    }
  }

  /** Checks if the current step can proceed to the next step */
  private canProceedToNext(): boolean {
    if (!this.migrationState) return false;
    const currentStep = this.migrationState.steps[this.currentStepIndex];
    return currentStep?.completed || false;
  }

  /** Checks if the current step can go back to the previous step */
  private canGoBackToPrevious(): boolean {
    return this.currentStepIndex > 0;
  }

  /** Gets the current step state */
  getCurrentStep(): StepState | null {
    if (!this.migrationState) return null;
    return this.migrationState.steps[this.currentStepIndex] || null;
  }

  /** Gets the overall progress percentage */
  getOverallProgress(): number {
    if (!this.migrationState) return 0;
    const completedSteps = this.migrationState.steps.filter(step => step.completed).length;
    return (completedSteps / this.migrationState.steps.length) * 100;
  }

  /** Gets step labels for the stepper */
  getStepLabels(): string[] {
    return [
      'Content Upload',
      'Bluesky Authentication',
      'Migration Configuration',
      'Migration Execution',
      'Completion'
    ];
  }

  /** Gets step descriptions for the stepper */
  getStepDescriptions(): string[] {
    return [
      'Upload and validate your Instagram export data',
      'Authenticate with your Bluesky account',
      'Configure migration settings and preview',
      'Execute the migration process',
      'Review results and next steps'
    ];
  }

  /** Handles step completion events from child components */
  onStepCompleted(stepIndex: number): void {
    this.migrationStateService.completeStep(stepIndex);
  }

  /** Handles step state change events from child components */
  onStepStateChanged(stepIndex: number, state: StepState): void {
    // Update step data with the new state
    this.migrationStateService.updateStepData(stepIndex, state);
    
    // If the state indicates completion, mark the step as completed
    if (state.completed) {
      this.migrationStateService.completeStep(stepIndex);
    }
    
    // Update progress if available
    if (state.progress !== undefined) {
      this.migrationStateService.updateStepProgress(stepIndex, state.progress);
    }
  }

  /** Gets the form control for a specific step */
  getStepForm(stepIndex: number): FormGroup | null {
    switch (stepIndex) {
      case 0: return this.contentUploadForm;
      case 1: return this.blueskyAuthForm;
      case 2: return this.migrationConfigForm;
      case 3: return this.migrationExecutionForm;
      default: return null;
    }
  }

  /** Placeholder form controls for step validation */
  contentUploadForm = new FormGroup({});
  blueskyAuthForm = new FormGroup({});
  migrationConfigForm = new FormGroup({});
  migrationExecutionForm = new FormGroup({});
}
