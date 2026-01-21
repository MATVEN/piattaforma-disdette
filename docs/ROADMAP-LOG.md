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
  - Adds `documento_delega_path` column to the `disdette` table.
  - Updates the Edge Function to receive both `path` (Bolletta) and `delegaPath` (Delega).
  - Implements `upsert` (on `file_path` conflict) to save/update both file paths and prevent duplicate errors.

  - **Dev Ops:**
    - Deploys the `process-document` Edge Function to the Supabase project.

- **Data Persistence & Review (C5):**
  - **Backend:**
    - Creates `disdette` table with RLS policies.
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
    - On success, the API updates the `disdette` record with user-supplied data and sets the `status` to `CONFIRMED`.

- **User Dashboard (C7):**
  - **Backend:**
    - Creates the new API route `GET /api/get-my-disdette`.
    - The API securely fetches all records from `disdette` matching the `user_id`.
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
    - (Fase 1 - Recupero): Uses SERVICE_ROLE_KEY to fetch 'disdette' and 'profiles' data, and downloads the 'documento_delega' file from Storage.
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

- **Implements Google Social Login (C10):**
  - **Backend (Supabase Config):**
    - Configured Google as an OAuth provider in the Supabase dashboard (requires Client ID and Secret from Google Cloud Console).

  - **Frontend (Login Page):**
    - Adds a "Accedi con Google" button to the '/login/page.tsx'.
    - Implements the 'handleLoginWithGoogle' function using 'supabase.auth.signInWithOAuth'.

  - **Database (SQL Trigger):**
    - Replaces the old 'handle_new_user' trigger with an upgraded version.
    - The new trigger checks 'raw_user_meta_data' for the 'full_name' provided by Google.
    - Automatically parses 'full_name' into 'nome' and 'cognome' and pre-populates these fields in the 'profiles' table upon a new social login.

- **Security & Validation Refactor (C11):**
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
  - **Database (Schema):** Adds `error_message` column to `disdette`.
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
    - Adds DisdettaRepository `(src/repositories/disdetta.repository.ts)` for all queries on disdette.
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

- **Infinite Scroll Pagination (C16):**
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

- **Modern Design System & UI Overhaul (C17):**
  - **Design System Foundation:**
    - Implements comprehensive `tailwind.config.js` with modern color palette:
      - Primary indigo gradient (`#6366F1` → `#4F46E5`)
      - Secondary pink/rose accents
      - Semantic colors (success green, warning amber, danger red)
    - Adds custom animations: `fade-in`, `slide-up`, `scale-in`, `pulse-slow`
    - Creates glassmorphism utilities: `shadow-glass`, `shadow-glass-hover`, `backdrop-blur`
    - Defines card shadow system: `shadow-card`, `shadow-card-hover`
    - Pre-configures gradient utilities: `bg-gradient-primary`, `bg-gradient-success`
  
  - **Navbar Complete Redesign:**
    - **Phase 1 (Glassmorphism):**
      - Transparent background with `backdrop-blur-md`
      - Sticky positioning with dynamic opacity on scroll
      - Gradient logo with glow effect using `Sparkles` icon
    - **Phase 2 (Dark Theme - Final):**
      - Deep indigo background (`bg-indigo-900`)
      - Vibrant gradient accent bar on top
      - White navigation links with luminous hover states
      - Glass-effect profile dropdown with blur
      - Responsive mobile menu with slide-in animation
      - Logo with text shadow and colored glow effect
    - Integrates Framer Motion for smooth page transitions
    - Mobile hamburger menu with animated icon states
  
  - **Dashboard Cards Modernization:**
    - Elevated card design with `shadow-card` and hover lift effect
    - Gradient accent bar at the top of each card (`h-1 bg-gradient-primary`)
    - Color-coded icons in rounded containers (`bg-primary-50`)
    - Smooth hover transitions with border color changes
    - Stagger animations on card appearance (Framer Motion)
    - Modern empty state with:
      - Illustrated icon placeholder
      - Dashed border design
      - Prominent gradient CTA button with scale hover effect
    - Status badges with icons and semantic colors:
      - `PROCESSING` → spinning loader + indigo
      - `PENDING_REVIEW` → clock icon + amber
      - `CONFIRMED` → gradient success button with send icon
      - `SENT`/`TEST_SENT` → checkmark + green
      - `FAILED` → X icon + red
  
  - **Form Components Styling:**
    - **ReviewForm:**
      - Adds colored icons to each input field
      - Implements focus states with colored borders
      - Animated error messages with smooth transitions
      - Redesigned delega checkbox with decorative dashed box
      - Gradient submit button with hover scale effect
      - Inline success/error feedback with animations
    - Ensures all buttons use consistent gradient styling
    - Touch-friendly spacing for mobile inputs
  
  - **Toast Notifications System:**
    - Integrates `react-hot-toast` library
    - Creates centralized toast utility (`src/lib/toast.ts`)
    - Styled toasts with:
      - Success: green background + checkmark icon
      - Error: red background + X icon
      - Auto-dismiss after 3-5 seconds
      - Smooth entrance/exit animations
    - Top-right positioning for non-intrusive feedback
    - Replaces old static success/error boxes in forms
    - Implemented across:
      - Dashboard (PEC send confirmation)
      - Review form (data confirmation)
      - Error handling flows
  
  - **Mobile Optimization:**
    - **Responsive Layout:**
      - Dashboard cards: `flex-col` on mobile, `flex-row` on desktop
      - Status badges: full width on mobile, auto-width on desktop
      - Hidden text labels on mobile, visible on desktop (`hidden sm:inline`)
      - Touch-friendly button sizes (minimum 44x44px)
    - **Overflow Prevention:**
      - Added `w-full max-w-full overflow-hidden` to all card containers
      - Implemented `break-words` for long file names on mobile
      - Changed `grid` to `flex flex-col` for more predictable stacking
      - Added `gap-2` instead of `space-x-2` to prevent wrapping issues
      - Fixed parent container with `overflow-x-hidden`
    - **Progressive Enhancement:**
      - Reduced padding on mobile (`p-3`), expanded on desktop (`sm:p-5`)
      - Scroll hint text hidden on small screens
      - Adaptive typography sizing
  
  - **UX Improvements:**
    - Removed duplicate "Crea Disdetta" button from dashboard header (kept in navbar only)
    - Added item counter: "Showing X of Y disdette"
    - Scroll hint for infinite scroll ("Scorri per caricarne altre")
    - End-of-list indicator with celebratory message
    - Skeleton loaders with pulse animation for better perceived performance
    - Smooth color transitions on all interactive elements
  
  - **Performance & Accessibility:**
    - Optimized animations to use `transform` and `opacity` for GPU acceleration
    - Proper color contrast ratios for WCAG compliance
    - Focus states visible on all interactive elements
    - Semantic HTML structure maintained
    - Reduced motion respected via Tailwind's motion utilities
  
  - **Results:**
    - Modern, professional aesthetic aligned with contemporary SaaS products
    - Consistent visual language across all pages and components
    - Improved mobile experience with zero horizontal overflow
    - Reduced cognitive load through clear visual hierarchy
    - Enhanced user feedback with toast notifications
    - Scalable design system ready for new features

