// supabase/functions/send-pec-disdetta/index.ts
// (Modalità Test: Tipi 'any' corretti)

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { PDFDocument, StandardFonts, rgb } from 'https://esm.sh/pdf-lib@1.17.1'
// NOTA: Non importiamo più SmtpClient o encodeBase64 (per ora)

const corsHeaders = {
  'Access-Control-Allow-Origin': 'http://localhost:3000',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// --- TIPI SPECIFICI (CORREZIONE) ---
// Definiamo i dati che recuperiamo dalla tabella 'profiles'
interface ProfileData {
  nome: string | null;
  cognome: string | null;
  indirizzo_residenza: string | null;
}
// Definiamo i dati che recuperiamo dalla tabella 'extracted_data'
interface DisdettaData {
  receiver_tax_id: string | null;
  supplier_tax_id: string | null;
  // Aggiungiamo anche gli altri campi che recuperiamo
  user_id: string;
  documento_delega_path: string | null;
}
// --- FINE CORREZIONE ---

console.log("Funzione 'send-pec-disdetta' (C8 - MODALITÀ TEST) avviata.")

// --- FUNZIONE HELPER: Genera il PDF (CORRETTO) ---
// Usiamo i tipi specifici invece di 'any'
async function creaPdfDisdetta(profile: ProfileData, disdetta: DisdettaData): Promise<Uint8Array> {
  console.log("Inizio creazione PDF...")
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
  `

  page.drawText(testo, {
    x: 50,
    y: height - 4 * fontSize,
    size: fontSize,
    font: font,
    lineHeight: fontSize * 1.5,
    color: rgb(0, 0, 0),
  })

  console.log("PDF creato con successo.")
  return await pdfDoc.save()
}


serve(async (req: Request) => {
  // --- Gestione CORS ---
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders, status: 204 })
  }
  if (req.method !== 'POST') { 
    return new Response(JSON.stringify({ error: "Metodo non consentito" }), { 
      status: 405, headers: corsHeaders
    }) 
  }

  try {
    // --- Recupero Dati ---
    const { id: disdettaId } = await req.json()
    if (!disdettaId) throw new Error("ID disdetta non fornito.")
    console.log(`Richiesta (TEST) ricevuta per ID: ${disdettaId}`)

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Specifichiamo i tipi che ci aspettiamo
    const { data: disdettaData, error: disdettaError } = await supabaseAdmin
      .from('extracted_data').select('*').eq('id', disdettaId).single<DisdettaData>()
    if (disdettaError) throw new Error(`Errore recupero disdetta: ${disdettaError.message}`)
    if (!disdettaData) throw new Error("Dati disdetta non trovati.")

    const { data: profileData, error: profileError } = await supabaseAdmin
      .from('profiles').select('nome, cognome, indirizzo_residenza').eq('user_id', disdettaData.user_id).single<ProfileData>()
    if (profileError) throw new Error(`Errore recupero profilo: ${profileError.message}`)
    if (!profileData) throw new Error("Dati profilo non trovati.")
    
    if (!disdettaData.documento_delega_path) throw new Error("Errore: Manca il percorso del file di delega.")
    const { data: delegaFile, error: delegaError } = await supabaseAdmin
      .storage.from('documenti-delega').download(disdettaData.documento_delega_path)
    if (delegaError) throw new Error(`Errore download delega: ${delegaError.message}`)
    
    console.log("Tutti i dati e i file sono stati recuperati.")

    // --- Generazione PDF ---
    const pdfBytes = await creaPdfDisdetta(profileData, disdettaData)
    console.log(`PDF generato (${pdfBytes.length} bytes).`)

    // --- Invio PEC (FASE 3 - DISABILITATO) ---
    console.log("MODALITÀ TEST: Invio PEC saltato.")
    
    /* // Blocco SMTP disabilitato */

    // --- Aggiornamento Stato ---
    const { error: updateError } = await supabaseAdmin
      .from('extracted_data')
      .update({ status: 'SENT' })
      .eq('id', disdettaId)

    if (updateError) throw new Error(`Errore aggiornamento stato: ${updateError.message}`)
    console.log("Stato aggiornato in 'SENT'. Flusso C8 (Test) completato.")

    // --- Risposta ---
    return new Response(JSON.stringify({ success: true, message: "Invio SIMULATO con successo." }), { 
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    })

  } catch (error: unknown) {
    let errorMessage = "Errore sconosciuto"
    if (error instanceof Error) { errorMessage = error.message }
    console.error("Errore grave in 'send-pec-disdetta':", errorMessage)
    return new Response(JSON.stringify({ error: errorMessage }), { 
      status: 500, 
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    })
  }
})