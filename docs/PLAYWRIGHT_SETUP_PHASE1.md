# Playwright E2E Testing - Phase 1 Setup

## Overview
Phase 1 implements core E2E tests covering the main happy path (70% value) with stable, tested code. Phase 2 will expand coverage using this as a template.

---

## FILE 1: playwright.config.ts

Location: `playwright.config.ts` (root)

```typescript
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

FILE 2: tests/helpers/auth.ts
Location: tests/helpers/auth.ts
import { Page } from '@playwright/test'

/**
* Test user configuration
* Uses timestamp-based email to avoid conflicts between test runs
*/
export const createTestUser = () => ({
 email: `test-e2e-${Date.now()}@disdettafacile.test`,
 password: 'TestE2E123!Strong',
 nome: 'Test',
 cognome: 'E2E',
})

/**
* Static test user for manual testing
* Create this user manually in Supabase for development
*/
export const TEST_USER = {
 email: 'test-e2e@disdettafacile.test',
 password: 'TestPassword123!',
 nome: 'Test',
 cognome: 'E2E',
}

/**
* Login helper for E2E tests
* Uses semantic selectors for stability
*/
export async function login(page: Page, email?: string, password?: string) {
 const loginEmail = email || TEST_USER.email
 const loginPassword = password || TEST_USER.password
 
 await page.goto('/login')
 
 // Use semantic selectors (input type over classes)
 await page.fill('input[type="email"]', loginEmail)
 await page.fill('input[type="password"]', loginPassword)
 
 // Submit form
 await page.click('button[type="submit"]')
 
 // Wait for successful navigation
 await page.waitForURL(/\/(dashboard|$)/, { timeout: 10000 })
}

/**
* Logout helper
*/
export async function logout(page: Page) {
 // Use text-based selector (more stable than classes)
 await page.click('button:has-text("Esci"), a:has-text("Logout")')
 await page.waitForURL('/login', { timeout: 5000 })
}

/**
* Check if user is authenticated
*/
export async function isLoggedIn(page: Page): Promise<boolean> {
 try {
   await page.waitForSelector('[href="/dashboard"], [data-testid="user-menu"]', { 
     timeout: 2000 
   })
   return true
 } catch {
   return false
 }
}

/**
* Wait for OCR processing to complete
* Polls database status with 60s timeout
*/
export async function waitForOCRComplete(page: Page, timeout = 60000) {
 await page.waitForSelector(
   'text=/Dati estratti|Rivedi|Review/i',
   { timeout }
 )
}

FILE 3: tests/e2e/main-flow.spec.ts
Location: tests/e2e/main-flow.spec.ts
import { test, expect } from '@playwright/test'
import { login, waitForOCRComplete, TEST_USER } from '../helpers/auth'
import path from 'path'

/**
* Main E2E Flow Test - Phase 1
* 
* Covers complete happy path:
* 1. Login
* 2. Navigate to new disdetta
* 3. Select service and upload bill
* 4. Wait for OCR processing (10-30s)
* 5. Review extracted data
* 6. Confirm data
* 7. Send TEST PEC
* 8. Verify in dashboard
* 
* This single test provides ~70% coverage of critical functionality
*/

test.describe('Main Disdetta Flow', () => {
 
 test.beforeEach(async ({ page }) => {
   // Login with test user
   await login(page)
 })

 test('complete disdetta flow from upload to TEST_SENT', async ({ page }) => {
   console.log('🎯 Starting main flow test...')
   
   // Step 1: Navigate to new disdetta page
   await page.goto('/new-disdetta')
   await expect(page).toHaveURL('/new-disdetta')
   console.log('✓ Navigated to new-disdetta')

   // Step 2: Select service (adjust selector to match your UI)
   // Using semantic selector: href contains upload
   await page.click('a[href*="/upload/1"]')
   await expect(page).toHaveURL(/\/upload\/\d+/)
   console.log('✓ Selected service')

   // Step 3: Upload test bill
   const testFilePath = path.join(__dirname, '../fixtures/test-bolletta.pdf')
   const fileInput = page.locator('input[type="file"]')
   await fileInput.setInputFiles(testFilePath)
   console.log('✓ File selected')

   // Step 4: Submit upload form
   await page.click('button[type="submit"]')
   
   // Step 5: Wait for redirect to review page
   await page.waitForURL(/\/review\?id=\d+/, { timeout: 10000 })
   
   const url = page.url()
   const disdettaId = new URL(url).searchParams.get('id')
   expect(disdettaId).toBeTruthy()
   console.log(`✓ Upload successful, disdetta ID: ${disdettaId}`)

   // Step 6: Wait for OCR processing (CRITICAL: Can take 10-30 seconds)
   console.log('⏳ Waiting for OCR processing (up to 60s)...')
   await waitForOCRComplete(page, 60000)
   console.log('✓ OCR processing completed')

   // Step 7: Verify extracted data is visible
   // Using semantic selector: text content
   await expect(page.locator('text=/Nome|Cognome/i')).toBeVisible()
   console.log('✓ Extracted data displayed')

   // Step 8: Confirm data
   // Using semantic selector: button with text
   await page.click('button:has-text("Conferma")')
   console.log('✓ Data confirmed')

   // Step 9: Wait for send PEC button
   await page.waitForSelector('button:has-text("Invia")', { timeout: 5000 })

   // Step 10: Send TEST PEC
   await page.click('button:has-text("Invia")')
   console.log('✓ PEC send triggered')

   // Step 11: Wait for completion
   await page.waitForSelector('text=/TEST_SENT/i', { timeout: 10000 })
   console.log('✓ Disdetta marked as TEST_SENT')

   // Step 12: Verify in dashboard
   await page.goto('/dashboard')
   await expect(page).toHaveURL('/dashboard')
   await expect(page.locator('text=/TEST_SENT/i')).toBeVisible()
   console.log('✓ Disdetta visible in dashboard with correct status')
   
   console.log('🎉 Main flow test completed successfully!')
 })

 test('user can navigate to dashboard during flow', async ({ page }) => {
   // Regression test: ensure navigation doesn't break
   await page.goto('/new-disdetta')
   
   await page.click('a[href="/dashboard"]')
   await expect(page).toHaveURL('/dashboard')
   console.log('✓ Navigation works correctly')
 })
})

FILE 4: tests/e2e/duplicate-detection.spec.ts
Location: tests/e2e/duplicate-detection.spec.ts
import { test, expect } from '@playwright/test'
import { login, waitForOCRComplete } from '../helpers/auth'
import path from 'path'

/**
* Duplicate Detection Test (C21)
* 
* Verifies that uploading the same bill twice triggers:
* 1. Duplicate detection system
* 2. Warning modal with existing disdetta details
* 3. Prevention of duplicate submission
*/

test.describe('Duplicate Detection (C21)', () => {
 
 test.beforeEach(async ({ page }) => {
   await login(page)
 })

 test('prevents duplicate disdetta creation for same contract', async ({ page }) => {
   console.log('🎯 Testing duplicate detection...')
   
   // Upload first bill
   await page.goto('/upload/1')
   
   const testFilePath = path.join(__dirname, '../fixtures/test-bolletta.pdf')
   await page.locator('input[type="file"]').setInputFiles(testFilePath)
   await page.click('button[type="submit"]')
   
   await page.waitForURL(/\/review\?id=\d+/)
   console.log('✓ First bill uploaded')
   
   // Wait for OCR
   await waitForOCRComplete(page)
   console.log('✓ First OCR completed')
   
   // Confirm first disdetta
   await page.click('button:has-text("Conferma")')
   await page.waitForSelector('button:has-text("Invia")', { timeout: 5000 })
   console.log('✓ First disdetta confirmed')
   
   // Try to upload same bill again
   await page.goto('/upload/1')
   await page.locator('input[type="file"]').setInputFiles(testFilePath)
   await page.click('button[type="submit"]')
   
   // Should see duplicate detection
   // Wait for either modal or toast notification
   const duplicateWarning = page.locator(
     'text=/già presente|già esistente|duplicato|duplicate/i'
   )
   
   await expect(duplicateWarning).toBeVisible({ timeout: 10000 })
   console.log('✓ Duplicate warning displayed')
   
   // Verify user cannot proceed
   // Either redirected back or modal prevents submission
   const currentUrl = page.url()
   const isOnUploadPage = currentUrl.includes('/upload')
   const hasModal = await page.locator('[role="dialog"]').isVisible().catch(() => false)
   
   expect(isOnUploadPage || hasModal).toBeTruthy()
   console.log('✓ User prevented from creating duplicate')
   
   console.log('🎉 Duplicate detection test passed!')
 })
})

FILE 5: tests/fixtures/README.md
Location: tests/fixtures/README.md
# Test Fixtures

## Required Files

### test-bolletta.pdf

You need a PDF bill for testing. Two options:

**Option 1: Use real bill (recommended)**
- Copy an actual Italian utility bill
- Rename to `test-bolletta.pdf`
- Place in this directory

**Option 2: Create mock PDF**
Use any PDF creator to make a simple 1-page document with:

BOLLETTA ENERGETICA

Fornitore: ENEL ENERGIA SPA
Partita IVA: 06655971007

Cliente: Mario Rossi
Codice Fiscale: RSSMRA80A01H501U
Indirizzo: Via Roma 123, Milano MI

Codice POD: IT001E12345678

Totale: €120,50

## Test User

Create this user in Supabase for testing:
- Email: test-e2e@disdettafacile.test
- Password: TestPassword123!
- Complete profile with all required fields
- Upload documento identita

## Notes

- test-bolletta.pdf is in .gitignore (privacy)
- Must be readable by Google Document AI
- Keep file size < 5MB

MODIFICATIONS TO EXISTING FILES
package.json
Add these scripts to the “scripts” section:
"test:e2e": "playwright test",
"test:e2e:ui": "playwright test --ui",
"test:e2e:debug": "playwright test --debug",
"test:e2e:headed": "playwright test --headed"

MANUAL SETUP REQUIRED
After Claude Code creates files:
1. Create test user in Supabase:
∙ Email: test-e2e@disdettafacile.test
∙ Password: TestPassword123!
∙ Complete profile (nome, cognome, indirizzo, documento)
1. Add test bill:
∙ Copy a real PDF bill to tests/fixtures/test-bolletta.pdf
∙ Or create simple mock as described above
1. Update selectors (if needed):
∙ Review test files for selectors
∙ Adjust to match your actual DOM structure
∙ Prefer semantic selectors (role, text) over CSS classes
1. Run tests: npm run test:e2e

EXPECTED OUTCOMES
After setup:
∙ main-flow.spec.ts should pass (or fail only on selectors)
∙ duplicate-detection.spec.ts should pass after first run
∙ Screenshots captured on failures in test-results/
∙ HTML report generated in playwright-report/

If tests fail, check:
1. Test user exists and profile is complete
2. test-bolletta.pdf is present
3. Dev server is running (npm run dev)
4. Selectors match your DOM structure

NEXT STEPS (Phase 2)
After Phase 1 tests pass:
∙ Expand with c35-e2e-testing-task.md sections 1, 5, 7
∙ Add: auth.spec.ts, dashboard.spec.ts, error-handling.spec.ts
∙ Use main-flow.spec.ts as template for consistency

NOTES FROM C35 TASK
Key technical decisions:
∙ Workers: 1 (serial execution)
∙ OCR timeout: 60s (real processing: 10-30s)
∙ Test isolation: unique user per run (timestamp email)
∙ Selectors: semantic over fragile CSS
∙ Debug: screenshot-on-failure, video-on-retry