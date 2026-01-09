// supabase/functions/send-pec-disdetta/index.ts
// C23 - Updated for B2C/B2B PDF Generation
// C23 Day 4 - Enhanced error handling and logging

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { PDFDocument, StandardFonts, rgb } from 'https://esm.sh/pdf-lib@1.17.1'
import type { PDFFont } from 'https://esm.sh/pdf-lib@1.17.1'

// ==========================
// 1) COSTANTI & CONFIG
// ==========================
const TEST_MODE = true
const PDF_BUCKET = Deno.env.get('PDF_BUCKET') ?? 'lettere-disdetta'
const ALLOWED_ORIGINS = (Deno.env.get('ALLOWED_ORIGINS') ?? 'http://localhost:3000')
  .split(',')
  .map(s => s.trim())

// --- NUOVI LIMITI (da C11 Audit) ---
const MAX_FILE_BYTES = Number(Deno.env.get("MAX_FILE_BYTES") ?? 10_000_000) // 10MB
const ALLOWED_MIME = ["application/pdf", "image/png", "image/jpeg", "image/jpg", "image/tiff"]

// --- Helper CORS (Definiti UNA SOLA VOLTA) ---
function resolveCorsOrigin(req: Request): string {
  const reqOrigin = req.headers.get('Origin') ?? ''
  return ALLOWED_ORIGINS.includes(reqOrigin) ? reqOrigin : ALLOWED_ORIGINS[0] ?? '*'
}
function corsHeaders(origin: string) {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Vary': 'Origin',
  }
}

// --- Helper Admin Client ---
function getSupabaseAdmin() {
  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
  const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!SUPABASE_URL || !SERVICE_KEY) {
    throw new Error('Config Supabase mancante: verifica SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY')
  }
  return createClient(SUPABASE_URL, SERVICE_KEY)
}

// --- Type Guard ---
type RequestBody = { id: number }
function isRequestBody(x: unknown): x is RequestBody {
  if (typeof x !== 'object' || x === null) return false
  const rec = x as Record<string, unknown>
  return typeof rec.id === 'number'
}

// ===============
// ERROR HANDLING
// ===============

/** Structured error response for better client-side error handling */
interface ErrorResponse {
  error: string
  code: string
  details?: string
  retryable: boolean
}

/** Create structured error response with proper logging */
function errorResponse(
  headers: Record<string, string>,
  error: string,
  code: string,
  details?: string,
  retryable = true
): Response {
  const response: ErrorResponse = {
    error,
    code,
    details,
    retryable
  }

  const status = code.startsWith('CLIENT_') ? 400 : 500

  console.error(`❌ [${code}] ${error}`, details ? { details } : '')

  return new Response(
    JSON.stringify(response),
    {
      status,
      headers: { ...headers, 'Content-Type': 'application/json' },
    }
  )
}

console.log("✅ Funzione 'send-pec-disdetta' (C23 Day 4 - Enhanced Error Handling) avviata.")

// ==========================
// 2) TIPI (B2C/B2B Support)
// ==========================
interface ProfileData {
  nome: string | null
  cognome: string | null
  indirizzo_residenza: string | null
  documento_identita_path: string | null
}

interface DisdettaData {
  id: number
  user_id: string
  receiver_tax_id: string | null
  supplier_tax_id: string | null
  supplier_name: string | null
  supplier_contract_number: string | null
  status: string
  tipo_intestatario: 'privato' | 'azienda' | null
  // B2C fields
  nome: string | null
  cognome: string | null
  codice_fiscale: string | null
  indirizzo_residenza: string | null
  // B2B fields
  ragione_sociale: string | null
  partita_iva: string | null
  sede_legale: string | null
  indirizzo_fornitura: string | null
  indirizzo_fatturazione: string | null
  lr_nome: string | null
  lr_cognome: string | null
  lr_codice_fiscale: string | null
  richiedente_ruolo: 'legale_rappresentante' | 'delegato' | null
  visura_camerale_path: string | null
  documento_lr_path: string | null
  delega_firma_path: string | null
}

