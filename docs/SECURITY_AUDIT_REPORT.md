# Security Audit Report — Piattaforma Disdette
**Date:** 2026-03-20
**Auditor:** Claude Code (Automated Analysis)
**Scope:** Full codebase — API routes, Edge Functions, Middleware, Frontend pages, Config

---

## Executive Summary

| Severity | Count |
|----------|-------|
| CRITICAL | 1 |
| HIGH | 3 |
| MEDIUM | 7 |
| LOW | 6 |
| **Total** | **17** |

The application has a strong security foundation: Supabase RLS enforces data isolation, Stripe webhooks use cryptographic signature verification, file upload routes include MIME and bucket whitelists, and the Contact API implements proper rate limiting. The main concerns are a broken account deletion flow (which could leave orphaned auth users), missing rate limiting on several high-risk endpoints, a middleware bypass for `/new-disdetta`, and minor PII leakage through console logs.

---

## 1. Authentication & Session Management

### [CRITICAL] C1 — `auth.admin.deleteUser()` called on user-level Supabase client

**File:** `src/app/api/delete-account/route.ts:93`
**Severity:** CRITICAL

**Vulnerable code:**
```typescript
// Line 6: creates user-level client (uses ANON_KEY)
const supabase = await createServerClient()

// Line 93: calls ADMIN method on user-level client — WILL FAIL
const { error: deleteUserError } = await supabase.auth.admin.deleteUser(
  user.id
)
```

**Problem:** `supabase.auth.admin.*` methods require the `SERVICE_ROLE_KEY`. `createServerClient()` uses the `ANON_KEY`. This call will throw or return a 403 in production. The fallback at line 101 (`supabase.rpc('delete_user')`) may succeed if a custom SQL function exists, but this is fragile and undocumented. The net effect is:
- Auth user may **not** be deleted from `auth.users` table
- Database records (disdette, profiles) ARE deleted (lines 80–88)
- Orphaned auth user remains, allowing re-login to an empty account

**Fix:** Create the service role client specifically for the admin deletion:
```typescript
import { createServiceRoleClient } from '@/lib/supabase/server'

// After all DB cleanup:
const supabaseAdmin = createServiceRoleClient()
const { error: deleteUserError } = await supabaseAdmin.auth.admin.deleteUser(user.id)
if (deleteUserError) {
  // Log and return 500; do NOT silently continue
  return NextResponse.json({ error: 'Errore eliminazione account' }, { status: 500 })
}
```

---

### [HIGH] C2 — `getSession()` used instead of `getUser()` for auth validation

**File:** `src/app/api/send-pec/route.ts:63`
**Severity:** HIGH

**Vulnerable code:**
```typescript
const { data: { session } } = await supabase.auth.getSession()
if (!session) {
  throw new UnauthorizedError("Sessione non valida")
}
// Uses session.access_token to call Edge Function
```

**Problem:** `getSession()` reads the session from the cookie without re-validating it against the Supabase Auth server. A tampered or expired JWT in the cookie will be trusted as-is. The Supabase documentation explicitly warns: _"On the server, always use `getUser()` to validate the session."_ The token forwarded to the Edge Function would inherit this unvalidated session.

The route does call `AuthService.getCurrentUser(supabase)` at line 36, which presumably calls `getUser()`. However, the `session.access_token` retrieved at line 63 is from the unvalidated `getSession()` and could be stale or tampered.

**Fix:** Retrieve the access token from the already-validated user session:
```typescript
// getUser() validates server-side; use its token
const { data: { session }, error: sessionError } = await supabase.auth.getSession()
// Validate the session matches the already-verified user from AuthService
```
Or better: store the `user` returned by `AuthService.getCurrentUser()` and retrieve the session only via `supabase.auth.getSession()` but explicitly validate that `session.user.id === user.id`.

---

### [MEDIUM] C3 — `/new-disdetta` bypassed from server-side middleware protection

**File:** `src/middleware.ts:8-11`
**Severity:** MEDIUM

**Vulnerable code:**
```typescript
// ✅ Skip middleware per new-disdetta - ha già protezione client-side
if (pathname.startsWith('/new-disdetta')) {
  console.log('⏩ Skipping middleware for /new-disdetta (client-side protection)')
  return NextResponse.next()
}
```

