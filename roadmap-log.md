

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
    - Amplements `handleFormChange` and `handleSubmit` to manage submission state.
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
    - (Fase 1 - Recupero): Uses SERVICE_ROLE_KEY to fetch `extracted_data`, `profiles` data, and the `documento_delega` file.
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