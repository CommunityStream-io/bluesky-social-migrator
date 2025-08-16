import { Injectable, DestroyRef, inject } from '@angular/core';
import { BehaviorSubject, Observable, interval } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { SentryService } from './sentry.service';

/**
 * Performance monitoring service to track memory usage, CPU usage, and performance metrics
 * 
 * This service helps identify performance issues that could cause tab lockups
 * and provides real-time monitoring of application performance.
 * 
 * @description Integrated with Sentry for error tracking and performance monitoring
 */
@Injectable({
  providedIn: 'root'
})
export class PerformanceMonitorService {
  /** Memory usage in MB */
  private memoryUsage$ = new BehaviorSubject<number>(0);
  
  /** CPU usage percentage (estimated) */
  private cpuUsage$ = new BehaviorSubject<number>(0);
  
  /** Frame rate (FPS) */
  private frameRate$ = new BehaviorSubject<number>(60);
  
  /** Performance warnings */
  private warnings$ = new BehaviorSubject<string[]>([]);
  
  /** Whether monitoring is active */
  private isMonitoring = false;
  
  /** Performance thresholds */
  private readonly MEMORY_THRESHOLD = 100; // MB
  private readonly CPU_THRESHOLD = 80; // %
  private readonly FPS_THRESHOLD = 30; // FPS
  
  /** Monitoring interval in milliseconds */
  private readonly MONITORING_INTERVAL = 2000;
  
  /** Tab lockup detection */
  private lastActivityTime = Date.now();
  private lockupDetectionInterval: number | null = null;
  private readonly LOCKUP_THRESHOLD = 5000; // 5 seconds of inactivity
  
  /** Destroy reference for automatic cleanup */
  private destroyRef = inject(DestroyRef);

  constructor(private sentryService: SentryService) {
    this.startMonitoring();
    this.setupTabLockupDetection();
  }

