import { Component, OnInit, Output, EventEmitter, ChangeDetectionStrategy, ChangeDetectorRef, DestroyRef, inject } from '@angular/core';
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
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { BlueskyService } from '../../../services/interfaces/bluesky-service.interface';
import { MigrationStateService } from '../../../services/migration-state.service';
import { SentryService } from '../../../services/sentry.service';
import { BLUESKY_SERVICE } from '../../../app.config';
import { Inject } from '@angular/core';
import { MigrationState } from '../../../models/migration-state.interface';

/**
 * Step 2: Bluesky Authentication Component
 * 
 * Handles user authentication with Bluesky, including login form,
 * credential validation, and account information display.
 * Users must authenticate before proceeding to migration configuration.
 * 
 * @description Optimized for memory efficiency and performance, integrated with Sentry
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
  styleUrls: ['./bluesky-auth.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BlueskyAuthComponent implements OnInit {
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
  
  /** Event emitted when the step is completed */
  @Output() stepCompleted = new EventEmitter<void>();
  
  /** Destroy reference for automatic cleanup */
  private destroyRef = inject(DestroyRef);
  
  /** Authentication start time for performance tracking */
  private authStartTime: number = 0;

  constructor(
    @Inject(BLUESKY_SERVICE) private blueskyService: BlueskyService,
    private migrationStateService: MigrationStateService,
    private sentryService: SentryService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef
  ) {
    this.authForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      rememberCredentials: [false]
    });
  }

  ngOnInit(): void {
    // Add breadcrumb for component initialization
    this.sentryService.addBreadcrumb('component', 'Bluesky auth component initialized', {
      timestamp: new Date().toISOString(),
      step: 'bluesky-auth',
    });

    // Subscribe to step completion status only
    this.migrationStateService.stepCompletion$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(stepCompletion => {
        const currentStep = stepCompletion[1]; // Bluesky auth is step 1
        if (this.isStepCompleted !== currentStep) {
          this.isStepCompleted = currentStep;
          this.cdr.markForCheck();
        }
      });

    // Subscribe to current step data only when needed
    this.migrationStateService.state$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((state: MigrationState) => {
        const currentStep = state.steps[1]; // Bluesky auth is step 1
        
        // Only update if errors actually changed
        if (JSON.stringify(this.errors) !== JSON.stringify(currentStep.errors)) {
          this.errors = currentStep.errors;
          this.cdr.markForCheck();
        }
        
        // Check if already authenticated
        if (state.blueskyClient && !this.isAuthenticated) {
          this.isAuthenticated = true;
          this.accountInfo = state.blueskyClient;
          this.cdr.markForCheck();
        }
      });
  }

  /**
   * Handles form submission for authentication
   */
  async onSubmit(): Promise<void> {
    if (this.authForm.invalid) return;

    this.isAuthenticating = true;
    this.errors = [];
    this.authStartTime = Date.now();
    this.cdr.markForCheck();

    // Add breadcrumb for authentication attempt
    this.sentryService.addBreadcrumb('authentication', 'Bluesky authentication attempted', {
      username: this.authForm.value.username,
      timestamp: new Date().toISOString(),
    });

    // Set user context for tracking
    this.sentryService.setUser({
      username: this.authForm.value.username,
    });

    try {
      const { username, password } = this.authForm.value;
      
      // Authenticate with Bluesky service
      const success = await this.blueskyService.authenticate(username, password);
      
      if (success) {
        this.isAuthenticated = true;
        await this.loadAccountInfo();
        this.completeStep();
        
        // Track successful authentication
        this.trackAuthenticationSuccess();
      } else {
        this.errors = ['Authentication failed. Please check your credentials.'];
        this.trackAuthenticationFailure('Invalid credentials');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.errors = [`Authentication error: ${errorMessage}`];
      this.trackAuthenticationFailure(errorMessage);
    } finally {
      this.isAuthenticating = false;
      this.cdr.markForCheck();
    }
  }

  /**
   * Loads account information after successful authentication
   */
  private async loadAccountInfo(): Promise<void> {
    try {
      this.accountInfo = await this.blueskyService.getAccountInfo();
      
      // Add breadcrumb for account info loaded
      this.sentryService.addBreadcrumb('authentication', 'Account information loaded', {
        username: this.accountInfo.username,
        hasDisplayName: !!this.accountInfo.displayName,
        timestamp: new Date().toISOString(),
      });
      
      this.cdr.markForCheck();
    } catch (error) {
      console.warn('Failed to load account info:', error);
      this.accountInfo = { username: this.authForm.value.username };
      
      // Capture account info loading error
      this.sentryService.captureError(error instanceof Error ? error : new Error(String(error)), {
        errorType: 'account-info-loading',
        username: this.authForm.value.username,
        timestamp: new Date().toISOString(),
      });
      
      this.cdr.markForCheck();
    }
  }

  /**
   * Completes the current step and updates migration state
   */
  private completeStep(): void {
    this.isStepCompleted = true;
    
    // Update step data with account information
    this.migrationStateService.updateStepData(1, {
      accountInfo: this.accountInfo,
      username: this.authForm.value.username
    });
    
    // Mark step as completed
    this.migrationStateService.completeStep(1);
    
    // Emit step completed event
    this.stepCompleted.emit();
    
    this.cdr.markForCheck();
  }

  /**
   * Logs out the current user
   */
  logout(): void {
    // Add breadcrumb for logout
    this.sentryService.addBreadcrumb('authentication', 'User logged out', {
      username: this.authForm.value.username,
      timestamp: new Date().toISOString(),
    });

    this.isAuthenticated = false;
    this.isStepCompleted = false;
    this.accountInfo = null;
    this.authForm.reset();
    
    // Reset step completion
    this.migrationStateService.updateStepData(1, null);
    this.migrationStateService.addStepError(1, 'User logged out');
    
    this.cdr.markForCheck();
  }

  /**
   * Tracks successful authentication
   */
  private trackAuthenticationSuccess(): void {
    const duration = Date.now() - this.authStartTime;
    
    // Add breadcrumb for successful authentication
    this.sentryService.addBreadcrumb('authentication', 'Bluesky authentication successful', {
      username: this.authForm.value.username,
      duration,
      timestamp: new Date().toISOString(),
    });

    // Set authentication context
    this.sentryService.setContext('authentication', {
      provider: 'bluesky',
      username: this.authForm.value.username,
      duration,
      success: true,
      timestamp: new Date().toISOString(),
    });

    // Set authentication tags
    this.sentryService.setTag('auth_provider', 'bluesky');
    this.sentryService.setTag('auth_success', 'true');
    this.sentryService.setTag('auth_duration', duration.toString());
  }

  /**
   * Tracks authentication failure
   */
  private trackAuthenticationFailure(errorMessage: string): void {
    const duration = Date.now() - this.authStartTime;
    
    // Add breadcrumb for authentication failure
    this.sentryService.addBreadcrumb('authentication', 'Bluesky authentication failed', {
      username: this.authForm.value.username,
      error: errorMessage,
      duration,
      timestamp: new Date().toISOString(),
    });

    // Set authentication context
    this.sentryService.setContext('authentication', {
      provider: 'bluesky',
      username: this.authForm.value.username,
      duration,
      success: false,
      error: errorMessage,
      timestamp: new Date().toISOString(),
    });

    // Set authentication tags
    this.sentryService.setTag('auth_provider', 'bluesky');
    this.sentryService.setTag('auth_success', 'false');
    this.sentryService.setTag('auth_duration', duration.toString());
    this.sentryService.setTag('auth_error', errorMessage);
  }

  /**
   * Toggles password visibility
   */
  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
    
    // Add breadcrumb for password visibility toggle
    this.sentryService.addBreadcrumb('ui', 'Password visibility toggled', {
      visible: this.showPassword,
      timestamp: new Date().toISOString(),
    });
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
