- **Authentication (C1):**
  - Implements /login and /register pages using Supabase Auth.
  - Creates AuthContext (`AuthProvider`) to manage global user state.
  - Adds a dynamic Navbar that shows user state (login/logout).
  - Implements route protection for authenticated pages.

- **User Profile (C1.5 - Prerequisito):**
  - Adds `profiles` table (SQL) with RLS for user data (Nome, Cognome, Indirizzo), come da diagramma.
  - Adds a trigger (`handle_new_user`) to auto-create profiles for new users upon registration.
  - Adds `documenti-identita` Storage bucket with RLS.
  - Creates new `/profileUser` page that uses `upsert` to safely create/update user data and upload the ID document.

- **Service Selection (C2):**
  - Creates the /new-disdetta 3-step wizard page (Category -> Operator -> Service).
  - Fetches data from new Supabase tables (`categories`, `operators`, `service_types`).
  - Implements RLS policies (read access for authenticated users).

- **File Upload & Delega (C3):**
  - Refactors `/upload/[serviceId]` page into a 2-step wizard (Bolletta -> Delega), come da diagramma.
  - Configures `documenti_utente` bucket (Bolletta) with RLS policies.
  - Adds `documenti-delega` Storage bucket (Delega) with RLS policies.
  - Implements secure file upload for both files under a user-scoped path (`user.id/...`).

- **Dev Ops:**
  - Installs and links the Supabase CLI in preparation for Edge Function development.

- **AI/OCR Integration (C4):**
  - Implements the core AI processing logic within a new Supabase Edge Function (`process-document`).
  - Calls the Google Document AI (REST API) processor directly.
  - Adds a 7-second strategic delay to resolve the 404 race condition.
  - Implements manual Base64 file conversion.
  - Adds Google OAuth Access Token generation.
  - Adds `documento_delega_path` column to the `extracted_data` table.
  - Updates the Edge Function to receive both `path` (Bolletta) and `delegaPath` (Delega).
  - Implements `upsert` (on `file_path` conflict) to save/update both file paths and prevent duplicate errors.

- **Dev Ops:**
  - Deploys the `process-document` Edge Function to the Supabase project.

- **Data Persistence & Review (C5):**
  - **Backend:**
    - Creates `extracted_data` table with RLS policies.
    - Adds a new secure API route `/api/get-extracted-data` to fetch results via RLS.
  - **Frontend:**
    - Modifies the (C3) 2-step wizard to invoke the (C4) function and redirect to the review page on success.
    - Creates the new `/review` page (C5) with Suspense.
    - Creates the `ReviewForm` component to fetch and display the extracted data.

- **Dev Ops:**
  - Redeploys the `process-document` Edge Function with C5 logic (DB write).
  - Configures CORS on the Edge Function to allow `http://localhost:3000`.

- **Data Confirmation (C6):**
  - **Frontend:**
    - Converts `ReviewForm` (C5) into a controlled component using `useState`.
    - Implements `handleFormChange` and `handleSubmit` to manage submission state.
    - Redirects user to `/dashboard` upon successful submission.
  - **Backend:**
    - Creates the new API route `/api/confirm-data` (PATCH).
    - The API securely authenticates the user (ANON_KEY) and implements a safe `cookieAdapter`.
    - On success, the API updates the `extracted_data` record with user-supplied data and sets the `status` to `CONFIRMED`.

- **User Dashboard (C7):**
  - **Backend:**
    - Creates the new API route `GET /api/get-my-disdette`.
    - The API securely fetches all records from `extracted_data` matching the `user_id`.
  - **Frontend:**
    - Creates the new `/dashboard` page (Server Component) to act as the user's main hub, including a `Suspense` boundary.
    - Creates the `DashboardList` (Client Component) which calls the new API, handles loading/error states, and renders the list of submissions.
    - Adds a `StatusBadge` component to show the state (`PENDING_REVIEW` or `CONFIRMED`).

