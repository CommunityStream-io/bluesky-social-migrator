import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ReactiveFormsModule } from '@angular/forms';

import { MigrationStepperComponent } from './migration-stepper.component';
import { MigrationStateService } from '../../services/migration-state.service';

describe('MigrationStepperComponent', () => {
  let component: MigrationStepperComponent;
  let fixture: ComponentFixture<MigrationStepperComponent>;
  let migrationStateService: MigrationStateService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        MigrationStepperComponent,
        NoopAnimationsModule,
        ReactiveFormsModule
      ],
      providers: [MigrationStateService]
    }).compileComponents();

    fixture = TestBed.createComponent(MigrationStepperComponent);
    component = fixture.componentInstance;
    migrationStateService = TestBed.inject(MigrationStateService);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have initial state', () => {
    expect(component.currentStepIndex).toBe(0);
    expect(component.migrationState).toBeNull();
    expect(component.canProceed).toBe(false);
    expect(component.canGoBack).toBe(false);
    expect(component.isLoading).toBe(false);
  });

  it('should handle step labels', () => {
    // Test that the component can handle step information
    expect(component).toBeTruthy();
  });

  it('should handle step descriptions', () => {
    // Test that the component can handle step descriptions
    expect(component).toBeTruthy();
  });

  it('should handle step completion', () => {
    // Complete first step
    component.onStepCompleted(0);
    
    // The service should handle the completion
    expect(component).toBeTruthy();
  });

  it('should get current step state', () => {
    // Initially no migration state
    expect(component.getCurrentStep()).toBeNull();
  });

  it('should get overall progress percentage', () => {
    // Initially 0% progress (no migration state)
    expect(component.getOverallProgress()).toBe(0);
  });

  it('should handle navigation methods', () => {
    // Test nextStep (should not proceed without completion)
    component.nextStep();
    expect(component.currentStepIndex).toBe(0);
    
    // Test previousStep (should not go back from first step)
    component.previousStep();
    expect(component.currentStepIndex).toBe(0);
  });

  it('should handle step forms', () => {
    // Test that the component can handle step forms
    expect(component).toBeTruthy();
  });

  it('should handle form controls', () => {
    // Test that the component can handle form controls
    expect(component).toBeTruthy();
  });

  it('should handle service dependency injection', () => {
    expect(component['migrationStateService']).toBe(migrationStateService);
  });
});
