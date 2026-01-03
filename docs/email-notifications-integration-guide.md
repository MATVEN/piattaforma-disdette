# C31 Email Notifications - Integration Guide

## ✅ Implementation Complete

All email notification infrastructure has been successfully implemented:

- ✅ Resend package installed
- ✅ Email service created with 3 professional templates
- ✅ API endpoint `/api/send-notification-email` created
- ✅ Trigger utility `triggerEmailNotification()` created
- ✅ Environment variables documented
- ✅ Build successful

---

## 📋 What Was Built

### 1. Email Service (`src/lib/email/emailService.ts`)
- Lazy-loading Resend client (prevents build-time errors)
- Three professional HTML email templates:
  - **Ready for Review** - Sent when OCR completes (PENDING_REVIEW)
  - **PEC Sent** - Sent when PEC successfully sent (SENT/TEST_SENT)
  - **Processing Error** - Sent when OCR fails (FAILED)
- All templates are mobile-responsive with gradient headers and clear CTAs

### 2. API Endpoint (`src/app/api/send-notification-email/route.ts`)
- Accepts: `{ disdettaId: number, type: 'ready' | 'sent' | 'error' }`
- Fetches disdetta data and user profile
- Gets user email via Supabase Auth
- Generates appropriate email template
- Sends email via Resend
- Returns success/failure status

### 3. Trigger Utility (`src/lib/email/triggerNotification.ts`)
- Helper function: `triggerEmailNotification(disdettaId, type)`
- Can be called from Edge Functions, API routes, or server components
- Handles all HTTP communication with the API endpoint

### 4. Environment Variables
Updated `.env.local` and created `.env.example` with:
```bash
RESEND_API_KEY=           # Get from resend.com dashboard
NEXT_PUBLIC_BASE_URL=     # Set to http://localhost:3000 (dev) or production domain
```

---

## 🔌 Integration Points (TO BE ADDED)

The following integration points need to be manually added to trigger email notifications:

### Integration Point 1: OCR Success → PENDING_REVIEW

**File:** `supabase/functions/process-document/index.ts`

**Location:** After successfully updating status to PENDING_REVIEW

**Code to add:**
```typescript
import { triggerEmailNotification } from '@/lib/email/triggerNotification'

// After setting status to PENDING_REVIEW
await triggerEmailNotification(disdettaId, 'ready')
```

**Why:** Users need to know when their document is ready for review

---

### Integration Point 2: PEC Sent Successfully → SENT/TEST_SENT

**File:** `supabase/functions/send-pec-disdetta/index.ts` OR relevant API route

**Location:** After successfully sending PEC and updating status to SENT/TEST_SENT

**Code to add:**
```typescript
import { triggerEmailNotification } from '@/lib/email/triggerNotification'

// After PEC sent successfully
await triggerEmailNotification(disdettaId, 'sent')
```

**Why:** Users need confirmation that their cancellation was officially sent

---

### Integration Point 3: Processing Failure → FAILED

**File:** `supabase/functions/process-document/index.ts`

**Location:** In error handling, after setting status to FAILED

**Code to add:**
```typescript
import { triggerEmailNotification } from '@/lib/email/triggerNotification'

// After setting status to FAILED
await triggerEmailNotification(disdettaId, 'error')
```

**Why:** Users need to know when processing fails so they can retry

---

## 📝 Finding Integration Points

### Step 1: Find OCR Success Location
Search for where status is set to `PENDING_REVIEW`:
```bash
grep -r "PENDING_REVIEW" supabase/functions/
```

Look for code like:
```typescript
await supabase
  .from('extracted_data')
  .update({ status: 'PENDING_REVIEW' })
```

Add the trigger call immediately after this.

---

### Step 2: Find PEC Success Location
Search for where status is set to `SENT` or `TEST_SENT`:
```bash
grep -r "TEST_SENT\|SENT" supabase/functions/
```

Look for code like:
```typescript
await supabase
  .from('extracted_data')
  .update({ status: 'TEST_SENT' })
```

Add the trigger call immediately after this.

---

### Step 3: Find Error Handling Location
Search for where status is set to `FAILED`:
```bash
grep -r "FAILED" supabase/functions/
```

Look for code in catch blocks like:
```typescript
await supabase
  .from('extracted_data')
  .update({ status: 'FAILED', error_message: ... })
```

Add the trigger call immediately after this.

---

## 🧪 Testing After Integration

### 1. Get Resend API Key
1. Go to https://resend.com
2. Sign up / Log in
3. Create an API key in the dashboard
4. Add to `.env.local`: `RESEND_API_KEY=re_your_key_here`

### 2. Test "Ready" Email
1. Upload a bill via the app
2. Wait for OCR to complete
3. Check email inbox
4. Verify:
   - Email received with "Disdetta Pronta!" subject
   - Click "Rivedi e Invia Disdetta" → goes to `/review?id=X`
   - Email looks good on desktop and mobile