- **Custom Error Pages (C18):**
  - **Error Page Design:**
    - Creates custom 404 (not-found.tsx) with AlertCircle icon and primary-600 color
    - Creates custom 500 (error.tsx) with XCircle icon, dual action buttons (retry + dashboard), and error logging
    - Creates global error boundary (global-error.tsx) with AlertTriangle icon and page reload functionality

  - **Design System Integration:**
    - Applies C17 design system consistently across all error pages
    - Uses glassmorphism cards (bg-white, rounded-xl, shadow-card)
    - Implements gradient primary buttons with hover effects (shadow-glass, hover:scale-105)
    - Mobile-first responsive layout (p-8 sm:p-12, flex-col sm:flex-row)

  - **Animation & UX:**
    - Framer Motion entrance animations (fade-in + slide-up)
    - Lucide React icons for visual feedback
    - Clear action paths (dashboard navigation, retry functionality, page reload)
    - Italian localized error messages

  - **Technical Implementation:**
    - Proper 'use client' directives where required
    - TypeScript strict compliance with proper error boundary types
    - Console error logging for monitoring
    - Next.js 14 App Router convention (files in src/app/)

  - **Files Created:**
    - src/app/not-found.tsx (404 handler)
    - src/app/error.tsx (runtime error boundary)
    - src/app/global-error.tsx (critical error fallback)

  - **Results:**
    - Production-ready error handling with consistent brand experience
    - Improved UX during errors with clear messaging and recovery options
    - Enhanced debugging capabilities with error logging
    - Professional polish aligned with modern design system

- **Footer & Legal Pages (C19):**
  - **Footer Component:**
    - Creates responsive footer with 4-column layout (Brand, Product, Support, Legal)
    - Dark theme design (bg-gray-900) with consistent hover states (text-primary-400)
    - Brand section with Sparkles logo and "DisdEasy" tagline
    - Navigation links to product features (/how-it-works, /operators, /faq)
    - Support section with help center, contacts, and email (supporto@disdette.it)
    - Legal section linking to Privacy Policy, Terms of Service, Cookie Policy
    - Social media icons (GitHub, Twitter, LinkedIn) with rel="noopener noreferrer"
    - Dynamic copyright year with proper accessibility (aria-labels)
    - Mobile-first responsive (grid-cols-1 → sm:grid-cols-2 → lg:grid-cols-4)

  - **Legal Pages with Placeholder Content:**
    - Creates /privacy-policy with GDPR-compliant structure placeholder
      - Sections: Titolare, Tipologie Dati, Finalità, Base Giuridica, Diritti Utenti, Contatti
      - Lists user rights: access, rectification, erasure, portability, opposition
    - Creates /terms-of-service with standard terms sections placeholder
      - Sections: Oggetto Servizio, Registrazione, Utilizzo, Responsabilità, Proprietà Intellettuale, Modifiche, Legge Applicabile
    - Creates /cookie-policy with cookie management information placeholder
      - Cookie categories: Tecnici (necessary), Analitici (optional), Marketing (optional)
      - Management instructions: browser settings, cookie banner (future)
    - Each page includes breadcrumb navigation (Home → Page Title)
    - Prose styling with proper typography hierarchy (h1, h2, h3)
    - Clear "in redazione" status with italic disclaimer
    - Contact emails (privacy@disdette.it) for legal inquiries

  - **Global Integration:**
    - Footer automatically appears on all pages via layout.tsx integration
    - Positioned after <main>{children}</main> in root layout
    - Consistent with C17 design system (shadow-card, prose-indigo, hover:text-primary-700)
    - Accessible markup with semantic HTML (<footer>, <nav>) and ARIA labels
    - SEO-ready structure for future metadata additions

  - **Files Created:**
    - src/components/Footer.tsx (global footer component, 152 lines)
    - src/app/privacy-policy/page.tsx (GDPR placeholder, 102 lines)
    - src/app/terms-of-service/page.tsx (terms placeholder, 86 lines)
    - src/app/cookie-policy/page.tsx (cookie info placeholder, 103 lines)

  - **Files Modified:**
    - src/app/layout.tsx (added Footer import and component)

  - **Technical Implementation:**
    - Server Components for legal pages (better performance, no client JS)
    - External links with security attributes (target="_blank", rel="noopener noreferrer")
    - Dynamic year calculation for copyright (no hardcoding)
    - Proper TypeScript types and strict mode compliance

  - **Results:**
    - Professional site-wide footer with complete navigation structure
    - Legal compliance foundation ready for attorney content insertion (5-minute swap)
    - Consistent brand experience across all pages
    - Improved SEO structure with semantic HTML
    - Reduced bounce rate with clear navigation paths
    - Foundation for future features (contact form, FAQ, help center)

