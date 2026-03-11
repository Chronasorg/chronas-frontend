import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright config for deployment/remote E2E tests.
 * No webServer — tests run against the deployed CloudFront URL.
 */
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  timeout: 60000,
  use: {
    baseURL: process.env['BASE_URL'] ?? 'https://d1q6nlczw9cdpt.cloudfront.net',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  // No webServer — tests hit the deployed URL directly
});
