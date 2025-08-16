export const environment = {
  production: false,
  sentry: {
    dsn: 'https://f1ff5aa78bc4afd6d5f384333c505e05@o4506526838620160.ingest.us.sentry.io/4509854682382336', // TODO: Replace with your actual Sentry DSN
    environment: 'development',
    tracesSampleRate: 1.0,
    profilesSampleRate: 1.0,
    debug: true,
    errorFilterRegex: /Invalid credentials|ResizeObserver loop limit exceeded/
  },
  app: {
    name: 'Instagram to Bluesky Migrator',
    version: '1.0.0',
    environment: 'development',
  },
  performance: {
    monitoringEnabled: true,
    memoryThreshold: 100, // MB
    cpuThreshold: 80, // %
    fpsThreshold: 30, // FPS
    lockupThreshold: 5000, // 5 seconds
  }
};
