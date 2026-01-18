import { createClient } from '@supabase/supabase-js'
import { DISDETTA_STATUS } from '@/types/enums'

// Test Supabase client (uses existing free tier project)
export const supabaseTest = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Factory for creating test data
export const createTestDisdetta = (overrides = {}) => ({
  user_id: 'test-user-id',
  file_path: `test-user-id/test-service/${Date.now()}_test.pdf`,
  status: DISDETTA_STATUS.PENDING_REVIEW,
  supplier_tax_id: '12345678901',
  receiver_tax_id: 'RSSMRA80A01H501U',
  supplier_contract_number: 'IT001E12345678',
  supplier_iban: 'IT60X0542811101000000123456',
  ...overrides,
})

// Cleanup helper
export const cleanupTestData = async (userId: string) => {
  await supabaseTest
    .from('disdette')
    .delete()
    .eq('user_id', userId)
}

// Mock fetch response helper
export const mockFetchResponse = (data: any, ok = true) => {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok,
      json: async () => data,
      status: ok ? 200 : 400,
    } as Response)
  )
}

// Create a test user ID with timestamp for uniqueness
export const createTestUserId = () => `test-user-${Date.now()}`
