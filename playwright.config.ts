import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:8080',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  // The current e2e suite covers public frontend navigation only. API behavior,
  // authentication, authorization, and persistence are covered by backend tests;
  // keeping the browser server independent of PostgreSQL makes these checks
  // deterministic in clean CI environments.
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:8080',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
    env: {
      VITE_NEON_AUTH_URL: 'https://example.com/neondb/auth',
      VITE_API_URL: 'http://localhost:3001',
    },
  },
});
