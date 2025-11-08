// supabase/functions/send-pec-disdetta/index.ts
// (Modalità Test: invio PEC disabilitato, status TEST_SENT, upload PDF su storage)

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { PDFDocument, StandardFonts, rgb } from 'https://esm.sh/pdf-lib@1.17.1'
import type { PDFFont } from 'https://esm.sh/pdf-lib@1.17.1'

// ==========================
// 1) COSTANTI & CONFIG
// ==========================
const TEST_MODE = true
const PDF_BUCKET = Deno.env.get('PDF_BUCKET') ?? 'documenti-disdetta' // config via env
const ALLOWED_ORIGINS = (Deno.env.get('ALLOWED_ORIGINS') ?? 'http://localhost:3000')
  .split(',')
  .map(s => s.trim())

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

function getSupabaseAdmin() {
  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
  const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!SUPABASE_URL || !SERVICE_KEY) {
    throw new Error('Config Supabase mancante: verifica SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY')
  }
  return createClient(SUPABASE_URL, SERVICE_KEY)
}

type RequestBody = { id: number } // <-- NEW
function isRequestBody(x: unknown): x is RequestBody { // <-- NEW
  if (typeof x !== 'object' || x === null) return false
  const rec = x as Record<string, unknown>
  return typeof rec.id === 'number'
}


console.log("Funzione 'send-pec-disdetta' (C8 - MODALITÀ TEST) avviata.")

// ==========================
// 2) TIPI
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
}

// ==========================
// 3) UTIL: WORD WRAP per pdf-lib
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
        // Se una singola parola è più lunga del maxWidth, forziamo il break
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
// 4) HELPER: CREA PDF
// ==========================
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
      // nuova pagina se necessario
      const newPage = pdfDoc.addPage()
      cursorY = newPage.getSize().height - 50
    }
  }

  console.log('PDF creato con successo.')
  return await pdfDoc.save()
}

// ==========================
// 5) HANDLER
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

  try {
    // --- Validazione body JSON ---
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

    // --- Supabase Admin (fail-fast su env) ---
    const supabaseAdmin = getSupabaseAdmin()

    // 1) Recupera Disdetta (least-privilege)
    const { data: disdettaData, error: disdettaError } = await supabaseAdmin
      .from('extracted_data')
      .select('id, user_id, documento_delega_path, receiver_tax_id, supplier_tax_id')
      .eq('id', disdettaId)
      .single()

    if (disdettaError) throw new Error(`Errore recupero disdetta: ${disdettaError.message}`)
    if (!disdettaData) throw new Error('Disdetta non trovata')

    const typedDisdettaData: DisdettaData = disdettaData as DisdettaData

    // 2) Recupera Profilo (least-privilege)
    const { data: profileData, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('nome, cognome, indirizzo_residenza, documento_identita_path, user_id')
      .eq('user_id', typedDisdettaData.user_id)
      .single()

    if (profileError) throw new Error(`Errore recupero profilo: ${profileError.message}`)
    if (!profileData) throw new Error('Profilo non trovato')

    const typedProfileData: ProfileData = {
      nome: profileData.nome ?? null,
      cognome: profileData.cognome ?? null,
      indirizzo_residenza: profileData.indirizzo_residenza ?? null,
      documento_identita_path: profileData.documento_identita_path ?? null,
    }

    // 3) Recupera File Delega
    if (!typedDisdettaData.documento_delega_path) {
      throw new Error("Errore: manca 'documento_delega_path'")
    }
    const { data: delegaFile, error: delegaError } = await supabaseAdmin
      .storage
      .from('documenti-delega')
      .download(typedDisdettaData.documento_delega_path)
    if (delegaError) throw new Error(`Errore download delega: ${delegaError.message}`)

    // 4) Recupera Documento Identità
    if (!typedProfileData.documento_identita_path) {
      throw new Error("Errore: manca 'documento_identita_path' nel profilo")
    }
    console.log('Download documento identità...')
    const { data: idFile, error: idError } = await supabaseAdmin
      .storage
      .from('documenti-identita')
      .download(typedProfileData.documento_identita_path)
    if (idError) throw new Error(`Errore download documento identità: ${idError.message}`)

    console.log(
      `Tutti i dati e i file sono stati recuperati. Delega=${delegaFile.size}B, ID=${idFile.size}B`
    )

    // 5) Genera PDF disdetta
    const pdfBytes = await creaPdfDisdetta(typedProfileData, typedDisdettaData)
    console.log(`PDF generato (${pdfBytes.length} bytes).`)

    // 6) Upload PDF su storage (tracciabilità)
    const pdfPath = `disdette/${disdettaId}.pdf`
    const { error: upErr } = await supabaseAdmin
      .storage
      .from(PDF_BUCKET)
      .upload(pdfPath, pdfBytes, {
        contentType: 'application/pdf',
        upsert: true, // in test sovrascriviamo
      })

    if (upErr) {
      throw new Error(`Errore upload PDF: ${upErr.message}`)
    }
    console.log(`PDF caricato su '${PDF_BUCKET}/${pdfPath}'`)

    // 7) Invio PEC (DISABILITATO IN TEST)
    if (TEST_MODE) {
      console.log('MODALITÀ TEST: Invio PEC saltato.')
    }

    // 8) Aggiornamento stato + pdf_path
    const newStatus = TEST_MODE ? 'TEST_SENT' : 'SENT'
    const { error: updateError } = await supabaseAdmin
      .from('extracted_data')
      .update({ status: newStatus, pdf_path: pdfPath })
      .eq('id', disdettaId)

    if (updateError) throw new Error(`Errore aggiornamento stato: ${updateError.message}`)
    console.log(`Stato aggiornato a '${newStatus}'. Flusso C8 (Test) completato.`)

    // 9) Risposta
    return new Response(
      JSON.stringify({
        success: true,
        message: TEST_MODE ? 'Invio SIMULATO con successo.' : 'Invio completato con successo.',
        pdf_path: `${PDF_BUCKET}/${pdfPath}`,
        status: newStatus,
      }),
      { headers: { ...headers, 'Content-Type': 'application/json' } }
    )
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Errore sconosciuto'
    console.error("[send-pec-disdetta][TEST] Errore", {
      msg,
      disdettaId: typeof disdettaId === 'number' ? disdettaId : null,
    })
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...headers, 'Content-Type': 'application/json' },
    })
  }
})