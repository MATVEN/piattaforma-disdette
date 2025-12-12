// src/domain/schemas.ts
import { z } from 'zod'

/* -------------------------------------------
 * Helper riutilizzabili (forme + normalizzazioni)
 * ------------------------------------------- */

// Stringa non vuota con trim sicuro
const nonEmptyTrimmed = z.string().trim().min(1, 'Stringa vuota')

// UUID v4 (usa validatore nativo Zod)
const uuidV4 = z.string().uuid('UUID v4 non valido')

// Partita IVA IT: 11 cifre (forma). Normalizza rimuovendo spazi, poi valida con pipe.
const partitaIvaIt = z
  .string()
  .transform((s) => s.replace(/\s+/g, ''))
  .pipe(z.string().regex(/^\d{11}$/, 'Partita IVA non valida (11 cifre)'))

// IBAN IT: 27 char, IT + 2 cifre + 23 alfanumerici (forma). Normalizza e upper-case, poi valida con pipe.
const ibanIt = z
  .string()
  .transform((s) => s.replace(/\s+/g, '').toUpperCase())
  .pipe(z.string().regex(/^IT\d{2}[A-Z0-9]{23}$/, 'IBAN italiano non valido (forma)'))

// Whitelist di bucket (adatta ai tuoi)
export const bucketEnum = z.enum([
  'documenti_utente',
  'documenti-delega',
  'documenti-identita',
  'documenti-disdetta',
])

// Path di storage tipo "<uuid>/qualcosa/filename.ext"
export const storagePath = z
  .string()
  .min(3)
  .refine((p) => p.includes('/'), 'Path deve contenere almeno una directory')
  .refine((p) => {
    const first = p.split('/')[0]
    try {
      uuidV4.parse(first)
      return true
    } catch {
      return false
    }
  }, 'Il path deve iniziare con uno user_id UUID v4')

/** Utility: almeno un campo definito & non null */
function atLeastOne<T extends Record<string, unknown>>(obj: T, keys: (keyof T)[]) {
  return keys.some((k) => obj[k] !== undefined && obj[k] !== null)
}

/* -------------------------------------------
 * File Upload Validation (C23)
 * ------------------------------------------- */

// Dimensione massima file: 5MB
export const MAX_FILE_SIZE = 5 * 1024 * 1024

// Tipi MIME consentiti per documenti di identità e generali
export const ALLOWED_ID_DOCUMENT_TYPES = [
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/jpg',
] as const

// Tipi MIME consentiti per documenti aziendali (visura, delega)
export const ALLOWED_BUSINESS_DOCUMENT_TYPES = [
  'application/pdf',
] as const

// Tipi MIME consentiti per bollette/fatture
export const ALLOWED_BILL_TYPES = [
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/jpg',
] as const

/**
 * Valida dimensione file
 * @param file - File da validare
 * @returns true se valido, stringa di errore altrimenti
 */
export function validateFileSize(file: File): true | string {
  if (file.size > MAX_FILE_SIZE) {
    return `Il file deve essere inferiore a ${Math.round(MAX_FILE_SIZE / 1024 / 1024)}MB`
  }
  return true
}

/**
 * Valida tipo MIME file
 * @param file - File da validare
 * @param allowedTypes - Array di tipi MIME consentiti
 * @returns true se valido, stringa di errore altrimenti
 */
export function validateFileType(
  file: File,
  allowedTypes: readonly string[]
): true | string {
  if (!allowedTypes.includes(file.type)) {
    const extensions = allowedTypes
      .map(type => type.split('/')[1].toUpperCase())
      .join(', ')
    return `Formato non supportato. Usa: ${extensions}`
  }
  return true
}

/**
 * Valida file completo (dimensione + tipo)
 * @param file - File da validare
 * @param allowedTypes - Array di tipi MIME consentiti
 * @returns { valid: boolean, error?: string }
 */
export function validateFile(
  file: File,
  allowedTypes: readonly string[]
): { valid: boolean; error?: string } {
  const sizeCheck = validateFileSize(file)
  if (sizeCheck !== true) {
    return { valid: false, error: sizeCheck }
  }

  const typeCheck = validateFileType(file, allowedTypes)
  if (typeCheck !== true) {
    return { valid: false, error: typeCheck }
  }

  return { valid: true }
}

/* -------------------------------------------
 * Schemi per Edge Functions
 * ------------------------------------------- */

// C4: process-document
// - delegaPath può essere opzionale o null
// - supporto legacy: alcuni client inviano { body: {...} }
export const processDocumentSchema = z
  .object({
    bucket: bucketEnum,
    path: storagePath,
    delegaPath: z.union([nonEmptyTrimmed, z.null()]).optional(),
    body: z.unknown().optional(),
  })
  .strict()

export type ProcessDocumentPayload = z.infer<typeof processDocumentSchema>

