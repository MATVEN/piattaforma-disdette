# Refactor ReviewForm.tsx into Modular Components

## 🎯 Objective
Refactor `src/components/ReviewForm.tsx` (1243 lines) into smaller, maintainable components following React best practices. The goal is to improve code maintainability while preserving ALL existing functionality.

## 📊 Current State
- File: `src/components/ReviewForm.tsx` (1243 lines)
- Status: Working perfectly (B2C and B2B flows tested)
- Problem: Too large, hard to maintain, violates Single Responsibility Principle

## 🎯 Target Structure
```
src/components/ReviewForm/
├── index.tsx                           (~120 lines) Main orchestrator
├── components/
│   ├── TipoIntestatarioSelector.tsx   (~80 lines)  Privato/Azienda selector
│   ├── SupplierFields.tsx             (~180 lines) P.IVA, POD, IBAN fields
│   ├── B2CFields.tsx                  (~200 lines) Nome, Cognome, CF, Indirizzo, Tel
│   ├── B2BCompanyFields.tsx           (~180 lines) Ragione Sociale, P.IVA, Sede, Indirizzi
│   ├── B2BLegalRepFields.tsx          (~130 lines) LR Nome, Cognome, CF, Telefono
│   ├── B2BDocumentsSection.tsx        (~250 lines) Upload Visura, Documento LR, Delega + Info Box
│   ├── DelegationCheckbox.tsx         (~80 lines)  Checkbox delega finale
│   └── SubmitButton.tsx               (~80 lines)  Bottone submit con loading
├── hooks/
│   ├── useReviewForm.ts               (~100 lines) Form setup + fetch data
│   ├── useFileUploads.ts              (~80 lines)  State management file B2B
│   └── useFormSubmission.ts           (~200 lines) onSubmit logic (confirm + send PEC)
└── types.ts                            (~30 lines)  Shared types if needed
```

## 🚨 CRITICAL REQUIREMENTS

### ⚠️ PRESERVE ALL FUNCTIONALITY
This is a REFACTOR, not a rewrite. Every single feature must work identically:
- ✅ Form validation (Zod + React Hook Form)
- ✅ Conditional rendering (B2C vs B2B)
- ✅ File uploads (Visura, Documento LR, Delega)
- ✅ receiver_tax_id mapping (CRITICAL FIX - must be preserved!)
- ✅ Checkbox auto-sync (indirizzo_fatturazione = sede_legale)
- ✅ API calls sequence (confirm-data → send-pec)
- ✅ Toast notifications
- ✅ Router redirect after success
- ✅ Loading states
- ✅ Error handling
- ✅ All CSS classes and styling
- ✅ All animations (Framer Motion)

### 🎨 NO UI CHANGES
- Same Tailwind classes
- Same layout
- Same visual appearance
- Same user experience

### 📏 Component Size Guidelines
- Each component < 250 lines
- Each hook < 150 lines
- Clear single responsibility

## 📋 DETAILED COMPONENT SPECIFICATIONS

### 1. index.tsx (Main Orchestrator)
**Responsibility:** Compose all sub-components, no business logic

