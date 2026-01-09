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
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API Routes (REST endpoints)
│   │   ├── dashboard/         # User dashboard
│   │   ├── login/             # Login page
│   │   ├── register/          # Register page
│   │   ├── new-disdetta/      # 3-step wizard
│   │   ├── profileUser/       # User profile
│   │   ├── review/            # Review & confirm
│   │   ├── upload/[serviceId] # File upload
│   │   ├── layout.tsx         # Root layout + providers
│   │   └── globals.css        # Tailwind + custom styles
│   │
│   ├── components/            # React components
│   │   ├── DashboardList.tsx         # Dashboard cards (C16+C17 ✅)
│   │   ├── InfiniteScrollTrigger.tsx # Infinite scroll (C16 ✅)
│   │   ├── Navbar.tsx                # Navigation bar (C17 ✅)
│   │   ├── ReviewForm.tsx            # Review form (C13+C17 ✅)
│   │   └── ToastProvider.tsx         # Toast wrapper (C17 ✅)
│   │
│   ├── context/               # React Context
│   │   └── AuthContext.tsx    # Auth state management (C1+C9 ✅)
│   │
│   ├── domain/                # Business logic
│   │   └── schemas.ts         # Zod schemas (C11+C13 ✅)
│   │
│   ├── hooks/                 # Custom React hooks
│   │   └── useInfiniteScroll.ts # Pagination hook (C16 ✅)
│   │
│   ├── lib/                   # Utilities & helpers
│   │   ├── errors/            # Custom error classes (C15 ✅)
│   │   ├── supabase/          # Supabase client factory (C15 ✅)
│   │   ├── supabaseClient.ts  # Legacy client
│   │   └── toast.ts           # Toast utilities (C17 ✅)
│   │
│   ├── repositories/          # Data access layer
│   │   └── disdetta.repository.ts # DB queries (C15 ✅)
│   │
│   ├── services/              # Business logic layer
│   │   ├── auth.service.ts         # Auth operations (C15 ✅)
│   │   └── disdetta.service.ts     # Disdetta operations (C15 ✅)
│   │
│   └── middleware.ts          # Route protection (C11 ✅)
│
├── supabase/
│   ├── functions/             # Edge Functions
│   │   ├── process-document/  # OCR processing (C4+C11 ✅)
│   │   └── send-pec-disdetta/ # PEC send + PDF (C8+C11.5+C13 ✅)
│   └── config.toml            # Supabase config
│
├── public/                    # Static assets
├── next.config.js             # Next.js config + security headers ✅
├── tailwind.config.js         # Tailwind + design system (C17 ✅)
├── tsconfig.json              # TypeScript config (strict) ✅
└── package.json               # Dependencies ✅
```

---

## ✅ COMPLETAMENTI ATTUALI (da Roadmap)

| Checkpoint | Status | Note |
|-----------|--------|------|
| **C1** - Auth | ✅ | Login/Register + AuthContext |
| **C1.5** - Profile | ✅ | Profiles table + RLS + ID upload |
| **C2** - Service Selection | ✅ | 3-step wizard |
| **C3** - File Upload | ✅ | Bolletta upload (delega rimossa C13) |
| **C4** - AI/OCR | ✅ | Google Document AI integration |
| **C5** - Review | ✅ | Review page + data display |
| **C6** - Confirmation | ✅ | Data confirmation API |
| **C7** - Dashboard | ✅ | User dashboard |
| **C8** - PEC Send | ✅ | PEC logic (test mode) |
| **C9** - Profile Enforcement | ✅ | Profile completion check |
| **C10** - Google Login | ✅ | OAuth integration |
| **C11** - Security Refactor | ✅ | Zod + validation + hardening |
| **C11.5** - Security Hardening | ✅ | Dual auth + state checks |
| **C12** - Form Styling | ✅ | Tailwind forms plugin |
| **C13** - Delega PDF | ✅ | Auto-generate delega PDF |
| **C14** - OCR Error Handling | ✅ | Polling + error states |
| **C15** - Architecture Refactor | ✅ | Repository + Service pattern |
| **C16** - Infinite Scroll | ✅ | Pagination + IntersectionObserver |
| **C17** - Design System | ✅ | Modern UI + mobile optimization |

---

## 🎯 STIME AGGIORNATE PER PROSSIMI CHECKPOINT

### **C19 - PEC Real Send** ⚡
**Effort Originale:** 1 giorno  
**Effort Aggiornato:** 0.5-1 giorno

**Perché è più veloce:**
- ✅ Edge Function già esiste e funziona (`send-pec-disdetta`)
- ✅ PDF generation già implementata (pdf-lib)
- ✅ Struttura dati già pronta
- ⚠️ Solo rimuovere commenti SMTP e testare

**Task List:**
```typescript
// supabase/functions/send-pec-disdetta/index.ts
1. Uncommentare blocco SMTP (righe ~150-200)
2. Configurare variabili ambiente PEC:
   - SMTP_HOST
   - SMTP_PORT
   - SMTP_USER
   - SMTP_PASS
