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
export const confirmDataSchema = z
  .object({
    id: z.number().int().positive(),
    supplier_tax_id: z.string().trim().nullish(), // string | null | undefined
    receiver_tax_id: z.string().trim().nullish(),
    supplier_iban: z.string().trim().toUpperCase().nullish(),
  })
  .strict()
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