- **PEC Send-Flow (C8):**
  - **Frontend (Review Page):**
    - Updates `ReviewForm` (C6) `handleSubmit` to a 2-phase process:
      1. Calls `PATCH /api/confirm-data` to confirm data.
      2. Calls `POST /api/send-pec` to trigger the send.
    - Button text changed to "Conferma e Invia PEC".
  - **Backend (API Trigger):**
    - Creates the new API route `POST /api/send-pec`.
    - This route securely validates the user and the disdetta status (`CONFIRMED`).
    - Invokes the `send-pec-disdetta` Edge Function.
  - **Backend (Edge Function):**
    - Creates the new `send-pec-disdetta` Edge Function.
    - (Fase 1 - Recupero): Uses SERVICE_ROLE_KEY to fetch 'extracted_data' and 'profiles' data, and downloads the 'documento_delega' file from Storage.
    - (Fase 2 - Generazione PDF): Imports `pdf-lib` and dynamically generates the PDF disdetta letter populated with user and contract data.
    - (Fase 3 - Invio): **(Test Mode)** SMTP/PEC logic is implemented but commented out.
    - Updates the disdetta status to `SENT` upon successful PDF generation.

- **Profile Enforcement (C9):**
  - **AuthContext (C1.5):**
    - Updates `AuthContext` to fetch the user's `profiles` data on login.
    - Exposes a new boolean `isProfileComplete` (true only if `nome`, `cognome`, `indirizzo_residenza` are not null).
    - Fixes TypeScript warning (`user is possibly null`).

  - **ProfileRequired (Wrapper):**
    - Creates new `<ProfileRequired>` client component.
    - Uses `useAuth()` to check `isProfileComplete`.
    - Redirects users with incomplete profiles to `/profileUser`.
  
  - **Routing:**
    - Removes `/dashboard` from the wrapper to keep it accessible to all logged users.
    - Protects `/new-disdetta/layout.tsx` with the wrapper, enforcing profile completion *only when starting a new disdetta*.

  - **Profile Page (Bug Fixes & RLS):**
    - Fixes bug where `/profileUser` page crashed when profile row didn't exist (using `.maybeSingle()`).
    - Fixes bug preventing profile save (using `.upsert()`).
    - Adds RLS policies for `UPDATE`/`DELETE` on all storage buckets to allow overwrites (`upsert: true`).
    - Fixes issue where inputs were cleared after saving (adds `.select().single()` to the `upsert`).
    - Adds redirect from `/profileUser` back to `/dashboard` after successful save.

- **Implements Google Social Login (C10)**
  - **Backend (Supabase Config):**
    - Configured Google as an OAuth provider in the Supabase dashboard (requires Client ID and Secret from Google Cloud Console).

  - **Frontend (Login Page):**
    - Adds a "Accedi con Google" button to the '/login/page.tsx'.
    - Implements the 'handleLoginWithGoogle' function using 'supabase.auth.signInWithOAuth'.

  - **Database (SQL Trigger):**
    - Replaces the old 'handle_new_user' trigger with an upgraded version.
    - The new trigger checks 'raw_user_meta_data' for the 'full_name' provided by Google.
    - Automatically parses 'full_name' into 'nome' and 'cognome' and pre-populates these fields in the 'profiles' table upon a new social login.

