import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E test configuration.
 * Primary target: Chromium (spec line 555)
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  // One local retry: very rarely the R3F canvas comes up unresponsive to
  // pointer events (page-scoped init race, worse in newer headless Chromium;
  // app state was verified correct when it happens). A fresh page clears it.
  retries: process.env.CI ? 2 : 1,
  // Every lesson-screen test spins up a WebGL scene; with one headless
  // browser per core they all software-render concurrently and the 3D
  // canvas can starve for tens of seconds, failing tests that interact
  // with the keyboard. Two workers keeps runs fast without the contention.
  workers: process.env.CI ? 1 : 2,
  reporter: 'html',
  timeout: 60000,

  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    actionTimeout: 10000,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
    stdout: 'pipe',
    stderr: 'pipe',
  },
});
