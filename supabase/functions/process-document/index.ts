// supabase/functions/process-document/index.ts
// v5 – hardening: CORS dinamico, zod validation, storage download, backoff, timeouts, MIME/size checks, logging PII-safe

import { serve } from "https://deno.land/std@0.224.0/http/server.ts"
import { encodeBase64 } from "https://deno.land/std@0.224.0/encoding/base64.ts"
import { create, getNumericDate } from "https://deno.land/x/djwt@v3.0.1/mod.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { z } from "https://esm.sh/zod@3.23.8"

// -----------------------------
// 0) COSTANTI & CONFIG
// -----------------------------
const MAX_FILE_BYTES = Number(Deno.env.get("MAX_FILE_BYTES") ?? 10_000_000) // 10MB default
const ALLOWED_ORIGINS = (Deno.env.get("ALLOWED_ORIGINS") ?? "http://localhost:3000")
  .split(",")
  .map((s) => s.trim())

const GOOGLE_SCOPE = "https://www.googleapis.com/auth/cloud-platform"

// -----------------------------
// 1) TIPI & SCHEMI
// -----------------------------
const PayloadSchema = z.object({
  bucket: z.string().min(1),
  path: z.string().min(3),
  body: z.any().optional(),
})

type Payload = z.infer<typeof PayloadSchema>

interface GoogleServiceAccount {
  type: string
  project_id: string
  private_key_id: string
  private_key: string
  client_email: string
  client_id: string
  auth_uri: string
  token_uri: string
  auth_provider_x509_cert_url: string
  client_x509_cert_url: string
  universe_domain: string
}

interface AiEntity {
  type: string | null | undefined
  mentionText: string | null | undefined
  confidence: number | null | undefined
}

// -----------------------------
// 2) UTILS (CORS, BACKOFF, TIMEOUT, LOGGING)
// -----------------------------
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
    "pkcs8",
    pemToBinary(sa.private_key),
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    true,
    ["sign"],
  )
  const jwt = await create(
    { alg: "RS256", typ: "JWT", kid: sa.private_key_id },
    {
      iss: sa.client_email,
      sub: sa.client_email,
      aud: sa.token_uri,
      scope: GOOGLE_SCOPE,
      iat: getNumericDate(0),
      exp: getNumericDate(3600),
    },
    key,
  )

  const resp = await fetchWithTimeout(sa.token_uri, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  }, 12_000)

  if (!resp.ok) {
    const txt = await resp.text()
    throw new Error(`Auth Google fallita: ${resp.status} ${txt}`)
  }
  const data = await resp.json()
  if (!data?.access_token) throw new Error("Access token assente nella risposta Google")
  return data.access_token as string
}

