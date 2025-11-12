// supabase/functions/send-pec-disdetta/index.ts
// (C12 - Hardened: Dual-Client Auth, State-Check, MIME Validation)

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { PDFDocument, StandardFonts, rgb } from 'https://esm.sh/pdf-lib@1.17.1'
import type { PDFFont } from 'https://esm.sh/pdf-lib@1.17.1'

// ==========================
// 1) COSTANTI & CONFIG
// ==========================
const TEST_MODE = true
const PDF_BUCKET = Deno.env.get('PDF_BUCKET') ?? 'documenti-disdetta'
const ALLOWED_ORIGINS = (Deno.env.get('ALLOWED_ORIGINS') ?? 'http://localhost:3000')
  .split(',')
  .map(s => s.trim())

// --- NUOVI LIMITI (da C11 Audit) ---
const MAX_FILE_BYTES = Number(Deno.env.get("MAX_FILE_BYTES") ?? 10_000_000) // 10MB
const ALLOWED_MIME = ["application/pdf", "image/png", "image/jpeg", "image/jpg", "image/tiff"]

// --- Helper CORS (invariati) ---
function resolveCorsOrigin(req: Request): string { /* ... */ }
function corsHeaders(origin: string) { /* ... */ }
// ... (corpo helper omesso per brevità)
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

// --- Helper Admin Client (invariato) ---
function getSupabaseAdmin() {
  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
  const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!SUPABASE_URL || !SERVICE_KEY) {
    throw new Error('Config Supabase mancante: verifica SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY')
  }
  return createClient(SUPABASE_URL, SERVICE_KEY)
}

// --- Type Guard (invariata) ---
type RequestBody = { id: number }
function isRequestBody(x: unknown): x is RequestBody { /* ... */ }
// ... (corpo helper omesso per brevità)
function isRequestBody(x: unknown): x is RequestBody {
  if (typeof x !== 'object' || x === null) return false
  const rec = x as Record<string, unknown>
  return typeof rec.id === 'number'
}

console.log("Funzione 'send-pec-disdetta' (C12 - Hardened) avviata.")

/// ==========================
// 2) TIPI (Definizioni Corrette)
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
  documento_delega_path: string | null
  receiver_tax_id: string | null
  supplier_tax_id: string | null
  status: string 
}


// ==========================
// 3) UTIL: WORD WRAP (invariato)
// ==========================
function wrapText(text: string, font: PDFFont, fontSize: number, maxWidth: number): string[] { /* ... */ }
// ... (corpo helper omesso per brevità)
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
          if (chunk) {
            line = chunk
          } else {
            line = ''
          }
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
// 4) HELPER: CREA PDF (invariato)
// ==========================
async function creaPdfDisdetta(profile: ProfileData, disdetta: DisdettaData): Promise<Uint8Array> { /* ... */ }
// ... (corpo helper omesso per brevità)
async function creaPdfDisdetta(profile: ProfileData, disdetta: DisdettaData): Promise<Uint8Array> {
  console.log('Inizio creazione PDF...')
  const pdfDoc = await PDFDocument.create()
  const page = pdfDoc.addPage()
  const { width, height } = page.getSize()
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const fontSize = 12

  const testo = `
MODALITÀ TEST - MODALITÀ TEST

Oggetto: Richiesta di disdetta contratto fornitura

Spett.le Fornitore,

Io sottoscritto ${profile.nome || ''} ${profile.cognome || ''},
residente in ${profile.indirizzo_residenza || ''},

richiedo la disdetta del contratto:
- ID Utenza (POD/PDR): ${disdetta.receiver_tax_id || 'Non specificato'}
- P.IVA Fornitore: ${disdetta.supplier_tax_id || 'Non specificato'}

Distinti saluti,
${profile.nome || ''} ${profile.cognome || ''}
`.trim()

  const marginX = 50
  const startY = height - 50
  const usableWidth = width - marginX * 2
  const lineHeight = fontSize * 1.5

  const lines = wrapText(testo, font, fontSize, usableWidth)
  let cursorY = startY

  for (const line of lines) {
    page.drawText(line, {
      x: marginX,
      y: cursorY,
      size: fontSize,
      font,
      color: rgb(0, 0, 0),
    })
    cursorY -= lineHeight
    if (cursorY < 50) {
      const newPage = pdfDoc.addPage()
      cursorY = newPage.getSize().height - 50
    }
  }

  console.log('PDF creato con successo.')
  return await pdfDoc.save()
}

