import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { MigrationStateService } from './migration-state.service';
import { MigrationState, StepState } from '../models/migration-state.interface';

describe('MigrationStateService', () => {
  let service: MigrationStateService;

  const initialMigrationState: MigrationState = {
    currentStep: 0,
    steps: [
      { id: '0', completed: false, data: null, errors: [], warnings: [], progress: 0 },
      { id: '1', completed: false, data: null, errors: [], warnings: [], progress: 0 },
      { id: '2', completed: false, data: null, errors: [], warnings: [], progress: 0 },
      { id: '3', completed: false, data: null, errors: [], warnings: [], progress: 0 },
      { id: '4', completed: false, data: null, errors: [], warnings: [], progress: 0 }
    ],
    instagramData: [],
    processedPosts: [],
    blueskyClient: null,
    migrationConfig: {} as any,
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

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        MigrationStateService,
        provideZonelessChangeDetection()
      ]
    });
    service = TestBed.inject(MigrationStateService);
  });

  describe('Initialization', () => {
    it('should be created', () => {
      expect(service).toBeTruthy();
    });

    it('should have initial state', () => {
      service.state$.subscribe(state => {
        expect(state.currentStep).toBe(0);
        expect(state.steps.length).toBe(5);
        expect(state.steps[0].completed).toBe(false);
      });
    });
  });

  describe('Step Navigation', () => {
    it('should advance to next step when current step is completed', () => {
      // First complete the current step
      service.completeStep(0);
      
      // Then try to advance
      service.nextStep();
      
      service.state$.subscribe(state => {
        expect(state.currentStep).toBe(1);
      });
    });

    it('should not advance when current step is not completed', () => {
      service.nextStep();
      
      service.state$.subscribe(state => {
        expect(state.currentStep).toBe(0); // Should stay at first step
      });
    });

    it('should allow advancement beyond last step when steps are completed', () => {
      // Complete all steps first
      for (let i = 0; i < 5; i++) {
        service.completeStep(i);
      }
      
      // Go to last step and beyond
      for (let i = 0; i < 6; i++) {
        service.nextStep();
      }
      
      service.state$.subscribe(state => {
        expect(state.currentStep).toBe(5); // Should allow going beyond last step
      });
    });

    it('should go back to previous step', () => {
      // First complete and advance
      service.completeStep(0);
      service.nextStep();
      service.completeStep(1);
      service.nextStep();
      
      // Then go back
      service.previousStep();
      
      service.state$.subscribe(state => {
        expect(state.currentStep).toBe(1);
      });
    });

    it('should not go back before first step', () => {
      service.previousStep();
      
      service.state$.subscribe(state => {
        expect(state.currentStep).toBe(0); // Should stay at first step
      });
    });
  });

  describe('Step Completion', () => {
    it('should complete a step', () => {
      service.completeStep(1);
      
      service.state$.subscribe(state => {
        expect(state.steps[1].completed).toBe(true);
      });
    });

    it('should update step data', () => {
      const testData = { test: 'data' };
      service.updateStepData(2, testData);
      
      service.state$.subscribe(state => {
        expect(state.steps[2].data).toEqual(testData);
      });
    });

    it('should update step progress', () => {
      service.updateStepProgress(0, 75);
      
      service.state$.subscribe(state => {
        expect(state.steps[0].progress).toBe(75);
      });
    });
  });

  describe('Step Error and Warning Handling', () => {
    it('should add step error', () => {
      service.addStepError(1, 'Test error message');
      
      service.state$.subscribe(state => {
        expect(state.steps[1].errors).toContain('Test error message');
      });
    });

    it('should add step warning', () => {
      service.addStepWarning(2, 'Test warning message');
      
      service.state$.subscribe(state => {
        expect(state.steps[2].warnings).toContain('Test warning message');
      });
    });
  });

  describe('State Management', () => {
    it('should reset state to initial values', () => {
      // First make some changes
      service.completeStep(0);
      service.nextStep();
      
      // Then reset
      service.resetState();
      
      service.state$.subscribe(state => {
        expect(state.currentStep).toBe(0);
        expect(state.steps[0].completed).toBe(false);
        expect(state.steps[0].progress).toBe(0);
      });
    });

    it('should maintain state across multiple operations', () => {
      service.completeStep(0);
      service.nextStep();
      service.updateStepData(1, { auth: 'data' });
      
      service.state$.subscribe(state => {
        expect(state.currentStep).toBe(1);
        expect(state.steps[0].completed).toBe(true);
        expect(state.steps[1].data).toEqual({ auth: 'data' });
      });
    });

    it('should get current state', () => {
      const currentState = service.getCurrentState();
      expect(currentState.currentStep).toBe(0);
      expect(currentState.steps.length).toBe(5);
    });
  });

  describe('Initial State', () => {
    it('should have correct initial step IDs', () => {
      service.state$.subscribe(state => {
        expect(state.steps[0].id).toBe('content-upload');
        expect(state.steps[1].id).toBe('bluesky-auth');
        expect(state.steps[2].id).toBe('migration-config');
        expect(state.steps[3].id).toBe('migration-execution');
        expect(state.steps[4].id).toBe('completion');
      });
    });

    it('should have default migration config', () => {
      service.state$.subscribe(state => {
        expect(state.migrationConfig.includeLikes).toBe(true);
        expect(state.migrationConfig.includeComments).toBe(true);
        expect(state.migrationConfig.mediaQuality).toBe('medium');
        expect(state.migrationConfig.batchSize).toBe(10);
      });
    });
  });
});
