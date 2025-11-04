- **Authentication (C1):**
  - Implements /login and /register pages using Supabase Auth.
  - Creates AuthContext (`AuthProvider`) to manage global user state.
  - Adds a dynamic Navbar that shows user state (login/logout).
  - Implements route protection for authenticated pages.

- **Service Selection (C2):**
  - Creates the /new-disdetta 3-step wizard page (Category -> Operator -> Service).
  - Fetches data from new Supabase tables (`categories`, `operators`, `service_types`).
  - Implements database-level security with RLS policies (read access for authenticated users).

- **File Upload (C3):**
  - Configures Supabase Storage with a private 'documenti_utente' bucket.
  - Implements storage RLS policies (INSERT for authenticated, SELECT for owner).
  - Creates the dynamic /upload/[serviceId] page.
  - Implements secure file upload, storing files under a user-scoped path (`user.id/...`).

- **Dev Ops:**
  - Installs and links the Supabase CLI in preparation for Edge Function development.

- **AI/OCR Integration (C4):**
  - Implements the core AI processing logic within a new Supabase Edge Function (v4.1).
  - Calls the Google Document AI (REST API) processor directly instead of using the client library.
  - Adds a 7-second strategic delay post-trigger to resolve the 404 Not Found race condition.
  - Replaces the failing library download with a direct fetch of the file from Storage.
  - Implements manual Base64 file conversion, resolving the 400 Bad Request and library crashes.
  - Adds Google OAuth Access Token generation logic for authenticating the AI API call.
  - Successfully logs the extracted entities (supplier_tax_id, receiver_tax_id, supplier_iban) from the test document.

- **Dev Ops:**
  - Deploys the (v4.1) Edge Function to the Supabase project for live testing.

- **Data Persistence & Review (C5):**
Backend:
  - Creates 'extracted_data' table with RLS policies.
  - Modifies 'process-document' Edge Function to save AI entities to the new table.
  - Adds a new secure API route '/api/get-extracted-data' to fetch results via RLS.

Frontend:
  - Modifies 'UploadPage' (C3) to invoke the function and redirect to the review page.
  - Creates the new '/review' page (C5) with Suspense.
  - Creates the 'ReviewForm' component to fetch and display the extracted data.

- **Dev Ops:**
 - Redeploys the process-document Edge Function with C5 logic (DB write).
 - Configures CORS on the Edge Function to allow http://localhost:3000 (resolving 405/500 errors).

- **Data Confirmation and Update (C6)**
Frontend:
  - Converts 'ReviewForm' (C5) into a controlled component using 'useState'.
  - Removes 'readOnly' and 'disabled' attributes from the form.
  - Adds 'handleFormChange' to update form state as the user types.
  - Implements 'handleSubmit' to manage submission state ('isSubmitting', 'error', 'success').
  - Redirects user to homepage upon successful submission.

Backend:
  - Creates the new API route '/api/confirm-data' (PATCH).
  - The new endpoint uses 'createServerClient' (ANON_KEY) to securely authenticate the user from cookies.
  - Implements a safe 'setAll' cookie adapter to allow for token refreshes.
  - On success, the API updates the 'extracted_data' record with user-supplied data and sets the 'status' to 'CONFIRMED'.
  - Enforces RLS by matching 'user_id' during the 'update' query.

- **User Dashboard (C7):**
Backend:
  - Creates the new API route 'GET /api/get-my-disdette'.
  - The API securely authenticates the user (ANON_KEY + cookieAdapter) and respects RLS.
  - Fetches all records from 'extracted_data' matching the 'user_id' and orders them by creation date.

Frontend:
  - Updates 'ReviewForm' (C6) to redirect to '/dashboard' on success.
  - Creates the new '/dashboard' page (Server Component) with a 'Suspense' boundary and a link to start a new submission.
  - Creates the 'DashboardList' (Client Component) to fetch and display the list of submissions from the new API.
  - Adds a 'StatusBadge' component to show the state ('PENDING_REVIEW' or 'CONFIRMED').
  - Makes each item in the list a 'Link' pointing back to the review page.