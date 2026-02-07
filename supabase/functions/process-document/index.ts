// supabase/functions/process-document/index.ts
// (C14 - Hardened + Gestione Stato FAILED)

import { serve } from "https://deno.land/std@0.224.0/http/server.ts"
import { encodeBase64 } from "https://deno.land/std@0.224.0/encoding/base64.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { z } from "https://esm.sh/zod@3.23.8"

// -----------------------------
// 0) COSTANTI & CONFIG
// -----------------------------
const MAX_FILE_BYTES = Number(Deno.env.get("MAX_FILE_BYTES") ?? 10_000_000)
const ALLOWED_ORIGINS = (Deno.env.get("ALLOWED_ORIGINS") ?? "http://localhost:3000")
  .split(",")
  .map((s) => s.trim())

const BUCKET_NAME = 'documenti_utente'
const DISDETTA_STATUS = {
  PROCESSING: 'PROCESSING',
  PENDING_REVIEW: 'PENDING_REVIEW',
  CONFIRMED: 'CONFIRMED',
  SENT: 'SENT',
  FAILED: 'FAILED',
} as const

// -----------------------------
// 1) TIPI & SCHEMI
// -----------------------------
const PayloadSchema = z.object({
  id: z.number().int().positive()
})


// -----------
// 2) UTILS
// -----------
function resolveCorsOrigin(req: Request): string {
  const reqOrigin = req.headers.get("Origin") ?? ""
  return ALLOWED_ORIGINS.includes(reqOrigin) ? reqOrigin : ALLOWED_ORIGINS[0] ?? "*"
}

function corsHeaders(origin: string) {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Vary": "Origin",
  }
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

async function withBackoff<T>(fn: () => Promise<T>, attempts = 5, baseMs = 500): Promise<T> {
  let lastErr: unknown
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn()
    } catch (e) {
      lastErr = e
      const wait = baseMs * 2 ** i
      await sleep(wait)
    }
  }
  throw lastErr
}

async function fetchWithTimeout(url: string, init: RequestInit, ms = 20_000): Promise<Response> {
  const ctl = new AbortController()
  const id = setTimeout(() => ctl.abort(), ms)
  try {
    const res = await fetch(url, { ...init, signal: ctl.signal })
    return res
  } finally {
    clearTimeout(id)
  }
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
    return { success: true, result }
  } catch (error) {
    console.error('[EMAIL] Error triggering notification:', error)
    return { success: false, error }
  }
}

