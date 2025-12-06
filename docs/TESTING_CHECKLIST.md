# C23 Day 4 - Testing Checklist

## Purpose
This checklist ensures all features, error handling, and user feedback improvements from Day 4 are thoroughly tested before production deployment.

---

## ✅ Phase 1: Error Handling Tests

### General Error Handling
- [ ] Verify user-friendly error messages appear (no technical jargon)
- [ ] Confirm error messages are in Italian
- [ ] Check that errors suggest next actions to user
- [ ] Test that errors don't expose sensitive data

### Form Submission Errors
- [ ] Test submission with expired session → redirects to login
- [ ] Test file upload failure → clear error message shown
- [ ] Test network disconnection during upload → appropriate error
- [ ] Test API failure during confirm-data → rollback, user notified
- [ ] Test PEC send failure → data saved, user can retry from dashboard
- [ ] Verify error toasts have 5-8 second duration for readability

### Edge Function Errors
- [ ] Test with missing disdetta_id → 400 error with code
- [ ] Test with invalid status → clear error message
- [ ] Test PDF generation failure → proper error response
- [ ] Test storage upload failure → retryable error indicated
- [ ] Verify all errors return structured ErrorResponse with code and retryable flag

---

## ✅ Phase 2: User Feedback Tests

### Progress Modal
- [ ] Verify progress modal appears when form is submitted
- [ ] Confirm progress bar animates from 0% to 100%
- [ ] Check step indicators (Upload, Salvataggio, Invio PEC) light up correctly
- [ ] Validate step transitions are smooth
- [ ] Verify modal shows current step message
- [ ] Test success state shows green checkmarks
- [ ] Confirm modal disappears on error
- [ ] Test modal backdrop prevents interaction during submission

### File Upload Progress
- [ ] Verify upload progress shows for files > 1MB
- [ ] Check progress percentage displays accurately
- [ ] Confirm success checkmark appears after upload
- [ ] Test that upload can be monitored in real-time

### Toast Messages
- [ ] Verify all toasts use specific, actionable messages
- [ ] Check toast durations are appropriate (3-8 seconds)
- [ ] Confirm success toasts are green/positive
- [ ] Verify error toasts are red/warning
- [ ] Test that multiple toasts don't overlap

---

## ✅ Phase 3: Logging Tests

### Structured Logging
- [ ] Verify logger outputs to console in development
- [ ] Check log levels (debug, info, warn, error) work correctly
- [ ] Confirm context objects are logged properly
- [ ] Test timing logs show duration in milliseconds
- [ ] Verify debug logs only appear in development mode

### Application Logging
- [ ] Check form submission events are logged
- [ ] Verify file upload operations are logged with context
- [ ] Confirm API errors are logged with full details
- [ ] Test that PEC send operations are logged
- [ ] Verify user actions are logged with user_id context

---

## ✅ Phase 4: Validation Tests

### Field Validation
- [ ] Test Codice Fiscale requires exactly 16 characters
- [ ] Verify CF format validation (6 letters, 2 digits, etc.)
- [ ] Test P.IVA requires exactly 11 digits
- [ ] Verify P.IVA only accepts numbers
- [ ] Check phone number validation accepts +39 prefix
- [ ] Test email validation (if implemented)
- [ ] Verify validation messages are clear and helpful

### Real-time Validation
- [ ] Test validation triggers on blur (not on every keystroke)
- [ ] Verify inline error messages appear below fields
- [ ] Check that error messages disappear when fixed
- [ ] Test that form submission is blocked if validation fails

### File Validation
- [ ] Test file size limit (5MB) is enforced
- [ ] Verify only PDF files are accepted
- [ ] Check that file name validation works
- [ ] Confirm clear error messages for invalid files
- [ ] Test multiple file uploads (B2B scenario)

---

## ✅ Phase 5: Dashboard Improvements Tests