3. Test su casella PEC reale
4. Implementare retry logic (opzionale)
5. Deploy function
```

**Files da Modificare:**
- `supabase/functions/send-pec-disdetta/index.ts` (1 file)
- `supabase/functions/.env` (config)

---

### **C20 - Email Notifications** ⚡
**Effort Originale:** 1-2 giorni  
**Effort Aggiornato:** 2-3 giorni

**Perché richiede più tempo:**
- ❌ Nessuna integrazione email esistente
- ❌ Servizio da scegliere (Resend/SendGrid/AWS SES)
- ❌ Templates HTML da creare
- ✅ Toast system già pronto (react-hot-toast)

**Task List:**
1. **Setup Email Provider** (3-4 ore)
   - Scegliere provider (Resend consigliato)
   - Setup account + API keys
   - Configurare dominio + DNS (SPF, DKIM)
   
2. **Email Service Layer** (2-3 ore)
   ```typescript
   // src/services/email.service.ts (NUOVO)
   - sendWelcomeEmail()
   - sendDisdettaProcessing()
   - sendDisdettaSuccess()
   - sendDisdettaFailed()
   - sendPasswordReset()
   ```

3. **HTML Templates** (3-4 ore)
   ```
   // src/templates/emails/ (NUOVA CARTELLA)
   - welcome.html
   - disdetta-processing.html
   - disdetta-success.html
   - disdetta-failed.html
   - password-reset.html
   ```

4. **Integration Points** (2-3 ore)
   - Trigger dopo registrazione
   - Trigger dopo upload (status: PROCESSING)
   - Trigger dopo PEC sent (status: SENT)
   - Trigger su errori (status: FAILED)

5. **Edge Function Trigger** (opzionale, 2-3 ore)
   ```typescript
   // supabase/functions/send-email/index.ts (NUOVO)
   // Chiamato da DB triggers su cambio status
   ```

**Files Nuovi:**
- `src/services/email.service.ts`
- `src/templates/emails/` (5 templates)
- `supabase/functions/send-email/` (opzionale)

**Dipendenze da Aggiungere:**
```bash
npm install @react-email/components @react-email/render
# oppure
npm install resend
```

---

### **C21 - UI Polish (Altre Pagine)** ✨
**Effort Originale:** 2-3 giorni  
**Effort Aggiornato:** 2-3 giorni

**Perché la stima resta accurata:**
- ✅ Design system già pronto (C17 tailwind.config.js)
- ✅ Pattern già stabiliti (Navbar, DashboardList)
- ⚠️ Ma ci sono molte pagine da aggiornare

**Pages da Modernizzare:**
```
src/app/
├── login/page.tsx           (1-2 ore)
├── register/page.tsx        (1-2 ore)
├── profileUser/page.tsx     (2-3 ore)
├── review/page.tsx          (1-2 ore) - ReviewForm già fatto
├── new-disdetta/
│   ├── page.tsx             (1 ora)
│   ├── [step]/page.tsx      (2-3 ore)
│   └── layout.tsx           (1 ora)
├── upload/[serviceId]/      (1-2 ore)
└── 404.tsx / 500.tsx        (1-2 ore) - ERROR PAGES NUOVE
```

**Task per Pagina:**
1. Applicare colori C17 (primary, gradients)
2. Sostituire form inputs con stile C17
3. Aggiungere animazioni Framer Motion
4. Ottimizzare mobile layout
5. Integrare toast notifications

**Files da Modificare:** ~8-10 files

---

### **C22 - Payment Integration** 🎯
**Effort Originale:** 4-5 giorni  
**Effort Aggiornato:** 5-6 giorni

**Perché richiede più tempo:**
- ❌ Nessuna integrazione payment esistente
- ❌ Database schema da estendere
- ❌ Webhook handling complesso
- ❌ Testing payment flows

**Architettura Proposta:**
```
Backend:
├── Database Schema (NUOVO)
│   ├── payments table
│   ├── pricing table
│   └── coupons table (opzionale)
│
├── API Routes (NUOVI)
│   ├── /api/create-checkout-session
│   ├── /api/webhook/stripe
│   └── /api/get-payment-status
│
├── Services (NUOVI)
│   ├── src/services/payment.service.ts
│   └── src/services/pricing.service.ts
│
└── Edge Function (AGGIORNAMENTO)
    └── send-pec-disdetta (check payment before send)

