# Stripe Payment Integration - Setup Guide

## Overview

This guide will help you set up Stripe payment integration for the DisdEasy platform. The integration includes:

- ✅ Stripe Checkout for secure payment processing
- ✅ Webhook handler for payment confirmation
- ✅ Email confirmation via Resend
- ✅ Idempotency protection against duplicate charges
- ✅ Comprehensive payment tracking in database
- ✅ User-friendly error handling

## Prerequisites

### 1. Stripe Account

1. Create a Stripe account at https://dashboard.stripe.com/register
2. Complete business verification (you can start in test mode immediately)
3. Go to **Dashboard → Developers → API Keys**
4. Copy your **Publishable key** and **Secret key**

### 2. Resend Account (Email Service)

1. Create account at https://resend.com
2. Get your API key from the dashboard
3. For testing: use `onboarding@resend.dev`
4. For production: verify your domain

## Environment Variables Setup

Add these variables to your `.env.local` file:

```bash
# Stripe Configuration
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...  # From Stripe Dashboard
STRIPE_SECRET_KEY=sk_test_...                   # From Stripe Dashboard
STRIPE_WEBHOOK_SECRET=whsec_...                 # Get this after webhook setup (see below)
STRIPE_PRICE_CENTS=699                          # Price in cents (6.99€)

# Resend Email
RESEND_API_KEY=re_...                           # From Resend Dashboard
RESEND_FROM_EMAIL=onboarding@resend.dev         # Or your verified domain

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000       # Change in production
```

## Database Migration

Run the SQL migration to add payment tracking columns:

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Run the migration file: `supabase/migrations/20260108000000_add_payment_tracking.sql`

This adds the following columns to the `disdette` table:
- `payment_status` (pending, paid, failed, refunded)
- `payment_amount` (in cents)
- `payment_currency` (eur)
- `payment_date` (timestamp)
- `payment_method` (card, apple_pay, google_pay)
- `stripe_session_id` (for idempotency)
- `stripe_payment_intent` (Stripe reference)

## Webhook Setup

### Local Development (Stripe CLI)

1. **Install Stripe CLI:**
   ```bash
   # macOS
   brew install stripe/stripe-cli/stripe

   # Windows
   scoop bucket add stripe https://github.com/stripe/scoop-stripe-cli.git
   scoop install stripe

   # Or download from: https://stripe.com/docs/stripe-cli
   ```

2. **Login to Stripe:**
   ```bash
   stripe login
   ```

3. **Forward webhooks to local server:**
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```

4. **Copy the webhook signing secret** (starts with `whsec_...`) and add to `.env.local`:
   ```bash
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```

5. **Keep the Stripe CLI running** while testing locally

### Production Deployment

1. Go to https://dashboard.stripe.com/webhooks
2. Click **"Add endpoint"**
3. Set URL: `https://yourdomain.com/api/stripe/webhook`
4. Select events to listen for:
   - `checkout.session.completed`
5. Copy the **Signing secret** and add to your production environment variables
6. Save the endpoint

## Testing the Integration

### Test Cards

Use these test cards in Stripe Checkout:

| Card Number          | Scenario              | Description                    |
|---------------------|-----------------------|--------------------------------|
| 4242 4242 4242 4242 | ✅ Success            | Payment succeeds              |
| 4000 0000 0000 0002 | ❌ Decline            | Generic card decline          |
| 4000 0027 6000 3184 | 🔒 3D Secure          | Requires authentication       |
| 4000 0000 0000 9995 | 💳 Insufficient Funds | Insufficient funds error      |
| 4000 0000 0000 0069 | 📅 Expired Card       | Expired card error            |

**For all test cards:**
- Use any future expiry date (e.g., 12/34)
- Use any 3-digit CVC (e.g., 123)
- Use any 5-digit ZIP code (e.g., 12345)

### Happy Path Test Flow

1. **Create a disdetta:**
   - Navigate to `/new-disdetta`
   - Complete the category → operator → service flow
   - Upload a test document

2. **Review and confirm data:**
   - Wait for OCR processing (PENDING_REVIEW status)
   - Navigate to `/review?id=X`
   - Confirm the extracted data

3. **Make payment:**
   - You should see the payment button (6,99€)
   - Click to redirect to Stripe Checkout
   - Use test card `4242 4242 4242 4242`
   - Complete payment