### 3. Test "Sent" Email
1. Complete a disdetta (or manually trigger)
2. Check email inbox
3. Verify:
   - Email received with "PEC Inviata!" subject
   - Click "Vai alla Dashboard" → goes to `/dashboard`
   - Success message displays correctly

### 4. Test "Error" Email
1. Upload an invalid file OR trigger error manually
2. Check email inbox
3. Verify:
   - Email received with "Problema Rilevato" subject
   - Error message displays
   - Click "Ricarica Bolletta" → goes to `/new-disdetta`
   - Click "Contatta Supporto" → opens email client

---

## 🔧 Manual Testing via API

You can test the email system directly via the API endpoint:

```bash
curl -X POST http://localhost:3000/api/send-notification-email \
  -H "Content-Type: application/json" \
  -d '{
    "disdettaId": 1,
    "type": "ready"
  }'
```

Change `type` to `"sent"` or `"error"` to test other templates.

---

## 🚨 Important Notes

### Edge Function Compatibility
The `triggerEmailNotification` utility uses `fetch()` which works in:
- ✅ Supabase Edge Functions (Deno runtime supports fetch)
- ✅ Next.js API routes
- ✅ Server components
- ❌ Client components (but they shouldn't trigger emails directly anyway)

### Error Handling
All email triggers are fire-and-forget. If an email fails to send:
- It logs the error to console
- It doesn't block the main flow
- User still gets updated status in database

This is intentional - email failures should not break core functionality.

### Production Configuration
Before going to production:

1. **Update Resend "from" address:**
   - In `src/lib/email/emailService.ts`
   - Change: `'DisdEasy <onboarding@resend.dev>'`
   - To: `'DisdEasy <noreply@yourdomain.com>'`
   - Requires domain verification in Resend dashboard

2. **Update base URL:**
   - In `.env.local` (production):
   - Change: `NEXT_PUBLIC_BASE_URL=http://localhost:3000`
   - To: `NEXT_PUBLIC_BASE_URL=https://DisdEasy.it`

3. **Update footer links:**
   - Email templates have hardcoded `https://DisdEasy.it` links
   - Update if your domain is different

---

## 📊 Expected User Flow After Integration

### Scenario 1: Successful Disdetta
1. User uploads bill → Status: PROCESSING
2. OCR completes → Status: PENDING_REVIEW
   - **📧 Email 1: "Disdetta Pronta!"**
3. User reviews and confirms
4. PEC sent → Status: SENT
   - **📧 Email 2: "PEC Inviata!"**

### Scenario 2: Failed Processing
1. User uploads bill → Status: PROCESSING
2. OCR fails → Status: FAILED
   - **📧 Email 3: "Problema Rilevato"**
3. User uploads new bill → Back to Scenario 1

---

## ✅ Success Criteria

After integration is complete, verify:

- [ ] Users receive email when OCR completes
- [ ] Users receive email when PEC is sent
- [ ] Users receive email when processing fails
- [ ] Email links work correctly (review, dashboard, upload)
- [ ] Emails display well on desktop email clients
- [ ] Emails display well on mobile email apps
- [ ] No build errors or TypeScript errors
- [ ] Email sending errors don't break main flow

---

## 🆘 Troubleshooting

### "Missing API key" error
- Check `.env.local` has `RESEND_API_KEY=re_...`
- Restart dev server after adding key

### Email not received
- Check Resend dashboard logs
- Check spam folder
- Verify email address is correct in Supabase auth
- Check console logs for errors

### "User email not found"
- Verify user has email in Supabase auth.users table
- Check RLS policies allow reading user data

### Links in email don't work
- Verify `NEXT_PUBLIC_BASE_URL` is set correctly
- Check that URLs match your routing structure

---

## 📁 Files Created/Modified

**New Files:**
- `src/lib/email/emailService.ts` - Email service and templates
- `src/lib/email/triggerNotification.ts` - Trigger utility
- `src/app/api/send-notification-email/route.ts` - API endpoint
- `.env.example` - Environment variable documentation
- `c31-email-notifications-integration-guide.md` - This file

**Modified Files:**
- `.env.local` - Added RESEND_API_KEY and NEXT_PUBLIC_BASE_URL
- `package.json` - Added resend dependency

---

## 🎯 Next Steps

1. **Review this integration guide**
2. **Get Resend API key** from https://resend.com
3. **Add API key** to `.env.local`
4. **Find integration points** in Edge Functions (use grep commands above)
5. **Add trigger calls** at the 3 integration points
6. **Test thoroughly** using the testing section above
7. **Monitor** Resend dashboard for email delivery metrics

---

**Questions or issues?** Check Resend docs at https://resend.com/docs