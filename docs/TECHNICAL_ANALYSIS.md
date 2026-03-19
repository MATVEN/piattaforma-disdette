# 🔍 ANALISI TECNICA PROGETTO - Piattaforma Disdette
## 📊 STACK TECNOLOGICO ATTUALE
### **Frontend**
- ✅ Next.js 14.2.5 (App Router)
- ✅ React 18.3.1
- ✅ TypeScript 5 (strict mode)
- ✅ Tailwind CSS 3.4.6 + @tailwindcss/forms
- ✅ Framer Motion 12.23.24 (animazioni)
- ✅ Lucide React 0.554.0 (icone)
- ✅ React Hook Form 7.52.1 + Zod 3.23.8 (validazione)
- ✅ React Hot Toast 2.6.0 (notifiche)

### **Backend**
- ✅ Supabase Client 2.44.4
- ✅ Supabase SSR 0.7.0
- ✅ Supabase Edge Functions (Deno runtime)
  - `process-document` (OCR Google Document AI)
  - `send-pec-disdetta` (invio PEC + PDF generation)

### **Architecture**
- ✅ Repository Pattern (`src/repositories/`)
- ✅ Service Layer (`src/services/`)
- ✅ Domain Schemas (`src/domain/schemas.ts`)
- ✅ Custom Hooks (`src/hooks/`)
- ✅ Error Handling (`src/lib/errors/`)
- ✅ Middleware protection (`src/middleware.ts`)

### **Security**
- ✅ Security headers (next.config.js)
- ✅ RLS Policies (Supabase)
- ✅ Auth Context centralizzato
- ✅ TypeScript strict mode

---

## 🏗️ STRUTTURA PROGETTO