- **Footer & Legal Pages Optimization (C19.5):**

  - **Overview:**
    - Reorganized the footer structure to eliminate redundancies and improve information hierarchy.
    - Implemented missing legal and informational pages required for compliance and user trust.
    - Enhanced navigation on long-form pages with sticky, scroll-aware navigation patterns.
    - Fully integrated with the existing design system and contextual HelpButton logic.

  - **Features Implemented:**
    - Reworked footer layout into a balanced **2–2–2 structure**:
      - *Product*: How It Works, Operators
      - *Support*: FAQ, Contact
      - *Legal*: Privacy & Cookie Policy, Terms of Service
    - Introduced dedicated pages:
      - Terms & Conditions
      - Privacy Policy + Cookie Policy (unified)
      - Supported Operators
      - Contact page with structured form
      - How It Works overview page
    - Replaced confusing `mailto:` links with a proper contact form and email fallback.
    - Contextual HelpButton support added for all new footer pages.

  - **UX & Design System:**
    - Consistent gradient system (indigo → pink) across all pages.
    - Glassmorphism cards with backdrop blur for content sections.
    - Sticky navigation pills on long pages (Privacy, FAQ).
    - Scroll-aware active state tracking for navigation pills.
    - Smooth scroll behavior with correct offset handling.
    - Mobile-first responsive layouts with horizontal pill scrolling where needed.

  - **Technical Implementation:**
    - Scroll-based sticky navigation using state-driven visibility.
    - IntersectionObserver for section-aware active pill highlighting.
    - AnimatePresence for smooth sticky navigation entrance/exit.
    - Centralized HelpButton logic extended with page-specific contextual tips.
    - Unified Privacy + Cookie Policy to avoid legal duplication.
    - Removed deprecated routes and references to obsolete pages.

  - **Content Coverage:**
    - **Terms of Service**:
      - Mandate scope and limitations
      - Responsibilities and liability boundaries
      - Legal framework and service conditions
    - **Privacy & Cookie Policy**:
      - GDPR-compliant data processing purposes
      - Legal bases and user rights
      - Technical, analytics, and profiling cookies
    - **How It Works**:
      - End-to-end disdetta process explained in 3 steps
      - Visual timeline with clear CTAs
    - **Operators**:
      - Supported providers list
      - Service-type filtering
    - **Contact**:
      - Structured contact form
      - Direct email fallback and response time expectations

  - **SEO & Discoverability:**
    - Dedicated SEO-friendly routes for all legal and informational pages.
    - Semantic HTML structure for long-form legal content.
    - Improved internal linking from footer and HelpButton.
    - Clear separation between Privacy Policy and Terms for indexing clarity.

  - **User Experience Impact:**
    - Cleaner, more professional footer with no redundant links.
    - Improved legal transparency and compliance readiness.
    - Faster navigation within long documents.
    - Reduced confusion around support contact methods.
    - Context-aware help available on all informational pages.

  - **Files Involved:**
    - `src/components/Footer.tsx` (footer restructuring)
    - `src/app/terms/page.tsx`
    - `src/app/privacy/page.tsx`
    - `src/app/operators/page.tsx`
    - `src/app/contact/page.tsx`
    - `src/app/how-it-works/page.tsx`
    - `src/components/HelpButton.tsx`
    - `src/app/faq/page.tsx`

- **Duplicate Detection System (C20):**
  - **Data Access Layer:**
    - Adds `checkDuplicate()` in `src/repositories/disdetta.repository.ts` to detect existing cancellations matching the tuple  
      `(user_id, supplier_tax_id, receiver_tax_id, supplier_contract_number)`.
    - Excludes `FAILED` records from duplicate logic to avoid false positives.
    - Queries optimized for new DB indexes and consistent error handling.

  - **Business Logic Layer:**
    - Integrates duplicate detection into `confirmAndPrepareForSend()` inside `src/services/disdetta.service.ts`.
    - Supports intentional override via `bypassDuplicateCheck` flag.
    - Enriches error output with duplicate metadata: `{ duplicateId, createdAt, status, contractNumber }`.
    - Logs all duplicate attempts with `[C21]` prefix for traceability.
    - Maintains domain rules: duplicates allowed *only via bypass*.

  - **API Routes:**
    - `PATCH /api/confirm-data`: enforces duplicate check before confirmation, serializes ValidationError with structured metadata.
    - Accepts and forwards `bypassDuplicateCheck` from request body.
    - All responses use consistent error serialization to match existing API patterns.

  - **Schema & Validation:**
    - `confirmDataSchema` (Zod): adds `bypassDuplicateCheck?: boolean` for type-safe override at API/service level.

  - **Frontend Updates:**
    - **Upload Page (`src/app/upload/[serviceId]/page.tsx`):**
      - Replaces `UPSERT` with strict `INSERT` to prevent silent record overwrites.
      - Prefixes `file_path` with a timestamp to guarantee uniqueness.
      - Ensures each upload (even identical files) produces a new record.
    - **Review Form (`src/components/ReviewForm.tsx`):**
      - Adds duplicate detection modal using AnimatePresence.
      - Reads metadata from `errorData.details` (fix for previous mismatch with `metadata`).
      - Implements `handleBypassDuplicate()` to submit confirmation with override flag.
      - Adds `isBypassSubmitting` state to prevent double interactions and modal flicker.
      - Includes styled “Proceed Anyway” button and spinner for consistency with app UX.

  - **Database Changes:**
    - Removes UNIQUE constraint on `disdette.file_path`:
      ```sql
      ALTER TABLE disdette DROP CONSTRAINT disdette_file_path_key;
      ```
    - Adds performance indexes:
      ```sql
      CREATE INDEX idx_disdette_user_created ON disdette(user_id, created_at DESC);
      CREATE INDEX idx_disdette_user_status ON disdette(user_id, status);
      CREATE INDEX idx_disdette_file_path ON disdette(file_path);
      ```
    - Performs cleanup of NULL/invalid rows and old `FAILED` / `PROCESSING` data.

  - **Files Involved:**
    - `src/app/upload/[serviceId]/page.tsx`
    - `src/components/ReviewForm.tsx`
    - `src/domain/schemas.ts`
    - `src/repositories/disdetta.repository.ts`
    - `src/services/disdetta.service.ts`

  - **Results:**
    - Prevents accidental creation of duplicate cancellation requests.
    - Preserves flexibility for legitimate resubmissions (reactivation, corrections).
    - Improves DB reliability and frontend UX under high-frequency uploads.
    - Ensures consistent metadata, logging, and type-safety across the entire stack.