### Status Display
- [ ] Verify PROCESSING shows blue spinner icon
- [ ] Check PENDING_REVIEW shows yellow clock icon
- [ ] Confirm CONFIRMED shows green checkmark
- [ ] Test SENT shows mail icon
- [ ] Verify FAILED/ERROR shows red alert icon
- [ ] Check status colors match design system

### Action Buttons
- [ ] Test "Rivedi e Invia" appears for PENDING_REVIEW
- [ ] Verify "Riprova Invio PEC" appears for CONFIRMED
- [ ] Confirm "Scarica PDF" appears for SENT status
- [ ] Test button actions work correctly
- [ ] Verify disabled states work properly

### Retry Functionality
- [ ] Test retry button re-sends PEC request
- [ ] Verify retry doesn't duplicate data
- [ ] Confirm retry success updates status
- [ ] Check retry failure shows appropriate error

---

## ✅ Phase 6: Edge Cases Tests

### Missing Data Handling
- [ ] Test navigating to /review without upload → redirect to /upload
- [ ] Verify missing disdetta_id → redirect to dashboard
- [ ] Test 404 on disdetta fetch → redirect with error message
- [ ] Check incomplete OCR data → redirect to upload

### Double Submission Prevention
- [ ] Test double-clicking submit button → only one submission
- [ ] Verify submit button is disabled during submission
- [ ] Confirm loading state prevents form interaction
- [ ] Test rapid clicks don't bypass prevention

### Session Expiry
- [ ] Test form submission with expired session → login redirect
- [ ] Verify session check happens before submission
- [ ] Confirm session expiry message is clear
- [ ] Test that data is NOT lost on session expiry (if possible)

### Browser Actions
- [ ] Test browser back button during submission → safe
- [ ] Verify page refresh during submission → safe (data may be saved)
- [ ] Check navigation away during upload → confirmation dialog
- [ ] Test closing browser tab during submission → graceful

---

## 🧪 B2C Flow (Complete End-to-End)

### Happy Path
- [ ] Upload bolletta PDF (< 5MB, valid PDF)
- [ ] Wait for OCR processing to complete
- [ ] Navigate to /review page
- [ ] Select "Privato" (B2C)
- [ ] Fill all required fields:
  - [ ] Nome
  - [ ] Cognome
  - [ ] Codice Fiscale (16 chars, valid format)
  - [ ] Indirizzo Residenza
  - [ ] Supplier Tax ID
  - [ ] Supplier Contract Number (optional)
- [ ] Check delega checkbox
- [ ] Click "Conferma e Invia PEC"
- [ ] Verify progress modal appears
- [ ] Confirm step 1: Validation (5-10%)
- [ ] Confirm step 2: Salvataggio (60-70%)
- [ ] Confirm step 3: Invio PEC (75-90%)
- [ ] Verify success state (100%)
- [ ] Check redirect to dashboard after 2 seconds
- [ ] Verify status is TEST_SENT or SENT
- [ ] Confirm PDF is generated in storage
- [ ] Check pdf_path is populated in database

### Error Scenarios
- [ ] Upload file > 5MB → error message
- [ ] Upload non-PDF file → error message
- [ ] Submit with invalid CF → validation error
- [ ] Submit without delega checkbox → error
- [ ] Disconnect internet before submit → connection error
- [ ] Expire session before submit → redirect to login

---

## 🧪 B2B Legal Representative Flow

### Happy Path
- [ ] Upload bolletta PDF
- [ ] OCR completes successfully
- [ ] Navigate to /review
- [ ] Select "Azienda" (B2B)
- [ ] Fill company fields:
  - [ ] Ragione Sociale
  - [ ] Partita IVA (11 digits, numbers only)
  - [ ] Sede Legale
  - [ ] Indirizzo Fornitura (optional)
  - [ ] Indirizzo Fatturazione (optional)
- [ ] Fill LR fields:
  - [ ] Nome Legale Rappresentante
  - [ ] Cognome Legale Rappresentante
  - [ ] Codice Fiscale LR (16 chars)