Frontend:
├── Pages (NUOVE)
│   ├── /checkout/[disdettaId]
│   ├── /payment-success
│   └── /payment-cancel
│
└── Components (NUOVI)
    ├── CheckoutForm.tsx
    ├── PricingCard.tsx
    └── PaymentStatusBadge.tsx
```

**Task Dettagliato:**

**Day 1-2: Database + Stripe Setup**
```sql
-- Database schema (Supabase SQL Editor)
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users,
  disdetta_id INTEGER REFERENCES disdette(id),
  stripe_payment_intent_id TEXT,
  amount INTEGER, -- in cents
  currency TEXT DEFAULT 'EUR',
  status TEXT, -- pending, succeeded, failed, refunded
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE pricing (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  service_type TEXT,
  operator TEXT,
  price INTEGER, -- in cents
  currency TEXT DEFAULT 'EUR',
  active BOOLEAN DEFAULT true
);

-- RLS policies
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing ENABLE ROW LEVEL SECURITY;
```

**Day 3-4: API Routes + Payment Flow**
```typescript
// src/services/payment.service.ts
export class PaymentService {
  async createCheckoutSession(disdettaId: number, userId: string)
  async verifyPayment(paymentIntentId: string)
  async handleWebhook(event: Stripe.Event)
  async refundPayment(paymentId: string)
}

// src/app/api/create-checkout-session/route.ts
// src/app/api/webhook/stripe/route.ts
```

**Day 5: Frontend Checkout**
```typescript
// src/app/checkout/[disdettaId]/page.tsx
// Stripe Elements integration
import { Elements, PaymentElement } from '@stripe/react-stripe-js'
```

**Day 6: Testing + Integration**
- Test payment flow completo
- Test webhook con Stripe CLI
- Integrare check pagamento in send-pec-disdetta
- Error handling per pagamenti falliti

**Dipendenze da Aggiungere:**
```bash
npm install stripe @stripe/stripe-js @stripe/react-stripe-js
```

**Files Nuovi:**
- `src/services/payment.service.ts`
- `src/services/pricing.service.ts`
- `src/app/api/create-checkout-session/route.ts`
- `src/app/api/webhook/stripe/route.ts`
- `src/app/checkout/[disdettaId]/page.tsx`
- `src/app/payment-success/page.tsx`
- `src/app/payment-cancel/page.tsx`
- `src/components/CheckoutForm.tsx`
- Database migrations (SQL)

---

### **C18 - Guest Checkout Flow** 🎯
**Effort Originale:** 4-5 giorni  
**Effort Aggiornato:** 5-6 giorni

**Perché richiede più tempo:**
- ⚠️ Richiede refactoring di molti componenti esistenti
- ⚠️ Dual mode (auth/guest) complesso
- ⚠️ Migration flow da guest a user
- ✅ Ma architettura già pulita facilita

**Prerequisito CRITICO:** C22 Payment deve essere completato prima

**Task Dettagliato:**

**Day 1: Session Management**
```typescript
// src/lib/session.ts (NUOVO)
export class GuestSessionManager {
  createGuestSession(): string // returns sessionId
  getGuestSession(): string | null
  clearGuestSession(): void
  isGuestMode(): boolean
}

// Cookie-based o localStorage
// Pattern: guest_[uuid]
```

**Day 2: Database Schema**
```sql
-- Modifiche a disdette
ALTER TABLE disdette 
ADD COLUMN is_guest BOOLEAN DEFAULT false,
ADD COLUMN guest_session_id TEXT,
ADD COLUMN guest_email TEXT;

-- Indice per query performance
CREATE INDEX idx_guest_sessions ON disdette(guest_session_id) 
WHERE is_guest = true;

