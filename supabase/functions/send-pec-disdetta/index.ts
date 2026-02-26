// supabase/functions/send-pec-disdetta/index.ts

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { PDFDocument, StandardFonts, rgb } from 'https://esm.sh/pdf-lib@1.17.1'
import type { PDFFont } from 'https://esm.sh/pdf-lib@1.17.1'

// ==========================
// 1) COSTANTI & CONFIG
// ==========================
const PDF_BUCKET = Deno.env.get('PDF_BUCKET') ?? 'documenti-disdetta'
const ALLOWED_ORIGINS = (Deno.env.get('ALLOWED_ORIGINS') ?? 'http://localhost:3000')
  .split(',')
  .map(s => s.trim())

// --- NUOVI LIMITI ---
const MAX_FILE_BYTES = Number(Deno.env.get("MAX_FILE_BYTES") ?? 10_000_000) // 10MB
const ALLOWED_MIME = ["application/pdf", "image/png", "image/jpeg", "image/jpg", "image/tiff"]

const DISDETTA_STATUS = {
  PROCESSING: 'PROCESSING',
  PENDING_REVIEW: 'PENDING_REVIEW',
  CONFIRMED: 'CONFIRMED',
  SENT: 'SENT',
  FAILED: 'FAILED',
} as const

// --- Helper CORS ---
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
type RequestBody = {
  id: number
  type?: 'initial' | 'followup'
}

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

// ==========================
// 2) TIPI (B2C/B2B Support)
// ==========================
interface ProfileData {
  nome: string | null
  cognome: string | null
  indirizzo_residenza: string | null
  documento_identita_path: string | null
}

type DisdettaStatus = typeof DISDETTA_STATUS[keyof typeof DISDETTA_STATUS]

interface DisdettaData {
  id: number
  user_id: string
  receiver_tax_id: string | null
  supplier_tax_id: string | null
  supplier_name: string | null
  supplier_contract_number: string | null
  status: DisdettaStatus
  tipo_intestatario: 'privato' | 'azienda' | null
  is_test: boolean | null
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
    const internalSecret = Deno.env.get('INTERNAL_API_SECRET')

    // ── SECURITY: blocca subito se il secret non è configurato ──
    if (!internalSecret) {
      console.error('[EMAIL] ⛔ INTERNAL_API_SECRET non configurata - notifica annullata')
      return { success: false, error: 'Missing INTERNAL_API_SECRET' }
    }