// Parser helper che fonde eventuale `body` legacy e ricalcola i vincoli
export function parseProcessDocument(input: unknown) {
  const base = processDocumentSchema.parse(input)
  const body = (base as { body?: unknown }).body
  if (body && typeof body === 'object' && body !== null) {
    const merged = { ...base, ...(body as Record<string, unknown>) }
    const reparsed = processDocumentSchema.parse(merged)
    return {
      bucket: reparsed.bucket,
      path: reparsed.path,
      delegaPath: reparsed.delegaPath ?? null,
    }
  }
  return {
    bucket: base.bucket,
    path: base.path,
    delegaPath: base.delegaPath ?? null,
  }
}

// C8: send-pec-disdetta
export const sendPecSchema = z
  .object({
    id: z.number().int().positive(),
    test_mode: z.boolean().optional(),
  })
  .strict()

export type SendPecPayload = z.infer<typeof sendPecSchema>
export const parseSendPec = (input: unknown) => sendPecSchema.parse(input)

/* -------------------------------------------
 * Schemi per API Routes
 * ------------------------------------------- */

/**
 * Variante "soft": accetta stringhe (anche sporche) o null/undefined,
 * ma NON impone il formato P.IVA/IBAN. Utile quando vuoi salvare campi parziali
 * e demandare la rigorosità ad una validazione successiva/UX.
 */
// Schema per API /api/confirm-data - Esteso per B2C/B2B (C23)
export const confirmDataSchema = z.object({
  id: z.number(),
  
  // Campi fornitore (esistenti)
  supplier_name: z.string().nullable().optional(),
  supplier_tax_id: z.string().nullable().optional(),
  receiver_tax_id: z.string().nullable().optional(),
  supplier_iban: z.string().nullable().optional(),
  supplier_contract_number: z.string().nullable().optional(),
  customer_code: z.string().nullable().optional(),
  pod_pdr: z.string().nullable().optional(),
  
  // Tipo intestatario (discriminator)
  tipo_intestatario: z.enum(['privato', 'azienda']).optional(),
  
  // Campi B2C (privato)
  nome: z.string().nullable().optional(),
  cognome: z.string().nullable().optional(),
  codice_fiscale: z.string().nullable().optional(),
  indirizzo_residenza: z.string().nullable().optional(),
  telefono: z.string().nullable().optional(),
  
  // Campi B2B (azienda)
  ragione_sociale: z.string().nullable().optional(),
  partita_iva: z.string().nullable().optional(),
  sede_legale: z.string().nullable().optional(),
  lr_nome: z.string().nullable().optional(),
  lr_cognome: z.string().nullable().optional(),
  lr_codice_fiscale: z.string().nullable().optional(),
  indirizzo_fornitura: z.string().nullable().optional(),
  indirizzo_fatturazione: z.string().nullable().optional(),
  richiedente_ruolo: z.enum(['legale_rappresentante', 'delegato']).nullable().optional(),
  visura_camerale_path: z.string().nullable().optional(),
  delega_firma_path: z.string().nullable().optional(),
  
  // Checkbox delega
  delegaCheckbox: z.boolean().optional(),
  
  // Bypass duplicate check
  bypassDuplicateCheck: z.boolean().optional(),
})
  .refine(
    (v) => atLeastOne(v, ['supplier_tax_id', 'receiver_tax_id', 'supplier_iban']),
    { message: 'Almeno uno tra supplier_tax_id, receiver_tax_id, supplier_iban deve essere valorizzato' }
  )

export type ConfirmDataPayload = z.infer<typeof confirmDataSchema>

/**
 * Variante "strict": normalizza E valida forma P.IVA/IBAN.
 * Usa transform + pipe per mantenere i metodi `.regex()` disponibili.
 */
const optionalPivaStrict = z.union([
  z.null(),
  z.undefined(),
  partitaIvaIt, // già normalizzato (spazi rimossi) e validato
])

const optionalIbanStrict = z.union([
  z.null(),
  z.undefined(),
  ibanIt, // già normalizzato (spazi rimossi + uppercase) e validato
])

export const confirmDataStrictSchema = z
  .object({
    id: z.number().int().positive(),
    supplier_tax_id: optionalPivaStrict,
    receiver_tax_id: optionalPivaStrict,
    supplier_iban: optionalIbanStrict,
  })
  .strict()
  .refine(
    (v) => atLeastOne(v, ['supplier_tax_id', 'receiver_tax_id', 'supplier_iban']),
    { message: 'Almeno uno tra supplier_tax_id, receiver_tax_id, supplier_iban deve essere valorizzato' }
  )

export type ConfirmDataStrictPayload = z.infer<typeof confirmDataStrictSchema>

export function parseConfirmData(input: unknown, strict = false) {
  return strict ? confirmDataStrictSchema.parse(input) : confirmDataSchema.parse(input)
}

// C5: get-extracted-data (robust)
export const getExtractedDataSchema = z
  .object({
    filePath: storagePath, // mantiene il vincolo <uuid>/...
  })
  .strict()

export type GetExtractedDataQuery = z.infer<typeof getExtractedDataSchema>

