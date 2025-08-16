import { playwrightLauncher } from '@web/test-runner-playwright';

export default {
  files: 'dist/test-out/**/*.js',
  nodeResolve: true,
  setupFiles: ['src/test-setup.js'],
  testFramework: {
    name: 'web-test-runner-jasmine',
    options: {
      // Jasmine configuration
    }
  },
  browsers: [
    playwrightLauncher({ 
      product: 'chromium',
      launchOptions: {
        headless: true
      }
    })
  ],
  plugins: [],
  // Angular-specific configuration
  esbuildTarget: 'es2020',
  // Handle Angular module resolution
  moduleDirs: ['node_modules', 'dist/test-out']
};
