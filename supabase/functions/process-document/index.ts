// VERSIONE 4.1 - Correzione Typo 'const-'

// @ts-expect-error: Deno namespace
import { serve } from "https://deno.land/std@0.224.0/http/server.ts"
// @ts-expect-error: Deno namespace
import { encodeBase64 } from "https://deno.land/std@0.224.0/encoding/base64.ts"
// @ts-expect-error: Deno namespace
import { create, getNumericDate } from "https://deno.land/x/djwt@v3.0.1/mod.ts"

console.log("Funzione process-document (v4.1 REST Fix) avviata!")

// --- Interfacce ---
interface DocumentPayload {
  bucket: string
  path: string
}
interface AiEntity {
  type: string | null | undefined
  mentionText: string | null | undefined
  confidence: number | null | undefined
}
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

// --- Funzione Pausa ---
function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// --- FUNZIONE HELPER PER AUTENTICAZIONE GOOGLE ---
async function getGoogleAccessToken(serviceAccount: GoogleServiceAccount): Promise<string> {
  console.log("Richiesta Access Token a Google...")
  const scope = "https://www.googleapis.com/auth/cloud-platform"
  
  const key = await crypto.subtle.importKey(
    "pkcs8",
    pemToBinary(serviceAccount.private_key),
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    true,
    ["sign"]
  );

  const jwt = await create(
    { alg: "RS256", typ: "JWT", kid: serviceAccount.private_key_id },
    {
      iss: serviceAccount.client_email,
      sub: serviceAccount.client_email,
      aud: serviceAccount.token_uri,
      scope: scope,
      iat: getNumericDate(0),
      exp: getNumericDate(3600),
    },
    key
  );

  const response = await fetch(serviceAccount.token_uri, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Errore autenticazione Google: ${response.status} ${errorBody}`);
  }

  const data = await response.json();
  console.log("Access Token ottenuto con successo.");
  return data.access_token;
}

// Funzione helper per convertire la chiave PEM
function pemToBinary(pem: string): ArrayBuffer {
  const base64 = pem
    .replace("-----BEGIN PRIVATE KEY-----", "")
    .replace("-----END PRIVATE KEY-----", "")
    .replace(/\s/g, "");
  const binaryDer = atob(base64);
  const buffer = new ArrayBuffer(binaryDer.length);
  
  // ▼▼▼ ECCO LA CORREZIONE (const- -> const) ▼▼▼
  const bufView = new Uint8Array(buffer);
  
  for (let i = 0; i < binaryDer.length; i++) {
    bufView[i] = binaryDer.charCodeAt(i);
  }
  return buffer;
}


// --- SERVER PRINCIPALE ---
serve(async (req: Request) => {
  console.log("Richiesta ricevuta!")
  if (req.method !== "POST") { return new Response(JSON.stringify({ error: "Metodo non consentito" }), { status: 405 }) }

  try {
    const payload: DocumentPayload = await req.json()
    console.log("Payload ricevuto:", payload.path)

    // --- 1. ESTRAI I SEGRETI ---
    // @ts-expect-error: Deno namespace
    const serviceAccountJson = Deno.env.get("GOOGLE_SERVICE_ACCOUNT")
    // @ts-expect-error: Deno namespace
    const processorName = Deno.env.get("GCP_PROCESSOR_NAME")
    // @ts-expect-error: Deno namespace
    const supabaseUrl = Deno.env.get("SUPABASE_URL")
    // @ts-expect-error: Deno namespace
    const supabaseServiceKey = Deno.env.get("SERVICE_ROLE_KEY")

    if (!serviceAccountJson || !processorName || !supabaseUrl || !supabaseServiceKey) {
      throw new Error("Mancano uno o più segreti.")
    }

    const serviceAccount: GoogleServiceAccount = JSON.parse(serviceAccountJson)

    // --- 2. SCARICA IL FILE DA SUPABASE ---
    console.log("In attesa (7s) che lo storage processi il file...")
    await sleep(7000); 

    console.log("Download file tramite fetch diretto con service_role...")
    const fileUrl = `${supabaseUrl}/storage/v1/object/${payload.bucket}/${payload.path}`
    
    const response = await fetch(fileUrl, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${supabaseServiceKey}` }
    })

    if (!response.ok) {
      const errorBody = await response.text()
      throw new Error(`Errore download file: ${response.status} ${errorBody}`)
    }

    const fileData = await response.blob()
    const mimeType = response.headers.get('Content-Type') || 'application/octet-stream'
    if (!fileData) { throw new Error("File non trovato o vuoto.") }

    const fileBytes = await fileData.arrayBuffer()
    const fileBase64 = encodeBase64(fileBytes)
    console.log("File convertito in Base64 (metodo robusto).")

    // --- 3. AUTENTICAZIONE GOOGLE (Metodo REST) ---
    const accessToken = await getGoogleAccessToken(serviceAccount)

    // --- 4. CHIAMA GOOGLE DOCUMENT AI (Metodo REST) ---
    const location = processorName.split('/')[3]
    const restUrl = `https://${location}-documentai.googleapis.com/v1/${processorName}:process`
    
    console.log(`Chiamata al processore AI (REST): ${restUrl}`)
    
    const aiResponse = await fetch(restUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        rawDocument: {
          content: fileBase64,
          mimeType: mimeType,
        },
      }),
    });

    if (!aiResponse.ok) {
      const errorBody = await aiResponse.text();
      throw new Error(`Errore chiamata AI (REST): ${aiResponse.status} ${errorBody}`);
    }

    const result = await aiResponse.json()
    console.log("Chiamata AI completata con successo.")
    
    const { document } = result
    if (!document || !document.text) { throw new Error("L'AI non ha restituito alcun testo.") }

    // --- 5. LOGGA I RISULTATI! ---
    console.log("--- TESTO ESTRATTO DALL'AI ---")
    console.log(document.text)
    if (document.entities && document.entities.length > 0) {
      console.log("--- ENTITÀ ESTRATTE (DATI IMPORTANTI) ---")
      document.entities.forEach((entity: AiEntity) => {
        console.log(`Tipo: ${entity.type} -> Valore: ${entity.mentionText} (Confidenza: ${entity.confidence})`)
      })
    }
    return new Response(JSON.stringify({ success: true, text: document.text }), { headers: { "Content-Type": "application/json" } })

  } catch (error) {
    let errorMessage = "Errore sconosciuto"
    if (error instanceof Error) { errorMessage = error.message }
    console.error("Errore grave nella funzione:", errorMessage)
    return new Response(JSON.stringify({ error: errorMessage }), { status: 500 })
  }
})