```tsx
'use client'

import { Suspense } from 'react'
import { TipoIntestatarioSelector } from './components/TipoIntestatarioSelector'
import { SupplierFields } from './components/SupplierFields'
import { B2CFields } from './components/B2CFields'
import { B2BCompanyFields } from './components/B2BCompanyFields'
import { B2BLegalRepFields } from './components/B2BLegalRepFields'
import { B2BDocumentsSection } from './components/B2BDocumentsSection'
import { DelegationCheckbox } from './components/DelegationCheckbox'
import { SubmitButton } from './components/SubmitButton'
import { useReviewForm } from './hooks/useReviewForm'
import { useFileUploads } from './hooks/useFileUploads'
import { useFormSubmission } from './hooks/useFormSubmission'

export default function ReviewForm() {
  const { 
    form, 
    tipoIntestatario, 
    setTipoIntestatario, 
    loading: dataLoading,
    currentStatus 
  } = useReviewForm()

  const { files, handleFileChange } = useFileUploads()

  const { onSubmit, loading: submitting } = useFormSubmission(
    form, 
    files, 
    tipoIntestatario
  )

  const { register, handleSubmit, formState: { errors }, setValue, watch, getValues } = form

  if (dataLoading) {
    return <LoadingSkeleton />
  }

  return (
    <motion.form 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      onSubmit={handleSubmit(onSubmit)} 
      className="space-y-6"
    >
      <TipoIntestatarioSelector 
        value={tipoIntestatario}
        onChange={setTipoIntestatario}
        setValue={setValue}
        register={register}
      />

      <SupplierFields register={register} errors={errors} />

      {tipoIntestatario === 'privato' && (
        <B2CFields register={register} errors={errors} />
      )}

      {tipoIntestatario === 'azienda' && (
        <>
          <B2BCompanyFields 
            register={register} 
            errors={errors}
            setValue={setValue}
            watch={watch}
            getValues={getValues}
          />
          <B2BLegalRepFields 
            register={register} 
            errors={errors}
            watch={watch}
          />
          <B2BDocumentsSection
            files={files}
            onFileChange={handleFileChange}
            richiedenteRuolo={watch('richiedente_ruolo')}
            errors={errors}
          />
        </>
      )}

      <DelegationCheckbox register={register} errors={errors} />

      <SubmitButton 
        loading={submitting}
        disabled={submitting || currentStatus !== 'SUCCESS'}
        currentStatus={currentStatus}
      />
    </motion.form>
  )
}

function LoadingSkeleton() {
  return <div className="animate-pulse">Loading...</div>
}
```

**Key points:**
- Only composition, no logic
- All hooks at top level
- Conditional rendering for B2C/B2B
- Pass only necessary props to each component

---

### 2. components/TipoIntestatarioSelector.tsx
**Responsibility:** Two-button selector for Privato/Azienda

**Props:**
```tsx
interface TipoIntestatarioSelectorProps {
  value: 'privato' | 'azienda'
  onChange: (value: 'privato' | 'azienda') => void
  setValue: UseFormSetValue<ReviewFormData>
  register: UseFormRegister<ReviewFormData>
}
```

**Extract:**
- The entire selector section with two buttons
- Hidden input for registration
- Button click handlers with setValue
- All styling and animations

**IMPORTANT:** When button clicked, MUST call both:
1. `onChange(newValue)` - Update local state
2. `setValue('tipo_intestatario', newValue)` - Update form state

---

### 3. components/SupplierFields.tsx
**Responsibility:** Common supplier fields (P.IVA, POD/PDR, IBAN, Nome Fornitore)

**Props:**
```tsx
interface SupplierFieldsProps {
  register: UseFormRegister<ReviewFormData>
  errors: FieldErrors<ReviewFormData>
}
```

**Extract:**
- P.IVA Fornitore field (with Building2 icon)
- POD/PDR/Codice Cliente field (with FileCheck icon)
- IBAN Fornitore field (with CreditCard icon)
- Nome Fornitore field if present (optional)

**IMPORTANT:** Icons must be INSIDE inputs (absolute positioning left)

---

### 4. components/B2CFields.tsx
**Responsibility:** B2C-specific fields (privato)

**Props:**
```tsx
interface B2CFieldsProps {
  register: UseFormRegister<ReviewFormData>
  errors: FieldErrors<ReviewFormData>
}
```

**Extract:**
- Section header "Dati Intestatario Privato" with User icon
- Nome field
- Cognome field
- Codice Fiscale field (16 chars, uppercase)
- Indirizzo Residenza field
- Telefono field

**Styling:** Grid layout with `md:grid-cols-2` for responsive design

---

### 5. components/B2BCompanyFields.tsx
**Responsibility:** B2B company data fields

**Props:**
```tsx
interface B2BCompanyFieldsProps {
  register: UseFormRegister<ReviewFormData>
  errors: FieldErrors<ReviewFormData>
  setValue: UseFormSetValue<ReviewFormData>
  watch: UseFormWatch<ReviewFormData>
  getValues: UseFormGetValues<ReviewFormData>
}
```