- **Testing & QA Suite (C21):**
  - **Testing Framework Setup:**
    - Adds Jest 30.2.0 with full Next.js and TypeScript integration.
    - Configures React Testing Library, MSW mocks, and global Jest setup.
    - Adds Playwright configuration for future E2E coverage (C35).
    - Provides reusable mock factories and shared test utilities (`testHelpers.ts`).

  - **Unit Test Coverage (62 tests, ~3s):**
    - **Repository:** validates `checkDuplicate`, status filtering, pagination, and CRUD behaviors.
    - **Service:** tests `confirmAndPrepareForSend`, bypass logic, state transitions, and business rules.
    - **Schema:** Zod validation for `bypassDuplicateCheck` and domain fields across 30 schema tests.

  - **C20 Duplicate Detection Validation:**
    - Full cross-layer coverage (repository → service → schema).
    - Ensures correct metadata generation: `{ duplicateId, status, createdAt, contractNumber }`.
    - Enforces bypass mechanism, multi-tenant isolation, and prevents false positives from FAILED records.

  - **Testing Best Practices:**
    - Fully mocked dependencies (no real DB calls) for fast and reliable execution.
    - Uses AAA pattern (Arrange–Act–Assert) and descriptive test naming.
    - Validates error serialization and consistency with service-layer logic.

  - **Files Added:**
    - Config: `jest.config.js`, `jest.setup.js`, `playwright.config.ts`
    - Tests: `src/__tests__/repositories/*`, `services/*`, `domain/*`
    - Utils: `src/__tests__/utils/testHelpers.ts`
    - Docs: `docs/TESTING.md`

  - **Results:**
    - Guarantees stability of C20 duplicate detection across all layers.
    - Establishes a scalable QA foundation suitable for CI/CD pipelines.
    - Prepares the project for C35 E2E testing and future regression coverage.

- **UI Polish (C22):**

  - **Updated Pages:**
    - Applies the C17 design system (glassmorphism, gradients, animations) to remaining pages: login, registration, and profile.
    - Login: glassmorphism card, Google OAuth integration, icon-enhanced inputs, “forgot password” link.
    - Registration: animated success state, terms acceptance checkbox, fully consistent layout.
    - Profile: user avatar with initials, modernized file upload UI, icon-based form fields.

  - **Extracted Components:**
    - `GoogleIcon.tsx`: reusable Google OAuth SVG icon (removes ~120 duplicated lines).
    - `LegalFooter.tsx`: animated legal footer (removes ~40 lines).
    - `AuthHeader.tsx`: animated logo header (removes ~50 lines).
    - `OAuthButton.tsx`: Google OAuth button with loading state and disabled handling (removes ~60 lines).

  - **Design System Applied:**
    - Gradient backgrounds: `from-indigo-50 via-purple-50 to-pink-50`.
    - Glassmorphism cards: `bg-white/80 backdrop-blur-xl shadow-glass`.
    - Modern inputs: `rounded-xl`, Lucide icons, consistent focus states.
    - Framer Motion animations: page transitions, button interactions, staggered effects.

  - **UX Enhancements:**
    - Global toast notifications (react-hot-toast) replacing inline form errors.
    - Animated Lucide spinners for loading states.
    - File upload validation and visual feedback (max 5MB, PDF/PNG/JPG).
    - Registration success screens with spring animations.
    - Auto-generated user avatar (email initials) in profile header.

  - **Code Quality:**
    - Total lines reduced: 720 → 670 lines (-50 lines, -7%).
    - Removed duplicated logic across auth pages.
    - Improved maintainability via extracted reusable components.
    - Added file-size and file-type validation to prevent UX issues.

  - **Files Involved:**
    - `src/app/login/page.tsx` (refactored: 230 → 145 lines)
    - `src/app/register/page.tsx` (refactactored: 260 → 185 lines)
    - `src/app/profileUser/page.tsx` (updated: 230 → 245 lines)
    - `src/components/GoogleIcon.tsx` (new)
    - `src/components/LegalFooter.tsx` (new)
    - `src/components/AuthHeader.tsx` (new)
    - `src/components/OAuthButton.tsx` (new)

- **PDF Generator & B2B Support (C23):**

  - **Form Architecture & Implementation:**
    - Complete implementation of the conditional B2C/B2B review form using a `tipo_intestatario` discriminator.
    - B2C fields: nome, cognome, codice_fiscale, indirizzo_residenza, luogo/data di nascita.
    - B2B fields: ragione sociale, partita IVA, sede legale, contatti aziendali, dati Legale Rappresentante e Delegato.
    - File uploads fully supported: Visura Camerale, Documento LR, Delega firmata.
    - Critical fix: correct `receiver_tax_id` mapping (B2C → codice_fiscale, B2B → lr_codice_fiscale).

  - **Modular Refactoring (Day 2.5):**
    - `ReviewForm.tsx` refactored from a 1234-line monolithic component into 12 modular files.
    - Clear separation into components, hooks, utilities, and schema definitions.
    - Each component kept under ~150 lines for maintainability.
    - Improvements include easier testing, cleaner logic boundaries, and significantly reduced cognitive load.

  - **PDF Generation System:**
    - New Edge Function (800+ lines) using **pdf-lib** for runtime PDF generation.
    - B2C template: standard cancellation letter for private users.
    - B2B template: company cancellation letter with support for multiple attachments.
    - Automatic data population from database records.
    - Generated PDFs stored in `lettere-disdetta` bucket and automatically attached to PEC workflow.

  - **Duplicate Detection & Error Handling:**
    - Restores duplicate detection logic lost during refactoring.
    - Adds `DuplicateDetectionModal.tsx` with complete bypass flow via `bypassDuplicateCheck`.
    - Fixes “Body already consumed” regression by ensuring single JSON parsing.
    - Improved handling of 400 (validation) vs 409 (duplicate) errors.
    - UX flow now supports Proceed Anyway / Cancel with contextual metadata.

  - **UX Enhancements & Polish:**
    - Progress modal with multi-step visual indicators and Framer Motion animations.
    - Toast system improved with icons, severity-based durations, and actionable guidance.
    - File upload progress bars for Visura, Documento LR, Delega.
    - Dashboard retry button for FAILED cancellations.
    - Redirect and error-feedback mechanisms strengthened (missing/invalid ID, unauthorized access, incomplete data).

  - **Code Quality & Logging:**
    - Replaced 16 console statements with a structured `logger` utility (info, debug, warn, error).
    - TypeScript build fully clean (0 errors).
    - Stronger architecture with typed schemas (Zod), typed services, and safer repository calls.
    - Performance unchanged, but maintainability improved dramatically.

  - **Files Involved:**
    - `src/components/ReviewForm/index.tsx` (orchestrator)
    - `src/components/ReviewForm/components/*` (12 new modular components)
    - `src/components/ReviewForm/hooks/*` (useReviewForm, useFormSubmission, useFileUploads)
    - `supabase/functions/send-pec-disdetta/index.ts` (PDF generator + PEC workflow)
    - `src/domain/schemas.ts` (extended confirmDataSchema)
    - `src/repositories/disdetta.repository.ts` (field mapping + saving)
    - `src/services/disdetta.service.ts` (data validation, submission flow)
    - `src/components/ReviewForm/components/DuplicateDetectionModal.tsx`
    - `docs/TESTING_CHECKLIST.md` (150+ test cases documented)