-- RLS policy update per guest access
```

**Day 3-4: Auth Flow Refactoring**
```typescript
// src/middleware.ts (AGGIORNAMENTO)
// Rimuovere auth requirement da:
// - /new-disdetta
// - /upload/[serviceId]
// - /review (con limitazioni)

// src/services/disdetta.service.ts (AGGIORNAMENTO)
// Tutti i metodi devono supportare:
// - userId (authenticated)
// - guestSessionId (guest)

// Esempio:
async getMyDisdette(params: {
  userId?: string
  guestSessionId?: string
  page: number
  pageSize: number
})
```

**Day 5: Checkout Decision Point**
```typescript
// src/app/checkout/[disdettaId]/page.tsx
// UI per scelta:
// - "Hai già un account? Accedi"
// - "Continua come ospite"

// src/components/GuestCheckoutForm.tsx (NUOVO)
// Form per guest con email obbligatoria
```

**Day 6: Migration Flow + Public Tracking**
```typescript
// src/services/guest-migration.service.ts (NUOVO)
export class GuestMigrationService {
  async claimGuestDisdetta(
    userId: string, 
    guestSessionId: string
  ): Promise<void>
}

// src/app/track/[orderId]/page.tsx (NUOVO)
// Public page per tracking ordine guest
// Accessibile via magic link inviato per email
```

**Files Nuovi/Modificati:**
- `src/lib/session.ts` (NUOVO)
- `src/services/guest-migration.service.ts` (NUOVO)
- `src/app/track/[orderId]/page.tsx` (NUOVO)
- `src/components/GuestCheckoutForm.tsx` (NUOVO)
- `src/middleware.ts` (MODIFICA significativa)
- `src/services/disdetta.service.ts` (MODIFICA significativa)
- `src/repositories/disdetta.repository.ts` (MODIFICA)
- Database migrations (SQL)

---

### **C23 - Search & Filters** ✨
**Effort Originale:** 2-3 giorni  
**Effort Aggiornato:** 2 giorni

**Perché è più veloce:**
- ✅ Infinite scroll già implementato (C16)
- ✅ API pagination già pronta
- ✅ Solo estendere query params

**Task List:**

**Day 1: Backend Filtering**
```typescript
// src/repositories/disdetta.repository.ts (AGGIORNAMENTO)
async getByUser(params: {
  userId: string
  page: number
  pageSize: number
  // NUOVI filtri:
  status?: string[]
  operator?: string
  category?: string
  dateFrom?: string
  dateTo?: string
  search?: string // search in file_path
}) {
  let query = this.supabase
    .from('disdette')
    .select('*', { count: 'exact' })
    .eq('user_id', userId)
  
  // Applicare filtri dinamicamente
  if (params.status) query = query.in('status', params.status)
  if (params.operator) query = query.eq('supplier_name', params.operator)
  if (params.search) query = query.ilike('file_path', `%${params.search}%`)
  // etc...
}
```

**Day 2: Frontend UI**
```typescript
// src/components/DashboardFilters.tsx (NUOVO)
export function DashboardFilters({ 
  onFilterChange 
}: {
  onFilterChange: (filters: FilterState) => void
}) {
  // Search input
  // Status multi-select
  // Date range picker
  // Sort dropdown
}

// src/components/DashboardList.tsx (AGGIORNAMENTO)
// Integrare con useInfiniteScroll hook
// Passare filtri alla fetchFunction
```

**Files Nuovi:**
- `src/components/DashboardFilters.tsx`
- `src/components/SearchBar.tsx`
- `src/components/FilterDropdown.tsx`

**Files Modificati:**
- `src/repositories/disdetta.repository.ts`
- `src/services/disdetta.service.ts`
- `src/components/DashboardList.tsx`
- `src/app/api/get-my-disdette/route.ts`

**Dipendenze (opzionali):**
```bash
npm install react-select date-fns
# oppure usare native HTML selects
```

---

### **C24 - Admin Dashboard** 🎯
**Effort Originale:** 5-7 giorni  
**Effort Aggiornato:** 6-8 giorni

**Perché richiede più tempo:**
- ❌ Completamente nuovo modulo
- ❌ RBAC da implementare
- ❌ Multiple pages con CRUD
- ✅ Ma repository pattern facilita

**Prerequisiti:** C20 (Email), C22 (Payment)

**Architettura Proposta:**
```
Database:
├── admin_users table (o flag is_admin in profiles)
└── admin_notes table (note interne per disdette)

