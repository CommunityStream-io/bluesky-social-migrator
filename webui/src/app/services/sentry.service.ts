import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import * as Sentry from '@sentry/angular';

import { environment } from '../../environments/environment';

/**
 * Sentry service for error tracking and performance monitoring
 * 
 * This service integrates Sentry with the application to provide:
 * - Error tracking and reporting
 * - Performance monitoring
 * - User session tracking
 * - Custom context and breadcrumbs
 */
@Injectable({
  providedIn: 'root'
})
export class SentryService {
  /** Whether Sentry is initialized */
  private isInitialized = false;
  
  /** Whether the service is enabled */
  private isEnabled = false;

  constructor(@Inject(PLATFORM_ID) private platformId: any) {
    // Only initialize in browser environment
    if (isPlatformBrowser(this.platformId)) {
      this.initializeSentry();
    }
  }

  /**
   * Initializes Sentry with configuration
   */
  private initializeSentry(): void {
    try {
      // Check if DSN is configured
      if (!environment.sentry.dsn || environment.sentry.dsn === 'YOUR_SENTRY_DSN') {
        console.warn('Sentry DSN not configured. Sentry will be disabled.');
        this.isEnabled = false;
        return;
      }

      // Initialize Sentry with environment configuration
      Sentry.init({
        dsn: environment.sentry.dsn,
        
        // Performance monitoring from environment
        tracesSampleRate: environment.sentry.tracesSampleRate,
        profilesSampleRate: environment.sentry.profilesSampleRate,
        
        // Error tracking
        beforeSend(event: any, hint: any): any | null {
          // Filter out certain errors if needed
          if (event.exception) {
            const exception = event.exception.values?.[0];
            if (exception?.value?.match(environment.sentry.errorFilterRegex)) {
              return null; // Filter out common browser errors
            }
          }
          return event;
        },
        
        // Environment configuration
        environment: environment.sentry.environment,
        
        // Release tracking
        release: environment.app.version,
        
        // Debug mode from environment
        debug: environment.sentry.debug,
        
        // User context
        initialScope: {
          tags: {
            component: environment.app.name,
            version: environment.app.version,
            environment: environment.app.environment,
          },
        },
        
        // Integrations
        integrations: [
          Sentry.feedbackIntegration({
            colorScheme: "system",
          }),
        ],
      });

      this.isInitialized = true;
      this.isEnabled = true;
      
      console.log('Sentry initialized successfully');
      
      // Add breadcrumb for Sentry initialization
      this.addBreadcrumb('system', 'Sentry initialized', {
        environment: environment.sentry.environment,
        version: environment.app.version,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Failed to initialize Sentry:', error);
      this.isEnabled = false;
    }
  }

  /**
   * Captures an error with additional context
   */
  captureError(error: Error, context?: Record<string, any>): void {
    if (!this.isEnabled || !this.isInitialized) return;

    try {
      Sentry.captureException(error, {
        extra: context,
        tags: {
          component: environment.app.name,
          errorType: 'application-error',
          environment: environment.app.environment,
        },
      });
    } catch (sentryError) {
      console.error('Failed to capture error in Sentry:', sentryError);
    }
  }

  /**
   * Captures a message with specified level
   */
  captureMessage(message: string, level: Sentry.SeverityLevel = 'info', context?: Record<string, any>): void {
    if (!this.isEnabled || !this.isInitialized) return;

    try {
      Sentry.captureMessage(message, {
        level,
        extra: context,
        tags: {
          component: environment.app.name,
          messageType: 'user-message',
          environment: environment.app.environment,
        },
      });
    } catch (sentryError) {
      console.error('Failed to capture message in Sentry:', sentryError);
    }
  }

  /**
   * Adds breadcrumb for user actions
   */
  addBreadcrumb(category: string, message: string, data?: Record<string, any>): void {
    if (!this.isEnabled || !this.isInitialized) return;

    try {
      Sentry.addBreadcrumb({
        category,
        message,
        data: {
          ...data,
          environment: environment.app.environment,
          version: environment.app.version,
        },
        level: 'info',
        timestamp: Date.now() / 1000,
      });
    } catch (sentryError) {
      console.error('Failed to add breadcrumb in Sentry:', sentryError);
    }
  }

  /**
   * Sets user context for error tracking
   */
  setUser(user: { id?: string; username?: string; email?: string }): void {
    if (!this.isEnabled || !this.isInitialized) return;

    try {
      Sentry.setUser({
        ...user,
        environment: environment.app.environment,
      });
    } catch (sentryError) {
      console.error('Failed to set user in Sentry:', sentryError);
    }
  }

  /**
   * Sets additional context for error tracking
   */
  setContext(name: string, context: Record<string, any>): void {
    if (!this.isEnabled || !this.isInitialized) return;

    try {
      Sentry.setContext(name, {
        ...context,
        environment: environment.app.environment,
        version: environment.app.version,
      });
    } catch (sentryError) {
      console.error('Failed to set context in Sentry:', sentryError);
    }
  }

  /**
   * Sets tag for error tracking
   */
  setTag(key: string, value: string): void {
    if (!this.isEnabled || !this.isInitialized) return;

    try {
      Sentry.setTag(key, value);
    } catch (sentryError) {
      console.error('Failed to set tag in Sentry:', sentryError);
    }
  }

  /**
   * Captures performance metrics
   */
  capturePerformanceMetrics(metrics: {
    memoryUsage: number;
    cpuUsage: number;
    frameRate: number;
    warnings: string[];
  }): void {
    if (!this.isEnabled || !this.isInitialized) return;

    try {
      // Set performance context
      this.setContext('performance', {
        memoryUsage: `${metrics.memoryUsage}MB`,
        cpuUsage: `${metrics.cpuUsage}%`,
        frameRate: `${metrics.frameRate}FPS`,
        warnings: metrics.warnings,
        timestamp: new Date().toISOString(),
        thresholds: {
          memory: environment.performance.memoryThreshold,
          cpu: environment.performance.cpuThreshold,
          fps: environment.performance.fpsThreshold,
        },
      });

      // Add performance breadcrumb
      this.addBreadcrumb('performance', 'Performance metrics captured', {
        memoryUsage: metrics.memoryUsage,
        cpuUsage: metrics.cpuUsage,
        frameRate: metrics.frameRate,
        warningCount: metrics.warnings.length,
      });

      // Set performance tags
      this.setTag('memory_usage', metrics.memoryUsage.toString());
      this.setTag('cpu_usage', metrics.cpuUsage.toString());
      this.setTag('frame_rate', metrics.frameRate.toString());
      this.setTag('has_warnings', metrics.warnings.length > 0 ? 'true' : 'false');
    } catch (sentryError) {
      console.error('Failed to capture performance metrics in Sentry:', sentryError);
    }
  }

  /**
   * Captures tab lockup event
   */
  captureTabLockup(context: {
    step: string;
    duration: number;
    memoryUsage: number;
    cpuUsage: number;
    frameRate: number;
  }): void {
    if (!this.isEnabled || !this.isInitialized) return;

    try {
      // Capture as error with specific context
      this.captureError(new Error('Tab lockup detected'), {
        errorType: 'tab-lockup',
        step: context.step,
        duration: context.duration,
        memoryUsage: context.memoryUsage,
        cpuUsage: context.cpuUsage,
        frameRate: context.frameRate,
        timestamp: new Date().toISOString(),
        thresholds: {
          memory: environment.performance.memoryThreshold,
          cpu: environment.performance.cpuThreshold,
          fps: environment.performance.fpsThreshold,
          lockup: environment.performance.lockupThreshold,
        },
      });

      // Set specific tags for tab lockup
      this.setTag('error_type', 'tab_lockup');
      this.setTag('step', context.step);
      this.setTag('lockup_duration', context.duration.toString());
      this.setTag('memory_at_lockup', context.memoryUsage.toString());
      this.setTag('cpu_at_lockup', context.cpuUsage.toString());
      this.setTag('fps_at_lockup', context.frameRate.toString());
    } catch (sentryError) {
      console.error('Failed to capture tab lockup in Sentry:', sentryError);
    }
  }

  /**
   * Captures migration step completion
   */
  captureStepCompletion(stepIndex: number, stepName: string, duration: number, success: boolean): void {
    if (!this.isEnabled || !this.isInitialized) return;

    try {
      // Add breadcrumb for step completion
      this.addBreadcrumb('migration', `Step ${stepIndex + 1} completed: ${stepName}`, {
        stepIndex,
        stepName,
        duration,
        success,
        timestamp: new Date().toISOString(),
      });

      // Set step context
      this.setContext('migration_step', {
        stepIndex,
        stepName,
        duration,
        success,
        timestamp: new Date().toISOString(),
      });

      // Set step tags
      this.setTag(`step_${stepIndex}_completed`, 'true');
      this.setTag(`step_${stepIndex}_duration`, duration.toString());
      this.setTag(`step_${stepIndex}_success`, success.toString());
    } catch (sentryError) {
      console.error('Failed to capture step completion in Sentry:', sentryError);
    }
  }

  /**
   * Checks if Sentry is enabled
   */
  isSentryEnabled(): boolean {
    return this.isEnabled && this.isInitialized;
  }

  /**
   * Manually flushes Sentry events (useful for testing)
   */
  flush(): Promise<boolean> {
    if (!this.isEnabled || !this.isInitialized) return Promise.resolve(false);

    try {
      return Sentry.flush(2000); // Wait up to 2 seconds
    } catch (sentryError) {
      console.error('Failed to flush Sentry:', sentryError);
      return Promise.resolve(false);
    }
  }

  /**
   * Opens the Sentry feedback widget
   * Note: The feedback widget is automatically available when feedbackIntegration is configured
   * Users can access it through the Sentry UI or by adding a feedback button to your app
   */
  showFeedbackWidget(): void {
    if (!this.isEnabled || !this.isInitialized) return;

    try {
      // The feedback widget is automatically available when feedbackIntegration is configured
      // You can add a custom button or trigger to show feedback options
      console.log('Sentry feedback widget is available. Users can provide feedback through the Sentry interface.');
    } catch (sentryError) {
      console.error('Failed to show Sentry feedback widget:', sentryError);
    }
  }
}
