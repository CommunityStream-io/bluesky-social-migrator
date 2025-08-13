import { ApplicationConfig, InjectionToken } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';

import { routes } from './app.routes';
import { BlueskyService } from './services/interfaces/bluesky-service.interface';
import { InstagramService } from './services/interfaces/instagram-service.interface';
import { ProgressService } from './services/interfaces/progress-service.interface';
import { BlueskyServiceMVP } from './services/bluesky/bluesky.service';
import { InstagramServiceMVP } from './services/instagram/instagram.service';
import { ProgressServiceMVP } from './services/progress/progress.service';

// Injection tokens for service interfaces
export const BLUESKY_SERVICE = new InjectionToken<BlueskyService>('BlueskyService');
export const INSTAGRAM_SERVICE = new InjectionToken<InstagramService>('InstagramService');
export const PROGRESS_SERVICE = new InjectionToken<ProgressService>('ProgressService');

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideAnimations(),
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
