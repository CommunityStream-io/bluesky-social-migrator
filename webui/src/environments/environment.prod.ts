export const environment = {
  production: true,
  sentry: {
    dsn: 'YOUR_SENTRY_DSN', // TODO: Replace with your actual Sentry DSN
    environment: 'production',
    tracesSampleRate: 0.1, // Capture 10% of transactions in production
    profilesSampleRate: 0.1, // Capture 10% of profiles in production
    debug: false,
  },
  app: {
    name: 'Instagram to Bluesky Migrator',
    version: '1.0.0',
    environment: 'production',
  },
  performance: {
    monitoringEnabled: true,
    memoryThreshold: 100, // MB
    cpuThreshold: 80, // %
    fpsThreshold: 30, // FPS
    lockupThreshold: 5000, // 5 seconds
  }
};