- **C11 (Security & Validation Refactor):**
 - **Middleware:** Replaces the client-side C9 (<ProfileRequired>) with a server-side 'src/middleware.ts' for robust route protection (auth + profile completion).
 - * **Validation (Zod):** Introduces 'zod' and a central 'src/domain/schemas.ts' for type-safe validation (using the user's advanced refactored version).
 - * **Edge Functions:** Hardens 'process-document' (v5) and 'send-pec-disdette' with Zod/type-guard validation, timeout/backoff logic, and PII-safe logging.
 - * **API Routes:** Refactors all API routes ('/api/confirm-data', '/api/get-extracted-data', '/api/send-pec') to use Zod schemas.
 - * **Bug Fix (SSR):** Fixes 500 crash across all API Routes by removing the 'NextResponse.next()' pattern and standardizing on the correct 'cookieStore' adapter for SSR auth token refreshes.
 - * **Database:** Applies "least-privilege" select (no 'select(*)') to '/api/get-my-disdette'.

- **Security Hardening (C11.5):**
  - **Edge Function (`send-pec-disdetta`):**
    - Implements "Dual Client Auth" pattern to verify user ownership (RLS) *before* using the `SERVICE_ROLE_KEY`.
    - Implements "State Transition Check" (`.eq('status', 'CONFIRMED')`) to prevent duplicate disdetta sends.
    - Implements "MIME & Size Whitelist" to validate delega and ID files before processing.
  - **Frontend (`DashboardList`):**
    - Updates the UI to support the "Invia Disdetta" button.
    - Updates the `StatusBadge` component to render the new `TEST_SENT` and `FAILED` states.

- **Form Styling (C12):**
  - **Install:** Adds `tailwindcss@^3` (removing v4) and the `@tailwindcss/forms` plugin.
  - **Config:** Creates and configures `tailwind.config.js` (ESM version) and `postcss.config.js`.
  - **CSS:** Fixes "white-on-white" input bug by adding `@tailwind` directives and a text-color override in `globals.css`.

- **Form Refactor & Delega PDF (C13):**
  - **Database (Cleanup):** DROPPED `documento_delega_path` column and `documenti-delega` bucket/RLS.
  - **C3/C4 (Cleanup):** Removed "Step 2" (Delega Upload) from C3 and removed `delegaPath` logic from C4.
  - **C6/C13 (ReviewForm):**
    - Refactored the form to use `react-hook-form` and `zod`.
    - Added a mandatory `delegaCheckbox` to the form and Zod schema.
  - **C8 (send-pec-disdetta):**
    - Added `creaPdfDelega` helper to auto-generate the delega PDF using profile data.
    - Updated the function to upload *both* the Lettera PDF and Delega PDF to storage for tracking.

- **OCR Error Handling (C14):**
  - **Database (Schema):** Adds `error_message` column to `extracted_data`.
  - **C3 (Upload Page):** Refactored to create a record with `status: 'PROCESSING'` *before* invoking the function, passing only the record `id`.
  - **C4 (process-document):** Refactored to receive an `id`. Implements a `try...catch` block to update the record to `status: 'FAILED'` and save the `error_message` on failure, preventing a crash.
  - **C13 (ReviewForm):**
    - Implements "polling" logic in `useEffect` to check the status (`PROCESSING`).
    - Adds a new `StatusDisplay` component to show loading/processing messages.
    - If `status: 'FAILED'` is detected, it displays the `error_message` from the database.

- **Architecture Refactoring (C15):**
    - **Foundation Layer:**
    - Introduces `src/lib/errors/AppError.ts` with error types `(UnauthorizedError, NotFoundError, ValidationError, …)` and code mapping.
    - Adds AuthService `(src/services/auth.service.ts)` to centralize authentication (removes duplication across APIs).
    - Creates Supabase server-side factory `(src/lib/supabase/server.ts)` with proper cookie handling and typing.
  - **Data Access Layer:**
    - Adds DisdettaRepository `(src/repositories/disdetta.repository.ts)` for all queries on extracted_data.
    - Implements methods: getById, getByUser, create, updateStatus, confirmData, savePdfPath, countByStatus.
    - Supports pagination with `.range()` and `PaginatedResult` type for future infinite scroll.
    - Handles DB errors with specific codes.
  - **Business Logic Layer:**
    - Adds DisdettaService `(src/services/disdetta.service.ts)` with domain rules and orchestration.
    - Validates state transitions `(e.g., confirm only if PENDING_REVIEW, send only if CONFIRMED)`.
    - Key methods: `getDisdettaForReview`, `getMyDisdette`, `confirmAndPrepareForSend`, `prepareForPecSend`, `markAsSent`, `getDashboardStats`.
    - Integrates Zod validations at service level for type-safe operations.
  - **API Routes Refactoring:**
    - `GET /api/get-my-disdette`: adds pagination (page, pageSize, status), reduces code, delegates to service/repo.
    - `GET /api/get-extracted-data`: simplifies, adds business checks (e.g., isProcessing, canEdit, errorInfo).
    - `PATCH /api/confirm-data`: automatically validates state/data consistency, reduces duplicate code.
    - `POST /api/send-pec`: correctly passes Authorization to the Edge Function and updates status post-send.
    - All routes use a consistent handleApiError for error serialization.
  - **Frontend Updates:**
    - `/upload/[serviceId]`: redirect with id parameter (no longer filePath).
    - `ReviewForm`: uses id query and new response format (direct object).
    - `DashboardList`: handles paginated response { data, count, hasMore } and uniform links with ?id=.
  - **Breaking Changes:**
    - APIs now return direct objects (no longer `{ success, data }`).
    - Review page uses `?id= (no longer ?filePath=)`.
    - `get-my-disdette` now responds `{ data, count, hasMore }` (not { disdette }).
    - `tsconfig.json`: excludes `supabase/` to prevent Next from compiling Deno Edge Functions.
  - **Results:**
    - ~170 duplicate lines removed overall.
    - Improved maintainability (centralized business logic), services/repositories easily testable.
    - Stronger end-to-end types and ready foundation for infinite scroll (C16).

- **C16 — Infinite Scroll Pagination**
  - **Custom Hook (useInfiniteScroll)**
    - Creates `src/hooks/useInfiniteScroll.ts` to centralize all pagination logic.
    - Manages full pagination state: `items, page, isLoading, isLoadingMore, hasMore, error, totalCount.`
    - Provides two core methods:
      - `loadMore()` → fetches the next page.
      - `refresh()` → reloads from page 1.
    - Prevents duplicate fetches through proper state guarding.
    - Implements robust error handling and race-condition protection.
    - Uses `useCallback` for memoized fetch functions.
    - Ensures correct `useEffect` dependencies to avoid infinite loops.
  - **Intersection Observer (InfiniteScrollTrigger)**
    - Adds `src/components/InfiniteScrollTrigger.tsx.`
    - Uses the Intersection Observer `API` to detect when the user reaches the bottom area.
    - Automatically triggers `loadMore()` when the element becomes visible.
    - Supports configurable threshold and rootMargin `(e.g., 100px for pre-loading)`.
    - Includes proper cleanup on unmount to avoid memory leaks.
  - **Dashboard Refactoring**
    - Refactors the `DashboardList` to fully adopt the infinite scroll pattern.
    - Progressive loading:
      - Fetches `10 items` per page.
      - Skeleton loaders for the initial load (3 animated placeholders).
      - Loading spinner for subsequent pages.
    - UX enhancements:
      - `Items counter` → “Showing X of Y”.
      - `Scroll hint` → “Scroll to load more”.
      - `End-of-list message` → “🎉 You’ve reached the end”.
    - Maintains scroll position when new items are appended.
    - Automatically refreshes the list after PEC submission to update statuses.
  - **Performance Improvements**
    - Dramatically reduces initial load time by loading only `10 items` at startup.
    - Implements `lazy loading` — next pages load only when needed.
    - Prevents duplicate network calls during pagination.
    - Preloads the next page early via `rootMargin`.
    - Removes the `refresh dependency` in `useEffect` to eliminate infinite rerenders.
  - **Bug Fixes & Edge Cases**
    - Fixes infinite loop caused by incorrect `useEffect` dependencies.
    - Ensures proper cleanup of the Intersection Observer.
    - Handles edge cases such as:
      - `Empty lists`,
      - `Lists with exactly 10 items,`
      - `Network errors, slow responses, or unexpected payloads.`
    - Guarantees stable UX even with rapidly changing data.
  - **API Integration (C15)**
    - Fully integrates backend pagination using query parameters: `?page=X&pageSize=Y`.
    - Correctly parses paginated responses: `{ data: [], count: number, hasMore: boolean }`.
    - Uses `DisdettaService.getMyDisdette()` in strict paginated mode.
    - Reduces initial `API payload` and improves scalability for large datasets.
  - **Results**
    - Significant performance improvement for users with many disdette.
    - Modern, fluid UX similar to social media feeds.
    - Scalable pattern ready for:
      - `filters`,
      - `search with pagination`,
      - `dynamic sorting`.
    - Smooth transitions thanks to skeletons, spinners, and preloading.