// ==========================
// 5) HANDLER (Modificato C12)
// ==========================
serve(async (req: Request) => {
  const origin = resolveCorsOrigin(req)
  const headers = corsHeaders(origin)

  // CORS preflight (invariato)
  if (req.method === 'OPTIONS') { /* ... */ }
  if (req.method !== 'POST') { /* ... */ }

  let disdettaId: number | null = null
  let userId: string | null = null

  try {
    // --- Validazione body (invariata) ---
    let body: unknown
    try {
      body = await req.json()
    } catch {
      throw new Error('Body JSON non valido')
    }
    if (!isRequestBody(body)) {
      throw new Error("Parametro 'id' mancante o non numerico")
    }
    disdettaId = body.id
    console.log(`[TEST] Richiesta ricevuta per ID: ${disdettaId}`)

    // --- 1. MODIFICA C12: DUAL CLIENT AUTH ---
    // Creiamo un client "Utente" usando l'header Auth del chiamante
    // Questo forza l'applicazione della RLS
    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!, // <-- Usa ANON key
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    // Verifichiamo la proprietà e lo stato usando RLS (o policy)
    const { data: disdettaData, error: disdettaError } = await supabaseUser
      .from('extracted_data')
      .select('id, user_id, documento_delega_path, receiver_tax_id, supplier_tax_id, status') // Seleziona anche 'status'
      .eq('id', disdettaId)
      // .eq('user_id', user.id) <-- Non serve, RLS lo fa già
      .single()

    if (disdettaError) throw new Error(`Disdetta non trovata o accesso negato: ${disdettaError.message}`)
    if (!disdettaData) throw new Error('Disdetta non trovata')
    
    // --- 2. MODIFICA C12: State Transition Check (Early) ---
    if (disdettaData.status !== 'CONFIRMED') {
      throw new Error(`Impossibile inviare: lo stato è ${disdettaData.status} (atteso CONFIRMED)`)
    }
    
    // Ora che sappiamo che l'utente è proprietario, salviamo l'ID utente
    userId = disdettaData.user_id
    const typedDisdettaData: DisdettaData = disdettaData as DisdettaData

    // --- Fine Dual Client Auth ---

    // --- Creiamo il client Admin SOLO ORA ---
    // (Necessario per leggere 'profiles' e file, che hanno RLS diverse)
    const supabaseAdmin = getSupabaseAdmin()

    // 2) Recupera Profilo (invariato)
    const { data: profileData, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('nome, cognome, indirizzo_residenza, documento_identita_path') // rimosso 'user_id'
      .eq('user_id', userId) // Usa l'ID utente verificato
      .single()
    if (profileError) throw new Error(`Errore recupero profilo: ${profileError.message}`)
    if (!profileData) throw new Error('Profilo non trovato')
    const typedProfileData: ProfileData = profileData

    // 3) Recupera File Delega
    if (!typedDisdettaData.documento_delega_path) throw new Error("Errore: manca 'documento_delega_path'")
    const { data: delegaFile, error: delegaError } = await supabaseAdmin
      .storage.from('documenti-delega').download(typedDisdettaData.documento_delega_path)
    if (delegaError) throw new Error(`Errore download delega: ${delegaError.message}`)

    // 4) Recupera Documento Identità
    if (!typedProfileData.documento_identita_path) throw new Error("Errore: manca 'documento_identita_path' nel profilo")
    const { data: idFile, error: idError } = await supabaseAdmin
      .storage.from('documenti-identita').download(typedProfileData.documento_identita_path)
    if (idError) throw new Error(`Errore download documento identità: ${idError.message}`)

    // --- 5. MODIFICA C12: MIME & Size Whitelist ---
    if (!delegaFile || !ALLOWED_MIME.includes(delegaFile.type) || delegaFile.size > MAX_FILE_BYTES) {
      throw new Error(`File delega non valido (tipo: ${delegaFile?.type}, size: ${delegaFile?.size})`)
    }
    if (!idFile || !ALLOWED_MIME.includes(idFile.type) || idFile.size > MAX_FILE_BYTES) {
      throw new Error(`File ID non valido (tipo: ${idFile?.type}, size: ${idFile?.size})`)
    }
    console.log(`File validati. Delega=${delegaFile.size}B, ID=${idFile.size}B`)

    // 6) Genera PDF (invariato)
    const pdfBytes = await creaPdfDisdetta(typedProfileData, typedDisdettaData)
    console.log(`PDF generato (${pdfBytes.length} bytes).`)

    // 7) Upload PDF (invariato)
    const pdfPath = `disdette/${disdettaId}.pdf`
    const { error: upErr } = await supabaseAdmin
      .storage.from(PDF_BUCKET).upload(pdfPath, pdfBytes, { contentType: 'application/pdf', upsert: true })
    if (upErr) throw new Error(`Errore upload PDF: ${upErr.message}`)
    console.log(`PDF caricato su '${PDF_BUCKET}/${pdfPath}'`)

    // 8) Invio PEC (DISABILITATO IN TEST)
    if (TEST_MODE) {
      console.log('MODALITÀ TEST: Invio PEC saltato.')
    }
    // else { ... logica SMTP ... }

    // --- 9. MODIFICA C12: State Transition Check (Finale) ---
    // Aggiorna lo stato SOLO SE è ancora 'CONFIRMED'
    const newStatus = TEST_MODE ? 'TEST_SENT' : 'SENT'
    const { error: updateError, count } = await supabaseAdmin
      .from('extracted_data')
      .update({ status: newStatus, pdf_path: pdfPath })
      .eq('id', disdettaId)
      .eq('status', 'CONFIRMED') // <-- Impedisce doppi invii

    if (updateError) throw new Error(`Errore aggiornamento stato: ${updateError.message}`)
    if (count === 0) {
      console.warn(`[send-pec-disdetta] Doppio invio bloccato per ID: ${disdettaId}`)
      // Non trattarlo come un errore grave, l'invio è già partito
    }
    
    console.log(`Stato aggiornato a '${newStatus}'. Flusso C12 (Test) completato.`)

    // 10) Risposta (invariata)
    return new Response(JSON.stringify({
      success: true,
      message: TEST_MODE ? 'Invio SIMULATO con successo.' : 'Invio completato.',
      pdf_path: `${PDF_BUCKET}/${pdfPath}`,
      status: newStatus,
    }), { headers: { ...headers, "Content-Type": "application/json" } })

  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Errore sconosciuto'
    console.error("[send-pec-disdetta][TEST] Errore", {
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