**Extract:**
- Section header "Dati Azienda" with Building2 icon
- Ragione Sociale field
- Partita IVA field (11 digits)
- Sede Legale field
- Indirizzo Fornitura field (with help text "dove si trova il contatore/linea")
- Checkbox "Indirizzo fatturazione uguale a sede legale"
- Indirizzo Fatturazione field (conditional based on checkbox)

**CRITICAL:** Checkbox onChange logic:
```tsx
onChange={(e) => {
  const isChecked = e.target.checked
  setIndirizzoFatturazioneUguale(isChecked)
  if (isChecked) {
    const sedeLegale = getValues('sede_legale')
    setValue('indirizzo_fatturazione', sedeLegale || '')
  } else {
    setValue('indirizzo_fatturazione', '')
  }
}}
```

**ALSO:** Sede Legale field onChange must sync if checkbox is checked

---

### 6. components/B2BLegalRepFields.tsx
**Responsibility:** Legal Representative fields + richiedente ruolo

**Props:**
```tsx
interface B2BLegalRepFieldsProps {
  register: UseFormRegister<ReviewFormData>
  errors: FieldErrors<ReviewFormData>
  watch: UseFormWatch<ReviewFormData>
}
```

**Extract:**
- Section header "Legale Rappresentante" with UserCheck icon
- LR Nome field
- LR Cognome field
- LR Codice Fiscale field (16 chars, uppercase)
- Telefono field
- Section header "Chi sta effettuando questa richiesta?"
- Radio buttons for richiedente_ruolo:
  - Legale Rappresentante
  - Delegato (with conditional Delega field later)

**Styling:** Visual card-style selection for radio buttons

---

### 7. components/B2BDocumentsSection.tsx
**Responsibility:** File upload section with info box

**Props:**
```tsx
interface B2BDocumentsSectionProps {
  files: {
    documentoLR: File | null
    visuraCamerale: File | null
    delegaFirma: File | null
  }
  onFileChange: {
    handleDocumentoLRChange: (file: File | null) => void
    handleVisuraCameraleChange: (file: File | null) => void
    handleDelegaFirmaChange: (file: File | null) => void
  }
  richiedenteRuolo: 'legale_rappresentante' | 'delegato' | undefined
  errors: FieldErrors<ReviewFormData>
}
```

**Extract:**
- Section header "Documenti Richiesti" with FileText icon
- Info box explaining two separate delegations (blue box with Info icon)
- FileUploadField for Documento Identità LR
- FileUploadField for Visura Camerale (with help text "max 30 giorni")
- Conditional FileUploadField for Delega (only if richiedente_ruolo === 'delegato')

**CRITICAL:** Info box text must explain:
1. Delega aziendale interna (upload here)
2. Delega alla piattaforma (checkbox at end)

---

### 8. components/DelegationCheckbox.tsx
**Responsibility:** Final delegation checkbox

**Props:**
```tsx
interface DelegationCheckboxProps {
  register: UseFormRegister<ReviewFormData>
  errors: FieldErrors<ReviewFormData>
}
```

**Extract:**
- Checkbox field with label
- Help text explaining authorization to platform
- Error display if validation fails

**Label text:** "2️⃣ Delega e Autorizzazione alla Piattaforma *"

---

### 9. components/SubmitButton.tsx
**Responsibility:** Submit button with loading state

**Props:**
```tsx
interface SubmitButtonProps {
  loading: boolean
  disabled: boolean
  currentStatus: string
}
```

**Extract:**
- motion.button with animations
- Loading state with Loader2 icon
- Normal state with CheckCircle2 icon
- Text: "Conferma e Invia PEC" (normal) or "Operazione in corso..." (loading)

**Styling:** Full width, gradient primary background, glassmorphism

---

### 10. hooks/useReviewForm.ts
**Responsibility:** Form setup, data fetching, state management

**Return type:**
```tsx
interface UseReviewFormReturn {
  form: UseFormReturn<ReviewFormData>
  tipoIntestatario: 'privato' | 'azienda'
  setTipoIntestatario: (value: 'privato' | 'azienda') => void
  loading: boolean
  currentStatus: string
}
```

