import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { vi } from 'vitest';
import { MigrationStepperComponent } from './migration-stepper.component';
import { MigrationStateService } from '../../services/migration-state.service';
import { BLUESKY_SERVICE, INSTAGRAM_SERVICE, PROGRESS_SERVICE } from '../../app.config';
import { BlueskyServiceMVP } from '../../services/bluesky/bluesky.service';
import { InstagramServiceMVP } from '../../services/instagram/instagram.service';
import { ProgressServiceMVP } from '../../services/progress/progress.service';
import { MigrationState, StepState } from '../../models/migration-state.interface';
import { BehaviorSubject } from 'rxjs';

describe('MigrationStepperComponent', () => {
  let component: MigrationStepperComponent;
  let fixture: ComponentFixture<MigrationStepperComponent>;
  let migrationStateService: MigrationStateService;
  let mockStateSubject: BehaviorSubject<MigrationState>;

  const mockMigrationState: MigrationState = {
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

  beforeEach(async () => {
    mockStateSubject = new BehaviorSubject<MigrationState>(mockMigrationState);
    
    const mockService = {
      nextStep: vi.fn(),
      previousStep: vi.fn(),
      goToStep: vi.fn(),
      updateStepData: vi.fn(),
      updateStepProgress: vi.fn(),
      completeStep: vi.fn(),
      resetState: vi.fn(),
      state$: mockStateSubject.asObservable()
    };

    await TestBed.configureTestingModule({
      imports: [
        MigrationStepperComponent,
        NoopAnimationsModule
      ],
      providers: [
        provideZonelessChangeDetection(),
        { provide: MigrationStateService, useValue: mockService },
        {
          provide: BLUESKY_SERVICE,
          useClass: BlueskyServiceMVP
        },
        {
          provide: INSTAGRAM_SERVICE,
          useClass: InstagramServiceMVP
        },
        {
          provide: PROGRESS_SERVICE,
          useClass: ProgressServiceMVP
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(MigrationStepperComponent);
    component = fixture.componentInstance;
    migrationStateService = TestBed.inject(MigrationStateService);
    fixture.detectChanges();
  });

  afterEach(() => {
    mockStateSubject.complete();
    vi.clearAllMocks();
  });

  describe('Component Initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize with default values', () => {
      expect(component.migrationState).toBeNull();
      expect(component.currentStepIndex).toBe(0);
      expect(component.canProceed).toBeFalse();
      expect(component.canGoBack).toBeFalse();
      expect(component.isLoading).toBeFalse();
    });

    it('should subscribe to state changes on init', () => {
      expect(component.migrationState).toEqual(mockMigrationState);
      expect(component.currentStepIndex).toBe(0);
    });
  });

  describe('State Management', () => {
    it('should update state when migration state changes', () => {
      const newState: MigrationState = {
        ...mockMigrationState,
        currentStep: 2,
        steps: mockMigrationState.steps.map((step, index) => ({
          ...step,
          completed: index <= 2
        }))
      };

      mockStateSubject.next(newState);

      expect(component.migrationState).toEqual(newState);
      expect(component.currentStepIndex).toBe(2);
    });

    it('should calculate canProceed correctly', () => {
      // First step should not be able to proceed initially
      expect(component.canProceed).toBeFalse();

      // Complete first step
      const completedState: MigrationState = {
        ...mockMigrationState,
        steps: mockMigrationState.steps.map((step, index) => ({
          ...step,
          completed: index === 0
        }))
      };
      mockStateSubject.next(completedState);

      expect(component.canProceed).toBeTrue();
    });

    it('should calculate canGoBack correctly', () => {
      // First step should not be able to go back
      expect(component.canGoBack).toBeFalse();

      // Move to second step
      const secondStepState: MigrationState = {
        ...mockMigrationState,
        currentStep: 1
      };
      mockStateSubject.next(secondStepState);

      expect(component.canGoBack).toBeTrue();
    });
  });

  describe('Navigation Methods', () => {
    it('should call nextStep when canProceed is true', () => {
      // Setup state to allow proceeding
      const completedState: MigrationState = {
        ...mockMigrationState,
        steps: mockMigrationState.steps.map((step, index) => ({
          ...step,
          completed: index === 0
        }))
      };
      mockStateSubject.next(completedState);

      component.nextStep();

      expect(migrationStateService.nextStep).toHaveBeenCalled();
    });

    it('should not call nextStep when canProceed is false', () => {
      component.nextStep();

      expect(migrationStateService.nextStep).not.toHaveBeenCalled();
    });

    it('should call previousStep when canGoBack is true', () => {
      // Setup state to allow going back
      const secondStepState: MigrationState = {
        ...mockMigrationState,
        currentStep: 1
      };
      mockStateSubject.next(secondStepState);

      component.previousStep();

      expect(migrationStateService.previousStep).toHaveBeenCalled();
    });

    it('should not call previousStep when canGoBack is false', () => {
      component.previousStep();

      expect(migrationStateService.previousStep).not.toHaveBeenCalled();
    });

    it('should set loading state during navigation', () => {
      // Setup state to allow proceeding
      const completedState: MigrationState = {
        ...mockMigrationState,
        steps: mockMigrationState.steps.map((step, index) => ({
          ...step,
          completed: index === 0
        }))
      };
      mockStateSubject.next(completedState);

      component.nextStep();

      expect(component.isLoading).toBeFalse(); // Should be reset after navigation
    });
  });

  describe('Step Management', () => {
    it('should get current step correctly', () => {
      const currentStep = component.getCurrentStep();
      expect(currentStep).toEqual(mockMigrationState.steps[0]);
    });

    it('should get overall progress correctly', () => {
      const progress = component.getOverallProgress();
      expect(progress).toBe(0); // No steps completed initially
    });

    it('should get step labels correctly', () => {
      const labels = component.getStepLabels();
      expect(labels).toEqual([
        'Content Upload',
        'Bluesky Authentication',
        'Migration Configuration',
        'Migration Execution',
        'Completion'
      ]);
    });

    it('should get step descriptions correctly', () => {
      const descriptions = component.getStepDescriptions();
      expect(descriptions).toEqual([
        'Upload and validate your Instagram export data',
        'Authenticate with your Bluesky account',
        'Configure migration settings and preview',
        'Execute the migration process',
        'Review results and next steps'
      ]);
    });
  });

  describe('Step Completion Handling', () => {
    it('should handle step completion event', () => {
      const stepIndex = 1;
      component.onStepCompleted(stepIndex);

      expect(migrationStateService.completeStep).toHaveBeenCalledWith(stepIndex);
    });

    it('should handle step state change event', () => {
      const stepIndex = 2;
      const stepData: StepState = {
        id: '2',
        completed: true,
        data: { test: 'data' },
        errors: [],
        warnings: [],
        progress: 100
      };
      component.onStepStateChanged(stepIndex, stepData);

      expect(migrationStateService.updateStepData).toHaveBeenCalledWith(stepIndex, stepData);
    });
  });

  describe('Template Rendering', () => {
    it('should render all step components', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      
      expect(compiled.querySelector('app-content-upload')).toBeTruthy();
      expect(compiled.querySelector('app-bluesky-auth')).toBeTruthy();
      expect(compiled.querySelector('app-migration-config')).toBeTruthy();
      expect(compiled.querySelector('app-migration-execution')).toBeTruthy();
      expect(compiled.querySelector('app-completion')).toBeTruthy();
    });

    it('should render stepper with correct number of steps', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const stepElements = compiled.querySelectorAll('mat-step');
      expect(stepElements.length).toBe(5);
    });

    it('should render navigation buttons', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('button[mat-raised-button]')).toBeTruthy();
    });
  });

  describe('Component Cleanup', () => {
    it('should unsubscribe from state changes on destroy', () => {
      const unsubscribeSpy = vi.spyOn(component['stateSubscription']!, 'unsubscribe');
      
      component.ngOnDestroy();
      
      expect(unsubscribeSpy).toHaveBeenCalled();
    });

    it('should handle destroy when no subscription exists', () => {
      component['stateSubscription'] = null;
      
      expect(() => component.ngOnDestroy()).not.toThrow();
    });
  });

  describe('Error Handling', () => {
    it('should handle state with errors', () => {
      const errorState: MigrationState = {
        ...mockMigrationState,
        errors: [
          { 
            id: '1',
            step: 1, 
            message: 'Test error', 
            type: 'validation',
            recoverable: true,
            timestamp: new Date()
          }
        ]
      };

      mockStateSubject.next(errorState);

      expect(component.migrationState?.errors.length).toBe(1);
      expect(component.migrationState?.errors[0].message).toBe('Test error');
    });
  });
});
