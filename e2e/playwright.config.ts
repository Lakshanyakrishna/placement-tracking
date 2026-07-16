import { defineConfig, devices } from '@playwright/test';
import path from 'path';

const FRONTEND_URL = process.env.E2E_BASE_URL || 'http://localhost:5173';
const API_URL = process.env.E2E_API_URL || 'http://localhost:3000/api/v1';
const repoRoot = path.resolve(__dirname, '..');

export default defineConfig({
  testDir: './tests',
  fullyParallel: false, // several specs share seeded fixture data — keep it simple and serial for now
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [['html', { open: 'never' }]],
  globalSetup: require.resolve('./global-setup.ts'),
  // Several specs (opportunity-lifecycle, participation-submission, verification,
  // dashboards) each drive multiple full create+publish+participate+upload flows,
  // sometimes across 2-3 separate logins, all inside one test — that's easily
  // 15-20+ real page interactions against a live dev server, which doesn't fit in
  // Playwright's 30s default.
  timeout: 90_000,
  expect: { timeout: 8_000 },

  use: {
    baseURL: FRONTEND_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // In CI, the ci.yml workflow starts Postgres, runs migrations/seed, and launches
  // the backend + frontend itself before this suite runs — so `reuseExistingServer`
  // just detects those already-healthy servers and does not relaunch them. Locally,
  // if nothing is listening yet, Playwright starts both for you via `npm run e2e`.
  webServer: [
    {
      command: 'npm run start:dev',
      cwd: repoRoot,
      url: `${API_URL}/health`,
      reuseExistingServer: true,
      timeout: 60_000,
      stdout: 'pipe',
      stderr: 'pipe',
    },
    {
      command: 'npm run dev',
      cwd: path.join(repoRoot, 'frontend'),
      url: FRONTEND_URL,
      reuseExistingServer: true,
      timeout: 60_000,
      stdout: 'pipe',
      stderr: 'pipe',
      env: { VITE_API_BASE_URL: API_URL },
    },
  ],
});