- [ ] Select "Legale Rappresentante" role
- [ ] Upload Visura Camerale (PDF, < 5MB)
- [ ] Upload Documento Identità LR (PDF, < 5MB)
- [ ] Check delega checkbox
- [ ] Submit form
- [ ] Verify upload progress shows for each file
- [ ] Confirm progress modal shows file uploads
- [ ] Verify PDF generated with B2B template
- [ ] Check Visura attached to PEC
- [ ] Verify status updated correctly
- [ ] Confirm redirect to dashboard

### Error Scenarios
- [ ] Submit without Visura → error
- [ ] Submit without Documento LR → error
- [ ] Upload Visura > 5MB → error
- [ ] Invalid P.IVA format → validation error
- [ ] Invalid LR Codice Fiscale → validation error

---

## 🧪 B2B Delegato Flow

### Happy Path
- [ ] Follow B2B LR flow until richiedente_ruolo
- [ ] Select "Delegato" instead of LR
- [ ] Verify Delega Firmata field appears
- [ ] Upload Delega Firmata PDF
- [ ] Complete remaining fields
- [ ] Submit form
- [ ] Verify all 3 files uploaded (Visura, Documento LR, Delega)
- [ ] Confirm progress modal shows all uploads
- [ ] Verify PDF lists Delega in attachments
- [ ] Check Delega attached to PEC email
- [ ] Confirm status updated

### Error Scenarios
- [ ] Select Delegato but don't upload Delega → error
- [ ] Upload invalid Delega file → error

---

## 🔍 Performance Tests

### Load Times
- [ ] Review page loads in < 2 seconds
- [ ] Form submission completes in < 10 seconds (happy path)
- [ ] File upload shows progress within 500ms
- [ ] Progress modal animations are smooth (60fps)

### Resource Usage
- [ ] No memory leaks during multiple submissions
- [ ] Browser doesn't freeze during submission
- [ ] Network requests are optimized (no duplicate calls)

---

## 📱 Responsive Design Tests

### Mobile
- [ ] Progress modal fits mobile screens
- [ ] Toast messages don't overflow
- [ ] Form is usable on mobile
- [ ] File uploads work on mobile browsers

### Tablet
- [ ] Layout adapts correctly
- [ ] Touch interactions work properly
- [ ] Progress modal displays well

---

## 🌐 Browser Compatibility Tests

Test on:
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Safari (iOS)
- [ ] Mobile Chrome (Android)

---

## 🚨 Critical Scenarios (Must Pass Before Production)

1. **Data Integrity**
   - [ ] No data loss during submission errors
   - [ ] receiver_tax_id mapping is correct (B2C: CF, B2B: LR CF)
   - [ ] File uploads don't overwrite existing files
   - [ ] Database updates are atomic

2. **Security**
   - [ ] RLS policies enforced
   - [ ] Session validation works
   - [ ] No sensitive data in error messages
   - [ ] File uploads respect user_id paths

3. **User Experience**
   - [ ] Users always know what's happening (loading states)
   - [ ] Errors are actionable
   - [ ] Progress is visible for long operations
   - [ ] Success states are clear

---

## 📝 Testing Notes

### Test Data
- Use test Codice Fiscale: `RSSMRA80A01H501X`
- Use test P.IVA: `12345678901`
- Use test PDFs from `tests/fixtures/`

### Environment
- Test in development first
- Then test in staging
- Finally, smoke test in production

### Reporting Issues
- Document steps to reproduce
- Include screenshots/videos
- Note browser and OS
- Check console for errors
- Include network tab if applicable

---

## ✅ Sign-off

- [ ] All critical tests passed
- [ ] No blocking bugs found
- [ ] Performance is acceptable
- [ ] UX feedback is positive
- [ ] Security review complete
- [ ] Ready for production deployment

**Tested by:** ________________
**Date:** ________________
**Sign-off:** ________________

---

**Total Tests:** ~150+
**Estimated Time:** 3-4 hours for complete manual testing
**Priority:** HIGH - Required before production launch
