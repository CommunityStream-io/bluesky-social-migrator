import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, DestroyRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { PerformanceMonitorService } from '../../services/performance-monitor.service';
import { SentryService } from '../../services/sentry.service';

/**
 * Performance monitoring component that displays real-time performance metrics
 * 
 * This component helps developers and users identify performance issues
 * that could cause tab lockups or poor user experience.
 * 
 * @description Integrated with Sentry for error tracking and performance monitoring
 */
@Component({
  selector: 'app-performance-monitor',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatProgressBarModule
  ],
  template: `
    <mat-card class="performance-monitor" [class.warning]="!isHealthy">
      <mat-card-header>
        <mat-card-title>
          <mat-icon [color]="isHealthy ? 'primary' : 'warn'">
            {{ isHealthy ? 'monitor_heart' : 'warning' }}
          </mat-icon>
          Performance Monitor
        </mat-card-title>
        <mat-card-subtitle>
          {{ isHealthy ? 'System healthy' : 'Performance issues detected' }}
          <span *ngIf="isSentryEnabled" class="sentry-status">
            <mat-icon color="primary" class="sentry-icon">verified</mat-icon>
            Sentry enabled
          </span>
        </mat-card-subtitle>
      </mat-card-header>

      <mat-card-content>
        <div class="metrics-grid">
          <div class="metric-item">
            <div class="metric-label">
              <mat-icon>memory</mat-icon>
              Memory Usage
            </div>
            <div class="metric-value">{{ memoryUsage }}MB</div>
            <mat-progress-bar 
              [value]="memoryUsage / 2" 
              [color]="memoryUsage > 100 ? 'warn' : 'primary'">
            </mat-progress-bar>
          </div>

          <div class="metric-item">
            <div class="metric-label">
              <mat-icon>speed</mat-icon>
              CPU Usage
            </div>
            <div class="metric-value">{{ cpuUsage }}%</div>
            <mat-progress-bar 
              [value]="cpuUsage" 
              [color]="cpuUsage > 80 ? 'warn' : 'primary'">
            </mat-progress-bar>
          </div>

          <div class="metric-item">
            <div class="metric-label">
              <mat-icon>fps_30</mat-icon>
              Frame Rate
            </div>
            <div class="metric-value">{{ frameRate }}FPS</div>
            <mat-progress-bar 
              [value]="(frameRate / 60) * 100" 
              [color]="frameRate < 30 ? 'warn' : 'primary'">
            </mat-progress-bar>
          </div>
        </div>

        <div class="warnings-section" *ngIf="warnings.length > 0">
          <h4>
            <mat-icon color="warn">warning</mat-icon>
            Performance Warnings
          </h4>
          <ul class="warnings-list">
            <li *ngFor="let warning of warnings" class="warning-item">
              {{ warning }}
            </li>
          </ul>
        </div>

        <div class="sentry-section" *ngIf="isSentryEnabled">
          <h4>
            <mat-icon color="primary">monitoring</mat-icon>
            Sentry Monitoring
          </h4>
          <p class="sentry-info">
            Error tracking and performance monitoring are active. 
            Issues will be automatically reported to Sentry for analysis.
          </p>
        </div>
      </mat-card-content>

      <mat-card-actions>
        <button mat-button (click)="logMetrics()">
          <mat-icon>bug_report</mat-icon>
          Log to Console
        </button>
        <button mat-button (click)="forceGC()" *ngIf="canForceGC">
          <mat-icon>cleaning_services</mat-icon>
          Force GC
        </button>
        <button mat-button (click)="triggerPerformanceCheck()">
          <mat-icon>refresh</mat-icon>
          Refresh Metrics
        </button>
        <button mat-button (click)="toggleMonitoring()">
          <mat-icon>{{ isMonitoring ? 'pause' : 'play_arrow' }}</mat-icon>
          {{ isMonitoring ? 'Pause' : 'Resume' }}
        </button>
        <button mat-button (click)="testSentry()" *ngIf="isSentryEnabled">
          <mat-icon>test_tube</mat-icon>
          Test Sentry
        </button>
        <button mat-button (click)="openFeedback()" *ngIf="isSentryEnabled">
          <mat-icon>feedback</mat-icon>
          Send Feedback
        </button>
      </mat-card-actions>
    </mat-card>
  `,
  styleUrls: ['./performance-monitor.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PerformanceMonitorComponent implements OnInit {
  /** Memory usage in MB */
  memoryUsage = 0;
  
  /** CPU usage percentage */
  cpuUsage = 0;
  
  /** Frame rate (FPS) */
  frameRate = 60;
  
  /** Performance warnings */
  warnings: string[] = [];
  
  /** Whether the system is healthy */
  isHealthy = true;
  
  /** Whether monitoring is active */
  isMonitoring = true;
  
  /** Whether garbage collection can be forced */
  canForceGC = false;
  
  /** Whether Sentry is enabled */
  isSentryEnabled = false;
  
  /** Destroy reference for automatic cleanup */
  private destroyRef = inject(DestroyRef);

  constructor(
    private performanceMonitor: PerformanceMonitorService,
    private sentryService: SentryService,
    private cdr: ChangeDetectorRef
  ) {
    // Check if garbage collection is available
    this.canForceGC = 'gc' in window;
    
    // Check Sentry status
    this.isSentryEnabled = this.sentryService.isSentryEnabled();
  }

  ngOnInit(): void {
    // Subscribe to memory usage updates
    this.performanceMonitor.getMemoryUsage()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(usage => {
        this.memoryUsage = usage;
        this.cdr.markForCheck();
      });

    // Subscribe to CPU usage updates
    this.performanceMonitor.getCPUUsage()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(usage => {
        this.cpuUsage = usage;
        this.cdr.markForCheck();
      });

    // Subscribe to frame rate updates
    this.performanceMonitor.getFrameRate()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(fps => {
        this.frameRate = fps;
        this.cdr.markForCheck();
      });

    // Subscribe to performance warnings
    this.performanceMonitor.getWarnings()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(warnings => {
        this.warnings = warnings;
        this.isHealthy = warnings.length === 0;
        this.cdr.markForCheck();
      });
  }

  /** Logs performance metrics to console */
  logMetrics(): void {
    this.performanceMonitor.logPerformanceMetrics();
  }

  /** Forces garbage collection if available */
  forceGC(): void {
    this.performanceMonitor.forceGarbageCollection();
  }

  /** Toggles performance monitoring on/off */
  toggleMonitoring(): void {
    if (this.isMonitoring) {
      this.performanceMonitor.stopMonitoring();
      this.isMonitoring = false;
    } else {
      this.performanceMonitor.startMonitoring();
      this.isMonitoring = true;
    }
    this.cdr.markForCheck();
  }

  /** Manually triggers performance check */
  triggerPerformanceCheck(): void {
    this.performanceMonitor.triggerPerformanceCheck();
  }

  /** Tests Sentry integration */
  testSentry(): void {
    if (this.isSentryEnabled) {
      // Test error capture
      this.sentryService.captureError(new Error('Test error from performance monitor'), {
        errorType: 'test-error',
        component: 'performance-monitor',
        timestamp: new Date().toISOString(),
      });

      // Test message capture
      this.sentryService.captureMessage('Performance monitor test message', 'info', {
        component: 'performance-monitor',
        timestamp: new Date().toISOString(),
      });

      // Test breadcrumb
      this.sentryService.addBreadcrumb('test', 'Performance monitor test completed', {
        component: 'performance-monitor',
        timestamp: new Date().toISOString(),
      });

      console.log('Sentry test completed. Check your Sentry dashboard for events.');
    }
  }

  /** Opens the Sentry feedback widget */
  openFeedback(): void {
    if (this.isSentryEnabled) {
      this.sentryService.showFeedbackWidget();
      
      // Add breadcrumb for feedback action
      this.sentryService.addBreadcrumb('user_action', 'User opened feedback widget', {
        component: 'performance-monitor',
        action: 'open_feedback',
        timestamp: new Date().toISOString(),
      });

      console.log('Feedback widget is available. Users can provide feedback through the Sentry interface.');
    }
  }
}
