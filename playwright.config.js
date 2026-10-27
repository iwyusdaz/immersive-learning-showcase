import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'tests',
  timeout: 90_000,
  retries: 0,
  workers: 1,
  use: { baseURL: process.env.BASE_URL || 'http://127.0.0.1:4173', trace: 'retain-on-failure' },
  webServer: process.env.BASE_URL
    ? undefined
    : {
        command: 'node scripts/serve-dist.mjs',
        url: 'http://127.0.0.1:4173',
        // Never reuse: another repo's preview server on the same port would be tested by mistake.
        reuseExistingServer: false,
        timeout: 30_000,
      },
  projects: [{ name: 'chromium', use: { browserName: 'chromium' } }],
  outputDir: 'tmp/test-results',
});