// -----------------------------
// 4) MAIN SERVER
// -----------------------------
console.log("Funzione process-document (v5) avviata")

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

  // ---- Variabili per logging di contesto (no PII) ----
  let logPath: string | null = null
  let logBucket: string | null = null

  try {
    // 1) Parse & normalizza payload
    const raw = await req.json().catch(() => { throw new Error("Body JSON non valido") })
    const parsed = PayloadSchema.safeParse(raw)
    if (!parsed.success) {
      throw new Error(`Payload non valido: ${parsed.error.issues.map(i => i.path.join(".") + ":" + i.message).join(", ")}`)
    }
    const p: Payload = parsed.data
    
    type Indexable = Record<string, unknown>
    const bodyObj: Indexable | undefined =
      p.body && typeof p.body === "object" ? (p.body as Indexable) : undefined

    const bucket = typeof bodyObj?.bucket === "string" ? (bodyObj.bucket as string) : p.bucket
    const path   = typeof bodyObj?.path   === "string" ? (bodyObj.path   as string) : p.path

    logBucket = bucket
    logPath = path

    // 2) Env strict
    const supabaseUrl = Deno.env.get("SUPABASE_URL")
    const supabaseServiceKey = Deno.env.get("SERVICE_ROLE_KEY")
    const serviceAccountJson = Deno.env.get("GOOGLE_SERVICE_ACCOUNT")
    const processorName = Deno.env.get("GCP_PROCESSOR_NAME")

    if (!supabaseUrl || !supabaseServiceKey || !serviceAccountJson || !processorName) {
      throw new Error("Config mancante: SUPABASE_URL, SERVICE_ROLE_KEY, GOOGLE_SERVICE_ACCOUNT, GCP_PROCESSOR_NAME")
    }
    const serviceAccount = JSON.parse(serviceAccountJson) as GoogleServiceAccount

    // 3) Supabase admin client
    const sb = createClient(supabaseUrl, supabaseServiceKey)

    // 4) Download file da Storage (con backoff per consistenza)
    const fileBlob = await withBackoff(async () => {
      const { data: file, error } = await sb.storage.from(bucket).download(path)
      if (error) throw error
      return file
    }, 5, 600)

    // 5) Check MIME e dimensione
    const mimeType = fileBlob.type || "application/octet-stream"
    const size = fileBlob.size
    if (size <= 0) throw new Error("File vuoto")
    if (size > MAX_FILE_BYTES) throw new Error(`File troppo grande: ${size} > ${MAX_FILE_BYTES}`)

    const allowedMime = ["application/pdf", "image/png", "image/jpeg", "image/jpg", "image/tiff"]
    if (!allowedMime.includes(mimeType)) {
      throw new Error(`MIME non consentito: ${mimeType}`)
    }

    // 6) Base64 encode
    const fileBytes = new Uint8Array(await fileBlob.arrayBuffer())
    const fileBase64 = encodeBase64(fileBytes)
    // Log “safe”: non loggare contenuto, solo metadati
    console.log(`[process-document] file ok`, { bucket: logBucket, pathLen: logPath?.length ?? 0, mimeType, size })

    // 7) Google Access Token
    const accessToken = await getGoogleAccessToken(serviceAccount)

    // 8) Document AI call (REST)
    const location = processorName.split("/")[3] // processors/{location}/{id}
    if (!location) throw new Error("Location processor non rilevata da GCP_PROCESSOR_NAME")
    const restUrl = `https://${location}-documentai.googleapis.com/v1/${processorName}:process`

    const aiResp = await fetchWithTimeout(restUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        rawDocument: {
          content: fileBase64,
          mimeType,
        },
      }),
    }, 25_000)

    if (!aiResp.ok) {
      const txt = await aiResp.text()
      throw new Error(`Errore Document AI: ${aiResp.status} ${txt}`)
    }
    const aiJson = await aiResp.json()
    const { document } = aiJson
    if (!document || !document.text) throw new Error("AI: documento o testo non presenti")

    // 9) Estrazione entità minimale
    const extracted = new Map<string, string>()
    if (Array.isArray(document.entities)) {
      (document.entities as AiEntity[]).forEach((e) => {
        if (e?.type && e?.mentionText) extracted.set(e.type, e.mentionText)
      })
    }

    // 10) user_id dal path (fallback prudente)
    // Attenzione: dipende dalla convenzione "<user_id>/...". Idealmente passare 'user_id' nel payload o leggerlo da metadati.
    const userId = path.split("/")[0]
    const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!UUID_V4.test(userId)) {
      throw new Error(`user_id non valido nel path: "${userId}"`)
    }

    // 11) Upsert su extracted_data
    const row = {
      user_id: userId,
      file_path: path,
      status: "PENDING_REVIEW",
      supplier_tax_id: extracted.get("supplier_tax_id") ?? null,
      receiver_tax_id: extracted.get("receiver_tax_id") ?? null,
      supplier_iban: extracted.get("supplier_iban") ?? null,
      raw_json_response: aiJson,
    } as const

    const { error: upsertErr } = await sb
      .from("extracted_data")
      .upsert(row, { onConflict: "file_path" }) // richiede UNIQUE(file_path) nel DB
    if (upsertErr) throw new Error(`DB upsert failed: ${upsertErr.message}`)

    // 12) Risposta
    return new Response(JSON.stringify({
      success: true,
      text_present: Boolean(document.text),
      saved: true,
      file: { bucket, path, mimeType, size },
    }), { headers: { ...headers, "Content-Type": "application/json" } })

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Errore sconosciuto"
    // Log “safe”: non stampare path completo o testo estratto
    console.error("[process-document] error", { msg, bucket: logBucket ?? undefined, pathLen: logPath?.length ?? 0 })
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...headers, "Content-Type": "application/json" },
    })
  }
})