  /** Starts performance monitoring */
  startMonitoring(): void {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    
    // Monitor memory usage
    interval(this.MONITORING_INTERVAL)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.updateMemoryUsage();
        this.updateCPUUsage();
        this.updateFrameRate();
        this.checkPerformanceThresholds();
        this.sendMetricsToSentry();
      });
  }

  /** Stops performance monitoring */
  stopMonitoring(): void {
    this.isMonitoring = false;
    this.stopTabLockupDetection();
  }

  /** Sets up tab lockup detection */
  private setupTabLockupDetection(): void {
    // Track user activity
    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    activityEvents.forEach(event => {
      document.addEventListener(event, () => {
        this.lastActivityTime = Date.now();
      }, { passive: true });
    });

    // Check for lockups every second
    this.lockupDetectionInterval = window.setInterval(() => {
      const timeSinceLastActivity = Date.now() - this.lastActivityTime;
      
      if (timeSinceLastActivity > this.LOCKUP_THRESHOLD) {
        this.detectTabLockup();
      }
    }, 1000);
  }

  /** Stops tab lockup detection */
  private stopTabLockupDetection(): void {
    if (this.lockupDetectionInterval) {
      clearInterval(this.lockupDetectionInterval);
      this.lockupDetectionInterval = null;
    }
  }

  /** Detects potential tab lockup */
  private detectTabLockup(): void {
    const currentMetrics = this.getPerformanceSummary();
    
    // Check if performance is poor
    if (currentMetrics.memoryUsage > this.MEMORY_THRESHOLD || 
        currentMetrics.cpuUsage > this.CPU_THRESHOLD || 
        currentMetrics.frameRate < this.FPS_THRESHOLD) {
      
      // Capture tab lockup in Sentry
      this.sentryService.captureTabLockup({
        step: this.getCurrentStepName(),
        duration: Date.now() - this.lastActivityTime,
        memoryUsage: currentMetrics.memoryUsage,
        cpuUsage: currentMetrics.cpuUsage,
        frameRate: currentMetrics.frameRate,
      });

      // Add breadcrumb for lockup detection
      this.sentryService.addBreadcrumb('performance', 'Tab lockup detected', {
        step: this.getCurrentStepName(),
        duration: Date.now() - this.lastActivityTime,
        memoryUsage: currentMetrics.memoryUsage,
        cpuUsage: currentMetrics.cpuUsage,
        frameRate: currentMetrics.frameRate,
        warnings: currentMetrics.warnings,
      });
    }
  }

  /** Gets current step name for context */
  private getCurrentStepName(): string {
    // Try to get current step from URL or other indicators
    const path = window.location.pathname;
    if (path.includes('bluesky-auth')) return 'bluesky-auth';
    if (path.includes('content-upload')) return 'content-upload';
    if (path.includes('migration-config')) return 'migration-config';
    if (path.includes('migration-execution')) return 'migration-execution';
    if (path.includes('completion')) return 'completion';
    return 'unknown';
  }

  /** Sends performance metrics to Sentry */
  private sendMetricsToSentry(): void {
    const metrics = this.getPerformanceSummary();
    this.sentryService.capturePerformanceMetrics(metrics);
  }

  /** Gets memory usage observable */
  getMemoryUsage(): Observable<number> {
    return this.memoryUsage$.asObservable();
  }

  /** Gets CPU usage observable */
  getCPUUsage(): Observable<number> {
    return this.cpuUsage$.asObservable();
  }

  /** Gets frame rate observable */
  getFrameRate(): Observable<number> {
    return this.frameRate$.asObservable();
  }

  /** Gets performance warnings observable */
  getWarnings(): Observable<string[]> {
    return this.warnings$.asObservable();
  }

  /** Updates memory usage from performance API */
  private updateMemoryUsage(): void {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      const usedMB = Math.round(memory.usedJSHeapSize / 1024 / 1024);
      this.memoryUsage$.next(usedMB);
    }
  }

  /** Updates CPU usage (estimated based on frame rate and memory) */
  private updateCPUUsage(): void {
    // Simple CPU estimation based on frame rate and memory usage
    const memoryUsage = this.memoryUsage$.value;
    const frameRate = this.frameRate$.value;
    
    let cpuEstimate = 0;
    
    // Memory pressure increases CPU usage
    if (memoryUsage > this.MEMORY_THRESHOLD) {
      cpuEstimate += 30;
    }
    
    // Low frame rate indicates high CPU usage
    if (frameRate < this.FPS_THRESHOLD) {
      cpuEstimate += 40;
    }
    
    // Normal operation
    if (cpuEstimate === 0) {
      cpuEstimate = Math.random() * 20 + 10; // 10-30% normal range
    }
    
    this.cpuUsage$.next(Math.min(cpuEstimate, 100));
  }

  /** Updates frame rate using requestAnimationFrame */
  private updateFrameRate(): void {
    let frameCount = 0;
    let lastTime = performance.now();
    
    const countFrame = () => {
      frameCount++;
      const currentTime = performance.now();
      
      if (currentTime - lastTime >= 1000) {
        const fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
        this.frameRate$.next(fps);
        
        frameCount = 0;
        lastTime = currentTime;
      }
      
      if (this.isMonitoring) {
        requestAnimationFrame(countFrame);
      }
    };
    
    requestAnimationFrame(countFrame);
  }

  /** Checks performance thresholds and generates warnings */
  private checkPerformanceThresholds(): void {
    const warnings: string[] = [];
    const memoryUsage = this.memoryUsage$.value;
    const cpuUsage = this.cpuUsage$.value;
    const frameRate = this.frameRate$.value;
    
    if (memoryUsage > this.MEMORY_THRESHOLD) {
      warnings.push(`High memory usage: ${memoryUsage}MB (threshold: ${this.MEMORY_THRESHOLD}MB)`);
    }
    
    if (cpuUsage > this.CPU_THRESHOLD) {
      warnings.push(`High CPU usage: ${cpuUsage}% (threshold: ${this.CPU_THRESHOLD}%)`);
    }
    
    if (frameRate < this.FPS_THRESHOLD) {
      warnings.push(`Low frame rate: ${frameRate}FPS (threshold: ${this.FPS_THRESHOLD}FPS)`);
    }
    
    this.warnings$.next(warnings);
  }

  /** Gets current performance summary */
  getPerformanceSummary(): {
    memoryUsage: number;
    cpuUsage: number;
    frameRate: number;
    warnings: string[];
    isHealthy: boolean;
  } {
    const memoryUsage = this.memoryUsage$.value;
    const cpuUsage = this.cpuUsage$.value;
    const frameRate = this.frameRate$.value;
    const warnings = this.warnings$.value;
    
    const isHealthy = warnings.length === 0;
    
    return {
      memoryUsage,
      cpuUsage,
      frameRate,
      warnings,
      isHealthy
    };
  }

  /** Logs performance metrics to console for debugging */
  logPerformanceMetrics(): void {
    const summary = this.getPerformanceSummary();
    console.group('Performance Metrics');
    console.log(`Memory Usage: ${summary.memoryUsage}MB`);
    console.log(`CPU Usage: ${summary.cpuUsage}%`);
    console.log(`Frame Rate: ${summary.frameRate}FPS`);
    console.log(`Healthy: ${summary.isHealthy}`);
    
    if (summary.warnings.length > 0) {
      console.warn('Performance Warnings:', summary.warnings);
    }
    
    console.groupEnd();
  }

  /** Forces garbage collection if available */
  forceGarbageCollection(): void {
    if ('gc' in window) {
      (window as any).gc();
      console.log('Garbage collection triggered');
      
      // Add breadcrumb for manual GC
      this.sentryService.addBreadcrumb('performance', 'Manual garbage collection triggered', {
        timestamp: new Date().toISOString(),
        memoryBefore: this.memoryUsage$.value,
      });
    } else {
      console.log('Garbage collection not available in this environment');
    }
  }

  /** Manually triggers performance monitoring for testing */
  triggerPerformanceCheck(): void {
    this.updateMemoryUsage();
    this.updateCPUUsage();
    this.updateFrameRate();
    this.checkPerformanceThresholds();
    this.sendMetricsToSentry();
  }
}