**Problem:** Client-side auth protection can be bypassed with JavaScript disabled, direct fetch requests, or by manipulating React state. Any unauthenticated user can access the `/new-disdetta` page server-side rendered content without being redirected. While the API routes they call ARE protected, the UX page itself loads unprotected, exposing the wizard UI and any server-side data fetching on that page.

**Fix:** Remove the explicit bypass and add `/new-disdetta` to `protectedRoutes`:
```typescript
const protectedRoutes = ['/dashboard', '/profileUser', '/new-disdetta', '/upload', '/review']
```

---

## 2. IDOR (Insecure Direct Object Reference)

### [LOW] C4 — Webhook fetches `existingDisdetta` but never validates `checkError`

**File:** `src/app/api/stripe/webhook/route.ts:79-85`
**Severity:** LOW

**Vulnerable code:**
```typescript
const { data: existingDisdetta, error: checkError } = await supabase
  .from('disdette')
  .select('id, user_id, status')
  .eq('id', parseInt(disdettaId, 10))
  .single()

// Update disdetta — proceeds regardless of checkError
const { data: updatedDisdetta, error: updateError } = await supabase
  .from('disdette')
  .update({ ... })
  .eq('id', parseInt(disdettaId, 10))
  .eq('user_id', userId) // ← This protects against IDOR
```

**Problem:** `checkError` is declared but never read. If the fetch fails (DB error, record not found), execution falls through to the update. However, the update has `.eq('user_id', userId)` which provides IDOR protection. The unused variable is technical debt that could mask a silent failure.

**Fix:** Validate `checkError` and `existingDisdetta` before proceeding:
```typescript
if (checkError || !existingDisdetta) {
  console.error('Disdetta not found or DB error:', checkError)
  return NextResponse.json({ error: 'Disdetta not found' }, { status: 404 })
}
// Optional: validate existingDisdetta.user_id === userId for defense-in-depth
```

---

## 3. Input Validation

### [MEDIUM] C5 — `disdettaId` from Stripe metadata trusted without integer validation

**File:** `src/app/api/stripe/webhook/route.ts:41-48`
**Severity:** MEDIUM

**Vulnerable code:**
```typescript
const disdettaId = session.metadata?.disdettaId  // string from Stripe metadata
// ...
.eq('id', parseInt(disdettaId, 10))  // parsed but no NaN check
```

**Problem:** Stripe metadata is set by the application at checkout creation, but `parseInt('abc', 10)` returns `NaN`. Supabase will throw on `eq('id', NaN)`. While this is handled by the outer try/catch, it returns a 500 instead of 400, and the webhook would be retried by Stripe unnecessarily.

**Fix:**
```typescript
const disdettaIdNum = parseInt(disdettaId, 10)
if (isNaN(disdettaIdNum)) {
  console.error('Invalid disdettaId in metadata:', disdettaId)
  return NextResponse.json({ error: 'Invalid disdettaId' }, { status: 400 })
}
```

---

### [LOW] C6 — `type: any` annotation in Stripe checkout error handler

**File:** `src/app/api/stripe/create-checkout/route.ts:108`
**Severity:** LOW

**Vulnerable code:**
```typescript
} catch (error: any) {
  console.error('Stripe checkout error:', error)
```

**Problem:** Using `error: any` disables TypeScript type checking on the error object, which can mask issues where non-Error objects are thrown. The `error` object is also logged in full to the console, which could include Stripe API response details containing sensitive metadata.

**Fix:** Use `unknown` and narrow:
```typescript
} catch (error: unknown) {
  const message = error instanceof Error ? error.message : 'Unknown error'
  console.error('Stripe checkout error:', message)
```

---

## 4. Rate Limiting

### [HIGH] C7 — No rate limiting on account deletion (enables brute force password verification)

**File:** `src/app/api/delete-account/route.ts:29-38`
**Severity:** HIGH

**Vulnerable code:**
```typescript
// No rate limiting before this block
const { error: signInError } = await supabase.auth.signInWithPassword({
  email: user.email!,
  password: password,
})

if (signInError) {
  return NextResponse.json({ error: 'Password errata' }, { status: 401 })
}
```