- **User Onboarding (C24):**

  - **Core Infrastructure:**
    - Global onboarding state managed via `OnboardingContext` with `localStorage` persistence.
    - First-visit detection, tour state tracking, dismissed tooltips, and returning user handling.
    - Loading guard to prevent FOUC during hydration.
    - Centralized orchestration for welcome modal, tours, tooltips, and contextual help.

  - **Welcome & Entry Experience:**
    - First-visit welcome modal with glassmorphism design and animated gradient header.
    - Feature preview cards (Upload, Verify, Send) to set user expectations.
    - User-controlled persistence via “don’t show again” checkbox.
    - Multiple entry paths: start guided tour, skip onboarding, or close.
    - Fully animated with Framer Motion and click-outside handling.

  - **Always-Available Help System:**
    - Floating HelpButton fixed in bottom-right, visible across the entire app.
    - Contextual dropdown actions: restart tour, contextual page help, contact support.
    - Icon animations, glassmorphism menu, tooltip on hover.
    - Page-aware contextual help using pathname detection.

  - **Tooltip System & Form Guidance:**
    - Global tooltip provider with viewport-aware positioning and auto-flip.
    - Reusable animated Tooltip component with hover/click triggers.
    - Centralized tooltip content library (15+ entries).
    - Integrated 13+ contextual tooltips across B2C and B2B ReviewForm fields.
    - Persistence of dismissed tooltips via `localStorage`.

  - **Guided Tour System (Spotlight):**
    - Interactive multi-step onboarding tour with SVG spotlight overlay.
    - Step navigation (Next, Previous, Skip) with progress indicator.
    - Keyboard navigation support and mobile-friendly layout.
    - Smooth animations and auto-scroll to highlighted elements.
  - **Page-Specific Tours:**
    - Centralized tour configuration with dynamic route-based loading.
    - Dedicated tours for homepage, upload flow, review form, and dashboard.
    - Target element IDs added across pages for precise spotlight positioning.
    - Smart fallback tour for unsupported routes.

  - **UX & Validation Improvements:**
    - OCR-safe validation for supplier contract number.
    - Default Legal Representative selection.
    - Simplified HelpButton icon to reduce visual noise.
    - Clear separation between conceptual tooltips and technical help text.

  - **Code Quality & Architecture:**
    - Modular onboarding components (context, tooltip, tour, helpers).
    - Strong TypeScript typing across contexts, hooks, and configs.
    - Framer Motion used consistently for animations.
    - Clean z-index layering and event propagation handling.

  - **Outcome:**
    - Complete, production-ready onboarding system.
    - Clear guidance for first-time users without blocking expert users.
    - Scalable foundation for future onboarding iterations and testing.
    - Fully tested, mobile responsive, and persisted across sessions.

- **Advanced Status Tracking (C25):**

  - **Core Infrastructure:**
    - Introduced full status audit trail via `disdetta_status_history` table with triggers, RLS policies, and optimized indexes.
    - Automatic duration calculation and backfill for existing records.
    - Secure repository + service layer with ownership verification and dedicated API endpoint.

  - **Status Timeline UI:**
    - New `StatusTimeline` component (compact + expanded modes) with horizontal/vertical layouts.
    - Clear progress visualization: Upload → Review → Sent, with color-coded states and animations.
    - CONFIRMED abstracted as “In invio…” to simplify user mental model.
    - Helper utilities for timestamps, durations, and relative time.

  - **Dashboard Integration:**
    - Lazy-loaded, expandable timelines per card with intelligent caching.
    - Loading, empty, and error states with retry support.
    - No impact on initial dashboard render performance.

  - **Real-time Updates & Progress Indicators:**
    - Smart polling for non-terminal states only, network-aware and memory-safe.
    - Animated progress indicators with percentage mapping per status.
    - Estimated time remaining display for long-running steps.

  - **Performance & Reliability Improvements:**
    - Critical index and trigger optimizations (query time reduced from seconds to milliseconds).
    - Fixed RLS trigger execution via `SECURITY DEFINER`.
    - Dashboard load time reduced from timeout to sub-second.

  - **User Experience Impact:**
    - Transparent, self-explanatory status tracking reduces uncertainty and support requests.
    - Auto-updating UI removes need for manual refresh.
    - Mobile-responsive, accessible, and visually consistent with the design system.

  - **Files Involved:**
    - Database migrations and triggers for `disdetta_status_history`.
    - `StatusTimeline` and `StatusTimelineExpanded` components.
    - `useStatusPolling` hook.
    - Dashboard integration and repository updates.

