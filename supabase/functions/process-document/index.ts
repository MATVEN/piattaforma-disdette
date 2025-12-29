// supabase/functions/process-document/index.ts
// (C14 - Hardened + Gestione Stato FAILED)

import { serve } from "https://deno.land/std@0.224.0/http/server.ts"
import { encodeBase64 } from "https://deno.land/std@0.224.0/encoding/base64.ts"
import { create, getNumericDate } from "https://deno.land/x/djwt@v3.0.1/mod.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { z } from "https://esm.sh/zod@3.23.8"
import { extractContractNumber } from "./extractContractNumber.ts"

// -----------------------------
// 0) COSTANTI & CONFIG
// -----------------------------
const MAX_FILE_BYTES = Number(Deno.env.get("MAX_FILE_BYTES") ?? 10_000_000)
const ALLOWED_ORIGINS = (Deno.env.get("ALLOWED_ORIGINS") ?? "http://localhost:3000")
  .split(",")
  .map((s) => s.trim())

const GOOGLE_SCOPE = "https://www.googleapis.com/auth/cloud-platform"
const BUCKET_NAME = 'documenti_utente'

// -----------------------------
// 1) TIPI & SCHEMI
// -----------------------------
const PayloadSchema = z.object({
  id: z.number().int().positive()
})

interface GoogleServiceAccount {
  type: string; project_id: string; private_key_id: string; private_key: string;
  client_email: string; client_id: string; auth_uri: string; token_uri: string;
  auth_provider_x509_cert_url: string; client_x509_cert_url: string; universe_domain: string;
}
interface AiEntity {
  type: string | null | undefined; mentionText: string | null | undefined;
  confidence: number | null | undefined;
}


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
    console.log('[EMAIL] Notification triggered successfully:', result)
    return { success: true, result }
  } catch (error) {
    console.error('[EMAIL] Error triggering notification:', error)
    return { success: false, error }
  }
}

// -----------------------------
// 3) GOOGLE AUTH HELPERS
// -----------------------------
function pemToBinary(pem: string): ArrayBuffer {
  const base64 = pem.replace("-----BEGIN PRIVATE KEY-----", "")
    .replace("-----END PRIVATE KEY-----", "")
    .replace(/\s/g, "")
  const binaryDer = atob(base64)
  const buffer = new ArrayBuffer(binaryDer.length)
  const bufView = new Uint8Array(buffer)
  for (let i = 0; i < binaryDer.length; i++) bufView[i] = binaryDer.charCodeAt(i)
  return buffer
}
async function getGoogleAccessToken(sa: GoogleServiceAccount): Promise<string> {
  const key = await crypto.subtle.importKey(
    "pkcs8", pemToBinary(sa.private_key), { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, true, ["sign"],
  );
  const jwt = await create(
    { alg: "RS256", typ: "JWT", kid: sa.private_key_id },
    { iss: sa.client_email, sub: sa.client_email, aud: sa.token_uri, scope: GOOGLE_SCOPE, iat: getNumericDate(0), exp: getNumericDate(3600), },
    key,
  );
  const resp = await fetchWithTimeout(sa.token_uri, {
    method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: jwt, }),
  }, 12_000);
  if (!resp.ok) { const txt = await resp.text(); throw new Error(`Auth Google fallita: ${resp.status} ${txt}`); }
  const data = await resp.json();
  if (!data?.access_token) throw new Error("Access token assente nella risposta Google");
  return data.access_token as string;
}

