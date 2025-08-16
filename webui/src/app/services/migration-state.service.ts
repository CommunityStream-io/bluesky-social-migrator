import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable, distinctUntilChanged, map } from 'rxjs';
import { MigrationState, StepState } from '../models/migration-state.interface';
import { SentryService } from './sentry.service';

/**
 * Service for managing migration workflow state
 * 
 * Handles step navigation, data persistence, and state synchronization
 * across all components in the migration workflow.
 * 
 * @description Optimized for memory efficiency and performance, integrated with Sentry
 */
@Injectable({
  providedIn: 'root'
})
export class MigrationStateService implements OnDestroy {
  private stateSubject = new BehaviorSubject<MigrationState>(this.getInitialState());
  
  /** Observable stream of migration state updates with change detection */
  state$ = this.stateSubject.asObservable().pipe(
    distinctUntilChanged((prev, curr) => {
      // Only emit if the current step or step completion status changes
      return prev.currentStep === curr.currentStep && 
             prev.steps.every((step, index) => step.completed === curr.steps[index]?.completed);
    })
  );

  /** Observable for current step only */
  currentStep$ = this.state$.pipe(
    map(state => state.currentStep),
    distinctUntilChanged()
  );

  /** Observable for step completion status */
  stepCompletion$ = this.state$.pipe(
    map(state => state.steps.map(step => step.completed)),
    distinctUntilChanged()
  );

  /** Cache for step data to prevent unnecessary updates */
  private stepDataCache = new Map<number, any>();
  
  /** Step start times for performance tracking */
  private stepStartTimes = new Map<number, number>();

  constructor(private sentryService: SentryService) {
    // Track initial step start time
    this.stepStartTimes.set(0, Date.now());
    
    // Add breadcrumb for service initialization
    this.sentryService.addBreadcrumb('migration', 'Migration state service initialized', {
      timestamp: new Date().toISOString(),
      initialStep: 0,
    });
  }

  ngOnDestroy(): void {
    this.stepDataCache.clear();
    this.stateSubject.complete();
  }

  /** Advances to the next step if current step is completed */
  nextStep(): void {
    const currentState = this.stateSubject.value;
    if (this.canProceedToNextStep(currentState.currentStep)) {
      const currentStepIndex = currentState.currentStep;
      const nextStepIndex = currentStepIndex + 1;
      
      // Track step completion performance
      this.trackStepCompletion(currentStepIndex);
      
      // Start timing for next step
      this.stepStartTimes.set(nextStepIndex, Date.now());
      
      // Add breadcrumb for step navigation
      this.sentryService.addBreadcrumb('migration', `Navigated from step ${currentStepIndex + 1} to step ${nextStepIndex + 1}`, {
        fromStep: currentStepIndex,
        toStep: nextStepIndex,
        timestamp: new Date().toISOString(),
      });
      
      this.updateState({
        ...currentState,
        currentStep: nextStepIndex
      });
    }
  }

  /** Returns to the previous step */
  previousStep(): void {
    const currentState = this.stateSubject.value;
    if (currentState.currentStep > 0) {
      const currentStepIndex = currentState.currentStep;
      const previousStepIndex = currentStepIndex - 1;
      
      // Add breadcrumb for step navigation
      this.sentryService.addBreadcrumb('migration', `Navigated back from step ${currentStepIndex + 1} to step ${previousStepIndex + 1}`, {
        fromStep: currentStepIndex,
        toStep: previousStepIndex,
        timestamp: new Date().toISOString(),
      });
      
      this.updateState({
        ...currentState,
        currentStep: previousStepIndex
      });
    }
  }

  /** Updates data for a specific step with caching */
  updateStepData(stepIndex: number, data: any): void {
    // Check if data actually changed to prevent unnecessary updates
    const cachedData = this.stepDataCache.get(stepIndex);
    if (JSON.stringify(cachedData) === JSON.stringify(data)) {
      return; // No change, skip update
    }

    // Cache the new data
    this.stepDataCache.set(stepIndex, data);

    const currentState = this.stateSubject.value;
    const updatedSteps = [...currentState.steps];
    
    // Only update if the step exists and data is different
    if (updatedSteps[stepIndex] && updatedSteps[stepIndex].data !== data) {
      updatedSteps[stepIndex] = { ...updatedSteps[stepIndex], data };
      
      // Add breadcrumb for step data update
      this.sentryService.addBreadcrumb('migration', `Step ${stepIndex + 1} data updated`, {
        stepIndex,
        hasData: !!data,
        timestamp: new Date().toISOString(),
      });
      
      this.updateState({
        ...currentState,
        steps: updatedSteps
      });
    }
  }

  /** Marks a step as completed */
  completeStep(stepIndex: number): void {
    const currentState = this.stateSubject.value;
    const currentStep = currentState.steps[stepIndex];
    
    // Only update if not already completed
    if (currentStep && !currentStep.completed) {
      const updatedSteps = [...currentState.steps];
      updatedSteps[stepIndex] = { ...currentStep, completed: true };
      
      // Track step completion performance
      this.trackStepCompletion(stepIndex);
      
      // Add breadcrumb for step completion
      this.sentryService.addBreadcrumb('migration', `Step ${stepIndex + 1} marked as completed`, {
        stepIndex,
        stepName: this.getStepName(stepIndex),
        timestamp: new Date().toISOString(),
      });
      
      this.updateState({
        ...currentState,
        steps: updatedSteps
      });
    }
  }

