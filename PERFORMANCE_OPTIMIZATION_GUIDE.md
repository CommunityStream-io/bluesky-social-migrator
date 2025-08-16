# Performance Optimization Guide

## Overview

This guide explains the performance optimizations implemented to fix tab lockup issues during the Bluesky authentication step and provides instructions for using the performance monitoring tools.

## Root Causes of Tab Lockup

The tab lockup issues were caused by several performance problems:

### 1. **Memory Leaks in State Management**
- **Problem**: The `MigrationStateService` was creating new arrays on every state update, accumulating in memory
- **Solution**: Implemented change detection optimization and caching to prevent unnecessary updates

### 2. **Inefficient Subscription Management**
- **Problem**: Multiple subscriptions without proper cleanup, leading to memory leaks
- **Solution**: Replaced manual `Subject` cleanup with `DestroyRef` and `takeUntilDestroyed`

### 3. **Potential Infinite Loops**
- **Problem**: State updates triggering more state updates in a cascade
- **Solution**: Added change detection guards and optimized state update logic

### 4. **Large Object Cloning**
- **Problem**: Deep cloning of state objects on every update
- **Solution**: Implemented immutable state updates with change detection

## Performance Optimizations Implemented

### 1. **Migration State Service Optimization**

```typescript
// Before: Creating new arrays on every update
this.stateSubject.next({
  ...currentState,
  steps: updatedSteps
});

// After: Change detection and caching
private updateState(newState: MigrationState): void {
  const currentState = this.stateSubject.value;
  if (JSON.stringify(currentState) !== JSON.stringify(newState)) {
    this.stateSubject.next(newState);
  }
}
```

**Key Improvements**:
- Added change detection to prevent unnecessary state emissions
- Implemented step data caching to avoid duplicate updates
- Added validation before state updates

### 2. **Component Subscription Management**

```typescript
// Before: Manual Subject cleanup
private destroy$ = new Subject<void>();

ngOnDestroy(): void {
  this.destroy$.next();
  this.destroy$.complete();
}

// After: Automatic cleanup with DestroyRef
private destroyRef = inject(DestroyRef);

// Subscriptions automatically cleaned up
this.migrationStateService.state$
  .pipe(takeUntilDestroyed(this.destroyRef))
  .subscribe(/* ... */);
```

**Key Improvements**:
- Replaced manual `Subject` cleanup with `DestroyRef`
- Used `takeUntilDestroyed` for automatic subscription cleanup
- Eliminated `OnDestroy` lifecycle hooks

### 3. **Change Detection Strategy**

```typescript
@Component({
  // ...
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Component {
  // Manual change detection when needed
  this.cdr.markForCheck();
}
```

**Key Improvements**:
- Implemented `OnPush` change detection strategy
- Manual change detection only when necessary
- Reduced unnecessary change detection cycles

### 4. **Observable Stream Optimization**

```typescript
// Before: Single state stream
state$ = this.stateSubject.asObservable();

// After: Optimized streams with change detection
state$ = this.stateSubject.asObservable().pipe(
  distinctUntilChanged((prev, curr) => {
    return prev.currentStep === curr.currentStep && 
           prev.steps.every((step, index) => step.completed === curr.steps[index]?.completed);
  })
);

currentStep$ = this.state$.pipe(
  map(state => state.currentStep),
  distinctUntilChanged()
);
```

**Key Improvements**:
- Added `distinctUntilChanged` operators to prevent duplicate emissions
- Created specialized observables for specific data needs
- Implemented change detection at the stream level

## Performance Monitoring Tools

### 1. **Performance Monitor Service**

The `PerformanceMonitorService` provides real-time monitoring of:
- **Memory Usage**: Tracks JavaScript heap memory usage
- **CPU Usage**: Estimates CPU usage based on frame rate and memory pressure
- **Frame Rate**: Monitors application frame rate using `requestAnimationFrame`
- **Performance Warnings**: Automatically detects performance issues

### 2. **Performance Monitor Component**

The `PerformanceMonitorComponent` displays:
- Real-time performance metrics
- Visual progress bars for each metric
- Performance warnings when thresholds are exceeded
- Controls for debugging and optimization

### 3. **Performance Thresholds**

