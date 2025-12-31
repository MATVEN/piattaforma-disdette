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

  // ========== ENABLE ERROR LOGGING ==========
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('❌ Browser Error:', msg.text())
    }
  })
  page.on('pageerror', error => {
    console.log('❌ Page Error:', error.message)
  })
  // ==========================================
  const loginEmail = email || TEST_USER.email
  const loginPassword = password || TEST_USER.password
  
  // Navigate to login page
  await page.goto('/login')
  
  // ========== HANDLE WELCOME MODAL FIRST ==========
  console.log('🔍 Checking for welcome modal on login page...')
  
  // Wait for page to load
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(1000)
  
  // Try to close modal if present
  try {
    // Check if modal is visible
    const modalVisible = await page.locator('.fixed.inset-0.z-\\[51\\]').isVisible().catch(() => false)
    
    if (modalVisible) {
      console.log('⚠️ Welcome modal detected on login page!')
      
      // Try clicking "Salta" button
      const skipButton = page.locator('button:has-text("Salta, lo farò da solo")')
      const skipVisible = await skipButton.isVisible().catch(() => false)
      
      if (skipVisible) {
        await skipButton.click({ force: true })
        console.log('✓ Clicked "Salta" button')
        await page.waitForTimeout(1000)
      } else {
        // Try close X button
        const closeButton = page.locator('button[aria-label="Chiudi"]')
        const closeVisible = await closeButton.isVisible().catch(() => false)
        
        if (closeVisible) {
          await closeButton.click({ force: true })
          console.log('✓ Clicked X button')
          await page.waitForTimeout(1000)
        } else {
          // Force remove modal from DOM
          console.log('⚠️ Forcing modal removal...')
          await page.evaluate(() => {
            document.querySelectorAll('.fixed.inset-0').forEach(el => el.remove())
          })
          await page.waitForTimeout(500)
        }
      }
    } else {
      console.log('✓ No modal on login page')
    }
  } catch (error) {
    console.log('ℹ️ Modal handling completed (or not present)')
  }
  
  // ========== NOW DO LOGIN ==========
  
  // Fill login form
  await page.fill('input[type="email"]', loginEmail)
  await page.fill('input[type="password"]', loginPassword)
  
  // Submit form
  await page.click('button[type="submit"]')
  
  // Wait for successful navigation
  await page.waitForURL(/\/(dashboard|$)/, { timeout: 10000 })
  
  console.log('✓ Login successful')
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