  /** Updates the current step's progress */
  updateStepProgress(stepIndex: number, progress: number): void {
    const currentState = this.stateSubject.value;
    const currentStep = currentState.steps[stepIndex];
    
    // Only update if progress actually changed
    if (currentStep && currentStep.progress !== progress) {
      const updatedSteps = [...currentState.steps];
      updatedSteps[stepIndex] = { ...currentStep, progress };
      
      // Add breadcrumb for significant progress updates
      if (progress % 25 === 0 || progress === 100) { // Log every 25% and 100%
        this.sentryService.addBreadcrumb('migration', `Step ${stepIndex + 1} progress: ${progress}%`, {
          stepIndex,
          progress,
          timestamp: new Date().toISOString(),
        });
      }
      
      this.updateState({
        ...currentState,
        steps: updatedSteps
      });
    }
  }

  /** Adds an error to a specific step */
  addStepError(stepIndex: number, error: string): void {
    const currentState = this.stateSubject.value;
    const currentStep = currentState.steps[stepIndex];
    
    if (currentStep && !currentStep.errors.includes(error)) {
      const updatedSteps = [...currentState.steps];
      updatedSteps[stepIndex] = { 
        ...currentStep, 
        errors: [...currentStep.errors, error] 
      };
      
      // Capture error in Sentry
      this.sentryService.captureError(new Error(error), {
        errorType: 'step-error',
        stepIndex,
        stepName: this.getStepName(stepIndex),
        timestamp: new Date().toISOString(),
      });
      
      // Add breadcrumb for step error
      this.sentryService.addBreadcrumb('migration', `Error added to step ${stepIndex + 1}`, {
        stepIndex,
        error,
        timestamp: new Date().toISOString(),
      });
      
      this.updateState({
        ...currentState,
        steps: updatedSteps
      });
    }
  }

  /** Adds a warning to a specific step */
  addStepWarning(stepIndex: number, warning: string): void {
    const currentState = this.stateSubject.value;
    const currentStep = currentState.steps[stepIndex];
    
    if (currentStep && !currentStep.warnings.includes(warning)) {
      const updatedSteps = [...currentState.steps];
      updatedSteps[stepIndex] = { 
        ...currentStep, 
        warnings: [...currentStep.warnings, warning] 
      };
      
      // Add breadcrumb for step warning
      this.sentryService.addBreadcrumb('migration', `Warning added to step ${stepIndex + 1}`, {
        stepIndex,
        warning,
        timestamp: new Date().toISOString(),
      });
      
      this.updateState({
        ...currentState,
        steps: updatedSteps
      });
    }
  }

  /** Gets the current migration state */
  getCurrentState(): MigrationState {
    return this.stateSubject.value;
  }

  /** Resets the migration state to initial values */
  resetState(): void {
    this.stepDataCache.clear();
    this.stepStartTimes.clear();
    
    // Add breadcrumb for state reset
    this.sentryService.addBreadcrumb('migration', 'Migration state reset', {
      timestamp: new Date().toISOString(),
    });
    
    // Restart timing for first step
    this.stepStartTimes.set(0, Date.now());
    
    this.updateState(this.getInitialState());
  }

  /** Optimized state update with change detection */
  private updateState(newState: MigrationState): void {
    // Only emit if state actually changed
    const currentState = this.stateSubject.value;
    if (JSON.stringify(currentState) !== JSON.stringify(newState)) {
      this.stateSubject.next(newState);
    }
  }

  /** Tracks step completion performance */
  private trackStepCompletion(stepIndex: number): void {
    const startTime = this.stepStartTimes.get(stepIndex);
    if (startTime) {
      const duration = Date.now() - startTime;
      const stepName = this.getStepName(stepIndex);
      
      // Capture step completion in Sentry
      this.sentryService.captureStepCompletion(stepIndex, stepName, duration, true);
      
      // Set performance context
      this.sentryService.setContext('step_performance', {
        stepIndex,
        stepName,
        duration,
        timestamp: new Date().toISOString(),
      });
    }
  }

  /** Gets step name by index */
  private getStepName(stepIndex: number): string {
    const stepNames = [
      'Content Upload',
      'Bluesky Authentication',
      'Migration Configuration',
      'Migration Execution',
      'Completion'
    ];
    return stepNames[stepIndex] || 'Unknown Step';
  }

  /** Checks if the current step can proceed to the next step */
  private canProceedToNextStep(currentStep: number): boolean {
    const currentState = this.stateSubject.value;
    return currentState.steps[currentStep]?.completed || false;
  }

  /** Creates the initial migration state */
  private getInitialState(): MigrationState {
    return {
      currentStep: 0,
      steps: [
        { id: 'content-upload', completed: false, data: null, errors: [], warnings: [], progress: 0 },
        { id: 'bluesky-auth', completed: false, data: null, errors: [], warnings: [], progress: 0 },
        { id: 'migration-config', completed: false, data: null, errors: [], warnings: [], progress: 0 },
        { id: 'migration-execution', completed: false, data: null, errors: [], warnings: [], progress: 0 },
        { id: 'completion', completed: false, data: null, errors: [], warnings: [], progress: 0 }
      ],
      instagramData: [],
      processedPosts: [],
      blueskyClient: null,
      migrationConfig: {
        includeLikes: true,
        includeComments: true,
        dateRange: { start: null, end: null },
        mediaQuality: 'medium',
        batchSize: 10
      },
      progress: {
        currentPost: 0,
        totalPosts: 0,
        currentMedia: 0,
        totalMedia: 0,
        status: 'idle',
        estimatedTimeRemaining: '0m'
      },
      errors: []
    };
  }
}
