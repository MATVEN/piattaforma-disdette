import { defineConfig, devices } from '@playwright/test'

/**
 * Playwright E2E Configuration for DisdettaFacile
 * Phase 1: Core tests (main flow + duplicates)
 *
 * Technical decisions from C35 task:
 * - workers: 1 (serial execution to avoid DB race conditions)
 * - timeout: 90000 (OCR processing can take 10-30 seconds)
 * - Generous action/navigation timeouts for stability
 */
export default defineConfig({
  testDir: './tests/e2e',

  // Test timeout (90s for OCR processing)
  timeout: 90000,

  // Expect timeout for assertions
  expect: {
    timeout: 10000,
  },

  // Run tests serially to prevent DB conflicts
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1, // CRITICAL: Serial execution for database consistency

  // Reporter
  reporter: [
    ['html'],
    ['list'],
    ['json', { outputFile: 'test-results.json' }]
  ],

  // Shared settings
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',

    // Debug artifacts
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',

    // Generous timeouts for stability
    actionTimeout: 15000,
    navigationTimeout: 30000,

    // Viewport
    viewport: { width: 1280, height: 720 },
  },

  // Browser configuration
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // Optional: Auto-start dev server
  webServer: process.env.CI ? undefined : {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: true,
    timeout: 120000,
  },
})