- **FAQ & Help Center (C26):**

  - **Overview:**
    - Implemented a comprehensive FAQ & Help Center to reduce support requests and improve self-service onboarding.
    - Centralized answers to the most common questions across the entire disdetta flow.
    - Fully integrated with existing design system and HelpButton navigation.

  - **Features Implemented:**
    - 7 categorized sections: *Come funziona, Tempi, Costi, Problemi, Documenti, Sicurezza, Supporto*.
    - 29 structured Q&A items covering the full service lifecycle.
    - Real-time search and filtering with instant results.
    - Accordion-based Q&A with smooth expand/collapse animations.
    - Category navigation with scroll-to-section behavior.
    - Mobile-first responsive layout.
    - Prominent “Contatta Supporto” CTA for unresolved issues.

  - **UX & Design System:**
    - Gradient background: indigo → purple → pink.
    - Glassmorphism cards with backdrop blur.
    - Category pills with icons and item counts (Lucide icons).
    - Accordion chevron rotation animation for visual feedback.
    - Sticky category navigation for long scrolling sessions.
    - Smooth scroll behavior between sections.

  - **Technical Implementation:**
    - Strongly typed FAQ data model with TypeScript interfaces.
    - Optimized filtering using `useMemo`.
    - Framer Motion for accordion and interaction animations.
    - Semantic HTML structure for accessibility and SEO.
    - Color-coded categories for visual grouping and clarity.

  - **Content Coverage:**
    - How it works: 3 items
    - Timing & procedures: 3 items
    - Costs & payments: 3 items
    - Common problems: 4 items
    - Required documents: 3 items
    - Security & privacy: 3 items
    - Support: 3 items
    - Additional FAQs: 7 items

  - **SEO & Discoverability:**
    - Page title: *FAQ & Centro Assistenza | DisdEasy*.
    - Optimized meta description with relevant keywords.
    - Semantic structure for improved indexing and readability.

  - **User Experience Impact:**
    - Reduced dependency on direct support.
    - Faster access to answers during critical steps.
    - Clear, concise explanations written in Italian.
    - Seamless escalation path to human support when needed.

  - **Files Involved:**
    - `src/data/faqData.ts` (FAQ content and structure)
    - `src/app/faq/page.tsx` (FAQ page implementation)

- **GDPR Privacy Controls (C28):**

  - **Overview:**
    - Implemented GDPR-compliant user data controls enabling full data portability and right to erasure.
    - New privacy section in user profile with clear actions and strong safety guarantees.

  - **Features Implemented:**
    - **Data Export (Art. 20):**
      - Download of complete, machine-readable JSON with all user data.
      - Includes profile, disdette, status history, and metadata.
      - File naming: `DisdEasy-dati-YYYY-MM-DD.json`.
    - **Account Deletion (Art. 17):**
      - Permanent, verified account deletion with full cascade cleanup.
      - Two-step confirmation flow to prevent accidental erasure.

  - **Privacy & Data – Profile Integration:**
    - Dedicated "Privacy & Dati" section in profile page.
    - Shield icon for visual separation and trust signaling.
    - Primary action: **Scarica i miei dati**.
    - Danger zone action: **Elimina il mio account**.
    - Fully responsive layout (desktop + mobile).

  - **Data Export – Technical Details:**
    - Authenticated API: `GET /api/export-data`.
    - Aggregates all user-related tables in a single response.
    - Structured JSON output with counts and metadata.
    - GDPR-compliant portability format (machine-readable).

  - **Account Deletion – Technical Details:**
    - Authenticated API: `DELETE /api/delete-account`.
    - Two-step confirmation modal:
      1. Explicit intent confirmation (type **ELIMINA**).
      2. Password verification via Supabase Auth.
    - Secure cascade deletion:
      - User profile
      - All disdette records
      - Status history (FK cascade)
      - Uploaded identity documents
      - Uploaded bill files
      - Auth user account
    - Automatic logout and redirect after completion.

  - **Security Guarantees:**
    - Password verification required for destructive action.
    - Double confirmation prevents accidental deletion.
    - Endpoints accessible only to authenticated users.
    - Storage cleanup executed before database deletion.
    - Robust error handling and rollback-safe flow.

  - **UX & Accessibility:**
    - Clear danger-zone styling (red accents).
    - Informative descriptions for each action.
    - Loading states and success/error toasts.
    - Framer Motion animations for modals and transitions.
    - Mobile-first responsive behavior.

  - **Code Quality & Architecture:**
    - Dynamic API routes compatible with authenticated server context.
    - Correct async usage of `createServerClient`.
    - FK cascade ensures referential integrity.
    - Parallelized queries and cleanup via `Promise.all`.

  - **Files Involved:**
    - **Created:**
      - `src/components/DeleteAccountModal.tsx`
      - `src/app/api/export-data/route.ts`
      - `src/app/api/delete-account/route.ts`
    - **Modified:**
      - `src/app/profile/page.tsx`

- **Email Notification System (C31):**
  - **Problem Addressed:**
    - Users had no visibility on asynchronous processing steps (OCR completion, PEC sending, errors).
    - Required manual dashboard polling with poor UX and high uncertainty.

  - **Solution Implemented:**
    - Email notifications triggered on 3 critical status changes:
      - **PENDING_REVIEW:*- Disdetta ready for user review.
      - **SENT / TEST_SENT:*- PEC successfully sent.
      - **FAILED:*- Processing error requiring user action.

  - **Infrastructure Added:**
    - Resend-based email service with lazy-loaded client.
    - Centralized email trigger utility usable from Edge Functions, API routes, and server components.
    - Dedicated API endpoint for notification dispatch.
    - Full integration and testing guide.

  - **Email Templates:**
    - 3 production-ready, mobile-responsive HTML templates:
      - *Disdetta Ready:* green gradient header, review CTA.
      - *PEC Sent:* success styling, dashboard CTA, next-steps explanation.
      - *Processing Error:* warning styling, recovery CTAs and troubleshooting tips.
    - Consistent DisdEasy branding, support links, and accessible CTAs.

  - **Integration Completed:**
    - `process-document` Edge Function triggers *ready* and *error* emails.
    - `send-pec-disdetta` Edge Function triggers *sent* emails.
    - Error handlers consistently emit notification events.

  - **CORS & Auth Fixes:**
    - Fixed CORS issues blocking Vercel deployments via `ALLOWED_ORIGINS` secret.
    - Corrected Supabase auth propagation using cookie-aware client creation.
    - Authorization headers now properly forwarded to Edge Functions.
    - Edge Functions re-deployed with updated configuration.

  - **Technical Highlights:**
    - Resend API integration (100 emails/day free tier).
    - Type-safe email generation and dispatch.
    - Lazy-loading to avoid build-time issues.
    - Robust error handling and logging.
    - Environment-driven configuration for URLs and secrets.

  - **Files Involved:**
    - `src/lib/email/emailService.ts` (email service + templates)
    - `src/lib/email/triggerNotification.ts` (trigger helper)
    - `src/app/api/send-notification-email/route.ts` (API endpoint)
    - `docs/email-notifications-integration-guide.md` (integration guide)
    - `src/app/upload/[serviceId]/page.tsx` (auth fix)
    - `supabase/functions/process-document/index.ts` (email triggers + CORS)

  - **UX & Product Impact:**
    - Immediate user feedback on long-running processes.
    - Eliminates manual dashboard polling.
    - Professional, trust-building communication.
    - Reduced support requests and confusion.
    - Production-ready email workflow aligned with industry standards.

