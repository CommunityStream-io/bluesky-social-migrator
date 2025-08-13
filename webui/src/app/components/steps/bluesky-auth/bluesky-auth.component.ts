import { Component, OnInit, OnDestroy, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatListModule } from '@angular/material/list';
import { Subscription } from 'rxjs';

import { BlueskyService } from '../../../services/interfaces/bluesky-service.interface';
import { MigrationStateService } from '../../../services/migration-state.service';
import { BLUESKY_SERVICE } from '../../../app.config';
import { Inject } from '@angular/core';
import { MigrationState } from '../../../models/migration-state.interface';

/**
 * Step 2: Bluesky Authentication Component
 * 
 * Handles user authentication with Bluesky, including login form,
 * credential validation, and account information display.
 * Users must authenticate before proceeding to migration configuration.
 */
@Component({
  selector: 'app-bluesky-auth',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressBarModule,
    MatIconModule,
    MatSnackBarModule,
    MatCheckboxModule,
    MatProgressSpinnerModule,
    MatListModule
  ],
  templateUrl: './bluesky-auth.component.html',
  styleUrls: ['./bluesky-auth.component.scss']
})
export class BlueskyAuthComponent implements OnInit, OnDestroy {
  /** Authentication form group */
  authForm: FormGroup;
  
  /** Whether authentication is in progress */
  isAuthenticating = false;
  
  /** Whether the user is currently authenticated */
  isAuthenticated = false;
  
  /** Whether the step is completed and can proceed */
  isStepCompleted = false;
  
  /** Current user account information */
  accountInfo: any = null;
  
  /** Error messages to display */
  errors: string[] = [];
  
  /** Whether to show password */
  showPassword = false;
  
  /** Whether to remember credentials */
  rememberCredentials = false;
  
  /** Form validation matcher */
  matcher = {
    isErrorState: (control: any) => control && control.invalid && (control.dirty || control.touched)
  };
  
  /** Subscription to state changes */
  private stateSubscription: Subscription | null = null;

  /** Event emitted when the step is completed */
  @Output() stepCompleted = new EventEmitter<void>();

  constructor(
    @Inject(BLUESKY_SERVICE) private blueskyService: BlueskyService,
    private migrationStateService: MigrationStateService,
    private fb: FormBuilder
  ) {
    this.authForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      rememberCredentials: [false]
    });
  }

  ngOnInit(): void {
    this.stateSubscription = this.migrationStateService.state$.subscribe((state: MigrationState) => {
      const currentStep = state.steps[1]; // Bluesky auth is step 1
      this.isStepCompleted = currentStep.completed;
      this.errors = currentStep.errors;
      
      // Check if already authenticated
      if (state.blueskyClient) {
        this.isAuthenticated = true;
        this.accountInfo = state.blueskyClient;
      }
    });
  }

  ngOnDestroy(): void {
    if (this.stateSubscription) {
      this.stateSubscription.unsubscribe();
    }
  }

  /**
   * Handles form submission for authentication
   */
  async onSubmit(): Promise<void> {
    if (this.authForm.invalid) return;

    this.isAuthenticating = true;
    this.errors = [];

    try {
      const { username, password } = this.authForm.value;
      
      // Authenticate with Bluesky service
      const success = await this.blueskyService.authenticate(username, password);
      
      if (success) {
        this.isAuthenticated = true;
        await this.loadAccountInfo();
        this.completeStep();
      } else {
        this.errors = ['Authentication failed. Please check your credentials.'];
      }
    } catch (error) {
      this.errors = [`Authentication error: ${error}`];
    } finally {
      this.isAuthenticating = false;
    }
  }

  /**
   * Loads account information after successful authentication
   */
  private async loadAccountInfo(): Promise<void> {
    try {
      this.accountInfo = await this.blueskyService.getAccountInfo();
    } catch (error) {
      console.warn('Failed to load account info:', error);
      this.accountInfo = { username: this.authForm.value.username };
    }
  }

  /**
   * Completes the current step and updates migration state
   */
  private completeStep(): void {
    this.isStepCompleted = true;
    this.migrationStateService.completeStep(1);
    
    // Update step data with account information
    this.migrationStateService.updateStepData(1, {
      accountInfo: this.accountInfo,
      username: this.authForm.value.username
    });
    
    // Emit step completed event
    this.stepCompleted.emit();
  }

  /**
   * Logs out the current user
   */
  logout(): void {
    this.isAuthenticated = false;
    this.isStepCompleted = false;
    this.accountInfo = null;
    this.authForm.reset();
    
    // Reset step completion
    this.migrationStateService.updateStepData(1, null);
    this.migrationStateService.addStepError(1, 'User logged out');
  }

  /**
   * Toggles password visibility
   */
  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  /**
   * Gets the username field from the form
   */
  get usernameField() {
    return this.authForm.get('username');
  }

  /**
   * Gets the password field from the form
   */
  get passwordField() {
    return this.authForm.get('password');
  }

  /**
   * Gets the username error message
   */
  getUsernameErrorMessage(): string {
    if (this.usernameField?.hasError('required')) {
      return 'Username is required';
    }
    if (this.usernameField?.hasError('minlength')) {
      return 'Username must be at least 3 characters';
    }
    return '';
  }

  /**
   * Gets the password error message
   */
  getPasswordErrorMessage(): string {
    if (this.passwordField?.hasError('required')) {
      return 'Password is required';
    }
    if (this.passwordField?.hasError('minlength')) {
      return 'Password must be at least 6 characters';
    }
    return '';
  }

  /**
   * Gets the current authentication status message
   */
  getAuthStatusMessage(): string {
    if (this.isAuthenticating) {
      return 'Authenticating...';
    }
    if (this.isAuthenticated) {
      return 'Authenticated successfully!';
    }
    return 'Please enter your Bluesky credentials';
  }

  /**
   * Gets the current authentication status color
   */
  getAuthStatusColor(): string {
    if (this.isAuthenticating) {
      return 'accent';
    }
    if (this.isAuthenticated) {
      return 'primary';
    }
    return 'warn';
  }
}