**Extract:**
- useForm setup with zodResolver
- useSearchParams to get id
- useEffect to fetch data from /api/get-extracted-data
- reset() to populate form with fetched data
- tipoIntestatario useState
- currentStatus state for status tracking

**CRITICAL:** Preserve all defaultValues logic when resetting form

---

### 11. hooks/useFileUploads.ts
**Responsibility:** File state management for B2B uploads

**Return type:**
```tsx
interface UseFileUploadsReturn {
  files: {
    documentoLR: File | null
    visuraCamerale: File | null
    delegaFirma: File | null
  }
  handleFileChange: {
    handleDocumentoLRChange: (file: File | null) => void
    handleVisuraCameraleChange: (file: File | null) => void
    handleDelegaFirmaChange: (file: File | null) => void
  }
}
```

**Extract:**
- Three useState for file storage
- Three handler functions
- File validation logic if any

---

### 12. hooks/useFormSubmission.ts
**Responsibility:** Form submission logic (onSubmit)

**Props:**
```tsx
interface UseFormSubmissionProps {
  form: UseFormReturn<ReviewFormData>
  files: {
    documentoLR: File | null
    visuraCamerale: File | null
    delegaFirma: File | null
  }
  tipoIntestatario: 'privato' | 'azienda'
}
```

**Return type:**
```tsx
interface UseFormSubmissionReturn {
  onSubmit: (data: ReviewFormData) => Promise<void>
  loading: boolean
}
```

**Extract ALL onSubmit logic:**

1. **User validation**
2. **CRITICAL: receiver_tax_id mapping:**
   ```tsx
   let receiver_tax_id: string | null = null
   if (data.tipo_intestatario === 'privato') {
     receiver_tax_id = data.codice_fiscale || null
   } else if (data.tipo_intestatario === 'azienda') {
     receiver_tax_id = data.lr_codice_fiscale || null
   }
   ```
3. **Validation checks (receiver_tax_id, supplier_tax_id)**
4. **B2B file uploads to Supabase Storage**
5. **API call to /api/confirm-data (PATCH)**
6. **API call to /api/send-pec (POST)**
7. **Toast notifications**
8. **Router redirect after success**
9. **Error handling**

**CRITICAL:** This hook must use:
- `useAuth()` for user
- `useRouter()` for redirect
- `supabase` from '@/lib/supabaseClient'
- `toast` from 'react-hot-toast'

---

## 🗑️ Console Logs Cleanup

### ❌ REMOVE (Debug logs):
```tsx
console.log('🔍 DEBUG B2C:', ...)
console.log('🔍 DEBUG B2B:', ...)
console.log('🚀 onSubmit CHIAMATA!')
console.log('📤 Dati inviati all\'API:', ...)
console.log('📤 UPDATE DATA:', ...)
console.log('✅ Risposta API:', ...)
console.log('📧 Step 2: Invio PEC...')
console.log('✅ Step 2 completato:', ...)
console.log('🔥 ReviewForm CARICATO!')
console.log('🔥 ReviewForm RENDERIZZATO!')
console.log('🏢 Selezionato: AZIENDA')
console.log('👤 Selezionato: PRIVATO')
console.log('✅ Indirizzo fatturazione copiato:', ...)
```

### ✅ KEEP (Error/Warning logs):
```tsx
console.error('❌ Errore submission:', error)
console.error('❌ Errore upload file:', uploadError)
console.warn(...)
```

---

## 🔧 Import Management

### Move imports to where they're used:
- Lucide icons: import only in the component that uses them
- React Hook Form types: import in components that use form methods
- Supabase: only in hooks that use it
- Motion: only in components with animations

### Example:
```tsx
// SupplierFields.tsx should only import:
import { Building2, FileCheck, CreditCard } from 'lucide-react'
import type { UseFormRegister, FieldErrors } from 'react-hook-form'
import type { ReviewFormData } from '@/domain/schemas'

// NOT import motion, supabase, router, etc. if not used
```

---

## 📝 Step-by-Step Implementation

### Phase 1: Setup Structure
1. Create folder: `src/components/ReviewForm/`
2. Create subfolders: `components/`, `hooks/`