- **E2E Testing – Phase 1(C35):**

  - **Scope & Objectives:**
    - Introduced the first end-to-end test suite to validate critical user journeys.
    - Focus on functional correctness of the core flow and navigation stability.

  - **Test Coverage Implemented:**
    - Main flow: Upload → OCR → Review → Confirm → PEC Send ✅
    - Dashboard navigation during active flows ✅
    - Duplicate detection: test scaffold prepared (skipped due to local DB requirements).

  - **Results:**
    - Test coverage: 2/3 scenarios passing (66%).
    - All critical production user journeys fully verified.
    - Confirms end-to-end stability of the primary disdetta lifecycle.

  - **Quality Impact:**
    - Early detection of integration regressions across Upload, Review, and Dashboard.
    - Increased confidence before production releases with cost-related features.
    - Foundation ready for Phase 2 expansion (duplicate detection, edge cases).

  - **Status:**
    - Phase 1 completed and stable.
    - Phase 2 planned to extend coverage to duplicate detection and failure scenarios

- **Validation & Mobile UX Improvements (UI Polish):**

  - **Overview:**
    - Improved form validation robustness and mobile user experience across the entire platform.
    - Focused on reducing friction on small screens, fixing validation edge cases, and ensuring consistent responsive behavior.
    - Enhancements span onboarding, dashboard, footer pages, and legal/informational content.

  - **Form Validation & Schemas:**
    - Fixed *Codice Fiscale* validation to handle lowercase characters and extra whitespace.
    - Normalized CF input (trim + uppercase) before validation.
    - Applied fixes consistently across B2C and B2B form fields.
    - Updated domain schemas to align frontend and backend validation rules.

  - **Onboarding Tour System (C24):**
    - Fixed mobile overflow issues where tour content was clipped.
    - Improved positioning when the hamburger menu is open (guest and authenticated users).
    - Added proper max-height constraints and internal scrolling for small viewports.
    - Improved responsive spacing across all tour components.
    - Updated tour step configuration to be fully mobile-compatible.

  - **Welcome Modal Improvements:**
    - Reduced header height on mobile (`h-16` vs `h-32` on desktop).
    - Made modal content scrollable using `overflow-y-auto` and `flex-1`.
    - Responsive padding adjustments (`p-4 sm:p-6 lg:p-8`).
    - Added `min-h-0` to prevent flex overflow issues on mobile.

  - **Footer & Informational Pages:**
    - Removed duplicated top spacing (`pt-16`) where navbar offset was already applied.
    - Ensured consistent vertical spacing across all footer-linked pages.
    - Pages affected: *Contact, How It Works, Operators, FAQ, Privacy, Terms*.

  - **Dashboard UX Enhancements:**
    - Truncated long PDF filenames with ellipsis for better mobile readability.
    - Unified typography (`text-sm → text-base`) across breakpoints.
    - Status badges rendered as compact `inline-flex`, always showing status text.
    - Timeline layout:
      - Full-width on mobile.
      - Constrained width on desktop (`max-w-xl`).
      - Dynamic color inheritance from current status.
      - Progress bar hidden on mobile to reduce visual clutter.

  - **Footer Pages Readability:**
    - Increased scroll offset for anchor navigation (180–200px) to avoid navbar overlap.
    - Standardized responsive typography:
      - H1: `text-2xl → text-3xl`
      - H2: `text-xl → text-2xl`
      - H3: `text-lg → text-xl`
      - Body text: `text-sm → text-base`
    - Improved readability on mobile for Privacy, Terms, FAQ, Contact pages.

  - **Profile Page:**
    - Applied the same responsive typography improvements for visual consistency.

  - **User Experience Impact:**
    - Fewer validation errors caused by formatting issues.
    - Improved usability on mobile devices across all critical flows.
    - Cleaner layouts with reduced overflow and spacing inconsistencies.
    - More readable dashboards and legal pages on small screens.

  - **Files Involved:**
    - `src/domain/schemas.ts`
    - `src/components/ReviewForm/components/B2BLegalRepFields.tsx`
    - `src/components/ReviewForm/components/B2CFields.tsx`
    - `src/components/onboarding/TourStep.tsx`
    - `src/components/onboarding/TourSpotlight.tsx`
    - `src/components/onboarding/OnboardingTour.tsx`
    - `src/components/onboarding/HelpButton.tsx`
    - `src/components/onboarding/WelcomeModal.tsx`
    - `src/config/tourSteps.ts`
    - `src/components/DashboardList.tsx`
    - `src/components/StatusTimeline.tsx`
    - `src/app/contact/page.tsx`
    - `src/app/how-it-works/page.tsx`
    - `src/app/operators/page.tsx`
    - `src/app/faq/page.tsx`
    - `src/app/privacy-cookie-policy/page.tsx`
    - `src/app/terms-of-service/page.tsx`
    - `src/app/profileUser/page.tsx`

