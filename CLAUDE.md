# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Piattaforma Disdette** is a Next.js 14 web application that automates the Italian service cancellation ("disdetta") process. Users upload utility bills, the system extracts data via OCR (Google Document AI), generates cancellation letters, and sends them via PEC (Italian certified email).

**Tech Stack:**
- **Frontend:** Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS
- **Backend:** Supabase (PostgreSQL, Auth, Storage, Edge Functions)
- **AI/OCR:** Google Document AI (via Edge Functions)
- **Validation:** Zod schemas
- **PDF Generation:** pdf-lib (in Edge Functions)

## Development Commands

```bash
# Development
npm run dev              # Start dev server on http://localhost:3000

# Building
npm run build            # Production build

# Linting
npm run lint             # Run ESLint

# Supabase (requires Supabase CLI)
supabase start           # Start local Supabase
supabase status          # Check local services
supabase functions deploy <function-name>  # Deploy edge function
```

## Architecture

### Clean Architecture (Implemented in C15)

The codebase follows a layered architecture pattern:

**Layer 1: Domain (`src/domain/`)**
- `schemas.ts`: All Zod validation schemas for Edge Functions, API routes, and frontend forms
- Contains reusable validators (partitaIvaIt, ibanIt, storagePath, etc.)
- Type definitions derived from schemas using `z.infer<>`

**Layer 2: Repository (`src/repositories/`)**
- `disdetta.repository.ts`: Data access layer for `extracted_data` table
- Handles all direct database queries via Supabase client
- Methods: `getById`, `getByUser`, `create`, `updateStatus`, `confirmData`, etc.
- Returns raw database types, throws `DatabaseError` or `NotFoundError`

**Layer 3: Service (`src/services/`)**
- `disdetta.service.ts`: Business logic layer orchestrating repository calls
- `auth.service.ts`: Authentication utilities (getCurrentUser, etc.)
- Enforces business rules (e.g., can only confirm if status is PENDING_REVIEW)
- Throws domain-specific errors (`AppError`, `ValidationError`)

**Layer 4: API Routes (`src/app/api/`)**
- Thin controllers that delegate to services
- Standard pattern:
  ```typescript
  const supabase = await createServerClient();
  const user = await AuthService.getCurrentUser(supabase);
  const repository = new DisdettaRepository(supabase);
  const service = new DisdettaService(repository, user.id);
  return service.someMethod();
  ```
- Use `handleApiError(error)` for consistent error responses

### Supabase Client Management

**Server-Side:**
- Use `createServerClient()` from `src/lib/supabase/server.ts` for authenticated requests
- Uses `@supabase/ssr` with Next.js cookies adapter
- RLS policies automatically enforce user isolation

**Client-Side:**
- Legacy `supabaseClient.ts` exists but prefer server-side calls via API routes
- AuthContext manages global auth state

**Service Role (Admin):**
- Only used in Edge Functions via `SUPABASE_SERVICE_ROLE_KEY`
- Bypasses RLS - use with extreme caution

### Edge Functions (Supabase Deno Functions)

Located in `supabase/functions/`:

**`process-document/index.ts`** (C4, C14):
- Triggered after file upload to extract data from utility bills
- Calls Google Document AI REST API with JWT authentication
- Implements retry logic and 7-second strategic delay for GCP storage propagation
- Updates `extracted_data` table with OCR results
- Sets status: PROCESSING → PENDING_REVIEW (success) or FAILED (error)

**`send-pec-disdetta/index.ts`** (C8, C12):
- Generates PDF cancellation letter using pdf-lib
- Fetches user profile and disdetta data using SERVICE_ROLE_KEY
- Currently in TEST_MODE (no actual PEC sending)
- Updates status to TEST_SENT after PDF generation

**Deployment:**
```bash
supabase functions deploy process-document
supabase functions deploy send-pec-disdetta
```

### State Machine (Disdetta Status Flow)

The `extracted_data.status` field follows this flow:

1. **PROCESSING** - Initial state when file is uploaded and OCR is running
2. **PENDING_REVIEW** - OCR completed, user must review/confirm extracted data
3. **CONFIRMED** - User confirmed data, ready to send PEC
4. **TEST_SENT** / **SENT** - PEC sent successfully
5. **FAILED** - OCR or processing error (check `error_message` field)

**Business Rules:**
- Can only confirm data when status = PENDING_REVIEW
- Can only send PEC when status = CONFIRMED
- Cannot edit/delete if status = SENT or TEST_SENT

### Authentication & Authorization

**Auth Flow:**
- Supabase Auth handles registration/login
- `AuthContext` (`src/context/AuthContext.tsx`) provides global auth state
- `src/middleware.ts` enforces route protection and profile completeness

**Middleware Protection:**
- `protectedRoutes`: Require login (`/dashboard`, `/profileUser`, `/new-disdetta`, `/upload`, `/review`)
- `profileRequiredRoutes`: Require complete profile (`/new-disdetta`, `/upload`, `/review`)
- Complete profile = nome, cognome, indirizzo_residenza, documento_identita_path all present

**RLS (Row Level Security):**
- All tables have RLS policies based on `auth.uid() = user_id`
- Storage buckets use path-based policies: `user_id/...`

### Data Validation Strategy

**Zod Schemas in `src/domain/schemas.ts`:**

1. **Edge Function Payloads:**
   - `processDocumentSchema` - validates OCR trigger requests
   - `sendPecSchema` - validates PEC send requests

2. **API Route Payloads:**
   - `confirmDataSchema` (soft) - accepts strings without strict format validation
   - `confirmDataStrictSchema` - normalizes and validates Partita IVA/IBAN format
   - Use `parseConfirmData(input, strict)` helper

