# TASK: Stripe Payment Integration

## Overview

This task implements a complete Stripe payment system for the DisdettaFacile platform. The integration ensures users must pay before sending cancellation letters via PEC, preventing free usage of the service.

**Total Effort:** 2 days (Phase 1: 1 day, Phase 2: 1 day)

---

## Phase 1: Infrastructure Setup ✅ COMPLETED

### Summary

The foundational Stripe integration has been implemented, including:

- Stripe SDK configuration (server and client-side)
- Checkout Session API endpoint (`/api/stripe/create-checkout`)
- Webhook handler for payment events (`/api/stripe/webhook`)
- Database schema with payment tracking columns
- Email confirmation service integration
- PaymentButton component
- Complete documentation (STRIPE_SETUP_GUIDE.md)

### Implemented Files

**Configuration:**
- `src/lib/stripe.ts` - Stripe instances and error mapping

**API Routes:**
- `src/app/api/stripe/create-checkout/route.ts` - Creates Stripe Checkout sessions
- `src/app/api/stripe/webhook/route.ts` - Handles payment events

**Components:**
- `src/components/PaymentButton.tsx` - Payment UI component

**Database:**
- `supabase/migrations/20260108000000_add_payment_tracking.sql` - Payment columns and indexes

**Services:**
- `src/lib/email/emailService.ts` - Payment confirmation emails

### Database Schema (Already Applied)

The following columns exist in the `disdette` table:

- `payment_status` TEXT DEFAULT 'pending' (pending, paid, failed, refunded)
- `payment_amount` INTEGER (amount in cents)
- `payment_currency` TEXT DEFAULT 'eur'
- `payment_date` TIMESTAMP
- `payment_method` TEXT (card type, apple_pay, google_pay)
- `stripe_session_id` TEXT (for idempotency)
- `stripe_payment_intent` TEXT (Stripe reference)

**Indexes:**
- `idx_disdette_stripe_session` on `stripe_session_id`
- `idx_disdette_payment_status` on `payment_status`

---

## Phase 2: Review Page Payment Flow 🔴 TODO

### Objective

Integrate the payment flow into the review page to enforce payment before PEC sending. The current flow allows users to send PEC immediately after confirming data, which must be prevented.

### Current Problem

**Existing flow (incorrect):**
1. User uploads bill → Dashboard
2. User reviews data → Review page
3. User confirms data → **PEC sent immediately** (no payment!)
4. User lands on Dashboard

**This allows free usage of the service.**

### Target Flow (correct)

1. User uploads bill → Dashboard
2. User reviews data → Review page
3. User clicks "Conferma dati" → **Saves data, does NOT send PEC**
4. **Payment UI appears** → User pays via Stripe
5. After payment success → Button becomes "Invia PEC"
6. User clicks "Invia PEC" → PEC sent via edge function
7. Redirect to Dashboard with success message

### Flow States

The review page flow should have these distinct states:

**EDITING** - Initial state when user arrives
- User can modify form fields
- Submit button shows "Conferma dati"

**CONFIRMING** - Data validation in progress
- Loading spinner shown
- Duplicate detection check runs

**DUPLICATE_DETECTED** - Duplicate contract found
- Modal displays existing disdetta details
- User can cancel or bypass (with confirmation)

**PENDING_PAYMENT** - Data confirmed, awaiting payment
- Form fields are disabled (read-only)
- Yellow/amber info box appears with text: "✅ Dati confermati! Procedi al pagamento per inviare la disdetta."
- PaymentButton component is rendered
- Submit button is hidden

**PAID** - Payment completed successfully
- Green success box appears with text: "✅ Pagamento completato!"
- Button shows "Invia PEC"
- Clicking button triggers PEC sending

**SENDING** - PEC sending in progress
- Loading spinner on button
- Button disabled

**SENT** - PEC sent successfully
- Redirect to `/dashboard?success=pec_sent`
- Toast notification shown

### Technical Implementation

#### 1. Update `useFormSubmission.ts`

**Current behavior:** The hook calls the edge function `send-pec-disdetta` immediately after data confirmation.

**Required changes:**

The `onSubmit` function should be modified to only save data to the database without triggering PEC sending. The PEC edge function should be called separately after payment confirmation.

**Modified logic:**
- Save form data to `disdette` table
- Set `status: 'reviewed'` and `payment_status: 'pending'`
- Run duplicate detection (existing logic)
- Return success WITHOUT calling `send-pec-disdetta`
- Do NOT redirect to dashboard

**New function needed:**
- Add `sendPEC()` function that calls `send-pec-disdetta` edge function
- This function should only be callable when `payment_status === 'paid'`
- After successful PEC sending, redirect to dashboard

#### 2. Update `ReviewForm/index.tsx`

**Add state management:**
- Track current flow state (editing, pending_payment, paid, sending)
- Listen for payment success (via URL params or callback)
- Conditionally render UI based on state

**UI Structure:**
```typescript
// Pseudo-code structure
<form>
  {/* Always visible: form fields */}
  <TipoIntestatarioSelector />
  <SupplierFields />
  {/* ... other fields ... */}

  {/* State: EDITING or CONFIRMING */}
  {flowState === 'editing' && (
    <SubmitButton text="Conferma dati" />
  )}

  {/* State: PENDING_PAYMENT */}
  {flowState === 'pending_payment' && (
    <div className="amber-info-box">
      <p>✅ Dati confermati! Procedi al pagamento...</p>
      <PaymentButton 
        disdettaId={disdettaId}
        onSuccess={handlePaymentSuccess}
      />
    </div>
  )}

  {/* State: PAID */}
  {flowState === 'paid' && (
    <>
      <div className="green-success-box">
        <p>✅ Pagamento completato!</p>
      </div>
      <button onClick={handleSendPEC}>
        Invia PEC
      </button>
    </>
  )}

  {/* Modals */}
  <DuplicateDetectionModal />
  <ProgressModal />
</form>
```