Backend:
├── src/services/admin.service.ts (NUOVO)
├── src/repositories/admin.repository.ts (NUOVO)
└── src/middleware.ts (aggiungere admin check)

Frontend:
├── src/app/admin/ (NUOVO)
│   ├── layout.tsx (admin layout)
│   ├── page.tsx (dashboard overview)
│   ├── disdette/page.tsx (tutte le disdette)
│   ├── users/page.tsx (gestione utenti)
│   ├── analytics/page.tsx (metriche)
│   └── settings/page.tsx (configurazione)
└── src/components/admin/ (NUOVO)
    ├── AdminSidebar.tsx
    ├── StatsCards.tsx
    ├── DisdettaTable.tsx
    ├── UserTable.tsx
    └── NotesPanel.tsx
```

**Day 1-2: RBAC + Database**
```sql
-- Opzione 1: Flag in profiles
ALTER TABLE profiles ADD COLUMN is_admin BOOLEAN DEFAULT false;

-- Opzione 2: Tabella separata (più flessibile)
CREATE TABLE admin_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users UNIQUE,
  role TEXT DEFAULT 'admin', -- admin, superadmin, support
  permissions JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Note interne
CREATE TABLE admin_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  disdetta_id INTEGER REFERENCES disdette(id),
  admin_id UUID REFERENCES auth.users,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

**Day 3-4: Admin Services**
```typescript
// src/services/admin.service.ts
export class AdminService {
  async getAllDisdette(filters: AdminFilters)
  async getAllUsers(filters: UserFilters)
  async updateDisdettaStatus(id: number, status: string, note?: string)
  async getAnalytics(dateRange: DateRange)
  async exportData(filters: ExportFilters)
  async addNote(disdettaId: number, note: string)
}
```

**Day 5-6: Admin UI Pages**
```typescript
// src/app/admin/page.tsx - Dashboard Overview
// - KPIs cards (totale disdette, success rate, revenue)
// - Grafici (Chart.js o Recharts)
// - Recent activity feed

// src/app/admin/disdette/page.tsx - All Disdette
// - Tabella con tutte le disdette (paginata)
// - Filtri avanzati
// - Azioni bulk (cambio status, delete)
// - View PDF documents
// - Add internal notes

// src/app/admin/users/page.tsx - User Management
// - User table
// - Search & filters
// - Ban/unban users
// - View user activity
```

**Day 7-8: Advanced Features**
- Export CSV/Excel
- Email alerts per disdette failed
- Report scheduling
- Audit log

**Dipendenze da Aggiungere:**
```bash
npm install recharts xlsx
# oppure
npm install chart.js react-chartjs-2
```

**Files Nuovi:** ~15-20 files

---

### **C25 - Analytics & Tracking** ✨
**Effort Originale:** 2 giorni  
**Effort Aggiornato:** 1-2 giorni

**Perché è veloce:**
- ✅ Next.js script component già disponibile
- ✅ GA4 setup molto semplice

**Task List:**

**Setup (1-2 ore):**
1. Creare account Google Analytics 4
2. Ottenere Measurement ID (G-XXXXXXXXXX)
3. Configurare dominio e stream

**Implementation (2-3 ore):**
```typescript
// src/app/layout.tsx (AGGIORNAMENTO)
import Script from 'next/script'

export default function RootLayout({ children }) {
  return (
    <html>
      <head>
        <Script
          strategy="afterInteractive"
          src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`}
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}');
          `}
        </Script>
      </head>
      <body>{children}</body>
    </html>
  )
}
```

**Custom Events (2-3 ore):**
```typescript
// src/lib/analytics.ts (NUOVO)
export const trackEvent = (
  eventName: string,
  eventParams?: Record<string, any>
) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', eventName, eventParams)
  }
}

// Usage:
trackEvent('disdetta_created', { 
  service_type: 'energia',
  operator: 'Enel'
})
trackEvent('payment_completed', { 
  amount: 9.99 
})
trackEvent('pec_sent', { 
  disdetta_id: 123 
})
```

**Integration Points (2-3 ore):**
- `/register` → track sign_up
- `/new-disdetta` → track begin_checkout
- `/checkout` → track purchase
- `/dashboard` → track PEC sent