export function parseGetExtractedData(input: unknown) {
  const { filePath } = getExtractedDataSchema.parse(input)
  const userId = filePath.split('/')[0] // sicuro perché storagePath già valida il formato
  return { filePath, userId }
}

/* -------------------------------------------
 * Schemi per Form Frontend (C13)
 * ------------------------------------------- */

// Schema per il form /profileUser
export const profileFormSchema = z.object({
  nome: z.string().trim().min(1, "Il nome è obbligatorio."),
  cognome: z.string().trim().min(1, "Il cognome è obbligatorio."),
  indirizzo_residenza: z.string().trim().min(1, "L'indirizzo è obbligatorio."),
  telefono: z.string().trim().min(1, "Il telefono è obbligatorio."),
})

export type ProfileFormData = z.infer<typeof profileFormSchema>

// Schema per il form /review (C13, C23 - B2B Support)
// Base schema: campi comuni a B2C e B2B
const reviewFormBaseSchema = z.object({
  // Dati fornitore (azienda a cui si fa disdetta)
  supplier_name: z.string().trim().min(1, 'Nome fornitore obbligatorio').optional(),
  supplier_tax_id: z.string()
    .min(11, 'P.IVA fornitore deve essere di 11 cifre')
    .max(11, 'P.IVA fornitore deve essere di 11 cifre')
    .regex(/^\d{11}$/, 'P.IVA deve contenere solo numeri'),
  supplier_contract_number: z.string()
    .min(1, 'POD, PDR o Codice Cliente obbligatorio')
    .max(50, 'Valore troppo lungo')
    .transform(val => val.trim()),
  supplier_iban: z.string()
    .optional()
    .refine(
      (val) => !val || val.length === 0 || /^IT[0-9]{2}[A-Z][0-9]{22}$/.test(val.replace(/\s/g, '')),
      'IBAN italiano non valido'
    ),

  // Accettazione delega auto-generata
  delegaCheckbox: z.boolean().refine(val => val === true, {
    message: 'Devi accettare la delega per procedere'
  })
})

// Schema B2C: intestatario privato
const reviewFormSchemaB2C = reviewFormBaseSchema.extend({
  tipo_intestatario: z.literal('privato'),

  // Dati anagrafici privato
  nome: z.string().trim().min(1, 'Nome obbligatorio'),
  cognome: z.string().trim().min(1, 'Cognome obbligatorio'),
  codice_fiscale: z.string()
    .min(16, 'Codice Fiscale deve essere di 16 caratteri')
    .max(16, 'Codice Fiscale deve essere di 16 caratteri')
    .regex(/^[A-Z0-9]{16}$/i, 'Codice Fiscale non valido'),
  indirizzo_residenza: z.string().trim().min(1, 'Indirizzo residenza obbligatorio'),
})

// Schema B2B: intestatario azienda
const reviewFormSchemaB2B = reviewFormBaseSchema.extend({
  tipo_intestatario: z.literal('azienda'),

  // Dati azienda
  ragione_sociale: z.string().trim().min(1, 'Ragione sociale obbligatoria'),
  partita_iva: z.string()
    .min(11, 'Partita IVA azienda deve essere di 11 cifre')
    .max(11, 'Partita IVA azienda deve essere di 11 cifre')
    .regex(/^\d{11}$/, 'Partita IVA deve contenere solo numeri'),
  sede_legale: z.string().trim().min(1, 'Sede legale obbligatoria'),

  // Dati Legale Rappresentante
  lr_nome: z.string().trim().min(1, 'Nome legale rappresentante obbligatorio'),
  lr_cognome: z.string().trim().min(1, 'Cognome legale rappresentante obbligatorio'),
  lr_codice_fiscale: z.string()
    .min(16, 'Codice Fiscale LR deve essere di 16 caratteri')
    .max(16, 'Codice Fiscale LR deve essere di 16 caratteri')
    .regex(/^[A-Z0-9]{16}$/i, 'Codice Fiscale LR non valido'),

  // Indirizzi
  indirizzo_fornitura: z.string().trim().min(1, 'Indirizzo fornitura obbligatorio'),
  indirizzo_fatturazione: z.string().trim().min(1, 'Indirizzo fatturazione obbligatorio'),

  // Ruolo richiedente
  richiedente_ruolo: z.enum(['legale_rappresentante', 'delegato'], {
    errorMap: () => ({ message: 'Seleziona il ruolo del richiedente' })
  }),

  // File uploads (paths opzionali - gestiti separatamente)
  visura_camerale_path: z.string().optional(),
  delega_firma_path: z.string().optional(),
})

// Discriminated Union: scelta basata su tipo_intestatario
export const reviewFormSchema = z.discriminatedUnion('tipo_intestatario', [
  reviewFormSchemaB2C,
  reviewFormSchemaB2B,
])

export type ReviewFormData = z.infer<typeof reviewFormSchema>
export type ReviewFormDataB2C = z.infer<typeof reviewFormSchemaB2C>
export type ReviewFormDataB2B = z.infer<typeof reviewFormSchemaB2B>