```
piattaforma-disdette/
│
├── docs/                      # Documentazione progetto
│   ├── FEATURES.md
│   ├── ROADMAP-LOG.md
│   ├── TECHNICAL_ANALYSIS.md
│   ├── TESTING.md / TESTING_CHECKLIST.md
│   ├── REFACTORING-REVIEWFORM.md
│   ├── STRIPE_SETUP_GUIDE.md
│   ├── email-notifications-integration-guide.md
│   └── add-operator-guide.md
│
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── api/                      # API Routes (REST endpoints)
│   │   │   ├── confirm-data/         # Conferma dati estratti
│   │   │   ├── contact/              # Form contatto
│   │   │   ├── delete-account/       # Eliminazione account
│   │   │   ├── delete-disdetta/      # Eliminazione disdetta
│   │   │   ├── download-documentation/ # Download PDF disdetta
│   │   │   ├── export-data/          # Export dati utente
│   │   │   ├── get-extracted-data/   # Recupero dati OCR
│   │   │   ├── get-my-disdette/      # Lista disdette utente
│   │   │   ├── get-status-history/   # Storico stati
│   │   │   ├── preview-delega/       # Anteprima delega
│   │   │   ├── send-followup/        # Email di followup
│   │   │   ├── send-notification-email/ # Notifiche email
│   │   │   ├── send-pec/             # Invio PEC
│   │   │   ├── validate-document/    # Validazione documento contratto
│   │   │   ├── validate-identity-document/ # Validazione doc identità
│   │   │   └── stripe/               # Pagamenti Stripe
│   │   │       ├── create-checkout/
│   │   │       ├── create-payment-intent/
│   │   │       ├── verify-session/
│   │   │       └── webhook/
│   │   │
│   │   ├── dashboard/                # Dashboard utente
│   │   ├── login/                    # Login page
│   │   ├── register/                 # Registrazione
│   │   ├── reset-password/           # Reset password
│   │   ├── update-password/          # Aggiornamento password
│   │   ├── new-disdetta/             # Wizard nuova disdetta
│   │   ├── profileUser/              # Profilo utente
│   │   ├── review/                   # Review & conferma
│   │   ├── upload/                   # Upload documenti
│   │   │   └── [serviceId]/          # Upload per servizio
│   │   ├── operators/                # Pagina operatori
│   │   ├── contact/                  # Pagina contatti
│   │   ├── faq/                      # FAQ
│   │   ├── how-it-works/             # Come funziona
│   │   ├── who-we-are/               # Chi siamo
│   │   ├── consumer-protection/      # Tutela consumatori
│   │   ├── privacy-cookie-policy/    # Privacy & cookie
│   │   ├── terms-of-service/         # Termini di servizio
│   │   ├── error.tsx                 # Error boundary
│   │   ├── global-error.tsx          # Global error boundary
│   │   ├── not-found.tsx             # 404
│   │   ├── layout.tsx                # Root layout + providers
│   │   └── globals.css               # Tailwind + custom styles
│   │
│   ├── components/                   # React components
│   │   ├── ReviewForm/               # Form revisione (refactored)
│   │   │   ├── components/           # Sotto-componenti
│   │   │   │   ├── B2BCompanyFields.tsx
│   │   │   │   ├── B2BDocumentsSection.tsx
│   │   │   │   ├── B2BLegalRepFields.tsx
│   │   │   │   ├── B2CFields.tsx
│   │   │   │   ├── DelegationCheckbox.tsx
│   │   │   │   ├── DuplicateDetectionModal.tsx
│   │   │   │   ├── ProgressModal.tsx
│   │   │   │   ├── SubmitButton.tsx
│   │   │   │   ├── SupplierFields.tsx
│   │   │   │   └── TipoIntestatarioSelector.tsx
│   │   │   ├── hooks/                # Hook locali del form
│   │   │   │   ├── useFileUploads.ts
│   │   │   │   ├── useFormSubmission.ts
│   │   │   │   └── useReviewForm.ts
│   │   │   └── index.tsx             # Entry point
│   │   │
│   │   ├── onboarding/               # Tour guidato
│   │   │   ├── HelpButton.tsx
│   │   │   ├── OnboardingTour.tsx
│   │   │   ├── Tooltip.tsx
│   │   │   ├── TourSpotlight.tsx
│   │   │   ├── TourStep.tsx
│   │   │   └── WelcomeModal.tsx
│   │   │
│   │   ├── AuthHeader.tsx            # Header pagine auth
│   │   ├── DashboardList.tsx         # Lista disdette dashboard
│   │   ├── DeleteAccountModal.tsx    # Modal eliminazione account
│   │   ├── EmbeddedPaymentForm.tsx   # Form pagamento Stripe embedded
│   │   ├── FileUploadField.tsx       # Campo upload file
│   │   ├── Footer.tsx                # Footer pubblico
│   │   ├── GoogleIcon.tsx            # Icona Google (OAuth)
│   │   ├── InfiniteScrollTrigger.tsx # Trigger scroll infinito
│   │   ├── LegalFooter.tsx           # Footer legale
│   │   ├── Navbar.tsx                # Barra di navigazione
│   │   ├── OAuthButton.tsx           # Bottone OAuth
│   │   ├── OnboardingSteps.tsx       # Step onboarding
│   │   ├── StatusTimeline.tsx        # Timeline stati (compact)
│   │   ├── StatusTimelineExpanded.tsx         # Timeline espansa
│   │   ├── StatusTimelineExpandedSkeleton.tsx # Skeleton loader timeline
│   │   └── ToastProvider.tsx         # Toast wrapper
│   │
│   ├── config/                       # Configurazioni statiche
│   │   ├── onboardingSteps.ts        # Step onboarding utente
│   │   └── tourSteps.ts              # Step tour guidato
│   │
│   ├── constants/                    # Costanti applicazione
│   │   └── tooltipContent.ts         # Testi tooltip
│   │
│   ├── context/                      # React Context
│   │   ├── AuthContext.tsx           # Stato autenticazione
│   │   ├── OnboardingContext.tsx     # Stato onboarding
│   │   └── TooltipContext.tsx        # Stato tooltip
│   │
│   ├── data/                         # Dati statici
│   │   └── faqData.ts                # Contenuto FAQ
│   │
│   ├── domain/                       # Dominio applicativo
│   │   └── schemas.ts                # Zod schemas validazione
│   │
│   ├── hooks/                        # Custom React hooks
│   │   ├── useInfiniteScroll.ts      # Paginazione scroll
│   │   └── useStatusPolling.ts       # Polling stato disdetta
│   │
│   ├── lib/                          # Utilities & helpers
│   │   ├── email/                    # Servizio email
│   │   │   ├── emailService.ts
│   │   │   └── triggerNotification.ts
│   │   ├── errors/                   # Classi errore custom
│   │   │   └── AppError.ts
│   │   ├── stripe/                   # Integrazione Stripe
│   │   │   ├── stripe-client.ts      # Client lato browser
│   │   │   ├── stripe-config.ts      # Configurazione prezzi
│   │   │   └── stripe-server.ts      # Client lato server
│   │   ├── supabase/                 # Supabase client factory
│   │   │   ├── database.types.ts     # Tipi generati DB
│   │   │   └── server.ts             # Client SSR
│   │   ├── logger.ts                 # Logger centralizzato
│   │   ├── supabaseClient.ts         # Client legacy (browser)
│   │   ├── toast.ts                  # Utilities toast
│   │   └── utils/                    # Utility generiche
│   │
│   ├── repositories/                 # Data access layer
│   │   ├── disdetta.repository.ts    # Query disdette
│   │   └── statusHistory.repository.ts # Query storico stati
│   │
│   ├── services/                     # Business logic layer
│   │   ├── auth.service.ts           # Operazioni autenticazione
│   │   ├── disdetta.service.ts       # Operazioni disdetta
│   │   └── statusHistory.service.ts  # Operazioni storico stati
│   │
│   ├── types/                        # TypeScript types
│   │   ├── enums.ts                  # Enum condivisi
│   │   ├── statusHistory.ts          # Tipi storico stati
│   │   └── tour.ts                   # Tipi tour guidato
│   │
│   └── middleware.ts                 # Protezione routes
│
├── supabase/
│   ├── functions/                    # Edge Functions (Deno)
│   │   ├── process-document/         # OCR + estrazione dati
│   │   └── send-pec-disdetta/        # Invio PEC + generazione PDF
│   ├── migrations/                   # Migration SQL
│   │   ├── 20250101000000_create_contact_messages.sql
│   │   ├── 20251128_add_b2b_support.sql
│   │   ├── 20260108000000_add_payment_tracking.sql
│   │   ├── 20260306100000_add_service_type_id_to_disdette.sql
│   │   └── 20260319000000_remove_service_types.sql
│   └── config.toml                   # Configurazione Supabase
│
├── src/__tests__/                    # Unit & integration tests
│   ├── domain/schemas.test.ts
│   ├── repositories/disdetta.repository.test.ts
│   ├── services/disdetta.service.test.ts
│   └── utils/testHelpers.ts
│
├── tests/                            # E2E tests (Playwright)
│   ├── e2e/
│   │   ├── main-flow.spec.ts
│   │   └── duplicate-detection.spec.ts
│   ├── fixtures/                     # File di test
│   └── helpers/auth.ts               # Helper autenticazione test
│
├── public/                           # Asset statici
│   └── images/disdeasy-logo.png
├── CLAUDE.md                         # Istruzioni per Claude AI
├── next.config.js                    # Next.js config + security headers
├── tailwind.config.js                # Tailwind + design system
├── playwright.config.ts              # Configurazione Playwright
├── jest.config.js                    # Configurazione Jest
├── tsconfig.json                     # TypeScript config (strict)
└── package.json                      # Dipendenze

```