- **Homepage Redesign (C36):**

  - **Overview:**
    - Implemented a completely redesigned homepage focused on clarity, conversion, and guided onboarding.
    - Introduces interactive sections that explain the value proposition and process at a glance.
    - Fully aligned with the existing design system and onboarding flow.

  - **Features Implemented:**
    - Hero section with category selector and visual progress indicator.
    - Interactive category buttons leading directly to new disdetta creation.
    - 3-step process explanation with visual connecting lines.
    - 6 benefit cards with hover animations and visual feedback.
    - B2B promotional banner with gradient background and dedicated CTA.
    - Customer testimonials section with ratings and social proof.
    - Final conversion-focused CTA with patterned gradient overlay.
    - FAQ accordion with 7 frequently asked questions.

  - **UX & Design System:**
    - Indigo → pink gradient design system applied consistently.
    - Card-based layout with hover states and depth.
    - Clear visual hierarchy for scanning and readability.
    - Mobile-first responsive layout across all sections.
    - Interactive elements to reduce cognitive load and guide users.

  - **Technical Implementation:**
    - Framer Motion used for scroll-based and interaction animations.
    - Lucide React icons (Material Symbols fully replaced).
    - Next.js `Link` components for all internal navigation.
    - Optimized component structure for fast initial render.
    - Lightweight animations to avoid layout shifts.

  - **Performance & Build Impact:**
    - Homepage bundle size: **8.52 kB**.
    - First Load JS: **142 kB**.
    - No performance regressions detected.

  - **User Experience Impact:**
    - Clear explanation of the service in under one screen.
    - Faster user understanding of the 3-step process.
    - Improved trust through testimonials and transparency.
    - Stronger conversion via progressive CTAs and guided flow.

  - **Files Involved:**
    - `src/app/page.tsx` (complete homepage implementation)

- **Stripe Payment Enforcement & Flow Stabilization (C38):**

  - **Stripe Payment Integration:**
    - Mandatory Stripe Checkout before PEC sending; no free service usage.
    - Checkout session API with idempotency to safely handle retries.
    - Webhook handler with signature verification and secure event processing.
    - Full payment tracking in database (status, amount, method, timestamp).
    - Email confirmation sent on successful payment.
    - Review flow updated: `editing → pending_payment → paid → sending → sent`.
    - “Send PEC” action enabled only after confirmed payment.

  - **Timeline Simplification (3-Step UX):**
    - Reduced visible timeline from 5 to 3 steps.
    - Steps now shown: **Review → Payment → Sending**.
    - Removed redundant `PROCESSING` and `DRAFT` states from UI.
    - Unified background processing under a single internal status.
    - Fixed color inheritance so completed steps reflect the current status color.

  - **Duplicate Handling & Data Persistence:**
    - Fixed duplicate chronology entries caused by trigger + webhook inserts.
    - Webhook now updates existing CONFIRMED entries instead of inserting new ones.
    - Added Service Role DELETE endpoint to bypass RLS for cleanup.
    - Automatic draft deletion on modal close with cache revalidation.
    - Flow state synchronized with backend status on reload (no data loss).
    - SENT state guarded with redirect and “Already sent” messaging.

  - **Backend & Database Improvements:**
    - Added payment-related columns and indexes.
    - Corrected status defaults and enum ordering (`PENDING_PAYMENT` included).
    - Recreated trigger without unsafe `::text` casts.
    - Kept legacy `DRAFT` enum value for compatibility (unused by app).

  - **Security & Reliability:**
    - PEC Edge Function now verifies payment status before sending.
    - Idempotent Stripe session reuse via stored `stripe_session_id`.
    - Deprecated Stripe APIs removed to prevent retry failures.

  - **Files Involved:**
    - `src/app/api/stripe/*` (checkout, verification, webhook handlers)
    - `src/components/PaymentButton.tsx`
    - `src/components/StatusTimeline.tsx`
    - `src/components/ReviewForm/*` (flow state & persistence)
    - `src/repositories/disdetta.repository.ts`
    - `src/services/disdetta.service.ts`
    - `supabase/functions/send-pec-disdetta/index.ts`
    - `supabase/migrations/*_add_payment_tracking.sql`
    - `STRIPE_SETUP_GUIDE.md`

- **Mandatory Identity Document & PDF Merge (C39):**

  - **Documento Identità – B2C Enforcement:**
    - Added mandatory **documento di identità** upload for B2C users in Review flow.
    - Auto-population from user profile when available, with replacement support.
    - Submission blocked if document is missing (B2C only).
    - Identity documents uploaded to `documenti-identita` bucket.
    - Persisted `documento_identita_path` in `profiles` table for future reuse.
    - Removed hard dependency from middleware (profile document now optional).

  - **Review Form & Upload Flow Enhancements:**
    - Extended `B2CFields` with identity document input and preview.
    - Unified file upload handling via `useFileUploads`.
    - Improved form orchestration and validation flow in ReviewForm.
    - Delega checkbox auto-checked after successful payment (CONFIRMED / SENT).

  - **PDF Generation & Merge Pipeline:**
    - Introduced `mergePDFs` helper in `send-pec-disdetta` Edge Function.
    - Automatic merge of **Delega + Documento Identità** into single PDF.
    - Generated `delega_con_documento.pdf` stored in `lettere-disdetta` bucket.
    - Merged PDF included in PEC attachments array.
    - Fixed initialization-order bug (`Cannot access before initialization`).

  - **Upload Page UX Improvements:**
    - Replaced technical identifiers `(ID: x)` with readable `Operator – Service Type`.
    - Fetch and display `service_types` and `operators` metadata.
    - Added loading state for service information fetch.

  - **Edge Function Deployment & Validation:**
    - Deployed updated `send-pec-disdetta` with PDF merge support.
    - End-to-end test confirmed successful merged PDF generation and PEC attachment.

  - **Files Involved:**
    - `src/components/ReviewForm/components/B2CFields.tsx`
    - `src/components/ReviewForm/hooks/useFileUploads.ts`
    - `src/components/ReviewForm/hooks/useFormSubmission.ts`
    - `src/components/ReviewForm/hooks/useReviewForm.ts`
    - `src/components/ReviewForm/index.tsx`
    - `src/app/upload/[serviceId]/page.tsx`
    - `src/middleware.ts`
    - `supabase/functions/send-pec-disdetta/index.ts`
