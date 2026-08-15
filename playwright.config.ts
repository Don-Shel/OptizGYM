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
  webServer: [
    {
      command: 'npm run server',
      url: 'http://localhost:3001/api/health',
      reuseExistingServer: !process.env.CI,
      timeout: 120000,
      env: {
        NODE_ENV: 'development',
        NEON_AUTH_URL: 'https://example.com/neondb/auth',
        NEON_JWKS_URL: 'https://example.com/neondb/auth/.well-known/jwks.json',
        DATABASE_URL: 'postgresql://127.0.0.1:5432/optizgym',
        LOG_TO_FILE: 'false',
      },
    },
    {
      command: 'npm run dev',
      url: 'http://localhost:8080',
      reuseExistingServer: !process.env.CI,
      timeout: 120000,
      env: {
        VITE_NEON_AUTH_URL: 'https://example.com/neondb/auth',
        VITE_API_URL: 'http://localhost:3001',
      },
    },
  ],
});
