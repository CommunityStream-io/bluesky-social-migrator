# Sentry Integration Guide

## Overview

This guide explains how to set up and use Sentry integration in your Instagram to Bluesky migration application. Sentry provides comprehensive error tracking, performance monitoring, and user session tracking to help identify and resolve issues that could cause tab lockups.

## What Sentry Provides

### 1. **Error Tracking**
- Automatic capture of JavaScript errors
- Custom error context and breadcrumbs
- Error grouping and deduplication
- Real-time error alerts
- **Configurable error filtering** with regex patterns

### 2. **Performance Monitoring**
- Transaction tracing
- Performance metrics collection
- Custom performance spans
- Performance issue detection

### 3. **User Session Tracking**
- User context for errors
- Session replay capabilities
- User journey tracking
- Custom user attributes

### 4. **Custom Context**
- Breadcrumbs for user actions
- Custom tags and metadata
- Environment-specific data
- Release tracking

### 5. **User Feedback Integration**
- Built-in feedback widget for user input
- Automatic feedback collection through Sentry interface
- Custom feedback triggers in the application
- Feedback context and breadcrumbs

## Setup Instructions

### 1. **Install Sentry Packages**

The required packages are already installed:
```bash
npm install @sentry/angular @sentry/tracing
```

### 2. **Configure Sentry DSN**

