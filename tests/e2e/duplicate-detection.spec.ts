import { test, expect } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'
import { login } from '../helpers/auth'
import { DISDETTA_STATUS } from '@/types/enums'

// Create Admin client for testing (not browser client)
const supabaseAdmin = createClient(
 process.env.NEXT_PUBLIC_SUPABASE_URL!,
 process.env.SUPABASE_SERVICE_ROLE_KEY!, // Service role key for admin access
 {
   auth: {
     autoRefreshToken: false,
     persistSession: false
   }
 }
)

test.describe('Duplicate Detection (C21)', () => {
 test.beforeEach(async ({ page }) => {
   await login(page)
 })

 test.skip('prevents duplicate disdetta creation for same contract', async ({ page }) => {
   console.log('⏭️ Skipping duplicate detection test (database not configured)')
   
   const testContractNumber = 'IT001E12345678_TEST_' + Date.now()
   
   // Get test user ID
   const testUserEmail = 'test-e2e@DisdEasy.test'
   let userId: string
   
   const { data: users, error: userError } = await supabaseAdmin
     .from('profiles')
     .select('id')
     .eq('email', testUserEmail)
     .single()
   
   if (userError) {
     console.log('⚠️ User not found in profiles, using auth')
     // Fallback: get from auth
     const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers()
     const testUser = authUsers.users.find(u => u.email === testUserEmail)
     
     if (!testUser) {
       throw new Error('Test user not found!')
     }
     
     userId = testUser.id
   } else {
     userId = users.id
   }
   
   console.log('👤 Using user ID:', userId)
   
   // 1. Create first disdetta with known contract number
   console.log('📝 Creating first disdetta in database...')
   const { data: firstDisdetta, error: insertError } = await supabaseAdmin
     .from('disdette')
     .insert({
       user_id: userId,
       service_type_id: 1,
       contract_number: testContractNumber,
       status: 'TEST_SENT',
       customer_name: 'Test User',
       customer_address: 'Test Address'
     })
     .select()
     .single()
   
   expect(insertError).toBeNull()
   expect(firstDisdetta).toBeTruthy()
   console.log('✓ First disdetta created with ID:', firstDisdetta.id)
   console.log('✓ Contract number:', testContractNumber)
   
   // 2. Verify disdetta exists
   const { data: verifyData, error: verifyError } = await supabaseAdmin
     .from('disdette')
     .select('*')
     .eq('contract_number', testContractNumber)
     .single()
   
   expect(verifyError).toBeNull()
   expect(verifyData).toBeTruthy()
   console.log('✓ Disdetta verified in database')
   
   // 3. Try to create duplicate
   const { data: duplicateAttempt, error: duplicateError } = await supabaseAdmin
     .from('disdette')
     .insert({
       user_id: userId,
       service_type_id: 1,
       contract_number: testContractNumber,
       status: DISDETTA_STATUS.PROCESSING
     })
     .select()
   
   console.log('🔍 Duplicate attempt result:', {
     data: duplicateAttempt,
     error: duplicateError?.message
   })
   
   // 4. Check if duplicate was prevented at database level OR by trigger
   // Either: error occurred, OR data is null/empty
   const duplicatePrevented = duplicateError !== null || !duplicateAttempt || duplicateAttempt.length === 0
   
   expect(duplicatePrevented).toBe(true)
   console.log('✅ Duplicate correctly prevented!')
   
   // 5. Verify only ONE disdetta exists with this contract number
   const { data: allDisdette } = await supabaseAdmin
     .from('disdette')
     .select('id')
     .eq('contract_number', testContractNumber)
   
   expect(allDisdette?.length).toBe(1)
   console.log('✓ Only one disdetta exists with contract number')
   
   // 6. Cleanup
   const { error: deleteError } = await supabaseAdmin
     .from('disdette')
     .delete()
     .eq('id', firstDisdetta.id)
   
   expect(deleteError).toBeNull()
   console.log('🧹 Test data cleaned up')
   console.log('✅ Duplicate detection test PASSED!')
 })
})