**Problem:** An authenticated attacker (who has obtained a valid session token for a victim's account) can brute-force the victim's password via this endpoint with no rate limiting. Each request makes a live auth call confirming password correctness/incorrectness.

**Fix:** Add rate limiting (same pattern as `contact/route.ts`):
```typescript
const ip = getClientIp(request)
const { allowed } = checkRateLimit(ip)  // max 5 attempts per 15 minutes
if (!allowed) {
  return NextResponse.json({ error: 'Troppi tentativi' }, { status: 429 })
}
```

---

### [HIGH] C8 — No rate limiting on PEC send endpoint

**File:** `src/app/api/send-pec/route.ts`
**Severity:** HIGH

**Problem:** No rate limiting exists on the PEC send endpoint. An authenticated user could spam this endpoint to:
1. Trigger repeated calls to the Edge Function (cost amplification)
2. Repeatedly attempt to send PECs (operational/financial impact when live PEC provider is activated)
3. Potentially exhaust Edge Function invocation quota

**Fix:** Add per-user rate limiting (by user ID, not just IP):
```typescript
const rateLimitKey = `send-pec:${user.id}`
const { allowed } = checkRateLimit(rateLimitKey)  // max 3 sends per hour per user
```

---

### [MEDIUM] C9 — No rate limiting on confirm-data endpoint

**File:** `src/app/api/confirm-data/route.ts`
**Severity:** MEDIUM

**Problem:** The confirm-data endpoint performs fuzzy matching (CPU-intensive via fuzzball library) and multiple database queries per request. No rate limiting means a user could flood this endpoint causing CPU/DB pressure.

**Fix:** Add per-user rate limiting:
```typescript
const rateLimitKey = `confirm-data:${user.id}`
// max 20 requests per minute
```

---

## 5. Sensitive Data Exposure

### [MEDIUM] C10 — User email addresses logged to server console

**Files:**
- `src/app/api/stripe/webhook/route.ts:143`
- `src/app/api/send-notification-email/route.ts:135`

**Severity:** MEDIUM

**Vulnerable code:**
```typescript
// webhook/route.ts:143
console.log(`Confirmation email sent to ${userEmail}`)

// send-notification-email/route.ts:135
console.log(`[EMAIL] ✅ ${type} → ${userEmail}`)
```

**Problem:** User email addresses (PII under GDPR) are written to server logs in plain text. In cloud environments (Vercel, etc.), logs are stored and searchable by team members and logged retention systems. This is a GDPR compliance concern.

**Fix:** Replace with anonymized identifiers:
```typescript
// Use only first character + domain, or user ID
console.log(`[EMAIL] ✅ ${type} → user:${disdetta.user_id.slice(0, 8)}`)
```

---

### [LOW] C11 — Verbose debug logging of business data in confirm-data

**File:** `src/app/api/confirm-data/route.ts:47-85`
**Severity:** LOW

**Vulnerable code:**
```typescript
console.log('[CONFIRM] Operator check params:', {
  bypassOperatorCheck: body.bypassOperatorCheck,
  hasId: !!body.id,
  id: body.id
})
// ...
console.log('[CONFIRM] Disdetta fetch result:', {
  hasDisdetta: !!disdetta,
  hasError: !!fetchError,
  error: fetchError?.message,
  disdetta  // ← logs full disdetta object including supplier names
})
```

**Problem:** Business-sensitive data (supplier names, operator names, disdetta IDs) are logged verbosely. The `disdetta` object dump at line 66 logs all fetched fields to server logs. In production, this creates audit trails containing PII/business data.

**Fix:** Remove or replace with minimal identifiers:
```typescript
console.log('[CONFIRM] Processing disdetta:', { id: body.id })
// Remove the full object dumps
```

---

## 6. Cross-Site Scripting (XSS)

### [MEDIUM] C12 — `unsafe-inline` in Content Security Policy for scripts

**File:** `next.config.js:12`
**Severity:** MEDIUM

**Vulnerable code:**
```javascript
script-src 'self' 'unsafe-inline' ${isDev ? "'unsafe-eval'" : ''} https://js.stripe.com;
```

**Problem:** `'unsafe-inline'` is present in `script-src` in BOTH development AND production. This allows execution of any inline `<script>` tag, which is a primary XSS attack vector. If any page renders user-controlled content into the DOM without proper escaping, an attacker could inject malicious scripts.

Note: React's JSX escapes strings by default, reducing the risk. However, `dangerouslySetInnerHTML` usage anywhere in the codebase would bypass this protection.

**Fix:** Replace `unsafe-inline` with a nonce-based approach (supported by Next.js):
```javascript
// next.config.js — use nonce
script-src 'self' 'nonce-{nonce}' https://js.stripe.com;
```
Or at minimum, document why `unsafe-inline` is required (e.g., if Stripe.js requires it).

---

## 7. Error Handling & Information Disclosure

### [LOW] C13 — Internal error details inconsistently exposed

**File:** `src/app/api/stripe/webhook/route.ts:104-107`
**Severity:** LOW

**Vulnerable code:**
```typescript
if (updateError || !updatedDisdetta) {
  console.error('Failed to update disdetta:', updateError)
  return NextResponse.json({ error: 'Database update failed' }, { status: 500 })
}
```

**Assessment:** This is actually handled correctly (generic error message, detailed error in console). However, note that `updateError` is logged in full including potential Supabase error metadata. Keep logs stripped of connection strings or query details if they appear.

---

## 8. File Upload Security

### [LOW] C14 — No maximum file size validation on server side for document upload

**File:** `src/app/api/validate-document/route.ts` (and related upload routes)
**Severity:** LOW

**Assessment:** The `next.config.js` sets `serverActions.bodySizeLimit: '2mb'` which applies to Server Actions only, not API routes. API route file upload size limits should be explicitly validated server-side. However, Supabase Storage has its own size limits configured at the bucket level, which mitigates this.

**Recommendation:** Add explicit file size check in upload validation routes:
```typescript
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
if (file.size > MAX_FILE_SIZE) {
  return NextResponse.json({ error: 'File troppo grande' }, { status: 400 })
}
```

---

## 9. Environment Variables & Configuration

### [MEDIUM] C15 — Non-null assertion (`!`) on environment variables without runtime guard

**Files:**
- `src/app/api/stripe/webhook/route.ts:51-52`
- `src/middleware.ts:17-18`

**Severity:** MEDIUM

**Vulnerable code:**
```typescript
// webhook/route.ts - has explicit guard ✅
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
if (!supabaseUrl || !supabaseServiceKey) {  // ← Good, validated after
  return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
}

// middleware.ts - uses ! without guard ❌
const supabase = createServerClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,   // ← No null check
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
```

**Problem:** In middleware, if `NEXT_PUBLIC_SUPABASE_URL` or `NEXT_PUBLIC_SUPABASE_ANON_KEY` are missing, the `!` assertion suppresses TypeScript's warning, leading to a runtime crash (`createServerClient` called with `undefined`). This would cause ALL requests to fail with an unhandled exception, potentially taking down the application.

**Fix:** Add startup validation or guard in middleware:
```typescript
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
if (!supabaseUrl || !supabaseAnonKey) {
  return NextResponse.next() // Fail open, or log and redirect to error page
}
```

---

### [LOW] C16 — `reactStrictMode: false` disabled in production config

**File:** `next.config.js:59`
**Severity:** LOW

**Vulnerable code:**
```javascript
reactStrictMode: false,
```

**Problem:** React Strict Mode catches unsafe lifecycle methods, unexpected side effects, and deprecated API usage in development. Disabling it in the production config removes these runtime checks. This is not directly a security vulnerability but reduces the defensive depth of the application.

**Recommendation:** Enable if possible: `reactStrictMode: true`. If disabled intentionally (e.g., for third-party library compatibility), document the reason.

---

## 10. API Security (CORS, Headers)

### [MEDIUM] C17 — Non-timing-safe secret comparison for internal API authentication

**File:** `src/app/api/send-notification-email/route.ts:14-21`
**Severity:** MEDIUM (theoretical — low practical risk in Node.js)

**Vulnerable code:**
```typescript
function verifyInternalSecret(request: NextRequest): boolean {
  const secret = request.headers.get('x-internal-secret')
  if (!INTERNAL_SECRET) {
    return false
  }
  return secret === INTERNAL_SECRET  // ← string equality, not timing-safe
}
```

**Problem:** The `===` operator in JavaScript can be vulnerable to timing attacks in theory (comparing character by character, short-circuits on first mismatch). An attacker making many requests could measure response time differences to enumerate the secret character by character.

**Practical risk:** In a Node.js HTTP server with millisecond-level network jitter, timing attacks on string comparison are extremely difficult to execute reliably. However, it's a best-practice violation.

**Fix:** Use a constant-time comparison:
```typescript
import { timingSafeEqual } from 'crypto'

function verifyInternalSecret(request: NextRequest): boolean {
  const providedSecret = request.headers.get('x-internal-secret')
  if (!INTERNAL_SECRET || !providedSecret) return false
  try {
    return timingSafeEqual(
      Buffer.from(providedSecret),
      Buffer.from(INTERNAL_SECRET)
    )
  } catch {
    return false  // Different lengths throw, which means not equal
  }
}
```

---

## Summary Table

| ID | Severity | File | Line | Issue |
|----|----------|------|------|-------|
| C1 | CRITICAL | `delete-account/route.ts` | 93 | `auth.admin.deleteUser()` on user client |
| C2 | HIGH | `send-pec/route.ts` | 63 | `getSession()` used instead of `getUser()` |
| C7 | HIGH | `delete-account/route.ts` | 29 | No rate limiting on password brute force |
| C8 | HIGH | `send-pec/route.ts` | — | No rate limiting on PEC send |
| C3 | MEDIUM | `middleware.ts` | 8 | `/new-disdetta` bypasses server-side auth |
| C5 | MEDIUM | `stripe/webhook/route.ts` | 41 | `disdettaId` NaN not validated |
| C9 | MEDIUM | `confirm-data/route.ts` | — | No rate limiting (CPU-intensive fuzz matching) |
| C10 | MEDIUM | `webhook/route.ts`, `send-notification-email/route.ts` | 143, 135 | User emails in logs (GDPR) |
| C12 | MEDIUM | `next.config.js` | 12 | CSP `unsafe-inline` for scripts |
| C15 | MEDIUM | `middleware.ts` | 17 | Non-null assertion `!` without runtime guard |
| C17 | MEDIUM | `send-notification-email/route.ts` | 20 | Non-timing-safe secret comparison |
| C4 | LOW | `stripe/webhook/route.ts` | 79 | `checkError` fetched but never validated |
| C6 | LOW | `create-checkout/route.ts` | 108 | `error: any` hides error types |
| C11 | LOW | `confirm-data/route.ts` | 47 | Verbose logging of business data |
| C13 | LOW | `stripe/webhook/route.ts` | 104 | Error logs include full DB error objects |
| C14 | LOW | upload validation routes | — | No explicit server-side file size limit |
| C16 | LOW | `next.config.js` | 59 | `reactStrictMode: false` |

---

## Positive Security Controls Observed

The following security controls were found to be **correctly implemented**:

- **Supabase RLS**: All data queries use `.eq('user_id', user.id)` pattern correctly
- **Stripe webhook verification**: `stripe.webhooks.constructEvent()` used with signature verification before processing (lines 31-35)
- **Bucket whitelist in file validation**: `validate-document/route.ts` and `validate-identity-document/route.ts` explicitly whitelist allowed bucket names
- **Path traversal prevention**: `storagePath` Zod validator ensures paths start with UUID
- **MIME type validation**: File upload routes validate MIME against an explicit allowlist
- **Security headers**: Full set of security headers in `next.config.js` (HSTS, X-Frame-Options DENY, X-Content-Type-Options, Referrer-Policy, Permissions-Policy)
- **Contact form rate limiting**: Proper 5-requests/10-minute rate limiting with correct headers
- **Service role isolation**: Edge Functions correctly use `SUPABASE_SERVICE_ROLE_KEY`; regular API routes use user-level client with RLS
- **Password re-verification for destructive action**: Account deletion requires password re-entry (correct concept, implementation has C1 bug)
- **INTERNAL_API_SECRET for internal endpoints**: `send-notification-email` is not publicly accessible

---

*Report generated: 2026-03-20 | Tools: static code analysis, manual review*