// ==========================
// 3) UTIL: SERVICE TYPE
// ==========================
function determineServiceType(supplierName: string | null): 'energia' | 'gas' | 'telefonia' | 'internet' | 'altro' {
  const name = (supplierName || '').toLowerCase()
  if (name.includes('enel') || name.includes('energia')) return 'energia'
  if (name.includes('eni') || name.includes('gas')) return 'gas'
  if (name.includes('tim') || name.includes('vodafone') || name.includes('wind')) return 'telefonia'
  if (name.includes('fastweb') || name.includes('internet')) return 'internet'
  return 'altro'
}

function getServiceDescription(serviceType: string): string {
  const descriptions = {
    energia: 'fornitura di energia elettrica',
    gas: 'fornitura di gas naturale',
    telefonia: 'servizio di telefonia',
    internet: 'servizio di connettività internet',
    altro: 'servizio'
  }
  return descriptions[serviceType as keyof typeof descriptions] || 'servizio'
}

// Email notification trigger
async function triggerEmailNotification(disdettaId: number, type: 'ready' | 'sent' | 'error') {
  try {
    const baseUrl = Deno.env.get('NEXT_PUBLIC_BASE_URL') || 'http://localhost:3000'
    
    const response = await fetch(`${baseUrl}/api/send-notification-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ disdettaId, type }),
    })

    if (!response.ok) {
      const error = await response.json()
      console.error('[EMAIL] Failed to trigger notification:', error)
      return { success: false, error }
    }

    const result = await response.json()
    console.log('[EMAIL] Notification triggered successfully:', result)
    return { success: true, result }
  } catch (error) {
    console.error('[EMAIL] Error triggering notification:', error)
    return { success: false, error }
  }
}

// ==========================
// 4) UTIL: TEXT FORMATTING
// ==========================
function capitalizeWords(text: string): string {
  return text
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

function formatCodiceFiscale(cf: string): string {
  if (cf.length !== 16) return cf
  return `${cf.slice(0, 6)} ${cf.slice(6, 11)} ${cf.slice(11)}`
}

function formatDateFull(date: Date): string {
  return date.toLocaleDateString('it-IT', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
}

// ==========================
// 5) UTIL: WORD WRAP
// ==========================
function wrapText(
  text: string,
  font: PDFFont,
  fontSize: number,
  maxWidth: number
): string[] {
  const paragraphs = text.split('\n')
  const lines: string[] = []

  for (const para of paragraphs) {
    const words = para.split(' ')
    let line = ''
    for (const word of words) {
      const testLine = line ? `${line} ${word}` : word
      const width = font.widthOfTextAtSize(testLine, fontSize)
      if (width <= maxWidth) {
        line = testLine
      } else {
        if (line) lines.push(line)
        if (font.widthOfTextAtSize(word, fontSize) > maxWidth) {
          let chunk = ''
          for (const ch of word) {
            const testChunk = chunk + ch
            if (font.widthOfTextAtSize(testChunk, fontSize) <= maxWidth) {
              chunk = testChunk
            } else {
              if (chunk) lines.push(chunk)
              chunk = ch
            }
          }
          if (chunk) line = chunk
          else line = ''
        } else {
          line = word
        }
      }
    }
    lines.push(line)
  }
  return lines
}

// ==========================
// 6) HELPER: CREA PDF B2C
// ==========================
async function creaPdfDisdettaB2C(disdetta: DisdettaData): Promise<Uint8Array> {
  console.log('Generando PDF B2C...')
  const pdfDoc = await PDFDocument.create()
  const page = pdfDoc.addPage()
  const { width, height } = page.getSize()
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
  const fontSize = 11

  const marginX = 72
  const usableWidth = width - marginX * 2
  const lineHeight = fontSize * 1.5
  let cursorY = height - 72

  // Header: Spett.le [Fornitore]
  page.drawText(`Spett.le ${disdetta.supplier_name || 'Fornitore'}`, {
    x: marginX,
    y: cursorY,
    size: fontSize,
    font,
    color: rgb(0, 0, 0),
  })
  cursorY -= lineHeight * 2

  // Sottoscritto info
  const nomeCapitalized = capitalizeWords(disdetta.nome || '')
  const cognomeCapitalized = capitalizeWords(disdetta.cognome || '')
  const cfFormatted = formatCodiceFiscale(disdetta.codice_fiscale || '')

  page.drawText(`Il sottoscritto ${nomeCapitalized} ${cognomeCapitalized},`, {
    x: marginX,
    y: cursorY,
    size: fontSize,
    font,
    color: rgb(0, 0, 0),
  })
  cursorY -= lineHeight

  page.drawText(`residente in ${disdetta.indirizzo_residenza || ''},`, {
    x: marginX,
    y: cursorY,
    size: fontSize,
    font,
    color: rgb(0, 0, 0),
  })
  cursorY -= lineHeight

  page.drawText(`codice fiscale ${cfFormatted},`, {
    x: marginX,
    y: cursorY,
    size: fontSize,
    font,
    color: rgb(0, 0, 0),
  })
  cursorY -= lineHeight * 2

  // OGGETTO
  const serviceType = determineServiceType(disdetta.supplier_name)
  const serviceDesc = getServiceDescription(serviceType)

  page.drawText('OGGETTO: ', {
    x: marginX,
    y: cursorY,
    size: fontSize,
    font: fontBold,
    color: rgb(0, 0, 0),
  })
  const oggettoWidth = fontBold.widthOfTextAtSize('OGGETTO: ', fontSize)
  page.drawText(`Richiesta di disdetta contratto ${serviceDesc}`, {
    x: marginX + oggettoWidth,
    y: cursorY,
    size: fontSize,
    font,
    color: rgb(0, 0, 0),
  })
  cursorY -= lineHeight * 2

  // CHIEDE
  page.drawText('CHIEDE', {
    x: width / 2 - fontBold.widthOfTextAtSize('CHIEDE', fontSize) / 2,
    y: cursorY,
    size: fontSize,
    font: fontBold,
    color: rgb(0, 0, 0),
  })
  cursorY -= lineHeight * 1.5

  // Disdetta request
  const contractText = disdetta.supplier_contract_number
    ? `del contratto n. ${disdetta.supplier_contract_number}`
    : 'del contratto'

  const requestText = `la disdetta ${contractText} relativo a ${serviceDesc}, con decorrenza dalla prima data utile secondo quanto previsto dalle condizioni contrattuali.`
  const requestLines = wrapText(requestText, font, fontSize, usableWidth)

  for (const line of requestLines) {
    page.drawText(line, {
      x: marginX,
      y: cursorY,
      size: fontSize,
      font,
      color: rgb(0, 0, 0),
    })
    cursorY -= lineHeight
  }
  cursorY -= lineHeight

  // Closing
  page.drawText('Distinti saluti.', {
    x: marginX,
    y: cursorY,
    size: fontSize,
    font,
    color: rgb(0, 0, 0),
  })
  cursorY -= lineHeight * 2

  // Location and Date
  page.drawText(`Bologna, ${formatDateFull(new Date())}`, {
    x: marginX,
    y: cursorY,
    size: fontSize,
    font,
    color: rgb(0, 0, 0),
  })
  cursorY -= lineHeight

  // Signature
  page.drawText(`${nomeCapitalized} ${cognomeCapitalized}`, {
    x: marginX,
    y: cursorY,
    size: fontSize,
    font,
    color: rgb(0, 0, 0),
  })
  cursorY -= lineHeight * 0.5

  page.drawText('(Firma digitale)', {
    x: marginX,
    y: cursorY,
    size: 9,
    font,
    color: rgb(0.4, 0.4, 0.4),
  })

  console.log('PDF B2C generato con successo.')
  return await pdfDoc.save()
}

// ==========================
// 7) HELPER: CREA PDF B2B
// ==========================
async function creaPdfDisdettaB2B(disdetta: DisdettaData): Promise<Uint8Array> {
  console.log('Generando PDF B2B...')
  const pdfDoc = await PDFDocument.create()
  const page = pdfDoc.addPage()
  const { width, height } = page.getSize()
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
  const fontSize = 11

  const marginX = 72
  const usableWidth = width - marginX * 2
  const lineHeight = fontSize * 1.5
  let cursorY = height - 72

  // Header: Spett.le [Fornitore]
  page.drawText(`Spett.le ${disdetta.supplier_name || 'Fornitore'}`, {
    x: marginX,
    y: cursorY,
    size: fontSize,
    font,
    color: rgb(0, 0, 0),
  })
  cursorY -= lineHeight * 2

  // Company info
  const pivaFormatted = (disdetta.partita_iva || '').replace(/\s/g, '')
  const lrCfFormatted = formatCodiceFiscale(disdetta.lr_codice_fiscale || '')
  const lrNomeCapitalized = capitalizeWords(disdetta.lr_nome || '')
  const lrCognomeCapitalized = capitalizeWords(disdetta.lr_cognome || '')

  page.drawText(`${disdetta.ragione_sociale || ''},`, {
    x: marginX,
    y: cursorY,
    size: fontSize,
    font,
    color: rgb(0, 0, 0),
  })
  cursorY -= lineHeight

  page.drawText(`con sede legale in ${disdetta.sede_legale || ''},`, {
    x: marginX,
    y: cursorY,
    size: fontSize,
    font,
    color: rgb(0, 0, 0),
  })
  cursorY -= lineHeight

  page.drawText(`Partita IVA ${pivaFormatted},`, {
    x: marginX,
    y: cursorY,
    size: fontSize,
    font,
    color: rgb(0, 0, 0),
  })
  cursorY -= lineHeight

  page.drawText(`rappresentata dal Legale Rappresentante ${lrNomeCapitalized} ${lrCognomeCapitalized},`, {
    x: marginX,
    y: cursorY,
    size: fontSize,
    font,
    color: rgb(0, 0, 0),
  })
  cursorY -= lineHeight

  page.drawText(`codice fiscale ${lrCfFormatted},`, {
    x: marginX,
    y: cursorY,
    size: fontSize,
    font,
    color: rgb(0, 0, 0),
  })
  cursorY -= lineHeight * 2

  // OGGETTO
  const serviceType = determineServiceType(disdetta.supplier_name)
  const serviceDesc = getServiceDescription(serviceType)

  page.drawText('OGGETTO: ', {
    x: marginX,
    y: cursorY,
    size: fontSize,
    font: fontBold,
    color: rgb(0, 0, 0),
  })
  const oggettoWidth = fontBold.widthOfTextAtSize('OGGETTO: ', fontSize)
  page.drawText(`Richiesta di disdetta contratto ${serviceDesc}`, {
    x: marginX + oggettoWidth,
    y: cursorY,
    size: fontSize,
    font,
    color: rgb(0, 0, 0),
  })
  cursorY -= lineHeight * 2

  // CHIEDE
  page.drawText('CHIEDE', {
    x: width / 2 - fontBold.widthOfTextAtSize('CHIEDE', fontSize) / 2,
    y: cursorY,
    size: fontSize,
    font: fontBold,
    color: rgb(0, 0, 0),
  })
  cursorY -= lineHeight * 1.5

  // Disdetta request
  const contractText = disdetta.supplier_contract_number
    ? `del contratto n. ${disdetta.supplier_contract_number}`
    : 'del contratto'

  const requestText = `la disdetta ${contractText} relativo a ${serviceDesc}, con decorrenza dalla prima data utile secondo quanto previsto dalle condizioni contrattuali.`
  const requestLines = wrapText(requestText, font, fontSize, usableWidth)

  for (const line of requestLines) {
    page.drawText(line, {
      x: marginX,
      y: cursorY,
      size: fontSize,
      font,
      color: rgb(0, 0, 0),
    })
    cursorY -= lineHeight
  }
  cursorY -= lineHeight

  // Attachments list
  page.drawText('Si allegano i seguenti documenti:', {
    x: marginX,
    y: cursorY,
    size: fontSize,
    font,
    color: rgb(0, 0, 0),
  })
  cursorY -= lineHeight * 0.75

  const attachments: string[] = []
  if (disdetta.visura_camerale_path) attachments.push('- Visura Camerale aggiornata')
  if (disdetta.documento_lr_path) attachments.push("- Documento d'identità del Legale Rappresentante")
  if (disdetta.delega_firma_path && disdetta.richiedente_ruolo === 'delegato') {
    attachments.push('- Delega firmata dal Legale Rappresentante')
  }

  for (const att of attachments) {
    page.drawText(att, {
      x: marginX,
      y: cursorY,
      size: fontSize,
      font,
      color: rgb(0, 0, 0),
    })
    cursorY -= lineHeight
  }
  cursorY -= lineHeight

  // Closing
  page.drawText('Distinti saluti.', {
    x: marginX,
    y: cursorY,
    size: fontSize,
    font,
    color: rgb(0, 0, 0),
  })
  cursorY -= lineHeight * 2

  // Location and Date
  page.drawText(`Bologna, ${formatDateFull(new Date())}`, {
    x: marginX,
    y: cursorY,
    size: fontSize,
    font,
    color: rgb(0, 0, 0),
  })
  cursorY -= lineHeight

  // Signature
  page.drawText(`Per ${disdetta.ragione_sociale || ''}`, {
    x: marginX,
    y: cursorY,
    size: fontSize,
    font,
    color: rgb(0, 0, 0),
  })
  cursorY -= lineHeight * 0.5

  page.drawText(`${lrNomeCapitalized} ${lrCognomeCapitalized}`, {
    x: marginX,
    y: cursorY,
    size: fontSize,
    font,
    color: rgb(0, 0, 0),
  })
  cursorY -= lineHeight * 0.5

  page.drawText('(Legale Rappresentante)', {
    x: marginX,
    y: cursorY,
    size: 9,
    font,
    color: rgb(0.4, 0.4, 0.4),
  })
  cursorY -= lineHeight * 0.5

  page.drawText('(Firma digitale)', {
    x: marginX,
    y: cursorY,
    size: 9,
    font,
    color: rgb(0.4, 0.4, 0.4),
  })

  console.log('PDF B2B generato con successo.')
  return await pdfDoc.save()
}

// ==========================
// 8) HELPER: CREA PDF DELEGA (C13)
// ==========================
async function creaPdfDelega(profile: ProfileData): Promise<Uint8Array> {
  console.log('Inizio creazione PDF Delega...')
  const pdfDoc = await PDFDocument.create()
  const page = pdfDoc.addPage([300, 200])
  const { width, height } = page.getSize()
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const fontSize = 10

  const testo = `
    DELEGA PER INVIO DISDETTA

    Io sottoscritto ${profile.nome || ''} ${profile.cognome || ''},
    residente in ${profile.indirizzo_residenza || ''},

    DELEGO formalmente la piattaforma DisdEasy
    a inviare la richiesta di disdetta per mio conto.

    Data: ${new Date().toLocaleDateString('it-IT')}
  `.trim()

  page.drawText(testo, {
    x: 20,
    y: height - 3 * fontSize,
    size: fontSize,
    font: font,
    lineHeight: fontSize * 1.5,
    color: rgb(0, 0, 0),
  })

  console.log('PDF Delega creato.')
  return await pdfDoc.save()
}

// ==========================
// 9) HANDLER (C23 - B2C/B2B PDF)
// ==========================
serve(async (req: Request) => {
  const origin = resolveCorsOrigin(req)
  const headers = corsHeaders(origin)

  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers, status: 204 })
  }
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Metodo non consentito' }), {
      status: 405,
      headers: { ...headers, 'Content-Type': 'application/json' },
    })
  }

  let disdettaId: number | null = null
  let userId: string | null = null

  try {
    // --- Validazione body ---
    let body: unknown
    try { body = await req.json() } catch { throw new Error('Body JSON non valido') }
    if (!isRequestBody(body)) { throw new Error("Parametro 'id' mancante o non numerico") }
    disdettaId = body.id
    console.log(`[C23] Richiesta ricevuta per ID: ${disdettaId}`)

    // --- 1. Dual Client Auth (C12) ---
    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    // Select con TUTTI i campi B2C/B2B
    const { data: disdettaData, error: disdettaError } = await supabaseUser
      .from('disdette')
      .select(`
        id, user_id, receiver_tax_id, supplier_tax_id, supplier_name, supplier_contract_number,
        status, tipo_intestatario,
        nome, cognome, codice_fiscale, indirizzo_residenza,
        ragione_sociale, partita_iva, sede_legale, indirizzo_fornitura, indirizzo_fatturazione,
        lr_nome, lr_cognome, lr_codice_fiscale, richiedente_ruolo,
        visura_camerale_path, documento_lr_path, delega_firma_path
      `)
      .eq('id', disdettaId)
      .single()

    if (disdettaError) throw new Error(`Disdetta non trovata o accesso negato: ${disdettaError.message}`)
    if (!disdettaData) throw new Error('Disdetta non trovata')

    // --- 2. State Transition Check (C12) ---
    if (disdettaData.status !== 'CONFIRMED') {
      throw new Error(`Impossibile inviare: lo stato è ${disdettaData.status} (atteso CONFIRMED)`)
    }

    userId = disdettaData.user_id
    const typedDisdettaData: DisdettaData = disdettaData
    const supabaseAdmin = getSupabaseAdmin()

    // 3. Recupera Profilo (invariato)
    const { data: profileData, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('nome, cognome, indirizzo_residenza, documento_identita_path')
      .eq('user_id', userId)
      .single()
    if (profileError) throw new Error(`Errore recupero profilo: ${profileError.message}`)
    if (!profileData) throw new Error('Profilo non trovato')
    const typedProfileData: ProfileData = profileData

    // 4. Recupera Documento Identità
    if (!typedProfileData.documento_identita_path) throw new Error("Errore: manca 'documento_identita_path' nel profilo")
    const { data: idFile, error: idError } = await supabaseAdmin
      .storage.from('documenti-identita').download(typedProfileData.documento_identita_path)
    if (idError) throw new Error(`Errore download documento identità: ${idError.message}`)

    // 5. MIME & Size Whitelist
    if (!idFile || !ALLOWED_MIME.includes(idFile.type) || idFile.size > MAX_FILE_BYTES) {
      throw new Error(`File ID non valido (tipo: ${idFile?.type}, size: ${idFile?.size})`)
    }
    console.log(`File validati. ID=${idFile.size}B`)

    // --- 6. Genera PDF (B2C vs B2B) ---
    let pdfDisdettaBytes: Uint8Array
    if (typedDisdettaData.tipo_intestatario === 'azienda') {
      pdfDisdettaBytes = await creaPdfDisdettaB2B(typedDisdettaData)
    } else {
      pdfDisdettaBytes = await creaPdfDisdettaB2C(typedDisdettaData)
    }

    const pdfDelegaBytes = await creaPdfDelega(typedProfileData)
    const idBytes = await idFile.arrayBuffer()
    console.log(`PDF generati: Disdetta (${pdfDisdettaBytes.length}B), Delega (${pdfDelegaBytes.length}B).`)

    // --- 7. Upload PDF ---
    const pdfDisdettaPath = `${typedDisdettaData.user_id}/${disdettaId}_lettera.pdf`
    const { error: upErrDisdetta } = await supabaseAdmin
      .storage.from(PDF_BUCKET).upload(pdfDisdettaPath, pdfDisdettaBytes, { contentType: 'application/pdf', upsert: true })
    if (upErrDisdetta) throw new Error(`Errore upload PDF Disdetta: ${upErrDisdetta.message}`)
    console.log(`PDF Disdetta (Lettera) caricato su '${PDF_BUCKET}/${pdfDisdettaPath}'`)

    const pdfDelegaPath = `${typedDisdettaData.user_id}/${disdettaId}_delega.pdf`
    const { error: upErrDelega } = await supabaseAdmin
      .storage.from(PDF_BUCKET).upload(pdfDelegaPath, pdfDelegaBytes, { contentType: 'application/pdf', upsert: true })
    if (upErrDelega) throw new Error(`Errore upload PDF Delega: ${upErrDelega.message}`)
    console.log(`PDF Delega (Auto-generato) caricato su '${PDF_BUCKET}/${pdfDelegaPath}'`)

    // 8. Prepare attachments array (for future PEC sending)
    const attachments: { filename: string; content: ArrayBuffer; contentType: string }[] = [
      {
        filename: 'lettera_disdetta.pdf',
        content: pdfDisdettaBytes.buffer,
        contentType: 'application/pdf'
      },
      {
        filename: 'delega.pdf',
        content: pdfDelegaBytes.buffer,
        contentType: 'application/pdf'
      }
    ]

    // Add B2B documents if applicable
    if (typedDisdettaData.tipo_intestatario === 'azienda') {
      // Download and attach Visura Camerale
      if (typedDisdettaData.visura_camerale_path) {
        try {
          const { data: visuraData } = await supabaseAdmin.storage
            .from('documenti-identita')
            .download(typedDisdettaData.visura_camerale_path)

          if (visuraData) {
            attachments.push({
              filename: 'visura_camerale.pdf',
              content: await visuraData.arrayBuffer(),
              contentType: 'application/pdf'
            })
            console.log('✅ Visura Camerale aggiunta agli allegati')
          }
        } catch (error) {
          console.error('⚠️ Failed to attach Visura:', error)
        }
      }

      // Download and attach Delega if delegato
      if (typedDisdettaData.richiedente_ruolo === 'delegato' && typedDisdettaData.delega_firma_path) {
        try {
          const { data: delegaData } = await supabaseAdmin.storage
            .from('documenti-identita')
            .download(typedDisdettaData.delega_firma_path)

          if (delegaData) {
            attachments.push({
              filename: 'delega_firmata.pdf',
              content: await delegaData.arrayBuffer(),
              contentType: 'application/pdf'
            })
            console.log('✅ Delega firmata aggiunta agli allegati')
          }
        } catch (error) {
          console.error('⚠️ Failed to attach Delega:', error)
        }
      }
    }

    console.log(`Preparati ${attachments.length} allegati per PEC`)

    // 9. Invio PEC (DISABILITATO IN TEST)
    if (TEST_MODE) {
      console.log('MODALITÀ TEST: Invio PEC saltato.')
      console.log(`Allegati preparati: ${attachments.map(a => a.filename).join(', ')}`)
      // (In futuro, la logica SMTP userà l'array attachments)
    }

    // --- 10. Aggiornamento Stato ---
    const newStatus = TEST_MODE ? 'TEST_SENT' : 'SENT'

    const { data: existingRecord, error: fetchError } = await supabaseAdmin
      .from('disdette')
      .select('supplier_contract_number, supplier_tax_id, receiver_tax_id, supplier_iban')
      .eq('id', disdettaId)
      .single()

    if (fetchError) throw new Error(`Errore recupero record: ${fetchError.message}`)
    if (!existingRecord) throw new Error(`Record ${disdettaId} non trovato`)

    console.log(`[send-pec-disdetta] Record esistente - supplier_contract_number: ${existingRecord.supplier_contract_number}`)

    // Update con MERGE esplicito - preserva supplier_contract_number!
    const { error: updateError, count } = await supabaseAdmin
      .from('disdette')
      .update({
        status: newStatus,
        pdf_path: pdfDisdettaPath,
        // Preserva esplicitamente i campi critici
        supplier_contract_number: existingRecord.supplier_contract_number,
        supplier_tax_id: existingRecord.supplier_tax_id,
        receiver_tax_id: existingRecord.receiver_tax_id,
        supplier_iban: existingRecord.supplier_iban,
      })
      .eq('id', disdettaId)
      .eq('status', 'CONFIRMED')

    if (updateError) throw new Error(`Errore aggiornamento stato: ${updateError.message}`)
    if (count === 0) { console.warn(`[send-pec-disdetta] Doppio invio bloccato per ID: ${disdettaId}`) }

    // Trigger email notification: PEC sent successfully
    await triggerEmailNotification(disdettaId, 'sent');

    // 11. Risposta
    return new Response(JSON.stringify({
      success: true,
      message: TEST_MODE ? 'Invio SIMULATO con successo.' : 'Invio completato.',
      pdf_path: `${PDF_BUCKET}/${pdfDisdettaPath}`,
      status: newStatus,
      attachments_count: attachments.length,
      tipo_intestatario: typedDisdettaData.tipo_intestatario
    }), { headers: { ...headers, "Content-Type": "application/json" } })

  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Errore sconosciuto'
    console.error("[send-pec-disdetta][C23] Errore", {
      msg,
      disdettaId: typeof disdettaId === 'number' ? disdettaId : null,
      userId: typeof userId === 'string' ? userId : null,
    })
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...headers, "Content-Type": "application/json" },
    })
  }
})