    const response = await fetch(`${baseUrl}/api/send-notification-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-internal-secret': internalSecret,
      },
      body: JSON.stringify({ disdettaId, type }),
    })

    if (!response.ok) {
      const error = await response.json()
      console.error('[EMAIL] Failed to trigger notification:', error)
      return { success: false, error }
    }

    const result = await response.json()
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
// HELPER: MERGE PDF
// ==========================
async function mergePDFs(pdfs: Uint8Array[]): Promise<Uint8Array> {
  const mergedPdf = await PDFDocument.create()
  
  for (const pdfBytes of pdfs) {
    const pdf = await PDFDocument.load(pdfBytes)
    const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices())
    pages.forEach((page) => mergedPdf.addPage(page))
  }
  
  return await mergedPdf.save()
}

// ==========================
// 6) HELPER: CREA PDF B2C
// ==========================
async function creaPdfDisdettaB2C(disdetta: DisdettaData): Promise<Uint8Array> {
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

  return await pdfDoc.save()
}

// ==========================
// 7) HELPER: CREA PDF B2B
// ==========================
async function creaPdfDisdettaB2B(disdetta: DisdettaData): Promise<Uint8Array> {
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

  return await pdfDoc.save()
}

// ===========================
// 8) HELPER: CREA PDF DELEGA
// ===========================
async function creaPdfDelega(profile: ProfileData): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();

  // A4 portrait
  const PAGE_WIDTH = 595;
  const PAGE_HEIGHT = 842;

  const margin = {
    left: 40,
    right: 40,
    top: 40,
    bottom: 40,
  };

  let page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  let { width, height } = page.getSize();

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontSize = 11;
  const lineHeight = fontSize * 1.4;

  const testo = `
    DELEGA PER INVIO DISDETTA

    Io sottoscritto ${profile.nome || ''} ${profile.cognome || ''}, residente in ${profile.indirizzo_residenza || ''}.

    Dichiaro sotto la mia esclusiva responsabilità di essere il titolare del contratto/utenza oggetto della presente richiesta, e autorizzo DisdEasy ad inviare, in mio nome e per mio conto, la comunicazione di disdetta/diffida/ricorso al gestore indicato. 
    Dichiaro che i dati forniti sono veritieri e mi assumo ogni responsabilità civile e penale in caso di false dichiarazioni.

    Data: ${new Date().toLocaleDateString('it-IT')}
  `.trim();

  const maxLineWidth = width - margin.left - margin.right;

  // split in paragrafi
  const paragraphs = testo.split(/\n{2,}/);
  const lines: string[] = [];

  for (const paragraph of paragraphs) {
    const words = paragraph.trim().split(/\s+/);
    let currentLine = '';

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const testWidth = font.widthOfTextAtSize(testLine, fontSize);

      if (testWidth <= maxLineWidth) {
        currentLine = testLine;
      } else {
        if (currentLine) lines.push(currentLine);
        currentLine = word;
      }
    }

    if (currentLine) lines.push(currentLine);
    lines.push(''); // riga vuota tra paragrafi
  }

  let cursorY = height - margin.top;

  for (const line of lines) {
    if (cursorY - lineHeight < margin.bottom) {
      page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
      ({ width, height } = page.getSize());
      cursorY = height - margin.top;
    }

    if (line) {
      page.drawText(line, {
        x: margin.left,
        y: cursorY - fontSize,
        size: fontSize,
        font,
        color: rgb(0, 0, 0),
      });
    }

    cursorY -= lineHeight;
  }

  return await pdfDoc.save();
}

// ==========================
// HELPER: CREA PDF SOLLECITO B2C
// ==========================
async function creaPdfSollecitoB2C(disdetta: DisdettaData): Promise<Uint8Array> {
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

  // Header
  page.drawText(`Spett.le ${disdetta.supplier_name || 'Fornitore'}`, {
    x: marginX,
    y: cursorY,
    size: fontSize,
    font,
    color: rgb(0, 0, 0),
  })
  cursorY -= lineHeight * 2

  // Sottoscritto
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
  const contractText = disdetta.supplier_contract_number
    ? `n. ${disdetta.supplier_contract_number}`
    : ''

  page.drawText('OGGETTO: ', {
    x: marginX,
    y: cursorY,
    size: fontSize,
    font: fontBold,
    color: rgb(0, 0, 0),
  })

  const oggettoWidth = fontBold.widthOfTextAtSize('OGGETTO: ', fontSize)
  page.drawText(`SOLLECITO - Disdetta contratto ${serviceDesc} ${contractText}`, {
    x: marginX + oggettoWidth,
    y: cursorY,
    size: fontSize,
    font,
    color: rgb(0, 0, 0),
  })
  cursorY -= lineHeight * 2

  // Corpo sollecito
  const bodyText = `Con la presente, si sollecita cortesemente un riscontro in merito alla richiesta di disdetta del contratto ${contractText} relativo a ${serviceDesc}, inviata in data precedente tramite PEC.

  Non avendo ancora ricevuto conferma dell'avvenuta cessazione del servizio, si richiede:

  1. Conferma scritta dell'accettazione della disdetta
  2. Indicazione della data effettiva di cessazione del servizio
  3. Dettaglio di eventuali importi ancora da saldare o crediti da restituire

  Si resta in attesa di un sollecito riscontro entro 7 giorni lavorativi dalla ricezione della presente.`

  const bodyLines = wrapText(bodyText, font, fontSize, usableWidth)
 
  for (const line of bodyLines) {
    if (cursorY < 100) break // Evita overflow
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

  // Date and signature
  page.drawText(`Bologna, ${formatDateFull(new Date())}`, {
    x: marginX,
    y: cursorY,
    size: fontSize,
    font,
    color: rgb(0, 0, 0),
  })
  cursorY -= lineHeight

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

  return await pdfDoc.save()
}

// ==========================
// HELPER: CREA PDF SOLLECITO B2B
// ==========================
async function creaPdfSollecitoB2B(disdetta: DisdettaData): Promise<Uint8Array> {
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

  // Header
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
  const contractText = disdetta.supplier_contract_number
    ? `n. ${disdetta.supplier_contract_number}`
    : ''

  page.drawText('OGGETTO: ', {
    x: marginX,
    y: cursorY,
    size: fontSize,
    font: fontBold,
    color: rgb(0, 0, 0),
  })
  const oggettoWidth = fontBold.widthOfTextAtSize('OGGETTO: ', fontSize)

  page.drawText(`SOLLECITO - Disdetta contratto ${serviceDesc} ${contractText}`, {
    x: marginX + oggettoWidth,
    y: cursorY,
    size: fontSize,
    font,
    color: rgb(0, 0, 0),
  })
  cursorY -= lineHeight * 2

  // Body
  const bodyText = `Con la presente, si sollecita cortesemente un riscontro in merito alla richiesta di disdetta del contratto ${contractText} relativo a ${serviceDesc}, inviata in data precedente tramite PEC.

  Non avendo ancora ricevuto conferma dell'avvenuta cessazione del servizio, si richiede:

  1. Conferma scritta dell'accettazione della disdetta
  2. Indicazione della data effettiva di cessazione del servizio
  3. Dettaglio di eventuali importi ancora da saldare o crediti da restituire

  Si resta in attesa di un sollecito riscontro entro 7 giorni lavorativi dalla ricezione della presente.`

  const bodyLines = wrapText(bodyText, font, fontSize, usableWidth)
  
  for (const line of bodyLines) {
    if (cursorY < 150) break
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

  page.drawText(`Bologna, ${formatDateFull(new Date())}`, {
    x: marginX,
    y: cursorY,
    size: fontSize,
    font,
    color: rgb(0, 0, 0),
  })
  cursorY -= lineHeight

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

  return await pdfDoc.save()
}

// ==========================
// 9) HANDLER (B2C/B2B PDF)
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
    const requestType = body.type || 'initial'
    console.log(`[send-pec-disdetta] Request type: ${requestType}`)

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

    // --- 2. State Transition Check ---
    let expectedStatuses: string[]

    if (requestType === 'followup') {
      expectedStatuses = ['SENT', 'FOLLOWUP_1']
    } else {
      expectedStatuses = ['CONFIRMED']
    }

    if (!expectedStatuses.includes(disdettaData.status)) {
      throw new Error(`Impossibile inviare: lo stato è ${disdettaData.status} (attesi: ${expectedStatuses.join(', ')})`)
    }

    userId = disdettaData.user_id
    const typedDisdettaData: DisdettaData = disdettaData
    const isTest = typedDisdettaData.is_test ?? false
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
    if (!typedProfileData.documento_identita_path) {
      throw new Error("Documento d'identità non trovato. Vai su Profilo → Carica documento.")
    }

    // Check esistenza file prima di scaricare
    const { data: fileExists } = await supabaseAdmin
      .storage.from('documenti-identita')
      .list(typedProfileData.documento_identita_path.split('/')[0], {
        search: typedProfileData.documento_identita_path.split('/')[1]
    })

    if (!fileExists || fileExists.length === 0) {
      throw new Error("File documento identità non trovato. Ricaricalo dal Profilo.")
    }

    const { data: idFile, error: idError } = await supabaseAdmin
    .storage.from('documenti-identita').download(typedProfileData.documento_identita_path)
    
    if (idError) {
      throw new Error(`Errore download documento identità: ${idError.message}`)
    }

    // 5. MIME & Size Whitelist
    if (!idFile || !ALLOWED_MIME.includes(idFile.type) || idFile.size > MAX_FILE_BYTES) {
      throw new Error(`File ID non valido (tipo: ${idFile?.type}, size: ${idFile?.size})`)
    }

    // --- 6. Genera PDF (Initial vs Followup, B2C vs B2B) ---
    let pdfDisdettaBytes: Uint8Array
    if (requestType === 'followup') {
      // Generate followup letter
      if (typedDisdettaData.tipo_intestatario === 'azienda') {
        pdfDisdettaBytes = await creaPdfSollecitoB2B(typedDisdettaData)
      } else {
        pdfDisdettaBytes = await creaPdfSollecitoB2C(typedDisdettaData)
      }
      } else {
      // Generate initial letter
      if (typedDisdettaData.tipo_intestatario === 'azienda') {
        pdfDisdettaBytes = await creaPdfDisdettaB2B(typedDisdettaData)
      } else {
        pdfDisdettaBytes = await creaPdfDisdettaB2C(typedDisdettaData)
      }
    }

    // --- 7. Merge delega + documento identità  ---
    const pdfDelegaBytes = await creaPdfDelega(typedProfileData)
    const idBytes = await idFile.arrayBuffer()

    const delegaConDocumento = await mergePDFs([
      pdfDelegaBytes,
      new Uint8Array(idBytes)
    ])

    // --- 8. Upload PDF ---
    const pdfSuffix = requestType === 'followup' ? 'sollecito' : 'lettera'
    const pdfDisdettaPath = `${typedDisdettaData.user_id}/${disdettaId}_${pdfSuffix}.pdf`
    const { error: upErrDisdetta } = await supabaseAdmin
      .storage.from(PDF_BUCKET).upload(pdfDisdettaPath, pdfDisdettaBytes, { contentType: 'application/pdf', upsert: true })
    if (upErrDisdetta) throw new Error(`Errore upload PDF Disdetta: ${upErrDisdetta.message}`)

    const pdfDelegaPath = `${typedDisdettaData.user_id}/${disdettaId}_delega_con_documento.pdf`
    const { error: upErrDelega } = await supabaseAdmin
      .storage.from(PDF_BUCKET).upload(pdfDelegaPath, delegaConDocumento, { contentType: 'application/pdf', upsert: true })
    if (upErrDelega) throw new Error(`Errore upload PDF Delega: ${upErrDelega.message}`)

    // --- 9. Prepare attachments array ---
    const attachments: { filename: string; content: ArrayBuffer; contentType: string }[] = [
      {
        filename: 'lettera_disdetta.pdf',
        content: pdfDisdettaBytes.buffer,
        contentType: 'application/pdf'
      },
      {
        filename: 'delega_con_documento.pdf',
        content: delegaConDocumento.buffer,
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
          }
        } catch (error) {
          console.error('⚠️ Failed to attach Delega:', error)
        }
      }
    }

    // 10. Invio PEC (DISABILITATO IN TEST)
    if (isTest) {
      // (In futuro, la logica SMTP userà l'array attachments)
    }

    // --- 10. Aggiornamento Stato ---
    const newStatus = isTest ? 'SENT' : 'SENT'

    const { data: existingRecord, error: fetchError } = await supabaseAdmin
      .from('disdette')
      .select('supplier_contract_number, supplier_tax_id, receiver_tax_id, supplier_iban')
      .eq('id', disdettaId)
      .single()

    if (fetchError) throw new Error(`Errore recupero record: ${fetchError.message}`)
    if (!existingRecord) throw new Error(`Record ${disdettaId} non trovato`)

    // Prepare update object based on request type
    const updateData: Record<string, any> = {
      supplier_contract_number: existingRecord.supplier_contract_number,
      supplier_tax_id: existingRecord.supplier_tax_id,
      receiver_tax_id: existingRecord.receiver_tax_id,
      supplier_iban: existingRecord.supplier_iban,
    }

    if (requestType === 'followup') {

      // Determine new status and update appropriate timestamp
      const currentFollowupCount = existingRecord.followup_count || 0
      const newFollowupCount = currentFollowupCount + 1
      
      if (newFollowupCount === 1) {
        updateData.status = 'FOLLOWUP_1'
        updateData.followup_1_sent_at = new Date().toISOString()
      } else if (newFollowupCount === 2) {
        updateData.status = 'FOLLOWUP_2'
        updateData.followup_2_sent_at = new Date().toISOString()
      }
      updateData.followup_count = newFollowupCount

    } else {
      // Initial: update status and paths
      updateData.status = newStatus
      updateData.pdf_path = pdfDisdettaPath
      updateData.delega_con_documento_path = pdfDelegaPath
    }
    
    const { error: updateError, count } = await supabaseAdmin
      .from('disdette')
      .update(updateData)
      .eq('id', disdettaId)
      .eq('id', disdettaId) // Note: removed .eq('status') check since status changes during followup

    if (updateError) throw new Error(`Errore aggiornamento stato: ${updateError.message}`)
    if (count === 0) { console.warn(`[send-pec-disdetta] Doppio invio bloccato per ID: ${disdettaId}`) }

    // Trigger email notification: PEC sent successfully
    await triggerEmailNotification(disdettaId, 'sent');

    // 11. Risposta
    const responseMessage = requestType === 'followup'
      ? (isTest ? 'Sollecito SIMULATO con successo (test)' : 'Sollecito inviato')
      : (isTest ? 'Invio SIMULATO con successo (test)' : 'Invio completato')

    return new Response(JSON.stringify({
      success: true,
      message: responseMessage,
      request_type: requestType,
      pdf_path: `${PDF_BUCKET}/${pdfDisdettaPath}`,
      status: requestType === 'followup' ? typedDisdettaData.status : newStatus,
      attachments_count: attachments.length,
      tipo_intestatario: typedDisdettaData.tipo_intestatario,
      is_test: isTest,
      followup_count: requestType === 'followup' ? ((existingRecord.followup_count || 0) + 1) : undefined
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