### Phase 2: Extract Hooks (Bottom-Up)
3. Create `hooks/useFileUploads.ts`
4. Create `hooks/useReviewForm.ts`
5. Create `hooks/useFormSubmission.ts`

### Phase 3: Extract UI Components (Bottom-Up)
6. Create `components/SubmitButton.tsx`
7. Create `components/DelegationCheckbox.tsx`
8. Create `components/TipoIntestatarioSelector.tsx`
9. Create `components/SupplierFields.tsx`
10. Create `components/B2CFields.tsx`
11. Create `components/B2BCompanyFields.tsx`
12. Create `components/B2BLegalRepFields.tsx`
13. Create `components/B2BDocumentsSection.tsx`

### Phase 4: Create Orchestrator
14. Create `index.tsx` (main component)

### Phase 5: Update Imports
15. Update `src/app/review/page.tsx` import if needed:
    ```tsx
    // Should still work with:
    import ReviewForm from '@/components/ReviewForm'
    // Because index.tsx is default export
    ```

### Phase 6: Cleanup
16. Delete old `src/components/ReviewForm.tsx`
17. Verify no broken imports

### Phase 7: Testing
18. Test B2C flow completely
19. Test B2B LR flow
20. Test B2B Delegato flow
21. Check console for errors
22. Verify database receiver_tax_id is populated
23. Verify PEC is sent successfully

---

## ✅ Success Criteria

### Code Quality:
- ✅ All files < 250 lines
- ✅ No duplicated code
- ✅ Clear separation of concerns
- ✅ Proper TypeScript types
- ✅ No TypeScript errors
- ✅ No ESLint warnings

### Functionality:
- ✅ Form renders correctly
- ✅ B2C flow works (upload → review → submit → PEC sent)
- ✅ B2B LR flow works (same + file uploads)
- ✅ B2B Delegato flow works (same + delega file)
- ✅ Validation works (Zod + React Hook Form)
- ✅ File uploads work
- ✅ receiver_tax_id correctly mapped in DB
- ✅ Status transitions work (PROCESSING → CONFIRMED → TEST_SENT)
- ✅ Toast notifications appear
- ✅ Redirect to dashboard after success

### UI/UX:
- ✅ Same visual appearance
- ✅ Same animations
- ✅ Same responsive behavior
- ✅ No layout shifts
- ✅ Icons in correct positions

---

## 🚨 Common Pitfalls to Avoid

1. **Don't change logic** - Only extract, don't rewrite
2. **Preserve all props drilling** - Some components need many props, that's OK
3. **Keep same class names** - Don't "improve" styling, keep identical
4. **Don't optimize prematurely** - Focus on extraction, not performance
5. **Test after each extraction** - Don't extract everything then test
6. **Preserve all error handling** - Keep try-catch blocks intact
7. **Don't change state management** - Keep useState, no Zustand/Context yet
8. **Preserve all comments** - Especially CRITICAL comments about receiver_tax_id

---

## 🎯 Final Checklist

Before marking as complete:

- [ ] All new files created in correct structure
- [ ] Old ReviewForm.tsx deleted
- [ ] No TypeScript errors (`npm run build`)
- [ ] No console errors in browser
- [ ] B2C flow tested and working
- [ ] B2B LR flow tested and working
- [ ] B2B Delegato flow tested and working
- [ ] Database check: receiver_tax_id populated correctly
- [ ] PEC sent successfully
- [ ] All debug console.logs removed
- [ ] Error console.logs kept
- [ ] Code committed with message: "refactor(ui): Modularize ReviewForm into maintainable components"

---

## 📚 References

- Original file: `src/components/ReviewForm.tsx` (backup in git)
- Design system: C22 glassmorphism patterns
- Form schema: `src/domain/schemas.ts` (reviewFormSchema)
- Service layer: `src/services/disdetta.service.ts`
- Repository: `src/repositories/disdetta.repository.ts`

---

## 💬 Notes

This refactoring is critical for maintainability. Take time to do it right.
The code works perfectly now - preserve ALL functionality.
Focus on extraction, not optimization.
Test thoroughly after each major component extraction.

Good luck! 🚀