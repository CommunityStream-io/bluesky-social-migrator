import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { MigrationState, StepState } from '../models/migration-state.interface';

/**
 * Service for managing migration workflow state
 * 
 * Handles step navigation, data persistence, and state synchronization
 * across all components in the migration workflow.
 */
@Injectable({
  providedIn: 'root'
})
export class MigrationStateService {
  private stateSubject = new BehaviorSubject<MigrationState>(this.getInitialState());
  
  /** Observable stream of migration state updates */
  state$ = this.stateSubject.asObservable();

  /** Advances to the next step if current step is completed */
  nextStep(): void {
    const currentState = this.stateSubject.value;
    if (this.canProceedToNextStep(currentState.currentStep)) {
      this.stateSubject.next({
        ...currentState,
        currentStep: currentState.currentStep + 1
      });
    }
  }

  /** Returns to the previous step */
  previousStep(): void {
    const currentState = this.stateSubject.value;
    if (currentState.currentStep > 0) {
      this.stateSubject.next({
        ...currentState,
        currentStep: currentState.currentStep - 1
      });
    }
  }

  /** Updates data for a specific step */
  updateStepData(stepIndex: number, data: any): void {
    const currentState = this.stateSubject.value;
    const updatedSteps = [...currentState.steps];
    updatedSteps[stepIndex] = { ...updatedSteps[stepIndex], data };
    
    this.stateSubject.next({
      ...currentState,
      steps: updatedSteps
    });
  }

  /** Marks a step as completed */
  completeStep(stepIndex: number): void {
    const currentState = this.stateSubject.value;
    const updatedSteps = [...currentState.steps];
    updatedSteps[stepIndex] = { ...updatedSteps[stepIndex], completed: true };
    
    this.stateSubject.next({
      ...currentState,
      steps: updatedSteps
    });
  }

  /** Updates the current step's progress */
  updateStepProgress(stepIndex: number, progress: number): void {
    const currentState = this.stateSubject.value;
    const updatedSteps = [...currentState.steps];
    updatedSteps[stepIndex] = { ...updatedSteps[stepIndex], progress };
    
    this.stateSubject.next({
      ...currentState,
      steps: updatedSteps
    });
  }

  /** Adds an error to a specific step */
  addStepError(stepIndex: number, error: string): void {
    const currentState = this.stateSubject.value;
    const updatedSteps = [...currentState.steps];
    updatedSteps[stepIndex] = { 
      ...updatedSteps[stepIndex], 
      errors: [...updatedSteps[stepIndex].errors, error] 
    };
    
    this.stateSubject.next({
      ...currentState,
      steps: updatedSteps
    });
  }

  /** Adds a warning to a specific step */
  addStepWarning(stepIndex: number, warning: string): void {
    const currentState = this.stateSubject.value;
    const updatedSteps = [...currentState.steps];
    updatedSteps[stepIndex] = { 
      ...updatedSteps[stepIndex], 
      warnings: [...updatedSteps[stepIndex].warnings, warning] 
    };
    
    this.stateSubject.next({
      ...currentState,
      steps: updatedSteps
    });
  }

  /** Gets the current migration state */
  getCurrentState(): MigrationState {
    return this.stateSubject.value;
  }

  /** Resets the migration state to initial values */
  resetState(): void {
    this.stateSubject.next(this.getInitialState());
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
