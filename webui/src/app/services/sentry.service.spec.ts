import { SentryService } from './sentry.service';
import { PLATFORM_ID } from '@angular/core';

describe('SentryService', () => {
  let service: SentryService;
  let mockPlatformId: any;

  beforeEach(() => {
    mockPlatformId = 'browser';
    
    // Create service instance
    service = new SentryService(mockPlatformId);
  });

  describe('Basic Functionality', () => {
    it('should be created', () => {
      expect(service).toBeTruthy();
    });

    it('should have basic methods available', () => {
      expect(typeof service.captureError).toBe('function');
      expect(typeof service.captureMessage).toBe('function');
      expect(typeof service.addBreadcrumb).toBe('function');
      expect(typeof service.setUser).toBe('function');
      expect(typeof service.setContext).toBe('function');
      expect(typeof service.setTag).toBe('function');
      expect(typeof service.flush).toBe('function');
      expect(typeof service.isSentryEnabled).toBe('function');
    });

    it('should handle service status', () => {
      // Test that the service can report its status
      const status = service.isSentryEnabled();
      expect(typeof status).toBe('boolean');
    });
  });

  describe('Error Handling', () => {
    it('should handle errors gracefully', () => {
      const error = new Error('Test error');
      
      // Should not throw
      expect(() => service.captureError(error)).not.toThrow();
    });

    it('should handle messages gracefully', () => {
      const message = 'Test message';
      
      // Should not throw
      expect(() => service.captureMessage(message)).not.toThrow();
    });

    it('should handle breadcrumbs gracefully', () => {
      const category = 'test';
      const message = 'Test breadcrumb';
      
      // Should not throw
      expect(() => service.addBreadcrumb(category, message)).not.toThrow();
    });

    it('should handle user context gracefully', () => {
      const user = { id: '123', username: 'testuser' };
      
      // Should not throw
      expect(() => service.setUser(user)).not.toThrow();
    });

    it('should handle context setting gracefully', () => {
      const name = 'test-context';
      const context = { userId: '123', action: 'test' };
      
      // Should not throw
      expect(() => service.setContext(name, context)).not.toThrow();
    });

    it('should handle tag setting gracefully', () => {
      const key = 'test-key';
      const value = 'test-value';
      
      // Should not throw
      expect(() => service.setTag(key, value)).not.toThrow();
    });
  });

  describe('Performance Metrics', () => {
    it('should handle performance metrics gracefully', () => {
      const metrics = {
        memoryUsage: 85,
        cpuUsage: 45,
        frameRate: 55,
        warnings: ['High memory usage'],
      };
      
      // Should not throw
      expect(() => service.capturePerformanceMetrics(metrics)).not.toThrow();
    });

    it('should handle empty performance metrics', () => {
      const metrics = {
        memoryUsage: 0,
        cpuUsage: 0,
        frameRate: 0,
        warnings: [],
      };
      
      // Should not throw
      expect(() => service.capturePerformanceMetrics(metrics)).not.toThrow();
    });
  });

  describe('Tab Lockup Detection', () => {
    it('should handle tab lockup events gracefully', () => {
      const context = {
        step: 'Bluesky Authentication',
        duration: 5000,
        memoryUsage: 120,
        cpuUsage: 90,
        frameRate: 25,
      };
      
      // Should not throw
      expect(() => service.captureTabLockup(context)).not.toThrow();
    });
  });

  describe('Step Completion Tracking', () => {
    it('should handle step completion gracefully', () => {
      const stepIndex = 1;
      const stepName = 'Bluesky Authentication';
      const duration = 2500;
      const success = true;
      
      // Should not throw
      expect(() => service.captureStepCompletion(stepIndex, stepName, duration, success)).not.toThrow();
    });

    it('should handle failed step completion gracefully', () => {
      const stepIndex = 2;
      const stepName = 'Migration Configuration';
      const duration = 1500;
      const success = false;
      
      // Should not throw
      expect(() => service.captureStepCompletion(stepIndex, stepName, duration, success)).not.toThrow();
    });
  });

  describe('Flush Operations', () => {
    it('should handle flush operations gracefully', async () => {
      // Should not throw and return a boolean
      const result = await service.flush();
      expect(typeof result).toBe('boolean');
    });
  });

  describe('Feedback Widget', () => {
    it('should handle feedback widget operations gracefully', () => {
      // Should not throw
      expect(() => service.showFeedbackWidget()).not.toThrow();
    });
  });
});