// -----------------------------
// 4) MAIN SERVER (C14)
// -----------------------------
console.log("Funzione process-document (C14) avviata")

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
    console.log(`[C14] Richiesta ricevuta per ID: ${recordId}`);

    // 2) Env strict
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!
    const supabaseServiceKey = Deno.env.get("SERVICE_ROLE_KEY")!
    const serviceAccountJson = Deno.env.get("GOOGLE_SERVICE_ACCOUNT")!
    const processorName = Deno.env.get("GCP_PROCESSOR_NAME")!
    const serviceAccount = JSON.parse(serviceAccountJson) as GoogleServiceAccount;

    // 3) Supabase admin client
    const sb = createClient(supabaseUrl, supabaseServiceKey);

    // Blocco try/catch interno per gestire FAILED
    try {
      // 4) Recupera il record
      console.log(`[C14] Recupero record ID: ${recordId}`);
      const { data: record, error: selectError } = await sb
        .from("extracted_data")
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
      console.log(`[C14] file ok`, { bucket: BUCKET_NAME, pathLen: logPath?.length ?? 0, mimeType, size });

      // 8) Google Access Token
      const accessToken = await getGoogleAccessToken(serviceAccount);

      // 9) Document AI call
      const location = processorName.split("/")[3];
      if (!location) throw new Error("Location processor non rilevata da GCP_PROCESSOR_NAME");
      const restUrl = `https://${location}-documentai.googleapis.com/v1/${processorName}:process`;
      
      const aiResp = await fetchWithTimeout(restUrl, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          rawDocument: { content: fileBase64, mimeType: mimeType, },
        }),
      }, 25_000);

      if (!aiResp.ok) {
         const txt = await aiResp.text()
         throw new Error(`Errore Document AI: ${aiResp.status} ${txt}`)
      }
      const aiJson = await aiResp.json();
      const { document } = aiJson;
      if (!document || !document.text) throw new Error("AI: documento o testo non presenti");

      // 10.1) Estrazione entità
      const extracted = new Map<string, string>();
      if (Array.isArray(document.entities)) {
        (document.entities as AiEntity[]).forEach((e) => {
          if (e?.type && e?.mentionText) extracted.set(e.type, e.mentionText);
        });
      }

      // 10.2) Estrazione contract number
      const supplierTaxId = extracted.get("supplier_tax_id") ?? undefined
      const contractResult = extractContractNumber(aiJson, supplierTaxId)

      // Log per debugging
      if (contractResult.contractNumber) {
        console.log(`[C21] Contract number estratto:`, {
          number: contractResult.contractNumber,
          method: contractResult.method,
          confidence: contractResult.confidence
        })
      } else {
        console.warn(`[C21] Contract number NON trovato per record ${recordId}`)
      }

      // 11) UPDATE
      const successRow = {
        status: "PENDING_REVIEW",
        supplier_tax_id: extracted.get("supplier_tax_id") ?? null,
        receiver_tax_id: extracted.get("receiver_tax_id") ?? null,
        supplier_iban: extracted.get("supplier_iban") ?? null,
        supplier_contract_number: contractResult.contractNumber ?? null,
        raw_json_response: aiJson,
        error_message: null 
      };

      console.log(`[C21-DEBUG] Tentativo UPDATE con dati:`, {
        recordId,
        supplier_contract_number: successRow.supplier_contract_number,
        supplier_contract_number_type: typeof successRow.supplier_contract_number,
        supplier_contract_number_length: successRow.supplier_contract_number?.length
      })

      const { data: updatedData, error: updateSuccessError } = await sb
        .from("extracted_data")
        .update(successRow)
        .eq("id", recordId)
        .select()

      if (updateSuccessError) throw new Error(`DB update (success) failed: ${updateSuccessError.message}`);

      // DOPO riga ~300 (dove triggera email)
      console.log('[EMAIL-TEST] Attempting to trigger email:', {
        baseUrl: Deno.env.get('NEXT_PUBLIC_BASE_URL') || 'http://localhost:3000',
        disdettaId: recordId,
        type: 'ready'
      })
      
      // Trigger email notification: disdetta ready for review
      await triggerEmailNotification(recordId, 'ready');

      console.log('[EMAIL-TEST] Trigger completed')

      // --- MONITORING & ANALYTICS ---
      if (contractResult.method !== 'none') {
        console.log(`[C21-ANALYTICS]`, {
          recordId,
          method: contractResult.method,
          confidence: contractResult.confidence,
          lengthContractNumber: contractResult.contractNumber?.length,
          supplierTaxId: supplierTaxId?.substring(0, 5)
        })
      }

    } catch (workError: unknown) {  
      // --- BLOCCO CATCH INTERNO (C14) ---
      const msg = workError instanceof Error ? workError.message : "Errore processo OCR";
      console.error(`[C14] Errore di processo per ID ${recordId}: ${msg}`);
      
      const { error: updateFailError } = await sb
        .from("extracted_data")
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

    // 12) Risposta (Successo)
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