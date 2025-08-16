import { ApplicationConfig, InjectionToken } from '@angular/core';
import { provideAnimations } from '@angular/platform-browser/animations';

import { BlueskyService } from './services/interfaces/bluesky-service.interface';
import { InstagramService } from './services/interfaces/instagram-service.interface';
import { ProgressService } from './services/interfaces/progress-service.interface';
import { BlueskyServiceMVP } from './services/bluesky/bluesky.service';
import { InstagramServiceMVP } from './services/instagram/instagram.service';
import { ProgressServiceMVP } from './services/progress/progress.service';
import { MigrationStateService } from './services/migration-state.service';
import { PerformanceMonitorService } from './services/performance-monitor.service';
import { SentryService } from './services/sentry.service';

// Injection tokens for service interfaces
export const BLUESKY_SERVICE = new InjectionToken<BlueskyService>('BlueskyService');
export const INSTAGRAM_SERVICE = new InjectionToken<InstagramService>('InstagramService');
export const PROGRESS_SERVICE = new InjectionToken<ProgressService>('ProgressService');

export const appConfig: ApplicationConfig = {
  providers: [
    provideAnimations(),
    MigrationStateService,
    PerformanceMonitorService,
    SentryService,
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
};