// -----------------------------
// 3) MAIN SERVER
// -----------------------------
serve(async (req: Request) => {
  const origin = resolveCorsOrigin(req)
  const headers = corsHeaders(origin)

  // Preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers, status: 204 })
  }
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Metodo non consentito" }), {
      status: 405, headers: { ...headers, "Content-Type": "application/json" },
    })
  }

  let recordId: number | null = null;
  let logPath: string | null = null;

  try {
    // 1) Parse & Validazione C14
    const raw = await req.json().catch(() => { throw new Error("Body JSON non valido") })
    const parsed = PayloadSchema.safeParse(raw.body || raw) // Gestisce entrambi i casi
    if (!parsed.success) {
      throw new Error(`Payload non valido (atteso {id: number}): ${parsed.error.issues.map(i => i.path.join(".") + ":" + i.message).join(", ")}`);
    }
    recordId = parsed.data.id;

    // 2) Env strict
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!
    const supabaseServiceKey = Deno.env.get("SERVICE_ROLE_KEY")!

    // 3) Supabase admin client
    const sb = createClient(supabaseUrl, supabaseServiceKey);

    // Blocco try/catch interno per gestire FAILED
    try {
      // 4) Recupera il record
      const { data: record, error: selectError } = await sb
        .from("disdette")
        .select("file_path")
        .eq("id", recordId)
        .single();

      if (selectError) throw new Error(`Errore DB (select): ${selectError.message}`);
      if (!record || !record.file_path) throw new Error(`Record ${recordId} non trovato o file_path mancante.`);

      const path = record.file_path;
      logPath = path; 

      // 5) Download file
      const fileBlob = await withBackoff(async () => {
        const { data: file, error } = await sb.storage.from(BUCKET_NAME).download(path);
        if (error) throw error;
        return file;
      }, 5, 600);

      // 6) Check MIME e dimensione
      const mimeType = fileBlob.type || "application/octet-stream";
      const size = fileBlob.size;
      if (size <= 0) throw new Error("File vuoto");
      if (size > MAX_FILE_BYTES) throw new Error(`File troppo grande: ${size} > ${MAX_FILE_BYTES}`);
      const allowedMime = ["application/pdf", "image/png", "image/jpeg", "image/jpg", "image/tiff"];
      if (!allowedMime.includes(mimeType)) throw new Error(`MIME non consentito: ${mimeType}`);

      // 7) Base64 encode
      const fileBytes = new Uint8Array(await fileBlob.arrayBuffer());
      const fileBase64 = encodeBase64(fileBytes);

      // 8) Claude Vision API call
      const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY")
      if (!anthropicKey) throw new Error("ANTHROPIC_API_KEY non configurata")

      console.log(`[Claude] Processing document with Claude Vision API...`)

      const claudeResp = await fetchWithTimeout("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": anthropicKey,
          "anthropic-version": "2023-06-01",
          "content-type": "application/json"
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1024,
          messages: [{
            role: "user",
            content: [
              {
                type: mimeType === "application/pdf" ? "document" : "image",
                source: {
                  type: "base64",
                  media_type: mimeType,
                  data: fileBase64
                }
              },
              {
                type: "text",
                text: 
                `Analizza questa bolletta italiana ed estrai SOLO i seguenti dati in formato JSON:
                {
                  "supplier_tax_id": "partita IVA del fornitore (11 cifre, es: 12345678901)",
                  "receiver_tax_id": "codice fiscale intestatario contratto (16 caratteri alfanumerici)",
                  "supplier_contract_number": "numero cliente o numero contratto",
                  "supplier_iban": "IBAN se presente (formato IT60...)"
                }

                REGOLE IMPORTANTI:
                - supplier_tax_id: SOLO la P.IVA del fornitore in alto (NON clienti o altri)
                - receiver_tax_id: il codice fiscale dell'intestatario (16 caratteri)
                - supplier_contract_number: numero cliente o contratto (NON POD/PDR che sono codici punto fornitura)
                - Se un campo non è trovato, usa null
                - Ignora completamente: numeri POD, PDR, codici punto fornitura, testi marketing
                - Restituisci SOLO il JSON valido, nessun testo aggiuntivo

                Esempio output:
                {
                  "supplier_tax_id": "12345678901",
                  "receiver_tax_id": "RSSMRA85M01H501U",
                  "supplier_contract_number": "1234567890",
                  "supplier_iban": "IT60X0542811101000000123456"
                }`
              }
            ]
          }]
        })
      }, 30_000)

      if (!claudeResp.ok) {
        const errText = await claudeResp.text()
        throw new Error(`Claude API error: ${claudeResp.status} ${errText}`)
      }

      const claudeJson = await claudeResp.json()
      console.log(`[Claude] Usage: ${claudeJson.usage?.input_tokens} in, ${claudeJson.usage?.output_tokens} out`)

      // 9) Parse Claude response
      const textContent = claudeJson.content?.find((c: { type: string }) => c.type === "text")?.text
      if (!textContent) throw new Error("Claude non ha restituito testo")

      // Remove markdown code fences if present
      const cleanText = textContent
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim()

      let parsedData: { supplier_tax_id?: string | null; receiver_tax_id?: string | null; supplier_contract_number?: string | null; supplier_iban?: string | null }
      try {
        parsedData = JSON.parse(cleanText)
      } catch (_parseErr) {
        console.error("[Claude] JSON parse failed, raw text:", cleanText)
        throw new Error("Claude response non è JSON valido")
      }

      const extracted = {
        supplier_tax_id: parsedData.supplier_tax_id || null,
        receiver_tax_id: parsedData.receiver_tax_id || null,
        supplier_contract_number: parsedData.supplier_contract_number || null,
        supplier_iban: parsedData.supplier_iban || null
      }

      console.log(`[Claude] Extracted data:`, extracted)

      // 10) UPDATE
      const successRow = {
        status: DISDETTA_STATUS.PENDING_REVIEW,
        supplier_tax_id: extracted.supplier_tax_id,
        receiver_tax_id: extracted.receiver_tax_id,
        supplier_iban: extracted.supplier_iban,
        supplier_contract_number: extracted.supplier_contract_number,
        raw_json_response: claudeJson,
        error_message: null
      };

      const { data: updatedData, error: updateSuccessError } = await sb
        .from("disdette")
        .update(successRow)
        .eq("id", recordId)
        .select()

      if (updateSuccessError) throw new Error(`DB update (success) failed: ${updateSuccessError.message}`);
      
      // Trigger email notification: disdetta ready for review
      await triggerEmailNotification(recordId, 'ready');

    } catch (workError: unknown) {  
      // --- BLOCCO CATCH INTERNO (C14) ---
      const msg = workError instanceof Error ? workError.message : "Errore processo OCR";
      console.error(`[C14] Errore di processo per ID ${recordId}: ${msg}`);
      
      const { error: updateFailError } = await sb
        .from("disdette")
        .update({
          status: "FAILED",
          error_message: msg.substring(0, 500)
        })
        .eq("id", recordId);

      if (updateFailError) {
        console.error(`[C14] FATALE: Impossibile aggiornare lo stato FAILED: ${updateFailError.message}`);
      } else {
        // Trigger email notification: processing error
        await triggerEmailNotification(recordId, 'error');
      }
    }

    // 11) Risposta (Successo)
    return new Response(JSON.stringify({
      success: true,
      message: `Processo C14 per ID ${recordId} completato.`
    }), { headers: { ...headers, "Content-Type": "application/json" } })

  } catch (err: unknown) {
    // --- BLOCCO CATCH ESTERNO ---
    const msg = err instanceof Error ? err.message : "Errore sconosciuto";
    console.error("[process-document] Errore grave", { msg, recordId, pathLen: logPath?.length ?? 0 })
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...headers, "Content-Type": "application/json" },
    })
  }
})