3. **Frontend Forms:**
   - `profileFormSchema` - profile page validation
   - `reviewFormSchema` - review page with delega checkbox (C13)

**Helper Validators:**
- `partitaIvaIt` - 11-digit Italian VAT number (auto-removes spaces)
- `ibanIt` - 27-char Italian IBAN (auto-uppercase, removes spaces)
- `storagePath` - ensures path starts with UUID (user_id)

### Error Handling

Custom error classes in `src/lib/errors/AppError.ts`:
- `AppError` - base class with statusCode and code
- `UnauthorizedError` (401)
- `NotFoundError` (404)
- `ValidationError` (400) - for Zod failures
- `DatabaseError` (500)

**In API Routes:**
```typescript
try {
  // business logic
} catch (error) {
  return handleApiError(error);  // Auto-converts to JSON response
}
```

### Storage Buckets

All buckets have RLS policies enforcing `user_id/` path prefix:

- `documenti_utente` - Uploaded utility bills
- `documenti-delega` - Delegation documents (deprecated after C13 auto-generation)
- `documenti-identita` - ID documents uploaded in /profileUser
- `documenti-disdetta` - Generated PDF cancellation letters

### Modern UX Features

**Infinite Scroll (C16):**
- `src/hooks/useInfiniteScroll.ts` - Intersection Observer hook
- `src/components/InfiniteScrollTrigger.tsx` - Sentinel component
- Dashboard uses cursor-based pagination with `hasMore` flag

**Design System (C17):**
- Glassmorphism Navbar with blur effects
- Modern card designs with hover states
- Fully responsive (mobile-first)
- Framer Motion animations

### User Flow (C13 - Current)

The delega flow was refactored in C13:

**OLD (C3):** User uploaded both bolletta + delega document
**NEW (C13):** User only uploads bolletta, delega PDF is auto-generated by system

**Complete Flow:**
1. `/profileUser` - Complete profile (nome, cognome, indirizzo, ID document)
2. `/new-disdetta` - 3-step wizard: Category → Operator → Service
3. `/upload/[serviceId]` - Upload utility bill (single file, no delega)
4. OCR processing (async via `process-document` Edge Function)
5. `/review` - Review extracted data + **checkbox to accept auto-generated delega**
6. Send PEC → generates PDF letter in `send-pec-disdetta`
7. `/dashboard` - View all submissions with infinite scroll

**Key Change in Review Form:**
- Added `delegaCheckbox` field (must be true to submit)
- Label explains that delega will be auto-generated
- Schema: `reviewFormSchema` in `src/domain/schemas.ts`

### Important Files Reference

**Configuration:**
- `next.config.js` - Security headers (X-Frame-Options, CSP, etc.)
- `tsconfig.json` - Path alias `@/*` maps to `src/*`
- `tailwind.config.js` - Design system tokens
- `.env.local` - Supabase keys, Google Service Account JSON

**Core Components:**
- `src/components/Navbar.tsx` - Glassmorphism navbar with auth state
- `src/components/DashboardList.tsx` - Infinite scroll list
- `src/components/ReviewForm.tsx` - OCR data review with delega checkbox

**Key API Routes:**
- `/api/get-extracted-data` - Fetch OCR results by filePath
- `/api/confirm-data` - PATCH to confirm data and set status=CONFIRMED
- `/api/send-pec` - POST to trigger PEC sending
- `/api/get-my-disdette` - GET paginated user disdette

### Testing & Development

**Local Development:**
1. Run `supabase start` to start local Supabase
2. Run `npm run dev` for Next.js dev server
3. Edge functions auto-reload with `--watch` flag

**Common Pitfalls:**
- **404 Errors on GCP:** process-document has 7-second delay to wait for file propagation
- **Cookie Errors in Middleware:** Middleware cookie adapter is read-only on GET requests
- **RLS Violations:** Always check that `user_id` matches `auth.uid()`
- **Type Errors:** Supabase client types are manually defined in `src/lib/supabase/server.ts`

### Code Conventions

- **TypeScript:** Strict mode enabled, no implicit any
- **Imports:** Use `@/` path alias for src imports
- **Error Handling:** Always use try/catch in API routes and Edge Functions
- **Validation:** All user input goes through Zod schemas
- **Comments:** Italian comments in code for domain-specific logic
- **State Management:** React hooks + Context API (no Redux)

### Database Schema (Key Tables)

**`profiles`** (user data):
- `user_id` (uuid, FK to auth.users)
- `nome`, `cognome`, `indirizzo_residenza`
- `documento_identita_path` (storage path)

**`extracted_data`** (disdette):
- `id` (serial primary key)
- `user_id` (uuid, FK)
- `file_path` (storage path to uploaded bill)
- `status` (varchar - state machine)
- `supplier_tax_id`, `receiver_tax_id`, `supplier_iban` (extracted data)
- `raw_json_response` (jsonb - full OCR response)
- `pdf_path` (storage path to generated letter)
- `error_message` (text, nullable)

**`categories`**, **`operators`**, **`service_types`** (reference data for wizard)

## Commit History Context

Recent architectural improvements from roadmap-log.md:

- **C15:** Repository/Service layer refactoring for clean architecture
- **C16:** Infinite scroll pagination in dashboard
- **C17:** Modern design system with glassmorphism
- **C14:** Async OCR with robust error handling (FAILED status)
- **C13:** Auto-generated delega (removed manual upload)

These commits inform the current architecture and should guide future development patterns.