4. **Verify success:**
   - Redirected to dashboard with success message
   - Check email for payment confirmation
   - Verify disdetta status changed to `CONFIRMED`
   - Verify `payment_status = 'paid'` in database

5. **Check webhook:**
   - In Stripe CLI, you should see:
     ```
     ✅ Payment confirmed for disdetta X
     Confirmation email sent to user@example.com
     ```

### Idempotency Test

1. Open developer tools → Network tab
2. Click payment button
3. **Quickly click it again** before redirect
4. Verify both requests return the **same session ID**
5. Only one Stripe session created (no duplicate charge)

### Error Handling Tests

1. **Declined Card Test:**
   - Use card `4000 0000 0000 0002`
   - Verify user-friendly error message appears
   - No charge created in Stripe

2. **Cancelled Payment Test:**
   - Click payment button
   - On Stripe Checkout page, click "Back" or close tab
   - Return to dashboard
   - Verify cancellation message appears

3. **Already Paid Test:**
   - Complete a payment successfully
   - Try to click payment button again
   - Verify error: "Disdetta already processed"

## Monitoring & Debugging

### Stripe Dashboard

- **Payments:** https://dashboard.stripe.com/test/payments
  - View all payment attempts
  - See success/failure reasons
  - Refund payments if needed

- **Webhooks:** https://dashboard.stripe.com/test/webhooks
  - Check delivery success rate
  - View webhook request/response logs
  - Retry failed webhooks

- **Logs:** https://dashboard.stripe.com/test/logs
  - See all API requests
  - Debug integration issues

### Resend Dashboard

- **Logs:** https://resend.com/emails
  - View sent emails
  - Check delivery status
  - See open/click rates

### Application Logs

Check these in your Next.js console:

```bash
# Successful payment
✅ Payment confirmed for disdetta X
Confirmation email sent to user@example.com

# Idempotency check
Reusing existing checkout session: cs_test_...

# Webhook signature verification
Webhook signature verification failed: ...
```

### Common Issues

**Issue: Webhook signature verification failed**
- **Cause:** Wrong `STRIPE_WEBHOOK_SECRET`
- **Fix:** Restart Stripe CLI and copy new secret

**Issue: Email not sent**
- **Cause:** Missing or wrong `RESEND_API_KEY`
- **Fix:** Check Resend dashboard for valid API key

**Issue: Payment button doesn't appear**
- **Cause:** Status is not PENDING_REVIEW
- **Fix:** Check disdetta status in database

**Issue: Database update failed after payment**
- **Cause:** Migration not run
- **Fix:** Run the SQL migration in Supabase

## Production Checklist

Before going live, ensure:

### Stripe

- [ ] Switch from test mode to live mode in Stripe Dashboard
- [ ] Update `.env` with **live** keys (pk_live_..., sk_live_...)
- [ ] Set up production webhook endpoint
- [ ] Update `STRIPE_WEBHOOK_SECRET` with production value
- [ ] Test with real card (small amount first)
- [ ] Enable Stripe Radar (fraud detection)

### Resend

- [ ] Verify your domain in Resend
- [ ] Update `RESEND_FROM_EMAIL` to your domain
- [ ] Set up SPF and DKIM records
- [ ] Test email delivery to various providers (Gmail, Outlook, etc.)

### Application

- [ ] Set `NEXT_PUBLIC_APP_URL` to production domain
- [ ] Run database migration in production Supabase
- [ ] Test complete payment flow in production
- [ ] Monitor webhook delivery in Stripe Dashboard
- [ ] Set up error monitoring (Sentry, LogRocket, etc.)

### Security

- [ ] Never commit `.env.local` to git
- [ ] Use environment variables in production (Vercel, etc.)
- [ ] Enable HTTPS (required for webhooks)
- [ ] Keep Stripe secret key secure
- [ ] Rotate keys if compromised

## Support

- **Stripe Documentation:** https://stripe.com/docs
- **Resend Documentation:** https://resend.com/docs
- **Stripe Test Cards:** https://stripe.com/docs/testing

## Next Steps

After successful setup:

1. ✅ Integration complete and tested
2. 🚀 Ready for production deployment
3. 📊 Monitor payment success rate
4. 📧 Track email delivery rate
5. 💰 Process payments securely

For issues or questions, check the Stripe Dashboard logs first, then review webhook delivery history.