**Privacy Compliance (1-2 ore):**
```typescript
// src/components/CookieBanner.tsx (NUOVO)
// Banner per consenso cookie GDPR
```

**Files Nuovi:**
- `src/lib/analytics.ts`
- `src/components/CookieBanner.tsx`
- `.env.local` (add NEXT_PUBLIC_GA_ID)

---

### **C26 - Performance Optimization** ✨
**Effort Originale:** 2-3 giorni  
**Effort Aggiornato:** 2-3 giorni

**Current Performance (Assumptions):**
- Lighthouse Score: ~70-80
- Bundle Size: ~300-400KB
- API Response: ~200-500ms

**Target:**
- Lighthouse Score: 90+
- Bundle Size: <200KB
- API Response: <150ms

**Task per Area:**

**Frontend Optimization (Day 1):**
```bash
# Analisi bundle
npm install --save-dev @next/bundle-analyzer

# next.config.js
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

# Run analysis
ANALYZE=true npm run build
```

**Optimizations:**
1. Dynamic imports per pagine pesanti
2. Image optimization (Next/Image)
3. Font optimization (next/font)
4. Code splitting strategico
5. Rimuovere dipendenze inutilizzate

**Backend Optimization (Day 2):**
```typescript
// API Response Caching
// src/app/api/get-my-disdette/route.ts
export const revalidate = 60 // Cache for 60s

// Database query optimization
// Aggiungere indici:
CREATE INDEX idx_user_disdette ON disdette(user_id, created_at DESC);
CREATE INDEX idx_status ON disdette(status);

// Supabase Edge Function optimization
// - Reduce cold starts
// - Connection pooling
```

**Monitoring Setup (Day 3):**
```bash
# Vercel Analytics
npm install @vercel/analytics

# Sentry (error tracking)
npm install @sentry/nextjs
```

**Files Modificati:**
- `next.config.js` (bundle analyzer + image optimization)
- `src/app/layout.tsx` (font optimization)
- Various components (dynamic imports)
- Database (add indexes)

---

## 📊 CONFRONTO STIME: ORIGINALE vs AGGIORNATO

| Checkpoint | Stima Originale | Stima Aggiornata | Delta | Note |
|-----------|-----------------|------------------|-------|------|
| **C19** PEC Real | 1d | 0.5-1d | ✅ Più veloce | Edge function già pronta |
| **C20** Email | 2d | 2-3d | ⚠️ Più lungo | Nessuna infra esistente |
| **C21** UI Polish | 3d | 2-3d | ✅ Accurata | Design system pronto |
| **C22** Payment | 5d | 5-6d | ⚠️ Più lungo | Setup complesso |
| **C18** Guest Flow | 5d | 5-6d | ⚠️ Più lungo | Refactoring esteso |
| **C23** Search | 3d | 2d | ✅ Più veloce | Infra C16 già pronta |
| **C24** Admin | 7d | 6-8d | ⚠️ Variabile | Dipende da scope |
| **C25** Analytics | 2d | 1-2d | ✅ Accurata | Setup semplice |
| **C26** Performance | 3d | 2-3d | ✅ Accurata | - |

**Totale Effort (tutti i checkpoint):**
- **Originale:** ~32 giorni
- **Aggiornato:** ~32-38 giorni
- **Delta:** +0-6 giorni (dipende da scope C24)

---

## 🎯 RACCOMANDAZIONI FINALI

### **1. Dependencies da Installare per Checkpoint**

**C20 (Email):**
```bash
npm install resend
# oppure
npm install @sendgrid/mail
```

**C22 (Payment):**
```bash
npm install stripe @stripe/stripe-js @stripe/react-stripe-js
```

**C23 (Search - opzionale):**
```bash
npm install date-fns
```

**C24 (Admin):**
```bash
npm install recharts xlsx
```

**C25 (Analytics):**
```bash
npm install @vercel/analytics
npm install @sentry/nextjs
```

**C26 (Performance):**
```bash
npm install --save-dev @next/bundle-analyzer
```

---

### **2. Struttura Files Futura (Post C18-C26)**

