import { defineConfig, devices } from '@playwright/test';

const e2eAuthSecret = process.env.NEXTAUTH_SECRET ?? 'e2e-auth-secret-at-least-16-chars';
const backendApiUrl = process.env.BACKEND_API_URL ?? 'http://localhost:8000';
const publicBackendApiUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL ?? backendApiUrl;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [['html', { open: 'never' }], ['list']],
  use: {
    baseURL: process.env.BASE_URL ?? 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'pnpm dev',
    env: {
      ...process.env,
      BACKEND_API_URL: backendApiUrl,
      NEXT_PUBLIC_BACKEND_API_URL: publicBackendApiUrl,
      NEXTAUTH_SECRET: e2eAuthSecret,
    },
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