**Event handlers:**

The component should implement these handlers:

- `handleDataConfirmation()` - Called on form submit, saves data and shows payment UI
- `handlePaymentSuccess()` - Called when payment webhook confirms success, changes state to 'paid'
- `handleSendPEC()` - Called when user clicks "Invia PEC", triggers edge function

#### 3. Update `PaymentButton.tsx`

**Add callback support:**

The PaymentButton component should accept an `onSuccess` callback prop that gets called after successful payment. This allows the parent ReviewForm to update its state.

**Implementation approach:**

After Stripe Checkout redirect (when user returns from payment), the component should:
- Check URL params for `payment_intent` and `payment_intent_client_secret`
- Verify payment status with Stripe API
- Call `onSuccess()` callback if payment succeeded
- Show error message if payment failed

#### 4. Payment Success Detection

**Option A: URL Parameters (Recommended)**

After Stripe Checkout, Stripe redirects to success URL with query params. The ReviewForm should check for these on mount and update state accordingly.
```typescript
// In ReviewForm useEffect
useEffect(() => {
  const searchParams = new URLSearchParams(window.location.search)
  const paymentSuccess = searchParams.get('payment_success')
  
  if (paymentSuccess === 'true') {
    setFlowState('paid')
    // Clean URL
    window.history.replaceState({}, '', '/review')
  }
}, [])
```

**Option B: Database Polling**

Poll the database to check if `payment_status` has changed to 'paid'. This is less efficient but more reliable if URL params are lost.

**Recommended: Use Option A (URL params) as primary, with database check as fallback.**

#### 5. Form State Management

When payment is pending or completed, the form should prevent further edits:

- Disable all input fields (add `disabled` attribute)
- Show visual indication that data is locked
- Prevent form submission

This ensures data integrity between confirmation, payment, and PEC sending.

### Files to Modify

**Primary files:**
- `src/components/ReviewForm/hooks/useFormSubmission.ts` - Separate data saving from PEC sending
- `src/components/ReviewForm/index.tsx` - Add flow state management and conditional rendering
- `src/components/PaymentButton.tsx` - Add onSuccess callback

**Supporting files (may need minor adjustments):**
- `src/components/ReviewForm/components/SubmitButton.tsx` - Update button text based on state
- `src/app/review/page.tsx` - Handle URL params for payment success

### Acceptance Criteria

**Data Confirmation:**
- User clicks "Conferma dati" button
- Data is saved to database with `status: 'reviewed'` and `payment_status: 'pending'`
- Duplicate detection runs and blocks if duplicate found
- Form fields become disabled (read-only)
- Submit button is hidden
- PaymentButton appears in amber info box

**Payment Flow:**
- PaymentButton is only visible when `payment_status === 'pending'`
- Clicking PaymentButton redirects to Stripe Checkout
- After successful payment, webhook updates database to `payment_status: 'paid'`
- User returns to review page with payment success indicator
- PaymentButton is hidden
- "Invia PEC" button is shown

**PEC Sending:**
- "Invia PEC" button is only clickable when `payment_status === 'paid'`
- Clicking button calls `send-pec-disdetta` edge function
- Success updates `status: 'sent'` in database
- User is redirected to `/dashboard?success=pec_sent`
- Toast shows "PEC inviata con successo!"

**Edge Cases:**
- If user refreshes page during any state, state is preserved (read from database)
- If user navigates away and returns, flow continues from correct state
- If payment fails, user can retry without re-entering data
- If duplicate is detected BEFORE payment, user cannot proceed to payment

### Testing Checklist

Execute these tests in sequence to verify the complete flow:

1. **Happy Path E2E:**
   - Upload bill → Review page
   - Confirm data → Payment UI appears
   - Complete payment (card 4242 4242 4242 4242)
   - Return to review page → "Invia PEC" button appears
   - Click "Invia PEC" → PEC sent
   - Redirect to dashboard with success message

2. **Duplicate Detection Before Payment:**
   - Upload bill with contract already in system
   - Confirm data → Duplicate modal appears
   - Verify payment button does NOT appear
   - User cannot proceed to payment

3. **Payment Failure:**
   - Confirm data → Payment UI appears
   - Use declined card (4000 0000 0000 0002)
   - Verify user returns to review page
   - Verify payment status is still 'pending'
   - Verify PaymentButton still available for retry

4. **State Persistence:**
   - Confirm data → Payment UI appears
   - Refresh page → Payment UI still visible
   - Complete payment → "Invia PEC" button appears
   - Refresh page → "Invia PEC" button still visible

5. **Form Locking:**
   - Confirm data → Verify all inputs are disabled
   - After payment → Verify inputs still disabled
   - User cannot modify data after confirmation

### Environment Setup

Ensure these environment variables are configured in `.env.local`:
```bash
# Stripe (already configured in Phase 1)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_CENTS=699

# Required for testing
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Ensure Stripe CLI is running for local webhook testing:
```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

### Success Metrics

Phase 2 is complete when:

- User cannot send PEC without paying
- All acceptance criteria pass
- All edge cases are handled gracefully
- No console errors during flow
- Build succeeds without TypeScript errors
- Email confirmation is sent after payment
- Database correctly tracks payment status through all states

---

## Notes

**Important:** The duplicate detection (C21) must run BEFORE payment is requested. Users should not be charged for duplicate disdette.

**UX Consideration:** After confirming data, users might leave the page before paying. When they return, the system should show the payment UI immediately without requiring data re-entry.

**Security:** The PEC edge function should verify payment status before sending. Even if the frontend is bypassed, the backend must enforce payment verification.