1. **Get Your Sentry DSN**:
   - Go to [Sentry.io](https://sentry.io)
   - Create a new project or use existing one
   - Go to Settings → Projects → [Your Project] → Client Keys (DSN)
   - Copy the DSN

2. **Update Environment Files**:
   ```typescript
   // src/environments/environment.ts
   export const environment = {
     production: false,
     sentry: {
       dsn: 'https://your-actual-dsn@sentry.io/project-id', // Replace with your DSN
       environment: 'development',
       tracesSampleRate: 1.0,
       profilesSampleRate: 1.0,
       debug: true,
       errorFilterRegex: /Invalid credentials|ResizeObserver loop limit exceeded/
     },
     // ... other config
   };
   ```

   ```typescript
   // src/environments/environment.prod.ts
   export const environment = {
     production: true,
     sentry: {
       dsn: 'https://your-actual-dsn@sentry.io/project-id', // Replace with your DSN
       environment: 'production',
       tracesSampleRate: 0.1, // 10% in production
       profilesSampleRate: 0.1, // 10% in production
       debug: false,
       errorFilterRegex: /Invalid credentials|ResizeObserver loop limit exceeded/
     },
     // ... other config
   };
   ```

### 3. **Update Domain Configuration**

In `src/app/services/sentry.service.ts`, update the tracing origins:
```typescript
integrations: [
  new BrowserTracing({
    tracingOrigins: ['localhost', 'your-actual-domain.com'], // Update with your domains
    routingInstrumentation: Sentry.routingInstrumentation,
  }),
],
```

## Features and Usage

### 1. **Automatic Error Tracking**

Sentry automatically captures:
- JavaScript errors
- Unhandled promise rejections
- Network request failures
- Console errors

### 2. **Configurable Error Filtering**

The system includes a powerful regex-based error filtering system that allows you to customize which errors are filtered out before being sent to Sentry:

```typescript
// Environment configuration
sentry: {
  dsn: 'your-dsn',
  environment: 'development',
  tracesSampleRate: 1.0,
  profilesSampleRate: 1.0,
  debug: true,
  errorFilterRegex: /Invalid credentials|ResizeObserver loop limit exceeded/
}
```

**Default Filtered Errors**:
- `Invalid credentials` - Common authentication errors that don't need tracking
- `ResizeObserver loop limit exceeded` - Browser-specific errors that are harmless

**Customizing Error Filters**:
```typescript
// Filter out specific error patterns
errorFilterRegex: /Invalid credentials|ResizeObserver loop limit exceeded|Network timeout/

// Filter out errors containing specific keywords
errorFilterRegex: /timeout|connection|retry/

// Filter out errors from specific components
errorFilterRegex: /component-error|validation-error/

// More complex patterns
errorFilterRegex: /^(Invalid|Network|Timeout|Connection).*error$/i
```

**Benefits of Error Filtering**:
- Reduces noise in Sentry dashboard
- Focuses on actionable errors
- Prevents common browser errors from cluttering reports
- Customizable per environment (different filters for dev vs prod)

### 3. **Custom Error Context**

```typescript
// Capture custom errors with context
this.sentryService.captureError(new Error('Custom error'), {
  errorType: 'custom-error',
  userId: '12345',
  action: 'migration-step',
  timestamp: new Date().toISOString(),
});
```

### 4. **Performance Metrics**

```typescript
// Capture performance metrics
this.sentryService.capturePerformanceMetrics({
  memoryUsage: 85,
  cpuUsage: 45,
  frameRate: 55,
  warnings: ['High memory usage detected'],
});
```

### 5. **Tab Lockup Detection**

The system automatically detects potential tab lockups:
- Monitors user activity
- Tracks performance metrics
- Captures lockup events in Sentry
- Provides detailed context for debugging

### 6. **Migration Step Tracking**

```typescript
// Track step completion
this.sentryService.captureStepCompletion(1, 'Bluesky Authentication', 2500, true);
```

### 7. **User Context**

```typescript
// Set user information
this.sentryService.setUser({
  id: 'user123',
  username: 'john_doe',
  email: 'john@example.com',
});
```

### 8. **Custom Breadcrumbs**

```typescript
// Add breadcrumbs for user actions
this.sentryService.addBreadcrumb('migration', 'Step 2 completed', {
  stepName: 'Bluesky Authentication',
  duration: 2500,
  success: true,
});
```

### 9. **User Feedback Integration**

The application includes built-in Sentry feedback integration that allows users to provide feedback directly:

```typescript
// Feedback integration is automatically configured
integrations: [
  Sentry.feedbackIntegration({
    colorScheme: "system",
  }),
],

// Manual feedback trigger
this.sentryService.showFeedbackWidget();
```

**Feedback Features**:
- **Automatic Widget**: Available through Sentry interface
- **Custom Triggers**: Feedback buttons in performance monitor and main stepper
- **Context Tracking**: Breadcrumbs for feedback actions
- **User Experience**: Seamless integration with existing UI

## Performance Monitoring

### 1. **Memory Usage Tracking**

- **Threshold**: 100MB
- **Action**: Warning when exceeded
- **Sentry**: Automatic capture of high memory events

### 2. **CPU Usage Monitoring**

- **Threshold**: 80%
- **Action**: Warning when exceeded
- **Sentry**: Performance metrics and alerts

### 3. **Frame Rate Monitoring**

- **Threshold**: 30 FPS
- **Action**: Warning when below threshold
- **Sentry**: Performance degradation tracking

### 4. **Tab Lockup Detection**

- **Threshold**: 5 seconds of inactivity
- **Action**: Automatic Sentry event capture
- **Context**: Performance metrics at lockup time

## Error Categories

### 1. **Application Errors**
- Component initialization failures
- Service errors
- State management issues

### 2. **Authentication Errors**
- Bluesky API failures
- Credential validation errors
- Network connectivity issues

### 3. **Performance Errors**
- Tab lockups
- Memory leaks
- High resource usage

### 4. **Migration Errors**
- Step completion failures
- Data processing errors
- API integration issues

### 5. **Filtered Errors**
- Common browser errors (ResizeObserver, etc.)
- Expected authentication failures
- Network timeouts (configurable)
- Custom patterns (configurable)

## Sentry Dashboard Features

### 1. **Issues View**
- Error grouping and deduplication
- Error frequency and impact
- User and environment distribution
- Stack traces and context

### 2. **Performance View**
- Transaction traces
- Performance metrics
- Custom performance spans
- Performance regression detection

### 3. **Releases View**
- Version tracking
- Error rate by release
- Performance by release
- Deployment tracking

### 4. **Users View**
- User session tracking
- Error impact by user
- User journey analysis
- Custom user attributes

## Best Practices

### 1. **Error Context**
- Always provide meaningful error context
- Include relevant user information
- Add custom tags for filtering
- Use breadcrumbs for user actions

### 2. **Error Filtering**
- Filter out common, non-actionable errors
- Use regex patterns for flexible filtering
- Different filters for different environments
- Regularly review and update filters

### 3. **Performance Monitoring**
- Set appropriate sampling rates
- Monitor key performance indicators
- Track user experience metrics
- Alert on performance degradation

### 4. **User Privacy**
- Don't log sensitive information
- Use user IDs instead of names when possible
- Respect user privacy preferences
- Follow data protection regulations

### 5. **Environment Management**
- Use different DSNs for dev/staging/prod
- Set appropriate sampling rates per environment
- Configure environment-specific error filters
- Test Sentry integration in staging

## Troubleshooting

### 1. **Sentry Not Initializing**
- Check DSN configuration
- Verify network connectivity
- Check browser console for errors
- Ensure Sentry service is provided

### 2. **Events Not Appearing**
- Check sampling rates
- Verify environment configuration
- Check Sentry dashboard filters
- Ensure proper error handling

### 3. **Too Many Filtered Errors**
- Review error filter regex patterns
- Adjust patterns to be more specific
- Monitor filtered error counts
- Balance noise reduction with visibility

### 4. **Performance Issues**
- Monitor Sentry overhead
- Adjust sampling rates
- Use performance budgets
- Profile Sentry operations

### 5. **Integration Issues**
- Check Angular version compatibility
- Verify package versions
- Review Sentry documentation
- Check for conflicting libraries

## Configuration Options

### 1. **Environment Variables**

```bash
# Development
SENTRY_DSN=https://your-dsn@sentry.io/project-id
SENTRY_ENVIRONMENT=development
SENTRY_DEBUG=true

# Production
SENTRY_DSN=https://your-dsn@sentry.io/project-id
SENTRY_ENVIRONMENT=production
SENTRY_DEBUG=false
```

### 2. **Performance Thresholds**

```typescript
performance: {
  monitoringEnabled: true,
  memoryThreshold: 100, // MB
  cpuThreshold: 80, // %
  fpsThreshold: 30, // FPS
  lockupThreshold: 5000, // 5 seconds
}
```

### 3. **Sentry Configuration**

```typescript
sentry: {
  dsn: 'your-dsn',
  environment: 'development',
  tracesSampleRate: 1.0, // 100% in development
  profilesSampleRate: 1.0, // 100% in development
  debug: true,
  errorFilterRegex: /Invalid credentials|ResizeObserver loop limit exceeded/
}
```

### 4. **Feedback Integration Configuration**

```typescript
// Automatically configured in SentryService
integrations: [
  Sentry.feedbackIntegration({
    colorScheme: "system", // Follows system theme
  }),
],

// Custom feedback triggers available
this.sentryService.showFeedbackWidget();
```

### 5. **Error Filtering Examples**

```typescript
// Filter out common browser errors
errorFilterRegex: /ResizeObserver|NetworkError|TimeoutError/

// Filter out authentication-related errors
errorFilterRegex: /Invalid credentials|Unauthorized|Forbidden/

// Filter out specific component errors
errorFilterRegex: /component-error|validation-error|form-error/

// Filter out network-related errors
errorFilterRegex: /network|connection|timeout|retry/

// Complex filtering with multiple patterns
errorFilterRegex: /^(Invalid|Network|Timeout|Connection).*error$|ResizeObserver|component-error/i
```

## Monitoring and Alerts

### 1. **Error Rate Alerts**
- Set thresholds for error rates
- Configure alert rules
- Set up notification channels
- Monitor error trends

### 2. **Performance Alerts**
- Monitor response times
- Track resource usage
- Alert on degradation
- Set performance budgets

### 3. **User Experience Alerts**
- Monitor tab lockups
- Track step completion rates
- Alert on authentication failures
- Monitor migration success rates

### 4. **Filtered Error Monitoring**
- Track filtered error counts
- Monitor filter effectiveness
- Adjust patterns as needed
- Balance noise reduction with visibility

## Conclusion

Sentry integration provides comprehensive monitoring and error tracking for your migration application. It helps identify performance issues, track user experiences, and resolve problems quickly. The integration is designed to be lightweight and non-intrusive while providing valuable insights into application health and user experience.

The new regex-based error filtering system allows you to customize which errors are tracked, reducing noise and focusing on actionable issues. This makes the Sentry dashboard more useful for debugging real problems while filtering out common, non-actionable errors.

## Next Steps

1. **Configure your Sentry DSN** in environment files
2. **Customize error filtering patterns** for your specific needs
3. **Update domain configuration** for your deployment
4. **Test error tracking** by triggering test errors
5. **Monitor performance metrics** in Sentry dashboard
6. **Set up alerts** for critical issues
7. **Customize tracking** for your specific needs

For additional help, refer to:
- [Sentry Documentation](https://docs.sentry.io/)
- [Angular Integration Guide](https://docs.sentry.io/platforms/javascript/guides/angular/)
- [Performance Monitoring](https://docs.sentry.io/product/performance/)
- [Error Tracking](https://docs.sentry.io/product/error-monitoring/)