```typescript
private readonly MEMORY_THRESHOLD = 100; // MB
private readonly CPU_THRESHOLD = 80; // %
private readonly FPS_THRESHOLD = 30; // FPS
```

### 4. **Sentry Integration**

The application is integrated with **Sentry** for comprehensive error tracking and performance monitoring:

- **Error Tracking**: Captures JavaScript errors, promise rejections, and custom errors
- **Performance Monitoring**: Tracks tab lockups, step completion times, and resource usage
- **Custom Context**: Provides detailed breadcrumbs and user context for debugging
- **Error Filtering**: Configurable regex patterns to filter out common, non-actionable errors
- **Environment Management**: Different configurations for development and production

**Key Sentry Features**:
- Automatic tab lockup detection and reporting
- Migration step performance tracking
- Authentication event monitoring
- Performance metrics collection
- Custom error context and breadcrumbs

**Benefits**:
- Real-time visibility into performance issues
- Detailed error context for faster debugging
- Performance trend analysis
- Proactive issue detection
- Reduced noise through intelligent error filtering

## Using the Performance Monitor

### 1. **Enable Performance Monitoring**

The performance monitor is automatically enabled when the application starts. You can toggle its visibility using the "Show/Hide Performance Monitor" button in the migration stepper.

### 2. **Monitor Performance Metrics**

Watch for these indicators:
- **Memory Usage**: Should stay below 100MB during normal operation
- **CPU Usage**: Should stay below 80% during normal operation
- **Frame Rate**: Should maintain 30+ FPS for smooth UI

### 3. **Performance Warnings**

The monitor will automatically show warnings when:
- Memory usage exceeds 100MB
- CPU usage exceeds 80%
- Frame rate drops below 30 FPS

### 4. **Debugging Tools**

Use the performance monitor's built-in tools:
- **Log to Console**: Outputs detailed metrics to browser console
- **Force GC**: Triggers garbage collection (if available)
- **Pause/Resume**: Temporarily disable monitoring

## Best Practices for Performance

### 1. **Subscription Management**
- Always use `DestroyRef` and `takeUntilDestroyed` for subscriptions
- Avoid manual `Subject` cleanup
- Use specialized observables instead of filtering large state streams

### 2. **Change Detection**
- Implement `OnPush` change detection strategy
- Use `markForCheck()` only when necessary
- Avoid triggering change detection in loops

### 3. **State Management**
- Implement change detection before state updates
- Cache data to prevent duplicate processing
- Use immutable state updates

### 4. **Memory Management**
- Monitor memory usage during development
- Watch for memory leaks in long-running operations
- Use performance monitoring tools proactively

## Troubleshooting Performance Issues

### 1. **Tab Lockup Symptoms**
- UI becomes unresponsive
- High memory usage (>100MB)
- Low frame rate (<30 FPS)
- High CPU usage (>80%)

### 2. **Immediate Actions**
1. Check the performance monitor for warnings
2. Open browser console and look for error messages
3. Check memory usage in browser DevTools
4. Force garbage collection if available

### 3. **Long-term Solutions**
1. Review subscription management in components
2. Check for memory leaks in services
3. Optimize change detection strategies
4. Implement proper error boundaries

## Development Environment Setup

### 1. **Enable Performance Monitoring**
The performance monitor is included in the development build by default. Use the toggle button to show/hide it during development.

### 2. **Browser DevTools**
- **Memory Tab**: Monitor memory usage and detect leaks
- **Performance Tab**: Profile CPU usage and frame rates
- **Console**: View performance warnings and metrics

### 3. **Performance Testing**
- Test with large datasets to identify bottlenecks
- Monitor performance during long-running operations
- Use the performance monitor to track metrics over time

## Conclusion

The implemented performance optimizations address the root causes of tab lockup issues:

1. **Eliminated memory leaks** through proper subscription management
2. **Optimized state updates** with change detection and caching
3. **Improved change detection** with OnPush strategy
4. **Added performance monitoring** for proactive issue detection

These optimizations ensure the application remains responsive and stable, even during complex operations like the Bluesky authentication step.

## Future Enhancements

Consider implementing these additional optimizations:
- **Web Workers**: Move heavy processing to background threads
- **Virtual Scrolling**: Handle large lists efficiently
- **Lazy Loading**: Load components and data on demand
- **Service Workers**: Cache resources for offline functionality