```
piattaforma-disdette/
│
├── src/
│   ├── app/
│   │   ├── admin/              # C24 (6-8d) ✨ NUOVO
│   │   ├── checkout/           # C22 (5-6d) ✨ NUOVO
│   │   ├── payment-success/    # C22 (5-6d) ✨ NUOVO
│   │   ├── track/[orderId]/    # C18 (5-6d) ✨ NUOVO
│   │   └── ... (existing)
│   │
│   ├── components/
│   │   ├── admin/              # C24 ✨ NUOVO
│   │   ├── CheckoutForm.tsx    # C22 ✨ NUOVO
│   │   ├── CookieBanner.tsx    # C25 ✨ NUOVO
│   │   ├── DashboardFilters.tsx # C23 ✨ NUOVO
│   │   └── ... (existing)
│   │
│   ├── services/
│   │   ├── admin.service.ts         # C24 ✨ NUOVO
│   │   ├── email.service.ts         # C20 ✨ NUOVO
│   │   ├── guest-migration.service.ts # C18 ✨ NUOVO
│   │   ├── payment.service.ts       # C22 ✨ NUOVO
│   │   ├── pricing.service.ts       # C22 ✨ NUOVO
│   │   └── ... (existing)
│   │
│   ├── repositories/
│   │   ├── admin.repository.ts  # C24 ✨ NUOVO
│   │   └── ... (existing)
│   │
│   ├── lib/
│   │   ├── analytics.ts        # C25 ✨ NUOVO
│   │   ├── session.ts          # C18 ✨ NUOVO
│   │   └── ... (existing)
│   │
│   └── templates/
│       └── emails/             # C20 ✨ NUOVO
│           ├── welcome.html
│           ├── disdetta-processing.html
│           ├── disdetta-success.html
│           └── ... (5 templates)
│
└── supabase/
    └── functions/
        └── send-email/         # C20 (opzionale) ✨ NUOVO
```

---

### **3. Database Schema Expansion**

**Nuove Tabelle da Creare:**

**C20 (Email):** *Nessuna (usa provider esterno)*

**C22 (Payment):**
```sql
CREATE TABLE payments (...);
CREATE TABLE pricing (...);
CREATE TABLE coupons (...); -- opzionale
```

**C18 (Guest Flow):**
```sql
ALTER TABLE disdette ADD COLUMN is_guest BOOLEAN;
ALTER TABLE disdette ADD COLUMN guest_session_id TEXT;
ALTER TABLE disdette ADD COLUMN guest_email TEXT;
```

**C24 (Admin):**
```sql
CREATE TABLE admin_users (...);
CREATE TABLE admin_notes (...);
```

---

### **4. Environment Variables da Configurare**

**Attuali (.env.local già presente):**
```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

**Da Aggiungere:**

**C19 (PEC):**
```bash
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
```

**C20 (Email):**
```bash
RESEND_API_KEY=
# oppure
SENDGRID_API_KEY=
```

**C22 (Payment):**
```bash
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
```

**C25 (Analytics):**
```bash
NEXT_PUBLIC_GA_ID=
SENTRY_DSN=
```

---

### **5. Priorità Investimento Tempo**

**Must-Have (Blocker per Launch):**
1. ⚡ **C19** - PEC Real Send (0.5-1d) - CRITICO
2. 🎯 **C22** - Payment (5-6d) - CRITICO per monetizzazione
3. ⚡ **C20** - Email (2-3d) - ALTO per UX

**Should-Have (Nice-to-Have ma importante):**
4. 🎯 **C18** - Guest Flow (5-6d) - ALTO per conversione
5. ✨ **C21** - UI Polish (2-3d) - MEDIO per brand
6. ✨ **C23** - Search (2d) - MEDIO per power users

**Could-Have (Post-Launch):**
7. 🎯 **C24** - Admin (6-8d) - Dipende da volume operativo
8. ✨ **C25** - Analytics (1-2d) - BASSO ma utile
9. ✨ **C26** - Performance (2-3d) - BASSO (già veloce)

---

## ✅ PUOI RIMETTERE IL REPO PRIVATO ORA

Ho tutte le informazioni necessarie! 🔒

**Summary:**
- ✅ Stack tecnologico analizzato
- ✅ Architettura valutata
- ✅ Stime aggiornate per ogni checkpoint
- ✅ Task breakdown dettagliato
- ✅ Dependencies identificate
- ✅ Files structure mappata

**Next Steps:**
1. Decidi quale scenario seguire (Fast/Balanced/Growth)
2. Approva ordine checkpoint
3. Partiamo con C19! 🚀
