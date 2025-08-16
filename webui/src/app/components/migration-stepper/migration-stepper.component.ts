import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, DestroyRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatStepperModule } from '@angular/material/stepper';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { MigrationStateService } from '../../services/migration-state.service';
import { MigrationState, StepState } from '../../models/migration-state.interface';
import { SentryService } from '../../services/sentry.service';
import { ContentUploadComponent } from '../steps/content-upload/content-upload.component';
import { BlueskyAuthComponent } from '../steps/bluesky-auth/bluesky-auth.component';
import { MigrationConfigComponent } from '../steps/migration-config/migration-config.component';
import { MigrationExecutionComponent } from '../steps/migration-execution/migration-execution.component';
import { CompletionComponent } from '../steps/completion/completion.component';
import { PerformanceMonitorComponent } from '../performance-monitor/performance-monitor.component';

/**
 * Main component for the migration workflow
 * 
 * Orchestrates the 5-step migration process using Angular Material stepper.
 * Manages step navigation, state persistence, and overall workflow coordination.
 * 
 * @description Optimized for memory efficiency and performance
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
    ReactiveFormsModule,
    ContentUploadComponent,
    BlueskyAuthComponent,
    MigrationConfigComponent,
    MigrationExecutionComponent,
    CompletionComponent,
    PerformanceMonitorComponent
  ],
  templateUrl: './migration-stepper.component.html',
  styleUrls: ['./migration-stepper.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MigrationStepperComponent implements OnInit {
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
  
  /** Whether to show performance monitor */
  showPerformanceMonitor = false;
  
  /** Destroy reference for automatic cleanup */
  private destroyRef = inject(DestroyRef);

  constructor(
    private migrationStateService: MigrationStateService,
    private sentryService: SentryService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Subscribe to current step changes only
    this.migrationStateService.currentStep$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(currentStep => {
        if (this.currentStepIndex !== currentStep) {
          this.currentStepIndex = currentStep;
          this.updateNavigationState();
          this.cdr.markForCheck();
        }
      });

    // Subscribe to step completion status for navigation state
    this.migrationStateService.stepCompletion$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.updateNavigationState();
        this.cdr.markForCheck();
      });

    // Subscribe to overall state for initial load
    this.migrationStateService.state$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(state => {
        if (!this.migrationState || this.migrationState.currentStep !== state.currentStep) {
          this.migrationState = state;
          this.currentStepIndex = state.currentStep;
          this.updateNavigationState();
          this.cdr.markForCheck();
        }
      });
  }

  /** Updates navigation state based on current step and completion status */
  private updateNavigationState(): void {
    const currentState = this.migrationStateService.getCurrentState();
    this.canProceed = this.canProceedToNext();
    this.canGoBack = this.canGoBackToPrevious();
  }

  /** Advances to the next step */
  nextStep(): void {
    if (this.canProceed) {
      this.isLoading = true;
      this.cdr.markForCheck();
      
      this.migrationStateService.nextStep();
      
      // Reset loading state after a short delay to allow state update
      setTimeout(() => {
        this.isLoading = false;
        this.cdr.markForCheck();
      }, 100);
    }
  }

  /** Returns to the previous step */
  previousStep(): void {
    if (this.canGoBack) {
      this.isLoading = true;
      this.cdr.markForCheck();
      
      this.migrationStateService.previousStep();
      
      // Reset loading state after a short delay to allow state update
      setTimeout(() => {
        this.isLoading = false;
        this.cdr.markForCheck();
      }, 100);
    }
  }

  /** Handles step completion events */
  onStepCompleted(stepIndex: number): void {
    // Step completion is handled by the migration state service
    // This method is called by child components to notify completion
    console.log(`Step ${stepIndex} completed`);
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
    const totalSteps = this.migrationState.steps.length;
    
    return Math.round((completedSteps / totalSteps) * 100);
  }

  /** Toggles performance monitor visibility */
  togglePerformanceMonitor(): void {
    this.showPerformanceMonitor = !this.showPerformanceMonitor;
    this.cdr.markForCheck();
  }

  /** Opens the Sentry feedback widget */
  openFeedback(): void {
    if (this.sentryService.isSentryEnabled()) {
      this.sentryService.showFeedbackWidget();
      
      // Add breadcrumb for feedback action
      this.sentryService.addBreadcrumb('user_action', 'User opened feedback widget', {
        component: 'migration-stepper',
        action: 'open_feedback',
        timestamp: new Date().toISOString(),
      });

      console.log('Feedback widget is available. Users can provide feedback through the Sentry interface.');
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
}
